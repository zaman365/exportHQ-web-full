export type WorkStatus = "todo" | "working" | "review" | "blocked" | "done";
export type WorkPriority = "urgent" | "high" | "normal";
export type WorkView = "assigned" | "following" | "created";
export type WorkSource = "personal" | "waiting" | "decision" | "blueprint";

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  status: WorkStatus;
  priority: WorkPriority;
  dueAt: string;
  owner: string;
  workstream: string;
  relatedEntity: string;
  createdBy: string;
  followers: string[];
  views: WorkView[];
  estimatedMinutes: number;
  nextStep: string;
  source: WorkSource;
  href: string;
  sourceRecordId?: string;
  blockedBy?: string;
  completedAt?: string;
}

export type WorkGroupId =
  "overdue" | "today" | "upcoming" | "later" | "completed";

export interface WorkGroup {
  id: WorkGroupId;
  label: string;
  items: WorkItem[];
}

export const myWorkStorageKey = "trevv.my-work.v1";
export const myWorkFocusStorageKey = "trevv.my-work.focus.v1";

export const workStatusLabels: Record<WorkStatus, string> = {
  todo: "Ready",
  working: "Working",
  review: "Review",
  blocked: "Blocked",
  done: "Done",
};

export const workSeeds: readonly WorkItem[] = [
  {
    id: "work-oekotex-upload",
    title: "Upload the current OEKO-TEX certificate",
    description:
      "The Germany product review cannot close until the current certificate is linked as evidence.",
    status: "blocked",
    priority: "urgent",
    dueAt: "2026-08-15T15:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Compliance",
    relatedEntity: "Cotton T-shirt · Germany",
    createdBy: "Rahim Chowdhury",
    followers: ["Anna Keller"],
    views: ["assigned", "following"],
    estimatedMinutes: 20,
    nextStep:
      "Ask the laboratory for the final signed file or set a verified delivery checkpoint.",
    source: "personal",
    href: "/waiting",
    blockedBy: "Final signed certificate from the testing laboratory",
  },
  {
    id: "work-packaging-model",
    title: "Choose the first packaging remediation model",
    description:
      "Compare a Germany-only correction with a reusable export packaging system.",
    status: "review",
    priority: "high",
    dueAt: "2026-08-23T14:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Germany launch",
    relatedEntity: "Packaging gap review",
    createdBy: "Anna Keller",
    followers: ["Rahim Chowdhury", "Lisa Morgan"],
    views: ["assigned", "following"],
    estimatedMinutes: 35,
    nextStep:
      "Review the cost and lead-time comparison, then record the preferred direction.",
    source: "personal",
    href: "/decisions?record=decision-packaging-scope",
  },
  {
    id: "work-buyer-evidence",
    title: "Confirm evidence expectations for the pilot buyer cohort",
    description:
      "Validate which certificates and test results the first ten buyers request before outreach.",
    status: "todo",
    priority: "high",
    dueAt: "2026-08-24T16:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Buyer pipeline",
    relatedEntity: "Germany buyer shortlist",
    createdBy: "Nadia Rahman",
    followers: ["Anna Keller"],
    views: ["assigned", "created"],
    estimatedMinutes: 45,
    nextStep:
      "Review the buyer notes and flag any evidence claim that lacks a source.",
    source: "personal",
    href: "/#requirements",
  },
  {
    id: "work-supplier-declaration",
    title: "Approve the supplier declaration pack",
    description:
      "The pack is assembled and needs a final coverage and signature review.",
    status: "review",
    priority: "urgent",
    dueAt: "2026-08-25T11:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Product readiness",
    relatedEntity: "Cotton T-shirt",
    createdBy: "Rahim Chowdhury",
    followers: ["Kamal Hossain"],
    views: ["assigned", "following"],
    estimatedMinutes: 25,
    nextStep:
      "Check supplier coverage, signatures, and the linked composition claim before approval.",
    source: "personal",
    href: "/#documents",
  },
  {
    id: "work-buyer-cohort",
    title: "Confirm the pilot buyer cohort",
    description:
      "Select the ten buyers that will enter the first controlled qualification sprint.",
    status: "working",
    priority: "high",
    dueAt: "2026-08-25T13:30:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Buyer pipeline",
    relatedEntity: "Germany buyer shortlist",
    createdBy: "Nadia Rahman",
    followers: ["Anna Keller", "Lisa Morgan"],
    views: ["assigned", "created", "following"],
    estimatedMinutes: 40,
    nextStep:
      "Remove buyers with weak product fit, then confirm the top ten and their evidence expectations.",
    source: "personal",
    href: "/decisions",
  },
  {
    id: "work-logistics-assumptions",
    title: "Reply to the Germany lane assumptions",
    description:
      "Lisa needs confirmation of origin handling and pilot shipment weight before finalizing the model.",
    status: "todo",
    priority: "normal",
    dueAt: "2026-08-25T15:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Trade operations",
    relatedEntity: "Germany pilot quotation",
    createdBy: "Lisa Morgan",
    followers: [],
    views: ["assigned"],
    estimatedMinutes: 15,
    nextStep: "Confirm the packed weight range and named origin terminal.",
    source: "personal",
    href: "/decisions?record=decision-incoterm",
  },
  {
    id: "work-capacity-range",
    title: "Publish the verified monthly capacity range",
    description:
      "Give the commercial team a defensible production range for buyer conversations.",
    status: "todo",
    priority: "normal",
    dueAt: "2026-08-25T16:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Company readiness",
    relatedEntity: "Factory profile",
    createdBy: "Nadia Rahman",
    followers: ["Kamal Hossain"],
    views: ["assigned", "created"],
    estimatedMinutes: 20,
    nextStep:
      "Confirm the range with operations, add its verification date, and publish it to the factory profile.",
    source: "personal",
    href: "/onboarding",
  },
  {
    id: "work-label-blocks",
    title: "Review reusable EU label content blocks",
    description:
      "Check the proposed composition, care, and traceability blocks before the design pilot.",
    status: "review",
    priority: "high",
    dueAt: "2026-08-27T14:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Compliance",
    relatedEntity: "EU label library",
    createdBy: "Rahim Chowdhury",
    followers: ["Anna Keller"],
    views: ["assigned", "following"],
    estimatedMinutes: 35,
    nextStep:
      "Confirm every reusable block has jurisdiction and source metadata.",
    source: "personal",
    href: "/ideas",
  },
  {
    id: "work-sample-cost",
    title: "Set the sample cost ceiling",
    description:
      "Approve the maximum internal cost before the first buyer sample request is accepted.",
    status: "todo",
    priority: "normal",
    dueAt: "2026-08-28T12:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Buyer pipeline",
    relatedEntity: "Buyer sample kit",
    createdBy: "Lisa Morgan",
    followers: [],
    views: ["assigned"],
    estimatedMinutes: 20,
    nextStep:
      "Review material, labor, evidence insert, and courier assumptions, then record the ceiling.",
    source: "personal",
    href: "/blueprints?record=bp-sample-request",
  },
  {
    id: "work-fca-lane",
    title: "Verify the FCA origin terminal",
    description:
      "Confirm the named handoff point used in the first wholesale quotation.",
    status: "working",
    priority: "normal",
    dueAt: "2026-08-31T10:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Trade operations",
    relatedEntity: "Germany wholesale offer",
    createdBy: "Nadia Rahman",
    followers: ["Lisa Morgan"],
    views: ["assigned", "created"],
    estimatedMinutes: 30,
    nextStep:
      "Confirm the terminal with the freight desk and update the quotation assumption.",
    source: "personal",
    href: "/decisions?record=decision-incoterm",
  },
  {
    id: "work-company-profile",
    title: "Refresh the factory capability summary",
    description:
      "Update capacity, lead time, minimum order, and quality-control context for the next review.",
    status: "todo",
    priority: "normal",
    dueAt: "2026-09-08T12:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Company readiness",
    relatedEntity: "Factory profile",
    createdBy: "Nadia Rahman",
    followers: [],
    views: ["assigned", "created"],
    estimatedMinutes: 50,
    nextStep:
      "Collect the four verified operating figures and update their review dates.",
    source: "personal",
    href: "/onboarding",
  },
  {
    id: "work-intro-deck",
    title: "Send the verified factory introduction deck",
    description:
      "The controlled deck and evidence appendix were shared with the internal market team.",
    status: "done",
    priority: "normal",
    dueAt: "2026-08-25T08:00:00.000Z",
    owner: "Nadia Rahman",
    workstream: "Buyer pipeline",
    relatedEntity: "Germany launch",
    createdBy: "Nadia Rahman",
    followers: ["Anna Keller"],
    views: ["assigned", "created"],
    estimatedMinutes: 15,
    nextStep: "Completed.",
    source: "personal",
    href: "/#documents",
    completedAt: "2026-08-25T08:10:00.000Z",
  },
];

