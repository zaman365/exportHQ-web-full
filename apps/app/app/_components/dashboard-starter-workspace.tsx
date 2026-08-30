"use client";

import {
  createDashboardStarterWorkspace,
  dashboardStarterModuleLabels,
  normalizeDashboardStarterWorkspace,
  type AccountableRoleStarter,
  type DashboardStarterModuleId,
  type DashboardStarterWorkspace as StarterWorkspace,
  type ManagedWorkStarter,
  type RequirementStarter
} from "@exporthq/domain";
import { Avatar, Badge, Card, Progress } from "@exporthq/ui";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  Pencil,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  X
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

export interface DashboardStarterWorkspaceProps {
  mode: "public" | "workspace";
  storageScope?: string;
}

type EditorTarget =
  | { module: "managed_work"; id: string }
  | { module: "requirements"; id: string }
  | { module: "accountable_team"; id: string };

function storageKey(mode: DashboardStarterWorkspaceProps["mode"], scope: string | undefined): string {
  const safeScope = (scope ?? mode).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
  return `exportpanel.dashboard-starters.${safeScope}.v1`;
}

function recordBadge(state: "example" | "draft") {
  return <Badge tone={state === "draft" ? "info" : "neutral"}>{state === "draft" ? "Editable draft" : "Example"}</Badge>;
}

function initials(value: string): string {
  return value.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "ER";
}

function ManagedWorkEditor({ record, onClose, onSave }: {
  record: ManagedWorkStarter;
  onClose: () => void;
  onSave: (record: ManagedWorkStarter) => void;
}) {
  const [draft, setDraft] = useState(record);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({ ...draft, state: "draft" });
  };

  return <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="settings-modal dashboard-starter-editor" role="dialog" aria-modal="true" aria-labelledby="managed-starter-editor-title">
      <header><span className="settings-modal__icon"><ShieldCheck size={19} /></span><span><small>Editable example</small><h2 id="managed-starter-editor-title">Customize managed work</h2></span><button type="button" className="icon-button" aria-label="Close editor" onClick={onClose}><X size={18} /></button></header>
      <form onSubmit={submit}>
        <div className="dashboard-starter-editor__grid">
          <label className="settings-field dashboard-starter-editor__full"><span>Workstream title</span><input required maxLength={100} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label className="settings-field dashboard-starter-editor__full"><span>Purpose</span><textarea required maxLength={260} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label>
          <label className="settings-field"><span>Suggested owner role</span><input required maxLength={80} value={draft.ownerRole} onChange={(event) => setDraft({ ...draft, ownerRole: event.target.value })} /></label>
          <label className="settings-field"><span>Update expectation</span><input required maxLength={80} value={draft.nextUpdate} onChange={(event) => setDraft({ ...draft, nextUpdate: event.target.value })} /></label>
          <label className="settings-field"><span>Example progress</span><input type="number" min={0} max={100} value={draft.progress} onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value) })} /></label>
          <label className="settings-field"><span>Metric value</span><input required maxLength={40} value={draft.metricValue} onChange={(event) => setDraft({ ...draft, metricValue: event.target.value })} /></label>
          <label className="settings-field dashboard-starter-editor__full"><span>Metric label</span><input required maxLength={80} value={draft.metricLabel} onChange={(event) => setDraft({ ...draft, metricLabel: event.target.value })} /></label>
        </div>
        <footer><span>This stays a browser-only planning draft. It does not claim that Export HQ accepted the work.</span><button type="button" className="settings-button settings-button--secondary" onClick={onClose}>Cancel</button><button type="submit" className="settings-button settings-button--primary">Save example draft</button></footer>
      </form>
    </section>
  </div>;
}

