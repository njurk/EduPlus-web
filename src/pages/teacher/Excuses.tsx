import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import type { SchoolYear, SemesterDto, ClassEntity } from '../../types';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import { getTeacherId, EXCUSE_STATUS_OPTIONS, getExcuseStatusBadge } from '../../utils/helpers';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { Pagination } from '../../components/ui/Pagination';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { useCMSContent } from '../../hooks/useCMSContent';
import { ExcuseDetailModal } from '../../components/views/ExcuseDetailModal';


export const TeacherExcuses = () => {
    const { getText } = useCMSContent('teacherLayout');
    const teacherId = getTeacherId();

    const [years, setYears] = useState<SchoolYear[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [selectedSemesterOrder, setSelectedSemesterOrder] = useState<number | null>(null);
    const [classes, setClasses] = useState<ClassEntity[]>([]);

    const [excuses, setExcuses] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDesc, setSortDesc] = useState(true);
    const [page, setPage] = useState(1);
    const [classFilter, setClassFilter] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [selectedExcuseId, setSelectedExcuseId] = useState<number | null>(null);

    useEffect(() => {
        const loadInitial = async () => {
            const yearsData = await api.schoolYears.getAll();
            setYears(yearsData);
            const today = new Date().toISOString().split('T')[0];
            const current = yearsData.find(y => y.startDate <= today && y.endDate >= today) || yearsData.find(y => y.isActive) || yearsData[0];
            if (current) setSelectedYearId(current.id);
        };
        loadInitial();
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;
        Promise.all([
            api.classManagement.getSemesters(selectedYearId),
            api.classManagement.getClassesByYear(selectedYearId, { includeInactive: false, pageSize: 100 }),
            api.grades.getCurrentSemester(selectedYearId).catch(() => 1)
        ]).then(([sem, cls, currentSem]) => {
            setSemesters(sem);
            setClasses(cls.data);
            const semToSelect = sem.find(s => s.order === currentSem) || sem[0];
            if (semToSelect) setSelectedSemesterOrder(semToSelect.order);
        });
    }, [selectedYearId]);

    const loadExcuses = useCallback(async () => {
        if (!teacherId) return;
        const semester = semesters.find(s => s.order === selectedSemesterOrder);
        setLoading(true);
        try {
            const result = await api.excuses.getAll({
                teacherId,
                pageNumber: page,
                pageSize: 20,
                search,
                sortBy,
                sortDesc,
                classId: classFilter || undefined,
                semesterId: semester?.id,
                statusFilter: statusFilter || undefined
            });
            setExcuses(result.data);
            setTotalCount(result.totalCount);
        } finally {
            setLoading(false);
        }
    }, [teacherId, page, search, sortBy, sortDesc, classFilter, selectedSemesterOrder, semesters, statusFilter]);

    useEffect(() => { loadExcuses(); }, [loadExcuses]);

    const handleSort = (field: string) => {
        if (sortBy === field) setSortDesc(!sortDesc);
        else { setSortBy(field); setSortDesc(true); }
    };

    const handleReset = () => {
        setSearch('');
        setClassFilter(null);
        setStatusFilter(null);
        setPage(1);
    };


    const columns: Column<any>[] = [
        { header: 'Uczeń', sortKey: 'student', bold: true, accessor: 'studentName' },
        { header: 'Klasa', accessor: 'className' },
        { header: 'Rodzic', sortKey: 'parent', muted: true, accessor: 'parentName' },
        { header: 'Powód', muted: true, render: (e) => <span className="truncate block max-w-xs">{e.reason}</span> },
        { header: 'Lekcje', className: 'w-16 text-center', render: (e) => e.attendanceCount },
        { header: 'Status', render: (e) => getExcuseStatusBadge(e.isAccepted) },
        { header: 'Rozpatrzono', sortKey: 'acceptedat', muted: true, render: (e) => e.acceptedAt ? formatDateTime(e.acceptedAt) : '-' },
        { header: 'Data', sortKey: 'createdAt', muted: true, render: (e) => formatDateOnly(e.createdAt) },
        {
            header: '', className: 'w-12',
            render: (e) => <ActionButtons isActive onDetails={() => setSelectedExcuseId(e.id)} />
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title.excuses')}</h1>
                <div className="flex gap-2 items-center">
                    <YearSelector years={years} selectedYear={selectedYearId} onChange={id => { setSelectedYearId(id); setSelectedSemesterOrder(null); setPage(1); }} />
                    <SemesterSelector semesters={semesters} selectedOrder={selectedSemesterOrder} onChange={o => { setSelectedSemesterOrder(o); setPage(1); }} />
                </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xs overflow-hidden">
                <FilterToolbar
                    search={{ value: search, onChange: v => { setSearch(v); setPage(1); }, placeholder: 'Szukaj...' }}
                    onReset={handleReset}
                >
                    <FilterSelect
                        label="Klasa"
                        options={classes.map(c => ({ label: `${c.level}${c.letter}`, value: c.id }))}
                        value={classFilter}
                        onChange={v => { setClassFilter(v as number | null); setPage(1); }}
                    />
                    <FilterSelect
                        label="Status"
                        options={EXCUSE_STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                        value={statusFilter}
                        onChange={v => { setStatusFilter(v as string | null); setPage(1); }}
                        parseAsNumber={false}
                    />
                </FilterToolbar>

                <DataTable columns={columns} data={excuses} sortBy={sortBy} sortDesc={sortDesc} onSort={handleSort} isLoading={loading} emptyMessage="Brak danych" />
                <Pagination currentPage={page} totalPages={Math.ceil(totalCount / 20)} totalCount={totalCount} pageSize={20} onPageChange={setPage} />
            </div>

            <ExcuseDetailModal
                excuseId={selectedExcuseId}
                isOpen={selectedExcuseId !== null}
                onClose={() => setSelectedExcuseId(null)}
                onUpdated={loadExcuses}
            />
        </div>
    );
};
