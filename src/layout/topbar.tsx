import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";

export default function Topbar() {
  const { setUser } = useAuth();

  return (
    <header className="topbar">
      {/* Header sobre et pro */}
      <span className="topbar-title">Quizparty</span>

      <button
        className="topbar-action"
        onClick={() => logout().then(() => setUser(null))}
      >
        Déconnexion
      </button>
    </header>
  );
}
