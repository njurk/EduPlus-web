import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import type { Announcement, Role, PaginatedResponse } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { FilterToolbar } from '../../components/ui/FilterToolbar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { Pagination } from '../../components/ui/Pagination';
import { DetailsModal } from '../../components/modals/DetailsModal';
import { Modal } from '../../components/modals/Modal';
import { Plus, AlertCircle } from 'lucide-react';
import { Editor } from 'primereact/editor';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');

interface AnnouncementFormProps {
    isOpen: boolean;
    onClose: () => void;
    announcement?: Announcement | null;
    onSaved: () => void;
}

const AnnouncementForm = ({ isOpen, onClose, announcement, onSaved }: AnnouncementFormProps) => {
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
            setError('Wypełnij wymagane pola');
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
            setError(e.message || 'Błąd zapisu');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = (roleId: number) => {
        setSelectedRoleIds(prev => prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={announcement ? 'Edycja ogłoszenia' : 'Nowe ogłoszenie'} maxWidth="xl"
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

export const TeacherAnnouncements = () => {
    const user = getUser();
    const authorName = user.name || '';

    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', sortBy: 'created', sortDesc: true });
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Announcement> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailsAnnouncement, setDetailsAnnouncement] = useState<Announcement | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.announcements.getAll({
                pageNumber,
                pageSize: 20,
                search: filters.search,
                sortBy: filters.sortBy,
                sortDesc: filters.sortDesc,
                authorName
            });
            setPaginatedData(result);
        } finally { setLoading(false); }
    }, [filters, pageNumber, authorName]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);
    useEffect(() => { setPageNumber(1); }, [filters.search]);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) return;
        await api.announcements.delete(id);
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
                <h1 className="text-xl font-bold text-neutral-800">Moje ogłoszenia</h1>
                <Button onClick={() => { setSelectedAnnouncement(null); setIsModalOpen(true); }}>
                    <Plus size={14} className="mr-1" />Dodaj
                </Button>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <FilterToolbar
                    search={{ value: filters.search, onChange: v => setFilters(p => ({ ...p, search: v })) }}
                    onReset={() => setFilters(p => ({ ...p, search: '' }))}
                />
                <div className="flex-1">
                    {loading ? <LoadingSpinner /> : (
                        <DataTable
                            data={paginatedData?.data || []}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={f => setFilters(p => p.sortBy === f ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: f, sortDesc: true })}
                            onRowClick={handleOpenDetails}
                            columns={[
                                { header: 'Data', sortKey: 'created', className: 'w-28', muted: true, render: (a) => formatDateTime(a.createdAt) },
                                {
                                    header: 'Tytuł', bold: true, render: (a) => (
                                        <div className="flex items-center gap-2">
                                            {a.title}
                                            <Badge variant="new" show={!a.isRead} />
                                        </div>
                                    )
                                },
                                { header: 'Adresaci', className: 'w-32', muted: true, render: (a) => a.targetRoles || 'Wszyscy' },
                                {
                                    header: '', className: 'w-20',
                                    render: (a) => (
                                        <ActionButtons
                                            isActive
                                            onEdit={() => { setSelectedAnnouncement(a); setIsModalOpen(true); }}
                                            onDelete={() => handleDelete(a.id)}
                                            onDetails={() => handleOpenDetails(a)}
                                        />
                                    )
                                }
                            ]}
                            emptyMessage="Brak ogłoszeń"
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

            <AnnouncementForm
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
                    updatedAt: detailsAnnouncement.updatedAt
                } : {}}
                labels={{
                    title: 'Tytuł',
                    description: 'Treść',
                    authorName: 'Autor',
                    targetRoles: 'Adresaci',
                    createdAt: 'Utworzono',
                    updatedAt: 'Edytowano'
                }}
                excludeKeys={['id']}
                maxWidth="xl"
                htmlFields={['description']}
            />
        </div>
    );
};
