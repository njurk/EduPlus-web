export interface BaseEntity {
  id: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole extends BaseEntity {
  userId: number;
  roleId: number;
  role?: Role;
}

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  password?: string;
  userRoles: UserRole[];
}

export interface Role extends BaseEntity {
  name: string;
}

export interface Announcement extends BaseEntity {
  title: string;
  description: string;
  authorId: number;
  author?: User;
}

export interface SchoolClass extends BaseEntity {
  name: string;
  schoolYearId: number;
  studentsCount?: number; 
}