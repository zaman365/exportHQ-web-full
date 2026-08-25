export type LearningKind = "hint" | "tutorial" | "tip" | "reference";

export type LearningCategoryId =
  | "getting-started"
  | "dashboard"
  | "blueprints"
  | "workflows"
  | "actions"
  | "compliance"
  | "collaboration"
  | "settings";

export interface LearningCategory {
  id: LearningCategoryId;
  label: string;
  description: string;
}

export interface LearningResource {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: LearningCategoryId;
  kind: LearningKind;
  minutes: number;
  keywords: string[];
  steps?: string[];
  featured?: boolean;
}

export const learningCategories: readonly LearningCategory[] = [
  { id: "getting-started", label: "Getting started", description: "Orientation, navigation, search, and first steps." },
  { id: "dashboard", label: "Dashboard", description: "Health, readiness, products, evidence, and activity." },
  { id: "blueprints", label: "Blueprints", description: "Reusable workflows and repeatable operating playbooks." },
  { id: "workflows", label: "Decisions & ideas", description: "Structured choices, opportunity triage, and record creation." },
  { id: "actions", label: "Attention & actions", description: "Signals, capture, requests, personal priorities, ownership, blockers, due dates, and next steps." },
  { id: "compliance", label: "Compliance & evidence", description: "Requirements, sources, files, reviews, and expiry." },
  { id: "collaboration", label: "Teams & collaboration", description: "Members, specialists, handoffs, and accountability." },
  { id: "settings", label: "Settings & security", description: "Integrations, access, audit history, and data portability." }
];

