import { apiFetch } from "./http";
import { setToken, clearToken, getTokenPayload } from "./token";

export const USER_KEY = "studeasy_user";

export function normalizeUser(u: any) {
  if (!u) return null;

  const role = String(u.role ?? u.type ?? "").trim().toLowerCase();
  const type = String(u.type ?? u.role ?? "").trim().toLowerCase();

  return {
    ...u,
    id: u.id ?? u._id,
    _id: u._id ?? u.id,
    role,
    type,
  };
}

export function setCachedUser(user: any) {
  if (!user) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCachedUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCachedUser() {
  localStorage.removeItem(USER_KEY);
}

/**
 * ✅ EXACT comme studeasy-v2 :
 * mobile -> POST /users/set-password
 */
export async function login(email: string, password: string) {
  // purge l'ancien user cache
  clearCachedUser();

  const data = await apiFetch("/users/set-password", {
    method: "POST",
    // ⚠️ si ton apiFetch set déjà Content-Type, tu peux enlever headers
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!data?.token) throw new Error("Token manquant dans la réponse");
  setToken(data.token);

  const u = normalizeUser(data?.user);
  if (u) setCachedUser(u);

  return { ...data, user: u };
}

/**
 * me():
 * - d'abord user cache
 * - sinon payload JWT (le backend set-password signe {id, role, schoolId})
 * - renvoie un user normalisé, non-null
 */
export async function me() {
  const cached = normalizeUser(getCachedUser());
  if (cached?.id || cached?._id) return cached;

  const payload = getTokenPayload();
  const id = payload?.id ?? payload?._id ?? payload?.userId;
  if (!id) throw new Error("Token invalide (id manquant)");

  const role = String(payload?.role ?? payload?.type ?? "").trim().toLowerCase();
  const schoolId = payload?.schoolId ?? payload?.school?._id ?? payload?.school;

  const u = normalizeUser({
    id,
    _id: id,
    role,
    type: role,
    schoolId,
  });

  // si role est vide, ça te permettra de détecter le souci visuellement
  setCachedUser(u);
  return u;
}

export async function logout() {
  clearToken();
  clearCachedUser();
}
