import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 md:p-12 rounded-sm shadow-lg max-w-lg w-full text-center border-t-4 border-green-600">
        
        <div className="flex justify-center mb-6">
          <div className="bg-green-50 p-4 rounded-full">
            <FileQuestion className="w-16 h-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Strona nie została znaleziona</h2>
        
        <p className="text-gray-500 mb-8 leading-relaxed">
          Przepraszamy, ten adres nie istnieje, został przeniesiony lub nie masz do niego dostępu.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <ArrowLeft size={18} className="mr-2" />
            Wróć
          </button>

          <Link 
            to="/dashboard" 
            className="flex items-center justify-center px-6 py-3 bg-green-700 text-white font-medium rounded-sm hover:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
          >
            <Home size={18} className="mr-2" />
            Strona główna
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;