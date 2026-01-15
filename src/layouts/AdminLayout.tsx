import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Users, Settings, Home, LogOut, FilePenIcon, Folder, Layout, BookMarked, Megaphone, Calendar, HelpCircle, GraduationCap, ClipboardCheck, BookOpen, FileCheck } from 'lucide-react';
import { clsx } from 'clsx';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right hidden sm:block">
      <div className="text-sm font-bold text-neutral-800">{time.toLocaleTimeString()}</div>
      <div className="text-xs text-neutral-500">{time.toLocaleDateString()}</div>
    </div>
  );
};

export const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [user] = useState<{ name: string } | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleNavClick = () => setSidebarOpen(false);

  const handleLogout = () => {
    if (window.confirm("Na pewno chcesz się wylogować?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const navSections = [
    {
      title: null,
      items: [
        { label: 'Pulpit', path: '/', icon: Home },
      ]
    },
    {
      title: 'Nauczanie',
      items: [
        { label: 'Dzienniki', path: '/class-register', icon: BookMarked },
        { label: 'Plany lekcji', path: '/schedule', icon: Calendar },
        { label: 'Lekcje', path: '/lessons', icon: BookOpen },
        { label: 'Oceny', path: '/grades', icon: GraduationCap },
        { label: 'Frekwencja', path: '/attendance', icon: ClipboardCheck },
        { label: 'Usprawiedliwienia', path: '/excuses', icon: FileCheck },
      ]
    },
    {
      title: 'Zarządzanie',
      items: [
        { label: 'Użytkownicy', path: '/users', icon: Users },
        { label: 'Klasy', path: '/class-management', icon: Folder },
        { label: 'Ogłoszenia', path: '/announcements', icon: Megaphone },
        { label: 'Zgłoszenia', path: '/tickets', icon: HelpCircle },
      ]
    },
    {
      title: 'System',
      items: [
        { label: 'Konfiguracja', path: '/system-config', icon: FilePenIcon },
        { label: 'CMS', path: '/cms', icon: Layout },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-neutral-50 font-sans overflow-hidden">
      <div
        className={clsx(
          "fixed inset-0 bg-neutral-900/50 z-40 lg:hidden transition-opacity duration-300",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-56 bg-neutral-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-neutral-800",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-14 px-4 bg-primary border-b border-primary-hover">
          <span className="font-bold text-lg tracking-tight text-white">EduPlus</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:text-neutral-200">
            <X size={20} />
          </button>
        </div>

        <nav className="p-2 space-y-4 overflow-y-auto h-[calc(100vh-110px)]">
          {navSections.map((section, idx) => (
            <div key={idx}>
              {section.title && <div className="px-3 py-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider">{section.title}</div>}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) => clsx(
                      "flex items-center px-3 py-2 text-sm rounded-xs font-medium",
                      isActive ? "bg-primary text-white" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    )}
                  >
                    <item.icon size={16} className="mr-2 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 bg-neutral-950 border-t border-neutral-800">
          <p className="text-xs text-neutral-500 font-mono">v1.0.0 EduPlus</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-neutral-500 hover:text-neutral-700 p-1 mr-4 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
          <div className="flex items-center gap-6">
            <Clock />
            <div className="flex items-center gap-4 pl-6 border-l border-neutral-200 h-8">
              <span className="text-sm font-medium text-neutral-600 hidden md:block">
                Witaj, <span className="text-neutral-900 font-semibold">
                  {user?.name || "Użytkownik"}
                </span>!
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 text-neutral-500 hover:text-primary hover:bg-neutral-50 transition-all rounded-full"
                  title="Ustawienia"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-neutral-500 hover:text-danger hover:bg-neutral-50 transition-all rounded-full"
                  title="Wyloguj"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-neutral-50">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};