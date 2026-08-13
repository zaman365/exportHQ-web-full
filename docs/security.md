# Security baseline

- Deny by default at server and database boundaries.
- Private files, signed access, quarantine/scanning state, checksums, and download audit.
- Validated input, secure headers, restrictive content security policy, CSRF-safe mutations, and rate limiting at the edge/application boundary.
- Least-privilege deployment roles, managed secret storage, encrypted transport/storage, dependency scanning, backups, and restore exercises.
- Clerk MFA and enterprise controls can be enabled without altering the domain model.
- Audit privileged access and permission changes; scrub confidential document content from telemetry.
- Retention is policy-driven per document category; account deletion does not erase records under a valid legal hold.

Threat modelling and an external security review are release gates before handling real exporter documents.
