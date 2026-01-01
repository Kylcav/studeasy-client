import React, { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getClasses } from "../../api/classes";
import { getClassInsights } from "../../api/quiz";

type ClassType = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
};

type InsightItem = {
  question?: string;
  totalAttempts?: number;
  wrongAttempts?: number;
  wrongRate?: number; // 0..1
};

type ClassInsights = {
  classId: string;
  className?: string;
  avgScore?: number; // 0..100
  totalStudents?: number;
  totalQuizAttempts?: number;
  hardestQuestions?: InsightItem[];
};

export default function InsightsTeacher() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<ClassInsights | null>(null);

  // --- 1) Charger les classes ---
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingClasses(true);
        setError(null);

        const res: any = await getClasses();
        const list: ClassType[] = Array.isArray(res) ? res : res?.classes ?? [];

        if (!mounted) return;

        setClasses(list);

        const firstId =
          list?.[0]?._id ?? list?.[0]?.id ? String(list[0]._id ?? list[0].id) : "";
        setSelectedClassId((prev) => prev || firstId);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Impossible de charger tes classes.");
      } finally {
        if (!mounted) return;
        setLoadingClasses(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedClass = useMemo(() => {
    return classes.find((c) => String(c._id ?? c.id) === String(selectedClassId)) ?? null;
  }, [classes, selectedClassId]);

  const fetchInsights = async (classId: string, cls?: ClassType | null) => {
    setLoadingInsights(true);
    setError(null);

    try {
      const res: any = await getClassInsights(classId, "all");

      // backend V2: { class, stats: { mean, attempts, studentsCount }, hardestQuestions: [...] }
      const mean = res?.stats?.mean; // 0..100
      const attempts = res?.stats?.attempts;
      const studentsCount = res?.stats?.studentsCount;

      const hardest: InsightItem[] = Array.isArray(res?.hardestQuestions)
        ? res.hardestQuestions.map((q: any) => ({
            question: q?.question,
            totalAttempts: q?.attemptsEstimated,
            wrongAttempts: q?.wrongCount,
            wrongRate: q?.wrongRate,
          }))
        : [];

      const data: ClassInsights = {
        classId,
        className: res?.class?.name ?? cls?.name ?? cls?.title ?? "Classe",
        avgScore: typeof mean === "number" ? mean : undefined,
        totalQuizAttempts: typeof attempts === "number" ? attempts : undefined,
        totalStudents: typeof studentsCount === "number" ? studentsCount : undefined,
        hardestQuestions: hardest,
      };

      setInsights(data);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger les insights.");
      setInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  };

  // --- 2) Charger les insights quand la classe change ---
  useEffect(() => {
    if (!selectedClassId) {
      setInsights(null);
      return;
    }

    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchInsights(selectedClassId, selectedClass);
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  const headerRight = (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div style={{ fontSize: 12, color: "var(--placeholder)" }}>
        {loadingClasses ? "Chargement des classes..." : `${classes.length} classes`}
      </div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 900 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <h1 style={{ margin: 0 }}>Insights</h1>
        {headerRight}
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <Card>
        <div style={{ padding: 16, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={label}>Classe</div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={select}
              disabled={loadingClasses || classes.length === 0}
            >
              {classes.length === 0 ? (
                <option value="">Aucune classe</option>
              ) : (
                classes.map((c) => {
                  const id = String(c._id ?? c.id);
                  return (
                    <option key={id} value={id}>
                      {c.name ?? c.title ?? "Classe"}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <StatCard
              title="Moyenne (classe)"
              value={formatPercent(insights?.avgScore, true)}
              loading={loadingInsights}
            />
            <StatCard
              title="Élèves"
              value={formatNumber(insights?.totalStudents)}
              loading={loadingInsights}
            />
            <StatCard
              title="Tentatives de quiz"
              value={formatNumber(insights?.totalQuizAttempts)}
              loading={loadingInsights}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 600 }}>Questions les plus difficiles</div>
              <Button
                type="button"
                disabled={loadingInsights || !selectedClassId}
                onClick={() => fetchInsights(selectedClassId, selectedClass)}
              >
                Rafraîchir
              </Button>
            </div>

            {loadingInsights ? (
              <div style={{ fontSize: 13, color: "var(--placeholder)" }}>Chargement...</div>
            ) : (insights?.hardestQuestions?.length ?? 0) === 0 ? (
              <div style={emptyBox}>
                Rien à afficher pour l’instant.
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  👉 Les insights apparaissent dès que les élèves soumettent des résultats (POST /quiz/:subjectId/submit).
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {insights!.hardestQuestions!.map((q, idx) => (
                  <Card key={idx}>
                    <div style={{ padding: 14, display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 600 }}>{q.question ?? "Question"}</div>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          fontSize: 12,
                          color: "var(--placeholder)",
                        }}
                      >
                        <span>Tentatives: {formatNumber(q.totalAttempts)}</span>
                        <span>Erreurs: {formatNumber(q.wrongAttempts)}</span>
                        <span>Taux d’erreur: {formatPercent(q.wrongRate)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ title, value, loading }: { title: string; value: string; loading?: boolean }) {
  return (
    <Card>
      <div style={{ padding: 14, display: "grid", gap: 6 }}>
        <div style={{ fontSize: 12, color: "var(--placeholder)" }}>{title}</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{loading ? "—" : value}</div>
      </div>
    </Card>
  );
}

function formatNumber(n?: number) {
  if (n == null || Number.isNaN(n)) return "—";
  return String(n);
}

// if alreadyPercent=true => avgScore is 0..100, else ratio 0..1
function formatPercent(v?: number, alreadyPercent = false) {
  if (v == null || Number.isNaN(v)) return "—";
  const pct = alreadyPercent ? v : v * 100;
  return `${Math.round(pct)}%`;
}

const label: React.CSSProperties = { fontSize: 12, color: "var(--placeholder)" };

const select: React.CSSProperties = {
  width: "100%",
  height: 42,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  padding: "0 12px",
  outline: "none",
};

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};

const emptyBox: React.CSSProperties = {
  background: "rgba(0,0,0,0.04)",
  padding: 12,
  borderRadius: 12,
  fontSize: 13,
};
