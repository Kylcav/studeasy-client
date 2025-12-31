import { useParams } from "react-router-dom";

export default function Quiz() {
  const { id } = useParams();

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0 }}>Quiz</h1>
      <p style={{ margin: 0, color: "#666" }}>ID du quiz : <b>{id}</b></p>
      <div style={{ color: "#666" }}>
        (Étape suivante : charger le quiz via l’API et afficher les questions en web.)
      </div>
    </div>
  );
}
