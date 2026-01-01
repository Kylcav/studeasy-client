import { useEffect, useState } from "react";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/ui/input";
import { createClass, deleteClass, getClasses, updateClass } from "../../api/classes";
import { useNavigate } from "react-router-dom";

export default function ClassesTeacher() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal state (simple)
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClasses();
      setClasses(Array.isArray(data) ? data : data?.classes ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger les classes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setName(c?.name ?? "");
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      if (editing?._id) {
        await updateClass(editing._id, name.trim());
      } else {
        await createClass(name.trim());
      }
      setModalOpen(false);
      setEditing(null);
      setName("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de l’enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Supprimer cette classe ?")) return;
    try {
      setLoading(true);
      await deleteClass(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Classes</h1>
        <Button type="button" onClick={openAdd}>+ Ajouter</Button>
      </div>

      {error && (
        <div style={{ background: "#ffecec", color: "#b00020", padding: 10, borderRadius: 10 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {classes.map((c) => (
          <Card key={c._id}>
            <div style={{ padding: 14, display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>{c.name ?? "Classe"}</div>
              <div style={{ color: "#666" }}>
                {c.subjects?.length ? `${c.subjects.length} cours` : "0 cours"}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <Button type="button" onClick={() => navigate(`/teacher/classes/${c._id}`)}>
                  Ouvrir
                </Button>
                <button onClick={() => openEdit(c)} style={ghostBtn}>Modifier</button>
                <button onClick={() => onDelete(c._id)} style={dangerBtn}>Supprimer</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!loading && classes.length === 0 && <div style={{ color: "#666" }}>Aucune classe.</div>}

      {modalOpen && (
        <div style={overlay}>
          <Card>
            <div style={{ padding: 16, display: "grid", gap: 10, width: 420 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {editing ? "Modifier la classe" : "Ajouter une classe"}
              </div>

              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de la classe" />

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setModalOpen(false)} style={ghostBtn}>Annuler</button>
                <Button type="button" disabled={loading || !name.trim()} onClick={onSubmit}>
                  {loading ? "..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.25)",
  display: "grid",
  placeItems: "center",
  padding: 16,
  zIndex: 50,
};

const ghostBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e6e6e6",
  background: "transparent",
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ffb3b3",
  background: "#fff5f5",
  color: "#b00020",
  cursor: "pointer",
};
