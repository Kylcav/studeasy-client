import { apiFetch } from "./http";

export const getClassInsights = (classId: string, window: "all" | "weekly" = "all") =>
  apiFetch(`/quiz/class/${classId}/insights?window=${window}`);
