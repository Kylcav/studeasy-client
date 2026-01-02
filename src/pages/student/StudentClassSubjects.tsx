import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getSubjectsByClass } from "../../api/subjects";
import { getClasses } from "../../api/classes";

export default function StudentClassSubjects() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [className, setClassName] = useState<string>("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;

    let mounted = true;

    getClasses()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : res?.classes ?? [];
        const found = list.find((c: any) => String(c?.id ?? c?._id ?? "") === String(classId));
        if (found) setClassName(String(found?.name ?? ""));
      })
      .catch(() => {});

    getSubjectsByClass(String(classId))
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : res?.subjects ?? [];
        setSubjects(list);
      })
      .catch((e) => mounted && setError(e?.message ?? "Request failed"));

    return () => {
      mounted = false;
    };
  }, [classId]);

  const title = useMemo(() => (className ? `Cours · ${className}` : "Cours"), [className]);

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 980 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate("/student/classes")} style={backBtn}>
          ←
        </button>
        <h1 style={{ margin: 0 }}>{title}</h1>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <div style={grid}>
        {subjects.map((s) => {
          const subjectId = String(s?.id ?? s?._id ?? "");
          const quizCount =
            Number(s?.quizQuestionCount) ||
            (Array.isArray(s?.quizQuestions) ? s.quizQuestions.length : 0);

          return (
            <Card key={subjectId}>
              <div style={{ padding: 16, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 6, minWidth: 260 }}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{s?.title ?? "Cours"}</div>
                    <div style={{ color: "#666", fontSize: 13 }}>{s?.description ?? ""}</div>
                    <div style={{ color: "#666", fontSize: 13 }}>
                      Quiz: {quizCount ? `${quizCount} questions` : "non disponible"}
                    </div>
                  </div>

                  <Button
                    type="button"
                    disabled={!quizCount}
                    onClick={() =>
                      navigate(`/student/quiz/${subjectId}`, {
                        state: { classId: String(classId), className, subjectTitle: s?.title ?? "" },
                      })
                    }
                  >
                    Lancer le quiz
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!error && subjects.length === 0 && (
        <Card>
          <div style={{ padding: 14, color: "#666" }}>Aucun cours dans cette classe.</div>
        </Card>
      )}
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

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
