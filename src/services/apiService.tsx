import type { 
    User, UserRole, Announcement, SchoolClass, DashboardSummary, 
    AttendanceChartData, ParentStudentRelation, Role
} from '../types';

const API_URL = 'https://localhost:7252/api';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) return null;
    return await response.json();
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
            return handleResponse(response);
        },

        create: async (data: Partial<T>): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },

        update: async (id: number, data: Partial<T>): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },

        delete: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'DELETE'
            });
            return handleResponse(response);
        }
    };
}

export const api = {
    users: {
        ...createCrudResource<User>('user'),

        getAll: async (params?: { search?: string, sortBy?: string, sortDesc?: boolean, showInactive?: boolean, onlyUnassignedParents?: boolean }) => {
            const query = new URLSearchParams();
            if (params?.search) query.append('search', params.search);
            if (params?.sortBy) query.append('sortBy', params.sortBy);
            if (params?.sortDesc) query.append('sortDesc', 'true');
            if (params?.showInactive) query.append('showInactive', 'true');
            if (params?.onlyUnassignedParents) query.append('onlyUnassignedParents', 'true');

            const response = await fetch(`${API_URL}/user?${query.toString()}`);
            return handleResponse(response);
        }
    },

    roles: createCrudResource<Role>('role'),
    userRoles: createCrudResource<UserRole>('userrole'),
    classes: createCrudResource<SchoolClass>('class'),
    announcements: createCrudResource<Announcement>('announcement'),
    parentStudents: createCrudResource<ParentStudentRelation>('ParentStudent'),
    classrooms: createCrudResource<any>('classroom'), 
    lessonHours: createCrudResource<any>('LessonHour'),
    lessonStatuses: createCrudResource<any>('LessonStatus'),
    gradeTypes: createCrudResource<any>('GradeType'),
    attendanceTypes: createCrudResource<any>('AttendanceType'),
    subjects: createCrudResource<any>('subject'),

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