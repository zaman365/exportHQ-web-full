import type { Responsibility } from "@exporthq/domain";
import type { BlueprintDefinition } from "./workflow-data";

export type DecisionStatus = "draft" | "in_review" | "approved" | "superseded";
export type DecisionCategory = "Market" | "Product" | "Compliance" | "Commercial" | "Operations";

export interface DecisionOption {
  id: string;
  label: string;
  tradeoff: string;
  selected: boolean;
}

export interface DecisionRecord {
  id: string;
  title: string;
  summary: string;
  context: string;
  category: DecisionCategory;
  status: DecisionStatus;
  owner: string;
  reviewers: string[];
  createdAt: string;
  reviewDue: string;
  decidedAt?: string;
  relatedEntity: string;
  evidence: string[];
  options: DecisionOption[];
  rationale: string;
}

export type IdeaStage = "inbox" | "exploring" | "shortlisted" | "archived";
export type IdeaCategory = "Market" | "Product" | "Buyer" | "Compliance" | "Operations";

export interface IdeaRecord {
  id: string;
  title: string;
  summary: string;
  category: IdeaCategory;
  stage: IdeaStage;
  owner: string;
  createdAt: string;
  votes: number;
  impact: 1 | 2 | 3;
  effort: 1 | 2 | 3;
  relatedEntity: string;
  notes: string;
  promotedTo?: "decision" | "blueprint";
  promotedRecordId?: string;
}

export type TeamGroup = "Company" | "Export HQ" | "Partner";
export type TeamAvailability = "available" | "focused" | "away";
export type TeamAccessRole = "owner" | "executive" | "department_lead" | "manager" | "member" | "viewer" | "external";

export interface TeamAccessDefinition {
  id: TeamAccessRole;
  label: string;
  rank: number;
  summary: string;
  capabilities: readonly string[];
}

export interface TeamProfile {
  id: string;
  name: string;
  initials: string;
  role: string;
  group: TeamGroup;
  availability: TeamAvailability;
  capacity: number;
  activeHandoffs: number;
  response: string;
  focus: string;
  skills: string[];
  email: string;
  accessRole: TeamAccessRole;
  accessScope: string;
  departmentIds: string[];
}

export interface BusinessTeam {
  id: string;
  name: string;
  purpose: string;
  leadId: string;
  memberIds: string[];
  channelId: string;
  createdAt: string;
}

export type TeamConversationKind = "department" | "direct" | "export_hq";

export interface TeamConversation {
  id: string;
  title: string;
  kind: TeamConversationKind;
  participantIds: string[];
  teamId?: string;
  relatedEntity?: string;
  unread: number;
  lastActivity: string;
}

export interface TeamMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAt: string;
  delivery: "sent" | "read";
}

export type CreateRecordType = "decision" | "idea" | "task" | "blueprint";

export interface RecentCreatedRecord {
  id: string;
  type: CreateRecordType;
  title: string;
  createdAt: string;
  href: string;
}

export const decisionsStorageKey = "exportpanel.decisions.v1";
export const ideasStorageKey = "exportpanel.ideas.v1";
export const recentCreatedStorageKey = "exportpanel.create.recent.v1";
export const teamProfilesStorageKey = "exportpanel.team.profiles.v2";
export const businessTeamsStorageKey = "exportpanel.team.departments.v2";
export const teamConversationsStorageKey = "exportpanel.team.conversations.v2";
export const teamMessagesStorageKey = "exportpanel.team.messages.v2";

