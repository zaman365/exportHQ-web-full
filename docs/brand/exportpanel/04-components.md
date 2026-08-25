# 04 · ExportPanel components

Every surface in `apps/app`. Each entry gives the rule and, where it matters,
when not to use it.

## Shell — `.app-shell`

```text
┌──────────┬──────────────────────────────────────────────┐
│  rail    │  topbar · sticky · 64px                      │
│  246px   ├──────────────────────────────────────────────┤
│  --ink-0 │  content · max 1440px · 32px gutter          │
│          │                                              │
│          │  legal footer                                │
└──────────┴──────────────────────────────────────────────┘
```

Below 760px the rail becomes a menu and the content takes the full width. The
topbar gains a home button back to the public site.

## Navigation rail — `.sidebar`

Order: lockup → organisation switcher → public-site link → grouped navigation →
specialist team panel.

**Rules**

- Background `--rail-bg` (`--ink-0`). Never green, never a tenant colour.
- Idle items `--rail-fg-muted`; hover adds `--rail-hover`; the active item gets
  `--rail-active-bg`, `--rail-active-fg` and a 2px inset `--signal` bar.
- Group labels are mono, uppercase, 11px, `--rail-fg-subtle`.
- The lockup links to the public website — the product is not a walled garden.
- The team panel is the brand's proof of the managed-service model. It shows the
  live dot, the assigned specialists, the response time and one message action.
  **It never collapses away**, even on mobile, where it moves into the menu.

**Do not** add a sixth navigation group. Beyond five, use a section landing page.

## Organisation switcher — `.org-switcher`

The tenant's identity. Mark + trading name + plan descriptor + chevron.

**Rules**

- The mark uses `--tenant-mark` if the tenant uploaded one, otherwise initials on
  `--tenant-accent`.
- This is **tenant slot 1 of 4**. The rest of the rail stays Export HQ.
- The organisation name is `--fg-inv` at 13px — it is the second most important
  identity on screen after the lockup.

## Topbar — `.topbar`

Search · help · notifications · user menu. Translucent `--paper-0` with
`blur(12px)` and a bottom hairline.

**Rules**

- Search is a button that opens a command palette, labelled with its shortcut.
- The notification dot is `--flare` with a `--paper-0` ring — it is the only
  always-on coloured dot in the topbar.
- Icon-only buttons are 44px targets with `aria-label`s.

## Welcome block — `.welcome`

Mono date eyebrow → greeting `h1` → one-line orientation → up to two actions.

**Rules:** exactly one `.button--primary`; the date is mono and includes the day
name because operational users work to weekly rhythms.

## Health cards — `.score-grid`

Three cards: export health with a score ring, readiness by area, setup progress.

**Rules**

- The score ring is a conic gradient: `--signal` up to the value, `--paper-3`
  after. The numeral is mono-tabular.
- Readiness bars are `--signal` on `--paper-3`, each with an accessible name
  including the percentage.
- Setup progress uses a `warning` badge when steps remain, `success` when
  complete — never a nag.

**Do not** animate the score on load. A compliance figure that counts up
misrepresents its precision.

## Metric strip — `.metric-strip`

Four figures in one bordered row: label (mono, uppercase) · value (mono-tabular,
24px) · meta (12px, `--fg-3`).

**Rules:** exactly four; a fifth means the strip is the wrong component. On
mobile it becomes 2 × 2, never a horizontal scroll.

## Action centre — `.ownership-tabs` + `.task-list`

The spine of the product.

**Rules**

- The three tabs are always **Waiting for you · Export HQ · Third party**, in
  that order, each with a count. Ownership is the primary axis, not status.
- The active tab is `--signal-deep` with a `--signal` underline.
- Every task row shows: complete affordance · title · status badge · description ·
  due date · owner · related entity. If a row cannot show all seven, the data is
  incomplete, not the design.
- The checkbox is 21px with a 44px hit area.
- `waiting_customer` is `danger`, not `warning` — it is blocking and it is yours.

## Managed work column — `.work-panel`

What Export HQ is doing, beside what the customer is doing.

**Rules**

- Each card: icon box · status badge · title · one-line progress · progress bar or
  mini-stat · assigned avatars · next update.
- The named specialists are mandatory. Anonymous managed work defeats the model.
- The request-a-service card is the only dashed border in the product — dashed
  means "empty, add something here".

## Product table — `.product-table`

Product × market readiness.

**Rules**

