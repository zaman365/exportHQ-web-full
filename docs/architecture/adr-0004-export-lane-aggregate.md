# ADR 0004: Export Lane aggregate

- Status: Accepted domain direction; durable aggregate is R1 gated
- One organization + controlled product/service + destination + primary channel + buyer segment + commercial route is the operational aggregate root.
- Downstream operational records reference one lane unless explicitly reusable master data.
- Stage transitions are versioned domain commands with permission, evidence/state validation, audit and outbox in one transaction.
- Commercial records use bigint minor units, ISO currency, basis points and sourced/time-bound FX.
- No R1 durable aggregate work is activated before the R0 exit gate passes.
