import type { BaseEntity } from "./common";
import type { Lesson } from "./school";
import type { User } from './users';


export interface AttendanceType extends BaseEntity {
    name: string;
    shortCode: string;
    colorHex: string;
    isNegative?: boolean;
}

export interface Attendance extends BaseEntity {
    lessonId: number;
    lesson?: Lesson;

    studentId: number;
    student?: User;

    attendanceTypeId: number;
    attendanceType?: AttendanceType;
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