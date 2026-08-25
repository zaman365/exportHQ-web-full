# ExportPanel brand guidelines

**ExportPanel is the customer product of Export HQ.** It is the workspace where a
company's export operation lives, and where Export HQ specialists do the work the
customer can see.

This directory is a *child* of the Export HQ brand system. Everything in
[`../`](../README.md) applies here unless a document in this directory explicitly
adapts it — and no document here may contradict Level 0 or Level 1 of the parent.

```text
Export HQ brand system  (../)
        │
        ├── inherits ─────────────► ExportPanel  (this directory)
        │                                 │
        │                                 ├── adapts (density, register)
        │                                 │
        │                                 └── hosts ──► Tenant branding
        │                                               (guest, four tokens,
        │                                                fixed slots)
        └── inherits ─────────────► Operator console
```

## Documents

| Doc | Covers |
| --- | --- |
| [01 · Product brand](01-product-brand.md) | What ExportPanel is, its promise, its register |
| [02 · Inheritance and divergence](02-inheritance.md) | The inherit / adapt / forbid matrix |
| [03 · Product tokens](03-tokens.md) | The Tier 3 app token layer |
| [04 · Product components](04-components.md) | Shell, navigation, cards, tables, forms, settings |
| [05 · Tenant branding](05-tenant-branding.md) | White-label rules, slots, contrast guard, enforcement |
| [06 · Operator console](06-ops-console.md) | The internal staff variant |

## The one-paragraph version

ExportPanel is the Export HQ brand **at low volume**. Same warm ink, same white
paper, same three typefaces, same single safety orange — but tighter, quieter and
denser, because the loudest thing on screen must be the customer's own data. A
customer's own brand appears in four places and never colours an action, a status
or a piece of chrome.

## Non-negotiables

1. **The orange is Export HQ's, and it means action.** Not a tenant's, not a
   status, not decoration.
2. **The rail is warm ink.** Not green, not navy, not a tenant colour.
3. **The customer's data outranks our identity.**
4. **Every row shows owner, state and next step.**
5. **Demo or preview data is always labelled.**
6. **A tenant can never make the product unreadable.** The theming API physically
   cannot emit an inaccessible pair.
