import type {
    User, UserRole, Announcement, SchoolClass, DashboardSummary,
    AttendanceChartData, ParentStudentRelation, Role,
    Classroom, LessonHour, LessonStatus, GradeType, GradeCategory, AttendanceType, Subject, ChangePasswordDto
} from '../types';

const API_URL = 'https://localhost:7252/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const handleResponse = async <T = any>(response: Response): Promise<T> => {
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
    }

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
            const response = await fetch(url.toString(), {
                headers: getHeaders()
            });
            return handleResponse<T[]>(response);
        },
        get: async (id: number): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                headers: getHeaders()
            });
            return handleResponse<T>(response);
        },
        create: async (data: Partial<T>): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse<T>(response);
        },
        update: async (id: number, data: Partial<T>): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse<T>(response);
        },
        delete: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse<void>(response);
        }
    };
}

export const api = {
    auth: {
        login: async (credentials: { email: string; password: string }) => {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            if (!response.ok) {
                if (response.status === 401) throw new Error("Nieprawidłowy email lub hasło");
                throw new Error("Błąd serwera");
            }
            return await response.json();
        }
    },
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

            const response = await fetch(`${API_URL}/user?${query.toString()}`, {
                headers: getHeaders()
            });
            return handleResponse<User[]>(response);
        },
        restore: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/user/${id}/restore`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            return handleResponse<void>(response);
        },
        changePassword: async (id: number, data: ChangePasswordDto) => {
            const response = await fetch(`${API_URL}/user/${id}/change-password`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                let errorMessage = errorBody;
                try {
                    const json = JSON.parse(errorBody);
                    errorMessage = json.message || json.title || errorMessage;
                } catch { }
                throw new Error(errorMessage || "Błąd zmiany hasła");
            }

            return await response.json();
        }
    },

    roles: {
        getAll: async (params?: { search?: string }): Promise<Role[]> => {
            const query = new URLSearchParams();
            if (params?.search) query.append('search', params.search);

            const response = await fetch(`${API_URL}/role?${query.toString()}`, { headers: getHeaders() });
            return handleResponse<Role[]>(response);
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

            const response = await fetch(`${API_URL}/ParentStudent?${query.toString()}`, {
                headers: getHeaders()
            });
            return handleResponse<ParentStudentRelation[]>(response);
        },
        delete: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/ParentStudent/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse<void>(response);
        },
        create: async (data: Partial<ParentStudentRelation>): Promise<ParentStudentRelation> => {
            const response = await fetch(`${API_URL}/ParentStudent`, {
                method: 'POST',
                headers: getHeaders(),
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
            const response = await fetch(`${API_URL}/dashboard/summary`, {
                headers: getHeaders()
            });
            return handleResponse<DashboardSummary>(response);
        },
        getAttendanceChart: async (): Promise<AttendanceChartData[]> => {
            const response = await fetch(`${API_URL}/dashboard/attendance-chart`, {
                headers: getHeaders()
            });
            return handleResponse<AttendanceChartData[]>(response);
        }
    },
};