function RequirementEditor({ record, onClose, onSave }: {
  record: RequirementStarter;
  onClose: () => void;
  onSave: (record: RequirementStarter) => void;
}) {
  const [draft, setDraft] = useState(record);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({ ...draft, state: "draft" });
  };

  return <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="settings-modal dashboard-starter-editor" role="dialog" aria-modal="true" aria-labelledby="requirement-starter-editor-title">
      <header><span className="settings-modal__icon"><FileText size={19} /></span><span><small>Source-controlled example</small><h2 id="requirement-starter-editor-title">Customize requirement planning</h2></span><button type="button" className="icon-button" aria-label="Close editor" onClick={onClose}><X size={18} /></button></header>
      <form onSubmit={submit}>
        <div className="dashboard-starter-source-lock"><ShieldCheck size={17} /><span><strong>{record.title}</strong><small>{record.category} · {record.jurisdiction}</small><a href={record.sourceUrl} target="_blank" rel="noreferrer">{record.sourceLabel} <ArrowRight size={12} /></a></span><Badge tone="success">Source locked</Badge></div>
        <div className="dashboard-starter-editor__grid">
          <label className="settings-field dashboard-starter-editor__full"><span>Evidence to prepare</span><input required maxLength={180} value={draft.evidence} onChange={(event) => setDraft({ ...draft, evidence: event.target.value })} /></label>
          <label className="settings-field"><span>Suggested owner role</span><input required maxLength={80} value={draft.ownerRole} onChange={(event) => setDraft({ ...draft, ownerRole: event.target.value })} /></label>
          <label className="settings-field"><span>Planning date</span><input required maxLength={80} value={draft.dueLabel} onChange={(event) => setDraft({ ...draft, dueLabel: event.target.value })} /></label>
          <label className="settings-field dashboard-starter-editor__full"><span>Applicability note</span><textarea required maxLength={300} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
        </div>
        <footer><span>Jurisdiction and source provenance cannot be overwritten from the starter editor.</span><button type="button" className="settings-button settings-button--secondary" onClick={onClose}>Cancel</button><button type="submit" className="settings-button settings-button--primary">Save example draft</button></footer>
      </form>
    </section>
  </div>;
}

function AccountableRoleEditor({ record, onClose, onSave }: {
  record: AccountableRoleStarter;
  onClose: () => void;
  onSave: (record: AccountableRoleStarter) => void;
}) {
  const [draft, setDraft] = useState(record);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({ ...draft, state: "draft" });
  };

  return <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="settings-modal dashboard-starter-editor" role="dialog" aria-modal="true" aria-labelledby="role-starter-editor-title">
      <header><span className="settings-modal__icon"><UsersRound size={19} /></span><span><small>Role before identity</small><h2 id="role-starter-editor-title">Customize an accountable role</h2></span><button type="button" className="icon-button" aria-label="Close editor" onClick={onClose}><X size={18} /></button></header>
      <form onSubmit={submit}>
        <div className="dashboard-starter-editor__grid">
          <label className="settings-field dashboard-starter-editor__full"><span>Role</span><input required maxLength={80} value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} /></label>
          <label className="settings-field dashboard-starter-editor__full"><span>Purpose</span><textarea required maxLength={220} value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} /></label>
          <label className="settings-field dashboard-starter-editor__full"><span>Response expectation</span><input required maxLength={80} value={draft.responseExpectation} onChange={(event) => setDraft({ ...draft, responseExpectation: event.target.value })} /></label>
        </div>
        <footer><span>No person is assigned by this draft. Add a real member or granted specialist in Team.</span><button type="button" className="settings-button settings-button--secondary" onClick={onClose}>Cancel</button><button type="submit" className="settings-button settings-button--primary">Save example draft</button></footer>
      </form>
    </section>
  </div>;
}

