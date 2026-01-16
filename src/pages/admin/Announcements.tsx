import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import type { Announcement } from '../../types';
import { api } from '../../services/apiService';
import { Plus, RefreshCcw, User, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { SortToolbar } from '../../components/ui/SortToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate, formatTime, formatFullDate } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { AnnouncementModal } from '../../components/modals/AnnouncementModal';
import { TrashButton } from '../../components/ui/TrashButton';
import { useCMSContent } from '../../hooks/useCMSContent';

const AnnouncementDetailsView = ({ announcement, onBack }: { announcement: Announcement, onBack: () => void }) => {
    const { getText } = useCMSContent('announcements');

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-neutral-600 hover:text-primary mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">{getText('details.back')}</span>
            </button>

            <article className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary-dark p-8 text-white">
                    <h1 className="text-2xl font-bold mb-4 leading-tight">{announcement.title}</h1>

                    <div className="flex flex-wrap items-center gap-6 text-sm opacity-90">
                        <div className="flex items-center gap-2">
                            <User size={16} />
                            <span>{announcement.authorName || getText('details.unknownAuthor')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{formatFullDate(announcement.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{formatTime(announcement.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="prose prose-neutral max-w-none">
                        <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap text-base">
                            {announcement.description}
                        </p>
                    </div>
                </div>

                {announcement.updatedAt !== announcement.createdAt && (
                    <div className="px-8 pb-6">
                        <p className="text-xs text-neutral-400 italic">
                            {getText('details.lastEdited')}: {formatDate(announcement.updatedAt)}
                        </p>
                    </div>
                )}
            </article>
        </div>
    );
};

export const Announcements = () => {
    const { getText } = useCMSContent('announcements');
    const [data, setData] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDesc, setSortDesc] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try { setData(await api.announcements.getAll({ search, sortBy, sortDesc, showInactive })); } finally { setLoading(false); }
    }, [search, sortBy, sortDesc, showInactive]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);

    const handleDelete = async (id: number) => {
        if (!window.confirm(getText('confirm.delete'))) return;
        await api.announcements.delete(id);
        await loadData();
    };

    const handleRestore = async (id: number) => {
        if (!window.confirm(getText('confirm.restore'))) return;
        await api.announcements.restore(id);
        await loadData();
    };

    if (viewingAnnouncement) {
        return <AnnouncementDetailsView announcement={viewingAnnouncement} onBack={() => setViewingAnnouncement(null)} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-neutral-800">{getText('title')}</h1>
                <div className="flex gap-2">
                    <TrashButton isTrashActive={showInactive} onToggle={() => setShowInactive(!showInactive)} />
                    <Button onClick={() => { setSelectedAnnouncement(null); setIsModalOpen(true); }}><Plus size={14} className="mr-1" />{getText('actions.new')}</Button>
                </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs">
                <div className="p-3 border-b">
                    <SortToolbar search={search} onSearchChange={setSearch}
                        sortBy={sortBy} sortDesc={sortDesc}
                        onSortChange={field => { if (sortBy === field) setSortDesc(!sortDesc); else { setSortBy(field); setSortDesc(true); } }}
                        sortOptions={[{ field: 'createdAt', label: getText('sort.date') }, { field: 'authorName', label: getText('sort.author') }]}
                    />
                </div>
                {loading ? <div className="flex items-center justify-center h-32 text-neutral-400"><RefreshCcw className="animate-spin mr-2" size={16} />{getText('loading')}</div> : (
                    <DataTable
                        data={data}
                        columns={[
                            { header: getText('columns.date'), render: a => <span className="text-xs">{formatDate(a.createdAt)}</span> },
                            { header: getText('columns.title'), render: a => <span className="font-medium">{a.title}</span> },
                            { header: getText('columns.content'), render: a => <div className="truncate max-w-xs text-sm" title={a.description}>{a.description}</div> },
                            { header: getText('columns.author'), render: a => a.authorName ? <span className="text-xs flex items-center gap-1"><User size={12} />{a.authorName}</span> : '-' },
                            { header: getText('columns.modifiedBy'), render: a => <span className="text-xs text-neutral-500">{a.modifiedByName || 'System'}</span> },
                            { header: getText('columns.actions'), className: 'text-right', render: a => <ActionButtons isActive={a.isActive} onDelete={() => handleDelete(a.id)} onRestore={!a.isActive ? () => handleRestore(a.id) : undefined} /> }
                        ]}
                        emptyMessage={getText('empty')}
                        onRowClick={(row) => setViewingAnnouncement(row)}
                    />
                )}
            </div>
            <AnnouncementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} announcement={selectedAnnouncement} onSaved={loadData} />
        </div>
    );
};

