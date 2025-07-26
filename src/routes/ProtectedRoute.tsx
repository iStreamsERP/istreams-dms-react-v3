// src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthContextType } from '@/types/auth';

const ProtectedRoute: React.FC = () => {
  const { userData, loading } = useAuth() as AuthContextType;

  if (loading) return null;

  return userData?.userEmail ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;