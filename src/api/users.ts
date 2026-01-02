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

/** Construit l'URL finale (même logique que apiFetch) */
function buildApiUrl(path: string) {
  const base = cleanBase(API_URL);
  if (!base) throw new Error("VITE_API_URL manquant dans .env");
  return `${base}${withApiPrefix(path)}`;
}

/**
 * ⚠️ ATTENTION:
 * Sur certains backends V2, GET /users/:id n'est pas autorisé pour teacher.
 * (Seulement admin + student)
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

  // apiFetch gère Authorization; ne pas set Content-Type avec FormData
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
 * ✅ Récupérer l'image via l'API (si privée / nécessite Authorization)
 * GET /users/:id/profile-image
 * => retourne un objectURL affichable dans <img src="...">
 *
 * IMPORTANT: pense à URL.revokeObjectURL(oldUrl) quand tu changes d'image
 */
export const getProfileImageObjectUrl = async (userId: string) => {
  if (!userId) return null;

  const token = getToken();
  if (!token) return null;

  // On construit la même URL que l'API (avec /api si nécessaire)
  const url = buildApiUrl(`/users/${userId}/profile-image`);

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;

  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

/** Petit helper optionnel pour éviter les leaks */
export const revokeObjectUrl = (url?: string | null) => {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
};
