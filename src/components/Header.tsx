import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { menuItems } from './Sidebar';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(currentDate);

  const formattedTime = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit', minute: '2-digit'
  }).format(currentDate);

  const currentTitle = menuItems.find(i => i.path === location.pathname)?.name || 'Pulpit';

  return (
    <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10">
       <div className="flex items-center">
          {/* hamburger */}
          <button 
            onClick={onMenuClick}
            className="mr-4 md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-sm transition-colors"
          >
            <Menu size={24} />
          </button>

          <div className="text-gray-400 text-sm">EduPlus / {currentTitle}</div>
       </div>

       <div className="text-right hidden sm:block">
          <div className="text-xl font-bold text-gray-800 leading-none">{formattedTime}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{formattedDate}</div>
       </div>
    </header>
  );
};

export default Header;