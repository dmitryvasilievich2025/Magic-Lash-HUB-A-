
import React, { useState, useRef, useMemo } from 'react';
import { Film, Image as ImageIcon, Sparkles, Send, Loader2, Play, Download, Zap, Info, Plus, Columns, Target, Scissors, ChevronRight, BarChart3, Star, ClipboardCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { generateEducationalVideo, analyzeLashWork } from '../services/gemini';
import { Language, AuditResult } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';


interface Props {
  lang: Language;
}

const AILab: React.FC<Props> = ({ lang }) => {
  const [activeTool, setActiveTool] = useState<'video' | 'analysis' | 'work-audit'>('work-audit');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AuditResult | null>(null);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const t = {
    uk: {
      video: 'Veo Video',
      vision: 'Vision Pro',
      audit: 'Аналіз Робіт',
      auditSubtitle: 'Професійний Аудит та Скоринг',
      auditPrompt: `Ти професійний Lash-аудитор світового рівня. Проведи глибокий технічний аналіз роботи.
      ПОРІВНЯЙ фото ДО та ПІСЛЯ.
      Твоя відповідь ПОВИННА бути у форматі JSON згідно наданої схеми.
      ОБОВ'ЯЗКОВО вистави бали від 1 до 10 за наступними критеріями:
      1. СИМЕТРІЯ (відносно форми обличчя та осей очей).
      2. НАПРЯМОК ВІЙ (плавність переходу, рядність та кути нахилу).
      3. ЧИСТОТА СКЛЕЙОК (відсутність монолітів та надлишків клею).
      
      Надай детальні практичні поради рівня "Master-Level" для покращення техніки на основі виявлених помилок.`,
      uploadBefore: 'Фото ДО (вихідний стан)',
      uploadAfter: 'Фото ПІСЛЯ (результат)',
      magic: 'ARI проводить аудит...',
      generate: 'Запустити Аналіз',
      auditResult: 'Технічний Протокол Аудиту',
      contextPlaceholder: "Вкажіть деталі: вигин, товщина, ефект (напр. мокрий ефект, лисичка)...",
      scores: "Оцінки",
      strengths: "Сильні сторони",
      improvements: "Зони для росту",
      advice: "Поради від ARI"
    },
    en: {
      video: 'Veo Video',
      vision: 'Vision Pro',
      audit: 'Work Analysis',
      auditSubtitle: 'Professional Audit & Scoring',
      auditPrompt: `You are a world-class professional Lash Auditor. Conduct a deep technical analysis of the work.
      COMPARE the BEFORE and AFTER photos.
      Your response MUST be in JSON format according to the provided schema.
      MANDATORY: Give scores from 1 to 10 for:
      1. SYMMETRY (relative to face shape and eye axes).
      2. LASH DIRECTION (smoothness of transitions, layering, and tilt angles).
      3. BONDING CLEANLINESS (absence of monoliths and glue excess).
      
      Provide detailed "Master-Level" practical advice to improve technique based on identified errors.`,
      uploadBefore: 'Photo BEFORE',
      uploadAfter: 'Photo AFTER',
      magic: 'ARI is auditing...',
      generate: 'Run Analysis',
      auditResult: 'Technical Audit Protocol',
      contextPlaceholder: "Enter details: curl, thickness, effect (e.g., wet effect, cat eye)...",
      scores: "Scores",
      strengths: "Strengths",
      improvements: "Areas for Improvement",
      advice: "ARI's Advice"
    }
  }[lang];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'before') setPreviewImage(reader.result as string);
        else setAfterImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetState = () => {
      setVideoResult(null);
      setAnalysisResult(null);
  };

  const processTool = async () => {
    if (typeof (window as any).aistudio !== 'undefined') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) await (window as any).aistudio.openSelectKey();
    }

    setIsGenerating(true);
    resetState();

    try {
      if (activeTool === 'video') {
        const videoUrl = await generateEducationalVideo(prompt, previewImage?.split(',')[1]);
        setVideoResult(videoUrl);
      } else {
        const images = [];
        if (previewImage) images.push(previewImage.split(',')[1]);
        if (activeTool === 'work-audit' && afterImage) images.push(afterImage.split(',')[1]);
        
        if (images.length === 0) throw new Error(lang === 'uk' ? "Завантажте фото для аналізу" : "Upload photos for analysis");
        
        const finalPrompt = activeTool === 'work-audit' ? `${t.auditPrompt}\n\nКонтекст майстра: ${prompt}` : prompt;
        const analysis = await analyzeLashWork(images, finalPrompt);
        setAnalysisResult(analysis);
      }
    } catch (error: any) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error occurred");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const chartData = useMemo(() => {
    if (!analysisResult) return [];
    const { symmetry, direction, cleanliness } = analysisResult.scoreBreakdown;
    return [
      { subject: lang === 'uk' ? 'Симетрія' : 'Symmetry', score: symmetry, fullMark: 10 },
      { subject: lang === 'uk' ? 'Напрямок' : 'Direction', score: direction, fullMark: 10 },
      { subject: lang === 'uk' ? 'Чистота' : 'Cleanliness', score: cleanliness, fullMark: 10 },
    ];
  }, [analysisResult, lang]);

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C10] overflow-hidden animate-in fade-in duration-700">
      <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
        <div className="text-left">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Лабораторія ARI</h2>
          <p className="text-xl font-black text-white uppercase tracking-tight">{activeTool === 'work-audit' ? t.audit : 'Технічний Центр AI'}</p>
        </div>
        <div className="flex bg-[#0A0C10] p-1.5 rounded-[1.5rem] border border-[#1F232B]">
           <button 
             onClick={() => { setActiveTool('work-audit'); resetState(); }}
             className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${activeTool === 'work-audit' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-gray-300'}`}
           >
             <Star size={14} /> {t.audit}
           </button>
           <button 
             onClick={() => { setActiveTool('analysis'); resetState(); }}
             className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${activeTool === 'analysis' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-gray-300'}`}
           >
             <ImageIcon size={14} /> {t.vision}
           </button>
           <button 
             onClick={() => { setActiveTool('video'); resetState(); }}
             className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${activeTool === 'video' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-gray-300'}`}
           >
             <Film size={14} /> {t.video}
           </button>
        </div>
      </header>

      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-8 text-left">
            <div className={`bg-[#12141C] p-10 rounded-[3.5rem] border border-[#1F232B] space-y-8 shadow-2xl transition-all ${activeTool === 'work-audit' ? 'border-orange-500/10' : ''}`}>
              
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <ClipboardCheck size={16} className={activeTool === 'work-audit' ? 'text-orange-500' : 'text-purple-500'} /> 
                  {activeTool === 'work-audit' ? 'Контекст роботи' : 'Запит для ARI'}
                </h3>
                <textarea 
                  className="w-full h-32 bg-[#0A0C10] border border-[#1F232B] rounded-[2rem] p-6 text-sm font-medium text-white focus:ring-1 ring-orange-500/50 resize-none outline-none placeholder-gray-700 transition-all"
                  placeholder={t.contextPlaceholder}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              
              <div className="space-y-6">
                <div className={`grid ${activeTool === 'work-audit' ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                  {/* Photo BEFORE */}
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.uploadBefore}</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square bg-[#0A0C10] border-2 border-dashed border-[#1F232B] rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/30 transition-all overflow-hidden relative group"
                    >
                      {previewImage ? (
                        <img src={previewImage} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                      ) : (
                        <div className="text-center space-y-2">
                           <ImageIcon className="text-gray-700 mx-auto" size={32} />
                           <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Select Image</span>
                        </div>
                      )}
                      {previewImage && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="text-white" /></div>}
                    </div>
                  </div>

                  {/* Photo AFTER (Audit Only) */}
                  {activeTool === 'work-audit' && (
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.uploadAfter}</label>
                      <div 
                        onClick={() => afterInputRef.current?.click()}
                        className="aspect-square bg-[#0A0C10] border-2 border-dashed border-[#1F232B] rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/30 transition-all overflow-hidden relative group"
                      >
                        {afterImage ? (
                          <img src={afterImage} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                        ) : (
                          <div className="text-center space-y-2">
                             <Target className="text-gray-700 mx-auto" size={32} />
                             <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Select Result</span>
                          </div>
                        )}
                        {afterImage && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="text-white" /></div>}
                      </div>
                    </div>
                  )}
                </div>
                <input type="file" hidden ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'before')} />
                <input type="file" hidden ref={afterInputRef} onChange={(e) => handleFileUpload(e, 'after')} />
              </div>

              <button 
                onClick={processTool}
                disabled={isGenerating || (activeTool === 'work-audit' && (!previewImage || !afterImage))}
                className={`w-full py-6 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-4 disabled:opacity-30 ${activeTool === 'work-audit' ? 'bg-gradient-to-r from-orange-600 to-red-600 shadow-orange-900/20' : 'bg-purple-600 shadow-purple-900/20'}`}
              >
                {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                {isGenerating ? t.magic : t.generate}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            <div className="bg-[#12141C] rounded-[4rem] border border-[#1F232B] p-12 min-h-[600px] flex flex-col shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                 <BarChart3 size={180} className={activeTool === 'work-audit' ? 'text-orange-500' : 'text-purple-500'} />
              </div>
              
              {videoResult ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-700 relative z-10">
                  <video controls autoPlay loop className="w-full rounded-[2.5rem] shadow-2xl border border-white/5">
                    <source src={videoResult} type="video/mp4" />
                  </video>
                  <a href={videoResult} download className="flex items-center gap-3 px-8 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all border border-white/5">
                    <Download size={18} /> Скачати Результат
                  </a>
                </div>
              ) : analysisResult ? (
                <div className="w-full h-full text-left space-y-10 overflow-y-auto pr-4 custom-scrollbar animate-in slide-in-from-right-4 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#0A0C10] p-8 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Загальний Бал</p>
                       <h3 className="text-7xl font-black text-orange-400 tracking-tighter">{analysisResult.overallScore.toFixed(1)}<span className="text-3xl text-gray-700">/10</span></h3>
                    </div>
                    <div className="bg-[#0A0C10] p-4 rounded-[3rem] border border-white/5">
                       <ResponsiveContainer width="100%" height={200}>
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="#1F232B" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar name="Score" dataKey="score" stroke="#F97316" fill="#F97316" fillOpacity={0.6} />
                            <Tooltip contentStyle={{ backgroundColor: '#12141C', border: '1px solid #1F232B', borderRadius: '1rem' }} />
                          </RadarChart>
                       </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-2"><CheckCircle2 size={16} /> {t.strengths}</h4>
                        <div className="space-y-3">
                           {analysisResult.strengths.map((s, i) => <p key={i} className="text-sm font-medium text-gray-300 bg-[#0A0C10] border border-green-500/10 p-4 rounded-2xl">{s}</p>)}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2"><AlertTriangle size={16} /> {t.improvements}</h4>
                        <div className="space-y-3">
                           {analysisResult.improvements.map((s, i) => <p key={i} className="text-sm font-medium text-gray-300 bg-[#0A0C10] border border-yellow-500/10 p-4 rounded-2xl">{s}</p>)}
                        </div>
                     </div>
                  </div>

                  <div className="bg-[#0A0C10] p-8 rounded-[3rem] border border-[#1F232B] space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2"><Sparkles size={16} /> {t.advice}</h4>
                     <p className="text-gray-200 text-sm leading-[2] font-medium whitespace-pre-wrap">{analysisResult.advice}</p>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-20 group-hover:opacity-40 transition-opacity">
                  <div className="w-24 h-24 bg-[#0A0C10] rounded-[3rem] flex items-center justify-center border border-[#1F232B] shadow-inner">
                    <Target size={40} className="text-white" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-white font-black text-xs uppercase tracking-[0.4em]">Очікування Даних</p>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Завантажте фото та натисніть "Запустити Аналіз"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AILab;