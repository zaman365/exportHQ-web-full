"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  FilePlus2,
  FileStack,
  Play,
  Search,
  Sparkles,
  Star,
  Users,
  X
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { HintButton } from "../_components/hint-button";
import {
  blueprintCatalog,
  blueprintRunsStorageKey,
  customBlueprintsStorageKey,
  favoriteBlueprintsStorageKey,
  readStoredArray,
  type BlueprintDefinition,
  type BlueprintRun
} from "../_components/workflow-data";

const categories = ["All", "Market entry", "Compliance", "Product", "Sales", "Trade operations"] as const;

function BlueprintDialog({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (blueprint: BlueprintDefinition) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BlueprintDefinition["category"]>("Market entry");
  const [steps, setSteps] = useState("");

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedSteps = steps.split("\n").map((step) => step.trim()).filter(Boolean);
    if (parsedSteps.length < 2) return;
    onCreate({ id: `bp-custom-${Date.now()}`, title: title.trim(), description: description.trim(), category, steps: parsedSteps, estimate: "Custom", owner: "Customer", uses: 0, updatedAt: "Just now", builtIn: false });
  }

  return <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="settings-modal blueprint-create-modal" role="dialog" aria-modal="true" aria-labelledby="blueprint-dialog-title"><header><span className="settings-modal__icon"><FilePlus2 size={19} /></span><span><small>Reusable workflow</small><h2 id="blueprint-dialog-title">Create a Blueprint</h2></span><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header><form onSubmit={submit}><label className="settings-field"><span>Name</span><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Distributor onboarding" /></label><label className="settings-field"><span>Purpose</span><input required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What outcome should this workflow produce?" /></label><label className="settings-field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value as BlueprintDefinition["category"])}><option>Market entry</option><option>Compliance</option><option>Product</option><option>Sales</option><option>Trade operations</option></select></label><label className="settings-field blueprint-step-field"><span>Steps — one per line</span><textarea required value={steps} onChange={(event) => setSteps(event.target.value)} placeholder={"Confirm objective\nCollect required evidence\nReview and approve"} /><small>Add at least two observable steps. You can refine owners and timing when a run starts.</small></label><footer><span /><button type="button" className="settings-button settings-button--secondary" onClick={onClose}>Cancel</button><button type="submit" className="settings-button settings-button--primary"><Check size={15} /> Create Blueprint</button></footer></form></section></div>;
}

