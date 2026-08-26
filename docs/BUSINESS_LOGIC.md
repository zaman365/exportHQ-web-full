# Export HQ and ExportPanel — canonical business logic

Status: canonical product doctrine

Last reconciled with the repository: 26 August 2026

Applies to: `export-hq.com`, `export-hq.com/ExportPanel`, the Export HQ operations console, shared domain packages, data services, partner workflows, and future integrations

## 1. Purpose and authority

This document is the durable business-logic source for the whole Export HQ system. Product, design, engineering, content, sales, operations, and AI-assisted implementation must use it before introducing or changing a journey, entitlement, module, score, workflow, integration, or revenue mechanism.

It consolidates the decisions currently distributed across the product vision, Export Operating System blueprint, authorization catalog, readiness and market-intelligence systems, production-auth specification, domain model, implementation status, application routes, and recent product decisions.

When sources disagree, use this order:

1. Security, tenant-isolation, legal, and evidence-provenance invariants never weaken.
2. This document defines the intended business behavior.
3. Central policy and domain code define currently enforced behavior.
4. Page copy and sample fixtures illustrate behavior but do not create policy.

When a product decision changes, update this document and the relevant central policy or domain model in the same change. Do not leave the new rule only in a page component or conversation.

## 2. What Export HQ is

Export HQ is a managed export operating system for international growth. It combines:

- a public acquisition and intelligence website;
- ExportPanel, the exporter’s shared operating workspace;
- an internal operations console for accountable Export HQ specialists;
- evidence-aware data, workflows, and AI;
- qualified external providers such as lawyers, banks, laboratories, freight companies, insurers, inspectors, buying houses, customs specialists, and digital agencies;
- managed research and execution services; and
- future institution and network products for banks, chambers, associations, and development programmes.

The system helps a business choose a viable export lane, become ready, prove trust, find and qualify buyers, build a commercially sound offer, deliver, receive payment, learn, and repeat.

The initial commercial wedge is Bangladesh-origin exports to Germany and the EU. The underlying model must remain origin-, destination-, product-, service-, language-, currency-, and sector-neutral.

ExportPanel is the product name. `TREVV` is retired and must not appear in customer-facing copy. The production product lives under `https://export-hq.com/ExportPanel`; do not reintroduce a separate product domain or subdomain without an explicit architecture decision.

## 3. North star and product promise

### 3.1 North star

Move product-country opportunities from evidence-backed discovery to realized export proceeds and repeat business.

Page views, registrations, generated reports, and checklist completion are supporting metrics. They are not the final outcome.

### 3.2 What every customer should understand

At any point, an exporter should understand:

1. how the business and each export lane are performing;
2. what needs attention now and why;
3. who owns each next action and when it is due;
4. what evidence supports a claim or completion state;
5. what Export HQ is doing on the customer’s behalf;
6. what is blocked, who or what can unblock it, and the next practical step; and
7. what deeper capability exists and how it can be unlocked.

### 3.3 Operating principles

- Action, ownership, deadline, evidence, and next step precede decorative analytics.
- Readiness and compliance are conditional on the business, controlled product, market, channel, and current evidence.
- Complexity is revealed progressively and requested only when it becomes useful.
- Customer and Export HQ specialists work on the same records and evidence trail.
- Institutional memory and accumulated value create retention; artificial data lock-in does not.
- Data is customer-owned and portable subject to legal retention obligations.
- AI is assistive and evidence-aware. It never silently changes business records or presents unreviewed output as legal certainty.

## 4. System topology and responsibilities

| Surface | Primary audience | Business role |
| --- | --- | --- |
| `export-hq.com` | Prospective exporters, institutions, partners | Educate, demonstrate real value, capture export intent, create trust, and convert visitors into identified businesses or customers |
| `/ExportPanel` | Exporter owners, admins, members | Operate export readiness, evidence, actions, decisions, lanes, buyers, economics, providers, delivery, and growth |
| Export HQ operations console | Export HQ specialists and authorised operators | Manage customer portfolios, risk queues, reviews, managed work, provider coordination, and explicit customer-scoped access |
| Shared domain and policy packages | All applications | Keep calculations, projections, entitlements, permissions, and invariants consistent |
| Partner and institution surfaces | Future qualified providers and institutions | Receive only explicitly shared work, manage referrals or programmes, and view privacy-preserving portfolio signals |

The public website and ExportPanel are two views of one funnel and operating model, not unrelated applications.

## 5. The core business object: Export Lane

Everything commercially meaningful should connect to an `ExportLane`.

