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

export default function ProfileTeacher() {
  const { user, setUser } = useAuth();

  const userId = String(user?.id ?? user?._id ?? "");
  const email = user?.email ?? "";

  const [fullName, setFullName] = useState<string>(user?.name ?? user?.fullName ?? "");
  const initialNameRef = useRef(fullName);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayName = useMemo(
    () => user?.name ?? user?.fullName ?? "Teacher",
    [user]
  );

  /* ===========================
     Load avatar from backend
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
    }, 3500);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  /* ===========================
     Avatar: pick + upload immediately
     =========================== */
  const onPickAndUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return flash("error", "Format invalide (JPG, PNG, WEBP)");
    }
    if (f.size > MAX_FILE_BYTES) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return flash("error", `Image > ${MAX_FILE_MB}MB`);
    }

    if (!userId) return flash("error", "Utilisateur introuvable");

    try {
      setLoadingAvatar(true);
      setError(null);

      const updated = await uploadProfileImage(userId, f);
      setUser(updated);

      const fresh = await getProfileImageObjectUrl(userId);
      setAvatarUrl(fresh);

      if (fileInputRef.current) fileInputRef.current.value = "";
      flash("success", "Photo mise à jour");
    } catch (err: any) {
      flash("error", err?.message ?? "Erreur upload photo");
    } finally {
      setLoadingAvatar(false);
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
    if (!newPassword || !confirmPassword) return flash("error", "Champs requis");
    if (newPassword.length < 6) return flash("error", "6 caractères minimum");
    if (newPassword !== confirmPassword) return flash("error", "Confirmation incorrecte");

    try {
      setLoadingPwd(true);
      await setPasswordFirstTime(email, newPassword);
      setPwdOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      flash("success", "Mot de passe défini");
    } catch (e: any) {
      flash(
        "error",
        e?.message ??
          "Mot de passe déjà défini. Ce backend ne permet pas de le modifier ensuite."
      );
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
            {/* Avatar cliquable + crayon */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={openFilePicker}
                style={avatarButton}
                aria-label="Modifier la photo de profil"
              >
                <div style={avatarWrap}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" style={avatarImg} />
                  ) : (
                    <div style={{ fontSize: 28 }}>👤</div>
                  )}
                </div>

                {/* crayon en haut à droite */}
                <div style={pencilTopRight}>✏️</div>

                {/* petit loader pendant upload */}
                {loadingAvatar && <div style={avatarSpinner}>⏳</div>}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={onPickAndUpload}
              />
            </div>

            {/* Infos */}
            <div style={{ flex: 1, display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 28, lineHeight: 1 }}>
                {displayName}
              </div>

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

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={onSaveName} disabled={loadingName}>
                  {loadingName ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>

              <div style={{ fontSize: 12, color: "var(--placeholder)" }}>
                JPG / PNG / WEBP — max {MAX_FILE_MB}MB
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ===== Security ===== */}
      <Card>
        <div style={{ padding: 18, display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 24 }}>Sécurité</div>

          <div style={{ fontSize: 14, opacity: 0.75 }}>
            Le mot de passe ne peut être défini ici que lors de la première connexion (mot de passe par défaut).
          </div>

          {!pwdOpen ? (
            <Button onClick={() => setPwdOpen(true)}>Modifier le mot de passe</Button>
          ) : (
            <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
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
                <Button variant="ghost" onClick={() => setPwdOpen(false)} disabled={loadingPwd}>
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
   Styles
   =========================== */
const labelInline: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.7,
};

const avatarButton: React.CSSProperties = {
  position: "relative",
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const avatarWrap: React.CSSProperties = {
  width: 110,
  height: 110,
  borderRadius: "50%",
  background: "rgba(0,0,0,0.06)",
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
  right: -6,
  width: 36,
  height: 36,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(99,102,241,0.95)",
  color: "white",
  border: "2px solid rgba(255,255,255,0.95)",
  boxShadow: "0 12px 24px rgba(99,102,241,0.25)",
  pointerEvents: "none", // le clic passe au bouton
};

const avatarSpinner: React.CSSProperties = {
  position: "absolute",
  bottom: -10,
  right: 38,
  fontSize: 12,
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  padding: "6px 8px",
  borderRadius: 999,
  boxShadow: "0 10px 22px rgba(0,0,0,0.08)",
  pointerEvents: "none",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};
