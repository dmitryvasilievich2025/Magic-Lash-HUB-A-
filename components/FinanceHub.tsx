
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, AlertCircle, CreditCard, 
  Plus, Search, Edit3, X, ChevronLeft, 
  Calendar, ChevronRight, User, Book, 
  History, DollarSign, ArrowDownCircle, Trash2, GraduationCap, Briefcase, UserCheck, Save
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({ 
    student: '', 
    instructorName: '', 
    course: '', 
    total: '', 
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
  });
  
  const [paymentForm, setPaymentForm] = useState({ 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    note: '' 
  });

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
      table: { user: 'Студент', debt: 'Загальний Борг', teacher: 'Викладач', status: 'Статус', actions: 'Дії', course: 'Курс' },
      modal: {
        newInv: 'Створити інвойс',
        editInv: 'Редагувати інвойс',
        addPay: 'Фіксувати оплату',
        student: 'Студент (Прізвище Ім\'я)',
        instructor: 'Викладач / Тренер',
        course: 'Назва напрямку (курсу)',
        total: 'Загальна сума до сплати ($)',
        date: 'Дедлайн оплати',
        amount: 'Сума внеску ($)',
        remaining: 'Залишок до сплати:',
        save: 'Зберегти зміни',
        create: 'Створити інвойс',
        cancel: 'Скасувати'
      },
      personal: { history: 'Історія транзакцій', remaining: 'Залишок:' },
      statuses: {
        paid: 'Оплачено',
        partial: 'Частково',
        unpaid: 'Неоплачено',
        overdue: 'Протерміновано'
      }
    },
    en: {
      title: isStudent ? 'MY FINANCES' : 'FINANCE HUB',
      subtitle: isStudent ? 'History and debts' : 'CASHFLOW MANAGEMENT',
      newInvoice: 'New Invoice',
      stats: { revenue: 'TOTAL PAID', debt: 'EXPECTED DEBT' },
      table: { user: 'Student', debt: 'Debt', teacher: 'Instructor', status: 'Status', actions: 'Actions', course: 'Course' },
      modal: {
        newInv: 'Create Invoice',
        editInv: 'Edit Invoice',
        addPay: 'Add Payment',
        student: 'Student Full Name',
        instructor: 'Instructor',
        course: 'Program / Course',
        total: 'Total Amount ($)',
        date: 'Due Date',
        amount: 'Payment Amount ($)',
        remaining: 'Remaining Balance:',
        save: 'Save Changes',
        create: 'Create Invoice',
        cancel: 'Cancel'
      },
      personal: { history: 'Transaction History', remaining: 'Remaining:' },
      statuses: {
        paid: 'Paid',
        partial: 'Partial',
        unpaid: 'Unpaid',
        overdue: 'Overdue'
      }
    }
  }[lang]), [lang, isStudent]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.student || !invoiceForm.total) return;
    
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
    setInvoiceForm({ student: '', instructorName: '', course: '', total: '', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvoiceForm({
      student: inv.student,
      instructorName: inv.instructorName || '',
      course: inv.course,
      total: inv.total.toString(),
      dueDate: inv.dueDate
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setInvoices(prev => prev.map(inv => {
      if (inv.id === editingInvoice.id) {
        const total = Number(invoiceForm.total);
        const paid = inv.paid;
        let status: Invoice['status'] = 'partial';
        if (paid >= total) status = 'paid';
        else if (paid <= 0) status = 'unpaid';

        return {
          ...inv,
          student: invoiceForm.student,
          instructorName: invoiceForm.instructorName,
          course: invoiceForm.course,
          total: total,
          status: status,
          dueDate: invoiceForm.dueDate
        };
      }
      return inv;
    }));

    setIsEditModalOpen(false);
    setEditingInvoice(null);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInvoiceId || !paymentForm.amount) return;
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

  const filteredInvoices = invoices.filter(i => 
    isStudent ? i.student === studentName : i.student.toLowerCase().includes(search.toLowerCase()) || i.course.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = (isStudent ? filteredInvoices : invoices).reduce((a, b) => a + b.paid, 0);
  const totalDebt = (isStudent ? filteredInvoices : invoices).reduce((a, b) => a + (b.total - b.paid), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0C10] text-left animate-in fade-in">
      <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t.title}</h2>
          <p className="text-xl font-black text-gray-100 uppercase tracking-tight">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {!isStudent && (
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Пошук..." 
                className="bg-[#0A0C10] border border-[#1F232B] rounded-xl py-2 pl-12 pr-4 text-xs font-bold text-white outline-none focus:ring-1 ring-purple-500/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          {!isStudent && (
            <button onClick={() => setIsInvoiceModalOpen(true)} className="px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-purple-700 shadow-xl shadow-purple-900/20">
              <Plus size={14} /> {t.newInvoice}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#12141C] p-10 rounded-[2.5rem] border border-[#1F232B] space-y-3 shadow-xl">
              <TrendingUp className="text-green-500" size={24} />
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.stats.revenue}</p>
              <h4 className="text-4xl font-black text-white tracking-tighter">${totalPaid.toLocaleString()}</h4>
            </div>
            <div className="bg-[#12141C] p-10 rounded-[2.5rem] border border-[#1F232B] space-y-3 shadow-xl">
              <AlertCircle className="text-red-500" size={24} />
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">{t.stats.debt}</p>
              <h4 className="text-4xl font-black text-red-400 tracking-tighter">${totalDebt.toLocaleString()}</h4>
            </div>
          </div>

          <div className="bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] overflow-hidden shadow-2xl">
            {isStudent ? (
              <div className="p-10 space-y-10">
                {filteredInvoices.map(inv => (
                  <div key={inv.id} className="bg-[#0A0C10] rounded-[3rem] border border-[#1F232B] overflow-hidden p-10 space-y-8">
                     <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-purple-400 uppercase mb-1">{inv.course}</p>
                          <h3 className="text-2xl font-black text-white">{inv.id}</h3>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] font-black text-gray-600 uppercase mb-1">{t.personal.remaining}</p>
                           <p className="text-2xl font-black text-red-400">${inv.total - inv.paid}</p>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.personal.history}</p>
                        <div className="grid gap-3">
                           {inv.payments.length > 0 ? inv.payments.map(p => (
                             <div key={p.id} className="flex justify-between items-center bg-[#12141C] p-4 rounded-2xl border border-white/5">
                                <span className="text-xs font-black text-gray-200">${p.amount} <span className="text-gray-600 font-medium">— {p.note}</span></span>
                                <span className="text-[9px] font-bold text-gray-500 uppercase">{p.date}</span>
                             </div>
                           )) : (
                             <p className="text-xs text-gray-600 italic">Оплат ще не було</p>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0A0C10]">
                    <tr className="text-[9px] font-black uppercase text-gray-500 tracking-widest border-b border-[#1F232B]">
                      <th className="px-10 py-6">{t.table.user}</th>
                      <th className="px-10 py-6">{t.table.course}</th>
                      <th className="px-10 py-6 text-right">Сума ($)</th>
                      <th className="px-10 py-6 text-right">{t.table.debt}</th>
                      <th className="px-10 py-6 text-center">{t.table.status}</th>
                      <th className="px-10 py-6 text-center">{t.table.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F232B]">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-white/5 transition-all group">
                        <td className="px-10 py-6 font-black uppercase text-xs text-gray-200">{inv.student}</td>
                        <td className="px-10 py-6 text-xs font-bold text-gray-400">{inv.course}</td>
                        <td className="px-10 py-6 text-xs font-black text-right text-white">${inv.total}</td>
                        <td className={`px-10 py-6 text-xs font-black text-right ${inv.total - inv.paid > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          ${(inv.total - inv.paid).toLocaleString()}
                        </td>
                        <td className="px-10 py-6 text-center">
                           <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                             inv.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                             inv.status === 'partial' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                             'bg-red-500/10 text-red-400 border border-red-500/20'
                           }`}>
                             {t.statuses[inv.status]}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <button 
                               onClick={() => handleOpenEdit(inv)}
                               className="p-2.5 bg-white/5 rounded-xl text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                             >
                               <Edit3 size={16} />
                             </button>
                             <button 
                               onClick={() => { setCurrentInvoiceId(inv.id); setIsPaymentModalOpen(true); }}
                               className="p-2.5 bg-white/5 rounded-xl text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                             >
                               <DollarSign size={16} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE / EDIT INVOICE MODAL */}
      {(isInvoiceModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#12141C] w-full max-w-xl rounded-[4rem] border border-[#1F232B] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 border-b border-[#1F232B] flex items-center justify-between text-left">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                   {isEditModalOpen ? t.modal.editInv : t.modal.newInv}
                 </h3>
                 <button onClick={() => { setIsInvoiceModalOpen(false); setIsEditModalOpen(false); }} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={28} /></button>
              </div>
              <form onSubmit={isEditModalOpen ? handleUpdateInvoice : handleCreateInvoice} className="p-10 space-y-6 text-left">
                 <div className="space-y-4">
                    <div className="space-y-2 px-2">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.student}</label>
                      <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={invoiceForm.student} onChange={e => setInvoiceForm({...invoiceForm, student: e.target.value})} placeholder="Марія Іванова" />
                    </div>
                    <div className="space-y-2 px-2">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.instructor}</label>
                      <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={invoiceForm.instructorName} onChange={e => setInvoiceForm({...invoiceForm, instructorName: e.target.value})} />
                    </div>
                    <div className="space-y-2 px-2">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.course}</label>
                      <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-xs font-bold text-white outline-none focus:ring-1 ring-purple-500/50" value={invoiceForm.course} onChange={e => setInvoiceForm({...invoiceForm, course: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 px-2">
                       <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.total}</label>
                         <input required type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none" value={invoiceForm.total} onChange={e => setInvoiceForm({...invoiceForm, total: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.date}</label>
                         <input required type="date" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} />
                       </div>
                    </div>
                 </div>
                 <div className="pt-6 flex gap-4 px-2">
                    <button type="button" onClick={() => { setIsInvoiceModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-5 bg-[#1F232B] text-gray-400 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">{t.modal.cancel}</button>
                    <button type="submit" className="flex-[2] py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center gap-2">
                       {isEditModalOpen ? <Save size={16} /> : <Plus size={16} />}
                       {isEditModalOpen ? t.modal.save : t.modal.create}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* ADD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#12141C] w-full max-w-md rounded-[3rem] border border-[#1F232B] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b border-[#1F232B] flex items-center justify-between text-left">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">{t.modal.addPay}</h3>
                 <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddPayment} className="p-8 space-y-6 text-left">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">{t.modal.amount}</label>
                       <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                          <input required type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-xl py-4 pl-10 pr-4 text-sm font-bold text-white outline-none" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">Дата платежу</label>
                       <input required type="date" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-xl py-4 px-6 text-sm font-bold text-white outline-none" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-4">Примітка</label>
                       <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-xl py-4 px-6 text-xs font-bold text-white outline-none" value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} placeholder="Напр. Готівка, переказ..." />
                    </div>
                 </div>
                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-4 bg-[#1F232B] text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Скасувати</button>
                    <button type="submit" className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-900/20 transition-all">Зберегти</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceHub;