export const teamAccessCatalog: Readonly<Record<TeamAccessRole, TeamAccessDefinition>> = {
  owner: { id: "owner", label: "Company owner", rank: 100, summary: "Full organization control, team creation, access, billing, and every approved workflow.", capabilities: ["Create teams", "Manage every member", "Billing & security", "All company records"] },
  executive: { id: "executive", label: "Executive", rank: 80, summary: "Cross-company operating access without ownership transfer or protected billing changes.", capabilities: ["Cross-team visibility", "Approvals", "Company operations"] },
  department_lead: { id: "department_lead", label: "Department lead", rank: 60, summary: "Coordinates assigned departments, their work, and member handoffs without owner controls.", capabilities: ["Coordinate assigned teams", "Assign work", "Department records"] },
  manager: { id: "manager", label: "Manager", rank: 45, summary: "Coordinates work and messages in assigned teams without changing organization access.", capabilities: ["Coordinate work", "Team messages", "Assigned records"] },
  member: { id: "member", label: "Member", rank: 30, summary: "Contributes to assigned workspaces and conversations.", capabilities: ["Assigned work", "Team messages", "Shared evidence"] },
  viewer: { id: "viewer", label: "Viewer", rank: 10, summary: "Read-only access to explicitly shared teams and records.", capabilities: ["Read shared records", "Follow conversations"] },
  external: { id: "external", label: "External partner", rank: 0, summary: "Limited access to explicitly shared handoffs; never a default company member.", capabilities: ["Shared handoffs only", "Scoped messages"] }
};

export const decisionSeeds: readonly DecisionRecord[] = [
  {
    id: "decision-germany-entry",
    title: "Prioritize Germany for the first managed launch",
    summary: "Concentrate readiness, buyer research, and commercial validation on Germany before opening a second EU market.",
    context: "The product range has viable demand signals in Germany, while evidence and packaging work would be duplicated if several EU markets started at once.",
    category: "Market",
    status: "approved",
    owner: "Nadia Rahman",
    reviewers: ["Anna Keller", "Rahim Chowdhury"],
    createdAt: "2026-07-18T09:00:00.000Z",
    reviewDue: "2026-10-01T09:00:00.000Z",
    decidedAt: "2026-07-24T14:30:00.000Z",
    relatedEntity: "Germany market plan",
    evidence: ["Germany market attractiveness brief", "Readiness baseline · 67%", "Buyer longlist v1"],
    options: [
      { id: "germany", label: "Germany first", tradeoff: "Highest fit and focus; requires German packaging remediation.", selected: true },
      { id: "multi-eu", label: "Parallel EU launch", tradeoff: "More reach, but fragments evidence and buyer-development capacity.", selected: false },
      { id: "defer", label: "Defer market entry", tradeoff: "Preserves cash but loses the current buyer-research window.", selected: false }
    ],
    rationale: "Germany offers the strongest combination of buyer fit, research coverage, and specialist capacity. A focused launch keeps every remediation tied to one commercial outcome."
  },
  {
    id: "decision-oekotex-renewal",
    title: "Renew OEKO-TEX evidence before buyer outreach",
    summary: "Treat the current certificate renewal as a launch dependency rather than a post-outreach follow-up.",
    context: "The current certificate is not sufficient for the planned product-market review and would create avoidable qualification friction with shortlisted buyers.",
    category: "Compliance",
    status: "in_review",
    owner: "Rahim Chowdhury",
    reviewers: ["Nadia Rahman", "Lisa Morgan"],
    createdAt: "2026-08-14T08:15:00.000Z",
    reviewDue: "2026-08-28T12:00:00.000Z",
    relatedEntity: "OEKO-TEX certificate",
    evidence: ["Current certificate", "Germany evidence gap review"],
    options: [
      { id: "renew-now", label: "Renew before outreach", tradeoff: "Adds lead time now and reduces buyer qualification risk.", selected: true },
      { id: "parallel", label: "Renew during outreach", tradeoff: "Moves faster but requires a transparent evidence caveat.", selected: false }
    ],
    rationale: "Proposed direction: renew first because this evidence supports several buyer and product claims. Final approval waits on the laboratory lead time."
  },
  {
    id: "decision-incoterm",
    title: "Use FCA as the initial wholesale quotation basis",
    summary: "Quote the pilot offer on FCA terms while logistics lanes and importer expectations are validated.",
    context: "The team can control export clearance and origin handoff, but landed-delivery pricing still contains uncertain destination costs.",
    category: "Commercial",
    status: "approved",
    owner: "Nadia Rahman",
    reviewers: ["Lisa Morgan"],
    createdAt: "2026-08-02T11:00:00.000Z",
    reviewDue: "2026-11-01T09:00:00.000Z",
    decidedAt: "2026-08-06T15:00:00.000Z",
    relatedEntity: "Germany wholesale offer",
    evidence: ["Freight assumption sheet", "Pilot quotation model"],
    options: [
      { id: "fca", label: "FCA origin terminal", tradeoff: "Clearer cost boundary; buyer manages main carriage.", selected: true },
      { id: "dap", label: "DAP buyer warehouse", tradeoff: "Simpler for the buyer; exposes ABC Textiles to destination-cost variance.", selected: false }
    ],
    rationale: "FCA produces a defensible first price while the company gathers lane-specific freight and destination handling evidence."
  },
  {
    id: "decision-packaging-scope",
    title: "Choose the first packaging remediation scope",
    summary: "Decide whether to correct Germany labels only or redesign the shared export packaging system.",
    context: "The Germany review identified language and traceability gaps, while other market plans may require overlapping changes later.",
    category: "Product",
    status: "draft",
    owner: "Nadia Rahman",
    reviewers: ["Anna Keller"],
    createdAt: "2026-08-22T10:40:00.000Z",
    reviewDue: "2026-09-03T09:00:00.000Z",
    relatedEntity: "Cotton T-shirt · Germany",
    evidence: ["Packaging gap note"],
    options: [
      { id: "germany-only", label: "Germany-only correction", tradeoff: "Fastest launch path, with possible rework for later markets.", selected: false },
      { id: "shared-system", label: "Shared export packaging", tradeoff: "Higher design effort now, with more reusable components.", selected: false }
    ],
    rationale: "No direction recorded yet. The team still needs the cost and lead-time comparison."
  },
  {
    id: "decision-old-buyer-score",
    title: "Use a volume-first buyer scoring model",
    summary: "An earlier scoring model that over-weighted indicative annual order volume.",
    context: "The model was replaced after the team found that evidence fit and payment quality were stronger early-stage predictors.",
    category: "Commercial",
    status: "superseded",
    owner: "Anna Keller",
    reviewers: ["Nadia Rahman"],
    createdAt: "2026-06-11T09:00:00.000Z",
    reviewDue: "2026-07-15T09:00:00.000Z",
    decidedAt: "2026-06-15T09:00:00.000Z",
    relatedEntity: "Buyer qualification model v1",
    evidence: ["Buyer scorecard v1", "Qualification sprint retrospective"],
    options: [{ id: "volume", label: "Volume-first scoring", tradeoff: "Simple demand signal, weak view of execution risk.", selected: true }],
    rationale: "Superseded by the balanced fit, evidence, payment, and volume scorecard. Kept for decision history."
  }
];

