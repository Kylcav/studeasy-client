import type { ButtonHTMLAttributes } from "react";

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { style, disabled, ...rest } = props;

  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        height: 48,
        borderRadius: 14,
        border: "none",
        padding: "0 16px",
        background: disabled ? "#9db0ff" : "var(--primary4)",
        color: "white",
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "0 12px 26px rgba(93, 128, 250, 0.35)",
        ...style,
      }}
    />
  );
}
