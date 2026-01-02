import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";

export default function Topbar() {
  const { user, setUser } = useAuth();

  return (
    <header className="topbar">
      <span className="topbar-title">Bienvenue {user?.email}</span>
      <button className="topbar-action" onClick={() => logout().then(() => setUser(null))}>
        Déconnexion
      </button>
    </header>
  );
}
