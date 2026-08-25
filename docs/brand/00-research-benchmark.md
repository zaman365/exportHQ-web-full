# 00 · Benchmark research

Twenty reference brands were studied before this system was written. They were
chosen because each solves a problem Export HQ has: **selling a complex managed
service, running a dense operational product, or carrying more than one brand
inside one interface.**

Each entry records the observable decision, then what Export HQ takes or rejects.
Nothing here is copied; the point is to be deliberate about which conventions we
inherit.

## Method

1. Read the brand's public design-system or brand documentation where one exists.
2. Observe the live marketing surface and, where public, the product surface.
3. Record the *structural* decision (token architecture, colour ratio, type
   pairing, register shift), not the surface style.
4. Decide: **adopt**, **adapt**, or **reject** — with a reason.

## The twenty

### Group A — Trust through restraint (payments, banking, treasury)

| # | Brand | Observed decision | Export HQ position |
| --- | --- | --- | --- |
| 01 | **Stripe** | Near-monochrome canvas: cool white surfaces, deep navy ink that is never pure black, one vivid accent reserved for action surfaces. Depth comes from background tint shifts rather than heavy elevation. | **Adopt** the "one accent, everything else ink" discipline and the never-pure-black rule. **Reject** the cool-navy neutral — our ink is warm, because export is a human, relationship-led business. |
| 02 | **Mercury** | Monochrome interface with a single vivid accent used *only* on the primary action. Display face at an intermediate weight; body face at regular. "Confident but never loud." | **Adopt** the intermediate display weight (we sit at 650, not 800) and the single-primary-action rule. |
| 03 | **Wise** | A commissioned typeface supporting hundreds of languages; single accent; pill controls on flat cards. | **Adapt**: we cannot commission a face, so we choose a variable grotesque with wide language coverage. **Adopt** the single-accent posture. |
| 04 | **Ramp** | Minimal, near-borderless components; restrained primary accent; graphite surfaces. | **Adapt**: borderless works in dark treasury UI; our dense compliance tables need visible structure, so we keep hairlines. |
| 05 | **Monzo** | One distinctive hue ("hot coral") pushed *hotter* in the refresh, plus secondary colours that carry optimism, plus a large proprietary illustration suite. | **Adopt** the conviction that the signature hue should be unapologetically bright. **Reject** the illustration-heavy approach — our credibility comes from real operational data, not characters. |

### Group B — Systems with public token architecture

| # | Brand | Observed decision | Export HQ position |
| --- | --- | --- | --- |
| 06 | **IBM Carbon** | Role-based universal tokens whose *value* changes per theme while the *name* stays constant; a small fixed set of named themes. | **Adopt** wholesale. This is the reason our tenant themes can never break the UI: tenants change values behind fixed names, in a fixed, tiny slot list. |
| 07 | **Adobe Spectrum** | Three explicit layers: global raw values, alias/semantic mappings, per-component custom properties. | **Adopt** as our three-tier architecture (see [08 · Design tokens](08-tokens.md)). |
| 08 | **Twilio Paste** | Tokens named for *intended usage*, e.g. a destructive-link text token, so misuse is visible in the code review diff. | **Adopt** usage-named semantics. A reviewer should be able to reject `color: #c83d00` on sight because a named token exists. |
| 09 | **Shopify Polaris** | Documentation is opinionated about *usage*: when to use a component, when not to, and what to use instead. | **Adopt** the "when not to use" section as mandatory in [09 · Website components](09-components.md) and the ExportPanel component doc. |
| 10 | **Atlassian Design System** | Explicit, published governance: how a change is proposed, reviewed, versioned and deprecated. | **Adopt** — see [12 · Governance](12-governance.md). |
| 11 | **GitHub Primer** | Functional colour roles (`danger`, `attention`, `done`, `sponsors`) rather than hue names, so status meaning survives a re-hue. | **Adopt**: our support hues are documented by role first (verified / attention / information / intelligence), hue second. |
| 12 | **Google Material 3** | Tonal palettes generated from a source colour with guaranteed contrast pairs. | **Adapt**: we generate a *clamped* on-colour for tenant accents the same way, but we do not let a tenant colour generate the whole UI. |
| 13 | **Salesforce Lightning** | Density modes; the same system at multiple information densities. | **Adopt** the idea as our **register shift**: the marketing site and ExportPanel are one brand at two densities, not two brands. |

### Group C — Product clarity at high information density

