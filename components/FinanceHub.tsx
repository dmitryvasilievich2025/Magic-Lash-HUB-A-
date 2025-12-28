
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, AlertCircle, CreditCard, 
  Plus, Search, Edit3, X, ChevronLeft, 
  Calendar, ChevronRight, User, Book, 
  History, DollarSign, ArrowDownCircle, Trash2, GraduationCap, Briefcase, UserCheck
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
  
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({ student: '', instructorName: '', course: '', total: '', dueDate: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });

  const isStudent = userRole === 'student';

  const t = useMemo(() => ({
    uk: {
      title: isStudent ? 'МОЇ ФІНАНСИ' : 'ФІНАНСОВИЙ HUB',
      subtitle: isStudent ? 'Історія оплат та заборгованості' : 'CASHFLOW УПРАВЛІННЯ',
      newInvoice: 'Новий рахунок',
      stats: { 
        revenue: isStudent ? 'СПЛАЧЕНО МНОЮ' : 'ОТРИМАНО (HUB)', 
        debt: isStudent ? 'МІЙ БОРГ' : 'ОЧІКУЄТЬСЯ (БОРГ)' 
      },
      table: { user: 'Студент', debt: 'Загальний Борг', teacher: 'Викладач' },
      personal: {
        instructor: 'Викладач:',
        history: 'Історія транзакцій',
        noPayments: 'Оплат поки не зафіксовано',
        totalPrice: 'Вартість:',
        remaining: 'Залишок:'
      },
      modal: {
        newInv: 'Створити інвойс',
        addPay: 'Фіксувати оплату',
        student: 'Ім\'я студента',
        instructor: 'Викладач',
        course: 'Назва напрямку',
        total: 'Загальна вартість ($)',
        amount: 'Сума оплати ($)',
        date: 'Дата операції',
        remaining: 'Залишок до сплати:',
        save: 'Зберегти',
        cancel: 'Скасувати'
      }
    },
    en: {
      title: isStudent ? 'MY FINANCES' : 'FINANCE HUB',
      subtitle: isStudent ? 'Payment history and debts' : 'CASHFLOW MANAGEMENT',
      newInvoice: 'New Invoice',
      stats: { 
        revenue: isStudent ? 'TOTAL PAID' : 'REVENUE', 
        debt: isStudent ? 'MY DEBT' : 'EXPECTED (DEBT)' 
      },
      table: { user: 'Student', debt: 'Total Debt', teacher: 'Instructor' },
      personal: {
        instructor: 'Instructor:',
        history: 'Transaction History',
        noPayments: 'No payments recorded yet',
        totalPrice: 'Price:',
        remaining: 'Remaining:'
      },
      modal: {
        newInv: 'Create Invoice',
        addPay: 'Record Payment',
        student: 'Student Name',
        instructor: 'Instructor',
        course: 'Program Name',
        total: 'Total Price ($)',
        amount: 'Payment Amount ($)',
        date: 'Transaction Date',
        remaining: 'Remaining Balance:',
        save: 'Save',
        cancel: 'Cancel'
      }
    }
  }[lang]), [lang, isStudent]);

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

  const myInvoices = useMemo(() => {
    return invoices.filter(i => i.student === studentName);
  }, [invoices, studentName]);

  const stats = useMemo(() => {
    const activeInvoices = isStudent ? myInvoices : invoices;
    const paid = activeInvoices.reduce((a, b) => a + b.paid, 0);
    const debt = activeInvoices.reduce((a, b) => a + (b.total - b.paid), 0);
    return { paid, debt };
  }, [invoices, myInvoices, isStudent]);

  const studentSummary = useMemo(() => {
    const names = Array.from(new Set(invoices.map(i => i.student)));
    return names.map(name => {
      const sInv = invoices.filter(i => i.student === name);
      const total = sInv.reduce((a, b) => a + b.total, 0);
      const paid = sInv.reduce((a, b) => a + b.paid, 0);
      return { name, debt: total - paid };
    }).sort((a, b) => b.debt - a.debt);
  }, [invoices]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0C10] text-left animate-in fade-in duration-500">
      <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t.title}</h2>
          <p className="text-xl font-black text-gray-100 uppercase tracking-tight">{t.subtitle}</p>
        </div>
        {!isStudent && (
          <button 
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/20"
          >
            <Plus size={14} /> {t.newInvoice}
          </button>
        )}
      </header>

      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#12141C] p-10 rounded-[2.5rem] border border-[#1F232B] space-y-3 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12"><TrendingUp size={100} /></div>
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20 mb-2"><TrendingUp className="text-green-500" size={20} /></div>
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.stats.revenue}</p>
              <h4 className="text-4xl font-black text-white tracking-tighter">${stats.paid.toLocaleString()}</h4>
            </div>
            <div className="bg-[#12141C] p-10 rounded-[2.5rem] border border-[#1F232B] space-y-3 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity -rotate-12"><AlertCircle size={100} /></div>
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 mb-2"><AlertCircle className="text-red-500" size={20} /></div>
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.stats.debt}</p>
              <h4 className="text-4xl font-black text-red-400 tracking-tighter">${stats.debt.toLocaleString()}</h4>
            </div>
          </div>

          <div className="bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] overflow-hidden shadow-2xl">
            {isStudent ? (
              <div className="p-10 space-y-10">
                {myInvoices.map(inv => (
                  <div key={inv.id} className="bg-[#0A0C10] rounded-[3rem] border border-[#1F232B] overflow-hidden group hover:border-purple-500/30 transition-all duration-500 shadow-inner">
                    <div className="p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-[#1F232B]">
                      <div className="space-y-4 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                          <Book size={12} className="text-purple-400" />
                          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{inv.course}</span>
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{inv.id}</h3>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-[#12141C] border border-white/5 flex items-center justify-center text-gray-500"><UserCheck size={14} /></div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.personal.instructor} <span className="text-gray-200">{inv.instructorName || 'HUB Expert'}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="px-6 py-4 bg-[#12141C] rounded-[1.5rem] border border-white/5 text-center min-w-[120px]">
                           <p className="text-[8px] font-black text-gray-600 uppercase mb-1">{t.personal.totalPrice}</p>
                           <p className="text-lg font-black text-gray-200">${inv.total}</p>
                        </div>
                        <div className="px-6 py-4 bg-[#12141C] rounded-[1.5rem] border border-white/5 text-center min-w-[120px]">
                           <p className="text-[8px] font-black text-gray-600 uppercase mb-1">{t.personal.remaining}</p>
                           <p className={`text-lg font-black ${inv.total - inv.paid > 0 ? 'text-red-400' : 'text-green-400'}`}>${inv.total - inv.paid}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-10 bg-[#0D0F14]/40">
                      <div className="flex items-center gap-3 mb-6"><History size={16} className="text-purple-400" /><h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.personal.history}</h4></div>
                      <div className="grid grid-cols-1 gap-3">
                        {inv.payments.length > 0 ? inv.payments.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-6 bg-[#12141C] rounded-2xl border border-white/5 group/pay hover:border-purple-500/20 transition-all">
                            <div className="flex items-center gap-5">
                              <div className="p-3 bg-green-500/10 rounded-xl group-hover/pay:scale-110 transition-transform"><ArrowDownCircle size={18} className="text-green-500" /></div>
                              <div><p className="text-base font-black text-gray-100">${p.amount}</p>{p.note && <p className="text-[10px] font-medium text-gray-600 mt-0.5">"{p.note}"</p>}</div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2"><Calendar size={12} className="text-purple-400" /> {p.date}</span>
                          </div>
                        )) : (
                          <div className="py-10 text-center border-2 border-dashed border-[#1F232B] rounded-3xl"><p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{t.personal.noPayments}</p></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-[#1F232B] flex items-center justify-between">
                   <div className="relative w-full max-w-sm">
                      <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-16 pr-8 text-xs font-bold text-gray-100 outline-none focus:ring-1 ring-purple-500/30 transition-all" placeholder="Шукати студента..." value={search} onChange={e => setSearch(e.target.value)} />
                   </div>
                </div>
                <table className="w-full text-left">
                   <thead><tr className="bg-[#0A0C10]"><th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">{t.table.user}</th><th className="px-10 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest text-right pr-12">{t.table.debt}</th></tr></thead>
                   <tbody className="divide-y divide-[#1F232B]">
                      {studentSummary.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map(s => (
                        <tr key={s.name} className="hover:bg-white/5 transition-all cursor-pointer group" onClick={() => setSelectedStudent(s.name)}>
                          <td className="px-10 py-6 font-black uppercase text-sm text-gray-200">{s.name}</td>
                          <td className={`px-10 py-6 font-black text-sm text-right pr-12 ${s.debt > 0 ? 'text-red-400' : 'text-green-400'}`}>${s.debt.toLocaleString()} <ChevronRight size={14} className="inline ml-2 opacity-0 group-hover:opacity-100 transition-all" /></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ADMIN DETAIL VIEW */}
      {!isStudent && selectedStudent && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0C10] animate-in slide-in-from-right duration-500">
           <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center gap-6 px-10 shrink-0">
              <button onClick={() => setSelectedStudent(null)} className="p-3 bg-[#0A0C10] border border-[#1F232B] rounded-xl text-gray-400 hover:text-white transition-all shadow-xl"><ChevronLeft size={20} /></button>
              <div><p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">ФІНАНСОВА КАРТКА</p><h2 className="text-xl font-black text-white uppercase tracking-tight">{selectedStudent}</h2></div>
           </header>
           <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-10">
                 {invoices.filter(i => i.student === selectedStudent).map(inv => (
                   <div key={inv.id} className="bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] overflow-hidden shadow-2xl transition-all">
                      <div className="p-10 flex flex-col md:flex-row justify-between items-start gap-8 border-b border-[#1F232B]">
                         <div className="space-y-4 text-left">
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">{inv.course}</p>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{inv.id}</h3>
                            <div className="flex items-center gap-2"><Briefcase size={14} className="text-gray-600" /><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Викладач: {inv.instructorName || 'N/A'}</span></div>
                            <div className="flex gap-4 pt-4">
                               <div className="bg-[#0A0C10] px-6 py-3 rounded-2xl border border-white/5"><p className="text-[8px] font-black text-gray-500 uppercase mb-1">Ціна</p><p className="text-sm font-black text-gray-200">${inv.total}</p></div>
                               <div className="bg-[#0A0C10] px-6 py-3 rounded-2xl border border-white/5"><p className="text-[8px] font-black text-gray-500 uppercase mb-1">Сплачено</p><p className="text-sm font-black text-green-400">${inv.paid}</p></div>
                               <div className="bg-[#0A0C10] px-6 py-3 rounded-2xl border border-white/5"><p className="text-[8px] font-black text-gray-500 uppercase mb-1">Борг</p><p className="text-sm font-black text-red-400">${inv.total - inv.paid}</p></div>
                            </div>
                         </div>
                         <button onClick={() => { setCurrentInvoiceId(inv.id); setIsPaymentModalOpen(true); }} className="px-8 py-5 bg-green-600/10 border border-green-500/20 text-green-400 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-green-600 hover:text-white transition-all shadow-xl active:scale-95"><DollarSign size={16} className="inline mr-2" /> {t.modal.addPay}</button>
                      </div>
                      <div className="p-10 bg-[#0D0F14]/60">
                         <div className="flex items-center gap-3 mb-8"><History size={16} className="text-gray-600" /><h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.personal.history}</h4></div>
                         <div className="grid grid-cols-1 gap-3">
                            {inv.payments.length > 0 ? inv.payments.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-6 bg-[#12141C] rounded-[2rem] border border-white/5 hover:border-purple-500/20 transition-all">
                                 <div className="flex items-center gap-5">
                                    <div className="p-3 bg-green-500/10 rounded-xl"><ArrowDownCircle size={18} className="text-green-500" /></div>
                                    <div><p className="text-base font-black text-gray-100">${p.amount}</p>{p.note && <p className="text-[10px] font-medium text-gray-600 mt-0.5">"{p.note}"</p>}</div>
                                 </div>
                                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{p.date}</span>
                              </div>
                            )) : (
                              <p className="text-[10px] text-gray-700 uppercase font-black tracking-widest text-center py-10">Операцій не знайдено</p>
                            )}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {!isStudent && isInvoiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#12141C] w-full max-w-xl rounded-[4rem] border border-[#1F232B] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 border-b border-[#1F232B] flex items-center justify-between text-left">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t.modal.newInv}</h3>
                 <button onClick={() => setIsInvoiceModalOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={28} /></button>
              </div>
              <form onSubmit={handleCreateInvoice} className="p-10 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2 text-left px-2"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.student}</label><input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={invoiceForm.student} onChange={e => setInvoiceForm({...invoiceForm, student: e.target.value})} /></div>
                    <div className="space-y-2 text-left px-2"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.instructor}</label><input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={invoiceForm.instructorName} onChange={e => setInvoiceForm({...invoiceForm, instructorName: e.target.value})} /></div>
                    <div className="space-y-2 text-left px-2"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.course}</label><input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={invoiceForm.course} onChange={e => setInvoiceForm({...invoiceForm, course: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4 px-2">
                       <div className="space-y-2 text-left"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.total}</label><input required type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-white outline-none" value={invoiceForm.total} onChange={e => setInvoiceForm({...invoiceForm, total: e.target.value})} /></div>
                       <div className="space-y-2 text-left"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">Дедлайн</label><input required type="date" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} /></div>
                    </div>
                 </div>
                 <div className="pt-6 flex gap-4 px-2">
                    <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="flex-1 py-5 bg-[#1F232B] text-gray-400 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">{t.modal.cancel}</button>
                    <button type="submit" className="flex-[2] py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all">{t.modal.save}</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#12141C] w-full max-w-lg rounded-[4rem] border border-[#1F232B] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 border-b border-[#1F232B] flex items-center justify-between text-left">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t.modal.addPay}</h3>
                 <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={28} /></button>
              </div>
              <form onSubmit={handleAddPayment} className="p-10 space-y-8">
                 <div className="bg-[#0A0C10] p-10 rounded-[3rem] border border-white/5 text-center shadow-inner group">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.modal.remaining}</p>
                    <p className="text-4xl font-black text-red-400 tracking-tighter group-hover:scale-110 transition-transform">${currentInvoiceId ? (invoices.find(i => i.id === currentInvoiceId)!.total - invoices.find(i => i.id === currentInvoiceId)!.paid) : 0}</p>
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-2 text-left px-2"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.amount}</label><div className="relative"><DollarSign size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-green-500/50" /><input required type="number" autoFocus className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-6 pl-14 pr-8 text-2xl font-black text-green-400 outline-none focus:ring-1 ring-green-500/50" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div></div>
                    <div className="space-y-2 text-left px-2"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.date}</label><input required type="date" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} /></div>
                    <div className="space-y-2 text-left px-2"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">Коментар</label><input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-white outline-none" placeholder="Готівка, переказ тощо" value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} /></div>
                 </div>
                 <div className="pt-6 flex gap-4 px-2 pb-4">
                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-5 bg-[#1F232B] text-gray-400 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all hover:text-white">{t.modal.cancel}</button>
                    <button type="submit" className="flex-[2] py-5 bg-green-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-900/20 transition-all hover:bg-green-700">{t.modal.save}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceHub;
