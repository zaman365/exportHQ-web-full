# R5/R6 local engineering checkpoint — 2026-08-29

- Branch: `codex/r1-trusted-slice`
- Starting checkpoint: `a864abd`
- Scope: R5 General Availability controls and R6 post-GA contracts
- Data: synthetic/local only
- Release verdict: **No-Go for GA; R6 remains Planned**

## Implemented evidence

- `assessGeneralAvailabilityEvidence` and the release CLI enforce a seven-day
  production-like soak, exact tag/SHA binding, five independent approval areas,
  assurance journeys, observed RPO no more than 15 minutes, observed RTO no
  more than four hours, immutable release materials and the R5 outcome floor.
- `.github/workflows/rc-soak.yml` retains an observation bound to a signed RC
  tag, source SHA, staging deployment reference and UTC observation day.
- `.github/workflows/release.yml` refuses promotion without a passing manifest
  from the signed tree, compares the declared checksum to the downloaded CI
  artifact and includes the manifest in the release record.
- Gate 6 and `EXPORTHQ_GA_RELEASE_EVIDENCE` keep broad launch closed.
- Nine R6 decisions remain Planned until production, immutable GA evidence and
  capability-specific reviewed evidence all exist. Native mobile additionally
  requires PWA-need evidence.
- R6 domain tests enforce licensed partnership uses, minimum-cohort consented
  aggregates, tenant-local shipment learning, review-only repeat orders and the
  prohibition on generic CRM, opaque brokerage, unmanaged marketplace and
  custom-agency drift.

## Verification at this checkpoint

- Domain: 18 files / 54 tests passed; typecheck passed.
- Platform: 17 files / 96 tests passed; typecheck passed.
- Application: 15 files / 43 tests passed; typecheck passed.
- All ten workspaces passed lint, typecheck and unit/journey tests. A clean
  disposable PostgreSQL 17 migration and seed passed all 45 database tests,
  including all 31 non-owner application-role RLS/integration scenarios.
- Public website, ExportPanel and Operations production builds passed. Static
  measurements were 134,349 gzip bytes JavaScript, 53,961 gzip bytes CSS and
  zero public application-image bytes, all within the checked R4 ceilings.
- Migration checksums, both GitHub workflow YAML files and the example manifest
  JSON parsed successfully; `git diff --check` passed.
- The pending example GA manifest was executed and refused with 82 violations,
  confirming that deferred work cannot be converted into a GA pass.

Full monorepo verification and final commit identifiers are appended during the
phase checkpoint. This record is local engineering evidence, not independent
assurance, a seven-day soak, recovery evidence, customer outcomes or GA.
