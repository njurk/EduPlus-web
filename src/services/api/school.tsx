import type {
    SchoolYear, SchoolClass, Classroom, Subject, User,
    ClassEntity, ClassDetailsDto, SemesterDto, PaginatedResponse
} from '../../types';
import { API_URL, getHeaders, handleResponse, createCrudResource } from './core';

export const schoolYearsApi = {
    getAll: async (): Promise<SchoolYear[]> => {
        const response = await fetch(`${API_URL}/SchoolYear`, { headers: getHeaders() });
        return handleResponse<SchoolYear[]>(response);
    },
    get: async (id: number): Promise<SchoolYear> => {
        const response = await fetch(`${API_URL}/SchoolYear/${id}`, { headers: getHeaders() });
        return handleResponse<SchoolYear>(response);
    },
    getSemesters: async (id: number): Promise<SemesterDto[]> => {
        const response = await fetch(`${API_URL}/SchoolYear/${id}/semesters`, { headers: getHeaders() });
        return handleResponse<SemesterDto[]>(response);
    },
    create: async (data: Partial<SchoolYear>): Promise<SchoolYear> => {
        const response = await fetch(`${API_URL}/SchoolYear`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<SchoolYear>(response);
    },
    update: async (id: number, data: Partial<SchoolYear>): Promise<SchoolYear> => {
        const response = await fetch(`${API_URL}/SchoolYear/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<SchoolYear>(response);
    },
    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/SchoolYear/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse<void>(response);
    }
};

export const semestersApi = {
    update: async (id: number, data: { id: number; name: string; startDate: string; endDate: string; schoolYearId: number }): Promise<SemesterDto> => {
        const response = await fetch(`${API_URL}/Semester/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<SemesterDto>(response);
    }
};

export const classesApi = createCrudResource<SchoolClass>('class');
export const classroomsApi = createCrudResource<Classroom>('classroom');

export const subjectsApi = {
    ...createCrudResource<Subject>('subject'),
    getAll: async (params?: Record<string, any>): Promise<Subject[]> => {
        const url = new URL(`${API_URL}/subject`);
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
    getTeachers: async (subjectId: number): Promise<User[]> => {
        const response = await fetch(`${API_URL}/subject/${subjectId}/teachers`, { headers: getHeaders() });
        return handleResponse(response);
    },
};

export const classManagementApi = {
    getYears: async (): Promise<SchoolYear[]> => {
        const response = await fetch(`${API_URL}/schoolyear`, { headers: getHeaders() });
        return handleResponse(response);
    },
    getSemesters: async (yearId: number): Promise<SemesterDto[]> => {
        const response = await fetch(`${API_URL}/schoolyear/${yearId}/semesters`, { headers: getHeaders() });
        return handleResponse(response);
    },
    getClassesByYear: async (yearId: number, params?: { pageNumber?: number; pageSize?: number; sortBy?: string; sortDesc?: boolean; level?: number; search?: string; includeInactive?: boolean }): Promise<PaginatedResponse<ClassEntity>> => {
        const query = new URLSearchParams({ schoolYearId: String(yearId) });
        if (params?.pageNumber !== undefined) query.append('pageNumber', String(params.pageNumber));
        if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
        if (params?.sortBy) query.append('sortBy', params.sortBy);
        if (params?.sortDesc !== undefined) query.append('sortDesc', String(params.sortDesc));
        if (params?.level !== undefined) query.append('level', String(params.level));
        if (params?.search) query.append('search', params.search);
        if (params?.includeInactive !== undefined) query.append('includeInactive', String(params.includeInactive));
        const response = await fetch(`${API_URL}/class?${query.toString()}`, { headers: getHeaders() });
        return handleResponse(response);
    },
    getClassDetails: async (
        classId: number,
        params?: {
            sortBy?: string;
            sortDesc?: boolean;
            studentSearch?: string;
            subjectSearch?: string;
            subjectSortBy?: string;
            subjectSortDesc?: boolean;
        }
    ): Promise<ClassDetailsDto> => {
        const query = new URLSearchParams();
        if (params) {
            if (params.sortBy) query.append('sortBy', params.sortBy);
            if (params.sortDesc !== undefined) query.append('sortDesc', params.sortDesc.toString());
            if (params.studentSearch) query.append('studentSearch', params.studentSearch);
            if (params.subjectSearch) query.append('subjectSearch', params.subjectSearch);
            if (params.subjectSortBy) query.append('subjectSortBy', params.subjectSortBy);
            if (params.subjectSortDesc !== undefined) query.append('subjectSortDesc', params.subjectSortDesc.toString());
        }
        const response = await fetch(`${API_URL}/class/${classId}/details?${query.toString()}`, { headers: getHeaders() });
        return handleResponse(response);
    },
    getStudentCandidates: async (classId: number, search: string = ''): Promise<User[]> => {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        const response = await fetch(`${API_URL}/class/${classId}/candidates?${query.toString()}`, {
            headers: getHeaders()
        });
        return handleResponse<User[]>(response);
    },
    createClass: async (data: Partial<ClassEntity>) => {
        const response = await fetch(`${API_URL}/class`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    updateClass: async (id: number, data: Partial<ClassEntity>) => {
        const response = await fetch(`${API_URL}/class/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    deleteClass: async (id: number) => {
        const response = await fetch(`${API_URL}/class/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    addStudentToClass: async (classId: number, studentId: number) => {
        const response = await fetch(`${API_URL}/classStudent`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ classId, studentId })
        });
        return handleResponse(response);
    },
    removeStudentFromClass: async (relationId: number) => {
        const response = await fetch(`${API_URL}/class/students/${relationId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    addStudentsBulk: async (classId: number, studentIds: number[]) => {
        const response = await fetch(`${API_URL}/class/students/bulk`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ classId, studentIds })
        });
        return handleResponse(response);
    },
    assignSubject: async (data: { classId: number, subjectId: number, teacherId: number }) => {
        const response = await fetch(`${API_URL}/class/subjects/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    removeSubjectFromClass: async (relationId: number) => {
        const response = await fetch(`${API_URL}/class/subjects/${relationId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    getClassStudents: async (classId: number): Promise<any[]> => {
        const details = await classManagementApi.getClassDetails(classId);
        return details.students || [];
    }
};
