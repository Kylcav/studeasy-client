import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getSubjectById } from "../../api/subjects";
import { apiFetch } from "../../api/http";

type QuizQuestion = {
  question: string;
  options: string[];
  answers: string[]; // answers[0] = bonne réponse (texte)
};

type AnyAttempt = any;

function toAttempts(data: any): AnyAttempt[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const cand =
    data?.attempts ??
    data?.results ??
    data?.submissions ??
    data?.quizResults ??
    data?.items ??
    data?.data;
  return Array.isArray(cand) ? cand : [];
}

function getAnswersMap(attempt: AnyAttempt): any {
  // mobile/web -> submit meta: { answers: { [qIndex]: optionIndex OR optionText } }
  const meta = attempt?.meta ?? attempt?.metadata ?? attempt?.details ?? null;
  return (
    meta?.answers ??
    attempt?.answers ??
    attempt?.selected ??
    attempt?.responses ??
    attempt?.choices ??
    null
  );
}

function extractId(u: any): string {
  return String(u?.id ?? u?._id ?? u?.userId ?? "");
}

function normalizeSubjectIdFromResult(r: any): string {
  // getUserScores populate subjectId sometimes => object
  const sid = r?.subjectId?._id ?? r?.subjectId?.id ?? r?.subjectId;
  return sid ? String(sid) : "";
}

// ✅ Robust fallback: use wrongQuestions to infer picked answers
function buildWrongMap(att: AnyAttempt) {
  const wq = Array.isArray(att?.meta?.wrongQuestions)
    ? att.meta.wrongQuestions
    : [];
  const map = new Map<string, any>();
  for (const w of wq) {
    const qText = String(w?.question ?? "").trim();
    if (!qText) continue;
    map.set(qText, w);
  }
  return map;
}

function optionIndexFromText(options: string[], text: string) {
  const t = String(text ?? "").trim();
  if (!t) return -1;
  const idx = options.findIndex((o) => String(o ?? "").trim() === t);
  return idx >= 0 ? idx : -1;
}

// --- concurrency limiter (évite de spam le backend) ---
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const res: R[] = new Array(items.length) as any;
  let i = 0;

  const workers = new Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (i < items.length) {
        const idx = i++;
        try {
          res[idx] = await fn(items[idx], idx);
        } catch {
          // @ts-ignore
          res[idx] = null;
        }
      }
    });

  await Promise.all(workers);
  return res;
}

// ✅ Front-only: rebuild attempts by fetching each student's scores
async function fetchAttemptsViaClassUsers(subjectId: string, classId: string) {
  // 1) get users in class (with ids)
  const usersResp = await apiFetch(`/quizzes/class/${classId}/users/points`);
  const users = Array.isArray(usersResp?.users) ? usersResp.users : [];
  const userIds = users.map(extractId).filter(Boolean);

  if (userIds.length === 0) {
    return { attempts: [] as AnyAttempt[] };
  }

  // 2) for each user, fetch scores then filter results by subjectId
  const perUser = await mapLimit(userIds, 6, async (uid) => {
    const scoreResp = await apiFetch(`/quizzes/user/${uid}/scores`);
    const results = Array.isArray(scoreResp?.results) ? scoreResp.results : [];
    return results.filter(
      (r: any) => normalizeSubjectIdFromResult(r) === String(subjectId)
    );
  });

  const attempts = perUser.flat().filter(Boolean);
  return { attempts };
}

