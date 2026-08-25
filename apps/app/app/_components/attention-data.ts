export type AttentionFacet =
  "needs_you" | "at_risk" | "blocked" | "overdue" | "stale" | "waiting";

export type AttentionSeverity = "critical" | "high" | "medium";
export type AttentionStatus = "active" | "resolved" | "dismissed";
export type DependencyState = "ready" | "waiting" | "blocked";

export interface AttentionProject {
  id: string;
  name: string;
  goal: string;
  phase: string;
  owner: string;
  health: "on_track" | "at_risk" | "blocked";
  progress: number;
  href: string;
}

export interface AttentionEvidence {
  label: string;
  detail: string;
  kind: "trigger" | "context" | "dependency";
  href: string;
}

export interface AttentionDependency {
  label: string;
  owner: string;
  state: DependencyState;
  href: string;
}

export interface AttentionSignal {
  id: string;
  title: string;
  summary: string;
  severity: AttentionSeverity;
  facets: AttentionFacet[];
  projectId: string;
  source: string;
  sourceHref: string;
  owner: string;
  watchers: string[];
  dueAt: string;
  triggeredAt: string;
  lastActivityAt: string;
  impact: string;
  reasons: string[];
  evidence: AttentionEvidence[];
  dependencies: AttentionDependency[];
  recommendedAction: {
    label: string;
    description: string;
    expectedOutcome: string;
    href: string;
  };
  status: AttentionStatus;
  snoozedUntil?: string;
  resolutionNote?: string;
}

export const attentionStorageKey = "trevv.attention.signals.v1";

export const attentionProjects: readonly AttentionProject[] = [
  {
    id: "germany-launch",
    name: "Germany market launch",
    goal: "Make one product and offer buyer-ready for a controlled wholesale pilot.",
    phase: "Evidence and packaging",
    owner: "Nadia Rahman",
    health: "blocked",
    progress: 64,
    href: "/blueprints?record=bp-germany-launch",
  },
  {
    id: "product-readiness",
    name: "Cotton shirt product readiness",
    goal: "Create a defensible product record with current technical evidence.",
    phase: "Evidence remediation",
    owner: "Rahim Chowdhury",
    health: "at_risk",
    progress: 74,
    href: "/blueprints?record=bp-product-readiness",
  },
  {
    id: "buyer-pipeline",
    name: "Germany buyer qualification",
    goal: "Approve ten high-fit buyers for the first qualification sprint.",
    phase: "Internal review",
    owner: "Anna Keller",
    health: "at_risk",
    progress: 58,
    href: "/blueprints?record=bp-buyer-qualification",
  },
  {
    id: "sample-pilot",
    name: "Buyer sample pilot",
    goal: "Run one controlled sample request from specification to feedback.",
    phase: "Owner confirmation",
    owner: "Lisa Morgan",
    health: "on_track",
    progress: 18,
    href: "/blueprints?record=bp-sample-request",
  },
  {
    id: "company-readiness",
    name: "Verified company profile",
    goal: "Keep capacity, lead time, and commercial claims current and sourced.",
    phase: "Monthly verification",
    owner: "Nadia Rahman",
    health: "on_track",
    progress: 86,
    href: "/#readiness",
  },
];

