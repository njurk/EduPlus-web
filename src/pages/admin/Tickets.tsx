import { useState, useEffect, useCallback } from 'react';
import type { Ticket, PaginatedResponse } from '../../types';
import { api } from '../../services/apiService';
import { RefreshCcw, CheckCircle, Clock } from 'lucide-react';
import { SortToolbar } from '../../components/ui/SortToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/formatters';
import { Pagination } from '../../components/ui/Pagination';
import { TicketDetailsModal } from '../../components/modals/TicketDetailsModal';

export const Tickets = () => {
    const [data, setData] = useState<PaginatedResponse<Ticket> | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [search, setSearch] = useState('');
    const [showClosed, setShowClosed] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDesc, setSortDesc] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.tickets.getAll(pageNumber, 10, showClosed ? undefined : false, search, sortBy, sortDesc);
            setData(response);
        } catch (error) {
            console.error(error);
            alert("Błąd pobierania zgłoszeń");
        } finally {
            setLoading(false);
        }
    }, [pageNumber, showClosed, search, sortBy, sortDesc]);

    useEffect(() => {
        const id = setTimeout(loadData, 300);
        return () => clearTimeout(id);
    }, [loadData]);

    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans flex flex-col min-h-[600px]">
            <div className="border-b px-6 py-4 flex justify-between items-center pb-4 bg-neutral-50/30">
                <h2 className="text-xl font-bold text-neutral-800">Zgłoszenia</h2>
            </div>

            <div className="flex items-center justify-between gap-4 py-4 border-b bg-white">
                <SortToolbar
                    className="flex-1"
                    search={search}
                    onSearchChange={setSearch}
                    sortBy={sortBy}
                    sortDesc={sortDesc}
                    onSortChange={(field) => {
                        if (sortBy === field) setSortDesc(!sortDesc);
                        else { setSortBy(field); setSortDesc(true); }
                    }}
                    sortOptions={[
                        { field: 'createdAt', label: 'Data utworzenia' },
                        { field: 'subject', label: 'Temat' },
                        { field: 'userFullName', label: 'Użytkownik' }
                    ]}
                />
                <div className="flex items-center gap-2 px-4 border-l">
                    <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showClosed}
                            onChange={(e) => { setShowClosed(e.target.checked); setPageNumber(1); }}
                            className="rounded border-neutral-300 text-primary focus:ring-primary"
                        />
                        Pokaż zamknięte
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
                            onRowClick={(ticket) => { setSelectedTicket(ticket); setIsDetailsOpen(true); }}
                            columns={[
                                { header: 'Status', className: 'w-12', render: (t) => t.isClosed ? <CheckCircle size={18} className="text-neutral-400" /> : <Clock size={18} className="text-warning" /> },
                                { header: 'Temat', accessor: 'subject', className: 'font-medium text-neutral-900 w-1/3' },
                                { header: 'Zgłaszający', render: (t) => <div><div className="text-neutral-900">{t.userFullName}</div><div className="text-xs text-neutral-500">{t.userEmail}</div></div> },
                                { header: 'Utworzono', render: (t) => <span className="text-neutral-600 text-sm">{formatDate(t.createdAt)}</span> },
                                { header: 'Zamknięto', render: (t) => t.closedAt ? <span className="text-neutral-500 text-sm">{formatDate(t.closedAt)}</span> : <span className="text-neutral-300">-</span> }
                            ]}
                            emptyMessage="Brak zgłoszeń spełniających kryteria"
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

            <TicketDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                ticket={selectedTicket}
                onTicketClosed={() => { loadData(); }}
            />
        </div>
    );
};

