import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Calculator,
  Check,
  CircleDollarSign,
  PackageCheck,
  Route,
  ShieldCheck,
  Ship,
  Target,
} from "lucide-react";

const lifecycle = [
  ["01", "Opportunity", "Choose a product-market lane"],
  ["02", "Readiness", "Find and resolve the real gaps"],
  ["03", "Evidence", "Build buyer-ready proof"],
  ["04", "Buyer", "Qualify the right accounts"],
  ["05", "Offer", "Approve viable economics"],
  ["06", "Production", "Control delivery readiness"],
  ["07", "Shipment", "Keep documents connected"],
  ["08", "Payment", "Follow export proceeds"],
  ["09", "Repeat", "Turn learning into growth"]
] as const;

const outcomes = [
  { icon: Target, title: "Choose", text: "Compare product-market fit, barriers, evidence and commercial potential before committing." },
  { icon: ShieldCheck, title: "Prove", text: "Turn requirements into owned actions, current evidence and a controlled Buyer Trust Passport." },
  { icon: Ship, title: "Deliver", text: "Connect the offer, production gates, providers, documents and shipment checkpoints." },
  { icon: Banknote, title: "Get paid", text: "Prepare the payment route, finance evidence and export-proceeds follow-up from the start." }
] as const;

export function ExportSystemPreview({ appUrl }: { appUrl: string }) {
  return (
    <section className="export-system" id="export-system">
      <div className="export-system__eyebrow"><span><Route size={15} /></span> ONE CONNECTED EXPORT LANE</div>
      <div className="export-system__heading">
        <div>
          <p>FROM INTEREST TO REALIZED PAYMENT</p>
          <h2>Export work should run as one commercial system.</h2>
        </div>
        <p>ExportPanel connects what exporters usually manage in separate files, chats, service providers and memories—without pretending that a score or checklist guarantees a sale.</p>
      </div>

      <div className="export-system__lifecycle" aria-label="ExportPanel export lifecycle">
        {lifecycle.map(([number, title, detail], index) => (
          <article className={index < 2 ? "is-active" : ""} key={title}>
            <span>{index < 2 ? <Check size={13} /> : number}</span>
            <div><small>{index < 2 ? "IN MOTION" : "CONNECTED"}</small><strong>{title}</strong><p>{detail}</p></div>
          </article>
        ))}
      </div>

      <div className="export-system__body">
        <div className="export-system__outcomes">
          {outcomes.map(({ icon: Icon, title, text }) => (
            <article key={title}><span><Icon size={19} /></span><div><h3>{title}</h3><p>{text}</p></div></article>
          ))}
        </div>

        <div className="export-system__economics">
          <header><span><Calculator size={18} /></span><div><small>ILLUSTRATIVE EXPORT ECONOMICS</small><strong>Cotton shirts · Bangladesh → Germany</strong></div><b>FOB</b></header>
          <div className="export-system__economics-grid">
            <div><small>QUOTE VALUE</small><strong>$38,250</strong><span>5,000 units × $7.65</span></div>
            <div><small>SELLER COST</small><strong>$29,912</strong><span>Modelled assumptions</span></div>
            <div className="is-margin"><small>GROSS MARGIN</small><strong>21.8%</strong><span>Before tax and exceptions</span></div>
            <div><small>LANDED ESTIMATE</small><strong>$50,884</strong><span>Duty/tax assumptions shown</span></div>
          </div>
          <div className="export-system__warning"><CircleDollarSign size={15} /><span><strong>Not a generic profit promise.</strong> Every assumption stays visible and must be confirmed for the product, buyer, Incoterm, shipment date and destination.</span></div>
          <Link href={`${appUrl}/studio?access=public`}>Open Export Studio <ArrowRight size={15} /></Link>
        </div>
      </div>

      <div className="export-system__trust">
        <div><p>USEFUL BEFORE YOU BUY. MORE POWERFUL AS TRUST GROWS.</p><h3>Preview → account → verified business → operational plan</h3></div>
        <ol>
          <li><span>1</span><div><strong>Public preview</strong><small>See the method and selected market signals</small></div></li>
          <li><span>2</span><div><strong>Basic workspace</strong><small>Save a first lane and model draft economics</small></div></li>
          <li><span>3</span><div><strong>Verified business</strong><small>Unlock controlled detail and qualified matching</small></div></li>
          <li><span>4</span><div><strong>Scale or Managed</strong><small>Coordinate multiple lanes, teams and execution</small></div></li>
        </ol>
        <div className="export-system__trust-actions">
          <a href={`${appUrl}/studio?access=public`}>Explore the system <ArrowRight size={15} /></a>
          <a href={`${appUrl}/sign-up`}><BadgeCheck size={15} /> Create Basic account</a>
        </div>
      </div>

      <footer className="export-system__note"><PackageCheck size={14} /> ExportPanel organizes evidence and work. Official authorities, banks, carriers, buyers and qualified professionals remain controlling.</footer>
    </section>
  );
}
