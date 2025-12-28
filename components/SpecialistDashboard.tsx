
import React, { useMemo } from 'react';
import { 
  Users, TrendingUp, AlertCircle, Sparkles, ArrowRight, 
  MessageSquare, Layers, DollarSign, Clock, BarChart3, Star, Edit3, Calendar, ShieldCheck, Zap
} from 'lucide-react';
import { Course, Invoice, TabType, Language } from '../types';

interface Props {
  courses: Course[];
  invoices: Invoice[];
  lang: Language;
  onNavigate: (tab: TabType) => void;
  onSetActiveCourse: (id: string) => void;
}

const SpecialistDashboard: React.FC<Props> = ({ courses, invoices, lang, onNavigate, onSetActiveCourse }) => {
  const t = useMemo(() => ({
    uk: {
      badge: 'Професійний HUB Управління',
      title: 'МАЙСТЕРНЯ РОЗВИТКУ',
      subtitle: 'Управляйте своїми напрямками, відстежуйте успіхи студентів та контролюйте фінансові потоки в реальному часі.',
      stats: {
        revenue: 'Каса (Місяць)',
        students: 'Активні Студенти',
        debt: 'Заборгованість',
        rating: 'Рейтинг HUB'
      },
      ariBanner: {
        title: 'ARI Стратег активована',
        sub: 'Проаналізувала 12 сесій. Студенти часто помиляються на 3-му кроці Lash Filler. Рекомендую оновити AI Prompt.',
        btn: 'Оновити методику'
      },
      calendar: {
        title: 'Календар Стейкхолдера',
        sub: 'Моніторинг доступів та стратегія Upsell',
        student: 'Студент',
        access: 'Кінець доступу',
        nextLevel: 'Пропозиція Upsell',
        upsellBtn: 'Надіслати пропозицію через ARI'
      },
      coursesTitle: 'Мої Напрямки',
      financeTitle: 'Останні активності студентів',
      edit: 'Керувати',
      viewAll: 'Всі транзакції'
    },
    en: {
      badge: 'Professional Management HUB',
      title: 'MASTERY WORKSHOP',
      subtitle: 'Manage your programs, track student success, and control financial flows in real-time.',
      stats: {
        revenue: 'Monthly Revenue',
        students: 'Active Students',
        debt: 'Outstanding Debt',
        rating: 'HUB Rating'
      },
      ariBanner: {
        title: 'ARI Strategist Activated',
        sub: 'Analyzed 12 sessions. Students often fail at step 3 of Lash Filler. Recommended to update AI Prompt.',
        btn: 'Update Methodology'
      },
      calendar: {
        title: 'Stakeholder Calendar',
        sub: 'Access monitoring and Upsell strategy',
        student: 'Student',
        access: 'Access Ends',
        nextLevel: 'Upsell Offer',
        upsellBtn: 'Send Proposal via ARI'
      },
      coursesTitle: 'My Programs',
      financeTitle: 'Recent Student Activity',
      edit: 'Manage',
      viewAll: 'All Transactions'
    }
  }[lang]), [lang]);

  const stats = useMemo(() => {
    const revenue = invoices.reduce((a, b) => a + b.paid, 0);
    const debt = invoices.reduce((a, b) => a + (b.total - b.paid), 0);
    const totalStudents = Array.from(new Set(invoices.map(i => i.student))).length;
    return { revenue, debt, totalStudents };
  }, [invoices]);

  // Mock data for access monitoring
  const stakeholderData = [
    { name: 'Олена Петренко', course: 'InLei® Lash Filler', ends: '2025-06-01', progress: 95, upsell: 'Magic Lash Geometry' },
    { name: 'Марія Іванова', course: 'Lash Adhesive Master', ends: '2025-05-15', progress: 40, upsell: 'Advanced Speed Tech' },
    { name: 'Анна Сидорчук', course: 'Magic Lash Geometry', ends: '2025-05-20', progress: 100, upsell: 'Business Management' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0C10] p-10 custom-scrollbar animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-12 text-left">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
            <Layers size={12} /> {t.badge}
          </div>
          <h1 className="text-7xl md:text-8xl font-black text-gray-100 tracking-tighter uppercase">{t.title}</h1>
          <p className="text-gray-400 max-w-2xl mx-auto font-medium">{t.subtitle}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl">
            <TrendingUp className="text-green-500" size={24} />
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t.stats.revenue}</p>
            <h4 className="text-4xl font-black text-gray-100 tracking-tight">${stats.revenue.toLocaleString()}</h4>
          </div>
          <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl">
            <Users className="text-blue-500" size={24} />
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t.stats.students}</p>
            <h4 className="text-4xl font-black text-gray-100 tracking-tight">{stats.totalStudents}</h4>
          </div>
          <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl">
            <AlertCircle className="text-red-500" size={24} />
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t.stats.debt}</p>
            <h4 className="text-4xl font-black text-red-400 tracking-tight">${stats.debt.toLocaleString()}</h4>
          </div>
          <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl">
            <Star className="text-yellow-500" size={24} />
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t.stats.rating}</p>
            <h4 className="text-4xl font-black text-gray-100 tracking-tight">4.98</h4>
          </div>
        </div>

        {/* Stakeholder Calendar Section */}
        <div className="space-y-8">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <Calendar className="text-purple-400" size={20} />
                 <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-100 leading-none">{t.calendar.title}</h3>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{t.calendar.sub}</p>
                 </div>
              </div>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
              {stakeholderData.map((s, i) => (
                <div key={i} className="bg-[#12141C] rounded-[2.5rem] border border-[#1F232B] p-8 flex flex-col lg:flex-row items-center justify-between gap-8 group hover:border-purple-500/30 transition-all">
                   <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className="w-14 h-14 bg-[#0A0C10] rounded-2xl flex items-center justify-center border border-white/5 text-purple-400 font-black shadow-inner">
                        {s.name.charAt(0)}
                      </div>
                      <div className="text-left min-w-0">
                        <h4 className="text-sm font-black text-white uppercase truncate">{s.name}</h4>
                        <p className="text-[10px] font-bold text-gray-500 truncate">{s.course}</p>
                      </div>
                   </div>

                   <div className="flex-1 w-full lg:w-auto px-6">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{lang === 'uk' ? 'Прогрес' : 'Progress'}</span>
                         <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{s.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[#0A0C10] rounded-full overflow-hidden border border-white/5">
                         <div className="h-full bg-purple-600 rounded-full" style={{ width: `${s.progress}%` }} />
                      </div>
                   </div>

                   <div className="flex-1 text-left lg:text-center">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">{t.calendar.access}</p>
                      <div className="flex items-center justify-center gap-2 text-xs font-black text-gray-300">
                        <Clock size={12} className="text-orange-500" />
                        {s.ends}
                      </div>
                   </div>

                   <div className="flex-1 text-left lg:text-right flex flex-col items-start lg:items-end gap-3">
                      <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl">
                         <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-0.5">{t.calendar.nextLevel}</p>
                         <p className="text-[10px] font-black text-white uppercase">{s.upsell}</p>
                      </div>
                      <button className="flex items-center gap-2 text-[9px] font-black text-purple-500 uppercase hover:text-white transition-all">
                        {t.calendar.upsellBtn} <Zap size={10} fill="currentColor" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* ARI Strategist Banner */}
        <div className="bg-gradient-to-r from-purple-900/40 to-[#12141C] border border-purple-500/20 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-600/20 transition-all duration-1000" />
           <div className="flex items-center gap-8 relative z-10 text-left">
              <div className="w-20 h-20 bg-purple-600/20 rounded-[2.5rem] flex items-center justify-center border border-purple-500/30 text-purple-400 shadow-lg">
                <Sparkles size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t.ariBanner.title}</h3>
                 <p className="text-gray-400 font-medium max-w-xl">{t.ariBanner.sub}</p>
              </div>
           </div>
           <button 
             onClick={() => onNavigate('courses-admin')}
             className="px-8 py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-purple-600/20 transition-all flex items-center gap-3 relative z-10 whitespace-nowrap"
           >
             {t.ariBanner.btn} <Edit3 size={18} />
           </button>
        </div>

        {/* My Courses Section */}
        <div className="space-y-8">
           <div className="flex items-center justify-between px-4 text-left">
              <div className="flex items-center gap-3">
                 <BarChart3 className="text-orange-400" size={20} />
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-100">{t.coursesTitle}</h3>
              </div>
              <button onClick={() => onNavigate('courses-admin')} className="text-[9px] font-black uppercase text-orange-400 hover:text-white transition-all">Додати новий +</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courses.map(course => (
                <div key={course.id} className="bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] overflow-hidden group flex hover:border-white/10 transition-all shadow-xl">
                   <div className="w-48 h-full bg-black relative shrink-0">
                      <img src={course.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt="" />
                      {course.isExtensionCourse ? (
                        <div className="absolute top-4 left-4 px-3 py-1 bg-purple-600 text-[8px] font-black uppercase rounded-lg">Magic Lash</div>
                      ) : (
                        <div className="absolute top-4 left-4 px-3 py-1 bg-yellow-600 text-[8px] font-black uppercase rounded-lg">InLei®</div>
                      )}
                   </div>
                   <div className="p-8 flex-1 flex flex-col justify-between text-left">
                      <div>
                        <h4 className="text-xl font-black text-white uppercase mb-2 group-hover:text-orange-400 transition-colors">{course.title}</h4>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2">
                              <Users size={12} className="text-gray-600" />
                              <span className="text-[10px] font-black text-gray-500">{course.studentCount} учнів</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <DollarSign size={12} className="text-gray-600" />
                              <span className="text-[10px] font-black text-gray-500">${course.price}</span>
                           </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => { onSetActiveCourse(course.id); onNavigate('courses-admin'); }}
                        className="mt-6 flex items-center justify-between w-full p-4 bg-[#0A0C10] rounded-2xl border border-[#1F232B] text-[10px] font-black uppercase text-gray-400 group-hover:text-white group-hover:border-orange-500/30 transition-all"
                      >
                         {t.edit} <ArrowRight size={14} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Student Activity Section */}
        <div className="space-y-8">
           <div className="flex items-center justify-between px-4 text-left">
              <div className="flex items-center gap-3">
                 <DollarSign className="text-green-400" size={20} />
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-100">{t.financeTitle}</h3>
              </div>
              <button onClick={() => onNavigate('finance')} className="text-[9px] font-black uppercase text-green-400 hover:text-white transition-all">{t.viewAll}</button>
           </div>
           <div className="bg-[#12141C] rounded-[3rem] border border-[#1F232B] overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                 <thead className="bg-[#0A0C10]">
                    <tr>
                       <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">Студент</th>
                       <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">Напрямок</th>
                       <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">Борг</th>
                       <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest text-right pr-12">Статус</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#1F232B]">
                    {invoices.slice(0, 5).map(inv => (
                      <tr key={inv.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onNavigate('finance')}>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-purple-600/10 rounded-lg flex items-center justify-center text-[10px] font-black text-purple-400">{inv.student.charAt(0)}</div>
                              <span className="text-xs font-black text-gray-200">{inv.student}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-xs font-bold text-gray-500">{inv.course}</td>
                        <td className="px-10 py-6 text-xs font-black text-red-400">${inv.total - inv.paid}</td>
                        <td className="px-10 py-6 text-right pr-12">
                           <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${inv.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {inv.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SpecialistDashboard;
