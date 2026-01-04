import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/admin/Dashboard';
import { AdminLayout } from './layouts/AdminLayout';
import { Users } from './pages/admin/Users';
import { SystemConfig } from './pages/admin/SystemConfig';

export default function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="system-config" element={<SystemConfig />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}