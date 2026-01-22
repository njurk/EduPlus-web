import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { RefreshCcw, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { ClassSelector } from '../../components/ui/ClassSelector';
import { TrashButton } from '../../components/ui/TrashButton';
import { SearchBar } from '../../components/ui/SearchBar';
import { DetailsModal } from '../../components/modals/DetailsModal';
import type { SchoolYear, SemesterDto, ClassEntity } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';

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
    const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'ordernumber',
        sortDesc: false,
        yearId: null as number | null,
        semesterOrder: null as number | null,
        classId: null as number | null,
        statusId: null as number | null,
        subjectId: null as number | null,
        classroomId: null as number | null,
        showInactive: false
    });

    useEffect(() => {
        api.schoolYears.getAll().then(data => {
            setYears(data);
            const active = data.find(y => y.isActive);
            if (active) setFilters(f => ({ ...f, yearId: active.id }));
        });
        api.lessonStatuses.getAll().then(setStatuses).catch(console.error);
        api.subjects.getAll().then(setSubjects).catch(console.error);
        api.classrooms.getAll().then(setClassrooms).catch(console.error);
    }, []);

    useEffect(() => {
        if (filters.yearId) {
            Promise.all([
                api.classManagement.getSemesters(filters.yearId),
                api.classManagement.getClassesByYear(filters.yearId)
            ]).then(([sem, cls]) => {
                setSemesters(sem);
                setClasses(cls);
                if (sem.length > 0) setFilters(f => ({ ...f, semesterOrder: sem[0].order }));
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
                sortDesc: filters.sortDesc
            };
            if (filters.classId) params.classId = filters.classId;
            if (filters.subjectId) params.subjectId = filters.subjectId;
            setData(await api.lessons.getAll(params));
        } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Usunąć lekcję?")) return;
        await api.lessons.delete(id);
        await loadData();
    };

    const openDetails = (lesson: any) => {
        setSelectedLesson(lesson);
        setIsDetailsOpen(true);
    };

    const handleEdit = (lesson: any) => {
        console.log('Edit lesson:', lesson.id);
    };

    const handleGenerate = () => {
        console.log('Generate lessons');
    };

    const filteredData = data.filter(l => {
        if (filters.statusId && l.statusId !== filters.statusId) return false;
        if (filters.classroomId && l.classroomId !== filters.classroomId) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={filters.yearId} onChange={v => setFilters(f => ({ ...f, yearId: v, semesterOrder: null, classId: null }))} />
                    <SemesterSelector semesters={semesters} selectedOrder={filters.semesterOrder} onChange={v => setFilters(f => ({ ...f, semesterOrder: v }))} showAll />
                    <ClassSelector classes={classes} selectedClass={filters.classId} onChange={v => setFilters(f => ({ ...f, classId: v }))} showAll />
                    <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(f => ({ ...f, showInactive: !f.showInactive }))} />
                    <Button onClick={handleGenerate}><Plus size={14} className="mr-1" /> Dodaj</Button>
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
                {loading ? <div className="flex items-center justify-center h-32 text-neutral-400"><RefreshCcw className="animate-spin mr-2" size={16} />{'Ładowanie...'}</div> : (
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
                            { header: getText('columns.createdAt'), sortKey: 'created', render: l => <span className="text-xs text-neutral-500">{formatDate(l.createdAt)}</span> },
                            { header: getText('columns.updatedAt'), sortKey: 'updated', render: l => <span className="text-xs text-neutral-500">{formatDate(l.updatedAt)}</span> },
                            { header: getText('columns.modifiedBy'), render: l => <span className="text-xs text-neutral-500">{l.modifiedByName || 'System'}</span> },
                            {
                                header: getText('columns.actions'), className: 'text-right', render: l => (
                                    <ActionButtons
                                        onDetails={() => openDetails(l)}
                                        onEdit={() => handleEdit(l)}
                                        onDelete={() => handleDelete(l.id)}
                                    />
                                )
                            }
                        ]}
                        emptyMessage={getText('emptyMessage')}
                    />
                )}
            </div>

            <DetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title={`${getText('modal.details')} #${selectedLesson?.id}`}
                data={selectedLesson ? {
                    orderNumber: selectedLesson.orderNumber,
                    className: selectedLesson.className,
                    classroomName: selectedLesson.classroomName || '-',
                    subjectName: selectedLesson.subjectName,
                    teacherName: selectedLesson.teacherName,
                    date: formatDate(selectedLesson.date),
                    time: `${selectedLesson.startTime} - ${selectedLesson.endTime}`,
                    topic: selectedLesson.topic || '-',
                    statusName: selectedLesson.statusName,
                    createdAt: formatDate(selectedLesson.createdAt),
                    updatedAt: formatDate(selectedLesson.updatedAt),
                    modifiedByName: selectedLesson.modifiedByName || 'System'
                } : {}}
                labels={{
                    orderNumber: getText('columns.orderNumber'),
                    className: getText('columns.class'),
                    classroomName: getText('columns.classroom'),
                    subjectName: getText('columns.subject'),
                    teacherName: getText('columns.teacher'),
                    date: getText('columns.date'),
                    time: getText('columns.time'),
                    topic: getText('columns.topic'),
                    statusName: getText('columns.status'),
                    createdAt: getText('columns.createdAt'),
                    updatedAt: getText('columns.updatedAt'),
                    modifiedByName: getText('columns.modifiedBy')
                }}
                excludeKeys={[]}
            />
        </div>
    );
};