export const learningCatalog: readonly LearningResource[] = [
  {
    id: "trevv-tour",
    title: "Take the TREVV workspace tour",
    summary: "Learn the rail, dashboard, Attention Center, Inbox, My Work, waiting queue, blueprints, and settings in one guided pass.",
    content: "TREVV keeps plans, evidence, owners, and decisions in one operational workspace. Start with the Dashboard for orientation, use Attention Center to understand cross-project pressure, use Inbox to capture and triage, turn commitments into a focused day in My Work, use Waiting for work that needs a person, and use Blueprints when a process should be repeatable.",
    category: "getting-started",
    kind: "tutorial",
    minutes: 6,
    keywords: ["tour", "navigation", "first steps", "workspace"],
    steps: [
      "Open Dashboard and review the four summary metrics.",
      "Open Attention Center and inspect the highest-ranked signal path.",
      "Open Inbox and distinguish private capture from actionable requests.",
      "Open My Work and plan three outcomes for the day.",
      "Open Waiting and inspect each ownership queue.",
      "Open Blueprints and preview a reusable workflow.",
      "Use a hint icon to jump back into this Learning Center.",
      "Visit Settings to review access and data controls."
    ],
    featured: true
  },
  {
    id: "navigation-rail",
    title: "Understand the navigation rail",
    summary: "Know where Dashboard, Attention Center, Inbox, My Work, Blueprints, Waiting, operational modules, and Learning Center live.",
    content: "The rail groups destinations by purpose. COMMAND contains daily orientation, cross-project signals in Attention Center, Inbox triage, personal execution in My Work, Waiting, and reusable work; WORKFLOWS contains decisions, ideas, people, and creation; GROW is market development; TRADE contains products and evidence; MANAGE contains readiness, requirements, learning, and settings.",
    category: "getting-started",
    kind: "hint",
    minutes: 2,
    keywords: ["sidebar", "rail", "menu", "navigation"]
  },
  {
    id: "search-command",
    title: "Find anything quickly",
    summary: "Use workspace search and Learning Center filters instead of hunting through pages.",
    content: "Search accepts plain-language terms such as a product name, owner, market, requirement, or learning topic. Use the category and resource-type filters when you want to narrow educational content.",
    category: "getting-started",
    kind: "tip",
    minutes: 1,
    keywords: ["search", "command", "keyboard", "find"]
  },
  {
    id: "hint-icons",
    title: "Use contextual hint icons",
    summary: "The diamond lightbulb beside a component opens its exact explanation.",
    content: "Hint icons are contextual shortcuts. Open one for a concise explanation, then choose “Open in Learning Center” for the full tutorial, related concepts, and step-by-step guidance.",
    category: "getting-started",
    kind: "reference",
    minutes: 1,
    keywords: ["hint", "help", "lightbulb", "learning"]
  },
  {
    id: "dashboard-overview",
    title: "Read the Dashboard",
    summary: "Turn the overview into a short, ordered plan for today.",
    content: "Read top to bottom: health shows direction, readiness shows the weakest areas, metrics show scope, Waiting shows ownership, and the lower modules provide supporting product and evidence detail.",
    category: "dashboard",
    kind: "tutorial",
    minutes: 4,
    keywords: ["dashboard", "overview", "daily review"],
    steps: ["Check the health movement.", "Find the lowest readiness area.", "Review anything waiting for you.", "Confirm the next managed-work update.", "Open the supporting product or requirement record."],
    featured: true
  },
  {
    id: "export-health",
    title: "What Export Health means",
    summary: "A weighted operating signal, not a legal certification or universal readiness score.",
    content: "Export Health combines company, product, market, evidence, and execution dimensions. Treat it as a directional signal: open the lower-scoring dimension to understand the evidence and actions behind it.",
    category: "dashboard",
    kind: "hint",
    minutes: 2,
    keywords: ["health", "score", "readiness", "metric"]
  },
  {
    id: "readiness-areas",
    title: "Readiness by area",
    summary: "See which part of the export foundation is limiting progress.",
    content: "Each bar represents a distinct readiness dimension. A low score should lead to its action plan; it should never be interpreted without the related requirements and evidence.",
    category: "dashboard",
    kind: "hint",
    minutes: 2,
    keywords: ["readiness", "areas", "progress"]
  },
  {
    id: "setup-progress",
    title: "Finish workspace setup",
    summary: "Complete organization, product, market, and evidence basics once, then maintain them.",
    content: "Setup progress measures whether the minimum context exists for useful recommendations. Completing setup improves the plan; it does not automatically mark a market or product ready.",
    category: "dashboard",
    kind: "tip",
    minutes: 2,
    keywords: ["setup", "onboarding", "profile"]
  },
  {
    id: "product-readiness",
    title: "Product × market readiness",
    summary: "Readiness belongs to a specific product and destination—not to a product in isolation.",
    content: "A product can be ready for one market and need work for another. Open the product-market record to review the HS code, evidence, buyer expectations, and destination-specific requirements.",
    category: "dashboard",
    kind: "reference",
    minutes: 3,
    keywords: ["product", "market", "readiness", "HS code"]
  },
  {
    id: "shared-activity",
    title: "Use shared activity as an audit-friendly timeline",
    summary: "See what changed, who changed it, and when the shared context moved.",
    content: "Activity is the operational narrative, while the Audit log focuses on privileged administration and security events. Use activity for team coordination and Audit for formal control review.",
    category: "dashboard",
    kind: "tip",
    minutes: 2,
    keywords: ["activity", "timeline", "updates"]
  },
  {
    id: "blueprints-overview",
    title: "What a Blueprint is",
    summary: "A reusable workflow containing ordered steps, owners, timing, and required evidence.",
    content: "Blueprints turn a proven process into a repeatable starting point. Using one creates a new run; editing a Blueprint changes future runs without rewriting historical work.",
    category: "blueprints",
    kind: "hint",
    minutes: 2,
    keywords: ["blueprint", "template", "workflow", "playbook"]
  },
  {
    id: "blueprint-run",
    title: "Start work from a Blueprint",
    summary: "Preview the steps, confirm the target, then create an owned run.",
    content: "A Blueprint run is real work created from a reusable definition. Name the target clearly, confirm owners and due dates, and adjust only the steps that differ for this run.",
    category: "blueprints",
    kind: "tutorial",
    minutes: 4,
    keywords: ["run", "use blueprint", "workflow"],
    steps: ["Open a Blueprint preview.", "Review its steps and estimated duration.", "Choose Use Blueprint.", "Confirm the new run in Waiting.", "Assign or resolve the first next step."],
    featured: true
  },
  {
    id: "blueprint-variables",
    title: "Write reusable Blueprint steps",
    summary: "Describe outcomes and evidence without hard-coding one market, product, or person.",
    content: "Use neutral placeholders such as target market, selected product, or accountable owner. Keep every step observable: it should produce a decision, file, record, or explicit handoff.",
    category: "blueprints",
    kind: "tip",
    minutes: 3,
    keywords: ["variables", "steps", "template design"]
  },
  {
    id: "blueprint-versioning",
    title: "Change a Blueprint safely",
    summary: "Improve future runs without altering completed or in-progress history.",
    content: "Treat material changes as a new version. State what changed, why, and which future runs should use it. Existing runs keep the version they started with for traceability.",
    category: "blueprints",
    kind: "reference",
    minutes: 3,
    keywords: ["version", "history", "change"]
  },
  {
    id: "blueprint-favorites",
    title: "Favorite high-frequency Blueprints",
    summary: "Pin the playbooks your team uses most and reduce setup time.",
    content: "Favorites are personal shortcuts and do not change visibility for other members. Review favorites quarterly so the list stays useful.",
    category: "blueprints",
    kind: "tip",
    minutes: 1,
    keywords: ["favorite", "pin", "shortcut"]
  },
  {
    id: "decisions-overview",
    title: "What belongs in Decisions",
    summary: "Use a Decision when viable options need a named owner, evidence, review, and a durable outcome.",
    content: "A Decision is more than an approval task. It preserves the question, context, options, trade-offs, evidence, accountable owner, reviewers, rationale, and lifecycle so future work can reuse the reasoning.",
    category: "workflows",
    kind: "hint",
    minutes: 2,
    keywords: ["decision", "approval", "rationale", "options"],
    featured: true
  },
  {
    id: "decision-record",
    title: "Write an explainable decision record",
    summary: "State the question, timing, context, owner, and related operational record before review.",
    content: "A reader should understand why the decision exists without reconstructing a meeting. Keep the summary concise, make the context factual, link the product, market, buyer, requirement, or workflow, and name one accountable owner.",
    category: "workflows",
    kind: "tutorial",
    minutes: 4,
    keywords: ["decision record", "context", "owner", "related record"],
    steps: ["State the decision as one clear question or direction.", "Explain why the decision is needed now.", "Name one accountable owner and the reviewers.", "Connect the operational record and supporting evidence.", "Set a realistic review checkpoint." ]
  },
  {
    id: "decision-options",
    title: "Compare options and trade-offs",
    summary: "Record viable alternatives before selecting a direction, including the cost or risk each one accepts.",
    content: "Options should be meaningfully different and viable enough to compare. A trade-off is not a list of generic pros and cons; it states what the organization gains, gives up, delays, or risks by choosing that direction.",
    category: "workflows",
    kind: "tip",
    minutes: 3,
    keywords: ["options", "trade-offs", "choice", "comparison"]
  },
  {
    id: "decision-lifecycle",
    title: "Use the decision lifecycle",
    summary: "Move from draft to review to approval, then reopen or supersede without deleting history.",
    content: "Draft means the record is incomplete. In review means the options and evidence are ready for reviewers. Approved means one direction and its rationale are authoritative. Reopen when the same decision needs new review; supersede when a new decision replaces it.",
    category: "workflows",
    kind: "reference",
    minutes: 3,
    keywords: ["draft", "review", "approved", "superseded", "history"]
  },
  {
    id: "ideas-overview",
    title: "What belongs in Ideas",
    summary: "Capture opportunities lightly while the problem, value, or correct next workflow is still uncertain.",
    content: "Ideas are an opportunity inbox, not a backlog of promised work. Use stages to show maturity, votes as one team signal, and impact and effort as rough comparisons. Promote an idea only when a Decision or Blueprint is the clearer next record.",
    category: "workflows",
    kind: "hint",
    minutes: 2,
    keywords: ["idea", "opportunity", "inbox", "pipeline"],
    featured: true
  },
  {
    id: "idea-prioritization",
    title: "Triage ideas with honest signals",
    summary: "Use stage, votes, expected impact, expected effort, and one validation note together.",
    content: "No single score should automatically approve an idea. Votes show interest, impact estimates potential value, effort estimates cost, and the validation note identifies what must be learned next. Update these signals as evidence improves.",
    category: "workflows",
    kind: "tutorial",
    minutes: 4,
    keywords: ["triage", "votes", "impact", "effort", "shortlist"],
    steps: ["Capture the opportunity in the Inbox.", "Assign an owner and related operational record.", "Estimate impact and effort using the same scale as other ideas.", "Write the smallest useful validation step.", "Move it to Exploring, Shortlisted, or Archived when evidence changes." ]
  },
  {
    id: "idea-promote",
    title: "Promote an idea to the right workflow",
    summary: "Create a Decision for an unresolved choice or a Blueprint for understood repeatable steps.",
    content: "Promotion preserves the idea and creates a connected operational record. Choose Decision when alternatives, evidence, and approval remain open. Choose Blueprint when the outcome and ordered steps are understood and should be reused.",
    category: "workflows",
    kind: "tip",
    minutes: 2,
    keywords: ["promote", "decision", "blueprint", "convert"]
  },
  {
    id: "create-overview",
    title: "Use the Create center",
    summary: "Start Decisions, Ideas, Waiting tasks, and Blueprints from one consistent place.",
    content: "The Create center is a router, not a generic record bucket. It applies the correct required fields and saves each new record to its real destination so later lifecycle actions, filters, and handoffs continue to work.",
    category: "workflows",
    kind: "hint",
    minutes: 2,
    keywords: ["create", "new", "record", "quick create"]
  },
  {
    id: "create-right-record",
    title: "Choose the right record type",
    summary: "Match the record to what is known: possibility, choice, handoff, or repeatable process.",
    content: "Use an Idea for a possibility that still needs validation. Use a Decision for a choice that needs options and approval. Use a Waiting task for one observable handoff with a current owner. Use a Blueprint for work whose steps should repeat.",
    category: "workflows",
    kind: "tutorial",
    minutes: 4,
    keywords: ["idea vs decision", "task vs blueprint", "record type", "create"],
    steps: ["Ask whether this is a possibility, choice, handoff, or repeatable process.", "Choose Idea, Decision, Waiting task, or Blueprint accordingly.", "Name the accountable owner and related operational record.", "Add only the fields needed for that record type.", "Open the destination page to continue its lifecycle." ]
  },
  {
    id: "attention-overview",
    title: "Use Attention Center as an action queue",
    summary: "Every signal connects project consequence, triggering evidence, dependencies, ownership, and one recommended next move.",
    content: "Attention Center is not a notification feed. It ranks operational conditions that can change project outcomes, preserves why each signal was raised, and routes the response to the real Decision, Waiting item, Inbox request, Blueprint, requirement, or My Work record. Resolve a signal only after the source outcome is verified.",
    category: "actions",
    kind: "tutorial",
    minutes: 4,
    keywords: ["attention center", "signals", "projects", "action queue", "risk"],
    steps: ["Open the highest-ranked signal.", "Review its project consequence and current phase.", "Follow the evidence and dependency path.", "Open the recommended action in its source workflow.", "Return to resolve, snooze, dismiss, or add the signal to My Work."],
    featured: true
  },
  {
    id: "attention-ranking",
    title: "Understand TREVV signal ranking",
    summary: "Ranking combines consequence, urgency, dependency pressure, and project health instead of sorting by colour alone.",
    content: "Criticality establishes the consequence baseline. Needs-you, blocked, overdue, stale, and waiting conditions add operational pressure. Overdue duration and the related project's health add context. The score explains ordering; it does not replace human judgment, and the evidence trail remains authoritative.",
    category: "actions",
    kind: "reference",
    minutes: 3,
    keywords: ["ranking", "score", "critical", "blocked", "project health"]
  },
  {
    id: "attention-actions",
    title: "Move a signal without losing context",
    summary: "Open the source action, add a commitment to My Work, route ownership, snooze to a real checkpoint, or preserve a reason in history.",
    content: "Open action is the safest default because it keeps evidence and workflow history in their source record. Add to My Work when you need a personal execution commitment. Snooze only to a credible next checkpoint. Dismiss with a reason when the signal is irrelevant, duplicated, or outside scope. Mark resolved only after verifying the source outcome.",
    category: "actions",
    kind: "tutorial",
    minutes: 4,
    keywords: ["resolve", "snooze", "dismiss", "my work", "owner"],
    steps: ["Open Details and confirm the project consequence.", "Use Open action to move the source record.", "Route the signal owner or add it to My Work when needed.", "Snooze only when a known checkpoint is in the future.", "Resolve or dismiss with the outcome preserved in History."]
  },
  {
    id: "attention-evidence",
    title: "Read the signal evidence and dependency path",
    summary: "Separate the trigger, supporting context, and blocked dependency so the response targets the real constraint.",
    content: "Trigger evidence is the condition that raised the signal. Context explains scope or consequence. Dependency evidence identifies work another outcome relies on. The dependency path orders those records from the earliest movable step to the downstream outcome, with a named owner and state for each link.",
    category: "actions",
    kind: "hint",
    minutes: 3,
    keywords: ["evidence", "dependency", "trigger", "context", "traceability"]
  },
  {
    id: "my-work-overview",
    title: "Turn commitments into a workable day",
    summary: "My Work gathers owned, followed, and created records, then orders them by due date, risk, and the next meaningful move.",
    content: "My Work is the execution layer between Inbox and the source workflow. The pulse shows workload pressure, date groups preserve urgency, and each detail panel explains the next observable move. Complete personal and Waiting work here; open Decisions in their source so rationale and review history remain intact.",
    category: "actions",
    kind: "tutorial",
    minutes: 4,
    keywords: ["my work", "tasks", "daily plan", "assigned", "execution"],
    steps: ["Review the pulse for overdue and review pressure.", "Choose Assigned, Following, or Created by me.", "Open an item and read its next meaningful move.", "Start a focus sprint or update the status.", "Open the source record when evidence, rationale, or workflow history belongs there."],
    featured: true
  },
  {
    id: "my-work-views",
    title: "Use views without losing the source of truth",
    summary: "Ownership views answer whose work it is; smart views answer what deserves attention now.",
    content: "Assigned to me contains commitments you can move. Following keeps watched outcomes visible without implying ownership. Created by me helps you inspect work you initiated. Smart views layer urgency, duration, or review state over the chosen ownership view, and filters narrow the result further.",
    category: "actions",
    kind: "hint",
    minutes: 2,
    keywords: ["assigned", "following", "created", "smart view", "filter"]
  },
  {
    id: "my-work-risk",
    title: "Read risk before status",
    summary: "Overdue, blocked, urgent, and review-ready work need different responses—not just different colours.",
    content: "An overdue item needs a recovered commitment or an honest new date. A blocker needs a named dependency and checkpoint. Urgent work has high consequence or a closing window. Review work is ready for a judgment. Use the next meaningful move to turn each signal into an observable action.",
    category: "actions",
    kind: "reference",
    minutes: 3,
    keywords: ["risk", "overdue", "blocked", "review", "priority"]
  },
  {
    id: "my-work-focus",
    title: "Plan three outcomes and protect the time",
    summary: "Plan my day recommends a small set of actionable, high-value outcomes and a focus-time estimate.",
    content: "TREVV excludes blocked and completed work, then weighs urgency, priority, review state, due time, and estimated effort. Treat the recommendation as a starting point: star or remove items until the plan fits your real capacity, then use a 25-minute focus sprint to move one outcome without losing context.",
    category: "actions",
    kind: "tutorial",
    minutes: 3,
    keywords: ["focus plan", "plan my day", "capacity", "sprint", "priority"],
    steps: ["Choose Plan my day.", "Review the recommended outcomes and total minutes.", "Star or remove work until the plan fits your capacity.", "Open the first item and start a 25-minute focus sprint.", "Finish, update, or record the blocker before switching context."]
  },
  {
    id: "my-work-complete",
    title: "Complete work without hiding unfinished context",
    summary: "Completion updates the connected Waiting record and offers a short undo window; Decisions remain controlled in their source workflow.",
    content: "Mark work done only when its observable outcome exists. Connected Waiting and Blueprint items synchronize their status. Decision tasks open the Decision instead because approval, evidence, and rationale must stay together. Use Show done to review progress or Undo immediately after an accidental completion.",
    category: "actions",
    kind: "tip",
    minutes: 2,
    keywords: ["complete", "done", "undo", "sync", "decision"]
  },
  {
    id: "inbox-overview",
    title: "Use Inbox as a clarity boundary",
    summary: "Capture personal thoughts quickly while keeping decisions, mentions, approvals, assignments, and follow-ups visibly actionable.",
    content: "Inbox has two lanes. Quick Capture is a private, low-friction holding space for your own tasks, ideas, links, and notes. Actionable Inbox contains communication or system prompts that need a response. Keeping the lanes separate prevents an unfinished thought from looking like a team commitment.",
    category: "actions",
    kind: "hint",
    minutes: 2,
    keywords: ["inbox", "capture", "requests", "triage"],
    featured: true
  },
  {
    id: "inbox-quick-capture",
    title: "Capture first, clarify just enough",
    summary: "Record the thought, choose its type and Hub, then let TREVV route Tasks and Ideas to their real workflow.",
    content: "Quick Capture should take seconds. Use Task for an observable next step, Idea for an opportunity, Link for a reference, and Note for context. A Hub adds useful scope without forcing a full record. TREVV suggests types and dates from simple language, but you remain in control.",
    category: "actions",
    kind: "tutorial",
    minutes: 3,
    keywords: ["quick capture", "task", "idea", "link", "note", "keyboard"],
    steps: ["Press C from anywhere in Inbox to focus Quick Capture.", "Write one thought in plain language.", "Confirm the suggested type, Hub, and date.", "Press Command or Control plus Enter to capture.", "Follow the routed receipt to Waiting or Ideas when more detail is needed."]
  },
  {
    id: "inbox-actionable",
    title: "What makes an Inbox item actionable",
    summary: "Every request explains who needs you, why, by when, and which operational record contains the real work.",
    content: "Actionable Inbox is for requests that need a response: decisions, mentions, approvals, follow-ups, and assignments. Done clears the notification only after the underlying response exists. Snooze is appropriate when the timing changed or another event must happen first.",
    category: "actions",
    kind: "reference",
    minutes: 3,
    keywords: ["actionable", "decision request", "mention", "approval", "assignment"]
  },
  {
    id: "inbox-triage",
    title: "Triage with the next-record rule",
    summary: "Respond in the linked Decision, Waiting item, Blueprint, or workflow record—then clear the Inbox request.",
    content: "Inbox is the alert layer, not the source of truth. Open the connected record, make the decision or provide the evidence there, and return to mark the request Done. This keeps rationale, ownership, and history attached to the work rather than trapped in a notification.",
    category: "actions",
    kind: "tutorial",
    minutes: 4,
    keywords: ["triage", "linked record", "focus next", "response"],
    steps: ["Use Focus next to open the highest-priority due request.", "Read why it reached your Inbox.", "Open the linked source record.", "Complete the requested decision, evidence, or handoff there.", "Return and mark the Inbox request Done."]
  },
  {
    id: "inbox-capture-tray",
    title: "Process the private capture tray",
    summary: "Keep notes and links lightweight, then turn them into Tasks or Ideas when their next use becomes clear.",
    content: "The capture tray is intentionally personal and temporary. Tasks and Ideas keep a receipt after automatic routing. Notes and Links wait until you choose Make task or Send to Ideas, which prevents vague material from entering shared workflows too early.",
    category: "actions",
    kind: "tip",
    minutes: 2,
    keywords: ["capture tray", "private", "process", "route"]
  },
  {
    id: "inbox-zero",
    title: "Build a sustainable Inbox-zero rhythm",
    summary: "Clear requests by responding, routing, or deliberately snoozing—not by hiding unfinished work.",
    content: "Inbox zero means every visible request has an intentional outcome. Start with urgent decisions, then overdue requests, quick responses, and finally items that can be scheduled. Review snoozed items daily and the private capture tray at least weekly.",
    category: "actions",
    kind: "tutorial",
    minutes: 4,
    keywords: ["inbox zero", "routine", "snooze", "daily review"],
    steps: ["Use Focus next for the urgent or earliest-due request.", "Complete quick responses in their linked records.", "Snooze only to a real next checkpoint.", "Review the private capture tray and route useful items.", "Finish by checking that no urgent request is hidden in Snoozed."]
  },
  {
    id: "waiting-overview",
    title: "Understand Waiting",
    summary: "A single queue for work paused on a person, team, or external party.",
    content: "Waiting is ownership-first. It helps answer who can move the work now, what the next step is, and how long the handoff has been open.",
    category: "actions",
    kind: "hint",
    minutes: 2,
    keywords: ["waiting", "queue", "ownership", "blocked"]
  },
  {
    id: "waiting-you",
    title: "Waiting for you",
    summary: "Customer-owned work blocking the shared plan.",
    content: "Prioritize overdue items, then items that unblock several downstream steps. Resolve only when the stated evidence or decision has actually been supplied.",
    category: "actions",
    kind: "tutorial",
    minutes: 3,
    keywords: ["customer", "waiting for you", "priority"],
    steps: ["Open Waiting for you.", "Sort overdue items first.", "Read the required next step.", "Add or verify the requested evidence.", "Mark resolved only when the outcome exists."]
  },
  {
    id: "waiting-export-hq",
    title: "Waiting for Export HQ",
    summary: "Managed work currently owned by your assigned specialists.",
    content: "These items remain visible so managed work is accountable. The owner, next update, and expected output should always be clear; message your team when any one is missing.",
    category: "actions",
    kind: "reference",
    minutes: 2,
    keywords: ["Export HQ", "specialist", "managed work"]
  },
  {
    id: "waiting-third-party",
    title: "Waiting for a third party",
    summary: "External dependencies such as laboratories, advisers, buyers, or logistics partners.",
    content: "Track the named external party, the last contact, the expected response, and a follow-up date. A third-party wait without a follow-up owner is an unmanaged risk.",
    category: "actions",
    kind: "tip",
    minutes: 2,
    keywords: ["third party", "external", "follow up"]
  },
  {
    id: "task-statuses",
    title: "Task statuses at a glance",
    summary: "Separate ownership from state so the queue remains honest.",
    content: "Ownership answers who moves next; status answers what is happening. In progress, waiting, blocked, and completed should reflect the real state—not the desired one.",
    category: "actions",
    kind: "reference",
    minutes: 2,
    keywords: ["status", "todo", "blocked", "completed"]
  },
  {
    id: "due-dates",
    title: "Use due dates as commitments",
    summary: "Set a realistic next checkpoint rather than a decorative target date.",
    content: "When work is waiting externally, the due date should usually be the follow-up checkpoint. Snooze only when the expected timing genuinely changed, and record why.",
    category: "actions",
    kind: "tip",
    minutes: 2,
    keywords: ["due date", "snooze", "deadline"]
  },
  {
    id: "requirements-evidence",
    title: "Connect requirements to evidence",
    summary: "Every applicable requirement needs provenance, a status, and linked proof.",
    content: "Review the source, jurisdiction, effective date, and verification date before acting. Link evidence to the exact requirement it supports; a file in the vault is not proof until that relationship is explicit.",
    category: "compliance",
    kind: "tutorial",
    minutes: 5,
    keywords: ["requirement", "evidence", "source", "provenance"],
    steps: ["Open the requirement.", "Confirm source and jurisdiction.", "Check applicability to the product-market pair.", "Attach the supporting evidence.", "Record the reviewer and verification date."],
    featured: true
  },
  {
    id: "source-confidence",
    title: "Check source confidence",
    summary: "Use effective dates and human review for regulated decisions.",
    content: "A source link is necessary but not always sufficient. Check whether it is authoritative, current, applicable, and reviewed by a qualified person when the decision is regulated or high impact.",
    category: "compliance",
    kind: "reference",
    minutes: 3,
    keywords: ["source", "confidence", "review", "regulation"]
  },
  {
    id: "document-vault",
    title: "Organize the document vault",
    summary: "Use categories, links, versions, review states, and expiry dates consistently.",
    content: "Name files for recognition, not for their upload date alone. Link each document to the company, product, market, or requirement it supports and upload a new version instead of overwriting history.",
    category: "compliance",
    kind: "tip",
    minutes: 3,
    keywords: ["document", "vault", "version", "expiry"]
  },
  {
    id: "evidence-safety",
    title: "Handle evidence safely",
    summary: "Uploads enter quarantine and should follow least-access principles.",
    content: "Upload only the necessary file, avoid secrets in filenames, and verify the intended workspace and requirement. Evidence should be scanned before review and downloaded only by people who need the original.",
    category: "compliance",
    kind: "reference",
    minutes: 3,
    keywords: ["security", "upload", "quarantine", "download"]
  },
  {
    id: "accountable-team",
    title: "Work with your accountable team",
    summary: "Know the named specialist, expected output, and next update for managed work.",
    content: "Export HQ work should never be anonymous. Use the assigned specialist and next-update fields to keep managed delivery visible and escalate through the shared thread when expectations change.",
    category: "collaboration",
    kind: "hint",
    minutes: 2,
    keywords: ["team", "specialist", "accountability", "message"]
  },
  {
    id: "team-overview",
    title: "Read the Team directory",
    summary: "See company members, Export HQ specialists, and partners through the same ownership lens.",
    content: "The directory explains each participant’s role, current focus, availability, response expectation, skills, workload, and active handoffs. It is an operational view; membership and permissions remain controlled in Settings.",
    category: "collaboration",
    kind: "hint",
    minutes: 2,
    keywords: ["team", "directory", "specialist", "partner"]
  },
  {
    id: "team-capacity",
    title: "Interpret workload and availability",
    summary: "Use capacity as a coordination signal, then inspect handoffs and response expectations before reassigning work.",
    content: "Workload is the share of planned capacity currently allocated, not a performance score. Availability shows the person’s immediate working mode. High workload plus several handoffs is a prompt to sequence or rebalance work—not a judgment about the person.",
    category: "collaboration",
    kind: "reference",
    minutes: 3,
    keywords: ["capacity", "workload", "availability", "handoffs"]
  },
  {
    id: "team-roles",
    title: "Separate team ownership from access roles",
    summary: "Team describes who contributes; Settings determines what a workspace member is allowed to do.",
    content: "A specialist, company owner, or partner can appear in operational work without receiving broad workspace privileges. Manage invitations, permission roles, suspension, and removal in Settings, and keep operational ownership visible in Team and Waiting.",
    category: "collaboration",
    kind: "tutorial",
    minutes: 3,
    keywords: ["role", "permission", "access", "member", "partner"],
    steps: ["Open Team to understand operational responsibility.", "Open Waiting to inspect current owned handoffs.", "Open Settings → Members to review workspace access.", "Grant the smallest permission role needed.", "Review access again when the work or relationship changes." ]
  },
  {
    id: "member-roles",
    title: "Choose the smallest useful member role",
    summary: "Match access to responsibility and review it when someone’s work changes.",
    content: "Owners control the workspace, admins manage operations, editors change work, and viewers read. Avoid convenience upgrades; temporary access should be removed or reduced when the task ends.",
    category: "collaboration",
    kind: "reference",
    minutes: 3,
    keywords: ["member", "role", "owner", "admin", "viewer"]
  },
  {
    id: "handoffs",
    title: "Make a clean handoff",
    summary: "Name the owner, expected output, supporting context, and due checkpoint.",
    content: "A handoff is complete when the next person can act without reconstructing the decision. Link the record and evidence, state what good looks like, and avoid assigning a task without its next step.",
    category: "collaboration",
    kind: "tip",
    minutes: 2,
    keywords: ["handoff", "owner", "next step"]
  },
  {
    id: "settings-integrations",
    title: "Configure integrations safely",
    summary: "Connect only the account and resource the workspace actually needs.",
    content: "Integrations are optional. Grant the narrowest resource scope, verify the connected account, and disconnect providers that are no longer used. Existing workspace records continue working when a provider is disconnected.",
    category: "settings",
    kind: "tutorial",
    minutes: 4,
    keywords: ["integration", "Google Drive", "Figma", "GitHub", "Canva", "Calendar"],
    steps: ["Choose Set up.", "Verify the connected account.", "Name the permitted resource.", "Choose whether rich previews are allowed.", "Review the new audit entry."],
    featured: true
  },
  {
    id: "settings-security",
    title: "Review the security policy",
    summary: "Set authentication, session, download, and sensitive-action controls together.",
    content: "Require two-factor authentication, keep sessions appropriately short, restrict original evidence downloads when needed, and require fresh authentication before exports or member administration.",
    category: "settings",
    kind: "reference",
    minutes: 4,
    keywords: ["security", "MFA", "session", "download", "reauthentication"]
  },
  {
    id: "settings-organization",
    title: "Maintain the organization profile",
    summary: "Keep the verified identity and locale settings current.",
    content: "The legal name, trading name, country, timezone, currency, website, and support email shape records across the workspace. Update them when the underlying business information changes.",
    category: "settings",
    kind: "hint",
    minutes: 2,
    keywords: ["organization", "profile", "timezone", "currency"]
  },
  {
    id: "settings-members",
    title: "Administer workspace members",
    summary: "Invite, assign, suspend, restore, and remove people with an auditable reason.",
    content: "Invite a work address, choose the smallest role, and review pending invitations. Suspend access immediately when it should pause; remove the member when the relationship has ended.",
    category: "settings",
    kind: "tutorial",
    minutes: 4,
    keywords: ["invite", "member", "suspend", "remove"],
    steps: ["Open Settings → Members.", "Search for an existing member before inviting.", "Choose the smallest suitable role.", "Send or resend the invitation.", "Review the resulting Audit log entry."]
  },
  {
    id: "settings-audit",
    title: "Read the Audit log",
    summary: "Filter privileged changes by actor, category, date, or affected record.",
    content: "Audit entries explain who changed administrative or security-sensitive state, what changed, when, and from which session. Export filtered entries when a formal review needs a portable record.",
    category: "settings",
    kind: "reference",
    minutes: 3,
    keywords: ["audit", "event", "IP", "history", "CSV"]
  },
  {
    id: "settings-export",
    title: "Export workspace data",
    summary: "Choose the minimum useful dataset and an appropriate portable format.",
    content: "Use JSON for structured archives and CSV for spreadsheet review. Exports exclude passwords, provider tokens, authentication secrets, and original document binaries.",
    category: "settings",
    kind: "tutorial",
    minutes: 3,
    keywords: ["export", "JSON", "CSV", "portable", "download"],
    steps: ["Select only the required data sections.", "Choose the appropriate date range.", "Choose JSON for an archive or CSV for review.", "Generate and store the file in an approved location.", "Confirm the export in Audit history."]
  },
  {
    id: "data-portability",
    title: "Plan for data portability",
    summary: "Keep regular, scoped exports without turning downloads into unmanaged copies.",
    content: "Export only what is needed, store it in an approved location, and apply the same retention and access rules as the live workspace. Delete superseded exports according to your organization policy.",
    category: "settings",
    kind: "tip",
    minutes: 2,
    keywords: ["portability", "retention", "backup", "export"]
  }
];

export function getLearningResource(id: string): LearningResource | undefined {
  return learningCatalog.find((resource) => resource.id === id);
}
