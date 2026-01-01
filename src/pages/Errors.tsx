import { useEffect, useState } from "react";
import Card from "../components/ui/card";
import { getMyMistakes } from "../api/quiz";

export default function Errors() {
  const [data, setData] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyMistakes()
      .then((res) => {
        setData(res);
        const first = res?.classes?.[0]?.classId;
        setSelectedClassId(first ? String(first) : "");
      })
      .catch((e) => setError(e?.message ?? "Impossible de charger les erreurs."));
  }, []);

  const classes = Array.isArray(data?.classes) ? data.classes : [];
  const mistakesByClass = data?.mistakesByClass ?? {};
  const mistakes = selectedClassId ? (mistakesByClass[selectedClassId] ?? []) : [];

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 900 }}>
      <h1 style={{ margin: 0 }}>Mes erreurs</h1>

      {error && <div style={errorBox}>{error}</div>}

      {classes.length > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Classe :</div>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={select}>
            {classes.map((c: any) => (
              <option key={c.classId} value={c.classId}>
                {c.className || "Classe"}
              </option>
            ))}
          </select>
        </div>
      )}

      {mistakes.length === 0 && !error && (
        <div style={{ color: "#666" }}>Aucune erreur enregistrée pour le moment.</div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {mistakes.map((m: any, idx: number) => (
          <Card key={idx}>
            <div style={{ padding: 14, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 800 }}>{m.question}</div>
              <div style={{ color: "#b00020" }}>
                Ta réponse : <b>{m.selectedOptionText || "—"}</b>
              </div>
              <div style={{ color: "#137333" }}>
                Bonne réponse : <b>{m.correctOptionText || "—"}</b>
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>
                Chapitre : {m.subjectTitle || "—"} · Tentative #{m.attemptNumber || 1}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const select: React.CSSProperties = {
  height: 38,
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.12)",
  padding: "0 10px",
  outline: "none",
};

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};
