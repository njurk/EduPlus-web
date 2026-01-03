import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface MonthSelectorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ currentDate, onDateChange, className = '' }) => {
  const monthNames = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => onDateChange(new Date(year, month - 1, 1));
  const nextMonth = () => onDateChange(new Date(year, month + 1, 1));
  const goToCurrentMonth = () => onDateChange(new Date());

  return (
    <div className={`flex flex-row items-center gap-4 ${className}`}>
      <div className="flex items-center gap-1">
        <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-sm text-gray-600 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center min-w-[140px]">
          <h2 className="text-lg font-bold text-gray-800">{monthNames[month]} {year}</h2>
        </div>
        <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-sm text-gray-600 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>

      <button 
        onClick={goToCurrentMonth}
        className="hidden sm:flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-sm hover:bg-gray-50 transition-colors"
      >
        <CalendarIcon size={14} className="mr-2" />
        Dzisiaj
      </button>
    </div>
  );
};

export default MonthSelector;