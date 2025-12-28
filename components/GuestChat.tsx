
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Sparkles, MessageCircle, User, Bot, ShoppingBag, ArrowRight, Zap, HelpCircle, GraduationCap, Star, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Course, TabType, Invoice, Language } from '../types';

interface Props {
  courses: Course[];
  onPurchase: (invoice: Invoice) => void;
  onNavigate: (tab: TabType) => void;
  lang: Language;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommendedCourseId?: string;
}

const GuestChat: React.FC<Props> = ({ courses, onPurchase, onNavigate, lang }) => {
  const t = useMemo(() => ({
    uk: {
      intro: 'Привіт! Я ARI, твій персональний провідник у світі Magic Lash HUB. Я допоможу тобі обрати ідеальний шлях розвитку: від магії ламінування InLei® до досконалості нарощування Magic Lash. Що тебе цікавить?',
      placeholder: 'Запитай ARI про свій розвиток...',
      quickQuestions: [
        "З чого почати новачку?",
        "Чим особливий Lash Filler 25.9?",
        "Який напрямок обрати для швидкості?",
        "Розкажи про сертифікацію"
      ],
      generating: "ARI аналізує...",
      viewDetails: "Дивитись деталі",
      buyNow: "Приєднатися",
      system: `Ти — ARI, інтелектуальний коуч платформи Magic Lash HUB. 
        Твоя місія: надихати гостей та допомагати їм обрати правильний напрямок розвитку. 
        Ти професійна, лаконічна та орієнтована на результат. 
        
        ТЕРМІНОЛОГІЯ:
        - ЗАБОРОНЕНО: курси, навчання, школа, уроки.
        - ВИКОРИСТОВУЙ: напрямок, програма, HUB, практика, розвиток, блок.
        
        ПРАВИЛА РЕКОМЕНДАЦІЙ:
        1. Якщо ти рекомендуєш конкретний курс, ОБОВ'ЯЗКОВО вкажи його ID у форматі [COURSE_ID:c1] в кінці повідомлення.
        2. Аналізуй досвід користувача: для новачків радимо InLei® Lash Filler, для досвідчених — Magic Lash Geometry або Adhesive Master.
        
        Спілкуйся виключно українською мовою.`
    },
    en: {
      intro: 'Hello! I am ARI, your personal guide in the Magic Lash HUB. I will help you choose the perfect development path: from InLei® lamination magic to Magic Lash extension perfection. What are you interested in?',
      placeholder: 'Ask ARI about your development...',
      quickQuestions: [
        "Where should a beginner start?",
        "What's special about Lash Filler 25.9?",
        "Which direction for speed?",
        "Tell me about certification"
      ],
      generating: "ARI is analyzing...",
      viewDetails: "View Details",
      buyNow: "Join Now",
      system: `You are ARI, an intellectual coach for the Magic Lash HUB platform. 
        Your mission: inspire guests and help them choose the right development direction. 
        You are professional, concise, and result-oriented. 
        
        TERMINOLOGY:
        - FORBIDDEN: courses, teaching, school, lessons.
        - USE: direction, program, HUB, practice, development, block.
        
        RECOMMENDATION RULES:
        1. If you recommend a specific course, MUST include its ID as [COURSE_ID:c1] at the end of the message.
        2. Analyze user experience: suggest InLei® Lash Filler for beginners, and Magic Lash Geometry or Adhesive Master for experienced artists.
        
        Communicate in English.`
    }
  }[lang]), [lang]);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t.intro }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const parseRecommendedCourse = (text: string) => {
    const match = text.match(/\[COURSE_ID:(c\d+)\]/);
    if (match) {
      return {
        cleanText: text.replace(/\[COURSE_ID:c\d+\]/, '').trim(),
        courseId: match[1]
      };
    }
    return { cleanText: text, courseId: undefined };
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const courseContext = courses.map(c => 
        `- ${c.id}: ${c.title}. Опис: ${c.description || 'Розвиток'}. Тип: ${c.isExtensionCourse ? 'Extensions' : 'Lamination'}. Ціна: $${c.price}.`
      ).join('\n');

      const fullSystemInstruction = `${t.system}\n\nНАШІ НАПРЯМКИ:\n${courseContext}`;

      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model' as any,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...history.map(h => ({ role: h.role, parts: h.parts })),
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: fullSystemInstruction,
          temperature: 0.7,
        },
      });

      const { cleanText, courseId } = parseRecommendedCourse(response.text || '');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: cleanText || (lang === 'uk' ? "Вибач, я не змогла обробити запит." : "Sorry, I couldn't process the request."),
        recommendedCourseId: courseId
      }]);
    } catch (error) {
      console.error('ARI Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'uk' ? 'Сталася технічна помилка. Спробуй ще раз.' : 'Technical error occurred. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C10] h-full overflow-hidden animate-in fade-in duration-700 relative">
      {/* Background Decor */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

      <header className="h-24 bg-[#12141C]/80 backdrop-blur-md border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0 shadow-xl relative z-20">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles size={28} className="text-white animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#12141C] rounded-full" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-black text-gray-100 uppercase tracking-tight">ARI Consultant</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{lang === 'uk' ? 'ІНТЕЛЕКТУАЛЬНИЙ ПІДБІР' : 'INTELLECTUAL SELECTION'}</span>
              <div className="w-1 h-1 rounded-full bg-gray-600" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">LIVE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => onNavigate('showcase')}
                className="flex items-center gap-2 px-6 py-3 bg-[#1F232B] hover:bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all"
            >
                <ShoppingBag size={14} /> {lang === 'uk' ? 'Вітрина' : 'Showcase'}
            </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar scroll-smooth"
        >
          <div className="max-w-4xl mx-auto space-y-12 pb-24">
            {messages.map((msg, idx) => {
              const recommendedCourse = msg.recommendedCourseId ? courses.find(c => c.id === msg.recommendedCourseId) : null;
              
              return (
                <div 
                  key={idx} 
                  className={`flex gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border shadow-2xl transition-transform hover:scale-110 ${
                    msg.role === 'assistant' 
                      ? 'bg-[#12141C] border-[#1F232B] text-purple-400' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-white/10 text-white'
                  }`}>
                    {msg.role === 'assistant' ? <Bot size={24} /> : <User size={24} />}
                  </div>
                  
                  <div className="flex flex-col gap-4 max-w-[80%]">
                    <div className={`relative p-8 rounded-[2.5rem] text-[15px] leading-relaxed font-medium shadow-2xl text-left border ${
                      msg.role === 'assistant' 
                        ? 'bg-[#12141C]/80 backdrop-blur-sm text-gray-200 rounded-tl-none border-white/5' 
                        : 'bg-indigo-600 text-white rounded-tr-none border-white/10'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {recommendedCourse && (
                      <div className="bg-[#12141C] border border-purple-500/20 rounded-[2.5rem] p-6 flex gap-6 items-center shadow-2xl animate-in zoom-in duration-500 group">
                        <div className="w-24 h-24 bg-[#0A0C10] rounded-2xl overflow-hidden border border-white/5 shrink-0">
                          <img src={recommendedCourse.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">{lang === 'uk' ? 'Рекомендовано' : 'Recommended'}</p>
                          <h4 className="text-sm font-black text-white uppercase mb-2 tracking-tight line-clamp-1">{recommendedCourse.title}</h4>
                          <div className="flex gap-2">
                            <button onClick={() => onNavigate('showcase')} className="px-4 py-2 bg-[#1F232B] text-gray-400 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all">
                              {t.viewDetails}
                            </button>
                            <button onClick={() => onNavigate('showcase')} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all">
                              {t.buyNow} — ${recommendedCourse.price}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex gap-6 animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[#12141C] border border-[#1F232B] flex items-center justify-center text-purple-400">
                  <Bot size={24} />
                </div>
                <div className="bg-[#12141C]/50 backdrop-blur-sm p-6 rounded-[2rem] rounded-tl-none border border-white/5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input & Quick Actions Area */}
        <div className="p-10 bg-gradient-to-t from-[#0A0C10] via-[#0A0C10]/95 to-transparent relative z-20">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Quick Questions */}
            <div className="flex flex-wrap gap-3 justify-center">
              {t.quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  disabled={isTyping}
                  className="px-6 py-3 bg-[#12141C] border border-[#1F232B] hover:border-purple-500/50 hover:text-purple-400 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-lg"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
              className="relative group max-w-3xl mx-auto"
            >
              <div className="absolute inset-0 bg-purple-600/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-[3rem]" />
              <div className="relative bg-[#12141C] border border-[#1F232B] rounded-[3rem] p-2 flex items-center shadow-2xl group-hover:border-purple-500/30 transition-all">
                <div className="pl-6 text-gray-600">
                  <MessageCircle size={20} />
                </div>
                <input 
                  className="flex-1 bg-transparent border-none py-5 px-4 text-sm font-bold text-gray-100 outline-none placeholder-gray-700"
                  placeholder={t.placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className={`p-5 rounded-full shadow-2xl transition-all flex items-center justify-center ${
                    !input.trim() || isTyping 
                      ? 'bg-[#1F232B] text-gray-600 scale-90' 
                      : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-110 active:scale-95 shadow-purple-500/20'
                  }`}
                >
                  {isTyping ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestChat;
