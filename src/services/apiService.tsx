import type { 
    User, UserRole, Announcement, SchoolClass, DashboardSummary, 
    AttendanceChartData, ParentStudentRelation, Role,
    Classroom, LessonHour, LessonStatus, GradeType, GradeCategory, AttendanceType, Subject
} from '../types';

const API_URL = 'https://localhost:7252/api';

const handleResponse = async <T = any>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) return null as T;
    const text = await response.text();
    return text ? JSON.parse(text) : {} as T;
};

function createCrudResource<T>(endpoint: string) {
    return {
        getAll: async (params?: Record<string, any>): Promise<T[]> => {
            const url = new URL(`${API_URL}/${endpoint}`);
            if (params) {
                Object.keys(params).forEach(key => {
                    const value = params[key];
                    if (value !== undefined && value !== null && value !== '') {
                        url.searchParams.append(key, value.toString());
                    }
                });
            }
            const response = await fetch(url.toString());
            return handleResponse<T[]>(response);
        },
        get: async (id: number): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`);
            return handleResponse<T>(response);
        },
        create: async (data: Partial<T>): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse<T>(response);
        },
        update: async (id: number, data: Partial<T>): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse<T>(response);
        },
        delete: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });
            return handleResponse<void>(response);
        }
    };
}

export const api = {
    users: {
        ...createCrudResource<User>('user'),
        getAll: async (params?: { search?: string, sortBy?: string, sortDesc?: boolean, showInactive?: boolean, onlyUnassignedParents?: boolean, roleName?: string }): Promise<User[]> => {
            const query = new URLSearchParams();
            if (params?.search) query.append('search', params.search);
            if (params?.sortBy) query.append('sortBy', params.sortBy);
            if (params?.sortDesc) query.append('sortDesc', 'true');
            if (params?.showInactive) query.append('showInactive', 'true');
            if (params?.onlyUnassignedParents) query.append('onlyUnassignedParents', 'true');
            if (params?.roleName) query.append('roleName', params.roleName);

            const response = await fetch(`${API_URL}/user?${query.toString()}`);
            return handleResponse<User[]>(response);
        },
        restore: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/user/${id}/restore`, { method: 'PATCH' });
            return handleResponse<void>(response);
        }
    },

    roles: {
        ...createCrudResource<Role>('role'),
        getAll: async (params?: { search?: string, sortBy?: string, sortDesc?: boolean, showInactive?: boolean }): Promise<Role[]> => {
            const query = new URLSearchParams();
            if (params?.search) query.append('search', params.search);
            if (params?.sortBy) query.append('sortBy', params.sortBy);
            if (params?.sortDesc) query.append('sortDesc', 'true');
            if (params?.showInactive) query.append('showInactive', 'true');

            const response = await fetch(`${API_URL}/role?${query.toString()}`);
            return handleResponse<Role[]>(response);
        },
        restore: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/role/${id}/restore`, { method: 'PATCH' });
            return handleResponse<void>(response);
        }
    },

    userRoles: createCrudResource<UserRole>('userrole'),
    classes: createCrudResource<SchoolClass>('class'),
    announcements: createCrudResource<Announcement>('announcement'),
    
    parentStudents: {
        getAll: async (search: string = '', sortBy?: string, sortDesc?: boolean): Promise<ParentStudentRelation[]> => {
            const query = new URLSearchParams();
            if (search) query.append('search', search);
            if (sortBy) query.append('sortBy', sortBy);
            if (sortDesc) query.append('sortDesc', 'true');
            
            const response = await fetch(`${API_URL}/ParentStudent?${query.toString()}`);
            return handleResponse<ParentStudentRelation[]>(response);
        },
        delete: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/ParentStudent/${id}`, { method: 'DELETE' });
            return handleResponse<void>(response);
        },
        create: async (data: Partial<ParentStudentRelation>): Promise<ParentStudentRelation> => {
             const response = await fetch(`${API_URL}/ParentStudent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse<ParentStudentRelation>(response);
        }
    },
    
    classrooms: createCrudResource<Classroom>('classroom'), 
    lessonHours: createCrudResource<LessonHour>('LessonHour'),
    lessonStatuses: createCrudResource<LessonStatus>('LessonStatus'),
    gradeTypes: createCrudResource<GradeType>('GradeType'),
    gradeCategories: createCrudResource<GradeCategory>('GradeCategory'),
    attendanceTypes: createCrudResource<AttendanceType>('AttendanceType'),
    subjects: createCrudResource<Subject>('subject'),

    dashboard: {
        getSummary: async (): Promise<DashboardSummary> => {
            const response = await fetch(`${API_URL}/dashboard/summary`);
            return await response.json();
        },
        getAttendanceChart: async (): Promise<AttendanceChartData[]> => {
            const response = await fetch(`${API_URL}/dashboard/attendance-chart`);
            return await response.json();
        }
    },
};