export const ideaSeeds: readonly IdeaRecord[] = [
  { id: "idea-fabric-passport", title: "Create a buyer-facing fabric evidence passport", summary: "Package composition, test, certificate, and origin evidence into one controlled buyer review link.", category: "Product", stage: "shortlisted", owner: "Rahim Chowdhury", createdAt: "2026-08-19T09:00:00.000Z", votes: 8, impact: 3, effort: 2, relatedEntity: "Cotton T-shirt", notes: "Validate what can be shared before designing the buyer view." },
  { id: "idea-nordics", title: "Test a Nordic workwear buyer segment", summary: "Explore whether durable cotton basics fit smaller responsible-sourcing distributors in Denmark and Sweden.", category: "Market", stage: "exploring", owner: "Anna Keller", createdAt: "2026-08-20T12:00:00.000Z", votes: 5, impact: 2, effort: 2, relatedEntity: "Market discovery", notes: "Needs a market-size check and channel comparison before promotion." },
  { id: "idea-sample-kit", title: "Standardize the buyer sample kit", summary: "Create one repeatable sample presentation, evidence insert, feedback form, and dispatch checklist.", category: "Buyer", stage: "shortlisted", owner: "Lisa Morgan", createdAt: "2026-08-16T10:20:00.000Z", votes: 11, impact: 3, effort: 1, relatedEntity: "Buyer qualification", notes: "Strong candidate for a Blueprint after one pilot." },
  { id: "idea-capacity-feed", title: "Publish a monthly production-capacity signal", summary: "Give the commercial team a simple verified capacity range for realistic buyer conversations.", category: "Operations", stage: "inbox", owner: "Nadia Rahman", createdAt: "2026-08-24T15:20:00.000Z", votes: 3, impact: 2, effort: 1, relatedEntity: "Factory profile", notes: "Clarify who verifies the number and how often." },
  { id: "idea-label-library", title: "Build reusable EU label content blocks", summary: "Maintain reviewed label clauses that can be assembled by product and destination.", category: "Compliance", stage: "exploring", owner: "Rahim Chowdhury", createdAt: "2026-08-12T08:40:00.000Z", votes: 7, impact: 3, effort: 3, relatedEntity: "Packaging review", notes: "Start with textile composition and care statements; provenance is mandatory." },
  { id: "idea-qr-story", title: "Add a QR origin story to wholesale samples", summary: "Test whether a concise factory and materials story improves buyer follow-up after sampling.", category: "Buyer", stage: "inbox", owner: "Nadia Rahman", createdAt: "2026-08-25T07:30:00.000Z", votes: 2, impact: 1, effort: 1, relatedEntity: "Sample request", notes: "Keep marketing claims separate from verified compliance evidence." },
  { id: "idea-marketplace", title: "List the core range on a general marketplace", summary: "An archived channel idea that did not match the controlled wholesale launch strategy.", category: "Market", stage: "archived", owner: "Anna Keller", createdAt: "2026-07-08T09:00:00.000Z", votes: 1, impact: 1, effort: 3, relatedEntity: "Channel strategy", notes: "Archived after unit economics and positioning review." }
];

