import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { user } = useAuth();
  const role = String(user?.role ?? user?.type ?? "").trim().toLowerCase();

  if (!role) return null;

  return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
}
