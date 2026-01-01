import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import { deleteSubject, getSubjectsByClass } from "../../api/subjects";

export default function ClassChaptersTeacher() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!classId) return;
    setError(null);
    setLoading(true);
    try {
      const data = await getSubjectsByClass(classId);
      const list = Array.isArray(data) ? data : data?.subjects ?? [];
      setSubjects(list);
    } catch (e: any) {
      setError(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const getId = (s: any) => String(s?.id ?? s?._id ?? "");

  const onDelete = async (s: any) => {
    const sid = getId(s);
    if (!sid) return;

    if (!confirm(`Supprimer le chapitre "${s?.title ?? "Cours"}" ?`)) return;

    setError(null);
    try {
      await deleteSubject(sid);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Impossible de supprimer le chapitre.");
    }
  };

  const onViewQuiz = (s: any) => {
    const sid = getId(s);
    if (!sid) return;
    navigate(`/teacher/classes/${classId}/view-quiz/${sid}`);
  };

  const onEditQuiz = (s: any) => {
    const sid = getId(s);
    if (!sid) return;

    // on passe un state comme mobile (si présent) pour éviter un refetch inutile
    navigate(`/teacher/classes/${classId}/generated-questions/${sid}`, {
      state: {
        subjectId: sid,
        subjectTitle: s?.title ?? "",
        subjectDescription: s?.description ?? "",
        quizQuestions: Array.isArray(s?.quizQuestions) ? s.quizQuestions : [],
      },
    });
  };

  const getQuestionCount = (s: any) => {
    if (typeof s?.quizQuestionCount === "number") return s.quizQuestionCount;
    if (Array.isArray(s?.quizQuestions)) return s.quizQuestions.length;
    return 0;
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/teacher/classes")} style={backBtn}>
            ←
          </button>
          <h1 style={{ margin: 0 }}>Chapitres (cours)</h1>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button type="button" onClick={() => navigate(`/teacher/classes/${classId}/invite`)}>
            Inviter élèves
          </Button>
          <Button type="button" onClick={() => navigate(`/teacher/classes/${classId}/students`)}>
            Voir élèves
          </Button>
          <Button type="button" onClick={() => navigate(`/teacher/classes/${classId}/add-chapter`)}>
            + Ajouter chapitre
          </Button>
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {loading && <div style={{ color: "#666" }}>Chargement…</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {subjects.map((s) => {
          const sid = getId(s);
          const count = getQuestionCount(s);

          return (
            <Card key={sid || s?.title}>
              <div style={{ padding: 16, display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontWeight: 900 }}>{s?.title ?? "Cours"}</div>
                  <div style={{ color: "#666" }}>
                    {count ? `${count} questions` : "Aucun quiz"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button type="button" onClick={() => onViewQuiz(s)} disabled={!count}>
                    Voir le quiz
                  </Button>
                  <Button type="button" onClick={() => onEditQuiz(s)} disabled={!count}>
                    Modifier
                  </Button>
                  <Button type="button" onClick={() => onDelete(s)} style={dangerBtn}>
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!loading && !error && subjects.length === 0 && (
        <div style={{ color: "#666" }}>Aucun chapitre pour cette classe.</div>
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

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};

const dangerBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(176,0,32,0.25)",
  color: "#b00020",
};
