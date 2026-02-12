import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { formatDateTime } from '../../utils/formatters';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import type { PaginatedResponse, Excuse } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';
import { useSchoolYearSelector } from '../../hooks/useSchoolYearSelector';
import { Pagination } from '../../components/ui/Pagination';
import { EXCUSE_STATUS_OPTIONS, getExcuseStatusBadge } from '../../utils/helpers';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { ExcuseDetailModal } from '../../components/views/ExcuseDetailModal';

export const Excuses = () => {
    const { getText } = useCMSContent('excuses');
    const {
        years, selectedYearId,
        semesters, classes
    } = useSchoolYearSelector({ withClasses: true });

    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Excuse> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'createdAt',
        sortDesc: true,
        statusFilter: '' as string,
        classId: null as number | null,
        yearId: null as number | null,
        semesterId: null as number | null
    });
    const [selectedExcuseId, setSelectedExcuseId] = useState<number | null>(null);

    useEffect(() => {
        if (selectedYearId) setFilters(f => ({ ...f, yearId: selectedYearId }));
    }, [selectedYearId]);

    const loadData = useCallback(async () => {
        if (!filters.yearId) return;
        setLoading(true);
        try {
            const result = await api.excuses.getAll({
                pageNumber,
                pageSize: 20,
                search: filters.search,
                sortBy: filters.sortBy,
                sortDesc: filters.sortDesc,
                statusFilter: filters.statusFilter || undefined,
                classId: filters.classId || undefined,
                semesterId: filters.semesterId || undefined
            });
            setPaginatedData(result);
        } finally { setLoading(false); }
    }, [filters, pageNumber]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);
    useEffect(() => { setPageNumber(1); }, [filters.search, filters.statusFilter, filters.classId, filters.yearId, filters.semesterId]);

    const handleSort = (field: string) => {
        setFilters(f => ({ ...f, sortBy: field, sortDesc: f.sortBy === field ? !f.sortDesc : true }));
    };



    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={filters.yearId} onChange={v => setFilters(f => ({ ...f, yearId: v, semesterId: null, classId: null }))} />
                    <SemesterSelector semesters={semesters} selectedOrder={semesters.find(s => s.id === filters.semesterId)?.order ?? null} onChange={v => { const sem = semesters.find(s => s.order === v); setFilters(f => ({ ...f, semesterId: sem?.id ?? null })); }} showAll />
                </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <FilterToolbar
                    search={{ value: filters.search, onChange: (v: string) => setFilters(f => ({ ...f, search: v })), placeholder: 'Szukaj...' }}
                    onReset={() => setFilters(f => ({ ...f, search: '', statusFilter: '', classId: null }))}
                >
                    <FilterSelect
                        label="Status:"
                        value={filters.statusFilter || null}
                        onChange={v => setFilters(f => ({ ...f, statusFilter: v ? String(v) : '' }))}
                        options={EXCUSE_STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                        placeholder="Wszystkie"
                        minWidth="140px"
                        parseAsNumber={false}
                    />
                    <FilterSelect
                        label="Klasa:"
                        value={filters.classId}
                        onChange={v => setFilters(f => ({ ...f, classId: v ? Number(v) : null }))}
                        options={classes.map(c => ({ value: c.id, label: `${c.level}${c.letter}` }))}
                        placeholder="Wszystkie"
                        minWidth="100px"
                    />
                </FilterToolbar>
                <div className="flex-1">
                    {loading ? <LoadingSpinner /> : (
                        <DataTable data={paginatedData?.data || []} columns={[
                            { header: 'Wysłano', sortKey: 'createdAt', muted: true, render: (e: Excuse) => formatDateTime(e.createdAt) },
                            { header: 'Rodzic', sortKey: 'parent', bold: true, render: (e: Excuse) => e.parentName },
                            { header: 'Uczeń', sortKey: 'student', bold: true, render: (e: Excuse) => e.studentName },
                            { header: 'Klasa', render: (e: Excuse) => e.className || '-' },
                            { header: 'Lekcje', render: (e: Excuse) => e.attendanceCount, className: 'text-center w-16' },
                            { header: 'Status', sortKey: 'isaccepted', render: (e: Excuse) => getExcuseStatusBadge(e.isAccepted) },
                            { header: 'Rozpatrzono', sortKey: 'acceptedat', muted: true, render: (e: Excuse) => e.acceptedAt ? formatDateTime(e.acceptedAt) : '-' },
                            { header: 'Rozpatrzył', muted: true, render: (e: Excuse) => e.modifiedByName || '-' },
                            {
                                header: '', className: 'w-20', render: (e: Excuse) => (
                                    <ActionButtons isActive onDetails={() => setSelectedExcuseId(e.id)} />
                                )
                            }
                        ]}
                            sortBy={filters.sortBy} sortDesc={filters.sortDesc} onSort={handleSort}
                        />
                    )}
                </div>
                {paginatedData && (
                    <Pagination currentPage={pageNumber} totalPages={paginatedData.totalPages} totalCount={paginatedData.totalCount} pageSize={paginatedData.pageSize} onPageChange={setPageNumber} />
                )}
            </div>

            <ExcuseDetailModal
                excuseId={selectedExcuseId}
                isOpen={selectedExcuseId !== null}
                onClose={() => setSelectedExcuseId(null)}
                onUpdated={loadData}
            />
        </div>
    );
};
