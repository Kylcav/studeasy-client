import { apiFetch } from "./http";

/* =======================
   CLASSES
======================= */

export const getClasses = () => apiFetch("/classes");

export const createClass = (name: string) =>
  apiFetch("/classes", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const updateClass = (id: string, name: string) =>
  apiFetch(`/classes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });

export const deleteClass = (id: string) =>
  apiFetch(`/classes/${id}`, {
    method: "DELETE",
  });

/* =======================
   STUDENTS IN CLASS
======================= */

/**
 * ✅ Élèves déjà dans une classe
 */
export const getClassStudents = (classId: string) =>
  apiFetch(`/classes/${classId}/students`);

/**
 * ✅ Tous les élèves de l’école avec flags (ex: déjà dans la classe)
 * (utile si tu veux un jour faire un select avancé)
 */
export const getSchoolStudentsWithFlags = (classId: string) =>
  apiFetch(`/classes/${classId}/school-students`);

/**
 * ✅ Inviter des élèves dans une classe
 */
export const inviteStudents = (classId: string, studentIds: string[]) =>
  apiFetch(`/classes/${classId}/invite-students`, {
    method: "POST",
    body: JSON.stringify({ studentIds }),
  });

/**
 * ✅ Retirer des élèves d’une classe
 */
export const removeStudentsFromClass = (classId: string, studentIds: string[]) =>
  apiFetch(`/classes/${classId}/students`, {
    method: "DELETE",
    body: JSON.stringify({ studentIds }),
  });

/* =======================
   ALL STUDENTS (INVITE)
======================= */

/**
 * ✅ Récupère TOUS les élèves (pour "Inviter élèves")
 * Compatible backend Studeeasy v2
 */
export async function getAllStudents() {
  // 1️⃣ /users?type=student (le plus courant)
  try {
    const data = await apiFetch(`/users?type=student`);
    return data?.users ?? data?.data ?? data ?? [];
  } catch {}

  // 2️⃣ /users/students
  try {
    const data = await apiFetch(`/users/students`);
    return data?.users ?? data?.students ?? data?.data ?? data ?? [];
  } catch {}

  // 3️⃣ fallback /students
  const data = await apiFetch(`/students`);
  return data?.students ?? data?.data ?? data ?? [];
}
