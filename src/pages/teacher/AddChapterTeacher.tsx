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
    <div className="ui-page fade-in" style={{ maxWidth: 900 }}>
      {/* HEADER */}
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
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(`/teacher/classes/${classId}`)}
              >
                ← Retour
              </Button>

              <h1 className="ui-page-title" style={{ fontSize: 34 }}>
                <span className="ui-title-accent">Ajouter un chapitre</span> ✨
              </h1>
            </div>

            <p className="ui-page-subtitle">
              Ajoute un cours (texte ou PDF). Optionnel : génère automatiquement un quiz.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="ui-chip">📄 PDF max {MAX_FILE_MB}MB</span>
            <span className="ui-chip">🧠 Quiz auto</span>
          </div>
        </div>

        {error && (
          <Card className="ui-card hover">
            <div className="ui-card-pad ui-alert-error">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Oups…</div>
              <div>{error}</div>
            </div>
          </Card>
        )}
      </div>

      {/* FORM */}
      <Card className="ui-card ui-card-hero hover slide-up">
        <div className="ui-card-pad" style={{ display: "grid", gap: 14 }}>
          {/* Title */}
          <div style={{ display: "grid", gap: 6 }}>
            <div className="ui-field-label">Titre</div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Chapitre 1 - Les fractions"
            />
          </div>

          {/* Description */}
          <div style={{ display: "grid", gap: 6 }}>
            <div className="ui-field-label">
              Description <span style={{ color: "var(--placeholder)" }}>(recommandée)</span>
            </div>

            <textarea
              className="ui-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Colle ici le contenu du cours (ou mets au moins quelques lignes)."
            />

            {autoGenerateQuiz && !file && (
              <div className="ui-field-hint">
                Conseil: sans PDF, vise au moins {MIN_DESC_FOR_AUTOQUIZ} caractères.
              </div>
            )}

            {!description.trim() && (
              <div className="ui-field-hint">
                Si tu laisses vide, on enverra automatiquement “Cours:{" "}
                {title.trim() || "Chapitre"}”.
              </div>
            )}
          </div>

          {/* Upload PDF */}
          <div style={{ display: "grid", gap: 8 }}>
            <div className="ui-field-label">Fichier (PDF)</div>

            <div className="ui-upload">
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 900 }}>📄 Ajouter un PDF</div>
                <div className="ui-field-hint">{fileHint}</div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <label className="ui-upload-btn">
                  Choisir un fichier
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={onPickFile}
                    style={{ display: "none" }}
                  />
                </label>

                {file && (
                  <button
                    type="button"
                    className="ui-link-danger"
                    onClick={() => setFile(null)}
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Toggle auto quiz */}
          <div className="ui-toggle-row">
            <label className="ui-toggle">
              <input
                type="checkbox"
                checked={autoGenerateQuiz}
                onChange={(e) => setAutoGenerateQuiz(e.target.checked)}
              />
              <span className="ui-toggle-ui" />
            </label>

            <div style={{ display: "grid", gap: 2 }}>
              <div style={{ fontWeight: 950 }}>Générer un quiz automatiquement</div>
              <div className="ui-field-hint">
                Idéal pour créer un quiz à partir du PDF ou du texte.
              </div>
            </div>
          </div>

          {/* Auto quiz options */}
          {autoGenerateQuiz && (
            <div className="ui-form-grid">
              <div style={{ display: "grid", gap: 6 }}>
                <div className="ui-field-label">Nombre de questions</div>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={String(quizQuestionCount)}
                  onChange={(e) => setQuizQuestionCount(Number(e.target.value))}
                  placeholder="5"
                />
                <div className="ui-field-hint">Entre 1 et 50</div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div className="ui-field-label">Difficulté</div>
                <select
                  className="ui-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                >
                  <option value="facile">facile</option>
                  <option value="moyen">moyen</option>
                  <option value="difficile">difficile</option>
                </select>
                <div className="ui-field-hint">Ajuste selon le niveau de la classe</div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/teacher/classes/${classId}`)}
              disabled={loading}
            >
              Annuler
            </Button>

            <Button type="button" disabled={loading} onClick={onSubmit}>
              {loading ? "Création..." : autoGenerateQuiz ? "Créer + Générer le quiz" : "Créer"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Petite carte conseil (donne de la vie) */}
      <Card className="ui-card hover slide-up">
        <div className="ui-card-pad" style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 950 }}>💡 Conseil</div>
          <div style={{ color: "var(--placeholder)" }}>
            Plus le contenu (PDF ou texte) est riche, plus le quiz généré sera pertinent.
          </div>
        </div>
      </Card>
    </div>
  );
}