| # | Brand | Observed decision | Export HQ position |
| --- | --- | --- | --- |
| 14 | **Linear** | Removes daily workflow friction: minimal chrome, keyboard-first, status conveyed by small consistent affordances. Dark-mode-first. | **Adopt** the minimal-chrome, consistent-status-affordance discipline. **Reject** dark-first: our users share screens with buyers, auditors and lenders; light is the default of record. |
| 15 | **Vercel** | Makes technical status instantly readable; heavy use of mono for machine data; near-zero decoration. | **Adopt** the "mono means machine-generated or operational" rule — it is why our eyebrows, IDs and metrics are mono. |
| 16 | **Notion** | Extremely calm neutral surface so user content is the loudest thing on screen. | **Adopt**: in ExportPanel the customer's data outranks our brand. |
| 17 | **Intercom** | Explicit human presence in-product (named people, avatars, response times) as a trust device. | **Adopt** — our managed-service model *depends* on the assigned specialist being visible. |

### Group D — Trade, logistics and multi-brand

| # | Brand | Observed decision | Export HQ position |
| --- | --- | --- | --- |
| 18 | **Flexport** | Deliberately un-staid freight branding: dark professional wordmark plus one warm, non-obvious accent; generous letter spacing; approachable geometry. | **Adopt** the strategic move — an unexpected warm accent in a category of blues. Our safety orange is that move. **Reject** the lowercase startup register; our buyers include regulators. |
| 19 | **Maersk / DHL** | Category convention: maritime blue for authority, or high-visibility yellow for speed and physical presence. Colour is applied at enormous scale on physical assets. | **Reject** the category blue outright — it is the most crowded colour in trade software. **Adopt** the safety/high-visibility logic: our orange descends from hazard and hi-vis signage, which is where exporters actually work. |
| 20 | **Signify (multi-brand token programme)** | A white-label core library where brand-specific components are *removed* from brand libraries, so the shared core stays unpolluted; tenant branding ships as a small resource package plugged into an unchanging SDK. | **Adopt** exactly. See [ExportPanel · Tenant branding](exportpanel/05-tenant-branding.md): tenants get a resource package (mark, name, accent), never component overrides. |

## What the twenty agree on

1. **One accent.** Every brand that reads as trustworthy uses a single chromatic
   voice for action, and treats every other hue as classification.
2. **Ink is never black.** Pure `#000` reads as unfinished at scale.
3. **The token name is the contract.** Themes change values, never names.
4. **The product is quieter than the marketing.** Same brand, lower volume.
5. **Status must survive a re-hue.** Colour is reinforcement, never the message.

## What we deliberately do differently

| Convention | Why we break it |
| --- | --- |
| Trade software is blue | Blue is undifferentiated in our category and reads as legacy freight software. Safety orange descends from the hi-vis and hazard signage exporters already work inside, and it is genuinely ownable in trade SaaS. |
| Dark mode first | Export HQ artefacts are printed, exported to PDF, screen-shared with buyers, banks and auditors, and read on low-quality mobile screens in the field. A white canvas of record is a business requirement, not a taste. |
| Illustration-led warmth | Our warmth comes from warm ink and named human specialists, not characters. The screenshot must be the hero. |
| Tenant-branded portals | A customer workspace that is 100% the customer's brand destroys the accountability signal that Export HQ is the party doing the work. Tenants are guests inside our chrome. |

## Sources

- [Stripe — Designing accessible color systems](https://stripe.com/blog/accessible-color-systems)
- [Inside Stripe's Design System: A Token-Level Breakdown](https://www.designmd.run/blog/stripe-design-system-breakdown)
- [12 Design System Examples Worth Studying (Polaris, Atlassian, Carbon, Primer, Material)](https://www.themasterly.com/blog/design-system-examples)
- [Twilio Paste — Tokens](https://paste.twilio.design/tokens)
- [Token Tiers: building token architecture in layers](https://honcho.agency/design-systems/glossary/token-tiers)
- [Designing with tokens for a flexible multi-brand design system — Clearleft](https://clearleft.com/thinking/designing-with-tokens-for-a-flexible-multi-brand-design-system)
- [A multi-branded design system leveraging design tokens — Hike One](https://hike.one/work/signify-multi-branded-design-system)
- [Fintech Brand Design: 16 Case Studies from Monzo to Robinhood](https://www.feelystudio.com/journal/the-evolution-of-fintech-design)
- [Monzo brand refresh — Ragged Edge](https://raggededge.com/partnerships/monzo)
- [Flexport — Brand and Identity](https://creativedirected.com/work/flexport)
- [Maersk Brand Guidelines overview](https://www.scribd.com/document/724532910/20181116-the-Maersk-Brand-Guidelines)
- [B2B SaaS Design Trends and Examples](https://procreator.design/blog/b2b-saas-design-trends-and-examples/)
