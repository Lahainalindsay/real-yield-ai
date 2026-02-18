import React from "react";

type ButtonVariant = "default" | "primary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button(props: ButtonProps) {
  const { className = "", variant = "default", size = "md", disabled, ...rest } = props;

  const variantClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "ghost"
        ? "btn-ghost"
        : variant === "danger"
          ? "btn-danger"
          : variant === "success"
            ? "btn-success"
            : "";

  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";

  return (
    <button className={`btn ${variantClass} ${sizeClass} ${className}`} disabled={disabled} {...rest} />
  );
}
