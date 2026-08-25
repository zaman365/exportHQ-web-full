import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Globe2, KeyRound, LockKeyhole, MailCheck, ShieldCheck, Smartphone } from "lucide-react";
import { Logo } from "@exporthq/ui";

export function AuthScreen({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <a href="https://export-hq.com" className="auth-story__brand"><Logo /></a>
        <div>
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <span>{description}</span>
          <ul>
            <li><ShieldCheck size={17} /> Organization-scoped access</li>
            <li><LockKeyhole size={17} /> Secure sessions and role controls</li>
          </ul>
        </div>
        <a href="https://export-hq.com"><ArrowLeft size={15} /> Back to Export HQ</a>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}

export function AuthMethodSummary() {
  return (
    <section className="auth-methods" aria-label="Supported account access methods">
      <header><span>SECURE ACCESS OPTIONS</span><small>Enabled methods appear in the form below</small></header>
      <div>
        <span><MailCheck size={15} /><b>Email</b><small>Password or OTP</small></span>
        <span><Smartphone size={15} /><b>Mobile</b><small>SMS OTP</small></span>
        <span><Globe2 size={15} /><b>Google & social</b><small>OAuth accounts</small></span>
        <span><KeyRound size={15} /><b>MFA ready</b><small>Extra protection</small></span>
      </div>
    </section>
  );
}

export function AuthConfigurationNotice({ localAdminPreview = false }: { localAdminPreview?: boolean }) {
  return (
    <div className="auth-configuration">
      <span><LockKeyhole size={22} /></span>
      <p>ACCOUNT ACCESS</p>
      <h2>{localAdminPreview ? "Use the local administrator workspace." : "Secure sign-in is being activated."}</h2>
      <small>{localAdminPreview
        ? "This environment has no Clerk development keys. Administrator preview grants all features with sample data, creates no account, and is disabled in production."
        : "This environment is missing its production identity keys. Account creation remains closed rather than accepting an insecure fallback."}</small>
      <div className="auth-configuration__actions">
        {localAdminPreview ? <Link className="button button--primary" href="/"><ShieldCheck size={15} /> Open full admin preview</Link> : null}
        <Link className={localAdminPreview ? "button button--secondary" : "button button--primary"} href="/preview">Open the limited preview</Link>
      </div>
    </div>
  );
}
