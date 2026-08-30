export type DashboardStarterModuleId = "managed_work" | "requirements" | "accountable_team";
export type DashboardStarterRecordState = "example" | "draft";

export interface ManagedWorkStarter {
  id: string;
  state: DashboardStarterRecordState;
  title: string;
  summary: string;
  ownerRole: string;
  nextUpdate: string;
  progress: number;
  metricLabel: string;
  metricValue: string;
}

export interface RequirementStarter {
  id: string;
  state: DashboardStarterRecordState;
  title: string;
  category: string;
  jurisdiction: string;
  status: "under_review" | "action_required";
  evidence: string;
  ownerRole: string;
  dueLabel: string;
  notes: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceReviewedAt: string;
}

export interface AccountableRoleStarter {
  id: string;
  state: DashboardStarterRecordState;
  role: string;
  purpose: string;
  responseExpectation: string;
}

export interface DashboardStarterWorkspace {
  version: 1;
  moduleOrder: DashboardStarterModuleId[];
  hiddenModules: DashboardStarterModuleId[];
  managedWork: ManagedWorkStarter[];
  requirements: RequirementStarter[];
  accountableRoles: AccountableRoleStarter[];
}

export const dashboardStarterModuleLabels: Readonly<Record<DashboardStarterModuleId, string>> = {
  managed_work: "Managed work",
  requirements: "Requirements needing attention",
  accountable_team: "Accountable team"
};

const defaultModuleOrder: readonly DashboardStarterModuleId[] = ["managed_work", "requirements", "accountable_team"];

const managedWorkDefaults: readonly ManagedWorkStarter[] = [
  {
    id: "managed-compliance-review",
    state: "example",
    title: "Germany compliance review",
    summary: "Review applicable labelling, evidence and packaging checkpoints for one priority lane.",
    ownerRole: "Compliance specialist",
    nextUpdate: "Next update · Friday",
    progress: 57,
    metricLabel: "checkpoints planned",
    metricValue: "4 of 7"
  },
  {
    id: "managed-buyer-research",
    state: "example",
    title: "Netherlands buyer research",
    summary: "Define the buyer profile, build a longlist and record qualification evidence.",
    ownerRole: "Market specialist",
    nextUpdate: "Update cadence · Weekly",
    progress: 35,
    metricLabel: "target buyers to qualify",
    metricValue: "20"
  }
];

const requirementDefaults: readonly RequirementStarter[] = [
  {
    id: "requirement-textile-labelling",
    state: "example",
    title: "EU textile fibre labelling",
    category: "Labelling",
    jurisdiction: "European Union",
    status: "under_review",
    evidence: "Label artwork and fibre-composition declaration",
    ownerRole: "Compliance owner",
    dueLabel: "Choose a review date",
    notes: "Confirm current applicability for the exact product, lane and channel before activating work.",
    sourceLabel: "Regulation (EU) No 1007/2011",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2011/1007/oj",
    sourceReviewedAt: "2026-08-30"
  },
  {
    id: "requirement-reach-evidence",
    state: "example",
    title: "REACH restricted substances evidence",
    category: "Chemicals",
    jurisdiction: "European Union",
    status: "action_required",
    evidence: "Current test report or supplier declaration",
    ownerRole: "Product evidence owner",
    dueLabel: "Choose an evidence date",
    notes: "Screen the exact material and product scope; this example is not a legal conclusion.",
    sourceLabel: "ECHA REACH restrictions",
    sourceUrl: "https://echa.europa.eu/substances-restricted-under-reach",
    sourceReviewedAt: "2026-08-30"
  }
];

const accountableRoleDefaults: readonly AccountableRoleStarter[] = [
  {
    id: "role-compliance-lead",
    state: "example",
    role: "Compliance lead",
    purpose: "Own requirement applicability, evidence quality and review handoffs.",
    responseExpectation: "Set a response expectation"
  },
  {
    id: "role-market-specialist",
    state: "example",
    role: "Market specialist",
    purpose: "Own market validation, buyer criteria and research decisions.",
    responseExpectation: "Set a response expectation"
  },
  {
    id: "role-operations-coordinator",
    state: "example",
    role: "Operations coordinator",
    purpose: "Keep dependencies, deadlines and third-party handoffs moving.",
    responseExpectation: "Set a response expectation"
  }
];

