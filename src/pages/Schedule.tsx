import { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import type { SchoolYear, ClassEntity, ScheduleLesson, LessonHour } from '../types';
import { Button } from '../components/ui/Button';
import { RefreshCcw, ChevronLeft, ChevronRight, Calendar, User, MapPin } from 'lucide-react';
import clsx from 'clsx';

const getWeekRange = (date: Date) => {
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
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedule, setSchedule] = useState<ScheduleLesson[]>([]);
    const [lessonHours, setLessonHours] = useState<LessonHour[]>([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [yearsData, hoursData] = await Promise.all([
                    api.schoolYears.getAll(),
                    api.lessonHours ? api.lessonHours.getAll() : Promise.resolve([])
                ]);
                setYears(yearsData);
                const active = yearsData.find(y => y.isActive);
                if (active) setSelectedYearId(active.id);
                else if (yearsData.length > 0) setSelectedYearId(yearsData[0].id);

                setLessonHours(hoursData.sort((a, b) => a.orderNumber - b.orderNumber));
            } catch (e) {
                console.error(e);
            }
        };
        loadInitial();
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;
        api.classManagement.getClassesByYear(selectedYearId).then(data => {
            setClasses(data);
            if (data.length > 0) setSelectedClassId(data[0].id);
            else setSelectedClassId(null);
        });
    }, [selectedYearId]);

    useEffect(() => {
        if (selectedClassId) {
            setLoading(true);
            const { monday, friday } = getWeekRange(currentDate);
            const from = monday.toISOString().split('T')[0];
            const to = friday.toISOString().split('T')[0];

            api.schedule.getClassSchedule(selectedClassId, from, to)
                .then(setSchedule)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [selectedClassId, currentDate]);

    const changeWeek = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        setCurrentDate(newDate);
    };

    const weekRange = getWeekRange(currentDate);
    const formatDateShort = (d: Date) => d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' });

    const getLesson = (dayIndex: number, order: number) => {
        const dayDate = new Date(weekRange.monday);
        dayDate.setDate(weekRange.monday.getDate() + dayIndex);
        const dateStr = dayDate.toISOString().split('T')[0];

        return schedule.find(l => l.orderNumber === order && l.date.startsWith(dateStr));
    };

    const days = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];

    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans flex flex-col h-[calc(100vh-100px)] rounded-lg overflow-hidden">
            <div className="border-b px-6 py-4 bg-neutral-50/30 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">Plan Lekcji</h2>
                    <p className="text-sm text-neutral-500">Przeglądaj plan zajęć dla klas</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="p-2 border rounded text-sm min-w-[150px]"
                        value={selectedYearId || ''}
                        onChange={e => setSelectedYearId(Number(e.target.value))}
                    >
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                    <select
                        className="p-2 border rounded text-sm min-w-[100px]"
                        value={selectedClassId || ''}
                        onChange={e => setSelectedClassId(Number(e.target.value))}
                    >
                        {classes.map(c => <option key={c.id} value={c.id}>Klasa {c.level}{c.letter}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => changeWeek(-1)} className="p-2"><ChevronLeft size={20} /></Button>
                    <div className="flex items-center gap-2 font-medium text-lg">
                        <Calendar size={20} className="text-neutral-500" />
                        {weekRange.monday.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })} - {weekRange.friday.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <Button variant="secondary" onClick={() => changeWeek(1)} className="p-2"><ChevronRight size={20} /></Button>
                </div>
                <Button variant="ghost" onClick={() => setCurrentDate(new Date())} className="text-primary text-sm">
                    Dzisiaj
                </Button>
            </div>

            <div className="flex-1 overflow-auto bg-neutral-100 p-4">
                {loading && <div className="text-center p-4"><RefreshCcw className="animate-spin inline" /> Ładowanie planu...</div>}

                <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] gap-px bg-neutral-200 border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-neutral-50 p-2 font-bold text-xs text-neutral-500 text-center flex items-center justify-center">Godz</div>
                    {days.map((day, i) => {
                        const d = new Date(weekRange.monday);
                        d.setDate(d.getDate() + i);
                        const isToday = d.toDateString() === new Date().toDateString();
                        return (
                            <div key={day} className={clsx("bg-white p-2 text-center border-b-2", isToday ? "border-primary bg-primary-light/10" : "border-transparent")}>
                                <div className={clsx("font-bold text-sm", isToday ? "text-primary" : "text-neutral-800")}>{day}</div>
                                <div className={clsx("text-xs mt-1", isToday ? "text-primary font-medium" : "text-neutral-500")}>{formatDateShort(d)}</div>
                            </div>
                        );
                    })}

                    {lessonHours.map((hour) => (
                        <>
                            <div key={`h-${hour.id}`} className="bg-white p-2 flex flex-col items-center justify-center text-xs text-neutral-500 border-r border-neutral-100">
                                <span className="font-bold text-neutral-800">{String(hour.startTime).slice(0, 5)}</span>
                                <span className="text-[10px] mt-1 text-neutral-400">{String(hour.endTime).slice(0, 5)}</span>
                                <span className="mt-2 w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold">{hour.orderNumber}</span>
                            </div>
                            {days.map((_, dayIndex) => {
                                const lesson = getLesson(dayIndex, hour.orderNumber);
                                return (
                                    <div key={`d-${dayIndex}-h-${hour.id}`} className="bg-white p-1 min-h-[100px] relative group transition-colors hover:bg-neutral-50">
                                        {lesson ? (
                                            <div className="h-full w-full bg-primary-light/20 border-l-4 border-primary rounded p-2 flex flex-col gap-1 shadow-sm">
                                                <div className="font-bold text-sm text-neutral-900 leading-tight">{lesson.subjectName}</div>
                                                <div className="flex items-center gap-1 text-xs text-neutral-600 mt-auto">
                                                    <User size={12} /> <span className="truncate">{lesson.teacherName}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-neutral-500">
                                                    <MapPin size={12} /> {lesson.classroomName || 'Sala --'}
                                                </div>
                                                {lesson.topic && (
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-[10px] p-2 rounded max-w-[150px] z-10 pointer-events-none">
                                                        {lesson.topic}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-neutral-300 text-xs">
                                                -
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    ))}
                </div>
            </div>
        </div>
    );
};
