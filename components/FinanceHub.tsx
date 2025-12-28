
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, Clock, AlertCircle, CreditCard, 
  Download, Plus, Search, CheckCircle2, 
  Edit3, X, ChevronLeft, ArrowRight,
  Filter, Calendar, MessageSquare, ArrowUpDown,
  Bell, User, Users, ChevronRight, Share2, Trash2, MoreVertical, Fingerprint, Book, DollarSign, BarChart3, PieChart, ArrowDownCircle, FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Invoice, UserRole, Language } from '../types';

interface Props {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  userRole?: UserRole;
  studentName?: string;
  lang: Language;
}

const FinanceHub: React.FC<Props> = ({ invoices, setInvoices, userRole = 'admin', studentName, lang }) => {
  const [search, setSearch] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [sortBy, setSortBy] = useState<'debt' | 'date'>('debt');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    student: '', 
    studentId: '',
    course: '', 
    total: '', 
    paid: '0', 
    dueDate: '',
    status: 'unpaid' as Invoice['status']
  });

  const t = useMemo(() => ({
    uk: {
      title: 'Фінансовий HUB',
      admin: 'Адміністрування',
      newInvoice: 'Новий рахунок',
      stats: { revenue: 'Каса HUB', debt: 'Загальний борг', active: 'Активні клієнти', expenses: 'Витрати (орієнт.)' },
      table: { user: 'Спеціаліст', debt: 'Борг', status: 'Статус', date: 'Термін', actions: 'Дії' },
      sort: { label: 'Сортування', debt: 'За боргом', date: 'За датою' },
      analytics: { title: 'Аналітика Тренду', revenue: 'Дохід', potential: 'Потенціал', debt: 'Заборгованість', expenses: 'Витрати' },
      detail: { back: 'Назад', profile: 'Профіль спеціаліста', personal: 'Особисті фінанси', paid: 'Сплачено', remaining: 'Залишок боргу', history: 'Історія транзакцій' },
      modal: { 
        edit: 'Редагувати рахунок', 
        create: 'Створити інвойс', 
        save: 'Зберегти інвойс', 
        cancel: 'Скасувати',
        personalHeader: 'Персональні дані',
        programHeader: 'Напрямок розвитку',
        financeHeader: 'Фінансові умови'
      },
      placeholder: { 
        search: 'Пошук за ім\'ям, курсом або ID...', 
        detailSearch: 'Пошук конкретного інвойсу або курсу...',
        student: 'Прізвище та ім\'я студента', 
        studentId: 'Внутрішній ID (ML-XXXX)', 
        amount: 'Загальна вартість', 
        paid: 'Вже сплачено',
        course: 'Назва програми (напр. InLei Lash Filler)'
      }
    },
    en: {
      title: 'Finance HUB',
      admin: 'Administration',
      newInvoice: 'New Invoice',
      stats: { revenue: 'Total Revenue', debt: 'Total Debt', active: 'Active Clients', expenses: 'Expenses (est.)' },
      table: { user: 'Specialist', debt: 'Debt', status: 'Status', date: 'Due Date', actions: 'Actions' },
      sort: { label: 'Sorting', debt: 'By Debt', date: 'By Date' },
      analytics: { title: 'Trend Analytics', revenue: 'Revenue', potential: 'Potential', debt: 'Debt', expenses: 'Expenses' },
      detail: { back: 'Back', profile: 'Specialist Profile', personal: 'Personal Finance', paid: 'Paid', remaining: 'Remaining Debt', history: 'Transaction History' },
      modal: { 
        edit: 'Edit Invoice', 
        create: 'Create Invoice', 
        save: 'Save Invoice', 
        cancel: 'Cancel',
        personalHeader: 'Personal Details',
        programHeader: 'Development Program',
        financeHeader: 'Financial Terms'
      },
      placeholder: { 
        search: 'Search by name, course or ID...', 
        detailSearch: 'Find specific invoice or course...',
        student: 'Student Full Name', 
        studentId: 'Internal ID (ML-XXXX)', 
        amount: 'Total Amount', 
        paid: 'Paid Amount',
        course: 'Program Title (e.g. Magic Lash Geometry)'
      }
    }
  }[lang]), [lang]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, idx) => {
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.dueDate);
        return invDate.getMonth() === idx && invDate.getFullYear() === currentYear;
      });

      const revenue = monthInvoices.reduce((a, b) => a + b.paid, 0);
      return {
        name: month,
        revenue: revenue,
        potential: monthInvoices.reduce((a, b) => a + b.total, 0),
        debt: monthInvoices.reduce((a, b) => a + (b.total - b.paid), 0),
        expenses: Math.round(revenue * 0.3)
      };
    });
  }, [invoices]);

  const totalExpenses = useMemo(() => chartData.reduce((a, b) => a + b.expenses, 0), [chartData]);

  useEffect(() => {
    if (userRole === 'student' && studentName) {
      setSelectedStudent(studentName);
    }
  }, [userRole, studentName]);

  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoiceId(inv.id);
    setFormData({
      student: inv.student,
      studentId: inv.studentId || '',
      course: inv.course,
      total: inv.total.toString(),
      paid: inv.paid.toString(),
      dueDate: inv.dueDate,
      status: inv.status
    });
    setIsModalOpen(true);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') return;
    
    const total = Number(formData.total);
    const paid = Number(formData.paid);
    
    let status: Invoice['status'] = 'unpaid';
    if (paid >= total) status = 'paid';
    else if (paid > 0) status = 'partial';

    const newInv: Invoice = {
      id: editingInvoiceId || `INV-${Math.floor(Math.random() * 9000) + 1000}`,
      student: formData.student,
      studentId: formData.studentId,
      course: formData.course,
      total,
      paid,
      status,
      dueDate: formData.dueDate
    };

    if (editingInvoiceId) {
      setInvoices(invoices.map(i => i.id === editingInvoiceId ? newInv : i));
    } else {
      setInvoices([newInv, ...invoices]);
    }

    setIsModalOpen(false);
    setEditingInvoiceId(null);
    setFormData({ student: '', studentId: '', course: '', total: '', paid: '0', dueDate: '', status: 'unpaid' });
  };

  const studentList = useMemo(() => {
    const names = Array.from(new Set(invoices.map(i => i.student)));
    return names.map(name => {
      const sInv = invoices.filter(i => i.student === name);
      const total = sInv.reduce((a, b) => a + b.total, 0);
      const paid = sInv.reduce((a, b) => a + b.paid, 0);
      const overdue = sInv.some(i => i.status === 'overdue');
      return { 
        name, 
        studentId: sInv.find(i => i.studentId)?.studentId || '',
        debt: total - paid, 
        paid,
        count: sInv.length, 
        lastDate: sInv[0].dueDate, 
        isOverdue: overdue,
        lastCourse: sInv[0].course 
      };
    }).sort((a, b) => {
      if (sortBy === 'debt') return b.debt - a.debt;
      return new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime();
    });
  }, [invoices, sortBy]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#12141C] border border-[#1F232B] p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 py-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[11px] font-bold text-gray-300">{entry.name}:</span>
              <span className="text-[11px] font-black text-white">${entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (selectedStudent) {
    const sData = studentList.find(s => s.name === selectedStudent);
    const sInvoices = invoices.filter(i => i.student === selectedStudent).filter(inv => {
      const term = detailSearch.toLowerCase();
      return inv.course.toLowerCase().includes(term) || inv.id.toLowerCase().includes(term);
    });

    return (
      <div className="flex-1 flex flex-col bg-[#0A0C10] text-left animate-in fade-in slide-in-from-right-4 duration-500">
        <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-6">
            {userRole === 'admin' && (
              <button onClick={() => { setSelectedStudent(null); setDetailSearch(''); }} className="p-3 bg-[#0A0C10] hover:bg-[#1F232B] rounded-2xl border border-[#1F232B] text-gray-400 hover:text-white transition-all group">
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{userRole === 'student' ? t.detail.personal : t.detail.profile}</p>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">{selectedStudent}</h2>
                {sData?.studentId && (
                  <span className="px-3 py-1 bg-purple-600/10 border border-purple-500/20 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-widest">ID: {sData.studentId}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-[#1F232B] border border-[#2D333D] rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 text-gray-400 hover:text-white transition-all shadow-xl">
              <Download size={14} /> {lang === 'uk' ? 'Експорт PDF' : 'Export PDF'}
            </button>
            {userRole === 'admin' && (
              <button 
                onClick={() => {
                  setFormData(prev => ({ ...prev, student: selectedStudent, studentId: sData?.studentId || '' }));
                  setIsModalOpen(true);
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
              >
                <Plus size={14} /> {t.newInvoice}
              </button>
            )}
          </div>
        </header>
        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
           <div className="max-w-6xl mx-auto space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="bg-[#12141C] p-10 rounded-[3rem] border border-[#1F232B]">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">{t.detail.paid}</p>
                    <h4 className="text-5xl font-black text-green-400 tracking-tighter">${sData?.paid.toLocaleString()}</h4>
                 </div>
                 <div className="bg-[#12141C] p-10 rounded-[3rem] border border-[#1F232B]">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">{t.detail.remaining}</p>
                    <h4 className={`text-5xl font-black tracking-tighter ${sData?.debt! > 0 ? 'text-red-400' : 'text-gray-600'}`}>${sData?.debt.toLocaleString()}</h4>
                 </div>
                 <div className="bg-[#12141C] p-10 rounded-[3rem] border border-[#1F232B]">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">{lang === 'uk' ? 'Програм' : 'Programs'}</p>
                    <h4 className="text-5xl font-black text-purple-400 tracking-tighter">{sData?.count}</h4>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="relative w-full max-w-md">
                   <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                   <input 
                    className="w-full bg-[#12141C] border border-[#1F232B] rounded-[2rem] py-4 pl-16 pr-8 text-xs font-bold text-gray-100 outline-none focus:ring-1 ring-purple-500/30 transition-all shadow-sm" 
                    placeholder={t.placeholder.detailSearch} 
                    value={detailSearch} 
                    onChange={e => setDetailSearch(e.target.value)} 
                   />
                </div>

                <div className="bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] overflow-hidden shadow-2xl">
                   <table className="w-full text-left">
                      <thead className="bg-[#0A0C10]">
                         <tr>
                            <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">Програма / ID</th>
                            <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">Сума</th>
                            <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">Статус</th>
                            <th className="px-10 py-5 text-right pr-10"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F232B]">
                         {sInvoices.length > 0 ? sInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-[#1F232B]/30 transition-colors">
                               <td className="px-10 py-6">
                                  <div className="flex items-center gap-3">
                                     <FileText size={14} className="text-gray-600" />
                                     <div>
                                        <p className="text-xs font-black uppercase text-gray-100">{inv.course}</p>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{inv.id}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-10 py-6"><p className="text-xs font-black text-gray-200">${inv.total}</p></td>
                               <td className="px-10 py-6">
                                  <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border ${inv.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{inv.status}</span>
                               </td>
                               <td className="px-10 py-6 text-right pr-10">
                                  <button onClick={() => handleEditInvoice(inv)} className="p-2.5 text-gray-500 hover:text-purple-400 transition-colors"><Edit3 size={14} /></button>
                               </td>
                            </tr>
                         )) : (
                           <tr>
                              <td colSpan={4} className="px-10 py-20 text-center text-gray-600">
                                 <Search className="mx-auto mb-4 opacity-20" size={32} />
                                 <p className="text-xs font-black uppercase tracking-widest">Нічого не знайдено</p>
                              </td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C10] text-left animate-in fade-in duration-500">
      <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t.title}</h2>
          <p className="text-xl font-black text-gray-100 uppercase tracking-tight">{t.admin}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`p-3 rounded-2xl border transition-all ${showAnalytics ? 'bg-purple-600 border-purple-500 text-white' : 'bg-[#1F232B] border-[#2D333D] text-gray-400 hover:text-white'}`}
          >
            <BarChart3 size={20} />
          </button>
          {userRole === 'admin' && (
            <button 
              onClick={() => {
                setEditingInvoiceId(null);
                setFormData({ student: '', studentId: '', course: '', total: '', paid: '0', dueDate: '', status: 'unpaid' });
                setIsModalOpen(true);
              }} 
              className="px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
            >
              <Plus size={14} /> {t.newInvoice}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#12141C] p-7 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl">
              <TrendingUp className="text-green-500" size={20} />
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.stats.revenue}</p>
              <h4 className="text-3xl font-black text-gray-100 tracking-tight">${invoices.reduce((a, b) => a + b.paid, 0).toLocaleString()}</h4>
            </div>
            <div className="bg-[#12141C] p-7 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl">
              <ArrowDownCircle className="text-orange-500" size={20} />
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.stats.expenses}</p>
              <h4 className="text-3xl font-black text-orange-400 tracking-tight">${totalExpenses.toLocaleString()}</h4>
            </div>
            <div className="bg-[#12141C] p-7 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.stats.debt}</p>
              <h4 className="text-3xl font-black text-red-400 tracking-tight">${invoices.reduce((a, b) => a + (b.total - b.paid), 0).toLocaleString()}</h4>
            </div>
            <div className="bg-[#12141C] p-7 rounded-[2.5rem] border border-[#1F232B] space-y-4 shadow-xl">
              <Users className="text-blue-500" size={20} />
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.stats.active}</p>
              <h4 className="text-3xl font-black text-gray-100 tracking-tight">{studentList.length}</h4>
            </div>
          </div>

          {showAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-top-4 duration-700">
               <div className="lg:col-span-8 bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8">
                    <PieChart className="text-purple-500/10 group-hover:text-purple-500/20 transition-colors" size={140} />
                  </div>
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em]">{t.analytics.title}</h3>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                            <span className="text-[9px] font-black uppercase text-gray-500">{t.analytics.revenue}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <span className="text-[9px] font-black uppercase text-gray-500">{t.analytics.expenses}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-900 border border-indigo-500/30" />
                            <span className="text-[9px] font-black uppercase text-gray-500">{t.analytics.potential}</span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1F232B" vertical={false} />
                          <XAxis dataKey="name" stroke="#4b5563" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dy={10} />
                          <YAxis stroke="#4b5563" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            name={t.analytics.potential}
                            type="monotone" 
                            dataKey="potential" 
                            stroke="#312e81" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fill="transparent" 
                            dot={false}
                          />
                          <Area 
                            name={t.analytics.expenses}
                            type="monotone" 
                            dataKey="expenses" 
                            stroke="#f87171" 
                            strokeWidth={2}
                            fill="transparent" 
                            dot={false}
                          />
                          <Area 
                            name={t.analytics.revenue}
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#9333ea" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorRev)" 
                            dot={{ r: 4, fill: '#9333ea', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#fff', stroke: '#9333ea', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
               </div>

               <div className="lg:col-span-4 bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] p-10 shadow-2xl space-y-8 flex flex-col">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em]">{t.analytics.debt}</h3>
                  <div className="flex-1 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1F232B" vertical={false} />
                           <XAxis dataKey="name" stroke="#4b5563" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} />
                           <YAxis hide />
                           <Tooltip content={<CustomTooltip />} />
                           <Bar dataKey="debt" radius={[10, 10, 0, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.debt > 0 ? '#f87171' : '#1F232B'} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="bg-[#0A0C10] p-6 rounded-3xl border border-[#1F232B] text-center">
                     <p className="text-[10px] font-black uppercase text-gray-500 mb-2">{lang === 'uk' ? 'Середня заборгованість' : 'Average Debt'}</p>
                     <p className="text-2xl font-black text-red-400">
                       ${Math.round(chartData.reduce((a, b) => a + b.debt, 0) / chartData.filter(d => d.debt > 0).length || 0).toLocaleString()}
                     </p>
                  </div>
               </div>
            </div>
          )}

          <div className="bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-[#1F232B] flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="relative w-full md:w-96">
                  <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-[2rem] py-4 pl-16 pr-8 text-xs font-bold text-gray-100 outline-none focus:ring-1 ring-purple-500/30 transition-all" placeholder={t.placeholder.search} value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <div className="flex items-center gap-4 bg-[#0A0C10] p-1.5 rounded-[2rem] border border-[#1F232B]">
                   <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest ml-4 hidden md:block">{t.sort.label}:</span>
                   <button 
                     onClick={() => setSortBy('debt')}
                     className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${sortBy === 'debt' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                     <DollarSign size={12} /> {t.sort.debt}
                   </button>
                   <button 
                     onClick={() => setSortBy('date')}
                     className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${sortBy === 'date' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                     <Calendar size={12} /> {t.sort.date}
                   </button>
                </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-[#0A0C10]">
                    <tr>
                      <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.table.user}</th>
                      <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.table.debt}</th>
                      <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.table.status}</th>
                      <th className="px-10 py-5 text-right pr-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F232B]">
                    {studentList.filter(s => {
                      const term = search.toLowerCase();
                      const matchesBase = s.name.toLowerCase().includes(term) || s.studentId.toLowerCase().includes(term);
                      
                      // Знаходимо всі інвойси цього студента, щоб перевірити курси та ID інвойсів
                      const sInvoices = invoices.filter(inv => inv.student === s.name);
                      const matchesDeep = sInvoices.some(inv => 
                         inv.course.toLowerCase().includes(term) || 
                         inv.id.toLowerCase().includes(term)
                      );

                      return matchesBase || matchesDeep;
                    }).map(s => (
                      <tr key={s.name} className="hover:bg-[#1F232B]/30 cursor-pointer group transition-all" onClick={() => setSelectedStudent(s.name)}>
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-[#0A0C10] border border-[#1F232B] rounded-2xl flex items-center justify-center text-purple-400 font-black">{s.name.charAt(0)}</div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <p className="text-sm font-black uppercase text-gray-100 leading-none">{s.name}</p>
                                  {s.studentId && (
                                    <span className="text-[8px] font-black text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">ID: {s.studentId}</span>
                                  )}
                               </div>
                               <div className="flex items-center gap-2 mt-2 text-gray-600">
                                  <Clock size={10} />
                                  <p className="text-[9px] font-bold uppercase tracking-wider">{s.lastDate}</p>
                               </div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-10 py-7 text-sm font-black ${s.debt > 0 ? 'text-red-400' : 'text-green-400'}`}>${s.debt.toLocaleString()}</td>
                        <td className="px-10 py-7">
                          <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border ${s.isOverdue ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-gray-800/50 text-gray-500'}`}>{s.isOverdue ? 'OVERDUE' : 'ACTIVE'}</span>
                        </td>
                        <td className="px-10 py-7 text-right pr-12">
                           <ChevronRight size={18} className="text-gray-700 group-hover:text-purple-500 group-hover:translate-x-1 transition-all inline-block" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#12141C] w-full max-w-2xl rounded-[4rem] border border-[#1F232B] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 border-b border-[#1F232B] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-purple-600/10 rounded-2xl border border-purple-500/20">
                       <CreditCard size={24} className="text-purple-400" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-gray-100 uppercase tracking-tight">
                         {editingInvoiceId ? t.modal.edit : t.modal.create}
                       </h3>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Magic Lash Finance Management</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 bg-[#0A0C10] hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-2xl transition-all">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleSaveInvoice} className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="space-y-6 text-left">
                    <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.2em] flex items-center gap-2">
                       <User size={12} /> {t.modal.personalHeader}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest ml-4">Студент</label>
                          <div className="relative group">
                             <User size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-purple-500 transition-colors" />
                             <input 
                               required 
                               className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 outline-none focus:ring-1 ring-purple-500/50 transition-all" 
                               value={formData.student} 
                               onChange={e => setFormData({...formData, student: e.target.value})} 
                               placeholder={t.placeholder.student}
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest ml-4">Внутрішній ID</label>
                          <div className="relative group">
                             <Fingerprint size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-purple-500 transition-colors" />
                             <input 
                               className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 outline-none focus:ring-1 ring-purple-500/50 transition-all" 
                               value={formData.studentId} 
                               onChange={e => setFormData({...formData, studentId: e.target.value})} 
                               placeholder={t.placeholder.studentId}
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6 text-left">
                    <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.2em] flex items-center gap-2">
                       <Book size={12} /> {t.modal.programHeader}
                    </h4>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest ml-4">Напрямок навчання</label>
                       <div className="relative group">
                          <Book size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-purple-500 transition-colors" />
                          <input 
                            required 
                            className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 outline-none focus:ring-1 ring-purple-500/50 transition-all" 
                            value={formData.course} 
                            onChange={e => setFormData({...formData, course: e.target.value})} 
                            placeholder={t.placeholder.course}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6 text-left">
                    <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.2em] flex items-center gap-2">
                       <DollarSign size={12} /> {t.modal.financeHeader}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest ml-4">Сума (USD)</label>
                          <div className="relative group">
                             <DollarSign size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-purple-500 transition-colors" />
                             <input 
                               required 
                               type="number"
                               className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 outline-none focus:ring-1 ring-purple-500/50 transition-all" 
                               value={formData.total} 
                               onChange={e => setFormData({...formData, total: e.target.value})} 
                               placeholder={t.placeholder.amount}
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest ml-4">Вже сплачено (USD)</label>
                          <div className="relative group">
                             <CheckCircle2 size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-purple-500 transition-colors" />
                             <input 
                               required 
                               type="number"
                               className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 outline-none focus:ring-1 ring-purple-500/50 transition-all" 
                               value={formData.paid} 
                               onChange={e => setFormData({...formData, paid: e.target.value})} 
                               placeholder={t.placeholder.paid}
                             />
                          </div>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest ml-4">Термін повної оплати</label>
                       <div className="relative group">
                          <Calendar size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-purple-500 transition-colors" />
                          <input 
                            required 
                            type="date"
                            className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 outline-none focus:ring-1 ring-purple-500/50 transition-all" 
                            value={formData.dueDate} 
                            onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                          />
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-6 bg-transparent border border-[#1F232B] text-gray-500 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/5 transition-all"
                    >
                       {t.modal.cancel}
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] py-6 bg-purple-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-purple-600/20 hover:bg-purple-700 active:scale-95 transition-all"
                    >
                       {t.modal.save}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceHub;