function cloneManagedWork(): ManagedWorkStarter[] {
  return managedWorkDefaults.map((record) => ({ ...record }));
}

function cloneRequirements(): RequirementStarter[] {
  return requirementDefaults.map((record) => ({ ...record }));
}

function cloneRoles(): AccountableRoleStarter[] {
  return accountableRoleDefaults.map((record) => ({ ...record }));
}

export function createDashboardStarterWorkspace(): DashboardStarterWorkspace {
  return {
    version: 1,
    moduleOrder: [...defaultModuleOrder],
    hiddenModules: [],
    managedWork: cloneManagedWork(),
    requirements: cloneRequirements(),
    accountableRoles: cloneRoles()
  };
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function safeText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : fallback;
}

function safeState(value: unknown): DashboardStarterRecordState {
  return value === "draft" ? "draft" : "example";
}

function storedById(value: unknown): Map<string, Record<string, unknown>> {
  if (!Array.isArray(value)) return new Map();
  return new Map(value.flatMap((entry) => {
    const record = recordValue(entry);
    return record && typeof record.id === "string" ? [[record.id, record] as const] : [];
  }));
}

function normalizedModuleList(value: unknown): DashboardStarterModuleId[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<DashboardStarterModuleId>(defaultModuleOrder);
  return [...new Set(value.filter((item): item is DashboardStarterModuleId => typeof item === "string" && allowed.has(item as DashboardStarterModuleId)))];
}

/**
 * Treat browser state as untrusted input. Only the editable planning fields are
 * restored; template identity and regulatory provenance always come from the
 * maintained catalog above.
 */
export function normalizeDashboardStarterWorkspace(value: unknown): DashboardStarterWorkspace {
  const source = recordValue(value);
  if (!source || source.version !== 1) return createDashboardStarterWorkspace();

  const storedOrder = normalizedModuleList(source.moduleOrder);
  const moduleOrder = [...storedOrder, ...defaultModuleOrder.filter((module) => !storedOrder.includes(module))];
  const hiddenModules = normalizedModuleList(source.hiddenModules);
  const storedManagedWork = storedById(source.managedWork);
  const storedRequirements = storedById(source.requirements);
  const storedRoles = storedById(source.accountableRoles);

  return {
    version: 1,
    moduleOrder,
    hiddenModules,
    managedWork: managedWorkDefaults.map((template) => {
      const stored = storedManagedWork.get(template.id);
      return {
        ...template,
        state: safeState(stored?.state),
        title: safeText(stored?.title, template.title, 100),
        summary: safeText(stored?.summary, template.summary, 260),
        ownerRole: safeText(stored?.ownerRole, template.ownerRole, 80),
        nextUpdate: safeText(stored?.nextUpdate, template.nextUpdate, 80),
        progress: typeof stored?.progress === "number" && Number.isFinite(stored.progress)
          ? Math.round(Math.min(100, Math.max(0, stored.progress)))
          : template.progress,
        metricLabel: safeText(stored?.metricLabel, template.metricLabel, 80),
        metricValue: safeText(stored?.metricValue, template.metricValue, 40)
      };
    }),
    requirements: requirementDefaults.map((template) => {
      const stored = storedRequirements.get(template.id);
      return {
        ...template,
        state: safeState(stored?.state),
        evidence: safeText(stored?.evidence, template.evidence, 180),
        ownerRole: safeText(stored?.ownerRole, template.ownerRole, 80),
        dueLabel: safeText(stored?.dueLabel, template.dueLabel, 80),
        notes: safeText(stored?.notes, template.notes, 300)
      };
    }),
    accountableRoles: accountableRoleDefaults.map((template) => {
      const stored = storedRoles.get(template.id);
      return {
        ...template,
        state: safeState(stored?.state),
        role: safeText(stored?.role, template.role, 80),
        purpose: safeText(stored?.purpose, template.purpose, 220),
        responseExpectation: safeText(stored?.responseExpectation, template.responseExpectation, 80)
      };
    })
  };
}
