import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";

const linkStyle = ({ isActive }: any) => ({
  padding: "10px 14px",
  borderRadius: 8,
  background: isActive ? "#e8ebff" : "transparent",
  color: "#1a1a1a",
  textDecoration: "none",
});

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const role = String(user?.role ?? user?.type ?? "").trim().toLowerCase();
  const isTeacher = role === "teacher";
  const base = isTeacher ? "/teacher" : "/student";

  const onLogout = async () => {
    await logout();
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <aside style={{ width: 240, background: "#fff", padding: 24 }}>
      <h2 style={{ marginBottom: 32 }}>STUDEASY</h2>

      <nav style={{ display: "grid", gap: 8 }}>
        <NavLink to={base} style={linkStyle}>Dashboard</NavLink>

        {!isTeacher && (
          <NavLink to={`${base}/subjects`} style={linkStyle}>Cours</NavLink>
        )}

        <NavLink to={`${base}/classes`} style={linkStyle}>Classes</NavLink>

        {isTeacher ? (
          <NavLink to={`${base}/insights`} style={linkStyle}>Insights</NavLink>
        ) : (
          <NavLink to={`${base}/errors`} style={linkStyle}>Erreurs</NavLink>
        )}

        <NavLink to={`${base}/profile`} style={linkStyle}>Profile</NavLink>

        <button
          onClick={onLogout}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #e6e6e6",
            background: "transparent",
            textAlign: "left",
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          Déconnexion
        </button>
      </nav>
    </aside>
  );
}
