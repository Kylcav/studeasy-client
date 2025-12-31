import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
