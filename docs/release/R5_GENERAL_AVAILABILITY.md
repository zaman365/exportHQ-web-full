# R5 General Availability contract

R5 engineering may continue under the founder development authorization. A
General Availability release cannot be declared or promoted until the signed
release tree contains a passing `ga-manifest.json` under
`docs/release/evidence/<release>/`.

`pnpm release:verify-ga <manifest>` is the executable source of truth. The
release workflow binds the manifest to the exact signed SemVer tag and source
SHA, compares its declared artifact SHA-256 to the already-tested Worker
artifact, and includes the manifest in the immutable GitHub release record. The
example manifest is intentionally pending and must fail verification.

## Release-candidate soak

Use the `rc-soak-observation` hosted workflow against production-like staging
for at least seven continuous days. Each observation binds a signed `-rc.N`
tag, exact source SHA, staging deployment reference and UTC day to retained
synthetic checks. Runtime, bindings, migrations and integrations must match the
candidate configuration. A material schema or product change restarts the
seven-day window; a new checkbox does not preserve an old window.

Seven observations are the minimum audit trail, not automatic proof that the
window was continuous. The release owner must retain deployment history, load
results and monitoring evidence referenced by the final manifest.

## Non-skippable GA evidence

- Independent named security, privacy/legal, business, recovery and rollback
  approvals. The founder may own and accept risks but cannot self-certify these
  independent records.
- Application, API and tenant security; privacy; incident tabletop; business
  continuity; billing, refund, cancellation, data export and deletion evidence.
- A timed recovery drill with observed RPO no more than 15 minutes and RTO no
  more than four hours, plus backup, PITR, independent export, restore and RLS
  records.
- Signed tag, checksum, SBOM, provenance, migration/backfill report, capability
  status, test/security/recovery reports, release notes, accepted risks and an
  owned rollback artifact and commands.
- Five completed Export Lanes, three exporters with matched realized proceeds,
  at least one handled exception/discrepancy, repeat use or an order, zero
  cross-tenant exposure, zero unresolved Critical/High vulnerabilities and
  evidenced sustainable support/managed-work economics.

The target date never overrides these controls. Missing evidence blocks GA
promotion while leaving synthetic, preview and internal engineering work open.
