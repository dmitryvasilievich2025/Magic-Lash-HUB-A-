import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Star, ArrowRight, Zap, ShieldCheck, Sparkles, 
  CreditCard, X, CheckCircle2, Shield, Apple, Smartphone,
  Mail, User, ChevronDown, Loader2, Trophy, Clock, MessageSquare, Phone, Target, Play
} from 'lucide-react';
import { Course, Invoice, TabType, Language } from '../types';

interface Props {
  courses: Course[];
  onPurchase: (invoice: Invoice) => void;
  onNavigate: (tab: TabType) => void;
  lang: Language;
  user?: any;
}

type CheckoutStep = 'form' | 'processing' | 'success';

const Showcase: React.FC<Props> = ({ courses, onPurchase, onNavigate, lang, user }) => {
  const [selectedProduct, setSelectedProduct] = useState<Course | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<Course | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('form');
  
  // Дані форми
  const [firstName, setFirstName] = useState(user?.displayName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.displayName?.split(' ')[1] || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [userPhone, setUserPhone] = useState('');
  const [leadSource, setLeadSource] = useState('instagram');
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');
  const [progress, setProgress] = useState(0);

  const t = useMemo(() => ({
    uk: {
      badge: 'Вибери свій напрямок',
      title: 'HUB МОЖЛИВОСТЕЙ',
      subtitle: 'InLei® System для ламінування або Magic Lash для ідеального нарощування. Оберіть свій шлях до успіху.',
      bannerTitle: 'Не знаєш, що обрати?',
      bannerSub: 'Запитай нашого ШІ-асистента ARI. Вона підбере програму саме для твого рівня.',
      askButton: 'Запитати ARI',
      details: 'Деталі',
      select: 'Обрати',
      checkoutTitle: 'Реєстрація у HUB',
      checkoutSub: 'Починаємо майбутнє',
      firstName: "Твоє ім'я",
      lastName: 'Прізвище',
      phone: 'Номер телефону',
      source: 'Звідки ви про нас дізналися?',
      sourceOptions: {
        instagram: 'Instagram',
        whatsapp: 'WhatsApp / Messengers',
        ads: 'Реклама (FB/IG)',
        referral: 'Рекомендація / Реферал',
        other: 'Інше'
      },
      payment: 'Метод оплати',
      payButton: 'ПРИЄДНАТИСЯ ТА ВІДКРИТИ ARI',
      success: 'Ти в команді!',
      toProgram: 'ДО ПРОГРАМИ',
      courseDetails: 'Деталі Напрямку',
      syllabus: 'Програма курсу',
      startNow: 'Почати Навчання'
    },
    en: {
      badge: 'Choose your direction',
      title: 'HUB OF OPPORTUNITIES',
      subtitle: 'InLei® System for lamination or Magic Lash for perfect extensions. Choose your path to success.',
      bannerTitle: 'Don’t know what to choose?',
      bannerSub: 'Ask our AI assistant ARI. She will select a program just for your level.',
      askButton: 'Ask ARI',
      details: 'Details',
      select: 'Select',
      checkoutTitle: 'Registration in HUB',
      checkoutSub: 'Starting the future',
      firstName: 'First Name',
      lastName: 'Last Name',
      phone: 'Phone Number',
      source: 'How did you hear about us?',
      sourceOptions: {
        instagram: 'Instagram',
        whatsapp: 'WhatsApp / Messengers',
        ads: 'Ads (FB/IG)',
        referral: 'Referral',
        other: 'Other'
      },
      payment: 'Payment Method',
      payButton: 'JOIN AND OPEN ARI',
      success: 'You are in!',
      toProgram: 'TO PROGRAM',
      courseDetails: 'Program Details',
      syllabus: 'Syllabus',
      startNow: 'Start Learning'
    }
  }[lang]), [lang]);

  useEffect(() => {
    if (checkoutStep === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setCheckoutStep('success'), 600);
            return 100;
          }
          return prev + 4;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [checkoutStep]);

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('processing');
    setProgress(0);
    
    if (selectedProduct) {
      const newInvoice: Invoice = {
        id: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
        student: `${firstName} ${lastName}`.trim() || (lang === 'uk' ? 'Новий Спеціаліст' : 'New Specialist'),
        studentId: user?.uid,
        course: selectedProduct.title || 'Напрямок',
        total: selectedProduct.price || 0,
        paid: selectedProduct.price || 0,
        status: 'paid',
        dueDate: new Date().toISOString().split('T')[0],
        payments: [{
          id: `p-${Date.now()}`,
          amount: selectedProduct.price || 0,
          date: new Date().toISOString().split('T')[0],
          note: `Registration: ${userPhone} | Source: ${leadSource}`
        }]
      };
      onPurchase(newInvoice);
    }
  };

  const closeCheckout = () => {
    setSelectedProduct(null);
    setCheckoutStep('form');
    setFirstName(user?.displayName?.split(' ')[0] || '');
    setLastName(user?.displayName?.split(' ')[1] || '');
    setUserEmail(user?.email || '');
    setUserPhone('');
    setLeadSource('instagram');
    setProgress(0);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0C10] p-10 custom-scrollbar animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-16 pb-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
            <Sparkles size={12} /> {t.badge}
          </div>
          <h1 className="text-7xl md:text-8xl font-black text-gray-100 tracking-tighter uppercase">{t.title}</h1>
          <p className="text-gray-400 max-w-2xl mx-auto font-medium">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {courses.map((product) => (
            <div key={product.id} className="bg-[#12141C] rounded-[3.5rem] overflow-hidden border border-[#1F232B] shadow-2xl hover:shadow-purple-500/10 transition-all group flex flex-col h-full hover:-translate-y-2 duration-500">
              <div className="h-64 relative overflow-hidden">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100" alt={product.title} />
                <div className={`absolute top-6 right-6 bg-[#12141C]/90 backdrop-blur-md px-5 py-2.5 rounded-2xl font-black text-sm border border-white/10 ${product.isExtensionCourse ? 'text-purple-400' : 'text-yellow-500'} shadow-xl`}>
                  ${product.price}
                </div>
              </div>
              <div className="p-8 space-y-4 flex flex-col flex-1">
                <h3 className={`text-xl font-black text-gray-100 transition-colors ${product.isExtensionCourse ? 'group-hover:text-purple-400' : 'group-hover:text-yellow-500'}`}>
                  {product.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 font-medium flex-1">{product.description}</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={() => setDetailsProduct(product)} className="py-4 bg-[#1F232B] text-gray-300 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#2D333D] transition-all">
                    {t.details}
                  </button>
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    className={`py-4 ${product.isExtensionCourse ? 'bg-purple-600 shadow-purple-500/20 hover:bg-purple-700' : 'bg-yellow-600 shadow-yellow-500/20 hover:bg-yellow-700'} text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2`}
                  >
                    <ShoppingBag size={14} /> {t.select}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {detailsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#12141C] w-full max-w-4xl rounded-[3.5rem] border border-[#1F232B] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-300 relative">
             <button onClick={() => setDetailsProduct(null)} className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-white/10 rounded-full text-white z-20"><X size={24} /></button>
             
             <div className="w-full md:w-1/3 relative h-64 md:h-auto">
                <img src={detailsProduct.image} className="w-full h-full object-cover opacity-80" alt={detailsProduct.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12141C] to-transparent md:bg-gradient-to-r" />
             </div>
             
             <div className="flex-1 p-10 overflow-y-auto custom-scrollbar text-left space-y-8">
                <div>
                   <div className={`inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-lg text-[9px] font-black uppercase tracking-widest border ${detailsProduct.isExtensionCourse ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                      <Sparkles size={10} /> {detailsProduct.isExtensionCourse ? 'Extension' : 'Lamination'}
                   </div>
                   <h2 className="text-3xl font-black text-white uppercase leading-tight mb-2">{detailsProduct.title}</h2>
                   <p className="text-gray-400 text-sm font-medium leading-relaxed">{detailsProduct.description}</p>
                </div>

                <div className="space-y-4">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">{t.syllabus}</h3>
                   <div className="space-y-2">
                      {detailsProduct.lessons.length > 0 ? detailsProduct.lessons.map((lesson, idx) => (
                         <div key={lesson.id} className="p-4 bg-[#0A0C10] border border-[#1F232B] rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded-full bg-[#1F232B] flex items-center justify-center text-[10px] font-black text-gray-400">
                                  {idx + 1}
                               </div>
                               <span className="text-sm font-bold text-gray-200">{lesson.title}</span>
                            </div>
                            <div className="text-[10px] font-black text-gray-600 uppercase">{lesson.steps.length} steps</div>
                         </div>
                      )) : (
                         <div className="p-6 bg-[#0A0C10] border border-[#1F232B] rounded-2xl text-center text-gray-500 text-xs uppercase font-bold tracking-wider">
                            Програма формується
                         </div>
                      )}
                   </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-[#1F232B]">
                   <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Price</p>
                      <p className="text-3xl font-black text-white tracking-tight">${detailsProduct.price}</p>
                   </div>
                   <button 
                     onClick={() => { setDetailsProduct(null); setSelectedProduct(detailsProduct); }}
                     className={`px-8 py-4 ${detailsProduct.isExtensionCourse ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-500/20'} text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center gap-2`}
                   >
                     {t.startNow} <ArrowRight size={16} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="relative bg-[#12141C] w-full max-w-5xl rounded-[4rem] border border-[#1F232B] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300">
            <div className="w-full md:w-80 bg-[#0A0C10] p-10 border-r border-[#1F232B] hidden md:flex flex-col text-left">
              <div className="mb-8">
                 <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-4">{lang === 'uk' ? 'Твій вибір' : 'Your choice'}</h4>
                 <div className="relative rounded-3xl overflow-hidden aspect-square mb-6 border border-[#1F232B]">
                    <img src={selectedProduct.image} className="w-full h-full object-cover opacity-60" alt="" />
                 </div>
                 <h3 className={`text-lg font-black mb-2 ${selectedProduct.isExtensionCourse ? 'text-purple-400' : 'text-yellow-500'}`}>{selectedProduct.title}</h3>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[600px] overflow-y-auto">
              {checkoutStep === 'form' && (
                <>
                  <div className="p-10 border-b border-[#1F232B] flex items-center justify-between text-left shrink-0">
                    <div>
                      <h3 className="text-2xl font-black text-gray-100 uppercase tracking-tight">{t.checkoutTitle}</h3>
                      <p className={`text-[10px] font-black uppercase ${selectedProduct.isExtensionCourse ? 'text-purple-400' : 'text-yellow-500'} tracking-widest mt-1`}>
                         {t.checkoutSub}
                      </p>
                    </div>
                    <button onClick={closeCheckout} className="p-4 bg-[#0A0C10] hover:bg-[#1F232B] rounded-2xl text-gray-500 transition-colors"><X size={20} /></button>
                  </div>
                  
                  <form onSubmit={handleInitiatePayment} className="p-10 space-y-8 flex-1 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">{t.firstName}</label>
                        <div className="relative">
                          <User size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                          <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 focus:ring-1 ring-purple-500/50 outline-none" placeholder="Maria" value={firstName} onChange={e => setFirstName(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">{t.lastName}</label>
                        <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 px-8 text-sm font-bold text-gray-100 focus:ring-1 ring-purple-500/50 outline-none" placeholder="Ivanova" value={lastName} onChange={e => setLastName(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                          <input required type="email" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 focus:ring-1 ring-purple-500/50 outline-none" placeholder="example@mail.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">{t.phone}</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                          <input required type="tel" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 focus:ring-1 ring-purple-500/50 outline-none" placeholder="+380..." value={userPhone} onChange={e => setUserPhone(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">{t.source}</label>
                      <div className="relative">
                        <Target size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                        <select 
                          className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-12 text-sm font-bold text-gray-100 focus:ring-1 ring-purple-500/50 outline-none appearance-none" 
                          value={leadSource} 
                          onChange={e => setLeadSource(e.target.value)}
                        >
                          {Object.entries(t.sourceOptions).map(([k, v]) => (
                            <option key={k} value={k} className="bg-[#12141C]">{v}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">{t.payment}</label>
                      <div className="grid grid-cols-3 gap-4">
                        {['card', 'apple', 'google'].map(m => (
                          <button key={m} type="button" onClick={() => setPaymentMethod(m as any)} className={`p-6 border rounded-[2.5rem] flex flex-col items-center gap-3 transition-all ${paymentMethod === m ? 'border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-[#0A0C10] border-[#1F232B] text-gray-600'}`}>
                            {m === 'card' ? <CreditCard size={20} /> : m === 'apple' ? <Apple size={20} /> : <Smartphone size={20} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6">
                      <button type="submit" className={`w-full py-6 ${selectedProduct.isExtensionCourse ? 'bg-purple-600 shadow-purple-500/40 hover:bg-purple-700' : 'bg-yellow-600 shadow-yellow-500/40 hover:bg-yellow-700'} text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4`}>
                        {t.payButton} <ArrowRight size={18} />
                      </button>
                    </div>
                  </form>
                </>
              )}

              {checkoutStep === 'processing' && (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-12">
                   <div className="relative">
                      <Loader2 className={`w-24 h-24 animate-spin ${selectedProduct?.isExtensionCourse ? 'text-purple-500' : 'text-yellow-500'}`} />
                      <div className="absolute inset-0 flex items-center justify-center font-black text-xs">{progress}%</div>
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-white uppercase tracking-widest">Обробка транзакції...</h3>
                      <p className="text-gray-500 text-xs uppercase tracking-tight">Будь ласка, не закривайте вікно</p>
                   </div>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-12 animate-in zoom-in duration-500">
                  <div className="w-32 h-32 bg-green-500/10 border-2 border-green-500/30 rounded-[3.5rem] flex items-center justify-center text-green-400 mx-auto shadow-2xl">
                    <Trophy size={64} className="animate-bounce" />
                  </div>
                  <h3 className="text-4xl font-black text-gray-100 uppercase tracking-tight">{t.success}</h3>
                  <button onClick={() => { onNavigate('my-courses'); closeCheckout(); }} className={`w-full py-6 ${selectedProduct?.isExtensionCourse ? 'bg-purple-600 shadow-purple-900/40' : 'bg-yellow-600 shadow-yellow-900/40'} text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] transition-all`}>
                    {t.toProgram}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Showcase;