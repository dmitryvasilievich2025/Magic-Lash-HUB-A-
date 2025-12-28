
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Sparkles, MessageCircle, User, Bot, ShoppingBag, ArrowRight, Zap, HelpCircle, GraduationCap, Star, X, Info } from 'lucide-react';
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
      intro: 'Вітаю! Я ARI, твій інтелектуальний коуч у Magic Lash HUB. Я допоможу тобі обрати найкращий шлях розвитку в індустрії краси. Про що ти хочеш дізнатися сьогодні?',
      placeholder: 'Напиши ARI про свої цілі...',
      quickQuestions: [
        "Який напрямок обрати новачкові?",
        "Чим особливий InLei® Lash Filler?",
        "Скільки триває розвиток?",
        "Чи є сертифікація?"
      ],
      generating: "ARI аналізує...",
      viewDetails: "Деталі",
      buyNow: "Приєднатися",
      system: `Ти — ARI, професійний ШІ-коуч платформи Magic Lash HUB. 
        Твоє завдання: допомагати гостям обрати напрямок розвитку. 
        Ти спілкуєшся як експерт високого рівня: ввічливо, лаконічно, натхненно.
        
        ТЕРМІНОЛОГІЯ (ВАЖЛИВО):
        - ЗАБОРОНЕНО використовувати: курси, уроки, навчання, академія.
        - ВИКОРИСТОВУЙ: напрямок, програма, HUB, практика, розвиток, технічний блок.
        
        ПРАВИЛА ВІДПОВІДЕЙ:
        1. Якщо рекомендуєш напрямок, вкажи його ID в кінці тексту як [ID:c1].
        2. InLei® — це про ламінування та здоров'я вій (Lash Filler 25.9).
        3. Magic Lash — це про професійне нарощування (Geometry, Adhesive Master).
        
        Спілкуйся українською мовою.`
    },
    en: {
      intro: 'Hello! I am ARI, your AI coach at Magic Lash HUB. I will help you choose the best development path in the beauty industry. What would you like to know today?',
      placeholder: 'Ask ARI about your goals...',
      quickQuestions: [
        "Which path for a beginner?",
        "What's special about InLei®?",
        "How long is the practice?",
        "Is there certification?"
      ],
      generating: "ARI is analyzing...",
      viewDetails: "Details",
      buyNow: "Join Now",
      system: `You are ARI, the professional AI coach of the Magic Lash HUB platform. 
        Your task: help guests choose a development direction. 
        You speak as a high-level expert: polite, concise, inspiring.
        
        TERMINOLOGY (IMPORTANT):
        - FORBIDDEN: courses, lessons, teaching, academy.
        - USE: direction, program, HUB, practice, development, technical block.
        
        RESPONSE RULES:
        1. If you recommend a path, include its ID at the end as [ID:c1].
        2. InLei® is about lamination and lash health (Lash Filler 25.9).
        3. Magic Lash is about professional extensions (Geometry, Adhesive Master).
        
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const courseInfo = courses.map(c => 
        `- ID: ${c.id}, Назва: ${c.title}, Ціна: $${c.price}, Опис: ${c.description}`
      ).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `${t.system}\n\nНАЯВНІ НАПРЯМКИ:\n${courseInfo}`,
          temperature: 0.8,
        }
      });

      const rawText = response.text || '';
      let cleanText = rawText;
      let courseId: string | undefined;

      const idMatch = rawText.match(/\[ID:(c\d+)\]/);
      if (idMatch) {
        courseId = idMatch[1];
        cleanText = rawText.replace(/\[ID:c\d+\]/, '').trim();
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: cleanText,
        recommendedCourseId: courseId
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'uk' ? 'Вибач, сталася помилка з\'єднання.' : 'Sorry, connection error.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C10] relative overflow-hidden h-full">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

      <header className="h-20 bg-[#12141C]/80 backdrop-blur-xl border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0 z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot size={28} className="text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-black text-gray-100 uppercase tracking-tight leading-none mb-1">ARI Advisor</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Active</span>
              <div className="w-1 h-1 rounded-full bg-gray-600" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Gemini 3 Pro Engine</span>
            </div>
          </div>
        </div>
        <button onClick={() => onNavigate('showcase')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
          <X size={20} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${msg.role === 'assistant' ? 'bg-[#12141C] border-[#1F232B] text-purple-400' : 'bg-purple-600 border-purple-500 text-white shadow-lg'}`}>
                {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={`flex flex-col gap-3 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-6 rounded-[2rem] text-[15px] font-medium leading-relaxed text-left border shadow-2xl ${msg.role === 'assistant' ? 'bg-[#12141C] border-[#1F232B] text-gray-200 rounded-tl-none' : 'bg-[#1F232B] border-white/5 text-white rounded-tr-none'}`}>
                  {msg.content}
                </div>
                
                {msg.recommendedCourseId && (
                  <div className="w-full bg-[#0D0F16] border border-purple-500/30 rounded-[2.5rem] p-6 flex items-center gap-6 animate-in zoom-in duration-500 shadow-2xl group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ShoppingBag size={64} /></div>
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                      <img src={courses.find(c => c.id === msg.recommendedCourseId)?.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Рекомендований напрямок</p>
                      <h4 className="text-base font-black text-white uppercase tracking-tight truncate">{courses.find(c => c.id === msg.recommendedCourseId)?.title}</h4>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => onNavigate('showcase')} className="px-4 py-2 bg-[#1F232B] text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">
                          {t.viewDetails}
                        </button>
                        <button onClick={() => onNavigate('showcase')} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-900/40 hover:bg-purple-700 transition-all">
                          {t.buyNow} — ${courses.find(c => c.id === msg.recommendedCourseId)?.price}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#12141C] border border-[#1F232B] flex items-center justify-center text-purple-400">
                <Bot size={20} />
              </div>
              <div className="bg-[#12141C] border border-[#1F232B] px-6 py-4 rounded-[2rem] rounded-tl-none flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-10 bg-gradient-to-t from-[#0A0C10] via-[#0A0C10] to-transparent relative z-20 shrink-0">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {t.quickQuestions.map((q, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(q)}
                disabled={isTyping}
                className="px-5 py-2.5 bg-[#12141C] border border-[#1F232B] hover:border-purple-500/50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-purple-400 transition-all shadow-lg active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative group">
            <div className="absolute inset-0 bg-purple-600/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-[3rem]" />
            <div className="relative bg-[#12141C] border border-[#1F232B] rounded-[3rem] p-2 flex items-center shadow-2xl group-hover:border-purple-500/30 transition-all">
              <div className="pl-6 text-gray-600"><MessageCircle size={20} /></div>
              <input 
                className="flex-1 bg-transparent border-none py-5 px-4 text-sm font-bold text-gray-200 outline-none placeholder-gray-700"
                placeholder={t.placeholder}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isTyping}
              />
              <button 
                disabled={!input.trim() || isTyping}
                className="p-4 bg-purple-600 text-white rounded-full shadow-xl shadow-purple-900/30 hover:bg-purple-700 transition-all disabled:opacity-20 active:scale-95"
              >
                {isTyping ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GuestChat;
