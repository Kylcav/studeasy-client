import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/ui/input";
import { getSubjectById, updateSubject } from "../../api/subjects";

type QuizQuestion = {
  question: string;
  options: string[];
  answers: string[]; // backend v2 : UNE seule bonne réponse
};

function ensure4Options(q: QuizQuestion): QuizQuestion {
  const options = Array.isArray(q.options) ? [...q.options] : [];
  while (options.length < 4) options.push("");
  if (options.length > 4) options.splice(4);

  const ans = q.answers?.[0];
  return {
    ...q,
    options,
    answers: ans && options.includes(ans) ? [ans] : [],
  };
}

function normalizeForSave(q: QuizQuestion): QuizQuestion {
  const options = q.options.map((o, i) => (o?.trim() ? o.trim() : `Option ${i + 1}`));
  const ans = q.answers?.[0];
  return {
    question: q.question?.trim() || "Question",
    options,
    answers: ans && options.includes(ans) ? [ans] : [options[0]],
  };
}

export default function GeneratedQuestionsTeacher() {
  const { classId, subjectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ===== INIT ===== */
  useEffect(() => {
    const state = location.state as any;

    if (state?.quizQuestions) {
      setTitle(state.subjectTitle ?? "");
      setDescription(state.subjectDescription ?? "");
      setQuestions(state.quizQuestions.map(ensure4Options));
      return;
    }

    if (!subjectId) return;

    setLoading(true);
    getSubjectById(subjectId)
      .then((res: any) => {
        const s = res?.subject ?? res;
        setTitle(s?.title ?? "");
        setDescription(s?.description ?? "");
        setQuestions((s?.quizQuestions ?? []).map(ensure4Options));
      })
      .catch((e) => setError(e?.message ?? "Impossible de charger le quiz"))
      .finally(() => setLoading(false));
  }, [location.state, subjectId]);

  /* ===== UPDATES ===== */
  const updateQuestionText = (qi: number, v: string) =>
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, question: v } : q)));

  const updateOptionText = (qi: number, oi: number, v: string) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const next = ensure4Options(q);
        const options = [...next.options];
        const old = options[oi];
        options[oi] = v;

        const ans = next.answers?.[0];
        return {
          ...next,
          options,
          answers: ans === old ? [v] : next.answers,
        };
      })
    );

  const setCorrectOption = (qi: number, oi: number) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...ensure4Options(q), answers: [q.options[oi]] } : q
      )
    );

  const addQuestion = () =>
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answers: ["Option 1"],
      },
    ]);

  const removeQuestion = (qi: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== qi));

  /* ===== SAVE ===== */
  const canSave = useMemo(() => questions.length > 0, [questions.length]);

  const onSave = async () => {
    if (!subjectId) return;
    if (!questions.length) {
      setError("Ajoute au moins une question.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const normalized = questions.map(normalizeForSave);
      await updateSubject(subjectId, {
        title,
        description,
        quizQuestions: normalized,
        quizQuestionCount: normalized.length,
      });
      navigate(`/teacher/classes/${classId}`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Impossible d’enregistrer le quiz.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !questions.length) return <div>Chargement…</div>;

  return (
    <div className="ui-page fade-in" style={{ maxWidth: 900 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 className="ui-page-title">Quiz – questions générées</h1>
        <Button onClick={() => navigate(`/teacher/classes/${classId}`)}>Retour</Button>
      </div>

      {error && <div className="ui-alert-error">{error}</div>}

      {/* QUESTIONS */}
      {questions.map((q, qi) => {
        const qq = ensure4Options(q);
        const correct = qq.answers?.[0];

        return (
          <Card key={qi} className="hover">
            <div className="ui-card-pad" style={{ display: "grid", gap: 12 }}>
              <Input
                value={qq.question}
                onChange={(e) => updateQuestionText(qi, e.target.value)}
                placeholder={`Question ${qi + 1}`}
              />

              <div className="quiz-options">
                {qq.options.map((opt, oi) => {
                  const isCorrect = opt === correct;
                  const hasAnswer = Boolean(correct);

                  return (
                    <div
                      key={oi}
                      className={[
                        "quiz-option-edit",
                        hasAnswer && isCorrect && "is-correct",
                        hasAnswer && !isCorrect && "is-wrong",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setCorrectOption(qi, oi)}
                    >
                      <span className="quiz-letter">
                        {String.fromCharCode(65 + oi)}
                      </span>

                      <Input
                        value={opt}
                        onChange={(e) =>
                          updateOptionText(qi, oi, e.target.value)
                        }
                        placeholder={`Réponse ${oi + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="danger" onClick={() => removeQuestion(qi)}>
                  Supprimer la question
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {/* FOOTER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <Button variant="ghost" onClick={addQuestion}>
          + Ajouter une question
        </Button>

        <Button disabled={!canSave || loading} onClick={onSave}>
          {loading ? "Enregistrement…" : "Enregistrer le quiz"}
        </Button>
      </div>
    </div>
  );
}
