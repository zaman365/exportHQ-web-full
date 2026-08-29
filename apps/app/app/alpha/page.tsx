import type { Metadata } from "next";
import { cookies } from "next/headers";
import { readPilotWorkspace } from "@exporthq/db";
import { firstShipmentPassHypothesis, privateAlphaAgreement, resolveLocale, translate } from "@exporthq/domain";
import { Badge, Card } from "@exporthq/ui";
import { Clock3, FileCheck2, ShieldAlert, UserRoundCheck } from "lucide-react";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";
import { PilotAgreementAcceptanceForm, PrintAlphaActionPack } from "./alpha-controls";

export const metadata: Metadata = {
  title: "Private Alpha — Export HQ",
  description: "Invitation-only Export HQ Private Alpha participation and support workspace."
};

export const dynamic = "force-dynamic";

function formatDate(value: Date, locale: "bn" | "en"): string {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    dateStyle: "medium",
    timeZone: "Asia/Dhaka"
  }).format(value);
}

function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export default async function PrivateAlphaPage() {
  const session = await getWorkspaceFeatureSession("home");
  const store = await cookies();
  const locale = resolveLocale(store.get("exporthq_locale")?.value ?? session.locale, session.defaultTimezone === "Asia/Dhaka" ? "BD" : null);
  const result = session.isDemo ? { ran: false as const } : await runTenantCommand(session, readPilotWorkspace);

  if (!result.ran) return <WorkspaceShell active="other" session={session}>
    <section className="alpha-heading"><div><p>PRIVATE ALPHA / FAIL CLOSED</p><h1>{translate(locale, "pilot.title")}</h1><span>{translate(locale, "pilot.internal_only")}</span></div><ShieldAlert size={30} /></section>
    <Card className="alpha-empty"><h2>Protected Alpha storage is unavailable</h2><p>No invitation, agreement or pass is inferred from identity metadata or browser storage.</p></Card>
  </WorkspaceShell>;

  const workspace = result.value;
  if (!workspace) return <WorkspaceShell active="other" session={session}>
    <section className="alpha-heading"><div><p>PRIVATE ALPHA / INVITATION ONLY</p><h1>{translate(locale, "pilot.title")}</h1><span>{translate(locale, "pilot.internal_only")}</span></div><Badge tone="neutral">Not enrolled</Badge></section>
    <Card className="alpha-empty"><h2>{translate(locale, "pilot.not_enrolled")}</h2><p>There is no public self-enrollment or checkout. An operations invitation must record cohort, scope, destination focus, support hours, data handling and the exact offered agreement.</p></Card>
  </WorkspaceShell>;

  const { participation, pass, supportCases } = workspace;
  const exactOffer = participation.agreementVersion === privateAlphaAgreement.version
    && participation.agreementHashSha256 === privateAlphaAgreement.contentHashSha256;

  return <WorkspaceShell active="other" session={session}>
    <section className="alpha-heading">
      <div><p>PRIVATE ALPHA / {participation.cohortCode}</p><h1>{translate(locale, "pilot.title")}</h1><span>{translate(locale, "pilot.scope")}</span></div>
      <span className="alpha-heading__actions"><Badge tone={participation.status === "active" ? "success" : "warning"}>{participation.status}</Badge><PrintAlphaActionPack label={translate(locale, "pilot.action_pack")} /></span>
    </section>
    <section className="alpha-warning"><ShieldAlert size={20} /><div><strong>{translate(locale, "pilot.internal_only")}</strong><p>{translate(locale, "pilot.outcomes_pending")}</p></div></section>

    <div className="alpha-grid">
      <Card className="alpha-scope-card"><header><FileCheck2 size={19} /><div><small>BOUND SCOPE</small><h2>{translate(locale, "pilot.agreement")}</h2></div></header><p>{translate(locale, "pilot.agreement_exact")}</p><dl><div><dt>Version</dt><dd>{participation.agreementVersion ?? "Not offered"}</dd></div><div><dt>SHA-256</dt><dd><code>{participation.agreementHashSha256 ?? "Not offered"}</code></dd></div><div><dt>Data handling</dt><dd>{participation.dataHandlingVersion}</dd></div><div><dt>Support hours</dt><dd>{participation.supportHours}</dd></div></dl></Card>
      <Card className="alpha-scope-card"><header><UserRoundCheck size={19} /><div><small>COHORT FIT</small><h2>{participation.exporterStage.replaceAll("_", " ")}</h2></div></header><dl><div><dt>Sectors</dt><dd>{participation.sectors.join(", ")}</dd></div><div><dt>Destinations</dt><dd>{participation.destinationCountryCodes.join(", ")}</dd></div><div><dt>Named support owner</dt><dd>{participation.supportOwnerActorId ?? "Assigned only after acceptance"}</dd></div><div><dt>Started</dt><dd>{participation.startedAt ? formatDate(participation.startedAt, locale) : "Not active"}</dd></div></dl></Card>
    </div>

    <section className="alpha-agreement">
      <div className="section-head"><div><p>HASH-LOCKED INTERNAL AGREEMENT</p><h2>{privateAlphaAgreement.title}</h2></div><Badge tone="warning">Internal/synthetic</Badge></div>
      <div className="alpha-agreement__sections">{privateAlphaAgreement.sections.map((section) => <article key={section.heading}><h3>{section.heading}</h3><p>{section.body}</p></article>)}</div>
      {!exactOffer && <p className="error">The stored invitation does not match the current exact agreement. Acceptance is disabled.</p>}
      {participation.status === "invited" && exactOffer && <PilotAgreementAcceptanceForm version={privateAlphaAgreement.version} contentHashSha256={privateAlphaAgreement.contentHashSha256} confirmLabel={translate(locale, "pilot.agreement_confirm")} submitLabel={translate(locale, "pilot.agreement_accept")} />}
      {participation.status === "accepted" && <p className="alpha-pending"><Clock3 size={16} /> {translate(locale, "pilot.activation_pending")}</p>}
      {participation.agreementAcceptedAt && <p className="success">Exact version accepted {formatDate(participation.agreementAcceptedAt, locale)}.</p>}
    </section>

    <section className="alpha-pass">
      <div className="section-head"><div><p>MANUAL PILOT ENTITLEMENT</p><h2>{translate(locale, "pilot.pass")}</h2></div>{pass && <Badge tone={pass.status === "active" || pass.status === "extended" ? "success" : "neutral"}>{pass.status}</Badge>}</div>
      <p>{translate(locale, "pilot.no_checkout")}</p>
      <div className="alpha-pass__facts"><div><small>{translate(locale, "pilot.price_hypothesis")}</small><strong>৳{(firstShipmentPassHypothesis.priceMinor / 100).toLocaleString("en-BD")}</strong></div><div><small>Duration</small><strong>{firstShipmentPassHypothesis.durationDays} days</strong></div><div><small>Active lanes</small><strong>{pass?.laneLimit ?? firstShipmentPassHypothesis.activeLaneLimit}</strong></div><div><small>Editors</small><strong>{pass?.editorLimit ?? firstShipmentPassHypothesis.editorLimit}</strong></div><div><small>Annual Launch credit</small><strong>{(pass?.launchCreditBps ?? firstShipmentPassHypothesis.annualLaunchCreditBps) / 100}%</strong></div></div>
      {pass ? <p className="alpha-pass__window">Recorded {formatDate(pass.startsAt, locale)} → {formatDate(pass.expiresAt, locale)} · {pass.extensionCount} extension(s)</p> : <p className="alpha-pending">No pass has been granted. Operations may grant it only after participation is active.</p>}
    </section>

    <section className="alpha-support">
      <div className="section-head"><div><p>CASE-BASED MANAGED WORK</p><h2>{translate(locale, "pilot.support")}</h2></div><Badge tone="neutral">{supportCases.length} case(s)</Badge></div>
      <p>{translate(locale, "pilot.no_unlimited")}</p>
      {supportCases.length === 0 ? <Card><p>{translate(locale, "pilot.support_empty")}</p></Card> : <div className="alpha-support__list">{supportCases.map((supportCase) => <article key={supportCase.id}><header><span><small>{supportCase.responsibility.replaceAll("_", " ")}</small><h3>{supportCase.title}</h3></span><Badge tone={supportCase.status === "open" || supportCase.status === "in_progress" ? "warning" : "success"}>{supportCase.status.replaceAll("_", " ")}</Badge></header><dl><div><dt>{translate(locale, "pilot.support_owner")}</dt><dd>{supportCase.ownerActorId}</dd></div><div><dt>{translate(locale, "pilot.support_scope")}</dt><dd>{supportCase.scope}</dd></div><div><dt>{translate(locale, "pilot.support_sla")}</dt><dd>{duration(supportCase.slaResponseMinutes)}</dd></div><div><dt>{translate(locale, "pilot.support_minutes")}</dt><dd>{duration(supportCase.supportMinutes)}</dd></div></dl></article>)}</div>}
    </section>
  </WorkspaceShell>;
}
