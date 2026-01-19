import { useState, useEffect, useCallback } from 'react';
import type { Ticket, PaginatedResponse } from '../../types';
import { api } from '../../services/apiService';
import { RefreshCcw, CheckCircle, Clock } from 'lucide-react';
import { SearchBar } from '../../components/ui/SearchBar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/formatters';
import { Pagination } from '../../components/ui/Pagination';
import { TicketDetailsModal } from '../../components/modals/TicketDetailsModal';
import { useCMSContent } from '../../hooks/useCMSContent';

export const Tickets = () => {
    const { getText } = useCMSContent('tickets');
    const [data, setData] = useState<PaginatedResponse<Ticket> | null>(null);
    const [allUsers, setAllUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [filters, setFilters] = useState({ search: '', sortBy: 'created', sortDesc: true, showClosed: false, userFullName: '' });
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.tickets.getAll(
                pageNumber, 10,
                filters.showClosed ? undefined : false,
                filters.search,
                filters.sortBy,
                filters.sortDesc,
                filters.userFullName || undefined
            );
            setData(response);
            if (!filters.userFullName && !filters.search) {
                setAllUsers([...new Set(response.data.map(t => t.userFullName).filter(Boolean))] as string[]);
            }
        } catch (error) {
            console.error(error);
            alert("Błąd pobierania zgłoszeń");
        } finally {
            setLoading(false);
        }
    }, [pageNumber, filters]);

    useEffect(() => {
        const id = setTimeout(loadData, 300);
        return () => clearTimeout(id);
    }, [loadData]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs">
                <div className="p-3 border-b flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <SearchBar value={filters.search} onChange={v => setFilters(p => ({ ...p, search: v }))} className="max-w-xs" />
                        <select
                            value={filters.userFullName}
                            onChange={e => setFilters(p => ({ ...p, userFullName: e.target.value }))}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[160px]"
                        >
                            <option value="">Wszyscy użytkownicy</option>
                            {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={filters.showClosed}
                                onChange={(e) => { setFilters(p => ({ ...p, showClosed: e.target.checked })); setPageNumber(1); }}
                                className="rounded border-neutral-300 text-primary focus:ring-primary"
                            />
                            {getText('filter.showClosed')}
                        </label>
                    </div>
                </div>

                <div className="flex-1 bg-white">
                    {loading && !data ? (
                        <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                            <RefreshCcw className="animate-spin" size={24} /> Ładowanie...
                        </div>
                    ) : (
                        <>
                            <DataTable
                                data={data?.data || []}
                                sortBy={filters.sortBy}
                                sortDesc={filters.sortDesc}
                                onSort={f => setFilters(p => p.sortBy === f ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: f, sortDesc: true })}
                                onRowClick={(ticket) => { setSelectedTicket(ticket); setIsDetailsOpen(true); }}
                                columns={[
                                    { header: getText('columns.submitter'), sortKey: 'user', render: (t) => <div><div className="text-neutral-900 font-medium">{t.userFullName}</div></div> },
                                    { header: getText('columns.subject'), render: (t) => <span className="text-neutral-900">{t.subject}</span> },
                                    { header: getText('columns.status'), className: 'w-24 text-center', render: (t) => t.isClosed ? <span className="text-xs text-neutral-500 flex items-center gap-1 justify-center"><CheckCircle size={14} /> Tak</span> : <span className="text-xs text-warning flex items-center gap-1 justify-center"><Clock size={14} /> Nie</span> },
                                    { header: getText('columns.closedAt'), sortKey: 'closedat', render: (t) => t.closedAt ? <span className="text-neutral-500 text-xs">{formatDate(t.closedAt)}</span> : <span className="text-neutral-300">-</span> },
                                    { header: getText('columns.createdAt'), sortKey: 'created', render: (t) => <span className="text-neutral-600 text-xs">{formatDate(t.createdAt)}</span> },
                                    { header: 'Edytowano', sortKey: 'updated', render: (t) => <span className="text-neutral-500 text-xs">{formatDate(t.updatedAt)}</span> },
                                    { header: 'Edytowane przez', render: (t) => <span className="text-neutral-500 text-xs">{t.modifiedByName || 'System'}</span> }
                                ]}
                                emptyMessage={'Brak danych'}
                            />

                            {data && (
                                <Pagination
                                    currentPage={data.pageNumber}
                                    totalPages={data.totalPages}
                                    onPageChange={setPageNumber}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            <TicketDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                ticket={selectedTicket}
                onTicketClosed={async () => { await loadData(); }}
            />
        </div>
    );
};
