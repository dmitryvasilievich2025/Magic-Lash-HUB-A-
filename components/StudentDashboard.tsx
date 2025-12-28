
import React, { useMemo } from 'react';
import { 
  Play, CheckCircle2, Clock, Award, BookOpen, 
  ArrowRight, Zap, GraduationCap, Star, Trophy, 
  Target, Sparkles, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Course, Language } from '../types';

interface Props {
  activeCourse?: Course;
  lang: Language;
}

const StudentDashboard: React.FC<Props> = ({ activeCourse, lang }) => {
  const isExtension = activeCourse?.isExtensionCourse || false;
  
  const t = useMemo(() => ({
    uk: {
      welcome: 'Привіт, Марія!',
      subtitle: 'Твій шлях до майстерності в Magic Lash HUB',
      stats: {
        mastery: 'Рівень Майстерності',
        rank: 'Silver Specialist',
        hours: 'Годин практики',
        certificates: 'Сертифікати'
      },
      activeTitle: 'Твій поточний розвиток',
      continue: 'Продовжити практику',
      nextStep: 'Наступний крок',
      featured: 'Рекомендовано для твого росту',
      achievements: 'Твої досягнення',
      viewAll: 'Дивитись всі'
    },
    en: {
      welcome: 'Hello, Maria!',
      subtitle: 'Your path to mastery in Magic Lash HUB',
      stats: {
        mastery: 'Mastery Level',
        rank: 'Silver Specialist',
        hours: 'Practice Hours',
        certificates: 'Certificates'
      },
      activeTitle: 'Your Active Development',
      continue: 'Continue Practice',
      nextStep: 'Next Step',
      featured: 'Featured for Your Growth',
      achievements: 'Your Achievements',
      viewAll: 'View All'
    }
  }[lang]), [lang]);

  // Mocked recommendations based on active course
  const recommendations = [
    { id: 'f1', title: 'Advanced Chemistry 2.0', icon: Zap, level: 'Expert', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'f2', title: 'Speed Lash Technique', icon: Clock, level: 'Pro', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'f3', title: 'Business for Lashmakers', icon: Target, level: 'Master', color: 'text-green-400', bg: 'bg-green-500/10' }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0C10] p-10 custom-scrollbar animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-12 text-left">
        
        {/* Header Section with Mastery Showcase */}
        <div className="relative p-12 rounded-[4rem] bg-gradient-to-br from-[#12141C] to-[#0A0C10] border border-white/5 shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="relative">
              <div className="w-40 h-40 bg-[#0A0C10] border-4 border-purple-500/20 rounded-[3rem] flex items-center justify-center p-2 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200" 
                  className="w-full h-full object-cover rounded-[2.5rem] grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                  alt="Avatar"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-purple-600 border-4 border-[#12141C] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-600/40">
                <Trophy size={20} />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-white tracking-tight uppercase">{t.welcome}</h2>
                <p className="text-gray-500 font-bold text-sm tracking-wide">{t.subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                   <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{t.stats.rank}</span>
                </div>
                <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                   <ShieldCheck size={14} className="text-green-400" />
                   <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Certified Specialist</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#0A0C10] p-6 rounded-3xl border border-white/5 text-center min-w-[140px]">
                  <p className="text-[9px] font-black text-gray-600 uppercase mb-1 tracking-widest">{t.stats.hours}</p>
                  <p className="text-2xl font-black text-white tracking-tighter">128</p>
               </div>
               <div className="bg-[#0A0C10] p-6 rounded-3xl border border-white/5 text-center min-w-[140px]">
                  <p className="text-[9px] font-black text-gray-600 uppercase mb-1 tracking-widest">{t.stats.certificates}</p>
                  <p className="text-2xl font-black text-purple-400 tracking-tighter">04</p>
               </div>
            </div>
          </div>
        </div>

        {/* Active Programs & Achievements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Active Course Card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">{t.activeTitle}</h3>
              <button className="text-[9px] font-black uppercase text-purple-400 tracking-widest hover:text-white transition-colors flex items-center gap-2">
                {t.viewAll} <ChevronRight size={12} />
              </button>
            </div>
            
            <div className="bg-[#12141C] border border-white/5 rounded-[3.5rem] p-10 flex flex-col md:flex-row gap-10 shadow-xl relative overflow-hidden group cursor-pointer hover:border-purple-500/20 transition-all duration-500">
               <div className="absolute top-0 left-0 w-2 h-full bg-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="w-full md:w-64 h-48 bg-[#0A0C10] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-inner">
                  <img 
                    src={isExtension ? "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=400" : "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=400"} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                    alt="Current Course"
                  />
               </div>
               <div className="flex-1 space-y-6 flex flex-col justify-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-purple-400">
                      <Sparkles size={12} /> {isExtension ? 'Extension Masterclass' : 'Lamination Protocol'}
                    </div>
                    <h4 className="text-3xl font-black text-white uppercase tracking-tight leading-none">{activeCourse?.title || 'Magic Lash Practice'}</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                       <span>Training Progress</span>
                       <span className="text-purple-400">68%</span>
                    </div>
                    <div className="w-full h-2 bg-[#0A0C10] rounded-full overflow-hidden border border-white/5">
                       <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all duration-1000" style={{ width: '68%' }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                     <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-600/20 transition-all flex items-center gap-3 active:scale-95">
                        <Play size={14} fill="currentColor" /> {t.continue}
                     </button>
                     <div className="text-left">
                        <p className="text-[9px] font-black text-gray-600 uppercase">{t.nextStep}</p>
                        <p className="text-[11px] font-bold text-gray-300 uppercase">Chemical Balance Analysis</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Quick Stats / Achievements */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 px-4">{t.achievements}</h3>
            <div className="bg-[#12141C] border border-white/5 rounded-[3.5rem] p-10 h-full flex flex-col justify-between shadow-xl">
               <div className="space-y-6">
                  {[
                    { title: 'Fast Learner', date: '2 days ago', icon: Zap, color: 'text-yellow-400' },
                    { title: 'Perfect Quiz', date: 'Last week', icon: CheckCircle2, color: 'text-green-400' },
                    { title: 'InLei® Expert', date: 'Feb 2025', icon: Award, color: 'text-purple-400' }
                  ].map((ach, i) => (
                    <div key={i} className="flex items-center gap-5 group/item">
                       <div className={`w-14 h-14 bg-[#0A0C10] border border-white/5 rounded-2xl flex items-center justify-center ${ach.color} shadow-lg group-hover/item:scale-110 transition-transform`}>
                          <ach.icon size={24} />
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-gray-100 uppercase tracking-widest">{ach.title}</p>
                          <p className="text-[9px] font-bold text-gray-600 uppercase mt-1">{ach.date}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="pt-8 border-t border-white/5 text-center">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0C10] rounded-2xl border border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white hover:border-purple-500/30 transition-all">
                     <Star size={12} className="text-yellow-500" /> Mastery Journey Info
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Featured Discovery Section */}
        <div className="space-y-8">
           <div className="flex items-center gap-4 px-4">
              <Sparkles size={20} className="text-purple-400" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-100">{t.featured}</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recommendations.map(item => (
                <div key={item.id} className="bg-[#12141C] border border-white/5 rounded-[3rem] p-8 shadow-xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                      <item.icon size={80} />
                   </div>
                   <div className="relative z-10 space-y-6">
                      <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <item.icon size={28} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{item.level} Program</span>
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{item.title}</h4>
                      </div>
                      <button className="w-full py-4 bg-[#0A0C10] border border-white/5 hover:border-purple-500/30 text-gray-400 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                        Details <ArrowRight size={14} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Bottom Footer Decor */}
        <div className="flex justify-center pt-10 opacity-20">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">Magic Lash HUB Professional Dashboard</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
