import type { UnreadCounts } from '../../types/layout';
import { API_URL, getHeaders, handleResponse } from './core';

export const layoutApi = {
    getUnreadCounts: async (): Promise<UnreadCounts> => {
        const response = await fetch(`${API_URL}/layout/unread-counts`, {
            headers: getHeaders()
        });
        return handleResponse<UnreadCounts>(response);
    }
};
