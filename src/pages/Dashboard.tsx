import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, CheckCircle, AlertCircle, ChevronRight, Clock, CalendarRange, MessageSquare } from 'lucide-react';

const Dashboard: React.FC = () => {
  const latestGrades = [
    { id: 1, subject: "Matematyka", grade: "5", date: "01.01.2026", desc: "Sprawdzian" },
    { id: 2, subject: "J. polski", grade: "4", date: "28.12.2025", desc: "Kartkówka" },
    { id: 3, subject: "Fizyka", grade: "3", date: "20.12.2025", desc: "Odpowiedź" },
    { id: 4, subject: "Chemia", grade: "5", date: "18.12.2025", desc: "Projekt" },
  ];

  const behaviorNotes = [
    { id: 1, date: "01.01.2026", text: "Aktywność na lekcji", points: 5, type: "positive" },
    { id: 2, date: "20.12.2025", text: "Brak zadania domowego", points: -5, type: "negative" },
    { id: 3, date: "15.12.2025", text: "Pomoc przy akademii", points: 10, type: "positive" },
    { id: 4, date: "10.12.2025", text: "Spóźnienie > 15min", points: -5, type: "negative" },
  ];

  const recentAttendance = [
    { id: 1, date: "01.01.2026", lesson: "Matematyka", status: "obecność" },
    { id: 2, date: "01.01.2026", lesson: "J. polski", status: "spóźnienie" },
    { id: 3, date: "28.12.2025", lesson: "Historia", status: "nieobecność" },
    { id: 4, date: "28.12.2025", lesson: "WF", status: "usprawiedliwione" },
  ];

  const todayLessons = [
    { hour: "08:00 - 08:45", subject: "Matematyka", room: "102" },
    { hour: "08:55 - 09:40", subject: "J. polski", room: "204" },
    { hour: "09:50 - 10:35", subject: "Angielski", room: "105" },
    { hour: "10:50 - 11:35", subject: "Historia", room: "201" },
    { hour: "11:45 - 12:30", subject: "WF", room: "Hala" },
  ];

  const upcomingEvents = [
    { id: 1, date: "02.01.2026", title: "Dział II", subject: "Historia", type: "sprawdzian" },
    { id: 2, date: "05.01.2026", title: "Słówka Unit 4", subject: "Angielski", type: "kartkówka" },
    { id: 3, date: "07.01.2026", title: "Trygonometria", subject: "Matematyka", type: "sprawdzian" },
    { id: 4, date: "10.01.2026", title: "Lektura", subject: "J. polski", type: "zadanie" },
  ];

  const announcements = [
    { id: 1, text: "Zebranie z rodzicami", date: "05.01.2026" },
    { id: 2, text: "Dzień sportu - harmonogram", date: "10.01.2026" },
    { id: 3, text: "Wycieczka klasowa - wpłaty", date: "15.01.2026" },
    { id: 4, text: "Zmiana planu lekcji", date: "20.01.2026" },
  ];

  const getAttendanceColor = (status: string) => {
    switch(status) {
        case 'obecność': return 'text-green-700 bg-green-100 border-green-200';
        case 'spóźnienie': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
        case 'nieobecność': return 'text-red-700 bg-red-100 border-red-200';
        case 'usprawiedliwione': return 'text-blue-700 bg-blue-100 border-blue-200';
        default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
        case 'sprawdzian': return 'text-red-700 bg-red-100 border-red-200';
        case 'kartkówka': return 'text-orange-700 bg-orange-100 border-orange-200';
        case 'zadanie': return 'text-blue-700 bg-blue-100 border-blue-200';
        default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="max-w-[1920px] mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Pulpit ucznia</h1>
            <p className="text-sm text-gray-500 mt-1">Witaj z powrotem, Jan!</p>
        </div>
        <div className="text-sm font-medium text-gray-500">
            Semestr 1 / 2023/2024
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        
        <Link 
            to="/grades"
            className="bg-white p-4 shadow-sm border-t-4 border-green-500 hover:shadow-md transition-all flex flex-col group h-fit"
        >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <GraduationCap size={20} className="text-green-600" />
                    Oceny
                </h3>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-green-600 transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
                {latestGrades.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-green-50/50 transition-colors">
                        <div>
                            <div className="text-sm font-semibold text-gray-700">{item.subject}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{item.desc} • {item.date}</div>
                        </div>
                        <span className="flex items-center justify-center w-8 h-8 bg-green-50 text-green-700 font-bold border border-green-200 text-base">
                            {item.grade}
                        </span>
                    </div>
                ))}
            </div>
        </Link>

        <Link 
            to="/behavior"
            className="bg-white p-4 shadow-sm border-t-4 border-orange-500 hover:shadow-md transition-all flex flex-col group h-fit"
        >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <MessageSquare size={20} className="text-orange-600" />
                    Uwagi
                </h3>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-orange-600 transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
                {behaviorNotes.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-orange-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-gray-400 w-20 shrink-0">{item.date}</span>
                            <span className="text-sm font-semibold text-gray-700">{item.text}</span>
                        </div>
                        <span className={`text-sm font-bold ${item.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.points > 0 ? `+${item.points}` : item.points}
                        </span>
                    </div>
                ))}
            </div>
        </Link>

        <Link 
            to="/attendance"
            className="bg-white p-4 shadow-sm border-t-4 border-blue-500 hover:shadow-md transition-all flex flex-col group h-fit"
        >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <CheckCircle size={20} className="text-blue-600" />
                    Frekwencja
                </h3>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
                {recentAttendance.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-blue-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-gray-400 w-20 shrink-0">{item.date}</span>
                            <span className="text-sm font-semibold text-gray-700">{item.lesson}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 uppercase font-bold tracking-wide border ${getAttendanceColor(item.status)}`}>
                            {item.status}
                        </span>
                    </div>
                ))}
            </div>
        </Link>

        <Link to="/schedule" className="bg-white p-4 shadow-sm border-t-4 border-teal-500 hover:shadow-md transition-all flex flex-col group h-fit">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={20} className="text-teal-600"/> 
                    Dzisiejszy plan lekcji
                </h3>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-teal-600 transition-colors" />
            </div>
            
            <div className="flex flex-col gap-1">
                {todayLessons.map((lesson, idx) => (
                    <div key={idx} className="flex items-center p-2 border-b border-gray-50 last:border-0 hover:bg-teal-50/30 transition-colors">
                        <span className="text-gray-500 w-24 font-mono text-xs font-medium shrink-0">{lesson.hour}</span>
                        <div className="flex-1 font-semibold text-gray-700 text-sm">{lesson.subject}</div>
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 border border-gray-200">s. {lesson.room}</span>
                    </div>
                ))}
            </div>
        </Link>

        <Link to="/calendar" className="bg-white p-4 shadow-sm border-t-4 border-purple-500 hover:shadow-md transition-all flex flex-col group h-fit">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <CalendarRange size={20} className="text-purple-600"/> 
                    Zbliżające się
                </h3>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-purple-600 transition-colors" />
            </div>
            
            <div className="flex flex-col gap-1">
                {upcomingEvents.map((event, idx) => (
                    <div key={idx} className="flex items-center p-2 border-b border-gray-50 last:border-0 hover:bg-purple-50/30 transition-colors">
                        <span className="text-gray-400 w-20 font-mono text-xs shrink-0">{event.date}</span>
                        <div className="flex-1 px-2">
                            <div className="font-semibold text-gray-700 text-sm leading-tight">{event.subject}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{event.title}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 uppercase font-bold tracking-wide border ${getEventColor(event.type)}`}>
                            {event.type}
                        </span>
                    </div>
                ))}
            </div>
        </Link>

        <Link to="/announcements" className="bg-white p-4 shadow-sm border-t-4 border-yellow-400 hover:shadow-md transition-all flex flex-col group h-fit">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle size={20} className="text-yellow-600" />
                    Ogłoszenia
                </h3>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-yellow-600 transition-colors" />
            </div>
            
            <div className="flex flex-col gap-1">
                {announcements.map((item) => (
                    <div key={item.id} className="flex items-center p-2 border-b border-gray-50 last:border-0 hover:bg-yellow-50/30 transition-colors">
                        <span className="text-gray-400 w-20 font-mono text-xs shrink-0">{item.date}</span>
                        <div className="flex-1 font-medium text-gray-700 text-sm pl-2">{item.text}</div>
                    </div>
                ))}
            </div>
        </Link>

      </div>
    </div>
  );
};

export default Dashboard;