
import React, { useState, useMemo } from 'react';
import { 
  Users, TrendingUp, AlertCircle, Sparkles, ArrowRight, 
  Layers, DollarSign, Clock, BarChart3, Star, Edit3, Calendar, ShieldCheck, Zap,
  Plus, X, UserPlus, Mail, Phone, Info, Target, Instagram, Award, MessageSquare, Briefcase, User
} from 'lucide-react';
import { Course, Invoice, TabType, Language } from '../types';

interface Props {
  courses: Course[];
  invoices: Invoice[];
  lang: Language;
  onNavigate: (tab: TabType) => void;
  onSetActiveCourse: (id: string) => void;
  onAddInvoice: (inv: Invoice) => void;
}

const SpecialistDashboard: React.FC<Props> = ({ courses, invoices, lang, onNavigate, onSetActiveCourse, onAddInvoice }) => {
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  
  // Початковий стан форми нового учня
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    instagram: '',
    level: 'beginner',
    source: 'instagram',
    courseId: courses[0]?.id || '',
    amount: '',
    comments: ''
  });

  const t = useMemo(() => ({
    uk: {
      badge: 'Професійний HUB Управління',
      title: 'МАЙСТЕРНЯ РОЗВИТКУ',
      subtitle: 'Управляйте своїми напрямками, відстежуйте успіхи студентів та контролюйте фінансові потоки в реальному часі.',
      addStudent: 'Додати учня',
      stats: {
        revenue: 'Каса (Місяць)',
        students: 'Активні Студенти',
        debt: 'Заборгованість',
        rating: 'Рейтинг HUB'
      },
      modal: {
        title: 'Реєстрація у HUB',
        sub: 'Створення профілю студента та фінансової карти',
        firstName: "Ім'я",
        lastName: 'Прізвище',
        email: 'Email (login)',
        phone: 'Телефон',
        instagram: 'Instagram @handle',
        level: 'Рівень майстерності',
        levels: {
          beginner: 'Beginner (Новачок)',
          intermediate: 'Intermediate (Майстер)',
          pro: 'Pro (Топ-стиліст)'
        },
        source: 'Звідки дізнався?',
        sourceOptions: {
          instagram: 'Instagram',
          whatsapp: 'WhatsApp / Messengers',
          ads: 'Реклама (FB/IG)',
          referral: 'Рекомендація / Реферал',
          site: 'Сайт / Пошук'
        },
        course: 'Призначений курс',
        amount: 'Сума оплати ($)',
        comments: 'Професійні коментарі / Нотатки',
        submit: 'Зареєструвати учня',
        cancel: 'Скасувати'
      },
      coursesTitle: 'Активні Напрямки',
      financeTitle: 'Останні активності',
      edit: 'Керувати'
    },
    en: {
      badge: 'Professional Management HUB',
      title: 'MASTERY WORKSHOP',
      subtitle: 'Manage your programs, track student success, and control financial flows.',
      addStudent: 'Add Student',
      stats: {
        revenue: 'Monthly Revenue',
        students: 'Active Students',
        debt: 'Total Debt',
        rating: 'HUB Rating'
      },
      modal: {
        title: 'HUB Registration',
        sub: 'Student profile and finance mapping',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email (login)',
        phone: 'Phone',
        instagram: 'Instagram @handle',
        level: 'Mastery Level',
        levels: {
          beginner: 'Beginner',
          intermediate: 'Intermediate',
          pro: 'Pro Artist'
        },
        source: 'Lead Source',
        sourceOptions: {
          instagram: 'Instagram',
          whatsapp: 'WhatsApp / Messengers',
          ads: 'Ads (FB/IG)',
          referral: 'Referral',
          site: 'Website / Search'
        },
        course: 'Assigned Course',
        amount: 'Payment Amount ($)',
        comments: 'Professional Comments',
        submit: 'Register Student',
        cancel: 'Cancel'
      },
      coursesTitle: 'Active Programs',
      financeTitle: 'Recent Activity',
      edit: 'Manage'
    }
  }[lang]), [lang, courses]);

  // Розрахунок статистики для дашборду
  const statsSummary = useMemo(() => {
    const revenue = invoices.reduce((a, b) => a + b.paid, 0);
    const debt = invoices.reduce((a, b) => a + (b.total - b.paid), 0);
    const uniqueStudents = Array.from(new Set(invoices.map(i => i.student))).length;
    return { revenue, debt, uniqueStudents };
  }, [invoices]);

  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCourse = courses.find(c => c.id === newStudent.courseId);
    
    // Створення інвойсу на основі даних форми
    const newInvoice: Invoice = {
      id: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
      student: `${newStudent.firstName} ${newStudent.lastName}`,
      course: selectedCourse?.title || 'Custom Direction',
      total: selectedCourse?.price || Number(newStudent.amount) || 0,
      paid: Number(newStudent.amount) || 0,
      status: Number(newStudent.amount) >= (selectedCourse?.price || 0) ? 'paid' : 'partial',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payments: newStudent.amount ? [{
        id: `p-${Date.now()}`,
        amount: Number(newStudent.amount),
        date: new Date().toISOString().split('T')[0],
        note: `Registration: ${newStudent.level} | Source: ${newStudent.source}`
      }] : []
    };

    onAddInvoice(newInvoice);
    setIsAddStudentModalOpen(false);
    
    // Скидання форми
    setNewStudent({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      instagram: '',
      level: 'beginner',
      source: 'instagram',
      courseId: courses[0]?.id || '',
      amount: '',
      comments: ''
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0C10] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar animate-in fade-in duration-700">
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
            <div className="text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                <Layers size={12} /> {t.badge}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-gray-100 tracking-tighter uppercase">{t.title}</h1>
              <p className="text-gray-400 max-w-xl font-medium">{t.subtitle}</p>
            </div>
            <button 
              onClick={() => setIsAddStudentModalOpen(true)}
              className="px-10 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-purple-900/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
            >
              <UserPlus size={20} /> {t.addStudent}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl text-left">
              <TrendingUp className="text-green-500" size={24} />
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t.stats.revenue}</p>
              <h4 className="text-4xl font-black text-gray-100 tracking-tight">${statsSummary.revenue.toLocaleString()}</h4>
            </div>
            <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl text-left">
              <Users className="text-blue-500" size={24} />
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t.stats.students}</p>
              <h4 className="text-4xl font-black text-gray-100 tracking-tight">{statsSummary.uniqueStudents}</h4>
            </div>
            <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl text-left">
              <AlertCircle className="text-red-500" size={24} />
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t.stats.debt}</p>
              <h4 className="text-4xl font-black text-red-400 tracking-tight">${statsSummary.debt.toLocaleString()}</h4>
            </div>
            <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl text-left">
              <Star className="text-yellow-500" size={24} />
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t.stats.rating}</p>
              <h4 className="text-4xl font-black text-gray-100 tracking-tight">4.98</h4>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {courses.map(course => (
               <div key={course.id} className="bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] overflow-hidden group flex hover:border-white/10 transition-all shadow-xl">
                  <div className="w-48 h-full bg-black relative shrink-0">
                     <img src={course.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt="" />
                     <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
                  </div>
                  <div className="p-8 flex-1 flex flex-col justify-between text-left relative z-10">
                     <div>
                        <h4 className="text-xl font-black text-white uppercase mb-2 group-hover:text-orange-400 transition-colors">{course.title}</h4>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{course.studentCount || 0} учнів зареєстровано</p>
                     </div>
                     <button 
                        onClick={() => { onSetActiveCourse(course.id); onNavigate('courses-admin'); }}
                        className="mt-6 flex items-center justify-between w-full p-4 bg-[#0A0C10] rounded-2xl border border-[#1F232B] text-[10px] font-black uppercase text-gray-400 group-hover:text-white group-hover:border-purple-500/30 transition-all"
                     >
                        {t.edit} <ArrowRight size={14} />
                     </button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* MODAL: ADD STUDENT */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
           <div className="bg-[#12141C] w-full max-w-5xl rounded-[4rem] border border-[#1F232B] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300">
              
              <div className="w-full md:w-80 bg-[#0A0C10] p-10 border-r border-[#1F232B] hidden md:flex flex-col text-left">
                 <div className="mb-8">
                    <div className="w-20 h-20 bg-purple-600/10 rounded-[2rem] flex items-center justify-center text-purple-400 shadow-lg mb-6">
                       <UserPlus size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{t.modal.title}</h3>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-3">{t.modal.sub}</p>
                 </div>
                 <div className="space-y-4 mt-auto">
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                       <p className="text-[8px] font-black text-gray-500 uppercase mb-2">Security Protocol</p>
                       <p className="text-[10px] font-bold text-green-400 uppercase flex items-center gap-2">
                          <ShieldCheck size={14} /> Cloud Storage Active
                       </p>
                    </div>
                 </div>
              </div>

              <div className="flex-1 p-10 overflow-y-auto max-h-[90vh] custom-scrollbar">
                 <div className="flex justify-between items-center mb-10 md:hidden">
                    <h3 className="text-2xl font-black text-white uppercase">{t.modal.title}</h3>
                    <button onClick={() => setIsAddStudentModalOpen(false)} className="text-gray-500"><X size={28} /></button>
                 </div>

                 <form onSubmit={handleRegisterStudent} className="space-y-8 text-left">
                    {/* Прізвище та Ім'я */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.modal.firstName}</label>
                          <div className="relative">
                             <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                             <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newStudent.firstName} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} placeholder="Maria" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.modal.lastName}</label>
                          <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newStudent.lastName} onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} placeholder="Ivanova" />
                       </div>
                    </div>

                    {/* Email та Телефон */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.modal.email}</label>
                          <div className="relative">
                             <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                             <input required type="email" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} placeholder="student@example.com" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.modal.phone}</label>
                          <div className="relative">
                             <Phone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                             <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} placeholder="+380..." />
                          </div>
                       </div>
                    </div>

                    {/* Instagram та Рівень */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.modal.instagram}</label>
                          <div className="relative">
                             <Instagram size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                             <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newStudent.instagram} onChange={e => setNewStudent({...newStudent, instagram: e.target.value})} placeholder="@username" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.modal.level}</label>
                          <div className="relative">
                             <Award size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                             <select className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50 appearance-none" value={newStudent.level} onChange={e => setNewStudent({...newStudent, level: e.target.value})}>
                                {Object.entries(t.modal.levels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                             </select>
                          </div>
                       </div>
                    </div>

                    {/* Джерело та Курс */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.modal.source}</label>
                          <div className="relative">
                             <Target size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                             <select className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50 appearance-none" value={newStudent.source} onChange={e => setNewStudent({...newStudent, source: e.target.value})}>
                                {Object.entries(t.modal.sourceOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                             </select>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.modal.course}</label>
                          <div className="relative">
                             <Briefcase size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                             <select className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50 appearance-none" value={newStudent.courseId} onChange={e => setNewStudent({...newStudent, courseId: e.target.value})}>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                             </select>
                          </div>
                       </div>
                    </div>

                    {/* Сума оплати */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.modal.amount}</label>
                       <div className="relative">
                          <DollarSign size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-green-500" />
                          <input type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-7 pl-16 pr-8 text-2xl font-black text-white outline-none focus:ring-1 ring-green-500/50 shadow-inner" value={newStudent.amount} onChange={e => setNewStudent({...newStudent, amount: e.target.value})} placeholder="0.00" />
                       </div>
                    </div>

                    {/* Коментарі */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.modal.comments}</label>
                       <div className="relative">
                          <MessageSquare size={16} className="absolute left-6 top-8 text-gray-600" />
                          <textarea className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-6 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50 h-32 resize-none transition-all" value={newStudent.comments} onChange={e => setNewStudent({...newStudent, comments: e.target.value})} placeholder="Додаткові деталі про студента, побажання або технічні нотатки..." />
                       </div>
                    </div>

                    {/* Кнопки дії */}
                    <div className="flex gap-4 pt-6">
                       <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="flex-1 py-6 bg-[#1F232B] text-gray-500 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">
                          {t.modal.cancel}
                       </button>
                       <button type="submit" className="flex-[2] py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-900/40 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                          <Zap size={16} /> {t.modal.submit}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SpecialistDashboard;
