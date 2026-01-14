import type { BaseEntity } from './common';
import type { User } from './users';

export interface Announcement extends BaseEntity {
  title: string;
  description: string;
  authorId: number;
  author?: User;
}

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalParents: number;
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

export interface DashboardTicket {
  id: number;
  subject: string;
  userName: string;
  createdAt: string;
  isClosed: boolean;
}

export interface DashboardSummary {
  stats: DashboardStats;
  status: DashboardStatus;
  recentTickets: DashboardTicket[];
}

export interface AttendanceChartData {
  date: string;
  dayName: string;
  attendancePercentage: number;
}

export interface UptimeInfo {
  startedAt: string;
  uptime: string;
  uptimeSeconds: number;
}
