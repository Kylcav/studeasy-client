import { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getClasses } from "../../api/classes";
import { apiFetch } from "../../api/http";

type ClassType = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  subjects?: any[];
};

type InsightItem = {
  question?: string;
  wrongRate?: number; // 0..1
  wrongStudents?: number;
  totalStudents?: number; // nb élèves ayant répondu (actifs)
};

type StudentLite = {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  profileImage?: string;
};

type ClassInsightsComputed = {
  classId: string;
  className: string;

  totalStudents: number; // affichage total classe
  avgAttemptsPerStudent: number;
  classAvgGrade6: number;

  struggling: { student: StudentLite; grade6: number }[];
  brilliant: { student: StudentLite; grade6: number }[];

  hardestQuestions: InsightItem[];
};

// ✅ pour les modals
type StudentDetailsRow = {
  student: StudentLite;
  grade6: number | null; // null = aucun quiz fait
  attempts: number;
};

const POINTS_PER_QUESTION = 20;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function toId(x: any) {
  return String(x?.id ?? x?._id ?? "");
}

function toName(s: StudentLite) {
  return (
    s?.fullName ||
    s?.name ||
    s?.email ||
    (toId(s) ? `Élève ${toId(s).slice(-4)}` : "Élève")
  );
}

function grade6FromPoints(points: number, maxPoints: number) {
  if (!maxPoints || maxPoints <= 0) return 0;
  return clamp((points / maxPoints) * 6, 0, 6);
}

/**
 * ✅ Calcule les points finaux d'un quiz
 * - si les tentatives sont "incrementales" (récupération), on somme (mais borné à max)
 * - si les tentatives sont "totales", la somme dépasse max => on prend le meilleur
 */
function computeFinalPoints(sumPoints: number, bestPoints: number, maxPoints: number) {
  if (!maxPoints || maxPoints <= 0) return 0;
  if (sumPoints > maxPoints) return clamp(bestPoints, 0, maxPoints);
  return clamp(sumPoints, 0, maxPoints);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const res: R[] = new Array(items.length) as any;
  let i = 0;

  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      res[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return res;
}

async function fetchClassStudents(classId: string): Promise<StudentLite[]> {
  const data = await apiFetch(`/classes/${classId}/students`);
  return Array.isArray(data?.students) ? data.students : Array.isArray(data) ? data : [];
}

async function fetchUserScores(userId: string) {
  const data = await apiFetch(`/quizzes/user/${userId}/scores`);
  return Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
}

/** ✅ petit composant modal (sans lib) */
function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 96vw)",
          maxHeight: "72vh",
          overflow: "auto",
          borderRadius: 18,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 20px 80px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            backdropFilter: "blur(10px)",
            background: "rgba(255,255,255,0.92)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            padding: "14px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 950, fontSize: 16 }}>{title}</div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(255,255,255,0.8)",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 14 }}>{children}</div>
      </div>
    </div>
  );
}

