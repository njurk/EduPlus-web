import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, LayoutDashboard } from 'lucide-react';
import Dashboard from './Dashboard';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 md:p-12 rounded-sm shadow-lg max-w-lg w-full text-center">
        
        <div className="flex justify-center mb-6">
          <div>
            <FileQuestion className="w-16 h-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-8">Strona nie została znaleziona</h2>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-sm hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <ArrowLeft size={18} className="mr-2" />
            Wróć
          </button>

          <Link 
            to="/dashboard" 
            className="flex items-center justify-center px-6 py-3 bg-green-700 text-white font-medium rounded-sm hover:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
          >
            <LayoutDashboard size={18} className="mr-2" />
            Pulpit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;