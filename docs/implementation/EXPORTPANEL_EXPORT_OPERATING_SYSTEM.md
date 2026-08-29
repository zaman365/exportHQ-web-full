# ExportPanel Export Operating System — Codex implementation brief

Status: local vertical slice implemented and verified; external production adapters remain in the activation backlog

Owner: Export HQ product and engineering
Blueprint: [`../strategy/exportpanel-export-operating-system.html`](../strategy/exportpanel-export-operating-system.html)

## Objective

Implement the first complete, connected vertical slice of ExportPanel's commercial operating layer. The product must connect discovery, readiness, evidence, buyers, commercial economics, providers, finance, shipment, policy exposure, and payment through one `ExportLane` record.

This release is an evidence-aware workflow and decision-support surface. It must not claim that government, bank, carrier, insurer, laboratory, customs, or buyer systems are integrated until a production adapter and contract exist.

## Product invariants

1. Every operational record identifies an organization and Export Lane.
2. A lane is one business + controlled product/HS code + destination + channel + buyer segment.
3. No score is a promise of sales, legal compliance, finance, or shipment success.
4. Public surfaces contain only deliberately public projections.
5. Signed-in Basic users receive a useful lane workspace; verification or a paid plan unlocks deeper resolution detail.
6. Provider commissions are disclosed and never affect quality ranking.
7. Every non-obvious metric has a universal hint icon that resolves to the Learning Center.
8. External integrations are represented as explicit adapter boundaries and connection states—not fake live calls.

## Access matrix

| Capability | Public | Basic | Verified or Launch | Scale | Managed |
| --- | --- | --- | --- | --- | --- |
| Export-system overview | Limited | Full overview | Full | Full | Full |
| Saved Export Lane | — | One local/draft lane | Multiple | Multiple | Multiple |
| Economics calculator | Preview | Editable draft | Saved/approved scenarios | Multi-scenario | Specialist reviewed |
| Deal checklist | Preview | Limited | Core | Full collaboration | Specialist execution |
| Provider directory | Categories | Locked matching | Request matching | Compare/manage | Coordinated by Export HQ |
| Finance and shipment | Teaser | Readiness only | Preparation | Full control surfaces | Managed execution |
| Policy alerts | Public samples | Lane-specific | Full applicability | Portfolio | Specialist review |

## Repository deliverables

### 1. Strategy artifacts

- [x] Standalone structured HTML product blueprint.
- [x] This implementation brief with testable criteria.

### 2. Shared domain package — complete

Create `packages/domain/src/export-operating-system.ts` and export it from the domain package.

Required models:

- `ExportLane`
- `ExportLifecycleStage`
- `CommercialScenarioInput` and `CommercialScenarioResult`
- `BuyerProspect`
- `DealMilestone`
- `QualifiedProvider`
- `FinancePath`
- `ShipmentCheckpoint`
- `PolicySignal`
- `ExportCluster`

Required functions:

- `calculateCommercialScenario(input)` returns cost base, sell value, gross margin, margin rate, landed value, estimated duty/tax, and warnings.
- `exportLaneProgress(lane)` returns completed stage count and percentage.
- `commercialReadiness(input)` returns a bounded readiness signal and named gaps.
- `operatingSystemView(access)` returns a safe public/member/full projection with no restricted fields in lower-access views.

Required fixtures:

- A Bangladesh apparel-to-Germany lane.
- Buyer, provider, finance, shipment, policy, cluster, and milestone records attached to that lane.
- Every fixture is labelled illustrative where it is not an official or live record.

### 3. Authorization and navigation — complete

- Add `export-studio` as a workspace feature available from Basic upward.
- Add an `Export Studio` destination to the TRADE navigation group.
- Keep provider matching, finance execution, shipment control, and institutional detail visibly gated inside the Studio according to trust/tier.
- Continue enforcing the page route on the server with `requireWorkspaceFeature`.

### 4. ExportPanel Export Studio — complete

Create `/studio` using a Server Component page and a narrowly scoped Client Component for interaction.

The page must include:

- Lane identity and lifecycle progress.
- Outcome metrics: readiness, target margin, open blockers, next commercial gate.
- An interactive FOB/CIF/DDP-style economics calculator.
- Commercial warnings when assumptions create an invalid or weak margin.
- Deal-room milestones with locally persistent completion state for the preview adapter.
- Buyer qualification cards and a shortlist interaction.
- Provider categories, commission disclosure, and a functional request state.
- Finance comparison and selection state.
- Shipment checkpoint timeline.
- Policy applicability alerts with maintained source links.
- SME cluster opportunity.
- Trust Passport summary.
- Locked-state explanations with verification and plan routes.
- Contextual `HintButton` usage throughout.
- Responsive desktop and mobile layout.

