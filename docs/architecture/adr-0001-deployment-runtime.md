# ADR 0001: Deployment runtime

- Status: Proposed; R0 conformance evidence required
- Decision: Build ExportPanel with Vinext for the current Cloudflare Worker route only when the same produced artifact passes RSC, Server Actions, route handlers, redirects, auth, webhook, PostgreSQL, environment and static-asset smoke tests.
- Alternative: OpenNext remains the fallback.
- Fallback trigger: any required Next.js 16 behavior cannot be reproduced in the deployed Vinext artifact, a release requires framework/runtime patching, or a security/update lag blocks a critical fix.
- Migration plan: preserve standard App Router conventions and platform adapters, produce an OpenNext artifact in a comparison branch, run the same smoke contract, then switch the Worker route only after parity and rollback evidence.

CI tests the deployable artifact; `next build` alone is not release evidence.
