import type { ReactNode } from "react";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
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
export function AuthConfigurationNotice() {
  return (
    <div className="auth-configuration">
      <span><LockKeyhole size={22} /></span>
      <p>ACCOUNT ACCESS</p>
      <h2>Secure sign-in is being activated.</h2>
      <small>The public TREVV preview remains available while production identity keys are connected.</small>
      <a className="button button--primary" href="/preview">Open the limited preview</a>
    </div>
  );
}
