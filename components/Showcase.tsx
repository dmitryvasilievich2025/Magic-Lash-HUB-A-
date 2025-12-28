
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Star, ArrowRight, Zap, ShieldCheck, Sparkles, 
  CreditCard, X, CheckCircle2, Shield, Apple, Smartphone,
  Mail, User, ChevronDown, Loader2, Trophy, Clock, MessageSquare
} from 'lucide-react';
import { Course, Invoice, TabType, Language } from '../types';

interface Props {
  onPurchase: (invoice: Invoice) => void;
  onNavigate: (tab: TabType) => void;
  lang: Language;
}

type CheckoutStep = 'form' | 'processing' | 'success';

const Showcase: React.FC<Props> = ({ onPurchase, onNavigate, lang }) => {
  const [selectedProduct, setSelectedProduct] = useState<Partial<Course> | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('form');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
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
      payment: 'Метод оплати',
      payButton: 'ПРИЄДНАТИСЯ ТА ВІДКРИТИ ARI',
      success: 'Ти в команді!',
      toProgram: 'ДО ПРОГРАМИ'
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
      payment: 'Payment Method',
      payButton: 'JOIN AND OPEN ARI',
      success: 'You are in!',
      toProgram: 'TO PROGRAM'
    }
  }[lang]), [lang]);

  const products: Partial<Course>[] = [
    { id: 'c1', title: 'InLei® Lash Filler 25.9', isExtensionCourse: false, price: 550, description: lang === 'uk' ? 'Революційна формула для потовщення вій. Хімія складів та повний протокол процедури.' : 'Revolutionary lash thickening formula. Chemistry and full protocol.', image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800' },
    { id: 'c2', title: 'Magic Lash Geometry', isExtensionCourse: true, price: 450, description: lang === 'uk' ? 'Нарощування вій: від 2D до 5D. Геометрія пучка, площа зчіпки та мікровідступи.' : 'Eyelash extensions: 2D to 5D. Fan geometry, bonding area, and micro-gaps.', image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=400' },
    { id: 'c3', title: 'Lash Adhesive Master', isExtensionCourse: true, price: 300, description: lang === 'uk' ? 'Робота з клеєм в екстремальних умовах: температура, вологість та секрети носки.' : 'Working with adhesive in extreme conditions: temp, humidity, and retention secrets.', image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=400' },
  ];

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
        student: userName || (lang === 'uk' ? 'Новий Спеціаліст' : 'New Specialist'),
        course: selectedProduct.title || 'Напрямок',
        total: selectedProduct.price || 0,
        paid: selectedProduct.price || 0,
        status: 'paid',
        dueDate: new Date().toISOString().split('T')[0]
      };
      onPurchase(newInvoice);
    }
  };

  const closeCheckout = () => {
    setSelectedProduct(null);
    setCheckoutStep('form');
    setUserName('');
    setUserEmail('');
    setProgress(0);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0C10] p-10 custom-scrollbar animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
            <Sparkles size={12} /> {t.badge}
          </div>
          <h1 className="text-7xl md:text-8xl font-black text-gray-100 tracking-tighter uppercase">{t.title}</h1>
          <p className="text-gray-400 max-w-2xl mx-auto font-medium">{t.subtitle}</p>
        </div>

        {/* ARI BANNER REMOVED AS PER REQUEST */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {products.map((product) => (
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
                  <button className="py-4 bg-[#1F232B] text-gray-300 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#2D333D] transition-all">
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

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="relative bg-[#12141C] w-full max-w-4xl rounded-[4rem] border border-[#1F232B] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300">
            <div className="w-full md:w-80 bg-[#0A0C10] p-10 border-r border-[#1F232B] hidden md:flex flex-col text-left">
              <div className="mb-8">
                 <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-4">{lang === 'uk' ? 'Твій вибір' : 'Your choice'}</h4>
                 <div className="relative rounded-3xl overflow-hidden aspect-square mb-6 border border-[#1F232B]">
                    <img src={selectedProduct.image} className="w-full h-full object-cover opacity-60" alt="" />
                 </div>
                 <h3 className={`text-lg font-black mb-2 ${selectedProduct.isExtensionCourse ? 'text-purple-400' : 'text-yellow-500'}`}>{selectedProduct.title}</h3>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[600px]">
              {checkoutStep === 'form' && (
                <>
                  <div className="p-10 border-b border-[#1F232B] flex items-center justify-between text-left">
                    <div>
                      <h3 className="text-2xl font-black text-gray-100 uppercase tracking-tight">{t.checkoutTitle}</h3>
                      <p className={`text-[10px] font-black uppercase ${selectedProduct.isExtensionCourse ? 'text-purple-400' : 'text-yellow-500'} tracking-widest mt-1`}>
                         {t.checkoutSub}
                      </p>
                    </div>
                    <button onClick={closeCheckout} className="p-4 bg-[#0A0C10] hover:bg-[#1F232B] rounded-2xl text-gray-500 transition-colors"><X size={20} /></button>
                  </div>
                  
                  <form onSubmit={handleInitiatePayment} className="p-10 space-y-8 flex-1 text-left overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">{lang === 'uk' ? "Твоє ім'я" : "Your Name"}</label>
                        <div className="relative">
                          <User size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                          <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 focus:ring-1 ring-purple-500/50 outline-none" placeholder="Maria Ivanova" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                          <input required type="email" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-3xl py-5 pl-14 pr-8 text-sm font-bold text-gray-100 focus:ring-1 ring-purple-500/50 outline-none" placeholder="example@mail.com" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">{t.payment}</label>
                      <div className="grid grid-cols-3 gap-4">
                        {['card', 'apple', 'google'].map(m => (
                          <button key={m} type="button" onClick={() => setPaymentMethod(m as any)} className={`p-6 border rounded-[2.5rem] flex flex-col items-center gap-3 transition-all ${paymentMethod === m ? 'border-purple-500 text-purple-400' : 'bg-[#0A0C10] border-[#1F232B] text-gray-600'}`}>
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

              {checkoutStep === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-12 animate-in zoom-in duration-500">
                  <div className="w-32 h-32 bg-green-500/10 border-2 border-green-500/30 rounded-[3.5rem] flex items-center justify-center text-green-400 mx-auto shadow-2xl">
                    <Trophy size={64} className="animate-bounce" />
                  </div>
                  <h3 className="text-4xl font-black text-gray-100 uppercase tracking-tight">{t.success}</h3>
                  <button onClick={() => { onNavigate('my-courses'); closeCheckout(); }} className={`w-full py-6 ${selectedProduct.isExtensionCourse ? 'bg-purple-600' : 'bg-yellow-600'} text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] transition-all`}>
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
