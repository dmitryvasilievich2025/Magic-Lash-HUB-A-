
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, TrendingUp, AlertCircle, ArrowRight, 
  Layers, DollarSign, Star, ShieldCheck, Zap,
  X, UserPlus, Mail, Phone, Target, Instagram, Award, MessageSquare, Briefcase, User,
  Search, ChevronDown, Calculator, Check, Plus, BookOpen, Image as ImageIcon, Loader2, Hash, Link, HelpCircle
} from 'lucide-react';
import { Course, Invoice, TabType, Language } from '../types';
import { saveCourseToDB } from '../services/firebase';

interface Props {
  courses: Course[];
  invoices: Invoice[];
  lang: Language;
  isLoading?: boolean;
  onNavigate: (tab: TabType) => void;
  onSetActiveCourse: (id: string | null) => void;
  onAddInvoice: (inv: Invoice) => void;
}

const SpecialistDashboard: React.FC<Props> = ({ courses, invoices, lang, isLoading = false, onNavigate, onSetActiveCourse, onAddInvoice }) => {
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    course: 'all'
  });
  
  const t = useMemo(() => ({
    uk: {
      badge: 'Професійний HUB Управління',
      title: 'МАЙСТЕРНЯ РОЗВИТКУ',
      subtitle: 'Управляйте своїми напрямками та контролюйте фінансові потоки в реальному часі.',
      addStudent: 'Додати учня',
      addCourse: 'Створити Програму',
      stats: { revenue: 'Каса (Місяць)', students: 'Активні Студенти', debt: 'Заборгованість', rating: 'Рейтинг HUB' },
      registry: { title: 'Реєстр Студентів', filters: { searchPlaceholder: 'Пошук за ім\'ям...', allCourses: 'Всі напрямки' }, table: { student: 'Студент', contacts: 'Контакти', course: 'Напрямок', status: 'Статус' } },
      coursesTitle: 'Активні Напрямки',
      edit: 'Керувати'
    }
  }[lang] || { uk: {} }), [lang]);

  const statsSummary = useMemo(() => {
    const revenue = invoices.reduce((a, b) => a + (b.paid || 0), 0);
    const debt = invoices.reduce((a, b) => a + ((b.total || 0) - (b.paid || 0)), 0);
    const uniqueStudents = Array.from(new Set(invoices.map(i => i.student))).length;
    return { revenue, debt, uniqueStudents };
  }, [invoices]);

  const handleCreateProgram = async () => {
    const newCourse: Course = {
      id: `c-${Date.now()}`,
      title: 'Lash Mastery Course',
      description: 'Learn advanced lash techniques from the best.',
      sections: [],
      price: 500,
      currency: 'USD',
      image: 'https://images.unsplash.com/photo-1558704161-05002f70a220?auto=format&fit=crop&q=80&w=1000',
      isPublished: false,
      studentCount: 0
    };
    await saveCourseToDB(newCourse);
    onSetActiveCourse(newCourse.id);
    onNavigate('courses-admin');
  };

  const filteredStudents = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      const nameMatch = (inv.student || '').toLowerCase().includes(filters.search.toLowerCase());
      const courseMatch = filters.course === 'all' || inv.course === filters.course;
      return nameMatch && courseMatch;
    });
  }, [invoices, filters]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0C10] overflow-hidden text-left">
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar animate-in fade-in duration-700">
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20"><Layers size={12} /> {t.badge}</div>
              <h1 className="text-5xl md:text-7xl font-black text-gray-100 tracking-tighter uppercase">{t.title}</h1>
              <p className="text-gray-400 max-w-xl font-medium">{t.subtitle}</p>
            </div>
            <div className="flex gap-4">
               <button onClick={handleCreateProgram} className="px-10 py-6 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-white/10 transition-all flex items-center gap-4"><Plus size={20} /> {t.addCourse}</button>
               <button onClick={() => setIsAddStudentModalOpen(true)} className="px-10 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-105 transition-all flex items-center gap-4"><UserPlus size={20} /> {t.addStudent}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, label: t.stats.revenue, value: `$${statsSummary.revenue.toLocaleString()}`, color: 'text-green-500' },
              { icon: Users, label: t.stats.students, value: statsSummary.uniqueStudents, color: 'text-blue-500' },
              { icon: AlertCircle, label: t.stats.debt, value: `$${statsSummary.debt.toLocaleString()}`, color: 'text-red-500' },
              { icon: Star, label: t.stats.rating, value: '4.98', color: 'text-yellow-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl">
                <stat.icon className={stat.color} size={24} />
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{stat.label}</p>
                <h4 className="text-4xl font-black text-gray-100 tracking-tight">{isLoading ? '...' : stat.value}</h4>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2"><Users size={16} /> {t.registry.title}</h3>
              <div className="relative w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input className="w-full bg-[#12141C] border border-[#1F232B] rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-white outline-none" placeholder={t.registry.filters.searchPlaceholder} value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
              </div>
            </div>
            <div className="bg-[#12141C] rounded-[2.5rem] border border-[#1F232B] overflow-hidden shadow-xl min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0A0C10]"><tr className="text-[9px] font-black uppercase text-gray-500 tracking-widest border-b border-[#1F232B]"><th className="px-8 py-5">{t.registry.table.student}</th><th className="px-8 py-5">{t.registry.table.contacts}</th><th className="px-8 py-5">{t.registry.table.course}</th><th className="px-8 py-5 text-center">{t.registry.table.status}</th></tr></thead>
                <tbody className="divide-y divide-[#1F232B]">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-8 py-20 text-center"><Loader2 className="animate-spin text-purple-500 mx-auto" /></td></tr>
                  ) : filteredStudents.length > 0 ? filteredStudents.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/5 transition-all group">
                       <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 border border-white/5"><User size={16} /></div><div><p className="text-xs font-black text-gray-200">{inv.student}</p></div></div></td>
                       <td className="px-8 py-5 text-[10px] text-gray-400"><Mail size={10} className="inline mr-2" /> {inv.studentEmail || '-'}</td>
                       <td className="px-8 py-5"><span className="text-[10px] font-black uppercase text-gray-300">{inv.course}</span></td>
                       <td className="px-8 py-5 text-center"><span className={`inline-block w-2.5 h-2.5 rounded-full ${inv.status === 'paid' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`} /></td>
                    </tr>
                  )) : <tr><td colSpan={4} className="px-8 py-20 text-center opacity-30 text-xs font-black uppercase tracking-widest">Студентів не знайдено</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-12 mb-6"><h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2"><Briefcase size={16} /> {t.coursesTitle}</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {courses.map(course => (
               <div key={course.id} className="bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] overflow-hidden group flex hover:border-white/10 transition-all shadow-xl text-left">
                  <div className="w-48 h-full bg-black shrink-0"><img src={course.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt="" /></div>
                  <div className="p-8 flex-1 flex flex-col justify-between text-left relative z-10">
                     <div><h4 className="text-xl font-black text-white uppercase mb-2 group-hover:text-orange-400 transition-colors">{course.title}</h4><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{course.studentCount || 0} учнів</p></div>
                     <button onClick={() => { onSetActiveCourse(course.id); onNavigate('courses-admin'); }} className="mt-6 flex items-center justify-between w-full p-4 bg-[#0A0C10] rounded-2xl border border-[#1F232B] text-[10px] font-black uppercase text-gray-400 group-hover:text-white group-hover:border-purple-500/30 transition-all">{t.edit} <ArrowRight size={14} /></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistDashboard;
