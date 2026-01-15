import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
  roleLevel?: number;
}

interface ProtectedRouteProps {
  requiredLevel?: number;
}

export const ProtectedRoute = ({ requiredLevel }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }

    if (requiredLevel !== undefined && decoded.roleLevel !== undefined) {
      if (decoded.roleLevel > requiredLevel) {
        return <Navigate to="/unauthorized" state={{ from: location }} replace />;
      }
    }

    return <Outlet />;

  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};