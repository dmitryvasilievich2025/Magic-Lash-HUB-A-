
import React, { useState, useMemo } from 'react';
import { 
  Users, TrendingUp, AlertCircle, Sparkles, ArrowRight, 
  MessageSquare, Layers, DollarSign, Clock, BarChart3, Star, Edit3, Calendar, ShieldCheck, Zap,
  Plus, X, UserPlus, Mail, Phone, Info, Target, ShoppingBag
} from 'lucide-react';
import { Course, Invoice, TabType, Language } from '../types';

interface Props {
  courses: Course[];
  invoices: Invoice[];
  lang: Language;
  onNavigate: (tab: TabType) => void;
  onSetActiveCourse: (id: string) => void;
  onAddInvoice: (inv: Invoice) => void; // Додано для створення інвойсу при реєстрації
}

const SpecialistDashboard: React.FC<Props> = ({ courses, invoices, lang, onNavigate, onSetActiveCourse, onAddInvoice }) => {
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  
  // Стан форми нового учня
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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
        sub: 'Створення облікового запису та фінансової карти',
        firstName: "Ім'я",
        lastName: 'Прізвище',
        email: 'Email (для входу)',
        phone: 'Телефон',
        source: 'Звідки дізнався?',
        sourceOptions: {
          instagram: 'Instagram',
          whatsapp: 'WhatsApp / Viber',
          ads: 'Реклама (FB/IG)',
          referral: 'Рекомендація',
          site: 'Сайт Magic Lash'
        },
        course: 'Вибір напрямку',
        amount: 'Сума першої оплати ($)',
        comments: 'Методологічні нотатки / Коментарі',
        submit: 'Зареєструвати в HUB',
        cancel: 'Скасувати'
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
      addStudent: 'Add Student',
      stats: {
        revenue: 'Monthly Revenue',
        students: 'Active Students',
        debt: 'Outstanding Debt',
        rating: 'HUB Rating'
      },
      modal: {
        title: 'HUB Registration',
        sub: 'Account creation and financial mapping',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email (login)',
        phone: 'Phone',
        source: 'Lead Source',
        sourceOptions: {
          instagram: 'Instagram',
          whatsapp: 'WhatsApp / Viber',
          ads: 'Ads (FB/IG)',
          referral: 'Referral',
          site: 'Magic Lash Site'
        },
        course: 'Select Program',
        amount: 'Initial Payment ($)',
        comments: 'Methodology Notes / Comments',
        submit: 'Register in HUB',
        cancel: 'Cancel'
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
  }[lang]), [lang, courses]);

  const stats = useMemo(() => {
    const revenue = invoices.reduce((a, b) => a + b.paid, 0);
    const debt = invoices.reduce((a, b) => a + (b.total - b.paid), 0);
    const totalStudents = Array.from(new Set(invoices.map(i => i.student))).length;
    return { revenue, debt, totalStudents };
  }, [invoices]);

  const stakeholderData = [
    { name: 'Олена Петренко', course: 'InLei® Lash Filler', ends: '2025-06-01', progress: 95, upsell: 'Magic Lash Geometry' },
    { name: 'Марія Іванова', course: 'Lash Adhesive Master', ends: '2025-05-15', progress: 40, upsell: 'Advanced Speed Tech' },
    { name: 'Анна Сидорчук', course: 'Magic Lash Geometry', ends: '2025-05-20', progress: 100, upsell: 'Business Management' },
  ];

  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCourse = courses.find(c => c.id === newStudent.courseId);
    
    const newInvoice: Invoice = {
      id: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
      student: `${newStudent.firstName} ${newStudent.lastName}`,
      course: selectedCourse?.title || 'Custom Direction',
      total: selectedCourse?.price || Number(newStudent.amount) || 0,
      paid: Number(newStudent.amount) || 0,
      status: Number(newStudent.amount) >= (selectedCourse?.price || 0) ? 'paid' : 'partial',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payments: newStudent.amount ? [{
        id: `p-${Date.now()}`,
        amount: Number(newStudent.amount),
        date: new Date().toISOString().split('T')[0],
        note: `Initial registration via ${newStudent.source}`
      }] : []
    };

    onAddInvoice(newInvoice);
    setIsAddStudentModalOpen(false);
    setNewStudent({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      source: 'instagram',
      courseId: courses[0]?.id || '',
      amount: '',
      comments: ''
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0C10]">
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar animate-in fade-in duration-700">
        <div className="max-w-7xl mx-auto space-y-12 text-left pb-20">
          
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

          <div className="space-y-8">
             <div className="flex items-center justify-between px-4 text-left">
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
                     <div className="flex items-center gap-6 flex-1 min-w-0 text-left">
                        <div className="w-14 h-14 bg-[#0A0C10] rounded-2xl flex items-center justify-center border border-white/5 text-purple-400 font-black shadow-inner">
                          {s.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
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

      {/* MODAL: ADD STUDENT */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
           <div className="bg-[#12141C] w-full max-w-4xl rounded-[4rem] border border-[#1F232B] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300">
              
              <div className="w-full md:w-72 bg-[#0A0C10] p-10 border-r border-[#1F232B] hidden md:flex flex-col text-left">
                 <div className="mb-8">
                    <div className="w-20 h-20 bg-purple-600/10 rounded-[2rem] flex items-center justify-center text-purple-400 shadow-lg mb-6">
                       <UserPlus size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t.modal.title}</h3>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-2">{t.modal.sub}</p>
                 </div>
                 <div className="mt-auto space-y-6">
                    <div className="flex items-center gap-3">
                       <ShieldCheck className="text-green-500" size={16} />
                       <span className="text-[9px] font-black text-gray-500 uppercase">Cloud Sync Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Info className="text-purple-500" size={16} />
                       <span className="text-[9px] font-black text-gray-500 uppercase">AI mapping ready</span>
                    </div>
                 </div>
              </div>

              <div className="flex-1 p-10 overflow-y-auto max-h-[90vh] custom-scrollbar">
                 <div className="flex justify-between items-center mb-10 md:hidden">
                    <h3 className="text-2xl font-black text-white uppercase">{t.modal.title}</h3>
                    <button onClick={() => setIsAddStudentModalOpen(false)} className="text-gray-500"><X size={24} /></button>
                 </div>

                 <form onSubmit={handleRegisterStudent} className="space-y-8 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.firstName}</label>
                          <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newStudent.firstName} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.lastName}</label>
                          <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newStudent.lastName} onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.email}</label>
                          <div className="relative">
                             <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                             <input required type="email" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.phone}</label>
                          <div className="relative">
                             <Phone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                             <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.source}</label>
                          <select className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50 appearance-none" value={newStudent.source} onChange={e => setNewStudent({...newStudent, source: e.target.value})}>
                             {Object.entries(t.modal.sourceOptions).map(([key, val]) => (
                               <option key={key} value={key}>{val}</option>
                             ))}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.course}</label>
                          <select className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50 appearance-none" value={newStudent.courseId} onChange={e => setNewStudent({...newStudent, courseId: e.target.value})}>
                             {courses.map(c => (
                               <option key={c.id} value={c.id}>{c.title}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.amount}</label>
                       <div className="relative">
                          <DollarSign size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-green-500" />
                          <input type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-6 pl-14 pr-8 text-xl font-black text-white outline-none focus:ring-1 ring-green-500/50" placeholder="0.00" value={newStudent.amount} onChange={e => setNewStudent({...newStudent, amount: e.target.value})} />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.comments}</label>
                       <textarea className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-[2rem] py-5 px-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50 h-32 resize-none" value={newStudent.comments} onChange={e => setNewStudent({...newStudent, comments: e.target.value})} />
                    </div>

                    <div className="flex gap-4 pt-4">
                       <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="flex-1 py-5 bg-[#1F232B] text-gray-500 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all hover:text-white">
                         {t.modal.cancel}
                       </button>
                       <button type="submit" className="flex-[2] py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-900/30 transition-all hover:bg-purple-700">
                         {t.modal.submit}
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
