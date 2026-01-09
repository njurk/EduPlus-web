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
  comment?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
    gradeType?: {
        numeric: string;
        name: string;
        value: number;
    };
    gradeCategory?: {
        name: string;
    };
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
  orderNumber: number;
  average?: number;
  grades: Grade[];
}