An Export Lane is:

> one organization + one controlled product or service + one destination + one primary channel + one buyer segment + one commercial route

It may also carry SKU/reference, HS classification, Incoterm, currency, expected volume, target margin, lead time, primary buyer profile, and controlled specification when those details become useful.

Every relevant signal, requirement, evidence item, task, decision, buyer, quotation, provider request, finance path, shipment checkpoint, payment event, and learning outcome should be attributable to an organization and, where commercially applicable, an Export Lane.

### 5.1 Lifecycle

1. Opportunity
2. Readiness
3. Evidence
4. Buyer
5. Offer
6. Production
7. Shipment
8. Payment
9. Repeat

The five customer-facing stages on the public website group this lifecycle into direction and readiness, requirements and evidence, buyers and market entry, trade and delivery, and performance and growth.

### 5.2 Lane invariants

- A product is never “universally export-ready” or “universally compliant.”
- Readiness is recalculated for the business-product-market-channel context.
- Scores guide prioritisation; they do not promise demand, compliance, financing, shipment success, or payment.
- Commercial calculations expose assumptions and warn about incomplete, invalid, or weak-margin scenarios.
- A completed state requires the appropriate evidence and review state, not only a checked box.
- Lessons from completed or failed work remain attached to the lane and inform repeat activity.

## 6. Connected value loops

### 6.1 Acquisition loop

Public opportunity, readiness, economics, policy, and learning previews provide immediate value. Visitors create accounts to save context, compare more options, and continue. Business verification and subscriptions unlock deeper resolutions and actions. Useful previews—not vague marketing—drive conversion.

### 6.2 Readiness loop

Business context produces applicable requirements. Gaps become actions with owners. Each blocker offers knowledge and, where appropriate, qualified provider help. Evidence is uploaded, reviewed, and linked. The readiness state updates and the next blocker becomes visible.

### 6.3 Commercial execution loop

A viable lane becomes buyer work, economics, decisions, deal milestones, provider coordination, finance preparation, shipment control, proceeds tracking, and repeat planning.

### 6.4 Managed-service loop

Export HQ specialists work inside the same customer context. The customer can see what is being done, by whom, the next update, evidence, and dependencies. Managed execution produces recurring service revenue while improving the underlying workflow and data model.

### 6.5 Network loop

More completed lanes improve provider qualification, process benchmarks, cycle-time knowledge, blocker patterns, and institutional insight. Only privacy-preserving and contractually permitted aggregates may become network intelligence.

## 7. Access model: visible value, progressive depth, secure actions

Access is determined by four independent dimensions:

1. authentication state;
2. organization subscription tier;
3. business-verification state; and
4. organization role and granular permission.

No client-controlled query parameter, hidden navigation item, CSS rule, or disabled button is an authorization boundary.

### 7.1 Universal visibility rule

Capabilities should remain visible even when unavailable so customers can understand the complete system.

Every feature is rendered in one of three states:

| State | Visual language | Behavior |
| --- | --- | --- |
| Full | Normal navigation and controls | Organization data and allowed actions are available subject to role permissions |
| Preview | Eye icon and “Interactive preview” guidance | Curated or redacted sample data is useful and navigable; protected mutations are disabled |
| Locked | Premium gem/lock icon | The capability stays visible and opens an explanation of its value, required tier/trust state, and exact unlock action |

Hover, focus, tap, or the opened locked state must explain how to unlock the feature. Do not hide premium modules from the navigation or Settings. Locked pages must not receive private organization records merely to render a teaser.

### 7.2 Current tier model

| Level | Intended value |
| --- | --- |
| Public preview | Safe product tour, public opportunity/readiness/Studio projections, source-linked learning, and selected interactive workflow samples |
| Basic (`explore`) | A signed-in starting point, one business workspace, one draft lane, settings, onboarding, saved context where persistence is active, and richer member projections |
| Launch | Core readiness, evidence, requirements, actions, decisions, personal execution, products, and documents for a first priority lane |
| Scale | Cross-lane attention, blueprints, team coordination, buyers, integrations, audit, export controls, and deeper operational collaboration |
| Managed | Everything in Scale plus accountable Export HQ specialist execution |

The central feature catalog in `packages/authorization` is the executable entitlement source. Plan copy must follow it rather than inventing page-specific tiers.

### 7.3 Executable feature ladder

This table summarizes the current central policy. “Projection” means the module intentionally changes data depth according to public/member/full trust access. “Preview” means safe sample records with protected mutations disabled.

