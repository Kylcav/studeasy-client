import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getSubjectById } from "../../api/subjects";
import { submitQuizResult } from "../../api/quiz";

type AnyOption = any;
type AnyQuestion = any;

function getOptionsFromQuestion(q: AnyQuestion): AnyOption[] {
  // ✅ IMPORTANT: options/choices/proposals = les choix
  // answers = la bonne réponse (backend v2) -> ne doit PAS être utilisé comme options
  const raw = q?.options ?? q?.choices ?? q?.proposals ?? [];
  return Array.isArray(raw) ? raw : [];
}

function getOptionLabel(opt: AnyOption, index: number) {
  if (typeof opt === "string") return opt;

  return (
    opt?.text ??
    opt?.label ??
    opt?.answer ??
    opt?.content ??
    opt?.value ??
    opt?.title ??
    opt?.name ??
    opt?.option ??
    `Option ${index + 1}`
  );
}

function isOptionCorrect(opt: AnyOption) {
  if (typeof opt === "string") return false;

  return Boolean(
    opt?.isCorrect ??
      opt?.correct ??
      opt?.isAnswer ??
      opt?.right ??
      opt?.isRight ??
      opt?.valid
  );
}

/**
 * ✅ Détecte l'index de la bonne réponse
 * Backend v2: question.answers[0] = texte de la bonne réponse
 */
function getCorrectIndex(question: AnyQuestion, options: AnyOption[]) {
  // 0) ✅ BACKEND V2: answers: string[] (bonne réponse = answers[0])
  const ans0 = Array.isArray(question?.answers) ? question.answers[0] : undefined;
  if (typeof ans0 === "string" && ans0.trim()) {
    const normalized = ans0.trim().toLowerCase();
    const byText = options.findIndex((o, i) => {
      const label = getOptionLabel(o, i).trim().toLowerCase();
      return label === normalized;
    });
    if (byText !== -1) return byText;
  }

  // 1) Flag sur options (si jamais)
  const byFlag = options.findIndex((o) => isOptionCorrect(o));
  if (byFlag !== -1) return byFlag;

  // 2) Index direct sur la question
  const idx =
    question?.correctIndex ??
    question?.answerIndex ??
    question?.rightIndex ??
    question?.correctOptionIndex ??
    question?.correctAnswerIndex ??
    question?.correct ??
    question?.right;

  if (typeof idx === "number" && idx >= 0 && idx < options.length) return idx;

  // 3) Référence (id / texte / objet)
  const correctRef =
    question?.correctAnswer ??
    question?.answer ??
    question?.solution ??
    question?.rightAnswer ??
    question?.correctOption ??
    question?.correctOptionId ??
    question?.correctAnswerId;

  // 3a) Index sous forme number / string convertible
  if (typeof correctRef === "number" && correctRef >= 0 && correctRef < options.length) return correctRef;
  if (typeof correctRef === "string") {
    const asNumber = Number(correctRef);
    if (Number.isFinite(asNumber) && asNumber >= 0 && asNumber < options.length) return asNumber;
  }

  // 3b) ID d'option (string)
  if (typeof correctRef === "string" && correctRef.trim()) {
    const normalizedId = correctRef.trim();
    const byId = options.findIndex((o: any) => {
      if (typeof o === "string") return false;
      const oid = String(o?._id ?? o?.id ?? o?.optionId ?? "");
      return oid && oid === normalizedId;
    });
    if (byId !== -1) return byId;
  }

  // 3c) Objet option
  if (correctRef && typeof correctRef === "object") {
    const refId = String((correctRef as any)?._id ?? (correctRef as any)?.id ?? "");
    if (refId) {
      const byId = options.findIndex((o: any) => {
        if (typeof o === "string") return false;
        return String(o?._id ?? o?.id ?? "") === refId;
      });
      if (byId !== -1) return byId;
    }

    const refText = String(
      (correctRef as any)?.text ??
        (correctRef as any)?.label ??
        (correctRef as any)?.answer ??
        (correctRef as any)?.content ??
        (correctRef as any)?.value ??
        ""
    );

    if (refText.trim()) {
      const normalized = refText.trim().toLowerCase();
      const byText = options.findIndex((o, i) => getOptionLabel(o, i).trim().toLowerCase() === normalized);
      if (byText !== -1) return byText;
    }
  }

  // 3d) Texte direct
  if (typeof correctRef === "string" && correctRef.trim()) {
    const normalized = correctRef.trim().toLowerCase();
    const byText = options.findIndex((o, i) => getOptionLabel(o, i).trim().toLowerCase() === normalized);
    if (byText !== -1) return byText;
  }

  return -1;
}

