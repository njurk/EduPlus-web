import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    GraduationCap,
    Settings,
    LogOut,
    Bell,
    CheckCircle,
    LucideList
} from 'lucide-react';

export const USER = {
    firstName: "Jan",
    lastName: "Kowalski",
    role: "Uczeń",
    className: "3A Liceum"
};

export const menuItems = [
    { name: 'Pulpit', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Oceny', path: '/grades', icon: <GraduationCap size={20} /> },
    { name: 'Frekwencja', path: '/attendance', icon: <CheckCircle size={20} /> },
    { name: 'Plan lekcji', path: '/schedule', icon: <LucideList size={20} /> },
    { name: 'Terminarz', path: '/calendar', icon: <Calendar size={20} /> },
    { name: 'Ogłoszenia', path: '/announcements', icon: <Bell size={20} /> },
];

const Sidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
            <div className="h-20 flex items-center justify-center border-b border-gray-100">
                <img src="/logo-512.png" alt="EduPlus" className="h-8 w-auto" />
                <span className="ml-3 font-bold text-gray-800 text-lg">EduPlus</span>
            </div>

            <div className="p-6 border-b border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xl font-bold mb-3">
                    {USER.firstName[0]}{USER.lastName[0]}
                </div>
                <h3 className="font-semibold text-gray-800">{USER.firstName} {USER.lastName}</h3>
                <p className="text-sm text-gray-500">{USER.role}</p>
                <span className="mt-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-sm">
                    {USER.className}
                </span>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.name}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-sm transition-colors ${isActive
                                        ? 'bg-green-50 text-green-700 border-l-4 border-green-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <span className="mr-3">{item.icon}</span>
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-100 space-y-1">
                <Link to="/settings" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-sm hover:bg-gray-50 transition-colors">
                    <Settings size={20} className="mr-3" />
                    Ustawienia
                </Link>
                <Link to="/" className="flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-sm hover:bg-red-50 transition-colors">
                    <LogOut size={20} className="mr-3" />
                    Wyloguj się
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;