| Capability | Signed out | Basic | Launch | Scale | Managed |
| --- | --- | --- | --- | --- | --- |
| Home | Public projection | Full | Full | Full | Full |
| Learning Center | Public | Full | Full | Full | Full |
| Markets, Opportunities, Readiness, Export Studio | Public projection | Member projection | Full | Full | Full |
| Settings and organization profile | Locked | Full | Full | Full | Full |
| Inbox, My Work, Waiting, Decisions | Preview | Preview | Full | Full | Full |
| Ideas and Create | Locked | Preview | Full | Full | Full |
| Products, Documents, Requirements | Locked | Locked | Full | Full | Full |
| Attention Center and Blueprints | Preview | Preview | Preview | Full | Full |
| Team | Locked | Preview | Preview | Full | Full |
| Standalone Buyers, Integrations, Audit, Export | Locked | Locked | Locked | Full | Full |
| Managed-service capability | Locked | Locked | Locked | Locked | Full |

Business verification can raise a Basic organization’s trust-gated Markets, Opportunities, Readiness, and Export Studio projection to full depth. It does not convert the organization to Launch or Scale and does not unlock unrelated paid modules.

### 7.4 Current progressive previews

Signed-out visitors can safely preview Attention Center, Inbox, My Work, Waiting, Blueprints, and Decisions with curated sample records. Signed-in Basic users can additionally preview Ideas, Create, and Team. The public projections of Home, Learning, Readiness, Markets, Opportunities, and Export Studio provide value appropriate to their own access ladders.

Preview actions never mutate organization data. Upgrade CTAs preserve context by identifying the requested feature in the plans route.

### 7.5 Trust-gated access

High-value intelligence uses a separate three-level projection:

| Projection | Eligibility | Example depth |
| --- | --- | --- |
| Public | Signed out | Selected examples, summaries, trend/confidence labels, and public learning |
| Member | Signed in but unverified Basic business | Search, rankings, fit scores, lane-specific summaries, draft work |
| Full | Verified business or any paid organization plan | Resolution steps, evidence criteria, source trails, provider matching, private actions, and deeper operational detail |

Business verification does not grant all paid collaboration features. It unlocks designated trust-gated intelligence. Subscription entitlements and role permissions still apply independently.

### 7.6 Role permissions

Organization owners and admins may receive the plan’s permission ceiling. Other roles receive a safer subset. Permissions include company, product, compliance, document, readiness, task, team, and billing operations.

Read-only users should see a clear role-based message. Every server read and mutation must still validate organization scope, permission, resource ownership, and entitlement.

### 7.7 Platform administrator

Platform-administrator access is an identity-verified server-side override for approved Export HQ administrators, not a hidden password or public test account. The authenticated Clerk email must appear in the server-only `EXPORTHQ_PLATFORM_ADMIN_EMAILS` allowlist and still operate inside an organization boundary. It grants Managed test capability, verified-business state, and owner-level permissions for that identity.

## 8. Acquisition, sign-up, and activation

### 8.1 Public website logic

The website must feel like a useful product and demonstrate the connected operating system. Its acquisition tools include:

- a country × product opportunity finder;
- an export-readiness pulse;
- a compact landed-economics preview;
- product- and destination-specific policy alerts;
- source-grounded Learning Center answers in accessible language, with Bangla support as the content system matures;
- a limited ExportPanel workspace preview; and
- clear routes to sign in, create a Basic account, verify a business, subscribe, or request managed help.

The website should communicate the full journey—not five random cards. Sections must explain how direction, evidence, buyers, delivery, and growth connect.

### 8.2 Value exchange ladder

1. A visitor receives a useful result without creating an account.
2. Account creation saves context and reveals richer information.
3. Completing a business profile improves recommendations.
4. Optional free verification unlocks designated trust-gated detail and creates a qualified lead.
5. A subscription unlocks execution, collaboration, history, and controls.
6. Managed service adds accountable human execution.

Each step must explain the additional value requested in exchange for identity, evidence, or payment.

### 8.3 Frictionless onboarding

Onboarding exists only to create or select a secure organization and enter ExportPanel. It must not become a long export questionnaire.

Required during initial activation:

- authenticated user;
- organization/workspace creation or selection; and
- owner/admin confirmation to activate the workspace.

Not required during onboarding:

- HS code;
- internal product reference/SKU;
- complete product specification;
- export price or currency;
- business-verification evidence;
- target market or channel; or
- detailed legal, facility, compliance, and document data.

