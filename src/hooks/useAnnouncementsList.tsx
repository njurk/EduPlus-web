import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/apiService';
import type { Announcement, PaginatedResponse } from '../types';

interface UseAnnouncementsListOptions {
    extraParams?: () => Record<string, any>;
    onFiltersReset?: () => void;
}

export const useAnnouncementsList = (options: UseAnnouncementsListOptions = {}) => {
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', sortBy: 'created', sortDesc: true });
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Announcement> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);
    const [authors, setAuthors] = useState<string[]>([]);

    const [detailsAnnouncement, setDetailsAnnouncement] = useState<Announcement | null>(null);
    const [editMode, setEditMode] = useState(false);

    const extraParamsRef = useRef(options.extraParams);
    extraParamsRef.current = options.extraParams;

    useEffect(() => {
        api.announcements.getAuthors().then(setAuthors).catch(console.error);
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
                ...extraParamsRef.current?.()
            });
            setPaginatedData(result);
        } finally { setLoading(false); }
    }, [filters, pageNumber, reloadKey]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);
    useEffect(() => { setPageNumber(1); }, [filters.search]);

    const handleSort = (field: string) => {
        setFilters(p => p.sortBy === field ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: field, sortDesc: true });
    };

    const handleOpenDetails = async (a: Announcement) => {
        setDetailsAnnouncement(a);
        setEditMode(false);
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

    const handleStartEdit = (a?: Announcement) => {
        setEditMode(true);
        setDetailsAnnouncement(a || null);
        if (a && !a.isRead) {
            api.announcements.markAsRead(a.id).catch(console.error);
        }
    };

    const handleBack = () => {
        setDetailsAnnouncement(null);
        setEditMode(false);
    };

    const handleSaved = async () => {
        await loadData();
        setEditMode(false);
        setDetailsAnnouncement(null);
    };

    const handleDelete = async (id: number, isActive = true) => {
        const message = isActive
            ? 'Czy na pewno chcesz usunąć to ogłoszenie?'
            : 'Czy na pewno chcesz trwale usunąć to ogłoszenie? Tej operacji nie można cofnąć.';
        if (!window.confirm(message)) return;
        await api.announcements.delete(id);
        await loadData();
    };

    const handleRestore = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz przywrócić to ogłoszenie?')) return;
        await api.announcements.restore(id);
        await loadData();
    };

    const resetFilters = () => {
        setFilters(p => ({ ...p, search: '' }));
        options.onFiltersReset?.();
    };

    const triggerReload = () => {
        setPageNumber(1);
        setReloadKey(k => k + 1);
    };

    return {
        loading,
        filters,
        setFilters,
        paginatedData,
        pageNumber,
        setPageNumber,
        authors,
        detailsAnnouncement,
        editMode,
        loadData,
        handleSort,
        handleOpenDetails,
        handleStartEdit,
        handleBack,
        handleSaved,
        handleDelete,
        handleRestore,
        resetFilters,
        triggerReload
    };
};
