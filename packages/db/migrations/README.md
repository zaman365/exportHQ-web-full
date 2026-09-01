# Legacy pre-production migration history

This chain is retained unchanged as audit evidence from the 26 August 2026 baseline. It is not the bootstrap chain: `0000_phase_zero.sql` expected tables that did not yet exist.

No verified production database was found using this history. New development, CI, staging and production-shaped databases use `../migrations-v2/` according to its documented baseline strategy.

The reconciled production-database activation sequence, role policy, recovery
requirements, and remaining migration work are tracked in
[`Next ToDo's.md`](../../../Next%20ToDo%27s.md).
