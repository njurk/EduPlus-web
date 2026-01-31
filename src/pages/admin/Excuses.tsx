import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Eye, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { FilterToolbar } from '../../components/ui/FilterToolbar';
import { formatDateTime } from '../../utils/formatters';
import { TrashButton } from '../../components/ui/TrashButton';
import { Modal } from '../../components/modals/Modal';
import type { PaginatedResponse } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';
import { Pagination } from '../../components/ui/Pagination';

interface Excuse {
    id: number;
    parentName: string;
    lessonDate: string;
    isAccepted: boolean | null;
    acceptedAt: string | null;
    modifiedByName: string | null;
    reason: string;
    createdAt: string;
}

export const Excuses = () => {
    const { getText } = useCMSContent('excuses');
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Excuse> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', sortBy: 'createdAt', sortDesc: true, showInactive: false });
    const [detailsModal, setDetailsModal] = useState<Excuse | null>(null);
    const [acceptModal, setAcceptModal] = useState<Excuse | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.excuses.getAll({ pageNumber, pageSize: 20, ...filters });
            setPaginatedData(result);
        } finally { setLoading(false); }
    }, [filters, pageNumber]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);
    useEffect(() => { setPageNumber(1); }, [filters.search, filters.showInactive]);

    const handleSort = (field: string) => {
        setFilters(f => ({ ...f, sortBy: field, sortDesc: f.sortBy === field ? !f.sortDesc : true }));
    };

    const handleAccept = async (id: number, accept: boolean) => {
        await api.excuses.accept(id, accept);
        setAcceptModal(null);
        await loadData();
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć to usprawiedliwienie?')) return;
        await api.excuses.delete(id);
        await loadData();
    };

    const getStatusBadge = (isAccepted: boolean | null) => {
        if (isAccepted === true) return <span className="text-success text-xs font-medium">Zaakceptowane</span>;
        if (isAccepted === false) return <span className="text-danger text-xs font-medium">Odrzucone</span>;
        return <span className="text-warning text-xs font-medium">Oczekujące</span>;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
                <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(f => ({ ...f, showInactive: !f.showInactive }))} />
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <div className="p-3 border-b">
                    <FilterToolbar search={{ value: filters.search, onChange: (v: string) => setFilters(f => ({ ...f, search: v })), placeholder: 'Szukaj...' }} />
                </div>
                <div className="flex-1">
                    {loading ? <LoadingSpinner /> : (
                        <DataTable data={paginatedData?.data || []} columns={[
                            { header: 'Data', sortKey: 'createdAt', render: (e: Excuse) => <span className="text-xs">{formatDateTime(e.createdAt)}</span> },
                            { header: 'Rodzic', sortKey: 'parent', render: (e: Excuse) => <span className="font-medium">{e.parentName}</span> },
                            { header: 'Lekcja', sortKey: 'lessondate', render: (e: Excuse) => <span className="text-xs">{formatDateTime(e.lessonDate)}</span> },
                            { header: 'Status', sortKey: 'isaccepted', render: (e: Excuse) => getStatusBadge(e.isAccepted) },
                            { header: 'Data akceptacji', sortKey: 'acceptedat', render: (e: Excuse) => e.acceptedAt ? <span className="text-xs">{formatDateTime(e.acceptedAt)}</span> : '-' },
                            { header: 'Zaakceptował', sortKey: 'modifiedby', render: (e: Excuse) => e.modifiedByName || '-' },
                            {
                                header: 'Akcje', className: 'text-right w-32', render: (e: Excuse) => (
                                    <div className="flex justify-end gap-1">
                                        <Button variant="soft" onClick={() => setDetailsModal(e)} className="p-1"><Eye size={14} /></Button>
                                        {e.isAccepted === null && (
                                            <Button variant="soft" onClick={() => setAcceptModal(e)} className="p-1 text-success"><Check size={14} /></Button>
                                        )}
                                        {!filters.showInactive && (
                                            <Button variant="soft" onClick={() => handleDelete(e.id)} className="p-1 text-danger"><X size={14} /></Button>
                                        )}
                                    </div>
                                )
                            }
                        ]} emptyMessage="Brak usprawiedliwień"
                            sortBy={filters.sortBy} sortDesc={filters.sortDesc} onSort={handleSort}
                        />
                    )}
                </div>
                {paginatedData && (
                    <Pagination currentPage={pageNumber} totalPages={paginatedData.totalPages} totalCount={paginatedData.totalCount} pageSize={paginatedData.pageSize} onPageChange={setPageNumber} />
                )}
            </div>

            <Modal isOpen={!!detailsModal} onClose={() => setDetailsModal(null)} title="Szczegóły usprawiedliwienia">
                {detailsModal && (
                    <div className="space-y-3 p-4">
                        <div><span className="font-medium">Rodzic:</span> {detailsModal.parentName}</div>
                        <div><span className="font-medium">Data lekcji:</span> {formatDateTime(detailsModal.lessonDate)}</div>
                        <div><span className="font-medium">Data zgłoszenia:</span> {formatDateTime(detailsModal.createdAt)}</div>
                        <div><span className="font-medium">Status:</span> {getStatusBadge(detailsModal.isAccepted)}</div>
                        <div><span className="font-medium">Powód:</span></div>
                        <div className="p-3 bg-neutral-50 rounded text-sm">{detailsModal.reason}</div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!acceptModal} onClose={() => setAcceptModal(null)} title="Akceptacja usprawiedliwienia">
                {acceptModal && (
                    <div className="space-y-4 p-4">
                        <div><span className="font-medium">Rodzic:</span> {acceptModal.parentName}</div>
                        <div><span className="font-medium">Powód:</span></div>
                        <div className="p-3 bg-neutral-50 rounded text-sm">{acceptModal.reason}</div>
                        <div className="flex gap-2 justify-end pt-4">
                            <Button variant="secondary" onClick={() => setAcceptModal(null)}>Anuluj</Button>
                            <Button variant="danger" onClick={() => handleAccept(acceptModal.id, false)}>Odrzuć</Button>
                            <Button onClick={() => handleAccept(acceptModal.id, true)}>Zatwierdź</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
