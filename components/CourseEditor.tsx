
import React, { useState, useEffect, useRef } from 'react';
import { Save, Wand2, Film, Loader2, Sparkles, RefreshCw, Mic, MicOff, Video, Edit3, Layout, Plus, Link, Image as ImageIcon, MessageSquare, Zap, Upload, FileVideo, CheckCircle2 } from 'lucide-react';
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
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  
  const recognitionRef = useRef<any>(null);
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
    aiPrompt: isExtension 
      ? "Опишіть техніку нарощування, геометрію пучка або мікровідступи..." 
      : "Опишіть хімію складів InLei, час експозиції та потовщення...",
    rag: isExtension
      ? "Запит: температурний режим клею, типи вій, площа зчіпки..."
      : "Запит: склад Lash Filler 25.9, фази потовщення волосся...",
    comments: lang === 'uk' 
      ? "Введіть ваші професійні нотатки, поради для учня або технічні особливості цього етапу..." 
      : "Enter your professional notes, student tips, or technical details for this step...",
    mediaUrl: lang === 'uk'
      ? "Вставте URL або виберіть файл..."
      : "Paste URL or select file..."
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

  const handleAddStep = () => {
    const newStepId = Date.now();
    const newStepTitle = lang === 'uk' ? 'Новий етап лекції' : 'New Lecture Step';
    const newStep: Step = {
      id: newStepId,
      type: 'lecture',
      title: newStepTitle,
      aiPrompt: '',
      ragQuery: '',
      comments: ''
    };

    const updatedLessons = course.lessons.map(l => {
      if (l.id === activeLessonId) {
        return {
          ...l,
          steps: [...l.steps, newStep]
        };
      }
      return l;
    });

    onUpdate({ ...course, lessons: updatedLessons });
    setActiveStepId(newStepId);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(lang === 'uk' ? "Ваш браузер не підтримує розпізнавання мови" : "Your browser doesn't support speech recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'uk' ? 'uk-UA' : 'en-US';
    recognition.continuous = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const currentPrompt = activeStepId === 'lesson' ? (activeLesson.aiPrompt || '') : (activeStep?.aiPrompt || '');
      const newVal = currentPrompt ? `${currentPrompt} ${transcript}` : transcript;
      if (activeStepId === 'lesson') updateActiveLesson('aiPrompt', newVal);
      else updateActiveStep('aiPrompt', newVal);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleGenerateVideo = async () => {
    const targetPrompt = activeStepId === 'lesson' ? activeLesson.aiPrompt : activeStep?.aiPrompt;
    if (!targetPrompt) {
      alert(lang === 'uk' ? "Спочатку введіть ARI Prompt" : "Please enter ARI Prompt first");
      return;
    }
    setIsGeneratingVideo(true);
    try {
      const visualPrompt = `Educational beauty cinematography: ${targetPrompt}. 4K, macro lens, professional lighting.`;
      const videoUrl = await generateEducationalVideo(visualPrompt);
      if (activeStepId === 'lesson') updateActiveLesson('media', videoUrl);
      else updateActiveStep('media', videoUrl);
    } catch (error: any) {
      console.error(error);
      alert("Error generating video with Veo.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const currentMedia = activeStepId === 'lesson' ? activeLesson.media : activeStep?.media;

  return (
    <div className="h-full flex flex-col bg-[#0A0C10] overflow-hidden">
      <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
        <div className="text-left min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isExtension ? 'bg-purple-500' : 'bg-yellow-500'}`} />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">
              {activeStepId === 'lesson' ? (lang === 'uk' ? 'Медіа та Вступ Уроку' : 'Lesson Media & Intro') : (lang === 'uk' ? 'Редагування Етапу' : 'Step Editor')}
            </h2>
          </div>
          <p className="text-xl font-black text-gray-100 truncate">{activeStepId === 'lesson' ? activeLesson.title : activeStep?.title}</p>
        </div>
        <div className="flex gap-3 shrink-0">
           <button className={`px-5 py-2.5 ${brandBg} text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95`}>
              <Save size={14} /> {lang === 'uk' ? 'Зберегти' : 'Save'}
           </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-[#1F232B] bg-[#12141C]/50 p-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4 text-left">{lang === 'uk' ? 'План заняття' : 'Lesson Plan'}</h3>
          {course.lessons.map((lesson) => (
            <div key={lesson.id} className="mb-6 text-left">
               <div 
                 onClick={() => { setActiveLessonId(lesson.id); setActiveStepId('lesson'); }}
                 className={`flex items-center gap-2 mb-3 cursor-pointer group p-2 rounded-lg transition-all ${activeLessonId === lesson.id && activeStepId === 'lesson' ? 'bg-white/5 ' + brandAccent : 'text-gray-400 hover:text-white'}`}
               >
                 <Layout size={14} />
                 <span className="text-[11px] font-black uppercase truncate">{lesson.title}</span>
               </div>
               
               {activeLessonId === lesson.id && (
                 <div className="space-y-2 pl-4">
                   <div 
                     onClick={() => setActiveStepId('lesson')}
                     className={`p-3 rounded-xl cursor-pointer border-2 transition-all flex items-center gap-2 ${activeStepId === 'lesson' ? `bg-[#1F232B] ${brandBorder}` : 'border-transparent hover:bg-white/5'}`}
                   >
                     <Video size={12} className={brandAccent} />
                     <span className="text-[10px] font-bold text-white tracking-tight">{lang === 'uk' ? 'Медіа Уроку' : 'Lesson Media'}</span>
                   </div>
                   <div className="h-px bg-[#1F232B] mx-2" />
                   {lesson.steps.map((step, idx) => (
                      <div 
                        key={step.id} 
                        onClick={() => setActiveStepId(step.id)} 
                        className={`p-3 rounded-xl cursor-pointer border-2 transition-all text-left ${
                          activeStepId === step.id ? `bg-[#1F232B] ${brandBorder} shadow-lg` : 'border-transparent hover:bg-[#1F232B]/50'
                        }`}
                      >
                        <span className={`text-[8px] font-black ${brandAccent} block mb-1 uppercase tracking-tighter`}>Крок {idx + 1}</span>
                        <h4 className={`text-[10px] font-bold truncate ${activeStepId === step.id ? 'text-white' : 'text-gray-400'}`}>{step.title}</h4>
                      </div>
                   ))}
                   <button 
                    onClick={handleAddStep}
                    className="w-full mt-2 p-3 rounded-xl border-2 border-dashed border-[#1F232B] hover:border-purple-500/30 text-gray-600 hover:text-purple-400 transition-all flex items-center justify-center gap-2"
                   >
                     <Plus size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">{lang === 'uk' ? 'Додати етап' : 'Add Step'}</span>
                   </button>
                 </div>
               )}
            </div>
          ))}
        </div>

        {/* Content Editor */}
        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar text-left">
           <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {activeStepId === 'lesson' ? (lang === 'uk' ? 'Назва Уроку' : 'Lesson Title') : (lang === 'uk' ? 'Назва технічного кроку' : 'Technical Step Name')}
                 </label>
                 <input 
                    className="w-full text-4xl font-black bg-transparent border-none focus:ring-0 p-0 text-gray-100 placeholder-[#1F232B]"
                    value={activeStepId === 'lesson' ? activeLesson.title : activeStep?.title}
                    onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('title', e.target.value) : updateActiveStep('title', e.target.value)}
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ARI Prompt with Voice */}
                <div className="bg-[#12141C] p-8 rounded-[3rem] border border-[#1F232B] shadow-sm space-y-6 text-left relative overflow-hidden group">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <Wand2 size={14} className={brandAccent} /> {lang === 'uk' ? 'Сценарій (ARI Prompt)' : 'Script (ARI Prompt)'}
                      </label>
                      <button 
                        onClick={toggleListening}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 border border-white/5 hover:border-purple-500/50'}`}
                      >
                        {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                        {isListening ? (lang === 'uk' ? 'Слухаю...' : 'Listening...') : (lang === 'uk' ? ' ARI ГОВОРИ' : ' ARI VOICE')}
                      </button>
                    </div>
                    <textarea 
                      className={`w-full h-40 bg-[#0A0C10] border border-[#1F232B] rounded-3xl p-6 text-sm text-gray-200 focus:ring-1 ${isExtension ? 'ring-purple-500/30' : 'ring-yellow-500/30'} resize-none transition-all outline-none placeholder-gray-700`}
                      value={activeStepId === 'lesson' ? (activeLesson.aiPrompt || '') : (activeStep?.aiPrompt || '')} 
                      onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('aiPrompt', e.target.value) : updateActiveStep('aiPrompt', e.target.value)}
                      placeholder={placeholders.aiPrompt}
                    />
                </div>

                {/* Media Preview / Veo */}
                <div className="bg-[#12141C] p-8 rounded-[3rem] border border-[#1F232B] shadow-sm flex flex-col space-y-6 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Film size={14} className={brandAccent} /> {activeStepId === 'lesson' ? 'Media Asset (Lesson)' : 'Step Video (Veo)'}
                    </label>
                  </div>
                  
                  <div className="flex-1 min-h-[160px] bg-[#0A0C10] rounded-3xl border border-[#1F232B] overflow-hidden flex flex-col items-center justify-center relative group shadow-inner">
                    {isGeneratingVideo ? (
                      <div className="flex flex-col items-center gap-6 p-6 text-center animate-pulse">
                        <Loader2 className={`animate-spin ${brandAccent}`} size={32} />
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed">
                          {loadingMessages[loadingMessageIdx]}
                        </p>
                      </div>
                    ) : currentMedia ? (
                      <div className="w-full h-full relative group/vid">
                        {(currentMedia.includes('.mp4') || currentMedia.includes('blob:')) ? (
                          <video src={currentMedia} className="w-full h-full object-cover" autoPlay loop muted />
                        ) : (
                          <img src={currentMedia} className="w-full h-full object-cover" alt="Media" />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/vid:opacity-100 transition-all flex items-center justify-center gap-4">
                           <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:scale-110 transition-transform">
                             <Upload size={20} />
                           </button>
                           <button onClick={handleGenerateVideo} className="p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:scale-110 transition-transform">
                             <RefreshCw size={20} />
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6 space-y-4 opacity-30 group-hover:opacity-60 transition-opacity">
                        <FileVideo size={40} className="mx-auto" />
                        <p className="text-[9px] font-black uppercase tracking-widest">{lang === 'uk' ? 'Медіа не задано' : 'No media set'}</p>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleGenerateVideo}
                    disabled={isGeneratingVideo}
                    className={`w-full py-5 ${brandBg} text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.25em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:brightness-110 shadow-xl`}
                  >
                    {isGeneratingVideo ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} 
                    {lang === 'uk' ? 'ЗГЕНЕРУВАТИ VEO HD' : 'GENERATE VEO HD'}
                  </button>
                </div>
              </div>

              {/* Advanced Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-sm space-y-6 text-left relative overflow-hidden group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <MessageSquare size={14} className={brandAccent} /> {lang === 'uk' ? 'База Знань (RAG)' : 'Knowledge Base (RAG)'}
                    </label>
                    <input 
                      className={`w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl p-5 text-xs font-bold text-gray-300 outline-none focus:ring-1 ${isExtension ? 'ring-purple-500/30' : 'ring-yellow-500/30'} transition-all placeholder-gray-800`}
                      value={activeStepId === 'lesson' ? (activeLesson.ragQuery || '') : (activeStep?.ragQuery || '')}
                      onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('ragQuery', e.target.value) : updateActiveStep('ragQuery', e.target.value)}
                      placeholder={placeholders.rag}
                    />
                </div>

                <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-sm space-y-6 text-left relative overflow-hidden group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Link size={14} className={brandAccent} /> {lang === 'uk' ? 'Медіа-ресурс' : 'Media Asset'}
                    </label>
                    <div className="flex gap-2">
                         <div className="relative flex-1 group/input">
                            <ImageIcon size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" />
                            <input 
                                className={`w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-12 pr-6 text-xs font-bold text-gray-100 outline-none focus:ring-1 ${isExtension ? 'ring-purple-500/30' : 'ring-yellow-500/30'} transition-all`}
                                value={currentMedia || ''}
                                onChange={(e) => activeStepId === 'lesson' ? updateActiveLesson('media', e.target.value) : updateActiveStep('media', e.target.value)}
                                placeholder={placeholders.mediaUrl}
                            />
                         </div>
                         <button 
                           onClick={() => fileInputRef.current?.click()}
                           className="p-4 bg-[#0A0C10] border border-[#1F232B] rounded-2xl text-gray-400 hover:text-white hover:border-purple-500/50 transition-all"
                         >
                           <Upload size={16} />
                         </button>
                    </div>
                    <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*,video/*" />
                </div>
              </div>

              {/* Technical Notes */}
              <div className="bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] shadow-sm space-y-6 text-left relative overflow-hidden group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Edit3 size={14} className={brandAccent} /> {lang === 'uk' ? 'Методологічні нотатки (Comments)' : 'Teacher Notes (Comments)'}
                  </label>
                  <textarea 
                    className={`w-full h-32 bg-[#0A0C10] border border-[#1F232B] rounded-2xl p-6 text-xs font-medium text-gray-400 focus:ring-1 ${isExtension ? 'ring-purple-500/30' : 'ring-yellow-500/30'} resize-none outline-none placeholder-gray-800 transition-all`}
                    value={activeStepId === 'lesson' ? '' : (activeStep?.comments || '')}
                    disabled={activeStepId === 'lesson'}
                    onChange={(e) => updateActiveStep('comments', e.target.value)}
                    placeholder={placeholders.comments}
                  />
                  {activeStepId === 'lesson' && (
                    <div className="absolute inset-0 bg-[#12141C]/80 backdrop-blur-[2px] flex items-center justify-center p-8 text-center">
                       <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Нотатки доступні тільки для технічних кроків</p>
                    </div>
                  )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditor;
