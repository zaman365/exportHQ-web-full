# Design system

The Export HQ design system is documented in full under
[`docs/brand/`](brand/README.md). Start there.

| Looking for | Read |
| --- | --- |
| Positioning, personality, principles | [Brand foundation](brand/01-foundation.md) |
| Voice, tone, naming, microcopy | [Verbal identity](brand/02-verbal.md) |
| Logo, colour, type, layout, motion | [Level 1 · Core identity](brand/README.md#level-1--core-identity) |
| Token names and where they live in code | [Design tokens](brand/08-tokens.md) |
| Website components and page patterns | [Components](brand/09-components.md) · [Pages](brand/10-pages.md) |
| The ExportPanel product surface | [ExportPanel guidelines](brand/exportpanel/README.md) |
| Customer white-labelling | [Tenant branding](brand/exportpanel/05-tenant-branding.md) |
| Contrast, focus, motion, testing | [Accessibility](brand/11-accessibility.md) |
| How to propose a change | [Governance](brand/12-governance.md) |

## The short version

Export HQ uses a calm, precise B2B visual language: a white canvas, warm
near-black ink, and one high-visibility safety orange (`--signal`) reserved for
action and change. Four support hues classify information — information,
attention, intelligence, verified — with risk and neutral completing the set.
Typography prioritises compact readability and tabular numbers; monospace is
reserved for machine-generated and column-aligned data.

Components make owner, state, next action and due date visible. Empty states
explain why the module matters and offer one meaningful action. Dense tables
become stacked records on narrow screens rather than horizontally compressed
spreadsheets.

Accessibility baseline: semantic landmarks, labelled controls, visible focus,
WCAG AA contrast, keyboard operation, reduced-motion support, and status
communicated with text as well as colour.

## Where it lives in code

| Concern | File |
| --- | --- |
| Brand tokens (Tier 1 + Tier 2) | `packages/ui/src/styles/tokens.css` |
| Reset, base elements, a11y utilities | `packages/ui/src/styles/base.css` |
| Shared component styles | `packages/ui/src/styles/components.css` |
| Identity marks | `packages/ui/src/brand.tsx` |
| Tenant theming (contrast-clamped) | `packages/ui/src/tenant.ts` |
| Website surface | `apps/web/app/globals.css` |
| ExportPanel surface | `apps/app/app/globals.css` |
| Operator console surface | `apps/ops/app/globals.css` |
