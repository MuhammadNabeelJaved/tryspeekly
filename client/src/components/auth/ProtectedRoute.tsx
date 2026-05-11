import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Loader';

interface ProtectedRouteProps {
  allowedRoles?: ('student' | 'teacher' | 'admin')[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectMap: Record<string, string> = {
      student: '/dashboard',
      teacher: '/instructor',
      admin: '/admin',
    };
    return <Navigate to={redirectMap[user.role] || '/'} replace />;
  }

  return <>{children}</>;
}