export default function BlueprintsClient({ canManage }: { canManage: boolean }) {
  const [custom, setCustom] = useState<BlueprintDefinition[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>("bp-germany-launch");
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const storedCustom = readStoredArray<BlueprintDefinition>(customBlueprintsStorageKey);
    setCustom(storedCustom);
    setFavorites(readStoredArray<string>(favoriteBlueprintsStorageKey));
    const requested = new URLSearchParams(window.location.search).get("record");
    if (requested && [...blueprintCatalog, ...storedCustom].some((blueprint) => blueprint.id === requested)) setSelectedId(requested);
  }, []);

  const blueprints = useMemo(() => [...blueprintCatalog, ...custom], [custom]);
  const filtered = useMemo(() => blueprints.filter((blueprint) => {
    const matchesQuery = `${blueprint.title} ${blueprint.description} ${blueprint.category} ${blueprint.steps.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === "All" || blueprint.category === category);
  }).sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id))), [blueprints, query, category, favorites]);
  const selected = blueprints.find((blueprint) => blueprint.id === selectedId);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((favorite) => favorite !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(favoriteBlueprintsStorageKey, JSON.stringify(next));
  }

  function createBlueprint(blueprint: BlueprintDefinition) {
    const next = [...custom, blueprint];
    setCustom(next);
    localStorage.setItem(customBlueprintsStorageKey, JSON.stringify(next));
    setSelectedId(blueprint.id);
    setCreateOpen(false);
    notify("Blueprint created.");
  }

  function useBlueprint(blueprint: BlueprintDefinition) {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    const run: BlueprintRun = {
      id: `run-${Date.now()}`,
      blueprintId: blueprint.id,
      title: blueprint.title,
      description: `Confirm the scope and owner for the first step: ${blueprint.steps[0]}.`,
      createdAt: new Date().toISOString(),
      dueAt: due.toISOString(),
      responsibility: "customer",
      ownerName: "Nadia Rahman",
      relatedEntity: "New Blueprint run",
      status: "waiting_customer",
      totalSteps: blueprint.steps.length,
      completedSteps: 0
    };
    const runs = readStoredArray<BlueprintRun>(blueprintRunsStorageKey);
    localStorage.setItem(blueprintRunsStorageKey, JSON.stringify([run, ...runs]));
    notify("Run created and added to Waiting for you.");
  }

  return <>
    <section className="workspace-page-head blueprint-head"><div><p>ExportPanel / BLUEPRINTS</p><h1>Repeat what works. <HintButton topic="blueprints-overview" /></h1><span>Start faster with reusable, owned workflows for market entry, compliance, products, sales, and trade operations.</span></div><button type="button" className="button button--primary" onClick={() => setCreateOpen(true)} disabled={!canManage}><FilePlus2 size={16} /> Create Blueprint</button></section>
    <section className="blueprint-summary" aria-label="Blueprint summary"><div><FileStack size={18} /><span><strong>{blueprints.length}</strong><small>available Blueprints</small></span></div><div><Star size={18} /><span><strong>{favorites.length}</strong><small>personal favorites</small></span></div><div><Play size={18} /><span><strong>{blueprints.reduce((total, blueprint) => total + blueprint.uses, 0)}</strong><small>runs started</small></span></div><div><Clock3 size={18} /><span><strong>4–6 weeks</strong><small>longest playbook</small></span></div></section>
    <div className="blueprint-toolbar"><label><Search size={16} /><input aria-label="Search Blueprints" placeholder="Search Blueprints…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div role="group" aria-label="Blueprint categories">{categories.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
    <div className={`blueprint-layout${selected ? " has-detail" : ""}`}><section className="blueprint-grid" aria-live="polite">{filtered.length === 0 && <div className="blueprint-empty"><Search size={23} /><strong>No Blueprints match your search.</strong><button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button></div>}{filtered.map((blueprint) => <article className={`blueprint-card${selectedId === blueprint.id ? " active" : ""}`} key={blueprint.id}><header><span className="blueprint-category">{blueprint.category}</span><button type="button" onClick={() => toggleFavorite(blueprint.id)} aria-label={`${favorites.includes(blueprint.id) ? "Remove" : "Add"} ${blueprint.title} ${favorites.includes(blueprint.id) ? "from" : "to"} favorites`} className={favorites.includes(blueprint.id) ? "favorite" : ""}><Star size={16} fill={favorites.includes(blueprint.id) ? "currentColor" : "none"} /></button></header><h2>{blueprint.title}</h2><p>{blueprint.description}</p><div className="blueprint-card__meta"><span><ListIcon />{blueprint.steps.length} steps</span><span><Clock3 size={13} />{blueprint.estimate}</span></div><footer><button type="button" onClick={() => setSelectedId(blueprint.id)}>Preview <ArrowRight size={13} /></button><button type="button" onClick={() => useBlueprint(blueprint)} disabled={!canManage}><Play size={13} /> Use Blueprint</button></footer></article>)}</section>{selected && <aside className="blueprint-detail"><header><span><p>{selected.category}</p><h2>{selected.title}</h2></span><button type="button" aria-label="Close Blueprint preview" onClick={() => setSelectedId(null)}><X size={17} /></button></header><p>{selected.description}</p><div className="blueprint-detail__facts"><span><Clock3 size={14} /><strong>{selected.estimate}</strong><small>Estimated duration</small></span><span><Users size={14} /><strong>{selected.owner}</strong><small>Typical ownership</small></span></div><div className="blueprint-detail__steps"><span><h3>Workflow steps</h3><HintButton topic="blueprint-run" /></span><ol>{selected.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol></div><footer><button type="button" className="button button--primary" onClick={() => useBlueprint(selected)} disabled={!canManage}><Play size={15} /> Use this Blueprint</button><Link href="/learn?topic=blueprint-variables">How to adapt it <ArrowRight size={13} /></Link></footer></aside>}</div>
    {createOpen && <BlueprintDialog onClose={() => setCreateOpen(false)} onCreate={createBlueprint} />}
    {toast && <div className="settings-toast" role="status"><Sparkles size={16} />{toast}</div>}
  </>;
}

function ListIcon() {
  return <span className="blueprint-list-icon" aria-hidden="true"><i /><i /><i /></span>;
}
