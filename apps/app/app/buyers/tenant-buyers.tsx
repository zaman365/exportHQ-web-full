import { Badge, Card } from "@exporthq/ui";
import type { BuyerPipelineRecord } from "@exporthq/db";
import { Building2, ShieldCheck, TriangleAlert } from "lucide-react";

function date(value: Date | null): string {
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(value) : "Not reviewed";
}
function verificationTone(buyer: BuyerPipelineRecord): "success" | "warning" | "neutral" {
  if (buyer.mayUseVerifiedLanguage) return "success";
  if (buyer.verificationStatus === "rejected") return "warning";
  return "neutral";
}

export function TenantBuyers({ buyers }: { buyers: readonly BuyerPipelineRecord[] }) {
  return <div className="module-page buyer-page">
    <header className="module-page__header"><div><small>PRIVATE BETA · TENANT RECORDS</small><h1>Buyers</h1><p>Source-bounded buyer records, dated verification evidence, risk state, opt-out and lane-linked commercial work.</p></div></header>
    <section className="module-truth-notice"><ShieldCheck size={18} /><div><strong>Tenant-authoritative buyer register</strong><p>“Verified” language appears only after a dated human review with an evidence level. No directory scraping or resale feed is active.</p></div></section>
    {buyers.length === 0 ? <Card className="alpha-empty"><Building2 size={24} /><h2>No buyer records yet</h2><p>Add buyers only from customer/buyer-supplied, official-registry, licensed-provider or documented public-business sources with a recorded rights basis.</p></Card> : <section className="buyer-tenant-register">
      {buyers.map((buyer) => <Card key={buyer.id} className="buyer-tenant-card">
        <header><div><small>{buyer.countryCode}</small><h2>{buyer.tradingName || buyer.legalName}</h2>{buyer.tradingName && <p>{buyer.legalName}</p>}</div><Badge tone={verificationTone(buyer)}>{buyer.verificationLabel}</Badge></header>
        <dl><div><dt>Evidence level</dt><dd>{buyer.verificationEvidenceLevel ?? "No substantiating evidence recorded"}</dd></div><div><dt>Reviewed</dt><dd>{date(buyer.verifiedAt)}</dd></div><div><dt>Risk</dt><dd>{buyer.riskStatus.replaceAll("_", " ")}</dd></div><div><dt>Open opportunities</dt><dd>{buyer.openOpportunityCount}</dd></div></dl>
        {buyer.optedOutAt && <p className="buyer-opt-out"><TriangleAlert size={14} /> Outreach opted out {date(buyer.optedOutAt)}.</p>}
      </Card>)}
    </section>}
  </div>;
}