These details are requested contextually from Company Profile, Product/Profile setup, Market Direction, Readiness, Export Studio, or a relevant task. Users may add multiple markets and channels, with one primary selection and optional secondary choices. Business verification remains optional and can be completed later from the profile.

### 8.4 Authentication methods

Clerk is the production identity provider. The intended configuration supports email/password, email OTP, phone/SMS OTP, Google, and other enabled production social/enterprise providers. The application must advertise only methods actually enabled in the active Clerk instance.

Production must fail closed when identity configuration is missing. Local demo mode may use sample data only outside production.

## 9. ExportPanel module logic

### 9.1 Home

Home is the command center; Dashboard is part of Home, not a separate disconnected concept. It should show export health, needs-you count, evidence/readiness progress, managed work, product × market readiness, requirements needing attention, recent documents, and shared activity. Every summary should lead to the underlying record or next action.

### 9.2 Attention Center

Attention Center ranks operational signals so important work stays visible. Each signal must include:

- organization/project/lane relevance;
- severity and reason;
- evidence that triggered it;
- owner, due date, and waiting dependency where applicable;
- recommended next action;
- navigation to the detailed record; and
- functional resolve, snooze, and dismiss actions for authorised users.

Signals are not merely points. Snoozed or dismissed items leave the active queue according to policy, and every state change is auditable.

### 9.3 Inbox and Quick Capture

Inbox separates personal capture from requests that need a response. Quick Capture accepts tasks, ideas, links, and notes, with optional hub and date. The actionable inbox supports filtering, detail navigation, Done, and Snooze. Capture must be useful but should not create unowned orphan records.

### 9.4 My Work

My Work is the personal execution cockpit. It organizes assigned, followed, and created work by time and risk. It must make overdue, today, blocked, review, working, and completed states easy to scan; expose project/lane context; support useful filtering; and provide a detail/action path rather than static rows.

### 9.5 Waiting

Waiting explains work blocked on a customer, Export HQ, or a third party. It tracks who is expected to respond, since when, the next follow-up, escalation state, and related lane/project. Authorised users can follow up, reschedule, resolve, or escalate.

### 9.6 Blueprints

Blueprints are reusable, versioned operating playbooks. They turn repeated export procedures into controlled steps, variables, ownership rules, evidence expectations, and launchable workflow runs. Users should see templates before they can activate or author them.

### 9.7 Decisions, Ideas, Team, and Create

- **Decisions** records a choice, options, evidence, participants, deadline, outcome, and consequences.
- **Ideas** captures and triages opportunities or improvements before they become decisions or work.
- **Team** shows customer members, Export HQ specialists, responsibilities, access boundaries, response expectations, and contact routes.
- **Create** is a contextual entry point for records supported by the current tier. It should not bypass validation, lane association, permissions, or evidence rules.

### 9.8 Markets and Opportunities

Markets group destination intelligence; Opportunities rank country × product lanes. Both are views of the same maintained intelligence system, not generic country articles.

### 9.9 Products and Company Profile

Product and company details are completed progressively after activation. Trade-specific fields such as internal reference, HS code, detailed specification, certifications, capacity, and packaging belong here or in a lane-specific workflow. Unknown values must be allowed until a requirement actually depends on them.

### 9.10 Documents and Requirements

Documents are authorized business objects linked to a company, facility, product, requirement, lane, shipment, or other explicit record. Files are not isolated blobs. Requirements carry jurisdiction, source, effective/review date, applicability, evidence expectation, confidence, and review state.

### 9.11 Settings

Security and organization settings remain available according to role. Premium settings—Integrations, Members, Audit, and Export—always remain visible with premium indicators and an in-place explanation of the required tier. Locked settings must not render restricted organization data.

## 10. Market-intelligence business logic

The opportunity engine connects a target country with an export product category and stores:

- product and HS scope;
- opportunity, demand, and Bangladesh-origin-fit scores;
- confidence, trend, methodology version, and review dates;
- buyer profiles and route-to-market options;
- known barriers and evidence to prepare;
- a suggested validation sprint; and
- source records with publisher, URL, period, and observed metric.

### 10.1 Ranking rules

- Scores are directional prioritisation aids, not promises of buyer demand.
- Never infer an exact score from one trade value.
- Refresh high-traffic lanes first and review when sources, regulations, or direct buyer evidence change.
- Every lower-access projection removes restricted fields before rendering; CSS hiding is insufficient.
- Full detail should convert intelligence into an action: shortlist, validate, assess readiness, open a lane, or request expert help.

### 10.2 Starter scope

