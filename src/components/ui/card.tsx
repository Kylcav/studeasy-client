import type { ReactNode } from "react";
import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
};

export default function Card({ children, className = "", ...rest }: Props) {
  return (
    <div className={`ui-card ${className}`} {...rest}>
      {children}
    </div>
  );
}
