import type { AttendanceType, AttendanceAdminDto } from '../../types';
import { API_URL, getHeaders, handleResponse, createCrudResource } from './core';

export const attendanceTypesApi = {
    ...createCrudResource<AttendanceType>('AttendanceType'),
    getAll: async (params?: Record<string, any>): Promise<AttendanceType[]> => {
        const url = new URL(`${API_URL}/attendancetype`);
        if (params) {
            Object.keys(params).forEach(key => {
                const value = params[key];
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, value.toString());
                }
            });
        }
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse(response);
    }
};

export const attendanceApi = {
    getAllAdmin: async (params?: { includeInactive?: boolean, search?: string, sortBy?: string, sortDesc?: boolean }): Promise<AttendanceAdminDto[]> => {
        const url = new URL(`${API_URL}/attendance/admin`);
        if (params?.includeInactive) url.searchParams.append('includeInactive', 'true');
        if (params?.search) url.searchParams.append('search', params.search);
        if (params?.sortBy) url.searchParams.append('sortBy', params.sortBy);
        if (params?.sortDesc !== undefined) url.searchParams.append('sortDesc', params.sortDesc.toString());
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse(response);
    },
    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/attendance/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
};

export const excusesApi = {
    ...createCrudResource<any>('excuse'),
    getAll: async (params?: Record<string, any>): Promise<any[]> => {
        const url = new URL(`${API_URL}/excuse`);
        if (params) {
            Object.keys(params).forEach(key => {
                const value = params[key];
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, value.toString());
                }
            });
        }
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse(response);
    },
    accept: async (id: number, isAccepted: boolean): Promise<void> => {
        const response = await fetch(`${API_URL}/excuse/${id}/accept`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ isAccepted })
        });
        return handleResponse(response);
    }
};
