import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/ui/input";
import { getSubjectById, updateSubject } from "../../api/subjects";

type QuizQuestion = {
  question: string;
  options: string[]; // ✅ backend v2
  answers: string[]; // ✅ backend v2 (subset of options)
};

function ensure4Options(q: QuizQuestion): QuizQuestion {
  const options = Array.isArray(q.options) ? [...q.options] : [];
  while (options.length < 4) options.push("");
  if (options.length > 4) options.splice(4);

  const answers = Array.isArray(q.answers) ? [...q.answers] : [];
  // Ensure answer is in options
  const ans = answers[0];
  if (ans && !options.includes(ans)) {
    return { ...q, options, answers: [] };
  }
  return { ...q, options, answers: ans ? [ans] : [] };
}

function getCorrectIndex(q: QuizQuestion) {
  const ans = q.answers?.[0];
  if (!ans) return -1;
  return (q.options || []).findIndex((o) => o === ans);
}

function normalizeForSave(q: QuizQuestion): QuizQuestion {
  // Keep exactly 4, trim
  const options = (q.options || []).slice(0, 4).map((o) => String(o ?? "").trim());

  // Replace empty options with safe placeholders so backend passes validation
  const filled = options.map((o, i) => (o ? o : `Option ${i + 1}`));

  // Ensure answer exists and is in options
  let ans = q.answers?.[0]?.trim() ?? "";
  if (!ans || !filled.includes(ans)) {
    ans = filled[0]; // fallback
  }

  return {
    question: String(q.question ?? "").trim() || "Question",
    options: filled,
    answers: [ans],
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

  // init from navigation state OR fetch
  useEffect(() => {
    const state = location.state as any;

    if (state?.quizQuestions) {
      const qs = Array.isArray(state.quizQuestions) ? state.quizQuestions : [];
      setTitle(state.subjectTitle ?? "");
      setDescription(state.subjectDescription ?? "");
      setQuestions(qs.map(ensure4Options));
      return;
    }

    if (!subjectId) return;

    setLoading(true);
    getSubjectById(subjectId)
      .then((res: any) => {
        const s = res?.subject ?? res;
        setTitle(s?.title ?? "");
        setDescription(s?.description ?? "");
        const qs = Array.isArray(s?.quizQuestions) ? s.quizQuestions : [];
        setQuestions(qs.map(ensure4Options));
      })
      .catch((e) => setError(e?.message ?? "Impossible de charger le quiz"))
      .finally(() => setLoading(false));
  }, [location.state, subjectId]);

  const updateQuestionText = (qIdx: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, question: value } : q)));
  };

  const updateOptionText = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const next = ensure4Options(q);
        const old = next.options[optIdx] ?? "";
        const options = [...next.options];
        options[optIdx] = value;

        // if this option was the selected answer, update answer string to match
        const ans = next.answers?.[0];
        const answers = ans && ans === old ? [value] : next.answers;

        return { ...next, options, answers };
      })
    );
  };

  const setCorrectOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const next = ensure4Options(q);
        const selected = next.options[optIdx] ?? "";
        return { ...next, answers: selected ? [selected] : [] };
      })
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answers: ["Option 1"],
      },
    ]);
  };

  const removeQuestion = (qIdx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== qIdx));
  };

  const canSave = useMemo(() => questions.length > 0, [questions.length]);

  const onSave = async () => {
    if (!subjectId) return;

    if (!questions.length) {
      setError("Ajoute au moins une question.");
      return;
    }

    // normalize for backend v2
    const normalized = questions.map(normalizeForSave);

    setError(null);
    setLoading(true);

    try {
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
    <div style={{ maxWidth: 900, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Questions générées</h1>
        <Button type="button" onClick={() => navigate(`/teacher/classes/${classId}`)}>
          Retour
        </Button>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {questions.map((q, qi) => {
        const qq = ensure4Options(q);
        const correctIndex = getCorrectIndex(qq);

        return (
          <Card key={qi}>
            <div style={{ padding: 16, display: "grid", gap: 12 }}>
              <Input
                value={qq.question}
                onChange={(e) => updateQuestionText(qi, e.target.value)}
                placeholder={`Question ${qi + 1}`}
              />

              <div style={{ display: "grid", gap: 8 }}>
                {qq.options.map((opt, oi) => (
                  <div key={oi} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="radio"
                      checked={oi === correctIndex}
                      onChange={() => setCorrectOption(qi, oi)}
                      title="Bonne réponse"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => updateOptionText(qi, oi, e.target.value)}
                      placeholder={`Réponse ${oi + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="button" onClick={() => removeQuestion(qi)} style={dangerBtn}>
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
        <Button type="button" onClick={addQuestion} style={ghostBtn}>
          + Ajouter une question
        </Button>

        <Button type="button" disabled={loading || !canSave} onClick={onSave}>
          {loading ? "Enregistrement…" : "Enregistrer le quiz"}
        </Button>
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

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(176,0,32,0.25)",
  color: "#b00020",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
};