export const teamProfiles: readonly TeamProfile[] = [
  { id: "team-nadia", name: "Nadia Rahman", initials: "NR", role: "Managing Director", group: "Company", availability: "available", capacity: 62, activeHandoffs: 4, response: "Usually within 2h", focus: "Product evidence and commercial approvals", skills: ["Commercial", "Products", "Approvals"], email: "nadia@abctextiles.example", accessRole: "owner", accessScope: "Entire organization", departmentIds: ["team-leadership", "team-sales-marketing", "team-operations-compliance"] },
  { id: "team-kamal", name: "Kamal Hossain", initials: "KH", role: "Head of Operations", group: "Company", availability: "focused", capacity: 78, activeHandoffs: 3, response: "Usually within 4h", focus: "Factory capacity, costing, and sample execution", skills: ["Operations", "Costing", "Samples"], email: "kamal@abctextiles.example", accessRole: "department_lead", accessScope: "Operations & Compliance", departmentIds: ["team-operations-compliance"] },
  { id: "team-samira", name: "Samira Ahmed", initials: "SA", role: "Sales & Marketing Manager", group: "Company", availability: "available", capacity: 57, activeHandoffs: 2, response: "Usually within 3h", focus: "Buyer outreach, campaigns, and sample follow-up", skills: ["Sales", "Marketing", "Buyers"], email: "samira@abctextiles.example", accessRole: "manager", accessScope: "Sales & Marketing", departmentIds: ["team-sales-marketing"] },
  { id: "team-anna", name: "Anna Keller", initials: "AK", role: "Market Lead", group: "Export HQ", availability: "available", capacity: 68, activeHandoffs: 5, response: "Average 2h 10m", focus: "Germany market entry and buyer qualification", skills: ["Germany", "Market research", "Buyers"], email: "anna@exporthq.example", accessRole: "external", accessScope: "Explicit managed-service grant", departmentIds: ["team-export-hq"] },
  { id: "team-rahim", name: "Rahim Chowdhury", initials: "RC", role: "Compliance Specialist", group: "Export HQ", availability: "focused", capacity: 84, activeHandoffs: 6, response: "Average 3h 05m", focus: "Product evidence and Germany requirements", skills: ["Compliance", "Evidence", "Textiles"], email: "rahim@exporthq.example", accessRole: "external", accessScope: "Explicit managed-service grant", departmentIds: ["team-export-hq"] },
  { id: "team-lisa", name: "Lisa Morgan", initials: "LM", role: "Trade Operations", group: "Export HQ", availability: "available", capacity: 53, activeHandoffs: 3, response: "Average 3h 24m", focus: "Quotations, logistics assumptions, and handoffs", skills: ["Logistics", "Incoterms", "Quotations"], email: "lisa@exporthq.example", accessRole: "external", accessScope: "Explicit managed-service grant", departmentIds: ["team-export-hq"] },
  { id: "team-intertek", name: "Intertek Dhaka", initials: "ID", role: "Testing Laboratory", group: "Partner", availability: "focused", capacity: 71, activeHandoffs: 1, response: "Next checkpoint 29 Aug", focus: "Certificate renewal and textile testing", skills: ["Testing", "Certificates"], email: "lab@partner.example", accessRole: "external", accessScope: "Certificate handoff only", departmentIds: [] },
  { id: "team-freight", name: "Rhein Freight Desk", initials: "RF", role: "Logistics Partner", group: "Partner", availability: "away", capacity: 46, activeHandoffs: 1, response: "Next checkpoint 27 Aug", focus: "Germany lane assumptions and documentation", skills: ["Freight", "Customs", "Germany"], email: "desk@partner.example", accessRole: "external", accessScope: "Logistics handoff only", departmentIds: [] }
];

