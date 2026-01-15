import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/admin/Dashboard';
import { AdminLayout } from './layouts/AdminLayout';
import { Users } from './pages/admin/Users';
import { SystemConfig } from './pages/admin/SystemConfig';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Settings } from './pages/admin/Settings';
import { ClassManagement } from './pages/admin/ClassManagement';
import { ClassRegister } from './pages/teacher/ClassRegister';
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

export default function App() {
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
          <Route path="class-register" element={<ClassRegister />} />
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


