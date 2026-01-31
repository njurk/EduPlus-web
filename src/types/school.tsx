import type { BaseEntity } from './common';

export interface SchoolYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface SemesterDto {
  id: number;
  name: string;
  order: number;
  startDate?: string;
  endDate?: string;
}

export interface SchoolClass extends BaseEntity {
  name: string;
  schoolYearId: number;
  studentsCount?: number;
}

export interface ClassEntity {
  id: number;
  level: number;
  letter: string;
  schoolYearId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
}

export interface Classroom extends BaseEntity {
  name: string;
}

export interface Subject extends BaseEntity {
  id: number;
  name: string;
}

export interface SubjectList {
  id: number;
  name: string;
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

export interface ClassDetailsDto {
  classInfo: ClassEntity;
  students: ClassStudent[];
  subjects: ClassSubject[];
}

export interface LessonStatus extends BaseEntity {
  name: string;
  slug: string;
}

export interface LessonHour extends BaseEntity {
  orderNumber: number;
  startTime: string;
  endTime: string;
}

export interface Lesson extends BaseEntity {
  subjectId: number;
  classId: number;
  teacherId: number;
  date: string;
  topic?: string;
  orderNumber: number;
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
