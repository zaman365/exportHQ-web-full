"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  FileJson,
  FileSpreadsheet,
  FolderLock,
  History,
  Gem,
  KeyRound,
  Link2,
  LockKeyhole,
  Mail,
  Monitor,
  MoreHorizontal,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserPlus,
  Users,
  X
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import { Avatar, Logo } from "@exporthq/ui";
import {
  minimumTierForFeature,
  subscriptionCatalog,
  workspaceFeatureEntitlement,
  type BusinessVerificationStatus,
  type WorkspaceFeature
} from "@exporthq/authorization";
import {
  createAuditCsv,
  createWorkspaceExport,
  exportStageCatalog,
  initialWorkspaceSettings,
  integrationCatalog,
  salesChannelCatalog,
  targetMarketCatalog,
  type AuditEvent,
  type ExportStageCode,
  type ExportJob,
  type IntegrationId,
  type MarketStrategySettings,
  type MemberRole,
  type OrganizationSettings,
  type PrimaryOfferSettings,
  type SalesChannelCode,
  type SettingsSection,
  type TargetMarketCode,
  type WorkspaceSettingsState
} from "./settings-data";
import { HintButton } from "../_components/hint-button";
import { WorkspaceAccountControl } from "../_components/account-controls";
import { exportPanelPath } from "../_lib/export-panel-paths";
import { saveOrganizationProfile } from "./actions";

const storageKey = "exporthq.workspace-settings.v2";

const navigation: ReadonlyArray<{
  id: SettingsSection;
  label: string;
  icon: typeof Link2;
  group?: string;
  feature?: WorkspaceFeature;
}> = [
  { id: "integrations", label: "Integrations", icon: Link2, feature: "integrations" },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "organization", label: "Organization", icon: Building2, group: "Workspace" },
  { id: "members", label: "Members", icon: Users, feature: "team" },
  { id: "audit", label: "Audit log", icon: History, feature: "audit" },
  { id: "export", label: "Export", icon: Download, feature: "export" }
];

const sectionCopy: Record<SettingsSection, { title: string; description: string }> = {
  integrations: {
    title: "Integrations",
    description: "Connect optional tools while Export HQ stays useful on its own."
  },
  security: {
    title: "Security",
    description: "Control access, authentication, downloads, and active sessions."
  },
  organization: {
    title: "Organization",
    description: "Manage the workspace identity and export profile used across your operation."
  },
  members: {
    title: "Members",
    description: "Invite teammates and give each person only the access they need."
  },
  audit: {
    title: "Audit log",
    description: "Review security-sensitive changes and workspace administration activity."
  },
  export: {
    title: "Export workspace",
    description: "Download a portable copy of your organization settings and activity."
  }
};

const roleLabels: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer"
};

const exportSections = [
  { id: "organization", label: "Organization profile", description: "Identity, locale, and workspace preferences" },
  { id: "members", label: "Members", description: "Member details, roles, and account status" },
  { id: "integrations", label: "Integrations", description: "Connection status and configured resources" },
  { id: "security", label: "Security settings", description: "Workspace policies without secrets or recovery codes" },
  { id: "audit", label: "Audit log", description: "Administrative activity and IP addresses" }
] as const;

const activeSessions = [
  { id: "current", device: "Chrome on macOS", location: "Berlin, Germany", seen: "Current session", icon: Monitor },
  { id: "phone", device: "Safari on iPhone", location: "Dhaka, Bangladesh", seen: "3 hours ago", icon: Smartphone },
  { id: "office", device: "Edge on Windows", location: "Dhaka, Bangladesh", seen: "4 days ago", icon: Monitor }
];

function isSettingsSection(value: string): value is SettingsSection {
  return navigation.some((item) => item.id === value);
}

function formatDate(value: string, includeTime = true): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Europe/Berlin"
  }).format(new Date(value));
}

function mergeStoredState(candidate: unknown, defaults: WorkspaceSettingsState): WorkspaceSettingsState {
  if (!candidate || typeof candidate !== "object") return defaults;
  const stored = candidate as Partial<WorkspaceSettingsState>;
  return {
    ...defaults,
    ...stored,
    integrations: { ...defaults.integrations, ...stored.integrations },
    security: { ...defaults.security, ...stored.security },
    organization: { ...defaults.organization, ...stored.organization },
    primaryOffer: { ...defaults.primaryOffer, ...stored.primaryOffer },
    marketStrategy: {
      ...defaults.marketStrategy,
      ...stored.marketStrategy,
      secondaryMarkets: Array.isArray(stored.marketStrategy?.secondaryMarkets) ? stored.marketStrategy.secondaryMarkets : defaults.marketStrategy.secondaryMarkets,
      secondarySalesChannels: Array.isArray(stored.marketStrategy?.secondarySalesChannels) ? stored.marketStrategy.secondarySalesChannels : defaults.marketStrategy.secondarySalesChannels
    },
    members: Array.isArray(stored.members) ? stored.members : defaults.members,
    audit: Array.isArray(stored.audit) ? stored.audit : defaults.audit,
    exports: Array.isArray(stored.exports) ? stored.exports : defaults.exports
  };
}

