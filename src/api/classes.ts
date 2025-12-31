import { apiFetch } from "./http";
export const getClasses = () => apiFetch("/classes");
