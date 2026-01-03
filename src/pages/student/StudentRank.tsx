import { useEffect, useMemo, useState, type ReactNode } from "react";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getClasses } from "../../api/classes";
import { getSubjectsByClass } from "../../api/subjects";
import { getMyMistakes, getMyScores } from "../../api/quiz";

type ClassType = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
};

type SubjectType = {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
};

const POINTS_PER_QUESTION = 20;
const COMPLETE_EPS = 0.0001;
const ALL = "__all__";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function toId(x: any) {
  return String(x?.id ?? x?._id ?? "");
}

function toClassName(c: any) {
  return String(c?.name ?? c?.title ?? "Classe");
}

function toSubjectTitle(s: any) {
  return String(s?.title ?? s?.name ?? "Cours");
}

function grade6FromPoints(points: number, maxPoints: number) {
  if (!maxPoints || maxPoints <= 0) return 0;
  return clamp((points / maxPoints) * 6, 0, 6);
}

/**
 * ✅ Calcule les points finaux d'un quiz
 * - si tentatives incrémentales -> somme peut dépasser max => on prend le meilleur
 * - sinon -> somme bornée
 */
function computeFinalPoints(sumPoints: number, bestPoints: number, maxPoints: number) {
  if (!maxPoints || maxPoints <= 0) return 0;
  if (sumPoints > maxPoints) return clamp(bestPoints, 0, maxPoints);
  return clamp(sumPoints, 0, maxPoints);
}

/** ✅ Modal (style InsightsTeacher) */
function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
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
          width: "min(760px, 96vw)",
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

type CourseRow = {
  key: string;
  title: string;
  grade6: number | null; // null = pas entrepris
  attempts: number;
};

