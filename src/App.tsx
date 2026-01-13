import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { AdminLayout } from './layouts/AdminLayout';
import { Users } from './pages/Users';
import { SystemConfig } from './pages/SystemConfig';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Settings } from './pages/Settings';
import { ClassManagement } from './pages/ClassManagement';
import { ClassRegister } from './pages/ClassRegister';
import { Schedule } from './pages/Schedule';
import { Announcements } from './pages/Announcements';
import { Tickets } from './pages/Tickets';
import { CMS } from './pages/CMS';
import { ResetPassword } from './pages/ResetPassword';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute />}>
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
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}