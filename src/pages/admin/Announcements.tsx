import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Announcement, Role, PaginatedResponse } from '../../types';
import { api } from '../../services/apiService';
import { Plus, User, AlertCircle } from 'lucide-react';
import { SearchBar } from '../../components/ui/SearchBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { TrashButton } from '../../components/ui/TrashButton';
import { useCMSContent } from '../../hooks/useCMSContent';
import { DetailsModal } from '../../components/modals/DetailsModal';
import { Modal } from '../../components/modals/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Editor } from 'primereact/editor';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    announcement?: Announcement | null;
    onSaved: () => void;
}

const AnnouncementModal = ({ isOpen, onClose, announcement, onSaved }: AnnouncementModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [forAll, setForAll] = useState(true);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.roles.getAll().then(setAllRoles).catch(console.error);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTitle(announcement?.title || '');
            setDescription(announcement?.description || '');
            setError(null);
            if (announcement?.targetRoles === 'Wszyscy' || !announcement) {
                setForAll(true);
                setSelectedRoleIds([]);
            } else {
                setForAll(false);
                const roleNames = announcement.targetRoles?.split(', ') || [];
                const roleIds = allRoles.filter(r => roleNames.includes(r.name)).map(r => r.id);
                setSelectedRoleIds(roleIds);
            }
        }
    }, [isOpen, announcement, allRoles]);

    const handleSave = async () => {
        if (!title.trim() || !description.trim()) {
            setError("Wypełnij wymagane pola");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const roleIds = forAll ? [] : selectedRoleIds;
            const payload = { title, description, roleIds };
            if (announcement) {
                await api.announcements.update(announcement.id, payload);
            } else {
                await api.announcements.create(payload);
            }
            onSaved();
            onClose();
        } catch (e: any) {
            setError(e.message || "Błąd zapisu");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = (roleId: number) => {
        setSelectedRoleIds(prev => prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={announcement ? "Edycja ogłoszenia" : "Nowe ogłoszenie"} maxWidth="lg"
            footer={<><Button variant="secondary" onClick={onClose} disabled={loading}>Anuluj</Button><Button onClick={handleSave} disabled={loading}>{announcement ? 'Zapisz' : 'Utwórz'}</Button></>}
        >
            <div className="space-y-4 px-6 py-4">
                {error && <div className="p-3 bg-danger-light text-danger-text text-sm rounded flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Tytuł <span className="text-danger">*</span></label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tytuł ogłoszenia" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Treść <span className="text-danger">*</span></label>
                    <Editor value={description} onTextChange={(e) => setDescription(e.htmlValue || '')} style={{ height: '250px' }}
                        headerTemplate={<span className="ql-formats"><button className="ql-bold" aria-label="Bold"></button><button className="ql-italic" aria-label="Italic"></button><button className="ql-underline" aria-label="Underline"></button><button className="ql-list" value="ordered" aria-label="Ordered List"></button><button className="ql-list" value="bullet" aria-label="Bullet List"></button><button className="ql-link" aria-label="Link"></button></span>} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Adresaci</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={forAll} onChange={(e) => { setForAll(e.target.checked); if (e.target.checked) setSelectedRoleIds([]); }} className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary" />
                            <span className="text-sm text-neutral-700 font-medium">Wszyscy</span>
                        </label>
                        <div className="pl-6 space-y-1">
                            {allRoles.map(role => (
                                <label key={role.id} className={`flex items-center gap-2 ${forAll ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input type="checkbox" checked={forAll || selectedRoleIds.includes(role.id)} onChange={() => handleRoleToggle(role.id)} disabled={forAll} className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary disabled:opacity-50" />
                                    <span className={`text-sm ${forAll ? 'text-neutral-400' : 'text-neutral-600'}`}>{role.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export const Announcements = () => {
    const { getText } = useCMSContent('announcements');
    const [allAuthors, setAllAuthors] = useState<string[]>([]);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', sortBy: 'created', sortDesc: true, showInactive: false, authorName: '', targetRoleId: undefined as number | undefined });
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Announcement> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailsAnnouncement, setDetailsAnnouncement] = useState<Announcement | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    useEffect(() => {
        api.announcements.getAuthors().then(setAllAuthors).catch(console.error);
        api.roles.getAll().then(setAllRoles).catch(console.error);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.announcements.getAll({
                pageNumber,
                pageSize: 20,
                search: filters.search,
                sortBy: filters.sortBy,
                sortDesc: filters.sortDesc,
                showInactive: filters.showInactive,
                authorName: filters.authorName,
                targetRoleId: filters.targetRoleId
            });
            setPaginatedData(result);
        } finally { setLoading(false); }
    }, [filters, pageNumber]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);

    useEffect(() => { setPageNumber(1); }, [filters.search, filters.showInactive, filters.authorName, filters.targetRoleId]);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) return;
        await api.announcements.delete(id);
        await loadData();
    };

    const handleRestore = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz przywrócić to ogłoszenie?')) return;
        await api.announcements.restore(id);
        await loadData();
    };

    const handleOpenDetails = async (a: Announcement) => {
        setDetailsAnnouncement(a);
        setIsDetailsOpen(true);
        if (!a.isRead) {
            try {
                await api.announcements.markAsRead(a.id);
                setPaginatedData(prev => prev ? {
                    ...prev,
                    data: prev.data.map((item: Announcement) => item.id === a.id ? { ...item, isRead: true } : item)
                } : null);
            } catch (e) { console.error(e); }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <div className="p-3 border-b flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <SearchBar value={filters.search} onChange={v => setFilters(p => ({ ...p, search: v }))} className="max-w-xs" />
                        <select
                            value={filters.authorName}
                            onChange={e => setFilters(p => ({ ...p, authorName: e.target.value }))}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[140px]"
                        >
                            <option value="">Wszyscy autorzy</option>
                            {allAuthors.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select
                            value={filters.targetRoleId ?? ''}
                            onChange={e => setFilters(p => ({ ...p, targetRoleId: e.target.value === '' ? undefined : Number(e.target.value) }))}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[140px]"
                        >
                            <option value="">Wszyscy adresaci</option>
                            <option value="0">Wszyscy</option>
                            {allRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(p => ({ ...p, showInactive: !p.showInactive }))} />
                        <Button onClick={() => { setSelectedAnnouncement(null); setIsModalOpen(true); }}><Plus size={14} className="mr-1" />Dodaj</Button>
                    </div>
                </div>
                <div className="flex-1">
                    {loading ? <LoadingSpinner /> : (
                        <DataTable
                            data={paginatedData?.data || []}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={f => setFilters(p => p.sortBy === f ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: f, sortDesc: true })}
                            columns={[
                                { header: getText('columns.date'), sortKey: 'created', render: (a) => <div className="text-xs w-28 text-neutral-600">{formatDateTime(a.createdAt)}</div> },
                                {
                                    header: getText('columns.title'), className: 'w-1/4', render: (a) => (
                                        <div className="flex items-center gap-2">
                                            <span className="text-neutral-900 font-medium">{a.title}</span>
                                            {a.isRead === false && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-white rounded">NOWE</span>}
                                        </div>
                                    )
                                },
                                { header: getText('columns.content'), render: (a) => <span className="text-neutral-700 text-sm line-clamp-2">{stripHtml(a.description)}</span> },
                                { header: getText('columns.author'), sortKey: 'author', className: 'w-32', render: (a) => <div className="flex items-center gap-2 text-sm text-neutral-600"><User size={14} />{a.authorName}</div> },
                                { header: 'Adresaci', className: 'w-32', render: (a) => <span className="text-xs text-neutral-500">{a.targetRoles || 'Wszyscy'}</span> },
                                { header: 'Edytowano', sortKey: 'updated', className: 'w-32', render: (a) => <span className="text-xs text-neutral-500">{formatDateTime(a.updatedAt)}</span> },
                                { header: getText('columns.modifiedBy'), className: 'w-40', render: (a) => <span className="text-xs text-neutral-500">{a.modifiedByName || 'System'}</span> },
                                {
                                    header: getText('columns.actions'), className: 'w-20 text-right', render: (a) => filters.showInactive ? (
                                        <button className="text-sm text-primary hover:underline" onClick={() => handleRestore(a.id)}>Przywróć</button>
                                    ) : (
                                        <ActionButtons
                                            onEdit={() => { setSelectedAnnouncement(a); setIsModalOpen(true); }}
                                            onDelete={() => handleDelete(a.id)}
                                            onDetails={() => handleOpenDetails(a)}
                                        />
                                    )
                                }
                            ]}
                            emptyMessage={'Brak danych'}
                        />
                    )}
                </div>
                {paginatedData && (
                    <Pagination
                        currentPage={pageNumber}
                        totalPages={paginatedData.totalPages}
                        totalCount={paginatedData.totalCount}
                        pageSize={paginatedData.pageSize}
                        onPageChange={setPageNumber}
                    />
                )}
            </div>

            <AnnouncementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                announcement={selectedAnnouncement}
                onSaved={async () => { await loadData(); setIsModalOpen(false); }}
            />

            <DetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title="Szczegóły ogłoszenia"
                data={detailsAnnouncement ? {
                    title: detailsAnnouncement.title,
                    description: detailsAnnouncement.description,
                    authorName: detailsAnnouncement.authorName,
                    targetRoles: detailsAnnouncement.targetRoles || 'Wszyscy',
                    createdAt: detailsAnnouncement.createdAt,
                    updatedAt: detailsAnnouncement.updatedAt,
                    modifiedByName: detailsAnnouncement.modifiedByName || 'System'
                } : {}}
                labels={{
                    title: 'Tytuł',
                    description: 'Treść',
                    authorName: 'Autor',
                    targetRoles: 'Adresaci',
                    createdAt: 'Utworzono',
                    updatedAt: 'Edytowano',
                    modifiedByName: 'Edytowane przez'
                }}
                excludeKeys={['id']}
                maxWidth="lg"
                htmlFields={['description']}
            />
        </div>
    );
};

