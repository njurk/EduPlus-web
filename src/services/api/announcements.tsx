import type { Announcement, PaginatedResponse } from '../../types';
import { API_URL, getHeaders, handleResponse, createCrudResource } from './core';

export const announcementsApi = {
    ...createCrudResource<Announcement>('announcement'),
    getAll: async (params?: { pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, sortDesc?: boolean, showInactive?: boolean, authorName?: string, targetRoleId?: number }): Promise<PaginatedResponse<Announcement>> => {
        const url = new URL(`${API_URL}/announcement`);
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, value.toString());
                }
            });
        }
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<PaginatedResponse<Announcement>>(response);
    },
    restore: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/announcement/${id}/restore`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        return handleResponse<void>(response);
    },
    getAuthors: async (): Promise<string[]> => {
        const response = await fetch(`${API_URL}/announcement/authors`, { headers: getHeaders() });
        return handleResponse<string[]>(response);
    },
    markAsRead: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/announcement/${id}/read`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse<void>(response);
    }
};
