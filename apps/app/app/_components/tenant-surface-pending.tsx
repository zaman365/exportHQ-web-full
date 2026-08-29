import { Badge, Card } from "@exporthq/ui";
import { ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function TenantSurfacePending({
  title,
  description,
  phase
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return <Card className="managed-card"><div className="managed-card__head"><span className="icon-box"><ShieldAlert size={18} /></span><Badge tone="warning">{phase}</Badge></div><h1>{title}</h1><p>{description}</p><p>No fixture, browser-local record, or mock success response is substituted for tenant state.</p><footer><Link href="/preview">Open labelled public preview <ArrowRight size={14} /></Link></footer></Card>;
}
