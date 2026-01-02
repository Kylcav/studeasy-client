import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import { getClasses } from "../../api/classes";
import { useAuth } from "../../context/AuthContext";

export default function StudentHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classes, setClasses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getClasses()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : res?.classes ?? [];
        setClasses(list);
      })
      .catch((e) => mounted && setError(e?.message ?? "Request failed"));
    return () => {
      mounted = false;
    };
  }, []);

  const firstName = useMemo(() => {
    const name = String(user?.name ?? user?.fullName ?? "").trim();
    return name ? name.split(" ")[0] : "";
  }, [user]);

  const recentClasses = useMemo(() => {
    return classes
      .slice()
      .sort((a, b) => {
        const da = new Date(a?.createdAt ?? 0).getTime();
        const db = new Date(b?.createdAt ?? 0).getTime();
        return db - da;
      })
      .slice(0, 5);
  }, [classes]);

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 980 }}>
      <h1 style={{ margin: 0 }}>
        {firstName ? `Salut ${firstName} 👋` : "Salut 👋"}
      </h1>
      <p style={{ margin: 0, color: "#666" }}>
        Comme sur l’app Studeasy-v2 : accès rapide aux classes et aux quiz.
      </p>

      {error && <div style={errorBox}>{error}</div>}

      <Card>
        <div
          style={{
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Quiz questions</div>
            <div style={{ color: "#666", fontSize: 13 }}>
              Lance un quiz sur tes cours et progresse plus vite.
            </div>
          </div>
          <Button type="button" onClick={() => navigate("/student/classes")}>
            Démarrer
          </Button>
        </div>
      </Card>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Récemment consulté</h2>
        <button onClick={() => navigate("/student/classes")} style={linkBtn}>
          Voir tout
        </button>
      </div>

      <div style={grid}>
        {recentClasses.map((c) => {
          const id = String(c?.id ?? c?._id ?? "");
          return (
            <button
              key={id}
              onClick={() => navigate(`/student/classes/${id}`)}
              style={classCard}
            >
              <div style={{ fontWeight: 900 }}>{c?.name ?? "Classe"}</div>
              <div style={{ color: "#666", marginTop: 6, fontSize: 13 }}>
                {c?.subjects?.length ? `${c.subjects.length} cours` : "0 cours"}
              </div>
            </button>
          );
        })}
      </div>

      {!error && classes.length === 0 && (
        <Card>
          <div style={{ padding: 14, color: "#666" }}>
            Aucune classe trouvée. Demande à ton professeur de t’inviter dans une classe.
          </div>
        </Card>
      )}
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

const classCard: React.CSSProperties = {
  textAlign: "left",
  background: "#fff",
  borderRadius: 14,
  padding: 16,
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  cursor: "pointer",
};

const linkBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--primary)",
  cursor: "pointer",
  fontWeight: 700,
};

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};
