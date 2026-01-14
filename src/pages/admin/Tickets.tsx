import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Ticket, PaginatedResponse } from '../../types';
import { api } from '../../services/apiService';
import { RefreshCcw, CheckCircle, Clock, Plus } from 'lucide-react';
import { SortFilterToolbar } from '../../components/ui/SortFilterToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/formatters';
import { Pagination } from '../../components/ui/Pagination';
import { TicketDetailsModal } from '../../components/modals/TicketDetailsModal';
import { Modal } from '../../components/ui/Modal';

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
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTicketSubject, setNewTicketSubject] = useState('');

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

    const handleCreateTicket = async () => {
        if (!newTicketSubject.trim()) return;
        try {
            await api.tickets.create({ subject: newTicketSubject });
            setIsCreateOpen(false);
            setNewTicketSubject('');
            loadData();
        } catch (e) {
            alert("Błąd tworzenia zgłoszenia");
        }
    };

    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans flex flex-col min-h-[600px] rounded-lg overflow-hidden">
            <div className="border-b px-6 py-4 flex justify-between items-center bg-neutral-50/30">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">Zgłoszenia</h2>
                    <p className="text-sm text-neutral-500">Zarządzaj zgłoszeniami użytkowników i problemami technicznymi</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus size={16} className="mr-2" /> Nowe zgłoszenie
                </Button>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 border-b bg-white">
                <SortFilterToolbar
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
                    hideCreate={true}
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

            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Nowe zgłoszenie"
                footer={<><Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Anuluj</Button><Button onClick={handleCreateTicket}>Wyślij</Button></>}
            >
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Temat zgłoszenia</label>
                    <Input
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        placeholder="Opisz krótko problem..."
                        autoFocus
                    />
                    <p className="text-xs text-neutral-500 mt-2">
                        Zgłoszenie zostanie wysłane do administratorów systemu.
                    </p>
                </div>
            </Modal>
        </div>
    );
};
