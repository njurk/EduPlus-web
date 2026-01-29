import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Plus, ArrowLeft, BookOpen, Users, User, MapPin, Clock, Calendar, FileText, CheckCircle, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { TrashButton } from '../../components/ui/TrashButton';
import { YearSelector } from '../../components/ui/YearSelector';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { Modal } from '../../components/modals/Modal';
import type { SchoolYear, SemesterDto, ClassEntity, LessonDetailsDto, LessonAttendanceDto, User as UserType, PaginatedResponse, AttendanceType } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';

const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

interface LessonDetailViewProps {
    lesson: LessonDetailsDto;
    attendance: LessonAttendanceDto[];
    onBack: () => void;
    onAttendanceChange?: () => void;
    onLessonUpdate?: () => void;
    editMode?: boolean;
}

const LessonDetailView = ({ lesson, attendance: initialAttendance, onBack, onAttendanceChange, onLessonUpdate, editMode = false }: LessonDetailViewProps) => {
    const [attendanceTypes, setAttendanceTypes] = useState<AttendanceType[]>([]);
    const [attendance, setAttendance] = useState<LessonAttendanceDto[]>(initialAttendance);
    const [updatingStudent, setUpdatingStudent] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<UserType[]>([]);
    const [editData, setEditData] = useState({ classroomId: lesson.classroomId, statusId: lesson.statusId, topic: lesson.topic, teacherId: lesson.teacherId });

    useEffect(() => {
        if (editMode) {
            api.attendanceTypes.getAll().then(setAttendanceTypes).catch(console.error);
            api.classrooms.getAll().then(setClassrooms).catch(console.error);
            api.lessonStatuses.getAll().then(setStatuses).catch(console.error);
            api.users.getAll({ roleLevel: 2, pageSize: 1000 }).then(res => setTeachers(res.data)).catch(console.error);
        }
    }, [editMode]);

    useEffect(() => { setAttendance(initialAttendance); }, [initialAttendance]);
    useEffect(() => { setEditData({ classroomId: lesson.classroomId, statusId: lesson.statusId, topic: lesson.topic, teacherId: lesson.teacherId }); }, [lesson]);

    const handleAttendanceChange = async (studentId: number, attendanceTypeId: number | null) => {
        if (!editMode) return;
        setUpdatingStudent(studentId);
        try {
            await api.lessons.updateAttendance(lesson.id, studentId, attendanceTypeId);
            const selectedType = attendanceTypeId ? attendanceTypes.find(t => t.id === attendanceTypeId) : null;
            setAttendance(prev => prev.map(a => a.studentId === studentId ? { ...a, attendanceTypeId: attendanceTypeId ?? undefined, attendanceTypeName: selectedType?.name ?? '', shortCode: selectedType?.shortCode ?? '', colorHex: selectedType?.colorHex ?? '' } : a));
            onAttendanceChange?.();
        } catch (e) { console.error('błąd aktualizowania frekwencji:', e); } finally { setUpdatingStudent(null); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.lessons.update(lesson.id, { classroomId: editData.classroomId, statusId: editData.statusId, topic: editData.topic, teacherId: editData.teacherId });
            onLessonUpdate?.();
            onBack();
        } catch (e) { console.error('Błąd zapisu lekcji:', e); } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-neutral-500 hover:text-primary transition-colors"><ArrowLeft size={20} /></button>
                    <h1 className="text-xl font-bold text-neutral-800">{editMode ? 'Edycja lekcji' : 'Podgląd lekcji'}</h1>
                </div>
                {editMode && <Button onClick={handleSave} disabled={saving}><Save size={14} className="mr-1" />{saving ? 'Zapisywanie...' : 'Zapisz'}</Button>}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
                        <h2 className="font-semibold text-neutral-800 border-b pb-2">Szczegóły</h2>
                        <div className="flex items-start gap-3"><BookOpen size={16} className="text-neutral-400 mt-0.5" /><div><p className="text-xs text-neutral-500">Przedmiot</p><p className="text-sm font-medium text-neutral-800">{lesson.subjectName}</p></div></div>
                        <div className="flex items-start gap-3"><Users size={16} className="text-neutral-400 mt-0.5" /><div><p className="text-xs text-neutral-500">Klasa</p><p className="text-sm font-medium text-neutral-800">{lesson.className}</p></div></div>
                        <div className="flex items-start gap-3"><User size={16} className="text-neutral-400 mt-0.5" /><div className="flex-1"><p className="text-xs text-neutral-500">Nauczyciel</p>{editMode && statuses.find(s => s.id === editData.statusId)?.slug === 'substitute' ? <select value={editData.teacherId || ''} onChange={e => setEditData(d => ({ ...d, teacherId: Number(e.target.value) || d.teacherId }))} className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"><option value="">Wybierz nauczyciela</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}</select> : <p className="text-sm font-medium text-neutral-800">{lesson.teacherName}</p>}</div></div>
                        <div className="flex items-start gap-3"><MapPin size={16} className="text-neutral-400 mt-0.5" /><div className="flex-1"><p className="text-xs text-neutral-500">Sala</p>{editMode ? <select value={editData.classroomId || ''} onChange={e => setEditData(d => ({ ...d, classroomId: e.target.value ? Number(e.target.value) : undefined }))} className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"><option value="">Brak</option>{classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select> : <p className="text-sm font-medium text-neutral-800">{lesson.classroomName || '-'}</p>}</div></div>
                        <div className="flex items-start gap-3"><Calendar size={16} className="text-neutral-400 mt-0.5" /><div><p className="text-xs text-neutral-500">Data</p><p className="text-sm font-medium text-neutral-800">{dayNames[lesson.dayOfWeek]}, {formatDateOnly(lesson.date)}</p></div></div>
                        <div className="flex items-start gap-3"><Clock size={16} className="text-neutral-400 mt-0.5" /><div><p className="text-xs text-neutral-500">Godzina lekcyjna</p><p className="text-sm font-medium text-neutral-800">{lesson.orderNumber} / {lesson.startTime} - {lesson.endTime}</p></div></div>
                        <div className="flex items-start gap-3"><CheckCircle size={16} className="text-neutral-400 mt-0.5" /><div className="flex-1"><p className="text-xs text-neutral-500">Status</p>{editMode ? <select value={editData.statusId} onChange={e => setEditData(d => ({ ...d, statusId: Number(e.target.value) }))} className="w-full border border-neutral-300 rounded px-2 py-1 text-sm">{statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select> : <p className="text-sm font-medium text-neutral-800">{lesson.statusName}</p>}</div></div>
                        <div className="flex items-start gap-3"><FileText size={16} className="text-neutral-400 mt-0.5" /><div className="flex-1"><p className="text-xs text-neutral-500">Temat</p>{editMode ? <textarea value={editData.topic} onChange={e => setEditData(d => ({ ...d, topic: e.target.value }))} className="w-full border border-neutral-300 rounded px-2 py-1 text-sm resize-none" rows={3} placeholder="Wpisz temat lekcji..." /> : <p className="text-sm font-medium text-neutral-800">{lesson.topic || '-'}</p>}</div></div>
                        <div className="pt-4 border-t space-y-2 text-xs text-neutral-500"><p>Utworzono: {formatDateTime(lesson.createdAt)}</p><p>Edytowano: {formatDateTime(lesson.updatedAt)}</p><p>Przez: {lesson.modifiedByName || 'System'}</p></div>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="bg-white border border-neutral-200 rounded-lg">
                        <div className="p-4 border-b"><h2 className="font-semibold text-neutral-800">Frekwencja</h2></div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="bg-neutral-50 border-b"><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 w-12">Nr</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Uczeń</th><th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 w-40">Obecność</th></tr></thead>
                                <tbody>
                                    {attendance.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-neutral-400">Brak uczniów w klasie</td></tr> : attendance.map(a => (
                                        <tr key={a.studentId} className="border-b hover:bg-neutral-50">
                                            <td className="px-4 py-3 text-sm text-neutral-500">{a.studentNumber}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-neutral-800">{a.studentName}</td>
                                            <td className="px-4 py-3 text-center">
                                                {editMode ? <select value={a.attendanceTypeId ?? ''} onChange={e => handleAttendanceChange(a.studentId, e.target.value ? Number(e.target.value) : null)} disabled={updatingStudent === a.studentId} style={a.colorHex ? { backgroundColor: a.colorHex, color: 'white', borderColor: a.colorHex } : undefined} className={`px-3 py-1.5 text-xs font-bold rounded border cursor-pointer transition-all min-w-[100px] ${!a.colorHex ? 'bg-white text-neutral-500 border-neutral-300' : ''} ${updatingStudent === a.studentId ? 'opacity-50' : ''}`}><option value="">—</option>{attendanceTypes.map(type => <option key={type.id} value={type.id}>{type.shortCode.toUpperCase()} - {type.name}</option>)}</select> : a.shortCode ? <span style={a.colorHex ? { backgroundColor: a.colorHex, color: 'white' } : undefined} className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-bold ${!a.colorHex ? 'bg-neutral-100 text-neutral-700' : ''}`} title={a.attendanceTypeName}>{a.shortCode.toUpperCase()}</span> : <span className="text-neutral-300">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

type ViewMode = 'list' | 'details' | 'edit';

export const Lessons = () => {
    const { getText } = useCMSContent('lessons');
    const [data, setData] = useState<any[]>([]);
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<any> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
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
        classroomId: null as number | null,
        teacherId: null as number | null,
        showInactive: false
    });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClassIdModal, setSelectedClassIdModal] = useState<number | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
    const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [teachers, setTeachers] = useState<UserType[]>([]);
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
        api.users.getAll({ roleLevel: 2, pageSize: 1000 }).then(res => setTeachers(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (filters.yearId) {
            Promise.all([
                api.classManagement.getSemesters(filters.yearId),
                api.classManagement.getClassesByYear(filters.yearId)
            ]).then(([sem, cls]) => {
                setSemesters(sem);
                setClasses(cls.data);
            });
        }
    }, [filters.yearId]);

    const loadData = useCallback(async () => {
        if (!filters.yearId) return;
        setLoading(true);
        try {
            const params: Record<string, any> = {
                pageNumber,
                pageSize: 20,
                search: filters.search,
                sortBy: filters.sortBy,
                sortDesc: filters.sortDesc,
                schoolYearId: filters.yearId
            };
            if (filters.classId) params.classId = filters.classId;
            if (filters.subjectId) params.subjectId = filters.subjectId;
            if (filters.semesterId) params.semesterId = filters.semesterId;
            if (filters.statusId) params.statusId = filters.statusId;
            if (filters.classroomId) params.classroomId = filters.classroomId;
            if (filters.teacherId) params.teacherId = filters.teacherId;
            if (filters.showInactive) params.showInactive = true;
            const response = await api.lessons.getAll(params);
            setPaginatedData(response);
            setData(response.data);
        } finally { setLoading(false); }
    }, [filters, pageNumber]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => { setPageNumber(1); }, [filters.search, filters.yearId, filters.semesterId, filters.classId, filters.statusId, filters.subjectId, filters.classroomId, filters.teacherId]);

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
        const completedStatus = statuses.find(s => s.slug === 'completed');
        setSelectedStatusId(completedStatus?.id || null);
        setSelectedTemplateId(null);
        setTemplates([]);
        setIsAddModalOpen(true);
    };

    const isSubstituteStatus = statuses.find(s => s.id === selectedStatusId)?.slug === 'substitute';

    const loadTemplates = useCallback(async () => {
        if (!isAddModalOpen || !addDate) return;
        setTemplatesLoading(true);
        try {
            const currentSemester = semesters.find(s => s.order === 1) || semesters[0];
            const result = await api.schedule.getAvailableForDate(
                addDate,
                selectedClassIdModal || undefined,
                isSubstituteStatus ? undefined : (selectedTeacherId || undefined),
                currentSemester?.id
            );
            setTemplates(result);
        } catch (e) {
            console.error(e);
        } finally {
            setTemplatesLoading(false);
        }
    }, [isAddModalOpen, addDate, selectedClassIdModal, selectedTeacherId, semesters, isSubstituteStatus]);

    useEffect(() => { loadTemplates(); }, [loadTemplates]);

    const handleCreateFromTemplate = async (templateId: number) => {
        try {
            const teacherIdToUse = isSubstituteStatus && selectedTeacherId ? selectedTeacherId : undefined;
            await api.lessons.createFromSchedule(templateId, addDate, teacherIdToUse, selectedStatusId ?? undefined);
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

    const handleDelete = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć tę lekcję?')) return;
        try {
            await api.lessons.delete(id);
            loadData();
        } catch (e: any) {
            alert(e.message || 'Błąd usuwania lekcji');
        }
    };

    const handleRestore = async (id: number) => {
        try {
            await api.lessons.restore(id);
            loadData();
        } catch (e: any) {
            alert(e.message || 'Błąd przywracania lekcji');
        }
    };

    if (viewMode === 'details' || viewMode === 'edit') {
        if (detailsLoading) {
            return <LoadingSpinner className="h-64" />;
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
                    </div>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                    <FilterToolbar
                        search={{ value: filters.search, onChange: v => setFilters(f => ({ ...f, search: v })) }}
                        onReset={() => setFilters(f => ({ ...f, search: '', statusId: null, subjectId: null, classroomId: null, teacherId: null }))}
                        rightContent={
                            <>
                                <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(f => ({ ...f, showInactive: !f.showInactive }))} />
                                <Button onClick={openAddModal}><Plus size={14} className="mr-1" /> Dodaj</Button>
                            </>
                        }
                    >
                        <FilterSelect
                            label="Statusy:"
                            value={filters.statusId}
                            onChange={v => setFilters(f => ({ ...f, statusId: v as number | null }))}
                            options={statuses.map(s => ({ value: s.id, label: s.name }))}
                            placeholder="Wszystkie"
                            minWidth="140px"
                        />
                        <FilterSelect
                            label="Przedmioty:"
                            value={filters.subjectId}
                            onChange={v => setFilters(f => ({ ...f, subjectId: v as number | null }))}
                            options={subjects.map(s => ({ value: s.id, label: s.name }))}
                            placeholder="Wszystkie"
                            minWidth="140px"
                        />
                        <FilterSelect
                            label="Sale:"
                            value={filters.classroomId}
                            onChange={v => setFilters(f => ({ ...f, classroomId: v as number | null }))}
                            options={classrooms.map(c => ({ value: c.id, label: c.name }))}
                            placeholder="Wszystkie"
                            minWidth="140px"
                        />
                        <FilterSelect
                            label="Nauczyciel:"
                            value={filters.teacherId}
                            onChange={v => setFilters(f => ({ ...f, teacherId: v as number | null }))}
                            options={teachers.map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))}
                            placeholder="Wszyscy"
                            minWidth="160px"
                        />
                    </FilterToolbar>
                    <div className="flex-1">
                        {loading ? <LoadingSpinner /> : (
                            <DataTable
                                data={data}
                                sortBy={filters.sortBy}
                                sortDesc={filters.sortDesc}
                                onSort={field => setFilters(f => f.sortBy === field ? { ...f, sortDesc: !f.sortDesc } : { ...f, sortBy: field, sortDesc: true })}
                                columns={[
                                    { header: getText('columns.createdAt'), sortKey: 'created', render: l => <span className="text-xs text-neutral-500">{formatDateTime(l.createdAt)}</span> },
                                    { header: getText('columns.orderNumber'), sortKey: 'ordernumber', render: l => <span className="font-medium">{l.orderNumber}</span> },
                                    { header: getText('columns.class'), render: l => l.className },
                                    { header: getText('columns.classroom'), render: l => l.classroomName || '-' },
                                    { header: getText('columns.subject'), render: l => <span className="font-medium">{l.subjectName}</span> },
                                    { header: 'Nauczyciel', render: l => <span className="text-sm">{l.teacherName}</span> },
                                    { header: getText('columns.status'), render: l => <span className="text-xs">{l.statusName}</span> },
                                    { header: getText('columns.updatedAt'), sortKey: 'updated', render: l => <span className="text-xs text-neutral-500">{formatDateTime(l.updatedAt)}</span> },
                                    { header: getText('columns.modifiedBy'), render: l => <span className="text-xs text-neutral-500">{l.modifiedByName || 'System'}</span> },
                                    {
                                        header: getText('columns.actions'), className: 'text-right', render: l => (
                                            <ActionButtons
                                                isActive={l.isActive}
                                                onDetails={() => openLessonView(l, 'details')}
                                                onEdit={() => openLessonView(l, 'edit')}
                                                onDelete={() => handleDelete(l.id)}
                                                onRestore={() => handleRestore(l.id)}
                                            />
                                        )
                                    }
                                ]}
                                emptyMessage={getText('emptyMessage')}
                            />
                        )}
                    </div>
                    {paginatedData && (
                        <Pagination
                            currentPage={pageNumber}
                            totalPages={paginatedData.totalPages}
                            totalCount={paginatedData.totalCount}
                            pageSize={paginatedData.pageSize}
                            onPageChange={setPageNumber}
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
                                        onClick={() => setSelectedTemplateId(t.id)}
                                        className={`border rounded-xs p-3 cursor-pointer transition-colors ${selectedTemplateId === t.id ? 'bg-primary-light border-primary' : 'hover:bg-neutral-50'}`}
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

                    <div className="border-t pt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text block mb-1">Status</label>
                            <select
                                value={selectedStatusId || ''}
                                onChange={e => setSelectedStatusId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                            >
                                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        {isSubstituteStatus && (
                            <div>
                                <label className="label-text block mb-1">Nauczyciel zastępujący</label>
                                <select
                                    value={selectedTeacherId || ''}
                                    onChange={e => setSelectedTeacherId(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                                >
                                    <option value="">Wybierz nauczyciela</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4 flex justify-end">
                        <Button
                            onClick={() => selectedTemplateId && handleCreateFromTemplate(selectedTemplateId)}
                            disabled={!selectedTemplateId}
                        >
                            <Plus size={16} className="mr-2" /> Dodaj
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
