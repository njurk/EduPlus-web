import { useState, useEffect, useCallback } from 'react';
import type { Ticket, PaginatedResponse, TicketReason } from '../../types';
import { api } from '../../services/apiService';
import { RefreshCcw, CheckCircle, Clock, ArrowLeft, Mail, Tag, MessageSquare, Calendar } from 'lucide-react';
import { SearchBar } from '../../components/ui/SearchBar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/formatters';
import { Pagination } from '../../components/ui/Pagination';
import { DetailsModal } from '../../components/modals/DetailsModal';
import { Button } from '../../components/ui/Button';
import { AlertCircle } from 'lucide-react';
import { useCMSContent } from '../../hooks/useCMSContent';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { Editor } from 'primereact/editor';
import { TicketDetailView } from '../../components/views/TicketDetailView';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

type ViewMode = 'list' | 'resolve' | 'viewClosed';

export const Tickets = () => {
    const { getText } = useCMSContent('tickets');
    const [data, setData] = useState<PaginatedResponse<Ticket> | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [filters, setFilters] = useState({ search: '', sortBy: 'created', sortDesc: true, status: 'open' as 'open' | 'closed' | 'all', reasonId: '' as number | '' });
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [reasons, setReasons] = useState<TicketReason[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [adminResponse, setAdminResponse] = useState('');
    const [resolveLoading, setResolveLoading] = useState(false);
    const [resolveError, setResolveError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        api.ticketReasons.getActive().then(setReasons).catch(console.error);
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
                filters.reasonId || undefined
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
        if (ticket.isClosed) {
            setSelectedTicket(ticket);
            setViewMode('viewClosed');
        } else {
            setSelectedTicket(ticket);
            setIsDetailsOpen(true);
        }
    };

    const openResolve = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setAdminResponse('');
        setResolveError(null);
        setSuccessMessage(null);
        setViewMode('resolve');
    };

    const handleResolve = async () => {
        if (!adminResponse.trim()) {
            setResolveError('Odpowiedź jest wymagana');
            return;
        }

        setResolveLoading(true);
        setResolveError(null);
        try {
            await api.tickets.close(selectedTicket!.id, { adminResponse });
            setSuccessMessage('Zgłoszenie zostało zamknięte. Odpowiedź wysłano na email zgłaszającego.');
            backToList();
        } catch (e: any) {
            setResolveError(e.message || 'Błąd podczas zamykania zgłoszenia');
        } finally {
            setResolveLoading(false);
        }
    };

    const backToList = () => {
        setViewMode('list');
        setSelectedTicket(null);
        setAdminResponse('');
        setResolveError(null);
        setIsDetailsOpen(false);
        loadData();
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    if (viewMode === 'viewClosed' && selectedTicket) {
        return (
            <TicketDetailView
                ticket={selectedTicket}
                title={`Zgłoszenie nr ${selectedTicket.id}`}
                onBack={backToList}
                extraDetailsItems={
                    <>
                        <div className="flex items-start gap-3">
                            <Calendar size={16} className="text-neutral-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-neutral-500">Data zamknięcia</p>
                                <p className="text-sm font-medium text-neutral-800">{selectedTicket.closedAt ? formatDate(selectedTicket.closedAt) : '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Tag size={16} className="text-neutral-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-neutral-500">Rozpatrzone przez</p>
                                <p className="text-sm font-medium text-neutral-800">{selectedTicket.modifiedByName || 'System'}</p>
                            </div>
                        </div>
                    </>
                }
            >
                <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <h2 className="font-semibold text-neutral-800 border-b pb-2 mb-4">Odpowiedź</h2>
                    <div className="text-sm text-neutral-700" dangerouslySetInnerHTML={{ __html: selectedTicket.adminResponse || '' }} />
                </div>
            </TicketDetailView>
        );
    }

    if (viewMode === 'resolve' && selectedTicket) {


        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={backToList} className="text-neutral-500 hover:text-primary transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-neutral-800">Obsługa zgłoszenia nr {selectedTicket.id}</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
                            <h2 className="font-semibold text-neutral-800 border-b pb-2">Szczegóły</h2>

                            <div className="flex items-start gap-3">
                                <Mail size={16} className="text-neutral-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-neutral-500">Email</p>
                                    <p className="text-sm font-medium text-neutral-800">{selectedTicket.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Tag size={16} className="text-neutral-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-neutral-500">Powód</p>
                                    <p className="text-sm font-medium text-neutral-800">{selectedTicket.reasonName}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar size={16} className="text-neutral-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-neutral-500">Data zgłoszenia</p>
                                    <p className="text-sm font-medium text-neutral-800">{formatDate(selectedTicket.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white border border-neutral-200 rounded-lg p-6">
                            <h2 className="font-semibold text-neutral-800 border-b pb-2 mb-4">Treść zgłoszenia</h2>
                            <div>
                                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selectedTicket.content}</p>
                            </div>
                        </div>

                        <div className="bg-white border border-neutral-200 rounded-lg p-6">
                            <h2 className="font-semibold text-neutral-800 border-b pb-2 mb-4">Odpowiedź <span className="text-red-500">*</span></h2>
                            {resolveError && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                                    <AlertCircle size={16} /> {resolveError}
                                </div>
                            )}

                            <div className="mb-4">
                                <Editor
                                    value={adminResponse}
                                    onTextChange={(e) => setAdminResponse(e.htmlValue || '')}
                                    style={{ height: '300px' }}
                                    headerTemplate={
                                        <span className="ql-formats">
                                            <button className="ql-bold" aria-label="Bold"></button>
                                            <button className="ql-italic" aria-label="Italic"></button>
                                            <button className="ql-underline" aria-label="Underline"></button>
                                            <button className="ql-list" value="ordered" aria-label="Ordered List"></button>
                                            <button className="ql-list" value="bullet" aria-label="Bullet List"></button>
                                            <button className="ql-link" aria-label="Link"></button>
                                        </span>
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <p className="text-xs text-neutral-500">
                                    <Mail size={12} className="inline mr-1" />
                                    Odpowiedź zostanie wysłana na: <strong>{selectedTicket.email}</strong>
                                </p>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={backToList} disabled={resolveLoading}>
                                        Anuluj
                                    </Button>
                                    <Button onClick={handleResolve} disabled={resolveLoading}>
                                        {resolveLoading ? 'Wysyłanie...' : 'Wyślij i zamknij'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
            </div>

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-3">
                    <CheckCircle size={20} />
                    <span>{successMessage}</span>
                </div>
            )}

            <div className="bg-white border border-neutral-200 rounded-xs">
                <div className="p-3 border-b flex items-center gap-4">
                    <SearchBar value={filters.search} onChange={v => setFilters(p => ({ ...p, search: v }))} className="max-w-xs" />
                    <select
                        value={filters.reasonId}
                        onChange={e => { setFilters(p => ({ ...p, reasonId: e.target.value ? Number(e.target.value) : '' })); setPageNumber(1); }}
                        className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[160px]"
                    >
                        <option value="">Wszystkie powody</option>
                        {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
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
                                columns={[
                                    { header: getText('columns.email'), sortKey: 'email', render: (t) => <div className="text-neutral-900 font-medium">{t.email}</div> },
                                    { header: getText('columns.reason'), sortKey: 'reason', render: (t) => <span className="text-neutral-900">{t.reasonName}</span> },
                                    { header: getText('columns.status'), className: 'w-32 text-center', render: (t) => t.isClosed ? <span className="text-xs text-success flex items-center gap-1 justify-center"><CheckCircle size={14} /> Zamknięte</span> : <span className="text-xs text-warning flex items-center gap-1 justify-center"><Clock size={14} /> Otwarte</span> },
                                    { header: getText('columns.closedAt'), sortKey: 'closedat', render: (t) => t.closedAt ? <span className="text-neutral-500 text-xs">{formatDate(t.closedAt)}</span> : <span className="text-neutral-300">-</span> },
                                    { header: getText('columns.createdAt'), sortKey: 'created', render: (t) => <span className="text-neutral-600 text-xs">{formatDate(t.createdAt)}</span> },
                                    { header: getText('columns.modifiedBy'), render: (t) => <span className="text-neutral-500 text-xs">{t.modifiedByName || 'System'}</span> },
                                    {
                                        header: getText('columns.actions'), className: 'w-32 text-right', render: (t) => (
                                            <ActionButtons
                                                onDetails={() => openDetails(t)}
                                                onEdit={!t.isClosed ? () => openResolve(t) : undefined}
                                                editLabel="Rozwiąż"
                                                editIcon={MessageSquare}
                                            />
                                        )
                                    }
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
                title={`Zgłoszenie nr ${selectedTicket?.id}`}
                data={selectedTicket ? {
                    email: selectedTicket.email,
                    reasonName: selectedTicket.reasonName,
                    content: selectedTicket.content,
                    status: selectedTicket.isClosed ? 'Zamknięte' : 'Otwarte',
                    createdAt: selectedTicket.createdAt,
                    closedAt: selectedTicket.closedAt,
                    adminResponse: selectedTicket.adminResponse
                } : {}}
                labels={{
                    email: 'Email zgłaszającego',
                    reasonName: 'Powód',
                    content: 'Treść',
                    status: 'Status',
                    createdAt: 'Data utworzenia',
                    closedAt: 'Data zamknięcia',
                    adminResponse: 'Odpowiedź'
                }}
                excludeKeys={['id']}
                maxWidth="lg"
                customFooter={
                    <>
                        <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Zamknij okno</Button>
                        {selectedTicket && !selectedTicket.isClosed && (
                            <Button onClick={() => { setIsDetailsOpen(false); openResolve(selectedTicket); }}>
                                Obsłuż zgłoszenie
                            </Button>
                        )}
                    </>
                }
            />
        </div>
    );
};

