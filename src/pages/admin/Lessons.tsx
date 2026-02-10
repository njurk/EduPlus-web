import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { TrashButton } from '../../components/ui/TrashButton';
import { YearSelector } from '../../components/ui/YearSelector';
import { Select } from '../../components/ui/Select';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { Modal } from '../../components/modals/Modal';
import type { SchoolYear, SemesterDto, ClassEntity, LessonDetailsDto, LessonAttendanceDto, User as UserType, PaginatedResponse } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';
import { LessonDetailView } from '../../components/views/LessonDetailView';

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
                api.classManagement.getClassesByYear(filters.yearId, { pageSize: 1000, includeInactive: false })
            ]).then(([sem, cls]) => {
                setSemesters(sem);
                setClasses(cls.data || []);
            }).catch(console.error);
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
                        <Select options={semesters.map(s => ({ value: s.id, label: s.name }))} value={filters.semesterId} onChange={v => setFilters(f => ({ ...f, semesterId: v ? Number(v) : null }))} placeholder="Wszystkie semestry" />
                        <Select options={classes.map(c => ({ value: c.id, label: `${c.level}${c.letter}` }))} value={filters.classId} onChange={v => setFilters(f => ({ ...f, classId: v ? Number(v) : null }))} placeholder="Wszystkie klasy" />
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
                            label="Status:"
                            value={filters.statusId}
                            onChange={v => setFilters(f => ({ ...f, statusId: v as number | null }))}
                            options={statuses.map(s => ({ value: s.id, label: s.name }))}
                            placeholder="Wszystkie"
                            minWidth="140px"
                        />
                        <FilterSelect
                            label="Przedmiot:"
                            value={filters.subjectId}
                            onChange={v => setFilters(f => ({ ...f, subjectId: v as number | null }))}
                            options={subjects.map(s => ({ value: s.id, label: s.name }))}
                            placeholder="Wszystkie"
                            minWidth="140px"
                        />
                        <FilterSelect
                            label="Sala:"
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
                                    { header: 'Utworzono', sortKey: 'created', muted: true, render: l => formatDateTime(l.createdAt) },
                                    { header: 'Data lekcji', sortKey: 'date', muted: true, render: l => formatDateOnly(l.date) },
                                    { header: 'Nr lekcji', sortKey: 'ordernumber', bold: true, render: l => l.orderNumber },
                                    { header: 'Klasa', render: l => l.className },
                                    { header: 'Sala', render: l => l.classroomName || '-' },
                                    { header: 'Przedmiot', bold: true, render: l => l.subjectName },
                                    { header: 'Nauczyciel', render: l => l.teacherName },
                                    { header: 'Status', render: l => l.statusName },
                                    {
                                        header: 'Akcje', className: 'text-right', render: l => (
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
                                emptyMessage={'Brak danych'}
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
                                className="w-full border border-neutral-300 rounded-xs px-2 py-1 text-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="label-text block mb-1">Klasa</label>
                            <Select options={classes.map(c => ({ value: c.id, label: `${c.level}${c.letter}` }))} value={selectedClassIdModal} onChange={v => setSelectedClassIdModal(v ? Number(v) : null)} placeholder="Wszystkie klasy" className="w-full" />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold mb-3">Lekcje według planu</h3>
                        {templatesLoading ? (
                            <LoadingSpinner className="h-32" />
                        ) : templates.length === 0 ? (
                            <div className="text-center text-neutral-400 py-8">Brak</div>
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
                            <Select options={statuses.map(s => ({ value: s.id, label: s.name }))} value={selectedStatusId} onChange={v => setSelectedStatusId(v ? Number(v) : null)} className="w-full" />
                        </div>
                        {isSubstituteStatus && (
                            <div>
                                <label className="label-text block mb-1">Nauczyciel zastępujący</label>
                                <Select options={teachers.map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))} value={selectedTeacherId} onChange={v => setSelectedTeacherId(v ? Number(v) : null)} placeholder="Wybierz nauczyciela" className="w-full" />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end">
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
