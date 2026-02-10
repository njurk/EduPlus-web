import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import type { SchoolYear, SemesterDto, ScheduleLesson, LessonHour } from '../../types';
import { getTeacherId } from '../../utils/helpers';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { useCMSContent } from '../../hooks/useCMSContent';
import { ScheduleGrid } from '../../components/ui/ScheduleGrid';


export const TeacherSchedule = () => {
    const { getText } = useCMSContent('teacherLayout');
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
                <h1 className="text-xl font-bold text-neutral-800">{getText('title.schedule')}</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={selectedYearId} onChange={id => { setSelectedYearId(id); setSelectedSemesterOrder(null); }} />
                    <SemesterSelector semesters={semesters} selectedOrder={selectedSemesterOrder} onChange={setSelectedSemesterOrder} />
                </div>
            </div>

            <ScheduleGrid
                lessonHours={lessonHours}
                days={days}
                loading={loading}
                renderCell={(di, hour) => {
                    const lesson = getLesson(di, hour.orderNumber);
                    return lesson ? (
                        <div className="p-2 pl-3">
                            <div className="font-medium text-neutral-900 truncate">{lesson.subjectName}</div>
                            <div className="text-xs text-neutral-500 truncate">{lesson.className}</div>
                            {lesson.classroomName && <div className="text-xs text-neutral-400 truncate">{lesson.classroomName}</div>}
                        </div>
                    ) : null;
                }}
            />
        </div>
    );
};
