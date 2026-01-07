
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Wand2, Film, Loader2, Sparkles, RefreshCw, Mic, MicOff, 
  Video, Camera, Edit3, Layout, Plus, Link as LinkIcon, 
  ImageIcon, MessageSquare, Zap, Upload, FileVideo, 
  Key, Bot, FileText, UploadCloud, X, Trash2, Eye, EyeOff, 
  Settings as SettingsIcon, DollarSign, Folder, FolderOpen, 
  Book, ChevronRight, ChevronDown, AlignLeft, Users, Calendar, 
  Shield, PlayCircle, Clock, MoreHorizontal, Sparkle, GripVertical, Tags, Check, BrainCircuit, ListTree, Globe, Lock, AlertTriangle, Volume2, StopCircle, Clapperboard, HelpCircle, AlignJustify,
  Info, Database, Layers, ExternalLink, ShieldCheck, FileSearch
} from 'lucide-react';
import { Course, Step, Lesson, Section, Language } from '../types';
import { generateEducationalVideo, generateSmartContent, generateCourseStructure } from '../services/gemini';
import { uploadFile, deleteCourseFromDB } from '../services/firebase';

interface Props {
  course: Course;
  courses: Course[];
  onUpdate: (course: Course) => void;
  onSave?: (course: Course) => void;
  onSetActiveCourse?: (id: string | null) => void;
  lang: Language;
}

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

