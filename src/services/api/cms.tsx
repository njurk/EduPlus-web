import type { PageContent, Page, Target } from '../../types';
import { API_URL, getHeaders, handleResponse } from './core';

export const pageContentApi = {
    getByPageId: async (pageId: number, search?: string): Promise<PageContent[]> => {
        const url = new URL(`${API_URL}/PageContent`);
        url.searchParams.append('pageId', pageId.toString());
        if (search) url.searchParams.append('search', search);
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<PageContent[]>(response);
    },
    update: async (id: number, newValue: string): Promise<PageContent> => {
        const response = await fetch(`${API_URL}/PageContent/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(newValue)
        });
        return handleResponse<PageContent>(response);
    }
};

export const targetsApi = {
    getAll: async (): Promise<Target[]> => {
        const response = await fetch(`${API_URL}/Target`, { headers: getHeaders() });
        return handleResponse(response);
    }
};

export const pagesApi = {
    getAll: async (targetId?: number): Promise<Page[]> => {
        const url = new URL(`${API_URL}/Page`);
        if (targetId) url.searchParams.append('targetId', targetId.toString());
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse(response);
    }
};

export const cmsApi = {
    getByPageLabel: async (pageLabel: string): Promise<{ key: string; value: string }[]> => {
        const response = await fetch(`${API_URL}/PageContent/by-label/${encodeURIComponent(pageLabel)}`, { headers: getHeaders() });
        return handleResponse(response);
    }
};