export function DashboardStarterWorkspace({ mode, storageScope }: DashboardStarterWorkspaceProps) {
  const [workspace, setWorkspace] = useState<StarterWorkspace>(() => createDashboardStarterWorkspace());
  const [hydrated, setHydrated] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [message, setMessage] = useState("");
  const key = useMemo(() => storageKey(mode, storageScope), [mode, storageScope]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setWorkspace(normalizeDashboardStarterWorkspace(JSON.parse(stored)));
    } catch {
      window.localStorage.removeItem(key);
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(workspace));
    } catch {
      setMessage("This browser could not save the starter draft. Your tenant records were not affected.");
    }
  }, [hydrated, key, workspace]);

  const draftCount = [...workspace.managedWork, ...workspace.requirements, ...workspace.accountableRoles].filter((record) => record.state === "draft").length;
  const visibleModules = workspace.moduleOrder.filter((module) => !workspace.hiddenModules.includes(module));

  const update = (next: StarterWorkspace, notice: string) => {
    setWorkspace(normalizeDashboardStarterWorkspace(next));
    setMessage(notice);
  };

  const toggleModule = (module: DashboardStarterModuleId) => {
    const hidden = workspace.hiddenModules.includes(module);
    update({ ...workspace, hiddenModules: hidden ? workspace.hiddenModules.filter((item) => item !== module) : [...workspace.hiddenModules, module] }, hidden ? `${dashboardStarterModuleLabels[module]} restored.` : `${dashboardStarterModuleLabels[module]} hidden from this starter layout.`);
  };

  const moveModule = (module: DashboardStarterModuleId, direction: -1 | 1) => {
    const index = workspace.moduleOrder.indexOf(module);
    const destination = index + direction;
    if (destination < 0 || destination >= workspace.moduleOrder.length) return;
    const order = [...workspace.moduleOrder];
    [order[index], order[destination]] = [order[destination]!, order[index]!];
    update({ ...workspace, moduleOrder: order }, `${dashboardStarterModuleLabels[module]} moved ${direction < 0 ? "up" : "down"}.`);
  };

  const reset = () => {
    setWorkspace(createDashboardStarterWorkspace());
    setEditor(null);
    setMessage("Starter examples and layout reset. No tenant records were changed.");
  };

  const saveManagedWork = (record: ManagedWorkStarter) => {
    update({ ...workspace, managedWork: workspace.managedWork.map((item) => item.id === record.id ? record : item) }, `${record.title} saved as an editable example draft on this device.`);
    setEditor(null);
  };

  const saveRequirement = (record: RequirementStarter) => {
    update({ ...workspace, requirements: workspace.requirements.map((item) => item.id === record.id ? record : item) }, `${record.title} planning saved without changing its source provenance.`);
    setEditor(null);
  };

  const saveRole = (record: AccountableRoleStarter) => {
    update({ ...workspace, accountableRoles: workspace.accountableRoles.map((item) => item.id === record.id ? record : item) }, `${record.role} saved as an unassigned example role.`);
    setEditor(null);
  };

  const renderManagedWork = () => <section className="dashboard-starter-module" aria-labelledby="dashboard-starter-managed-title">
    <header className="dashboard-starter-module__head"><span><small>EXAMPLE MODULE</small><h2 id="dashboard-starter-managed-title">Managed work</h2><p>Plan what accountable specialist work should look like without claiming that anyone has accepted it.</p></span><Badge tone="neutral">Not operational</Badge></header>
    <div className="dashboard-starter-managed-grid">{workspace.managedWork.map((record, index) => <Card className="dashboard-starter-managed-card" key={record.id}>
      <header><span className="icon-box">{index === 0 ? <ShieldCheck size={18} /> : <Target size={18} />}</span>{recordBadge(record.state)}</header>
      <h3>{record.title}</h3><p>{record.summary}</p><Progress value={record.progress} label={`${record.title} example progress`} />
      <div className="dashboard-starter-metric"><strong>{record.metricValue}</strong><span>{record.metricLabel}</span></div>
      <footer><span><small>Suggested owner</small><strong>{record.ownerRole}</strong></span><span>{record.nextUpdate}</span></footer>
      <button type="button" className="dashboard-starter-edit" onClick={() => setEditor({ module: "managed_work", id: record.id })}><Pencil size={13} /> {record.state === "draft" ? "Edit draft" : "Use & customize"}</button>
    </Card>)}</div>
  </section>;

  const renderRequirements = () => <section className="dashboard-starter-module" aria-labelledby="dashboard-starter-requirements-title">
    <header className="dashboard-starter-module__head"><span><small>EXAMPLE MODULE</small><h2 id="dashboard-starter-requirements-title">Requirements needing attention</h2><p>Keep official provenance fixed while tailoring the evidence, ownership, date and applicability note.</p></span><Badge tone="success">Sources protected</Badge></header>
    <div className="requirement-grid dashboard-starter-requirements">{workspace.requirements.map((record) => <Card className="requirement-card dashboard-starter-requirement-card" key={record.id}>
      <div>{recordBadge(record.state)}<span>{record.category} · {record.jurisdiction}</span></div><h3>{record.title}</h3>
      <p><FileText size={15} /> {record.evidence}</p><div className="dashboard-starter-requirement-plan"><span><small>Owner role</small><strong>{record.ownerRole}</strong></span><span><small>Planning date</small><strong>{record.dueLabel}</strong></span></div>
      <blockquote>{record.notes}</blockquote>
      <footer><a href={record.sourceUrl} target="_blank" rel="noreferrer">{record.sourceLabel}</a><span>Catalog reviewed {record.sourceReviewedAt}</span></footer>
      <button type="button" className="dashboard-starter-edit" onClick={() => setEditor({ module: "requirements", id: record.id })}><Pencil size={13} /> {record.state === "draft" ? "Edit planning" : "Use & customize"}</button>
    </Card>)}</div>
  </section>;

  const renderTeam = () => <section className="dashboard-starter-module" aria-labelledby="dashboard-starter-team-title">
    <header className="dashboard-starter-module__head"><span><small>EXAMPLE MODULE</small><h2 id="dashboard-starter-team-title">Accountable team</h2><p>Design the roles first. Real names appear only after a member or explicitly granted specialist is assigned.</p></span><Badge tone="neutral">No people assigned</Badge></header>
    <div className="dashboard-starter-team-banner"><div className="dashboard-starter-role-grid">{workspace.accountableRoles.map((record, index) => <article key={record.id}><Avatar initials={initials(record.role)} tone={index} /><span>{recordBadge(record.state)}<strong>{record.role}</strong><p>{record.purpose}</p><small>{record.responseExpectation}</small></span><button type="button" aria-label={`Customize ${record.role}`} onClick={() => setEditor({ module: "accountable_team", id: record.id })}><Pencil size={14} /></button></article>)}</div><Link className="button button--primary" href={mode === "public" ? "/plans?feature=team" : "/team"}>Open Team <ArrowRight size={15} /></Link></div>
  </section>;

  const renderModule = (module: DashboardStarterModuleId) => {
    if (module === "managed_work") return renderManagedWork();
    if (module === "requirements") return renderRequirements();
    return renderTeam();
  };

  const editingManaged = editor?.module === "managed_work" ? workspace.managedWork.find((record) => record.id === editor.id) : undefined;
  const editingRequirement = editor?.module === "requirements" ? workspace.requirements.find((record) => record.id === editor.id) : undefined;
  const editingRole = editor?.module === "accountable_team" ? workspace.accountableRoles.find((record) => record.id === editor.id) : undefined;

  return <section className="dashboard-starter-workspace" aria-labelledby="dashboard-starter-workspace-title">
    <header className="dashboard-starter-workspace__intro"><span className="dashboard-starter-workspace__icon"><Sparkles size={20} /></span><span><small>EDITABLE STARTER WORKSPACE</small><h2 id="dashboard-starter-workspace-title">See it, shape it, then make it real.</h2><p>These examples are saved only in this browser. They are excluded from customer records, scores, evidence, staffing claims and audit history. Do not enter confidential information.</p></span><div><Badge tone={draftCount ? "info" : "neutral"}>{draftCount ? `${draftCount} local draft${draftCount === 1 ? "" : "s"}` : "Examples only"}</Badge><button type="button" className="button button--secondary" aria-expanded={configureOpen} onClick={() => setConfigureOpen(!configureOpen)}><Settings2 size={15} /> Configure modules</button>{mode === "public" && <Link href="/sign-up" className="button button--primary">Create protected workspace <ArrowRight size={14} /></Link>}</div></header>

    {configureOpen && <div className="dashboard-starter-config" aria-label="Starter module layout"><header><span><LayoutDashboard size={17} /><strong>Starter layout</strong></span><button type="button" onClick={reset}><RotateCcw size={13} /> Reset examples</button></header>{workspace.moduleOrder.map((module, index) => { const hidden = workspace.hiddenModules.includes(module); return <div key={module}><span><strong>{dashboardStarterModuleLabels[module]}</strong><small>{hidden ? "Hidden from this browser layout" : "Visible in this browser layout"}</small></span><button type="button" aria-label={`Move ${dashboardStarterModuleLabels[module]} up`} disabled={index === 0} onClick={() => moveModule(module, -1)}><ArrowUp size={14} /></button><button type="button" aria-label={`Move ${dashboardStarterModuleLabels[module]} down`} disabled={index === workspace.moduleOrder.length - 1} onClick={() => moveModule(module, 1)}><ArrowDown size={14} /></button><button type="button" aria-label={`${hidden ? "Show" : "Hide"} ${dashboardStarterModuleLabels[module]}`} onClick={() => toggleModule(module)}>{hidden ? <Eye size={14} /> : <EyeOff size={14} />} {hidden ? "Show" : "Hide"}</button></div>; })}</div>}

    {message && <p className="dashboard-starter-message" role="status">{message}</p>}
    <div className="dashboard-starter-modules">{visibleModules.length ? visibleModules.map((module) => <div key={module}>{renderModule(module)}</div>) : <Card className="dashboard-starter-empty"><EyeOff size={21} /><h3>All starter modules are hidden</h3><p>Open Configure modules to restore any example. Your drafts are still saved in this browser.</p><button type="button" className="button button--secondary" onClick={() => setConfigureOpen(true)}>Configure modules</button></Card>}</div>
    <footer className="dashboard-starter-boundary"><ShieldCheck size={15} /><span><strong>Boundary:</strong> customizing an example changes only this starter sandbox. Activation requires an authorized tenant command and protected persistence.</span></footer>

    {editingManaged && <ManagedWorkEditor key={editingManaged.id} record={editingManaged} onClose={() => setEditor(null)} onSave={saveManagedWork} />}
    {editingRequirement && <RequirementEditor key={editingRequirement.id} record={editingRequirement} onClose={() => setEditor(null)} onSave={saveRequirement} />}
    {editingRole && <AccountableRoleEditor key={editingRole.id} record={editingRole} onClose={() => setEditor(null)} onSave={saveRole} />}
  </section>;
}
