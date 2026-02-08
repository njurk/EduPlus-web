import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import type { SchoolYear, SemesterDto, ScheduleLesson, LessonHour } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';

const getTeacherId = (): number => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || 0;
};

export const TeacherSchedule = () => {
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [selectedSemesterOrder, setSelectedSemesterOrder] = useState<number | null>(null);
    const [schedule, setSchedule] = useState<ScheduleLesson[]>([]);
    const [lessonHours, setLessonHours] = useState<LessonHour[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadInitial = async () => {
            const [yearsData, hoursData] = await Promise.all([
                api.schoolYears.getAll(),
                api.lessonHours.getAll()
            ]);
            setYears(yearsData);
            const today = new Date().toISOString().split('T')[0];
            const current = yearsData.find(y => y.startDate <= today && y.endDate >= today) || yearsData.find(y => y.isActive) || yearsData[0];
            if (current) setSelectedYearId(current.id);
            setLessonHours(hoursData);
        };
        loadInitial();
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;
        Promise.all([
            api.classManagement.getSemesters(selectedYearId),
            api.grades.getCurrentSemester(selectedYearId).catch(() => 1)
        ]).then(([sem, currentSem]) => {
            setSemesters(sem);
            const semToSelect = sem.find(s => s.order === currentSem) || sem[0];
            if (semToSelect) setSelectedSemesterOrder(semToSelect.order);
        });
    }, [selectedYearId]);

    useEffect(() => {
        const loadSchedule = async () => {
            const teacherId = getTeacherId();
            if (!teacherId || !selectedSemesterOrder) return;
            const semester = semesters.find(s => s.order === selectedSemesterOrder);
            if (!semester) return;
            setLoading(true);
            try {
                const data = await api.schedule.getTeacherSchedule(teacherId, semester.id);
                setSchedule(data);
            } finally {
                setLoading(false);
            }
        };
        setSchedule([]);
        loadSchedule();
    }, [selectedSemesterOrder, semesters]);

    const getLesson = (dayIndex: number, order: number) => {
        const dayOfWeek = dayIndex + 1;
        return schedule.find(l => l.orderNumber === order && l.dayOfWeek === dayOfWeek);
    };

    const days = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">Mój plan lekcji</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={selectedYearId} onChange={id => { setSelectedYearId(id); setSelectedSemesterOrder(null); }} />
                    <SemesterSelector semesters={semesters} selectedOrder={selectedSemesterOrder} onChange={setSelectedSemesterOrder} />
                </div>
            </div>

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
                                    {days.map((_, di) => {
                                        const lesson = getLesson(di, hour.orderNumber);
                                        return (
                                            <td key={di} className="border-b border-r border-neutral-200 p-2 align-middle h-14">
                                                {lesson ? (
                                                    <div className="pl-1">
                                                        <div className="font-medium text-neutral-900 truncate">{lesson.subjectName}</div>
                                                        <div className="text-xs text-neutral-500 truncate">{lesson.className}</div>
                                                        {lesson.classroomName && <div className="text-xs text-neutral-400 truncate">{lesson.classroomName}</div>}
                                                    </div>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