const CourseEditor: React.FC<Props> = ({ course, courses, onUpdate, onSave, onSetActiveCourse, lang }) => {
  const isExtension = course?.isExtensionCourse || false;
  const brandAccent = isExtension ? 'text-purple-400' : 'text-yellow-500';
  const brandBg = isExtension ? 'bg-purple-600' : 'bg-yellow-600';

  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(course?.sections?.[0]?.id || null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingField, setIsGeneratingField] = useState<string | null>(null);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoLoadingMessage, setVideoLoadingMessage] = useState('');
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structurePrompt, setStructurePrompt] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isUploadingStepMedia, setIsUploadingStepMedia] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const activeSection = course?.sections?.find(s => String(s.id) === String(activeSectionId));
  const activeLesson = activeSection?.lessons?.find(l => String(l.id) === String(activeLessonId));
  const activeStep = activeLesson?.steps?.find(s => String(s.id) === String(activeStepId));
  const currentEntity = activeStep || activeLesson || activeSection;

  const loadingMessages = [
    "Ініціалізація Veo 3.1: Налаштування віртуальної студії...",
    "Аналіз теорії (AI Prompt) та технічних нюансів (RAG)...",
    "Рендеринг відео-потоку в HD якості...",
    "Майже готово! Отримуємо ваше навчальне відео...",
    "Завантаження у хмарне сховище Magic Lash..."
  ];

  useEffect(() => {
    let interval: number;
    if (isGeneratingVideo) {
      let index = 0;
      setVideoLoadingMessage(loadingMessages[0]);
      interval = window.setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setVideoLoadingMessage(loadingMessages[index]);
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [isGeneratingVideo]);

  const handleSmartAutofill = async (field: 'description' | 'aiPrompt' | 'videoPrompt' | 'interactionPrompt', targetLessonId?: string) => {
    const context = {
      courseTitle: course.title,
      lessonTitle: activeLesson?.title || '',
      stepTitle: activeStep?.title || '',
      existingContent: targetLessonId ? (activeLesson?.description || '') : ((currentEntity as any)[field] || '')
    };

    setIsGeneratingField(field);
    try {
      const content = await generateSmartContent(context, field === 'description' ? 'aiPrompt' : field as any);
      
      if (targetLessonId) {
        updateLessonField('description', content);
      } else {
        updateCurrentEntity(field, content);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsGeneratingField(null); 
    }
  };

  const handleLessonMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLessonId) return;
    
    setIsUploadingMedia(true);
    try {
      const path = `courses/${course.id}/lessons/${activeLessonId}/media`;
      const url = await uploadFile(file, path);
      updateLessonField('media', url);
    } catch (err) {
      console.error(err);
      alert("Помилка завантаження медіа.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleStepMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeStepId) return;
    
    setIsUploadingStepMedia(true);
    try {
      const path = `courses/${course.id}/steps/${activeStepId}/media`;
      const url = await uploadFile(file, path);
      updateCurrentEntity('media', url);
    } catch (err) {
      console.error(err);
      alert("Помилка завантаження медіа кроку.");
    } finally {
      setIsUploadingStepMedia(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          updateCurrentEntity('media', base64String);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Доступ до мікрофону відхилено.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!activeStep) return;
    
    if (typeof (window as any).aistudio !== 'undefined') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }
    
    setIsGeneratingVideo(true);
    try {
      // Формуємо промпт з aiPrompt та ragQuery
      const finalVideoPrompt = `
        TOPIC: ${activeStep.title}. 
        VISUAL CONCEPT: ${activeStep.aiPrompt || 'Professional cinematic educational content.'}.
        TECHNICAL FACTS TO INCLUDE: ${activeStep.ragQuery || 'General beauty industry procedure'}.
        STYLE: High-definition 4K, studio lighting, macro-photography style, educational tone.
      `.trim();
      
      // Генеруємо Blob відео
      const videoBlob = await generateEducationalVideo(finalVideoPrompt);
      
      // Завантажуємо в Firebase Storage для постійного доступу
      const fileName = `veo_${activeStep.id}_${Date.now()}.mp4`;
      const storagePath = `courses/${course.id}/steps/${activeStep.id}/videos/${fileName}`;
      const downloadUrl = await uploadFile(videoBlob, storagePath);
      
      updateCurrentEntity('media', downloadUrl);
      alert("Відео успішно згенеровано та збережено!");
    } catch (e: any) { 
      console.error("Veo Generation Error:", e);
      alert("Не вдалося згенерувати відео. Спробуйте уточнити промпти або перевірити API ліміти.");
    } finally { 
      setIsGeneratingVideo(false); 
    }
  };

  const handleDeleteCourse = async () => {
    if (!course.id || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteCourseFromDB(course.id);
      if (onSetActiveCourse) onSetActiveCourse(null);
    } catch (e) { alert("Не вдалося видалити програму."); } finally { setIsDeleting(false); setShowDeleteConfirm(false); }
  };

  const updateCourseMeta = (field: string, value: any) => {
    onUpdate({ ...course, [field]: value });
  };

  const updateCourseSettings = (field: string, value: any) => {
    onUpdate({ ...course, settings: { ...(course.settings || {}), [field]: value } });
  };

  const updateLessonField = (field: string, value: any) => {
    if (!activeLessonId) return;
    const updated = course.sections.map(s => {
      if (s.id === activeSectionId) {
        return { 
          ...s, 
          lessons: s.lessons.map(l => l.id === activeLessonId ? { ...l, [field]: value } : l) 
        };
      }
      return s;
    });
    onUpdate({ ...course, sections: updated });
  };

  const updateCurrentEntity = (field: string, value: any) => {
    const updated = course.sections.map(s => {
      if (s.id === activeSectionId) {
        if (activeLessonId) {
          return { ...s, lessons: s.lessons.map(l => {
            if (l.id === activeLessonId) {
              if (activeStepId) return { ...l, steps: l.steps.map(st => st.id === activeStepId ? { ...st, [field]: value } : st) };
              return { ...l, [field]: value };
            }
            return l;
          }) };
        }
        return { ...s, [field]: value };
      }
      return s;
    });
    onUpdate({ ...course, sections: updated });
  };

  const handleFinalSave = async () => {
    if (!onSave || isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSave(course);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadFile(file, `courses/${course.id}/cover`);
      updateCourseMeta('image', url);
    } catch (err) { 
      console.error(err); 
      alert("Помилка завантаження обкладинки.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg)$/) || url.includes('youtube') || url.includes('vimeo') || url.startsWith('blob:') || url.includes('firebasestorage.googleapis.com');
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0C10] overflow-hidden text-left relative">
      {/* Veo Loading Overlay */}
      {isGeneratingVideo && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-10 animate-in fade-in duration-700">
           <div className="relative mb-12">
              <div className="w-48 h-48 rounded-full border-4 border-white/5 flex items-center justify-center">
                 <Loader2 className={`w-24 h-24 animate-spin ${brandAccent}`} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <Clapperboard className="text-white opacity-20" size={40} />
              </div>
           </div>
           <div className="text-center space-y-4 max-w-md">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">{videoLoadingMessage}</h3>
              <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">ARI створює контент наступного покоління (Veo 3.1)</p>
           </div>
           <div className="mt-12 w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full ${brandBg} animate-progress-fast`} style={{ width: '40%' }} />
           </div>
        </div>
      )}

      {/* Header */}
      <header className="h-24 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0 z-30 shadow-lg">
         <div className="flex items-center gap-6">
           <div className={`w-12 h-12 ${brandBg}/10 rounded-2xl flex items-center justify-center ${brandAccent} border border-current opacity-60`}>
             <BrainCircuit size={24} />
           </div>
           <div className="text-left">
             <div className="flex items-center gap-3 mb-1 opacity-40">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Програма</span>
                <ChevronRight size={10} />
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-tighter ${course.isPublished ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                   {course.isPublished ? <Globe size={8} /> : <FileSearch size={8} />}
                   {course.isPublished ? 'Live' : 'Draft'}
                </div>
             </div>
             <input 
                className="text-2xl font-black bg-transparent border-none focus:ring-0 p-0 text-white outline-none placeholder-gray-800 w-full max-w-[400px]"
                value={course.title} 
                onChange={(e) => updateCourseMeta('title', e.target.value)}
                placeholder="Введіть назву..."
             />
           </div>
         </div>
         <div className="flex gap-4">
           <div className="flex bg-[#0A0C10] p-1.5 rounded-2xl border border-[#1F232B] mr-2">
             <button onClick={() => setActiveTab('content')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'content' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}><AlignLeft size={14} /> Контент</button>
             <button onClick={() => setActiveTab('settings')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}><SettingsIcon size={14} /> Налаштування</button>
           </div>
           <button onClick={() => setShowStructureModal(true)} className="px-5 py-3 bg-[#1F232B] border border-white/5 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/10 transition-all shadow-md"><ListTree size={14} className="text-blue-400" /> Генератор структури</button>
           <button onClick={handleFinalSave} disabled={isSaving} className={`px-8 py-3 ${saveSuccess ? 'bg-green-600' : 'bg-[#EAB308]'} text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg transition-all min-w-[140px] justify-center`}>
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : saveSuccess ? <Check size={14} /> : <Save size={14} />}
              {saveSuccess ? 'Збережено' : 'Зберегти'}
           </button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'content' ? (
          <>
            {/* Sidebar */}
            <div className="w-80 border-r border-[#1F232B] bg-[#12141C]/50 p-6 overflow-y-auto custom-scrollbar text-left relative z-20">
              <div className="flex items-center justify-between mb-6 px-2">
                 <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">План Навчання</h3>
                 <button onClick={() => onUpdate({ ...course, sections: [...(course?.sections || []), { id: generateId('sec'), title: 'Новий Модуль', lessons: [] }] })} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Plus size={14} /></button>
              </div>
              <div className="space-y-4 pb-20">
                {course.sections?.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <div onClick={() => { setActiveSectionId(section.id); setActiveLessonId(null); setActiveStepId(null); }} className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeSectionId === section.id && !activeLessonId ? 'bg-[#1F232B] border-gray-600 text-white shadow-xl' : 'border-transparent hover:bg-white/5 text-gray-400'}`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Folder size={16} className={activeSectionId === section.id ? brandAccent : 'text-gray-600'} />
                        <span className="text-[11px] font-bold uppercase truncate">{section.title}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleAddLesson(section.id); }} className="p-1 opacity-0 group-hover:opacity-100 hover:text-white transition-all"><Plus size={12} /></button>
                    </div>
                    {activeSectionId === section.id && (
                      <div className="pl-4 space-y-1 border-l border-[#1F232B] ml-3 my-1">
                        {section.lessons.map((lesson) => (
                          <div key={lesson.id} className="space-y-1">
                            <div onClick={() => { setActiveLessonId(lesson.id); setActiveStepId(null); }} className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${activeLessonId === lesson.id && !activeStepId ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                               <div className="flex items-center gap-2 overflow-hidden"><Book size={14} /><span className="text-[10px] font-bold truncate">{lesson.title}</span></div>
                               <button onClick={(e) => { e.stopPropagation(); handleAddStep(section.id, lesson.id); }} className="p-1 opacity-0 group-hover:opacity-100 hover:text-white transition-all"><Plus size={10} /></button>
                            </div>
                            {activeLessonId === lesson.id && (
                              <div className="pl-4 space-y-1 border-l border-[#1F232B] ml-2">
                                 {lesson.steps.map((step) => (
                                   <div key={step.id} onClick={() => setActiveStepId(step.id)} className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${activeStepId === step.id ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}>
                                      <div className="flex items-center gap-2 overflow-hidden"><div className={`w-1 h-1 rounded-full ${step.type === 'quiz' ? 'bg-orange-500' : step.type === 'interaction' ? 'bg-purple-500' : 'bg-blue-500'}`} /><span className="text-[9px] font-medium truncate">{step.title}</span></div>
                                   </div>
                                 ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar relative z-0">
               {currentEntity ? (
                 <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500 text-left">
                    <div className="space-y-8">
                       <div className="flex items-center justify-between">
                          <div className="space-y-3 flex-1">
                             <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Назва елементу</label>
                             <input className="w-full text-4xl font-black bg-transparent border-none focus:ring-0 p-2 text-white outline-none border-b border-transparent focus:border-purple-500/30 transition-all" value={currentEntity.title} onChange={(e) => updateCurrentEntity('title', e.target.value)} />
                          </div>
                          
                          {activeStep && (
                            <div className="ml-10 space-y-3 min-w-[200px]">
                               <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest flex items-center gap-2"><Layers size={12} /> Тип Кроку</label>
                               <div className="relative">
                                  <select 
                                    className="w-full bg-[#12141C] border border-[#1F232B] rounded-2xl p-4 text-[11px] font-black uppercase text-white outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                                    value={activeStep.type}
                                    onChange={(e) => updateCurrentEntity('type', e.target.value)}
                                  >
                                    <option value="lecture">Лекція (Відео/Текст)</option>
                                    <option value="quiz">Тестування (Quiz)</option>
                                    <option value="interaction">ARI Взаємодія (Інтерактив)</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                               </div>
                            </div>
                          )}
                       </div>

                       {activeStep && (
                         <div className="space-y-10">
                            {/* Step Description */}
                            <div className="space-y-3 relative">
                               <div className="flex items-center justify-between px-2">
                                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Опис кроку / Теорія</label>
                                  <button onClick={() => handleSmartAutofill('description')} className="text-[9px] font-black uppercase text-purple-400 flex items-center gap-2"><Sparkles size={12} /> Smart Fill</button>
                               </div>
                               <textarea className="w-full bg-[#12141C] border border-[#1F232B] rounded-3xl p-8 text-sm text-gray-300 outline-none h-32 resize-none focus:border-purple-500/30 transition-all leading-relaxed" value={activeStep.description || ''} onChange={(e) => updateCurrentEntity('description', e.target.value)} placeholder="Введіть основний текст лекції або інструкцію..." />
                            </div>

                            {/* Veo Configuration Block */}
                            <div className="p-8 bg-[#12141C] border border-[#1F232B] rounded-[2.5rem] space-y-10 shadow-xl relative overflow-hidden group">
                               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                  <Film size={80} className={brandAccent} />
                               </div>
                               
                               <div className="flex items-center gap-3 relative z-10">
                                  <div className={`w-12 h-12 bg-[#0A0C10] rounded-2xl flex items-center justify-center border border-white/5 ${brandAccent}`}>
                                     <Film size={24} />
                                  </div>
                                  <div>
                                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Генерація Навчального Відео (Veo 3.1)</h3>
                                     <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Автоматичне створення HD-контенту</p>
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                  <div className="space-y-6">
                                     <div className="space-y-3">
                                        <div className="flex items-center justify-between px-2">
                                           <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Візуальний Концепт (aiPrompt)</label>
                                           <button onClick={() => handleSmartAutofill('aiPrompt')} className="text-[8px] font-black text-purple-400 uppercase">Auto</button>
                                        </div>
                                        <textarea 
                                          className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl p-4 text-xs text-gray-300 outline-none h-24 resize-none focus:border-purple-500/50 transition-all" 
                                          value={activeStep.aiPrompt || ''} 
                                          onChange={(e) => updateCurrentEntity('aiPrompt', e.target.value)} 
                                          placeholder="Опишіть візуальний ряд (макро-зйомка, світло, кут камери)..." 
                                        />
                                     </div>
                                     <div className="space-y-3">
                                        <div className="flex items-center justify-between px-2">
                                           <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Технічні деталі (ragQuery)</label>
                                        </div>
                                        <textarea 
                                          className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl p-4 text-xs text-gray-300 outline-none h-24 resize-none focus:border-blue-500/50 transition-all" 
                                          value={activeStep.ragQuery || ''} 
                                          onChange={(e) => updateCurrentEntity('ragQuery', e.target.value)} 
                                          placeholder="Вкажіть точні параметри (тип вигину, час полімеризації тощо)..." 
                                        />
                                     </div>
                                  </div>

                                  <div className="space-y-6">
                                     <div className="aspect-video bg-[#0A0C10] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col items-center justify-center group relative shadow-inner">
                                        {activeStep.media && isVideo(activeStep.media) ? (
                                           <video src={activeStep.media} className="w-full h-full object-cover" controls />
                                        ) : (
                                           <div className="text-center space-y-3 opacity-20">
                                              <PlayCircle size={48} className="mx-auto" />
                                              <p className="text-[10px] font-black uppercase tracking-widest">Прев'ю відсутнє</p>
                                           </div>
                                        )}
                                        {isGeneratingVideo && (
                                           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                                              <Loader2 className={`w-12 h-12 animate-spin ${brandAccent}`} />
                                              <p className="text-[9px] font-black uppercase tracking-[0.2em]">{videoLoadingMessage}</p>
                                           </div>
                                        )}
                                     </div>
                                     <button 
                                        onClick={handleGenerateVideo}
                                        disabled={isGeneratingVideo || !activeStep.aiPrompt}
                                        className={`w-full py-5 ${brandBg} text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-20`}
                                     >
                                        {isGeneratingVideo ? <Loader2 size={16} className="animate-spin" /> : <Sparkle size={16} />}
                                        Згенерувати Відео ARI
                                     </button>
                                  </div>
                               </div>
                            </div>
                         </div>
                       )}

                       {/* Lesson Sidebar View (if no step is active) */}
                       {activeLesson && !activeStep && (
                         <div className="space-y-8 animate-in slide-in-from-top-2 duration-500">
                           <div className="p-8 bg-[#12141C] border border-[#1F232B] rounded-[2.5rem] space-y-5 shadow-inner">
                              <div className="flex items-center justify-between px-2">
                                 <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <AlignJustify size={14} className={brandAccent} /> Опис та теорія уроку
                                 </label>
                                 <button 
                                   onClick={() => handleSmartAutofill('description', activeLesson.id)} 
                                   className="text-[9px] font-black uppercase text-purple-400 hover:text-white transition-all flex items-center gap-2"
                                 >
                                    <Sparkles size={12} /> AI Fill
                                 </button>
                              </div>
                              <textarea 
                                className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl p-6 text-sm text-gray-300 outline-none h-40 resize-none focus:border-purple-500/30 transition-all leading-relaxed" 
                                value={activeLesson.description || ''} 
                                onChange={(e) => updateLessonField('description', e.target.value)} 
                                placeholder="Введіть основну теоретичну базу уроку..." 
                              />
                           </div>

                           {/* NEW: Lesson Media Asset Block */}
                           <div className="p-8 bg-[#12141C] border border-[#1F232B] rounded-[3.5rem] space-y-8 shadow-xl relative overflow-hidden group">
                               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                  <ImageIcon size={80} className={brandAccent} />
                               </div>
                               
                               <div className="flex items-center gap-3 relative z-10">
                                  <div className={`w-12 h-12 bg-[#0A0C10] rounded-2xl flex items-center justify-center border border-white/5 ${brandAccent}`}>
                                     <ImageIcon size={24} />
                                  </div>
                                  <div>
                                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Головний медіа-файл уроку</h3>
                                     <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Обкладинка або вступне відео для всього уроку</p>
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                  <div className="space-y-6">
                                     <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Пряме посилання (URL)</label>
                                        <div className="relative">
                                           <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
                                           <input 
                                              className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-xl py-3 pl-10 pr-4 text-[11px] text-gray-300 outline-none focus:border-purple-500/50 transition-all" 
                                              value={activeLesson.media || ''} 
                                              onChange={(e) => updateLessonField('media', e.target.value)} 
                                              placeholder="https://..." 
                                           />
                                        </div>
                                     </div>
                                     
                                     <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Або завантажити файл</label>
                                        <label className={`w-full py-4 bg-white/5 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-white/10 transition-all ${isUploadingMedia ? 'opacity-50' : ''}`}>
                                           {isUploadingMedia ? <Loader2 size={16} className="animate-spin text-purple-400" /> : <UploadCloud size={16} />}
                                           <span className="text-[10px] font-black uppercase tracking-widest">{isUploadingMedia ? 'Завантаження...' : 'Вибрати файл'}</span>
                                           <input type="file" hidden accept="image/*,video/*" onChange={handleLessonMediaUpload} disabled={isUploadingMedia} />
                                        </label>
                                     </div>
                                  </div>

                                  <div className="aspect-video bg-[#0A0C10] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col items-center justify-center group relative shadow-inner">
                                     {activeLesson.media ? (
                                        isVideo(activeLesson.media) ? (
                                           <video src={activeLesson.media} className="w-full h-full object-cover" controls />
                                        ) : (
                                           <img src={activeLesson.media} className="w-full h-full object-cover" alt="Lesson Preview" />
                                        )
                                     ) : (
                                        <div className="text-center space-y-3 opacity-20">
                                           <ImageIcon size={40} className="mx-auto" />
                                           <p className="text-[10px] font-black uppercase tracking-widest">Медіа не вибрано</p>
                                        </div>
                                     )}
                                  </div>
                               </div>
                           </div>
                           
                           {/* Lesson Step Manager */}
                           <div className="p-8 bg-[#12141C] border border-[#1F232B] rounded-[2.5rem] space-y-6">
                              <div className="flex items-center justify-between">
                                 <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Layout size={16} /> Керування кроками</h3>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {activeLesson.steps.map((step, idx) => (
                                   <button key={step.id} onClick={() => setActiveStepId(step.id)} className="p-4 bg-[#0A0C10] border border-[#1F232B] rounded-2xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                                      <div className="flex items-center gap-3">
                                         <span className="text-[10px] font-black text-gray-700">{idx + 1}.</span>
                                         <span className="text-xs font-bold text-gray-300 truncate">{step.title}</span>
                                      </div>
                                      <ChevronRight size={14} className="text-gray-700 group-hover:text-purple-500 transition-colors" />
                                   </button>
                                 ))}
                                 <button 
                                   onClick={() => handleAddStep(activeSectionId!, activeLessonId!)}
                                   className="p-4 border-2 border-dashed border-[#1F232B] rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-purple-400 hover:border-purple-500/30 transition-all"
                                 >
                                    <Plus size={18} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Додати Крок</span>
                                 </button>
                              </div>
                           </div>
                         </div>
                       )}
                    </div>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                    <Layout size={64} />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Виберіть розділ для редагування</p>
                 </div>
               )}
            </div>
          </>
        ) : (
          /* Settings Tab */
          <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#0A0C10] text-left">
            <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Обкладинка та Стиль</h3>
                    <div className="p-8 bg-[#12141C] border border-[#1F232B] rounded-[2.5rem] space-y-6">
                       <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Зображення Програми</label>
                       <div className="space-y-4">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-gray-600 ml-2 tracking-widest">Вказати URL обкладинки</label>
                             <div className="relative">
                                <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
                                <input 
                                   className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-xl py-3 pl-10 pr-4 text-[11px] text-gray-300 outline-none focus:border-purple-500/50 transition-all" 
                                   value={course.image || ''} 
                                   onChange={(e) => updateCourseMeta('image', e.target.value)} 
                                   placeholder="https://images..." 
                                />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-gray-600 ml-2 tracking-widest">Або завантажити файл</label>
                             <label className={`w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all ${isUploadingCover ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isUploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{isUploadingCover ? 'Завантаження...' : 'Вибрати файл'}</span>
                                <input type="file" hidden accept="image/*" onChange={handleCoverUpload} disabled={isUploadingCover} />
                             </label>
                          </div>
                       </div>
                       <div className="aspect-[16/10] bg-[#0A0C10] rounded-[2rem] border border-white/5 overflow-hidden relative group shadow-inner flex items-center justify-center">
                          {course.image ? (
                             <img src={course.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cover Preview" />
                          ) : (
                             <div className="text-center opacity-20">
                                <ImageIcon size={48} className="mx-auto mb-2" />
                                <p className="text-[9px] font-black uppercase tracking-widest">No Cover Set</p>
                             </div>
                          )}
                          {isUploadingCover && (
                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="animate-spin text-white" size={32} />
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Комерція та Доступ</h3>
                    <div className="p-8 bg-[#12141C] border border-[#1F232B] rounded-[3.5rem] space-y-8 shadow-xl">
                       {/* PUBLISH STATUS TOGGLE */}
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Статус Програми</label>
                          <div className="grid grid-cols-2 gap-3">
                             <button 
                               onClick={() => updateCourseMeta('isPublished', false)} 
                               className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${!course.isPublished ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-[#0A0C10] border-transparent text-gray-600 hover:text-gray-400'}`}
                             >
                                <div className={`p-2 rounded-lg ${!course.isPublished ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'bg-gray-800'}`}><FileSearch size={14} /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Чернетка</span>
                             </button>
                             <button 
                               onClick={() => updateCourseMeta('isPublished', true)} 
                               className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${course.isPublished ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-[#0A0C10] border-transparent text-gray-600 hover:text-gray-400'}`}
                             >
                                <div className={`p-2 rounded-lg ${course.isPublished ? 'bg-green-600 text-white shadow-lg shadow-green-900/40 animate-pulse' : 'bg-gray-800'}`}><ShieldCheck size={14} /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
                             </button>
                          </div>
                          <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tight px-2">
                             {!course.isPublished ? 'Тільки Адміни бачать цю програму. Вона прихована від Студентів.' : 'Програма опублікована та доступна на Вітрині для всіх користувачів.'}
                          </p>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Ціна програми ($)</label>
                          <div className="relative"><DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={18} /><input type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-2xl font-black text-white outline-none focus:border-purple-500/30" value={course.price || 0} onChange={(e) => updateCourseMeta('price', Number(e.target.value))} /></div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Видимість</label>
                          <div className="grid grid-cols-1 gap-2">
                             {['public', 'private', 'unlisted'].map(v => (
                                <button key={v} onClick={() => updateCourseSettings('visibility', v)} className={`p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${course.settings?.visibility === v ? 'bg-white/5 border-purple-500/50 text-white' : 'border-transparent text-gray-600 hover:text-gray-400'}`}>
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${course.settings?.visibility === v ? 'bg-purple-600/20 text-purple-400' : 'bg-[#0A0C10] text-gray-700'}`}>{v === 'public' ? <Globe size={18} /> : v === 'private' ? <Lock size={18} /> : <EyeOff size={18} />}</div>
                                   <div><p className="text-[10px] font-black uppercase tracking-widest">{v === 'public' ? 'Публічний' : v === 'private' ? 'Приватний' : 'Прихований'}</p></div>
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-12 border-t border-[#1F232B] mt-12 flex items-center justify-between">
                 <div className="space-y-1"><h3 className="text-[11px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2"><AlertTriangle size={14} /> Небезпечна зона</h3><p className="text-[10px] font-medium text-gray-600 uppercase tracking-tighter">Видалення програми є незворотним процесом.</p></div>
                 <button onClick={() => setShowDeleteConfirm(true)} className="px-10 py-5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-900/10">Видалити програму</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in">
           <div className="bg-[#12141C] border border-red-500/30 w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-8 text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto border border-red-500/20"><Trash2 size={40} /></div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Видалити програму?</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Ви збираєтеся назавжди видалити "{course.title}"</p>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-5 bg-[#1F232B] text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Назад</button>
                 <button onClick={handleDeleteCourse} disabled={isDeleting} className="flex-1 py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">{isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}Так, видалити</button>
              </div>
           </div>
        </div>
      )}

      {/* Structure Generator Modal */}
      {showStructureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in">
           <div className="bg-[#12141C] border border-[#1F232B] w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/30 text-left">
                       <BrainCircuit size={22} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white uppercase text-left">Генератор Структури</h3>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Створіть цілий курс за один крок</p>
                    </div>
                 </div>
                 <button onClick={() => setShowStructureModal(false)} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                 <p className="text-xs text-gray-400 font-medium text-left">Опишіть тему або надайте план курсу:</p>
                 <textarea 
                   className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl p-6 text-sm text-white outline-none h-40 focus:border-blue-500/50 transition-all resize-none text-left"
                   placeholder="Наприклад: Курс по нарощуванню вій для початківців..."
                   value={structurePrompt}
                   onChange={(e) => setStructurePrompt(e.target.value)}
                 />
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowStructureModal(false)} className="flex-1 py-5 bg-[#1F232B] text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Скасувати</button>
                 <button 
                   onClick={handleGenerateCourseStructure}
                   disabled={isGeneratingStructure || !structurePrompt.trim()}
                   className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-30"
                 >
                    {isGeneratingStructure ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    {isGeneratingStructure ? 'Створюємо...' : 'Згенерувати'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );

  function handleAddLesson(secId: string) {
    const newId = generateId('l');
    const updated = course.sections.map(s => s.id === secId ? { ...s, lessons: [...s.lessons, { id: newId, title: 'Новий Урок', steps: [] }] } : s);
    onUpdate({ ...course, sections: updated });
    setActiveLessonId(newId);
  }

  function handleAddStep(secId: string, lId: string) {
    const newId = Date.now();
    const updated = course.sections.map(s => s.id === secId ? {
      ...s, lessons: s.lessons.map(l => l.id === lId ? { ...l, steps: [...l.steps, { id: newId, title: 'Новий Крок', type: 'lecture' }] } : l)
    } : s);
    onUpdate({ ...course, sections: updated as Section[] });
    setActiveStepId(newId);
  }

  async function handleGenerateCourseStructure() {
    if (!structurePrompt.trim()) return;
    setIsGeneratingStructure(true);
    try {
      const sections = await generateCourseStructure(structurePrompt);
      onUpdate({ ...course, sections });
      setShowStructureModal(false);
      setStructurePrompt('');
      if (sections.length > 0) setActiveSectionId(sections[0].id);
    } catch (e) {
      console.error(e);
      alert("Не вдалося згенерувати структуру.");
    } finally {
      setIsGeneratingStructure(false);
    }
  }
};

export default CourseEditor;
