# Deployment runbook

1. Select a signed SemVer release tag whose SHA passed all required workflows.
2. Download the immutable Cloudflare artifact, checksum, SBOM, provenance and evidence manifest from the originating workflow run.
3. Verify checksums and confirm the artifact SHA matches the tag and migration report.
4. Review capability gates, bindings, secrets-present checks, migration forward plan and rollback reference.
5. Apply migrations with the migration role; never with the application role.
6. Promote the already-tested artifact through the protected GitHub environment. Do not rebuild from `main` on a laptop.
7. Run synthetic sign-in, organization, route-handler, database, static-asset and activation-report checks.
8. Annotate the release and monitor authentication, authorization, database, queue, webhook and error signals.