The current starter system covers selected lanes involving Germany, the Netherlands, the United Kingdom, Japan, Saudi Arabia, and the UAE, and categories such as apparel, leather, jute, food, engineering, software/services, and other products. This is an extensible starter catalog, not the limit of Export HQ’s market promise.

## 11. Export-readiness business logic

Readiness is a conditional, saveable assessment for Bangladesh exporters. It checks both origin-side capability and destination/product/channel requirements.

### 11.1 Readiness sections

1. Business identity
2. Export registrations
3. Facility and operations
4. Product evidence
5. Target market
6. Commercial readiness
7. Trade delivery
8. Digital trust

The engine covers legal entity/signing authority, trade licence, e-TIN, BIN, ERC, chamber/association paths, Authorized Dealer bank setup, EXP/proceeds process, facility/environment/fire/DIFE obligations, sector registration, standards screening, defensible HS classification, specifications, testing, destination rules, capacity, costing, contract/payment protection, shipment documents, logistics, online credibility, localization, and IP where applicable.

### 11.2 Conditional applicability

The question and requirement set changes with:

- manufacturer, trader, or service model;
- product category;
- product description and known classification;
- destination;
- sales channel; and
- existing status and evidence.

Do not ask a user to answer a requirement that is clearly inapplicable. “Not applicable” is an explicit state, not silent omission.

### 11.3 Requirement states

`not_started` → `in_progress` → `evidence_added` → `verified`, with `blocked` and `not_applicable` where appropriate.

Priority is blocker, important, or growth. Scoring uses weighted applicable requirements and must remain bounded. A score never overrides a blocker or missing high-risk evidence.

### 11.4 Blocker-resolution pattern

Every blocker should offer two subtle, consistent paths when relevant:

1. a Learning Center hint/resource explaining the issue, evidence, and next steps; and
2. a qualified service-provider path for work requiring a lawyer, accountant, bank, laboratory, customs specialist, freight partner, insurer, inspector, buying house, market-entry adviser, digital agency, translator, or other professional.

Users can save and resume the assessment. A blocker does not force abandonment.

### 11.5 Evidence workflow

The current input contract accepts PDF, JPEG, and PNG evidence up to 25 MB. Evidence progresses through staged, under review, needs action, accepted, or rejected states, with human-readable feedback and a next step. Production files must use private storage, signed access, scanning/quarantine, checksums, and authorized download logging.

### 11.6 Provider referrals

Provider matching is available only at the appropriate trust/access level. The customer must give explicit consent before information is disclosed for a referral. A request is not a booking or guarantee. Referral status moves through requested, matching, introduced, engaged, closed, or declined.

## 12. Export Studio business logic

Export Studio is the commercial and coordination center for an Export Lane. It connects:

- lane identity, lifecycle, health, blockers, and next gate;
- FOB/CIF/DDP-style commercial scenarios;
- buyer qualification and shortlists;
- deal milestones and approvals;
- qualified providers and commission disclosure;
- finance preparation and comparison;
- shipment checkpoints and exception ownership;
- policy applicability alerts;
- SME export-cluster opportunities; and
- a controlled Trust Passport.

### 12.1 Commercial scenario rules

Calculations may include ex-factory cost, packaging, inland transport, documentation, testing, freight, insurance, commission, finance, FX buffer, duty, destination tax, target margin, units, and quote value.

The calculator must:

- never emit `NaN` or infinite values;
- bound percentage inputs;
- distinguish seller cost, customs value, landed value, gross margin, and break-even unit price;
- warn about missing/zero units, invalid quote assumptions, negative margin, or margin below target; and
- label duties/taxes as estimates requiring current classification and destination validation.

### 12.2 Projection rules

- Public views redact organization identity, buyer contacts, provider contacts, application routes, private evidence, and share identifiers.
- Member views reveal a useful editable lane and economics but retain sensitive matching/application locks.
- Full views can expose organisation-authorized operational detail and actions.

## 13. Learning Center and universal hints

The Learning Center is a managed, searchable collection of all hints, tutorials, tips, references, and workflow resources for ExportPanel.

Current categories include Getting Started, Dashboard, Blueprints, Decisions and Ideas, Attention and Actions, Markets and Opportunities, Export Operations, Compliance and Evidence, Teams and Collaboration, and Settings and Security.

A unique universal hint icon appears beside non-obvious terminology, metrics, states, controls, and workflows. It opens a concise contextual explanation and links to the complete Learning Center resource. Hints do not replace clear labels; they supplement them.

Each maintained resource needs:

