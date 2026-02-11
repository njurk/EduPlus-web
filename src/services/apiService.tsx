import type {
    User, ParentStudents, Role, ChangePasswordDto, PaginatedResponse,
    Announcement, SchoolYear, Classroom, Subject, ClassEntity, ClassDetailsDto, SemesterDto,
    GradeType, GradeCategory, Grade, GradeDto, StudentGradesRowDto,
    AttendanceType, AttendanceAdminDto,
    LessonHour, LessonStatus, ScheduleLesson,
    Ticket, CreateTicketDto, CloseTicketDto, TicketReason,
    PageContent, Page, Target, UnreadCounts,
    DashboardSummary
} from '../types';

export const BASE_URL = 'http://192.168.88.89:5107';
export const API_URL = `${BASE_URL}/api`;

export const getHeaders = () => {
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
        try {
            const errorJson = JSON.parse(errorBody);
            throw new Error(errorJson.message || errorJson.title || errorBody);
        } catch (e) {
            if (e instanceof Error && e.message !== errorBody) throw e;
            throw new Error(errorBody || `HTTP error! status: ${response.status}`);
        }
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
            const response = await fetch(url.toString(), { headers: getHeaders() });
            return handleResponse<T[]>(response);
        },
        get: async (id: number): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, { headers: getHeaders() });
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

type LoginCredentials = { email: string; password: string };

