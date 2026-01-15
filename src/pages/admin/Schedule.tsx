import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import type { SchoolYear, SemesterDto, ClassEntity, ScheduleLesson, LessonHour } from '../../types';
import { RefreshCcw } from 'lucide-react';
import { ExportButton } from '../../components/ui/ExportButton';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { ClassSelector } from '../../components/ui/ClassSelector';

const getWeekRange = () => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return { monday, friday };
};

export const Schedule = () => {
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [selectedSemesterOrder, setSelectedSemesterOrder] = useState<number | null>(null);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [schedule, setSchedule] = useState<ScheduleLesson[]>([]);
    const [lessonHours, setLessonHours] = useState<LessonHour[]>([]);
    const [loading, setLoading] = useState(false);

    const weekRange = getWeekRange();

    useEffect(() => {
        const loadInitial = async () => {
            const [yearsData, hoursData] = await Promise.all([
                api.schoolYears.getAll(),
                api.lessonHours ? api.lessonHours.getAll() : Promise.resolve([])
            ]);
            setYears(yearsData);
            const active = yearsData.find(y => y.isActive);
            if (active) setSelectedYearId(active.id);
            else if (yearsData.length > 0) setSelectedYearId(yearsData[0].id);
            setLessonHours(hoursData.sort((a, b) => a.orderNumber - b.orderNumber));
        };
        loadInitial();
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;
        Promise.all([
            api.classManagement.getSemesters(selectedYearId),
            api.classManagement.getClassesByYear(selectedYearId)
        ]).then(([sem, cls]) => {
            setSemesters(sem);
            setClasses(cls);
            if (sem.length > 0) setSelectedSemesterOrder(sem[0].order);
            if (cls.length > 0) setSelectedClassId(cls[0].id);
            else setSelectedClassId(null);
        });
    }, [selectedYearId]);

    useEffect(() => {
        if (selectedClassId) {
            setLoading(true);
            const from = weekRange.monday.toISOString().split('T')[0];
            const to = weekRange.friday.toISOString().split('T')[0];
            api.schedule.getClassSchedule(selectedClassId, from, to)
                .then(setSchedule)
                .finally(() => setLoading(false));
        }
    }, [selectedClassId]);

    const getLesson = (dayIndex: number, order: number) => {
        const dayDate = new Date(weekRange.monday);
        dayDate.setDate(weekRange.monday.getDate() + dayIndex);
        const dateStr = dayDate.toISOString().split('T')[0];
        return schedule.find(l => l.orderNumber === order && l.date.startsWith(dateStr));
    };

    const days = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt'];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-neutral-800">Plan lekcji</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={selectedYearId} onChange={id => { setSelectedYearId(id); setSelectedSemesterOrder(null); setSelectedClassId(null); }} />
                    <SemesterSelector semesters={semesters} selectedOrder={selectedSemesterOrder} onChange={setSelectedSemesterOrder} showAll />
                    <ClassSelector classes={classes} selectedClass={selectedClassId} onChange={v => v && setSelectedClassId(v)} />
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
                    <div className="flex items-center justify-center h-64 text-neutral-400"><RefreshCcw className="animate-spin mr-2" size={16} />Ładowanie...</div>
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
                                    </td>
                                    {days.map((_, di) => {
                                        const lesson = getLesson(di, hour.orderNumber);
                                        return (
                                            <td key={di} className="border-b border-r border-neutral-200 p-2 align-middle h-14">
                                                {lesson ? (
                                                    <div className="border-l-2 border-primary pl-2">
                                                        <div className="font-medium text-neutral-900 truncate">{lesson.subjectName}</div>
                                                        <div className="text-neutral-500 truncate">{lesson.teacherName}</div>
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