- stable topic ID;
- title and concise summary;
- full content;
- category and resource type;
- duration where useful;
- searchable keywords;
- review/maintenance ownership for regulatory content; and
- contextual links back to relevant work.

If information is enough to resolve a blocker, lead to the exact resource rather than a generic Learning Center homepage.

## 14. Provider marketplace and commercial integrity

Export HQ may earn disclosed lead, booking, coordination, or success commissions from qualified providers. This business model must improve—not distort—exporter outcomes.

Rules:

- Provider qualification precedes commercial placement.
- Quality ranking is independent of sponsorship or commission size.
- Sponsored placement is visibly labelled.
- Commission disclosure appears before a referral request is shared.
- Credentials, verification date, service scope, location, response expectation, fee guide, and conflicts should be available at the appropriate access level.
- Export HQ does not guarantee a provider’s legal conclusion, finance approval, customs outcome, certification, shipment, or buyer performance.
- Provider requests and work remain connected to the relevant blocker or Export Lane.
- Existing customer providers may be coordinated rather than replaced.

Provider categories should expand only when Export HQ has a credible qualification, disclosure, handoff, feedback, and dispute process.

## 15. Managed services and internal operations

Managed service is not a separate black box. Export HQ staff use explicit, time-bounded, reasoned access grants and work on the same domain records the customer sees.

The operations console should provide:

- assigned customer portfolio and health;
- risk and review queues;
- evidence review and blocker management;
- next-best actions;
- account-team ownership and service levels;
- provider coordination;
- customer communication; and
- an auditable route into a scoped customer workspace.

Staff are never silently added as customer members. Elevated access records customer, staff user, scope, reason, approver, start, expiry, revocation, and audit events.

## 16. Revenue architecture

### 16.1 Recurring software

Launch, Scale, Managed, and future institution licenses provide predictable recurring revenue. Plans expand capability without moving or recreating the customer’s existing evidence and history.

### 16.2 Managed execution

Readiness sprints, market validation, buyer development, evidence coordination, launch operations, and ongoing managed export work provide higher-value service revenue.

### 16.3 Transaction and referral revenue

Qualified provider, finance, testing, certification, insurance, inspection, customs, and logistics activity may generate disclosed usage-led revenue.

### 16.4 Institution and network intelligence

Banks, chambers, associations, and development programmes may pay for programme workflows, implementation, portfolio visibility, and privacy-preserving benchmarks. Customer-identifiable data is never sold or exposed without a valid purpose, authority, and agreement.

### 16.5 Future cluster economics

SME clusters can produce coordination and transaction revenue through shared testing, certification, capacity, order aggregation, and container consolidation. Cluster logic must preserve participant consent, commercial confidentiality, allocation rules, and clear liability.

## 17. Data and domain invariants

1. Organization is the customer tenancy boundary.
2. Every tenant-owned row carries `organization_id`.
3. Membership grants organization roles and permissions.
4. Staff access uses explicit grants, not customer membership impersonation.
5. Product-market/lane context controls readiness and applicability.
6. Requirement compliance needs appropriate evidence and review state.
7. Documents are linked business objects with immutable versions and private object keys.
8. Tasks identify customer, Export HQ, or third-party responsibility.
9. Audit events record chronological work and privileged changes and are append-only in production.
10. Friendly references are organization-scoped; public identifiers are non-sequential.
11. Money uses integer minor units and ISO currency in persisted business records.
12. Restricted fields are removed in server projections before rendering.

Future aggregates—buyer CRM, RFQs, quotations, samples, orders, production, quality, shipments, customs, invoices, payments, claims, services, and growth plans—must remain explicit business objects rather than fields in a universal table.

## 18. Evidence, content, and AI governance

- Regulatory and market guidance carries publisher, source URL, observed period/effective date, review date, confidence, and method version where relevant.
- Official sources are preferred; external commentary is clearly distinguished.
- Human review is required where legal, customs, finance, product safety, or material commercial risk is involved.
- AI may generate, extract, classify, embed, and answer with evidence through provider abstractions.
- AI suggestions never self-approve, silently mutate authoritative records, fabricate sources, or claim a professional decision.
- User-facing language says “guidance,” “screen,” “indicative,” or “requires confirmation” when certainty is not justified.
- Source and methodology corrections are retained and scheduled for review.

## 19. UX and interaction rules

### 19.1 Progressive disclosure

Ask only for information needed to produce the next useful outcome. Put advanced product and trade fields in Profile, Readiness, or Export Studio rather than initial account setup. Allow “unknown,” “complete later,” and save/resume when truthful.

### 19.2 Navigability

