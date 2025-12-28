
import React, { useState, useEffect, useRef } from 'react';
import { Save, Wand2, Film, Loader2, Sparkles, RefreshCw, Mic, MicOff, Video, Edit3, Layout, Plus, Link, Image as ImageIcon, MessageSquare, Zap, Upload, FileVideo, Key } from 'lucide-react';
import { Course, Step, Lesson, Language } from '../types';
import { generateEducationalVideo } from '../services/gemini';

interface Props {
  course: Course;
  onUpdate: (course: Course) => void;
  lang: Language;
}

const CourseEditor: React.FC<Props> = ({ course, onUpdate, lang }) => {
  const [activeLessonId, setActiveLessonId] = useState(course.lessons[0]?.id);
  const [activeStepId, setActiveStepId] = useState<number | 'lesson'>(course.lessons[0]?.steps[0]?.id);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [isRecordingPrompt, setIsRecordingPrompt] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const loadingMessages = lang === 'uk' ? [
    "Аналізуємо методологію заняття...",
    "Синтезуємо візуальні структури через Veo...",
    "Налаштовуємо професійне освітлення...",
    "Рендеринг навчального відео у HD...",
    "Фіналізація контенту ARI..."
  ] : [
    "Analyzing lesson methodology...",
    "Synthesizing visuals via Veo...",
    "Setting up professional lighting...",
    "Rendering educational video in HD...",
    "Finalizing ARI content..."
  ];

  useEffect(() => {
    let interval: any;
    if (isGeneratingVideo) {
      interval = setInterval(() => {
        setLoadingMessageIdx(prev => (prev + 1) % loadingMessages.length);
      }, 5000);
    } else {
      setLoadingMessageIdx(0);
    }
    return () => clearInterval(interval);
  }, [isGeneratingVideo]);

  // Налаштування розпізнавання голосу
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === 'uk' ? 'uk-UA' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        if (activeStepId === 'lesson') {
          updateActiveLesson('aiPrompt', transcript);
        } else {
          updateActiveStep('aiPrompt', transcript);
        }
      };

      recognition.onend = () => {
        setIsRecordingPrompt(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecordingPrompt(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lang, activeStepId, activeLessonId]);

  const toggleVoicePrompt = () => {
    if (!recognitionRef.current) {
      alert(lang === 'uk' ? "Ваш браузер не підтримує розпізнавання мови." : "Your browser does not support speech recognition.");
      return;
    }

    if (isRecordingPrompt) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsRecordingPrompt(true);
      } catch (e) {
        console.error("Failed to start recognition", e);
      }
    }
  };

  const activeLesson = course.lessons.find(l => l.id === activeLessonId) || course.lessons[0];
  const activeStep = activeStepId === 'lesson' ? null : activeLesson?.steps.find(s => s.id === activeStepId);

  const isExtension = course.isExtensionCourse;
  const brandAccent = isExtension ? 'text-purple-400' : 'text-yellow-500';
  const brandBg = isExtension ? 'bg-purple-600' : 'bg-yellow-600';
  const brandBorder = isExtension ? 'border-purple-500' : 'border-yellow-500';

  const placeholders = {
    aiPrompt: isExtension ? "Опишіть техніку нарощування (напр. створення ідеального пучка)..." : "Опишіть хімію складів InLei (напр. розкриття кутикули)...",
    rag: isExtension ? "Технічні деталі: клей, типи вій, зчіпка..." : "Технічні деталі: склад Lash Filler, час експозиції...",
    comments: lang === 'uk' ? "Професійні нотатки для майстра..." : "Professional notes for the artist...",
    mediaUrl: lang === 'uk' ? "URL або завантажений файл..." : "URL or uploaded file..."
  };

  const updateActiveStep = (field: keyof Step, value: any) => {
    if (activeStepId === 'lesson') return;
    const updatedLessons = course.lessons.map(l => {
      if (l.id === activeLessonId) {
        return {
          ...l,
          steps: l.steps.map(s => s.id === activeStepId ? { ...s, [field]: value } : s)
        };
      }
      return l;
    });
    onUpdate({ ...course, lessons: updatedLessons });
  };

  const updateActiveLesson = (field: keyof Lesson, value: any) => {
    const updatedLessons = course.lessons.map(l => 
      l.id === activeLessonId ? { ...l, [field]: value } : l
    );
    onUpdate({ ...course, lessons: updatedLessons });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (activeStepId === 'lesson') updateActiveLesson('media', url);
      else updateActiveStep('media', url);
    }
  };

  const handleGenerateVideo = async () => {
    const targetPrompt = activeStepId === 'lesson' ? activeLesson.aiPrompt : activeStep?.aiPrompt;
    const targetRag = activeStepId === 'lesson' ? activeLesson.ragQuery : activeStep?.ragQuery;
    const targetTitle = activeStepId === 'lesson' ? activeLesson.title : activeStep?.title;
    
    if (!targetPrompt && !targetRag) {
      alert(lang === 'uk' ? "Будь ласка, заповніть Сценарій або Технічні деталі для генерації." : "Please fill in the Script or Technical details for generation.");
      return;
    }

    if (typeof (window as any).aistudio !== 'undefined') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }
    
    setIsGeneratingVideo(true);
    try {
      const combinedPrompt = `Professional cinematic instructional video for lash artists. 
        Focus Subject: ${targetTitle}.
        Narrative Context: ${targetPrompt || ''}. 
        Scientific/Technical Details: ${targetRag || ''}. 
        Visual Style: 4K macro cinematography, high-end beauty salon lighting, slow camera motion, extreme detail on lash textures and chemical reactions. Professional studio atmosphere. No text on screen.`;
      
      const videoUrl = await generateEducationalVideo(combinedPrompt);
      
      if (activeStepId === 'lesson') updateActiveLesson('media', videoUrl);
      else updateActiveStep('media', videoUrl);
    } catch (error: any) {
      console.error("Veo Video Generation Error:", error);
      if (error?.message?.includes('Entity was not found')) {
         await (window as any).aistudio.openSelectKey();
      } else {
        alert(lang === 'uk' ? "Помилка генерації відео. Спробуйте уточнити опис або перевірте статус API." : "Video generation failed. Try refining the description or check API status.");
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const currentMedia = activeStepId === 'lesson' ? activeLesson.media : activeStep?.media;

  return (
    <div className="h-full flex flex-col bg-[#0A0C10] overflow-hidden animate-in fade-in duration-500 text-left">
      <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isExtension ? 'bg-purple-500' : 'bg-yellow-500'}`} />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">
              {activeStepId === 'lesson' ? 'Медіа Вступу Уроку' : 'Конфігурація Етапу'}
            </h2>
          </div>
          <p className="text-xl font-black text-gray-100 truncate">{activeStepId === 'lesson' ? activeLesson.title : activeStep?.title}</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => (window as any).aistudio?.openSelectKey()} className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="API Settings">
             <Key size={18} />
           </button>
           <button className={`px-6 py-3 ${brandBg} text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95`}>
              <Save size={14} /> {lang === 'uk' ? 'Зберегти зміни' : 'Save Changes'}
           </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-72 border-r border-[#1F232B] bg-[#12141C]/50 p-6 overflow-y-auto custom-scrollbar shrink-0">
          <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4">Структура HUB-блоку</h3>
          {course.lessons.map((lesson) => (
            <div key={lesson.id} className="mb-6">
               <div 
                 onClick={() => { setActiveLessonId(lesson.id); setActiveStepId('lesson'); if(isRecordingPrompt) toggleVoicePrompt(); }} 
                 className={`flex items-center gap-2 mb-3 cursor-pointer p-3 rounded-2xl transition-all ${activeLessonId === lesson.id && activeStepId === 'lesson' ? 'bg-white/5 ' + brandAccent : 'text-gray-400 hover:text-gray-200'}`}
               >
                 <Layout size={14} />
                 <span className="text-[11px] font-black uppercase truncate tracking-widest">{lesson.title}</span>
               </div>
               {activeLessonId === lesson.id && (
                 <div className="space-y-2 pl-4 animate-in slide-in-from-left-2 duration-300">
                   <div 
                     onClick={() => { setActiveStepId('lesson'); if(isRecordingPrompt) toggleVoicePrompt(); }} 
                     className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-2 ${activeStepId === 'lesson' ? `bg-[#1F232B] ${brandBorder}` : 'border-transparent hover:bg-white/5'}`}
                   >
                     <Video size={12} className={brandAccent} />
                     <span className="text-[10px] font-bold text-white tracking-tight uppercase">Вступ уроку</span>
                   </div>
                   {lesson.steps.map((step, idx) => (
                      <div 
                        key={step.id} 
                        onClick={() => { setActiveStepId(step.id); if(isRecordingPrompt) toggleVoicePrompt(); }} 
                        className={`p-4 rounded-2xl cursor-pointer border-2 transition-all ${activeStepId === step.id ? `bg-[#1F232B] ${brandBorder}` : 'border-transparent hover:bg-white/5'}`}
                      >
                        <span className={`text-[8px] font-black ${brandAccent} block mb-1 uppercase tracking-widest`}>Етап {idx + 1}</span>
                        <h4 className="text-[10px] font-bold truncate text-white uppercase">{step.title}</h4>
                      </div>
                   ))}
                 </div>
               )}
            </div>
          ))}
        </div>

        {/* Editor Main Canvas */}
        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
           <div className="max-w-4xl mx-auto space-y-10 pb-20">
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-[0.2em]">Заголовок ресурсу</label>
                 <input 
                  className="w-full text-5xl font-black bg-transparent border-none focus:ring-0 p-0 text-white placeholder-gray-800 tracking-tighter uppercase" 
                  value={activeStepId === 'lesson' ? activeLesson.title : activeStep?.title} 
                  onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('title', e.target.value) : updateActiveStep('title', e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Script Input with Voice Support */}
                <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-xl space-y-6 flex flex-col">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <Wand2 size={14} className={brandAccent} /> Сценарій ARI (aiPrompt)
                      </label>
                      <button 
                        onClick={toggleVoicePrompt}
                        className={`p-2 rounded-xl transition-all flex items-center gap-2 text-[8px] font-black uppercase ${isRecordingPrompt ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                      >
                        {isRecordingPrompt ? <MicOff size={14} /> : <Mic size={14} />}
                        {isRecordingPrompt && "Слухаю..."}
                      </button>
                    </div>
                    <textarea 
                      className={`w-full h-56 bg-[#0A0C10] border ${isRecordingPrompt ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-[#1F232B]'} rounded-[2rem] p-8 text-sm text-gray-200 outline-none focus:ring-1 ring-purple-500/50 resize-none transition-all placeholder-gray-800 font-medium leading-relaxed`} 
                      value={activeStepId === 'lesson' ? (activeLesson.aiPrompt || '') : (activeStep?.aiPrompt || '')} 
                      onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('aiPrompt', e.target.value) : updateActiveStep('aiPrompt', e.target.value)} 
                      placeholder={placeholders.aiPrompt} 
                    />
                </div>

                {/* Video Generation Preview */}
                <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-xl flex flex-col space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Film size={14} className={brandAccent} /> Візуалізація Veo HD
                  </label>
                  <div className="flex-1 min-h-[220px] bg-[#0A0C10] rounded-[2.5rem] border border-[#1F232B] overflow-hidden flex flex-col items-center justify-center relative shadow-inner group/preview">
                    {isGeneratingVideo ? (
                      <div className="flex flex-col items-center gap-6 p-8 text-center animate-in fade-in zoom-in duration-500">
                        <Loader2 className={`animate-spin ${brandAccent}`} size={48} />
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed max-w-[180px]">
                          {loadingMessages[loadingMessageIdx]}
                        </p>
                      </div>
                    ) : currentMedia ? (
                      <video src={currentMedia} className="w-full h-full object-cover" autoPlay loop muted />
                    ) : (
                      <div className="text-center opacity-10 group-hover/preview:opacity-20 transition-opacity">
                        <FileVideo size={64} className="mx-auto" />
                        <p className="text-[10px] font-black uppercase mt-4 tracking-widest">Відео відсутнє</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleGenerateVideo} 
                    disabled={isGeneratingVideo} 
                    className={`w-full py-5 ${brandBg} text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl active:scale-[0.98]`}
                  >
                    {isGeneratingVideo ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    {isGeneratingVideo ? 'ГЕНЕРУЄМО...' : 'ГЕНЕРУВАТИ ЧЕРЕЗ VEO'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Knowledge Base Input */}
                <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-xl space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <MessageSquare size={14} className={brandAccent} /> Технічна база (ragQuery)
                    </label>
                    <input 
                      className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-gray-300 outline-none focus:ring-1 ring-white/10" 
                      value={activeStepId === 'lesson' ? (activeLesson.ragQuery || '') : (activeStep?.ragQuery || '')} 
                      onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('ragQuery', e.target.value) : updateActiveStep('ragQuery', e.target.value)} 
                      placeholder={placeholders.rag} 
                    />
                </div>

                {/* Manual Media Control */}
                <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-xl space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Link size={14} className={brandAccent} /> Пряме посилання або файл
                    </label>
                    <div className="flex gap-3">
                        <input 
                          className="flex-1 bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-gray-100 outline-none focus:ring-1 ring-white/10" 
                          value={currentMedia || ''} 
                          onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('media', e.target.value) : updateActiveStep('media', e.target.value)} 
                          placeholder={placeholders.mediaUrl} 
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()} 
                          className="p-5 bg-[#0A0C10] border border-[#1F232B] rounded-2xl text-gray-400 hover:text-white transition-all shadow-inner"
                        >
                          <Upload size={18} />
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*,video/*" />
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditor;
