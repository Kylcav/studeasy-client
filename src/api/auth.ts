import { apiFetch } from "./http";
import { setToken, clearToken, getTokenPayload } from "./token";

const USER_KEY = "studeasy_user";

function normalizeUser(u: any) {
  if (!u) return null;
  return {
    ...u,
    id: u.id ?? u._id,
    _id: u._id ?? u.id,
    role: String(u.role ?? u.type ?? "").trim().toLowerCase(),
    type: String(u.type ?? u.role ?? "").trim().toLowerCase(),
  };
}

function setCachedUser(user: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getCachedUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearCachedUser() {
  localStorage.removeItem(USER_KEY);
}

/**
 * ✅ EXACT comme studeasy-v2 :
 * mobile -> POST /users/set-password
 */
export async function login(email: string, password: string) {
  // IMPORTANT: purge l'ancien user cache
  clearCachedUser();

  const data = await apiFetch("/api/users/set-password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!data?.token) throw new Error("Token manquant dans la réponse");
  setToken(data.token);

  // backend renvoie user (name/email/role/schoolId/...)
  const u = normalizeUser(data?.user);
  if (u) setCachedUser(u);

  return data;
}

/**
 * ✅ me() :
 * - d'abord user cache
 * - sinon payload JWT (le backend set-password signe {id, role, schoolId})
 */
export async function me() {
  const cached = getCachedUser();
  if (cached) return normalizeUser(cached);

  const payload = getTokenPayload();
  const id = payload?.id ?? payload?._id;
  if (!id) throw new Error("Token invalide (id manquant)");

  const role = String(payload?.role ?? payload?.type ?? "").trim().toLowerCase();

  const u = normalizeUser({
    id,
    _id: id,
    role,
    type: role,
    schoolId: payload?.schoolId,
  });

  // si le token ne contient pas role, tu verras role=""
  setCachedUser(u);
  return u;
}

export async function logout() {
  clearToken();
  clearCachedUser();
}
