# 05 · Typography

## The three voices

Export HQ uses three typefaces, each with one job. A reader should be able to
tell what kind of information they are looking at from the letterforms alone.

| Role | Face | Token | Job |
| --- | --- | --- | --- |
| **Display** | Bricolage Grotesque (variable) | `--serif` | Headlines and the product-console title. Human, slightly idiosyncratic, confident. |
| **UI** | Manrope (variable) | `--ui` | Everything a person wrote or reads as prose: body, labels, buttons, navigation. Compact, highly legible, wide language coverage. |
| **Data** | Geist Mono | `--data` | Anything a machine produced or that must align: eyebrows, IDs, metrics, codes, timestamps, stage markers. |

> The token is named `--serif` for historical reasons; the face is a grotesque.
> The name is part of the public token contract, so it stays. Read it as
> "display".

### The mono rule

Monospace is a **semantic signal**, not a style. It means *this value came from
the system, or it must line up with the value below it.*

- ✅ HS code `6205.20`, order ID, `82 / 100`, `15 Aug 2026`, stage eyebrows
- ❌ A sentence, a button label, a person's name, marketing copy

## Scale

Fluid on the marketing site, fixed in the product. Both derive from the same
ratio; the product simply starts lower.

### Website scale

| Style | Size | Weight | Tracking | Line height |
| --- | --- | --- | --- | --- |
| `.hero-title` | `clamp(2.75rem, 5.6vw, 4.6rem)` | 650 | −0.045em | 1.02 |
| `.h-display` | `clamp(2.5rem, 4.9vw, 4.1rem)` | 650 | −0.045em | 1.05 |
| `.h-section` | `clamp(1.9rem, 3.3vw, 2.85rem)` | 650 | −0.04em | 1.08 |
| Card heading (`h3`) | `1.1875rem` | 570 | −0.024em | 1.3 |
| `.lead` | `1.0625rem` | 400 | 0 | 1.68 |
| Body | `1rem` | 400 | 0 | 1.6 |
| Small / caption | `0.8125rem` | 400 | 0 | 1.55 |
| `.eyebrow`, `.data-label` | `0.6875rem` | 500 | +0.13–0.16em, uppercase | 1 |

### ExportPanel scale

| Style | Size | Weight |
| --- | --- | --- |
| Page title (`h1`) | `clamp(22px, 3vw, 30px)` | 650 |
| Section heading (`h2`) | `17px` | 620 |
| Card heading (`h3`) | `13px` | 620 |
| Body / table cell | `13px` | 400 |
| Secondary / meta | `12px` | 400 |
| Micro label, eyebrow | `10px` mono | 600, +0.12em, uppercase |
| Metric value | `24px` mono-tabular | 600, −0.03em |

> **Minimum sizes are floors, not targets.** Nothing renders below **11px** in
> ExportPanel and below **12px** on the website, and anything below 13px must be
> a label or metadata, never something a user has to read carefully. Earlier
> ExportPanel screens used 8–9px type in tables, badges and footers; that is now
> out of specification.

## Weight

The variable axes are used sparingly. Four weights only:

| Weight | Use |
| --- | --- |
| **400** | Body, descriptions, table cells |
| **500** | Mono labels, subtle emphasis |
| **560–570** | Card headings, strong table cells, stat values |
| **620–650** | Section and display headings, buttons, wordmark |

Never use 700+ on the website; the display face already carries the weight and
heavier cuts read as shouting. In the product, 700 is permitted only for the
`<strong>` inside dense list rows where 620 is not distinguishable.

## Tracking

Tracking tightens as size grows and opens as size shrinks — the standard optical
correction.

```text
4.6rem  →  −0.045em
2.85rem →  −0.040em
1.19rem →  −0.024em
1.00rem →   0
0.69rem →  +0.130em  (uppercase mono only)
```

Never letterspace lowercase body text. Uppercase is *only* ever produced by
`text-transform`, never by typing capitals.

## Measure

| Content | Max width |
| --- | --- |
| Display headline | `text-wrap: balance`, ~16ch effective |
| Lead paragraph | `56ch` |
| Section note | `44ch` |
| Body paragraph | `70ch` |
| Card description | `~40ch` (constrained by the card) |
| Table cell | unconstrained, but truncate with ellipsis rather than wrap in dense rows |

## Numerals

**All numbers that appear in a column, a metric, a score or a date use tabular
figures.**

```css
font-variant-numeric: tabular-nums;
```

This is applied globally to `.metric strong`, `.stat-value`, progress values,
table numeric cells, scores and any mono context. A readiness score that jitters
as it animates is a defect.

## Hierarchy patterns

The site and product share one heading pattern:

```text
EYEBROW            mono · uppercase · --fg-3 · with a --signal dot
Heading            display or UI · --fg
Supporting note    UI · --fg-2 · constrained measure
```

The eyebrow's leading dot is a `6px` `--signal` circle. It is the smallest
recurring use of the brand colour and it appears on every major section — this
is the thread that ties the page together.

## Language and internationalisation

- Manrope and Geist Mono cover Latin; Bricolage covers Latin. For Bengali,
  Arabic, Chinese, Japanese and Korean the display role falls back to the UI
  stack, and the UI role falls back to the platform system face.
- Never hard-code a line height in `px` on translated content — use unitless.
- Allow **35% expansion** for German and 25% for Bengali in any fixed-width chip,
  button or table header. Buttons must not truncate.
- Numerals stay Western Arabic in operational data for cross-border consistency,
  even where the UI language uses another numeral set.

## Loading

Fonts load through `next/font` with `display: swap` and are exposed as
`--font-sans`, `--font-mono`, `--font-display`. All three apps load the same
three families from the same source so the product and site are typographically
identical. `font-synthesis-weight: none` is set globally — a faux-bold fallback
is worse than a lighter weight.

## Forbidden

- A fourth typeface, including for a "special" campaign.
- Italic in the display face (it has no true italic; `em` is styled as
  `font-style: normal` with a colour or weight change instead).
- Text set in all caps by typing capitals.
- Justified text.
- Text over an image without a solid or scrimmed plate.
- Mono for prose.