export const authApi = {
    loginAdmin: async (credentials: LoginCredentials) => {
        const response = await fetch(`${API_URL}/auth/login/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return handleResponse(response);
    },
    loginTeacher: async (credentials: LoginCredentials) => {
        const response = await fetch(`${API_URL}/auth/login/teacher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return handleResponse(response);
    },
    logout: async () => {
        const token = localStorage.getItem('token');
        if (token) {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    }
};

export const usersApi = {
    ...createCrudResource<User>('user'),
    getAll: async (params?: { pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, sortDesc?: boolean, showInactive?: boolean, onlyUnassignedRelations?: boolean, roleLevel?: number }): Promise<PaginatedResponse<User>> => {
        const query = new URLSearchParams();
        if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
        if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
        if (params?.search) query.append('search', params.search);
        if (params?.sortBy) query.append('sortBy', params.sortBy);
        if (params?.sortDesc) query.append('sortDesc', 'true');
        if (params?.showInactive) query.append('showInactive', 'true');
        if (params?.onlyUnassignedRelations) query.append('onlyUnassignedRelations', 'true');
        if (params?.roleLevel) query.append('roleLevel', params.roleLevel.toString());

        const response = await fetch(`${API_URL}/user?${query.toString()}`, { headers: getHeaders() });
        return handleResponse<PaginatedResponse<User>>(response);
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
        return handleResponse(response);
    }
};

export const rolesApi = {
    getAll: async (params?: { search?: string, sortBy?: string, sortDesc?: boolean }): Promise<Role[]> => {
        const query = new URLSearchParams();
        if (params?.search) query.append('search', params.search);
        if (params?.sortBy) query.append('sortBy', params.sortBy);
        if (params?.sortDesc !== undefined) query.append('sortDesc', String(params.sortDesc));

        const response = await fetch(`${API_URL}/role?${query.toString()}`, { headers: getHeaders() });
        return handleResponse<Role[]>(response);
    },
    update: async (id: number, data: { name: string; description?: string }): Promise<void> => {
        const response = await fetch(`${API_URL}/role/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<void>(response);
    }
};

export const parentStudentsApi = {
    getAll: async (search: string = '', sortBy?: string, sortDesc?: boolean): Promise<ParentStudents[]> => {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        if (sortBy) query.append('sortBy', sortBy);
        if (sortDesc !== undefined) query.append('sortDesc', sortDesc.toString());

        const response = await fetch(`${API_URL}/ParentStudent?${query.toString()}`, { headers: getHeaders() });
        return handleResponse<ParentStudents[]>(response);
    },
    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/ParentStudent/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse<void>(response);
    }
};

export const schoolYearsApi = {
    ...createCrudResource<SchoolYear>('SchoolYear'),
    getAll: async (params?: Record<string, any>): Promise<SchoolYear[]> => {
        const url = new URL(`${API_URL}/SchoolYear`);
        if (params) {
            Object.keys(params).forEach(key => {
                const value = params[key];
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, value.toString());
                }
            });
        }
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<SchoolYear[]>(response);
    },
    getSemesters: async (id: number): Promise<SemesterDto[]> => {
        const response = await fetch(`${API_URL}/SchoolYear/${id}/semesters`, { headers: getHeaders() });
        return handleResponse<SemesterDto[]>(response);
    }
};

export const semestersApi = {
    create: async (data: { name: string; order: number; startDate: string; endDate: string; schoolYearId: number }): Promise<SemesterDto> => {
        const response = await fetch(`${API_URL}/Semester`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<SemesterDto>(response);
    },
    update: async (id: number, data: { id: number; name: string; startDate: string; endDate: string; schoolYearId: number }): Promise<SemesterDto> => {
        const response = await fetch(`${API_URL}/Semester/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<SemesterDto>(response);
    }
};

export const classroomsApi = createCrudResource<Classroom>('classroom');

export const classManagementApi = {
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
    getClassDetails: async (classId: number, params?: { sortBy?: string; sortDesc?: boolean; studentSearch?: string; subjectSearch?: string; subjectSortBy?: string; subjectSortDesc?: boolean; showInactiveSubjects?: boolean; showInactiveStudents?: boolean }): Promise<ClassDetailsDto> => {
        const query = new URLSearchParams();
        if (params) {
            if (params.sortBy) query.append('sortBy', params.sortBy);
            if (params.sortDesc !== undefined) query.append('sortDesc', params.sortDesc.toString());
            if (params.studentSearch) query.append('studentSearch', params.studentSearch);
            if (params.subjectSearch) query.append('subjectSearch', params.subjectSearch);
            if (params.subjectSortBy) query.append('subjectSortBy', params.subjectSortBy);
            if (params.subjectSortDesc !== undefined) query.append('subjectSortDesc', params.subjectSortDesc.toString());
            if (params.showInactiveSubjects !== undefined) query.append('showInactiveSubjects', params.showInactiveSubjects.toString());
            if (params.showInactiveStudents !== undefined) query.append('showInactiveStudents', params.showInactiveStudents.toString());
        }
        const response = await fetch(`${API_URL}/class/${classId}/details?${query.toString()}`, { headers: getHeaders() });
        return handleResponse(response);
    },
    getStudentCandidates: async (classId: number, search: string = ''): Promise<User[]> => {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        const response = await fetch(`${API_URL}/class/${classId}/candidates?${query.toString()}`, { headers: getHeaders() });
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
    updateSubjectTeacher: async (classSubjectId: number, teacherId: number) => {
        const response = await fetch(`${API_URL}/class/subjects/${classSubjectId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ teacherId })
        });
        return handleResponse(response);
    },
    getStudentsWithParents: async (classId: number): Promise<any[]> => {
        const response = await fetch(`${API_URL}/class/${classId}/student-parents`, { headers: getHeaders() });
        return handleResponse(response);
    },
    restoreSubjectInClass: async (relationId: number) => {
        const response = await fetch(`${API_URL}/class/subjects/${relationId}/restore`, {
            method: 'PUT',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    restoreStudentInClass: async (relationId: number) => {
        const response = await fetch(`${API_URL}/class/students/${relationId}/restore`, {
            method: 'PUT',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

export const subjectsApi = {
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
    getAllSubjectTeachers: async (params?: { pageNumber?: number; pageSize?: number; sortBy?: string; sortDesc?: boolean; search?: string; subjectId?: number; teacherId?: number; showInactive?: boolean }): Promise<PaginatedResponse<any>> => {
        const query = new URLSearchParams();
        if (params?.pageNumber !== undefined) query.append('pageNumber', String(params.pageNumber));
        if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
        if (params?.sortBy) query.append('sortBy', params.sortBy);
        if (params?.sortDesc !== undefined) query.append('sortDesc', String(params.sortDesc));
        if (params?.search) query.append('search', params.search);
        if (params?.subjectId !== undefined) query.append('subjectId', String(params.subjectId));
        if (params?.teacherId !== undefined) query.append('teacherId', String(params.teacherId));
        if (params?.showInactive !== undefined) query.append('showInactive', String(params.showInactive));
        const response = await fetch(`${API_URL}/subject/teachers?${query.toString()}`, { headers: getHeaders() });
        return handleResponse(response);
    },
    addTeacher: async (subjectId: number, teacherId: number) => {
        const response = await fetch(`${API_URL}/subject/${subjectId}/teachers/${teacherId}`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    removeTeacher: async (subjectId: number, teacherId: number) => {
        const response = await fetch(`${API_URL}/subject/${subjectId}/teachers/${teacherId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    updateTeacher: async (subjectId: number, oldTeacherId: number, newTeacherId: number) => {
        const response = await fetch(`${API_URL}/subject/${subjectId}/teachers/${oldTeacherId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ newTeacherId })
        });
        return handleResponse(response);
    },
};

export const gradeTypesApi = createCrudResource<GradeType>('GradeType');

export const gradeCategoriesApi = {
    ...createCrudResource<GradeCategory>('GradeCategory'),
    getBySemester: async (order: number): Promise<any> => {
        const response = await fetch(`${API_URL}/GradeCategory/semester/${order}`, { headers: getHeaders() });
        return handleResponse(response);
    }
};

export const gradeColumnsApi = {
    getAll: async (classId: number, subjectId: number, semesterId: number): Promise<any[]> => {
        const response = await fetch(`${API_URL}/gradecolumn?classId=${classId}&subjectId=${subjectId}&semesterId=${semesterId}`, { headers: getHeaders() });
        return handleResponse(response);
    },
    create: async (data: { classId: number; subjectId: number; semesterId: number; gradeCategoryId: number; name?: string }): Promise<any> => {
        const response = await fetch(`${API_URL}/gradecolumn`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
        return handleResponse(response);
    },
    update: async (id: number, data: { gradeCategoryId: number; name?: string }): Promise<any> => {
        const response = await fetch(`${API_URL}/gradecolumn/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
        return handleResponse(response);
    },
    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/gradecolumn/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (!response.ok) {
            const err = await response.json().catch(() => null);
            throw new Error(err?.message || 'Błąd usuwania kolumny');
        }
    }
};

export const gradesApi = {
    getCurrentSemester: async (yearId: number): Promise<number> => {
        const response = await fetch(`${API_URL}/grade/current-semester/${yearId}`, { headers: getHeaders() });
        return handleResponse(response);
    },
    getClassGrades: async (classId: number, subjectId: number, semester: number, yearId?: number): Promise<StudentGradesRowDto[]> => {
        const url = `${API_URL}/grade/class-grades/${classId}/${subjectId}?semester=${semester}${yearId ? `&schoolYearId=${yearId}` : ''}`;
        const response = await fetch(url, { headers: getHeaders() });
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
    },
    getTeacherAssignments: async (yearId: number): Promise<any[]> => {
        const response = await fetch(`${API_URL}/grade/teacher-assignments?yearId=${yearId}`, { headers: getHeaders() });
        return handleResponse(response);
    },
    createBulk: async (data: { subjectId: number; gradeCategoryId: number; gradeColumnId?: number | null; grades: { studentId: number; gradeTypeId: number }[] }): Promise<any> => {
        const response = await fetch(`${API_URL}/grade/bulk`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    upsertSemester: async (data: { subjectId: number; gradeCategoryId: number; grades: { studentId: number; gradeTypeId: number }[] }): Promise<any> => {
        const response = await fetch(`${API_URL}/grade/bulk-semester`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    }
};

const gradingScaleApi = {
    getAll: async (params?: Record<string, any>): Promise<any[]> => {
        const url = new URL(`${API_URL}/gradingscale`);
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
    update: async (id: number, data: any): Promise<any> => {
        const response = await fetch(`${API_URL}/gradingscale/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
        return handleResponse(response);
    }
};

export const attendanceTypesApi = {
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
    getAllAdmin: async (params?: { pageNumber?: number, pageSize?: number, includeInactive?: boolean, search?: string, sortBy?: string, sortDesc?: boolean, classId?: number, date?: string, subjectName?: string, teacherName?: string, attendanceTypeShortCode?: string, orderNumber?: number, semesterId?: number }): Promise<PaginatedResponse<AttendanceAdminDto>> => {
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
        if (params?.orderNumber) url.searchParams.append('orderNumber', params.orderNumber.toString());
        if (params?.semesterId) url.searchParams.append('semesterId', params.semesterId.toString());
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<PaginatedResponse<AttendanceAdminDto>>(response);
    },
    update: async (id: number, attendanceTypeId: number): Promise<void> => {
        const response = await fetch(`${API_URL}/attendance/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ attendanceTypeId })
        });
        return handleResponse(response);
    }
};

export const excusesApi = {
    getAll: async (params?: { pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, sortDesc?: boolean, showInactive?: boolean, statusFilter?: string, classId?: number, semesterId?: number, teacherId?: number }): Promise<PaginatedResponse<any>> => {
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
    getById: async (id: number): Promise<any> => {
        const response = await fetch(`${API_URL}/excuse/${id}`, { headers: getHeaders() });
        return handleResponse(response);
    },
    accept: async (id: number, isAccepted: boolean | null): Promise<void> => {
        const response = await fetch(`${API_URL}/excuse/${id}/accept`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ isAccepted })
        });
        return handleResponse(response);
    },
    restore: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/excuse/${id}/restore`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

export const lessonHoursApi = createCrudResource<LessonHour>('LessonHour');
export const lessonStatusesApi = createCrudResource<LessonStatus>('LessonStatus');

export const scheduleApi = {
    getClassSchedule: async (classId: number, semesterId?: number): Promise<ScheduleLesson[]> => {
        const url = new URL(`${API_URL}/WeeklySchedule/${classId}`);
        if (semesterId) url.searchParams.append('semesterId', semesterId.toString());
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse(response);
    },
    getAvailableForDate: async (date: string, classId?: number, teacherId?: number, semesterId?: number): Promise<any[]> => {
        const url = new URL(`${API_URL}/WeeklySchedule/available`);
        url.searchParams.append('date', date);
        if (classId) url.searchParams.append('classId', classId.toString());
        if (teacherId) url.searchParams.append('teacherId', teacherId.toString());
        if (semesterId) url.searchParams.append('semesterId', semesterId.toString());
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse(response);
    },
    createOrUpdate: async (data: { id?: number; classId: number; semesterId: number; subjectId: number; teacherId: number; classroomId: number; dayOfWeek: number; lessonHourId: number }): Promise<any> => {
        const response = await fetch(`${API_URL}/WeeklySchedule`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/WeeklySchedule/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    clearSchedule: async (classId: number, semesterId: number): Promise<{ deletedCount: number }> => {
        const url = new URL(`${API_URL}/WeeklySchedule/clear`);
        url.searchParams.append('classId', classId.toString());
        url.searchParams.append('semesterId', semesterId.toString());
        const response = await fetch(url.toString(), {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    getTeacherSchedule: async (teacherId: number, semesterId?: number): Promise<ScheduleLesson[]> => {
        const url = new URL(`${API_URL}/WeeklySchedule/teacher/${teacherId}`);
        if (semesterId) url.searchParams.append('semesterId', semesterId.toString());
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse(response);
    },
    getAvailableClassrooms: async (semesterId: number, dayOfWeek: number, lessonHourId: number, excludeId?: number): Promise<Classroom[]> => {
        const url = new URL(`${API_URL}/WeeklySchedule/available-classrooms`);
        url.searchParams.append('semesterId', semesterId.toString());
        url.searchParams.append('dayOfWeek', dayOfWeek.toString());
        url.searchParams.append('lessonHourId', lessonHourId.toString());
        if (excludeId) url.searchParams.append('excludeId', excludeId.toString());
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse(response);
    }
};

export const lessonsApi = {
    getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<any>> => {
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
        return handleResponse<PaginatedResponse<any>>(response);
    },
    createFromSchedule: async (scheduleId: number, date: string, teacherId?: number, statusId?: number): Promise<any> => {
        const response = await fetch(`${API_URL}/lesson/from-schedule`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ scheduleId, date, teacherId, statusId })
        });
        return handleResponse(response);
    },
    getDetails: async (id: number): Promise<any> => {
        const response = await fetch(`${API_URL}/lesson/${id}/details`, { headers: getHeaders() });
        return handleResponse(response);
    },
    getAttendance: async (id: number): Promise<any[]> => {
        const response = await fetch(`${API_URL}/lesson/${id}/attendance`, { headers: getHeaders() });
        return handleResponse(response);
    },
    updateAttendance: async (lessonId: number, studentId: number, attendanceTypeId: number | null): Promise<any[]> => {
        const response = await fetch(`${API_URL}/lesson/${lessonId}/attendance/${studentId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ attendanceTypeId })
        });
        return handleResponse(response);
    },
    update: async (id: number, data: any): Promise<any> => {
        const response = await fetch(`${API_URL}/lesson/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/lesson/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    restore: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/lesson/${id}/restore`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

export const announcementsApi = {
    ...createCrudResource<Announcement>('announcement'),
    getAll: async (params?: { pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, sortDesc?: boolean, showInactive?: boolean, authorName?: string, targetRoleId?: number }): Promise<PaginatedResponse<Announcement>> => {
        const url = new URL(`${API_URL}/announcement`);
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, value.toString());
                }
            });
        }
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<PaginatedResponse<Announcement>>(response);
    },
    restore: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/announcement/${id}/restore`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        return handleResponse<void>(response);
    },
    getAuthors: async (): Promise<string[]> => {
        const response = await fetch(`${API_URL}/announcement/authors`, { headers: getHeaders() });
        return handleResponse<string[]>(response);
    },
    markAsRead: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/announcement/${id}/read`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse<void>(response);
    }
};