export default function StudentRank() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(ALL);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // cards
  const [avgGrade6, setAvgGrade6] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [doneQuizzes, setDoneQuizzes] = useState(0);

  // modal
  const [openCoursesModal, setOpenCoursesModal] = useState(false);
  const [courseRows, setCourseRows] = useState<CourseRow[]>([]);

  // erreurs
  const [mistakesByClass, setMistakesByClass] = useState<Record<string, any[]>>({});

  // accordéons
  const [openChapterKey, setOpenChapterKey] = useState<string | null>(null); // mode 1 niveau
  const [openClassKey, setOpenClassKey] = useState<string | null>(null); // mode all -> classe
  const [openChapterKeyByClass, setOpenChapterKeyByClass] = useState<Record<string, string | null>>(
    {}
  );

  const classNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classes) map.set(toId(c), toClassName(c));
    return map;
  }, [classes]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const listRaw = await getClasses();
        const list: any[] = Array.isArray(listRaw) ? listRaw : listRaw?.classes ?? [];
        setClasses(list);

        // ✅ par défaut: toutes les classes
        setSelectedClassId(ALL);
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger les classes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedClassName = useMemo(() => {
    if (selectedClassId === ALL) return "Toutes les classes";
    const c = classes.find((x) => toId(x) === selectedClassId);
    return c ? toClassName(c) : "Classe";
  }, [classes, selectedClassId]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ data quiz & erreurs (endpoints élève)
      const [scoresRaw, mistakesRaw] = await Promise.all([getMyScores(), getMyMistakes()]);

      const scores: any[] =
        Array.isArray(scoresRaw?.results)
          ? scoresRaw.results
          : Array.isArray(scoresRaw)
          ? scoresRaw
          : [];

      const mistakesByCls: Record<string, any[]> =
        mistakesRaw?.mistakesByClass && typeof mistakesRaw.mistakesByClass === "object"
          ? mistakesRaw.mistakesByClass
          : {};
      setMistakesByClass(mistakesByCls);

      // ✅ classes concernées
      const classIds =
        selectedClassId === ALL
          ? classes.map((c) => toId(c)).filter(Boolean)
          : [selectedClassId].filter(Boolean);

      // ✅ sujets de toutes les classes concernées
      const subjectsByClass = new Map<string, SubjectType[]>();

      await Promise.all(
        classIds.map(async (cid) => {
          try {
            const subjRes = await getSubjectsByClass(String(cid));
            const subjList = Array.isArray(subjRes)
              ? subjRes
              : subjRes?.subjects ?? subjRes?.data ?? [];
            const subjArr: SubjectType[] = Array.isArray(subjList) ? subjList : [];
            subjectsByClass.set(cid, subjArr);
          } catch {
            subjectsByClass.set(cid, []);
          }
        })
      );

      // ✅ total quizzes = somme des cours
      const total = Array.from(subjectsByClass.values()).reduce((acc, arr) => acc + arr.length, 0);
      setTotalQuizzes(total);

      // ✅ construire un set des subjectIds concernés
      const subjectIdsAll = new Set<string>();
      for (const arr of subjectsByClass.values()) {
        for (const s of arr) {
          const sid = toId(s);
          if (sid) subjectIdsAll.add(sid);
        }
      }

      // ✅ filtrer scores sur les subjects concernés
      const relevantScores = scores.filter((r) => {
        const sid = String(r?.subjectId?._id ?? r?.subjectId ?? "");
        return sid && subjectIdsAll.has(sid);
      });

      // ✅ agrégation scores par subjectId
      const bySubject = new Map<
        string,
        { sumPoints: number; bestPoints: number; maxPoints: number; attempts: number }
      >();

      for (const r of relevantScores) {
        const sid = String(r?.subjectId?._id ?? r?.subjectId ?? "");
        if (!sid) continue;

        const pts = Number(r?.points ?? 0);
        const mp =
          Number(r?.meta?.maxPoints ?? 0) ||
          Number(r?.totalQuestions ?? 0) * POINTS_PER_QUESTION;

        if (!mp || mp <= 0) continue;

        const entry =
          bySubject.get(sid) ?? { sumPoints: 0, bestPoints: -Infinity, maxPoints: mp, attempts: 0 };

        entry.sumPoints += pts;
        entry.bestPoints = Math.max(entry.bestPoints, pts);
        entry.maxPoints = Math.max(entry.maxPoints, mp);
        entry.attempts += 1;

        bySubject.set(sid, entry);
      }

      // ✅ rows pour modal + calcul global
      const rows: CourseRow[] = [];

      for (const [cid, subjArr] of subjectsByClass.entries()) {
        const cName = classNameById.get(cid) ?? "Classe";

        for (const s of subjArr) {
          const sid = toId(s);
          const sTitle = toSubjectTitle(s);
          const title = selectedClassId === ALL ? `${cName} · ${sTitle}` : sTitle;

          const e = bySubject.get(sid);
          if (!e || e.attempts <= 0 || !Number.isFinite(e.bestPoints)) {
            rows.push({ key: `${cid}:${sid || sTitle}`, title, grade6: null, attempts: 0 });
            continue;
          }

          const finalPts = computeFinalPoints(e.sumPoints, e.bestPoints, e.maxPoints);
          const g6 = grade6FromPoints(finalPts, e.maxPoints);

          rows.push({
            key: `${cid}:${sid || sTitle}`,
            title,
            grade6: Math.round(g6 * 10) / 10,
            attempts: e.attempts,
          });
        }
      }

      setCourseRows(rows);

      // ✅ moyenne globale = uniquement entrepris (sur toutes les classes si ALL)
      const attempted = rows.filter((r) => r.grade6 !== null) as (CourseRow & { grade6: number })[];
      const avg =
        attempted.length > 0
          ? attempted.reduce((acc, r) => acc + r.grade6, 0) / attempted.length
          : 0;
      setAvgGrade6(Math.round(avg * 10) / 10);

      // ✅ réalisés = uniquement complétés à 100% (6/6)
      const done = rows.filter((r) => r.grade6 !== null && r.grade6 >= 6 - COMPLETE_EPS).length;
      setDoneQuizzes(done);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger la progression.");
      setAvgGrade6(0);
      setTotalQuizzes(0);
      setDoneQuizzes(0);
      setCourseRows([]);
      setMistakesByClass({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // refresh quand classes chargées + sélection
    if (!classes.length) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, classes.length]);

  // ===== Mistakes sélectionnées =====
  const mistakesSelected = useMemo(() => {
    if (selectedClassId === ALL) {
      // toutes les erreurs de toutes les classes
      const all: any[] = [];
      for (const [cid, arr] of Object.entries(mistakesByClass)) {
        if (Array.isArray(arr)) {
          all.push(...arr.map((m) => ({ ...m, __classId: cid })));
        }
      }
      return all;
    }

    // seulement classe sélectionnée
    return (mistakesByClass[selectedClassId] ?? []).map((m) => ({ ...m, __classId: selectedClassId }));
  }, [mistakesByClass, selectedClassId]);

  // ===== Accordéon MODE 1 (classe spécifique) : chapitres -> erreurs =====
  const mistakesByChapter = useMemo(() => {
    if (selectedClassId === ALL) return [];
    const map = new Map<string, { title: string; items: any[] }>();

    for (const m of mistakesSelected) {
      const title = String(m?.subjectTitle ?? m?.subjectName ?? "Chapitre");
      const key = title.trim().toLowerCase();
      const entry = map.get(key) ?? { title, items: [] };
      entry.items.push(m);
      map.set(key, entry);
    }

    return Array.from(map.values()).sort((a, b) => (b.items.length || 0) - (a.items.length || 0));
  }, [mistakesSelected, selectedClassId]);

  // ===== Accordéon MODE ALL (toutes classes) : classes -> chapitres -> erreurs =====
  const mistakesTreeAll = useMemo(() => {
    if (selectedClassId !== ALL) return [];

    const byClass = new Map<
      string,
      { classId: string; className: string; chapters: Map<string, { title: string; items: any[] }> }
    >();

    for (const m of mistakesSelected) {
      const cid = String(m?.__classId ?? "");
      if (!cid) continue;

      const className = classNameById.get(cid) ?? "Classe";
      const chapTitle = String(m?.subjectTitle ?? m?.subjectName ?? "Chapitre");
      const chapKey = chapTitle.trim().toLowerCase();

      const cEntry =
        byClass.get(cid) ??
        { classId: cid, className, chapters: new Map<string, { title: string; items: any[] }>() };

      const chEntry = cEntry.chapters.get(chapKey) ?? { title: chapTitle, items: [] };
      chEntry.items.push(m);
      cEntry.chapters.set(chapKey, chEntry);

      byClass.set(cid, cEntry);
    }

    // tri classes par nb erreurs total desc
    const res = Array.from(byClass.values())
      .map((c) => {
        const chapters = Array.from(c.chapters.values()).sort(
          (a, b) => (b.items.length || 0) - (a.items.length || 0)
        );
        const totalErr = chapters.reduce((acc, ch) => acc + (ch.items.length || 0), 0);
        return { ...c, chapters, totalErr };
      })
      .sort((a, b) => (b.totalErr || 0) - (a.totalErr || 0));

    return res;
  }, [mistakesSelected, selectedClassId, classNameById]);

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
            <span className="ui-title-accent">Progression</span>
          </h1>
        </div>

        <div style={{ color: "var(--placeholder)", fontWeight: 800 }}>
          {classes.length} classes
        </div>
      </div>

      {/* container principal */}
      <Card className="ui-card ui-card-hero hover slide-up">
        <div className="ui-card-pad" style={{ display: "grid", gap: 14 }}>
          {/* ✅ select classe (plus joli) */}
          <Card className="ui-card hover" style={{ background: "rgba(255,255,255,0.75)" }}>
            <div className="ui-card-pad" style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div className="ui-field-label" style={{ margin: 0 }}>
                  Classe
                </div>
                <div style={{ color: "var(--placeholder)", fontWeight: 800, fontSize: 13 }}>
                  {selectedClassName}
                </div>
              </div>

              <select
                className="ui-select"
                value={selectedClassId}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedClassId(v);

                  // reset accordéons
                  setOpenChapterKey(null);
                  setOpenClassKey(null);
                  setOpenChapterKeyByClass({});
                }}
              >
                <option value={ALL}>Toutes les classes</option>
                {classes.map((c) => (
                  <option key={toId(c)} value={toId(c)}>
                    {toClassName(c)}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* stats cards */}
          <div className="ui-grid-2">
            <Card
              className="ui-card hover"
              style={{ cursor: "pointer" }}
              onClick={() => setOpenCoursesModal(true)}
              role="button"
              tabIndex={0}
            >
              <div className="ui-card-pad" style={{ display: "grid", gap: 6 }}>
                <div style={{ color: "var(--placeholder)", fontWeight: 800 }}>
                  Note moyenne / 6
                </div>
                <div style={{ fontSize: 40, fontWeight: 950, lineHeight: 1 }}>
                  {avgGrade6.toFixed(1)}
                </div>
                <div style={{ color: "var(--placeholder)", fontSize: 13 }}>
                  Clique pour voir la moyenne par cours.
                </div>
              </div>
            </Card>

            <Card className="ui-card hover">
              <div className="ui-card-pad" style={{ display: "grid", gap: 6 }}>
                <div style={{ color: "var(--placeholder)", fontWeight: 800 }}>
                  Quiz réalisés
                </div>
                <div style={{ fontSize: 40, fontWeight: 950, lineHeight: 1 }}>
                  {doneQuizzes} / {totalQuizzes}
                </div>
                <div style={{ color: "var(--placeholder)", fontSize: 13 }}>
                  {selectedClassId === ALL ? "Toutes les classes" : `Classe: ${selectedClassName}`}
                </div>
              </div>
            </Card>
          </div>

          {/* refresh */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="button" onClick={refresh} disabled={loading}>
              {loading ? "..." : "Rafraîchir"}
            </Button>
          </div>

          {/* error banner */}
          {error && (
            <div className="ui-alert-error" style={{ padding: 12, borderRadius: 12 }}>
              {error}
            </div>
          )}

          {/* ===== Erreurs ===== */}
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 950 }}>Erreurs</div>

            {!mistakesSelected.length && !error ? (
              <Card className="ui-card hover" style={{ background: "rgba(255,255,255,0.75)" }}>
                <div className="ui-card-pad" style={{ color: "var(--placeholder)", fontWeight: 800 }}>
                  Rien à afficher pour l’instant.
                </div>
              </Card>
            ) : selectedClassId === ALL ? (
              // ✅ MODE ALL: classes -> chapitres -> erreurs
              <div style={{ display: "grid", gap: 12 }}>
                {mistakesTreeAll.map((cls) => {
                  const isOpenClass = openClassKey === cls.classId;

                  return (
                    <Card key={cls.classId} className="ui-card hover">
                      <div className="ui-card-pad" style={{ display: "grid", gap: 10 }}>
                        {/* Classe row */}
                        <button
                          type="button"
                          onClick={() => setOpenClassKey((cur) => (cur === cls.classId ? null : cls.classId))}
                          style={{
                            all: "unset",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                          aria-expanded={isOpenClass}
                        >
                          <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 950,
                                fontSize: 16,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {cls.className}
                            </div>
                            <div style={{ color: "var(--placeholder)", fontSize: 13, fontWeight: 800 }}>
                              {cls.totalErr} erreur{cls.totalErr > 1 ? "s" : ""}
                            </div>
                          </div>

                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 12,
                              border: "1px solid rgba(0,0,0,0.08)",
                              background: "rgba(255,255,255,0.8)",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 950,
                            }}
                          >
                            {isOpenClass ? "–" : "+"}
                          </div>
                        </button>

                        {/* Chapitres */}
                        {isOpenClass && (
                          <div style={{ display: "grid", gap: 10 }}>
                            {cls.chapters.map((ch) => {
                              const chapKey = ch.title.trim().toLowerCase();
                              const openChap = openChapterKeyByClass[cls.classId] === chapKey;

                              return (
                                <div
                                  key={`${cls.classId}:${chapKey}`}
                                  style={{
                                    borderRadius: 14,
                                    border: "1px solid rgba(0,0,0,0.06)",
                                    background: "rgba(255,255,255,0.7)",
                                    padding: 10,
                                    display: "grid",
                                    gap: 10,
                                  }}
                                >
                                  {/* Chapitre row */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenChapterKeyByClass((old) => ({
                                        ...old,
                                        [cls.classId]: old[cls.classId] === chapKey ? null : chapKey,
                                      }))
                                    }
                                    style={{
                                      all: "unset",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 12,
                                    }}
                                    aria-expanded={openChap}
                                  >
                                    <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                                      <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {ch.title}
                                      </div>
                                      <div style={{ color: "var(--placeholder)", fontSize: 13, fontWeight: 800 }}>
                                        {ch.items.length} erreur{ch.items.length > 1 ? "s" : ""}
                                      </div>
                                    </div>

                                    <div
                                      style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 12,
                                        border: "1px solid rgba(0,0,0,0.08)",
                                        background: "rgba(255,255,255,0.9)",
                                        display: "grid",
                                        placeItems: "center",
                                        fontWeight: 950,
                                      }}
                                    >
                                      {openChap ? "–" : "+"}
                                    </div>
                                  </button>

                                  {/* Erreurs */}
                                  {openChap && (
                                    <div style={{ display: "grid", gap: 10 }}>
                                      {ch.items.map((m: any, i: number) => (
                                        <div
                                          key={`${cls.classId}:${chapKey}:${i}`}
                                          style={{
                                            padding: "10px 12px",
                                            borderRadius: 14,
                                            border: "1px solid rgba(0,0,0,0.06)",
                                            background: "rgba(255,255,255,0.85)",
                                            display: "grid",
                                            gap: 8,
                                          }}
                                        >
                                          <div style={{ fontWeight: 950 }}>
                                            {m.question || `Question ${i + 1}`}
                                          </div>

                                          <div style={{ color: "#b00020", fontWeight: 900 }}>
                                            Ta réponse : {m.selectedOptionText || "—"}
                                          </div>

                                          <div style={{ color: "#166534", fontWeight: 900 }}>
                                            Bonne réponse : {m.correctOptionText || "—"}
                                          </div>

                                          <div style={{ color: "var(--placeholder)", fontSize: 13 }}>
                                            Tentative #{m.attemptNumber || 1}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              // ✅ MODE 1 classe: chapitres -> erreurs
              <div style={{ display: "grid", gap: 12 }}>
                {mistakesByChapter.map((ch) => {
                  const key = ch.title.trim().toLowerCase();
                  const isOpen = openChapterKey === key;

                  return (
                    <Card key={key} className="ui-card hover">
                      <div className="ui-card-pad" style={{ display: "grid", gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setOpenChapterKey((cur) => (cur === key ? null : key))}
                          style={{
                            all: "unset",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                          aria-expanded={isOpen}
                        >
                          <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                            <div style={{ fontWeight: 950, fontSize: 16 }}>
                              {ch.title}
                            </div>
                            <div style={{ color: "var(--placeholder)", fontSize: 13, fontWeight: 800 }}>
                              {ch.items.length} erreur{ch.items.length > 1 ? "s" : ""}
                            </div>
                          </div>

                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 12,
                              border: "1px solid rgba(0,0,0,0.08)",
                              background: "rgba(255,255,255,0.8)",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 950,
                            }}
                          >
                            {isOpen ? "–" : "+"}
                          </div>
                        </button>

                        {isOpen && (
                          <div style={{ display: "grid", gap: 10 }}>
                            {ch.items.map((m: any, i: number) => (
                              <div
                                key={`${key}:${i}`}
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: 14,
                                  border: "1px solid rgba(0,0,0,0.06)",
                                  background: "rgba(255,255,255,0.7)",
                                  display: "grid",
                                  gap: 8,
                                }}
                              >
                                <div style={{ fontWeight: 950 }}>
                                  {m.question || `Question ${i + 1}`}
                                </div>

                                <div style={{ color: "#b00020", fontWeight: 900 }}>
                                  Ta réponse : {m.selectedOptionText || "—"}
                                </div>

                                <div style={{ color: "#166534", fontWeight: 900 }}>
                                  Bonne réponse : {m.correctOptionText || "—"}
                                </div>

                                <div style={{ color: "var(--placeholder)", fontSize: 13 }}>
                                  Tentative #{m.attemptNumber || 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ✅ modal cours */}
      <Modal
        open={openCoursesModal}
        title={selectedClassId === ALL ? "Moyenne par cours (toutes classes) — sur 6" : "Moyenne par cours (sur 6)"}
        onClose={() => setOpenCoursesModal(false)}
      >
        <div style={{ display: "grid", gap: 8 }}>
          {[...courseRows]
            .sort((a, b) => {
              const ga = a.grade6 ?? 999;
              const gb = b.grade6 ?? 999;
              return ga - gb;
            })
            .map((r) => (
              <div
                key={r.key}
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
                <div style={{ fontWeight: 900 }}>{r.title}</div>
                <div style={{ fontWeight: 950 }}>
                  {r.grade6 === null ? "—" : `${r.grade6.toFixed(1)} / 6`}
                </div>
              </div>
            ))}
        </div>
      </Modal>
    </div>
  );
}
