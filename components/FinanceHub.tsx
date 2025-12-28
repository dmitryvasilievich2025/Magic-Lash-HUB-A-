
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, AlertCircle, CreditCard, 
  Plus, Search, Edit3, X, ChevronLeft, 
  Calendar, ChevronRight, User, Book, 
  History, DollarSign, ArrowDownCircle, Trash2, GraduationCap, Briefcase
} from 'lucide-react';
import { Invoice, PaymentRecord, Language, UserRole } from '../types';

interface Props {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  userRole?: UserRole;
  studentName?: string;
  lang: Language;
}

const FinanceHub: React.FC<Props> = ({ invoices, setInvoices, userRole = 'admin', studentName = 'Марія Іванова', lang }) => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  
  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({ student: '', instructorName: '', course: '', total: '', dueDate: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });

  const isStudent = userRole === 'student';

  const t = useMemo(() => ({
    uk: {
      title: isStudent ? 'МОЇ ФІНАНСИ' : 'Фінансовий HUB',
      newInvoice: 'Новий рахунок',
      stats: { 
        revenue: isStudent ? 'МНОЮ СПЛАЧЕНО' : 'Отримано', 
        debt: isStudent ? 'МІЙ БОРГ' : 'Очікується (Борг)' 
      },
      table: { user: 'Студент', debt: 'Загальний Борг', teacher: 'Викладач' },
      modal: {
        newInv: 'Створити інвойс',
        addPay: 'Фіксувати оплату',
        student: 'Ім\'я студента',
        instructor: 'Викладач',
        course: 'Назва курсу / послуги',
        total: 'Загальна вартість ($)',
        amount: 'Сума оплати ($)',
        date: 'Дата операції',
        history: 'Історія транзакцій',
        remaining: 'Залишок до сплати:',
        save: 'Зберегти',
        cancel: 'Скасувати'
      },
      personal: {
        historyTitle: 'Історія моїх оплат',
        noData: 'Оплат поки не зафіксовано',
        details: 'Деталі курсу'
      }
    },
    en: {
      title: isStudent ? 'MY FINANCES' : 'Finance HUB',
      newInvoice: 'New Invoice',
      stats: { 
        revenue: isStudent ? 'TOTAL PAID' : 'Revenue', 
        debt: isStudent ? 'MY DEBT' : 'Total Debt' 
      },
      table: { user: 'Student', debt: 'Total Debt', teacher: 'Instructor' },
      modal: {
        newInv: 'Create Invoice',
        addPay: 'Record Payment',
        student: 'Student Name',
        instructor: 'Instructor',
        course: 'Course / Service',
        total: 'Total Price ($)',
        amount: 'Payment Amount ($)',
        date: 'Transaction Date',
        history: 'Payment History',
        remaining: 'Remaining Balance:',
        save: 'Save',
        cancel: 'Cancel'
      },
      personal: {
        historyTitle: 'My Payment History',
        noData: 'No payments recorded yet',
        details: 'Course Details'
      }
    }
  }[lang]), [lang, isStudent]);

  // Admin Logic: Create New Invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const newInv: Invoice = {
      id: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
      student: invoiceForm.student,
      instructorName: invoiceForm.instructorName,
      course: invoiceForm.course,
      total: Number(invoiceForm.total),
      paid: 0,
      status: 'unpaid',
      dueDate: invoiceForm.dueDate,
      payments: []
    };
    setInvoices([newInv, ...invoices]);
    setIsInvoiceModalOpen(false);
    setInvoiceForm({ student: '', instructorName: '', course: '', total: '', dueDate: '' });
  };

  // Logic: Record a payment
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInvoiceId) return;

    const amount = Number(paymentForm.amount);
    const newPayment: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      amount,
      date: paymentForm.date,
      note: paymentForm.note
    };

    setInvoices(prev => prev.map(inv => {
      if (inv.id === currentInvoiceId) {
        const updatedPayments = [...inv.payments, newPayment];
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        let status: Invoice['status'] = 'partial';
        if (totalPaid >= inv.total) status = 'paid';
        else if (totalPaid <= 0) status = 'unpaid';

        return { ...inv, payments: updatedPayments, paid: totalPaid, status };
      }
      return inv;
    }));

    setIsPaymentModalOpen(false);
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
  };

  // Student specific data
  const myInvoices = useMemo(() => {
    return invoices.filter(i => i.student === studentName);
  }, [invoices, studentName]);

  const myStats = useMemo(() => {
    const paid = myInvoices.reduce((a, b) => a + b.paid, 0);
    const debt = myInvoices.reduce((a, b) => a + (b.total - b.paid), 0);
    return { paid, debt };
  }, [myInvoices]);

  // Admin/Specialist specific summary
  const studentSummary = useMemo(() => {
    const names = Array.from(new Set(invoices.map(i => i.student)));
    return names.map(name => {
      const sInv = invoices.filter(i => i.student === name);
      const total = sInv.reduce((a, b) => a + b.total, 0);
      const paid = sInv.reduce((a, b) => a + b.paid, 0);
      return { name, debt: total - paid };
    }).sort((a, b) => b.debt - a.debt);
  }, [invoices]);

  const totalRevenue = invoices.reduce((a, b) => a + b.paid, 0);
  const totalDebt = invoices.reduce((a, b) => a + (b.total - b.paid), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0C10] text-left animate-in fade-in duration-500">
      <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500">ФІНАНСОВИЙ HUB</h2>
          <p className="text-xl font-black text-gray-100 uppercase tracking-tight">CASHFLOW</p>
        </div>
        {!isStudent && (
          <button 
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg"
          >
            <Plus size={14} /> {t.newInvoice}
          </button>
        )}
      </header>

      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-2 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={80} /></div>
              <TrendingUp className="text-green-500 mb-2" size={20} />
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.stats.revenue}</p>
              <h4 className="text-3xl font-black text-gray-100 tracking-tighter">${(isStudent ? myStats.paid : totalRevenue).toLocaleString()}</h4>
            </div>
            <div className="bg-[#12141C] p-8 rounded-[2.5rem] border border-[#1F232B] space-y-2 text-red-400 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><AlertCircle size={80} /></div>
              <AlertCircle className="mb-2" size={20} />
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.stats.debt}</p>
              <h4 className="text-3xl font-black tracking-tighter">${(isStudent ? myStats.debt : totalDebt).toLocaleString()}</h4>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-[#12141C] rounded-[3rem] border border-[#1F232B] overflow-hidden shadow-2xl">
             {isStudent ? (
               <div className="p-10 space-y-10">
                 <div className="flex items-center gap-3 mb-4">
                    <History size={18} className="text-purple-400" />
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{t.personal.historyTitle}</h3>
                 </div>
                 
                 <div className="space-y-8">
                   {myInvoices.map(inv => (
                     <div key={inv.id} className="bg-[#0A0C10] rounded-[2.5rem] border border-[#1F232B] overflow-hidden hover:border-purple-500/30 transition-all shadow-inner">
                        <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#1F232B]">
                           <div className="space-y-2 text-left">
                              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{inv.course}</p>
                              <div className="flex items-center gap-2">
                                <Briefcase size={12} className="text-gray-600" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Викладач: {inv.instructorName || 'Адміністрація HUB'}</span>
                              </div>
                              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Договір: {inv.id} | Термін: {inv.dueDate}</p>
                           </div>
                           <div className="flex gap-4">
                              <div className="text-center px-6 py-3 bg-[#12141C] rounded-2xl border border-white/5">
                                 <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Ціна</p>
                                 <p className="text-lg font-black text-gray-100">${inv.total}</p>
                              </div>
                              <div className="text-center px-6 py-3 bg-[#12141C] rounded-2xl border border-white/5">
                                 <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Сплачено</p>
                                 <p className="text-lg font-black text-green-400">${inv.paid}</p>
                              </div>
                              <div className="text-center px-6 py-3 bg-[#12141C] rounded-2xl border border-white/5">
                                 <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Мій Борг</p>
                                 <p className="text-lg font-black text-red-400">${inv.total - inv.paid}</p>
                              </div>
                           </div>
                        </div>

                        <div className="p-8 bg-[#0D0F14]/30">
                           <div className="grid grid-cols-1 gap-3">
                              {inv.payments.length > 0 ? inv.payments.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-5 bg-[#12141C] rounded-2xl border border-white/5 group hover:border-purple-500/20 transition-all">
                                   <div className="flex items-center gap-4">
                                      <div className="p-3 bg-green-500/10 rounded-xl"><ArrowDownCircle size={16} className="text-green-500" /></div>
                                      <div>
                                        <p className="text-sm font-black text-gray-100 tracking-tight">${p.amount}</p>
                                        {p.note && <p className="text-[9px] font-medium text-gray-500 italic">"{p.note}"</p>}
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2"><Calendar size={12} /> {p.date}</span>
                                   </div>
                                </div>
                              )) : (
                                <p className="text-[10px] text-gray-700 uppercase font-black tracking-[0.2em] text-center py-6 border border-dashed border-[#1F232B] rounded-2xl">
                                  {t.personal.noData}
                                </p>
                              )}
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
             ) : (
               <>
                 <div className="p-8 border-b border-[#1F232B]">
                    <div className="relative w-full max-w-sm">
                      <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-16 pr-8 text-xs font-bold text-gray-100 outline-none" placeholder="Пошук студента..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                 </div>
                 <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#0A0C10]">
                        <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.table.user}</th>
                        <th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest text-right pr-12">{t.table.debt}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F232B]">
                      {studentSummary.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map(s => (
                        <tr key={s.name} className="hover:bg-white/5 transition-all cursor-pointer group" onClick={() => setSelectedStudent(s.name)}>
                          <td className="px-10 py-6 font-black uppercase text-sm text-gray-200">{s.name}</td>
                          <td className={`px-10 py-6 font-black text-sm text-right pr-12 ${s.debt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ${s.debt.toLocaleString()} <ChevronRight size={14} className="inline ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </>
             )}
          </div>
        </div>
      </div>

      {/* ADMIN DETAIL OVERLAY (Hidden for students) */}
      {!isStudent && selectedStudent && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0C10] animate-in slide-in-from-right duration-300">
           <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center gap-6 px-10">
              <button onClick={() => setSelectedStudent(null)} className="p-2 bg-[#0A0C10] border border-[#1F232B] rounded-xl text-gray-400 hover:text-white transition-all"><ChevronLeft size={20} /></button>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">{selectedStudent}</h2>
           </header>
           <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-10">
                 {invoices.filter(i => i.student === selectedStudent).map(inv => (
                   <div key={inv.id} className="bg-[#12141C] rounded-[3rem] border border-[#1F232B] overflow-hidden shadow-xl">
                      <div className="p-10 flex flex-col md:flex-row justify-between items-start gap-6 border-b border-[#1F232B]">
                         <div className="space-y-3 text-left">
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">{inv.course}</p>
                            <h3 className="text-2xl font-black text-white">{inv.id}</h3>
                            <div className="flex items-center gap-2">
                               <Briefcase size={14} className="text-gray-600" />
                               <span className="text-[10px] font-black text-gray-500 uppercase">Викладач: {inv.instructorName || 'N/A'}</span>
                            </div>
                            <div className="flex gap-4 pt-4">
                               <div className="bg-[#0A0C10] px-4 py-2 rounded-xl border border-white/5">
                                  <p className="text-[8px] font-black text-gray-500 uppercase">Ціна</p>
                                  <p className="text-sm font-black text-gray-200">${inv.total}</p>
                               </div>
                               <div className="bg-[#0A0C10] px-4 py-2 rounded-xl border border-white/5">
                                  <p className="text-[8px] font-black text-gray-500 uppercase">Сплачено</p>
                                  <p className="text-sm font-black text-green-400">${inv.paid}</p>
                               </div>
                               <div className="bg-[#0A0C10] px-4 py-2 rounded-xl border border-white/5">
                                  <p className="text-[8px] font-black text-gray-500 uppercase">Борг</p>
                                  <p className="text-sm font-black text-red-400">${inv.total - inv.paid}</p>
                                </div>
                            </div>
                         </div>
                         <button 
                           onClick={() => { setCurrentInvoiceId(inv.id); setIsPaymentModalOpen(true); }}
                           className="px-6 py-4 bg-green-600/10 border border-green-500/20 text-green-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-lg shadow-green-900/10"
                         >
                           <DollarSign size={14} className="inline mr-2" /> {t.modal.addPay}
                         </button>
                      </div>

                      <div className="p-10 bg-[#0D0F14]">
                         <div className="flex items-center gap-3 mb-6">
                            <History size={16} className="text-gray-600" />
                            <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t.modal.history}</h4>
                         </div>
                         <div className="space-y-3">
                            {inv.payments.length > 0 ? inv.payments.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-5 bg-[#0A0C10] rounded-2xl border border-white/5">
                                 <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-500/10 rounded-xl"><ArrowDownCircle size={16} className="text-green-500" /></div>
                                    <span className="text-sm font-black text-gray-200">${p.amount}</span>
                                    {p.note && <span className="text-[10px] font-medium text-gray-600 italic">"{p.note}"</span>}
                                 </div>
                                 <span className="text-[10px] font-bold text-gray-500 uppercase">{p.date}</span>
                              </div>
                            )) : (
                              <p className="text-[10px] text-gray-700 uppercase font-black tracking-widest text-center py-6">Операцій не знайдено</p>
                            )}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL (Admin Only) */}
      {!isStudent && isInvoiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
           <div className="bg-[#12141C] w-full max-w-xl rounded-[3.5rem] border border-[#1F232B] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 border-b border-[#1F232B] flex items-center justify-between text-left">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">{t.modal.newInv}</h3>
                 <button onClick={() => setIsInvoiceModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateInvoice} className="p-10 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.student}</label>
                       <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={invoiceForm.student} onChange={e => setInvoiceForm({...invoiceForm, student: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.instructor}</label>
                       <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={invoiceForm.instructorName} onChange={e => setInvoiceForm({...invoiceForm, instructorName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.course}</label>
                       <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={invoiceForm.course} onChange={e => setInvoiceForm({...invoiceForm, course: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.total}</label>
                          <input required type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none" value={invoiceForm.total} onChange={e => setInvoiceForm({...invoiceForm, total: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">Дедлайн</label>
                          <input required type="date" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} />
                       </div>
                    </div>
                 </div>
                 <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="flex-1 py-4 bg-[#1F232B] text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">{t.modal.cancel}</button>
                    <button type="submit" className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-purple-600/20">{t.modal.save}</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
           <div className="bg-[#12141C] w-full max-w-lg rounded-[3.5rem] border border-[#1F232B] shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
              <div className="p-10 border-b border-[#1F232B] flex items-center justify-between text-left">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">{t.modal.addPay}</h3>
                 <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddPayment} className="p-10 space-y-6">
                 <div className="bg-[#0A0C10] p-8 rounded-[2.5rem] border border-white/5 text-center mb-4 shadow-inner">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t.modal.remaining}</p>
                    <p className="text-3xl font-black text-red-400 tracking-tighter">
                       ${currentInvoiceId ? (invoices.find(i => i.id === currentInvoiceId)!.total - invoices.find(i => i.id === currentInvoiceId)!.paid) : 0}
                    </p>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-2 text-left">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.amount}</label>
                       <input required type="number" autoFocus className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-xl font-black text-green-400 outline-none focus:ring-1 ring-green-500/50" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                    </div>
                    <div className="space-y-2 text-left">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.date}</label>
                       <input required type="date" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                    </div>
                    <div className="space-y-2 text-left">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">Коментар</label>
                       <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none" placeholder="Готівка, переказ тощо" value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} />
                    </div>
                 </div>
                 <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-4 bg-[#1F232B] text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">{t.modal.cancel}</button>
                    <button type="submit" className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-600/20">{t.modal.save}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceHub;
