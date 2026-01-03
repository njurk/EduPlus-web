import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import MonthSelector from '../components/MonthSelector';

type EventType = 'Sprawdzian' | 'Kartkówka' | 'Zadanie domowe' | 'Inne';

interface CalendarEvent {
  id: number;
  date: string;
  title: string;
  subject: string;
  type: EventType;
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const fmtDate = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const events: CalendarEvent[] = [
    { id: 1, date: fmtDate(5), title: 'Dział II', subject: 'Historia', type: 'Sprawdzian' },
    { id: 2, date: fmtDate(8), title: 'Słówka Unit 4', subject: 'Angielski', type: 'Kartkówka' },
    { id: 3, date: fmtDate(12), title: 'Esej', subject: 'Polski', type: 'Zadanie domowe' },
    { id: 4, date: fmtDate(15), title: 'Trygonometria', subject: 'Matematyka', type: 'Sprawdzian' },
    { id: 5, date: fmtDate(19), title: 'Mikołajki', subject: 'Wychowawcza', type: 'Inne' },
    { id: 6, date: fmtDate(19), title: 'Kartkówka z dat', subject: 'Historia', type: 'Kartkówka' },
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  const totalSlots = Math.ceil((startingDayIndex + daysInMonth) / 7) * 7;
  const daysOfWeek = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];

  const getTypeStyles = (type: EventType) => {
    switch (type) {
      case 'Sprawdzian': return 'bg-red-200 text-black-800';
      case 'Kartkówka': return 'bg-green-200 text-black-800';
      case 'Zadanie domowe': return 'bg-blue-200 text-black-800';
      default: return 'bg-yellow-200 text-black-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="p-3 bg-green-50 rounded-full text-green-600">
                <CalendarIcon size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Terminarz</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto overflow-x-auto">
             <MonthSelector 
                currentDate={currentDate} 
                onDateChange={setCurrentDate}
                className="w-full sm:w-auto" 
            />
        </div>
      </div>

      <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {daysOfWeek.map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {day}
                </div>
            ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
            {Array.from({ length: totalSlots }).map((_, i) => {
                const dayNumber = i - startingDayIndex + 1;
                const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
                const isWeekend = (i % 7 === 5) || (i % 7 === 6);
                
                if (!isCurrentMonth) {
                    return (
                        <div key={i} className="min-h-[100px] p-1 bg-gray-200 border-b border-gray-200" />
                    );
                }

                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                const dayEvents = events.filter(e => e.date === dateStr);
                const isToday = new Date().toDateString() === new Date(year, month, dayNumber).toDateString();

                let bgClass = 'bg-white';
                if (isToday) bgClass = 'bg-blue-50';
                else if (isWeekend) bgClass = 'bg-gray-100';

                return (
                    <div key={i} className={`${bgClass} min-h-[100px] p-1 flex flex-col transition-colors`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-green-700 text-white' : 'text-gray-500'}`}>
                                {dayNumber}
                            </span>
                        </div>

                        <div className="space-y-1 flex-1 overflow-hidden">
                            {dayEvents.map(event => (
                                <div 
                                    key={event.id} 
                                    className={`text-[12px] p-1 rounded-sm border mb-0.5 shadow-sm ${getTypeStyles(event.type)}`}
                                >
                                    <div className="font-bold truncate">{event.type}</div>
                                    <div className="truncate">{event.subject}</div>
                                    <div className="text-xs truncate opacity-75">{event.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;