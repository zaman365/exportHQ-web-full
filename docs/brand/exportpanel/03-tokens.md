# 03 · ExportPanel product tokens

ExportPanel adds a **Tier 3 layer** on top of the shared foundation. It adds no
Tier 1 primitives and no Tier 2 semantics — everything here resolves to a token
that already exists in `packages/ui/src/styles/tokens.css`.

## Density tokens

Declared on `.app-shell` (and `.onboarding-page`, `.settings-page`) so the whole
product inherits one density in one place.

```css
.app-shell {
  /* geometry */
  --panel-rail-w:      246px;
  --panel-topbar-h:    64px;
  --panel-max:         1440px;
  --panel-gutter:      32px;

  /* rhythm */
  --panel-card-pad:    18px;
  --panel-row-h:       52px;
  --panel-control-h:   36px;
  --panel-gap:         12px;

  /* shape */
  --panel-radius:      var(--r-sm);   /* 12px cards   */
  --panel-radius-sm:   var(--r-xs);   /*  8px chips   */

  /* type */
  --panel-font:        13px;
  --panel-font-sm:     12px;
  --panel-font-label:  11px;          /* mono, uppercase — the floor */
  --panel-font-h1:     clamp(22px, 3vw, 30px);
  --panel-font-h2:     17px;
  --panel-font-h3:     13px;
}
```

**`--panel-font-label` is the floor.** Nothing in the product renders smaller.

## Surface tokens

```css
--panel-canvas:   var(--paper-2);    /* the page behind the cards */
--panel-surface:  var(--paper-0);    /* the cards                 */
--panel-inset:    var(--paper-1);    /* table heads, insets       */
--panel-line:     var(--line);
--panel-shadow:   var(--shadow-xs);
```

## Rail tokens

The navigation rail is the only large dark surface in the product.

```css
--rail-bg:          var(--ink-0);
--rail-fg:          var(--fg-inv);
--rail-fg-muted:    #c9b7ad;                     /* 8.5:1 on --ink-0 */
--rail-fg-subtle:   rgb(255 255 255 / 0.42);
--rail-line:        rgb(255 255 255 / 0.10);
--rail-hover:       rgb(255 255 255 / 0.07);
--rail-active-bg:   rgb(255 106 26 / 0.16);
--rail-active-fg:   var(--signal);
--rail-active-bar:  var(--signal);               /* 2px inset marker */
```

The active navigation item is the **only** place `--signal` appears in the rail.
That is what makes "where am I" instantly readable.

## Control tokens

```css
--ctl-h:        var(--panel-control-h);
--ctl-radius:   var(--panel-radius-sm);
--ctl-border:   var(--line-strong);
--ctl-bg:       var(--paper-0);
--ctl-focus:    var(--signal-deep);
--ctl-focus-ring: 0 0 0 3px rgb(255 106 26 / 0.16);
```

## Button mapping

| Product class | Background | Text | Meaning |
| --- | --- | --- | --- |
| `.button--primary`, `.settings-button--primary` | `--signal` | `--ink-0` | The one primary action in the view |
| `.button--secondary`, `.settings-button--secondary` | `--paper-0` + `--line-strong` | `--fg` | Everything else |
| `.button--ghost`, `.text-button` | transparent | `--signal-deep` | Inline, low-emphasis |
| `.settings-button--soft` | `--signal-wash` | `--signal-deep` | Repeated row-level action |
| `.settings-button--danger-ghost`, `.text-button.danger` | transparent | `--flare` | Destructive |

**Ink on orange, never white on orange** — the same rule as the website.

## Status mapping

The product's five badge tones map to the parent's roles:

| Badge tone | Role | Wash | Ink |
| --- | --- | --- | --- |
| `neutral` | Neutral | `--slate-wash` | `--slate-ink` |
| `info` | Information | `--tide-wash` | `--tide-ink` |
| `warning` | Attention | `--ember-wash` | `--ember-ink` |
| `danger` | Risk | `--flare-wash` | `--flare-ink` |
| `success` | Verified | `--mint-wash` | `--mint-ink` |

Task statuses resolve through this table and nowhere else:

```text
todo                 → neutral
in_progress          → info
waiting_customer     → danger      (it is blocking, and it is yours)
waiting_export_hq    → warning
waiting_third_party  → neutral
completed            → success
blocked              → danger
```

## Tenant tokens

Four, and only four. Injected as an inline style on a scoping element by
`tenantTheme()` in `packages/ui/src/tenant.ts`.

```css
--tenant-accent        /* contrast-clamped against --paper-0 */
--tenant-accent-on     /* readable foreground on the accent  */
--tenant-accent-wash   /* 10% tint                           */
--tenant-mark          /* url(...) or none                   */
```

Full rules: [05 · Tenant branding](05-tenant-branding.md).

## Forbidden in the product layer

- Declaring a new Tier 1 or Tier 2 token in an app CSS file.
- A raw hex outside the four rail-alpha values above (which are opacity
  compositions on `--ink-0`, not new hues).
- A radius, spacing or type value not derived from the ladder.
- `!important`, except in the two legacy places already annotated in the CSS and
  scheduled for removal.
