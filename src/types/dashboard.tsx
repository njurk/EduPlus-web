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
  reasonName: string;
  email: string;
  createdAt: string;
  isClosed: boolean;
}

export interface DashboardSummary {
  stats: DashboardStats;
  status: DashboardStatus;
  recentTickets: DashboardTicket[];
}
