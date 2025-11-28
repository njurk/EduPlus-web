import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, TrendingUp, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const simpleStats = [
    { 
      title: "Najnowsza ocena", value: "5", desc: "Matematyka - Sprawdzian", 
      icon: <GraduationCap className="text-green-600" />, border: "border-green-200",
      link: "/grades"
    },
    { 
      title: "Frekwencja", value: "92%", desc: "W tym semestrze", 
      icon: <CheckCircle className="text-blue-600" />, border: "border-blue-200",
      link: "/attendance"
    },
    { 
      title: "Średnia ocen", value: "4.75", desc: "W tym roku szkolnym", 
      icon: <TrendingUp className="text-purple-600" />, border: "border-purple-200",
      link: "/grades"
    },
    { 
      title: "Najbliższe zajęcia", value: "Fizyka", desc: "Sala 104, 8:00-8:45", 
      icon: <Clock className="text-orange-600" />, border: "border-orange-200",
      link: "/schedule"
    },
  ];

  const exams = [
    { text: "Historia - Dział II", date: "28.11" },
    { text: "Język angielski - słówka", date: "02.12" },
  ];

  const announcements = [
    { text: "Wpłaty na radę rodziców do końca mc", date: "27.11" },
    { text: "Zmiana sali z matematyki na 102", date: "26.11" },
    { text: "Zapisy na kółko szachowe", date: "25.11" },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dzień dobry, Jan!</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* kafelki liczbowe */}
        {simpleStats.map((stat, index) => (
          <Link 
            to={stat.link}
            key={index} 
            className={`bg-white p-6 rounded-sm shadow-sm border-l-4 ${stat.border} hover:shadow-md transition-shadow duration-200 block`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</h3>
              </div>
              <div className="p-2 bg-gray-50 rounded-sm">
                {stat.icon}
              </div>
            </div>
            <p className="text-sm text-gray-600">{stat.desc}</p>
          </Link>
        ))}

        {/* zaliczenia */}
        <Link 
          to="/calendar"
          className="bg-white p-6 rounded-sm shadow-sm border-l-4 border-red-200 hover:shadow-md transition-shadow duration-200 flex flex-col block"
        >
          <div className="flex justify-between items-start mb-4">
             <p className="text-sm font-medium text-gray-500">Nadchodzące zaliczenia</p>
             <div className="p-2 bg-gray-50 rounded-sm ml-2">
                <FileText className="text-red-600" />
             </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end space-y-3">
            {exams.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-sm">
                <span className="text-gray-800 font-medium leading-tight mr-2 truncate">
                  {item.text}
                </span>
                <span className="text-gray-400 text-xs whitespace-nowrap pt-0.5 font-mono">
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </Link>

        {/* ogłoszenia */}
        <Link 
          to="/announcements"
          className="bg-white p-6 rounded-sm shadow-sm border-l-4 border-yellow-200 hover:shadow-md transition-shadow duration-200 flex flex-col block"
        >
          <div className="flex justify-between items-start mb-4">
             <p className="text-sm font-medium text-gray-500">Ostatnie ogłoszenia</p>
             <div className="p-2 bg-gray-50 rounded-sm ml-2">
                <AlertCircle className="text-yellow-600" />
             </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end space-y-3">
            {announcements.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-sm">
                <span className="text-gray-800 font-medium leading-tight mr-2 truncate">
                  {item.text}
                </span>
                <span className="text-gray-400 text-xs whitespace-nowrap pt-0.5 font-mono">
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </Link>

      </div>

      <Link to="/schedule" className="mt-8 bg-white p-6 rounded-sm shadow-sm block hover:shadow-md transition-shadow">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Plan lekcji</h3>
        <div className="h-32 flex items-center justify-center text-gray-400 bg-gray-50 rounded-sm border border-dashed border-gray-200">
          Miejsce na komponent planu lekcji
        </div>
      </Link>
    </>
  );
};

export default Dashboard;