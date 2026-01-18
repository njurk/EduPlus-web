import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Dashboard } from './pages/admin/Dashboard';
import { AdminLayout } from './layouts/AdminLayout';
import { Users } from './pages/admin/Users';
import { SystemConfig } from './pages/admin/SystemConfig';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Settings } from './pages/admin/Settings';
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
import { useCMSContent } from './hooks/useCMSContent';

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
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route element={<ProtectedRoute requiredLevel={1} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
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
          <Route path="excuses" element={<Excuses />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
