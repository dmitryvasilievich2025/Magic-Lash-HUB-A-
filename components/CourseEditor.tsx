import React, { useState, useEffect, useRef } from 'react';
import { Save, Wand2, Film, Loader2, Sparkles, RefreshCw, Mic, MicOff, Video, Edit3, Layout, Plus, Link, Image as ImageIcon, MessageSquare, Zap, Upload, FileVideo, Key, Bot, FileText, UploadCloud, X, Trash2, Eye, EyeOff, Settings as SettingsIcon, DollarSign, Folder, FolderOpen, Book, ChevronRight, ChevronDown, AlignLeft, Users, Calendar, Shield, PlayCircle, Clock, MoreHorizontal, Sparkle } from 'lucide-react';
import { Course, Step, Lesson, Section, Language, QuizQuestion, CourseMember } from '../types';
import { generateEducationalVideo, generateCourseStructure, generateSmartContent, generateCourseSummary } from '../services/gemini';
import { uploadFile } from '../services/firebase';
import LiveAssistant from './LiveAssistant';

interface Props {
  course: Course;
  onUpdate: (course: Course) => void;
  onSave?: (course: Course) => void;
  lang: Language;
}

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

const CourseEditor: React.FC<Props> = ({ course, onUpdate, onSave, lang }) => {
  // Визначаємо змінні для стилізації на основі типу курсу
  const isExtension = course.isExtensionCourse || false;
  const brandAccent = isExtension ? 'text-purple-400' : 'text-yellow-500';
  const brandBg = isExtension ? 'bg-purple-600' : 'bg-yellow-600';

  const [activeSectionId, setActiveSectionId] = useState<string | null>(course.sections?.[0]?.id || null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<number | null>(null);

  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'structure-ai' | 'schedule' | 'access' | 'content' | 'people'>('general');
  const [structurePrompt, setStructurePrompt] = useState('');
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  
  const [isRecordingPrompt, setIsRecordingPrompt] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const activeSection = course.sections?.find(s => String(s.id) === String(activeSectionId));
  const activeLesson = activeSection?.lessons?.find(l => String(l.id) === String(activeLessonId));
  const activeStep = activeLesson?.steps?.find(s => String(s.id) === String(activeStepId));

  useEffect(() => {
    if (course.sections?.length > 0 && !activeSectionId) {
      setActiveSectionId(course.sections[0].id);
    }
  }, [course]);

  // --- AI ACTIONS ---

  const handleGenerateVeoVideo = async () => {
    if (!activeLesson) return;
    
    // Формуємо промпт з aiPrompt та ragQuery уроку
    const basePrompt = activeLesson.aiPrompt || '';
    const ragContext = activeLesson.ragQuery ? `\n\nTechnical context: ${activeLesson.ragQuery}` : '';
    const finalPrompt = `${basePrompt}${ragContext}`.trim();

    if (!finalPrompt) {
      alert(lang === 'uk' ? 'Будь ласка, заповніть "ARI Підказка" або "RAG Запит" для генерації відео.' : 'Please fill "ARI Prompt" or "RAG Query" to generate video.');
      return;
    }

    setIsGeneratingVideo(true);
    try {
      // Використовуємо сервіс Veo для генерації відео
      const videoUrl = await generateEducationalVideo(finalPrompt);
      updateCurrentEntity('media', videoUrl);
    } catch (error) {
      console.error("Veo Generation Error:", error);
      alert(lang === 'uk' ? 'Помилка генерації відео.' : 'Video generation failed.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // --- CRUD ACTIONS ---

  const handleAddSection = () => {
    const newId = generateId('sec');
    const newSection: Section = {
      id: newId,
      title: lang === 'uk' ? 'Новий Модуль' : 'New Module',
      description: '',
      lessons: []
    };
    onUpdate({ ...course, sections: [...(course.sections || []), newSection] });
    setActiveSectionId(newId);
    setActiveLessonId(null);
    setActiveStepId(null);
  };

  const handleDeleteSection = (e: React.MouseEvent, secId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(lang === 'uk' ? "Видалити цей модуль?" : "Delete this module?")) {
      const updatedSections = (course.sections || []).filter(s => String(s.id) !== String(secId));
      if (String(activeSectionId) === String(secId)) {
        setActiveSectionId(updatedSections.length > 0 ? updatedSections[0].id : null);
        setActiveLessonId(null);
        setActiveStepId(null);
      }
      onUpdate({ ...course, sections: updatedSections });
    }
  };

  const handleAddLesson = (e: React.MouseEvent, secId: string) => {
    e.stopPropagation();
    const newId = generateId('l');
    const updatedSections = course.sections.map(s => {
      if (String(s.id) === String(secId)) {
        return {
          ...s,
          lessons: [...(s.lessons || []), {
            id: newId,
            title: lang === 'uk' ? 'Новий Урок' : 'New Lesson',
            description: '',
            steps: []
          }]
        };
      }
      return s;
    });
    onUpdate({ ...course, sections: updatedSections });
    setActiveSectionId(secId);
    setActiveLessonId(newId);
    setActiveStepId(null);
  };

  const handleDeleteLesson = (e: React.MouseEvent, secId: string, lId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(lang === 'uk' ? "Видалити цей урок?" : "Delete this lesson?")) {
      const updatedSections = course.sections.map(s => {
        if (String(s.id) === String(secId)) {
          return { ...s, lessons: s.lessons.filter(l => String(l.id) !== String(lId)) };
        }
        return s;
      });
      if (String(activeLessonId) === String(lId)) {
        setActiveLessonId(null);
        setActiveStepId(null);
      }
      onUpdate({ ...course, sections: updatedSections });
    }
  };

  const handleAddStep = (e: React.MouseEvent, secId: string, lId: string) => {
    e.stopPropagation();
    const newId = Date.now();
    const updatedSections = course.sections.map(s => {
      if (String(s.id) === String(secId)) {
        return {
          ...s,
          lessons: s.lessons.map(l => {
            if (String(l.id) === String(lId)) {
              return {
                ...l,
                steps: [...(l.steps || []), {
                  id: newId,
                  title: lang === 'uk' ? 'Новий крок' : 'New step',
                  type: 'lecture' as const,
                  description: ''
                }]
              };
            }
            return l;
          })
        };
      }
      return s;
    });
    onUpdate({ ...course, sections: updatedSections });
    setActiveSectionId(secId);
    setActiveLessonId(lId);
    setActiveStepId(newId);
  };

  const handleDeleteStep = (e: React.MouseEvent, secId: string, lId: string, sId: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(lang === 'uk' ? "Видалити цей крок?" : "Delete this step?")) {
      const updatedSections = course.sections.map(s => {
        if (String(s.id) === String(secId)) {
          return {
            ...s,
            lessons: s.lessons.map(l => {
              if (String(l.id) === String(lId)) {
                return { ...l, steps: l.steps.filter(st => String(st.id) !== String(sId)) };
              }
              return l;
            })
          };
        }
        return s;
      });
      if (String(activeStepId) === String(sId)) {
        setActiveStepId(null);
      }
      onUpdate({ ...course, sections: updatedSections });
    }
  };

  // --- CONTENT UPDATES ---

  const updateCurrentEntity = (field: string, value: any) => {
    if (value && typeof value === 'object' && (value.nativeEvent || value.preventDefault)) return;

    const updatedSections = course.sections.map(s => {
      if (String(s.id) === String(activeSectionId)) {
        if (activeLessonId) {
          return {
            ...s,
            lessons: s.lessons.map(l => {
              if (String(l.id) === String(activeLessonId)) {
                if (activeStepId) {
                  return {
                    ...l,
                    steps: l.steps.map(st => String(st.id) === String(activeStepId) ? { ...st, [field]: value } : st)
                  };
                }
                return { ...l, [field]: value };
              }
              return l;
            })
          };
        }
        return { ...s, [field]: value };
      }
      return s;
    });
    onUpdate({ ...course, sections: updatedSections });
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isRecordingPrompt) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'uk' ? 'uk-UA' : 'en-US';
    recognition.onstart = () => setIsRecordingPrompt(true);
    recognition.onend = () => setIsRecordingPrompt(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const current = (activeStep || activeLesson)?.aiPrompt || '';
      updateCurrentEntity('aiPrompt', current ? `${current} ${transcript}` : transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadFile(file, `course-media/${course.id}/${Date.now()}_${file.name}`);
        updateCurrentEntity('media', url);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const currentEntity = activeStep || activeLesson || activeSection;

  return (
    <div className="h-full flex flex-col bg-[#0A0C10] overflow-hidden text-left">
      <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
         <div>
           <div className="flex items-center gap-2 mb-1 opacity-50">
             <span className="text-[10px] font-black uppercase tracking-widest">{course.title}</span>
             <ChevronRight size={10} />
             <span className="text-[10px] font-black uppercase tracking-widest">Editor</span>
           </div>
           <p className="text-xl font-black text-white truncate">
             {activeStep ? activeStep.title : activeLesson ? activeLesson.title : activeSection ? activeSection.title : 'Виберіть елемент'}
           </p>
         </div>
         <div className="flex gap-3">
           <button onClick={() => setIsLiveMode(true)} className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
             <Mic size={14} className={brandAccent} /> ARI TEST
           </button>
           <button onClick={() => onSave?.(course)} className={`px-6 py-3 ${brandBg} text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg`}>
              <Save size={14} /> {lang === 'uk' ? 'Зберегти' : 'Save'}
           </button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR TREE */}
        <div className="w-80 border-r border-[#1F232B] bg-[#12141C]/50 p-6 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Структура</h3>
             <button onClick={handleAddSection} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400"><Plus size={14} /></button>
          </div>
          
          <div className="space-y-4">
            {course.sections?.map(section => (
              <div key={section.id} className="space-y-1">
                <div 
                  onClick={() => { setActiveSectionId(section.id); setActiveLessonId(null); setActiveStepId(null); }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${String(activeSectionId) === String(section.id) && !activeLessonId ? 'bg-[#1F232B] border-gray-600 text-white' : 'border-transparent hover:bg-white/5 text-gray-400'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Folder size={16} className={String(activeSectionId) === String(section.id) ? brandAccent : 'text-gray-600'} />
                    <span className="text-[11px] font-bold uppercase truncate">{section.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                     <button onClick={(e) => handleAddLesson(e, section.id)} className="p-1 hover:text-white"><Plus size={12} /></button>
                     <button onClick={(e) => handleDeleteSection(e, section.id)} className="p-1 hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                </div>

                {String(activeSectionId) === String(section.id) && (
                  <div className="pl-4 space-y-1 border-l border-[#1F232B] ml-3 my-1">
                    {section.lessons.map(lesson => (
                      <div key={lesson.id} className="space-y-1">
                        <div 
                           onClick={() => { setActiveLessonId(lesson.id); setActiveStepId(null); }}
                           className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${String(activeLessonId) === String(lesson.id) && !activeStepId ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                           <div className="flex items-center gap-2 overflow-hidden">
                              <Book size={14} />
                              <span className="text-[10px] font-bold truncate">{lesson.title}</span>
                           </div>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                              <button onClick={(e) => handleAddStep(e, section.id, lesson.id)} className="p-1 hover:text-white"><Plus size={10} /></button>
                              <button onClick={(e) => handleDeleteLesson(e, section.id, lesson.id)} className="p-1 hover:text-red-400"><Trash2 size={10} /></button>
                           </div>
                        </div>

                        {String(activeLessonId) === String(lesson.id) && (
                          <div className="pl-4 space-y-1 border-l border-[#1F232B] ml-2">
                             {lesson.steps.map(step => (
                               <div 
                                 key={step.id}
                                 onClick={() => setActiveStepId(step.id)}
                                 className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${String(activeStepId) === String(step.id) ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}
                               >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                     <div className={`w-1 h-1 rounded-full ${step.type === 'quiz' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                     <span className="text-[9px] font-medium truncate">{step.title}</span>
                                  </div>
                                  <button onClick={(e) => handleDeleteStep(e, section.id, lesson.id, step.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400"><Trash2 size={10} /></button>
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

        {/* MAIN EDITOR */}
        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
           {currentEntity ? (
             <div className="max-w-4xl mx-auto space-y-10 pb-20">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500">Назва</label>
                      <input className="w-full text-4xl font-black bg-transparent border-none focus:ring-0 p-0 text-white" value={currentEntity.title} onChange={(e) => updateCurrentEntity('title', e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500">Опис</label>
                      <textarea className="w-full bg-[#12141C] border border-[#1F232B] rounded-2xl p-6 text-sm text-gray-300 outline-none h-32 resize-none" value={currentEntity.description || ''} onChange={(e) => updateCurrentEntity('description', e.target.value)} />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black uppercase text-gray-500">Медіа {isUploading && "..."}</label>
                         <div className="flex gap-2">
                            {activeLesson && !activeStep && (
                               <button 
                                 onClick={handleGenerateVeoVideo}
                                 disabled={isGeneratingVideo}
                                 className="p-2 bg-[#0A0C10] rounded-lg text-purple-400 hover:text-white transition-all flex items-center gap-2 border border-purple-500/20"
                                 title="Generate Video with Veo AI"
                               >
                                  {isGeneratingVideo ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
                                  <span className="text-[9px] font-black uppercase">Veo AI</span>
                               </button>
                            )}
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-[#0A0C10] rounded-lg text-gray-500 hover:text-white"><Upload size={14} /></button>
                         </div>
                      </div>
                      <div className="aspect-video bg-[#0A0C10] rounded-2xl overflow-hidden border border-[#1F232B] flex items-center justify-center relative">
                         {isGeneratingVideo ? (
                            <div className="flex flex-col items-center gap-3">
                               <Loader2 size={40} className="animate-spin text-purple-500" />
                               <p className="text-[10px] font-black text-gray-500 uppercase animate-pulse">Veo is creating your video...</p>
                            </div>
                         ) : currentEntity.media ? (
                           <video src={currentEntity.media} controls className="w-full h-full object-contain" />
                         ) : <UploadCloud size={40} className="text-gray-800" />}
                      </div>
                      <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="video/*,image/*" />
                   </div>

                   {(activeStep || activeLesson) && (
                     <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-6">
                        <div className="space-y-4">
                           {activeStep && (
                              <div className="space-y-2">
                                 <span className="text-[9px] font-bold text-gray-600 uppercase">Тип кроку</span>
                                 <div className="flex bg-[#0A0C10] p-1 rounded-xl border border-[#1F232B]">
                                    {(['lecture', 'quiz', 'interaction'] as const).map(t => (
                                       <button key={t} onClick={() => updateCurrentEntity('type', t)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${activeStep.type === t ? 'bg-[#1F232B] text-white' : 'text-gray-500'}`}>{t}</button>
                                    ))}
                                 </div>
                              </div>
                           )}
                           
                           <div className="space-y-2 pt-4 border-t border-[#1F232B]">
                              <div className="flex items-center justify-between">
                                 <span className="text-[9px] font-bold text-purple-400 uppercase">ARI Підказка (Video Base)</span>
                                 <button onClick={toggleVoiceInput} className={`p-2 rounded-lg ${isRecordingPrompt ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}><Mic size={14} /></button>
                              </div>
                              <textarea 
                                 className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-xl p-4 text-xs text-gray-300 outline-none h-24" 
                                 value={(activeStep || activeLesson)?.aiPrompt || ''} 
                                 onChange={(e) => updateCurrentEntity('aiPrompt', e.target.value)} 
                                 placeholder="Вкажіть основний опис для AI..." 
                              />
                           </div>

                           {!activeStep && activeLesson && (
                              <div className="space-y-2">
                                 <div className="flex items-center gap-2">
                                    <Sparkle size={12} className="text-orange-400" />
                                    <span className="text-[9px] font-bold text-orange-400 uppercase">RAG Запит (Technical context)</span>
                                 </div>
                                 <textarea 
                                    className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-xl p-4 text-xs text-gray-300 outline-none h-20" 
                                    value={activeLesson.ragQuery || ''} 
                                    onChange={(e) => updateCurrentEntity('ragQuery', e.target.value)} 
                                    placeholder="Технічні деталі для точності генерації..." 
                                 />
                              </div>
                           )}
                        </div>
                     </div>
                   )}
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-600">
                <Layout size={48} className="mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">Виберіть розділ або урок для редагування</p>
             </div>
           )}
        </div>
      </div>

      {isLiveMode && (
        <div className="fixed inset-0 z-50 bg-[#0A0C10]">
           <LiveAssistant lang={lang} activeCourse={course} studentName="Specialist" onClose={() => setIsLiveMode(false)} />
        </div>
      )}
    </div>
  );
};

export default CourseEditor;