export const attentionSeeds: readonly AttentionSignal[] = [
  {
    id: "attention-oekotex-blocker",
    title: "Current OEKO-TEX evidence is blocking Germany readiness",
    summary:
      "The product review cannot close because the current signed certificate is still missing.",
    severity: "critical",
    facets: ["needs_you", "at_risk", "blocked", "overdue"],
    projectId: "germany-launch",
    source: "Waiting · customer handoff",
    sourceHref: "/waiting?record=task_oekotex",
    owner: "Nadia Rahman",
    watchers: ["Rahim Chowdhury", "Anna Keller"],
    dueAt: "2026-08-15T15:00:00.000Z",
    triggeredAt: "2026-08-15T15:05:00.000Z",
    lastActivityAt: "2026-08-24T07:40:00.000Z",
    impact:
      "Germany readiness remains capped and buyer evidence claims cannot be approved.",
    reasons: [
      "The accountable handoff is overdue.",
      "A required evidence record is missing.",
      "Two downstream launch checkpoints depend on this file.",
    ],
    evidence: [
      {
        label: "Missing certificate record",
        detail: "OEKO-TEX Standard 100 · current version",
        kind: "trigger",
        href: "/#documents",
      },
      {
        label: "Germany evidence gap",
        detail: "Product review requires current coverage and signature",
        kind: "context",
        href: "/#requirements",
      },
      {
        label: "Owner clarification",
        detail: "Rahim mentioned Nadia in Inbox",
        kind: "dependency",
        href: "/inbox?record=inbox-certificate-mention",
      },
    ],
    dependencies: [
      {
        label: "Laboratory issues signed certificate",
        owner: "Testing laboratory",
        state: "waiting",
        href: "/waiting?record=task_test_report",
      },
      {
        label: "Certificate uploaded and linked",
        owner: "Nadia Rahman",
        state: "blocked",
        href: "/waiting?record=task_oekotex",
      },
      {
        label: "Germany product review closes",
        owner: "Rahim Chowdhury",
        state: "blocked",
        href: "/#requirements",
      },
      {
        label: "Buyer outreach evidence pack approved",
        owner: "Anna Keller",
        state: "blocked",
        href: "/blueprints?record=bp-buyer-qualification",
      },
    ],
    recommendedAction: {
      label: "Open evidence handoff",
      description:
        "Confirm the laboratory delivery checkpoint and leave one named upload owner.",
      expectedOutcome:
        "A dated unblock plan exists, or the current certificate is linked to the review.",
      href: "/waiting?record=task_oekotex",
    },
    status: "active",
  },
  {
    id: "attention-packaging-decision",
    title: "Packaging remediation still has no approved direction",
    summary:
      "Germany-only correction and a reusable export packaging system remain open options.",
    severity: "high",
    facets: ["needs_you", "at_risk", "overdue"],
    projectId: "germany-launch",
    source: "Decision · packaging scope",
    sourceHref: "/decisions?record=decision-packaging-scope",
    owner: "Nadia Rahman",
    watchers: ["Anna Keller", "Rahim Chowdhury"],
    dueAt: "2026-08-23T14:00:00.000Z",
    triggeredAt: "2026-08-23T14:05:00.000Z",
    lastActivityAt: "2026-08-24T16:10:00.000Z",
    impact:
      "Artwork, supplier costing, and the Germany launch sequence cannot be committed.",
    reasons: [
      "The internal decision checkpoint passed without a selected option.",
      "Design work is waiting on the scope boundary.",
      "The project is already in a blocked health state.",
    ],
    evidence: [
      {
        label: "Packaging gap note",
        detail: "Language and traceability gaps mapped",
        kind: "trigger",
        href: "/decisions?record=decision-packaging-scope",
      },
      {
        label: "Two viable options",
        detail: "Germany-only correction or shared export system",
        kind: "context",
        href: "/decisions?record=decision-packaging-scope",
      },
      {
        label: "Decision request",
        detail: "Anna requested Nadia's direction",
        kind: "dependency",
        href: "/inbox",
      },
    ],
    dependencies: [
      {
        label: "Cost and lead-time comparison",
        owner: "Anna Keller",
        state: "ready",
        href: "/decisions?record=decision-packaging-scope",
      },
      {
        label: "Scope decision approved",
        owner: "Nadia Rahman",
        state: "waiting",
        href: "/decisions?record=decision-packaging-scope",
      },
      {
        label: "Artwork remediation begins",
        owner: "Rahim Chowdhury",
        state: "blocked",
        href: "/ideas",
      },
    ],
    recommendedAction: {
      label: "Review the decision",
      description:
        "Compare the cost and lead-time trade-offs, select the scope, and record the rationale.",
      expectedOutcome:
        "The team has one authoritative packaging direction and can start remediation.",
      href: "/decisions?record=decision-packaging-scope",
    },
    status: "active",
  },
  {
    id: "attention-supplier-declaration",
    title: "Supplier composition declaration follow-up is overdue",
    summary:
      "The requested fibre declaration has not arrived and the next supplier checkpoint is not recorded.",
    severity: "high",
    facets: ["needs_you", "overdue", "waiting"],
    projectId: "product-readiness",
    source: "Inbox · follow-up",
    sourceHref: "/inbox?record=inbox-evidence-follow-up",
    owner: "Nadia Rahman",
    watchers: ["Rahim Chowdhury"],
    dueAt: "2026-08-25T13:00:00.000Z",
    triggeredAt: "2026-08-25T13:05:00.000Z",
    lastActivityAt: "2026-08-24T09:00:00.000Z",
    impact:
      "Composition claims remain unsupported in the controlled product record.",
    reasons: [
      "The supplier response checkpoint passed.",
      "No replacement date or escalation owner is recorded.",
      "The declaration supports both product and label evidence.",
    ],
    evidence: [
      {
        label: "Supplier request",
        detail: "Fibre composition declaration requested",
        kind: "trigger",
        href: "/inbox?record=inbox-evidence-follow-up",
      },
      {
        label: "Product evidence map",
        detail: "Declaration supports the composition claim",
        kind: "context",
        href: "/#documents",
      },
    ],
    dependencies: [
      {
        label: "Supplier sends declaration",
        owner: "Material supplier",
        state: "waiting",
        href: "/inbox?record=inbox-evidence-follow-up",
      },
      {
        label: "Coverage and signature reviewed",
        owner: "Rahim Chowdhury",
        state: "blocked",
        href: "/work?record=work-supplier-declaration",
      },
      {
        label: "Composition claim verified",
        owner: "Nadia Rahman",
        state: "blocked",
        href: "/#requirements",
      },
    ],
    recommendedAction: {
      label: "Record the follow-up",
      description:
        "Contact the supplier, set the next checkpoint, and name the escalation owner.",
      expectedOutcome:
        "The declaration has a credible delivery date and the dependency is visible.",
      href: "/inbox?record=inbox-evidence-follow-up",
    },
    status: "active",
  },
  {
    id: "attention-buyer-scorecard",
    title: "The buyer scorecard is ready but still unreviewed",
    summary:
      "Ten buyers are scored for fit, evidence expectations, payment quality, and indicative volume.",
    severity: "high",
    facets: ["needs_you", "at_risk"],
    projectId: "buyer-pipeline",
    source: "Inbox · approval request",
    sourceHref: "/inbox?record=inbox-buyer-approval",
    owner: "Nadia Rahman",
    watchers: ["Anna Keller", "Lisa Morgan"],
    dueAt: "2026-08-27T12:00:00.000Z",
    triggeredAt: "2026-08-24T14:20:00.000Z",
    lastActivityAt: "2026-08-25T09:10:00.000Z",
    impact: "The first controlled outreach cohort cannot be confirmed.",
    reasons: [
      "All required input is ready for a human judgment.",
      "The buyer qualification sprint is below planned progress.",
      "Outreach preparation depends on the approved shortlist.",
    ],
    evidence: [
      {
        label: "Buyer scorecard",
        detail: "Ten buyers scored across four factors",
        kind: "trigger",
        href: "/inbox?record=inbox-buyer-approval",
      },
      {
        label: "Qualification method",
        detail: "Evidence fit and payment quality are weighted",
        kind: "context",
        href: "/blueprints?record=bp-buyer-qualification",
      },
    ],
    dependencies: [
      {
        label: "Longlist research complete",
        owner: "Anna Keller",
        state: "ready",
        href: "/blueprints?record=bp-buyer-qualification",
      },
      {
        label: "Shortlist approved",
        owner: "Nadia Rahman",
        state: "waiting",
        href: "/inbox?record=inbox-buyer-approval",
      },
      {
        label: "Outreach sequence prepared",
        owner: "Lisa Morgan",
        state: "blocked",
        href: "/work",
      },
    ],
    recommendedAction: {
      label: "Review the scorecard",
      description:
        "Challenge weak-fit buyers, confirm the ten-buyer cohort, and note any evidence caveat.",
      expectedOutcome:
        "A controlled outreach shortlist is approved with review context.",
      href: "/inbox?record=inbox-buyer-approval",
    },
    status: "active",
  },
  {
    id: "attention-lab-scope",
    title: "Test-report scope still waits on the laboratory",
    summary:
      "Intertek has not confirmed whether the current report covers every colour variant.",
    severity: "critical",
    facets: ["at_risk", "blocked", "overdue", "waiting"],
    projectId: "product-readiness",
    source: "Waiting · third party",
    sourceHref: "/waiting?record=task_test_report",
    owner: "Intertek Dhaka",
    watchers: ["Rahim Chowdhury", "Nadia Rahman"],
    dueAt: "2026-08-22T12:00:00.000Z",
    triggeredAt: "2026-08-22T12:05:00.000Z",
    lastActivityAt: "2026-08-21T10:30:00.000Z",
    impact:
      "The test evidence may overstate product coverage and cannot be safely reused.",
    reasons: [
      "A third-party response is overdue.",
      "The unanswered scope question affects multiple product variants.",
      "No fresh activity has been recorded for four days.",
    ],
    evidence: [
      {
        label: "Current test report",
        detail: "Colour-variant coverage is ambiguous",
        kind: "trigger",
        href: "/#documents",
      },
      {
        label: "Laboratory question",
        detail: "Coverage confirmation requested",
        kind: "dependency",
        href: "/waiting?record=task_test_report",
      },
    ],
    dependencies: [
      {
        label: "Laboratory confirms scope",
        owner: "Intertek Dhaka",
        state: "waiting",
        href: "/waiting?record=task_test_report",
      },
      {
        label: "Evidence coverage updated",
        owner: "Rahim Chowdhury",
        state: "blocked",
        href: "/#documents",
      },
      {
        label: "Product claim released",
        owner: "Nadia Rahman",
        state: "blocked",
        href: "/#requirements",
      },
    ],
    recommendedAction: {
      label: "Escalate the checkpoint",
      description:
        "Send the precise coverage question again and set a response deadline with an escalation contact.",
      expectedOutcome:
        "Coverage is confirmed or a replacement test is commissioned.",
      href: "/waiting?record=task_test_report",
    },
    status: "active",
  },
  {
    id: "attention-label-stale",
    title: "German labelling review has gone stale",
    summary:
      "The specialist review is open, but no activity has been recorded since the expected checkpoint.",
    severity: "medium",
    facets: ["stale", "waiting"],
    projectId: "germany-launch",
    source: "Waiting · Export HQ",
    sourceHref: "/waiting?record=task_labelling",
    owner: "Anna Müller",
    watchers: ["Nadia Rahman"],
    dueAt: "2026-08-29T12:00:00.000Z",
    triggeredAt: "2026-08-25T08:00:00.000Z",
    lastActivityAt: "2026-08-20T15:20:00.000Z",
    impact:
      "Label artwork cannot enter final supplier proofing with confidence.",
    reasons: [
      "No activity has been recorded for five days.",
      "The review is owned, but the next checkpoint is not explicit.",
      "The project is blocked by other evidence, so silent drift is easy to miss.",
    ],
    evidence: [
      {
        label: "Label artwork v3",
        detail: "Uploaded and awaiting specialist review",
        kind: "trigger",
        href: "/#documents",
      },
      {
        label: "EU fibre labelling requirement",
        detail: "Human-reviewed requirement context",
        kind: "context",
        href: "/#requirements",
      },
    ],
    dependencies: [
      {
        label: "Specialist review completed",
        owner: "Anna Müller",
        state: "waiting",
        href: "/waiting?record=task_labelling",
      },
      {
        label: "Artwork proof updated",
        owner: "Rahim Chowdhury",
        state: "blocked",
        href: "/#documents",
      },
    ],
    recommendedAction: {
      label: "Confirm the review checkpoint",
      description:
        "Ask the specialist for the next observable output and record its date.",
      expectedOutcome:
        "The review has a visible deliverable and accountable checkpoint.",
      href: "/waiting?record=task_labelling",
    },
    status: "active",
  },
  {
    id: "attention-sample-owner",
    title: "The buyer sample pilot still needs an internal owner",
    summary:
      "The reusable sample Blueprint is ready, but the preparation handoff is unassigned.",
    severity: "medium",
    facets: ["needs_you", "waiting"],
    projectId: "sample-pilot",
    source: "Inbox · assignment",
    sourceHref: "/inbox?record=inbox-sample-assignment",
    owner: "Nadia Rahman",
    watchers: ["Lisa Morgan"],
    dueAt: "2026-08-29T10:00:00.000Z",
    triggeredAt: "2026-08-23T11:30:00.000Z",
    lastActivityAt: "2026-08-23T11:30:00.000Z",
    impact:
      "A buyer request would arrive before the internal preparation path is owned.",
    reasons: [
      "The workflow exists but its first accountable owner is not confirmed.",
      "The sample pilot is still early enough to prevent avoidable waiting.",
    ],
    evidence: [
      {
        label: "Buyer sample Blueprint",
        detail: "Seven ordered steps are ready",
        kind: "context",
        href: "/blueprints?record=bp-sample-request",
      },
      {
        label: "Owner assignment",
        detail: "Lisa requested an internal preparation owner",
        kind: "trigger",
        href: "/inbox?record=inbox-sample-assignment",
      },
    ],
    dependencies: [
      {
        label: "Preparation owner confirmed",
        owner: "Nadia Rahman",
        state: "waiting",
        href: "/inbox?record=inbox-sample-assignment",
      },
      {
        label: "Sample Blueprint run starts",
        owner: "Assigned owner",
        state: "blocked",
        href: "/blueprints?record=bp-sample-request",
      },
    ],
    recommendedAction: {
      label: "Confirm the owner",
      description:
        "Choose the preparation owner and confirm the expected first output.",
      expectedOutcome:
        "The sample workflow can start without an ownership gap.",
      href: "/inbox?record=inbox-sample-assignment",
    },
    status: "active",
  },
  {
    id: "attention-capacity-stale",
    title: "The published capacity range needs fresh verification",
    summary:
      "The commercial team is using a monthly production range whose verification checkpoint is due.",
    severity: "medium",
    facets: ["needs_you", "stale"],
    projectId: "company-readiness",
    source: "My Work · company readiness",
    sourceHref: "/work?record=work-capacity-range",
    owner: "Nadia Rahman",
    watchers: ["Kamal Hossain", "Anna Keller"],
    dueAt: "2026-08-25T16:00:00.000Z",
    triggeredAt: "2026-08-25T16:05:00.000Z",
    lastActivityAt: "2026-07-25T10:00:00.000Z",
    impact:
      "Buyer conversations may rely on a production claim that is no longer current.",
    reasons: [
      "The monthly verification checkpoint has arrived.",
      "The number is used in buyer-facing commercial preparation.",
      "The source and verification date should travel with the claim.",
    ],
    evidence: [
      {
        label: "Factory capacity range",
        detail: "Current published operating range",
        kind: "trigger",
        href: "/onboarding",
      },
      {
        label: "Verification task",
        detail: "Confirm with operations and republish",
        kind: "dependency",
        href: "/work?record=work-capacity-range",
      },
    ],
    dependencies: [
      {
        label: "Operations confirms range",
        owner: "Kamal Hossain",
        state: "waiting",
        href: "/work?record=work-capacity-range",
      },
      {
        label: "Factory profile republished",
        owner: "Nadia Rahman",
        state: "blocked",
        href: "/onboarding",
      },
    ],
    recommendedAction: {
      label: "Verify the capacity range",
      description:
        "Confirm the current range with operations, attach the review date, and republish it.",
      expectedOutcome:
        "Commercial work uses a current, sourced capacity claim.",
      href: "/work?record=work-capacity-range",
    },
    status: "active",
  },
];

