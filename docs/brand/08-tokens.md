# 08 · Design tokens

Tokens are the contract between this documentation and the code. If a value is
in these documents it exists as a token; if it is in a component it references a
token.

## Three tiers

Adopted from Adobe Spectrum, IBM Carbon and Twilio Paste.

```text
Tier 1 · Primitive   --signal-500: #ff6a1a        raw value, no meaning
   ↓
Tier 2 · Semantic    --signal: var(--signal-500)  a role: "the action colour"
   ↓
Tier 3 · Component   --btn-bg: var(--signal)      scoped to one component
```

**The rules:**

1. A component may reference **Tier 2 or Tier 3 only**. A raw hex or a Tier 1
   token inside a component rule is a review failure.
2. A theme (including a tenant theme) may only change **values**, never names.
3. A new Tier 2 token requires a new *role* — and a change to
   [04 · Colour](04-color.md) or the relevant identity document.
4. Tier 3 tokens live next to the component that owns them.

## Where they live

| File | Contains |
| --- | --- |
| `packages/ui/src/styles/tokens.css` | Tier 1 primitives + Tier 2 semantics, for every surface |
| `packages/ui/src/styles/base.css` | Reset, base elements, focus, a11y utilities |
| `packages/ui/src/styles/components.css` | Shared `@exporthq/ui` component styles + their Tier 3 tokens |
| `apps/web/app/globals.css` | Website Tier 3 tokens and section styles |
| `apps/app/app/globals.css` | ExportPanel Tier 3 tokens and surface styles |
| `apps/ops/app/globals.css` | Operator console Tier 3 tokens and surface styles |

All three apps import the same first three files, in this order:

```css
@import "tailwindcss";
@import "@exporthq/ui/tokens.css";
@import "@exporthq/ui/base.css";
@import "@exporthq/ui/components.css";
```

## Naming

```text
--<family>-<step>              Tier 1   --signal-500, --ink-1, --paper-2, --space-4
--<role>                       Tier 2   --signal, --fg, --line, --surface
--<role>-<modifier>            Tier 2   --signal-deep, --signal-wash, --tide-ink, --fg-2
--<component>-<property>       Tier 3   --btn-h, --panel-rail-w, --card-pad
--tenant-<slot>                Tenant   --tenant-accent, --tenant-accent-on
```

Lowercase, hyphenated, no abbreviations except the established `fg`, `bg`, `r`
(radius), `h` (height) and `pad`.

## Tier 1 — Primitives

### Colour

```css
--signal-50 --signal-100 --signal-200 --signal-300 --signal-400
--signal-500 --signal-600 --signal-700 --signal-800 --signal-muted
--ink-0 --ink-1 --ink-2 --ink-3 --ink-500 --ink-400 --ink-300
--paper-0 --paper-1 --paper-2 --paper-3
--tide-500 --tide-100 --tide-700
--ember-500 --ember-100 --ember-700
--plum-500 --plum-100 --plum-700
--mint-500 --mint-100 --mint-700
--flare-500 --flare-100
--slate-500 --slate-300
--flag-bd-green --flag-bd-red        /* sovereign, exempt */
```

### Space, shape, type, motion

```css
--space-1 … --space-16
--r-xs --r-sm --r-md --r-lg --r-xl
--font-sans --font-mono --font-display      /* injected by next/font */
--dur-1 --dur-2 --dur-3 --dur-4
--ease --ease-out
```

## Tier 2 — Semantics

### Colour roles

| Token | Role |
| --- | --- |
| `--signal` `--signal-deep` `--signal-wash` | Action, accessible action text, action tint |
| `--fg` `--fg-2` `--fg-3` | Primary / secondary / tertiary text |
| `--fg-inv` `--fg-inv-2` `--fg-inv-3` | The same three on dark |
| `--surface` `--surface-2` | Default and recessed surface |
| `--line` `--line-strong` | Hairline and emphasised border |
| `--tide` `--tide-wash` `--tide-ink` | Information |
| `--ember` `--ember-wash` `--ember-ink` | Attention |
| `--plum` `--plum-wash` `--plum-ink` | Intelligence / AI-suggested |
| `--mint` `--mint-wash` `--mint-ink` | Verified |
| `--flare` `--flare-wash` `--flare-ink` | Risk |
| `--slate` `--slate-wash` `--slate-ink` | Neutral / inert |
| `--focus-ring` | Focus outline colour |

