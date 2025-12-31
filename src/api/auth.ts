import { apiFetch } from "./http";
import { setToken, clearToken, getTokenPayload } from "./token";

export async function login(email: string, password: string) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!data?.token) throw new Error("Token manquant dans la réponse");
  setToken(data.token);

  return data;
}

/**
 * ✅ Web fix: ne pas appeler /api/users/:id (403 pour teacher)
 * On reconstruit l'utilisateur à partir du JWT.
 */
export async function me() {
  const payload = getTokenPayload();
  if (!payload?.id) throw new Error("Token invalide (id manquant)");

  // Ton backend signe { id, type, schoolId }
  // On renvoie un user minimal compatible
  return {
    _id: payload.id,
    id: payload.id,
    role: payload.role ?? payload.type, // au cas où
    type: payload.type,
    schoolId: payload.schoolId,
  };
}

export async function logout() {
  clearToken();
}
