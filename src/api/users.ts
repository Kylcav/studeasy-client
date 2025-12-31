import { apiFetch } from "./http";

export function getUserById(id: string) {
  return apiFetch(`/api/users/${id}`);
}