export default function StudentQuiz() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state ?? {}) as {
    classId?: string;
    className?: string;
    subjectTitle?: string;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectTitle, setSubjectTitle] = useState<string>(state.subjectTitle ?? "");
  const [questions, setQuestions] = useState<AnyQuestion[]>([]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [locked, setLocked] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const sid = String(subjectId ?? "");
        if (!sid) throw new Error("subjectId manquant");

        const res = await getSubjectById(sid);
        const subject = res?.subject ?? res;
        if (!mounted) return;

        setSubjectTitle(String(subject?.title ?? state.subjectTitle ?? "Quiz"));

        const q =
          (Array.isArray(subject?.quizQuestions) ? subject.quizQuestions : null) ??
          (Array.isArray(subject?.questions) ? subject.questions : null) ??
          [];

        setQuestions(q);
        setIdx(0);
        setSelected({});
        setLocked({});
        setDone(false);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Impossible de charger le quiz.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const total = questions.length;
  const current = questions[idx];
  const currentOptions = useMemo(() => getOptionsFromQuestion(current), [current]);

  const chosenIndex = selected[idx];
  const isLocked = Boolean(locked[idx]);
  const canNext = useMemo(() => typeof selected[idx] === "number", [selected, idx]);

  const correctIndex = useMemo(() => getCorrectIndex(current, currentOptions), [current, currentOptions]);

  const correctCount = useMemo(() => {
    let c = 0;
    for (let i = 0; i < questions.length; i++) {
      const chosen = selected[i];
      if (typeof chosen !== "number") continue;

      const q = questions[i];
      const opts = getOptionsFromQuestion(q);
      const corr = getCorrectIndex(q, opts);

      if (corr !== -1 && chosen === corr) c++;
      else if (corr === -1) {
        const picked = opts[chosen];
        if (isOptionCorrect(picked)) c++;
      }
    }
    return c;
  }, [questions, selected]);

  const onSelect = (optIndex: number) => {
    if (locked[idx]) return;
    setSelected((p) => ({ ...p, [idx]: optIndex }));
    setLocked((p) => ({ ...p, [idx]: true }));
  };

  const onPrev = () => setIdx((v) => Math.max(0, v - 1));
  const onNext = () => setIdx((v) => Math.min(total - 1, v + 1));

  const onFinish = async () => {
    try {
      const sid = String(subjectId ?? "");
      if (!sid) return;

      setSubmitting(true);
      setError(null);

      await submitQuizResult(sid, {
        totalQuestions: total,
        correctAnswers: correctCount,
        classId: state.classId,
        meta: { answers: selected },
      });

      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "Impossible d'envoyer le résultat.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ color: "#666" }}>Chargement du quiz…</div>;

  if (error) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div style={errorBox}>{error}</div>
        <Button type="button" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{subjectTitle || "Quiz"}</h1>
        <div style={{ color: "#666" }}>Aucune question disponible pour ce cours.</div>
        <Button type="button" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </div>
    );
  }

  if (done) {
    const scorePct = total ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div style={{ display: "grid", gap: 14, maxWidth: 900 }}>
        <h1 style={{ margin: 0 }}>Résultat</h1>
        <Card>
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{subjectTitle || "Quiz"}</div>
            <div style={{ fontSize: 14, color: "#666" }}>
              Score : <b>{correctCount}</b> / {total} ({scorePct}%)
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button type="button" onClick={() => navigate("/student/rank")}>
                Voir mes erreurs
              </Button>
              <Button type="button" onClick={() => navigate(-1)}>
                Retour au cours
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 980 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <h1 style={{ margin: 0 }}>{subjectTitle || "Quiz"}</h1>
          <div style={{ fontSize: 12, color: "#666" }}>
            Question {idx + 1} / {total}
          </div>
        </div>
        <Button type="button" onClick={() => navigate(-1)}>
          Quitter
        </Button>
      </div>

      <Card>
        <div style={{ padding: 16, display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>
            {current?.question ?? current?.title ?? current?.prompt ?? "Question"}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {currentOptions.map((o: any, i: number) => {
              const isChosen = chosenIndex === i;

              // ✅ Après clic: bonne en vert, mauvaise choisie en rouge
              const showFeedback = isLocked && correctIndex !== -1;
              const isCorrect = i === correctIndex;

              const showGreen = showFeedback && isCorrect;
              const showRed = showFeedback && isChosen && !isCorrect;

              const border = showGreen
                ? "2px solid #2ecc71"
                : showRed
                ? "2px solid #ff4d4f"
                : "1px solid rgba(0,0,0,0.10)";

              const background = showGreen ? "#eafff3" : showRed ? "#ffecec" : "#fff";

              return (
                <button
                  key={i}
                  onClick={() => onSelect(i)}
                  aria-disabled={isLocked}
                  style={{
                    textAlign: "left",
                    padding: "12px 12px",
                    borderRadius: 12,
                    border,
                    background,
                    cursor: isLocked ? "default" : "pointer",

                    // ✅ pas de disabled => pas de CSS disabled qui écrase
                    pointerEvents: isLocked ? "none" : "auto",
                    opacity: 1,

                    // ✅ pas de focus bleu
                    outline: "none",
                    boxShadow: "none",
                  }}
                >
                  {getOptionLabel(o, i)}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <Button type="button" onClick={onPrev} disabled={idx === 0}>
          Précédent
        </Button>

        {idx < total - 1 ? (
          <Button type="button" onClick={onNext} disabled={!canNext || !isLocked}>
            Suivant
          </Button>
        ) : (
          <Button type="button" onClick={onFinish} disabled={!canNext || !isLocked || submitting}>
            {submitting ? "Envoi..." : "Terminer"}
          </Button>
        )}
      </div>
    </div>
  );
}

const errorBox: CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};
