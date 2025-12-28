// Fix corrupted import statement on line 1
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Sparkles, MessageCircle, Loader2, Zap, ArrowRight, GraduationCap } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encodeBase64, decodeBase64, decodeAudioData } from '../services/gemini';
import { Course, Language } from '../types';

interface Props {
  activeCourse?: Course;
  studentName?: string;
  lang: Language;
}

const LiveAssistant: React.FC<Props> = ({ activeCourse, studentName = 'Марія', lang }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const activeLesson = activeCourse?.lessons[0];
  const currentStep = activeLesson?.steps[currentStepIdx];
  const isExtension = activeCourse?.isExtensionCourse || false;
  const brandAccent = isExtension ? 'text-purple-400' : 'text-yellow-500';

  const stopSession = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextInRef.current) audioContextInRef.current.close();
    if (audioContextOutRef.current) audioContextOutRef.current.close();
    setIsActive(false);
    setIsConnecting(false);
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextInRef.current = new AudioContext({ sampleRate: 16000 });
      audioContextOutRef.current = new AudioContext({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const stepContext = currentStep 
        ? `Ти зараз на етапі: "${currentStep.title}". 
           Тип етапу: ${currentStep.type}. 
           ${currentStep.type === 'quiz' ? `ЗАПИТАННЯ ТЕСТУ: ${currentStep.question}. ПРАВИЛЬНА ВІДПОВІДЬ: ${currentStep.correctAnswer}.` : ''}
           ІНСТРУКЦІЯ ДЛЯ ТЕБЕ: ${currentStep.aiPrompt || 'Поясни цей крок професійно.'}`
        : '';

      const courseTitle = activeCourse?.title || '';
      let specializedAdvice = '';
      
      // Налаштування спеціалізованих порад на основі назви курсу
      if (courseTitle.includes('Magic Lash Geometry')) {
        specializedAdvice = `
          СПЕЦІАЛІЗАЦІЯ (Geometry): Акцентуй увагу на "геометрії пучка" (fan geometry). 
          Пояснюй, як "площа зчіпки" (bonding area) впливає на довговічність. 
          Наголошуй на важливості правильних "мікровідступів" (micro-gaps) для здоров'я натуральних вій.`;
      } else if (courseTitle.includes('Lash Adhesive Master')) {
        specializedAdvice = `
          СПЕЦІАЛІЗАЦІЯ (Adhesive): Твоя головна тема — "температурний режим клею" (adhesive temperature). 
          Аналізуй вологість та швидкість полімеризації. 
          Пояснюй, як досягти максимальної "ретенції" (retention) через правильну підготовку вій.`;
      }

      const systemInstruction = `Ти — ARI, персональний коуч в Magic Lash HUB. Студент: ${studentName}. 
        Твоя мета: провести розвиток за напрямком "${courseTitle}". 
        ${isExtension ? 'Ти експерт з нарощування (Magic Lash).' : 'Ти експерт з ламінування (InLei®).'}
        
        ${specializedAdvice}

        ЗАРАЗ МИ ПРАЦЮЄМО НАД: ${activeLesson?.title || 'Вступним блоком'}.
        ${stepContext}
        
        ПРАВИЛА ТЕРМІНОЛОГІЇ:
        - НЕ використовуй слова: курси, навчання, академія, уроки.
        - ВИКОРИСТОВУЙ: напрямок, програма, блок, розвиток, практика, HUB.
        
        ПРАВИЛА ПОВЕДІНКИ:
        1. Вітай спеціаліста на початку сесії.
        2. Пояснюй матеріал професійно, використовуючи глибокі технічні знання.
        3. Якщо це тест — задай питання та дочекайся відповіді. Якщо відповідь невірна — м'яко підкажи.
        4. Після завершення етапу скажи "Чудово! Рухаємося до наступного блоку?"
        5. Спілкуйся українською мовою.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const processor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16Data = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16Data[i] = inputData[i] * 32768;
              }
              const base64Data = encodeBase64(new Uint8Array(int16Data.buffer));
              
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };

            source.connect(processor);
            processor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscript(prev => [...prev.slice(-3), {role: 'ARI', text}]);
            }

            const audioBase64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioBase64 && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              const audioBuffer = await decodeAudioData(decodeBase64(audioBase64), ctx);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
            }

            if (message.serverContent?.interrupted) {
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: (err) => {
            console.error("Live API Error:", err);
            stopSession();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start session:", err);
      setIsConnecting(false);
      alert(lang === 'uk' ? "Помилка підключення до ARI." : "Error connecting to ARI.");
    }
  };

  const nextStep = () => {
    if (activeLesson && currentStepIdx < activeLesson.steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
      if (isActive) {
        stopSession();
        setTimeout(startSession, 500);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C10] overflow-hidden animate-in fade-in duration-700">
      
      <div className="h-24 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 relative z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className={`p-4 rounded-2xl ${isExtension ? 'bg-purple-500/10' : 'bg-yellow-500/10'} border border-white/5`}>
            <GraduationCap className={brandAccent} size={28} />
          </div>
          <div className="text-left">
            <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">{lang === 'uk' ? 'Сесія з ARI Коучем' : 'ARI Coach Session'}</h3>
            <p className="text-lg font-black text-gray-100">{activeCourse?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#0A0C10] px-6 py-3 rounded-2xl border border-[#1F232B] text-left">
            <p className="text-[8px] font-black text-gray-600 uppercase mb-1">{lang === 'uk' ? `Блок ${currentStepIdx + 1} з ${activeLesson?.steps.length}` : `Block ${currentStepIdx + 1} of ${activeLesson?.steps.length}`}</p>
            <p className="text-[11px] font-black text-purple-400 uppercase truncate max-w-[200px]">{currentStep?.title}</p>
          </div>
          <button 
            onClick={nextStep}
            disabled={currentStepIdx >= (activeLesson?.steps.length || 0) - 1}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 transition-all disabled:opacity-20"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${isExtension ? 'bg-purple-600/10' : 'bg-yellow-600/10'} rounded-full blur-[120px] pointer-events-none opacity-50`} />

        <div className="max-w-2xl w-full space-y-12 text-center relative z-10">
          
          <div className="space-y-6">
            <div className="relative inline-block">
              {isActive && (
                <div className={`absolute inset-0 ${isExtension ? 'bg-purple-500' : 'bg-yellow-500'} rounded-full blur-[80px] opacity-40 animate-pulse scale-150`} />
              )}
              <div className={`w-56 h-56 rounded-[4rem] border-8 ${isActive ? (isExtension ? 'border-purple-500/20' : 'border-yellow-500/20') : 'border-[#1F232B]'} shadow-2xl flex items-center justify-center bg-[#12141C] relative z-10 transition-all duration-1000 ${isActive ? 'scale-105' : 'grayscale-[0.5] opacity-60'}`}>
                {isActive ? (
                  <div className="flex gap-2.5 items-center justify-center h-20 w-40">
                    {[...Array(6)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2.5 ${isExtension ? 'bg-purple-500' : 'bg-yellow-500'} rounded-full transition-all duration-150 shadow-[0_0_15px_rgba(168,85,247,0.4)]`} 
                        style={{ 
                          height: `${30 + Math.random() * 100}%`, 
                          animation: `pulseHeight 1s infinite alternate ${i * 100}ms`
                        }} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Mic size={56} className="text-gray-700" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-gray-100 tracking-tight uppercase">
                {isActive ? (lang === 'uk' ? 'ARI ПРАЦЮЄ З ТОБОЮ' : 'ARI IS WORKING WITH YOU') : (lang === 'uk' ? 'ARI ГОТОВА ДО РОБОТИ' : 'ARI IS READY')}
              </h2>
              <div className="flex justify-center items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-700'}`} />
                <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em]">
                   Mode: Coach AI | {studentName}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#12141C]/80 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-2xl border border-white/5 min-h-[220px] flex flex-col justify-center relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-2 h-full ${brandAccent} opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            {transcript.length > 0 ? (
              <div className="space-y-5 text-left">
                {transcript.map((msg, i) => (
                  <div key={i} className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-1 h-3 ${brandAccent} rounded-full`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${brandAccent}`}>{msg.role}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-200 leading-relaxed pl-4">{msg.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 opacity-10">
                <MessageCircle size={48} />
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">
                  {lang === 'uk' ? 'Чекаємо на голос ARI...' : 'Waiting for ARI voice...'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-8">
            <button 
              onClick={isActive ? stopSession : startSession}
              disabled={isConnecting}
              className={`group relative overflow-hidden px-16 py-8 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl transition-all duration-500 flex items-center gap-4 mx-auto ${
                isActive 
                  ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-105' 
                  : (isExtension ? 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/30' : 'bg-yellow-600 hover:bg-yellow-700 hover:shadow-yellow-500/30') + ' text-white hover:scale-110'
              } disabled:opacity-50 disabled:scale-100`}
            >
              {!isActive && (
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
              )}
              {isConnecting ? (
                <Loader2 className="animate-spin" size={24} />
              ) : isActive ? (
                <MicOff size={24} className="group-hover:rotate-12 transition-transform" />
              ) : (
                <Mic size={24} className="group-hover:scale-125 transition-transform" />
              )}
              {isConnecting ? (lang === 'uk' ? 'З\'ЄДНАННЯ...' : 'CONNECTING...') : isActive ? (lang === 'uk' ? 'ЗАВЕРШИТИ ПРАКТИКУ' : 'FINISH PRACTICE') : (lang === 'uk' ? 'ПОЧАТИ ПРАКТИКУ З ARI' : 'START PRACTICE WITH ARI')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseHeight {
          from { height: 20%; opacity: 0.3; }
          to { height: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LiveAssistant;