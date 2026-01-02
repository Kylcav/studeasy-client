import { apiFetch } from "./http";
import { getToken } from "./token";
import { normalizeUser, setCachedUser } from "./auth";

const API_URL = (import.meta.env.VITE_API_URL ?? "").toString();

/** Nettoie base URL: retire les "/" finaux */
function cleanBase(base: string) {
  return base.replace(/\/+$/, "");
}

/** Assure un path commençant par "/" */
function cleanPath(path: string) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Ajoute /api UNIQUEMENT si:
 * - path ne commence pas déjà par /api
 * - et la base ne finit pas déjà par /api
 */
function withApiPrefix(path: string) {
  const p = cleanPath(path);
  if (p === "/api" || p.startsWith("/api/")) return p;

  const baseHasApi = /\/api$/.test(cleanBase(API_URL));
  return baseHasApi ? p : `/api${p}`;
}

/** Construit l'URL finale */
function buildApiUrl(path: string) {
  const base = cleanBase(API_URL);
  if (!base) throw new Error("VITE_API_URL manquant dans .env");
  return `${base}${withApiPrefix(path)}`;
}

/**
 * ⚠️ GET /users/:id pas autorisé teacher sur ce backend
 */
export const getUserById = async (id: string) => {
  if (!id) throw new Error("User id manquant");

  const data = await apiFetch(`/users/${id}`);
  const rawUser = data?.user ?? data;
  const user = normalizeUser(rawUser);

  if (user) setCachedUser(user);
  return user;
};

/**
 * ✅ Upload photo de profil
 * POST /users/:id/profile-image
 */
export const uploadProfileImage = async (userId: string, file: File) => {
  if (!userId) throw new Error("User id manquant");
  if (!file) throw new Error("Fichier manquant");

  const fd = new FormData();
  fd.append("profileImage", file);

  const data = await apiFetch(`/users/${userId}/profile-image`, {
    method: "POST",
    body: fd,
  });

  const rawUser = data?.user ?? data;
  const user = normalizeUser(rawUser);

  if (user) setCachedUser(user);
  return user;
};

/**
 * ✅ GET profile image -> blob -> objectURL
 */
export const getProfileImageObjectUrl = async (userId: string) => {
  if (!userId) return null;

  const token = getToken();
  if (!token) return null;

  const url = buildApiUrl(`/users/${userId}/profile-image`);

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;

  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const revokeObjectUrl = (url?: string | null) => {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
};

/**
 * ✅ Update name (PUT /users/:id)
 */
export async function updateUserName(userId: string, name: string) {
  const data = await apiFetch(`/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const rawUser = data?.user ?? data;
  const user = normalizeUser(rawUser);
  if (user) setCachedUser(user);
  return user;
}

/**
 * ⚠️ "Changer mot de passe" FRONT ONLY possible uniquement si compte encore en mdp par défaut.
 * On utilise POST /users/set-password qui attend { email, password }.
 */
export async function setPasswordFirstTime(email: string, newPassword: string) {
  if (!email) throw new Error("Email manquant");
  if (!newPassword) throw new Error("Nouveau mot de passe manquant");

  return apiFetch(`/users/set-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: newPassword }),
  });
}
