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

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
}

export interface DashboardStatus {
  schoolYear: string;
  semester: string;
  avgGrade: string;
}

export interface DashboardAnnouncement {
  id: number;
  title: string;
  date: string;
  author: string;
}

export interface DashboardSummary {
  stats: DashboardStats;
  status: DashboardStatus;
  announcements: DashboardAnnouncement[];
}

export interface AttendanceChartData {
  date: string;
  dayName: string;
  attendancePercentage: number;
}

export interface ParentStudentRelation {
  id: number;
  parentId: number;
  parentName: string;
  parentEmail: string;
  studentId: number;
  studentName: string;
  createdAt?: string;
  updatedAt?: string;
}