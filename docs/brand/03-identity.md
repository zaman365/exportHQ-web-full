# 03 · Logo and identity

## The elements

The Export HQ identity has three parts. Two of them are the logo; the third is
the product mark.

```text
┌────────────────────────────────────────────────────────────┐
│  ◧  ExportHQ            ← Primary lockup (monogram + wordmark)
│  ◧                      ← Monogram alone (app icon, rail, favicon)
│  ExportHQ               ← Wordmark alone (rare: co-branded footers)
└────────────────────────────────────────────────────────────┘
```

### The monogram

A rounded-square plate in `--signal` carrying two marks:

1. A **globe** — meridian, equator and sphere — drawn as a thin ink stroke at
   55% opacity. This is the international dimension.
2. An **outbound arrow** — a heavier ink stroke running lower-left to upper-right
   with an arrowhead. This is export: movement *out* and *up*.

The globe recedes and the arrow leads. That hierarchy is the meaning of the
mark: the world is context, the movement is the product.

| Property | Value |
| --- | --- |
| Artboard | 32 × 32 |
| Plate radius | 9.5 / 32 (≈ 30% — matches `--r-sm` at default size) |
| Plate fill | `--signal` |
| Globe stroke | `--ink-0`, 1.35, opacity 0.55 |
| Arrow stroke | `--ink-0`, 2.1, round cap and join |
| Minimum size | 20 px digital · 6 mm print |
| Implementation | `packages/ui/src/brand.tsx` → `<Monogram />` |

The strokes are **ink on orange**, never white on orange. Ink-on-signal is the
identity's defining contrast pair and holds at small sizes where white would
bloom.

### The wordmark

`Export` in foreground ink + `HQ` in `--signal-deep`, set in the UI grotesque at
weight 620, tracking −0.025em, as a single word with no space.

The tint on `HQ` is the only place the wordmark carries colour. On dark
surfaces, `HQ` uses `--signal` (the brighter value) so it stays legible.

| Context | `Export` colour | `HQ` colour |
| --- | --- | --- |
| Light surface | `--fg` | `--signal-deep` |
| Dark surface (rails, dark banners) | `--fg-inv` | `--signal` |

### The primary lockup

Monogram + wordmark, horizontally aligned, gap `11px` at default scale (`0.34 ×`
monogram width). This is the default logo. Use it in headers, footers,
onboarding, documents and email.

| Variant | Monogram | Wordmark | Use |
| --- | --- | --- | --- |
| `default` | 34 px | shown | Site header, footer, onboarding, documents |
| `compact` | 30 px | hidden | Product rails, mobile headers, tight chrome |

Implementation: `packages/ui/src/brand.tsx` → `<Wordmark compact />`, re-exported
by `@exporthq/ui` as `<Logo />` so every surface renders the identical mark.

## Clearspace

Minimum clearspace on all four sides is **the height of the monogram's corner
radius × 2**, i.e. `0.6 × monogram size`. At the 34 px default that is 20 px.

```text
        ┌──────────────────────────┐
        │        20 px             │
        │   ┌──────────────────┐   │
   20px │   │ ◧  ExportHQ      │   │ 20px
        │   └──────────────────┘   │
        │        20 px             │
        └──────────────────────────┘
```

Nothing — no rule, image edge, other logo or text — enters that band.

## Placement

| Surface | Placement |
| --- | --- |
| Website header | Left, vertically centred in the 72 px header, links to `#top` |
| Website footer | Left of the footer's first column, above the descriptor line |
| ExportPanel rail | Top-left of the rail head, links to the public site |
| Operator console | Top-left of the rail, followed by an `OPS` badge |
| Documents / exports | Top-left of the first page; monogram only in running headers |
| Favicon / app icon | Monogram alone, no padding beyond the plate |

The logo is always a link to a home destination. Inside the product it links to
the public site; on the public site it links to the top of the page.

## Misuse

Never:

- Recolour the plate to anything other than `--signal`, except the single-colour
  variants below.
- Set the globe or arrow in white.
- Add a stroke, glow, bevel, gradient or drop shadow to the mark.
- Rotate, skew, stretch or condense any part.
- Re-typeset the wordmark in another face, or in caps, or with a space.
- Place the lockup on a busy photograph without a solid or scrimmed plate.
- Enclose the lockup in an additional box or pill.
- Use the monogram as a bullet, list marker or decorative texture.
- Use an old "EH" letter mark. It is retired; `<Logo />` renders the monogram.

**Permitted single-colour variants** (print, engraving, fax-grade output only):
all-ink on light, all-paper on dark. In both cases the globe keeps its 55%
opacity relationship by dropping to a lighter tint of the same colour.

## Co-branding and partner lockups

Export HQ appears alongside three kinds of third-party mark. Each has a fixed
relationship.

### 1. Tenant (customer) marks — inside ExportPanel

Governed entirely by
[ExportPanel · Tenant branding](exportpanel/05-tenant-branding.md). Summary:
the tenant mark appears in the organisation switcher and workspace header only.
Export HQ's mark is always present, always first in the reading order, and
always at equal or greater visual weight.

### 2. Partner and provider marks

Laboratories, forwarders, certifiers and advisers. Shown as a name and, where
licensed, a mark **at 80% of the Export HQ lockup height**, separated by a
hairline in `--line-strong`, with Export HQ on the left. Never combined into a
single graphic.

### 3. Regulator, standard and certification marks

Only shown when the certification genuinely applies to the artefact on screen,
always with the issuing body and effective date. Never shown in the header,
never in `--signal`, never re-drawn. A standard's mark is evidence, so it lives
next to the evidence.

## Favicon and platform icons

| Asset | Content | Background |
| --- | --- | --- |
| `favicon.svg` / `.ico` | Monogram | Transparent (plate provides the shape) |
| Apple touch icon | Monogram, plate extended to full bleed | `--signal` |
| Maskable icon | Monogram at 80% within the safe zone | `--signal` |
| `theme-color` | — | `#ff6a1a` (`--signal`) |
| Social / OG image | Lockup top-left, headline below, white canvas | `--paper-0` |

## Identity in exported documents

Every PDF, CSV header block and emailed report carries:

1. The primary lockup, top-left.
2. The customer organisation name, in ink, on the line beneath.
3. A generated-on date and the workspace it came from.

This is an accountability requirement, not a marketing one: an exported artefact
must be traceable to the record that produced it.
