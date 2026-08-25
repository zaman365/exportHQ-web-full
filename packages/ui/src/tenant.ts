/**
 * Tenant (customer) branding.
 *
 * A tenant workspace is an Export HQ surface hosting a customer's identity, not
 * a customer surface hosting Export HQ's tools. This module is the *only* way a
 * customer colour enters the DOM, and it emits exactly four custom properties.
 * Because the returned key set is fixed, no tenant value can reach any other
 * token — the guarantee is structural, not a convention.
 *
 * See docs/brand/exportpanel/05-tenant-branding.md.
 */

import type { CSSProperties } from "react";

export interface TenantBrand {
  /** Trading name, shown beside the mark. */
  name: string;
  /** Two-letter fallback mark. Derived from `name` when absent. */
  initials?: string;
  /** Any CSS hex colour. Clamped for contrast before use. */
  accent?: string;
  /** Uploaded SVG or PNG mark. */
  markUrl?: string;
}

/** Exactly four custom properties, typed as a style object so it can be spread
 *  straight onto an element. Nothing else may be added to this shape. */
export type TenantThemeStyle = CSSProperties & {
  "--tenant-accent": string;
  "--tenant-accent-on": string;
  "--tenant-accent-wash": string;
  "--tenant-mark": string;
};

const EXPORT_HQ_DEFAULT_ACCENT = "#2b1c15";
const PAPER = [255, 255, 255] as const;
const INK = [33, 24, 19] as const;
const MIN_CONTRAST = 4.5;

type Rgb = readonly [number, number, number];

function parseHex(value: string): Rgb | null {
  const raw = value.trim().replace(/^#/, "");
  const expanded =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => char + char)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16)
  ];
}

function toHex([r, g, b]: Rgb): string {
  const channel = (value: number) =>
    Math.round(Math.max(0, Math.min(255, value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.04045
      ? scaled / 12.92
      : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const first = luminance(a);
  const second = luminance(b);
  const high = Math.max(first, second);
  const low = Math.min(first, second);
  return (high + 0.05) / (low + 0.05);
}

function darken(colour: Rgb, amount: number): Rgb {
  return [
    colour[0] * (1 - amount),
    colour[1] * (1 - amount),
    colour[2] * (1 - amount)
  ];
}

/**
 * Darken the accent until it reaches AA against paper, so it is always safe as
 * a plate behind text. A colour that cannot get there in 20 steps is replaced
 * with Export HQ ink rather than shipped unreadable.
 */
function clampForPaper(colour: Rgb): Rgb {
  let candidate = colour;
  for (let step = 0; step < 20; step += 1) {
    if (contrast(candidate, PAPER) >= MIN_CONTRAST) return candidate;
    candidate = darken(candidate, 0.08);
  }
  return INK;
}

function washFrom(colour: Rgb): Rgb {
  const blend = 0.9;
  return [
    colour[0] + (PAPER[0] - colour[0]) * blend,
    colour[1] + (PAPER[1] - colour[1]) * blend,
    colour[2] + (PAPER[2] - colour[2]) * blend
  ];
}

/** Two-letter fallback mark, derived the same way everywhere. */
export function tenantInitials(brand: Pick<TenantBrand, "name" | "initials">): string {
  if (brand.initials) return brand.initials.slice(0, 2).toUpperCase();
  return (
    brand.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EH"
  );
}

/**
 * Build the four permitted tenant custom properties.
 *
 * Returns Export HQ defaults when no brand is configured — the unbranded case
 * is the reference case and must always look finished.
 */
export function tenantTheme(brand?: TenantBrand | null): TenantThemeStyle {
  const parsed = brand?.accent ? parseHex(brand.accent) : null;
  const accent = clampForPaper(parsed ?? parseHex(EXPORT_HQ_DEFAULT_ACCENT)!);
  const onPaper = contrast(accent, PAPER);
  const onInk = contrast(accent, INK);

  return {
    "--tenant-accent": toHex(accent),
    "--tenant-accent-on": onPaper >= onInk ? toHex(PAPER) : toHex(INK),
    "--tenant-accent-wash": toHex(washFrom(accent)),
    "--tenant-mark": brand?.markUrl ? `url("${brand.markUrl}")` : "none"
  };
}