export default function InsightsTeacher() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [insights, setInsights] = useState<ClassInsightsComputed | null>(null);

  // ✅ données pour les popups
  const [details, setDetails] = useState<StudentDetailsRow[]>([]);
  const [openGradesModal, setOpenGradesModal] = useState(false);
  const [openAttemptsModal, setOpenAttemptsModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const listRaw = await getClasses();
        const list: any[] = Array.isArray(listRaw) ? listRaw : listRaw?.classes ?? [];
        setClasses(list);

        const firstId = list?.[0]?._id ?? list?.[0]?.id ?? "";
        if (firstId) setSelectedClassId(String(firstId));
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger les classes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedClass = useMemo(() => {
    return classes.find((c) => toId(c) === selectedClassId) ?? null;
  }, [classes, selectedClassId]);

  const selectedName = useMemo(() => {
    return selectedClass?.name ?? selectedClass?.title ?? "Classe";
  }, [selectedClass]);

  const refresh = async () => {
    if (!selectedClassId) return;

    try {
      setLoading(true);
      setError(null);

      const cls = selectedClass;

      const classSubjects: any[] = Array.isArray(cls?.subjects) ? (cls!.subjects as any[]) : [];
      const subjectIds = classSubjects
        .map((s) => String(s?._id ?? s?.id))
        .filter(Boolean);
      const hasSubjects = subjectIds.length > 0;

      const students = await fetchClassStudents(selectedClassId);
      const totalStudents = students.length;

      if (totalStudents === 0) {
        setInsights({
          classId: selectedClassId,
          className: selectedName,
          totalStudents: 0,
          avgAttemptsPerStudent: 0,
          classAvgGrade6: 0,
          struggling: [],
          brilliant: [],
          hardestQuestions: [],
        });
        setDetails([]);
        return;
      }

      const perStudent = await mapWithConcurrency(students, 5, async (stu) => {
        const uid = toId(stu);
        const results: any[] = await fetchUserScores(uid);

        const classResults = hasSubjects
          ? results.filter((r) => {
              const sid = String(r?.subjectId?._id ?? r?.subjectId);
              return subjectIds.includes(sid);
            })
          : results;

        const bySubject = new Map<
          string,
          {
            sumPoints: number;
            bestPoints: number;
            maxPoints: number;
            attempts: number;
            wrongQuestions: any[];
          }
        >();

        for (const r of classResults) {
          const sid = String(r?.subjectId?._id ?? r?.subjectId ?? "unknown");
          const pts = Number(r?.points ?? 0);

          const mp =
            Number(r?.meta?.maxPoints ?? 0) ||
            Number(r?.totalQuestions ?? 0) * POINTS_PER_QUESTION;

          if (!mp || mp <= 0) continue;

          const entry =
            bySubject.get(sid) ?? {
              sumPoints: 0,
              bestPoints: -Infinity,
              maxPoints: mp,
              attempts: 0,
              wrongQuestions: [],
            };

          entry.sumPoints += pts;
          entry.bestPoints = Math.max(entry.bestPoints, pts);
          entry.maxPoints = Math.max(entry.maxPoints, mp);
          entry.attempts += 1;

          const wq = Array.isArray(r?.meta?.wrongQuestions) ? r.meta.wrongQuestions : [];
          if (wq.length) entry.wrongQuestions.push(...wq);

          bySubject.set(sid, entry);
        }

        // moyenne élève = moyenne de ses quiz réalisés uniquement
        let sumGrades = 0;
        let quizCount = 0;

        for (const e of bySubject.values()) {
          if (!Number.isFinite(e.bestPoints) || e.bestPoints === -Infinity) continue;
          const finalPts = computeFinalPoints(e.sumPoints, e.bestPoints, e.maxPoints);
          sumGrades += grade6FromPoints(finalPts, e.maxPoints);
          quizCount += 1;
        }

        const grade6 = quizCount > 0 ? sumGrades / quizCount : NaN;

        const totalAttempts = Array.from(bySubject.values()).reduce(
          (a, b) => a + (b.attempts || 0),
          0
        );

        return { student: stu, userId: uid, grade6, totalAttempts, bySubject };
      });

      const counted = perStudent.filter((s) => Number.isFinite(s.grade6));

      // ✅ rows pour les modals (liste complète d'élèves)
      setDetails(
        perStudent.map((p) => ({
          student: p.student,
          grade6: Number.isFinite(p.grade6) ? p.grade6 : null,
          attempts: Number(p.totalAttempts) || 0,
        }))
      );

      // ✅ moyenne classe = moyenne des quiz, puis moyenne de tous les quiz
      const subjectAgg = new Map<string, { sum: number; count: number }>();

      for (const p of counted) {
        for (const [sid, e] of p.bySubject.entries()) {
          if (!Number.isFinite(e.bestPoints) || e.bestPoints === -Infinity) continue;

          const finalPts = computeFinalPoints(e.sumPoints, e.bestPoints, e.maxPoints);
          const g = grade6FromPoints(finalPts, e.maxPoints);

          const agg = subjectAgg.get(sid) ?? { sum: 0, count: 0 };
          agg.sum += g;
          agg.count += 1;
          subjectAgg.set(sid, agg);
        }
      }

      const subjectAverages = Array.from(subjectAgg.values())
        .filter((a) => a.count > 0)
        .map((a) => a.sum / a.count);

      const classAvgGrade6 =
        subjectAverages.length > 0
          ? subjectAverages.reduce((acc, v) => acc + v, 0) / subjectAverages.length
          : 0;

      const totalAttemptsAll = counted.reduce(
        (acc, s) => acc + (Number(s.totalAttempts) || 0),
        0
      );
      const avgAttemptsPerStudent = counted.length > 0 ? totalAttemptsAll / counted.length : 0;

      const struggling = [...counted]
        .filter((x) => x.grade6 < 4)
        .sort((a, b) => a.grade6 - b.grade6)
        .slice(0, 10)
        .map((x) => ({ student: x.student, grade6: Math.round(x.grade6 * 10) / 10 }));

      const brilliant = [...counted]
        .filter((x) => x.grade6 > 5.5)
        .sort((a, b) => b.grade6 - a.grade6)
        .slice(0, 10)
        .map((x) => ({ student: x.student, grade6: Math.round(x.grade6 * 10) / 10 }));

      // Questions difficiles (sur élèves actifs)
      const qMap = new Map<string, { question: string; wrongUsers: Set<string> }>();
      for (const p of counted) {
        for (const entry of p.bySubject.values()) {
          for (const w of entry.wrongQuestions || []) {
            const qText = String(w?.question || "").trim();
            if (!qText) continue;
            const key = qText;
            if (!qMap.has(key)) qMap.set(key, { question: qText, wrongUsers: new Set() });
            qMap.get(key)!.wrongUsers.add(p.userId);
          }
        }
      }

      const denom = counted.length;
      const hardestQuestions: InsightItem[] = Array.from(qMap.values())
        .map((q) => {
          const wrongStudents = q.wrongUsers.size;
          const wrongRate = denom > 0 ? wrongStudents / denom : 0;
          return { question: q.question, wrongRate, wrongStudents, totalStudents: denom };
        })
        .filter((q) => (q.wrongRate ?? 0) >= 0.6)
        .sort((a, b) => (b.wrongRate ?? 0) - (a.wrongRate ?? 0))
        .slice(0, 20);

      setInsights({
        classId: selectedClassId,
        className: selectedName,
        totalStudents,
        avgAttemptsPerStudent: Math.round(avgAttemptsPerStudent * 10) / 10,
        classAvgGrade6: Math.round(classAvgGrade6 * 10) / 10,
        struggling,
        brilliant,
        hardestQuestions,
      });
    } catch (e: any) {
      setError(e?.message ?? "Request failed");
      setInsights(null);
      setDetails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedClassId) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  const computed = useMemo(() => {
    return {
      totalStudents: insights?.totalStudents ?? 0,
      avgAttemptsPerStudent: insights?.avgAttemptsPerStudent ?? 0,
      avgGrade6: insights?.classAvgGrade6 ?? 0,
      hardQuestions: insights?.hardestQuestions ?? [],
      struggling: insights?.struggling ?? [],
      brilliant: insights?.brilliant ?? [],
    };
  }, [insights]);

  const gradeRows = useMemo(() => {
    return [...details].sort((a, b) => {
      const ga = a.grade6 ?? 999;
      const gb = b.grade6 ?? 999;
      return ga - gb;
    });
  }, [details]);

  const attemptRows = useMemo(() => {
    return [...details].sort((a, b) => (b.attempts || 0) - (a.attempts || 0));
  }, [details]);

  return (
    <div className="ui-page fade-in" style={{ display: "grid", gap: 14 }}>
      {/* Header */}
      <div
        className="slide-up"
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="ui-page-title">
            <span className="ui-title-accent">Insights</span>
          </h1>
        </div>
        <div style={{ color: "var(--placeholder)", fontWeight: 800 }}>
          {classes.length} classes
        </div>
      </div>

      {/* container principal */}
      <Card className="ui-card ui-card-hero hover slide-up">
        <div className="ui-card-pad" style={{ display: "grid", gap: 14 }}>
          {/* select classe */}
          <div style={{ display: "grid", gap: 8 }}>
            <div className="ui-field-label">Classe</div>
            <select
              className="ui-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map((c) => (
                <option key={toId(c)} value={toId(c)}>
                  {c?.name ?? c?.title ?? "Classe"}
                </option>
              ))}
            </select>
          </div>

          {/* stats cards */}
          <div className="ui-grid-3">
            {/* ✅ Moyenne cliquable => ouvre modal */}
            <Card
              className="ui-card hover"
              style={{ cursor: "pointer" }}
              onClick={() => setOpenGradesModal(true)}
              role="button"
              tabIndex={0}
            >
              <div className="ui-card-pad" style={{ display: "grid", gap: 6 }}>
                <div style={{ color: "var(--placeholder)", fontWeight: 800 }}>
                  Moyenne (classe) / 6
                </div>
                <div style={{ fontSize: 40, fontWeight: 950, lineHeight: 1 }}>
                  {computed.avgGrade6.toFixed(1)}
                </div>
                <div style={{ color: "var(--placeholder)", fontSize: 13 }}>
                  Clique pour voir le détail des élèves.
                </div>
              </div>
            </Card>

            <Card className="ui-card hover">
              <div className="ui-card-pad" style={{ display: "grid", gap: 6 }}>
                <div style={{ color: "var(--placeholder)", fontWeight: 800 }}>
                  Élèves
                </div>
                <div style={{ fontSize: 40, fontWeight: 950, lineHeight: 1 }}>
                  {computed.totalStudents}
                </div>
                <div style={{ color: "var(--placeholder)", fontSize: 13 }}>
                  Classe: {selectedName}
                </div>
              </div>
            </Card>

            {/* ✅ Tentatives cliquable => ouvre modal */}
            <Card
              className="ui-card hover"
              style={{ cursor: "pointer" }}
              onClick={() => setOpenAttemptsModal(true)}
              role="button"
              tabIndex={0}
            >
              <div className="ui-card-pad" style={{ display: "grid", gap: 6 }}>
                <div style={{ color: "var(--placeholder)", fontWeight: 800 }}>
                  Tentatives de quiz (moy./élève)
                </div>
                <div style={{ fontSize: 40, fontWeight: 950, lineHeight: 1 }}>
                  {computed.avgAttemptsPerStudent.toFixed(1)}
                </div>
                <div style={{ color: "var(--placeholder)", fontSize: 13 }}>
                  Clique pour voir le détail des tentatives.
                </div>
              </div>
            </Card>
          </div>

          {/* bouton refresh */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="button" onClick={refresh} disabled={loading}>
              {loading ? "..." : "Rafraîchir"}
            </Button>
          </div>

          {/* erreurs */}
          {error && (
            <div className="ui-alert-error" style={{ padding: 12, borderRadius: 12 }}>
              {error}
            </div>
          )}

          {/* Questions difficiles */}
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 950 }}>Questions les plus difficiles</div>

            <Card className="ui-card hover" style={{ background: "rgba(255,255,255,0.75)" }}>
              <div className="ui-card-pad" style={{ display: "grid", gap: 10 }}>
                {!computed.hardQuestions.length ? (
  <div style={{ color: "var(--placeholder)", fontWeight: 800 }}>
    Rien à afficher pour l’instant.
  </div>
) : (

                  <div style={{ display: "grid", gap: 8 }}>
                    {computed.hardQuestions.map((q, i) => {
                      const rate = typeof q.wrongRate === "number" ? q.wrongRate : 0;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: "1px solid rgba(0,0,0,0.06)",
                            background: "rgba(255,255,255,0.7)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>{q.question || `Question ${i + 1}`}</div>
                          <div style={{ fontWeight: 950 }}>{(rate * 100).toFixed(0)}% échecs</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Élèves en difficulté / brillants */}
          <div className="ui-grid-2" style={{ marginTop: 6 }}>
            <Card className="ui-card hover">
              <div className="ui-card-pad" style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 950 }}>Élèves en difficulté (&lt; 4)</div>
                {!computed.struggling.length ? (
                  <div style={{ color: "var(--placeholder)", fontWeight: 800 }}>
                    Rien à afficher pour l’instant.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {computed.struggling.map(({ student, grade6 }) => (
                      <div
                        key={toId(student) || toName(student)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 14,
                          border: "1px solid rgba(0,0,0,0.06)",
                          background: "rgba(255,255,255,0.7)",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ fontWeight: 900 }}>{toName(student)}</div>
                        <div style={{ fontWeight: 950 }}>{grade6.toFixed(1)} / 6</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="ui-card hover">
              <div className="ui-card-pad" style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 950 }}>Élèves brillants (&gt; 5.5)</div>
                {!computed.brilliant.length ? (
                  <div style={{ color: "var(--placeholder)", fontWeight: 800 }}>
                    Rien à afficher pour l’instant.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {computed.brilliant.map(({ student, grade6 }) => (
                      <div
                        key={toId(student) || toName(student)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 14,
                          border: "1px solid rgba(0,0,0,0.06)",
                          background: "rgba(255,255,255,0.7)",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ fontWeight: 900 }}>{toName(student)}</div>
                        <div style={{ fontWeight: 950 }}>{grade6.toFixed(1)} / 6</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Card>

      {/* ✅ MODAL NOTES */}
      <Modal
        open={openGradesModal}
        title="Moyennes des élèves (sur 6)"
        onClose={() => setOpenGradesModal(false)}
      >
        <div style={{ display: "grid", gap: 8 }}>
          {gradeRows.map((r) => (
            <div
              key={toId(r.student) || toName(r.student)}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.06)",
                background: "rgba(255,255,255,0.7)",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 900 }}>{toName(r.student)}</div>
              <div style={{ fontWeight: 950 }}>
                {r.grade6 === null ? "—" : `${r.grade6.toFixed(1)} / 6`}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ✅ MODAL TENTATIVES */}
      <Modal
        open={openAttemptsModal}
        title="Tentatives de quiz (par élève)"
        onClose={() => setOpenAttemptsModal(false)}
      >
        <div style={{ display: "grid", gap: 8 }}>
          {attemptRows.map((r) => (
            <div
              key={toId(r.student) || toName(r.student)}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.06)",
                background: "rgba(255,255,255,0.7)",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 900 }}>{toName(r.student)}</div>
              <div style={{ fontWeight: 950 }}>{r.attempts}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
