# 06 · Layout, shape and elevation

## Spacing

A **4px base** with an 8px working rhythm. Every gap, pad and margin resolves to
this ladder.

| Step | Value | Typical use |
| --- | --- | --- |
| `--space-1` | 4px | Icon-to-text in dense chips |
| `--space-2` | 8px | Inside a badge, tight grid gaps |
| `--space-3` | 12px | Card internal grouping |
| `--space-4` | 16px | Card padding (product) |
| `--space-5` | 20px | Card padding (website), list rows |
| `--space-6` | 24px | Between related cards |
| `--space-8` | 32px | Between subsections |
| `--space-10` | 40px | Product page blocks |
| `--space-12` | 48px | — |
| `--space-16` | 64px | — |

Section rhythm on the website is fluid:

```css
--section: clamp(4.75rem, 8.5vw, 8.5rem);   /* between major sections */
--gutter:  clamp(20px, 4.2vw, 44px);        /* page side gutter       */
--max:     1240px;                          /* content max width      */
```

## Grid

### Website

A single centred container: `min(1240px, 100% - 2 × gutter)`.

Inside it, sections use explicit two- or three-track grids rather than a global
12-column system. The recurring proportions are:

| Pattern | Tracks | Used by |
| --- | --- | --- |
| Editorial split | `1.15fr / 0.85fr` | Section heads |
| Copy + artefact | `1.05fr / 0.95fr` | Hero, editorial, managed |
| Product stage | `1.45fr / 0.55fr` | ExportPanel showcase |
| Card grid | `repeat(auto-fit, minmax(280px, 1fr))` | Stages, coverage, industries |

### ExportPanel

A fixed rail plus a fluid content column:

```text
┌──────────┬────────────────────────────────────────────┐
│  rail    │  topbar (sticky, 64px)                     │
│  246px   ├────────────────────────────────────────────┤
│          │  content · max 1440px · 32px side padding  │
└──────────┴────────────────────────────────────────────┘
```

Primary content grid is `minmax(0, 1.75fr) / minmax(270px, 0.75fr)` — the work
column and the "what Export HQ is doing" column. That asymmetry is a brand
statement: the customer's work is the larger column, always.

## Breakpoints

| Name | Width | Behaviour |
| --- | --- | --- |
| `sm` | < 640px | Single column. Tables become stacked records. Rail becomes a sheet. |
| `md` | 640–1024px | Two-column card grids. Rail hidden behind a menu below 760px. |
| `lg` | 1024–1280px | Full layout, reduced side gutter. |
| `xl` | > 1280px | Container caps at `--max`. |

**Dense tables never scroll horizontally on a phone.** They restructure into
stacked records. This is a hard rule from the design-system brief and it is what
makes the product usable in a factory or a port.

## Shape

Radii climb with the size of the element. Nothing is fully square except
hairlines and progress fills; nothing is fully round except dots, avatars and
pills.

| Token | Value | Use |
| --- | --- | --- |
| `--r-xs` | 8px | Chips, small inputs, menu items |
| `--r-sm` | 12px | Inputs, badges' container, small cards, icon boxes |
| `--r-md` | 18px | Cards, panels, menu sheets |
| `--r-lg` | 26px | Large surfaces, product console |
| `--r-xl` | 34px | Showcase stage, hero artefact frames |
| `999px` | — | Status pills, owner chips, the skip link |

**Product radii are one step tighter than website radii.** A card is `--r-md` on
the site and `--r-sm` in ExportPanel. Same ladder, lower register.

The monogram plate radius (`9.5 / 32`) is the geometric seed of the whole ladder.

## Borders and hairlines

- Default border: `1px solid var(--line)`.
- Emphasised or interactive border: `1px solid var(--line-strong)`.
- **Structure is carried by hairlines, not shadows.** In the product, a card is a
  hairline and a white fill; elevation is reserved for things that genuinely
  float.
- Dashed borders mean "empty, add something here" — used only on the
  request-a-service card and the file drop zone.

## Elevation

Four levels. More than four means the hierarchy is wrong.

| Token | Value | Meaning |
| --- | --- | --- |
| `--shadow-xs` | `0 1px 2px rgb(25 34 50 / .05)` | A card resting on the canvas (product) |
| `--shadow-sm` | `0 1px 2px / 0 8px 22px -12px` | Website card, metric strip |
| `--shadow-md` | `0 2px 4px / 0 24px 56px -28px` | Raised panel, dark button, showcase stage |
| `--shadow-lg` | `0 42px 110px -42px / 0 14px 36px -22px` | The product console, modals, menu sheet |

Shadow colour is a cool slate (`rgb(25 34 50 / α)`) even though the ink is warm.
A warm shadow reads as a stain; a cool shadow reads as depth. This is deliberate
and is the one place the system is intentionally bi-temperature.

Sticky chrome (site header, product topbar) uses a translucent background plus
`backdrop-filter: blur(18px) saturate(1.4)` and a bottom hairline — never a
shadow.

## Z-index ladder

| Layer | Value |
| --- | --- |
| Scroll progress rail | 90 |
| Site header | 80 |
| Product topbar | 20 |
| Product rail | 30 |
| Toast / demo banner | 50 |
| Modal backdrop | 100 |
| Skip link | 200 |

Nothing invents a new z-index. If a component needs one, it is added here first.

## Density

The same component at two densities:

| Property | Website | ExportPanel |
| --- | --- | --- |
| Card padding | 24–28px | 16–20px |
| Row height | 56px+ | 44–52px |
| Control height | 46px (`--btn-h`) | 36px |
| Base font | 16px | 13px |
| Card radius | `--r-md` | `--r-sm` |
| Gap between cards | 16–24px | 10–12px |

## Touch targets

Minimum **44 × 44 px** for anything tappable, including icon-only buttons in the
product topbar and table row actions. Where the visual affordance is smaller, the
hit area is expanded with padding, not by growing the glyph.
