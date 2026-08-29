# R0 founder development authorization and risk acceptance

- Decision date: 2026-08-29
- Decision maker: Mohammed Maniruzzaman
- Authority: Founder, product owner and business owner
- Decision source: Explicit instruction in the Export HQ Codex implementation
  session
- Status: Accepted

## Decision

The founder accepts the current R0 engineering baseline and authorizes R1-R6
development to continue. Independent security, privacy/legal, recovery and
rollback reviews may be completed later and do not block implementation in
local, test, preview or otherwise fail-closed modes.

This is an attributable product/business decision and an explicit acceptance
of the schedule and rework risk created by deferring those reviews. It is not
represented as an independent security opinion, qualified legal advice or an
independent recovery/rollback attestation.

## Boundary retained

The deferred decisions continue to block:

- recording the corresponding production activation gate as passed;
- accepting real customer evidence or credentials in an unapproved workflow;
- external Alpha, pilot or broad-launch claims;
- enabling a capability whose production gate is incomplete; and
- removing a fail-closed control merely to make a feature appear operational.

`EXPORTHQ_ACTIVATION_GATES_PASSED` remains the server-only production control.
This authorization does not add a gate record or change the ordered activation
logic in `packages/platform/src/activation.ts`.

## Deferred decisions

Before the affected production capability is activated, retain evidence for:

- independent security review and residual-risk acceptance;
- qualified privacy/legal review for the operating jurisdictions;
- privileged-identity recovery and authorization exercise;
- production restore, rollback and reconciliation exercise; and
- final release approval against the exact protected-main artifact.

## Revisit triggers

Review this decision before the first of:

- real customer data entering a production workflow;
- an external Alpha or pilot invitation;
- privileged Operations access being activated;
- document upload, mailbox, provider or live external-adapter activation; or
- a signed production release candidate being promoted.
