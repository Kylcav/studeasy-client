import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";

export default function Topbar() {
  const { user, setUser } = useAuth();

  return (
    <header style={{
      height: 64,
      background: "#fff",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 24px",
    }}>
      <span>Bienvenue {user?.email}</span>
      <button
        onClick={() => logout().then(() => setUser(null))}
      >
        Déconnexion
      </button>
    </header>
  );
}
