import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/card";
import Button from "../components/ui/button";
import { logout } from "../api/auth";

type AnyUser = any;

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const role = useMemo(
    () => String(user?.role ?? user?.type ?? "").trim().toLowerCase(),
    [user]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AnyUser | null>(null);

  useEffect(() => {
    // ✅ On utilise le user déjà en mémoire (suffisant pour afficher le profil)
    // Si tu veux plus tard: fetch /api/users/:id ici.
    setProfile(user ?? null);
  }, [user]);

  const base = role === "teacher" ? "/teacher" : "/student";

  const onLogout = async () => {
    try {
      setLoading(true);
      await logout();
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la déconnexion.");
    } finally {
      setLoading(false);
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  const name = profile?.name ?? "—";
  const email = profile?.email ?? "—";
  const displayRole = role || "—";
  const id = profile?.id ?? profile?._id ?? "—";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Profile</h1>
          <div style={{ color: "var(--placeholder)" }}>
            Gère ton compte et tes informations.
          </div>
        </div>

        <Button type="button" onClick={() => navigate(base, { replace: true })}>
          Retour
        </Button>
      </div>

      <div style={{ height: 16 }} />

      {error && (
        <div
          style={{
            background: "#FEDCDB",
            border: "1px solid #FF4848",
            color: "#b00020",
            padding: 10,
            borderRadius: 14,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <Card>
        <div style={{ padding: 18, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 12, color: "var(--placeholder)" }}>Nom</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{name}</div>
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 12, color: "var(--placeholder)" }}>Email</div>
            <div style={{ fontSize: 15 }}>{email}</div>
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 12, color: "var(--placeholder)" }}>Rôle</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{displayRole}</div>
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 12, color: "var(--placeholder)" }}>ID</div>
            <div style={{ fontSize: 12, fontFamily: "monospace" }}>{String(id)}</div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Button type="button" disabled={loading} onClick={onLogout}>
              {loading ? "Déconnexion..." : "Déconnexion"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
