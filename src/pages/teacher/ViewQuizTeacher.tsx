import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import { getSubjectById } from "../../api/subjects";

type QuizQuestion = {
  question: string;
  options: string[];
  answers: string[];
};

export default function ViewQuizTeacher() {
  const { classId, subjectId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId) return;

    getSubjectById(subjectId)
      .then((res: any) => {
        const s = res?.subject ?? res;
        setTitle(s?.title ?? "");
        setQuestions(Array.isArray(s?.quizQuestions) ? s.quizQuestions : []);
      })
      .catch((e) => setError(e?.message ?? "Impossible de charger le quiz"))
      .finally(() => setLoading(false));
  }, [subjectId]);

  if (loading) return <div>Chargement…</div>;
  if (error) return <div style={errorBox}>{error}</div>;

  return (
    <div style={{ maxWidth: 900, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={() => navigate(`/teacher/classes/${classId}`)} style={backBtn}>
          ←
        </button>
        <h1 style={{ margin: 0 }}>{title || "Quiz"}</h1>
      </div>

      {questions.map((q, qi) => {
        const correct = q.answers?.[0];
        return (
          <Card key={qi}>
            <div style={{ padding: 16, display: "grid", gap: 10 }}>
              <strong>
                {qi + 1}. {q.question}
              </strong>

              <div style={{ display: "grid", gap: 6 }}>
                {(q.options || []).map((opt, oi) => (
                  <div
                    key={oi}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.08)",
                      fontWeight: opt === correct ? 800 : 400,
                      color: opt === correct ? "#1b8f3a" : "inherit",
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })}
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
