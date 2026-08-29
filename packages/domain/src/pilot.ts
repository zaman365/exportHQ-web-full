export const firstShipmentPassHypothesis = {
  productKey: "first_shipment_pass",
  name: "First Shipment Pass",
  priceMinor: 750000,
  currency: "BDT",
  durationDays: 90,
  activeLaneLimit: 1,
  editorLimit: 3,
  annualLaunchCreditBps: 10000,
  checkoutStatus: "manual_alpha_only"
} as const;

export const privateAlphaAgreement = {
  version: "2026-08-29-internal.1",
  status: "internal_draft",
  contentHashSha256: "242feec71b64f30f038035ded4c67ee696c6f4b9c61eb5c3b870ec5bb00fb5fe",
  title: "Export HQ Private Alpha participation agreement",
  sections: [
    { heading: "Scope", body: "The internal/synthetic Alpha is limited to Business Passport, one Export Lane, readiness, evidence lifecycle testing, tasks, verification and named managed-work cases. It does not represent all export operations or a production service." },
    { heading: "Data handling", body: "Only synthetic data may be used until the production identity, database, R2/scanner, recovery and independent review gates are active. Tenant isolation, least privilege, retention, legal hold and authenticated export/deletion procedures remain mandatory." },
    { heading: "Support", body: "Every managed-work case has a named owner, written scope, responsibility and response target. Participation does not include unlimited specialist time, guaranteed regulatory outcomes, finance, buyers, shipment success or legal advice." },
    { heading: "Research", body: "Export HQ may record minimized product events, support minutes, correction counts, trust feedback, willingness-to-pay hypotheses and the coordination burden replaced. Evidence contents, message bodies and credentials are excluded from analytics." },
    { heading: "Exit", body: "The participant may withdraw from the internal Alpha. Export, deletion and retention follow the documented classification and legal-hold workflow. Alpha learning may change product scope and pricing without activating public checkout." }
  ]
} as const;

export function canonicalPrivateAlphaAgreement(): string {
  return JSON.stringify({
    version: privateAlphaAgreement.version,
    title: privateAlphaAgreement.title,
    sections: privateAlphaAgreement.sections
  });
}
