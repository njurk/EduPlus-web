import { useState, useEffect, useCallback } from 'react';
import type { Ticket, PaginatedResponse } from '../../types';
import { api } from '../../services/apiService';
import { RefreshCcw, CheckCircle, Clock } from 'lucide-react';
import { SearchBar } from '../../components/ui/SearchBar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/formatters';
import { Pagination } from '../../components/ui/Pagination';
import { DetailsModal } from '../../components/modals/DetailsModal';
import { Modal } from '../../components/modals/Modal';
import { Button } from '../../components/ui/Button';
import { AlertCircle } from 'lucide-react';
import { useCMSContent } from '../../hooks/useCMSContent';
import { ActionButtons } from '../../components/ui/ActionButtons';

export const Tickets = () => {
    const { getText } = useCMSContent('tickets');
    const [data, setData] = useState<PaginatedResponse<Ticket> | null>(null);
    const [allSubmitters, setAllSubmitters] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [filters, setFilters] = useState({ search: '', sortBy: 'created', sortDesc: true, status: 'open' as 'open' | 'closed' | 'all', userFullName: '' });
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [adminResponse, setAdminResponse] = useState('');
    const [closeLoading, setCloseLoading] = useState(false);
    const [closeError, setCloseError] = useState<string | null>(null);

    useEffect(() => {
        api.tickets.getSubmitters().then(setAllSubmitters).catch(console.error);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const isClosed = filters.status === 'all' ? undefined : filters.status === 'closed';
            const response = await api.tickets.getAll(
                pageNumber, 10,
                isClosed,
                filters.search,
                filters.sortBy,
                filters.sortDesc,
                filters.userFullName || undefined
            );
            setData(response);
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

    const openDetails = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsDetailsOpen(true);
    };

    const handleCloseTicket = async () => {
        if (!adminResponse.trim()) {
            setCloseError("Wprowadź odpowiedź dla zgłaszającego");
            return;
        }

        if (!window.confirm("Czy na pewno chcesz zamknąć to zgłoszenie? Ta operacja jest nieodwracalna.")) return;

        setCloseLoading(true);
        setCloseError(null);
        try {
            await api.tickets.close(selectedTicket!.id, { adminResponse });
            await loadData();
            setIsCloseModalOpen(false);
            setIsDetailsOpen(false);
            setAdminResponse('');
        } catch (e: any) {
            setCloseError(e.message || "Błąd podczas zamykania zgłoszenia");
        } finally {
            setCloseLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs">
                <div className="p-3 border-b flex items-center gap-4">
                    <SearchBar value={filters.search} onChange={v => setFilters(p => ({ ...p, search: v }))} className="max-w-xs" />
                    <select
                        value={filters.userFullName}
                        onChange={e => setFilters(p => ({ ...p, userFullName: e.target.value }))}
                        className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[160px]"
                    >
                        <option value="">Wszyscy użytkownicy</option>
                        {allSubmitters.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <select
                        value={filters.status}
                        onChange={e => { setFilters(p => ({ ...p, status: e.target.value as 'open' | 'closed' | 'all' })); setPageNumber(1); }}
                        className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[140px]"
                    >
                        <option value="all">Wszystkie</option>
                        <option value="open">Otwarte</option>
                        <option value="closed">Zamknięte</option>
                    </select>
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
                                    { header: 'Edytowane przez', render: (t) => <span className="text-neutral-500 text-xs">{t.modifiedByName || 'System'}</span> },
                                    { header: 'Akcje', className: 'w-20 text-right', render: (t) => <ActionButtons onDetails={() => openDetails(t)} /> }
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

            <DetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title={`Zgłoszenie #${selectedTicket?.id}`}
                data={selectedTicket ? {
                    userFullName: selectedTicket.userFullName,
                    userEmail: selectedTicket.userEmail,
                    subject: selectedTicket.subject,
                    status: selectedTicket.isClosed ? 'Zamknięte' : 'Otwarte',
                    createdAt: selectedTicket.createdAt,
                    closedAt: selectedTicket.closedAt,
                    adminResponse: selectedTicket.adminResponse
                } : {}}
                labels={{
                    userFullName: 'Zgłaszający',
                    userEmail: 'Email',
                    subject: 'Temat',
                    status: 'Status',
                    createdAt: 'Data utworzenia',
                    closedAt: 'Data zamknięcia',
                    adminResponse: 'Odpowiedź administratora'
                }}
                excludeKeys={['id']}
                maxWidth="lg"
                customFooter={
                    <>
                        <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Zamknij okno</Button>
                        {selectedTicket && !selectedTicket.isClosed && (
                            <Button onClick={() => { setIsCloseModalOpen(true); }}>
                                Zamknij zgłoszenie
                            </Button>
                        )}
                    </>
                }
            />

            <Modal
                isOpen={isCloseModalOpen}
                onClose={() => { setIsCloseModalOpen(false); setCloseError(null); }}
                title="Zamknij zgłoszenie"
                maxWidth="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setIsCloseModalOpen(false); setCloseError(null); }} disabled={closeLoading}>Anuluj</Button>
                        <Button onClick={handleCloseTicket} disabled={closeLoading}>
                            {closeLoading ? 'Zamykanie...' : 'Zamknij zgłoszenie'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 px-6 py-4">
                    {closeError && (
                        <div className="p-3 bg-danger-light text-danger-text text-sm rounded flex items-center gap-2">
                            <AlertCircle size={16} /> {closeError}
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-neutral-500 uppercase font-semibold mb-2 block">Twoja odpowiedź</label>
                        <textarea
                            className="w-full p-3 border border-neutral-300 rounded-md min-h-[120px] focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                            placeholder="Opisz rozwiązanie problemu lub odpowiedź dla użytkownika..."
                            value={adminResponse}
                            onChange={(e) => { setAdminResponse(e.target.value); setCloseError(null); }}
                            disabled={closeLoading}
                        />
                        <div className="text-xs text-neutral-500 mt-2">
                            Zamknięcie zgłoszenia wyśle automatyczną wiadomość email do użytkownika.
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
