import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const Header: React.FC = () => {
  const [date, setDate] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentSemesterInfo = "Semestr 1 / 2023/2024";

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pl-PL', opts).format(date);

  return (
    <>
      <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10 relative">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-sm transition-colors shrink-0"
          >
            <Menu size={24} />
          </button>

          <div className="md:hidden font-bold text-gray-800 text-lg shrink-0">
             EduPlus
          </div>

          <div className="md:hidden h-4 w-px bg-gray-300 mx-1 shrink-0"></div>

          <div className="text-xs md:text-sm font-medium text-gray-500 bg-gray-50 px-2 md:px-3 py-1 rounded-sm border border-gray-100 whitespace-nowrap truncate">
             {currentSemesterInfo}
          </div>
        </div>

        <div className="text-right hidden sm:block shrink-0 ml-4">
          <div className="text-xl font-bold text-gray-800 leading-none">
            {fmt({ hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
            {fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative z-10 h-full animate-in slide-in-from-left duration-200">
             <Sidebar 
                className="flex h-full shadow-2xl w-[280px]"
                onClose={() => setIsMobileMenuOpen(false)} 
             />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;