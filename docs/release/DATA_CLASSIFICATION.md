# Release data classification

The executable policy is `packages/platform/src/data-classification.ts`; the detailed repository policy is [`../data-classification.md`](../data-classification.md).

Every issue and pull request must name one or more of: `public`, `operational`, `customer-business`, `customer-confidential`, `credential`, `audit`. New storage is blocked until its classification, encryption, retention, export, deletion, legal-hold and telemetry behavior are reviewed.

No customer-confidential, credential or audit value may enter fixtures, browser storage, logs, traces, analytics, release evidence or GitHub issues.
