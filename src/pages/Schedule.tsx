import { List } from 'lucide-react';
import React, { useState } from 'react';

const Schedule: React.FC = () => {
  const contextData = {
    semester: "Semestr 1",
    className: "3A",
    schoolYear: "2023/2024",
    publishDate: "20.11.2025"
  };

  const hours = [
    "08:00 - 08:45", "08:55 - 09:40", "09:50 - 10:35", 
    "10:45 - 11:30", "11:45 - 12:30", "12:40 - 13:25", 
    "13:35 - 14:20", "14:25 - 15:10"
  ];

  const scheduleData: Record<number, Record<number, { subject: string, teacher: string, room: string }>> = {
    0: {
        0: { subject: "Matematyka", teacher: "Jan Nowak", room: "102" },
        1: { subject: "Matematyka", teacher: "Jan Nowak", room: "102" },
        2: { subject: "J. Polski", teacher: "Anna Kowalska", room: "204" },
        3: { subject: "Historia", teacher: "Piotr Wiśniewski", room: "105" },
    },
    1: {
        0: { subject: "Fizyka", teacher: "Aleksandra Nowak", room: "301" },
        1: { subject: "WF", teacher: "Michał Kowalczyk", room: "Hala" },
        2: { subject: "J. Angielski", teacher: "Ewa Wiśniewska", room: "110" },
        4: { subject: "Informatyka", teacher: "Tomasz Zieliński", room: "002" },
    },
  };

  const days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 justify-between rounded-sm shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-full text-green-600">
                    <List size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Plan lekcji</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-400 uppercase text-xs tracking-wider">Klasa</span>
                    <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded-sm">{contextData.className}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-400 uppercase text-xs tracking-wider">Rok/Semestr</span>
                    <span className="font-medium">{contextData.schoolYear}, {contextData.semester}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-400 uppercase text-xs tracking-wider">Zaktualizowano</span>
                    <span className="font-medium">{contextData.publishDate}</span>
                </div>
            </div>
        </div>

      <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
            <thead>
                <tr>
                    <th className="p-4 border-b border-r border-gray-200 bg-gray-50 text-center text-xs uppercase text-gray-500 font-semibold w-12">
                        Nr
                    </th>
                    <th className="p-4 border-b border-r border-gray-200 bg-gray-50 text-center text-xs uppercase text-gray-500 font-semibold w-32 whitespace-nowrap">
                        Godzina
                    </th>
                    {days.map(day => (
                        <th key={day} className="p-4 border-b border-gray-200 bg-gray-50 text-center text-xs uppercase text-gray-500 font-semibold w-1/5">
                            {day}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {hours.map((hour, hourIdx) => (
                    <tr key={hourIdx} className="even:bg-gray-50">
                        <td className="p-3 border-r border-b border-gray-100 text-gray-400 font-bold text-center text-sm">
                            {hourIdx + 1}
                        </td>
                        <td className="p-3 border-r border-b border-gray-100 text-gray-600 font-mono text-xs font-medium text-center whitespace-nowrap">
                            {hour}
                        </td>
                        {days.map((_, dayIdx) => {
                            const lesson = scheduleData[dayIdx]?.[hourIdx];
                            return (
                                <td key={dayIdx} className="p-2 border-b border-gray-100 text-center h-16">
                                    {lesson ? (
                                        <div className="flex flex-col items-center justify-center h-full p-1 rounded-sm cursor-default">
                                            <span className="text-sm font-bold leading-tight">{lesson.subject}</span>
                                            <span className="text-xs mt-0.5">{lesson.teacher}</span>
                                            <span className="text-[12px] mt-0.5 font-mono">{lesson.room}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 text-lg mx-auto block">-</span>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Schedule;