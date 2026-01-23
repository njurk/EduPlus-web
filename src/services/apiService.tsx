import { authApi } from './api/auth';
import { usersApi, rolesApi, userRolesApi, parentStudentsApi } from './api/users';
import { announcementsApi } from './api/announcements';
import { schoolYearsApi, classesApi, classroomsApi, subjectsApi, classManagementApi } from './api/school';
import { gradeTypesApi, gradeCategoriesApi, classGradesApi, gradesApi } from './api/grades';
import { attendanceTypesApi, attendanceApi, excusesApi } from './api/attendance';
import { lessonHoursApi, lessonStatusesApi, scheduleApi, lessonsApi } from './api/lessons';
import { ticketsApi, ticketReasonsApi } from './api/tickets';
import { pageContentApi, targetsApi, pagesApi, cmsApi } from './api/cms';
import { dashboardApi } from './api/dashboard';
import { exportApi } from './api/export';

export { API_URL } from './api/core';

export const api = {
    auth: authApi,
    users: usersApi,
    roles: rolesApi,
    userRoles: userRolesApi,
    parentStudents: parentStudentsApi,
    announcements: announcementsApi,
    schoolYears: schoolYearsApi,
    classes: classesApi,
    classrooms: classroomsApi,
    subjects: subjectsApi,
    classManagement: classManagementApi,
    gradeTypes: gradeTypesApi,
    gradeCategories: gradeCategoriesApi,
    classGrades: classGradesApi,
    grades: gradesApi,
    attendanceTypes: attendanceTypesApi,
    attendance: attendanceApi,
    excuses: excusesApi,
    lessonHours: lessonHoursApi,
    lessonStatuses: lessonStatusesApi,
    schedule: scheduleApi,
    lessons: lessonsApi,
    tickets: ticketsApi,
    ticketReasons: ticketReasonsApi,
    pageContent: pageContentApi,
    targets: targetsApi,
    pages: pagesApi,
    cms: cmsApi,
    dashboard: dashboardApi,
    export: exportApi
};
