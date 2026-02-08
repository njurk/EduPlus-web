import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Home, LogOut, Settings, BookOpen, Table, FileText, Megaphone } from 'lucide-react';
import { clsx } from 'clsx';
import { useCMSContent } from '../hooks/useCMSContent';
import { api } from '../services/apiService';
import { formatFullDate } from '../utils/formatters';

const Clock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-neutral-800">{time.toLocaleTimeString('pl-PL')}</div>
            <div className="text-xs text-neutral-600">{formatFullDate(time)}</div>
        </div>
    );
};

export const TeacherLayout = () => {
    const { getText } = useCMSContent('layout');
    const { getText: getSystemText } = useCMSContent('system');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const [user] = useState<{ name: string } | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const handleNavClick = () => setSidebarOpen(false);

    const handleLogout = async () => {
        if (window.confirm('Na pewno chcesz się wylogować?')) {
            await api.auth.logout();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const navSections = [
        {
            title: null,
            items: [
                { label: getText('nav.dashboard'), path: '/teacher', icon: Home },
            ]
        },
        {
            title: getText('nav.section.teaching'),
            items: [
                { label: getText('nav.schedule'), path: '/teacher/schedule', icon: Table },
                { label: 'Dziennik', path: '/teacher/registry', icon: BookOpen },
                { label: getText('nav.excuses') || 'Usprawiedliwienia', path: '/teacher/excuses', icon: FileText },
                { label: getText('nav.announcements') || 'Ogłoszenia', path: '/teacher/announcements', icon: Megaphone },
            ]
        },
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
                "fixed inset-y-0 left-0 z-50 w-56 bg-primary-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-primary-800",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between h-14 px-4 bg-primary border-b border-primary-hover">
                    <span className="font-bold text-lg tracking-tight text-white">{getText('systemName')}</span>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:text-neutral-200">
                        <X size={20} />
                    </button>
                </div>

                <nav className="p-2 space-y-4 overflow-y-auto h-[calc(100vh-110px)]">
                    {navSections.map((section, idx) => (
                        <div key={idx}>
                            {section.title && <div className="px-3 py-1 text-xs font-semibold text-primary-400 uppercase tracking-wider">{section.title}</div>}
                            <div className="space-y-0.5">
                                {section.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/teacher'}
                                        onClick={handleNavClick}
                                        className={({ isActive }) => clsx(
                                            "flex items-center px-3 py-2 text-sm rounded-xs font-medium",
                                            isActive ? "bg-primary text-white" : "text-primary-200 hover:bg-primary-800 hover:text-white"
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

                <div className="absolute bottom-0 w-full bg-primary-950 border-t border-primary-800">
                    <div className="px-4 py-2">
                        <p className="text-xs text-white font-mono">{getSystemText('version')}</p>
                    </div>
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
                                    {user?.name || 'Użytkownik'}
                                </span>!
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate('/teacher/settings')}
                                    className="p-2 text-neutral-500"
                                >
                                    <Settings size={20} />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-neutral-500"
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
