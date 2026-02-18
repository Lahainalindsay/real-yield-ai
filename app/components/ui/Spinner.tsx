import React from "react";

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span
        aria-hidden="true"
        style={{
          width: 14,
          height: 14,
          borderRadius: 999,
          border: "2px solid rgba(255,255,255,0.25)",
          borderTopColor: "rgba(255,255,255,0.85)",
          display: "inline-block",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <span className="muted" style={{ fontSize: 13 }}>
        {label}
      </span>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </span>
  );
}
