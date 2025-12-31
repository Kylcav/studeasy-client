import { getToken } from "./token";

const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}
