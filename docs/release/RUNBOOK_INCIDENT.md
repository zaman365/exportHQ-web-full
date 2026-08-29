# Incident runbook

Use the P0–P3 release severity labels and the detailed response procedures in [`../incident-response.md`](../incident-response.md).

- P0: cross-tenant exposure, confidential evidence disclosure, credential compromise or materially incorrect payment/entitlement. Immediate containment and owner escalation.
- P1: authentication/authorization failure, failed vault controls, durable event loss or release rollback. Respond within one hour.
- P2: degraded adapter, queue lag or bounded tenant workflow outage. Respond within one business day.
- P3: low-impact defect with no data or authorization consequence. Normal planning cycle.

Never place secrets, customer content or exploitable details in public incident artifacts.
