export const legalDocumentSlugs = [
  "privacy",
  "terms",
  "dpa",
  "security",
  "subprocessors",
  "acceptable-use",
  "cookies",
  "imprint",
  "service-boundaries"
] as const;

export type LegalDocumentSlug = typeof legalDocumentSlugs[number];
export type LegalDocumentStatus = "draft" | "published" | "retired";

export interface LegalDocumentSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly items?: readonly string[];
}

export interface LegalDocumentDefinition {
  readonly id: string;
  readonly slug: LegalDocumentSlug;
  readonly title: string;
  readonly summary: string;
  readonly version: string;
  readonly status: LegalDocumentStatus;
  readonly contentHashSha256: string;
  readonly sections: readonly LegalDocumentSection[];
}

const commonBoundary =
  "Export HQ is not a government body, customs authority, bank, insurer, laboratory or law firm. The service supports evidence-aware decisions and coordination; it does not guarantee tariff classification, origin preference, regulatory compliance, finance, buyer acceptance or export success.";

export const legalDocuments: readonly LegalDocumentDefinition[] = [
  {
    id: "2be994a4-240a-48d0-ae9a-21d90c3dba6a",
    slug: "privacy",
    title: "Privacy notice",
    summary: "How Export HQ proposes to collect, use, protect and delete personal data.",
    version: "2026-08-29-draft.1",
    status: "draft",
    contentHashSha256: "3df670e02f20feb0e760393773142dae4ebd069a82999481eb3136d089511d43",
    sections: [
      { heading: "Status and controller", paragraphs: ["This is an engineering draft for independent privacy and legal review. It is not yet the effective customer notice. The final notice must identify the operating legal entity, registered address, applicable law and privacy contact before external real-data Alpha."] },
      { heading: "Data and purposes", paragraphs: ["The proposed service processes account and organization identity, contact and membership data, company and product records, export-lane work, uploaded evidence, support communications, security events and limited service telemetry."], items: ["Provide and secure the tenant workspace.", "Coordinate requested export-readiness and managed-service work.", "Meet recordkeeping, abuse-prevention, legal-hold and incident obligations.", "Improve the service only with approved, minimized and redacted analytics."] },
      { heading: "Sharing, location and retention", paragraphs: ["Access is limited by tenant, role and purpose. Approved infrastructure and service providers may process only the data necessary for their documented function. Production regions, transfers and retention periods remain activation-gated until the data inventory, transfer basis and deletion schedule are independently approved."] },
      { heading: "Rights and contact", paragraphs: ["A customer-data export, correction, restriction or deletion request will be authenticated, scoped, logged and checked for active legal holds. Requests can be sent to privacy@exporthq.com; the final response deadlines and supervisory-authority details depend on the approved jurisdictional analysis."] }
    ]
  },
  {
    id: "e40ee5d5-8014-4b0e-8f2b-6dba2b55c494",
    slug: "terms",
    title: "Terms of service",
    summary: "Proposed rules for accounts, subscriptions, managed work and responsible use.",
    version: "2026-08-29-draft.1",
    status: "draft",
    contentHashSha256: "9c5f6a6fc144c3f5535311d17060fa07e86ed4f02f77eb71458199acfb96c034",
    sections: [
      { heading: "Draft status", paragraphs: ["These terms are a product and engineering draft. They are not offered for acceptance until the operating entity, governing law, commercial schedule and independent legal review are complete."] },
      { heading: "Accounts and authority", paragraphs: ["A person creating or administering an organization must be authorized to act for it, keep credentials secure and maintain accurate account information. Tenant roles control access; a subscription never overrides authorization."] },
      { heading: "Human approval and service boundaries", paragraphs: [commonBoundary, "Users remain responsible for reviewing material legal, compliance, banking, commercial and external-communication consequences before acting. Export HQ will not send quotes, applications, referrals or commitments without the required recorded approval."] },
      { heading: "Commercial and exit terms", paragraphs: ["The final terms must state plan scope, fees, taxes, renewal, suspension, termination, data export, retention, warranties, liability allocation and dispute process. Those provisions are deliberately not invented in this draft."] }
    ]
  },
  {
    id: "6b5cdfa3-8523-45cf-9138-3944a79bfab0",
    slug: "dpa",
    title: "Data processing addendum",
    summary: "Proposed processor commitments for customer-controlled personal data.",
    version: "2026-08-29-draft.1",
    status: "draft",
    contentHashSha256: "fc786aab1c94a0e746dcd6aacba0ffb5643e3ca7c8383154a9423e7b3f692a0f",
    sections: [
      { heading: "Scope and roles", paragraphs: ["This draft anticipates Export HQ acting as processor for customer-controlled workspace data and as controller for its own account, security, billing and legal records. The final allocation depends on counsel review and the actual service arrangement."] },
      { heading: "Processing instructions", paragraphs: ["Customer data may be processed only to provide, secure and support the contracted service, on documented instructions and within approved tenant, region, retention and access boundaries."] },
      { heading: "Security and assistance", paragraphs: ["The proposed controls include least privilege, tenant row-level security, encryption in transit and at rest, private evidence quarantine, malware scanning, audit history, incident handling, authenticated rights requests and tested recovery. Controls not yet activated are identified on the Security page."] },
      { heading: "Subprocessors, transfers and deletion", paragraphs: ["The final addendum must incorporate the approved subprocessor list, advance-change process, transfer mechanism, deletion/export schedule, audit evidence and incident-notification window. No placeholder in this draft is a contractual commitment."] }
    ]
  },
  {
    id: "2f458b9c-c46f-451d-81ef-b5bb51b7e30a",
    slug: "security",
    title: "Security overview",
    summary: "Implemented controls, fail-closed production gates and reporting route.",
    version: "2026-08-29-draft.1",
    status: "draft",
    contentHashSha256: "522825bdeb628a2582b4c5d3595920a3d7f2a5b0c16a02d7af4bca7268514a47",
    sections: [
      { heading: "Implemented engineering controls", paragraphs: ["The application uses tenant-scoped PostgreSQL transactions, forced row-level security, separated database roles, server-side authorization, append-only audit records, idempotent webhook processing, secret redaction, security headers and fail-closed activation gates."] },
      { heading: "Activation-gated controls", paragraphs: ["Production credentials, Hyperdrive binding, private R2 storage, malware-scanner operations, provider applications, external monitoring, recovery approval and independent security review remain required before affected real-data capabilities become Live."] },
      { heading: "Reporting", paragraphs: ["Potential vulnerabilities should be reported privately to security@exporthq.com with reproduction details and without accessing another customer's data. A final coordinated-disclosure policy and response SLA require security approval."] }
    ]
  },
  {
    id: "11fb8cb8-7018-44ac-86c5-da4f2d8e793c",
    slug: "subprocessors",
    title: "Subprocessors",
    summary: "Proposed infrastructure providers and their activation state.",
    version: "2026-08-29-draft.1",
    status: "draft",
    contentHashSha256: "cf101335e44138e035b7824582e1e952d33d6a2a42128bd5c96b2f5ed6194da4",
    sections: [
      { heading: "Draft provider register", paragraphs: ["This register is not a final contractual subprocessor list. It records the currently proposed provider path so region, purpose, terms, transfers and security can be reviewed before real customer data is enabled."], items: ["Cloudflare — edge application hosting and planned private object storage; production bindings remain gated.", "Neon — proposed Frankfurt PostgreSQL service; locked roles are prepared and application credentials/Hyperdrive remain gated.", "Clerk — account and organization identity; paid Billing is deferred and webhook production activation remains gated.", "GitHub — source and hosted CI evidence; not an application customer-data store."] },
      { heading: "Changes", paragraphs: ["A production list must identify the contracting entity, processing purpose, region, transfer mechanism and notice/objection process for every approved subprocessor. Optional analytics, support or AI providers must not receive customer data before separate approval and configuration."] }
    ]
  },
  {
    id: "6dd8b3cf-b411-42c2-bc23-17bb240705ac",
    slug: "acceptable-use",
    title: "Acceptable use policy",
    summary: "Proposed restrictions that protect customers, providers and the platform.",
    version: "2026-08-29-draft.1",
    status: "draft",
    contentHashSha256: "828bd80aaa8d0359ef3caa54a0d09c6065eab4623aa4f5ac7f92d4419be8e8d5",
    sections: [
      { heading: "Permitted use", paragraphs: ["Use the service for lawful business research, readiness, evidence, collaboration and export execution within the permissions granted by your organization."] },
      { heading: "Prohibited use", paragraphs: ["Users must not bypass authorization, access another tenant, upload malware, submit unlawfully obtained personal or confidential data, misrepresent verification, automate abusive outreach, evade sanctions/export controls, interfere with service operation or use generated material as an unreviewed legal or banking instruction."] },
      { heading: "Enforcement", paragraphs: ["Export HQ may isolate content or suspend affected access to protect the service while investigating. The final notice, appeal, preservation and termination procedure requires legal and security approval."] }
    ]
  },
  {
    id: "253c1dfc-a98f-4eaf-801d-aee8773fe698",
    slug: "cookies",
    title: "Cookie policy",
    summary: "Proposed use of essential session storage and consent-gated analytics.",
    version: "2026-08-29-draft.1",
    status: "draft",
    contentHashSha256: "7264b37b57fca6eb3342ba44ab5db880e377c1767a72f25623da69b8a83de246",
    sections: [
      { heading: "Essential storage", paragraphs: ["The application may use identity-provider and security storage required to sign users in, select an organization, prevent abuse and preserve requested preferences. Essential storage is not used to claim consent for unrelated purposes."] },
      { heading: "Optional analytics", paragraphs: ["Non-essential analytics or advertising storage must remain off until the production inventory, legal basis, region-specific consent behavior and withdrawal mechanism are approved. Telemetry that is enabled must follow the metadata allowlist and exclude evidence, message bodies, credentials and signed URLs."] },
      { heading: "Controls", paragraphs: ["The effective policy will name each cookie or storage key, provider, purpose, duration and category and will explain how to change consent. This draft does not assert that a consent platform is active."] }
    ]
  },
  {
    id: "fd9ca718-8d86-4850-a6e4-6fdddf16b1ed",
    slug: "imprint",
    title: "Company and imprint information",
    summary: "Operator details that must be completed before external contracting.",
    version: "2026-08-29-draft.1",
    status: "draft",
    contentHashSha256: "efbaff254ff69a774db522479eba89dd2cdce04866874768708c6a0a43c260df",
    sections: [
      { heading: "Operator status", paragraphs: ["Export HQ is the product and trading identity used in this repository. The operating legal entity, registered office, registration number, tax details, responsible representative and applicable regulator have not been supplied for publication and must be verified before external contracting or real-data Alpha."] },
      { heading: "Contact", paragraphs: ["General: hello@exporthq.com. Privacy: privacy@exporthq.com. Security: security@exporthq.com. These routes require operational ownership and response procedures before the page becomes effective."] },
      { heading: "No inferred identity", paragraphs: ["Repository ownership, a domain name or a founder development authorization is not a substitute for verified company/imprint information. The service will fail closed rather than invent legal-entity details."] }
    ]
  },
  {
    id: "8c4f2969-99dc-4bfa-8d6e-43292cbdb932",
    slug: "service-boundaries",
    title: "Service and referral boundaries",
    summary: "What Export HQ coordinates, what requires approval and what it does not guarantee.",
    version: "2026-08-29-draft.1",
    status: "draft",
    contentHashSha256: "b59381c81f6f94de2e6edd1b07336b2b57c7365556eecfc828e2d124a177bd1a",
    sections: [
      { heading: "Decision support", paragraphs: [commonBoundary, "Sources, confidence, freshness, assumptions and reviewer state should accompany material suggestions. Customers must correct inaccurate facts and obtain qualified advice when the consequence requires it."] },
      { heading: "Managed work", paragraphs: ["A visible task or support request is not a promise that Export HQ or a third party has accepted the work. Scope, owner, fee, deadline, evidence and approval must be recorded before a managed commitment is represented as active."] },
      { heading: "Referrals and fees", paragraphs: ["Provider identities and referrals remain hidden until credential, privacy, legal, security and commercial governance is active. Any introduction must disclose provider independence, selection basis, fees or commissions, data shared and required customer acceptance. Export HQ does not guarantee provider performance or approval outcomes."] },
      { heading: "External actions", paragraphs: ["Quotes, applications, filings, buyer outreach, finance requests, shipment instructions and settlement actions require the responsible human's explicit recorded confirmation. Automation may prepare or coordinate them but must not silently create legal or commercial consequences."] }
    ]
  }
] as const;

export function findLegalDocument(slug: string): LegalDocumentDefinition | undefined {
  return legalDocuments.find((document) => document.slug === slug);
}

export function canonicalLegalDocumentText(document: LegalDocumentDefinition): string {
  return JSON.stringify({
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    version: document.version,
    sections: document.sections
  });
}
