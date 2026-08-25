import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

export { Logo, Monogram, Wordmark } from "./brand";
export { tenantInitials, tenantTheme } from "./tenant";
export type { TenantBrand, TenantThemeStyle } from "./tenant";

/** Status tones, mapped to the roles in docs/brand/04-color.md. */
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return <span className={clsx("badge", `badge--${tone}`)}>{children}</span>;
}

export function Card({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={clsx("card", className)} {...props}>{children}</section>;
}

export function Avatar({ initials, tone = 0 }: { initials: string; tone?: number }) {
  return <span className={`avatar avatar--${tone % 3}`} aria-hidden="true">{initials}</span>;
}

export function Progress({ value, label }: { value: number; label: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="progress" aria-label={`${label}: ${safeValue}%`}>
      <span style={{ width: `${safeValue}%` }} />
    </div>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return <a className={clsx("button", `button--${variant}`)} href={href}>{children}</a>;
}
