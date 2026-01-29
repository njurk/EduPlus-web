import { useState, useEffect, useCallback } from 'react';
import type { Ticket, PaginatedResponse, TicketReason } from '../../types';
import { api } from '../../services/apiService';
import { CheckCircle, Clock, ArrowLeft, Mail, Tag, MessageSquare, Calendar } from 'lucide-react';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { Pagination } from '../../components/ui/Pagination';
import { DetailsModal } from '../../components/modals/DetailsModal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AlertCircle } from 'lucide-react';
import { useCMSContent } from '../../hooks/useCMSContent';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { Editor } from 'primereact/editor';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface TicketDetailViewProps {
    ticket: Ticket;
    title: string;
    onBack: () => void;
    extraDetailsItems?: React.ReactNode;
    children: React.ReactNode;
}

const TicketDetailView = ({ ticket, title, onBack, extraDetailsItems, children }: TicketDetailViewProps) => (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-neutral-500 hover:text-primary transition-colors"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-neutral-800">{title}</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold text-neutral-800 border-b pb-2">Szczegóły</h2>
                    <div className="flex items-start gap-3">
                        <Mail size={16} className="text-neutral-400 mt-0.5" />
                        <div><p className="text-xs text-neutral-500">Email</p><p className="text-sm font-medium text-neutral-800">{ticket.email}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Tag size={16} className="text-neutral-400 mt-0.5" />
                        <div><p className="text-xs text-neutral-500">Powód</p><p className="text-sm font-medium text-neutral-800">{ticket.reasonName}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Calendar size={16} className="text-neutral-400 mt-0.5" />
                        <div><p className="text-xs text-neutral-500">Data zgłoszenia</p><p className="text-sm font-medium text-neutral-800">{formatDateTime(ticket.createdAt)}</p></div>
                    </div>
                    {extraDetailsItems}
                </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <h2 className="font-semibold text-neutral-800 border-b pb-2 mb-4">Treść zgłoszenia</h2>
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{ticket.content}</p>
                </div>
                {children}
            </div>
        </div>
    </div>
);

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
        } finally {
            setLoading(false);
        }
    }, [pageNumber, filters]);

    useEffect(() => {
        const id = setTimeout(loadData, 300);
        return () => clearTimeout(id);
    }, [loadData]);

    const openDetails = async (ticket: Ticket) => {
        if (!ticket.isRead) {
            api.tickets.markAsRead(ticket.id).catch(console.error);
            setData(prev => prev ? {
                ...prev,
                data: prev.data.map(t => t.id === ticket.id ? { ...t, isRead: true } : t)
            } : null);
        }
        if (ticket.isClosed) {
            setSelectedTicket(ticket);
            setViewMode('viewClosed');
        } else {
            setSelectedTicket(ticket);
            setIsDetailsOpen(true);
        }
    };

    const openResolve = (ticket: Ticket) => {
        if (!ticket.isRead) {
            api.tickets.markAsRead(ticket.id).catch(console.error);
            setData(prev => prev ? {
                ...prev,
                data: prev.data.map(t => t.id === ticket.id ? { ...t, isRead: true } : t)
            } : null);
        }
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
                                <p className="text-sm font-medium text-neutral-800">{selectedTicket.closedAt ? formatDateTime(selectedTicket.closedAt) : '-'}</p>
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
                                    <p className="text-sm font-medium text-neutral-800">{formatDateTime(selectedTicket.createdAt)}</p>
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

                            <div className="flex items-center justify-end pt-4 border-t">
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

            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <FilterToolbar
                    search={{ value: filters.search, onChange: v => setFilters(p => ({ ...p, search: v })) }}
                    onReset={() => { setFilters(p => ({ ...p, search: '', reasonId: '', status: 'all' })); setPageNumber(1); }}
                >
                    <FilterSelect
                        value={filters.reasonId}
                        onChange={v => { setFilters(p => ({ ...p, reasonId: v ? Number(v) : '' })); setPageNumber(1); }}
                        options={reasons.map(r => ({ value: r.id, label: r.name }))}
                        placeholder="Wszystkie powody"
                        minWidth="160px"
                        parseAsNumber={true}
                    />
                    <FilterSelect
                        value={filters.status}
                        onChange={v => { setFilters(p => ({ ...p, status: (v || 'all') as 'open' | 'closed' | 'all' })); setPageNumber(1); }}
                        options={[{ value: 'open', label: 'Otwarte' }, { value: 'closed', label: 'Zamknięte' }]}
                        placeholder="Wszystkie statusy"
                        minWidth="140px"
                        parseAsNumber={false}
                    />
                </FilterToolbar>

                <div className="flex-1 bg-white">
                    {loading && !data ? (
                        <LoadingSpinner className="py-12" />
                    ) : (
                        <DataTable
                            data={data?.data || []}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={f => setFilters(p => p.sortBy === f ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: f, sortDesc: true })}
                            columns={[
                                { header: getText('columns.createdAt'), sortKey: 'created', className: 'w-36', render: (t) => <span className="text-neutral-600 text-xs">{formatDateTime(t.createdAt)}</span> },
                                {
                                    header: getText('columns.email'), sortKey: 'email', render: (t) => (
                                        <div className="flex items-center gap-2">
                                            <span className="text-neutral-900 font-medium">{t.email}</span>
                                            <Badge variant="new" show={t.isRead === false} />
                                        </div>
                                    )
                                },
                                { header: getText('columns.reason'), sortKey: 'reason', render: (t) => <span className="text-neutral-900">{t.reasonName}</span> },
                                { header: getText('columns.status'), className: 'w-32 text-center', render: (t) => t.isClosed ? <span className="text-xs text-success flex items-center gap-1 justify-center"><CheckCircle size={14} /> Zamknięte</span> : <span className="text-xs text-warning flex items-center gap-1 justify-center"><Clock size={14} /> Otwarte</span> },
                                { header: getText('columns.closedAt'), sortKey: 'closedat', render: (t) => t.closedAt ? <span className="text-neutral-500 text-xs">{formatDateTime(t.closedAt)}</span> : <span className="text-neutral-300">-</span> },
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
                    )}
                </div>
                {data && (
                    <Pagination
                        currentPage={data.pageNumber}
                        totalPages={data.totalPages}
                        totalCount={data.totalCount}
                        pageSize={data.pageSize}
                        onPageChange={setPageNumber}
                    />
                )}
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

