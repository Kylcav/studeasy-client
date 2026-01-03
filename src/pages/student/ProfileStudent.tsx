import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/ui/input";
import { useAuth } from "../../context/AuthContext";
import {
  uploadProfileImage,
  getProfileImageObjectUrl,
  updateUserName,
  setPasswordFirstTime,
} from "../../api/users";

const MAX_FILE_MB = 4;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

export default function ProfileStudent() {
  const { user, setUser } = useAuth();

  const userId = user?.id ?? user?._id ?? null;
  const email = user?.email ?? "";
  const initialName = user?.name ?? "";

  const [fullName, setFullName] = useState(initialName);
  const initialNameRef = useRef(initialName);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ===========================
     Load avatar (object URL)
     =========================== */
  useEffect(() => {
    let mounted = true;
    let lastUrl: string | null = null;

    (async () => {
      if (!userId) return;
      const url = await getProfileImageObjectUrl(userId);
      if (!mounted) return;

      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = url;
      setAvatarUrl(url);
    })();

    return () => {
      mounted = false;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
    };
  }, [userId]);

  /* ===========================
     Helpers
     =========================== */
  const flash = (type: "success" | "error", msg: string) => {
    if (type === "success") {
      setSuccess(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3200);
  };

  const initials = useMemo(() => {
    const n = (fullName || user?.name || "").trim();
    if (!n) return "👤";
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase() || "👤";
  }, [fullName, user?.name]);

  /* ===========================
     Avatar upload
     =========================== */
  const openFilePicker = () => fileInputRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > MAX_FILE_BYTES) {
      flash("error", `Image trop lourde (max ${MAX_FILE_MB}MB)`);
      e.target.value = "";
      return;
    }

    try {
      setLoadingAvatar(true);
      await uploadProfileImage(userId, file);

      const url = await getProfileImageObjectUrl(userId);
      setAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });

      flash("success", "Photo mise à jour");
    } catch (err: any) {
      flash("error", err?.message ?? "Erreur upload photo");
    } finally {
      setLoadingAvatar(false);
      e.target.value = "";
    }
  };

  /* ===========================
     Update name
     =========================== */
  const onSaveName = async () => {
    const trimmed = (fullName ?? "").trim();
    if (!trimmed) return flash("error", "Nom vide");

    if (trimmed === initialNameRef.current) {
      return flash("success", "Nom déjà à jour");
    }

    try {
      setLoadingName(true);
      const updated = await updateUserName(userId, trimmed);
      setUser(updated);
      initialNameRef.current = trimmed;
      flash("success", "Nom mis à jour");
    } catch (e: any) {
      flash("error", e?.message ?? "Erreur mise à jour nom");
    } finally {
      setLoadingName(false);
    }
  };

  /* ===========================
     Password (backend V2 flow)
     =========================== */
  const onSetPassword = async () => {
    if (!email) return flash("error", "Email manquant");
    if (!newPassword) return flash("error", "Mot de passe manquant");
    if (newPassword.length < 6) return flash("error", "6 caractères minimum");
    if (newPassword !== confirmPassword)
      return flash("error", "Les mots de passe ne correspondent pas");

    try {
      setLoadingPwd(true);
      await setPasswordFirstTime(email, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setPwdOpen(false);
      flash("success", "Mot de passe mis à jour");
    } catch (e: any) {
      flash("error", e?.message ?? "Erreur mise à jour mot de passe");
    } finally {
      setLoadingPwd(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 46, margin: 0 }}>Profil</h1>

      {(error || success) && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: error ? "#ffecec" : "#e8fff3",
            color: error ? "#b00020" : "#166534",
            border: error
              ? "1px solid rgba(176,0,32,0.12)"
              : "1px solid rgba(34,197,94,0.18)",
          }}
        >
          {error ?? success}
        </div>
      )}

      {/* ===== Identity ===== */}
      <Card>
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={openFilePicker}
                style={avatarButton}
                aria-label="Modifier la photo de profil"
                disabled={loadingAvatar}
              >
                <div style={avatarWrap}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" style={avatarImg} />
                  ) : (
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{initials}</div>
                  )}
                </div>

                <div style={pencilTopRight}>✏️</div>

                {loadingAvatar && <div style={avatarLoading}>Upload…</div>}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onFileChange}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.05 }}>
                {fullName || user?.name || "—"}
              </div>
            </div>
          </div>

          <div style={{ height: 14 }} />

          <div style={grid2}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={labelInline}>Nom</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={labelInline}>Email</label>
              <Input value={email} disabled />
            </div>
          </div>

          <div style={{ height: 14 }} />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onSaveName} disabled={loadingName}>
              {loadingName ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>

          <div style={{ height: 12 }} />
          <div style={{ fontSize: 12, color: "var(--placeholder)" }}>
            JPG / PNG / WEBP — max {MAX_FILE_MB}MB
          </div>
        </div>
      </Card>

      {/* ===== Security ===== */}
      <Card>
        <div style={{ padding: 18, display: "grid", gap: 10 }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>Sécurité</div>
          <div style={{ color: "var(--placeholder)" }}>
            Le mot de passe ne peut être défini ici que lors de la première connexion (mot de passe par défaut).
          </div>

          {!pwdOpen ? (
            <Button onClick={() => setPwdOpen(true)} style={{ width: "100%" }}>
              Modifier le mot de passe
            </Button>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <Input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirmer"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Button
                  variant="ghost"
                  onClick={() => setPwdOpen(false)}
                  disabled={loadingPwd}
                >
                  Annuler
                </Button>
                <Button onClick={onSetPassword} disabled={loadingPwd}>
                  {loadingPwd ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ===========================
   Styles (identiques teacher)
   =========================== */
const avatarButton: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  position: "relative",
  display: "inline-block",
};

const avatarWrap: React.CSSProperties = {
  width: 88,
  height: 88,
  borderRadius: 999,
  background: "#0f172a",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
};

const avatarImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const pencilTopRight: React.CSSProperties = {
  position: "absolute",
  top: -6,
  left: 58,
  width: 34,
  height: 34,
  borderRadius: 999,
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 10px 22px rgba(0,0,0,0.08)",
  pointerEvents: "none",
};

const avatarLoading: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  fontSize: 12,
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  padding: "6px 10px",
  borderRadius: 999,
  boxShadow: "0 10px 22px rgba(0,0,0,0.08)",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const labelInline: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--placeholder)",
};