function downloadText(fileName: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function initialsFor(name: string, email: string): string {
  const fromName = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (fromName || email.slice(0, 2)).toUpperCase();
}

function Toggle({
  checked,
  onChange,
  label,
  disabled = false
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`settings-toggle${checked ? " is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span />
    </button>
  );
}

function StatusBadge({ status }: { status: "active" | "pending" | "suspended" | "connected" }) {
  return <span className={`settings-status settings-status--${status}`}><span />{status}</span>;
}

function SettingsCard({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section className={`settings-card ${className}`.trim()} id={id}>{children}</section>;
}

function IntegrationDialog({
  integrationId,
  workspace,
  onClose,
  onSave,
  onDisconnect,
  canManage
}: {
  integrationId: IntegrationId;
  workspace: WorkspaceSettingsState;
  onClose: () => void;
  onSave: (account: string, resource: string, richPreviews: boolean) => void;
  onDisconnect: () => void;
  canManage: boolean;
}) {
  const catalog = integrationCatalog.find((item) => item.id === integrationId)!;
  const configured = workspace.integrations[integrationId];
  const [account, setAccount] = useState(configured.account || "nadia@abctextiles.com");
  const [resource, setResource] = useState(configured.resource);
  const [richPreviews, setRichPreviews] = useState(configured.richPreviews);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(account.trim(), resource.trim(), richPreviews);
  }

  return (
    <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="integration-dialog-title">
        <header>
          <span className="integration-mark" style={{ background: catalog.color }}>{catalog.shortName}</span>
          <span><small>{configured.connected ? "Manage integration" : "Set up integration"}</small><h2 id="integration-dialog-title">{catalog.name}</h2></span>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </header>
        <form onSubmit={submit}>
          <p className="settings-modal__intro">{catalog.description}</p>
          <label className="settings-field">
            <span>Connected account</span>
            <input autoFocus type="email" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="name@company.com" required disabled={!canManage} />
          </label>
          <label className="settings-field">
            <span>{catalog.fieldLabel}</span>
            <input value={resource} onChange={(event) => setResource(event.target.value)} placeholder={catalog.fieldPlaceholder} required disabled={!canManage} />
            <small>Only resources explicitly selected here become available in this workspace.</small>
          </label>
          {integrationId !== "google-calendar" && <div className="settings-policy-row compact">
            <span><strong>Rich link previews</strong><small>Show the title and safe preview metadata for pasted links.</small></span>
            <Toggle checked={richPreviews} onChange={setRichPreviews} label="Rich link previews" disabled={!canManage} />
          </div>}
          <footer>
            {configured.connected && <button type="button" className="settings-button settings-button--danger-ghost" onClick={onDisconnect} disabled={!canManage}><Trash2 size={14} /> Disconnect</button>}
            <span />
            <button type="button" className="settings-button settings-button--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="settings-button settings-button--primary" disabled={!canManage}><Check size={15} /> {configured.connected ? "Save changes" : "Connect"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function InviteDialog({
  onClose,
  onInvite,
  canManage
}: {
  onClose: () => void;
  onInvite: (name: string, email: string, role: MemberRole) => void;
  canManage: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("viewer");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onInvite(name.trim(), email.trim().toLowerCase(), role);
  }

  return (
    <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="settings-modal settings-modal--small" role="dialog" aria-modal="true" aria-labelledby="invite-dialog-title">
        <header>
          <span className="settings-modal__icon"><UserPlus size={19} /></span>
          <span><small>Workspace access</small><h2 id="invite-dialog-title">Invite a member</h2></span>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </header>
        <form onSubmit={submit}>
          <label className="settings-field"><span>Full name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Amina Khan" required /></label>
          <label className="settings-field"><span>Work email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="amina@company.com" required /></label>
          <label className="settings-field"><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value as MemberRole)}><option value="admin">Admin — manage workspace and members</option><option value="editor">Editor — create and update work</option><option value="viewer">Viewer — read-only access</option></select></label>
          <div className="settings-callout"><ShieldCheck size={16} /><span>The invitation expires in 7 days and can be revoked at any time.</span></div>
          <footer><span /><button type="button" className="settings-button settings-button--secondary" onClick={onClose}>Cancel</button><button className="settings-button settings-button--primary" type="submit" disabled={!canManage}><Mail size={15} /> Send invitation</button></footer>
        </form>
      </section>
    </div>
  );
}

export default function SettingsClient({
  canManageOrganization,
  canManageTeam,
  features,
  authEnabled,
  userName,
  organizationName,
  tierName,
  businessVerification,
  authoritativeTenantMode,
  initialOrganization,
  initialPrimaryOffer,
  initialMarketStrategy
}: {
  canManageOrganization: boolean;
  canManageTeam: boolean;
  features: readonly WorkspaceFeature[];
  authEnabled: boolean;
  userName: string;
  organizationName: string;
  tierName: string;
  businessVerification: BusinessVerificationStatus;
  authoritativeTenantMode: boolean;
  initialOrganization: Partial<OrganizationSettings>;
  initialPrimaryOffer: Partial<PrimaryOfferSettings>;
  initialMarketStrategy: Partial<MarketStrategySettings>;
}) {
  const availableNavigation = authoritativeTenantMode
    ? navigation.filter((item) => item.id === "organization")
    : navigation;
  const workspaceDefaults = useMemo<WorkspaceSettingsState>(() => ({
    ...initialWorkspaceSettings,
    organization: { ...initialWorkspaceSettings.organization, ...initialOrganization },
    primaryOffer: { ...initialWorkspaceSettings.primaryOffer, ...initialPrimaryOffer },
    marketStrategy: { ...initialWorkspaceSettings.marketStrategy, ...initialMarketStrategy }
  }), [initialOrganization, initialPrimaryOffer, initialMarketStrategy]);
  const [section, setSection] = useState<SettingsSection>(() => availableNavigation[0]?.id ?? "security");
  const [workspace, setWorkspace] = useState<WorkspaceSettingsState>(workspaceDefaults);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const [integrationDialog, setIntegrationDialog] = useState<IntegrationId | null>(null);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberStatus, setMemberStatus] = useState("all");
  const [auditQuery, setAuditQuery] = useState("");
  const [auditCategory, setAuditCategory] = useState("all");
  const [selectedExportSections, setSelectedExportSections] = useState<string[]>(["organization", "members", "audit"]);
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [exportRange, setExportRange] = useState("all");
  const [revokedSessions, setRevokedSessions] = useState<string[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savingOrganization, startSavingOrganization] = useTransition();

  useEffect(() => {
    if (!authEnabled) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setWorkspace(mergeStoredState(JSON.parse(stored), workspaceDefaults));
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    const initialSection = new URLSearchParams(window.location.search).get("section") ?? window.location.hash.slice(1);
    if (isSettingsSection(initialSection) && availableNavigation.some((item) => item.id === initialSection)) setSection(initialSection);
    setHydrated(true);
  }, [authEnabled, availableNavigation, workspaceDefaults]);

  useEffect(() => {
    if (!hydrated || authEnabled) return;
    localStorage.setItem(storageKey, JSON.stringify(workspace));
  }, [authEnabled, workspace, hydrated]);

  useEffect(() => {
    const syncSection = () => {
      const next = window.location.hash.slice(1);
      if (isSettingsSection(next) && availableNavigation.some((item) => item.id === next)) setSection(next);
    };
    window.addEventListener("hashchange", syncSection);
    return () => window.removeEventListener("hashchange", syncSection);
  }, [availableNavigation]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  }

  function chooseSection(next: SettingsSection) {
    setSection(next);
    window.history.pushState(null, "", exportPanelPath(`/settings#${next}`));
  }

  function newAudit(action: string, category: AuditEvent["category"], detail: string): AuditEvent {
    return {
      id: `audit_${Date.now()}`,
      at: new Date().toISOString(),
      actor: "Nadia Rahman",
      actorInitials: "NR",
      action,
      category,
      detail,
      ip: "Current session"
    };
  }

  function saveIntegration(account: string, resource: string, richPreviews: boolean) {
    if (!integrationDialog) return;
    const catalog = integrationCatalog.find((item) => item.id === integrationDialog)!;
    const wasConnected = workspace.integrations[integrationDialog].connected;
    setWorkspace((current) => ({
      ...current,
      integrations: {
        ...current.integrations,
        [integrationDialog]: { connected: true, account, resource, richPreviews }
      },
      audit: [newAudit(wasConnected ? `Updated ${catalog.name}` : `Connected ${catalog.name}`, "integration", `Configured ${resource} for ${account}.`), ...current.audit]
    }));
    setIntegrationDialog(null);
    notify(`${catalog.name} ${wasConnected ? "updated" : "connected"}.`);
  }

  function disconnectIntegration() {
    if (!integrationDialog) return;
    const catalog = integrationCatalog.find((item) => item.id === integrationDialog)!;
    setWorkspace((current) => ({
      ...current,
      integrations: {
        ...current.integrations,
        [integrationDialog]: { ...current.integrations[integrationDialog], connected: false }
      },
      audit: [newAudit(`Disconnected ${catalog.name}`, "integration", "The integration can no longer access workspace resources."), ...current.audit]
    }));
    setIntegrationDialog(null);
    notify(`${catalog.name} disconnected.`);
  }

  function saveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSavingOrganization(async () => {
      const result = await saveOrganizationProfile(JSON.stringify({ organization: workspace.organization, primaryOffer: workspace.primaryOffer, marketStrategy: workspace.marketStrategy }));
      if (result.ok) {
        setWorkspace((current) => ({
          ...current,
          audit: [newAudit("Updated organization profile", "organization", "Saved organization identity, trade details, and locale preferences."), ...current.audit]
        }));
      }
      notify(result.message);
    });
  }

  function choosePrimaryMarket(primaryMarket: MarketStrategySettings["primaryMarket"]) {
    setWorkspace((current) => ({
      ...current,
      marketStrategy: {
        ...current.marketStrategy,
        primaryMarket,
        secondaryMarkets: current.marketStrategy.secondaryMarkets.filter((code) => code !== primaryMarket)
      }
    }));
  }

  function toggleSecondaryMarket(code: TargetMarketCode) {
    setWorkspace((current) => {
      if (!current.marketStrategy.primaryMarket || code === current.marketStrategy.primaryMarket) return current;
      const selected = current.marketStrategy.secondaryMarkets.includes(code);
      return {
        ...current,
        marketStrategy: {
          ...current.marketStrategy,
          secondaryMarkets: selected
            ? current.marketStrategy.secondaryMarkets.filter((candidate) => candidate !== code)
            : [...current.marketStrategy.secondaryMarkets, code]
        }
      };
    });
  }

  function choosePrimarySalesChannel(primarySalesChannel: MarketStrategySettings["primarySalesChannel"]) {
    setWorkspace((current) => ({
      ...current,
      marketStrategy: {
        ...current.marketStrategy,
        primarySalesChannel,
        secondarySalesChannels: current.marketStrategy.secondarySalesChannels.filter((code) => code !== primarySalesChannel)
      }
    }));
  }

  function toggleSecondarySalesChannel(code: SalesChannelCode) {
    setWorkspace((current) => {
      if (!current.marketStrategy.primarySalesChannel || code === current.marketStrategy.primarySalesChannel) return current;
      const selected = current.marketStrategy.secondarySalesChannels.includes(code);
      return {
        ...current,
        marketStrategy: {
          ...current.marketStrategy,
          secondarySalesChannels: selected
            ? current.marketStrategy.secondarySalesChannels.filter((candidate) => candidate !== code)
            : [...current.marketStrategy.secondarySalesChannels, code]
        }
      };
    });
  }

  function saveSecurity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorkspace((current) => ({
      ...current,
      audit: [newAudit("Updated security policy", "security", "Saved workspace authentication, download, and session policies."), ...current.audit]
    }));
    notify("Security policy saved.");
  }

  function inviteMember(name: string, email: string, role: MemberRole) {
    if (workspace.members.some((member) => member.email.toLowerCase() === email)) {
      notify("That email already belongs to this workspace.");
      return;
    }
    setWorkspace((current) => ({
      ...current,
      members: [...current.members, {
        id: `member_${Date.now()}`,
        name,
        email,
        initials: initialsFor(name, email),
        role,
        status: "pending",
        lastActive: "Invitation just sent"
      }],
      audit: [newAudit("Invited workspace member", "member", `${name} was invited as ${roleLabels[role]}.`), ...current.audit]
    }));
    setInviteDialog(false);
    notify(`Invitation sent to ${email}.`);
  }

  function changeMemberRole(memberId: string, role: MemberRole) {
    const member = workspace.members.find((candidate) => candidate.id === memberId);
    if (!member || member.role === role) return;
    setWorkspace((current) => ({
      ...current,
      members: current.members.map((candidate) => candidate.id === memberId ? { ...candidate, role } : candidate),
      audit: [newAudit("Updated member role", "member", `${member.name} changed from ${roleLabels[member.role]} to ${roleLabels[role]}.`), ...current.audit]
    }));
    notify(`${member.name} is now an ${roleLabels[role]}.`);
  }

  function toggleMemberStatus(memberId: string) {
    const member = workspace.members.find((candidate) => candidate.id === memberId);
    if (!member) return;
    if (member.status === "pending") {
      setWorkspace((current) => ({
        ...current,
        audit: [newAudit("Resent member invitation", "member", `Sent a new invitation to ${member.email}.`), ...current.audit]
      }));
      notify(`Invitation resent to ${member.email}.`);
      return;
    }
    const status = member.status === "suspended" ? "active" : "suspended";
    setWorkspace((current) => ({
      ...current,
      members: current.members.map((candidate) => candidate.id === memberId ? { ...candidate, status } : candidate),
      audit: [newAudit(status === "active" ? "Restored workspace member" : "Suspended workspace member", "member", `${member.name} is now ${status}.`), ...current.audit]
    }));
    notify(`${member.name} ${status === "active" ? "restored" : "suspended"}.`);
  }

  function removeMember(memberId: string) {
    const member = workspace.members.find((candidate) => candidate.id === memberId);
    if (!member || !window.confirm(`Remove ${member.name} from this workspace?`)) return;
    setWorkspace((current) => ({
      ...current,
      members: current.members.filter((candidate) => candidate.id !== memberId),
      audit: [newAudit("Removed workspace member", "member", `${member.name} (${member.email}) was removed.`), ...current.audit]
    }));
    notify(`${member.name} removed.`);
  }

  const filteredMembers = useMemo(() => workspace.members.filter((member) => {
    const searchValue = `${member.name} ${member.email} ${member.role}`.toLowerCase();
    return searchValue.includes(memberQuery.toLowerCase()) && (memberStatus === "all" || member.status === memberStatus);
  }), [workspace.members, memberQuery, memberStatus]);

  const filteredAudit = useMemo(() => workspace.audit.filter((event) => {
    const searchValue = `${event.actor} ${event.action} ${event.detail} ${event.ip}`.toLowerCase();
    return searchValue.includes(auditQuery.toLowerCase()) && (auditCategory === "all" || event.category === auditCategory);
  }), [workspace.audit, auditQuery, auditCategory]);

  function exportAudit() {
    const fileName = `export-hq-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadText(fileName, createAuditCsv(filteredAudit), "text/csv;charset=utf-8");
    notify(`Downloaded ${filteredAudit.length} audit events.`);
  }

  function rangeFilteredWorkspace() {
    if (exportRange === "all") return workspace;
    const cutoff = Date.now() - Number(exportRange) * 24 * 60 * 60 * 1000;
    return { ...workspace, audit: workspace.audit.filter((event) => new Date(event.at).getTime() >= cutoff) };
  }

  function generateExport() {
    if (selectedExportSections.length === 0) {
      notify("Select at least one data section.");
      return;
    }
    const fileName = `export-hq-${workspace.organization.tradingName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
    const content = createWorkspaceExport(rangeFilteredWorkspace(), selectedExportSections, exportFormat);
    downloadText(fileName, content, exportFormat === "json" ? "application/json" : "text/csv;charset=utf-8");
    const job: ExportJob = {
      id: `export_${Date.now()}`,
      createdAt: new Date().toISOString(),
      format: exportFormat,
      sections: selectedExportSections,
      fileName
    };
    setWorkspace((current) => ({
      ...current,
      exports: [job, ...current.exports].slice(0, 10),
      audit: [newAudit("Created workspace export", "export", `Downloaded ${selectedExportSections.length} data sections as ${exportFormat.toUpperCase()}.`), ...current.audit]
    }));
    notify("Workspace export downloaded.");
  }

  function redownloadExport(job: ExportJob) {
    const content = createWorkspaceExport(workspace, job.sections, job.format);
    downloadText(job.fileName, content, job.format === "json" ? "application/json" : "text/csv;charset=utf-8");
    notify(`${job.fileName} downloaded again.`);
  }

  const copy = sectionCopy[section];
  const currentNavigation = navigation.find((item) => item.id === section);
  const premiumFeature = currentNavigation?.feature && workspaceFeatureEntitlement(currentNavigation.feature)
    ? currentNavigation.feature
    : null;
  const lockedFeature = currentNavigation?.feature && !features.includes(currentNavigation.feature)
    ? currentNavigation.feature
    : null;
  const requiredTier = lockedFeature
    ? subscriptionCatalog[minimumTierForFeature(lockedFeature)]
    : null;
  const canManage = !lockedFeature && (section === "members" ? canManageTeam : canManageOrganization);

  return (
    <div className="settings-page">
      <header className="settings-topbar">
        <Link href="/" className="settings-brand"><Logo /></Link>
        <Link href="/" className="settings-back"><ArrowLeft size={15} /> Back to command center</Link>
        <WorkspaceAccountControl enabled={authEnabled} userName={userName} organizationName={organizationName} tierName={tierName} />
      </header>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-sidebar__title"><Settings2 size={17} /><strong>Settings</strong></div>
          <nav aria-label="Settings navigation">
            {availableNavigation.map((item) => {
              const Icon = item.icon;
              const locked = Boolean(item.feature && !features.includes(item.feature));
              const premium = Boolean(item.feature && workspaceFeatureEntitlement(item.feature));
              const unlockTier = item.feature
                ? subscriptionCatalog[minimumTierForFeature(item.feature)].name
                : null;
              const premiumTitle = locked
                ? `${item.label} unlocks with ${unlockTier}. Open to see what is included.`
                : premium
                  ? `Your premium ${item.label} access is active with ${tierName}.`
                  : undefined;
              return <div key={item.id}>{item.group && <p>{item.group}</p>}<button type="button" className={`${section === item.id ? "active" : ""}${locked ? " locked" : ""}${premium ? " premium" : ""}`} onClick={() => chooseSection(item.id)} aria-current={section === item.id ? "page" : undefined} title={premiumTitle}><Icon size={17} /><span>{item.label}</span>{premium ? <Gem className="settings-nav-premium" size={14} aria-label={locked ? "Premium feature locked" : `Premium feature included with ${tierName}`} /> : <ChevronRight size={14} />}</button></div>;
            })}
          </nav>
          <Link href="/learn" className="settings-sidebar__help"><CircleAlert size={16} /><span><strong>Need a hand?</strong><small>Open the ExportPanel Learning Center for hints and tutorials.</small></span></Link>
        </aside>

        <main className="settings-main">
          <header className="settings-heading"><p>EXPORT HQ / SETTINGS</p><h1>{copy.title} <HintButton topic={`settings-${section}`} /></h1><span>{copy.description}</span></header>
          {lockedFeature && requiredTier && <section className="settings-feature-gate">
            <span className="settings-feature-gate__icon"><Gem size={22} /></span>
            <div><small>PREMIUM SETTINGS</small><h2>{copy.title} is visible, not enabled</h2><p>Keep this capability in view as your operation grows. {requiredTier.name} unlocks the complete {copy.title.toLowerCase()} workspace, its records, and every related action.</p></div>
            <Link href={`/plans?feature=${lockedFeature}`} className="settings-button settings-button--primary">Unlock with {requiredTier.name} <ArrowRight size={14} /></Link>
          </section>}
          {premiumFeature && !lockedFeature && <section className="settings-feature-included" aria-label={`${copy.title} premium access`}>
            <span><Gem size={17} /></span>
            <div><small>YOUR PREMIUM ACCESS · ACTIVE</small><strong>Your workspace includes {copy.title}</strong><p>This capability is part of your {tierName} workspace and ready for your team to use.</p></div>
            <Link href="/plans">View plan access <ArrowRight size={13} /></Link>
          </section>}
          {!lockedFeature && !canManage && <div className="settings-readonly"><LockKeyhole size={17} /><span><strong>Read-only access</strong><small>An organization owner or admin must make changes.</small></span></div>}

          {!lockedFeature && section === "integrations" && <>
            <div className="settings-info-banner"><ShieldCheck size={21} /><span><strong>Optional by design</strong><small>Your products, documents, tasks, and decisions keep working if every provider is disconnected.</small></span></div>
            <SettingsCard className="integration-list">
              {integrationCatalog.map((integration) => {
                const configured = workspace.integrations[integration.id];
                return <article className="integration-row" key={integration.id}>
                  <span className="integration-mark" style={{ background: integration.color }}>{integration.shortName}</span>
                  <span className="integration-copy"><small>{integration.category}</small><strong>{integration.name}</strong><p>{integration.description}</p>{configured.connected && <em>{configured.account} · {configured.resource}</em>}</span>
                  <span className="integration-action">{configured.connected ? <StatusBadge status="connected" /> : <span className="settings-status settings-status--available"><span />Available</span>}<button type="button" className="settings-button settings-button--soft" onClick={() => setIntegrationDialog(integration.id)}>{configured.connected ? "Manage" : "Set up"} <ArrowRight size={14} /></button></span>
                </article>;
              })}
            </SettingsCard>
          </>}

          {!lockedFeature && section === "security" && <form onSubmit={saveSecurity}>
            <div className="security-summary">
              <SettingsCard><span className="summary-icon"><KeyRound size={19} /></span><span><small>Two-factor policy</small><strong>{workspace.security.twoFactorRequired ? "Required" : "Optional"}</strong></span><StatusBadge status="active" /></SettingsCard>
              <SettingsCard><span className="summary-icon"><Monitor size={19} /></span><span><small>Active sessions</small><strong>{activeSessions.length - revokedSessions.length} devices</strong></span></SettingsCard>
              <SettingsCard><span className="summary-icon"><ShieldCheck size={19} /></span><span><small>Last security review</small><strong>23 Aug 2026</strong></span></SettingsCard>
            </div>
            <SettingsCard>
              <div className="settings-card-head"><span><h2>Authentication policy</h2><p>Apply these controls to every organization member.</p></span></div>
              <div className="settings-policy-row"><span><strong>Require two-factor authentication</strong><small>Members must use an authenticator app or another verified second factor.</small></span><Toggle checked={workspace.security.twoFactorRequired} onChange={(twoFactorRequired) => setWorkspace((current) => ({ ...current, security: { ...current.security, twoFactorRequired } }))} label="Require two-factor authentication" disabled={!canManage} /></div>
              <div className="settings-policy-row"><span><strong>Session duration</strong><small>Members must sign in again when the session expires.</small></span><select value={workspace.security.sessionHours} onChange={(event) => setWorkspace((current) => ({ ...current, security: { ...current.security, sessionHours: event.target.value } }))} disabled={!canManage}><option value="4">4 hours</option><option value="12">12 hours</option><option value="24">24 hours</option><option value="168">7 days</option></select></div>
              <div className="settings-policy-row"><span><strong>Allowed email domains</strong><small>Comma-separated domains allowed for new member invitations.</small></span><input value={workspace.security.allowedDomains} onChange={(event) => setWorkspace((current) => ({ ...current, security: { ...current.security, allowedDomains: event.target.value } }))} placeholder="company.com, partner.org" disabled={!canManage} /></div>
            </SettingsCard>
            <SettingsCard>
              <div className="settings-card-head"><span><h2>Sensitive actions</h2><p>Require stronger checks around high-impact workspace activity.</p></span></div>
              <div className="settings-policy-row"><span><strong>Re-authenticate before exporting data</strong><small>Ask for a fresh sign-in before any portable workspace export.</small></span><Toggle checked={workspace.security.exportReauthentication} onChange={(exportReauthentication) => setWorkspace((current) => ({ ...current, security: { ...current.security, exportReauthentication } }))} label="Re-authenticate before exports" disabled={!canManage} /></div>
              <div className="settings-policy-row"><span><strong>Re-authenticate before member changes</strong><small>Protect invitations, role changes, suspensions, and removals.</small></span><Toggle checked={workspace.security.inviteReauthentication} onChange={(inviteReauthentication) => setWorkspace((current) => ({ ...current, security: { ...current.security, inviteReauthentication } }))} label="Re-authenticate before member changes" disabled={!canManage} /></div>
              <div className="settings-policy-row"><span><strong>Restrict document downloads</strong><small>Only owners and admins can download original evidence files.</small></span><Toggle checked={workspace.security.restrictDownloads} onChange={(restrictDownloads) => setWorkspace((current) => ({ ...current, security: { ...current.security, restrictDownloads } }))} label="Restrict document downloads" disabled={!canManage} /></div>
            </SettingsCard>
            <SettingsCard>
              <div className="settings-card-head"><span><h2>Active sessions</h2><p>Review devices currently signed in to this workspace.</p></span><button type="button" className="settings-button settings-button--secondary" onClick={() => {
                const sessionIds = activeSessions.filter((session) => session.id !== "current").map((session) => session.id);
                setRevokedSessions(sessionIds);
                setWorkspace((current) => ({ ...current, audit: [newAudit("Revoked active sessions", "security", "Signed out all devices except the current session."), ...current.audit] }));
                notify("Other sessions revoked.");
              }} disabled={!canManage || revokedSessions.length === activeSessions.length - 1}><RefreshCw size={14} /> Revoke all others</button></div>
              <div className="session-list">{activeSessions.filter((session) => !revokedSessions.includes(session.id)).map((session) => { const Icon = session.icon; return <div key={session.id}><span className="session-icon"><Icon size={18} /></span><span><strong>{session.device}</strong><small>{session.location} · {session.seen}</small></span>{session.id === "current" ? <StatusBadge status="active" /> : <button type="button" className="text-button danger" disabled={!canManage} onClick={() => { setRevokedSessions((current) => [...current, session.id]); setWorkspace((current) => ({ ...current, audit: [newAudit("Revoked device session", "security", `${session.device} in ${session.location} was signed out.`), ...current.audit] })); notify(`${session.device} signed out.`); }}>Revoke</button>}</div>; })}</div>
            </SettingsCard>
            <div className="settings-form-actions"><span>Security changes are recorded in the audit log.</span><button type="submit" className="settings-button settings-button--primary" disabled={!canManage}><Save size={15} /> Save security policy</button></div>
          </form>}

          {!lockedFeature && section === "organization" && <form onSubmit={saveOrganization}>
            <SettingsCard className={`settings-profile-status settings-profile-status--${businessVerification}`}>
              <span className="summary-icon"><BadgeCheck size={19} /></span>
              <span><small>BUSINESS VERIFICATION · OPTIONAL</small><h2>{businessVerification === "verified" ? "Business verified" : businessVerification === "pending" ? "Verification review in progress" : "Build your profile now. Verify when ready."}</h2><p>{businessVerification === "verified" ? "Your reusable trust status is active across eligible ExportPanel features." : businessVerification === "pending" ? "You can keep using ExportPanel while Export HQ reviews the submitted evidence." : "Verification is not part of onboarding. Complete it later to unlock trust-gated intelligence without a paid plan."}</p></span>
              {businessVerification === "verified" ? <Link href="/verify-business" className="settings-button settings-button--secondary">View status <ArrowRight size={14} /></Link> : businessVerification === "pending" ? <Link href="/verify-business" className="settings-button settings-button--secondary">Check status <ArrowRight size={14} /></Link> : <Link href="/verify-business" className="settings-button settings-button--soft">Verify when ready <ArrowRight size={14} /></Link>}
            </SettingsCard>
            <SettingsCard>
              <div className="organization-profile-head"><span className="organization-logo">AT</span><span><h2>{workspace.organization.tradingName}</h2><p>Workspace ID · org_abc_textiles</p></span><button type="button" className="settings-button settings-button--secondary" onClick={() => notify("Logo upload is ready for a PNG, JPG, or SVG file.")} disabled={!canManage}>Change logo</button></div>
              <div className="settings-form-grid">
                <label className="settings-field"><span>Legal company name</span><input required value={workspace.organization.legalName} onChange={(event) => setWorkspace((current) => ({ ...current, organization: { ...current.organization, legalName: event.target.value } }))} disabled={!canManage} /></label>
                <label className="settings-field"><span>Trading name</span><input required value={workspace.organization.tradingName} onChange={(event) => setWorkspace((current) => ({ ...current, organization: { ...current.organization, tradingName: event.target.value } }))} disabled={!canManage} /></label>
                <label className="settings-field"><span>Website</span><input type="url" value={workspace.organization.website} onChange={(event) => setWorkspace((current) => ({ ...current, organization: { ...current.organization, website: event.target.value } }))} placeholder="https://" disabled={!canManage} /></label>
                <label className="settings-field"><span>Support email</span><input type="email" required value={workspace.organization.supportEmail} onChange={(event) => setWorkspace((current) => ({ ...current, organization: { ...current.organization, supportEmail: event.target.value } }))} disabled={!canManage} /></label>
                <label className="settings-field"><span>Country</span><select value={workspace.organization.country} onChange={(event) => setWorkspace((current) => ({ ...current, organization: { ...current.organization, country: event.target.value } }))} disabled={!canManage}><option>Bangladesh</option><option>Germany</option><option>India</option><option>Netherlands</option><option>United Kingdom</option></select></label>
                <label className="settings-field"><span>Timezone</span><select value={workspace.organization.timezone} onChange={(event) => setWorkspace((current) => ({ ...current, organization: { ...current.organization, timezone: event.target.value } }))} disabled={!canManage}><option value="Asia/Dhaka">Dhaka (UTC+6)</option><option value="Europe/Berlin">Berlin (UTC+1/+2)</option><option value="Europe/London">London (UTC/+1)</option><option value="Asia/Kolkata">Kolkata (UTC+5:30)</option></select></label>
                <label className="settings-field"><span>Workspace language</span><select value={workspace.organization.language} onChange={(event) => setWorkspace((current) => ({ ...current, organization: { ...current.organization, language: event.target.value as "bn" | "en" } }))} disabled={!canManage}><option value="bn">বাংলা (Bangla)</option><option value="en">English</option></select><small>Bangladesh workspaces default to Bangla; every workflow keeps an English switch.</small></label>
                <label className="settings-field"><span>Default currency</span><select value={workspace.organization.defaultCurrency} onChange={(event) => setWorkspace((current) => ({ ...current, organization: { ...current.organization, defaultCurrency: event.target.value } }))} disabled={!canManage}><option>USD</option><option>EUR</option><option>GBP</option><option>BDT</option></select><small>Used for workspace summaries; individual deals keep their original currency.</small></label>
              </div>
            </SettingsCard>
            <SettingsCard className="settings-trade-profile" id="primary-offer">
              <div className="settings-card-head"><span><h2>Primary export offer</h2><p>Complete trade-specific details only when they become useful. None of these fields blocks onboarding.</p></span><span className="settings-status settings-status--available"><span />Complete later</span></div>
              <div className="settings-form-grid">
                <label className="settings-field"><span>Product or service</span><input value={workspace.primaryOffer.name} onChange={(event) => setWorkspace((current) => ({ ...current, primaryOffer: { ...current.primaryOffer, name: event.target.value } }))} placeholder="e.g. Cotton garments" disabled={!canManage} /></label>
                <label className="settings-field"><span>Broad category</span><select value={workspace.primaryOffer.category} onChange={(event) => setWorkspace((current) => ({ ...current, primaryOffer: { ...current.primaryOffer, category: event.target.value } }))} disabled={!canManage}><option>Apparel & garments</option><option>Textiles & home textiles</option><option>Leather goods & footwear</option><option>Jute & natural fibre products</option><option>Agriculture & processed food</option><option>Frozen food & seafood</option><option>Light engineering products</option><option>Pharmaceutical products</option><option>ICT & digital services</option><option>Handicrafts & lifestyle products</option><option>Other</option></select></label>
                <label className="settings-field"><span>Internal reference <em>Optional</em></span><input value={workspace.primaryOffer.internalReference} onChange={(event) => setWorkspace((current) => ({ ...current, primaryOffer: { ...current.primaryOffer, internalReference: event.target.value } }))} placeholder="SKU, style or service code—if you use one" maxLength={64} disabled={!canManage} /><small>For your own catalogue organization; ExportPanel does not require it.</small></label>
                <label className="settings-field"><span>HS classification <em>Optional</em></span><input value={workspace.primaryOffer.hsCode} onChange={(event) => setWorkspace((current) => ({ ...current, primaryOffer: { ...current.primaryOffer, hsCode: event.target.value } }))} placeholder="Add after classification, e.g. 6205.20" maxLength={16} disabled={!canManage} /><small>Leave blank if unknown. Readiness guidance can help you find and confirm it.</small></label>
                <label className="settings-field settings-field--wide"><span>Specification or delivery detail <em>Optional</em></span><textarea value={workspace.primaryOffer.specification} onChange={(event) => setWorkspace((current) => ({ ...current, primaryOffer: { ...current.primaryOffer, specification: event.target.value } }))} placeholder="Materials, sizes, packaging, minimum order, or service delivery format" maxLength={500} disabled={!canManage} /><small>Add detail gradually as the offer becomes export-ready.</small></label>
              </div>
              <div className="settings-trade-profile__help"><CircleAlert size={16} /><span><strong>Unsure about classification or requirements?</strong><small>Use guided readiness first; it will explain why a detail matters before asking for it.</small></span><Link href="/readiness">Open readiness <ArrowRight size={14} /></Link><Link href="/learn">Learning Center</Link></div>
            </SettingsCard>
            <SettingsCard className="settings-market-profile" id="market-direction">
              <div className="settings-card-head"><span><h2>Market direction</h2><p>Keep several destinations and routes in view. Choose one primary option for readiness planning; every other selection stays secondary.</p></span><span className="settings-status settings-status--available"><span />Optional</span></div>
              <div className="settings-form-grid settings-market-profile__grid">
                <label className="settings-field"><span>Primary target market <em>Optional</em></span><select value={workspace.marketStrategy.primaryMarket} onChange={(event) => choosePrimaryMarket(event.target.value as MarketStrategySettings["primaryMarket"])} disabled={!canManage}><option value="">Choose later</option>{targetMarketCatalog.map((market) => <option value={market.code} key={market.code}>{market.label} · {market.region}</option>)}</select><small>The primary market shapes the first readiness and opportunity recommendations.</small></label>
                <label className="settings-field"><span>Current export stage <em>Optional</em></span><select value={workspace.marketStrategy.currentExportStage} onChange={(event) => setWorkspace((current) => ({ ...current, marketStrategy: { ...current.marketStrategy, currentExportStage: event.target.value as ExportStageCode | "" } }))} disabled={!canManage}><option value="">Choose later</option>{exportStageCatalog.map((stage) => <option value={stage.code} key={stage.code}>{stage.label}</option>)}</select><small>Update this as the business progresses; it changes the order, not the availability, of guidance.</small></label>
                <fieldset className="settings-choice-field settings-field--wide" disabled={!canManage || !workspace.marketStrategy.primaryMarket}>
                  <legend>Secondary target markets <em>Optional</em></legend>
                  <p>{workspace.marketStrategy.primaryMarket ? "Select every additional destination you want ExportPanel to monitor." : "Choose a primary target market first, then add any secondary destinations."}</p>
                  <div className="settings-choice-grid">{targetMarketCatalog.map((market) => {
                    const isPrimary = workspace.marketStrategy.primaryMarket === market.code;
                    const selected = workspace.marketStrategy.secondaryMarkets.includes(market.code);
                    return <label className={isPrimary ? "is-primary" : selected ? "is-selected" : ""} key={market.code}><input type="checkbox" checked={selected} disabled={isPrimary || !canManage || !workspace.marketStrategy.primaryMarket} onChange={() => toggleSecondaryMarket(market.code)} /><span><strong>{market.label}</strong><small>{market.region}</small></span>{isPrimary && <b>Primary</b>}{selected && <Check size={14} />}</label>;
                  })}</div>
                </fieldset>
                <label className="settings-field settings-field--wide"><span>Primary sales channel <em>Optional</em></span><select value={workspace.marketStrategy.primarySalesChannel} onChange={(event) => choosePrimarySalesChannel(event.target.value as MarketStrategySettings["primarySalesChannel"])} disabled={!canManage}><option value="">Choose later</option>{salesChannelCatalog.map((channel) => <option value={channel.code} key={channel.code}>{channel.label}</option>)}</select><small>This route becomes the default context for contracts, buyer acquisition, delivery, and payment guidance.</small></label>
                <fieldset className="settings-choice-field settings-field--wide" disabled={!canManage || !workspace.marketStrategy.primarySalesChannel}>
                  <legend>Secondary sales channels <em>Optional</em></legend>
                  <p>{workspace.marketStrategy.primarySalesChannel ? "Select other channels the business uses or wants to test." : "Choose a primary sales channel first, then add any secondary routes."}</p>
                  <div className="settings-choice-grid settings-choice-grid--channels">{salesChannelCatalog.map((channel) => {
                    const isPrimary = workspace.marketStrategy.primarySalesChannel === channel.code;
                    const selected = workspace.marketStrategy.secondarySalesChannels.includes(channel.code);
                    return <label className={isPrimary ? "is-primary" : selected ? "is-selected" : ""} key={channel.code}><input type="checkbox" checked={selected} disabled={isPrimary || !canManage || !workspace.marketStrategy.primarySalesChannel} onChange={() => toggleSecondarySalesChannel(channel.code)} /><span><strong>{channel.label}</strong><small>{channel.description}</small></span>{isPrimary && <b>Primary</b>}{selected && <Check size={14} />}</label>;
                  })}</div>
                </fieldset>
              </div>
              <div className="settings-market-profile__foot"><span><strong>No price or currency requested here.</strong><small>Add commercial terms later, when you create a quotation, opportunity, or shipment.</small></span><Link href="/opportunities">Explore market intelligence <ArrowRight size={14} /></Link></div>
            </SettingsCard>
            <SettingsCard className="settings-danger-zone"><div><span className="summary-icon danger"><FolderLock size={18} /></span><span><h2>Workspace ownership</h2><p>Ownership transfer requires identity verification and acceptance by another active admin.</p></span></div><button type="button" className="settings-button settings-button--secondary" disabled={!canManage} onClick={() => notify("Ownership transfer request started. Select an active admin to continue.")}>Start transfer</button></SettingsCard>
            <div className="settings-form-actions"><span>Changes apply across customer and operator workspaces.</span><button type="submit" className="settings-button settings-button--primary" disabled={!canManage || savingOrganization}><Save size={15} /> {savingOrganization ? "Saving…" : "Save organization"}</button></div>
          </form>}

          {!lockedFeature && section === "members" && <>
            <div className="member-toolbar"><label className="settings-search"><Search size={16} /><input aria-label="Search members" placeholder="Search members…" value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} /></label><select aria-label="Filter member status" value={memberStatus} onChange={(event) => setMemberStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option></select><button type="button" className="settings-button settings-button--primary" onClick={() => setInviteDialog(true)} disabled={!canManage}><UserPlus size={15} /> Invite member</button></div>
            <SettingsCard className="member-list">
              <div className="member-list-head"><span>Member</span><span>Role</span><span>Status</span><span>Last active</span><span>Actions</span></div>
              {filteredMembers.length === 0 && <div className="settings-empty"><Users size={22} /><strong>No members match these filters.</strong><button type="button" className="text-button" onClick={() => { setMemberQuery(""); setMemberStatus("all"); }}>Clear filters</button></div>}
              {filteredMembers.map((member, index) => <article className="member-row" key={member.id}>
                <span className="member-identity"><Avatar initials={member.initials} tone={index % 3} /><span><strong>{member.name}{member.id === "member_nadia" && <small className="you-label">You</small>}</strong><small>{member.email}</small></span></span>
                <span><select aria-label={`Role for ${member.name}`} value={member.role} disabled={!canManage || member.role === "owner"} onChange={(event) => changeMemberRole(member.id, event.target.value as MemberRole)}><option value="owner">Owner</option><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select></span>
                <span><StatusBadge status={member.status} /></span><span className="member-last-active"><Clock3 size={13} />{member.lastActive}</span>
                <span className="member-actions">{member.role !== "owner" && <><button type="button" className="text-button" onClick={() => toggleMemberStatus(member.id)} disabled={!canManage}>{member.status === "pending" ? "Resend" : member.status === "suspended" ? "Restore" : "Suspend"}</button><button type="button" className="icon-button" aria-label={`Remove ${member.name}`} onClick={() => removeMember(member.id)} disabled={!canManage}><Trash2 size={15} /></button></>}{member.role === "owner" && <MoreHorizontal size={17} />}</span>
              </article>)}
            </SettingsCard>
            <div className="settings-footnote"><ShieldCheck size={15} /><span>Role and status changes take effect immediately and are recorded in the audit log.</span></div>
          </>}

          {!lockedFeature && section === "audit" && <>
            <div className="audit-toolbar"><label className="settings-search"><Search size={16} /><input aria-label="Search audit events" placeholder="Search activity…" value={auditQuery} onChange={(event) => setAuditQuery(event.target.value)} /></label><select aria-label="Filter audit category" value={auditCategory} onChange={(event) => setAuditCategory(event.target.value)}><option value="all">All activity</option><option value="organization">Organization</option><option value="member">Members</option><option value="security">Security</option><option value="integration">Integrations</option><option value="export">Exports</option></select><button type="button" className="settings-button settings-button--secondary" onClick={exportAudit}><Download size={14} /> Export CSV</button></div>
            <SettingsCard className="audit-list"><div className="audit-list-head"><span>Event</span><span>Category</span><span>Date & time</span><span>IP address</span></div>{filteredAudit.length === 0 && <div className="settings-empty"><History size={22} /><strong>No audit events match these filters.</strong><button type="button" className="text-button" onClick={() => { setAuditQuery(""); setAuditCategory("all"); }}>Clear filters</button></div>}{filteredAudit.map((event, index) => <article className="audit-row" key={event.id}><span className="audit-event"><Avatar initials={event.actorInitials} tone={index % 3} /><span><strong>{event.action}</strong><small>{event.detail}</small><em>{event.actor}</em></span></span><span className={`audit-category audit-category--${event.category}`}>{event.category}</span><span>{formatDate(event.at)}</span><span>{event.ip}</span></article>)}</SettingsCard>
            <div className="settings-footnote"><LockKeyhole size={15} /><span>Audit entries are append-only in production and retained according to your organization policy.</span></div>
          </>}

          {!lockedFeature && section === "export" && <>
            <div className="settings-info-banner"><Download size={21} /><span><strong>Your data stays portable</strong><small>Exports exclude passwords, authentication secrets, document binaries, and integration tokens.</small></span></div>
            <div className="export-grid"><SettingsCard>
              <div className="settings-card-head"><span><h2>Choose data</h2><p>Select the workspace settings to include.</p></span></div>
              <div className="export-options">{exportSections.map((option) => { const selected = selectedExportSections.includes(option.id); return <label key={option.id} className={selected ? "selected" : ""}><input type="checkbox" checked={selected} onChange={() => setSelectedExportSections((current) => current.includes(option.id) ? current.filter((item) => item !== option.id) : [...current, option.id])} /><span className="export-check">{selected && <Check size={13} />}</span><span><strong>{option.label}</strong><small>{option.description}</small></span></label>; })}</div>
            </SettingsCard><aside><SettingsCard>
              <div className="settings-card-head"><span><h2>Export options</h2><p>Build a new portable file.</p></span></div>
              <label className="settings-field"><span>Date range</span><select value={exportRange} onChange={(event) => setExportRange(event.target.value)}><option value="all">All available history</option><option value="90">Last 90 days</option><option value="30">Last 30 days</option></select></label>
              <span className="field-label">File format</span><div className="format-picker"><button type="button" className={exportFormat === "json" ? "active" : ""} onClick={() => setExportFormat("json")}><FileJson size={19} /><span><strong>JSON</strong><small>Structured archive</small></span></button><button type="button" className={exportFormat === "csv" ? "active" : ""} onClick={() => setExportFormat("csv")}><FileSpreadsheet size={19} /><span><strong>CSV</strong><small>Spreadsheet-ready</small></span></button></div>
              <button type="button" className="settings-button settings-button--primary settings-button--wide" onClick={generateExport} disabled={!canManage}><Download size={15} /> Generate & download</button>
              <p className="export-note"><ShieldCheck size={14} /> The completed export is generated locally for this demo workspace.</p>
            </SettingsCard></aside></div>
            <SettingsCard className="export-history"><div className="settings-card-head"><span><h2>Export history</h2><p>Recent files generated by organization administrators.</p></span></div>{workspace.exports.map((job) => <div key={job.id}><span className="export-file-icon">{job.format === "json" ? <FileJson size={18} /> : <FileSpreadsheet size={18} />}</span><span><strong>{job.fileName}</strong><small>{job.sections.length} sections · {job.format.toUpperCase()}</small></span><span>{formatDate(job.createdAt)}</span><button type="button" className="settings-button settings-button--secondary" onClick={() => redownloadExport(job)}><Download size={14} /> Download again</button></div>)}</SettingsCard>
          </>}
        </main>
      </div>

      {!lockedFeature && integrationDialog && <IntegrationDialog key={integrationDialog} integrationId={integrationDialog} workspace={workspace} onClose={() => setIntegrationDialog(null)} onSave={saveIntegration} onDisconnect={disconnectIntegration} canManage={canManage} />}
      {!lockedFeature && inviteDialog && <InviteDialog onClose={() => setInviteDialog(false)} onInvite={inviteMember} canManage={canManage} />}
      {toast && <div className="settings-toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}
