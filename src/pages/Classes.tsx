import { useEffect, useState } from "react";
import { getClasses } from "../api/classes";

export default function Classes() {
  const [classes, setClasses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

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
          <div key={c._id} style={card}>
            <div style={{ fontWeight: 700 }}>{c.name ?? "Classe"}</div>
            <div style={{ color: "#666", marginTop: 6 }}>
              {c.schoolName ?? c.school?.name ?? "—"}
            </div>
          </div>
        ))}
      </div>

      {!error && classes.length === 0 && (
        <div style={{ color: "#666" }}>Aucune classe trouvée.</div>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};
