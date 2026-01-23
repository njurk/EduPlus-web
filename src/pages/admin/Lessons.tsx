import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { YearSelector } from '../../components/ui/YearSelector';
import { SearchBar } from '../../components/ui/SearchBar';
import { LessonDetailView } from '../../components/views/LessonDetailView';
import { Modal } from '../../components/modals/Modal';
import type { SchoolYear, SemesterDto, ClassEntity, LessonDetailsDto, LessonAttendanceDto, User } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';

type ViewMode = 'list' | 'details' | 'edit';

export const Lessons = () => {
    const { getText } = useCMSContent('lessons');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [detailsLesson, setDetailsLesson] = useState<LessonDetailsDto | null>(null);
    const [attendanceData, setAttendanceData] = useState<LessonAttendanceDto[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'created',
        sortDesc: true,
        yearId: null as number | null,
        semesterId: null as number | null,
        classId: null as number | null,
        statusId: null as number | null,
        subjectId: null as number | null,
        classroomId: null as number | null
    });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClassIdModal, setSelectedClassIdModal] = useState<number | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);

    useEffect(() => {
        api.schoolYears.getAll().then(data => {
            setYears(data);
            const today = new Date().toISOString().split('T')[0];
            const current = data.find(y => y.startDate <= today && y.endDate >= today) || data.find(y => y.isActive) || data[0];
            if (current) setFilters(f => ({ ...f, yearId: current.id }));
        });
        api.lessonStatuses.getAll().then(setStatuses).catch(console.error);
        api.subjects.getAll().then(setSubjects).catch(console.error);
        api.classrooms.getAll().then(setClassrooms).catch(console.error);
        api.users.getAll({ roleName: 'Nauczyciel' }).then(setTeachers).catch(console.error);
    }, []);

    useEffect(() => {
        if (filters.yearId) {
            Promise.all([
                api.classManagement.getSemesters(filters.yearId),
                api.classManagement.getClassesByYear(filters.yearId)
            ]).then(([sem, cls]) => {
                setSemesters(sem);
                setClasses(cls);
            });
        }
    }, [filters.yearId]);

    const loadData = useCallback(async () => {
        if (!filters.yearId) return;
        setLoading(true);
        try {
            const params: Record<string, any> = {
                search: filters.search,
                sortBy: filters.sortBy,
                sortDesc: filters.sortDesc,
                schoolYearId: filters.yearId
            };
            if (filters.classId) params.classId = filters.classId;
            if (filters.subjectId) params.subjectId = filters.subjectId;
            if (filters.semesterId) params.semesterId = filters.semesterId;
            setData(await api.lessons.getAll(params));
        } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { loadData(); }, [loadData]);

    const openLessonView = async (lesson: any, mode: 'details' | 'edit') => {
        setDetailsLoading(true);
        setViewMode(mode);
        try {
            const [details, attendance] = await Promise.all([
                api.lessons.getDetails(lesson.id),
                api.lessons.getAttendance(lesson.id)
            ]);
            setDetailsLesson(details);
            setAttendanceData(attendance);
        } catch (e) {
            console.error(e);
            setViewMode('list');
        } finally {
            setDetailsLoading(false);
        }
    };

    const openAddModal = () => {
        setAddDate(new Date().toISOString().split('T')[0]);
        setSelectedClassIdModal(null);
        setSelectedTeacherId(null);
        setTemplates([]);
        setIsAddModalOpen(true);
    };

    const loadTemplates = useCallback(async () => {
        if (!isAddModalOpen || !addDate) return;
        setTemplatesLoading(true);
        try {
            const currentSemester = semesters.find(s => s.order === 1) || semesters[0];
            const result = await api.schedule.getAvailableForDate(
                addDate,
                selectedClassIdModal || undefined,
                selectedTeacherId || undefined,
                currentSemester?.id
            );
            setTemplates(result);
        } catch (e) {
            console.error(e);
        } finally {
            setTemplatesLoading(false);
        }
    }, [isAddModalOpen, addDate, selectedClassIdModal, selectedTeacherId, semesters]);

    useEffect(() => { loadTemplates(); }, [loadTemplates]);

    const handleCreateFromTemplate = async (templateId: number) => {
        try {
            await api.lessons.createFromSchedule(templateId, addDate, selectedTeacherId || undefined);
            setIsAddModalOpen(false);
            loadData();
        } catch (e: any) {
            alert(e.message || 'Błąd tworzenia lekcji');
        }
    };

    const backToList = () => {
        setViewMode('list');
        setDetailsLesson(null);
        setAttendanceData([]);
    };

    const handleLessonUpdate = () => {
        loadData();
    };

    const filteredData = data.filter(l => {
        if (filters.statusId && l.statusId !== filters.statusId) return false;
        if (filters.classroomId && l.classroomId !== filters.classroomId) return false;
        return true;
    });

    if (viewMode === 'details' || viewMode === 'edit') {
        if (detailsLoading) {
            return (
                <div className="flex items-center justify-center h-64 text-neutral-400">
                    <RefreshCcw className="animate-spin mr-2" size={20} />
                    Ładowanie szczegółów...
                </div>
            );
        }

        if (detailsLesson) {
            return (
                <LessonDetailView
                    lesson={detailsLesson}
                    attendance={attendanceData}
                    onBack={backToList}
                    onAttendanceChange={loadData}
                    onLessonUpdate={handleLessonUpdate}
                    editMode={viewMode === 'edit'}
                />
            );
        }
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
                    <div className="flex gap-2">
                        <YearSelector
                            years={years}
                            selectedYear={filters.yearId}
                            onChange={v => setFilters(f => ({ ...f, yearId: v, semesterId: null, classId: null }))}
                        />
                        <select
                            value={filters.semesterId || ''}
                            onChange={e => setFilters(f => ({ ...f, semesterId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[140px]"
                        >
                            <option value="">Wszystkie semestry</option>
                            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select
                            value={filters.classId || ''}
                            onChange={e => setFilters(f => ({ ...f, classId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[100px]"
                        >
                            <option value="">Wszystkie klasy</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.level}{c.letter}</option>)}
                        </select>
                        <Button onClick={openAddModal}><Plus size={14} className="mr-1" /> Dodaj</Button>
                    </div>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xs">
                    <div className="p-3 border-b flex items-center gap-4">
                        <SearchBar value={filters.search} onChange={v => setFilters(f => ({ ...f, search: v }))} className="max-w-xs" />
                        <select
                            value={filters.statusId || ''}
                            onChange={e => setFilters(f => ({ ...f, statusId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[140px]"
                        >
                            <option value="">Wszystkie statusy</option>
                            {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select
                            value={filters.subjectId || ''}
                            onChange={e => setFilters(f => ({ ...f, subjectId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[140px]"
                        >
                            <option value="">Wszystkie przedmioty</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select
                            value={filters.classroomId || ''}
                            onChange={e => setFilters(f => ({ ...f, classroomId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[140px]"
                        >
                            <option value="">Wszystkie sale</option>
                            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {loading ? <LoadingSpinner /> : (
                        <DataTable
                            data={filteredData}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={field => setFilters(f => f.sortBy === field ? { ...f, sortDesc: !f.sortDesc } : { ...f, sortBy: field, sortDesc: true })}
                            columns={[
                                { header: getText('columns.orderNumber'), sortKey: 'ordernumber', render: l => <span className="font-medium">{l.orderNumber}</span> },
                                { header: getText('columns.class'), render: l => l.className },
                                { header: getText('columns.classroom'), render: l => l.classroomName || '-' },
                                { header: getText('columns.subject'), render: l => <span className="font-medium">{l.subjectName}</span> },
                                { header: getText('columns.status'), render: l => <span className="text-xs">{l.statusName}</span> },
                                { header: getText('columns.createdAt'), sortKey: 'created', render: l => <span className="text-xs text-neutral-500">{formatDateTime(l.createdAt)}</span> },
                                { header: getText('columns.updatedAt'), sortKey: 'updated', render: l => <span className="text-xs text-neutral-500">{formatDateTime(l.updatedAt)}</span> },
                                { header: getText('columns.modifiedBy'), render: l => <span className="text-xs text-neutral-500">{l.modifiedByName || 'System'}</span> },
                                {
                                    header: getText('columns.actions'), className: 'text-right', render: l => (
                                        <ActionButtons
                                            onDetails={() => openLessonView(l, 'details')}
                                            onEdit={() => openLessonView(l, 'edit')}
                                        />
                                    )
                                }
                            ]}
                            emptyMessage={getText('emptyMessage')}
                        />
                    )}
                </div>
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Dodaj lekcję"
                maxWidth="lg"
            >
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="label-text block mb-1">Data</label>
                            <input
                                type="date"
                                value={addDate}
                                onChange={e => setAddDate(e.target.value)}
                                className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="label-text block mb-1">Klasa</label>
                            <select
                                value={selectedClassIdModal || ''}
                                onChange={e => setSelectedClassIdModal(e.target.value ? Number(e.target.value) : null)}
                                className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                            >
                                <option value="">Wszystkie klasy</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.level}{c.letter}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label-text block mb-1">Nauczyciel</label>
                            <select
                                value={selectedTeacherId || ''}
                                onChange={e => setSelectedTeacherId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                            >
                                <option value="">Wszyscy nauczyciele</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold mb-3">Lekcje do realizacji według planu</h3>
                        {templatesLoading ? (
                            <LoadingSpinner className="h-32" />
                        ) : templates.length === 0 ? (
                            <div className="text-center text-neutral-400 py-8">Brak lekcji w wybranych kryteriach</div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {templates.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => handleCreateFromTemplate(t.id)}
                                        className="border rounded-xs p-3 cursor-pointer hover:bg-primary-light hover:border-primary transition-colors"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-medium">{t.subjectName}</span>
                                                <span className="text-neutral-500 ml-2">{t.className}</span>
                                            </div>
                                            <div className="text-sm text-neutral-500">
                                                Lekcja {t.orderNumber} ({t.startTime} - {t.endTime})
                                            </div>
                                        </div>
                                        <div className="text-xs text-neutral-400 mt-1">
                                            {t.teacherName} - s. {t.classroomName || '-'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
};
