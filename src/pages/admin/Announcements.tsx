import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import type { Announcement } from '../../types';
import { api } from '../../services/apiService';
import { Plus, RefreshCcw, User } from 'lucide-react';
import { SortFilterToolbar } from '../../components/ui/SortFilterToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate, formatName } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { AnnouncementModal } from '../../components/modals/AnnouncementModal';
import { TrashButton } from '../../components/ui/TrashButton';

export const Announcements = () => {
    const [data, setData] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDesc, setSortDesc] = useState(true);
    const [showInactive, setShowInactive] = useState(false);

    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.announcements.getAll({ search, sortBy, sortDesc, showInactive });
            setData(response);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [search, sortBy, sortDesc, showInactive]);

    useEffect(() => {
        const id = setTimeout(loadData, 300);
        return () => clearTimeout(id);
    }, [loadData]);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Czy na pewno chcesz usunąć to ogłoszenie?")) return;
        try {
            await api.announcements.delete(id);
            loadData();
        } catch {
            alert("Błąd usuwania");
        }
    };

    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans flex flex-col min-h-[600px] rounded-lg overflow-hidden">
            <div className="border-b px-6 py-4 flex justify-between items-center bg-neutral-50/30">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">Ogłoszenia</h2>
                    <p className="text-sm text-neutral-500">Zarządzaj ogłoszeniami widocznymi dla użytkowników systemu</p>
                </div>
                <Button onClick={() => { setSelectedAnnouncement(null); setIsModalOpen(true); }}>
                    <Plus size={16} className="mr-2" /> Nowe ogłoszenie
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
                        { field: 'createdAt', label: 'Data dodania' },
                        { field: 'title', label: 'Tytuł' }
                    ]}
                    hideCreate={true}
                />

                <TrashButton
                    isTrashActive={showInactive}
                    onToggle={() => setShowInactive(!showInactive)}
                />
            </div>

            <div className="flex-1 bg-white">
                {loading ? (
                    <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                        <RefreshCcw className="animate-spin" size={24} /> Ładowanie...
                    </div>
                ) : (
                    <DataTable
                        data={data}
                        columns={[
                            { header: 'Data', render: (Item) => <span className="text-neutral-500 text-sm whitespace-nowrap">{formatDate(Item.createdAt)}</span>, className: 'w-32' },
                            { header: 'Tytuł', accessor: 'title', className: 'font-medium text-neutral-900 w-1/4' },
                            { header: 'Treść', render: (Item) => <div className="text-neutral-600 truncate max-w-lg" title={Item.description}>{Item.description}</div> },
                            { header: 'Autor', render: (Item) => Item.author ? <span className="text-sm text-neutral-500 flex items-center gap-1"><User size={14} />{formatName(Item.author)}</span> : <span className="text-xs text-neutral-400">-</span> },
                            {
                                header: 'Akcje',
                                className: 'text-right w-32',
                                render: (Item) => (
                                    <ActionButtons
                                        isActive={Item.isActive}
                                        onEdit={() => { setSelectedAnnouncement(Item); setIsModalOpen(true); }}
                                        onDelete={Item.isActive ? () => handleDelete(Item.id) : undefined}
                                        onRestore={!Item.isActive ? async () => { } : undefined}
                                    />
                                )
                            }
                        ]}
                        emptyMessage="Brak ogłoszeń"
                    />
                )}
            </div>

            <AnnouncementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                announcement={selectedAnnouncement}
                onSaved={loadData}
            />
        </div>
    );
};
