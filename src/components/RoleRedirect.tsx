import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";

export default function RoleRedirect() {
  const { user, setUser } = useAuth();
  const role = String(user?.role ?? user?.type ?? "").trim().toLowerCase();

  // ✅ si role manquant => on logout (cache/payload invalide) pour éviter écran blanc
  if (!role) {
    // on fait simple: purge + redirect login
    logout();
    setUser(null);
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
}
