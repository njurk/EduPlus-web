import { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/apiService';
import { useCMSContent } from '../../hooks/useCMSContent';
import { useSchoolYearSelector } from '../../hooks/useSchoolYearSelector';
import { getTeacherId, getExcuseStatusBadge } from '../../utils/helpers';
import { formatDateTime } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { ExportModal } from '../../components/ExportModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { FileText, MapPin, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ClassEntity, ScheduleLesson, Excuse, Announcement } from '../../types';
import { DAY_NAMES } from '../../constants/locale';

export const TeacherDashboard = () => {
    const { getText } = useCMSContent('teacherLayout');
    const teacherId = getTeacherId();
    const navigate = useNavigate();

    const {
        selectedYearId,
        semesters, selectedSemesterOrder, setSelectedSemesterOrder,
        classes: allClasses
    } = useSchoolYearSelector({ withClasses: true });

    const user = useMemo(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    }, []);

    const isHomeroomTeacher = user?.isHomeroomTeacher === true;

    const homeroomClass = useMemo(() =>
        allClasses.find((c: ClassEntity) => c.homeroomTeacherId === teacherId) ?? null,
        [allClasses, teacherId]);

    const [todayLessons, setTodayLessons] = useState<ScheduleLesson[]>([]);
    const [pendingExcuses, setPendingExcuses] = useState<Excuse[]>([]);
    const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [exportOpen, setExportOpen] = useState(false);

    useEffect(() => {
        if (!teacherId) return;
        const load = async () => {
            try {
                const [schedule, excuses, announcements] = await Promise.all([
                    api.schedule.getTeacherSchedule(teacherId),
                    api.excuses.getAll({ teacherId, statusFilter: 'pending', pageSize: 5, sortDesc: true }),
                    api.announcements.getAll({ pageSize: 5, sortBy: 'createdAt', sortDesc: true })
                ]);
                const today = new Date().getDay();
                setTodayLessons(
                    schedule
                        .filter(l => l.dayOfWeek === today)
                        .sort((a, b) => a.orderNumber - b.orderNumber)
                );
                setPendingExcuses(excuses.data || []);
                setRecentAnnouncements(announcements.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [teacherId]);

    const todayName = DAY_NAMES[new Date().getDay()] || 'Dziś';

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title.dashboard')}</h1>
            </div>

            {isHomeroomTeacher && homeroomClass && (
                <div className="bg-white border border-neutral-300 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users size={18} className="text-primary" />
                        <p className="text-sm text-neutral-500">Jesteś wychowawcą klasy <span className="font-semibold text-neutral-800">{homeroomClass.level}{homeroomClass.letter}</span></p>
                    </div>
                    <Button variant="secondary" className="text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => setExportOpen(true)}>
                        <FileText size={14} className="mr-1.5" /> Generuj raport...
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {isHomeroomTeacher && homeroomClass && (
                        <div className="bg-white border border-neutral-300 p-4">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-100">
                                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Oczekujące usprawiedliwienia</h3>
                                <button onClick={() => navigate('/teacher/excuses')} className="text-xs font-medium text-primary hover:text-primary-hover hover:underline">Wszystkie</button>
                            </div>
                            <div className="divide-y divide-neutral-100">
                                {pendingExcuses.length === 0 && <p className="text-sm text-neutral-400 py-4 text-center">Brak oczekujących</p>}
                                {pendingExcuses.map(excuse => (
                                    <button key={excuse.id} onClick={() => navigate(`/teacher/excuses?id=${excuse.id}`)} className="w-full text-left flex items-center justify-between py-2 hover:bg-neutral-50 px-2 -mx-2 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-xs text-neutral-400 whitespace-nowrap">{formatDateTime(excuse.createdAt)}</span>
                                            <span className="text-sm font-medium text-neutral-800 truncate">{excuse.studentName}</span>
                                        </div>
                                        {getExcuseStatusBadge(excuse.isAccepted)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-neutral-300 p-4">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-100">
                            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Ostatnie ogłoszenia</h3>
                            <button onClick={() => navigate('/teacher/announcements')} className="text-xs font-medium text-primary hover:text-primary-hover hover:underline">Wszystkie</button>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {recentAnnouncements.length === 0 && <p className="text-sm text-neutral-400 py-4 text-center">Brak ogłoszeń</p>}
                            {recentAnnouncements.map(a => (
                                <button key={a.id} onClick={() => navigate(`/teacher/announcements?id=${a.id}`)} className="w-full text-left flex items-center justify-between py-2 hover:bg-neutral-50 px-2 -mx-2 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-xs text-neutral-400 whitespace-nowrap">{formatDateTime(a.createdAt)}</span>
                                        <span className="text-sm font-medium text-neutral-800 truncate">{a.title}</span>
                                    </div>
                                    <Badge variant="new" show={!a.isRead} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-neutral-300 p-4 h-fit">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-100">
                            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Dzisiejsze lekcje ({todayName})</h3>
                            <button onClick={() => navigate('/teacher/schedule')} className="text-xs font-medium text-primary hover:text-primary-hover hover:underline">Pełny plan</button>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {todayLessons.length === 0 && (
                                <p className="text-sm text-neutral-400 py-4 text-center">Brak lekcji na dziś</p>
                            )}
                            {todayLessons.map(lesson => (
                                <div key={`${lesson.dayOfWeek}-${lesson.orderNumber}`} className="flex items-center py-1.5">
                                    <div className="flex flex-col items-center w-12 shrink-0 border-r border-neutral-100 mr-2 pr-2">
                                        <span className="text-lg font-bold text-primary">{lesson.orderNumber}</span>
                                        <span className="text-xs text-neutral-400">{lesson.startTime}</span>
                                        <span className="text-xs text-neutral-400">{lesson.endTime}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-neutral-800 truncate">{lesson.subjectName}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                                                Klasa {lesson.className}
                                            </span>
                                            {lesson.classroomName && (
                                                <span className="flex items-center gap-1 text-xs text-neutral-500">
                                                    <MapPin size={11} /> {lesson.classroomName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-neutral-300 p-4 h-fit">
                        <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide mb-3">Szybkie akcje</h3>
                        <div className="flex flex-col gap-2">
                            <Button variant="secondary" className="justify-start text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => navigate('/teacher/announcements?new=true')}>
                                <Plus size={16} className="mr-2" /> Dodaj ogłoszenie
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <ExportModal
                isOpen={exportOpen}
                onClose={() => setExportOpen(false)}
                fixedClassId={homeroomClass?.id}
                semesters={semesters}
                selectedSemesterOrder={selectedSemesterOrder}
                setSelectedSemesterOrder={setSelectedSemesterOrder}
                selectedYearId={selectedYearId}
            />
        </div>
    );
};
