# 04 · Colour

## The idea

**A white canvas, warm ink, and one signal.**

Export HQ is a white-first brand. The canvas is paper, the type is warm
near-black, and exactly one colour — safety orange — means *act* or *changed*.
Four support hues classify information; they never compete for attention.

This is a deliberate rejection of the category. Trade and logistics software is
overwhelmingly maritime blue. Our orange descends from hazard and hi-vis
signage — the visual language of the docks, warehouses and factory floors our
customers actually work in — and it is ownable in this market.

## Colour ratio

Every full-page composition should land near this distribution:

```text
  ████████████████████████████████████████████████████  70%   paper (white / near-white)
  ████████████████                                      20%   ink (type, dark rails)
  ████                                                   6%   support hues (classification)
  ██                                                     4%   signal (action + change)
```

> **The 10% rule.** If `--signal` exceeds roughly 10% of a viewport, it has
> stopped signalling. Count it in review.

## Tier 1 — Primitives

Raw values. **Never referenced directly in a component.** They exist so themes
can be swapped without touching component code.

### Signal — safety orange

| Token | Value | Notes |
| --- | --- | --- |
| `--signal-50` | `#fff4ec` | Lightest tint, hover washes |
| `--signal-100` | `#fff0e6` | Standard wash |
| `--signal-200` | `#ffd5bf` | Inverse tertiary text on ink |
| `--signal-300` | `#ffb086` | Decorative strokes on dark |
| `--signal-400` | `#ff8b4d` | — |
| `--signal-500` | `#ff6a1a` | **Core brand orange** |
| `--signal-600` | `#ff7d32` | Hover state for filled buttons |
| `--signal-700` | `#c83d00` | **Accessible text/icon orange** |
| `--signal-800` | `#9e3000` | Pressed / high-contrast needs |
| `--signal-muted` | `#d98b67` | Desaturated terracotta for cartography |

### Ink — warm neutrals

| Token | Value | Notes |
| --- | --- | --- |
| `--ink-0` | `#211813` | Darkest. Rails, inverse surfaces |
| `--ink-1` | `#2b1c15` | Dark buttons, dark banners |
| `--ink-2` | `#3a2419` | Dark hover |
| `--ink-3` | `#4a2f21` | — |
| `--ink-500` | `#5b463b` | Secondary text |
| `--ink-400` | `#80695d` | Tertiary text |
| `--ink-300` | `#a08d82` | Placeholder, disabled text |

Ink is **warm** — brown-black, never blue-black, never `#000`. Warmth is what
keeps a compliance product from feeling like a spreadsheet.

### Paper — surfaces and lines

| Token | Value | Notes |
| --- | --- | --- |
| `--paper-0` | `#ffffff` | Cards, primary canvas |
| `--paper-1` | `#fafbfc` | Recessed sections, table headers |
| `--paper-2` | `#f4f6f8` | Application canvas, inset blocks |
| `--paper-3` | `#e8edf2` | Deepest neutral fill |
| `--line` | `#e7e9ed` | Default hairline |
| `--line-strong` | `#cfd4da` | Emphasised border, outline buttons |

### Support hues

Four hues, each with a fixed **role**. The role is the contract; the hue is an
implementation detail. Each has a core, a wash and an *ink* — the ink is the only
value permitted for text.

| Role | Hue | Core | Wash | Ink (text) |
| --- | --- | --- | --- | --- |
| **Information** — data, markets, neutral facts | Tide (blue) | `#2563eb` | `#eaf1ff` | `#2f6379` |
| **Attention** — due, expiring, needs input | Ember (amber) | `#ffb020` | `#fff4d6` | `#9a5c00` |
| **Intelligence** — AI-assisted, suggested, unverified | Plum (violet) | `#a855f7` | `#f4eaff` | `#7540ad` |
| **Verified** — complete, evidenced, on track | Mint (green) | `#138a6b` | `#e8f7f2` | `#0f6d54` |
| **Risk** — overdue, blocked, failed | Flare (red) | `#b3261e` | `#fdecea` | `#b3261e` |
| **Neutral** — inert, archived, third-party | Slate | `#94a3b8` | `#f4f6f8` | `#536273` |

> **Why "Intelligence" has its own hue.** Brand principle 3 requires AI output to
> be visually distinguishable from verified fact. Plum is that distinction. It is
> never used decoratively, so its presence always means *a machine suggested
> this and a human has not confirmed it*.

### Sovereign colours (exempt)

Flag and national colours used in factual cartography — for example the
Bangladesh field green `#2f7464` with the national red `#f42a41` on the homepage
globe — are **exempt from this palette** and must be reproduced accurately. They
are data, not decoration. They may never be reused as UI colours.

## Tier 2 — Semantic roles

What components actually reference.

| Token | Resolves to | Means |
| --- | --- | --- |
| `--signal` | `--signal-500` | The action colour |
| `--signal-deep` | `--signal-700` | Accessible orange for text and icons |
| `--signal-wash` | `--signal-100` | Orange tint background |
| `--fg` | `#241913` | Primary text |
| `--fg-2` | `--ink-500` | Secondary text |
| `--fg-3` | `--ink-400` | Tertiary text, captions, labels |
| `--fg-inv` | `--paper-0` | Text on dark |
| `--fg-inv-2` / `--fg-inv-3` | `#fff0e7` / `--signal-200` | Secondary / tertiary text on dark |
| `--surface` | `--paper-0` | Default surface |
| `--surface-2` | `--paper-1` | Recessed surface |
| `--tide` `--ember` `--plum` `--mint` `--flare` `--slate` | cores | Role hues |
| `--*-wash` | tints | Role backgrounds |
| `--*-ink` | inks | Role **text** |

