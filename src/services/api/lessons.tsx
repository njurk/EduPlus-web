import type { LessonHour, LessonStatus, ScheduleLesson } from '../../types';
import { API_URL, getHeaders, handleResponse, createCrudResource } from './core';

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
    }
};

export const lessonsApi = {
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
    },
    createFromSchedule: async (scheduleId: number, date: string, teacherId?: number): Promise<any> => {
        const response = await fetch(`${API_URL}/lesson/from-schedule`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ scheduleId, date, teacherId })
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
    updateAttendance: async (lessonId: number, studentId: number, attendanceTypeId: number | null): Promise<void> => {
        const response = await fetch(`${API_URL}/lesson/${lessonId}/attendance/${studentId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ attendanceTypeId })
        });
        return handleResponse(response);
    }
};
