import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Clock, Mail, Bell, ChevronDown } from 'lucide-react';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  isRead: boolean;
  priority: 'normal' | 'high';
}

export const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Wpłaty na radę rodziców - przypomnienie o terminach",
    content: "Szanowni Państwo, przypominamy o konieczności uiszczenia wpłaty na radę rodziców do końca bieżącego miesiąca. Zebrane środki zostaną przeznaczone na organizację imprez szkolnych oraz doposażenie świetlicy. Numer konta znajduje się w zakładce Kontakt.",
    author: "Sekretariat",
    date: "27.11.2023 09:30",
    isRead: false,
    priority: 'high'
  },
  {
    id: 2,
    title: "Zmiana sali z matematyki w dniu 28.11",
    content: "Zajęcia z matematyki w dniu jutrzejszym (wtorek) zostają przeniesione z sali 204 do sali 102 z powodu awarii rzutnika.",
    author: "J. Nowak",
    date: "26.11.2023 14:15",
    isRead: true,
    priority: 'normal'
  },
  {
    id: 3,
    title: "Konkurs recytatorski - etap szkolny",
    content: "Zapraszamy wszystkich chętnych uczniów klas 1-3 do udziału w szkolnym etapie konkursu recytatorskiego. Tematem przewodnim jest 'Zima w poezji'. Zgłoszenia przyjmuje Pani od języka polskiego do najbliższego piątku.",
    author: "B. Kowalska",
    date: "25.11.2023 10:00",
    isRead: true,
    priority: 'normal'
  }
];

const Announcements: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredAnnouncements = mockAnnouncements.filter(item => {
    if (filter === 'unread') return !item.isRead;
    if (filter === 'read') return item.isRead;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-full text-green-600">
                    <Bell size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Ogłoszenia</h1>
            </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full sm:w-auto bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 cursor-pointer appearance-none"
                >
                  <option value="all">Wszystkie</option>
                  <option value="unread">Nieprzeczytane</option>
                  <option value="read">Przeczytane</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((item) => (
            <Link 
              to={`/announcements/${item.id}`}
              key={item.id} 
              className={`group bg-white p-4 rounded-sm shadow-sm border-l-4 ${!item.isRead ? 'border-green-600' : 'border-gray-300'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                 <div className={`shrink-0 ${!item.isRead ? 'text-green-600' : 'text-gray-400'}`}>
                    <Mail size={20} />
                 </div>
                 
                 <div className="min-w-0">
                    <h3 className={`text-base truncate ${!item.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                      {item.title}
                    </h3>
                 </div>

                 {!item.isRead && (
                    <span className="shrink-0 px-2 py-0.5 rounded-sm text-xs font-bold bg-green-100 text-green-800 uppercase tracking-wide">
                        Nowe
                    </span>
                 )}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0 border-t sm:border-t-0 border-gray-100 pt-2 sm:pt-0 mt-2 sm:mt-0">
                  <div className="flex items-center">
                      <User size={14} className="mr-1.5" />
                      <span className="font-medium">{item.author}</span>
                  </div>
                  <div className="w-px h-3 bg-gray-300 hidden sm:block"></div>
                  <div className="flex items-center">
                      <Clock size={14} className="mr-1.5" />
                      <span>{item.date}</span>
                  </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">Brak ogłoszeń spełniających kryteria.</div>
        )}
      </div>
    </div>
  );
};

export default Announcements;