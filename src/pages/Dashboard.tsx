import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <p style={{ margin: "6px 0 0", color: "#555" }}>
          Connecté en tant que <b>{user?.email}</b> — rôle <b>{user?.role}</b>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard title="Cours" value="—" />
        <StatCard title="Classes" value="—" />
        <StatCard title="Erreurs" value="—" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <QuickCard title="Mes cours" desc="Voir les matières, documents, quiz." to="/subjects" />
        <QuickCard title="Mes classes" desc="Suivi des classes et élèves." to="/classes" />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={card}>
      <div style={{ color: "#666", fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function QuickCard({ title, desc, to }: { title: string; desc: string; to: string }) {
  return (
    <Link to={to} style={{ ...card, textDecoration: "none", color: "inherit" }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
      <div style={{ color: "#666", marginTop: 6 }}>{desc}</div>
      <div style={{ marginTop: 10, color: "#2f4bff", fontWeight: 600 }}>Ouvrir →</div>
    </Link>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};
