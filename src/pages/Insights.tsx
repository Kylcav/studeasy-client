import { useEffect, useMemo, useState } from "react";
import { getClasses } from "../api/classes";
import { getClassInsights } from "../api/quiz";

export default function Insights() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClasses()
      .then((c) => {
        setClasses(c);
        if (c?.[0]?._id) setSelectedClassId(c[0]._id);
      })
      .catch((e) => setError(e?.message ?? "Request failed"));
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    setError(null);
    getClassInsights(selectedClassId, "all")
      .then(setInsights)
      .catch((e) => setError(e?.message ?? "Request failed"));
  }, [selectedClassId]);

  const stats = insights?.stats;

  const hardest = useMemo(() => insights?.hardestQuestions ?? [], [insights]);
  const struggling = useMemo(() => insights?.students?.struggling ?? [], [insights]);
  const top = useMemo(() => insights?.students?.top ?? [], [insights]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Insights</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ color: "#666", minWidth: 120 }}>Classe</div>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          style={select}
        >
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Stat label="Mean" value={stats ? `${stats.mean.toFixed(0)}%` : "—"} />
        <Stat label="Median" value={stats ? `${stats.median.toFixed(0)}%` : "—"} />
        <Stat label="Std" value={stats ? `${stats.std.toFixed(1)}` : "—"} />
        <Stat label="Attempts" value={stats ? String(stats.attempts) : "0"} />
        <Stat label="Students" value={stats ? String(stats.studentsCount) : "0"} />
        <Stat label="Range" value={stats ? `${stats.min.toFixed(0)}–${stats.max.toFixed(0)}` : "—"} />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: "10px 0 0" }}>Questions les plus ratées</h2>

        <div style={{ display: "grid", gap: 12 }}>
          {hardest.slice(0, 6).map((q: any, idx: number) => (
            <div key={idx} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 800, color: "#3b5bff" }}>
                  {q.subjectTitle || "Cours"}
                </div>
                <div style={pillRed}>
                  {Math.round((q.wrongRate || 0) * 100)}% wrong
                </div>
              </div>

              <div style={{ marginTop: 8 }}>{q.question}</div>

              {!!q.mostChosenWrong && (
                <div style={{ marginTop: 10, color: "#b00020" }}>
                  <b>Most chosen:</b> {q.mostChosenWrong}
                </div>
              )}

              <div style={{ marginTop: 6, color: "#3b5bff" }}>
                <b>Correct:</b> {q.correctAnswer || "—"}
              </div>
            </div>
          ))}

          {hardest.length === 0 && <div style={{ color: "#666" }}>Aucune donnée.</div>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <h2 style={{ margin: "10px 0 10px" }}>En difficulté</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {struggling.slice(0, 8).map((s: any) => (
              <div key={s.userId} style={card}>
                <div style={{ fontWeight: 800 }}>{s.name || "—"}</div>
                <div style={{ color: "#666", marginTop: 4 }}>
                  Avg: {Math.round(s.avg ?? 0)}% • Attempts: {s.attempts ?? 0}
                </div>
              </div>
            ))}
            {struggling.length === 0 && <div style={{ color: "#666" }}>—</div>}
          </div>
        </div>

        <div>
          <h2 style={{ margin: "10px 0 10px" }}>Top</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {top.slice(0, 8).map((s: any) => (
              <div key={s.userId} style={card}>
                <div style={{ fontWeight: 800 }}>{s.name || "—"}</div>
                <div style={{ color: "#666", marginTop: 4 }}>
                  Avg: {Math.round(s.avg ?? 0)}% • Attempts: {s.attempts ?? 0}
                </div>
              </div>
            ))}
            {top.length === 0 && <div style={{ color: "#666" }}>—</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={statCard}>
      <div style={{ color: "#666", fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 18, marginTop: 6 }}>{value}</div>
    </div>
  );
}

const select: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: "10px 12px",
  border: "1px solid rgba(0,0,0,0.08)",
  width: 360,
};

const statCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const pillRed: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 12,
  whiteSpace: "nowrap",
};

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};
