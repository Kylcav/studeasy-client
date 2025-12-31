import { apiFetch } from "./http";

export const getSubjects = () => apiFetch("/subjects");
