import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar className="hidden md:flex" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-[1920px] mx-auto">
             <Outlet />
          </div>
        </div>
        
      </main>
    </div>
  );
};

export default Layout;