export const ticketsApi = {
    getAll: async (pageNumber: number = 1, pageSize: number = 10, showClosed?: boolean, search?: string, sortBy?: string, sortDesc?: boolean, reasonId?: number): Promise<PaginatedResponse<Ticket>> => {
        const url = new URL(`${API_URL}/Ticket`);
        url.searchParams.append('pageNumber', pageNumber.toString());
        url.searchParams.append('pageSize', pageSize.toString());
        if (showClosed !== undefined) url.searchParams.append('showClosed', showClosed.toString());
        if (search) url.searchParams.append('search', search);
        if (sortBy) url.searchParams.append('sortBy', sortBy);
        if (sortDesc !== undefined) url.searchParams.append('sortDesc', sortDesc.toString());
        if (reasonId !== undefined) url.searchParams.append('reasonId', reasonId.toString());

        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<PaginatedResponse<Ticket>>(response);
    },
    create: async (data: CreateTicketDto): Promise<Ticket> => {
        const response = await fetch(`${API_URL}/Ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
    },
    getById: async (id: number): Promise<Ticket> => {
        const response = await fetch(`${API_URL}/Ticket/${id}`, { headers: getHeaders() });
        return handleResponse<Ticket>(response);
    }
};

export const ticketReasonsApi = {
    getAll: async (filters?: { search?: string; sortBy?: string; sortDesc?: boolean; showInactive?: boolean }): Promise<TicketReason[]> => {
        const url = new URL(`${API_URL}/TicketReason`);
        if (filters?.search) url.searchParams.append('search', filters.search);
        if (filters?.sortBy) url.searchParams.append('sortBy', filters.sortBy);
        if (filters?.sortDesc !== undefined) url.searchParams.append('sortDesc', filters.sortDesc.toString());
        if (filters?.showInactive !== undefined) url.searchParams.append('showInactive', filters.showInactive.toString());
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<TicketReason[]>(response);
    },
    getActive: async (): Promise<TicketReason[]> => {
        const response = await fetch(`${API_URL}/TicketReason/active`);
        return handleResponse<TicketReason[]>(response);
    },
    create: async (data: Partial<TicketReason>): Promise<TicketReason> => {
        const response = await fetch(`${API_URL}/TicketReason`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<TicketReason>(response);
    },
    update: async (id: number, data: Partial<TicketReason>): Promise<TicketReason> => {
        const response = await fetch(`${API_URL}/TicketReason/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<TicketReason>(response);
    },
    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/TicketReason/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse<void>(response);
    }
};

