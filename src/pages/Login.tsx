import { api } from '../services/apiService';
import { LoginPage } from '../components/views/LoginPage';
import { ShieldCheckIcon } from 'lucide-react';

export const AdminLogin = () => (
    <LoginPage
        cmsKey="adminLogin"
        loginFn={api.auth.loginAdmin}
        redirectTo="/admin/dashboard"
        headerBg="bg-neutral-900"
        switchLink={{ to: '/login', cmsLabel: 'teacherLink' }}
    />
);

export const TeacherLogin = () => (
    <LoginPage
        cmsKey="teacherLogin"
        loginFn={api.auth.loginTeacher}
        redirectTo="/teacher"
        headerBg="bg-primary"
        buildUserData={(r) => ({ isHomeroomTeacher: r.isHomeroomTeacher })}
        switchLink={{ to: '/admin-login', icon: <ShieldCheckIcon size={18} /> }}
    />
);
