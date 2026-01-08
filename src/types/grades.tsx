import type { BaseEntity } from './common';

export interface GradeType extends BaseEntity {
  id: number;
  name: string;
  numeric: string;
  value: number;
}

export interface GradeCategory extends BaseEntity {
  id: number;
  name: string;
  weight: number;
}

export interface Grade {
  id: number;
  studentId: number;
  subjectId: number;
  gradeTypeId: number;
  gradeCategoryId: number;
  gradeType?: GradeType;
  gradeCategory?: GradeCategory;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradeDto {
  studentId: number;
  subjectId: number;
  gradeTypeId: number;
  gradeCategoryId: number;
  comment?: string;
}

export interface StudentGradesRowDto {
  id: number;
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
  orderNumber: number;
  grades: Grade[];
}

export interface LessonStatus extends BaseEntity {
  name: string;
}

export interface LessonHour extends BaseEntity {
  orderNumber: number;
  startTime: string;
  endTime: string;
}

export interface AttendanceType extends BaseEntity {
  name: string;
  shortCode: string;
}