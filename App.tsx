
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, DollarSign, Layout, Sparkles, Mic, 
  ChevronDown, ShoppingBag, UserCircle, LogOut,
  Shield, Users, User, UserPlus, Layers, Plus, ChevronRight, GraduationCap, MessageSquare, Globe, LayoutDashboard
} from 'lucide-react';
import { TabType, Course, UserRole, Invoice, Language } from './types';
import CourseEditor from './components/CourseEditor';
import FinanceHub from './components/FinanceHub';
import AILab from './components/AILab';
import LiveAssistant from './components/LiveAssistant';
import Showcase from './components/Showcase';
import StudentDashboard from './components/StudentDashboard';
import GuestChat from './components/GuestChat';
import SpecialistDashboard from './components/SpecialistDashboard';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'uk';
  });
  const [role, setRole] = useState<UserRole>('guest');
  const [activeTab, setActiveTab] = useState<TabType>('showcase');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentStudentName] = useState('Марія Іванова'); 

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  // СУВОРИЙ КОНТРОЛЬ ДОСТУПУ ТА ПЕРЕНАПРАВЛЕННЯ
  useEffect(() => {
    if (role === 'guest') {
      if (activeTab !== 'showcase' && activeTab !== 'guest-chat') {
        setActiveTab('showcase');
      }
    } else if (role === 'student') {
      if (!['showcase', 'my-courses', 'live-assistant', 'finance'].includes(activeTab)) {
        setActiveTab('my-courses');
      }
    } else if (role === 'specialist' || role === 'admin') {
      if (activeTab === 'guest-chat' || activeTab === 'my-courses') {
        setActiveTab('specialist-dashboard');
      }
    }
  }, [role, activeTab]);

  const t = useMemo(() => {
    const translations = {
      uk: {
        showcase: 'Вітрина',
        guestChat: 'ARI Помічник',
        myDashboard: 'Мій Кабінет',
        specialistHub: 'Мій HUB',
        aiCoach: 'ARI Коуч',
        content: 'Контент',
        aiLab: 'AI Lab',
        finance: 'Фінанси',
        syncActive: 'Cloud Sync Active',
        profile: 'Профіль',
        roles: { guest: 'Гість', student: 'Студент', specialist: 'Спеціаліст', admin: 'Адмін' },
        myPrograms: 'МОЇ ПРОГРАМИ',
        management: 'Управління',
        newProgram: 'Новий напрямок Magic Lash'
      },
      en: {
        showcase: 'Showcase',
        guestChat: 'ARI Assistant',
        myDashboard: 'My Dashboard',
        specialistHub: 'Specialist HUB',
        aiCoach: 'ARI Coach',
        content: 'Content',
        aiLab: 'AI Lab',
        finance: 'Finance',
        syncActive: 'Cloud Sync Active',
        profile: 'Profile',
        roles: { guest: 'Guest', student: 'Student', specialist: 'Specialist', admin: 'Admin' },
        myPrograms: 'MY PROGRAMS',
        management: 'Management',
        newProgram: 'New Magic Lash Program'
      }
    };
    return translations[language];
  }, [language]);

  const [courses, setCourses] = useState<Course[]>([
    {
      id: 'c1',
      title: 'InLei® Lash Filler 25.9',
      isExtensionCourse: false,
      price: 550,
      studentCount: 42,
      description: 'Революційна формула для потовщення вій. Хімія складів та повний протокол процедури.',
      image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800',
      lessons: [
        { 
          id: 'l1', 
          title: language === 'uk' ? 'Хімія складів' : 'Chemistry of Formulations',
          steps: [
            { id: 1, type: 'lecture', title: language === 'uk' ? 'Привітання' : 'Introduction', aiPrompt: 'Cinematic laboratory welcome for InLei technicians.', ragQuery: 'InLei logo and filler ingredients.', media: '' },
            { id: 2, type: 'quiz', title: language === 'uk' ? 'Тест: Час експозиції' : 'Quiz: Exposure Time', question: '...', correctAnswer: '...' }
          ],
          aiPrompt: 'InLei Lash Filler scientific approach intro.',
          ragQuery: 'InLei 25.9 ingredients and clinical study results.'
        }
      ]
    },
    {
      id: 'c2',
      title: 'Magic Lash Geometry',
      isExtensionCourse: true,
      price: 450,
      studentCount: 28,
      description: 'Нарощування вій: від 2D до 5D. Геометрія пучка, площа зчіпки та мікровідступи.',
      image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=400',
      lessons: [
         { 
          id: 'l2', 
          title: language === 'uk' ? 'Основи Геометрії' : 'Geometry Basics',
          steps: [
            { id: 1, type: 'lecture', title: 'Perfect Fan', aiPrompt: 'Macro video of creating a perfect 3D lash fan.', ragQuery: '3D fan width and symmetry rules.', media: '' }
          ],
          aiPrompt: 'Cinematic intro to eyelash geometry and fan creation.',
          ragQuery: 'Geometry principles for 2D-5D volume extensions.'
        }
      ]
    }
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    { 
      id: 'INV-001', 
      student: 'Марія Іванова', 
      instructorName: 'Маргарита Кузнецова',
      course: 'InLei® Lash Filler 25.9', 
      total: 550, 
      paid: 200, 
      status: 'partial', 
      dueDate: '2025-06-15',
      payments: [
        { id: 'p1', amount: 100, date: '2025-02-10', note: 'Передплата готівкою' },
        { id: 'p2', amount: 100, date: '2025-02-25', note: 'Другий внесок' }
      ]
    },
    { 
      id: 'INV-002', 
      student: 'Олена Петренко', 
      instructorName: 'Маргарита Кузнецова',
      course: 'Magic Lash Geometry', 
      total: 450, 
      paid: 20, 
      status: 'partial', 
      dueDate: '2025-05-20',
      payments: [
        { id: 'p3', amount: 20, date: '2025-03-01', note: 'Бронювання місця' }
      ]
    }
  ]);

  const [activeCourseId, setActiveCourseId] = useState('c1');
  const activeCourse = useMemo(() => courses.find(c => c.id === activeCourseId) || courses[0], [courses, activeCourseId]);

  const handleAddInvoice = (newInv: Invoice) => {
    setInvoices(prev => [newInv, ...prev]);
  };

  const handleAddCourse = () => {
    if (role !== 'admin' && role !== 'specialist') return;
    const newCourse: Course = {
      id: `c${courses.length + 1}`,
      title: t.newProgram,
      isExtensionCourse: true,
      lessons: [{ id: `l${Date.now()}`, title: language === 'uk' ? 'Вступ' : 'Intro', steps: [{ id: 1, type: 'lecture', title: 'Intro Step', aiPrompt: '', ragQuery: '', comments: '' }] }]
    };
    setCourses([...courses, newCourse]);
    setActiveCourseId(newCourse.id);
  };

  const handleCourseClick = (courseId: string) => {
    setActiveCourseId(courseId);
    setActiveTab('courses-admin');
  };

  const sidebarItems = useMemo(() => {
    const allItems = [
      { id: 'showcase', icon: ShoppingBag, label: t.showcase, roles: ['guest', 'student', 'specialist', 'admin'] },
      { id: 'guest-chat', icon: Sparkles, label: t.guestChat, roles: ['guest'] },
      { id: 'specialist-dashboard', icon: LayoutDashboard, label: t.specialistHub, roles: ['specialist', 'admin'] },
      { id: 'my-courses', icon: UserCircle, label: t.myDashboard, roles: ['student'] },
      { id: 'live-assistant', icon: Mic, label: t.aiCoach, roles: ['student', 'admin'] },
      { id: 'courses-admin', icon: BookOpen, label: t.content, roles: ['specialist', 'admin'] },
      { id: 'ai-lab', icon: Sparkles, label: t.aiLab, roles: ['specialist', 'admin'] },
      { id: 'finance', icon: DollarSign, label: t.finance, roles: ['specialist', 'student', 'admin'] },
    ];
    return allItems.filter(item => item.roles.includes(role));
  }, [role, t]);

  const roleMeta = {
    guest: { icon: UserPlus, label: t.roles.guest, color: 'text-gray-400' },
    student: { icon: User, label: t.roles.student, color: 'text-blue-400' },
    specialist: { icon: Users, label: t.roles.specialist, color: 'text-orange-400' },
    admin: { icon: Shield, label: t.roles.admin, color: 'text-purple-400' }
  };

  return (
    <div className="flex h-screen bg-[#0A0C10] text-[#F0F2F5] overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-[#12141C] border-r border-[#1F232B] flex flex-col transition-all duration-300 z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]`}>
        <div className="p-6 border-b border-[#1F232B] flex items-center justify-between shrink-0">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-purple-500/20">M</div>
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
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 relative group overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_10px_30px_-10px_rgba(147,51,234,0.6)]' 
                  : 'hover:bg-[#1F232B] text-gray-400 hover:text-gray-200'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
              {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-[0.15em]">{item.label}</span>}
            </button>
          ))}

          {isSidebarOpen && role !== 'guest' && (
            <div className="border-t border-[#1F232B] mt-4 pt-6 text-left">
              <div className="px-2 flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase text-gray-600 tracking-widest flex items-center gap-2">
                  {role === 'student' ? <GraduationCap size={14} className="text-gray-700" /> : <Layers size={14} />} 
                  {role === 'student' ? t.myPrograms : t.management}
                </h3>
                {(role === 'admin' || role === 'specialist') && (
                  <button onClick={handleAddCourse} className="p-1.5 bg-[#1F232B] hover:bg-purple-600 rounded-lg text-gray-400 hover:text-white transition-all">
                    <Plus size={14} />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseClick(course.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative group ${
                      activeCourseId === course.id && activeTab === 'courses-admin'
                        ? (course.isExtensionCourse ? 'bg-purple-500/5 border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.1)]') 
                        : 'border-transparent text-gray-500 hover:bg-[#1F232B] hover:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${course.isExtensionCourse ? 'bg-purple-500' : 'bg-yellow-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest truncate block leading-none">{course.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {isSidebarOpen && (
          <div className="p-6 border-t border-[#1F232B] shrink-0">
            <div className="bg-[#0A0C10] p-4 rounded-3xl border border-[#1F232B] flex items-center gap-4 group transition-all">
              <div className="w-12 h-12 bg-[#12141C] border border-[#1F232B] rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                {React.createElement(roleMeta[role].icon, { size: 24, className: roleMeta[role].color })}
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-gray-600 leading-none mb-1 tracking-widest">{t.profile}</p>
                <p className="text-[11px] font-black text-gray-200 uppercase tracking-wider">{roleMeta[role].label}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
        <header className="h-16 bg-[#12141C] border-b border-[#1F232B] flex items-center justify-between px-10 shrink-0 shadow-sm relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" />
             <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.25em]">{t.syncActive}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-[#0A0C10] p-1.5 rounded-2xl border border-[#1F232B] shadow-inner">
              {(['uk', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all duration-300 ${language === lang ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="flex bg-[#0A0C10] p-1.5 rounded-2xl border border-[#1F232B] shadow-inner">
              {(['guest', 'student', 'specialist', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all duration-300 ${role === r ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {language === 'uk' ? t.roles[r] : r}
                </button>
              ))}
            </div>
            <button className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"><LogOut size={20} /></button>
          </div>
        </header>

        <div className="flex-1 min-h-0 flex flex-col relative">
          {activeTab === 'showcase' && <Showcase lang={language} onPurchase={handleAddInvoice} onNavigate={setActiveTab} />}
          {activeTab === 'guest-chat' && role === 'guest' && <GuestChat lang={language} courses={courses} onPurchase={handleAddInvoice} onNavigate={setActiveTab} />}
          {activeTab === 'specialist-dashboard' && (role === 'specialist' || role === 'admin') && (
            <SpecialistDashboard lang={language} courses={courses} invoices={invoices} onNavigate={setActiveTab} onSetActiveCourse={setActiveCourseId} onAddInvoice={handleAddInvoice} />
          )}
          {activeTab === 'my-courses' && role === 'student' && (
            <StudentDashboard lang={language} activeCourse={activeCourse} />
          )}
          {activeTab === 'courses-admin' && (role === 'admin' || role === 'specialist') && (
            <CourseEditor lang={language} course={activeCourse} onUpdate={(u) => setCourses(courses.map(c => c.id === u.id ? u : c))} />
          )}
          {activeTab === 'finance' && (role !== 'guest') && (
            <FinanceHub lang={language} invoices={invoices} setInvoices={setInvoices} userRole={role} studentName={currentStudentName} />
          )}
          {activeTab === 'ai-lab' && (role === 'admin' || role === 'specialist') && (
            <AILab lang={language} />
          )}
          {activeTab === 'live-assistant' && (role === 'admin' || role === 'student') && (
            <LiveAssistant lang={language} activeCourse={activeCourse} studentName={currentStudentName} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
