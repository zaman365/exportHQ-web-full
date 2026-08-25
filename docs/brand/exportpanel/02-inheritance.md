# 02 · Inheritance and divergence

ExportPanel inherits the Export HQ brand by default. This document is the
complete list of what it may change, and what it may not.

## The matrix

| Element | Status | Detail |
| --- | --- | --- |
| **Logo and monogram** | 🔒 Inherit | Identical `<Logo />` from `@exporthq/ui`. No product-specific mark, no "ExportPanel" lockup. |
| **Signal orange** | 🔒 Inherit | Same value, same meaning: action and change. |
| **Ink and paper** | 🔒 Inherit | Same warm ink, same white-first surfaces. |
| **Support hue roles** | 🔒 Inherit | Information / attention / intelligence / verified / risk / neutral. |
| **Typefaces** | 🔒 Inherit | Manrope, Bricolage Grotesque, Geist Mono — loaded identically. |
| **Icon set and meanings** | 🔒 Inherit | Lucide, with the fixed meaning table. |
| **Focus treatment** | 🔒 Inherit | Same ring, same offset, same colour source. |
| **Accessibility baseline** | 🔒 Inherit | WCAG 2.1 AA, plus the product density floor. |
| **Verbal identity** | 🔒 Inherit | Same voice; tone shifts to neutral-factual. |
| **Type scale** | ⚙️ Adapt | Fixed px, starting at 13px body. No fluid clamps except the page `h1`. |
| **Radii** | ⚙️ Adapt | One step tighter: cards use `--r-sm`, chips use `--r-xs`. |
| **Spacing** | ⚙️ Adapt | Same 4px ladder, lower steps: card padding 16–20px, row height 44–52px. |
| **Elevation** | ⚙️ Adapt | `--shadow-xs` for resting cards; structure is hairlines. `--shadow-lg` only for modals. |
| **Control height** | ⚙️ Adapt | 36px default vs the website's 46px. |
| **Motion** | ⚙️ Adapt | State-change only. No scroll-linked reveals, no ambient drift, no marquee. |
| **Display type** | ⚙️ Adapt | Reserved for the page `h1` and the console title. Section headings use the UI face. |
| **Dark rail** | ⚙️ Adapt | `--ink-0` navigation rail — a product-only treatment. |
| **Aurora, grain, cartography** | 🚫 Forbid | Decoration has no place on a work surface. |
| **A second brand colour** | 🚫 Forbid | Including a "product accent" or a tenant colour. |
| **A product-specific typeface** | 🚫 Forbid | — |
| **A product-specific logo** | 🚫 Forbid | — |
| **Dark mode as a theme** | 🚫 Forbid | Artefacts are printed, exported and shared. The rail is dark; the workspace is not. |
| **Status hues in charts** | 🚫 Forbid | Charts use the neutral series unless the encoding *is* status. |
| **Tenant colour on chrome, actions or status** | 🚫 Forbid | See [05 · Tenant branding](05-tenant-branding.md). |

Legend: 🔒 inherit unchanged · ⚙️ adapt within the rule below · 🚫 never

## Adaptation rules

An adaptation is legitimate only if it satisfies all three:

1. **It serves density or operation** — not novelty, not a designer's preference.
2. **It reuses the parent's ladder** — a tighter radius still comes from the
   radius ladder; a smaller type size still comes from the type scale.
3. **It is documented here and expressed as a Tier 3 token** in
   [03 · Product tokens](03-tokens.md).

## What changed in the rebrand

ExportPanel previously ran an entirely separate visual system. It shared no
colour, no type loading and no component styling with the public site, which
meant a customer clicking "Open ExportPanel" arrived at what looked like a
different company's product.

| Before | After | Why |
| --- | --- | --- |
| Primary green `#17694f` | `--signal` for primary action | The brand has one action colour |
| Lime accent `#dce98a` / `#e8f0a1` | Removed | No basis in the identity |
| Dark green rail `#112a24`, settings bar `#13372d` | `--ink-0` | The rail is warm ink |
| Green-tinted neutrals `#f5f7f5`, `#68756f` | `--paper-2`, `--fg-3` | Neutrals are shared across surfaces |
| "EH" square letter mark | `<Logo />` monogram | The letter mark is not the identity |
| Font declared as `Manrope` but never loaded | `next/font` loads all three families | The product rendered in a fallback face |
| Body 14px, labels 8–9px | Body 13px, floor 11px | Below the accessibility density floor |
| Success/warning/danger defined separately in app and ops | Shared role tokens | Same state, same appearance, everywhere |
| Focus ring in lime | `--focus-ring` from the signal family | Focus is brand-consistent |
| Onboarding, overview and settings each with their own greens | One token layer | Three surfaces, one product |

The customer-visible content did not change. Only its expression did.

## Cross-surface consistency contract

These must be pixel-identical between `apps/web`, `apps/app` and `apps/ops`,
because they all come from `@exporthq/ui`:

- `<Logo />` — the monogram and wordmark
- `<Badge />` — the six status tones
- `<Avatar />` — the three identity tones
- `<Progress />` — the bar
- `<Card />` — the resting surface
- `<ButtonLink />` — the product button

If any surface needs one of these to look different, the requirement is wrong or
the component needs a documented variant. It is never a local override.
