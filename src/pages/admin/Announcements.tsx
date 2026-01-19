import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import type { Announcement } from '../../types';
import { api } from '../../services/apiService';
import { Plus, RefreshCcw, User } from 'lucide-react';
import { SearchBar } from '../../components/ui/SearchBar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate, formatFullDate, formatTime } from '../../utils/formatters';
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

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.announcements.getAll({ search: filters.search, sortBy: filters.sortBy, sortDesc: filters.sortDesc, showInactive: filters.showInactive, authorName: filters.authorName });
            setData(result);
            if (!filters.authorName && !filters.search) {
                setAllAuthors([...new Set(result.map(a => a.authorName).filter(Boolean))] as string[]);
            }
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
                            { header: getText('columns.title'), render: a => <span className="font-medium">{a.title}</span> },
                            { header: getText('columns.content'), render: a => <div className="truncate max-w-xs text-sm" title={a.description}>{a.description}</div> },
                            { header: getText('columns.author'), sortKey: 'author', render: a => a.authorName ? <span className="text-xs flex items-center gap-1"><User size={12} />{a.authorName}</span> : '-' },
                            { header: 'Utworzono', sortKey: 'created', render: a => <span className="text-xs">{formatDate(a.createdAt)}</span> },
                            { header: 'Edytowano', sortKey: 'updated', render: a => <span className="text-xs">{formatDate(a.updatedAt)}</span> },
                            { header: getText('columns.modifiedBy'), render: a => <span className="text-xs text-neutral-500">{a.modifiedByName || 'System'}</span> },
                            {
                                header: getText('columns.actions'), className: 'text-right', render: a => (
                                    <ActionButtons
                                        isActive={a.isActive}
                                        onDetails={() => { setDetailsAnnouncement(a); setIsDetailsOpen(true); }}
                                        onEdit={() => { setSelectedAnnouncement(a); setIsModalOpen(true); }}
                                        onDelete={() => handleDelete(a.id)}
                                        onRestore={!a.isActive ? () => handleRestore(a.id) : undefined}
                                    />
                                )
                            }
                        ]}
                        emptyMessage="Brak ogłoszeń"
                    />
                )}
            </div>
            <AnnouncementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} announcement={selectedAnnouncement} onSaved={loadData} />
            {detailsAnnouncement && (
                <DetailsModal
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                    title={detailsAnnouncement.title}
                    data={{
                        description: detailsAnnouncement.description,
                        authorName: detailsAnnouncement.authorName,
                        createdAt: formatFullDate(detailsAnnouncement.createdAt) + ' ' + formatTime(detailsAnnouncement.createdAt),
                        updatedAt: formatFullDate(detailsAnnouncement.updatedAt) + ' ' + formatTime(detailsAnnouncement.updatedAt),
                        modifiedByName: detailsAnnouncement.modifiedByName || 'System'
                    }}
                    labels={{
                        description: 'Treść',
                        authorName: 'Autor',
                        createdAt: 'Data utworzenia',
                        updatedAt: 'Data edycji',
                        modifiedByName: 'Edytowane przez'
                    }}
                />
            )}
        </div>
    );
};
