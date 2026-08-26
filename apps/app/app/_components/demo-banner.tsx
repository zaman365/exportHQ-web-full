"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export type ProjectionNoticeVariant = "demo-identity" | "illustrative";

const copy: Readonly<Record<ProjectionNoticeVariant, string>> = {
  "demo-identity": "Foundation preview · demo data, no production documents",
  illustrative: "Illustrative data · this workspace is not connected to your business records yet"
};

/**
 * Says out loud that what is on screen is not the reader's own business data.
 *
 * The illustrative variant cannot be dismissed. A signed-in person looking at
 * fabricated readiness scores, documents and deadlines must not be able to hide
 * the only thing telling them so — see the completion rule in
 * docs/production-activation-todo.md.
 */
export function ProjectionNotice({ variant }: { variant: ProjectionNoticeVariant }) {
  const [visible, setVisible] = useState(true);
  const dismissible = variant === "demo-identity";
  if (dismissible && !visible) return null;

  return (
    <div className="demo-banner" role="status">
      <AlertTriangle size={15} />
      <span>{copy[variant]}</span>
      {dismissible && (
        <button type="button" aria-label="Dismiss preview notice" onClick={() => setVisible(false)}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
