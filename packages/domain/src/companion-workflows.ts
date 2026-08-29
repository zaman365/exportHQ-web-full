export type CompanionWorkflowType =
  | "bsw_clp_preparation"
  | "erc_olm_renewal"
  | "epb_exporter_pack"
  | "gsp_origin_pack"
  | "cash_incentive_pack"
  | "ad_bank_exp_proceeds"
  | "forwarder_handoff"
  | "eu_tariff_origin_evidence";

export interface CompanionWorkflowTemplate {
  readonly workflowType: CompanionWorkflowType;
  readonly title: string;
  readonly preparationOnly: true;
  readonly reminderDaysBeforeDue: number | null;
  readonly portalMaxBytes: number | null;
  readonly itemTitles: readonly string[];
}
export const portalCompatibleTwoMegabytes = 2 * 1024 * 1024;

export const companionWorkflowTemplates: Readonly<Record<CompanionWorkflowType, CompanionWorkflowTemplate>> = {
  bsw_clp_preparation: { workflowType: "bsw_clp_preparation", title: "BSW registration and CLP preparation", preparationOnly: true, reminderDaysBeforeDue: null, portalMaxBytes: null, itemTitles: ["Confirm registration facts", "Prepare CLP evidence", "Customer submits in official portal", "Capture acknowledgement"] },
  erc_olm_renewal: { workflowType: "erc_olm_renewal", title: "ERC / OLM renewal", preparationOnly: true, reminderDaysBeforeDue: 60, portalMaxBytes: portalCompatibleTwoMegabytes, itemTitles: ["Confirm renewal date", "Prepare portal-compatible evidence", "Customer submits in OLM", "Capture renewal evidence"] },
  epb_exporter_pack: { workflowType: "epb_exporter_pack", title: "EPB exporter evidence pack", preparationOnly: true, reminderDaysBeforeDue: null, portalMaxBytes: null, itemTitles: ["Confirm exporter profile", "Prepare EPB evidence", "Customer submits", "Capture outcome"] },
  gsp_origin_pack: { workflowType: "gsp_origin_pack", title: "GSP / origin evidence pack", preparationOnly: true, reminderDaysBeforeDue: null, portalMaxBytes: null, itemTitles: ["Confirm origin rule source", "Prepare product origin facts", "Review supporting evidence", "Capture issued evidence"] },
  cash_incentive_pack: { workflowType: "cash_incentive_pack", title: "Cash-incentive evidence pack", preparationOnly: true, reminderDaysBeforeDue: null, portalMaxBytes: null, itemTitles: ["Confirm current eligibility source", "Prepare shipment and proceeds evidence", "AD-bank review handoff", "Capture outcome"] },
  ad_bank_exp_proceeds: { workflowType: "ad_bank_exp_proceeds", title: "AD-bank / EXP / proceeds checklist", preparationOnly: true, reminderDaysBeforeDue: null, portalMaxBytes: null, itemTitles: ["Prepare EXP facts", "Prepare shipment documents", "Track discrepancy clock", "Match realized proceeds"] },
  forwarder_handoff: { workflowType: "forwarder_handoff", title: "C&F / forwarder handoff", preparationOnly: true, reminderDaysBeforeDue: null, portalMaxBytes: null, itemTitles: ["Prepare handoff cover", "Attach approved document set", "Record forwarder acknowledgement", "Close handoff"] },
  eu_tariff_origin_evidence: { workflowType: "eu_tariff_origin_evidence", title: "EU tariff, origin and requirement evidence", preparationOnly: true, reminderDaysBeforeDue: null, portalMaxBytes: null, itemTitles: ["Capture Access2Markets source", "Capture ROSA origin analysis", "Review destination requirements", "Link evidence to lane"] }
};

export function companionReminderAt(type: CompanionWorkflowType, dueAt: Date | null): Date | null {
  const days = companionWorkflowTemplates[type].reminderDaysBeforeDue;
  if (!dueAt || days == null) return null;
  return new Date(dueAt.getTime() - days * 24 * 60 * 60_000);
}
