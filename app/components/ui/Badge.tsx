import React from "react";

type BadgeVariant = "default" | "good" | "warn" | "bad";

export function Badge(
  props: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }
) {
  const { className = "", variant = "default", ...rest } = props;
  const variantClass =
    variant === "good" ? "badge-good" : variant === "warn" ? "badge-warn" : variant === "bad" ? "badge-bad" : "";
  return <span className={`badge ${variantClass} ${className}`} {...rest} />;
}
