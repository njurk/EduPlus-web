import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { RefreshCcw, Check, X, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SortToolbar } from '../../components/ui/SortToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/formatters';
import { TrashButton } from '../../components/ui/TrashButton';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import type { SchoolYear, SemesterDto } from '../../types';

export const Excuses = () => {
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
                <h1 className="text-2xl font-bold text-neutral-800">Usprawiedliwienia</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={filters.yearId} onChange={v => setFilters(f => ({ ...f, yearId: v, semesterOrder: null }))} />
                    <SemesterSelector semesters={semesters} selectedOrder={filters.semesterOrder} onChange={v => setFilters(f => ({ ...f, semesterOrder: v }))} showAll />
                    <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(f => ({ ...f, showInactive: !f.showInactive }))} />
                    <Button><Plus size={14} className="mr-1" />Dodaj</Button>
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
                {loading ? <div className="flex items-center justify-center h-32 text-neutral-400"><RefreshCcw className="animate-spin mr-2" size={16} />Ładowanie...</div> : (
                    <DataTable data={data} columns={[
                        { header: 'Data', render: e => <span className="text-xs">{formatDate(e.createdAt)}</span> },
                        { header: 'Uczeń', render: e => <span className="font-medium">{e.studentName}</span> },
                        { header: 'Rodzic', render: e => e.parentName },
                        { header: 'Okres', render: e => <span className="text-xs">{formatDate(e.dateFrom)} - {formatDate(e.dateTo)}</span> },
                        { header: 'Powód', render: e => <div className="truncate max-w-xs text-sm" title={e.reason}>{e.reason}</div> },
                        { header: 'Status', render: e => <span className={e.isAccepted === true ? 'text-success' : e.isAccepted === false ? 'text-danger' : 'text-warning'}>{e.isAccepted === true ? 'OK' : e.isAccepted === false ? 'Odrzucone' : 'Oczekuje'}</span> },
                        {
                            header: 'Akcje', className: 'text-right', render: e => e.isAccepted === null ? (
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" onClick={() => handleAccept(e.id, true)} className="p-1 text-success"><Check size={14} /></Button>
                                    <Button variant="ghost" onClick={() => handleAccept(e.id, false)} className="p-1 text-danger"><X size={14} /></Button>
                                </div>
                            ) : <Button variant="ghost" onClick={() => handleDelete(e.id)} className="p-1 text-danger text-xs">Usuń</Button>
                        }
                    ]} emptyMessage="Brak" />
                )}
            </div>
        </div>
    );
};
