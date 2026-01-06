import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { AdminLayout } from './layouts/AdminLayout';
import { Users } from './pages/Users';
import { SystemConfig } from './pages/SystemConfig';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="system-config" element={<SystemConfig />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}