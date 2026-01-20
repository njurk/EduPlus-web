import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import type { Announcement } from '../../types';
import { api } from '../../services/apiService';
import { Plus, RefreshCcw, User } from 'lucide-react';
import { SearchBar } from '../../components/ui/SearchBar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { AnnouncementModal } from '../../components/modals/AnnouncementModal';
import { TrashButton } from '../../components/ui/TrashButton';
import { useCMSContent } from '../../hooks/useCMSContent';
import { DetailsModal } from '../../components/modals/DetailsModal';

export const Announcements = () => {
    const { getText } = useCMSContent('announcements');
    const [data, setData] = useState<Announcement[]>([]);
    const [allAuthors, setAllAuthors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', sortBy: 'created', sortDesc: true, showInactive: false, authorName: '' });
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
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.announcements.getAll({ search: filters.search, sortBy: filters.sortBy, sortDesc: filters.sortDesc, showInactive: filters.showInactive, authorName: filters.authorName });
            setData(result);
        } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);

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
                            value={filters.authorName}
                            onChange={e => setFilters(p => ({ ...p, authorName: e.target.value }))}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[140px]"
                        >
                            <option value="">Wszyscy autorzy</option>
                            {allAuthors.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(p => ({ ...p, showInactive: !p.showInactive }))} />
                        {!filters.showInactive && <Button onClick={() => { setSelectedAnnouncement(null); setIsModalOpen(true); }}><Plus size={14} className="mr-1" />Dodaj</Button>}
                    </div>
                </div>
                {loading ? <div className="flex items-center justify-center h-32 text-neutral-400"><RefreshCcw className="animate-spin mr-2" size={16} />Ładowanie...</div> : (
                    <DataTable
                        data={data}
                        sortBy={filters.sortBy}
                        sortDesc={filters.sortDesc}
                        onSort={f => setFilters(p => p.sortBy === f ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: f, sortDesc: true })}
                        columns={[
                            { header: getText('columns.date'), sortKey: 'created', render: (a) => <div className="text-xs w-24 text-neutral-600">{formatDate(a.createdAt)}</div> },
                            { header: getText('columns.title'), className: 'w-1/4', render: (a) => <span className="text-neutral-900 font-medium">{a.title}</span> },
                            { header: getText('columns.content'), render: (a) => <span className="text-neutral-700 text-sm line-clamp-2">{stripHtml(a.description)}</span> },
                            { header: getText('columns.author'), sortKey: 'author', className: 'w-40', render: (a) => <div className="flex items-center gap-2 text-sm text-neutral-600"><User size={14} />{a.authorName}</div> },
                            { header: 'Edytowano', sortKey: 'updated', className: 'w-32', render: (a) => <span className="text-xs text-neutral-500">{formatDate(a.updatedAt)}</span> },
                            { header: getText('columns.modifiedBy'), className: 'w-40', render: (a) => <span className="text-xs text-neutral-500">{a.modifiedByName || 'System'}</span> },
                            {
                                header: getText('columns.actions'), className: 'w-20 text-right', render: (a) => filters.showInactive ? (
                                    <button className="text-sm text-primary hover:underline" onClick={() => handleRestore(a.id)}>Przywróć</button>
                                ) : (
                                    <ActionButtons
                                        onEdit={() => { setSelectedAnnouncement(a); setIsModalOpen(true); }}
                                        onDelete={() => handleDelete(a.id)}
                                        onDetails={() => { setDetailsAnnouncement(a); setIsDetailsOpen(true); }}
                                    />
                                )
                            }
                        ]}
                        emptyMessage={'Brak danych'}
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
                    createdAt: detailsAnnouncement.createdAt,
                    updatedAt: detailsAnnouncement.updatedAt,
                    modifiedByName: detailsAnnouncement.modifiedByName || 'System'
                } : {}}
                labels={{
                    title: 'Tytuł',
                    description: 'Treść',
                    authorName: 'Autor',
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
