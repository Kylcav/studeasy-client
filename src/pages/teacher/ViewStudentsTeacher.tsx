import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import { getClassStudents, removeStudentsFromClass } from "../../api/classes";

export default function ViewStudentsTeacher() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!classId) return;
    try {
      setError(null);
      const data = await getClassStudents(classId);
      setStudents(Array.isArray(data) ? data : data?.students ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger les élèves.");
    }
  };

  useEffect(() => {
    refresh();
  }, [classId]);

  const onRemove = async () => {
    if (!classId) return;
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    if (ids.length === 0) return;

    if (!confirm("Retirer ces élèves de la classe ?")) return;

    try {
      setLoading(true);
      await removeStudentsFromClass(classId, ids);
      setSelected({});
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Suppression impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate(`/teacher/classes/${classId}`)} style={backBtn}>←</button>
        <h1 style={{ margin: 0 }}>Élèves</h1>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <Card>
        <div style={{ padding: 14, display: "grid", gap: 10 }}>
          {students.map((s) => (
            <label key={s._id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={!!selected[s._id]}
                onChange={(e) => setSelected((p) => ({ ...p, [s._id]: e.target.checked }))}
              />
              <div style={{ display: "grid" }}>
                <div style={{ fontWeight: 800 }}>{s.name ?? "Élève"}</div>
                <div style={{ color: "#666", fontSize: 13 }}>{s.email ?? ""}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="button" disabled={loading} onClick={onRemove}>
          {loading ? "..." : "Retirer de la classe"}
        </Button>
      </div>
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

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};
