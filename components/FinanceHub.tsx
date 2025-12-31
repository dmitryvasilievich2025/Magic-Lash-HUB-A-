
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, AlertCircle, CreditCard, 
  Plus, Search, Edit3, X, History, DollarSign, Trash2, Save
} from 'lucide-react';
import { Invoice, PaymentRecord, Language, UserRole } from '../types';
import { saveInvoiceToDB, updateInvoiceInDB } from '../services/firebase';

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

      {/* MODALS remain similar but useFirestore helpers */}
      {/* ... */}
    </div>
  );
};

export default FinanceHub;
