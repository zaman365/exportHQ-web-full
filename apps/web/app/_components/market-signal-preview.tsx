import { ArrowRight, BarChart3, Globe2, LockKeyhole, ShieldCheck, Sparkles, Target } from "lucide-react";
import { marketOpportunityViews } from "@exporthq/domain";

const publicViews = marketOpportunityViews("public");
const previewCountries = Array.from(
  new Map(publicViews.map((item) => [item.target.code, item.target])).values()
).slice(0, 3);

export function MarketSignalPreview({ appUrl }: { appUrl: string }) {
  return (
    <section className="section market-preview" id="market-signals">
      <div className="container">
        <div className="market-preview__head" data-reveal>
          <div><p className="eyebrow"><i aria-hidden="true" />TREVV market signals</p><h2 className="h-section">Where could your products win?</h2></div>
          <div><p className="section-note">Explore country × product lanes built from observed demand and Bangladesh supply signals—not a generic list of “good markets.”</p><span><ShieldCheck size={15} /> Source-linked · reviewed 25 Aug 2026</span></div>
        </div>

        <div className="market-preview__stage" data-reveal>
          <aside className="market-preview__countries" aria-label="Example export target countries">
            {previewCountries.map((country, index) => {
              const matches = publicViews.filter((item) => item.target.code === country.code);
              return <article className={index === 0 ? "active" : ""} key={country.code}>
                <span className="market-preview__flag">{country.flag}</span>
                <div><small>{country.region}</small><strong>{country.name}</strong><p>{matches.length} product signals</p></div>
                <ArrowRight size={15} />
              </article>;
            })}
            <div className="market-preview__more"><Globe2 size={16} /><span><strong>+3 more markets</strong><small>Create a free account to see the ranked shortlist.</small></span></div>
          </aside>

          <div className="market-preview__panel">
            <header><div><span>{previewCountries[0]?.flag}</span><p>JAPAN · PRODUCT POTENTIAL</p><h3>Signals worth validating</h3></div><span><BarChart3 size={15} /> Ranked by TREVV fit</span></header>
            <div className="market-preview__rows">
              {publicViews.filter((item) => item.target.code === previewCountries[0]?.code).map((item, index) => <article key={item.id}>
                <span className="market-preview__rank">0{index + 1}</span>
                <div><small>{item.product.category} · HS {item.product.hsCodes.join(", ")}</small><strong>{item.product.name}</strong><p>{item.publicSummary}</p></div>
                <span className={`market-preview__band band-${item.scoreBand.toLowerCase()}`}><Target size={12} /> {item.scoreBand}</span>
                <span className="market-preview__hidden-score" aria-label="Exact score requires an account"><LockKeyhole size={13} /> --</span>
              </article>)}
            </div>
            <div className="market-preview__locked">
              <span><LockKeyhole size={18} /></span><div><strong>The ranking is only the start</strong><p>Sign in to reveal exact scores. Verify your business or subscribe to open evidence, buyer routes, barriers and recommended next actions.</p></div>
              <a href={`${appUrl}/sign-up`}>Create free account <ArrowRight size={15} /></a>
            </div>
          </div>

          <aside className="market-preview__access">
            <p>ACCESS THAT GROWS WITH TRUST</p>
            <ol>
              <li className="active"><span>01</span><div><strong>Public preview</strong><small>Example countries and product signals</small></div><i /></li>
              <li><span>02</span><div><strong>Free Basic account</strong><small>Full shortlist and exact fit rankings</small></div><i /></li>
              <li><span>03</span><div><strong>Verified or subscribed</strong><small>Evidence, routes, barriers and actions</small></div><i /></li>
            </ol>
            <div><Sparkles size={17} /><p><strong>Verification is free</strong><small>A legitimate business can unlock the full intelligence layer without buying a plan.</small></p></div>
            <a href={`${appUrl}/preview`}>Preview TREVV intelligence <ArrowRight size={15} /></a>
          </aside>
        </div>
        <p className="market-preview__method">TREVV signals support prioritization; they do not guarantee sales. Full views retain the source period, confidence and review date.</p>
      </div>
    </section>
  );
}
