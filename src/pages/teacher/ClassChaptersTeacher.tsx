import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import { deleteSubject, getSubjectsByClass, updateSubject } from "../../api/subjects";

function accentToShadow(accent: string) {
  const s = String(accent ?? "").trim();
  const m = s.match(
    /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)/i
  );
  if (!m) return "rgba(0,0,0,0.12)";
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  return `rgba(${r},${g},${b},0.36)`;
}

export default function ClassChaptersTeacher() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ même logique que Classes : sélection + édition inline
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const startInlineEdit = (s: any) => {
    const sid = getId(s);
    if (!sid) return;
    setEditingId(sid);
    setEditingValue(String(s?.title ?? ""));
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const commitInlineEdit = async (s: any) => {
    const sid = getId(s);
    if (!sid) return;

    const next = editingValue.trim();
    const prev = String(s?.title ?? "").trim();

    if (!next || next === prev) {
      cancelInlineEdit();
      return;
    }

    try {
      setSavingId(sid);
      setError(null);

      // Optimiste
      setSubjects((old) =>
        old.map((x) => (getId(x) === sid ? { ...x, title: next } : x))
      );

      await updateSubject(sid, { title: next });
      cancelInlineEdit();
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la modification.");
      await refresh();
      cancelInlineEdit();
    } finally {
      setSavingId(null);
    }
  };

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

  return (
    <div className="ui-page fade-in">
      {/* ===== HEADER ===== */}
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/teacher/classes/${classId}/invite`)}
            >
              👥 Inviter élèves
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/teacher/classes/${classId}/students`)}
            >
              👀 Voir élèves
            </Button>
            <Button type="button" onClick={() => navigate(`/teacher/classes/${classId}/add-chapter`)}>
              + Ajouter chapitre
            </Button>
          </div>
        </div>

        {/* ✅ SUPPRIMÉ : les chips stats */}
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

      {/* ===== EMPTY ===== */}
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

      {/* ===== LISTE EN LIGNES (full width) ===== */}
      <div className="ui-list slide-up">
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
            <Card
              key={sid || s?.title || idx}
              className={`ui-card hover chapter-row ${selectedId === sid ? "is-selected" : ""}`}
              style={{
                ["--class-accent" as any]: accent,
                ["--class-shadow" as any]: accentToShadow(accent),
              }}
              onClick={() => setSelectedId(sid)}
            >
              {/* ✅ croix suppression top-right */}
              <button
                type="button"
                className="class-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s);
                }}
                aria-label="Supprimer"
                title="Supprimer"
              >
                ✕
              </button>

              <div className="ui-card-pad chapter-content">
                {/* gauche : titre + sous-texte */}
                <div className="chapter-left" style={{ minWidth: 0 }}>
                  {editingId === sid ? (
                    <input
                      className="class-title-input"
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitInlineEdit(s);
                        if (e.key === "Escape") cancelInlineEdit();
                      }}
                      onBlur={() => commitInlineEdit(s)}
                    />
                  ) : (
                    <button
                      type="button"
                      className="class-title"
                      onClick={(e) => {
                        e.stopPropagation();
                        startInlineEdit(s);
                      }}
                      title="Clique pour modifier"
                    >
                      {s?.title ?? "Cours"}
                      {savingId === sid ? <span className="class-saving"> •</span> : null}
                    </button>
                  )}

                  <div className="class-sub">
                    {count ? `${count} questions` : "Aucun quiz"}
                  </div>
                </div>

                {/* droite : voir le quiz tout à droite */}
                <div className="chapter-right">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewQuiz(s);
                    }}
                    disabled={!count}
                  >
                    Voir le quiz →
                  </Button>
                </div>
              </div>

              {/* ✅ SUPPRIMÉ : astuce */}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