export const businessTeamSeeds: readonly BusinessTeam[] = [
  { id: "team-leadership", name: "Leadership", purpose: "Company direction, approvals, risk, and cross-team priorities.", leadId: "team-nadia", memberIds: ["team-nadia", "team-kamal"], channelId: "conversation-leadership", createdAt: "2026-07-01T08:00:00.000Z" },
  { id: "team-sales-marketing", name: "Sales & Marketing", purpose: "Buyer pipeline, market campaigns, samples, offers, and commercial follow-up.", leadId: "team-samira", memberIds: ["team-nadia", "team-samira", "team-anna"], channelId: "conversation-sales-marketing", createdAt: "2026-07-05T08:00:00.000Z" },
  { id: "team-operations-compliance", name: "Operations & Compliance", purpose: "Factory readiness, evidence, production, logistics, and destination requirements.", leadId: "team-kamal", memberIds: ["team-nadia", "team-kamal", "team-rahim", "team-lisa"], channelId: "conversation-operations", createdAt: "2026-07-05T08:00:00.000Z" },
  { id: "team-export-hq", name: "Export HQ Account Team", purpose: "Managed market, compliance, and trade support for this organization.", leadId: "team-anna", memberIds: ["team-nadia", "team-anna", "team-rahim", "team-lisa"], channelId: "conversation-export-hq", createdAt: "2026-07-12T08:00:00.000Z" }
];

export const teamConversationSeeds: readonly TeamConversation[] = [
  { id: "conversation-export-hq", title: "Export HQ Account Team", kind: "export_hq", participantIds: ["team-nadia", "team-anna", "team-rahim", "team-lisa"], teamId: "team-export-hq", relatedEntity: "Germany launch · Managed work", unread: 2, lastActivity: "2026-08-26T08:42:00.000Z" },
  { id: "conversation-sales-marketing", title: "Sales & Marketing", kind: "department", participantIds: ["team-nadia", "team-samira", "team-anna"], teamId: "team-sales-marketing", relatedEntity: "Germany buyer pipeline", unread: 1, lastActivity: "2026-08-26T07:55:00.000Z" },
  { id: "conversation-operations", title: "Operations & Compliance", kind: "department", participantIds: ["team-nadia", "team-kamal", "team-rahim", "team-lisa"], teamId: "team-operations-compliance", relatedEntity: "Cotton T-shirt · Germany", unread: 0, lastActivity: "2026-08-25T16:28:00.000Z" },
  { id: "conversation-kamal", title: "Kamal Hossain", kind: "direct", participantIds: ["team-nadia", "team-kamal"], unread: 0, lastActivity: "2026-08-25T11:12:00.000Z" }
];

