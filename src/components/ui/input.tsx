import type { InputHTMLAttributes } from "react";

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;

  return (
    <input
      {...rest}
      style={{
        height: 48,
        borderRadius: 14,
        border: "1px solid var(--border2)",
        padding: "0 14px",
        outline: "none",
        background: "var(--white)",
        fontSize: 14,
        color: "var(--text)",
        ...style,
      }}
    />
  );
}
