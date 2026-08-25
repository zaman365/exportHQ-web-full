export type CaptureType = "task" | "idea" | "link" | "note";
export type CaptureHub = "inbox" | "germany-launch" | "compliance" | "buyer-pipeline" | "product-readiness";
export type CaptureDatePreset = "none" | "today" | "tomorrow" | "next-week";

export interface CapturedItem {
  id: string;
  content: string;
  type: CaptureType;
  hub: CaptureHub;
  createdAt: string;
  dueAt?: string;
  routedTo?: "waiting" | "ideas";
  routedRecordId?: string;
}

export type InboxRequestKind = "decision_request" | "mention" | "approval_request" | "follow_up" | "assignment";
export type InboxPriority = "urgent" | "high" | "normal";

export interface InboxRequest {
  id: string;
  kind: InboxRequestKind;
  title: string;
  summary: string;
  actor: string;
  source: string;
  createdAt: string;
  dueAt: string;
  priority: InboxPriority;
  relatedEntity: string;
  href: string;
  status: "open" | "done";
  doneAt?: string;
  snoozedUntil?: string;
}

export const capturedItemsStorageKey = "exportpanel.inbox.captured.v1";
export const inboxRequestsStorageKey = "exportpanel.inbox.requests.v1";

export const captureTypeLabels: Record<CaptureType, string> = {
  task: "Task",
  idea: "Idea",
  link: "Link",
  note: "Note"
};

export const captureHubLabels: Record<CaptureHub, string> = {
  inbox: "No Hub",
  "germany-launch": "Germany launch",
  compliance: "Compliance",
  "buyer-pipeline": "Buyer pipeline",
  "product-readiness": "Product readiness"
};

export const requestKindLabels: Record<InboxRequestKind, string> = {
  decision_request: "Decision request",
  mention: "Mention",
  approval_request: "Approval request",
  follow_up: "Follow-up",
  assignment: "Assignment"
};

export const inboxRequestSeeds: readonly InboxRequest[] = [
  {
    id: "inbox-packaging-decision",
    kind: "decision_request",
    title: "Choose the first packaging remediation scope",
    summary: "Anna compared the Germany-only correction with a reusable export packaging system and needs your direction.",
    actor: "Anna Keller",
    source: "Germany launch",
    createdAt: "2026-08-25T08:15:00.000Z",
    dueAt: "2026-08-26T15:00:00.000Z",
    priority: "urgent",
    relatedEntity: "Cotton T-shirt · Germany",
    href: "/decisions?record=decision-packaging-scope",
    status: "open"
  },
  {
    id: "inbox-certificate-mention",
    kind: "mention",
    title: "Can you confirm who owns the certificate upload?",
    summary: "Rahim mentioned you while clarifying the next accountable step for the OEKO-TEX evidence gap.",
    actor: "Rahim Chowdhury",
    source: "Compliance review",
    createdAt: "2026-08-25T07:40:00.000Z",
    dueAt: "2026-08-25T16:00:00.000Z",
    priority: "high",
    relatedEntity: "OEKO-TEX certificate",
    href: "/waiting?owner=Nadia%20Rahman",
    status: "open"
  },
  {
    id: "inbox-buyer-approval",
    kind: "approval_request",
    title: "Review the first buyer qualification scorecard",
    summary: "The shortlist is scored for fit, evidence expectations, payment quality, and indicative volume.",
    actor: "Anna Keller",
    source: "Buyer pipeline",
    createdAt: "2026-08-24T14:20:00.000Z",
    dueAt: "2026-08-27T12:00:00.000Z",
    priority: "normal",
    relatedEntity: "Germany buyer shortlist",
    href: "/decisions",
    status: "open"
  },
  {
    id: "inbox-evidence-follow-up",
    kind: "follow_up",
    title: "Supplier evidence follow-up is due",
    summary: "The requested fibre composition declaration has not arrived. Confirm the next follow-up checkpoint.",
    actor: "ExportPanel",
    source: "Product readiness",
    createdAt: "2026-08-24T09:00:00.000Z",
    dueAt: "2026-08-25T13:00:00.000Z",
    priority: "high",
    relatedEntity: "Cotton T-shirt",
    href: "/waiting",
    status: "open"
  },
  {
    id: "inbox-sample-assignment",
    kind: "assignment",
    title: "Confirm the sample kit owner",
    summary: "Lisa assigned the internal preparation step before the buyer sample Blueprint can start.",
    actor: "Lisa Morgan",
    source: "Buyer sample request",
    createdAt: "2026-08-23T11:30:00.000Z",
    dueAt: "2026-08-29T10:00:00.000Z",
    priority: "normal",
    relatedEntity: "Buyer sample kit",
    href: "/blueprints?record=bp-sample-request",
    status: "open"
  }
];

export function resolveCaptureDue(preset: CaptureDatePreset, now = new Date()): string | undefined {
  if (preset === "none") return undefined;
  const due = new Date(now);
  due.setHours(17, 0, 0, 0);
  if (preset === "tomorrow") due.setDate(due.getDate() + 1);
  if (preset === "next-week") due.setDate(due.getDate() + 7);
  return due.toISOString();
}

export function suggestCaptureType(content: string): CaptureType | undefined {
  const value = content.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value) || /\bwww\./i.test(value)) return "link";
  if (/^(idea|what if|explore|could we)\b/i.test(value)) return "idea";
  if (/^(remember|note|context)\b/i.test(value)) return "note";
  if (/\b(todo|follow up|send|review|confirm|upload|prepare|check)\b/i.test(value)) return "task";
  return undefined;
}

export function suggestCaptureDate(content: string): CaptureDatePreset | undefined {
  if (/\bnext week\b/i.test(content)) return "next-week";
  if (/\btomorrow\b/i.test(content)) return "tomorrow";
  if (/\btoday\b/i.test(content)) return "today";
  return undefined;
}