export const pageContentApi = {
    getByPageId: async (pageId: number, search?: string): Promise<PageContent[]> => {
        const url = new URL(`${API_URL}/PageContent`);
        url.searchParams.append('pageId', pageId.toString());
        if (search) url.searchParams.append('search', search);
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<PageContent[]>(response);
    },
    update: async (id: number, newValue: string): Promise<PageContent> => {
        const response = await fetch(`${API_URL}/PageContent/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(newValue)
        });
        return handleResponse<PageContent>(response);
    },
    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/PageContent/upload-image`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        if (!response.ok) throw new Error(await response.text());
        return response.text();
    }
};

export const targetsApi = {
    getAll: async (): Promise<Target[]> => {
        const response = await fetch(`${API_URL}/Target`, { headers: getHeaders() });
        return handleResponse(response);
    }
};

export const pagesApi = {
    getAll: async (targetId?: number): Promise<Page[]> => {
        const url = new URL(`${API_URL}/Page`);
        if (targetId) url.searchParams.append('targetId', targetId.toString());
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse(response);
    }
};

export const cmsApi = {
    getByPageLabel: async (pageLabel: string): Promise<{ key: string; value: string }[]> => {
        const response = await fetch(`${API_URL}/PageContent/by-label/${encodeURIComponent(pageLabel)}`, { headers: getHeaders() });
        return handleResponse(response);
    }
};

export const dashboardApi = {
    getSummary: async (): Promise<DashboardSummary> => {
        const response = await fetch(`${API_URL}/dashboard/summary`, { headers: getHeaders() });
        return handleResponse<DashboardSummary>(response);
    }
};

export const exportApi = {
    downloadSchedule: async (params: { classId: number; yearId?: number; semesterId?: number; format: 'pdf' | 'xlsx' | 'docx' }): Promise<void> => {
        const url = new URL(`${API_URL}/export/schedule/${params.format}`);
        url.searchParams.set('classId', params.classId.toString());
        if (params.yearId) url.searchParams.set('yearId', params.yearId.toString());
        if (params.semesterId) url.searchParams.set('semesterId', params.semesterId.toString());

        const response = await fetch(url.toString(), { headers: getHeaders() });
        if (!response.ok) throw new Error('Błąd eksportu');
        const blob = await response.blob();
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `plan-lekcji-${timestamp}.${params.format}`;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
    },
    downloadGrades: async (params: { classId: number; semesterId: number; schoolYearId: number; subjectId?: number; studentId?: number; format: 'pdf' | 'xlsx' }): Promise<void> => {
        const url = new URL(`${API_URL}/export/grades/${params.format}`);
        url.searchParams.set('classId', params.classId.toString());
        url.searchParams.set('semesterId', params.semesterId.toString());
        url.searchParams.set('schoolYearId', params.schoolYearId.toString());
        if (params.subjectId) url.searchParams.set('subjectId', params.subjectId.toString());
        if (params.studentId) url.searchParams.set('studentId', params.studentId.toString());

        const response = await fetch(url.toString(), { headers: getHeaders() });
        if (!response.ok) throw new Error('Błąd eksportu');
        const blob = await response.blob();
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `wykaz-ocen-${timestamp}.${params.format}`;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
    }
};

export const layoutApi = {
    getUnreadCounts: async (): Promise<UnreadCounts> => {
        const response = await fetch(`${API_URL}/layout/unread-counts`, { headers: getHeaders() });
        return handleResponse<UnreadCounts>(response);
    }
};

export const api = {
    auth: authApi,
    users: usersApi,
    roles: rolesApi,
    parentStudents: parentStudentsApi,
    schoolYears: schoolYearsApi,
    semesters: semestersApi,
    classrooms: classroomsApi,
    classManagement: classManagementApi,
    subjects: subjectsApi,
    gradeTypes: gradeTypesApi,
    gradeCategories: gradeCategoriesApi,
    gradeColumns: gradeColumnsApi,
    grades: gradesApi,
    gradingScale: gradingScaleApi,
    attendanceTypes: attendanceTypesApi,
    attendance: attendanceApi,
    excuses: excusesApi,
    lessonHours: lessonHoursApi,
    lessonStatuses: lessonStatusesApi,
    schedule: scheduleApi,
    lessons: lessonsApi,
    announcements: announcementsApi,
    tickets: ticketsApi,
    ticketReasons: ticketReasonsApi,
    pageContent: pageContentApi,
    targets: targetsApi,
    pages: pagesApi,
    cms: cmsApi,
    dashboard: dashboardApi,
    export: exportApi,
    layout: layoutApi
};
