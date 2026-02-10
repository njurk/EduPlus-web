import type { ReactNode } from 'react';
import type { LessonHour } from '../../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ScheduleGridProps {
    lessonHours: LessonHour[];
    days: string[];
    loading: boolean;
    renderCell: (dayIndex: number, hour: LessonHour) => ReactNode;
}

export const ScheduleGrid = ({ lessonHours, days, loading, renderCell }: ScheduleGridProps) => (
    <div className="bg-white border border-neutral-200 rounded-xs overflow-hidden">
        {loading ? (
            <LoadingSpinner className="h-64" />
        ) : (
            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
                <thead>
                    <tr>
                        <th className="border-b border-r border-neutral-200 bg-neutral-50 p-2 text-center font-semibold" style={{ width: '64px' }}>Nr</th>
                        {days.map((d, i) => <th key={i} className="border-b border-r border-neutral-200 bg-neutral-50 p-2 text-center font-semibold">{d}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {lessonHours.map(hour => (
                        <tr key={hour.id}>
                            <td className="border-b border-r border-neutral-200 bg-neutral-50 p-2 text-center align-middle" style={{ width: '64px' }}>
                                <div className="font-bold text-neutral-700">{hour.orderNumber}</div>
                                <div className="text-xs text-neutral-400">{String(hour.startTime).slice(0, 5)}</div>
                                <div className="text-xs text-neutral-400">{String(hour.endTime).slice(0, 5)}</div>
                            </td>
                            {days.map((_, di) => (
                                <td key={di} className="border-b border-r border-neutral-200 p-0 align-middle h-14">
                                    {renderCell(di, hour)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>
);
