import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Star, ArrowRight, Zap, ShieldCheck, Sparkles, 
  CreditCard, X, CheckCircle2, Shield, Apple, Smartphone,
  Mail, User, ChevronDown, Loader2, Trophy, Clock, MessageSquare, Phone, Target, Play, Bot, EyeOff, Instagram, BookOpen
} from 'lucide-react';
import { Course, Invoice, TabType, Language, UserRole } from '../types';

interface Props {
  courses: Course[];
  onPurchase: (invoice: Invoice) => void;
  onNavigate: (tab: TabType) => void;
  lang: Language;
  user?: any;
  role?: UserRole;
  isLoading?: boolean;
  onSetActiveCourse?: (id: string) => void;
}

type CheckoutStep = 'form' | 'processing' | 'success';

const Showcase: React.FC<Props> = ({ courses, onPurchase, onNavigate, lang, user, role, isLoading = false, onSetActiveCourse }) => {
  const [selectedProduct, setSelectedProduct] = useState<Course | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<Course | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('form');
  
  const [firstName, setFirstName] = useState(user?.displayName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.displayName?.split(' ')[1] || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [userPhone, setUserPhone] = useState('');
  const [userInstagram, setUserInstagram] = useState(''); 
  const [leadSource, setLeadSource] = useState('instagram');
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');
  const [progress, setProgress] = useState(0);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800';
    e.currentTarget.onerror = null; 
  };

  const visibleCourses = useMemo(() => {
    const isAdmin = role === 'admin' || role === 'specialist';
    return courses.filter(c => c.isPublished || isAdmin);
  }, [courses, role]);

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
      buy: 'Купити Курс',
      checkoutTitle: 'Реєстрація у HUB',
      checkoutSub: 'Починаємо майбутнє',
      firstName: "Твоє ім'я",
      lastName: 'Прізвище',
      phone: 'Номер телефону',
      instagram: 'Instagram',
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
      startNow: 'Почати Навчання',
      draft: 'ЧЕРНЕТКА',
      loading: 'Синхронізація з базою...',
      noCourses: 'Наразі немає активних програм'
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
      buy: 'Buy Course',
      checkoutTitle: 'Registration in HUB',
      checkoutSub: 'Starting the future',
      firstName: 'First Name',
      lastName: 'Last Name',
      phone: 'Phone Number',
      instagram: 'Instagram',
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
      startNow: 'Start Learning',
      draft: 'DRAFT',
      loading: 'Syncing with database...',
      noCourses: 'No active programs available'
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
        studentEmail: userEmail,
        studentPhone: userPhone,
        studentInstagram: userInstagram,
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
    setUserInstagram('');
    setLeadSource('instagram');
    setProgress(0);
  };

  const handleDetailsClick = (product: Course) => {
    setDetailsProduct(product);
  };

  const handleEditCourse = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    if (onSetActiveCourse) {
      onSetActiveCourse(courseId);
      onNavigate('courses-admin');
    }
  };

  const handleVideoHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = e.currentTarget.querySelector('video');
    if (video) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {});
      }
    }
  };

  const handleVideoLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = e.currentTarget.querySelector('video');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0C10] p-10 custom-scrollbar animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
            <Sparkles size={12} /> {t.badge}
          </div>
          <h1 className="text-7xl md:text-8xl font-black text-gray-100 tracking-tighter uppercase">{t.title}</h1>
          <p className="text-gray-400 max-w-2xl mx-auto font-medium">{t.subtitle}</p>
        </div>

        <div className="bg-gradient-to-r from-[#1F232B] to-[#12141C] border border-[#2D333D] rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group hover:border-purple-500/30 transition-all">
           <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-600/20 transition-all" />
           <div className="flex items-center gap-6 relative z-10 text-left">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-900/30 shrink-0">
                 <Bot size={32} />
              </div>
              <div className="space-y-1">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">{t.bannerTitle}</h3>
                 <p className="text-gray-400 text-sm font-medium max-w-md">{t.bannerSub}</p>
              </div>
           </div>
           <button 
              onClick={() => onNavigate('guest-chat')}
              className="px-8 py-4 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center gap-3 active:scale-95 shrink-0 group/btn"
           >
              <MessageSquare size={16} className="text-purple-600 group-hover/btn:scale-110 transition-transform" />
              {t.askButton}
           </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 opacity-40">
            <Loader2 size={48} className="animate-spin text-purple-500" />
            <p className="text-xs font-black uppercase tracking-[0.3em]">{t.loading}</p>
          </div>
        ) : visibleCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {visibleCourses.map((product) => (
              <div key={product.id} className="bg-[#12141C] rounded-[3.5rem] overflow-hidden border border-[#1F232B] shadow-2xl hover:shadow-purple-500/10 transition-all group flex flex-col h-full hover:-translate-y-2 duration-500 relative">
                {!product.isPublished && (
                   <div className="absolute top-4 left-4 z-30 px-3 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 backdrop-blur-md">
                     <EyeOff size={10} /> {t.draft}
                   </div>
                )}
                
                <div 
                  className="h-64 relative overflow-hidden cursor-pointer group/media"
                  onMouseEnter={handleVideoHover}
                  onMouseLeave={handleVideoLeave}
                  onClick={() => handleDetailsClick(product)}
                >
                  <img 
                    src={product.image} 
                    className={`w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-1000 group-hover/media:opacity-100 relative z-0 ${product.isPublished ? 'opacity-60' : 'opacity-30 grayscale'}`} 
                    alt={product.title} 
                    onError={handleImageError}
                  />
                  {product.previewVideo && (
                    <video 
                      src={product.previewVideo}
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover z-10 opacity-0 group-hover/media:opacity-100 transition-opacity duration-500 pointer-events-none"
                    />
                  )}
                  <div className={`absolute top-6 right-6 z-20 bg-[#12141C]/90 backdrop-blur-md px-5 py-2.5 rounded-2xl font-black text-sm border border-white/10 ${product.isExtensionCourse ? 'text-purple-400' : 'text-yellow-500'} shadow-xl`}>
                    ${product.price}
                  </div>
                </div>
                <div className="p-8 space-y-4 flex flex-col flex-1">
                  <h3 className={`text-xl font-black text-gray-100 transition-colors ${product.isExtensionCourse ? 'group-hover:text-purple-400' : 'group-hover:text-yellow-500'}`}>
                    {product.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 font-medium flex-1">{product.description}</p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button onClick={() => handleDetailsClick(product)} className="py-4 bg-[#1F232B] text-gray-300 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#2D333D] transition-all">
                      {t.details}
                    </button>
                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className={`py-4 ${product.isExtensionCourse ? 'bg-purple-600 shadow-purple-500/20 hover:bg-purple-700' : 'bg-yellow-600 shadow-yellow-500/20 hover:bg-yellow-700'} text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2`}
                    >
                      <CreditCard size={14} /> {t.buy}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-6 opacity-40">
            <ShoppingBag size={64} className="text-gray-700" />
            <p className="text-xs font-black uppercase tracking-[0.3em]">{t.noCourses}</p>
          </div>
        )}
      </div>

      {detailsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#12141C] w-full max-w-5xl rounded-[3.5rem] border border-[#1F232B] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-300 relative">
             <button onClick={() => setDetailsProduct(null)} className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-white/10 rounded-full text-white z-20"><X size={24} /></button>
             <div className="w-full md:w-2/5 relative h-64 md:h-auto bg-black">
                <img src={detailsProduct.image} className="w-full h-full object-cover opacity-80" alt={detailsProduct.title} onError={handleImageError} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12141C] via-transparent to-transparent md:bg-gradient-to-r" />
                <div className="absolute bottom-8 left-8 right-8 text-left">
                   <div className={`inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-[#12141C]/80 backdrop-blur-sm ${detailsProduct.isExtensionCourse ? 'text-purple-400 border-purple-500/20' : 'text-yellow-400 border-yellow-500/20'}`}>
                      <Sparkles size={10} /> 
                      {detailsProduct.isExtensionCourse ? 'Extension' : 'Lamination'}
                   </div>
                   <h2 className="text-3xl font-black text-white uppercase leading-tight mb-2 drop-shadow-lg">{detailsProduct.title}</h2>
                   <p className="text-gray-300 text-xs font-medium leading-relaxed drop-shadow-md">{detailsProduct.description}</p>
                </div>
             </div>
             <div className="flex-1 p-8 md:p-10 overflow-y-auto custom-scrollbar text-left flex flex-col">
                <div className="flex-1 space-y-8">
                   <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                         <BookOpen size={14} /> {t.syllabus}
                      </h3>
                      <div className="space-y-6">
                         {detailsProduct.sections?.map((section, idx) => (
                            <div key={section.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                               <div className="flex items-center gap-3 mb-3">
                                  <div className="w-6 h-6 rounded-full bg-[#1F232B] flex items-center justify-center text-[10px] font-black text-gray-400 border border-white/5">
                                     {idx + 1}
                                  </div>
                                  <h4 className="text-xs font-black text-gray-200 uppercase tracking-wider">{section.title}</h4>
                               </div>
                               <div className="space-y-3 pl-3 ml-3 border-l border-[#1F232B]">
                                  {section.lessons.map(lesson => (
                                     <div key={lesson.id} className="bg-[#0A0C10] p-3 rounded-xl border border-white/5 flex gap-4 group hover:border-white/10 transition-colors">
                                        {lesson.thumbnail ? (
                                          <img src={lesson.thumbnail} className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0" alt="" onError={handleImageError} />
                                        ) : (
                                          <div className="w-16 h-16 rounded-lg bg-[#1F232B] flex items-center justify-center shrink-0">
                                             <Play size={16} className="text-gray-600" />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0 py-1">
                                           <p className="text-[10px] font-bold text-white uppercase mb-1 truncate">{lesson.title}</p>
                                           <p className="text-[9px] text-gray-500 line-clamp-2 leading-relaxed">
                                              {lesson.description || 'Детальний розбір теми, теорія та практика.'}
                                           </p>
                                        </div>
                                     </div>
                                  ))}
                                  {section.lessons.length === 0 && <p className="text-[9px] text-gray-600 italic pl-2">Матеріали готуються...</p>}
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
                <div className="pt-6 mt-6 flex items-center justify-between border-t border-[#1F232B] shrink-0">
                   <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Інвестиція</p>
                      <div className="flex items-baseline gap-1">
                         <p className="text-3xl font-black text-white tracking-tight">${detailsProduct.price}</p>
                         <span className="text-[10px] font-bold text-gray-500">USD</span>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      {(role === 'admin' || role === 'specialist') && (
                         <button onClick={(e) => handleEditCourse(e, detailsProduct.id)} className="px-6 py-4 bg-[#1F232B] text-gray-300 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Редагувати</button>
                      )}
                      <button onClick={() => { setDetailsProduct(null); setSelectedProduct(detailsProduct); }} className={`px-8 py-4 ${detailsProduct.isExtensionCourse ? 'bg-purple-600 hover:bg-purple-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center gap-2`}>{t.startNow} <ArrowRight size={16} /></button>
                   </div>
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
                 <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-4">Твій вибір</h4>
                 <div className="relative rounded-3xl overflow-hidden aspect-square mb-6 border border-[#1F232B]">
                    <img src={selectedProduct.image} className="w-full h-full object-cover opacity-60" alt="" onError={handleImageError} />
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
                      <p className={`text-[10px] font-black uppercase ${selectedProduct.isExtensionCourse ? 'text-purple-400' : 'text-yellow-500'} tracking-widest mt-1`}>{t.checkoutSub}</p>
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
                      <button type="submit" className={`w-full py-6 ${selectedProduct.isExtensionCourse ? 'bg-purple-600 shadow-purple-500/40 hover:bg-purple-700' : 'bg-yellow-600 shadow-yellow-500/40 hover:bg-yellow-700'} text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4`}>{t.payButton} <ArrowRight size={18} /></button>
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
                   <h3 className="text-xl font-black text-white uppercase tracking-widest">Обробка транзакції...</h3>
                </div>
              )}
              {checkoutStep === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-12 animate-in zoom-in duration-500">
                  <div className="w-32 h-32 bg-green-500/10 border-2 border-green-500/30 rounded-[3.5rem] flex items-center justify-center text-green-400 mx-auto shadow-2xl">
                    <Trophy size={64} className="animate-bounce" />
                  </div>
                  <h3 className="text-4xl font-black text-gray-100 uppercase tracking-tight">{t.success}</h3>
                  <button onClick={() => { onNavigate('my-courses'); closeCheckout(); }} className={`w-full py-6 ${selectedProduct?.isExtensionCourse ? 'bg-purple-600 shadow-purple-900/40' : 'bg-yellow-600 shadow-yellow-900/40'} text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] transition-all`}>{t.toProgram}</button>
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