import { demoSnapshot } from "@exporthq/domain";
import { Badge, Card, Progress } from "@exporthq/ui";
import { ArrowRight, Package, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Illustrative command center — ExportPanel",
  description: "A labelled synthetic preview of the Export HQ command center."
};

export default function IllustrativeDashboardPreview() {
  return <main className="content">
    <section className="module-truth-notice"><Sparkles size={18} /><div><strong>Illustrative public sample</strong><p>ABC Textiles and every number below are fictional. No customer workspace, provider, or government system is connected.</p></div><Link href="/sign-up">Create a protected workspace <ArrowRight size={13} /></Link></section>
    <section className="welcome"><div><p>PREVIEW / COMMAND CENTER</p><h1>{demoSnapshot.organization.brand?.name ?? "ABC Textiles"}</h1><span>A synthetic view retained only under the public preview route.</span></div></section>
    <section className="score-grid"><Card className="health-card"><div className="card-kicker"><span>EXPORT HEALTH</span><Badge tone="neutral">Illustrative</Badge></div><div className="score-row"><strong>{demoSnapshot.health.overall}</strong><span>/ 100</span></div><p>Sample health demonstrates the layout, not an assessment of a real exporter.</p></Card><Card className="readiness-card"><div className="card-kicker"><span>READINESS BY AREA</span></div><div className="readiness-list">{demoSnapshot.health.dimensions.slice(0, 4).map((item) => <div key={item.area}><span>{item.label}</span><Progress value={item.score} label={item.label} /><strong>{item.score}%</strong></div>)}</div></Card></section>
    <section className="module-section"><div className="section-head"><div><p>PRODUCT × MARKET</p><h2>Fictional products</h2></div></div><div className="product-table" role="table"><div className="table-head" role="row"><span>Product</span><span>HS code</span><span>Market</span><span>Readiness</span><span>Status</span></div>{demoSnapshot.products.map((product) => <div className="table-row" role="row" key={product.id}><span><span className="product-thumb"><Package size={18} /></span><span><strong>{product.name}</strong><small>{product.sku}</small></span></span><span>{product.hsCode}</span><span>{product.market}</span><span><Progress value={product.readiness} label={`${product.name} readiness`} /><strong>{product.readiness}%</strong></span><span><Badge tone="neutral">Illustrative</Badge></span></div>)}</div></section>
  </main>;
}
