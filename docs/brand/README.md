# Export HQ brand system

This directory is the single source of truth for how Export HQ looks, sounds and
behaves — across the public website, the ExportPanel customer product, the
operator console, and every document or export the platform produces.

It is written to be read by designers, engineers and AI agents. Every rule is
stated as a decision, not a preference, and every visual decision resolves to a
**design token** that exists in code.

## Hierarchy

The system has four levels. A lower level may never contradict a higher one.

```text
Level 0 — Foundation      Why the brand exists, what it stands for, how it speaks
Level 1 — Core identity   Logo, colour, type, space, motion, iconography
Level 2 — Token contract  The machine-readable expression of Level 1
Level 3 — Surfaces        Website · ExportPanel · Operator console · Tenant brand
```

## Documents

### Level 0 — Foundation

| Doc | Covers |
| --- | --- |
| [00 · Benchmark research](00-research-benchmark.md) | Twenty reference brands, what we take from each, what we reject |
| [01 · Brand foundation](01-foundation.md) | Positioning, personality, promise, brand principles |
| [02 · Verbal identity](02-verbal.md) | Voice, tone, naming, capitalisation, microcopy |

### Level 1 — Core identity

| Doc | Covers |
| --- | --- |
| [03 · Logo and identity](03-identity.md) | Monogram, wordmark, lockups, clearspace, misuse, co-branding |
| [04 · Colour](04-color.md) | Palette, roles, ratios, accessible pairs, forbidden uses |
| [05 · Typography](05-typography.md) | Typefaces, scale, weights, numerals, pairing rules |
| [06 · Layout, shape and elevation](06-layout.md) | Grid, spacing, radii, borders, shadow ladder |
| [07 · Motion, icons and imagery](07-motion-icon-imagery.md) | Easing, durations, icon rules, illustration, cartography |

### Level 2 — Token contract

| Doc | Covers |
| --- | --- |
| [08 · Design tokens](08-tokens.md) | Three-tier token architecture, naming, where tokens live in code |

### Level 3 — Surfaces

| Doc | Covers |
| --- | --- |
| [09 · Website components](09-components.md) | Every component on the public site |
| [10 · Page composition](10-pages.md) | Section rhythm, page archetypes, ordering |
| [11 · Accessibility](11-accessibility.md) | Contrast, focus, motion, semantics, testing |
| [12 · Governance](12-governance.md) | Versioning, review checklist, definition of done |
| [ExportPanel →](exportpanel/README.md) | The product brand and its tenant white-label layer |

## The one-paragraph version

Export HQ is a **white-canvas, warm-ink, single-signal** brand. One high-energy
safety orange (`--signal`) carries action and attention; everything else is warm
near-black ink on white paper, with four muted support hues that classify
information rather than decorate it. Display type is a friendly grotesque, UI
type is compact and highly legible, and monospace is reserved for operational
data. The public site is expressive; the product is quiet. They are the same
brand at two volumes.

## Where the system lives in code

| Concern | File |
| --- | --- |
| Tier 1 + Tier 2 tokens | `packages/ui/src/styles/tokens.css` |
| Reset, base elements, a11y utilities | `packages/ui/src/styles/base.css` |
| Shared component styles | `packages/ui/src/styles/components.css` |
| Shared brand components (monogram, wordmark) | `packages/ui/src/brand.tsx` |
| Tenant theming helper | `packages/ui/src/tenant.ts` |
| Website surface styles | `apps/web/app/globals.css` |
| ExportPanel surface styles | `apps/app/app/globals.css` |
| Operator console surface styles | `apps/ops/app/globals.css` |
