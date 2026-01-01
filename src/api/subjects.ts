import { apiFetch } from "./http";

export type Subject = {
  id?: string;
  _id?: string;
  title?: string;
  description?: string;
  classId?: string;
  quizQuestions?: any[];
  createdAt?: string;
  updatedAt?: string;
};

/**
 * LISTES
 */
export const getSubjects = () => apiFetch("/subjects");

export const getSubjectsByClass = (classId: string) =>
  apiFetch(`/subjects/class/${classId}`);

/**
 * GET ONE (utile pour ViewQuiz / refresh)
 */
export const getSubjectById = (subjectId: string) =>
  apiFetch(`/subjects/${subjectId}`);

/**
 * UPDATE
 * Backend v2: généralement JSON body
 */
export const updateSubject = (subjectId: string, payload: any) =>
  apiFetch(`/subjects/${subjectId}`, {
    method: "PUT",
    body: JSON.stringify(payload ?? {}),
  });

/**
 * DELETE
 */
export const deleteSubject = (subjectId: string) =>
  apiFetch(`/subjects/${subjectId}`, {
    method: "DELETE",
  });

/**
 * CREATE dans une classe (comme mobile studeasy-v2)
 * - FormData
 * - Backend V2 attend `file` (multer.single("file"))
 * - Description souvent requise => fallback non vide
 */
export const createSubjectInClass = (classId: string, payload: any) =>
  apiFetch(`/subjects/class/${classId}`, {
    method: "POST",
    body: (() => {
      const fd = new FormData();

      const title = String(payload?.title ?? "").trim();

      // ✅ backend v2: description souvent required
      const description =
        String(payload?.description ?? "").trim() || `Cours: ${title || "Chapitre"}`;

      fd.append("title", title);
      fd.append("description", description);

      // ✅ backend v2: seul "file" est attendu
      if (payload?.file) {
        fd.append("file", payload.file);
      }

      // ✅ auto quiz
      if (payload?.autoGenerateQuiz) {
        const count = Math.max(1, Math.min(50, Number(payload?.quizQuestionCount) || 5));
        fd.append("autoGenerateQuiz", "true");
        fd.append("quizQuestionCount", String(count));
        fd.append("difficulty", String(payload?.difficulty ?? "facile"));
      }

      return fd;
    })(),
  });

/**
 * (Optionnel) helper: extrait l'objet subject quand backend renvoie { subject: ... }
 */
export function unwrapSubject(res: any): Subject {
  return (res?.subject ?? res) as Subject;
}

/**
 * (Optionnel) helper: récupère l'id en supportant id/_id
 */
export function getSubjectId(s: any): string {
  return String(s?.id ?? s?._id ?? "");
}
