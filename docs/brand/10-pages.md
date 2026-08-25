# 10 · Page composition

## The argument the homepage makes

The public site is a single page that runs one argument. Section order is the
argument, so it is part of the brand, not a layout preference.

```text
1  Hero              What this is, and the two ways in
   Ribbon            The breadth, at a glance
2  Product showcase  Proof: here is the actual workspace
3  Brief             The low-commitment entry point, early
4  Platform          The five connected stages
5  Editorial         Why we exist (the human argument)
6  Managed           Platform + people, with the shared plan as evidence
7  Coverage          What you can start with
8  Process           What happens, week by week
9  Industries        This is not one sector
10 Scenarios         This meets you where you are
11 Trust             Confidentiality and explainability
12 Questions         Objection handling
13 Final CTA         Ask again, having earned it
   Footer
```

**Why the brief sits at position 3:** the promise is "tell us what you want to
take abroad", and burying it behind ten sections contradicts the promise. The
final CTA links back to it rather than duplicating it.

## Section rhythm

| Property | Rule |
| --- | --- |
| Vertical padding | `--section` = `clamp(4.75rem, 8.5vw, 8.5rem)` |
| Scroll offset | `calc(var(--header-h) + 8px)` on every anchored section |
| Background | `--paper-0` by default; `--paper-1` for a recessed section; `--paper-0` + `.has-grain` for editorial and trust |
| Alternation | Never more than two consecutive sections with identical background and grid |

Two adjacent sections must differ in at least one of: background, grid shape, or
the presence of an artefact. That is what stops a long page reading as a list.

## Section anatomy

Every section follows the same skeleton:

```text
<section class="section [name]" id="anchor">
  <div class="container">
    <div class="section-head" data-reveal>     ← eyebrow + heading | note
    <div class="[name]-grid" data-reveal>      ← the content
```

The `.section-head` is a `1.15fr / 0.85fr` grid: heading block left, supporting
note right, aligned to the baseline. Use `.section-head-stack` when there is no
note.

## Page archetypes

The site will grow past one page. Three archetypes cover what is coming.

### A · Argument page (homepage, solution pages)

Hero → proof → entry point → capability → evidence → objections → CTA. Display
type, artefacts, `data-reveal`, grain on one or two sections.

### B · Reference page (security, data ownership, legal, docs)

Header → title block → table of contents → body at `70ch` → contact. No hero
artefact, no grain, no display type below the h1. Reference pages earn trust by
being boring and complete.

### C · Conversion page (brief, contact, pricing enquiry)

Header → short value statement → the form → reassurance → footer. One column
under 900px. No competing calls to action anywhere on the page.

## Anchors and navigation

Anchors are stable, lowercase, single-word where possible: `#top`, `#workspace`,
`#brief`, `#platform`, `#managed`, `#capabilities`, `#process`, `#industries`.

Header navigation surfaces four: Platform · Services · Process · Who it's for.
That is the maximum — a fifth item pushes the sign-in and CTA into a crowded row
at tablet widths.

## Responsive composition

| Width | Behaviour |
| --- | --- |
| ≥ 1240px | Full grids, container capped at `--max` |
| 1024–1240px | Container flexes, gutters shrink |
| 900–1024px | Two-column grids collapse to one; artefacts move below copy |
| < 900px | Header nav collapses to the `<details>` menu |
| < 640px | Card grids single column; ribbon keeps scrolling; all fluid type at its floor |
| < 380px | Nothing may overflow horizontally. Test at 320px. |

The artefact always moves **below** its copy on collapse, never above — the
sentence explains the picture.

## Metadata and social

Every page carries:

- `title`: `<Page> — Export HQ`, except the homepage which is
  `Export HQ — The operating system for international growth`.
- `description`: the approved standard descriptor, or a page-specific version
  under 160 characters.
- `openGraph.images`: a 1536 × 1024 card on `--paper-0` with the lockup top-left.
- `themeColor`: `#ff6a1a`.
- `colorScheme`: `light`.

## Definition of done for a page

- [ ] Section order tells one argument
- [ ] Exactly one `.btn-signal` per viewport height
- [ ] Every section has an eyebrow, a heading, and either a note or an artefact
- [ ] No two consecutive sections share background *and* grid
- [ ] All anchors have scroll-margin
- [ ] Keyboard path reaches every interactive element in visual order
- [ ] 320px and 200% zoom both clean
- [ ] `prefers-reduced-motion` verified
- [ ] Metadata and OG image present
