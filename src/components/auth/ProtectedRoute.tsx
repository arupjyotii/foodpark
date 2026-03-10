import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/useAuth';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, loading, initialized } = useAuth();

    if (!initialized || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse space-y-4 w-64">
                    <div className="h-12 bg-slate-200 rounded-lg w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
