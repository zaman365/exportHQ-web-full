"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function DemoBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="demo-banner" role="status">
      <AlertTriangle size={15} />
      <span>Foundation preview · demo data, no production documents</span>
      <button type="button" aria-label="Dismiss preview notice" onClick={() => setVisible(false)}><X size={14} /></button>
    </div>
  );
}
