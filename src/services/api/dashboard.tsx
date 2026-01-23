import type { DashboardSummary, UptimeInfo } from '../../types';
import { API_URL, getHeaders, handleResponse } from './core';

export const dashboardApi = {
    getSummary: async (): Promise<DashboardSummary> => {
        const response = await fetch(`${API_URL}/dashboard/summary`, {
            headers: getHeaders()
        });
        return handleResponse<DashboardSummary>(response);
    },
    getUptime: async (): Promise<UptimeInfo> => {
        const response = await fetch(`${API_URL}/dashboard/uptime`);
        return handleResponse<UptimeInfo>(response);
    }
};