### Type, rhythm, elevation

| Token | Role |
| --- | --- |
| `--ui` `--data` `--serif` | UI / data / display font stacks |
| `--max` `--gutter` `--section` `--header-h` | Website rhythm |
| `--shadow-xs` `--shadow-sm` `--shadow-md` `--shadow-lg` | Elevation ladder |

### Avatar tones

| Token | Role |
| --- | --- |
| `--avatar-0-bg` / `--avatar-0-fg` | Signal family |
| `--avatar-1-bg` / `--avatar-1-fg` | Tide family |
| `--avatar-2-bg` / `--avatar-2-fg` | Ember family |

Three tones cycled by index. They are identity colours, not status.

## Tier 3 — Component tokens

Declared on the component's own selector so the component is self-contained.

```css
.btn {
  --btn-h: 46px;
  --btn-bg: transparent;
  --btn-fg: var(--fg);
  --btn-radius: 10px;
}
.btn-signal { --btn-bg: var(--signal); --btn-fg: var(--ink-0); }
```

ExportPanel declares its density on `.app-shell`:

```css
.app-shell {
  --panel-rail-w: 246px;
  --panel-topbar-h: 64px;
  --panel-card-pad: 18px;
  --panel-radius: var(--r-sm);
  --panel-font: 13px;
  --panel-control-h: 36px;
}
```

## Tenant tokens

Tenants receive exactly four tokens, injected as an inline style on a scoping
element. See
[ExportPanel · Tenant branding](exportpanel/05-tenant-branding.md).

```css
--tenant-accent       /* contrast-clamped brand colour       */
--tenant-accent-on    /* readable foreground on that accent  */
--tenant-accent-wash  /* 10% tint for the identity plate     */
--tenant-mark         /* url() of an uploaded mark, or none  */
```

No other token may be overridden by a tenant. This is enforced in
`packages/ui/src/tenant.ts`, which returns only these four properties.

## Adding a token

1. Confirm no existing token expresses the role. Two tokens for one role is the
   failure this system exists to prevent.
2. Add the Tier 1 value if a new raw value is genuinely needed.
3. Add the Tier 2 semantic with a role name and document it here and in the
   relevant Level 1 doc.
4. Verify contrast for every surface the token can land on.
5. Record it in [12 · Governance](12-governance.md)'s change log.

## Deprecating a token

Never delete in place. Alias the old name to the new one for one release, mark it
deprecated in a comment with the target release, then remove.

## Retired tokens

These existed before the system was unified and have been removed. Any reference
to them is a bug.

| Retired | Replaced by | Why |
| --- | --- | --- |
| `--green` `#17694f` | `--signal` / `--mint-ink` | ExportPanel used a green primary that existed nowhere in the brand |
| `--green-soft` `#e8f3ee` | `--signal-wash` / `--mint-wash` | — |
| `#dce98a` / `#e8f0a1` (lime) | `--signal` | An accent with no basis in the identity |
| `#112a24` / `#13372d` (dark green rail) | `--ink-0` | The product rail is warm ink, not green |
| `--navy` `#17324c` | `--tide` | Unused and off-palette |
| `--amber` `#9b6512` | `--ember-ink` | Duplicate of the ember role |
| `--red` `#a64336` | `--flare` | Duplicate of the risk role |
| `--paper` `#f5f7f5` | `--paper-2` | Green-tinted neutral |
| `--muted` `#68756f` | `--fg-3` | Green-tinted neutral |
| "EH" letter mark | `<Logo />` monogram | Not the identity |