Every row, signal, summary, and card representing an entity should open its detail or clearly state why detail is unavailable. Project, organization, product, market, and lane relevance must be visible.

### 19.3 Actionability

Where a page presents a problem, it also presents the next action. Buttons must work, explain their disabled state, or be intentionally labelled preview-only. Avoid decorative controls.

### 19.4 State language

Status is communicated with text and icon/shape, never color alone. Use consistent terms for blocked, waiting, overdue, review, working, complete, preview, locked, pending verification, and verified.

### 19.5 Mobile

Mobile prioritizes status, approvals, tasks, messages, uploads, and next actions. Dense tables become stacked records rather than compressed horizontal grids. Locked and preview indicators remain visible.

### 19.6 Visual language

ExportPanel uses the light, calm Export HQ system: warm white surfaces, near-black text, safety orange for action/change, restrained support colors, compact readable typography, and tabular figures. Avoid an oppressive dark navigation rail. The Export HQ logo opens the public homepage in a new tab from ExportPanel.

### 19.7 Business switcher and account control

Business/organization switching and user/account actions belong in one coherent top-right account control. Users can add another business; each new organization begins with Basic capability and earns or purchases deeper access independently. Switching organizations must re-evaluate roles, onboarding, verification, and subscription entitlements.

## 20. Security and trust boundaries

- Deny by default at application and database boundaries.
- Authenticate with Clerk and re-authorize every organization-scoped read, write, export, download, and enumeration.
- Use PostgreSQL RLS as defense in depth, not a replacement for application authorization.
- Use a non-owner, non-`BYPASSRLS` application role and transaction-scoped tenant context.
- Keep R2/private evidence inaccessible without short-lived entity-authorized URLs.
- Scan/quarantine uploads and audit downloads.
- Validate input, use CSRF-safe mutations, secure headers/CSP, rate limiting, secret management, backups, and restore drills.
- Scrub confidential evidence and personal information from telemetry.
- Business-verification submission creates `pending`; only a trusted operations workflow can approve `verified`.
- Account deletion respects valid legal holds and retention policies.

Threat modelling and external security review are release gates before real exporter evidence is accepted at scale.

## 21. Integration truthfulness

External systems are adapter boundaries with explicit connection states. Never represent a government, bank, carrier, insurer, laboratory, customs, provider, buyer-data, or payment integration as live until credentials, contracts, security review, monitoring, and operational ownership exist.

UI sample data must be labelled illustrative. A provider request is not a confirmed booking. A finance path is not an approval. A shipment timeline is not a live carrier feed without an activated adapter.

## 22. Success metrics

### Customer outcomes

- lanes advanced to the next evidence-backed stage;
- blocker resolution time;
- readiness/evidence completion with appropriate review;
- time to qualified buyer conversation;
- quote-to-order and order-to-payment cycle time;
- gross-margin visibility and variance;
- on-time shipment and proceeds realization; and
- repeat exports and additional viable lanes.

### Product health

- public tool completion to account creation;
- account creation to first useful lane/readiness result;
- optional verification completion;
- preview-to-feature-unlock conversion;
- weekly active organizations with owned work;
- action completion and waiting-time reduction;
- Learning Center resolution rate; and
- data portability, security, and source-freshness performance.

### Business health

- recurring software revenue and retention;
- managed-service gross margin and service-level performance;
- disclosed partner/referral conversion and exporter satisfaction;
- institution programme revenue; and
- revenue concentration and conflict-of-interest monitoring.

Growth metrics must never reward hiding uncertainty, inflating scores, recommending inferior commissioned providers, or pressuring businesses to submit unnecessary evidence.

## 23. Delivery priorities

1. **Foundation:** production authentication, organization tenancy, entitlement rules, data persistence, private files, audit, and isolation tests.
2. **First revenue:** useful opportunity/readiness/economics workflows, paid readiness/managed sprints, and controlled provider requests.
3. **Retention:** buyer trust, quotations/deal room, shipment documents, proceeds tracking, and repeat-lane memory.
4. **Network:** reviewed finance/logistics/lab/government adapters, SME clusters, and institution workflows.
5. **Moat:** privacy-preserving cycle-time, rejection, margin, blocker, and lane-performance benchmarks.

Build the commercial spine before multiplying integrations.

## 24. Implementation truth as of 26 August 2026

### Implemented in code or verified local vertical slices

