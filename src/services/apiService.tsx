import type {
    User, UserRole, Announcement, SchoolClass, DashboardSummary, AttendanceChartData, ParentStudents, Role,
    Classroom, LessonHour, LessonStatus, GradeType, GradeCategory, AttendanceType, Subject, ChangePasswordDto,
    SchoolYear, ClassEntity, ClassDetailsDto, StudentGradesRowDto,
    SemesterDto
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
                const errorBody = await response.text();
                try {
                    const errorJson = JSON.parse(errorBody);
                    throw new Error(errorJson.message || errorJson.title || errorBody);
                } catch {
                    throw new Error(errorBody || "Wystąpił błąd serwera");
                }
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
        getAll: async (search: string = '', sortBy?: string, sortDesc?: boolean): Promise<ParentStudents[]> => {
            const query = new URLSearchParams();
            if (search) query.append('search', search);
            if (sortBy) query.append('sortBy', sortBy);
            if (sortDesc) query.append('sortDesc', 'true');

            const response = await fetch(`${API_URL}/ParentStudent?${query.toString()}`, {
                headers: getHeaders()
            });
            return handleResponse<ParentStudents[]>(response);
        },
        delete: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/ParentStudent/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse<void>(response);
        },
        create: async (data: Partial<ParentStudents>): Promise<ParentStudents> => {
            const response = await fetch(`${API_URL}/ParentStudent`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse<ParentStudents>(response);
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

    classManagement: {
        getYears: async (): Promise<SchoolYear[]> => {
            const response = await fetch(`${API_URL}/schoolyear`, { headers: getHeaders() });
            return handleResponse(response);
        },
        getSemesters: async (yearId: number): Promise<SemesterDto[]> => {
            const response = await fetch(`${API_URL}/schoolyear/${yearId}/semesters`, { headers: getHeaders() });
            return handleResponse(response);
        },
        getClassesByYear: async (yearId: number): Promise<ClassEntity[]> => {
            const response = await fetch(`${API_URL}/class?schoolYearId=${yearId}`, { headers: getHeaders() });
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
                if (params.studentSearch) query.append('studentSearch', params.studentSearch); // Obsługa
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
            const response = await fetch(`${API_URL}/classStudent/${relationId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse(response);
        },
        assignSubject: async (data: { classId: number, subjectId: number, teacherId: number }) => {
            const response = await fetch(`${API_URL}/classSubject/assign`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        removeSubjectFromClass: async (relationId: number) => {
            const response = await fetch(`${API_URL}/classSubject/${relationId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse(response);
        }
    },
    classGrades: {
        getClassGrades: async (classId: number, subjectId: number, semester: number, yearId?: number): Promise<StudentGradesRowDto[]> => {
            const url = `${API_URL}/grade/class-grades/${classId}/${subjectId}?semester=${semester}${yearId ? `&schoolYearId=${yearId}` : ''}`;
            const response = await fetch(url, { headers: getHeaders() });
            return handleResponse(response);
        }
    },
    grades: {
        getCurrentSemester: async (yearId: number): Promise<number> => {
            const response = await fetch(`${API_URL}/grade/current-semester/${yearId}`, { headers: getHeaders() });
            return handleResponse(response);
        },
        create: async (data: any) => {
            const response = await fetch(`${API_URL}/grade`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        update: async (id: number, data: any) => {
            const response = await fetch(`${API_URL}/grade/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        delete: async (id: number) => {
            const response = await fetch(`${API_URL}/grade/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse(response);
        }
    },
};