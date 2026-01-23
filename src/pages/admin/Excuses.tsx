import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Check, X, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SortToolbar } from '../../components/ui/SortToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { TrashButton } from '../../components/ui/TrashButton';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import type { SchoolYear, SemesterDto } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';

export const Excuses = () => {
    const { getText } = useCMSContent('excuses');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [filters, setFilters] = useState({ search: '', sortBy: 'createdAt', sortDesc: true, showInactive: false, yearId: null as number | null, semesterOrder: null as number | null });

    useEffect(() => {
        api.schoolYears.getAll().then(data => {
            setYears(data);
            const active = data.find(y => y.isActive);
            if (active) setFilters(f => ({ ...f, yearId: active.id }));
        });
    }, []);

    useEffect(() => {
        if (filters.yearId) {
            api.classManagement.getSemesters(filters.yearId).then(data => {
                setSemesters(data);
                if (data.length > 0) setFilters(f => ({ ...f, semesterOrder: data[0].order }));
            });
        }
    }, [filters.yearId]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try { setData(await api.excuses.getAll({ ...filters })); } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);

    const handleAccept = async (id: number, accept: boolean) => { await api.excuses.update(id, { isAccepted: accept }); await loadData(); };
    const handleDelete = async (id: number) => { if (!window.confirm("Usunąć?")) return; await api.excuses.delete(id); await loadData(); };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={filters.yearId} onChange={v => setFilters(f => ({ ...f, yearId: v, semesterOrder: null }))} />
                    <SemesterSelector semesters={semesters} selectedOrder={filters.semesterOrder} onChange={v => setFilters(f => ({ ...f, semesterOrder: v }))} showAll />
                    <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(f => ({ ...f, showInactive: !f.showInactive }))} />
                    <Button><Plus size={14} className="mr-1" />{'Dodaj'}</Button>
                </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs">
                <div className="p-3 border-b">
                    <SortToolbar search={filters.search} onSearchChange={v => setFilters(f => ({ ...f, search: v }))}
                        sortBy={filters.sortBy} sortDesc={filters.sortDesc}
                        onSortChange={field => setFilters(f => ({ ...f, sortBy: field, sortDesc: f.sortBy === field ? !f.sortDesc : true }))}
                        sortOptions={[{ field: 'studentName', label: 'Uczeń' }, { field: 'createdAt', label: 'Data' }]}
                    />
                </div>
                {loading ? <LoadingSpinner /> : (
                    <DataTable data={data} columns={[
                        { header: getText('columns.date'), render: e => <span className="text-xs">{formatDateTime(e.createdAt)}</span> },
                        { header: getText('columns.student'), render: e => <span className="font-medium">{e.studentName}</span> },
                        { header: getText('columns.parent'), render: e => e.parentName },
                        { header: getText('columns.period'), render: e => <span className="text-xs">{formatDateTime(e.dateFrom)} - {formatDateTime(e.dateTo)}</span> },
                        { header: getText('columns.reason'), render: e => <div className="truncate max-w-xs text-sm" title={e.reason}>{e.reason}</div> },
                        { header: getText('columns.status'), render: e => <span className={e.isAccepted === true ? 'text-success' : e.isAccepted === false ? 'text-danger' : 'text-warning'}>{e.isAccepted === true ? getText('status.accepted') : e.isAccepted === false ? getText('status.rejected') : getText('status.pending')}</span> },
                        {
                            header: getText('columns.actions'), className: 'text-right', render: e => e.isAccepted === null ? (
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" onClick={() => handleAccept(e.id, true)} className="p-1 text-success"><Check size={14} /></Button>
                                    <Button variant="ghost" onClick={() => handleAccept(e.id, false)} className="p-1 text-danger"><X size={14} /></Button>
                                </div>
                            ) : <Button variant="ghost" onClick={() => handleDelete(e.id)} className="p-1 text-danger text-xs">{getText('actions.delete')}</Button>
                        }
                    ]} emptyMessage={'Brak danych'} />
                )}
            </div>
        </div>
    );
};
