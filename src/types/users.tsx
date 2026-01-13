import type { BaseEntity } from './common';

export interface Role extends BaseEntity {
  name: string;
  description: string;
  level: number;
}

export interface UserRole extends BaseEntity {
  userId: number;
  roleId: number;
  role?: Role;
}

export interface User extends BaseEntity {
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

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}