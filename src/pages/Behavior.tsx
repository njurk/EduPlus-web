import React from 'react';
import { Smile, Frown, Award, User, Calendar } from 'lucide-react';

interface BehaviorNote {
  id: number;
  teacher: string;
  description: string;
  points: number;
  createdAt: string;
  isPositive: boolean;
  type: string;
}

interface GradeRange {
  id: number;
  gradeName: string;
  minPoints: number;
  maxPoints: number;
}

const Behavior: React.FC = () => {
  const ranges: GradeRange[] = [
    { id: 1, gradeName: 'Wzorowe', minPoints: 40, maxPoints: 50 },
    { id: 2, gradeName: 'Bardzo dobre', minPoints: 20, maxPoints: 39 },
    { id: 3, gradeName: 'Dobre', minPoints: 0, maxPoints: 19 },
    { id: 4, gradeName: 'Poprawne', minPoints: -9, maxPoints: -1 },
    { id: 5, gradeName: 'Nieodpowiednie', minPoints: -19, maxPoints: -10 },
    { id: 6, gradeName: 'Naganne', minPoints: -50, maxPoints: -20 },
  ];

  const notes: BehaviorNote[] = [
    { id: 1, teacher: 'Nauczyciel', description: 'Lorem ipsum dolor sit amet', points: 4, createdAt: '20.11.2023', isPositive: true, type: 'Aktywność' },
    { id: 2, teacher: 'Nauczyciel', description: 'Lorem ipsum dolor sit amet', points: -2, createdAt: '18.11.2023', isPositive: false, type: 'Spóźnienie' },
    { id: 3, teacher: 'Nauczyciel', description: 'Lorem ipsum dolor sit amet', points: 10, createdAt: '10.11.2023', isPositive: true, type: 'Konkurs' },
    { id: 4, teacher: 'Nauczyciel', description: 'Lorem ipsum dolor sit amet', points: -3, createdAt: '05.11.2023', isPositive: false, type: 'Regulamin' },
    { id: 5, teacher: 'Nauczyciel', description: 'Lorem ipsum dolor sit amet', points: 2, createdAt: '02.11.2023', isPositive: true, type: 'Przygotowanie' },
  ];

  const totalPoints = notes.reduce((sum, note) => sum + note.points, 0);

  const currentGrade = ranges.find(r => totalPoints >= r.minPoints && totalPoints <= r.maxPoints) || { gradeName: 'Nieustalona' };

  const getPointsColor = (points: number) => {
    if (points > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (points < 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="space-y-4">
      
      <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${totalPoints >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {totalPoints >= 0 ? <Smile size={28} /> : <Frown size={28} />}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Zachowanie</h1>
                </div>
            </div>

            <div className="hidden sm:block h-10 w-px bg-gray-200"></div>

            <div className="text-center sm:text-left">
                <span className="block text-xs text-gray-500 font-medium uppercase tracking-wide">Suma punktów</span>
                <span className={`text-3xl font-bold ${totalPoints > 0 ? 'text-green-700' : (totalPoints < 0 ? 'text-red-700' : 'text-gray-800')}`}>
                    {totalPoints}
                </span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <div className="lg:col-span-2 bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
                {notes.map((note) => (
                    <div key={note.id} className={`p-4 flex flex-col sm:flex-row gap-4 hover:bg-gray-50 transition-colors border-l-4 ${note.isPositive ? 'border-l-green-500' : 'border-l-red-500'}`}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${note.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {note.type}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center">
                                    <Calendar size={12} className="mr-1" /> {note.createdAt}
                                </span>
                            </div>
                            <p className="text-gray-800 font-medium">{note.description}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <User size={12} />
                                {note.teacher}
                            </div>
                        </div>
                        <div className="flex items-center justify-end sm:justify-center">
                            <span className={`text-lg font-bold px-3 py-1 rounded-sm border ${getPointsColor(note.points)}`}>
                                {note.points > 0 ? `+${note.points}` : note.points}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-sm shadow-sm border border-gray-200 h-fit">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Award size={18} className="text-gray-600" />
                <h3 className="font-bold text-gray-700">Skala ocen</h3>
            </div>
            <div className="p-4">
                <div className="space-y-3">
                    {ranges.map((range) => {
                        const isActive = totalPoints >= range.minPoints && totalPoints <= range.maxPoints;
                        return (
                            <div key={range.id} className={`flex justify-between items-center text-sm p-2 rounded-sm ${isActive ? 'bg-green-50 border border-green-200' : ''}`}>
                                <span className={`font-medium ${isActive ? 'text-green-800' : 'text-gray-600'}`}>
                                    {range.gradeName}
                                </span>
                                <span className={`font-mono text-xs ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                    {range.minPoints} do {range.maxPoints > 1000 ? '∞' : range.maxPoints} pkt
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Behavior;