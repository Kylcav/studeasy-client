import { apiFetch } from "./http";
import { getToken } from "./token";
import { normalizeUser, setCachedUser } from "./auth";

const RAW_API_URL = (import.meta.env.VITE_API_URL ?? "").toString();

/**
 * Nettoie base URL:
 * - retire les "/" finaux
 */
function cleanBase(base: string) {
  return base.replace(/\/+$/, "");
}

/**
 * Nettoie path:
 * - assure un seul "/" au début
 */
function cleanPath(path: string) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Ajoute /api UNIQUEMENT si:
 * - base n'a pas déjà /api à la fin
 * - et path ne commence pas déjà par /api
 */
function ensureApiPrefix(path: string) {
  const p = cleanPath(path);
  if (p.startsWith("/api/") || p === "/api") return p;

  // Si la base finit déjà par /api, ne rajoute pas /api
  const baseHasApi = /\/api$/.test(cleanBase(RAW_API_URL));
  return baseHasApi ? p : `/api${p}`;
}

/**
 * Construit URL finale sans double slash et sans double /api
 */
function buildUrl(path: string) {
  const base = cleanBase(RAW_API_URL);
  if (!base) throw new Error("VITE_API_URL manquant dans .env");
  const finalPath = ensureApiPrefix(path);
  return `${base}${finalPath}`;
}

/**
 * ⚠️ ATTENTION:
 * Sur certains backends V2, GET /users/:id n'est pas autorisé pour teacher.
 * (Seulement admin + student)
 * Donc évite d'utiliser cette fonction côté Teacher si tu as des 403.
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
 * ✅ IMPORTANT:
 * Récupérer l'image via l'API (si image privée ou nécessite Authorization)
 * GET /users/:id/profile-image
 * => retourne un objectURL affichable dans <img src="...">
 */
export const getProfileImageObjectUrl = async (userId: string) => {
  if (!userId) return null;

  const token = getToken();
  if (!token) return null;

  const url = buildUrl(`/users/${userId}/profile-image`);

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null; // 404 si pas d'image, 403 si token/role

  const blob = await res.blob();
  return URL.createObjectURL(blob);
};
