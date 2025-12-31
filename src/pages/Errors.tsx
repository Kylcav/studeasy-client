import { useEffect, useState } from "react";
import { getErrors } from "../api/errors";

export default function Errors() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getErrors()
      .then(setItems)
      .catch((e) => setError(e?.message ?? "Impossible de charger les erreurs."));
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Erreurs fréquentes</h1>
      <p style={{ margin: 0, color: "#666" }}>
        Les questions les plus ratées (utile pour améliorer les cours).
      </p>

      {error && <div style={errorBox}>{error}</div>}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((e) => (
          <div key={e._id ?? e.question} style={row}>
            <div style={{ fontWeight: 700 }}>{e.question ?? "Question"}</div>
            <div style={{ color: "#666" }}>
              Taux d’erreur : <b>{e.errorRate ?? e.rate ?? "—"}%</b>
            </div>
          </div>
        ))}
      </div>

      {!error && items.length === 0 && (
        <div style={{ color: "#666" }}>Aucune statistique d’erreurs pour le moment.</div>
      )}
    </div>
  );
}

const row: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
};

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};
