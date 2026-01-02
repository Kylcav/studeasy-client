import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/ui/input";
import { createSubjectInClass } from "../../api/subjects";

type Difficulty = "easy" | "medium" | "hard";

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function difficultyToApi(d: Difficulty) {
  if (d === "easy") return "facile";
  if (d === "hard") return "difficile";
  return "moyen";
}

export default function AddChapterTeacher() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const accept = useMemo(
    () =>
      [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].join(","),
    []
  );

  const isValidFile = (f: File) => {
    if (f.size > 4 * 1024 * 1024) {
      return { ok: false, msg: "Fichier trop lourd (max 4MB)." };
    }

    if (f.type && !accept.split(",").includes(f.type)) {
      return { ok: false, msg: "Format non supporté (PDF, DOC, DOCX)." };
    }

    if (!f.type) {
      const n = f.name.toLowerCase();
      if (!n.endsWith(".pdf") && !n.endsWith(".doc") && !n.endsWith(".docx")) {
        return { ok: false, msg: "Format non supporté (PDF, DOC, DOCX)." };
      }
    }

    return { ok: true, msg: "" };
  };

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChosen = (f: File | null) => {
    if (!f) return;
    const v = isValidFile(f);
    if (!v.ok) {
      setError(v.msg);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFileChosen(f);
  };

  const onSubmit = async () => {
    if (!classId) return;

    setLoading(true);
    setError(null);

    try {
      await createSubjectInClass(classId, {
        title: title.trim(),
        description: content,
        file,
        autoGenerateQuiz: true,
        quizQuestionCount: clampInt(questionCount, 1, 50),
        difficulty: difficultyToApi(difficulty),
      });

      navigate(`/teacher/classes/${classId}`);
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-page fade-in">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1 className="ui-page-title">
            <span className="ui-title-accent">Ajouter un chapitre</span> ✨
          </h1>
          <p className="ui-page-subtitle">
            Ajoute un cours (texte ou fichier). Le quiz est généré automatiquement.
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          style={{ fontSize: 13, padding: "6px 10px", borderRadius: 12 }}
        >
          ← Retour
        </Button>
      </div>

      {error && (
        <Card className="ui-card">
          <div className="ui-card-pad ui-alert-error">{error}</div>
        </Card>
      )}

      <Card className="ui-card ui-card-hero">
        <div className="ui-card-pad" style={{ display: "grid", gap: 16 }}>
          <div>
            <div className="ui-field-label">Titre</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <div className="ui-field-label">Description</div>
            <textarea
              className="ui-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* UPLOAD – drag & drop + bouton */}
          <div>
            <div className="ui-field-label">Fichier (PDF ou Word)</div>

            <div
              className={`ui-upload ${isDragging ? "is-dragging" : ""}`}
              onClick={onPickFile}
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              style={{ cursor: "pointer" }}
            >
              <div style={{ fontWeight: 900 }}>📎 Ajouter un fichier</div>
              <div style={{ color: "var(--placeholder)", fontSize: 13 }}>
                Glisse-dépose un fichier ici (PDF, DOC, DOCX) — max 4MB
              </div>

              {file && <div style={{ marginTop: 6 }}>✅ {file.name}</div>}

              {/* ✅ BOUTON AJOUTÉ */}
              <div style={{ marginTop: 10 }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickFile();
                  }}
                >
                  Choisir un fichier
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                hidden
                onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <Card className="ui-card">
            <div className="ui-card-pad ui-form-grid">
              <div>
                <div className="ui-field-label">Nombre de questions</div>
                <input
                  className="ui-select"
                  type="number"
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(clampInt(Number(e.target.value), 1, 50))
                  }
                />
              </div>

              <div>
                <div className="ui-field-label">Difficulté</div>
                <select
                  className="ui-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                >
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Difficile</option>
                </select>
              </div>
            </div>
          </Card>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Annuler
            </Button>
            <Button onClick={onSubmit} disabled={loading}>
              {loading ? "..." : "Créer"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
