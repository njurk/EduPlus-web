import type { BaseEntity } from './common';

export interface SchoolYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
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
  studentCount?: number;
}

export interface Classroom extends BaseEntity {
  name: string;
}

export interface Subject extends BaseEntity {
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
}

export interface ClassDetailsDto {
  classInfo: ClassEntity;
  students: ClassStudent[];
  subjects: ClassSubject[];
}