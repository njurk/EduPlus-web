import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import type { ScheduleLesson, LessonHour } from '../../types';
import { getTeacherId } from '../../utils/helpers';
import { useCMSContent } from '../../hooks/useCMSContent';
import { useSchoolYearSelector } from '../../hooks/useSchoolYearSelector';
import { ScheduleGrid } from '../../components/ui/ScheduleGrid';
import { ExportButton } from '../../components/ui/ExportButton';


export const TeacherSchedule = () => {
    const { getText } = useCMSContent('schedule');
    const { getText: getTeacherText } = useCMSContent('teacherLayout');
    const { semesters, selectedSemesterOrder } = useSchoolYearSelector({ withCurrentSemester: true });

    const [schedule, setSchedule] = useState<ScheduleLesson[]>([]);
    const [lessonHours, setLessonHours] = useState<LessonHour[]>([]);
    const [loading, setLoading] = useState(false);

    const teacherId = getTeacherId();
    const semester = semesters.find(s => s.order === selectedSemesterOrder);

    useEffect(() => {
        api.lessonHours.getAll().then(setLessonHours);
    }, []);

    useEffect(() => {
        const loadSchedule = async () => {
            if (!teacherId || !semester) return;
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

    const days = [getText('days.monday'), getText('days.tuesday'), getText('days.wednesday'), getText('days.thursday'), getText('days.friday')];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getTeacherText('title.schedule')}</h1>
                <ExportButton disabled={!semester} onExport={(format) => {
                    if (!teacherId || !semester) return;
                    api.export.downloadTeacherSchedule({ teacherId, semesterId: semester.id, format });
                }} />
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
