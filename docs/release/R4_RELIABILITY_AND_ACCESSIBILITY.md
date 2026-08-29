# R4 reliability, performance and accessibility contract

This is the engineering contract for Public Beta. It does not claim that a
deployed environment has met the targets. Deployment evidence belongs under
`docs/release/evidence/` and must identify the exact artifact and measurement
conditions.

## Enforced static budgets

`config/public-beta-budgets.json` is the source of truth. The quality workflow
builds ExportPanel and runs `pnpm performance:budget`. The check fails when the
gzip transfer size of shared plus Billing route JavaScript exceeds 250,000
bytes, total application CSS exceeds 180,000 bytes, or an application image
exceeds 300,000 bytes. These budgets are ceilings, not targets.

Authenticated route data remains capped at 100,000 transfer bytes. It cannot be
truthfully measured from a static build; staging and production evidence must
capture it from the browser network log without retaining customer content.

## Experience and accessibility targets

- LCP at or below 3.5 seconds on the agreed low-end Android profile.
- Time to interactive at or below 5 seconds on the agreed constrained network.
- WCAG 2.2 AA keyboard access, focus visibility, semantic headings, names,
  status announcements, colour contrast and 200% zoom/reflow for all critical
  journeys.
- Billing usage meters expose names, current values and exact maxima; colour is
  never the sole source of limit or status meaning.
- Low-data mode and Bangla/English presentation must remain usable at 320 CSS
  pixels without horizontal journey controls.

Automated checks are only a floor. Public Beta evidence requires manual
keyboard, screen-reader, zoom, low-data and Bangla journey results from the
deployed artifact. Missing results keep the exit outcome open.

## Service objectives

- read API p95: 350 ms;
- write API p95: 700 ms;
- database query p95: 250 ms;
- monthly availability: 99.5%; and
- zero unresolved critical tenant-isolation, entitlement-drift, settlement or
  evidence-sharing incidents.

Every objective needs a measurement window, sample count, endpoint/operation,
region, alert link and artifact SHA. Synthetic checks cover sign-in, dashboard,
Billing & usage and one tenant-safe read journey. Error-budget exhaustion stops
Public Beta expansion and invokes the incident and rollback runbooks.

## Capacity and failure exercises

Before the R4 exit may pass, retain evidence for concurrent authenticated reads,
write contention, webhook retry/dead-letter behaviour, database pool pressure,
provider timeout/risky-payment handling, entitlement rollback, backup restore,
RLS verification and graceful checkout disablement. A status page, named on-call
owner and escalation path must be active. Founder development authorization is
not independent security, recovery or rollback approval.
