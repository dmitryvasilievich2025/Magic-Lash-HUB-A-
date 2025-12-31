import React, { useState, useEffect, useRef } from 'react';
import { Save, Wand2, Film, Loader2, Sparkles, RefreshCw, Mic, MicOff, Video, Edit3, Layout, Plus, Link, Image as ImageIcon, MessageSquare, Zap, Upload, FileVideo, Key } from 'lucide-react';
import { Course, Step, Lesson, Language } from '../types';
import { generateEducationalVideo, getAI } from '../services/gemini';

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }, 7000);
    } else {
      setLoadingMessageIdx(0);
    }
    return () => clearInterval(interval);
  }, [isGeneratingVideo]);

  const activeLesson = course.lessons.find(l => l.id === activeLessonId) || course.lessons[0];
  const activeStep = activeStepId === 'lesson' ? null : activeLesson?.steps.find(s => s.id === activeStepId);

  const isExtension = course.isExtensionCourse;
  const brandAccent = isExtension ? 'text-purple-400' : 'text-yellow-500';
  const brandBg = isExtension ? 'bg-purple-600' : 'bg-yellow-600';
  const brandBorder = isExtension ? 'border-purple-500' : 'border-yellow-500';

  const placeholders = {
    aiPrompt: isExtension ? "Опишіть техніку нарощування..." : "Опишіть хімію складів InLei...",
    rag: isExtension ? "Запит: клей, типи вій, зчіпка..." : "Запит: склад Lash Filler...",
    comments: lang === 'uk' ? "Професійні нотатки..." : "Professional notes...",
    mediaUrl: lang === 'uk' ? "URL або файл..." : "URL or file..."
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
    
    if (!targetPrompt && !targetRag) {
      alert(lang === 'uk' ? "Будь ласка, заповніть Сценарій або Базу Знань" : "Please fill in Prompt or Knowledge Base");
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
      // 1. Визначаємо контекст (Extension vs Lamination)
      const courseContext = isExtension 
        ? "Eyelash Extension procedure, synthetic lashes, isolation tweezers, adhesive dipping, artificial lashes" 
        : "Lash Lamination lifting procedure, silicone shields, chemical solutions, natural eyelashes, brush application";

      // 2. Формуємо промпт на основі aiPrompt (Дія) та ragQuery (Деталі)
      const combinedPrompt = `Cinematic 4K macro beauty shot. 
        Context: ${courseContext}.
        Specific Action/Scenario: ${targetPrompt || 'Professional beauty procedure detail, close-up'}. 
        Technical Elements & Tools: ${targetRag || 'Standard professional tools, clean workspace'}. 
        Visual Style: High-end beauty commercial, ultra-detailed texture, soft studio lighting, shallow depth of field, slow motion movement, hyper-realistic.`;
      
      const videoUrl = await generateEducationalVideo(combinedPrompt);
      
      if (activeStepId === 'lesson') updateActiveLesson('media', videoUrl);
      else updateActiveStep('media', videoUrl);

    } catch (error: any) {
      console.error("Veo Video Generation Error:", error);
      if (error?.message?.includes('Entity was not found') || error?.message?.includes('404')) {
         await (window as any).aistudio.openSelectKey();
      } else {
         alert("Video generation failed. Please check your API key.");
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const currentMedia = activeStepId === 'lesson' ? activeLesson.media : activeStep?.media;

  return (
    <div className="h-full flex flex-col bg-[#0A0C10] overflow-hidden">
      <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isExtension ? 'bg-purple-500' : 'bg-yellow-500'}`} />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">
              {activeStepId === 'lesson' ? 'Медіа Вступу Уроку' : 'Редагування Кроку'}
            </h2>
          </div>
          <p className="text-xl font-black text-gray-100 truncate">{activeStepId === 'lesson' ? activeLesson.title : activeStep?.title}</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => (window as any).aistudio?.openSelectKey()} className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
             <Key size={18} />
           </button>
           <button className={`px-6 py-3 ${brandBg} text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95`}>
              <Save size={14} /> {lang === 'uk' ? 'Зберегти' : 'Save'}
           </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden text-left">
        <div className="w-72 border-r border-[#1F232B] bg-[#12141C]/50 p-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4">План заняття</h3>
          {course.lessons.map((lesson) => (
            <div key={lesson.id} className="mb-6">
               <div onClick={() => { setActiveLessonId(lesson.id); setActiveStepId('lesson'); }} className={`flex items-center gap-2 mb-3 cursor-pointer p-3 rounded-2xl transition-all ${activeLessonId === lesson.id && activeStepId === 'lesson' ? 'bg-white/5 ' + brandAccent : 'text-gray-400'}`}>
                 <Layout size={14} />
                 <span className="text-[11px] font-black uppercase truncate tracking-widest">{lesson.title}</span>
               </div>
               {activeLessonId === lesson.id && (
                 <div className="space-y-2 pl-4">
                   <div onClick={() => setActiveStepId('lesson')} className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-2 ${activeStepId === 'lesson' ? `bg-[#1F232B] ${brandBorder}` : 'border-transparent'}`}>
                     <Video size={12} className={brandAccent} />
                     <span className="text-[10px] font-bold text-white tracking-tight">Медіа Уроку (Intro)</span>
                   </div>
                   {lesson.steps.map((step, idx) => (
                      <div key={step.id} onClick={() => setActiveStepId(step.id)} className={`p-4 rounded-2xl cursor-pointer border-2 transition-all ${activeStepId === step.id ? `bg-[#1F232B] ${brandBorder}` : 'border-transparent'}`}>
                        <span className={`text-[8px] font-black ${brandAccent} block mb-1 uppercase`}>Крок {idx + 1}</span>
                        <h4 className="text-[10px] font-bold truncate text-white">{step.title}</h4>
                      </div>
                   ))}
                 </div>
               )}
            </div>
          ))}
        </div>

        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
           <div className="max-w-4xl mx-auto space-y-10 pb-20">
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Назва</label>
                 <input className="w-full text-5xl font-black bg-transparent border-none focus:ring-0 p-0 text-white placeholder-gray-800 tracking-tighter" value={activeStepId === 'lesson' ? activeLesson.title : activeStep?.title} onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('title', e.target.value) : updateActiveStep('title', e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-xl space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Wand2 size={14} className={brandAccent} /> Сценарій (ARI Prompt)</label>
                    <textarea className="w-full h-56 bg-[#0A0C10] border border-[#1F232B] rounded-[2rem] p-8 text-sm text-gray-200 outline-none focus:ring-1 ring-purple-500/50 resize-none transition-all placeholder-gray-800" value={activeStepId === 'lesson' ? (activeLesson.aiPrompt || '') : (activeStep?.aiPrompt || '')} onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('aiPrompt', e.target.value) : updateActiveStep('aiPrompt', e.target.value)} placeholder={placeholders.aiPrompt} />
                </div>

                <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-xl flex flex-col space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Film size={14} className={brandAccent} /> Veo Video Generation</label>
                  <div className="flex-1 min-h-[200px] bg-[#0A0C10] rounded-[2.5rem] border border-[#1F232B] overflow-hidden flex flex-col items-center justify-center relative shadow-inner">
                    {isGeneratingVideo ? (
                      <div className="flex flex-col items-center gap-6 p-8 text-center animate-pulse">
                        <Loader2 className={`animate-spin ${brandAccent}`} size={40} />
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed max-w-[150px]">{loadingMessages[loadingMessageIdx]}</p>
                      </div>
                    ) : currentMedia ? (
                      <video src={currentMedia} className="w-full h-full object-cover" autoPlay loop muted />
                    ) : (
                      <div className="text-center opacity-10"><FileVideo size={64} /><p className="text-[10px] font-black uppercase mt-4">Empty Asset</p></div>
                    )}
                  </div>
                  <button onClick={handleGenerateVideo} disabled={isGeneratingVideo} className={`w-full py-5 ${brandBg} text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-purple-900/10`}>
                    {isGeneratingVideo ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} GENERATE VEO HD
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-xl space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><MessageSquare size={14} className={brandAccent} /> База Знань (RAG)</label>
                    <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-gray-300 outline-none" value={activeStepId === 'lesson' ? (activeLesson.ragQuery || '') : (activeStep?.ragQuery || '')} onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('ragQuery', e.target.value) : updateActiveStep('ragQuery', e.target.value)} placeholder={placeholders.rag} />
                </div>
                <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-xl space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Link size={14} className={brandAccent} /> Media Resource</label>
                    <div className="flex gap-3">
                        <input className="flex-1 bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-gray-100 outline-none" value={currentMedia || ''} onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('media', e.target.value) : updateActiveStep('media', e.target.value)} placeholder={placeholders.mediaUrl} />
                        <button onClick={() => fileInputRef.current?.click()} className="p-5 bg-[#0A0C10] border border-[#1F232B] rounded-2xl text-gray-400 hover:text-white transition-all"><Upload size={18} /></button>
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