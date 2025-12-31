import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, me } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/card";
import Button from "../components/ui/button";
import Input from "../components/ui/input";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      const user = await me();
      setUser(user);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-grid bg-overlay" style={{ display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <Card>
          <form onSubmit={onSubmit} style={{ padding: 22, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img src="/assets/images/icon.png" alt="Studeasy" style={{ width: 48, height: 48, borderRadius: 14 }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>STUDEASY</div>
                <div style={{ fontSize: 13, color: "var(--placeholder)" }}>Connexion à ton espace</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--placeholder)" }}>Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex: prof@ecole.ch" autoComplete="email" />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--placeholder)" }}>Mot de passe</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" autoComplete="current-password" />
            </div>

            {error && (
              <div style={{ background: "#FEDCDB", border: "1px solid #FF4848", color: "#b00020", padding: 10, borderRadius: 14, fontSize: 13 }}>
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