function localDay(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-CA", {
    timeZone: "Europe/Berlin",
  });
}

export function groupWorkItems(
  items: readonly WorkItem[],
  now = new Date(),
): WorkGroup[] {
  const today = localDay(now);
  const week = new Date(now);
  week.setDate(week.getDate() + 7);
  const weekDay = localDay(week);
  const open = items.filter((item) => item.status !== "done");
  const sort = (records: WorkItem[]) =>
    records.sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
    );
  return [
    {
      id: "overdue",
      label: "Overdue",
      items: sort(open.filter((item) => localDay(item.dueAt) < today)),
    },
    {
      id: "today",
      label: "Today",
      items: sort(open.filter((item) => localDay(item.dueAt) === today)),
    },
    {
      id: "upcoming",
      label: "Next 7 days",
      items: sort(
        open.filter(
          (item) =>
            localDay(item.dueAt) > today && localDay(item.dueAt) <= weekDay,
        ),
      ),
    },
    {
      id: "later",
      label: "Later",
      items: sort(open.filter((item) => localDay(item.dueAt) > weekDay)),
    },
    {
      id: "completed",
      label: "Completed",
      items: sort(items.filter((item) => item.status === "done")),
    },
  ];
}

export function recommendFocus(
  items: readonly WorkItem[],
  limit = 3,
): WorkItem[] {
  return [...items]
    .filter((item) => item.status !== "done" && item.status !== "blocked")
    .sort((a, b) => {
      const priority = { urgent: 0, high: 1, normal: 2 } as const;
      const status = {
        review: 0,
        working: 1,
        todo: 2,
        blocked: 3,
        done: 4,
      } as const;
      return (
        priority[a.priority] - priority[b.priority] ||
        status[a.status] - status[b.status] ||
        new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime() ||
        a.estimatedMinutes - b.estimatedMinutes
      );
    })
    .slice(0, limit);
}
