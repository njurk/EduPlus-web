import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Home, LogOut, Settings, BookOpen, Table, FileText, Megaphone, MessageSquareWarning } from 'lucide-react';
import { useCMSContent } from '../hooks/useCMSContent';
import { api, API_URL } from '../services/apiService';
import { formatFullDate } from '../utils/formatters';
import { Badge } from '../components/ui/Badge';
import { SchoolYearBadge } from '../components/ui/SchoolYearBadge';
import { UnreadContext } from '../hooks/useUnread';
import type { UnreadCounts } from '../types';

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
    const { getText } = useCMSContent('teacherLayout');
    const { getText: getSystemText } = useCMSContent('system');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({ announcements: 0, tickets: 0, excuses: 0, isHomeroomTeacher: false, unreadAnnouncementIds: [] });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const eventSource = new EventSource(
            `${API_URL}/badge/unread-counts/stream?token=${token}`
        );

        eventSource.onmessage = (event) => {
            const counts = JSON.parse(event.data);
            setUnreadCounts(counts);
        };

        eventSource.onerror = () => {
            eventSource.close();
        };

        return () => eventSource.close();
    }, []);

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

    const teachingItems = [
        { label: getText('nav.schedule'), path: '/teacher/schedule', icon: Table },
        { label: getText('nav.registry'), path: '/teacher/registry', icon: BookOpen },
        ...(unreadCounts.isHomeroomTeacher ? [{ label: getText('nav.excuses'), path: '/teacher/excuses', icon: FileText, badge: unreadCounts.excuses }] : []),
        { label: getText('nav.announcements'), path: '/teacher/announcements', icon: Megaphone, badge: unreadCounts.announcements },
        { label: getText('nav.templates'), path: '/teacher/templates', icon: FileText },
    ];
    const navSections = [
        {
            title: null,
            items: [
                { label: getText('nav.dashboard'), path: '/teacher', icon: Home },
            ]
        },
        {
            title: getText('nav.section.teaching'),
            items: teachingItems
        },
    ];

    return (
        <div className="flex h-screen bg-neutral-50 font-sans overflow-hidden">
            <div
                className={`fixed inset-0 bg-neutral-900/50 z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            />

            <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-primary-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-primary-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-14 px-4 bg-primary border-b border-primary-hover">
                    <span className="font-bold text-lg tracking-tight text-white">{getSystemText('systemName')}</span>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:text-neutral-200">
                        <X size={20} />
                    </button>
                </div>

                <nav className="p-2 space-y-4 overflow-y-auto h-[calc(100vh-110px)] flex flex-col">
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
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-xs font-medium text-white ${isActive ? 'bg-primary' : 'hover:bg-primary-800'}`
                                        }
                                    >
                                        <item.icon size={16} className="mr-2 shrink-0" />
                                        {item.label}
                                        <Badge count={(item as any).badge} />
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="mt-auto pt-4 border-t border-primary-800">
                        <NavLink
                            to="/submit-ticket"
                            onClick={handleNavClick}
                            className="flex items-center px-3 py-2 text-sm rounded-xs font-medium text-white hover:bg-primary-800"
                        >
                            <MessageSquareWarning size={16} className="mr-2 shrink-0" />
                            Zgłoś problem
                        </NavLink>
                    </div>
                </nav>
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
                        <SchoolYearBadge />
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
                        <UnreadContext.Provider value={unreadCounts}>
                            <Outlet />
                        </UnreadContext.Provider>
                    </div>
                </main>
            </div>
        </div>
    );
};
