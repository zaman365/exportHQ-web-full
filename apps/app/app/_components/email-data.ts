import type { EmailProviderId } from "@exporthq/domain";
import type { InboxRequest } from "./inbox-data";

export type EmailCategory = "all" | "unread" | "flagged" | "buyers" | "compliance" | "logistics" | "finance";

export interface EmailMessagePreview {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientLabel: string;
  sentAt: string;
  body: string;
  outgoing?: boolean;
}

export interface EmailThreadPreview {
  id: string;
  provider: EmailProviderId;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  latestMessageAt: string;
  unread: boolean;
  flagged: boolean;
  category: Exclude<EmailCategory, "all" | "unread" | "flagged">;
  attachmentNames: string[];
  relatedEntity: string;
  relatedHref: string;
  suggestedAction: string;
  messages: EmailMessagePreview[];
}

export const emailDraftStorageKey = "exportpanel.email.drafts.v1";

export const emailThreadSeeds: readonly EmailThreadPreview[] = [
  {
    id: "mail-buyer-sample",
    provider: "google",
    senderName: "Lena Vogt",
    senderEmail: "lena.vogt@hansehandel.example",
    subject: "Sample set and delivery window for Hamburg review",
    snippet: "The product team can review the cotton T-shirt range next Thursday. Could you confirm the sample composition and dispatch date?",
    latestMessageAt: "2026-08-26T08:32:00.000Z",
    unread: true,
    flagged: true,
    category: "buyers",
    attachmentNames: ["sample-requirements.pdf"],
    relatedEntity: "Germany buyer shortlist · Hanse Handel",
    relatedHref: "/studio?panel=buyers",
    suggestedAction: "Confirm the sample owner and dispatch checkpoint before replying.",
    messages: [{
      id: "mail-buyer-sample-1",
      senderName: "Lena Vogt",
      senderEmail: "lena.vogt@hansehandel.example",
      recipientLabel: "exports@abctextiles.example",
      sentAt: "2026-08-26T08:32:00.000Z",
      body: "Hello Nadia,\n\nThe product team can review the cotton T-shirt range next Thursday. Could you confirm the sample composition, available colourways, and expected dispatch date? I attached our sample-reception requirements.\n\nKind regards,\nLena"
    }]
  },
  {
    id: "mail-lab-evidence",
    provider: "microsoft",
    senderName: "Shafiq Hasan",
    senderEmail: "shafiq@qualitylab.example",
    subject: "Test scope clarification required before quotation",
    snippet: "Please confirm whether all three colour variants use the same dye process. The answer changes the test set and turnaround time.",
    latestMessageAt: "2026-08-26T07:18:00.000Z",
    unread: true,
    flagged: false,
    category: "compliance",
    attachmentNames: [],
    relatedEntity: "Product readiness · REACH evidence",
    relatedHref: "/readiness",
    suggestedAction: "Ask Product & Quality to confirm the dye process, then return the answer to the lab.",
    messages: [{
      id: "mail-lab-evidence-1",
      senderName: "Shafiq Hasan",
      senderEmail: "shafiq@qualitylab.example",
      recipientLabel: "quality@abctextiles.example",
      sentAt: "2026-08-26T07:18:00.000Z",
      body: "Dear team,\n\nBefore we issue the quotation, please confirm whether navy, white, and rust use the same dye and finishing process. If not, each variant may need a separate restricted-substances screen.\n\nRegards,\nShafiq"
    }]
  },
  {
    id: "mail-freight-quote",
    provider: "custom_imap",
    senderName: "Mehedi Karim",
    senderEmail: "mehedi@bayfreight.example",
    subject: "Indicative air and sea options — Dhaka to Hamburg",
    snippet: "I included two routes and the document cut-off. Rates remain indicative until chargeable weight and pickup address are confirmed.",
    latestMessageAt: "2026-08-25T15:42:00.000Z",
    unread: false,
    flagged: true,
    category: "logistics",
    attachmentNames: ["DHA-HAM-options.xlsx"],
    relatedEntity: "Germany launch · Sample shipment",
    relatedHref: "/studio?panel=delivery",
    suggestedAction: "Compare the delivery promise and landed cost before selecting a route.",
    messages: [{
      id: "mail-freight-quote-1",
      senderName: "Mehedi Karim",
      senderEmail: "mehedi@bayfreight.example",
      recipientLabel: "logistics@abctextiles.example",
      sentAt: "2026-08-25T15:42:00.000Z",
      body: "Hello,\n\nI included express air and consolidated sea options from Dhaka to Hamburg. Rates are indicative until you confirm chargeable weight, carton dimensions, pickup address, and the required delivery date.\n\nBest,\nMehedi"
    }]
  },
  {
    id: "mail-payment-terms",
    provider: "google",
    senderName: "Farhan Islam",
    senderEmail: "farhan@abctextiles.example",
    subject: "Review needed: proposed 60-day buyer terms",
    snippet: "The buyer asked for open-account terms after the pilot. I need your view before Finance responds or requests bank guidance.",
    latestMessageAt: "2026-08-25T12:06:00.000Z",
    unread: false,
    flagged: true,
    category: "finance",
    attachmentNames: ["buyer-term-sheet.pdf"],
    relatedEntity: "Germany buyer · Payment protection",
    relatedHref: "/decisions",
    suggestedAction: "Create a Decision comparing open account, confirmed LC, and insured terms.",
    messages: [{
      id: "mail-payment-terms-1",
      senderName: "Farhan Islam",
      senderEmail: "farhan@abctextiles.example",
      recipientLabel: "Nadia Rahman",
      sentAt: "2026-08-25T12:06:00.000Z",
      body: "Hi Nadia,\n\nThe buyer asked for 60-day open-account terms after the pilot order. Before Finance replies, can we compare this against a confirmed LC and a credit-insured route? I attached the draft term sheet.\n\nFarhan"
    }]
  },
  {
    id: "mail-label-copy",
    provider: "microsoft",
    senderName: "Anna Keller",
    senderEmail: "anna.keller@export-hq.example",
    subject: "German care-label wording ready for your review",
    snippet: "The wording is ready, but the fibre percentages must match the controlled specification before artwork approval.",
    latestMessageAt: "2026-08-24T16:24:00.000Z",
    unread: false,
    flagged: false,
    category: "compliance",
    attachmentNames: ["care-label-copy-v2.docx"],
    relatedEntity: "Cotton T-shirt · Germany labelling",
    relatedHref: "/readiness",
    suggestedAction: "Check the fibre declaration against the controlled product specification.",
    messages: [{
      id: "mail-label-copy-1",
      senderName: "Anna Keller",
      senderEmail: "anna.keller@export-hq.example",
      recipientLabel: "Nadia Rahman",
      sentAt: "2026-08-24T16:24:00.000Z",
      body: "Hello Nadia,\n\nThe German care-label wording is ready. Please confirm that the fibre percentages match the current controlled specification before the artwork is approved.\n\nAnna"
    }]
  }
];

export function emailThreadToInboxRequest(thread: EmailThreadPreview, now = new Date()): InboxRequest {
  const due = new Date(now);
  due.setDate(due.getDate() + 1);
  due.setHours(16, 0, 0, 0);
  return {
    id: `email-follow-up-${thread.id}`,
    kind: thread.category === "finance" ? "decision_request" : "follow_up",
    title: thread.subject,
    summary: thread.suggestedAction,
    actor: thread.senderName,
    source: "Email Inbox",
    createdAt: now.toISOString(),
    dueAt: due.toISOString(),
    priority: thread.flagged ? "high" : "normal",
    relatedEntity: thread.relatedEntity,
    href: thread.relatedHref,
    status: "open"
  };
}
