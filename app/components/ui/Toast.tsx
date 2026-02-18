import React from "react";
import { Badge } from "./Badge";

export type ToastTone = "info" | "good" | "warn" | "bad";

export function Toast({
  tone,
  title,
  detail,
  right,
}: {
  tone: ToastTone;
  title: string;
  detail?: string;
  right?: React.ReactNode;
}) {
  const badgeVariant = tone === "good" ? "good" : tone === "warn" ? "warn" : tone === "bad" ? "bad" : "default";

  return (
    <div className="tx" role="status" aria-live="polite">
      <div className="tx-left">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Badge variant={badgeVariant}>{tone.toUpperCase()}</Badge>
          <div className="tx-title">{title}</div>
        </div>
        {detail ? <div className="tx-meta">{detail}</div> : null}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}
