import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/ui/input";
import { createSubjectInClass } from "../../api/subjects";

const MAX_FILE_MB = 4;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

// Backend V2: sans PDF, la description doit souvent être assez longue pour l'auto-quiz
const MIN_DESC_FOR_AUTOQUIZ = 60;

export default function AddChapterTeacher() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [file, setFile] = useState<File | null>(null);

  const [autoGenerateQuiz, setAutoGenerateQuiz] = useState(false);
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<"facile" | "moyen" | "difficile">(
    "facile"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileHint = useMemo(() => {
    if (!file) return `PDF uniquement (max ${MAX_FILE_MB}MB)`;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} · ${sizeMb}MB`;
  }, [file]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;

    if (!f) {
      setFile(null);
      return;
    }

    if (f.type !== "application/pdf") {
      setFile(null);
      e.target.value = "";
      setError("Le fichier doit être un PDF.");
      return;
    }

    if (f.size > MAX_FILE_BYTES) {
      setFile(null);
      e.target.value = "";
      setError(`Le fichier dépasse ${MAX_FILE_MB}MB.`);
      return;
    }

    setFile(f);
  };

  const onSubmit = async () => {
    if (!classId) return;

    const t = title.trim();
    const d = description.trim();

    if (!t) {
      setError("Titre requis");
      return;
    }

    const safeCount = Math.max(1, Math.min(50, Number(quizQuestionCount) || 5));

    // ✅ Backend V2: auto-quiz => il faut du contenu
    if (autoGenerateQuiz && !file && !d) {
      setError("Ajoute un PDF ou une description pour générer un quiz.");
      return;
    }

    // ✅ Garde-fou: si pas de PDF, description assez longue
    if (autoGenerateQuiz && !file && d.length < MIN_DESC_FOR_AUTOQUIZ) {
      setError(
        `Description trop courte pour générer un quiz (minimum conseillé: ${MIN_DESC_FOR_AUTOQUIZ} caractères).`
      );
      return;
    }

    setError(null);

    // ✅ Backend V2: description souvent REQUIRED => fallback non vide
    const descriptionToSend = d || `Cours: ${t}`;

    try {
      setLoading(true);

      const resp = await createSubjectInClass(classId, {
        title: t,
        description: descriptionToSend,
        file,
        autoGenerateQuiz,
        quizQuestionCount: safeCount,
        difficulty,
      });

      const createdSubject = (resp as any)?.subject ?? resp;
      const subjectId = String(createdSubject?.id ?? createdSubject?._id ?? "");

      // ✅ Flow mobile: auto-quiz => page d'édition des questions
      if (autoGenerateQuiz) {
        if (!subjectId) {
          navigate(`/teacher/classes/${classId}`, { replace: true });
          return;
        }

        const quizQuestions = Array.isArray(createdSubject?.quizQuestions)
          ? createdSubject.quizQuestions
          : [];

        navigate(`/teacher/classes/${classId}/generated-questions/${subjectId}`, {
          state: {
            subjectId,
            subjectTitle: createdSubject?.title ?? t,
            subjectDescription: createdSubject?.description ?? descriptionToSend,
            quizQuestions,
          },
          replace: true,
        });
        return;
      }

      navigate(`/teacher/classes/${classId}`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Impossible de créer le cours.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => navigate(`/teacher/classes/${classId}`)}
          style={backBtn}
        >
          ←
        </button>
        <h1 style={{ margin: 0 }}>Ajouter un chapitre</h1>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <Card>
        <div style={{ padding: 16, display: "grid", gap: 10 }}>
          <div>
            <div style={label}>Titre</div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Chapitre 1 - Les fractions"
            />
          </div>

          <div>
            <div style={label}>Description (recommandée)</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Colle ici le contenu du cours (ou mets au moins quelques lignes)."
              style={textarea}
            />
            {autoGenerateQuiz && !file && (
              <div style={{ fontSize: 12, color: "var(--placeholder)", marginTop: 6 }}>
                Conseil: sans PDF, vise au moins {MIN_DESC_FOR_AUTOQUIZ} caractères.
              </div>
            )}
            {!description.trim() && (
              <div style={{ fontSize: 12, color: "var(--placeholder)", marginTop: 6 }}>
                Si tu laisses vide, on enverra automatiquement “Cours: {title.trim() || "Chapitre"}”.
              </div>
            )}
          </div>

          {/* ✅ Upload PDF */}
          <div>
            <div style={label}>Fichier (PDF)</div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input type="file" accept="application/pdf" onChange={onPickFile} />
              <span style={{ fontSize: 12, color: "var(--placeholder)" }}>
                {fileHint}
              </span>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#b00020",
                    fontSize: 12,
                  }}
                >
                  Retirer
                </button>
              )}
            </div>
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={autoGenerateQuiz}
              onChange={(e) => setAutoGenerateQuiz(e.target.checked)}
            />
            Générer un quiz automatiquement
          </label>

          {autoGenerateQuiz && (
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <div style={label}>Nombre de questions</div>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={String(quizQuestionCount)}
                  onChange={(e) => setQuizQuestionCount(Number(e.target.value))}
                  placeholder="5"
                />
                <div style={{ fontSize: 12, color: "var(--placeholder)", marginTop: 6 }}>
                  Entre 1 et 50
                </div>
              </div>

              <div>
                <div style={label}>Difficulté</div>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  style={select}
                >
                  <option value="facile">facile</option>
                  <option value="moyen">moyen</option>
                  <option value="difficile">difficile</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="button" disabled={loading} onClick={onSubmit}>
              {loading ? "Création..." : "Créer"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

const label: React.CSSProperties = {
  fontSize: 12,
  color: "var(--placeholder)",
  marginBottom: 6,
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 160,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  padding: 12,
  outline: "none",
};

const select: React.CSSProperties = {
  width: "100%",
  height: 42,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  padding: "0 12px",
  outline: "none",
};

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