- Header row: mono, uppercase, 11px, on `--paper-1`.
- The product thumbnail is an icon box, not an image — we do not have reliable
  product photography and a broken image is worse than a glyph.
- Readiness is a bar plus a tabular percentage; the bar alone is not enough.
- **Below 760px the table becomes stacked records.** It never scrolls
  horizontally.

## Requirement cards — `.requirement-card`

Status badge · category · jurisdiction · title · evidence line · source link ·
verified date.

**Rules**

- The source link and the verified date are **required**. A requirement without
  provenance may not render — this is brand principle 3 expressed as a component
  contract.
- External source links open in a new tab with `rel="noreferrer"` and an
  `ArrowUpRight`.

## Documents and activity — `.document-list`, `.activity-list`

**Rules:** every document shows category and what it is linked to; every activity
entry shows actor, action and time. `missing` is `danger`, `approved` is
`success`, everything else is `info`.

## Team banner — `.team-banner`

Dark `--ink-1` band naming the assigned specialists with one message action.

**Rules:** the button is `--signal` on `--ink-0`; the eyebrow is mono uppercase
`--fg-inv-3`. This is the closing accountability statement of the overview.

## Demo banner — `.demo-banner`

Fixed, bottom-right, `--ink-1`, with an `AlertTriangle` in `--ember`.

**Rules:** it must appear on any surface rendering demo data, and it must be
dismissible. Removing it while demo data remains is a brand and trust failure.

## Onboarding — `.onboarding-page`

Left: intent and step list. Right: the form card.

**Rules**

- The topbar is `--ink-0` with a back link to the workspace.
- Completed steps show a `Check`; the current step is `--signal`; future steps are
  `--line-strong` outlines.
- Every field has a visible label; helper text sits below in `--fg-3`.
- The drop zone is dashed `--line-strong` on `--paper-1`, with the accepted types
  and size limit stated.
- The success panel uses `--mint-wash`/`--mint-ink` and states exactly what was
  created and who owns each part.

## Settings — `.settings-page`

Six sections: integrations · security · organization · members · audit · export.

**Rules**

- The settings topbar is `--ink-0`, matching the rail, so settings reads as
  product chrome rather than a separate app.
- Section navigation active state is `--signal-wash` background with
  `--signal-deep` text and a revealed chevron.
- **Integration marks keep their own brand colour** inside a fixed 46px plate.
  That plate is the only third-party colour in the product, and the surrounding
  row stays entirely on Export HQ tokens.
- Toggles are 38 × 22px, `--line-strong` when off, `--signal` when on, with a
  `role="switch"` and an accessible name.
- Read-only state is an `--ember` banner naming who *can* make the change.
- The danger zone is a bordered card with `--flare` iconography; destructive
  buttons are `--flare` text on transparent, never a filled red button — a filled
  destructive button invites the misclick it warns about.
- Audit categories map to role hues: security → attention, member → information,
  integration → verified, export → intelligence, organization → neutral.
- The toast is `--ink-1` with a `--mint` check, bottom-right, ~3.2s, `role="status"`.

**Do not** put a tenant colour anywhere in settings. It is chrome.

## Shared `@exporthq/ui` components

Identical across ExportPanel and the operator console.

| Component | Rules |
| --- | --- |
| `<Logo />` | Monogram + wordmark. `compact` hides the wordmark. Colour adapts to the surface via `--wordmark-fg`. |
| `<Badge tone>` | Six tones from the role table. Sentence case, 11px, pill radius. |
| `<Avatar initials tone>` | 30px circle, three tones cycled by index. Identity, never status. `aria-hidden` — the name is beside it. |
| `<Progress value label>` | 5px bar, `--signal` fill on `--paper-3`, clamped 0–100, accessible name includes the percentage. |
| `<Card>` | `--paper-0`, `--line` hairline, `--panel-radius`, `--shadow-xs`. |
| `<ButtonLink variant>` | Primary / secondary / ghost per the button mapping. |

## Product checklist

- [ ] Tier 2/3 tokens only
- [ ] Nothing below 11px; prose at 13px
- [ ] One `--signal` action per view; rail active state is the only other orange
- [ ] Every work row shows owner, state and next step
- [ ] Every compliance claim shows source and date
- [ ] Tables restructure rather than scroll at 760px
- [ ] Icon-only controls have 44px targets and labels
- [ ] Demo data labelled
- [ ] Tenant colour confined to the four documented slots
