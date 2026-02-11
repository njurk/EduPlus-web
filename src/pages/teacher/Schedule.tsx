import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import type { ScheduleLesson, LessonHour } from '../../types';
import { getTeacherId } from '../../utils/helpers';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { useCMSContent } from '../../hooks/useCMSContent';
import { useSchoolYearSelector } from '../../hooks/useSchoolYearSelector';
import { ScheduleGrid } from '../../components/ui/ScheduleGrid';


export const TeacherSchedule = () => {
    const { getText } = useCMSContent('teacherLayout');
    const {
        years, selectedYearId, setSelectedYearId,
        semesters, selectedSemesterOrder, setSelectedSemesterOrder
    } = useSchoolYearSelector({ withCurrentSemester: true });

    const [schedule, setSchedule] = useState<ScheduleLesson[]>([]);
    const [lessonHours, setLessonHours] = useState<LessonHour[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.lessonHours.getAll().then(setLessonHours);
    }, []);

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
