import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/apiService';
import { formatDateTime } from '../../utils/formatters';
import { getTeacherId, EXCUSE_STATUS_OPTIONS, getExcuseStatusBadge } from '../../utils/helpers';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { Pagination } from '../../components/ui/Pagination';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { useCMSContent } from '../../hooks/useCMSContent';
import { useSchoolYearSelector } from '../../hooks/useSchoolYearSelector';
import { ExcuseDetailModal } from '../../components/views/ExcuseDetailModal';


export const TeacherExcuses = () => {
    const { getText } = useCMSContent('teacherLayout');
    const teacherId = getTeacherId();

    const {
        years, selectedYearId, setSelectedYearId,
        semesters, selectedSemesterOrder, setSelectedSemesterOrder
    } = useSchoolYearSelector({ withCurrentSemester: true });

    const [excuses, setExcuses] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDesc, setSortDesc] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [selectedExcuseId, setSelectedExcuseId] = useState<number | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            setSelectedExcuseId(Number(id));
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

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
                classId: undefined,
                semesterId: semester?.id,
                statusFilter: statusFilter || undefined
            });
            setExcuses(result.data);
            setTotalCount(result.totalCount);
        } finally {
            setLoading(false);
        }
    }, [teacherId, page, search, sortBy, sortDesc, selectedSemesterOrder, semesters, statusFilter]);

    useEffect(() => { loadExcuses(); }, [loadExcuses]);

    const handleSort = (field: string) => {
        if (sortBy === field) setSortDesc(!sortDesc);
        else { setSortBy(field); setSortDesc(true); }
    };

    const handleReset = () => {
        setSearch('');
        setStatusFilter(null);
        setPage(1);
    };


    const columns: Column<any>[] = [
        { header: 'Wysłano', sortKey: 'createdAt', muted: true, render: (e) => formatDateTime(e.createdAt) },
        { header: 'Rodzic', sortKey: 'parent', bold: true, accessor: 'parentName' },
        { header: 'Klasa', accessor: 'className' },
        { header: 'Uczeń', sortKey: 'student', muted: true, accessor: 'studentName' },
        { header: 'Powód', muted: true, render: (e) => <span className="truncate block max-w-xs">{e.reason}</span> },
        { header: 'Lekcje', className: 'w-16 text-center', render: (e) => e.attendanceCount },
        { header: 'Status', render: (e) => getExcuseStatusBadge(e.isAccepted) },
        { header: 'Rozpatrzono', sortKey: 'acceptedat', muted: true, render: (e) => e.acceptedAt ? formatDateTime(e.acceptedAt) : '-' },
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
                        label="Status"
                        options={EXCUSE_STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                        value={statusFilter}
                        onChange={v => { setStatusFilter(v as string | null); setPage(1); }}
                        parseAsNumber={false}
                    />
                </FilterToolbar>

                <DataTable columns={columns} data={excuses} sortBy={sortBy} sortDesc={sortDesc} onSort={handleSort} isLoading={loading} />
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
