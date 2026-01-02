import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getClasses } from "../../api/classes";
import { useAuth } from "../../context/AuthContext";

export default function HomeTeacher() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = useMemo(() => {
    const email = String(user?.email ?? "");
    const beforeAt = email.split("@")[0] ?? "";
    if (!beforeAt) return "👋";
    return beforeAt.length > 12 ? beforeAt.slice(0, 12) + "…" : beforeAt;
  }, [user?.email]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getClasses();
        const list = Array.isArray(data) ? data : data?.classes ?? [];
        if (mounted) setClasses(list);
      } catch {
        if (mounted) setClasses([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const recent = classes.slice(0, 3);
  const totalSubjects = classes.reduce((acc, c) => acc + (c?.subjects?.length ?? 0), 0);

  return (
    <div className="ui-page fade-in">
      {/* HEADER */}
      <div className="slide-up" style={{ display: "grid", gap: 8 }}>
        <h1 className="ui-page-title">
          Salut <span className="ui-title-accent">{firstName}</span> 👋
        </h1>
        <p className="ui-page-subtitle">
          Ton espace professeur — on garde la simplicité, mais avec une vraie ambiance “app”.
        </p>
      </div>

      {/* HERO (signature) */}
      <Card className="ui-card ui-card-hero hover slide-up">
        <div className="ui-card-pad" style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 950, fontSize: 20 }}>
                ✨ Quiz questions
              </div>
              <div style={{ color: "var(--placeholder)" }}>
                Lance un quiz à partir de tes cours et vois la progression de tes élèves.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button type="button" onClick={() => navigate("/teacher/classes")}>
                Démarrer
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate("/teacher/insights")}>
                Insights
              </Button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="ui-chip">🎓 Adapté web (style mobile)</span>
            <span className="ui-chip">⚡ Rapide & fluide</span>
            <span className="ui-chip">📘 Cours → Quiz en 2 clics</span>
          </div>
        </div>
      </Card>

      {/* STATS COLORÉES */}
      <div className="ui-grid-3 slide-up">
        <Card className="ui-card hover">
          <div className="ui-card-pad ui-stat">
            <div className="ui-stat-label">🏫 Classes</div>
            <div className="ui-stat-value">{loading ? "…" : classes.length}</div>
            <div style={{ color: "var(--placeholder)" }}>
              Organise tes classes et chapitres
            </div>
          </div>
        </Card>

        <Card className="ui-card hover">
          <div className="ui-card-pad ui-stat">
            <div className="ui-stat-label">📚 Cours</div>
            <div className="ui-stat-value">{loading ? "…" : totalSubjects}</div>
            <div style={{ color: "var(--placeholder)" }}>
              Total de cours dans tes classes
            </div>
          </div>
        </Card>

        <Card className="ui-card hover">
          <div className="ui-card-pad ui-stat">
            <div className="ui-stat-label">🚀 Action rapide</div>
            <div style={{ fontWeight: 950, fontSize: 16 }}>Créer une classe</div>
            <div style={{ color: "var(--placeholder)" }}>
              La base pour ajouter des cours
            </div>
            <div style={{ marginTop: 6 }}>
              <Button type="button" variant="ghost" onClick={() => navigate("/teacher/classes")}>
                Ouvrir classes →
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* RECENT */}
      <div className="ui-page-header slide-up">
        <div style={{ display: "grid", gap: 4 }}>
          <h2 style={{ margin: 0, letterSpacing: "-0.3px" }}>Récemment consulté</h2>
          <div style={{ color: "var(--placeholder)" }}>
            Accède rapidement à tes classes
          </div>
        </div>

        <Button variant="ghost" onClick={() => navigate("/teacher/classes")}>
          Voir tout
        </Button>
      </div>

      {loading ? (
        <div className="slide-up" style={{ color: "var(--placeholder)" }}>
          Chargement…
        </div>
      ) : (
        <div className="ui-grid-3 slide-up">
          {recent.map((c) => (
            <Card key={c._id} className="ui-card hover">
              <div
                className="ui-card-pad"
                style={{ display: "grid", gap: 10, cursor: "pointer" }}
                onClick={() => navigate(`/teacher/classes/${c._id}`)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 950 }}>{c?.name ?? "Classe"}</div>
                  <span className="ui-chip">{c?.subjects?.length ?? 0} cours</span>
                </div>

                <div style={{ color: "var(--placeholder)" }}>
                  Ouvrir la classe et gérer les chapitres
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button type="button" variant="ghost">
                    Ouvrir →
                  </Button>
                  <span className="ui-chip">⭐ Favori</span>
                </div>
              </div>
            </Card>
          ))}

          {recent.length === 0 && (
            <Card className="ui-card ui-card-hero hover">
              <div className="ui-card-pad" style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 950, fontSize: 18 }}>🌱 Première étape</div>
                <div style={{ color: "var(--placeholder)" }}>
                  Commence par créer ta première classe.
                </div>
                <div style={{ marginTop: 4 }}>
                  <Button type="button" onClick={() => navigate("/teacher/classes")}>
                    + Ajouter une classe
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
