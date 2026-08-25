# 01 · Brand foundation

## Positioning

> **Export HQ is the operating system for international growth.**
> Software, reliable data, managed workflows, accountable experts, partner
> execution and evidence-aware AI in one workspace.

We are not a marketplace, not a freight forwarder, not a consultancy with a
portal bolted on. We are the **system of record for a company's export
operation**, staffed by specialists who work inside that same record.

The first commercial wedge is Bangladesh → Germany/EU. Every primitive in the
brand must remain origin-, destination-, currency-, language- and
sector-neutral. The wedge shows up in *content*, never in the identity.

## Brand promise

The customer should always be able to answer four questions without asking
anyone:

1. How is my export business performing?
2. What needs attention now?
3. Who owns each next action?
4. What is Export HQ actively doing on my behalf?

**Every design decision is judged against those four questions.** A visual
choice that makes any of them harder to answer is wrong, however attractive.

## Brand personality

We are five things, in priority order. When two conflict, the higher one wins.

| # | Trait | Means | Does not mean |
| --- | --- | --- | --- |
| 1 | **Accountable** | Owner, state, deadline and next step are always visible. Sources and review dates travel with every claim. | Bureaucratic, defensive, disclaimer-heavy |
| 2 | **Clear** | Plain language. One idea per surface. Progressive disclosure. | Simplistic, dumbed-down, jargon-free to the point of vagueness |
| 3 | **Warm** | Warm ink, human names, real specialists, second person. | Cute, jokey, emoji-led, over-familiar |
| 4 | **Energetic** | One high-visibility signal colour. Confident display type. Motion that reveals, never entertains. | Loud, urgent-by-default, alarmist |
| 5 | **Precise** | Tabular numerals, consistent units, exact dates, mono for machine data. | Cold, clinical, spreadsheet-grey |

### The personality in one sentence

**A calm, warm control room with one bright light.**

## Brand principles

These are the design laws. They are testable.

### 1. Action before ornament

Action, ownership, deadline and next step precede charts, and charts precede
decoration. If a section has no action, it must at least have a decision.

> *Test:* remove every decorative element from a screen. If the user can still
> act correctly, the decoration was optional and should probably go.

### 2. One signal

`--signal` (safety orange) means **"this is where you act, or this is what
changed."** It is never used as a background wash for large areas, never used to
classify information, and never used decoratively.

> *Test:* count the orange pixels in a viewport. Above roughly 10% of the visible
> area, the signal has stopped signalling.

### 3. Evidence has provenance

Any compliance or requirement claim shows source, effective date, confidence and
review state. AI output is visually distinguishable from verified fact and never
styled as certainty.

> *Test:* can a user tell, without clicking, whether a statement was verified by
> a human?

### 4. Colour reinforces, text carries

Status is always written. Colour, icon and position reinforce it. A monochrome
screenshot must remain fully usable.

> *Test:* apply a greyscale filter. Nothing may become ambiguous.

### 5. Density is a register, not a different brand

The public site is expressive: large display type, generous rhythm, ambient
motion. The product is quiet: compact type, hairline structure, motion only on
state change. **Same tokens, different scale values.**

### 6. The customer's data outranks our brand

Inside ExportPanel, the loudest thing on screen is the customer's own
information. Our identity is chrome, not content.

### 7. Tenants are guests

Customer branding appears in a fixed, small set of slots. It never colours
actions, never carries status, never replaces Export HQ chrome. See
[ExportPanel · Tenant branding](exportpanel/05-tenant-branding.md).

### 8. Portability is a visual commitment

Anything on screen must survive being exported, printed and shared with a bank,
buyer or auditor. This is why the canvas is white and the ink is dark.

## Brand architecture

```text
Export HQ                        the company and the system of record
├── exporthq.com                 public website — persuade and qualify
├── ExportPanel                  the customer product — the workspace of record
│   └── <Tenant> workspace       a customer's org inside ExportPanel (guest branding)
├── Export HQ Ops                internal operator console — same record, staff lens
└── Export HQ Specialists        the managed-service team, visible inside the product
```

**Naming rules**

- The company is **Export HQ** — two words, both capitalised.
- The customer product is **ExportPanel** — one word, camel-cased, never
  "Export Panel", never "the panel", never "the dashboard".
- The internal surface is the **operator console**, never "admin".
- The people are **Export HQ specialists**, never "agents", "reps" or "support".
- A customer organisation is an **organization** in code and product UI
  (matching the data model) and a **company** in marketing copy.

Full verbal rules: [02 · Verbal identity](02-verbal.md).

## Audiences

| Audience | Reads | Needs from the brand |
| --- | --- | --- |
| Owner / MD of an exporting SME | Website, ExportPanel overview | Confidence that this is real, staffed and safe. Legibility on a phone. |
| Export or commercial manager | ExportPanel daily | Speed, ownership clarity, no ambiguity about what is theirs |
| Compliance / quality lead | Requirements, evidence, documents | Provenance, dates, review state, printable output |
| Buyer, bank, auditor, certifier | Exported documents and shared views | Neutral, credible, unmistakably from a system of record |
| Export HQ specialist | Operator console | Density, queue clarity, scoped-access signals |

## What the brand must never do

- Present AI output as legal or regulatory certainty.
- Use urgency colour or motion to manufacture pressure.
- Imply an endorsement, certification or partnership that does not exist.
- Show a customer's brand in a way that suggests the customer performed work
  that Export HQ performed, or the reverse.
- Ship a screen where the next action is not identifiable in five seconds.
