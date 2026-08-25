# 07 · Motion, icons and imagery

## Motion

### Principle

**Motion explains, it never entertains.** Every animation answers one of three
questions: *where did this come from*, *what changed*, or *how far along am I*.
If it answers none of them, delete it.

### Easing and duration

| Token | Value | Use |
| --- | --- | --- |
| `--ease` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | The house curve — everything unless stated |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Elements entering the viewport |
| `--dur-1` | `120ms` | Colour, opacity, small state changes |
| `--dur-2` | `200ms` | Hover, focus, toggles |
| `--dur-3` | `320ms` | Panels, disclosure, menu sheets |
| `--dur-4` | `600ms` | Scroll-linked reveals |

Nothing exceeds 600ms. Nothing bounces, overshoots or springs.

### The permitted motions

| Motion | Where | Spec |
| --- | --- | --- |
| **Scroll rail** | Top of the site, 2px | `scaleX` driven by `animation-timeline: scroll(root block)` |
| **Section reveal** | `[data-reveal]` blocks | 28px rise + fade, `animation-timeline: view()`, range `entry 6% cover 24%` |
| **Lift** | Buttons and cards on hover | `translateY(-2px)` over `--dur-2`; never scale |
| **Underline grow** | Header nav | `scaleX(0 → 1)` from the left, `--dur-2` |
| **Ribbon marquee** | Service ribbon | Linear, continuous, pauses on hover |
| **Aurora drift** | Hero background | Very slow, very low opacity, blurred beyond recognition |
| **Route pulse** | Globe destination dots | Staggered, ≤ 4s cycle, decorative and `aria-hidden` |
| **Progress fill** | Bars, rings, gauges | Width or dash-offset only, `--dur-3` |
| **Toggle** | Product switches | Knob `translateX`, `--dur-2` |
| **Toast** | Product confirmations | 7px rise + fade over `--dur-2`, auto-dismiss ~3.2s |

### Forbidden

Parallax on text · scroll-jacking · auto-playing video with sound · number
count-ups on financial or compliance figures (they misrepresent precision) ·
loading skeletons that shimmer for longer than the request · anything that moves
while the user is reading.

### Reduced motion

`@media (prefers-reduced-motion: reduce)` must:

- disable smooth scrolling,
- disable scroll-linked reveals and the marquee,
- disable pulses and drifts,
- keep instantaneous state changes (a toggle still moves, in 0ms),
- **never** hide content that only appears after an animation.

Scroll-linked animations are already wrapped in
`@media (prefers-reduced-motion: no-preference)`; keep new ones there too.

## Iconography

### The set

**Lucide**, used exclusively. No mixing icon libraries, no one-off SVGs for
concepts Lucide already covers.

| Property | Value |
| --- | --- |
| Stroke width | `1.7` at 18–24px · `1.8–1.9` at 15–17px · `2.2` for arrows in buttons and links · `2.6` for the small check in tick lists |
| Sizes | `13, 14, 15, 16, 17, 18, 19, 20, 21` — pick from the ladder, never arbitrary |
| Colour | `currentColor` always. Never a hard-coded fill. |
| Alignment | Optically centred, never baseline-aligned to text |

### Icon boxes

An icon that represents a *category* sits in a rounded box: `--r-sm`, wash
background, `-ink` foreground. The wash/ink pair comes from the role hue, and the
role is assigned by position in the sequence (see `.card-icon` rules), so a
five-card row reads as five distinct stages rather than five identical cards.

### Meaning is fixed

Once an icon means something, it means only that thing across all three apps.

| Icon | Means |
| --- | --- |
| `ShieldCheck` | Compliance, requirements, evidence |
| `Target` | Market selection, opportunity |
| `UsersRound` / `Users` | Buyers, members, team |
| `PackageCheck` / `Package` | Product, trade execution |
| `TrendingUp` / `Gauge` | Performance, health, readiness |
| `FolderLock` / `LockKeyhole` | Private documents, restricted access |
| `Sparkles` | An Export HQ service request — **never** "AI magic" |
| `AlertTriangle` | Risk or a demo/preview warning |
| `ArrowUpRight` | Leaves this surface (external or another app) |
| `ArrowRight` | Continues within this surface |

The `ArrowRight` / `ArrowUpRight` distinction is load-bearing: it is how a user
knows whether a link keeps them in the workspace.

### Decorative vs meaningful

Any icon that is the only carrier of meaning needs an accessible name. Any icon
that repeats adjacent text gets `aria-hidden="true"`. There is no third case.

## Imagery

### Photography

Export HQ does not use stock photography of handshakes, boardrooms, containers at
sunset, or people pointing at laptops. If photography is used at all it is:

- real customer facilities, products or shipments, with permission and credit;
- shot in available light, no heavy grade;
- never the background for text — it sits in a bounded frame with a hairline.

### Product imagery is the hero

The strongest asset we have is the real interface. The homepage leads with a
rendered ExportPanel surface rather than an illustration, because the promise is
"you can see your export operation" and the proof is seeing it.

Product imagery rules:

- Use real component markup rendered in the page, not a screenshot image, wherever
  possible — it stays sharp, translates, and respects reduced motion.
- Never show fabricated numbers alongside a real customer's name.
- Any illustrative surface carries a caption (visually hidden is fine) describing
  what it shows.
- The demo/preview banner stays visible on any surface showing demo data.

### Diagrams and cartography

Maps are **data, not decoration.**

| Element | Treatment |
| --- | --- |
| Land | `--paper-0` fill, `--line-strong` hairline, 0.78 opacity |
| Graticule | `--line-strong`, 0.9 width, 0.36 opacity |
| Routes | `--signal-muted` dashed, with a soft offset shadow for depth |
| Ports / destinations | `--slate` for ordinary, `--signal` for hubs |
| Origin territory | Reproduced in its **sovereign colours** |
| Labels | Mono, `--fg-3`, uppercase, +0.06em |

Sovereign and flag colours are exempt from the palette (see
[04 · Colour](04-color.md)) and must be reproduced accurately. Nothing about a
map may misstate a border, a territory or a trade lane.

### Texture

One texture exists: a fractal-noise grain at ≤ 5.5% opacity, applied via
`.has-grain` to the editorial, trust and final-CTA sections. It sits behind
content at `z-index: 0` with content lifted to `z-index: 1`. It is never applied
to the product.

## Data visualisation

Charts follow the same law as colour: **role first, hue second.**

- **Progress and readiness** — a single bar or ring in `--signal` on `--paper-3`.
  Score rings use `--signal` up to the current value and `--paper-3` after.
- **Comparison series** — the neutral sequence
  `--ink-1 → --slate → --line-strong`, with `--signal` reserved for the series the
  user is acting on. Never colour a chart with the status hues.
- **Status distribution** — this is the one case where the role hues *are* the
  encoding, and the legend must spell out each role in text.
- Axes and gridlines are `--line`; labels are mono `--fg-3`.
- Every chart has a text alternative — a table, a summary sentence, or both.
- No 3D, no gradients, no donut with more than four segments.

## Third-party marks in-product

Integration and provider logos keep their own brand colour inside a fixed
`46 × 46` plate at `--r-sm`. That plate is the **only** place a non-Export HQ
brand colour appears in the product chrome. The surrounding row — labels, status,
buttons — stays entirely on Export HQ tokens.
