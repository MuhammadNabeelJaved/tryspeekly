import { Navigate, Link, useLocation } from 'react-router-dom';
import { EnvelopeSimple, ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Loader';

interface ProtectedRouteProps {
  allowedRoles?: ('student' | 'teacher' | 'admin' | 'team_member')[];
  children: React.ReactNode;
}

function EmailNotVerifiedScreen({ email }: { email: string }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-violet-50 px-4 dark:from-neutral-950 dark:via-neutral-900 dark:to-violet-950">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <EnvelopeSimple size={40} weight="fill" className="text-amber-600 dark:text-amber-400" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Email Not Verified
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-neutral-400">
          Your account is not verified yet. Please verify your email address first to access this page.
        </p>

        {email && (
          <p className="mt-2 text-sm text-slate-400 dark:text-neutral-500">
            We sent a code to{' '}
            <span className="font-semibold text-slate-600 dark:text-slate-300">{email}</span>
          </p>
        )}

        <Link
          to="/verify-email"
          state={{ email, fromLogin: true }}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          Verify Your Account
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    </div>
  );
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

  if (user && user.isVerified === false) {
    return <EmailNotVerifiedScreen email={user.email ?? ''} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const redirectMap: Record<string, string> = {
      student: '/dashboard',
      teacher: '/instructor',
      admin: '/admin',
      team_member: '/team',
    };
    return <Navigate to={redirectMap[user.role] || '/'} replace />;
  }

  return <>{children}</>;
}