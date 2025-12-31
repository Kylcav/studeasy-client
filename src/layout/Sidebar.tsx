import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }: any) => ({
  padding: "10px 14px",
  borderRadius: 8,
  background: isActive ? "#e8ebff" : "transparent",
  color: "#1a1a1a",
  textDecoration: "none",
});

export default function Sidebar() {
  return (
    <aside style={{ width: 240, background: "#fff", padding: 24 }}>
      <h2 style={{ marginBottom: 32 }}>STUDEASY</h2>

      <nav style={{ display: "grid", gap: 8 }}>
        <NavLink to="/" style={linkStyle}>Dashboard</NavLink>
        <NavLink to="/subjects" style={linkStyle}>Cours</NavLink>
        <NavLink to="/classes" style={linkStyle}>Classes</NavLink>
        <NavLink to="/errors" style={linkStyle}>Erreurs</NavLink>
      </nav>
    </aside>
  );
}