const severityWeight: Record<AttentionSeverity, number> = {
  critical: 45,
  high: 28,
  medium: 14,
};

const facetWeight: Record<AttentionFacet, number> = {
  needs_you: 14,
  at_risk: 12,
  blocked: 18,
  overdue: 16,
  stale: 7,
  waiting: 5,
};

export function attentionScore(
  signal: AttentionSignal,
  project: AttentionProject,
  now = new Date(),
): number {
  const due = new Date(signal.dueAt).getTime();
  const overdueDays = Math.max(
    0,
    Math.floor((now.getTime() - due) / 86_400_000),
  );
  const projectRisk =
    project.health === "blocked" ? 12 : project.health === "at_risk" ? 7 : 0;
  return (
    severityWeight[signal.severity] +
    signal.facets.reduce((total, facet) => total + facetWeight[facet], 0) +
    Math.min(12, overdueDays * 2) +
    projectRisk
  );
}

export function rankAttentionSignals(
  signals: readonly AttentionSignal[],
  projects: readonly AttentionProject[] = attentionProjects,
  now = new Date(),
): AttentionSignal[] {
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  return [...signals].sort((a, b) => {
    const projectA = projectMap.get(a.projectId);
    const projectB = projectMap.get(b.projectId);
    if (!projectA || !projectB) return 0;
    return attentionScore(b, projectB, now) - attentionScore(a, projectA, now);
  });
}

export function getAttentionProject(id: string): AttentionProject | undefined {
  return attentionProjects.find((project) => project.id === id);
}
