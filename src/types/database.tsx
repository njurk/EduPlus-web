export interface Announcement {
    id: number;
    title: string;
    description: string;
    authorId: number;
    authorName?: string;
    modifiedByName?: string;
    targetRoles?: string;
    isRead?: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Attendance {
    id: number;
    lessonId: number;
    lesson?: Lesson;
    studentId: number;
    student?: User;
    attendanceTypeId: number;
    attendanceType?: AttendanceType;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AttendanceAdminDto {
    id: number;
    studentId: number;
    studentName: string;
    studentEmail: string;
    subjectName: string;
    teacherName: string;
    typeName: string;
    shortCode: string;
    colorHex: string;
    lessonDate: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}

export interface AttendanceType {
    id: number;
    name: string;
    shortCode: string;
    colorHex: string;
    isNegative?: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BaseEntity {
    id: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

export interface ClassDetailsDto {
    classInfo: ClassEntity;
    students: ClassStudent[];
    subjects: ClassSubject[];
}

export interface ClassEntity {
    id: number;
    level: number;
    letter: string;
    schoolYearId: number;
    isActive: boolean;
    homeroomTeacherId?: number;
    homeroomTeacherName?: string;
    createdAt: string;
    updatedAt: string;
    studentCount?: number;
}

export interface Classroom {
    id: number;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ClassStudent {
    id: number;
    classId: number;
    orderNumber: number;
    studentId: number;
    createdAt: string;
    updatedAt: string;
    modifiedByName?: string;
    isActive: boolean;
    student: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface ClassSubject {
    id: number;
    classId: number;
    subjectId: number;
    subjectName?: string;
    teacherName?: string;
    teacherId?: number;
    createdAt: string;
    updatedAt: string;
    modifiedByName?: string;
    isActive: boolean;
}

export interface CloseTicketDto {
    adminResponse: string;
}

export interface CreateTicketDto {
    email: string;
    reasonId: number;
    content: string;
}

export interface Excuse {
    id: number;
    parentName: string;
    studentName: string;
    className: string | null;
    isAccepted: boolean | null;
    acceptedAt: string | null;
    modifiedByName: string | null;
    reason: string;
    createdAt: string;
    attendanceCount: number;
}

export interface ExcuseDetails extends Excuse {
    attendances: { id: number; date: string; subjectName: string; lessonHour: number }[];
}

export interface Grade {
    id: number;
    studentId: number;
    subjectId: number;
    gradeTypeId: number;
    gradeCategoryId: number;
    gradeColumnId?: number | null;
    comment?: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    teacherName?: string;
    gradeType?: {
        numeric: string;
        name: string;
        value: number;
    };
    gradeCategory?: {
        name: string;
        colorHex?: string;
    };
}

export interface GradeCategory {
    id: number;
    name: string;
    weight: number;
    colorHex: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GradeDto {
    studentId: number;
    subjectId: number;
    gradeTypeId: number;
    gradeCategoryId: number;
    gradeColumnId?: number | null;
    comment?: string;
}

export interface GradeType {
    id: number;
    name: string;
    numeric: string;
    value: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GradingScale {
    id: number;
    gradeTypeId: number;
    gradeTypeName: string;
    minAverage: number;
    maxAverage: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    modifiedByName?: string;
}

export interface Lesson {
    id: number;
    subjectId: number;
    classId: number;
    teacherId: number;
    date: string;
    topic?: string;
    orderNumber: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LessonAttendanceDto {
    id: number;
    studentId: number;
    studentName: string;
    studentNumber: number;
    attendanceTypeId?: number;
    attendanceTypeName: string;
    shortCode: string;
    colorHex: string;
}

export interface LessonDetailsDto {
    id: number;
    subjectId: number;
    subjectName: string;
    classId: number;
    className: string;
    teacherId: number;
    teacherName: string;
    classroomId?: number;
    classroomName: string;
    date: string;
    dayOfWeek: number;
    orderNumber: number;
    startTime: string;
    endTime: string;
    topic: string;
    statusId: number;
    statusName: string;
    createdAt: string;
    updatedAt: string;
    modifiedByName?: string;
}

export interface LessonHour {
    id: number;
    orderNumber: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LessonStatus {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LogContent {
    fileName: string;
    totalLines: number;
    lines: string[];
}

export interface LogFile {
    name: string;
    size: number;
    lastModified: string;
}

export interface Page {
    id: number;
    title: string;
    link: string;
    targetId: number;
}

export interface PageContent {
    id: number;
    pageId: number;
    key: string;
    value: string;
}

export interface PaginatedResponse<T> {
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    data: T[];
}

export interface ParentStudents {
    id: number;
    parentId: number;
    parentName: string;
    parentEmail: string;
    studentId: number;
    studentName: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Role {
    id: number;
    name: string;
    description: string;
    level: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ScheduleLesson {
    id: number;
    subjectId: number;
    subjectName: string;
    classId: number;
    className: string;
    teacherId: number;
    teacherName: string;
    classroomId?: number;
    classroomName?: string;
    date?: string;
    dayOfWeek: number;
    orderNumber: number;
    startTime: string;
    endTime: string;
    topic?: string;
}

export interface SchoolClass {
    id: number;
    name: string;
    schoolYearId: number;
    studentsCount?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SchoolYear {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface SchoolYearFormData {
    id?: number;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    semester1: { id?: number; endDate: string };
    semester2: { id?: number; startDate: string };
}

export interface SemesterDto {
    id: number;
    name: string;
    order: number;
    startDate?: string;
    endDate?: string;
}

export interface StudentGradesRowDto {
    id: number;
    studentId: number;
    firstName: string;
    lastName: string;
    orderNumber: number;
    average?: number;
    grades: Grade[];
}

export interface Subject {
    id: number;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SubjectList {
    id: number;
    name: string;
}

export interface SubjectTeacherRow {
    id: string;
    subjectId: number;
    teacherId: number;
    subjectName: string;
    teacherName: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    modifiedByName?: string;
}

export interface Target {
    id: number;
    label: string;
    title: string;
}

export interface Ticket {
    id: number;
    email: string;
    reasonId: number;
    reasonName: string;
    content: string;
    isClosed: boolean;
    closedAt?: string;
    adminResponse?: string;
    createdAt: string;
    updatedAt: string;
    modifiedByName?: string;
}

export interface TicketReason {
    id: number;
    name: string;
}

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    password?: string;
    userRoles: UserRole[];
    childIds?: number[];
    parentIds?: number[];
    relations?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserRole {
    id: number;
    userId: number;
    roleId: number;
    role?: Role;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserUpdateDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    isActive: boolean;
    roleIds: number[];
    childIds?: number[];
    password?: string;
}
