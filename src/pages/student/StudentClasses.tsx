import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getClasses } from "../../api/classes";

function accentToShadow(accent: string) {
  const s = String(accent ?? "").trim();
  const m = s.match(
    /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)/i
  );
  if (!m) return "rgba(0,0,0,0.12)";
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  return `rgba(${r},${g},${b},0.36)`;
}

export default function ClassesStudent() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI : sélection (on garde, comme teacher)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ exactement comme teacher : supporte les 2 formats
      const data = await getClasses();
      const list = Array.isArray(data) ? data : data?.classes ?? [];

      setClasses(list);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger les classes.");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ui-page fade-in">
      {/* ===== HEADER (même que teacher, sans bouton ajouter) ===== */}
      <div className="slide-up" style={{ display: "grid", gap: 10 }}>
        <div
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
              <span className="ui-title-accent">Classes</span>
            </h1>
            <p className="ui-page-subtitle">
              Retrouve tes classes et ouvre-les pour accéder aux cours et aux quiz.
            </p>
          </div>
        </div>
      </div>

      {/* ===== ERROR (même style que teacher) ===== */}
      {error && (
        <Card className="ui-card hover slide-up">
          <div className="ui-card-pad ui-alert-error">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Oups…</div>
            <div>{error}</div>
          </div>
        </Card>
      )}

      {/* ===== EMPTY (texte adapté student) ===== */}
      {!loading && classes.length === 0 && !error && (
        <Card className="ui-card ui-card-hero hover slide-up">
          <div className="ui-card-pad" style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>📚 Aucune classe</div>
            <div style={{ color: "var(--placeholder)" }}>
              Tes classes apparaîtront ici dès qu’un professeur t’aura ajouté.
            </div>
          </div>
        </Card>
      )}

      {/* ===== GRID CLASSES (copie 1:1 teacher, sans croix + sans édition) ===== */}
      <div className="ui-grid-3 slide-up">
        {classes.map((c, idx) => {
          const count = c?.subjects?.length ?? 0;

          const accent =
            idx % 3 === 0
              ? "rgba(93,128,250,0.18)"
              : idx % 3 === 1
              ? "rgba(74,222,128,0.14)"
              : "rgba(251,191,36,0.12)";

          return (
            <Card
              key={c._id}
              className={`ui-card hover class-tile ${
                selectedId === c._id ? "is-selected" : ""
              }`}
              style={{
                ["--class-accent" as any]: accent,
                ["--class-shadow" as any]: accentToShadow(accent),
              }}
              onClick={() => setSelectedId(String(c._id))}
            >
              <div className="ui-card-pad class-card">
                <div className="class-top">
                  <div style={{ minWidth: 0 }}>
                    {/* ✅ même rendu que teacher, mais sans bouton d’édition */}
                    <div className="class-title" style={{ cursor: "default" }}>
                      {c?.name ?? "Classe"}
                    </div>

                    <div className="class-sub">
                      {count === 0
                        ? "Aucun cours"
                        : count === 1
                        ? "1 cours"
                        : `${count} cours`}
                    </div>
                  </div>
                </div>

                <div
                  className="class-bottom"
                  style={{ display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/classes/${c._id}`);
                    }}
                  >
                    Ouvrir →
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
