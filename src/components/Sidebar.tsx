import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, GraduationCap, Settings, LogOut, Bell, List, CheckCircle, Smile, PhoneIcon, X } from 'lucide-react';

export const USER = {
  firstName: "Jan",
  lastName: "Kowalski",
  role: "Uczeń",
  className: "3A",
};

export const menuItems = [
  { name: 'Pulpit', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Oceny', path: '/grades', icon: <GraduationCap size={20} /> },
  { name: 'Zachowanie', path: '/behavior', icon: <Smile size={20} /> },
  { name: 'Frekwencja', path: '/attendance', icon: <CheckCircle size={20} /> },
  { name: 'Plan lekcji', path: '/schedule', icon: <List size={20} /> },
  { name: 'Terminarz', path: '/calendar', icon: <Calendar size={20} /> },
  { name: 'Ogłoszenia', path: '/announcements', icon: <Bell size={20} /> },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className = "hidden md:flex", onClose }) => {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname.startsWith(path);
    return `flex items-center px-4 py-3 text-sm font-medium rounded-sm transition-colors ${isActive
        ? 'bg-green-50 text-green-700 border-l-4 border-green-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`;
  };

  return (
    <aside className={`w-64 bg-white border-r border-gray-200 flex-col ${className}`}>
      <div className="h-16 min-h-[4rem] flex items-center justify-between px-6 border-b border-gray-100">
        <div className="flex items-center justify-center">
          <span className="font-bold text-gray-800 text-lg">EduPlus</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 rounded-sm">
            <X size={24} />
          </button>
        )}
      </div>

      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-lg font-bold shrink-0">
          {USER.firstName[0]}{USER.lastName[0]}
        </div>

        <div className="flex flex-col items-start overflow-hidden">
          <h3 className="font-semibold text-gray-800 text-sm truncate w-full" title={`${USER.firstName} ${USER.lastName}`}>
            {USER.firstName} {USER.lastName}
          </h3>
          <p className="text-xs text-gray-500 mb-1">{USER.role}</p>
          <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded-sm border border-green-100">
            Kl. {USER.className}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={onClose}
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

      <div className="p-4 border-t border-gray-100 space-y-1 bg-white">
        <Link
          to="/contact"
          onClick={onClose}
          className={getLinkClass('/contact')}
        >
          <PhoneIcon size={20} className="mr-3" />
          Kontakt
        </Link>
        <Link
          to="/settings"
          onClick={onClose}
          className={getLinkClass('/settings')}
        >
          <Settings size={20} className="mr-3" />
          Ustawienia
        </Link>
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-sm hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Wyloguj się
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;