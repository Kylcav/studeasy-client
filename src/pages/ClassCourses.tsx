import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSubjectsByClass } from "../api/subjects";

export default function ClassCourses() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    getSubjectsByClass(classId)
      .then(setSubjects)
      .catch((e) => setError(e?.message ?? "Request failed"));
  }, [classId]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate("/classes")} style={backBtn}>←</button>
        <h1 style={{ margin: 0 }}>Cours</h1>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {subjects.map((s) => (
          <div key={s._id} style={card}>
            <div style={{ fontWeight: 800 }}>{s.title ?? "Cours"}</div>
            <div style={{ color: "#666", marginTop: 6 }}>
              {s.chapters?.length ? `${s.chapters.length} chapitres` : ""}
            </div>
          </div>
        ))}
      </div>

      {!error && subjects.length === 0 && (
        <div style={{ color: "#666" }}>Aucun cours dans cette classe.</div>
      )}
    </div>
  );
}

const backBtn: React.CSSProperties = {
  border: "none",
  background: "#fff",
  borderRadius: 10,
  padding: "8px 10px",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

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
