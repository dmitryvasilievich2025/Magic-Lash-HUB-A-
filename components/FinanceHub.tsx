import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, AlertCircle, CreditCard, 
  Plus, Search, Edit3, X, History, DollarSign, Trash2, Save, BarChart3, PieChart
} from 'lucide-react';
import { Invoice, PaymentRecord, Language, UserRole } from '../types';
import { saveInvoiceToDB, updateInvoiceInDB } from '../services/firebase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

interface Props {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>; // Now used via Firebase listeners in App.tsx
  userRole?: UserRole;
  studentName?: string;
  lang: Language;
}

const FinanceHub: React.FC<Props> = ({ invoices, userRole = 'admin', studentName = 'Марія Іванова', lang }) => {
  const [search, setSearch] = useState('');
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
      stats: { revenue: isStudent ? 'СПЛАЧЕНО МНОЮ' : 'ОТРИМАНО (HUB)', debt: isStudent ? 'МІЙ БОРГ' : 'ОЧІКУЄТЬСЯ (БОРГ)' },
      chartTitle: 'Фінансова Динаміка (Поточний Рік)',
      chartRevenue: 'Надходження',
      chartDebt: 'Заборгованість',
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
      statuses: { paid: 'Оплачено', partial: 'Частково', unpaid: 'Неоплачено', overdue: 'Протерміновано' }
    },
    en: {
        title: isStudent ? 'MY FINANCES' : 'FINANCIAL HUB',
        subtitle: isStudent ? 'Payment history and debt' : 'CASHFLOW MANAGEMENT',
        newInvoice: 'New Invoice',
        stats: { revenue: isStudent ? 'PAID BY ME' : 'RECEIVED (HUB)', debt: isStudent ? 'MY DEBT' : 'EXPECTED (DEBT)' },
        chartTitle: 'Financial Dynamics (Current Year)',
        chartRevenue: 'Revenue',
        chartDebt: 'Debt',
        table: { user: 'Student', debt: 'Total Debt', teacher: 'Instructor', status: 'Status', actions: 'Actions', course: 'Course' },
        modal: {
            newInv: 'Create Invoice',
            editInv: 'Edit Invoice',
            addPay: 'Record Payment',
            student: 'Student (First Last Name)',
            instructor: 'Instructor / Coach',
            course: 'Program Name',
            total: 'Total Amount ($)',
            date: 'Due Date',
            amount: 'Payment Amount ($)',
            remaining: 'Remaining:',
            save: 'Save Changes',
            create: 'Create Invoice',
            cancel: 'Cancel'
        },
        statuses: { paid: 'Paid', partial: 'Partial', unpaid: 'Unpaid', overdue: 'Overdue' }
    }
  }[lang] || { uk: {} }), [lang, isStudent]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.student || !invoiceForm.total) return;
    
    const newInv = {
      student: invoiceForm.student,
      instructorName: invoiceForm.instructorName,
      course: invoiceForm.course,
      total: Number(invoiceForm.total),
      paid: 0,
      status: 'unpaid',
      dueDate: invoiceForm.dueDate,
      payments: []
    };
    await saveInvoiceToDB(newInv);
    setIsInvoiceModalOpen(false);
    setInvoiceForm({ student: '', instructorName: '', course: '', total: '', dueDate: new Date().toISOString().split('T')[0] });
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const total = Number(invoiceForm.total);
    const paid = editingInvoice.paid;
    let status: Invoice['status'] = 'partial';
    if (paid >= total) status = 'paid';
    else if (paid <= 0) status = 'unpaid';

    await updateInvoiceInDB(editingInvoice.id, {
      student: invoiceForm.student,
      instructorName: invoiceForm.instructorName,
      course: invoiceForm.course,
      total: total,
      status: status,
      dueDate: invoiceForm.dueDate
    });

    setIsEditModalOpen(false);
    setEditingInvoice(null);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInvoiceId || !paymentForm.amount) return;
    
    const inv = invoices.find(i => i.id === currentInvoiceId);
    if (!inv) return;

    const amount = Number(paymentForm.amount);
    const newPayment: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      amount,
      date: paymentForm.date,
      note: paymentForm.note
    };

    const updatedPayments = [...inv.payments, newPayment];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    let status: Invoice['status'] = 'partial';
    if (totalPaid >= inv.total) status = 'paid';
    else if (totalPaid <= 0) status = 'unpaid';

    await updateInvoiceInDB(currentInvoiceId, { 
      payments: updatedPayments, 
      paid: totalPaid, 
      status 
    });

    setIsPaymentModalOpen(false);
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
  };

  const filteredInvoices = invoices.filter(i => 
    isStudent ? true : i.student.toLowerCase().includes(search.toLowerCase()) || i.course.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = filteredInvoices.reduce((a, b) => a + b.paid, 0);
  const totalDebt = filteredInvoices.reduce((a, b) => a + (b.total - b.paid), 0);

  // Chart Data Calculation
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => ({
      name: new Date(0, i).toLocaleString(lang === 'uk' ? 'uk-UA' : 'en-US', { month: 'short' }),
      revenue: 0,
      debt: 0
    }));

    invoices.forEach(inv => {
        // Debt: Calculated based on Invoice Due Date
        // If invoice is unpaid/partial, the remaining amount counts as debt in the due month
        const dueDate = new Date(inv.dueDate);
        if (dueDate.getFullYear() === currentYear) {
            const monthIdx = dueDate.getMonth();
            const remaining = Math.max(0, inv.total - inv.paid);
            if (remaining > 0) {
                months[monthIdx].debt += remaining;
            }
        }

        // Revenue: Calculated based on actual Payment Dates
        inv.payments.forEach(p => {
            const payDate = new Date(p.date);
            if (payDate.getFullYear() === currentYear) {
                const monthIdx = payDate.getMonth();
                months[monthIdx].revenue += p.amount;
            }
        });
    });

    return months;
  }, [invoices, lang]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0C10] text-left animate-in fade-in">
      <header className="h-20 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t.title}</h2>
          <p className="text-xl font-black text-gray-100 uppercase tracking-tight">{t.subtitle}</p>
        </div>
        {!isStudent && (
          <div className="flex items-center gap-4">
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
            <button onClick={() => setIsInvoiceModalOpen(true)} className="px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-purple-700 shadow-xl shadow-purple-900/20">
              <Plus size={14} /> {t.newInvoice}
            </button>
          </div>
        )}
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

          {/* FINANCIAL CHART */}
          <div className="bg-[#12141C] p-8 rounded-[3.5rem] border border-[#1F232B] shadow-2xl space-y-6">
             <div className="flex items-center justify-between px-4">
               <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{t.chartTitle}</h3>
                  <div className="flex gap-4 mt-2">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{t.chartRevenue}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{t.chartDebt}</span>
                     </div>
                  </div>
               </div>
               <div className="p-3 bg-white/5 rounded-2xl text-gray-500">
                  <BarChart3 size={20} />
               </div>
             </div>
             
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F232B" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0C10', border: '1px solid #1F232B', borderRadius: '1rem', color: '#F3F4F6' }}
                        itemStyle={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="revenue" name={t.chartRevenue} fill="#22C55E" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="debt" name={t.chartDebt} fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-[#12141C] rounded-[3.5rem] border border-[#1F232B] overflow-hidden shadow-2xl">
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
                           <button onClick={() => { setEditingInvoice(inv); setInvoiceForm({ student: inv.student, instructorName: inv.instructorName || '', course: inv.course, total: inv.total.toString(), dueDate: inv.dueDate }); setIsEditModalOpen(true); }} className="p-2.5 bg-white/5 rounded-xl text-gray-500 hover:text-purple-400 transition-all"><Edit3 size={16} /></button>
                           <button onClick={() => { setCurrentInvoiceId(inv.id); setIsPaymentModalOpen(true); }} className="p-2.5 bg-white/5 rounded-xl text-gray-500 hover:text-green-400 transition-all"><DollarSign size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: NEW INVOICE */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12141C] w-full max-w-lg rounded-[2.5rem] border border-[#1F232B] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white uppercase">{t.modal.newInv}</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.student}</label>
                <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-purple-500/50" value={invoiceForm.student} onChange={e => setInvoiceForm({...invoiceForm, student: e.target.value})} placeholder="Ім'я Прізвище" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.instructor}</label>
                <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-purple-500/50" value={invoiceForm.instructorName} onChange={e => setInvoiceForm({...invoiceForm, instructorName: e.target.value})} placeholder="Ім'я Викладача" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.course}</label>
                   <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-purple-500/50" value={invoiceForm.course} onChange={e => setInvoiceForm({...invoiceForm, course: e.target.value})} placeholder="Назва курсу" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.date}</label>
                   <input required type="date" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-purple-500/50" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} />
                 </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.total}</label>
                <div className="relative">
                   <DollarSign size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" />
                   <input required type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-purple-500/50" value={invoiceForm.total} onChange={e => setInvoiceForm({...invoiceForm, total: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-2">
                <Plus size={16} /> {t.modal.create}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INVOICE */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12141C] w-full max-w-lg rounded-[2.5rem] border border-[#1F232B] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white uppercase">{t.modal.editInv}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateInvoice} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.student}</label>
                <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-purple-500/50" value={invoiceForm.student} onChange={e => setInvoiceForm({...invoiceForm, student: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.instructor}</label>
                <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-purple-500/50" value={invoiceForm.instructorName} onChange={e => setInvoiceForm({...invoiceForm, instructorName: e.target.value})} placeholder="Ім'я Викладача" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.course}</label>
                   <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-purple-500/50" value={invoiceForm.course} onChange={e => setInvoiceForm({...invoiceForm, course: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.date}</label>
                   <input required type="date" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-purple-500/50" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} />
                 </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.total}</label>
                <div className="relative">
                   <DollarSign size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" />
                   <input required type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-purple-500/50" value={invoiceForm.total} onChange={e => setInvoiceForm({...invoiceForm, total: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-2">
                <Save size={16} /> {t.modal.save}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PAYMENT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12141C] w-full max-w-lg rounded-[2.5rem] border border-[#1F232B] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white uppercase">{t.modal.addPay}</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPayment} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-3">{t.modal.amount}</label>
                <div className="relative">
                   <DollarSign size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-green-500" />
                   <input required type="number" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-6 pl-14 pr-6 text-2xl font-black text-white outline-none focus:border-green-500/50" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-3">Нотатка</label>
                <input className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-green-500/50" value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} placeholder="Призначення платежу..." />
              </div>
              <button type="submit" className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-2">
                <DollarSign size={16} /> {t.modal.addPay}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceHub;