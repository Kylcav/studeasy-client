import { apiFetch } from "./http";

// ✅ Ancien endpoint (pour admin/student ou ton ancienne page Subjects)
export const getSubjects = () => apiFetch("/subjects");

// ✅ Nouveau endpoint: cours d’une classe (Teacher)
export const getSubjectsByClass = (classId: string) =>
  apiFetch(`/subjects/class/${classId}`);
