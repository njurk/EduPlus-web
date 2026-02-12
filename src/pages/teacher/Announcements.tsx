import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Announcement } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { Pagination } from '../../components/ui/Pagination';
import { Plus, User } from 'lucide-react';
import { useCMSContent } from '../../hooks/useCMSContent';
import { AnnouncementDetailView } from '../../components/views/AnnouncementDetailView';
import { useAnnouncementsList } from '../../hooks/useAnnouncementsList';

export const TeacherAnnouncements = () => {
    const { getText } = useCMSContent('teacherLayout');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
    const userName = user.name;

    const [onlyMine, setOnlyMine] = useState(false);
    const [authorName, setAuthorName] = useState('');

    const [searchParams, setSearchParams] = useSearchParams();

    const hook = useAnnouncementsList({
        extraParams: () => ({
            authorName: onlyMine ? userName.split(' ').reverse().join(' ') : (authorName || undefined)
        }),
        onFiltersReset: () => { setAuthorName(''); setOnlyMine(false); }
    });

    const [pendingDetailId, setPendingDetailId] = useState<number | null>(null);

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            hook.handleStartEdit();
            setSearchParams({}, { replace: true });
        }
        const id = searchParams.get('id');
        if (id) {
            setPendingDetailId(Number(id));
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        if (pendingDetailId && hook.paginatedData?.data?.length) {
            const found = hook.paginatedData.data.find(a => a.id === pendingDetailId);
            if (found) {
                hook.handleOpenDetails(found);
                setPendingDetailId(null);
            }
        }
    }, [pendingDetailId, hook.paginatedData]);

    useEffect(() => { hook.triggerReload(); }, [authorName, onlyMine]);

    if (hook.editMode || hook.detailsAnnouncement) {
        return (
            <AnnouncementDetailView
                announcement={hook.detailsAnnouncement}
                isEditMode={hook.editMode}
                onBack={hook.handleBack}
                onSaved={hook.handleSaved}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title.announcements')}</h1>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <FilterToolbar
                    search={{ value: hook.filters.search, onChange: v => hook.setFilters(p => ({ ...p, search: v })) }}
                    onReset={hook.resetFilters}
                    rightContent={
                        <>
                            <Button
                                variant={onlyMine ? 'primary' : 'secondary'}
                                onClick={() => { setOnlyMine(p => !p); setAuthorName(''); }}
                            >
                                <User size={14} className="mr-1" />Moje ogłoszenia
                            </Button>
                            <Button onClick={() => hook.handleStartEdit()}>
                                <Plus size={14} className="mr-1" />Dodaj
                            </Button>
                        </>
                    }
                >
                    <FilterSelect
                        label="Autor"
                        value={onlyMine ? '' : authorName}
                        onChange={v => { setAuthorName(v as string); setOnlyMine(false); }}
                        options={hook.authors.map(a => ({ value: a, label: a }))}
                        placeholder="Wszyscy"
                        minWidth="160px"
                    />
                </FilterToolbar>
                <div className="flex-1">
                    {hook.loading ? <LoadingSpinner /> : (
                        <DataTable
                            data={hook.paginatedData?.data || []}
                            sortBy={hook.filters.sortBy}
                            sortDesc={hook.filters.sortDesc}
                            onSort={hook.handleSort}
                            columns={[
                                { header: 'Data', sortKey: 'created', muted: true, render: (a) => formatDateTime(a.createdAt) },
                                {
                                    header: 'Tytuł', bold: true, render: (a) => (
                                        <div className="flex items-center gap-2">
                                            {a.title}
                                            <Badge variant="new" show={!a.isRead} />
                                        </div>
                                    )
                                },
                                { header: 'Autor', sortKey: 'author', muted: true, render: (a) => a.authorName || '-' },
                                { header: 'Adresaci', className: 'w-32', muted: true, render: (a) => a.targetRoles || 'Wszyscy' },
                                {
                                    header: '', className: 'w-20',
                                    render: (a: Announcement) => a.authorId === userId ? (
                                        <ActionButtons
                                            isActive
                                            onEdit={() => hook.handleStartEdit(a)}
                                            onDelete={() => hook.handleDelete(a.id)}
                                            onDetails={() => hook.handleOpenDetails(a)}
                                        />
                                    ) : (
                                        <ActionButtons
                                            isActive
                                            onDetails={() => hook.handleOpenDetails(a)}
                                        />
                                    )
                                }
                            ]}
                        />
                    )}
                </div>
                {hook.paginatedData && (
                    <Pagination
                        currentPage={hook.pageNumber}
                        totalPages={hook.paginatedData.totalPages}
                        totalCount={hook.paginatedData.totalCount}
                        pageSize={hook.paginatedData.pageSize}
                        onPageChange={hook.setPageNumber}
                    />
                )}
            </div>
        </div>
    );
};