export const teamMessageSeeds: readonly TeamMessage[] = [
  { id: "message-1", conversationId: "conversation-export-hq", senderId: "team-anna", body: "We have qualified six German wholesale buyers against the revised evidence profile. Two are ready for a controlled introduction once the certificate timeline is confirmed.", sentAt: "2026-08-26T08:22:00.000Z", delivery: "read" },
  { id: "message-2", conversationId: "conversation-export-hq", senderId: "team-rahim", body: "The laboratory confirmed a 10–12 working day renewal window. I linked the evidence gap to the Operations & Compliance team so ownership stays clear.", sentAt: "2026-08-26T08:34:00.000Z", delivery: "read" },
  { id: "message-3", conversationId: "conversation-export-hq", senderId: "team-lisa", body: "Recommended next move: approve the renewal this week, then open buyer introductions in two batches rather than waiting for every packaging improvement.", sentAt: "2026-08-26T08:42:00.000Z", delivery: "read" },
  { id: "message-4", conversationId: "conversation-sales-marketing", senderId: "team-samira", body: "The first buyer-outreach message is ready for review. I kept the sustainability claims limited to evidence we can already substantiate.", sentAt: "2026-08-26T07:55:00.000Z", delivery: "read" },
  { id: "message-5", conversationId: "conversation-operations", senderId: "team-kamal", body: "Capacity for the pilot is available in the second September production window. Costing still needs the updated testing fee.", sentAt: "2026-08-25T15:48:00.000Z", delivery: "read" },
  { id: "message-6", conversationId: "conversation-operations", senderId: "team-rahim", body: "I will add the confirmed laboratory fee to the evidence task after the quote arrives tomorrow morning.", sentAt: "2026-08-25T16:28:00.000Z", delivery: "read" },
  { id: "message-7", conversationId: "conversation-kamal", senderId: "team-kamal", body: "The sample room can prepare twelve buyer sets this week. Please confirm whether Germany-only labels are sufficient for this batch.", sentAt: "2026-08-25T11:12:00.000Z", delivery: "read" }
];

export function loadCollection<T>(key: string, seeds: readonly T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [...seeds];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [...seeds];
  } catch {
    localStorage.removeItem(key);
    return [...seeds];
  }
}

export function storeCollection<T>(key: string, records: readonly T[]): void {
  localStorage.setItem(key, JSON.stringify(records));
}

export function createDecisionFromIdea(idea: IdeaRecord): DecisionRecord {
  return {
    id: `decision-from-${idea.id}-${Date.now()}`,
    title: idea.title,
    summary: idea.summary,
    context: `Promoted from Ideas for structured evaluation. Original notes: ${idea.notes}`,
    category: idea.category === "Buyer" ? "Commercial" : idea.category,
    status: "draft",
    owner: idea.owner,
    reviewers: [],
    createdAt: new Date().toISOString(),
    reviewDue: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    relatedEntity: idea.relatedEntity,
    evidence: [],
    options: [
      { id: "proceed", label: "Proceed", tradeoff: "Commit resources to validate and execute this direction.", selected: false },
      { id: "defer", label: "Defer", tradeoff: "Preserve capacity while keeping the opportunity visible.", selected: false }
    ],
    rationale: "No rationale recorded yet. Compare the options and link supporting evidence before approval."
  };
}

export function createBlueprintFromIdea(idea: IdeaRecord): BlueprintDefinition {
  return {
    id: `bp-from-${idea.id}-${Date.now()}`,
    title: idea.title,
    description: idea.summary,
    category: idea.category === "Buyer" ? "Sales" : idea.category === "Market" ? "Market entry" : idea.category === "Compliance" ? "Compliance" : idea.category === "Product" ? "Product" : "Trade operations",
    steps: ["Confirm the target outcome and scope", "Collect the minimum supporting context", "Assign the accountable owner", "Complete the first controlled pilot", "Review the result and improve the Blueprint"],
    estimate: "Custom",
    owner: idea.owner,
    uses: 0,
    updatedAt: "Just now",
    builtIn: false
  };
}

export function addRecentRecord(record: RecentCreatedRecord): void {
  const current = loadCollection<RecentCreatedRecord>(recentCreatedStorageKey, []);
  storeCollection(recentCreatedStorageKey, [record, ...current.filter((item) => item.id !== record.id)].slice(0, 12));
}

export function responsibilityLabel(responsibility: Responsibility): string {
  if (responsibility === "export_hq") return "Export HQ";
  if (responsibility === "third_party") return "Third party";
  return "Customer";
}
