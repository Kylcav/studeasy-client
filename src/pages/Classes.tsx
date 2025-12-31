import { useEffect, useState } from "react";
import { getClasses } from "../api/classes";
import { useNavigate } from "react-router-dom";

export default function Classes() {
  const [classes, setClasses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getClasses()
      .then(setClasses)
      .catch((e) => setError(e?.message ?? "Impossible de charger les classes."));
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Classes</h1>

      {error && <div style={errorBox}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {classes.map((c) => (
          <button
            key={c._id}
            onClick={() => navigate(`/classes/${c._id}`)}
            style={cardButton}
          >
            <div style={{ fontWeight: 800, fontSize: 16 }}>{c.name ?? "Classe"}</div>
            <div style={{ color: "#666", marginTop: 6 }}>
              {c.subjects?.length ? `${c.subjects.length} cours` : "0 cours"}
            </div>
          </button>
        ))}
      </div>

      {!error && classes.length === 0 && (
        <div style={{ color: "#666" }}>Aucune classe trouvée.</div>
      )}
    </div>
  );
}

const cardButton: React.CSSProperties = {
  textAlign: "left",
  background: "#fff",
  borderRadius: 14,
  padding: 16,
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  cursor: "pointer",
};

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};
