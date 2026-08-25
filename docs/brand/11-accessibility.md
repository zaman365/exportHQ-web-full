# 11 · Accessibility

Accessibility is a brand requirement, not a compliance chore. Export HQ's promise
is that a company can always see where it stands — that promise fails if the
person reading cannot.

**Baseline: WCAG 2.1 AA across the website, ExportPanel and the operator
console.**

## Colour and contrast

- Body and small text: **≥ 4.5 : 1**. Large text (≥ 24px, or ≥ 19px bold):
  **≥ 3 : 1**. Non-text UI (borders of inputs, icon-only controls, chart marks):
  **≥ 3 : 1**.
- Only the pairs listed in [04 · Colour](04-color.md) are approved. Two are
  explicitly forbidden and are the most likely mistakes: **white on `--signal`**
  and **`--mint` as small text**.
- Colour never carries meaning alone. Every status has a word; most have an icon
  or a shape as well.
- Greyscale test: apply a greyscale filter to any screen. If anything becomes
  ambiguous, the screen is not done.

## Focus

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
  border-radius: 4px;
}
```

- `--focus-ring` is `--signal-deep` on light surfaces and `--signal` on dark.
- Focus is **never** removed, and `outline: none` without a replacement is a
  review failure.
- Focus order follows visual order. Modals trap focus and return it to the
  trigger on close.
- The skip link is the first focusable element on every page.

## Semantics

- One `<h1>` per page; heading levels never skip.
- Landmarks: `header` / `nav` / `main` / `aside` / `footer`, each labelled where
  more than one of a kind exists.
- Lists are lists. Tables that carry tabular data use table semantics — the
  product's `role="table"` grids must keep `role="row"` and header association.
- `<details>`/`<summary>` for disclosure, so it works without JavaScript.
- Buttons perform actions; links navigate. A `<div>` with an onClick is a defect.

## Names and descriptions

- Icon-only controls carry `aria-label` naming the *action*: "Open navigation
  menu", not "menu icon".
- Decorative icons and illustrations carry `aria-hidden="true"`.
- Meaningful SVGs use `role="img"` with `<title>` and, where they encode data,
  `<desc>` — as the homepage globe does.
- Repeated link text ("Learn more") requires a distinguishing `aria-label`.
- Progress bars expose their value in the accessible name
  (`aria-label="Germany readiness: 74%"`).

## Forms

- Every control has a visible, persistent label. Placeholders are examples only.
- Errors are text next to the field, referenced by `aria-describedby`, and never
  colour-only.
- Required state is communicated in the label, not by an asterisk alone.
- Grouped controls use `fieldset`/`legend`.
- Autocomplete attributes on name, email, organisation and country fields.

## Motion

- Everything in [07 · Motion](07-motion-icon-imagery.md) degrades under
  `prefers-reduced-motion: reduce`.
- No content may be reachable only after an animation completes.
- Nothing auto-plays for more than 5 seconds without a pause control — the
  ribbon marquee pauses on hover and stops entirely under reduced motion.
- No flashing above 3 Hz anywhere, ever.

## Zoom and reflow

- 200% zoom with no horizontal scrolling at 1280px width.
- 320px viewport with no horizontal scrolling.
- Text can scale to 200% without clipping — this is why fixed pixel heights on
  text containers are avoided in favour of `min-height`.

## Density minimums

The product's earlier 7–9px labels are out of specification. Floors:

| Surface | Minimum |
| --- | --- |
| Website | 12px, and only for mono micro-labels |
| ExportPanel / ops | 11px, and only for mono micro-labels |
| Anything a user reads as a sentence | 13px |

## Touch and pointer

- 44 × 44px minimum for every interactive target, achieved with padding where the
  glyph is smaller.
- Hover-only affordances always have a focus and touch equivalent.
- Nothing depends on a specific pointer type, hover, or a drag gesture without a
  keyboard alternative.

## Language and direction

- `lang` is set on `<html>` and on any element in another language.
- Layouts use logical properties (`inset-inline`, `padding-block`,
  `margin-inline`) so a future RTL locale does not require a rewrite.
- Dates and numbers are formatted with `Intl`, never hand-assembled.

## Testing

**Every change:**

- [ ] Keyboard-only pass of the changed surface
- [ ] Contrast check of every new colour pair
- [ ] Greyscale check
- [ ] 320px and 200% zoom
- [ ] Reduced-motion pass

**Every release:**

- [ ] axe or equivalent automated scan, zero criticals
- [ ] Screen reader smoke test — VoiceOver on Safari, NVDA on Firefox
- [ ] Tab through the entire homepage and the ExportPanel overview
- [ ] Print / PDF check of any document template that changed

Automated tools catch roughly a third of real issues. The keyboard pass is the
one that matters most.

## Known corrections carried by this system

| Issue | Correction |
| --- | --- |
| `--mint` `#138a6b` used as small text — 3.9 : 1 on its wash | `--mint-ink` `#0f6d54` — 5.7 : 1 |
| ExportPanel labels at 7–9px | Floors raised to 11px minimum, 13px for prose |
| Four near-identical ambers drifting across surfaces | Consolidated to `--ember-ink` |
| Product focus ring in an off-brand lime | `--focus-ring` from the signal family |
| Product body text at 14px with 9px metadata | 13px body, 12px metadata |
