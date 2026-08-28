import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';

export function ProtectedRoute({ requireRole }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && user.role !== requireRole) {
    // If admin is required and user is student, redirect to /chat
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
