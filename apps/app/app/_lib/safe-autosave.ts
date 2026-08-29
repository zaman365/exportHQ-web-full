"use client";

import { useEffect, useRef } from "react";

/** Debounces writes, serializes retries, and skips the initial render. The
 * server-side expected-version check remains authoritative: autosave never
 * converts a conflict into an overwrite. */
export function useSafeAutosave(input: {
  readonly enabled: boolean;
  readonly changeKey: string;
  readonly save: () => Promise<boolean>;
  readonly delayMs?: number;
}): void {
  const saveRef = useRef(input.save);
  const initialized = useRef(false);
  const running = useRef(false);
  const queued = useRef(false);
  saveRef.current = input.save;

  useEffect(() => {
    if (!input.enabled) {
      initialized.current = false;
      return;
    }
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    let cancelled = false;
    const run = async () => {
      if (running.current) {
        queued.current = true;
        return;
      }
      running.current = true;
      try {
        await saveRef.current();
      } finally {
        running.current = false;
        if (queued.current && !cancelled) {
          queued.current = false;
          void run();
        }
      }
    };
    const timer = window.setTimeout(() => void run(), input.delayMs ?? 2200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input.changeKey, input.delayMs, input.enabled]);
}
