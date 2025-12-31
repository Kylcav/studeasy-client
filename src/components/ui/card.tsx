import type { ReactNode } from "react";

export default function Card({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--white)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {children}
    </div>
  );
}
