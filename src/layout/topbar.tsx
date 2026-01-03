import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";

export default function Topbar() {
  const { setUser } = useAuth();

  return (
    <header className="topbar">
      {/* Élément conservé uniquement pour le layout */}
      <span className="topbar-title" />

      <button
        className="topbar-action"
        onClick={() => logout().then(() => setUser(null))}
      >
        Déconnexion
      </button>
    </header>
  );
}
