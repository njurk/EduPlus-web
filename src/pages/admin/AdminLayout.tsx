import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, Calendar, 
  Bell, Settings, LogOut, ChevronDown, GraduationCap, 
  School, Clock, CheckSquare 
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const SidebarItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-colors ${
    active 
      ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500' 
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`}>
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
  </div>
);

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">EduPlus <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded ml-2">ADMIN</span></h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">Ogólne</p>
          <SidebarItem icon={LayoutDashboard} label="Pulpit" />
          
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Użytkownicy i Role</p>
          <SidebarItem icon={Users} label="Użytkownicy (User)" active />
          <SidebarItem icon={CheckSquare} label="Role i Uprawnienia" />

          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Organizacja Szkoły</p>
          <SidebarItem icon={School} label="Lata i Semestry" />
          <SidebarItem icon={GraduationCap} label="Klasy (Class)" />
          <SidebarItem icon={BookOpen} label="Przedmioty (Subject)" />
          <SidebarItem icon={LayoutDashboard} label="Sale (Classroom)" />

          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Dydaktyka</p>
          <SidebarItem icon={Clock} label="Plan Lekcji" />
          <SidebarItem icon={Calendar} label="Terminarz" />
          <SidebarItem icon={Bell} label="Ogłoszenia" />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <SidebarItem icon={Settings} label="Ustawienia" />
          <div className="flex items-center gap-3 px-4 py-3 text-red-600 cursor-pointer hover:bg-red-50 rounded-md mt-1">
            <LogOut size={20} />
            <span className="font-medium text-sm">Wyloguj się</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-72">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="bg-gray-100 px-3 py-1.5 rounded text-sm text-gray-600 font-medium">
              Semestr 1 / 2025/2026
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-800">19:50</div>
              <div className="text-xs text-gray-500 uppercase">Niedziela, 21 Grudnia 2025</div>
            </div>
            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border-2 border-emerald-200">
              AD
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};