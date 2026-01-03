import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";

export default function HomeStudent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayName = useMemo(() => {
    return (
      user?.name ||
      user?.fullName ||
      user?.username ||
      (user?.email ? user.email.split("@")[0] : "Élève")
    );
  }, [user]);

  return (
    <div className="ui-page fade-in" style={{ display: "grid", gap: 14 }}>
      {/* ===== HEADER ===== */}
      <div className="slide-up" style={{ display: "grid", gap: 6 }}>
        <h1 className="ui-page-title">
          <span className="ui-title-accent">Espace élève {displayName}</span>
        </h1>

        <p className="ui-page-subtitle">
          Accès rapide aux cours, à ta progression et à ton profil.
        </p>
      </div>

      {/* ===== SECTIONS PRINCIPALES ===== */}
      <div className="ui-grid-2 slide-up">
        {/* ===== COURS & QUIZ ===== */}
        <Card className="ui-card hover">
          <div
            className="ui-card-pad"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              height: "100%",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                📚 Cours & quiz
              </div>

              <div style={{ color: "var(--placeholder)", lineHeight: 1.55 }}>
                Tes professeurs te proposent des quiz que tu peux réaliser.
                <br />
                <br />
                Lors du premier essai, tu gagnes des points en fonction de tes
                réponses justes.
                <br />
                Ensuite, pour que le quiz soit validé, il faut que tu le réussisses
                une fois en répondant correctement à toutes les questions.
                <br />
                Une fois validé, tu récupères encore les points manquants pour
                améliorer ta note finale.
              </div>
            </div>

            {/* bouton bas droite */}
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="button"
                onClick={() => navigate("/student/classes")}
                style={{ minWidth: 180 }}
              >
                Voir mes classes →
              </Button>
            </div>
          </div>
        </Card>

        {/* ===== PROGRESSION ===== */}
        <Card className="ui-card hover">
          <div
            className="ui-card-pad"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              height: "100%",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                📈 Suis tes progressions
              </div>

              <div style={{ color: "var(--placeholder)", lineHeight: 1.55 }}>
                Consulte ta note globale, ton niveau par classe, les quiz qu’il te
                reste à valider et les erreurs à corriger pour progresser plus
                rapidement.
              </div>
            </div>

            {/* bouton bas droite */}
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="button"
                onClick={() => navigate("/student/rank")}
                style={{ minWidth: 200 }}
              >
                Voir ma progression →
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* ===== PROFIL ===== */}
      <Card className="ui-card hover slide-up">
        <div
          className="ui-card-pad"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>👤 Mon profil</div>
            <div style={{ color: "var(--placeholder)", marginTop: 4 }}>
              Modifie tes informations et paramètres de compte.
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/student/profile")}
          >
            Modifier mon profil →
          </Button>
        </div>
      </Card>
    </div>
  );
}
