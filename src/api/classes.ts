import { apiFetch } from "./http";

export const getClasses = () => apiFetch("/classes");

export const createClass = (name: string) =>
  apiFetch("/classes", { method: "POST", body: JSON.stringify({ name }) });

export const updateClass = (id: string, name: string) =>
  apiFetch(`/classes/${id}`, { method: "PUT", body: JSON.stringify({ name }) });

export const deleteClass = (id: string) =>
  apiFetch(`/classes/${id}`, { method: "DELETE" });

export const getClassStudents = (classId: string) =>
  apiFetch(`/classes/${classId}/students`);

export const getSchoolStudentsWithFlags = (classId: string) =>
  apiFetch(`/classes/${classId}/school-students`);

export const inviteStudentsToClass = (classId: string, studentIds: string[]) =>
  apiFetch(`/classes/${classId}/invite-students`, {
    method: "POST",
    body: JSON.stringify({ studentIds }),
  });

export const removeStudentsFromClass = (classId: string, studentIds: string[]) =>
  apiFetch(`/classes/${classId}/students`, {
    method: "DELETE",
    body: JSON.stringify({ studentIds }),
  });
