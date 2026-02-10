import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Dashboard } from './pages/admin/Dashboard';
import { AdminLayout } from './layouts/AdminLayout';
import { TeacherLayout } from './layouts/TeacherLayout';
import { TeacherDashboard } from './pages/teacher/Dashboard';
import { Users } from './pages/admin/Users';
import { SystemConfig } from './pages/admin/SystemConfig';
import { TeacherLogin, AdminLogin } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Settings } from './pages/Settings';
import { ClassManagement } from './pages/admin/ClassManagement';
import { Schedule } from './pages/admin/Schedule';
import { Announcements } from './pages/admin/Announcements';
import { Tickets } from './pages/admin/Tickets';
import { CMS } from './pages/admin/CMS';
import { ResetPassword } from './pages/ResetPassword';
import { Unauthorized } from './pages/Unauthorized';
import { Grades } from './pages/admin/Grades';
import { Attendance } from './pages/admin/Attendance';
import { Lessons } from './pages/admin/Lessons';
import { Excuses } from './pages/admin/Excuses';
import { Logs } from './pages/admin/Logs';
import { Subjects } from './pages/admin/Subjects';
import { SubmitTicket } from './pages/SubmitTicket';
import { useCMSContent } from './hooks/useCMSContent';
import { TeacherSchedule } from './pages/teacher/Schedule';
import { Registry } from './pages/teacher/Registry';
import { TeacherExcuses } from './pages/teacher/Excuses';
import { TeacherAnnouncements } from './pages/teacher/Announcements';

const DefaultRedirect = () => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roles: string[] = user.roles || [];
    if (roles.includes('Administrator')) return <Navigate to="/admin/dashboard" replace />;
    if (roles.includes('Nauczyciel')) return <Navigate to="/teacher" replace />;
  } catch { }

  return <Navigate to="/login" replace />;
};
export default function App() {
  const { getText } = useCMSContent('system');

  useEffect(() => {
    const pageTitle = getText('pageTitle');
    const faviconUrl = getText('faviconUrl');
    if (pageTitle) document.title = pageTitle;
    if (faviconUrl) {
      const link = document.getElementById('favicon') as HTMLLinkElement;
      if (link) link.href = '/' + faviconUrl + '?v=' + Date.now();
    }
  }, [getText]);

  return (
    <Routes>
      <Route path="/login" element={<TeacherLogin />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/submit-ticket" element={<SubmitTicket />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute requiredLevel={1} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="system-config" element={<SystemConfig />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="class-management" element={<ClassManagement />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="cms" element={<CMS />} />
          <Route path="grades" element={<Grades />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="lessons" element={<Lessons />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="excuses" element={<Excuses />} />
          <Route path="logs" element={<Logs />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredLevel={2} />}>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="schedule" element={<TeacherSchedule />} />
          <Route path="registry" element={<Registry />} />
          <Route path="excuses" element={<TeacherExcuses />} />
          <Route path="announcements" element={<TeacherAnnouncements />} />
        </Route>
      </Route>

      <Route path="/" element={<DefaultRedirect />} />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}