- Public website, ExportPanel customer application, and operations-console shell.
- Central preview/Basic/Launch/Scale/Managed entitlements and role permissions.
- Always-visible full/preview/locked navigation on desktop, mobile, and Settings.
- Safe progressive previews and mutation-disabled sample workflows.
- Frictionless organization-only onboarding.
- Market opportunity catalog and access projections.
- Conditional Bangladesh export-readiness model, saveable progress contract, evidence feedback model, Learning Center and provider-resolution paths.
- Export Lane and Export Studio domain models, calculations, public/member/full projections, and interactive preview adapters.
- Company/profile settings with optional product, market, channel, and verification detail.
- Clerk session boundary, organization-aware authorization, admin allowlist design, database schema, RLS envelope, and tests.

### Preview adapters or incomplete production persistence

- Several customer workflow records use realistic fixtures or browser-local state.
- Clerk organization metadata temporarily stores selected onboarding/readiness/profile state.
- Export Studio draft interactions are local preview adapters.
- Operations-console records are illustrative projections.

### Production activation still required

- Provisioned PostgreSQL repositories and transactional audit writes.
- Production RLS role and tenant-context verification.
- Private EU R2 upload, scanning, signed-download, and audit pipeline.
- Complete Clerk production methods, billing plans, webhooks, role templates, and MFA policy.
- Trusted business-verification review workflow.
- Reviewed live market/readiness catalog publishing operations.
- Qualified provider onboarding, agreements, disclosure, referral, feedback, and settlement operations.
- Reviewed government, banking, buyer, laboratory, freight, shipment, insurance, and proceeds adapters.
- End-to-end browser, cross-tenant, object-enumeration, backup, restore, rate-limit, and security testing.

Do not describe activation-backlog items as operational production capabilities.

## 25. Decision checklist for future changes

Before implementing a product change, answer:

1. Which customer outcome and Export Lane stage does it improve?
2. Who owns the resulting action?
3. What organization and lane context does the record carry?
4. What is public, member, full, preview, or locked?
5. What subscription, trust, role, and permission rules apply?
6. Does a locked capability remain visible with an exact unlock path?
7. Is any preview server-redacted and mutation-safe?
8. What evidence and review state justify completion or a score?
9. What happens when the user does not know the answer or hits a blocker?
10. Is there an exact Learning Center resource and, where relevant, a qualified provider path?
11. Does the flow ask for information only when it becomes useful?
12. Is the external integration real, or must it be labelled illustrative/disconnected?
13. Does the revenue mechanism create or disclose a conflict of interest?
14. Can a user navigate from the summary to detail and action?
15. Is the behavior usable and understandable on mobile and by keyboard?
16. Which server policy, domain model, test, audit event, and this document must be updated?

## 26. Non-negotiables

- Never hide premium capabilities so completely that users cannot discover them.
- Never expose private records in a preview.
- Never rely on navigation filtering as authorization.
- Never make HS code, SKU, pricing, or verification evidence mandatory during initial onboarding.
- Never call a business verified from self-submitted data alone.
- Never call a product or business universally compliant/export-ready.
- Never present an AI or scoring output as legal, customs, financial, or buyer certainty.
- Never fabricate live integrations, provider bookings, finance approvals, shipment events, or official-source status.
- Never rank a provider higher because Export HQ earns more commission.
- Never create unowned work, unlinked evidence, or signals without a detailed action path.
- Never reintroduce `TREVV` as the product name.

## 27. Repository source map

| Concern | Canonical implementation/reference |
| --- | --- |
| Product mission and principles | `docs/product-vision.md` |
| This system-wide business doctrine | `docs/BUSINESS_LOGIC.md` |
| Operating-system strategy | `docs/strategy/exportpanel-export-operating-system.html` |
| Entitlements and trust gates | `packages/authorization/src/index.ts` |
| Production identity/session policy | `packages/auth/src/index.ts`, `docs/production-auth.md` |
| Export Lane and Studio logic | `packages/domain/src/export-operating-system.ts` |
| Readiness logic | `packages/domain/src/export-readiness.ts` |
| Market intelligence | `packages/domain/src/market-opportunities.ts`, `docs/market-intelligence.md` |
| Tenant/domain persistence model | `packages/db/src/schema.ts`, `docs/domain-model.md` |
| Validation contracts | `packages/validation/src/index.ts` |
| Workspace feature map | `apps/app/app/_components/workspace-navigation.ts` |
| Learning resources and hints | `apps/app/app/_components/learning-catalog.ts`, `hint-button.tsx` |
| Production activation truth | `docs/implementation-status.md` |
| Brand and interaction guidance | `docs/brand/README.md`, `docs/brand/exportpanel/README.md` |
