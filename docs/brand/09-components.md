# 09 · Website components

Every component on `apps/web`. Each entry states what it is, the brand rules that
govern it, and — following Polaris — **when not to use it**.

## Buttons — `.btn`

| Variant | Class | Background | Text | Use |
| --- | --- | --- | --- | --- |
| Signal | `.btn-signal` | `--signal` | `--ink-0` | The single primary action on a section |
| Ink | `.btn-ink` | `--ink-1` | `--fg-inv` | Form submit inside a light card, where orange would compete with the section CTA |
| Outline | `.btn-outline` | transparent | `--fg` | The secondary action beside a primary |

Sizes: `.btn-sm` 40px · default 46px · `.btn-lg` 54px · `.btn-block` full width.

**Rules**

- Text is ink on orange. **Never white on orange** (2.9:1 — fails).
- Exactly one `.btn-signal` per viewport-height of page.
- Hover lifts `-2px`; it never scales or changes hue family.
- A trailing `ArrowRight` means "continues here"; `ArrowUpRight` means "leaves
  here". Icon size 15–17, stroke 2.2.
- Minimum touch target 44px — met by every size including `.btn-sm`.

**Do not use** a button for navigation between page sections where a `.text-link`
is honest, or two signal buttons side by side.

## Text link — `.text-link`

Inline `--signal-deep` label with a trailing arrow. Underline appears on hover.
`.text-link-inv` for dark surfaces switches to `--signal`.

**Do not use** inside body prose — prose links are underlined in `--signal-deep`
without an arrow.

## Header — `.site-header`

Sticky, 72px, translucent `--paper-0` at 90% with `blur(18px) saturate(1.4)`, and
a bottom hairline tinted 18% toward `--signal`.

Contains: lockup (links to `#top`) · nav · sign-in text link · one `.btn-signal
.btn-sm` · a `<details>` menu below 900px.

**Rules**

- Nav items are sentence case, `--fg-2`, with a `--signal` underline that grows
  from the left on hover.
- The header never gains a shadow — the hairline plus blur is the whole
  treatment.
- The mobile menu is a `<details>`/`<summary>` disclosure so it works without
  JavaScript.

## Hero — `.hero`

Two-column: copy left, product artefact right. Behind it, `.hero-canvas` holds
two blurred aurora fields (`--signal`, `--tide`) and a fade.

**Rules**

- The h1 is the only display-scale headline on the page above the fold.
- The eyebrow carries the `--signal` dot.
- Two actions maximum: one `.btn-signal`, one `.btn-outline`.
- Proof list is three items, each with a `Check` at stroke 2.6.
- Aurora opacity must never make text drop below AA.

## Ribbon — `.ribbon`

A continuous marquee of the capabilities Export HQ covers, mono, uppercase, with
`--signal` dots between items. Duplicated in the DOM to loop seamlessly and
marked `aria-label`led as a group.

**Rules:** pauses on hover; disabled under reduced motion; never carries a link.

## Product showcase — `.workspace-showcase` + `.console`

The rendered ExportPanel surface, framed in a `--r-xl` stage with three benefit
cards beside it.

**Rules**

- The console is **the real design language of the product**, not a stylised
  illustration. When ExportPanel changes, this changes.
- The console rail is `--ink-0` with a `--signal` active state — identical to the
  real product rail.
- All numbers are illustrative and the `<figcaption>` says so.
- The three benefit cards use signal / tide / mint index colours in that order.

**Do not use** a screenshot image here. It goes stale, does not translate, and
cannot respect reduced motion.

## Brief form — `.brief-form`

The qualification form. A `.form-tab` label, one full-width field, a two-up field
pair, a full-width `.btn-ink`, and a reassurance note.

**Rules**

- Labels are always visible; placeholders are examples, never labels.
- Focus is `--signal-deep` border plus a 4px `rgb(255 106 26 / .14)` ring.
- The submit button is `.btn-ink`, not `.btn-signal` — the section already has an
  orange presence and the form should feel like a considered step, not a
  conversion trap.
