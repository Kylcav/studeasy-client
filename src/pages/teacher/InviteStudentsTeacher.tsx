import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import { getSchoolStudentsWithFlags, inviteStudentsToClass } from "../../api/classes";

export default function InviteStudentsTeacher() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!classId) return;
    const data = await getSchoolStudentsWithFlags(classId);
    setRows(Array.isArray(data) ? data : data?.students ?? []);
  };

  useEffect(() => {
    if (!classId) return;
    refresh().catch((e) => setError(e?.message ?? "Impossible de charger les élèves."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  const onInvite = async () => {
    if (!classId) return;
    if (selectedIds.length === 0) {
      setError("Sélectionne au moins un élève.");
      return;
    }

    setError(null);
    setInfo(null);

    try {
      setLoading(true);

      const resp: any = await inviteStudentsToClass(classId, selectedIds);
      const results = resp?.results ?? {};

      const added: string[] = Array.isArray(results.added) ? results.added : [];
      const alreadyInClass: string[] = Array.isArray(results.alreadyInClass) ? results.alreadyInClass : [];
      const invalid: string[] = Array.isArray(results.invalid) ? results.invalid : [];

      if (added.length === 0) {
        const parts: string[] = [];
        if (alreadyInClass.length) parts.push(`${alreadyInClass.length} déjà dans la classe`);
        if (invalid.length) parts.push(`${invalid.length} invalides`);
        setError(parts.length ? `Aucun élève ajouté : ${parts.join(", ")}.` : "Aucun élève ajouté.");
        await refresh();
        return;
      }

      const msgParts: string[] = [`✅ ${added.length} ajouté(s)`];
      if (alreadyInClass.length) msgParts.push(`${alreadyInClass.length} déjà dedans`);
      if (invalid.length) msgParts.push(`${invalid.length} invalides`);
      setInfo(msgParts.join(" · "));

      setSelected({});
      await refresh();
      navigate(`/teacher/classes/${classId}`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Invitation impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate(`/teacher/classes/${classId}`)} style={backBtn}>
          ←
        </button>
        <h1 style={{ margin: 0 }}>Inviter des élèves</h1>
      </div>

      {error && <div style={errorBox}>{error}</div>}
      {info && <div style={infoBox}>{info}</div>}

      <Card>
        <div style={{ padding: 14, display: "grid", gap: 10 }}>
          {rows.map((s) => {
            const inClass = !!s.isinvite; // ✅ flag backend V2
            return (
              <label key={s._id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  disabled={inClass}
                  checked={!!selected[s._id]}
                  onChange={(e) => setSelected((p) => ({ ...p, [s._id]: e.target.checked }))}
                />
                <div style={{ display: "grid" }}>
                  <div style={{ fontWeight: 800 }}>{s.name ?? "Élève"}</div>
                  <div style={{ color: "#666", fontSize: 13 }}>{s.email ?? ""}</div>
                </div>
                <div style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>
                  {inClass ? "Déjà dans la classe" : ""}
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="button" disabled={loading} onClick={onInvite}>
          {loading ? "Invitation..." : `Inviter (${selectedIds.length})`}
        </Button>
      </div>
    </div>
  );
}

const backBtn: React.CSSProperties = {
  border: "none",
  background: "#fff",
  borderRadius: 10,
  padding: "8px 10px",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const errorBox: React.CSSProperties = {
  background: "#ffecec",
  color: "#b00020",
  padding: 10,
  borderRadius: 10,
};

const infoBox: React.CSSProperties = {
  background: "#e9fff0",
  color: "#137333",
  padding: 10,
  borderRadius: 10,
};
