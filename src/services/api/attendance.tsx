import type { AttendanceType, AttendanceAdminDto, PaginatedResponse } from '../../types';
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
    getAllAdmin: async (params?: { pageNumber?: number, pageSize?: number, includeInactive?: boolean, search?: string, sortBy?: string, sortDesc?: boolean, classId?: number, date?: string, subjectName?: string, teacherName?: string, attendanceTypeShortCode?: string }): Promise<PaginatedResponse<AttendanceAdminDto>> => {
        const url = new URL(`${API_URL}/attendance/admin`);
        if (params?.pageNumber) url.searchParams.append('pageNumber', params.pageNumber.toString());
        if (params?.pageSize) url.searchParams.append('pageSize', params.pageSize.toString());
        if (params?.includeInactive) url.searchParams.append('includeInactive', 'true');
        if (params?.search) url.searchParams.append('search', params.search);
        if (params?.sortBy) url.searchParams.append('sortBy', params.sortBy);
        if (params?.sortDesc !== undefined) url.searchParams.append('sortDesc', params.sortDesc.toString());
        if (params?.classId) url.searchParams.append('classId', params.classId.toString());
        if (params?.date) url.searchParams.append('date', params.date);
        if (params?.subjectName) url.searchParams.append('subjectName', params.subjectName);
        if (params?.teacherName) url.searchParams.append('teacherName', params.teacherName);
        if (params?.attendanceTypeShortCode) url.searchParams.append('attendanceTypeShortCode', params.attendanceTypeShortCode);
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<PaginatedResponse<AttendanceAdminDto>>(response);
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
    getAll: async (params?: { pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, sortDesc?: boolean }): Promise<PaginatedResponse<any>> => {
        const url = new URL(`${API_URL}/excuse`);
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, value.toString());
                }
            });
        }
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<PaginatedResponse<any>>(response);
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
