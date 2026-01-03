import React, { useState } from 'react';
import { ChevronDown, X, Info, GraduationCap } from 'lucide-react';

interface Grade {
  id: number;
  value: number;
  weight: number;
  desc: string;
  date: string;
  teacher: string;
  category: string;
}

interface Subject {
  name: string;
  grades: Grade[];
  average: number;
}

const Grades: React.FC = () => {
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  const subjects: Subject[] = [
    {
      name: 'Matematyka',
      grades: [
        { id: 1, value: 5, weight: 3, desc: 'Sprawdzian - Funkcje', date: '2023-10-10', teacher: 'A. Nowak', category: 'Sprawdzian' },
        { id: 2, value: 4, weight: 2, desc: 'Kartkówka', date: '2023-10-15', teacher: 'A. Nowak', category: 'Kartkówka' },
      ],
      average: 4.60
    },
    {
      name: 'Język Polski',
      grades: [
        { id: 3, value: 3, weight: 3, desc: 'Rozprawka', date: '2023-10-12', teacher: 'B. Kowalska', category: 'Praca klasowa' },
        { id: 4, value: 5, weight: 1, desc: 'Aktywność', date: '2023-10-20', teacher: 'B. Kowalska', category: 'Aktywność' },
        { id: 5, value: 4, weight: 2, desc: 'Odpowiedź ustna', date: '2023-11-05', teacher: 'B. Kowalska', category: 'Odpowiedź' },
      ],
      average: 3.83
    }
  ];

  const getGradeColor = (val: number) => {
    if (val >= 5) return 'bg-green-100 text-green-700 border-green-200';
    if (val >= 3) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-full text-green-600">
                    <GraduationCap size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Oceny</h1>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                  <select 
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full sm:w-auto bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 cursor-pointer appearance-none"
                  >
                    <option value="1">Semestr 1</option>
                    <option value="2">Semestr 2</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
        </div>
      </div>

      <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wide">
              <th className="p-3 w-1/4">Przedmiot</th>
              <th className="p-3">Oceny cząstkowe</th>
              <th className="p-3 w-24 text-center">Średnia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subjects.map((sub, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 font-medium text-gray-800">{sub.name}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {sub.grades.map((grade) => (
                      <button
                        key={grade.id}
                        onClick={() => setSelectedGrade(grade)}
                        className={`w-8 h-8 flex items-center justify-center rounded-sm text-sm font-bold border ${getGradeColor(grade.value)} hover:brightness-95 transition-all`}
                      >
                        {grade.value}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span className={`font-bold ${sub.average >= 4.75 ? 'text-green-600' : 'text-gray-800'}`}>
                    {sub.average.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center">
              <h3 className="font-bold text-green-800 flex items-center">
                <Info size={18} className="mr-2" />
                Szczegóły oceny
              </h3>
              <button onClick={() => setSelectedGrade(null)} className="text-green-800 hover:bg-green-100 p-1 rounded-sm">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Wartość</span>
                <span className={`text-2xl font-bold px-3 py-1 rounded-sm border ${getGradeColor(selectedGrade.value)}`}>
                  {selectedGrade.value}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Waga</p>
                  <p className="font-medium">{selectedGrade.weight}</p>
                </div>
                <div>
                  <p className="text-gray-500">Kategoria</p>
                  <p className="font-medium">{selectedGrade.category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Data</p>
                  <p className="font-medium">{selectedGrade.date}</p>
                </div>
                <div>
                  <p className="text-gray-500">Nauczyciel</p>
                  <p className="font-medium">{selectedGrade.teacher}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-gray-500 text-xs mb-1">Opis</p>
                <p className="text-gray-800 italic">{selectedGrade.desc}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;