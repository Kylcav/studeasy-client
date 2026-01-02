import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getSubjectById } from "../../api/subjects";

type QuizQuestion = {
  question: string;
  options: string[];
  answers: string[]; // on prend answers[0] comme bonne réponse (ton cas actuel)
};

export default function ViewQuizTeacher() {
  const { classId, subjectId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ accordion
 const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!subjectId) return;

    setLoading(true);
    setError(null);

    getSubjectById(subjectId)
      .then((res: any) => {
        const s = res?.subject ?? res;
        setTitle(String(s?.title ?? ""));
        setQuestions(Array.isArray(s?.quizQuestions) ? s.quizQuestions : []);
      })
      .catch((e) => setError(e?.message ?? "Impossible de charger le quiz"))
      .finally(() => setLoading(false));
  }, [subjectId]);

  const normalized = useMemo(() => {
    return (questions ?? []).map((q) => {
      const correct = String(q?.answers?.[0] ?? "").trim();
      return {
        question: String(q?.question ?? "").trim(),
        options: Array.isArray(q?.options) ? q.options : [],
        correct,
      };
    });
  }, [questions]);

  if (loading) return <div>Chargement…</div>;
  if (error) return <div style={errorBox}>{error}</div>;

  return (
    <div className="ui-page fade-in">
      {/* Header (pro) */}
      <div className="slide-up" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            {/* tu peux garder ton bouton simple, ou Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/teacher/classes/${classId}`)}
              style={{ fontSize: 13, padding: "6px 10px", borderRadius: 12 }}
            >
              ←
            </Button>

            <h1 className="ui-page-title" style={{ margin: 0 }}>
              <span className="ui-title-accent">{title || "Quiz"}</span>
            </h1>
          </div>

          <div className="ui-page-subtitle">Clique sur une question pour afficher les réponses.</div>
        </div>
      </div>

      {/* Liste des questions */}
      <div className="quiz-list">
        {normalized.map((q, qi) => {
          const isOpen = openIndex === qi;

          return (
            <Card key={qi} className={`ui-card hover quiz-item ${isOpen ? "is-open" : ""}`}>
              {/* Ligne question (cliquable) */}
              <button
                type="button"
                className="quiz-row"
                onClick={() => setOpenIndex(isOpen ? null : qi)}
              >
                <div className="quiz-left">
                  <div className="quiz-index">{qi + 1}</div>

                  <div className="quiz-q">
                    <div className="quiz-q-title">{q.question || "Question"}</div>
                    <div className="quiz-q-meta">{q.options.length} réponses</div>
                  </div>
                </div>

                <div className={`quiz-chevron ${isOpen ? "open" : ""}`}>▾</div>
              </button>

              {/* Réponses (dépliées au clic) */}
              <div className={`quiz-panel ${isOpen ? "open" : ""}`}>
                <div className="quiz-answers">
                  {q.options.map((opt, oi) => {
                    const text = String(opt ?? "").trim();
                    const isCorrect = text && q.correct && text === q.correct;

                    return (
                      <div key={oi} className={`quiz-answer ${isCorrect ? "is-correct" : ""}`}>
                        <div className="quiz-answer-bullet">{String.fromCharCode(65 + oi)}</div>
                        <div className="quiz-answer-text">{text}</div>
                        {isCorrect ? <div className="quiz-badge">Bonne réponse</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};
