import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, DollarSign, Layout, Sparkles, Mic, 
  ShoppingBag, UserCircle, LogOut,
  Shield, Users, User, UserPlus, Layers, Plus, GraduationCap, LayoutDashboard, LogIn, Loader2,
  AlertTriangle, Copy, Check, Info, Globe, Link as LinkIcon, ArrowRight, ExternalLink, RefreshCw, AlertCircle, Eye, Settings, ExternalLink as NewTab, Mail, Lock, CheckSquare, Square
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { TabType, Course, UserRole, Invoice, Language } from './types';
import CourseEditor from './components/CourseEditor';
import FinanceHub from './components/FinanceHub';
import AILab from './components/AILab';
import LiveAssistant from './components/LiveAssistant';
import Showcase from './components/Showcase';
import StudentDashboard from './components/StudentDashboard';
import GuestChat from './components/GuestChat';
import SpecialistDashboard from './components/SpecialistDashboard';
import { auth, db, loginWithGoogle, logout, saveInvoiceToDB, syncUserProfile, registerWithEmail, loginWithEmail } from './services/firebase';

const App: React.FC = () => {
  // Safe language initialization
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_lang');
      return (saved === 'en' || saved === 'uk') ? saved : 'uk';
    }
    return 'uk';
  });

  const [user, setUser] = useState<any>(null);
  
  // REAL ROLE: The actual role from DB (permissions)
  const [realRole, setRealRole] = useState<UserRole>('guest');
  // ROLE: The current UI state (can be switched by admin)
  const [role, setRole] = useState<UserRole>('guest');
  
  const [activeTab, setActiveTab] = useState<TabType>('showcase');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Login States
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPreLoginModal, setShowPreLoginModal] = useState(false); 
  const [loginError, setLoginError] = useState<{title: string, message: string, code?: string} | null>(null);
  const [currentDomain, setCurrentDomain] = useState('');
  
  // Email Auth Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [rememberMe, setRememberMe] = useState(true); // New state for persistence

  // Detect preview environment
  const isPreviewEnv = useMemo(() => {
    return currentDomain.includes('scf.usercontent.goog') || currentDomain.includes('web.app') || currentDomain.includes('localhost');
  }, [currentDomain]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.hostname);
    }
  }, []);

  // Auth & Role Logic
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          const userRole = profile?.role as UserRole || 'student';
          
          setRealRole(userRole); // Set the true role
          setRole(userRole);     // Set initial view role
          
          if (userRole === 'admin' || userRole === 'specialist') {
            setActiveTab('specialist-dashboard');
          } else {
            setActiveTab('my-courses');
          }
          setShowPreLoginModal(false); 
        } catch (e) {
          console.error("Profile sync error", e);
        }
      } else {
        setRealRole('guest');
        setRole('guest');
        setActiveTab('showcase');
      }
    });
    return () => unsubscribe();
  }, []);

  // Invoices Sync
  useEffect(() => {
    if (!user) {
      setInvoices([]);
      return;
    }
    try {
      // Logic adapts to the SIMULATED role to allow Admins to test Student views
      const q = (role === 'admin' || role === 'specialist')
        ? collection(db, "invoices") 
        : query(collection(db, "invoices"), where("studentId", "==", user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Invoice[];
        setInvoices(docs.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Firestore init error:", err);
    }
  }, [user, role]); // Depend on 'role' (simulated) not 'realRole'

  // --- Translation Logic ---
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

  const [courses] = useState<Course[]>([
    { id: 'c1', title: 'InLei® Lash Filler 25.9', isExtensionCourse: false, price: 550, description: 'Революційна формула для потовщення вій. Хімія складів та повний протокол процедури.', image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800', lessons: [] },
    { id: 'c2', title: 'Magic Lash Geometry', isExtensionCourse: true, price: 450, description: 'Нарощування вій: від 2D до 5D. Геометрія пучка, площа зчіпки та мікровідступи.', image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=400', lessons: [] },
    { id: 'c3', title: 'Lash Adhesive Master', isExtensionCourse: true, price: 300, description: 'Робота з клеєм в екстремальних умовах: температура, вологість та секрети носки.', image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=400', lessons: [] },
  ]);

  // Sidebar Items Definition
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
    // Filter items based on current (simulated) role
    return allItems.filter(item => item.roles.includes(role));
  }, [role, t]);

  const [activeCourseId, setActiveCourseId] = useState('c1');
  const activeCourse = useMemo(() => courses.find(c => c.id === activeCourseId) || courses[0], [courses, activeCourseId]);

  const roleMeta = {
    guest: { icon: UserPlus, label: t.roles?.guest || 'Guest', color: 'text-gray-400' },
    student: { icon: User, label: t.roles?.student || 'Student', color: 'text-blue-400' },
    specialist: { icon: Users, label: t.roles?.specialist || 'Specialist', color: 'text-orange-400' },
    admin: { icon: Shield, label: t.roles?.admin || 'Admin', color: 'text-purple-400' }
  };

  // Demo Invoices for new Students to show "My Courses" populated
  const effectiveInvoices = useMemo(() => {
    if (role === 'student' && invoices.length === 0) {
      // Return demo invoices so the student sees courses
      return [
        {
          id: 'demo-1',
          student: user?.displayName || 'Student',
          studentId: user?.uid,
          course: 'InLei® Lash Filler 25.9',
          total: 550,
          paid: 550,
          status: 'paid',
          dueDate: new Date().toISOString(),
          payments: []
        },
        {
          id: 'demo-2',
          student: user?.displayName || 'Student',
          studentId: user?.uid,
          course: 'Magic Lash Geometry',
          total: 450,
          paid: 0,
          status: 'unpaid',
          dueDate: new Date().toISOString(),
          payments: []
        }
      ] as Invoice[];
    }
    return invoices;
  }, [role, invoices, user]);

  // --- Handlers ---

  const handleLoginClick = () => {
     setCurrentDomain(window.location.hostname);
     setShowPreLoginModal(true);
     setLoginError(null);
     setIsRegistering(false);
     setIsLoggingIn(false); // Reset loading state just in case
     
     // Recover email from localStorage
     const savedEmail = localStorage.getItem('hub_user_email') || '';
     setAuthForm({ email: savedEmail, password: '', name: '' });
     setRememberMe(!!savedEmail || true); // If email saved, assume remember me was checked
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      if (isRegistering) {
        if (!authForm.name) throw new Error("Введіть ваше ім'я");
        await registerWithEmail(authForm.email, authForm.password, authForm.name, rememberMe);
      } else {
        await loginWithEmail(authForm.email, authForm.password, rememberMe);
      }
      
      // Save or Clear Email based on "Remember Me"
      if (rememberMe) {
        localStorage.setItem('hub_user_email', authForm.email);
      } else {
        localStorage.removeItem('hub_user_email');
      }
      
      setIsLoggingIn(false);

    } catch (error: any) {
      console.error("Auth failed:", error);
      setIsLoggingIn(false);

      let errorTitle = isRegistering ? "Помилка реєстрації" : "Помилка входу";
      let errorMsg = "Перевірте дані та спробуйте ще раз.";

      if (error.code === 'auth/email-already-in-use') errorMsg = "Цей email вже зареєстрований.";
      else if (error.code === 'auth/wrong-password') errorMsg = "Невірний пароль.";
      else if (error.code === 'auth/user-not-found') errorMsg = "Користувача не знайдено.";
      else if (error.code === 'auth/weak-password') errorMsg = "Пароль занадто слабкий.";

      setLoginError({ title: errorTitle, message: errorMsg, code: error.code });
    }
  };

  const executeGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await loginWithGoogle(rememberMe); // Pass rememberMe to service
      // Note: Google login doesn't expose email easily here to save to localStorage for pre-fill, 
      // but session persistence is handled by firebase service.
      setIsLoggingIn(false);
    } catch (error: any) {
      console.error("Google Login failed:", error);
      setIsLoggingIn(false); 
      setLoginError({ title: "Google Auth Error", message: error.message, code: error.code });
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0C10] text-[#F0F2F5] overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-[#12141C] border-r border-[#1F232B] flex flex-col transition-all duration-300 z-20 shadow-2xl`}>
        <div className="p-6 border-b border-[#1F232B] flex items-center justify-between shrink-0">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black">M</div>
              <span className="font-black text-[11px] uppercase tracking-[0.2em] text-purple-400">Magic Lash HUB</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-[#1F232B] rounded-xl text-gray-500 transition-colors">
            <Layout size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
                activeTab === item.id ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-[#1F232B] text-gray-400'
              }`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-[0.15em]">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        {/* ADMIN ROLE SWITCHER */}
        {realRole === 'admin' && isSidebarOpen && (
          <div className="px-4 mb-4 animate-in fade-in slide-in-from-left-4">
            <div className="bg-[#1F232B]/50 border border-dashed border-purple-500/30 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-purple-400 uppercase tracking-widest">
                <Eye size={12} /> Admin View Mode
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['guest', 'student', 'specialist', 'admin'] as UserRole[]).map((r) => (
                   <button
                     key={r}
                     onClick={() => {
                       setRole(r);
                       // Reset active tab based on new role to avoid empty screens
                       if (r === 'guest') setActiveTab('showcase');
                       else if (r === 'student') setActiveTab('my-courses');
                       else setActiveTab('specialist-dashboard');
                     }}
                     className={`p-2 rounded-lg flex items-center justify-center transition-all ${role === r ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                     title={t.roles?.[r]}
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
            <div className="w-12 h-12 bg-[#12141C] border border-[#1F232B] rounded-2xl flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                React.createElement(roleMeta[role].icon, { size: 24, className: roleMeta[role].color })
              )}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest leading-none mb-1 truncate">{user?.displayName || 'ГІСТЬ'}</p>
              <p className="text-[11px] font-black text-gray-200 uppercase">{roleMeta[role].label}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full relative">
        <header className="h-16 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0 shadow-sm relative z-10">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" />
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.25em] font-bold">{t.syncActive}</span>
             </div>

             {isPreviewEnv && (
               <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="hidden md:flex px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl text-[9px] font-black uppercase items-center gap-2 hover:bg-yellow-500/20 transition-all shadow-lg"
               >
                  <NewTab size={14} /> Open in New Tab
               </button>
             )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-[#0A0C10] p-1.5 rounded-2xl border border-[#1F232B] shadow-inner">
              {(['uk', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); localStorage.setItem('app_lang', lang); }}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all duration-300 ${language === lang ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {user ? (
              <button onClick={logout} className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"><LogOut size={20} /></button>
            ) : (
              <button onClick={handleLoginClick} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95 transition-all">
                <LogIn size={16} /> 
                {t.login}
              </button>
            )}
          </div>
        </header>

        {/* AUTH MODAL */}
        {showPreLoginModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in p-6">
            <div className="bg-[#12141C] border border-[#1F232B] max-w-lg w-full rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 flex flex-col">
              <button onClick={() => { setShowPreLoginModal(false); setLoginError(null); }} className="absolute top-6 right-6 p-2 bg-[#0A0C10] rounded-full text-gray-500 hover:text-white transition-colors">
                <LogOut size={20} className="rotate-180" />
              </button>
              
              <div className="text-center space-y-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white mx-auto mb-2 shadow-lg shadow-purple-500/20">
                   <Shield size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {isRegistering ? 'Створити акаунт' : 'Вхід у HUB'}
                </h3>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                   Доступ до навчальної платформи Magic Lash
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isRegistering && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-3">Ваше Ім'я</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input 
                        type="text"
                        required
                        className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:ring-1 ring-purple-500/50 outline-none"
                        placeholder="Марія Іванова"
                        value={authForm.name}
                        onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-3">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="email"
                      required
                      className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:ring-1 ring-purple-500/50 outline-none"
                      placeholder="student@example.com"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-3">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="password"
                      required
                      minLength={6}
                      className="w-full bg-[#0A0C10] border border-[#1F232B] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:ring-1 ring-purple-500/50 outline-none"
                      placeholder="••••••••"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    />
                  </div>
                </div>

                {/* REMEMBER ME CHECKBOX */}
                <div className="flex items-center gap-3 px-3">
                   <button 
                     type="button" 
                     onClick={() => setRememberMe(!rememberMe)}
                     className="flex items-center gap-3 group"
                   >
                     <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${rememberMe ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#0A0C10] border-[#1F232B] text-transparent hover:border-purple-500/50'}`}>
                        <Check size={14} strokeWidth={4} />
                     </div>
                     <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${rememberMe ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                       Запом'ятати мене
                     </span>
                   </button>
                </div>

                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-6"
                >
                  {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : (isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />)}
                  {isLoggingIn ? 'Обробка...' : (isRegistering ? 'Зареєструватися' : 'Увійти')}
                </button>
              </form>

              <div className="mt-6 text-center">
                 <button 
                   onClick={() => { setIsRegistering(!isRegistering); setLoginError(null); }}
                   className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
                 >
                   {isRegistering ? 'Вже є акаунт? Увійти' : 'Немає акаунту? Реєстрація'}
                 </button>
              </div>

              <div className="my-6 flex items-center gap-4">
                 <div className="h-px bg-[#1F232B] flex-1" />
                 <span className="text-[10px] font-black uppercase text-gray-600">АБО</span>
                 <div className="h-px bg-[#1F232B] flex-1" />
              </div>

              <button 
                onClick={executeGoogleLogin}
                className="w-full py-4 bg-[#0A0C10] hover:bg-[#1F232B] border border-[#1F232B] text-gray-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
              >
                <Globe size={14} /> Увійти через Google
              </button>

              {loginError && (
                 <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                       <p className="text-xs font-bold text-red-400 uppercase mb-1">{loginError.title}</p>
                       <p className="text-xs text-gray-400">{loginError.message}</p>
                    </div>
                 </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col relative">
          {activeTab === 'showcase' && <Showcase lang={language} user={user} onPurchase={saveInvoiceToDB} onNavigate={setActiveTab} courses={courses} />}
          {activeTab === 'specialist-dashboard' && (role === 'admin' || role === 'specialist') && (
            <SpecialistDashboard lang={language} courses={courses} invoices={invoices} onNavigate={setActiveTab} onSetActiveCourse={setActiveCourseId} onAddInvoice={saveInvoiceToDB} />
          )}
          {activeTab === 'my-courses' && role === 'student' && (
            <StudentDashboard 
              lang={language} 
              activeCourse={activeCourse} 
              courses={courses}
              invoices={effectiveInvoices} 
              onSetActiveCourse={setActiveCourseId}
            />
          )}
          {activeTab === 'courses-admin' && (role === 'admin' || role === 'specialist') && (
            <CourseEditor lang={language} course={activeCourse} onUpdate={() => {}} />
          )}
          {activeTab === 'finance' && role !== 'guest' && (
            <FinanceHub lang={language} invoices={invoices} setInvoices={() => {}} userRole={role} studentName={user?.displayName || 'Студент'} />
          )}
          {activeTab === 'ai-lab' && role === 'admin' && <AILab lang={language} />}
          {activeTab === 'live-assistant' && role !== 'guest' && <LiveAssistant lang={language} activeCourse={activeCourse} studentName={user?.displayName || 'Студент'} />}
          {activeTab === 'guest-chat' && <GuestChat lang={language} courses={courses} onPurchase={saveInvoiceToDB} onNavigate={setActiveTab} />}
        </div>
      </main>
    </div>
  );
};

export default App;