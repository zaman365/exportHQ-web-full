# 02 · Verbal identity

Typography and colour are only half the brand. The other half is the sentence.

## Voice

Export HQ writes like **a senior colleague who has done this before and is not
trying to impress you.**

| We are | We are not |
| --- | --- |
| Direct — the verb comes early | Breathless — "revolutionary", "seamless", "game-changing" |
| Concrete — named outputs, real dates | Abstract — "solutions", "synergies", "empowerment" |
| Second person — "your buyers", "you receive" | Third person about the reader — "clients benefit from" |
| Honest about effort — "Weeks 2–6" | Frictionless-fantasy — "instantly", "automatically", "in one click" |
| Specific about ownership — "Export HQ owns this" | Passive — "this will be handled" |

### Voice test

Read the sentence aloud as if you were on a call with the customer's managing
director. If you would not say it that way, rewrite it.

## Tone by surface

Tone shifts with stakes; voice never does.

| Surface | Tone | Example |
| --- | --- | --- |
| Homepage hero | Confident, ambitious | "From export ambition to international growth." |
| Section intros | Explanatory, calm | "Most export work breaks in the gaps between strategy, compliance, sales and delivery." |
| Forms | Plain, low-pressure | "No generic report. Your answers shape a company-specific starting point." |
| ExportPanel headings | Neutral, factual | "What happens next" |
| Task and status text | Terse, unambiguous | "Waiting for you · Due 15 Aug" |
| Compliance and evidence | Careful, sourced, hedged where uncertain | "Verified 8 Aug 2026 · source: EU REACH register" |
| Errors | Responsible, actionable | "We could not read that file. Upload a PDF, JPEG or PNG under 25 MB." |
| Empty states | Explain the value, offer one action | "No requirements yet. Add a target market to generate your first requirement map." |

## Naming and capitalisation

| Thing | Correct | Wrong |
| --- | --- | --- |
| Company | Export HQ | ExportHQ (prose), EXPORT HQ, Export-HQ |
| Wordmark rendering | ExportHQ (set as one word, "HQ" tinted) | — |
| Customer product | ExportPanel | Export Panel, the Panel, the dashboard |
| Operator surface | operator console | admin, back office, ops panel |
| The people | Export HQ specialists | agents, reps, consultants, support |
| Customer entity | organization (product/code), company (marketing) | tenant (never user-facing), account |
| Managed work | managed work | done-for-you, concierge |

> The **wordmark** sets the name as one word with the "HQ" tinted. In running
> text it is always two words: *Export HQ*. This is intentional and is the only
> place the two forms differ.

### Sentence case everywhere

Headings, buttons, labels, table headers, navigation and menu items are
**sentence case**. Title Case is never used.

- ✅ "Export readiness check"
- ❌ "Export Readiness Check"

**Exceptions:** proper nouns; the wordmark; and mono eyebrows/labels, which are
uppercased *typographically* via `text-transform`, never typed in caps. Typed
caps break screen readers and search.

## Microcopy rules

### Buttons

Verb + object. Two to four words. The button says what happens next, from the
user's point of view.

- ✅ "Prepare for export", "Open ExportPanel", "Show me the next steps"
- ❌ "Submit", "Learn more" (unless genuinely a content link), "Click here"

### Status labels

One or two words, lowercase in data, sentence case in display. Always paired
with text — never colour alone.

| State | Label | Role token |
| --- | --- | --- |
| Nothing started | To do | `neutral` |
| Being worked | In progress | `info` |
| Blocked on the customer | Waiting for you | `danger` |
| Blocked on Export HQ | With Export HQ | `warning` |
| Blocked on a third party | Waiting | `neutral` |
| Finished and evidenced | Completed | `success` |
| Cannot proceed | Blocked | `danger` |

### Ownership language

Ownership is always named, never implied.

- **You** — the customer's own team
- **HQ** — Export HQ specialists
- **3P** — an approved third party or partner

These three tokens appear as owner chips throughout the product and the website
plan card. They are never abbreviated differently.

### Numbers, dates and units

- Dates: `15 Aug 2026` in UI, `2026-08-15` in data and exports.
- Never "today"/"yesterday" alone — pair with the date on anything a user might
  screenshot or export.
- Currency always carries its code: `€18.4k`, `USD 12.80`.
- Percentages are whole numbers unless precision changes a decision.
- All figures use **tabular numerals** so columns align.

### Compliance and AI language

| Never write | Write instead |
| --- | --- |
| "This product is compliant." | "18 of 21 requirements verified for Germany." |
| "Certified" (unless a certificate exists) | "Evidence uploaded · pending specialist review" |
| "Our AI determined…" | "Suggested — needs specialist review" |
| "Guaranteed" | "Reviewed by <name> on <date>" |

Any statement about a regulated requirement must be able to show source,
effective date, confidence and reviewer. If it cannot, it is a suggestion and
must be labelled as one.

## Boilerplate

**One line (nav, footer, OG):**
> The managed workspace for international growth.

**Standard descriptor (meta, directories):**
> Export HQ is the operating system for international growth: export readiness,
> compliance, buyer development, trade operations, logistics and payments —
> managed in one accountable workspace.

**Signature line (footer, closing):**
> Everything export. One accountable team.

## Words we do not use

`seamless` · `frictionless` · `effortless` · `revolutionise` · `disrupt` ·
`unlock` (as a verb for value) · `leverage` (as a verb) · `solutions` (as a
noun for our product) · `best-in-class` · `world-class` · `AI-powered` (say what
the AI does) · `simply` / `just` (they blame the reader).
