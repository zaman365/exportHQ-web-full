export type SettingsSection =
  | "integrations"
  | "security"
  | "organization"
  | "members"
  | "audit"
  | "export";

export type IntegrationId =
  | "google-drive"
  | "figma"
  | "github"
  | "canva"
  | "google-calendar";

export type MemberRole = "owner" | "admin" | "editor" | "viewer";
export type MemberStatus = "active" | "pending" | "suspended";

export interface IntegrationState {
  connected: boolean;
  account: string;
  resource: string;
  richPreviews: boolean;
}

export interface SecuritySettings {
  twoFactorRequired: boolean;
  sessionHours: string;
  exportReauthentication: boolean;
  inviteReauthentication: boolean;
  restrictDownloads: boolean;
  allowedDomains: string;
}

export interface OrganizationSettings {
  legalName: string;
  tradingName: string;
  website: string;
  country: string;
  timezone: string;
  defaultCurrency: string;
  supportEmail: string;
}

export interface PrimaryOfferSettings {
  name: string;
  category: string;
  internalReference: string;
  hsCode: string;
  specification: string;
}

export type TargetMarketCode = "DE" | "NL" | "GB" | "JP" | "SA" | "AE";
export type SalesChannelCode = "wholesale" | "retail" | "marketplace" | "services";
export type ExportStageCode = "exploring" | "preparing" | "exporting" | "scaling";

export interface MarketStrategySettings {
  primaryMarket: TargetMarketCode | "";
  secondaryMarkets: TargetMarketCode[];
  primarySalesChannel: SalesChannelCode | "";
  secondarySalesChannels: SalesChannelCode[];
  currentExportStage: ExportStageCode | "";
}

export const targetMarketCatalog: ReadonlyArray<{ code: TargetMarketCode; label: string; region: string }> = [
  { code: "DE", label: "Germany", region: "European Union" },
  { code: "NL", label: "Netherlands", region: "European Union" },
  { code: "GB", label: "United Kingdom", region: "Europe" },
  { code: "JP", label: "Japan", region: "East Asia" },
  { code: "SA", label: "Saudi Arabia", region: "Gulf region" },
  { code: "AE", label: "United Arab Emirates", region: "Gulf region" }
];

export const salesChannelCatalog: ReadonlyArray<{ code: SalesChannelCode; label: string; description: string }> = [
  { code: "wholesale", label: "Wholesale / distributor", description: "Importers, distributors and buying houses" },
  { code: "retail", label: "Direct retail", description: "Sell directly to overseas customers" },
  { code: "marketplace", label: "Marketplace", description: "Third-party B2B or consumer platforms" },
  { code: "services", label: "Direct services", description: "Contracted professional or digital delivery" }
];

export const exportStageCatalog: ReadonlyArray<{ code: ExportStageCode; label: string }> = [
  { code: "exploring", label: "Exploring export opportunities" },
  { code: "preparing", label: "Preparing the business and offer" },
  { code: "exporting", label: "Already exporting" },
  { code: "scaling", label: "Scaling into more markets" }
];

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: MemberRole;
  status: MemberStatus;
  lastActive: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  actorInitials: string;
  action: string;
  category: "organization" | "member" | "security" | "integration" | "export";
  detail: string;
  ip: string;
}

export interface ExportJob {
  id: string;
  createdAt: string;
  format: "json" | "csv";
  sections: string[];
  fileName: string;
}

export interface WorkspaceSettingsState {
  integrations: Record<IntegrationId, IntegrationState>;
  security: SecuritySettings;
  organization: OrganizationSettings;
  primaryOffer: PrimaryOfferSettings;
  marketStrategy: MarketStrategySettings;
  members: WorkspaceMember[];
  audit: AuditEvent[];
  exports: ExportJob[];
}

export const integrationCatalog: ReadonlyArray<{
  id: IntegrationId;
  name: string;
  shortName: string;
  category: string;
  description: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  color: string;
}> = [
  {
    id: "google-drive",
    name: "Google Drive",
    shortName: "G",
    category: "Deep integration",
    description: "Attach files and folders through a permission-safe picker.",
    fieldLabel: "Default shared folder",
    fieldPlaceholder: "e.g. Germany launch",
    color: "#2f9f68"
  },
  {
    id: "figma",
    name: "Figma",
    shortName: "F",
    category: "Smart links",
    description: "Show rich cards and safe embeds in design reviews.",
    fieldLabel: "Figma team or project",
    fieldPlaceholder: "e.g. Export packaging",
    color: "#242938"
  },
  {
    id: "github",
    name: "GitHub",
    shortName: "GH",
    category: "Smart links",
    description: "Attach repositories, issues, commits, and pull requests.",
    fieldLabel: "Organization or repository",
    fieldPlaceholder: "e.g. abc-textiles/supplier-portal",
    color: "#252b36"
  },
  {
    id: "canva",
    name: "Canva",
    shortName: "C",
    category: "Smart links",
    description: "Reference designs, presentations, and exported review assets.",
    fieldLabel: "Canva team",
    fieldPlaceholder: "e.g. ABC Textiles brand",
    color: "#536fea"
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    shortName: "GC",
    category: "Milestones",
    description: "Sync review dates, evidence renewals, and launch milestones.",
    fieldLabel: "Calendar name",
    fieldPlaceholder: "e.g. Export operations",
    color: "#5b55d9"
  }
];

