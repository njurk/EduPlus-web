import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import type { SchoolYear, SemesterDto, ClassEntity, ScheduleLesson, LessonHour } from '../../types';
import { RefreshCcw } from 'lucide-react';
import { ExportButton } from '../../components/ui/ExportButton';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { ClassSelector } from '../../components/ui/ClassSelector';
import { useCMSContent } from '../../hooks/useCMSContent';



export const Schedule = () => {
    const { getText } = useCMSContent('schedule');
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [selectedSemesterOrder, setSelectedSemesterOrder] = useState<number | null>(null);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [schedule, setSchedule] = useState<ScheduleLesson[]>([]);
    const [lessonHours, setLessonHours] = useState<LessonHour[]>([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const loadInitial = async () => {
            const [yearsData, hoursData] = await Promise.all([
                api.schoolYears.getAll(),
                api.lessonHours ? api.lessonHours.getAll() : Promise.resolve([])
            ]);
            setYears(yearsData);
            const today = new Date().toISOString().split('T')[0];
            const current = yearsData.find(y => y.startDate <= today && y.endDate >= today) || yearsData.find(y => y.isActive) || yearsData[0];
            if (current) setSelectedYearId(current.id);
            setLessonHours(hoursData.sort((a, b) => a.orderNumber - b.orderNumber));
        };
        loadInitial();
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;
        Promise.all([
            api.classManagement.getSemesters(selectedYearId),
            api.classManagement.getClassesByYear(selectedYearId),
            api.grades.getCurrentSemester(selectedYearId).catch(() => 1)
        ]).then(([sem, cls, currentSem]) => {
            setSemesters(sem);
            setClasses(cls.filter(c => c.isActive));

            const semToSelect = sem.find(s => s.order === currentSem) || sem[0];
            if (semToSelect) setSelectedSemesterOrder(semToSelect.order);
            else if (sem.length > 0) setSelectedSemesterOrder(sem[0].order);

            setSelectedClassId(null);
        });
    }, [selectedYearId]);

    useEffect(() => {
        setSchedule([]);
        if (!selectedClassId || !selectedSemesterOrder) return;

        const semester = semesters.find(s => s.order === selectedSemesterOrder);
        if (!semester) return;

        setLoading(true);
        api.schedule.getClassSchedule(selectedClassId, semester.id)
            .then(setSchedule)
            .finally(() => setLoading(false));
    }, [selectedClassId, selectedSemesterOrder, semesters]);

    const getLesson = (dayIndex: number, order: number) => {
        const dayOfWeek = dayIndex + 1;
        return schedule.find(l => l.orderNumber === order && l.dayOfWeek === dayOfWeek);
    };

    const days = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={selectedYearId} onChange={id => { setSelectedYearId(id); setSelectedSemesterOrder(null); setSelectedClassId(null); }} />
                    <SemesterSelector semesters={semesters} selectedOrder={selectedSemesterOrder} onChange={setSelectedSemesterOrder} />
                    <ClassSelector classes={classes} selectedClass={selectedClassId} onChange={setSelectedClassId} showAll />
                    <ExportButton disabled={!selectedClassId} onExport={(format) => {
                        if (!selectedClassId) return;
                        if (format === 'pdf') api.export.downloadSchedulePdf(selectedClassId, selectedYearId || undefined);
                        else if (format === 'xlsx') api.export.downloadScheduleXlsx(selectedClassId, selectedYearId || undefined);
                        else api.export.downloadScheduleCsv(selectedClassId, selectedYearId || undefined);
                    }} />
                </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xs overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-neutral-400"><RefreshCcw className="animate-spin mr-2" size={16} />{'Ładowanie...'}</div>
                ) : (
                    <table className="w-full border-collapse text-xs table-fixed">
                        <thead>
                            <tr>
                                <th className="border-b border-r border-neutral-200 bg-neutral-50 p-2 w-16 text-center font-semibold">Nr</th>
                                {days.map(d => <th key={d} className="border-b border-r border-neutral-200 bg-neutral-50 p-2 text-center font-semibold" style={{ width: 'calc((100% - 64px) / 5)' }}>{d}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {lessonHours.map(hour => (
                                <tr key={hour.id}>
                                    <td className="border-b border-r border-neutral-200 bg-neutral-50 p-2 text-center align-middle">
                                        <div className="font-bold text-neutral-700">{hour.orderNumber}</div>
                                        <div className="text-[10px] text-neutral-400">{String(hour.startTime).slice(0, 5)}</div>
                                        <div className="text-[10px] text-neutral-400">{String(hour.endTime).slice(0, 5)}</div>
                                    </td>
                                    {days.map((_, di) => {
                                        const lesson = getLesson(di, hour.orderNumber);
                                        return (
                                            <td key={di} className="border-b border-r border-neutral-200 p-2 align-middle h-14">
                                                {lesson ? (
                                                    <div className="pl-1">
                                                        <div className="font-medium text-neutral-900 truncate">{lesson.subjectName}</div>
                                                        {lesson.classroomName && <div className="text-[10px] text-neutral-400 truncate">{lesson.classroomName}</div>}
                                                        <div className="text-neutral-500 truncate text-[11px]">{lesson.teacherName}</div>
                                                    </div>
                                                ) : <div className="text-center text-neutral-300">-</div>}
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
