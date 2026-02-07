import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Eye, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import { Modal } from '../../components/modals/Modal';
import type { PaginatedResponse } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';
import { Pagination } from '../../components/ui/Pagination';

interface Excuse {
    id: number;
    parentName: string;
    studentName: string;
    className: string | null;
    isAccepted: boolean | null;
    acceptedAt: string | null;
    modifiedByName: string | null;
    reason: string;
    createdAt: string;
    attendanceCount: number;
}

interface ExcuseDetails extends Excuse {
    attendances: { id: number; date: string; subjectName: string; lessonHour: number }[];
}

export const Excuses = () => {
    const { getText } = useCMSContent('excuses');
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Excuse> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'createdAt',
        sortDesc: true,
        statusFilter: '' as string,
        classId: null as number | null
    });
    const [detailsModal, setDetailsModal] = useState<ExcuseDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    useEffect(() => {
        api.classes.getAll({ pageSize: 1000 }).then(r => setClasses(r.map((c: any) => ({ id: c.id, name: `${c.level}${c.letter}` }))));
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.excuses.getAll({
                pageNumber,
                pageSize: 20,
                search: filters.search,
                sortBy: filters.sortBy,
                sortDesc: filters.sortDesc,
                statusFilter: filters.statusFilter || undefined,
                classId: filters.classId || undefined
            });
            setPaginatedData(result);
        } finally { setLoading(false); }
    }, [filters, pageNumber]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);
    useEffect(() => { setPageNumber(1); }, [filters.search, filters.statusFilter, filters.classId]);

    const handleSort = (field: string) => {
        setFilters(f => ({ ...f, sortBy: field, sortDesc: f.sortBy === field ? !f.sortDesc : true }));
    };

    const openDetails = async (id: number, edit: boolean = false) => {
        setDetailsLoading(true);
        setEditMode(edit);
        try {
            const details = await api.excuses.getById(id);
            setDetailsModal(details);
            setSelectedStatus(details.isAccepted === true ? 'accepted' : details.isAccepted === false ? 'rejected' : 'pending');
        } finally { setDetailsLoading(false); }
    };

    const handleSaveStatus = async () => {
        if (!detailsModal) return;
        const isAccepted = selectedStatus === 'accepted' ? true : selectedStatus === 'rejected' ? false : null;
        await api.excuses.accept(detailsModal.id, isAccepted);
        setDetailsModal(null);
        setEditMode(false);
        await loadData();
    };

    const handleAccept = async (accept: boolean) => {
        if (!detailsModal) return;
        await api.excuses.accept(detailsModal.id, accept);
        setDetailsModal(null);
        await loadData();
    };


    const getStatusBadge = (isAccepted: boolean | null) => {
        if (isAccepted === true) return <span className="text-success font-medium">Zaakceptowane</span>;
        if (isAccepted === false) return <span className="text-danger font-medium">Odrzucone</span>;
        return <span className="text-warning font-medium">Oczekujące</span>;
    };

    const statusOptions = [
        { value: 'pending', label: 'Oczekujące' },
        { value: 'accepted', label: 'Zaakceptowane' },
        { value: 'rejected', label: 'Odrzucone' }
    ];

    const editStatusOptions = [
        { value: 'pending', label: 'Oczekujące' },
        { value: 'accepted', label: 'Zaakceptowane' },
        { value: 'rejected', label: 'Odrzucone' }
    ];

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <FilterToolbar
                    search={{ value: filters.search, onChange: (v: string) => setFilters(f => ({ ...f, search: v })), placeholder: 'Szukaj...' }}
                    onReset={() => setFilters(f => ({ ...f, search: '', statusFilter: '', classId: null }))}
                    rightContent={null}
                >
                    <FilterSelect
                        label="Status:"
                        value={filters.statusFilter || null}
                        onChange={v => setFilters(f => ({ ...f, statusFilter: v ? String(v) : '' }))}
                        options={statusOptions}
                        placeholder="Wszystkie"
                        minWidth="140px"
                        parseAsNumber={false}
                    />
                    <FilterSelect
                        label="Klasa:"
                        value={filters.classId}
                        onChange={v => setFilters(f => ({ ...f, classId: v ? Number(v) : null }))}
                        options={classes.map(c => ({ value: c.id, label: c.name }))}
                        placeholder="Wszystkie"
                        minWidth="100px"
                    />
                </FilterToolbar>
                <div className="flex-1">
                    {loading ? <LoadingSpinner /> : (
                        <DataTable data={paginatedData?.data || []} columns={[
                            { header: 'Przesłano', sortKey: 'createdAt', muted: true, render: (e: Excuse) => formatDateTime(e.createdAt) },
                            { header: 'Rodzic', sortKey: 'parent', bold: true, render: (e: Excuse) => e.parentName },
                            { header: 'Uczeń', sortKey: 'student', bold: true, render: (e: Excuse) => e.studentName },
                            { header: 'Klasa', render: (e: Excuse) => e.className || '-' },
                            { header: 'Godziny', render: (e: Excuse) => e.attendanceCount, className: 'text-center w-16' },
                            { header: 'Status', sortKey: 'isaccepted', render: (e: Excuse) => getStatusBadge(e.isAccepted) },
                            { header: 'Rozpatrzono', sortKey: 'acceptedat', muted: true, render: (e: Excuse) => e.acceptedAt ? formatDateTime(e.acceptedAt) : '-' },
                            { header: 'Rozpatrzył', muted: true, render: (e: Excuse) => e.modifiedByName || '-' },
                            {
                                header: 'Akcje', className: 'text-right w-24', render: (e: Excuse) => (
                                    <div className="flex justify-end gap-1">
                                        <Button variant="soft" onClick={() => openDetails(e.id, false)} className="p-1"><Eye size={14} /></Button>
                                        <Button variant="soft" onClick={() => openDetails(e.id, true)} className="p-1 text-primary"><Pencil size={14} /></Button>
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

            <Modal
                isOpen={!!detailsModal || detailsLoading}
                onClose={() => { setDetailsModal(null); setEditMode(false); }}
                title={editMode ? "Edycja usprawiedliwienia" : "Szczegóły usprawiedliwienia"}
                footer={editMode ? (
                    <>
                        <Button variant="secondary" onClick={() => { setDetailsModal(null); setEditMode(false); }}>Anuluj</Button>
                        <Button onClick={handleSaveStatus}>Zapisz</Button>
                    </>
                ) : detailsModal?.isAccepted === null ? (
                    <>
                        <Button variant="danger" onClick={() => handleAccept(false)}>Odrzuć</Button>
                        <Button onClick={() => handleAccept(true)}>Zatwierdź</Button>
                    </>
                ) : undefined}
            >
                {detailsLoading ? <LoadingSpinner /> : detailsModal && (
                    <div className="space-y-4 p-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="font-medium">Rodzic:</span> {detailsModal.parentName}</div>
                            <div><span className="font-medium">Uczeń:</span> {detailsModal.studentName}</div>
                            <div><span className="font-medium">Wysłano:</span> {formatDateTime(detailsModal.createdAt)}</div>
                            <div>
                                <span className="font-medium">Status:</span>{' '}
                                {editMode ? (
                                    <select
                                        value={selectedStatus}
                                        onChange={e => setSelectedStatus(e.target.value)}
                                        className="border border-neutral-300 rounded-xs px-2 py-1 text-sm"
                                    >
                                        {editStatusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                ) : getStatusBadge(detailsModal.isAccepted)}
                            </div>
                        </div>

                        <div>
                            <span className="font-medium text-sm">Powód:</span>
                            <div className="p-3 bg-neutral-50 rounded text-sm mt-1">{detailsModal.reason}</div>
                        </div>

                        <div>
                            <span className="font-medium text-sm">Dotyczy poniższych nieobecności:</span>
                            <div className="mt-1 border rounded overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-neutral-50">
                                        <tr>
                                            <th className="text-left p-2 font-medium">Data</th>
                                            <th className="text-left p-2 font-medium">Przedmiot</th>
                                            <th className="text-left p-2 font-medium">Lekcja</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailsModal.attendances.map(a => (
                                            <tr key={a.id} className="border-t">
                                                <td className="p-2">{formatDateOnly(a.date)}</td>
                                                <td className="p-2">{a.subjectName}</td>
                                                <td className="p-2">{a.lessonHour}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
