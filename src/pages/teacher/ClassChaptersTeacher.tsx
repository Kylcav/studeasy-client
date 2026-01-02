import { useEffect, useMemo, useState } from "react";
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

  const getQuestionCount = (s: any) => {
    if (typeof s?.quizQuestionCount === "number") return s.quizQuestionCount;
    if (Array.isArray(s?.quizQuestions)) return s.quizQuestions.length;
    return 0;
  };

  const totalQuestions = useMemo(() => {
    return subjects.reduce((acc, s) => acc + getQuestionCount(s), 0);
  }, [subjects]);

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

    navigate(`/teacher/classes/${classId}/generated-questions/${sid}`, {
      state: {
        subjectId: sid,
        subjectTitle: s?.title ?? "",
        subjectDescription: s?.description ?? "",
        quizQuestions: Array.isArray(s?.quizQuestions) ? s.quizQuestions : [],
      },
    });
  };

  return (
    <div className="ui-page fade-in">
      {/* ===== HEADER PREMIUM ===== */}
      <div className="slide-up" style={{ display: "grid", gap: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Button type="button" variant="ghost" onClick={() => navigate("/teacher/classes")}>
                ← Retour
              </Button>

              <h1 className="ui-page-title" style={{ fontSize: 34 }}>
                <span className="ui-title-accent">Chapitres</span> 📘
              </h1>
            </div>

            <p className="ui-page-subtitle">
              Gère tes cours et leurs quiz. Tu peux voir, modifier ou supprimer un chapitre.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button type="button" variant="ghost" onClick={() => navigate(`/teacher/classes/${classId}/invite`)}>
              👥 Inviter élèves
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(`/teacher/classes/${classId}/students`)}>
              👀 Voir élèves
            </Button>
            <Button type="button" onClick={() => navigate(`/teacher/classes/${classId}/add-chapter`)}>
              + Ajouter chapitre
            </Button>
          </div>
        </div>

        {/* ===== CHIPS STATS (donne de la vie) ===== */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span className="ui-chip">📚 {loading ? "…" : subjects.length} chapitres</span>
          <span className="ui-chip">✅ {loading ? "…" : totalQuestions} questions</span>
          <span className="ui-chip">✨ Cours → Quiz rapidement</span>
        </div>
      </div>

      {/* ===== ERROR ===== */}
      {error && (
        <Card className="ui-card hover slide-up">
          <div className="ui-card-pad ui-alert-error">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Oups…</div>
            <div>{error}</div>
          </div>
        </Card>
      )}

      {loading && (
        <div className="slide-up" style={{ color: "var(--placeholder)" }}>
          Chargement…
        </div>
      )}

      {/* ===== EMPTY STATE ===== */}
      {!loading && !error && subjects.length === 0 && (
        <Card className="ui-card ui-card-hero hover slide-up">
          <div className="ui-card-pad" style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>🌱 Premier chapitre</div>
            <div style={{ color: "var(--placeholder)" }}>
              Ajoute un cours (chapitre), puis génère un quiz pour tes élèves.
            </div>
            <div style={{ marginTop: 4 }}>
              <Button type="button" onClick={() => navigate(`/teacher/classes/${classId}/add-chapter`)}>
                + Ajouter un chapitre
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ===== GRID CHAPTERS ===== */}
      <div className="ui-grid-2 slide-up">
        {subjects.map((s, idx) => {
          const sid = getId(s);
          const count = getQuestionCount(s);

          const accent =
            idx % 3 === 0
              ? "rgba(93,128,250,0.18)"
              : idx % 3 === 1
              ? "rgba(74,222,128,0.14)"
              : "rgba(251,191,36,0.12)";

          return (
            <Card key={sid || s?.title} className="ui-card hover">
              <div className="ui-card-pad class-card">
                <div className="class-card-accent" style={{ background: accent }} />

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 950,
                          fontSize: 16,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={s?.title ?? "Cours"}
                      >
                        📘 {s?.title ?? "Cours"}
                      </div>

                      <div style={{ color: "var(--placeholder)" }}>
                        {count ? `✅ ${count} questions` : "⚠️ Aucun quiz"}
                      </div>
                    </div>

                    <span className="ui-chip">{count} 🧠</span>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button type="button" onClick={() => onViewQuiz(s)} disabled={!count}>
                      Voir le quiz
                    </Button>

                    <Button type="button" variant="ghost" onClick={() => onEditQuiz(s)} disabled={!count}>
                      Modifier
                    </Button>

                    <Button type="button" variant="danger" onClick={() => onDelete(s)}>
                      Supprimer
                    </Button>
                  </div>

                  <div style={{ color: "var(--placeholder)", fontSize: 13 }}>
                    ✨ Astuce : un quiz bien fait booste la motivation des élèves.
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
