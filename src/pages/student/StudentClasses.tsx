import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/card";
import { getClasses } from "../../api/classes";

export default function StudentClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    getClasses()
      .then((res) => {
        if (!mounted) return;
        setClasses(Array.isArray(res) ? res : res?.classes ?? []);
      })
      .catch((e) => mounted && setError(e?.message ?? "Impossible de charger les classes."));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Classes</h1>
      <p style={{ margin: 0, color: "#666" }}>
        Choisis ta classe pour accéder aux cours et lancer des quiz.
      </p>

      {error && <div style={errorBox}>{error}</div>}

      <div style={grid}>
        {classes.map((c) => {
          const id = String(c?.id ?? c?._id ?? "");
          return (
            <button
              key={id}
              onClick={() => navigate(`/student/classes/${id}`)}
              style={cardButton}
            >
              <div style={{ fontWeight: 900, fontSize: 16 }}>{c?.name ?? "Classe"}</div>
              <div style={{ color: "#666", marginTop: 6 }}>
                {c?.subjects?.length ? `${c.subjects.length} cours` : "0 cours"}
              </div>
            </button>
          );
        })}
      </div>

      {!error && classes.length === 0 && (
        <Card>
          <div style={{ padding: 14, color: "#666" }}>Aucune classe trouvée.</div>
        </Card>
      )}
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

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
