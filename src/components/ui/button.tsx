import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export default function Button(props: Props) {
  const {
    variant = "primary",
    className = "",
    disabled,
    ...rest
  } = props;

  const v =
    variant === "ghost"
      ? "ui-btn ui-btn-ghost"
      : variant === "danger"
      ? "ui-btn ui-btn-danger"
      : "ui-btn ui-btn-primary";

  return (
    <button
      {...rest}
      disabled={disabled}
      className={`${v} ${disabled ? "is-disabled" : ""} ${className}`}
    />
  );
}
