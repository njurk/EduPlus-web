import type { GradeType, GradeCategory, Grade, GradeDto, StudentGradesRowDto, PaginatedResponse } from '../../types';
import { API_URL, getHeaders, handleResponse, createCrudResource } from './core';

export const gradeTypesApi = createCrudResource<GradeType>('GradeType');
export const gradeCategoriesApi = createCrudResource<GradeCategory>('GradeCategory');

export const classGradesApi = {
    getClassGrades: async (classId: number, subjectId: number, semester: number, yearId?: number): Promise<StudentGradesRowDto[]> => {
        const url = `${API_URL}/grade/class-grades/${classId}/${subjectId}?semester=${semester}${yearId ? `&schoolYearId=${yearId}` : ''}`;
        const response = await fetch(url, { headers: getHeaders() });
        return handleResponse(response);
    }
};

export const gradesApi = {
    getCurrentSemester: async (yearId: number): Promise<number> => {
        const response = await fetch(`${API_URL}/grade/current-semester/${yearId}`, { headers: getHeaders() });
        return handleResponse(response);
    },
    getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<any>> => {
        const url = new URL(`${API_URL}/grade`);
        if (params) {
            Object.keys(params).forEach(key => {
                const value = params[key];
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, value.toString());
                }
            });
        }
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<PaginatedResponse<any>>(response);
    },
    getById: async (id: number): Promise<any> => {
        const response = await fetch(`${API_URL}/grade/${id}`, { headers: getHeaders() });
        return handleResponse(response);
    },
    getClassGrades: async (classId: number, subjectId: number, semester: number, yearId?: number): Promise<StudentGradesRowDto[]> => {
        const url = `${API_URL}/grade/class-grades/${classId}/${subjectId}?semester=${semester}${yearId ? `&schoolYearId=${yearId}` : ''}`;
        const response = await fetch(url, { headers: getHeaders() });
        return handleResponse(response);
    },
    create: async (data: GradeDto): Promise<Grade> => {
        const response = await fetch(`${API_URL}/grade`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<Grade>(response);
    },
    update: async (id: number, data: Partial<GradeDto>): Promise<Grade> => {
        const response = await fetch(`${API_URL}/grade/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<Grade>(response);
    },
    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/grade/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    restore: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/grade/${id}/restore`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};