export const initialWorkspaceSettings: WorkspaceSettingsState = {
  integrations: {
    "google-drive": {
      connected: true,
      account: "nadia@abctextiles.com",
      resource: "Germany launch",
      richPreviews: true
    },
    figma: { connected: false, account: "", resource: "", richPreviews: true },
    github: { connected: false, account: "", resource: "", richPreviews: true },
    canva: { connected: false, account: "", resource: "", richPreviews: true },
    "google-calendar": { connected: false, account: "", resource: "", richPreviews: false }
  },
  security: {
    twoFactorRequired: true,
    sessionHours: "12",
    exportReauthentication: true,
    inviteReauthentication: true,
    restrictDownloads: false,
    allowedDomains: "abctextiles.com"
  },
  organization: {
    legalName: "ABC Textiles Limited",
    tradingName: "ABC Textiles",
    website: "https://abctextiles.example",
    country: "Bangladesh",
    timezone: "Asia/Dhaka",
    defaultCurrency: "USD",
    supportEmail: "export@abctextiles.com"
  },
  primaryOffer: {
    name: "Cotton garments",
    category: "Apparel & garments",
    internalReference: "",
    hsCode: "",
    specification: ""
  },
  marketStrategy: {
    primaryMarket: "DE",
    secondaryMarkets: ["NL", "GB"],
    primarySalesChannel: "wholesale",
    secondarySalesChannels: ["marketplace"],
    currentExportStage: "preparing"
  },
  members: [
    {
      id: "member_nadia",
      name: "Nadia Rahman",
      email: "nadia@abctextiles.com",
      initials: "NR",
      role: "owner",
      status: "active",
      lastActive: "Active now"
    },
    {
      id: "member_farhan",
      name: "Farhan Chowdhury",
      email: "farhan@abctextiles.com",
      initials: "FC",
      role: "admin",
      status: "active",
      lastActive: "18 minutes ago"
    },
    {
      id: "member_maya",
      name: "Maya Patel",
      email: "maya@abctextiles.com",
      initials: "MP",
      role: "editor",
      status: "active",
      lastActive: "Yesterday"
    },
    {
      id: "member_omar",
      name: "Omar Hasan",
      email: "omar@abctextiles.com",
      initials: "OH",
      role: "viewer",
      status: "pending",
      lastActive: "Invited 12 Aug"
    }
  ],
  audit: [
    {
      id: "audit_1",
      at: "2026-08-25T08:32:00.000Z",
      actor: "Nadia Rahman",
      actorInitials: "NR",
      action: "Connected Google Drive",
      category: "integration",
      detail: "Granted access to the Germany launch folder.",
      ip: "103.147.184.22"
    },
    {
      id: "audit_2",
      at: "2026-08-24T14:16:00.000Z",
      actor: "Farhan Chowdhury",
      actorInitials: "FC",
      action: "Updated member role",
      category: "member",
      detail: "Maya Patel changed from Viewer to Editor.",
      ip: "103.147.184.31"
    },
    {
      id: "audit_3",
      at: "2026-08-23T10:04:00.000Z",
      actor: "Nadia Rahman",
      actorInitials: "NR",
      action: "Changed security policy",
      category: "security",
      detail: "Required re-authentication for workspace exports.",
      ip: "103.147.184.22"
    },
    {
      id: "audit_4",
      at: "2026-08-20T11:42:00.000Z",
      actor: "Nadia Rahman",
      actorInitials: "NR",
      action: "Updated organization profile",
      category: "organization",
      detail: "Changed support email and default currency.",
      ip: "103.147.184.22"
    },
    {
      id: "audit_5",
      at: "2026-08-14T07:50:00.000Z",
      actor: "Nadia Rahman",
      actorInitials: "NR",
      action: "Created workspace export",
      category: "export",
      detail: "Downloaded organization, task, and audit data as JSON.",
      ip: "103.147.184.22"
    }
  ],
  exports: [
    {
      id: "export_1",
      createdAt: "2026-08-14T07:50:00.000Z",
      format: "json",
      sections: ["organization", "members", "audit"],
      fileName: "export-hq-abc-textiles-2026-08-14.json"
    }
  ]
};

function csvCell(value: unknown): string {
  const serialized = String(value ?? "");
  return `"${serialized.replaceAll('"', '""')}"`;
}

export function createAuditCsv(events: readonly AuditEvent[]): string {
  const header = ["Timestamp", "Actor", "Action", "Category", "Detail", "IP address"];
  const rows = events.map((event) => [
    event.at,
    event.actor,
    event.action,
    event.category,
    event.detail,
    event.ip
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function createWorkspaceExport(
  state: WorkspaceSettingsState,
  sections: readonly string[],
  format: "json" | "csv"
): string {
  const selected: Record<string, unknown> = {};

  if (sections.includes("organization")) selected.organization = state.organization;
  if (sections.includes("members")) selected.members = state.members;
  if (sections.includes("integrations")) selected.integrations = state.integrations;
  if (sections.includes("security")) {
    selected.security = {
      ...state.security,
      allowedDomains: state.security.allowedDomains
        .split(",")
        .map((domain) => domain.trim())
        .filter(Boolean)
    };
  }
  if (sections.includes("audit")) selected.audit = state.audit;

  if (format === "json") {
    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        workspace: state.organization.tradingName,
        data: selected
      },
      null,
      2
    );
  }

  const rows: unknown[][] = [["Section", "Record", "Field", "Value"]];
  Object.entries(selected).forEach(([section, value]) => {
    const records = Array.isArray(value) ? value : [value];
    records.forEach((record, index) => {
      if (record && typeof record === "object") {
        Object.entries(record as Record<string, unknown>).forEach(([field, fieldValue]) => {
          const normalized = typeof fieldValue === "object" ? JSON.stringify(fieldValue) : fieldValue;
          rows.push([section, index + 1, field, normalized]);
        });
      }
    });
  });

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