## Verified contrast pairs

Measured WCAG 2.1 contrast ratios. **Only pairs in this table are approved.**

| Foreground | Background | Ratio | Verdict |
| --- | --- | --- | --- |
| `--fg` `#241913` | `--paper-0` | **17.2 : 1** | AAA |
| `--fg-2` `#5b463b` | `--paper-0` | **8.8 : 1** | AAA |
| `--fg-3` `#80695d` | `--paper-0` | **5.1 : 1** | AA |
| `--fg-3` `#80695d` | `--paper-2` | **4.7 : 1** | AA (≥16px only) |
| `--signal-deep` `#c83d00` | `--paper-0` | **5.1 : 1** | AA |
| `--signal-deep` | `--signal-wash` | **4.6 : 1** | AA |
| `--ink-0` `#211813` | `--signal` `#ff6a1a` | **6.1 : 1** | AA — the button pair |
| `--tide-ink` `#2f6379` | `--tide-wash` | **5.8 : 1** | AA |
| `--ember-ink` `#9a5c00` | `--ember-wash` | **4.9 : 1** | AA |
| `--plum-ink` `#7540ad` | `--plum-wash` | **5.8 : 1** | AA |
| `--mint-ink` `#0f6d54` | `--mint-wash` | **5.7 : 1** | AA |
| `--flare` `#b3261e` | `--flare-wash` | **5.7 : 1** | AA |
| `--slate-ink` `#536273` | `--paper-2` | **5.8 : 1** | AA |
| `--paper-0` | `--ink-1` `#2b1c15` | **16.4 : 1** | AAA |
| `--signal` | `--ink-1` | **5.7 : 1** | AA — rail active state |

### Forbidden pairs

| Pair | Ratio | Why |
| --- | --- | --- |
| `#ffffff` on `--signal` | 2.9 : 1 | **Fails.** White never sits on orange. Buttons use ink. |
| `--signal` as body text on white | 2.9 : 1 | **Fails.** Use `--signal-deep`. |
| `--mint` `#138a6b` as text on white | 4.3 : 1 | **Fails at small sizes.** Use `--mint-ink`. |
| `--mint` as text on `--mint-wash` | 3.9 : 1 | **Fails.** Use `--mint-ink`. |
| Any support **core** as text | varies | Cores are for fills, strokes and dots. Text uses the `-ink`. |

> The mint correction is a real fix, not a formality: the previous green was used
> as small mono text on white in the homepage console and failed AA. `--mint-ink`
> replaces it everywhere text is involved. Cores remain for dots, bars and rings.

## Rules of use

### Signal orange

**Do**
- Primary buttons and the single most important action on a screen.
- Active navigation state, focus-adjacent emphasis, the scroll progress rail.
- "Changed since you last looked" markers.
- The monogram plate.

**Do not**
- Use it as a large background wash or full-bleed section.
- Use it to mean "error", "warning", "success" or any status.
- Use it for two competing actions in the same view.
- Set white type on it.
- Use it for a tenant's brand expression.

### Support hues

**Do**
- Classify: which stage, which owner, which kind of information.
- Pair with text and an icon, never carry meaning alone.
- Use the `-ink` value for any glyph or label.

**Do not**
- Introduce a sixth hue. If something needs a new colour, it needs a new *role*,
  and that is a change to this document.
- Use a hue outside its role because it "looks better".
- Build a categorical data-visualisation series from the status hues — use the
  neutral series in [07 · Motion, icons and imagery](07-motion-icon-imagery.md).

### Dark surfaces

Dark is a **component treatment**, not a theme. Permitted dark surfaces: the
product navigation rail, the console rail in the homepage product preview, the
dark call-to-action banner and dark buttons. Everything else stays on paper.

On dark: text is `--fg-inv`, secondary is `--fg-inv-2`, tertiary is
`--fg-inv-3`, and the accent switches from `--signal-deep` to `--signal`.

### Colour and status together

```text
✅  ● Waiting for you       colour + shape + text
❌  ●                       colour alone
❌  Waiting for you         text alone in a dense table (add the dot)
```

## Gradients

Gradients are used in exactly three places and nowhere else:

1. **Hero aurora** — two large, heavily blurred radial fields (`--signal` and
   `--tide`) at very low opacity behind the hero. Ambient, never on top of text.
2. **Scroll progress rail** — a 2 px linear gradient across the signal family.
3. **Grain overlay** — a fractal-noise texture at ≤ 5.5% opacity on editorial and
   trust sections, applied through `.has-grain`.

No gradient buttons, no gradient text, no gradient cards.

## Colour in exported and printed artefacts

- The canvas is white; ink is `--fg`.
- Signal orange survives CMYK acceptably but must never carry information alone
  in print — every signalled item repeats in text.
- Status hues print as their `-ink` values with the role word spelled out.
- Greyscale output must remain unambiguous. This is testable: print the page in
  greyscale before shipping a document template.
