import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mic, MicOff, MessageCircle, Loader2, Zap, ArrowRight, GraduationCap, X, Video, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, RefreshCw, Lock, PlayCircle, Sparkles, List, Film, HelpCircle } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encodeBase64, decodeBase64, decodeAudioData } from '../services/gemini';
import { Course, Language, Step } from '../types';

interface Props {
  activeCourse?: Course;
  studentName?: string;
  lang: Language;
  onClose?: () => void;
}

const LiveAssistant: React.FC<Props> = ({ activeCourse, studentName = 'Марія', lang, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);
  const [showStepList, setShowStepList] = useState(false);
  
  // Navigation State
  // Flattened list of steps for easy navigation with strict numbering
  const flatSteps = useMemo(() => {
    if (!activeCourse?.sections) return [];
    let globalCounter = 1;
    return activeCourse.sections.flatMap((section, secIdx) => 
      section.lessons.flatMap((lesson, lesIdx) => 
        lesson.steps.map((step, stepIdx) => ({
          ...step,
          globalId: globalCounter++, // Strict sequential ID 1, 2, 3...
          sectionTitle: section.title,
          lessonTitle: lesson.title,
          isLast: false,
          contextLabel: `Модуль ${secIdx + 1} • Урок ${lesIdx + 1}`
        }))
      )
    ).map((step, idx, arr) => ({ ...step, isLast: idx === arr.length - 1 }));
  }, [activeCourse]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = flatSteps[currentStepIndex];

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const isExtension = activeCourse?.isExtensionCourse || false;
  const brandAccent = isExtension ? 'text-purple-400' : 'text-yellow-500';
  const brandBg = isExtension ? 'bg-purple-600' : 'bg-yellow-600';
  const brandBorder = isExtension ? 'border-purple-500' : 'border-yellow-500';

  useEffect(() => {
    // Reset Quiz state when step changes
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  }, [currentStepIndex]);

  const stopSession = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextInRef.current && audioContextInRef.current.state !== 'closed') {
      audioContextInRef.current.close();
    }
    if (audioContextOutRef.current && audioContextOutRef.current.state !== 'closed') {
      audioContextOutRef.current.close();
    }
    setIsActive(false);
    setIsConnecting(false);
  };

  const startSession = async () => {
    if (!currentStep) return;
    setIsConnecting(true);
    setTranscript([]); 
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextInRef.current = new AudioContext({ sampleRate: 16000 });
      audioContextOutRef.current = new AudioContext({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Формування суворого контексту для ШІ
      const hasVideo = !!currentStep?.media;
      
      const stepTypeDescription = currentStep.type === 'quiz' 
        ? "ЦЕ ЕТАП ТЕСТУВАННЯ (КВІЗ). Твоя задача: не давати прямих відповідей, а допомагати студенту згадати матеріал з попередніх кроків."
        : "ЦЕ ЕТАП НАВЧАННЯ (ПРЕЗЕНТАЦІЯ). Використовуй опис відео як основу своєї розповіді.";

      const videoContext = hasVideo 
        ? `ВІДЕО/МЕДІА МАТЕРІАЛ: На екрані студента відео: ${currentStep.media}.` 
        : 'На екрані немає відео, тільки текст.';

      const contentSource = currentStep.description 
        ? `ОСНОВНИЙ МАТЕРІАЛ ДЛЯ ПРЕЗЕНТАЦІЇ (ВИКОРИСТОВУЙ ЦЕ): "${currentStep.description}"`
        : `МАТЕРІАЛ: Опис відсутній. Поясни тему "${currentStep.title}" базуючись на своїх знаннях про ${isExtension ? 'нарощування вій' : 'ламінування вій'}.`;

      const aiScenario = currentStep.interactionPrompt || currentStep.aiPrompt || 'Поясни цей крок професійно та лаконічно.';

      const systemInstruction = `
        РОЛЬ: Ти — ARI, суворий але дружній ментор Magic Lash HUB.
        СТУДЕНТ: ${studentName}.
        КУРС: "${activeCourse?.title || ''}".
        
        СТРОГА НАВІГАЦІЯ:
        Ми зараз знаходимось на етапі №${currentStep.globalId} з ${flatSteps.length}.
        Назва етапу: "${currentStep.title}".
        Тип етапу: ${stepTypeDescription}
        
        ПРАВИЛА ПОВЕДІНКИ (НЕ ПОРУШУВАТИ):
        1. Ти бачиш ТІЛЬКИ поточний етап №${currentStep.globalId}. Не говори про майбутні етапи, не забігай наперед.
        2. Якщо це етап навчання: твоя мета — презентувати матеріал, використовуючи наданий опис.
        3. Якщо це квіз: твоя мета — мотивувати студента пройти тест.
        4. Не перескакуй теми. Закінчи поточну думку, перш ніж чекати питання.
        
        КОНТЕКСТ ПОТОЧНОГО ЕТАПУ:
        ${contentSource}
        
        ${videoContext}
        
        ДОДАТКОВІ ІНСТРУКЦІЇ АВТОРА КУРСУ:
        ${aiScenario}
        
        Спілкуйся українською мовою.
      `;

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
              setTranscript(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'ARI') {
                  return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + text }];
                }
                return [...prev, { role: 'ARI', text }];
              });
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
          onerror: (err) => stopSession()
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start session:", err);
      setIsConnecting(false);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < flatSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      if (isActive) {
        stopSession();
        // Automatically restart session for next step after short delay to reset context
        setTimeout(() => startSession(), 800);
      }
    }
  };
  
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      if (isActive) {
        stopSession();
        setTimeout(() => startSession(), 800);
      }
    }
  };

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    setShowStepList(false);
    if (isActive) {
      stopSession();
      setTimeout(() => startSession(), 800);
    }
  }

  const handleQuizSubmit = () => {
    if (!currentStep?.quizQuestions) return;
    let correct = 0;
    currentStep.quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correctOptionIndex) correct++;
    });
    const score = (correct / currentStep.quizQuestions.length) * 100;
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const canProceed = useMemo(() => {
    if (currentStep?.type !== 'quiz') return true;
    return quizSubmitted && quizScore >= 90;
  }, [currentStep, quizSubmitted, quizScore]);

  // Handle close
  const handleClose = () => {
    if (isActive) stopSession();
    if (onClose) onClose();
  };

  if (!currentStep) return null;

  const progressPercent = ((currentStepIndex + 1) / flatSteps.length) * 100;

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C10] overflow-hidden animate-in fade-in duration-700 h-full w-full">
      
      {/* HEADER */}
      <div className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-6 md:px-8 relative z-30 shrink-0 shadow-lg">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <button 
            onClick={() => setShowStepList(!showStepList)}
            className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${showStepList ? 'bg-[#1F232B] border-gray-500 text-white' : 'bg-[#0A0C10] border-[#1F232B] text-gray-400 hover:text-white'}`}
          >
             <List size={20} />
             <span className="text-xs font-black uppercase tracking-widest hidden md:inline">План Навчання</span>
          </button>

          <div className="hidden md:block h-8 w-px bg-[#1F232B]" />

          <div className="text-left overflow-hidden">
             <div className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">
                <span className={brandAccent}>ЕТАП {currentStep.globalId}</span>
                <ChevronRight size={10} />
                <span>{flatSteps.length}</span>
             </div>
             <p className="text-base font-bold text-gray-200 truncate">{currentStep.title}</p>
          </div>
        </div>

        {/* Central Progress Bar (Desktop) */}
        <div className="hidden lg:flex flex-col items-center justify-center w-64 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
           <div className="w-full h-1.5 bg-[#0A0C10] rounded-full overflow-hidden border border-[#1F232B]">
              <div 
                className={`h-full ${isExtension ? 'bg-purple-600' : 'bg-yellow-500'} transition-all duration-500`}
                style={{ width: `${progressPercent}%` }}
              />
           </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
           <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevStep} 
                disabled={currentStepIndex === 0} 
                className="w-10 h-10 flex items-center justify-center bg-[#0A0C10] border border-[#1F232B] hover:border-gray-500 rounded-xl text-gray-400 disabled:opacity-30 transition-all"
              >
                 <ChevronLeft size={18} />
              </button>
              
              <button 
                onClick={handleNextStep} 
                disabled={currentStepIndex === flatSteps.length - 1 || !canProceed} 
                className={`h-10 px-6 rounded-xl transition-all flex items-center gap-2 border ${
                  canProceed 
                    ? (isExtension ? 'bg-purple-600 border-purple-500 text-white hover:bg-purple-700' : 'bg-yellow-600 border-yellow-500 text-white hover:bg-yellow-700')
                    : 'bg-[#0A0C10] border-[#1F232B] text-gray-500 cursor-not-allowed opacity-50'
                }`}
              >
                 <span className="text-[10px] font-black uppercase tracking-widest">Далі</span>
                 {canProceed ? <ArrowRight size={14} /> : <Lock size={12} />}
              </button>
           </div>
           
           {onClose && (
            <button onClick={handleClose} className="p-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-red-400 transition-all ml-2">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
         {/* STEPS DRAWER (LIST) */}
         <div className={`absolute top-0 left-0 bottom-0 w-80 bg-[#0A0C10] border-r border-[#1F232B] z-20 transition-transform duration-300 transform ${showStepList ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl`}>
            <div className="p-4 border-b border-[#1F232B] bg-[#12141C]">
               <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Структура Курсу</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
               {flatSteps.map((step, idx) => (
                 <button
                   key={idx}
                   onClick={() => handleJumpToStep(idx)}
                   className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${
                     idx === currentStepIndex 
                       ? `bg-white/5 ${brandBorder} text-white` 
                       : 'bg-transparent border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
                   }`}
                 >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${idx === currentStepIndex ? `${brandAccent} border-current` : 'border-gray-700 text-gray-700'}`}>
                       {step.globalId}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-bold truncate uppercase">{step.title}</p>
                       <p className="text-[9px] opacity-60 flex items-center gap-1">
                          {step.type === 'quiz' ? <HelpCircle size={8} /> : <Film size={8} />}
                          {step.type === 'quiz' ? 'Тестування' : 'Відео-лекція'}
                       </p>
                    </div>
                    {idx < currentStepIndex && <CheckCircle2 size={12} className="text-green-500" />}
                 </button>
               ))}
            </div>
         </div>

         {/* MAIN CONTENT AREA */}
         <div className="flex-1 p-6 md:p-10 flex flex-col relative z-10 overflow-y-auto custom-scrollbar">
            
            <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
               {/* STEP INDICATOR BANNER */}
               <div className="flex items-center gap-4 opacity-50 mb-4">
                  <div className={`px-3 py-1 rounded-full border ${brandBorder} ${brandAccent} text-[9px] font-black uppercase tracking-widest`}>
                     {currentStep.type === 'quiz' ? 'Етап Тестування' : 'Етап Навчання'}
                  </div>
                  <div className="h-px bg-gray-700 flex-1" />
               </div>

               {/* QUIZ MODE */}
               {currentStep.type === 'quiz' ? (
                 <div className="bg-[#12141C] border border-[#1F232B] rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-500">
                    <div className="flex items-center justify-between mb-8 border-b border-[#1F232B] pb-6">
                       <div>
                          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Перевірка знань</p>
                          <h3 className="text-3xl font-black text-white uppercase flex items-center gap-3">
                             <Zap className={brandAccent} size={28} /> {currentStep.title}
                          </h3>
                       </div>
                       {quizSubmitted && (
                          <div className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border ${quizScore >= 90 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                             Результат: {quizScore.toFixed(0)}%
                          </div>
                       )}
                    </div>
                    
                    <div className="space-y-8">
                       {currentStep.quizQuestions?.map((q, idx) => (
                          <div key={q.id} className="space-y-4">
                             <p className="text-base font-bold text-gray-200 flex gap-3">
                                <span className="text-gray-600">{idx + 1}.</span> {q.question}
                             </p>
                             <div className="grid grid-cols-1 gap-3 pl-6">
                                {q.options.map((opt, oIdx) => {
                                   const isSelected = quizAnswers[q.id] === oIdx;
                                   const isCorrect = q.correctOptionIndex === oIdx;
                                   let style = "bg-[#0A0C10] border-[#1F232B] text-gray-400 hover:border-gray-500";
                                   
                                   if (quizSubmitted) {
                                      if (isCorrect) style = "bg-green-500/10 border-green-500 text-green-400";
                                      else if (isSelected && !isCorrect) style = "bg-red-500/10 border-red-500 text-red-400";
                                      else style = "bg-[#0A0C10] border-[#1F232B] text-gray-600 opacity-50";
                                   } else if (isSelected) {
                                      style = `bg-white/10 border-white text-white`;
                                   }

                                   return (
                                     <button 
                                       key={oIdx}
                                       disabled={quizSubmitted}
                                       onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                       className={`w-full text-left p-5 rounded-2xl border text-sm font-medium transition-all ${style}`}
                                     >
                                        {opt}
                                     </button>
                                   )
                                })}
                             </div>
                          </div>
                       ))}
                       {(!currentStep.quizQuestions || currentStep.quizQuestions.length === 0) && (
                          <div className="p-10 text-center text-gray-500 bg-[#0A0C10] rounded-3xl border border-dashed border-[#1F232B]">
                             Питання відсутні для цього тесту. Натисніть "Далі".
                          </div>
                       )}
                    </div>

                    <div className="mt-10 pt-6 border-t border-[#1F232B]">
                      {!quizSubmitted && currentStep.quizQuestions && currentStep.quizQuestions.length > 0 ? (
                         <button 
                           onClick={handleQuizSubmit}
                           disabled={Object.keys(quizAnswers).length < currentStep.quizQuestions.length}
                           className={`w-full py-5 ${brandAccent === 'text-purple-400' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                         >
                            Здати тест
                         </button>
                      ) : (
                         <div className="flex gap-4">
                            {quizScore < 90 && quizSubmitted && (
                              <button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all">
                                 <RefreshCw size={14} /> Спробувати ще раз
                              </button>
                            )}
                            {(quizScore >= 90 || !currentStep.quizQuestions || currentStep.quizQuestions.length === 0) && (
                              <button onClick={handleNextStep} className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20">
                                 Наступний етап <ArrowRight size={14} />
                              </button>
                            )}
                         </div>
                      )}
                    </div>
                 </div>
               ) : (
                 // LECTURE MODE (VIDEO + DESCRIPTION)
                 <div className="space-y-8">
                    {/* Media Display - Main Focus */}
                    <div className="w-full bg-black rounded-[2.5rem] border-4 border-[#1F232B] shadow-2xl overflow-hidden relative group aspect-video">
                       {currentStep.media ? (
                          <video 
                            src={currentStep.media} 
                            className="w-full h-full object-contain bg-black" 
                            controls 
                            autoPlay 
                            muted // Required for autoplay usually
                            playsInline 
                          />
                       ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[#050505]">
                             <Video size={64} className="mb-4 opacity-30" />
                             <span className="text-sm font-black uppercase tracking-widest opacity-50">Відео відсутнє</span>
                             <p className="text-[10px] text-gray-600 mt-2">Слухайте пояснення ARI або читайте опис нижче</p>
                          </div>
                       )}
                    </div>
                    
                    {/* Description Display */}
                    <div className="bg-[#12141C] p-8 md:p-10 rounded-[2.5rem] border border-[#1F232B] text-left shadow-lg">
                      <div className="flex items-center gap-3 mb-6 border-b border-[#1F232B] pb-6">
                          <div className={`p-2 rounded-lg bg-[#0A0C10] border border-[#1F232B] ${brandAccent}`}>
                             <PlayCircle size={20} />
                          </div>
                          <div>
                             <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Матеріали Уроку</p>
                             <h4 className="text-lg font-black text-white uppercase">{currentStep.title}</h4>
                          </div>
                      </div>
                      
                      {currentStep.description ? (
                        <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed font-medium">
                            {currentStep.description.split('\n').map((line, i) => (
                              <p key={i} className="mb-3">{line}</p>
                            ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 italic text-sm">Опис відсутній. Слухайте аудіо-супровід ARI.</p>
                      )}
                    </div>
                 </div>
               )}
            </div>
         </div>

         {/* RIGHT SIDE: ARI INTERFACE */}
         <div className="w-80 bg-[#12141C] border-l border-[#1F232B] flex flex-col relative z-20 shrink-0 shadow-xl">
            <div className="p-5 border-b border-[#1F232B] flex items-center justify-between bg-[#12141C]">
               <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                  <Sparkles size={12} className={brandAccent} /> AI Mentor (ARI)
               </h3>
               {isActive && (
                  <div className="flex gap-1">
                     <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" />
                     <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce [animation-delay:-0.1s]" />
                     <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
                  </div>
               )}
            </div>
            
            {/* Transcript Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4 bg-[#0A0C10]">
               {transcript.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-40 space-y-4">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-[#1F232B] flex items-center justify-center border border-white/5">
                        <MessageCircle size={24} />
                     </div>
                     <div className="text-center px-6">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">ARI на зв'язку</p>
                        <p className="text-[9px]">Натисніть START, щоб почати урок</p>
                     </div>
                  </div>
               )}
               {transcript.map((msg, i) => (
                  <div key={i} className={`animate-in fade-in slide-in-from-bottom-2 ${msg.role === 'ARI' ? 'pl-2' : 'pr-2 text-right'}`}>
                     <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${msg.role === 'ARI' ? brandAccent : 'text-gray-500'}`}>{msg.role}</p>
                     <div className={`p-3.5 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm ${msg.role === 'ARI' ? 'bg-[#12141C] border border-[#1F232B] text-gray-200 rounded-tl-none' : 'bg-[#1F232B] text-white rounded-tr-none'}`}>
                        {msg.text}
                     </div>
                  </div>
               ))}
            </div>

            {/* Controls */}
            <div className="p-5 border-t border-[#1F232B] bg-[#12141C]">
               <button 
                  onClick={isActive ? stopSession : startSession}
                  disabled={isConnecting}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${
                    isActive 
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-900/20' 
                      : (isExtension ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/30' : 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-900/30') + ' text-white'
                  } disabled:opacity-50`}
               >
                  {isConnecting ? <Loader2 className="animate-spin" size={16} /> : isActive ? <MicOff size={16} /> : <Mic size={16} />}
                  {isConnecting ? 'ПІДКЛЮЧЕННЯ...' : isActive ? 'ЗАВЕРШИТИ' : 'СТАРТ СЕСІЇ'}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default LiveAssistant;