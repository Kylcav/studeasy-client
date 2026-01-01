import { apiFetch } from "./http";

// ⚠️ Backend V2 : base path = /api/quizzes
export const submitQuizResult = (
  subjectId: string,
  payload: {
    totalQuestions: number;
    correctAnswers: number;
    classId?: string;
    meta?: any;
  }
) =>
  apiFetch(`/quizzes/${subjectId}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getMyMistakes = () => apiFetch("/quizzes/me/mistakes");

export const getMyScores = () => apiFetch("/quizzes/me/scores");

export const getClassInsights = (classId: string, window: "all" | "weekly" = "all") =>
  apiFetch(`/quizzes/class/${classId}/insights?window=${window}`);
