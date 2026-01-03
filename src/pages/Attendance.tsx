import React, { useState } from 'react';
import { CheckCircle, CheckSquare, ChevronDown, Filter } from 'lucide-react';

interface AttendanceRecord {
  id: number;
  date: string;
  lesson: number;
  subject: string;
  type: 'absent' | 'late' | 'present';
  excused: boolean;
}

const Attendance: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [filterType, setFilterType] = useState('all');

  const records: AttendanceRecord[] = [
    { id: 1, date: '2023-11-20', lesson: 1, subject: 'Matematyka', type: 'absent', excused: false },
    { id: 2, date: '2023-11-20', lesson: 2, subject: 'Fizyka', type: 'absent', excused: false },
    { id: 3, date: '2023-11-15', lesson: 4, subject: 'Wychowanie Fizyczne', type: 'late', excused: false },
    { id: 4, date: '2023-11-10', lesson: 3, subject: 'Historia', type: 'absent', excused: true },
  ];

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExcuse = () => {
    alert(`Wysłano prośbę o usprawiedliwienie dla ${selectedIds.length} wpisów.`);
    setSelectedIds([]);
  };

  const stats = {
    percentage: 92,
    unexcused: 2,
  };

  const getStatusBadge = (type: string, excused: boolean) => {
    if (excused) return <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold bg-green-100 text-green-700 border border-green-200">Usprawiedliwione</span>;
    
    switch (type) {
      case 'absent': return <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold bg-red-50 text-red-700 border border-red-200">Nieobecność</span>;
      case 'late': return <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">Spóźnienie</span>;
      case 'present': return <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold bg-green-50 text-green-700 border border-green-200">Obecność</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <CheckCircle size={28} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Frekwencja</h1>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                    <select 
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="w-full sm:w-40 bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none"
                    >
                        <option value="newest">Od najnowszych</option>
                        <option value="oldest">Od najstarszych</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative flex-1 sm:flex-initial">
                    <div className="absolute left-2 top-2.5 pointer-events-none">
                        <Filter size={14} className="text-gray-400" />
                    </div>
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full sm:w-40 bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-8 pr-8 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none"
                    >
                        <option value="all">Wszystkie</option>
                        <option value="absent">Nieobecności</option>
                        <option value="late">Spóźnienia</option>
                        <option value="present">Obecności</option>
                        <option value="excused">Usprawiedliwione</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
                </div>
            </div>

        </div>
      </div>

      <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
        {selectedIds.length > 0 && (
            <div className="bg-blue-50 p-2 border-b border-blue-100 flex justify-between items-center animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 px-2">
                    <CheckSquare size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Zaznaczono: {selectedIds.length}</span>
                </div>
                <button 
                    onClick={handleExcuse}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide rounded-sm hover:bg-blue-700 transition-colors shadow-sm"
                >
                    Usprawiedliw wybrane
                </button>
            </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wide">
              <th className="p-3 w-10 text-center">
              </th>
              <th className="p-3 w-32">Data</th>
              <th className="p-3 w-16 text-center">Lekcja</th>
              <th className="p-3">Przedmiot</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((record) => {
                const isSelected = selectedIds.includes(record.id);
                const canSelect = !record.excused && record.type !== 'present';

                return (
                  <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-3 text-center">
                      {canSelect && (
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(record.id)}
                          className="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      )}
                    </td>
                    <td className="p-3 text-sm font-mono text-gray-600">{record.date}</td>
                    <td className="p-3 text-sm text-center text-gray-500">{record.lesson}</td>
                    <td className="p-3 font-medium text-gray-800">{record.subject}</td>
                    <td className="p-3 text-right">
                        {getStatusBadge(record.type, record.excused)}
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
        
        {records.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
                Brak wpisów frekwencji.
            </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;