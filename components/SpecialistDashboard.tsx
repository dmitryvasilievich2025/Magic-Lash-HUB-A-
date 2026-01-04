import React, { useState, useMemo } from 'react';
import { 
  Users, TrendingUp, AlertCircle, ArrowRight, 
  Layers, DollarSign, Star, ShieldCheck, Zap,
  X, UserPlus, Mail, Phone, Target, Instagram, Award, MessageSquare, Briefcase, User,
  Search, ChevronDown, Calculator, Check, Plus, BookOpen, Image as ImageIcon
} from 'lucide-react';
import { Course, Invoice, TabType, Language } from '../types';
import { saveCourseToDB } from '../services/firebase';

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
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  
  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    level: 'all',
    source: 'all',
    course: 'all'
  });
  
  // Початковий стан форми нового учня
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    instagram: '',
    level: 'beginner',
    source: 'instagram',
    courseId: courses.length > 0 ? courses[0].id : '',
    amount: '',
    comments: ''
  });

  // New Course Form State
  const [newCourseForm, setNewCourseForm] = useState({
    title: '',
    description: '',
    price: '',
    image: '',
    isExtension: 'false' // 'true' for Extension, 'false' for Lamination
  });

  const t = useMemo(() => ({
    uk: {
      badge: 'Професійний HUB Управління',
      title: 'МАЙСТЕРНЯ РОЗВИТКУ',
      subtitle: 'Управляйте своїми напрямками, відстежуйте успіхи студентів та контролюйте фінансові потоки в реальному часі.',
      addStudent: 'Додати учня',
      addCourse: 'Створити Курс',
      stats: {
        revenue: 'Каса (Місяць)',
        students: 'Активні Студенти',
        debt: 'Заборгованість',
        rating: 'Рейтинг HUB'
      },
      registry: {
        title: 'Реєстр Студентів',
        filters: {
          searchPlaceholder: 'Пошук за ім\'ям, поштою...',
          allLevels: 'Всі рівні',
          allSources: 'Всі джерела',
          allCourses: 'Всі напрямки'
        },
        table: {
          student: 'Студент',
          contacts: 'Контакти',
          course: 'Напрямок',
          level: 'Рівень',
          source: 'Джерело',
          status: 'Статус'
        }
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
      courseModal: {
        title: 'Новий Напрямок',
        sub: 'Конфігурація освітнього продукту',
        name: 'Назва Курсу',
        desc: 'Опис (Маркетинг)',
        price: 'Вартість ($)',
        image: 'URL Обкладинки',
        type: 'Тип Курсу',
        types: {
            lamination: 'Ламінування (Lamination)',
            extension: 'Нарощування (Extension)'
        },
        submit: 'Створити Курс'
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
      addCourse: 'Create Course',
      stats: {
        revenue: 'Monthly Revenue',
        students: 'Active Students',
        debt: 'Total Debt',
        rating: 'HUB Rating'
      },
      registry: {
        title: 'Student Registry',
        filters: {
          searchPlaceholder: 'Search by name, email...',
          allLevels: 'All Levels',
          allSources: 'All Sources',
          allCourses: 'All Courses'
        },
        table: {
          student: 'Student',
          contacts: 'Contacts',
          course: 'Program',
          level: 'Level',
          source: 'Source',
          status: 'Status'
        }
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
      courseModal: {
        title: 'New Program',
        sub: 'Educational product configuration',
        name: 'Course Title',
        desc: 'Description (Marketing)',
        price: 'Price ($)',
        image: 'Cover Image URL',
        type: 'Course Type',
        types: {
            lamination: 'Lamination',
            extension: 'Extension'
        },
        submit: 'Create Course'
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

  // Calculations for Modal Summary
  const selectedCourseForModal = courses.find(c => c.id === newStudent.courseId);
  const modalCoursePrice = selectedCourseForModal?.price || 0;
  const modalEnteredAmount = Number(newStudent.amount) || 0;
  const modalRemaining = Math.max(0, modalCoursePrice - modalEnteredAmount);
  const isPaidFull = modalEnteredAmount >= modalCoursePrice && modalCoursePrice > 0;

  // Helper to extract metadata from invoice payment notes (simulating DB fields)
  const getInvoiceMeta = (inv: Invoice) => {
    const note = inv.payments[0]?.note || '';
    const levelMatch = note.match(/Registration:\s*([a-zA-Z0-9]+)/);
    const sourceMatch = note.match(/Source:\s*([a-zA-Z0-9]+)/);
    
    return {
      level: levelMatch ? levelMatch[1] : 'beginner',
      source: sourceMatch ? sourceMatch[1] : 'instagram'
    };
  };

  const filteredStudents = useMemo(() => {
    return invoices.filter(inv => {
      const meta = getInvoiceMeta(inv);
      
      const matchSearch = 
        inv.student.toLowerCase().includes(filters.search.toLowerCase()) || 
        (inv.studentEmail || '').toLowerCase().includes(filters.search.toLowerCase());
      
      const matchLevel = filters.level === 'all' || meta.level === filters.level;
      const matchSource = filters.source === 'all' || meta.source === filters.source;
      const matchCourse = filters.course === 'all' || inv.course === filters.course;

      return matchSearch && matchLevel && matchSource && matchCourse;
    });
  }, [invoices, filters]);

  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCourse = courses.find(c => c.id === newStudent.courseId);
    
    const paidAmount = Number(newStudent.amount) || 0;
    const totalAmount = selectedCourse?.price || paidAmount || 0;
    
    let status: Invoice['status'] = 'unpaid';
    if (paidAmount >= totalAmount && totalAmount > 0) status = 'paid';
    else if (paidAmount > 0) status = 'partial';
    
    // Створення інвойсу на основі даних форми
    const newInvoice: Invoice = {
      id: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
      student: `${newStudent.firstName} ${newStudent.lastName}`,
      // Note: We don't set studentId here because a manually added student 
      // doesn't have a UID yet. It will be linked when they register/claim.
      studentEmail: newStudent.email,
      studentPhone: newStudent.phone,
      studentInstagram: newStudent.instagram,
      course: selectedCourse?.title || 'Custom Direction',
      total: totalAmount,
      paid: paidAmount,
      status: status,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payments: paidAmount > 0 ? [{
        id: `p-${Date.now()}`,
        amount: paidAmount,
        date: new Date().toISOString().split('T')[0],
        note: `Registration: ${newStudent.level} | Source: ${newStudent.source} | ${newStudent.comments}`
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

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCourse: Course = {
      id: `c-${Date.now()}`,
      title: newCourseForm.title,
      description: newCourseForm.description,
      price: Number(newCourseForm.price),
      currency: 'USD',
      image: newCourseForm.image || 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800',
      isExtensionCourse: newCourseForm.isExtension === 'true',
      isPublished: true, // Default to true so guests can see it immediately
      sections: [],
      studentCount: 0
    };

    try {
      await saveCourseToDB(newCourse);
      setIsAddCourseModalOpen(false);
      setNewCourseForm({
        title: '',
        description: '',
        price: '',
        image: '',
        isExtension: 'false'
      });
      // Automatically navigate to the new course editor
      onSetActiveCourse(newCourse.id);
      onNavigate('courses-admin');
    } catch (error) {
      console.error("Failed to create course", error);
      alert("Error creating course");
    }
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

          {/* STUDENT REGISTRY & FILTERS */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2 self-start md:self-auto">
                 <Users size={16} /> {t.registry.title}
               </h3>
               
               <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                     <input 
                       className="w-full bg-[#12141C] border border-[#1F232B] rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-purple-500/50" 
                       placeholder={t.registry.filters.searchPlaceholder}
                       value={filters.search}
                       onChange={e => setFilters({...filters, search: e.target.value})}
                     />
                  </div>
                  
                  {/* Filter: Level */}
                  <div className="relative">
                     <select 
                       className="appearance-none bg-[#12141C] border border-[#1F232B] rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-gray-400 focus:text-white focus:border-purple-500/50 outline-none cursor-pointer"
                       value={filters.level}
                       onChange={e => setFilters({...filters, level: e.target.value})}
                     >
                       <option value="all">{t.registry.filters.allLevels}</option>
                       {Object.entries(t.modal.levels).map(([k, v]) => (
                         <option key={k} value={k}>{(v as string).split(' ')[0]}</option>
                       ))}
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={14} />
                  </div>

                  {/* Filter: Source */}
                  <div className="relative">
                     <select 
                       className="appearance-none bg-[#12141C] border border-[#1F232B] rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-gray-400 focus:text-white focus:border-purple-500/50 outline-none cursor-pointer"
                       value={filters.source}
                       onChange={e => setFilters({...filters, source: e.target.value})}
                     >
                       <option value="all">{t.registry.filters.allSources}</option>
                       {Object.entries(t.modal.sourceOptions).map(([k, v]) => (
                         <option key={k} value={k}>{(v as string).split(' ')[0]}</option>
                       ))}
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={14} />
                  </div>

                  {/* Filter: Course */}
                  <div className="relative">
                     <select 
                       className="appearance-none bg-[#12141C] border border-[#1F232B] rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-gray-400 focus:text-white focus:border-purple-500/50 outline-none cursor-pointer max-w-[150px] truncate"
                       value={filters.course}
                       onChange={e => setFilters({...filters, course: e.target.value})}
                     >
                       <option value="all">{t.registry.filters.allCourses}</option>
                       {courses.map(c => (
                         <option key={c.id} value={c.title}>{c.title}</option>
                       ))}
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={14} />
                  </div>
               </div>
            </div>

            <div className="bg-[#12141C] rounded-[2.5rem] border border-[#1F232B] overflow-hidden shadow-xl min-h-[300px]">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0A0C10]">
                       <tr className="text-[9px] font-black uppercase text-gray-500 tracking-widest border-b border-[#1F232B]">
                          <th className="px-8 py-5">{t.registry.table.student}</th>
                          <th className="px-8 py-5">{t.registry.table.contacts}</th>
                          <th className="px-8 py-5">{t.registry.table.course}</th>
                          <th className="px-8 py-5">{t.registry.table.level}</th>
                          <th className="px-8 py-5">{t.registry.table.source}</th>
                          <th className="px-8 py-5 text-center">{t.registry.table.status}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F232B]">
                       {filteredStudents.length > 0 ? filteredStudents.map((inv) => {
                          const meta = getInvoiceMeta(inv);
                          return (
                            <tr key={inv.id} className="hover:bg-white/5 transition-all group">
                               <td className="px-8 py-5">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center text-purple-400 border border-white/5">
                                        <User size={16} />
                                     </div>
                                     <div>
                                        <p className="text-xs font-black text-gray-200">{inv.student}</p>
                                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">{inv.studentInstagram || 'No IG'}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-5">
                                  <div className="space-y-1">
                                     <p className="text-[10px] text-gray-400 flex items-center gap-2"><Mail size={10} /> {inv.studentEmail || '-'}</p>
                                     <p className="text-[10px] text-gray-400 flex items-center gap-2"><Phone size={10} /> {inv.studentPhone || '-'}</p>
                                  </div>
                               </td>
                               <td className="px-8 py-5">
                                  <span className="text-[10px] font-black uppercase text-gray-300">{inv.course}</span>
                               </td>
                               <td className="px-8 py-5">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                     meta.level === 'pro' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                     meta.level === 'intermediate' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                     'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                  }`}>
                                     {meta.level}
                                  </span>
                               </td>
                               <td className="px-8 py-5">
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                     <Target size={12} /> {meta.source}
                                  </div>
                               </td>
                               <td className="px-8 py-5 text-center">
                                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                                     inv.status === 'paid' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                                     inv.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} title={inv.status} />
                               </td>
                            </tr>
                          );
                       }) : (
                         <tr>
                           <td colSpan={6} className="px-8 py-12 text-center text-gray-600 text-xs font-black uppercase tracking-widest">
                             Студентів не знайдено
                           </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
            </div>
          </div>

          {/* ACTIVE COURSES LIST */}
          <div className="flex items-center justify-between mt-12 mb-6">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <Briefcase size={16} /> {t.coursesTitle}
             </h3>
             <button 
                onClick={() => setIsAddCourseModalOpen(true)}
                className="text-[10px] font-black text-purple-400 hover:text-white uppercase flex items-center gap-2 transition-colors"
             >
                <Plus size={14} /> {t.addCourse}
             </button>
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
                          <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-sm font-bold text-gray-100 focus:ring-1 ring-purple-500/50 outline-none" placeholder="Ivanova" value={newStudent.lastName} onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} />
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
                             <input required type="tel" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} placeholder="+380..." />
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
                       <div className="flex items-center justify-between ml-4 mr-2">
                          <label className="text-[10px] font-black uppercase text-gray-500">{t.modal.amount}</label>
                          {selectedCourseForModal && (
                            <div className="flex items-center gap-3 bg-[#1F232B] px-3 py-1.5 rounded-lg border border-white/5 animate-in fade-in">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                Total: <span className="text-white">${modalCoursePrice}</span>
                              </span>
                              <div className="w-px h-3 bg-white/10" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                Debt: <span className={modalRemaining > 0 ? 'text-red-400' : 'text-green-400'}>${modalRemaining}</span>
                              </span>
                              {isPaidFull && <Check size={10} className="text-green-400 ml-1" />}
                            </div>
                          )}
                       </div>
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

      {/* MODAL: ADD COURSE */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
           <div className="bg-[#12141C] w-full max-w-2xl rounded-[3rem] border border-[#1F232B] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
              
              <div className="p-8 border-b border-[#1F232B] flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{t.courseModal.title}</h3>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{t.courseModal.sub}</p>
                 </div>
                 <button onClick={() => setIsAddCourseModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><X size={20} /></button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                 <form onSubmit={handleCreateCourse} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.courseModal.name}</label>
                       <div className="relative">
                          <BookOpen className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                          <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newCourseForm.title} onChange={e => setNewCourseForm({...newCourseForm, title: e.target.value})} placeholder="InLei® Lash Filler 25.9" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.courseModal.desc}</label>
                       <div className="relative">
                           <MessageSquare className="absolute left-6 top-6 text-gray-600" size={16} />
                           <textarea required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-14 pr-8 text-sm font-medium text-white outline-none focus:ring-1 ring-purple-500/50 resize-none h-28" value={newCourseForm.description} onChange={e => setNewCourseForm({...newCourseForm, description: e.target.value})} placeholder="Short description..." />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.courseModal.price}</label>
                          <div className="relative">
                             <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                             <input required type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newCourseForm.price} onChange={e => setNewCourseForm({...newCourseForm, price: e.target.value})} placeholder="550" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.courseModal.type}</label>
                          <div className="relative">
                             <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                             <select className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50 appearance-none" value={newCourseForm.isExtension} onChange={e => setNewCourseForm({...newCourseForm, isExtension: e.target.value})}>
                                <option value="false">{t.courseModal.types.lamination}</option>
                                <option value="true">{t.courseModal.types.extension}</option>
                             </select>
                             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={16} />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 ml-4">{t.courseModal.image}</label>
                       <div className="relative">
                          <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                          <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={newCourseForm.image} onChange={e => setNewCourseForm({...newCourseForm, image: e.target.value})} placeholder="https://..." />
                       </div>
                    </div>

                    <button type="submit" className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-900/40 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4">
                       <Plus size={16} /> {t.courseModal.submit}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SpecialistDashboard;