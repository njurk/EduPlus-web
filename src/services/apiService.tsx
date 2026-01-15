import type {
    User, UserRole, Announcement, SchoolClass, DashboardSummary, AttendanceChartData, ParentStudents, Role,
    Classroom, LessonHour, LessonStatus, GradeType, GradeCategory, AttendanceType, Subject, ChangePasswordDto,
    SchoolYear, ClassEntity, ClassDetailsDto, StudentGradesRowDto,
    SemesterDto, GradeDto, Grade, AttendanceAdminDto, UptimeInfo,
    PaginatedResponse, Ticket, CreateTicketDto, CloseTicketDto, PageContent, Page, Target, ScheduleLesson
} from '../types';

const API_URL = 'http://localhost:5107/api';

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
        },
        restore: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}/restore`, {
                method: 'PATCH',
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
    schoolYears: {
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

    attendanceTypes: {
        ...createCrudResource<AttendanceType>('AttendanceType'),
        getAll: async (): Promise<AttendanceType[]> => {
            const params = new URLSearchParams({
                showInactive: 'false',
                sortBy: 'name',
                sortDesc: 'false'
            });

            const response = await fetch(`${API_URL}/attendancetype?${params}`, {
                headers: getHeaders()
            });
            return handleResponse(response);
        }
    },

    subjects: {
        ...createCrudResource<Subject>('subject'),
        getAll: async (): Promise<Subject[]> => {
            const response = await fetch(`${API_URL}/subject`, { headers: getHeaders() });
            return handleResponse(response);
        },
        getTeachers: async (subjectId: number): Promise<User[]> => {
            const response = await fetch(`${API_URL}/subject/${subjectId}/teachers`, { headers: getHeaders() });
            return handleResponse(response);
        },
    },

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
        },
        getUptime: async (): Promise<UptimeInfo> => {
            const response = await fetch(`${API_URL}/dashboard/uptime`);
            return handleResponse<UptimeInfo>(response);
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
            const response = await fetch(`${API_URL}/classStudent/${relationId}`, {
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
        getAll: async (params?: Record<string, any>): Promise<any[]> => {
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
        }
    },
    attendance: {
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
    },
    tickets: {
        getAll: async (pageNumber: number = 1, pageSize: number = 10, showClosed?: boolean, search?: string, sortBy?: string, sortDesc?: boolean): Promise<PaginatedResponse<Ticket>> => {
            const url = new URL(`${API_URL}/Ticket`);
            url.searchParams.append('pageNumber', pageNumber.toString());
            url.searchParams.append('pageSize', pageSize.toString());
            if (showClosed !== undefined) url.searchParams.append('showClosed', showClosed.toString());
            if (search) url.searchParams.append('search', search);
            if (sortBy) url.searchParams.append('sortBy', sortBy);
            if (sortDesc !== undefined) url.searchParams.append('sortDesc', sortDesc.toString());

            const response = await fetch(url.toString(), { headers: getHeaders() });
            return handleResponse<PaginatedResponse<Ticket>>(response);
        },
        create: async (data: CreateTicketDto): Promise<Ticket> => {
            const response = await fetch(`${API_URL}/Ticket`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse<Ticket>(response);
        },
        close: async (id: number, data: CloseTicketDto): Promise<void> => {
            const response = await fetch(`${API_URL}/Ticket/${id}/close`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse<void>(response);
        }
    },
    pageContent: {
        getByPageId: async (pageId: number): Promise<PageContent[]> => {
            const response = await fetch(`${API_URL}/PageContent?pageId=${pageId}`, { headers: getHeaders() });
            return handleResponse<PageContent[]>(response);
        },
        update: async (id: number, newValue: string): Promise<PageContent> => {
            const response = await fetch(`${API_URL}/PageContent/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(newValue)
            });
            return handleResponse<PageContent>(response);
        }
    },
    targets: {
        getAll: async (): Promise<Target[]> => {
            const response = await fetch(`${API_URL}/Target`, { headers: getHeaders() });
            return handleResponse(response);
        }
    },
    pages: {
        getAll: async (targetId?: number): Promise<Page[]> => {
            const url = new URL(`${API_URL}/Page`);
            if (targetId) url.searchParams.append('targetId', targetId.toString());
            const response = await fetch(url.toString(), { headers: getHeaders() });
            return handleResponse(response);
        }
    },
    schedule: {
        getClassSchedule: async (classId: number, dateFrom: string, dateTo: string): Promise<ScheduleLesson[]> => {
            const url = new URL(`${API_URL}/WeeklySchedule/${classId}`);
            url.searchParams.append('dateFrom', dateFrom);
            url.searchParams.append('dateTo', dateTo);
            const response = await fetch(url.toString(), { headers: getHeaders() });
            return handleResponse(response);
        }
    },
    lessons: {
        ...createCrudResource<any>('lesson'),
        getAll: async (params?: Record<string, any>): Promise<any[]> => {
            const url = new URL(`${API_URL}/lesson`);
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
    },
    excuses: {
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
        }
    },
    export: {
        downloadSchedulePdf: async (classId: number, yearId?: number, semesterId?: number): Promise<void> => {
            const url = new URL(`${API_URL}/export/schedule/pdf`);
            url.searchParams.append('classId', classId.toString());
            if (yearId) url.searchParams.append('yearId', yearId.toString());
            if (semesterId) url.searchParams.append('semesterId', semesterId.toString());
            const response = await fetch(url.toString(), { headers: getHeaders() });
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `plan_lekcji_${classId}.pdf`;
            link.click();
        },
        downloadScheduleXlsx: async (classId: number, yearId?: number, semesterId?: number): Promise<void> => {
            const url = new URL(`${API_URL}/export/schedule/xlsx`);
            url.searchParams.append('classId', classId.toString());
            if (yearId) url.searchParams.append('yearId', yearId.toString());
            if (semesterId) url.searchParams.append('semesterId', semesterId.toString());
            const response = await fetch(url.toString(), { headers: getHeaders() });
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `plan_lekcji_${classId}.xlsx`;
            link.click();
        },
        downloadScheduleCsv: async (classId: number, yearId?: number, semesterId?: number): Promise<void> => {
            const url = new URL(`${API_URL}/export/schedule/csv`);
            url.searchParams.append('classId', classId.toString());
            if (yearId) url.searchParams.append('yearId', yearId.toString());
            if (semesterId) url.searchParams.append('semesterId', semesterId.toString());
            const response = await fetch(url.toString(), { headers: getHeaders() });
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `plan_lekcji_${classId}.csv`;
            link.click();
        }
    }
}


