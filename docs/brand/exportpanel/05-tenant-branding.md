# 05 · Tenant branding (white-label)

## The position

Customers can bring their brand into ExportPanel. They cannot take it over.

> **A tenant workspace is an Export HQ surface hosting a customer's identity, not
> a customer surface hosting Export HQ's tools.**

This is a product and trust decision before it is an aesthetic one:

1. **Accountability.** The managed-service model only works if a user can tell,
   at a glance, that Export HQ is the party doing the work. A fully white-labelled
   workspace erases that.
2. **Evidence.** Requirements, sources and review states are Export HQ's
   assertions. Rendering them in the customer's brand implies the customer
   asserted them.
3. **Shared surfaces.** Buyers, banks, auditors and certifiers see exported
   artefacts. They must read as coming from a system of record.
4. **Legibility.** Roughly half of real brand colours fail contrast on a white
   canvas. A tenant colour that can reach status text, actions or chrome will
   eventually make something unreadable.

The model follows the multi-brand token approach used by large multi-brand
programmes: the shared core never changes, and each tenant ships a **small
resource package** — a mark, a name, an accent — that plugs into it.

## What a tenant provides

```ts
interface TenantBrand {
  name: string;        // "ABC Textiles"        — required
  initials?: string;   // "AT"                  — derived if absent
  accent?: string;     // "#1E5AA8"             — any CSS colour
  markUrl?: string;    // an uploaded SVG/PNG   — optional
}
```

That is the entire surface area. There is no font upload, no radius override, no
layout option, no CSS injection point, and no way to change a status colour.

## The four slots

`--tenant-accent` may appear in these places and nowhere else.

| # | Slot | Treatment |
| --- | --- | --- |
| 1 | **Organisation switcher mark** (rail) | The mark image, or initials on `--tenant-accent` with `--tenant-accent-on` text |
| 2 | **Workspace / settings identity plate** | Same mark, larger, plus a 3px `--tenant-accent` rule beneath the organisation name |
| 3 | **Tenant-owned data series** | The single "your company" series in a comparison chart |
| 4 | **Exported document cover** | Mark and a hairline rule, alongside — never instead of — the Export HQ lockup |

### Forbidden surfaces

Tenant colour may **never** appear on:

- Any button, link or interactive control
- The focus ring
- The navigation rail background, hover or active state
- Status badges, task states, progress bars, health scores or readiness rings
- Requirement, evidence, source or review-state elements
- Toasts, modals, banners, the demo banner
- Typography of any kind
- The Export HQ lockup, in any form

### The 10% rule, restated

Tenant colour occupies **no more than 10% of any viewport**, and it never carries
meaning. If a user could infer a state from the tenant colour, the implementation
is wrong.

## The contrast guard

`tenantTheme()` in `packages/ui/src/tenant.ts` is the only way tenant colour
enters the DOM. It:

1. Parses the supplied colour; falls back to `--ink-1` if it is unparseable.
2. Computes relative luminance.
3. **Clamps** the colour by darkening or lightening until it reaches at least
   **4.5 : 1** against `--paper-0`, so it is safe as a plate behind text.
4. Chooses `--tenant-accent-on` as whichever of ink or paper scores higher
   against the clamped accent.
5. Emits a 10% `--tenant-accent-wash`.
6. Returns **only** those four properties, as a React `style` object.

Because the function returns a fixed key set, no tenant value can reach any other
token. The guard is structural, not a convention someone must remember.

```tsx
<div className="app-shell" style={tenantTheme(organization.brand)}>
```

If `brand` is absent, the function returns Export HQ defaults and the workspace
renders in the base identity. **The unbranded case is the reference case** — it
must always look finished.

## Marks

| Requirement | Value |
| --- | --- |
| Formats | SVG (preferred), PNG with transparency |
| Aspect | Square or near-square; wide wordmarks are cropped to the initials |
| Rendered size | 34px in the rail, 48px in the identity plate |
| Background | Never on a white plate inside the rail — it sits on `--tenant-accent` or its own transparency |
| Fallback | Initials, always available, always sufficient |

A tenant mark is never combined with the Export HQ monogram into a single
graphic, and never replaces it.

## Co-branding hierarchy

Wherever both marks appear:

```text
[Export HQ lockup]   │   [Tenant mark]  Tenant name
      first              hairline           second
   equal or larger     --line-strong
```

Export HQ is first in reading order and at equal or greater visual weight. In
exported documents, the Export HQ lockup is top-left and the tenant identity sits
on the line below.

## What tenants ask for, and the answer

| Request | Answer |
| --- | --- |
| "Can we use our font?" | No. Type is legibility infrastructure and it is shared across every artefact. |
| "Can the sidebar be our blue?" | No. The rail is Export HQ's chrome and its contrast is guaranteed. |
| "Can we remove Export HQ branding for our buyers?" | No. A buyer-facing view must be traceable to the system of record. We can reduce our chrome in shared views, not remove it. |
| "Can our colour be the button colour?" | No. Orange means *act*; that meaning is shared across all customers and all Export HQ staff. |
| "Can we have a custom domain?" | Yes — that is a platform capability, not a brand one, and the identity inside stays Export HQ. |
| "Can our logo appear on exports?" | Yes — slot 4, beside the Export HQ lockup. |
| "Can we hide other tenants' branding?" | There is nothing to hide. A workspace only ever shows its own tenant. |

## Enforcement

| Layer | Mechanism |
| --- | --- |
| API | `tenantTheme()` returns a fixed four-key object; anything else is dropped |
| Contrast | Clamping happens inside the same function — it cannot be bypassed |
| CSS | Only the four documented slot selectors reference `--tenant-*` |
| Review | The governance checklist includes a tenant-slot check |
| Drift | `grep -rn "tenant-accent" apps` should return only the documented slots |

## Testing a tenant theme

- [ ] Renders correctly with **no** brand configured
- [ ] Renders with a very light accent (near-white)
- [ ] Renders with a very dark accent (near-black)
- [ ] Renders with a saturated accent that fails contrast raw (e.g. `#ffee00`)
- [ ] Renders with an invalid string
- [ ] Renders with a mark, and without one
- [ ] Status badges are unchanged in every case
- [ ] Buttons are unchanged in every case
- [ ] The rail is unchanged in every case
- [ ] Greyscale: the workspace is still fully usable
