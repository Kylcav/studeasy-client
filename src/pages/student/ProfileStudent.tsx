import React, { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/ui/input";
import { useAuth } from "../../context/AuthContext";
import { uploadProfileImage, getProfileImageObjectUrl } from "../../api/users";

const MAX_FILE_MB = 4;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

/**
 * Profil Student (web) — basé sur ProfileTeacher
 */
export default function ProfileStudent() {
  const { user, setUser } = useAuth();

  const userId = String(user?.id ?? user?._id ?? "");
  const [fullName, setFullName] = useState<string>(user?.name ?? user?.fullName ?? "");
  const email = user?.email ?? "";

  const [file, setFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let lastObjectUrl: string | null = null;

    (async () => {
      try {
        if (!userId) return;
        const url = await getProfileImageObjectUrl(userId);
        if (!mounted) return;

        if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);
        lastObjectUrl = url;
        setAvatarUrl(url);
      } catch {
        if (mounted) setAvatarUrl(null);
      }
    })();

    return () => {
      mounted = false;
      if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);
    };
  }, [userId]);

  const displayName = useMemo(() => {
    return user?.name ?? user?.fullName ?? "Student";
  }, [user]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      e.target.value = "";
      setError("Format invalide. Utilise JPG, PNG ou WEBP.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      e.target.value = "";
      setError(`L’image dépasse ${MAX_FILE_MB}MB.`);
      return;
    }
    setFile(f);
  };

  const onUpload = async () => {
    if (!userId) return setError("Utilisateur introuvable (id manquant).");
    if (!file) return setError("Choisis une image avant de mettre à jour.");

    try {
      setLoading(true);
      setError(null);

      const updated = await uploadProfileImage(userId, file);
      setUser(updated);

      const freshAvatar = await getProfileImageObjectUrl(userId);
      setAvatarUrl(freshAvatar);
      setFile(null);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de mettre à jour la photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 700 }}>
      <h1 style={{ margin: 0 }}>Profil</h1>

      {error && <div style={errorBox}>{error}</div>}

      <Card>
        <div style={{ padding: 16, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={avatarWrap}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={avatarImg} />
              ) : (
                <div style={avatarFallback}>👤</div>
              )}
            </div>

            <div style={{ display: "grid", gap: 8, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{displayName}</div>
              <div style={{ fontSize: 12, color: "var(--placeholder)" }}>{email || "—"}</div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} />
                <span style={{ fontSize: 12, color: "var(--placeholder)" }}>
                  JPG/PNG/WEBP (max {MAX_FILE_MB}MB)
                </span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Button type="button" disabled={loading || !file} onClick={onUpload}>
                  {loading ? "Mise à jour..." : "Mettre à jour la photo"}
                </Button>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

          <div>
            <div style={label}>Nom (affichage)</div>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div style={{ fontSize: 12, color: "var(--placeholder)", marginTop: 6 }}>
              (Sauvegarde du nom : on la branche quand tu veux via PUT /users/:id)
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

const label: React.CSSProperties = { fontSize: 12, color: "var(--placeholder)", marginBottom: 6 };
const errorBox: React.CSSProperties = { background: "#ffecec", color: "#b00020", padding: 10, borderRadius: 10 };
const avatarWrap: React.CSSProperties = {
  width: 84,
  height: 84,
  borderRadius: 999,
  overflow: "hidden",
  background: "rgba(0,0,0,0.06)",
  display: "grid",
  placeItems: "center",
};
const avatarImg: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
const avatarFallback: React.CSSProperties = { fontSize: 28 };
