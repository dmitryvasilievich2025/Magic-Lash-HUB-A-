
import React, { useState, useRef, useEffect, useMemo } from 'react';
// Додано Shield до списку імпортів
import { Send, Loader2, Sparkles, MessageCircle, User, Bot, ShoppingBag, ArrowRight, Zap, HelpCircle, GraduationCap, Star, X, Info, Shield } from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
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
  isStreaming?: boolean;
}

const GuestChat: React.FC<Props> = ({ courses, onPurchase, onNavigate, lang }) => {
  const t = useMemo(() => ({
    uk: {
      intro: 'Вітаю! Я ARI, твій інтелектуальний коуч у Magic Lash HUB. Я допоможу тобі обрати найкращий шлях розвитку в індустрії краси. Про що ти хочеш дізнатися сьогодні?',
      placeholder: 'Запитай ARI про свої цілі...',
      quickQuestions: [
        "Який напрямок обрати новачкові?",
        "Чим особливий InLei® Lash Filler?",
        "Скільки триває розвиток у HUB?",
        "Який дохід у топ-стиліста?"
      ],
      generating: "ARI аналізує...",
      viewDetails: "Деталі",
      buyNow: "Приєднатися",
      system: `Ти — ARI, професійний ШІ-коуч платформи Magic Lash HUB. 
        Твоє завдання: допомагати гостям обрати напрямок розвитку. 
        Ти спілкуєшся як експерт високого рівня: ввічливо, лаконічно, натхненно.
        
        ТЕРМІНОЛОГІЯ (СУВОРО):
        - ЗАБОРОНЕНО використовувати: курси, уроки, навчання, академія.
        - ВИКОРИСТОВУЙ: напрямок, програма, HUB, практика, розвиток, технічний блок.
        
        ПРАВИЛА ВІДПОВІДЕЙ:
        1. Якщо рекомендуєш напрямок, вкажи його ID в кінці тексту як [ID:c1].
        2. InLei® — це про ламінування та здоров'я вій (Lash Filler 25.9).
        3. Magic Lash — це про професійне нарощування (Geometry, Adhesive Master).
        4. Відповідай коротко, але професійно.
        
        Спілкуйся українською мовою.`
    },
    en: {
      intro: 'Hello! I am ARI, your AI coach at Magic Lash HUB. I will help you choose the best development path in the beauty industry. What would you like to know today?',
      placeholder: 'Ask ARI about your goals...',
      quickQuestions: [
        "Which path for a beginner?",
        "What's special about InLei®?",
        "How long is the practice?",
        "Potential income as pro?"
      ],
      generating: "ARI is analyzing...",
      viewDetails: "Details",
      buyNow: "Join Now",
      system: `You are ARI, the professional AI coach of the Magic Lash HUB platform. 
        Your task: help guests choose a development direction. 
        You speak as a high-level expert: polite, concise, inspiring.
        
        TERMINOLOGY (STRICT):
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
  const chatInstanceRef = useRef<any>(null);

  // Ініціалізація чату
  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const courseInfo = courses.map(c => 
      `- ID: ${c.id}, Назва: ${c.title}, Ціна: $${c.price}, Опис: ${c.description}`
    ).join('\n');

    chatInstanceRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `${t.system}\n\nНАЯВНІ НАПРЯМКИ У HUB:\n${courseInfo}`,
        temperature: 0.7,
      },
    });
  }, [courses, t.system]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping || !chatInstanceRef.current) return;

    const userMessage = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const result = await chatInstanceRef.current.sendMessageStream({ message: userMessage });
      
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text || '';
        fullResponse += chunkText;
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = { ...newMessages[lastIndex], content: fullResponse };
          return newMessages;
        });
      }

      // Після завершення стрімінгу перевіряємо на ID курсу
      const idMatch = fullResponse.match(/\[ID:(c\d+)\]/);
      if (idMatch) {
        const courseId = idMatch[1];
        const cleanText = fullResponse.replace(/\[ID:c\d+\]/, '').trim();
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = { 
            ...newMessages[lastIndex], 
            content: cleanText, 
            recommendedCourseId: courseId,
            isStreaming: false 
          };
          return newMessages;
        });
      } else {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].isStreaming = false;
          return newMessages;
        });
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: lang === 'uk' ? 'Вибач, сталася помилка з\'єднання з сервером. Спробуй ще раз.' : 'Sorry, connection error. Please try again.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C10] relative overflow-hidden h-full">
      {/* Естетичні фонові ефекти */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[80px] rounded-full pointer-events-none" />

      <header className="h-20 bg-[#12141C]/80 backdrop-blur-xl border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0 z-20 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="relative">
             <div className={`absolute inset-0 bg-purple-500 rounded-2xl blur-md opacity-20 ${isTyping ? 'animate-pulse' : ''}`} />
             <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg relative z-10">
                <Bot size={28} className="text-white" />
             </div>
          </div>
          <div className="text-left">
            <h2 className="text-lg font-black text-gray-100 uppercase tracking-tight leading-none mb-1">ARI Intellect</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Online Advisor</span>
            </div>
          </div>
        </div>
        <button onClick={() => onNavigate('showcase')} className="p-3 bg-white/5 hover:bg-red-500/10 rounded-2xl text-gray-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
          <X size={20} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar relative z-10">
        <div className="max-w-4xl mx-auto space-y-10">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-5 animate-in fade-in slide-in-from-bottom-6 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-xl ${msg.role === 'assistant' ? 'bg-[#12141C] border-[#1F232B] text-purple-400' : 'bg-purple-600 border-purple-500 text-white'}`}>
                {msg.role === 'assistant' ? <Bot size={24} /> : <User size={24} />}
              </div>
              <div className={`flex flex-col gap-4 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-6 md:p-8 rounded-[2.5rem] text-[15px] font-medium leading-[1.8] text-left border shadow-2xl relative ${msg.role === 'assistant' ? 'bg-[#12141C] border-[#1F232B] text-gray-200 rounded-tl-none' : 'bg-[#1F232B] border-white/5 text-white rounded-tr-none'}`}>
                   {msg.role === 'assistant' && <div className="absolute top-0 left-0 w-1 h-12 bg-purple-600 rounded-full -translate-x-1 opacity-20" />}
                   {msg.content || (msg.isStreaming ? '...' : '')}
                </div>
                
                {msg.recommendedCourseId && !msg.isStreaming && (
                  <div className="w-full bg-gradient-to-br from-[#12141C] to-[#0D0F16] border border-purple-500/30 rounded-[3rem] p-8 flex items-center gap-8 animate-in zoom-in duration-700 shadow-2xl group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12"><ShoppingBag size={100} /></div>
                    <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 border-2 border-white/5 shadow-2xl">
                      <img src={courses.find(c => c.id === msg.recommendedCourseId)?.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    </div>
                    <div className="flex-1 text-left relative z-10">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <Sparkles size={14} /> Рекомендований напрямок
                      </p>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight mb-4">{courses.find(c => c.id === msg.recommendedCourseId)?.title}</h4>
                      <div className="flex gap-3">
                        <button onClick={() => onNavigate('showcase')} className="px-6 py-3 bg-[#1F232B] text-gray-300 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all border border-white/5">
                          {t.viewDetails}
                        </button>
                        <button onClick={() => onNavigate('showcase')} className="px-6 py-3 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/40 hover:bg-purple-500 transition-all flex items-center gap-2">
                          {t.buyNow} <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && messages[messages.length-1].role === 'user' && (
            <div className="flex gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#12141C] border-2 border-[#1F232B] flex items-center justify-center text-purple-400 animate-pulse">
                <Bot size={24} />
              </div>
              <div className="bg-[#12141C] border border-[#1F232B] px-8 py-5 rounded-[2.5rem] rounded-tl-none flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 md:p-10 bg-gradient-to-t from-[#0A0C10] via-[#0A0C10] to-transparent relative z-20 shrink-0">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {t.quickQuestions.map((q, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(q)}
                disabled={isTyping}
                className="px-6 py-3 bg-[#12141C] border border-[#1F232B] hover:border-purple-500/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-purple-400 transition-all shadow-xl active:scale-95 disabled:opacity-20"
              >
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative group">
            <div className="absolute inset-0 bg-purple-600/10 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-[3.5rem]" />
            <div className="relative bg-[#12141C] border border-[#1F232B] rounded-[3.5rem] p-3 flex items-center shadow-2xl group-hover:border-purple-500/40 transition-all ring-1 ring-white/5">
              <div className="pl-6 text-gray-600"><MessageCircle size={22} /></div>
              <input 
                className="flex-1 bg-transparent border-none py-6 px-5 text-base font-bold text-gray-200 outline-none placeholder-gray-700"
                placeholder={t.placeholder}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isTyping}
              />
              <button 
                disabled={!input.trim() || isTyping}
                className={`p-5 rounded-full shadow-2xl transition-all disabled:opacity-20 active:scale-95 flex items-center justify-center ${isTyping ? 'bg-gray-800' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'}`}
              >
                {isTyping ? <Loader2 size={28} className="animate-spin text-purple-400" /> : <Send size={28} />}
              </button>
            </div>
          </form>
          
          <div className="flex justify-center gap-6 opacity-30">
             <div className="flex items-center gap-2">
                <Shield size={12} className="text-gray-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Secure AI Processing</span>
             </div>
             <div className="flex items-center gap-2">
                <Zap size={12} className="text-gray-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Fast Response Engine</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestChat;
