
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BookOpen, DollarSign, Layout, Sparkles, Mic, 
  ShoppingBag, UserCircle, LogOut,
  Shield, Users, User, UserPlus, Layers, Plus, GraduationCap, LayoutDashboard, LogIn, Loader2,
  AlertTriangle, Copy, Check, Info, Globe, Link as LinkIcon, ArrowRight, ExternalLink, RefreshCw, AlertCircle, Eye, Settings, ExternalLink as NewTab, Mail, Lock, CheckSquare, Square, Zap, X
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { TabType, Course, UserRole, Invoice, Language, Section } from './types';
import CourseEditor from './components/CourseEditor';
import FinanceHub from './components/FinanceHub';
import AILab from './components/AILab';
import LiveAssistant from './components/LiveAssistant';
import Showcase from './components/Showcase';
import StudentDashboard from './components/StudentDashboard';
import GuestChat from './components/GuestChat';
import SpecialistDashboard from './components/SpecialistDashboard';
import { auth, db, loginWithGoogle, logout, saveInvoiceToDB, syncUserProfile, registerWithEmail, loginWithEmail, loginAnonymously, subscribeToCourses, saveCourseToDB } from './services/firebase';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_lang');
      return (saved === 'en' || saved === 'uk') ? saved : 'uk';
    }
    return 'uk';
  });

  const [user, setUser] = useState<any>(null);
  const [realRole, setRealRole] = useState<UserRole>('guest');
  const [role, setRole] = useState<UserRole>('guest');
  const [activeTab, setActiveTab] = useState<TabType>('showcase');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPreLoginModal, setShowPreLoginModal] = useState(false); 
  const [loginError, setLoginError] = useState<{title: string, message: string, code?: string} | null>(null);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [rememberMe, setRememberMe] = useState(true);

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          setUserProfile(profile);
          const userRole = (profile?.role as UserRole) || 'student';
          setRealRole(userRole);
          setRole(userRole);
          
          if (activeTab === 'showcase' || activeTab === 'guest-chat') {
            if (userRole === 'admin' || userRole === 'specialist') setActiveTab('specialist-dashboard');
            else setActiveTab('my-courses');
          }
          setShowPreLoginModal(false); 
        } catch (e) {
          console.error("Profile sync error", e);
        }
      } else {
        setRealRole('guest');
        setRole('guest');
        setUserProfile(null);
        setActiveTab('showcase');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || role === 'guest') {
      setInvoices([]);
      return;
    }

    try {
      const q = (role === 'admin' || role === 'specialist')
        ? collection(db, "invoices") 
        : query(collection(db, "invoices"), where("studentId", "==", user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Invoice[];
        setInvoices(docs.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
      }, (err) => {
        console.error("Invoices listener error:", err);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Firestore init error:", err);
    }
  }, [user, role]);

  useEffect(() => {
    setIsLoadingCourses(true);
    const unsubscribe = subscribeToCourses((fetchedCourses) => {
      const normalized = fetchedCourses.map(c => ({
        ...c,
        isPublished: c.isPublished ?? true,
        sections: c.sections || []
      }));
      setCourses([...normalized].sort((a, b) => a.id.localeCompare(b.id)));
      setIsLoadingCourses(false);
    });
    
    const timer = setTimeout(() => {
      setIsLoadingCourses(false);
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const activeCourse = useMemo(() => {
    if (courses.length === 0) return null;
    if (activeCourseId) {
      return courses.find(c => String(c.id) === String(activeCourseId)) || courses[0];
    }
    return courses[0];
  }, [courses, activeCourseId]);

  const t = useMemo(() => {
    const translations = {
      uk: {
        showcase: 'Вітрина',
        guestChat: 'ARI Помічник',
        myDashboard: 'Мій Кабінет',
        specialistHub: 'HUB Управління',
        aiCoach: 'ARI Коуч',
        content: 'Контент',
        aiLab: 'AI Lab',
        finance: 'Фінанси',
        syncActive: 'Cloud Sync Active',
        roles: { guest: 'Гість', student: 'Студент', specialist: 'Спеціаліст', admin: 'Адмін' },
        login: 'Увійти'
      },
      en: {
        showcase: 'Showcase',
        guestChat: 'ARI Assistant',
        myDashboard: 'My Dashboard',
        specialistHub: 'HUB Control',
        aiCoach: 'ARI Coach',
        content: 'Content',
        aiLab: 'AI Lab',
        finance: 'Finance',
        syncActive: 'Cloud Sync Active',
        roles: { guest: 'Guest', student: 'Student', specialist: 'Specialist', admin: 'Admin' },
        login: 'Login'
      }
    };
    return translations[language] || translations['uk'];
  }, [language]);

  const sidebarItems = useMemo(() => {
    const allItems = [
      { id: 'showcase', icon: ShoppingBag, label: t.showcase, roles: ['guest', 'student', 'admin', 'specialist'] },
      { id: 'guest-chat', icon: Sparkles, label: t.guestChat, roles: ['guest'] },
      { id: 'specialist-dashboard', icon: LayoutDashboard, label: t.specialistHub, roles: ['admin', 'specialist'] },
      { id: 'my-courses', icon: UserCircle, label: t.myDashboard, roles: ['student'] },
      { id: 'live-assistant', icon: Mic, label: t.aiCoach, roles: ['student', 'admin', 'specialist'] },
      { id: 'courses-admin', icon: BookOpen, label: t.content, roles: ['admin', 'specialist'] },
      { id: 'ai-lab', icon: Sparkles, label: t.aiLab, roles: ['admin'] },
      { id: 'finance', icon: DollarSign, label: t.finance, roles: ['student', 'specialist', 'admin'] },
    ];
    return allItems.filter(item => item.roles.includes(role));
  }, [role, t]);

  const roleMeta = {
    guest: { icon: UserPlus, label: t.roles?.guest || 'Guest', color: 'text-gray-400' },
    student: { icon: User, label: t.roles?.student || 'Student', color: 'text-blue-400' },
    specialist: { icon: Users, label: t.roles?.specialist || 'Specialist', color: 'text-orange-400' },
    admin: { icon: Shield, label: t.roles?.admin || 'Admin', color: 'text-purple-400' }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      if (isRegistering) await registerWithEmail(authForm.email, authForm.password, authForm.name, rememberMe);
      else await loginWithEmail(authForm.email, authForm.password, rememberMe);
    } catch (error: any) {
      setLoginError({ title: "Помилка", message: error.message });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoggingIn(true);
    try { await loginWithGoogle(rememberMe); } catch (e: any) { setLoginError({title: "Google Error", message: e.message}); }
    finally { setIsLoggingIn(false); }
  };

  const handleAnonAdmin = async () => {
    setIsLoggingIn(true);
    try { await loginAnonymously(); } catch (e: any) { setLoginError({title: "Anon Error", message: e.message}); }
    finally { setIsLoggingIn(false); }
  };

  const handleCreateInitialCourse = async () => {
    const newCourse: Course = {
      id: `c-${Date.now()}`,
      title: 'Lash Mastery Course',
      description: 'Learn advanced lash techniques from the best.',
      sections: [],
      price: 500,
      currency: 'USD',
      image: 'https://images.unsplash.com/photo-1558704161-05002f70a220?auto=format&fit=crop&q=80&w=1000',
      isPublished: false,
      studentCount: 0
    };
    await saveCourseToDB(newCourse);
    setActiveCourseId(newCourse.id);
  };

  return (
    <div className="flex h-screen bg-[#0A0C10] text-[#F0F2F5] overflow-hidden">
      <aside 
        className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-[#12141C] border-r border-[#1F232B] flex flex-col transition-all duration-300 z-20 shadow-2xl relative`}
        aria-label="Навігація сайту"
      >
        <div className="p-6 border-b border-[#1F232B] flex items-center justify-between shrink-0">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black">M</div>
              <span className="font-black text-[11px] uppercase tracking-[0.2em] text-purple-400">Magic Lash HUB</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2.5 hover:bg-[#1F232B] rounded-xl text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            aria-label={isSidebarOpen ? "Згорнути панель" : "Розгорнути панель"}
          >
            <Layout size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar" role="menubar">
          {sidebarItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as TabType)} 
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${activeTab === item.id ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-[#1F232B] text-gray-400'}`}
              role="menuitem"
              aria-label={item.label}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <item.icon size={22} className="shrink-0" />
              {isSidebarOpen ? (
                <span className="text-[11px] font-black uppercase tracking-[0.15em] truncate animate-in fade-in slide-in-from-left-1">{item.label}</span>
              ) : (
                <div className="absolute left-full ml-4 px-3 py-2 bg-[#1F232B] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 shadow-2xl whitespace-nowrap backdrop-blur-md border border-white/5">
                   {item.label}
                   <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1F232B] rotate-45 border-l border-b border-white/5" />
                </div>
              )}
            </button>
          ))}
        </nav>
        
        {realRole === 'admin' && isSidebarOpen && (
          <div className="px-4 mb-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-[#1F232B]/50 border border-dashed border-purple-500/30 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-purple-400 uppercase tracking-widest"><Eye size={12} /> View Mode</div>
              <div className="grid grid-cols-4 gap-1">
                {(['guest', 'student', 'specialist', 'admin'] as UserRole[]).map((r) => (
                   <button 
                    key={r} 
                    onClick={() => { setRole(r); if (r === 'guest') setActiveTab('showcase'); else if (r === 'student') setActiveTab('my-courses'); else setActiveTab('specialist-dashboard'); }} 
                    className={`p-2 rounded-lg flex items-center justify-center transition-all focus:outline-none focus:ring-1 focus:ring-purple-500/50 ${role === r ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                    aria-label={`Переглянути як ${roleMeta[r].label}`}
                   >
                     {React.createElement(roleMeta[r].icon, { size: 14 })}
                   </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-[#1F232B]">
          <div className="bg-[#0A0C10] p-4 rounded-3xl border border-[#1F232B] flex items-center gap-4 group transition-all">
            <div className="w-12 h-12 bg-[#12141C] border border-[#1F232B] rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
              {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" alt="" /> : React.createElement(roleMeta[role].icon, { size: 24, className: roleMeta[role].color })}
            </div>
            {isSidebarOpen && (
              <div className="text-left overflow-hidden animate-in fade-in">
                <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest leading-none mb-1 truncate">{user?.displayName || (role === 'admin' ? 'Адмін' : 'Гість')}</p>
                <p className="text-[11px] font-black text-gray-200 uppercase">{roleMeta[role].label}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full relative" role="main">
        <header className="h-16 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0 relative z-10 shadow-sm">
          <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" /><span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.25em] font-bold">{t.syncActive}</span></div>
          <div className="flex items-center gap-4">
            <div className="flex bg-[#0A0C10] p-1.5 rounded-2xl border border-[#1F232B] shadow-inner">
              {(['uk', 'en'] as const).map((lang) => (
                <button key={lang} onClick={() => { setLanguage(lang); localStorage.setItem('app_lang', lang); }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${language === lang ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{lang}</button>
              ))}
            </div>
            {user ? <button onClick={logout} className="p-2.5 text-gray-500 hover:text-red-400 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-500/30" aria-label="Вийти"><LogOut size={20} /></button> : <button onClick={() => setShowPreLoginModal(true)} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"><LogIn size={16} /> {t.login}</button>}
          </div>
        </header>

        {showPreLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in p-6" role="dialog" aria-modal="true">
            <div className="bg-[#12141C] border border-[#1F232B] max-w-lg w-full rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 flex flex-col">
              <button onClick={() => { setShowPreLoginModal(false); setLoginError(null); }} className="absolute top-6 right-6 p-2 bg-[#0A0C10] rounded-full text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
                <X size={20} />
              </button>
              
              <div className="text-center space-y-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white mx-auto mb-2 shadow-lg shadow-purple-500/20">
                   <Shield size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {isRegistering ? 'Створити акаунт' : 'Вхід у HUB'}
                </h3>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                {isRegistering && (
                   <input required className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-purple-500/30" placeholder="Ваше Ім'я" value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})} />
                )}
                <input required type="email" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-purple-500/30" placeholder="Email" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} />
                <input required type="password" className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-purple-500/30" placeholder="Пароль" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} />

                <div className="flex items-center px-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div 
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${rememberMe ? 'bg-purple-600 border-purple-600' : 'border-[#1F232B] group-hover:border-purple-500/50'}`}
                    >
                      {rememberMe && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Запам'ятати мене</span>
                  </label>
                </div>

                <button type="submit" disabled={isLoggingIn} className="w-full py-5 bg-purple-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all focus:outline-none focus:ring-4 focus:ring-purple-500/20">
                  {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                  {isLoggingIn ? 'Обробка...' : (isRegistering ? 'Зареєструватися' : 'Увійти')}
                </button>
              </form>

              <button onClick={() => setIsRegistering(!isRegistering)} className="mt-6 text-xs font-bold text-gray-500 hover:text-white uppercase transition-colors">
                {isRegistering ? 'Вже є акаунт? Увійти' : 'Немає акаунту? Реєстрація'}
              </button>

              <div className="my-6 flex items-center gap-4"><div className="h-px bg-[#1F232B] flex-1" /><span className="text-[10px] font-black text-gray-600">АБО</span><div className="h-px bg-[#1F232B] flex-1" /></div>

              <div className="grid grid-cols-2 gap-4">
                 <button onClick={handleGoogleAuth} className="py-4 bg-[#0A0C10] border border-[#1F232B] rounded-2xl text-[10px] font-black uppercase text-white flex items-center justify-center gap-2 hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-white/10"><Globe size={14} /> Google</button>
                 <button onClick={handleAnonAdmin} className="py-4 bg-[#1F232B] border border-orange-500/20 rounded-2xl text-[9px] font-black uppercase text-orange-400 flex items-center justify-center gap-2 hover:bg-orange-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/30"><Zap size={14} /> Анонімний Admin</button>
              </div>

              {loginError && <p className="mt-4 text-xs text-red-400 font-bold uppercase text-center animate-bounce">{loginError.message}</p>}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col relative">
          {activeTab === 'showcase' && <Showcase lang={language} user={user} role={role} onPurchase={saveInvoiceToDB} onNavigate={setActiveTab} courses={courses} isLoading={isLoadingCourses} onSetActiveCourse={setActiveCourseId} />}
          {activeTab === 'specialist-dashboard' && (role === 'admin' || role === 'specialist') && <SpecialistDashboard lang={language} courses={courses} invoices={invoices} isLoading={isLoadingCourses} onNavigate={setActiveTab} onSetActiveCourse={setActiveCourseId} onAddInvoice={saveInvoiceToDB} />}
          {activeTab === 'my-courses' && role === 'student' && <StudentDashboard lang={language} activeCourse={activeCourse} courses={courses} invoices={invoices} onSetActiveCourse={setActiveCourseId} />}
          {activeTab === 'courses-admin' && (role === 'admin' || role === 'specialist') && (
            isLoadingCourses ? <div className="flex-1 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-purple-500" size={40} /><p className="mt-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Синхронізація контенту...</p></div> :
            activeCourse ? <CourseEditor key={activeCourse.id} lang={language} course={activeCourse} courses={courses} onSetActiveCourse={setActiveCourseId} onUpdate={(updated) => setCourses(prev => prev.map(c => c.id === updated.id ? updated : c))} onSave={saveCourseToDB} /> : 
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in fade-in">
               <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center text-purple-500"><BookOpen size={40} /></div>
               <div className="text-center"><p className="text-xl font-black text-white uppercase">Програм не знайдено</p><p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-widest">Ви можете створити першу програму прямо зараз</p></div>
               <button onClick={handleCreateInitialCourse} className="px-8 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-purple-700 transition-all">Створити перший курс</button>
            </div>
          )}
          {activeTab === 'finance' && role !== 'guest' && <FinanceHub lang={language} invoices={invoices} setInvoices={() => {}} userRole={role} studentName={user?.displayName} />}
          {activeTab === 'ai-lab' && role === 'admin' && <AILab lang={language} />}
          {activeTab === 'live-assistant' && role !== 'guest' && <LiveAssistant lang={language} activeCourse={activeCourse} studentName={user?.displayName} />}
          {activeTab === 'guest-chat' && <GuestChat lang={language} courses={courses} onPurchase={saveInvoiceToDB} onNavigate={setActiveTab} />}
        </div>
      </main>
    </div>
  );
};

export default App;
