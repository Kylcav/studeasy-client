import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/ui/input";
import {
  createClass,
  deleteClass,
  getClasses,
  updateClass,
} from "../../api/classes";

function accentToShadow(accent: string) {
  const s = String(accent ?? "").trim();
  const m = s.match(
    /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)/i
  );
  if (!m) return "rgba(0,0,0,0.12)";
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  return `rgba(${r},${g},${b},0.36)`;
}

export default function ClassesTeacher() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");

  // UI : sélection + édition inline
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClasses();
      const list = Array.isArray(data) ? data : data?.classes ?? [];
      setClasses(list);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger les classes.");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setName("");
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      setLoading(true);
      setError(null);
      await createClass(trimmed);
      setModalOpen(false);
      setName("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de l’enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const startInlineEdit = (c: any) => {
    const id = String(c?._id ?? "");
    if (!id) return;
    setEditingId(id);
    setEditingValue(String(c?.name ?? ""));
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const commitInlineEdit = async (c: any) => {
    const id = String(c?._id ?? "");
    const next = editingValue.trim();
    const prev = String(c?.name ?? "").trim();
    if (!id) return;

    if (!next || next === prev) {
      cancelInlineEdit();
      return;
    }

    try {
      setSavingId(id);
      setError(null);

      // Optimiste
      setClasses((old) =>
        old.map((x) => (String(x?._id) === id ? { ...x, name: next } : x))
      );

      await updateClass(id, next);
      cancelInlineEdit();
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la modification.");
      await refresh();
      cancelInlineEdit();
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteClass(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-page fade-in">
      {/* ===== HEADER (on garde la version jolie) ===== */}
      <div className="slide-up" style={{ display: "grid", gap: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 className="ui-page-title">
              <span className="ui-title-accent">Classes</span>
            </h1>
            <p className="ui-page-subtitle">
              Crée, organise et ouvre tes classes pour gérer les cours et les quiz.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button type="button" onClick={openAdd}>
              + Ajouter une classe
            </Button>
          </div>
        </div>
      </div>

      {/* ===== ERROR ===== */}
      {error && (
        <Card className="ui-card hover slide-up">
          <div className="ui-card-pad ui-alert-error">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Oups…</div>
            <div>{error}</div>
          </div>
        </Card>
      )}

      {/* ===== EMPTY ===== */}
      {!loading && classes.length === 0 && !error && (
        <Card className="ui-card ui-card-hero hover slide-up">
          <div className="ui-card-pad" style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>🌱 Première classe</div>
            <div style={{ color: "var(--placeholder)" }}>
              Commence par créer une classe, puis ajoute tes cours et lance des quiz.
            </div>
            <div style={{ marginTop: 4 }}>
              <Button type="button" onClick={openAdd}>
                + Créer ma première classe
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ===== GRID CLASSES ===== */}
      <div className="ui-grid-3 slide-up">
        {classes.map((c, idx) => {
          const count = c?.subjects?.length ?? 0;

          // mêmes couleurs / rendu premium
          const accent =
            idx % 3 === 0
              ? "rgba(93,128,250,0.18)"
              : idx % 3 === 1
              ? "rgba(74,222,128,0.14)"
              : "rgba(251,191,36,0.12)";

          return (
            <Card
              key={c._id}
              className={`ui-card hover class-tile ${
                selectedId === c._id ? "is-selected" : ""
              }`}
              style={{
                ["--class-accent" as any]: accent,
                ["--class-shadow" as any]: accentToShadow(accent),
              }}
              onClick={() => setSelectedId(String(c._id))}
            >
              {/* ✅ CROIX: top-right du BOX */}
              <button
                type="button"
                className="class-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  const label = String(c?.name ?? "cette classe");
                  if (!confirm(`Supprimer “${label}” ?`)) return;
                  onDelete(c._id);
                }}
                aria-label="Supprimer"
                title="Supprimer"
              >
                ✕
              </button>

              <div className="ui-card-pad class-card">
                {/* TOP: titre gros à gauche, chip compteur à droite */}
                <div className="class-top">
                  <div style={{ minWidth: 0 }}>
                    {editingId === c._id ? (
                      <input
                        className="class-title-input"
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitInlineEdit(c);
                          if (e.key === "Escape") cancelInlineEdit();
                        }}
                        onBlur={() => commitInlineEdit(c)}
                      />
                    ) : (
                      <button
                        type="button"
                        className="class-title"
                        onClick={(e) => {
                          e.stopPropagation();
                          startInlineEdit(c);
                        }}
                        title="Clique pour modifier"
                      >
                        {c?.name ?? "Classe"}
                        {savingId === c._id ? (
                          <span className="class-saving"> •</span>
                        ) : null}
                      </button>
                    )}

                    <div className="class-sub">
                      {count === 0 ? "Aucun cours" : count === 1 ? "1 cours" : `${count} cours`}
                    </div>
                  </div>
                </div>

                {/* BOTTOM: hint à gauche, ouvrir en bas à droite */}
               <div className="class-bottom" style={{ display: "flex", justifyContent: "flex-end" }}>
  <Button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/teacher/classes/${c._id}`);
    }}
  >
    Ouvrir →
  </Button>
</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ===== MODAL ===== */}
      {modalOpen && (
        <div className="ui-overlay">
          <Card className="ui-card ui-card-hero slide-up">
            <div
              className="ui-card-pad"
              style={{
                width: 460,
                maxWidth: "92vw",
                display: "grid",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ fontWeight: 950, fontSize: 18 }}>✨ Ajouter une classe</div>
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  ✕
                </Button>
              </div>

              <div style={{ color: "var(--placeholder)" }}>
                Donne un nom clair (ex: “4e A”, “Maths - Groupe 2”…).
              </div>

              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom de la classe"
              />

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  marginTop: 4,
                }}
              >
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Annuler
                </Button>
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
