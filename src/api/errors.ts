import { apiFetch } from "./http";
export const getErrors = () => apiFetch("/quiz/errors");
