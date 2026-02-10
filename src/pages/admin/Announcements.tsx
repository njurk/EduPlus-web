import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import type { Role } from '../../types';
import { api } from '../../services/apiService';
import { Plus } from 'lucide-react';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { TrashButton } from '../../components/ui/TrashButton';
import { useCMSContent } from '../../hooks/useCMSContent';
import { Pagination } from '../../components/ui/Pagination';
import { AnnouncementDetailView } from '../../components/views/AnnouncementDetailView';
import { useAnnouncementsList } from '../../hooks/useAnnouncementsList';

export const Announcements = () => {
    const { getText } = useCMSContent('announcements');
    const [searchParams, setSearchParams] = useSearchParams();
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [showInactive, setShowInactive] = useState(false);
    const [authorName, setAuthorName] = useState('');
    const [targetRoleId, setTargetRoleId] = useState<number | undefined>(undefined);

    const hook = useAnnouncementsList({
        extraParams: () => ({ showInactive, authorName, targetRoleId }),
        onFiltersReset: () => { setAuthorName(''); setTargetRoleId(undefined); }
    });

    useEffect(() => {
        api.roles.getAll().then(setAllRoles).catch(console.error);
    }, []);

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            hook.handleStartEdit();
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => { hook.triggerReload(); }, [showInactive, authorName, targetRoleId]);

    if (hook.editMode || hook.detailsAnnouncement) {
        return (
            <AnnouncementDetailView
                announcement={hook.detailsAnnouncement}
                isEditMode={hook.editMode}
                onBack={hook.handleBack}
                onSaved={hook.handleSaved}
                showAdminFields
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <FilterToolbar
                    search={{ value: hook.filters.search, onChange: v => hook.setFilters(p => ({ ...p, search: v })) }}
                    onReset={() => { hook.resetFilters(); setShowInactive(false); }}
                    rightContent={
                        <>
                            <TrashButton isTrashActive={showInactive} onToggle={() => setShowInactive(p => !p)} />
                            <Button onClick={() => hook.handleStartEdit()}><Plus size={14} className="mr-1" />Dodaj</Button>
                        </>
                    }
                >
                    <FilterSelect
                        label="Autor"
                        value={authorName}
                        onChange={v => setAuthorName(v ? String(v) : '')}
                        options={hook.authors.map(a => ({ value: a, label: a }))}
                        placeholder="Wszyscy"
                        minWidth="140px"
                        parseAsNumber={false}
                    />
                    <FilterSelect
                        label="Adresaci"
                        value={targetRoleId ?? ''}
                        onChange={v => setTargetRoleId(v === '' || v === null ? undefined : Number(v))}
                        options={[{ value: 0, label: 'Wszyscy' }, ...allRoles.map(r => ({ value: r.id, label: r.name }))]}
                        placeholder="Wszyscy"
                        minWidth="140px"
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
                                { header: 'Data', sortKey: 'created', className: 'w-28', muted: true, render: (a) => formatDateTime(a.createdAt) },
                                { header: 'Tytuł', className: 'w-1/4', bold: true, render: (a) => a.title },
                                { header: 'Autor', sortKey: 'author', className: 'w-32', render: (a) => a.authorName },
                                { header: 'Adresaci', className: 'w-32', muted: true, render: (a) => a.targetRoles || 'Wszyscy' },
                                { header: 'Edytowano', sortKey: 'updated', className: 'w-32', muted: true, render: (a) => formatDateTime(a.updatedAt) },
                                { header: 'Edytowane przez', className: 'w-40', muted: true, render: (a) => a.modifiedByName || 'System' },
                                {
                                    header: '', className: 'w-20', render: (a) => (
                                        <ActionButtons
                                            isActive={!showInactive}
                                            onEdit={!showInactive ? () => hook.handleStartEdit(a) : undefined}
                                            onDelete={() => hook.handleDelete(a.id, a.isActive)}
                                            onDetails={!showInactive ? () => hook.handleOpenDetails(a) : undefined}
                                            onRestore={showInactive ? () => hook.handleRestore(a.id) : undefined}
                                        />
                                    )
                                }
                            ]}
                            emptyMessage={'Brak danych'}
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
