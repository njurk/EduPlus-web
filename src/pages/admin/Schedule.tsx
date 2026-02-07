import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import type { SchoolYear, SemesterDto, ClassEntity, ScheduleLesson, LessonHour, Subject, Classroom, User } from '../../types';
import { ExportButton } from '../../components/ui/ExportButton';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { ClassSelector } from '../../components/ui/ClassSelector';
import { useCMSContent } from '../../hooks/useCMSContent';
import { Modal } from '../../components/modals/Modal';
import { Button } from '../../components/ui/Button';
import { Edit, Trash2 } from 'lucide-react';

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
    const [editMode, setEditMode] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{
        id?: number;
        dayOfWeek: number;
        lessonHourId: number;
        subjectId: number;
        teacherId: number;
        classroomId: number;
    } | null>(null);

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [teachersLoading, setTeachersLoading] = useState(false);

    useEffect(() => {
        const loadInitial = async () => {
            const [yearsData, hoursData, subjectsData, classroomsData] = await Promise.all([
                api.schoolYears.getAll(),
                api.lessonHours ? api.lessonHours.getAll() : Promise.resolve([]),
                api.subjects.getAll(),
                api.classrooms.getAll()
            ]);
            setYears(yearsData);
            const today = new Date().toISOString().split('T')[0];
            const current = yearsData.find(y => y.startDate <= today && y.endDate >= today) || yearsData.find(y => y.isActive) || yearsData[0];
            if (current) setSelectedYearId(current.id);
            setLessonHours(hoursData);
            setSubjects(subjectsData);
            setClassrooms(classroomsData);
        };
        loadInitial();
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;
        Promise.all([
            api.classManagement.getSemesters(selectedYearId),
            api.classManagement.getClassesByYear(selectedYearId, { includeInactive: false }),
            api.grades.getCurrentSemester(selectedYearId).catch(() => 1)
        ]).then(([sem, cls, currentSem]) => {
            setSemesters(sem);
            setClasses(cls.data);
            const semToSelect = sem.find(s => s.order === currentSem) || sem[0];
            if (semToSelect) setSelectedSemesterOrder(semToSelect.order);
            else if (sem.length > 0) setSelectedSemesterOrder(sem[0].order);
            setSelectedClassId(null);
        });
    }, [selectedYearId]);

    const loadSchedule = async () => {
        if (!selectedClassId || !selectedSemesterOrder) return;
        const semester = semesters.find(s => s.order === selectedSemesterOrder);
        if (!semester) return;
        setLoading(true);
        try {
            const data = await api.schedule.getClassSchedule(selectedClassId, semester.id);
            setSchedule(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSchedule([]);
        loadSchedule();
    }, [selectedClassId, selectedSemesterOrder, semesters]);

    useEffect(() => {
        if (!modalData?.subjectId) {
            setTeachers([]);
            return;
        }
        setTeachersLoading(true);
        api.subjects.getTeachers(modalData.subjectId)
            .then(setTeachers)
            .finally(() => setTeachersLoading(false));
    }, [modalData?.subjectId]);

    const getLesson = (dayIndex: number, order: number) => {
        const dayOfWeek = dayIndex + 1;
        return schedule.find(l => l.orderNumber === order && l.dayOfWeek === dayOfWeek);
    };

    const openModal = (dayIndex: number, hour: LessonHour, existing?: ScheduleLesson) => {
        setModalData({
            id: existing?.id,
            dayOfWeek: dayIndex + 1,
            lessonHourId: hour.id,
            subjectId: existing?.subjectId || 0,
            teacherId: existing?.teacherId || 0,
            classroomId: existing?.classroomId || 0
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!modalData || !selectedClassId) return;
        const semester = semesters.find(s => s.order === selectedSemesterOrder);
        if (!semester) return;

        if (modalData.subjectId && modalData.teacherId && modalData.classroomId) {
            await api.schedule.createOrUpdate({
                id: modalData.id,
                classId: selectedClassId,
                semesterId: semester.id,
                subjectId: modalData.subjectId,
                teacherId: modalData.teacherId,
                classroomId: modalData.classroomId,
                dayOfWeek: modalData.dayOfWeek,
                lessonHourId: modalData.lessonHourId
            });
            setIsModalOpen(false);
            setModalData(null);
            await loadSchedule();
        }
    };

    const handleDelete = async () => {
        if (!modalData?.id) return;
        if (!window.confirm('Czy na pewno usunąć tę lekcję z planu?')) return;
        await api.schedule.delete(modalData.id);
        setIsModalOpen(false);
        setModalData(null);
        await loadSchedule();
    };

    const handleClearSchedule = async () => {
        if (!selectedClassId || !selectedSemesterOrder) return;
        const semester = semesters.find(s => s.order === selectedSemesterOrder);
        if (!semester) return;

        if (!window.confirm('Czy na pewno wyczyścić cały plan lekcji dla tej klasy? Ta operacja jest nieodwracalna.')) return;

        await api.schedule.clearSchedule(selectedClassId, semester.id);
        await loadSchedule();
        setEditMode(false);
    };

    const days = [getText('days.monday'), getText('days.tuesday'), getText('days.wednesday'), getText('days.thursday'), getText('days.friday')];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={selectedYearId} onChange={id => { setSelectedYearId(id); setSelectedSemesterOrder(null); setSelectedClassId(null); }} />
                    <SemesterSelector semesters={semesters} selectedOrder={selectedSemesterOrder} onChange={setSelectedSemesterOrder} />
                    <ClassSelector classes={classes} selectedClass={selectedClassId} onChange={setSelectedClassId} showAll />
                    {selectedClassId && (
                        <>
                            {editMode && (
                                <Button
                                    variant="danger"
                                    onClick={handleClearSchedule}
                                >
                                    <Trash2 size={14} /> Wyczyść
                                </Button>
                            )}
                            <Button
                                variant={editMode ? 'primary' : 'soft'}
                                onClick={() => setEditMode(!editMode)}
                                className="flex items-center gap-1"
                            >
                                <Edit size={14} /> {editMode ? 'Zakończ edycję' : 'Edytuj'}
                            </Button>
                        </>
                    )}
                    <ExportButton disabled={!selectedClassId} onExport={(format) => {
                        if (!selectedClassId) return;
                        const semester = semesters.find(s => s.order === selectedSemesterOrder);
                        api.export.downloadSchedule({
                            classId: selectedClassId,
                            yearId: selectedYearId || undefined,
                            semesterId: semester?.id,
                            format
                        });
                    }} />
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
                                            <td
                                                key={di}
                                                className={`border-b border-r border-neutral-200 p-2 align-middle h-14 ${editMode ? 'cursor-pointer hover:bg-neutral-50 transition-colors' : ''}`}
                                                onClick={() => editMode && openModal(di, hour, lesson)}
                                            >
                                                {lesson ? (
                                                    <div className="pl-1">
                                                        <div className="font-medium text-neutral-900 truncate">{lesson.subjectName}</div>
                                                        {lesson.classroomName && <div className="text-xs text-neutral-400 truncate">{lesson.classroomName}</div>}
                                                        <div className="text-neutral-500 truncate text-xs">{lesson.teacherName}</div>
                                                    </div>
                                                ) : <div className="text-center text-neutral-300">{editMode ? '+' : ''}</div>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setModalData(null); }} title={modalData?.id ? 'Edytuj lekcję' : 'Dodaj lekcję'}>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label-text">Przedmiot <span className="text-danger">*</span></label>
                        <select
                            className="px-2 py-1 border border-neutral-300 rounded-xs text-sm bg-white w-full"
                            value={modalData?.subjectId || ''}
                            onChange={e => setModalData(prev => prev ? { ...prev, subjectId: +e.target.value, teacherId: 0 } : null)}
                        >
                            <option value="">Wybierz przedmiot</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label-text">Nauczyciel <span className="text-danger">*</span></label>
                        <select
                            className="px-2 py-1 border border-neutral-300 rounded-xs text-sm bg-white w-full"
                            value={modalData?.teacherId || ''}
                            onChange={e => setModalData(prev => prev ? { ...prev, teacherId: +e.target.value } : null)}
                            disabled={!modalData?.subjectId || teachersLoading}
                        >
                            <option value="">{teachersLoading ? 'Ładowanie...' : 'Wybierz nauczyciela'}</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label-text">Sala <span className="text-danger">*</span></label>
                        <select
                            className="px-2 py-1 border border-neutral-300 rounded-xs text-sm bg-white w-full"
                            value={modalData?.classroomId || ''}
                            onChange={e => setModalData(prev => prev ? { ...prev, classroomId: +e.target.value } : null)}
                        >
                            <option value="">Wybierz salę</option>
                            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-between gap-3 pt-4">
                        <div>
                            {modalData?.id && (
                                <Button variant="danger" onClick={handleDelete}>
                                    <Trash2 size={14} /> Usuń
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="soft" onClick={() => { setIsModalOpen(false); setModalData(null); }}>Anuluj</Button>
                            <Button
                                onClick={handleSave}
                                disabled={!modalData?.subjectId || !modalData?.teacherId || !modalData?.classroomId}
                            >
                                Zapisz
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