The client must not receive authentication secrets, raw organization records, or private provider contact details.

### 5. Learning Center — complete

Add resources for:

- Export Lane
- Landed economics
- Buyer Trust Passport
- Deal room
- Provider matching and commissions
- Trade finance preparation
- Shipment control
- Policy and preference alerts
- SME export clusters

Each resource needs a concise hint summary, maintained content, category, kind, duration, and searchable keywords.

### 6. Public Export HQ website — complete

Add a conversion section after the country-product opportunity preview:

- Present the complete opportunity-to-payment lifecycle.
- Show a small illustrative economics preview.
- Show the four revenue-neutral exporter outcomes: choose, prove, deliver, get paid.
- Link the primary CTA to `${appUrl}/studio` and the secondary CTA to account creation.
- Explain the trust ladder without exposing customer data.
- Preserve the existing light visual system and responsive behavior.

### 7. Public ExportPanel preview and plans — complete

- Add an Export Studio preview card to `/preview`.
- Update plan highlights so the tier story matches the new operating layer.
- Do not imply that Clerk Billing or production persistence is active when it is not configured.

### 8. Tests — complete

Add domain tests covering:

- Correct commercial arithmetic.
- Bounded margin/readiness values.
- Zero/invalid input warnings.
- Progress calculation.
- Public/member/full data redaction.
- All Studio fixtures point to the same lane and organization.

Update authorization tests to cover `export-studio` availability and paid-tier gating.

## UX acceptance criteria

- [x] A user can identify the lane, current stage, readiness, margin, blockers, and next gate without scrolling.
- [x] Changing economics inputs updates results immediately and never produces `NaN` or infinite values.
- [x] Locked modules explain why they are locked and provide a relevant next action.
- [x] A buyer can be added to or removed from the shortlist.
- [x] A deal milestone can be completed and remains completed after a reload in local preview mode.
- [x] A provider request cannot be mistaken for a completed booking.
- [x] Commission disclosure is visible before the provider request action.
- [x] Policy alerts include publisher, review date, applicability, and source URL.
- [x] The Studio works at 390px and at a wide desktop viewport without horizontal page overflow.
- [x] All major sections expose a working Learning Center hint.

## Security acceptance criteria

- [x] `/studio` calls `requireWorkspaceFeature("export-studio")` on the server.
- [x] Access is derived from the verified session and not from client-controlled query parameters.
- [x] No new Server Action trusts client organization IDs or omits authorization.
- [x] Public projections exclude provider contacts, buyer contacts, finance application actions, and private evidence.
- [x] Demo/local persistence is clearly a preview adapter and is impossible to confuse with production persistence.

## Verification commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

For the Cloudflare application adapter, also run:

```bash
cd apps/app
pnpm build:vinext
```

Verified on 2026-08-25:

- all nine workspace TypeScript projects pass;
- repository-wide ESLint passes with zero warnings;
- 14 test files and 51 tests pass;
- the Export HQ website, ExportPanel application, and operator application pass Next production builds;
- the ExportPanel Cloudflare/vinext adapter builds successfully (production Clerk keys are intentionally absent locally);
- browser checks pass at wide desktop and 390px, with no page-level horizontal overflow and persistence verified after reload.

## External activation backlog

The UI and domain boundary are implementation-ready, but these require separate production credentials, contracts, security review, and provider onboarding:

- Clerk production identity/organization instance; Clerk Billing is deferred in
  favor of the internal PostgreSQL ledger and reviewed BDT payment adapter.
- PostgreSQL/RLS repositories and audit writes.
- Private R2 evidence vault, malware scanning, signed uploads and download logs.
- BSW/Bangladesh Trade Portal/EPB/CCI&E/BSTI supported connectors.
- Licensed buyer and sanctions/credit data.
- Bank, insurer, payment, carrier, freight, laboratory and provider integrations.
- Provider credential verification, commercial agreements and commission settlement.
- Human legal/customs/financial review operations and SLAs.

Never replace these boundaries with scraped credentials, fabricated live statuses, or unreviewed legal conclusions.
