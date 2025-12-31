import { useEffect, useState } from "react";
import { getSubjects } from "../api/subjects";

export default function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    getSubjects().then(setSubjects);
  }, []);

  return (
    <>
      <h1>Mes cours</h1>

      <div style={{ display: "grid", gap: 12 }}>
        {subjects.map((s) => (
          <div key={s._id} style={{
            background: "#fff",
            padding: 16,
            borderRadius: 10,
          }}>
            {s.name}
          </div>
        ))}
      </div>
    </>
  );
}
