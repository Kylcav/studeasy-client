import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";

import {
  getClassStudents,
  getSchoolStudentsWithFlags,
  inviteStudents,
} from "../../api/classes";

type Student = {
  _id?: string;
  id?: string;
  email?: string;
  name?: string;
  fullName?: string;

  // flags possibles selon backend
  isInClass?: boolean;
  inClass?: boolean;
  alreadyInClass?: boolean;
};

function sid(s: Student) {
  return String(s.id ?? s._id ?? "");
}

function labelOf(s: Student) {
  return s.name ?? s.fullName ?? s.email ?? sid(s);
}

function isAlreadyInClass(s: Student) {
  return Boolean(s.isInClass ?? s.inClass ?? s.alreadyInClass);
}

export default function InviteStudentsTeacher() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [schoolStudents, setSchoolStudents] = useState<Student[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);

    try {
      // ✅ endpoint autorisé teacher
      const [school, inClass] = await Promise.all([
        getSchoolStudentsWithFlags(classId),
        getClassStudents(classId),
      ]);

      const schoolList = Array.isArray(school)
        ? school
        : school?.students ?? school?.users ?? school?.data ?? [];

      const classList = Array.isArray(inClass)
        ? inClass
        : inClass?.students ?? inClass?.users ?? inClass?.data ?? [];

      setSchoolStudents(schoolList);
      setClassStudents(classList);
      setSelectedIds([]);
    } catch (e: any) {
      setError(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // ✅ Liste invitable = élèves de l’école - ceux déjà dans la classe
  const invitableStudents = useMemo(() => {
    const inClassSet = new Set(classStudents.map(sid));

    return schoolStudents.filter((s) => {
      const id = sid(s);
      if (!id) return false;

      // 1) via flags backend
      if (isAlreadyInClass(s)) return false;

      // 2) fallback via set classStudents
      if (inClassSet.has(id)) return false;

      return true;
    });
  }, [schoolStudents, classStudents]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onInvite = async () => {
    if (!classId) return;
    if (selectedIds.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      await inviteStudents(classId, selectedIds);

      // ✅ refresh => ils disparaissent de la liste inviter
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Impossible d'inviter les élèves.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-page fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Retour
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate(`/teacher/classes/${classId}/students`)}
        >
          👀 Voir élèves
        </Button>
      </div>

      <h1 className="ui-page-title">
        <span className="ui-title-accent">Inviter élèves</span>
      </h1>

      {error && (
        <Card className="ui-card hover">
          <div className="ui-card-pad ui-alert-error">{error}</div>
        </Card>
      )}

      <Card className="ui-card hover">
        <div
          className="ui-card-pad"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: "var(--placeholder)" }}>
            Sélectionne des élèves à inviter.{" "}
            <b>Ceux déjà dans la classe ne sont pas affichés.</b>
          </div>

          <Button disabled={loading || selectedIds.length === 0} onClick={onInvite}>
            {loading ? "..." : `Inviter (${selectedIds.length})`}
          </Button>
        </div>
      </Card>

      <div className="ui-list slide-up" style={{ marginTop: 12 }}>
        {!loading &&
          invitableStudents.map((s) => {
            const id = sid(s);
            const selected = selectedIds.includes(id);

            return (
              <Card
                key={id}
                className={`ui-card hover chapter-row ${selected ? "is-selected" : ""}`}
                onClick={() => toggle(id)}
              >
                <div className="ui-card-pad chapter-content">
                  <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 950,
                        fontSize: 18,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {labelOf(s)}
                    </div>
                    <div style={{ color: "var(--placeholder)" }}>{s.email ?? ""}</div>
                  </div>

                  <div className="chapter-right">
                    <span className="ui-chip">{selected ? "✅ Sélectionné" : "➕ Ajouter"}</span>
                  </div>
                </div>
              </Card>
            );
          })}

        {!loading && invitableStudents.length === 0 && !error && (
          <div style={{ color: "var(--placeholder)" }}>
            Aucun élève à inviter (tous sont déjà dans la classe).
          </div>
        )}
      </div>
    </div>
  );
}