- Never mark fields with `*`; mark optional fields in the label instead.

## Stage and coverage cards — `.stage-card`, `.coverage-card`

Numbered cards with an index, an icon box, a heading, body copy and either an
outputs list or a "Learn more" link.

**Rules**

- The card index is mono, `--fg-3`.
- Icon boxes cycle the role hues by position: signal → tide → ember → plum → mint
  → slate. This makes a row of five read as a sequence.
- `.stage-card` carries a `--progress` custom property that draws a top rule
  showing position in the sequence.
- `.coverage-card` is an `<a>` and needs an `aria-label` because "Learn more" is
  not a unique link name.

## Plan card — `.plan-card`

The shared action plan. Rows of owner chip + copy + status pill.

**Rules**

- Owner chips are `You` (ember) / `HQ` (signal) / `3P` (tide). These three are
  fixed across the whole brand.
- Status pills use role washes with `-ink` text and always spell the state.
- The footer live dot uses `--mint`, with the word "online" beside it.

## Process accordion — `.process-list`

Exclusive `<details name="export-process">` items. Summary shows step number,
phase, timing and a chevron that rotates on open.

**Rules:** the first item is open by default; the chevron rotation is the only
motion; panel content is a two-column grid of narrative and "what you receive".

## Industry and scenario cards

Flat cards with an icon box, heading and copy. Scenario cards add a mono type
label and a footer signal line with a `--signal` dot.

**Rules:** no hover lift on non-interactive cards — lift implies clickable.

## Trust and editorial sections

`.has-grain` sections carrying the grain texture. Two-column: statement left,
evidence list right.

**Rules:** grain never exceeds 5.5% opacity and never sits over the product
console.

## FAQ — `.faq-list`

Independent `<details>` items, chevron on the right, answer in `--fg-2` at
`70ch`.

**Do not use** for content the user must read — anything essential goes in the
open page.

## Final CTA — `.final-cta`

The closing section with an `Atlas` route diagram behind it, an eyebrow, a
display headline, a lead, one `.btn-signal` and one `.text-link`.

**Rules:** the atlas is `aria-hidden` and must never reduce text contrast below
AA.

## Footer — `.site-footer`

Four columns — brand + descriptor, two nav groups, contact — over a three-part
bottom bar.

**Rules:** the lockup repeats at full size; the descriptor is the approved
one-liner from [02 · Verbal identity](02-verbal.md); column headings are
`<strong>`, not headings, because they are not document structure.

## Shared primitives

| Component | Rules |
| --- | --- |
| `.eyebrow` | Mono, uppercase via `text-transform`, `--fg-3`, leading 6px `--signal` dot. `tone="light"` for dark surfaces. |
| `.data-label` | Mono micro-label with no dot. Used inside cards and the console. |
| `.section-head` | `1.15fr / 0.85fr` grid: heading block left, note right. `.section-head-stack` collapses to one column. |
| `.tick-list` / `.point-list` | Check or icon plus text. Icons are `aria-hidden`; the text carries the meaning. |
| `.skip-link` | Fixed, `--signal` on `--ink-0`, appears on focus. Always the first focusable element. |
| `.scroll-rail` | 2px gradient progress bar, scroll-timeline driven, reduced-motion aware. |

## Component checklist

Before a new website component ships:

- [ ] Uses Tier 2/3 tokens only — no raw hex, no Tier 1
- [ ] Contrast verified for every text pair it can produce
- [ ] Keyboard reachable, visible focus, logical tab order
- [ ] Status conveyed by text as well as colour
- [ ] Works at 320px and at 200% zoom
- [ ] Respects `prefers-reduced-motion`
- [ ] Icons either labelled or `aria-hidden`
- [ ] Documented here, including "do not use"
