import { getToken } from "./token";

const API_URL = import.meta.env.VITE_API_URL;

// Ajoute /api automatiquement si absent
function withApiPrefix(endpoint: string) {
  if (!endpoint.startsWith("/")) endpoint = `/${endpoint}`;
  if (endpoint.startsWith("/api/")) return endpoint;
  return `/api${endpoint}`;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const url = `${API_URL}${withApiPrefix(endpoint)}`;

  // ⚠️ Si body = FormData, NE PAS forcer Content-Type
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // ✅ ICI la correction clé
  if (!res.ok) {
    const errorMessage =
      (typeof data === "object" && (data?.error || data?.message))
        ? String(data.error || data.message)
        : "Request failed";

    throw new Error(errorMessage);
  }

  return data;
}
