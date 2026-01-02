import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/admin/Dashboard';
import { AdminLayout } from './layouts/AdminLayout';
import { Users } from './pages/admin/Users';
import { Classrooms } from './pages/admin/Classrooms';

export default function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="classrooms" element={<Classrooms />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}