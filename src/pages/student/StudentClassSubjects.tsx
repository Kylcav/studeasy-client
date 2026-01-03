import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getSubjectsByClass } from "../../api/subjects";
import { getClasses } from "../../api/classes";

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

export default function StudentClassSubjects() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [className, setClassName] = useState<string>("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // UI (comme classes)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;

    let mounted = true;

    getClasses()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : res?.classes ?? [];
        const found = list.find(
          (c: any) => String(c?.id ?? c?._id ?? "") === String(classId)
        );
        if (found) setClassName(String(found?.name ?? ""));
      })
      .catch(() => {});

    (async () => {
      try {
        setError(null);
        const res = await getSubjectsByClass(String(classId));
        const list = Array.isArray(res) ? res : res?.subjects ?? res?.data ?? [];
        if (!mounted) return;
        setSubjects(Array.isArray(list) ? list : []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Impossible de charger les cours.");
        setSubjects([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [classId]);

  const title = useMemo(
    () => (className ? `Cours · ${className}` : "Cours"),
    [className]
  );

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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/student/classes")}
                style={{ paddingInline: 10 }}
              >
                ←
              </Button>

              <h1 className="ui-page-title" style={{ margin: 0 }}>
                <span className="ui-title-accent">{title}</span>
              </h1>
            </div>

            <p className="ui-page-subtitle" style={{ margin: 0 }}>
              Choisis un cours et lance un quiz.
            </p>
          </div>
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

      {/* ===== GRID 2 COLONNES ===== */}
      <div className="ui-grid-2 slide-up">
        {subjects.map((s, idx) => {
          const subjectId = String(s?.id ?? s?._id ?? "");
          const quizCount =
            Number(s?.quizQuestionCount) ||
            (Array.isArray(s?.quizQuestions) ? s.quizQuestions.length : 0);

          const accent =
            idx % 3 === 0
              ? "rgba(93,128,250,0.18)"
              : idx % 3 === 1
              ? "rgba(74,222,128,0.14)"
              : "rgba(251,191,36,0.12)";

          return (
            <Card
              key={subjectId}
              className={`ui-card hover class-tile ${
                selectedId === subjectId ? "is-selected" : ""
              }`}
              style={{
                ["--class-accent" as any]: accent,
                ["--class-shadow" as any]: accentToShadow(accent),
              }}
              onClick={() => setSelectedId(subjectId)}
            >
              <div
                className="ui-card-pad class-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  height: 260, // ✅ toutes les cards même hauteur
                }}
              >
                {/* TOP */}
                <div className="class-top" style={{ flex: 1, minHeight: 0 }}>
                  <div style={{ minWidth: 0, display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>
                      {s?.title ?? "Cours"}
                    </div>

                    {s?.description ? (
                      <div style={descClamp}>
                        {s.description}
                      </div>
                    ) : null}

                    <div style={{ color: "#666", fontSize: 13 }}>
                      Quiz: {quizCount ? `${quizCount} questions` : "non disponible"}
                    </div>
                  </div>
                </div>

                {/* BOTTOM */}
                <div
                  className="class-bottom"
                  style={{ display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    type="button"
                    disabled={!quizCount}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/quiz/${subjectId}`, {
                        state: {
                          classId: String(classId),
                          className,
                          subjectTitle: s?.title ?? "",
                        },
                      });
                    }}
                  >
                    Lancer le quiz
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ===== EMPTY ===== */}
      {!error && subjects.length === 0 && (
        <Card className="ui-card ui-card-hero hover slide-up">
          <div className="ui-card-pad" style={{ color: "var(--placeholder)" }}>
            Aucun cours dans cette classe.
          </div>
        </Card>
      )}
    </div>
  );
}

const descClamp: React.CSSProperties = {
  color: "#666",
  fontSize: 13,
  lineHeight: 1.35,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 6, // ✅ limite la hauteur du texte pour uniformiser
};