export default function ViewQuizTeacher() {
  const { classId, subjectId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // stats: counts[qi][oi] + totals[qi]
  const [answerCounts, setAnswerCounts] = useState<number[][]>([]);
  const [answerTotals, setAnswerTotals] = useState<number[]>([]);

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
        options: Array.isArray(q?.options)
          ? q.options.map((x) => String(x ?? "").trim())
          : [],
        correct,
      };
    });
  }, [questions]);

  // ✅ compute distribution per answer:
  // Each attempt counts as 100% for EACH question.
  // We use (1) meta.answers if present
  // and fallback to (2) meta.wrongQuestions to infer selected answers.
  useEffect(() => {
    let mounted = true;

    (async () => {
      const sid = String(subjectId ?? "");
      const cid = String(classId ?? "");

      if (!sid || !cid || normalized.length === 0) {
        if (!mounted) return;
        setAnswerCounts([]);
        setAnswerTotals([]);
        return;
      }

      let data: any = null;

      try {
        data = await fetchAttemptsViaClassUsers(sid, cid);
      } catch {
        data = null;
      }

      const attempts = toAttempts(data);

      // ✅ Totals are the number of attempts (each attempt = 100% per question)
      const attemptsCount = attempts.length;

      const counts: number[][] = normalized.map(
        (q) => new Array(q.options.length).fill(0)
      );
      const totals: number[] = normalized.map(() => attemptsCount);

      for (const att of attempts) {
        const ans = getAnswersMap(att);
        const wrongMap = buildWrongMap(att);

        for (let qi = 0; qi < normalized.length; qi++) {
          const q = normalized[qi];
          const opts = q.options;
          const optsLen = opts.length;

          // 1) Try reading exact selected option from answers map (if exists)
          let oi: any = undefined;

          if (ans) {
            let picked: any = undefined;
            if (Array.isArray(ans)) picked = ans[qi];
            else if (typeof ans === "object") picked = ans[qi] ?? ans[String(qi)];

            oi = picked;

            if (picked && typeof picked === "object") {
              oi =
                picked.optionIndex ??
                picked.index ??
                picked.selectedIndex ??
                picked.selectedOptionIndex;

              if (typeof oi === "undefined") {
                const t = String(
                  picked.selectedOptionText ??
                    picked.text ??
                    picked.value ??
                    ""
                ).trim();
                if (t) oi = t;
              }
            }

            if (typeof oi === "string") {
              const n = Number(oi);
              if (Number.isFinite(n) && String(n) === oi.trim()) {
                oi = n;
              } else {
                const idx = opts.findIndex((o) => o === oi.trim());
                oi = idx >= 0 ? idx : -1;
              }
            }
          }

          // 2) Fallback: infer from wrongQuestions / otherwise correct answer
          if (!(Number.isFinite(oi) && oi >= 0 && oi < optsLen)) {
            const qText = String(q.question || "").trim();
            const wrong = wrongMap.get(qText);

            if (wrong) {
              const selectedText = String(wrong?.selectedOptionText ?? "").trim();
              let idx = optionIndexFromText(opts, selectedText);

              // optional fallback: sometimes selectedOptionId could be "0","1","2","3"
              if (idx < 0) {
                const maybe = Number(wrong?.selectedOptionId);
                if (Number.isFinite(maybe) && maybe >= 0 && maybe < optsLen) {
                  idx = maybe;
                }
              }

              oi = idx;
            } else {
              // not in wrongQuestions => treat as correct
              oi = optionIndexFromText(opts, q.correct);
            }
          }

          if (Number.isFinite(oi) && oi >= 0 && oi < optsLen) {
            counts[qi][oi] += 1;
          }
        }
      }

      if (!mounted) return;
      setAnswerCounts(counts);
      setAnswerTotals(totals);
    })();

    return () => {
      mounted = false;
    };
  }, [subjectId, classId, normalized]);

  if (loading) return <div>Chargement…</div>;
  if (error) return <div style={errorBox}>{error}</div>;

  return (
    <div className="ui-page fade-in">
      <div
        className="slide-up"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
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

          <div className="ui-page-subtitle">
            Clique sur une question pour afficher les réponses.
          </div>
        </div>
      </div>

      <div className="quiz-list">
        {normalized.map((q, qi) => {
          const isOpen = openIndex === qi;
          const totalAttemptsForQ = answerTotals?.[qi] ?? 0;

          return (
            <Card
              key={qi}
              className={`ui-card hover quiz-item ${isOpen ? "is-open" : ""}`}
            >
              <button
                type="button"
                className="quiz-row"
                onClick={() => setOpenIndex(isOpen ? null : qi)}
              >
                <div className="quiz-left">
                  <div className="quiz-index">{qi + 1}</div>

                  <div className="quiz-q">
                    <div className="quiz-q-title">
                      {q.question || "Question"}
                    </div>
                    <div className="quiz-q-meta">
                      {q.options.length} réponses • {totalAttemptsForQ} tentative
                      {totalAttemptsForQ === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>

                <div className={`quiz-chevron ${isOpen ? "open" : ""}`}>▾</div>
              </button>

              <div className={`quiz-panel ${isOpen ? "open" : ""}`}>
                <div className="quiz-answers">
                  {q.options.map((opt, oi) => {
                    const text = String(opt ?? "").trim();
                    const isCorrect = text && q.correct && text === q.correct;

                    const total = answerTotals?.[qi] ?? 0; // ✅ attempts count
                    const count = answerCounts?.[qi]?.[oi] ?? 0;

                    const percent =
                      total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div
                        key={oi}
                        className={`quiz-answer ${isCorrect ? "is-correct" : ""}`}
                      >
                        <div className="quiz-answer-bullet">
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <div className="quiz-answer-text">{text}</div>

                        <div
                          title={`${count} réponse${count === 1 ? "" : "s"} sur ${total}`}
                          style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            fontWeight: 900,
                            color: "rgba(0,0,0,0.55)",
                          }}
                        >
                          {percent}%
                        </div>

                        {isCorrect ? (
                          <div className="quiz-badge">Bonne réponse</div>
                        ) : null}
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
