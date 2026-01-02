import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";

export default function HomeTeacher() {
  const navigate = useNavigate();

  return (
    <div className="ui-page fade-in">
      {/* HEADER */}
      <div className="slide-up" style={{ display: "grid", gap: 8 }}>
        <h1 className="ui-page-title" style={{ margin: 0 }}>
          Espace professeur Quizparty
        </h1>
      </div>

      {/* BLOCS */}
      <div className="slide-up" style={{ marginTop: 18, display: "grid", gap: 14 }}>
        {/* 2 cartes principales */}
        <div className="ui-grid-2" style={{ alignItems: "stretch" }}>
          {/* COURS */}
          <Card className="ui-card ui-card-hero hover">
            <div
              className="ui-card-pad"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 18,
                alignItems: "center",
                minHeight: 160, // équilibre visuel
              }}
            >
              <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
                <div style={{ fontWeight: 950, fontSize: 18 }}>
                  📘 Créer des cours, chapitres, quiz
                </div>
                <div style={{ color: "var(--placeholder)", lineHeight: 1.35 }}>
                  Tu ajoutes tes contenus, tu structures par chapitres, et la plateforme
                  génère des quiz que les élèves réalisent.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="button" onClick={() => navigate("/teacher/classes")}>
                  Créer / gérer mes cours
                </Button>
              </div>
            </div>
          </Card>

          {/* INSIGHTS */}
          <Card className="ui-card ui-card-hero hover">
            <div
              className="ui-card-pad"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 18,
                alignItems: "center",
                minHeight: 160, // même hauteur que l'autre
              }}
            >
              <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
                <div style={{ fontWeight: 950, fontSize: 18 }}>
                  📊 Insights pédagogiques
                </div>
                <div style={{ color: "var(--placeholder)", lineHeight: 1.35 }}>
                  Une vue globale pour comprendre ce qui se passe : élèves en difficulté,
                  questions mal comprises, et leviers pour améliorer l’enseignement.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="button" onClick={() => navigate("/teacher/insights")}>
                  Voir les insights
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* PROFIL */}
        <Card className="ui-card hover" style={{ opacity: 0.9 }}>
          <div
            className="ui-card-pad"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontWeight: 900 }}>👤 Mon profil</div>
              <div style={{ color: "var(--placeholder)" }}>
                Modifier tes informations et paramètres de compte.
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/teacher/profile")}
            >
              Modifier mon profil →
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
