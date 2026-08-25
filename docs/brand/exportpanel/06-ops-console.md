# 06 · Operator console

`apps/ops` is the internal surface where Export HQ specialists work across many
customer organisations. It is the same brand and the same record, viewed through
a staff lens.

## Position

| | ExportPanel | Operator console |
| --- | --- | --- |
| Audience | The customer's team | Export HQ specialists |
| Scope | One organisation | A portfolio |
| Primary axis | Ownership | Queue and risk |
| Indexed | Yes | Never — `robots: noindex, nofollow` |
| Tenant branding | Present in four slots | **Absent** |

## Inheritance

The operator console inherits **everything** ExportPanel inherits, plus every
ExportPanel adaptation. It differs in exactly four ways.

### 1. It is denser

```css
.ops-shell {
  --panel-rail-w:    215px;   /* narrower rail          */
  --panel-topbar-h:  61px;
  --panel-gutter:    28px;
  --panel-row-h:     48px;
}
```

An operator scans a portfolio; a customer reads their own workspace.

### 2. It is marked as internal

The rail lockup is followed by an `OPS` badge in the `info` tone. It appears on
every screen. There must never be ambiguity about which surface a screenshot came
from.

### 3. It shows no tenant branding

Customer organisations are identified by a **neutral company mark** — initials on
`--slate-wash` with `--slate-ink` text — not by their brand. Two reasons:

- An operator comparing eighteen accounts needs a uniform grid; eighteen brand
  colours is noise.
- Tenant colour must never influence an operator's read of risk.

### 4. It surfaces access scope

Scoped-access notices use `--tide-wash` / `--tide-ink` with a `ShieldAlert` icon
and state that access is explicit and audited. This is a brand element, not just
a UI element: it is the visible form of the promise that staff do not become
hidden customer members.

## Risk queue colouring

The one place the operator console leans harder on colour than ExportPanel does.

| Risk | Icon box | Meaning |
| --- | --- | --- |
| Overdue | `--flare-wash` / `--flare` | Past its date |
| Expiring | `--ember-wash` / `--ember-ink` | Approaching a review or expiry |
| Review | `--tide-wash` / `--tide-ink` | Waiting on an operator decision |

Still never colour alone: each carries a badge with the word.

## Customer portfolio list

**Rules**

- Health is a `<Progress>` bar plus a tabular figure — never a bare colour dot.
- The selected row is marked with a 3px inset `--signal` bar, matching the rail
  active state.
- The state badge uses the role tones, so "At risk" reads identically here and in
  the customer's own workspace.

## Customer workspace panel

Where an operator opens one customer inside the portfolio view.

**Rules**

- The company mark is neutral, the legal name is the heading, and origin, sector
  and plan sit beneath.
- The four-up summary is onboarding, market readiness, waiting-on-customer and
  Export HQ-owned. That ordering mirrors the customer's own overview so both
  parties describe the account the same way.
- Task rows reuse the ExportPanel task pattern with a responsibility badge.

## Forbidden

- Any colour or type not in the shared system.
- Tenant branding of any kind.
- Removing the `OPS` badge.
- Internal shorthand or codenames in visible copy — an operator screenshot ends up
  in a customer conversation eventually.
- Presenting operator-only data in a way that could be mistaken for a
  customer-visible view.
