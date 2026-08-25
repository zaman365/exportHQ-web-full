"use client";

import {
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Search,
  Sparkles,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  learningCatalog,
  learningCategories,
  type LearningCategoryId,
  type LearningKind,
  type LearningResource
} from "../_components/learning-catalog";
import { HintButton } from "../_components/hint-button";

const completedStorageKey = "exportpanel.learning.completed.v1";

const kindMeta: Record<LearningKind, { label: string; icon: typeof Lightbulb }> = {
  hint: { label: "Hint", icon: Lightbulb },
  tutorial: { label: "Tutorial", icon: GraduationCap },
  tip: { label: "Tip & trick", icon: Sparkles },
  reference: { label: "Reference", icon: FileText }
};

function LearningDetail({
  resource,
  completed,
  onToggle,
  onClose
}: {
  resource: LearningResource;
  completed: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const meta = kindMeta[resource.kind];
  const Icon = meta.icon;
  return (
    <aside className="learning-detail" aria-label={`${resource.title} details`}>
      <header><span className={`learning-kind learning-kind--${resource.kind}`}><Icon size={14} />{meta.label}</span><button type="button" aria-label="Close resource" onClick={onClose}><X size={17} /></button></header>
      <h2>{resource.title}</h2>
      <p className="learning-detail__summary">{resource.summary}</p>
      <div className="learning-detail__meta"><span><Clock3 size={13} />{resource.minutes} min</span><span>{learningCategories.find((category) => category.id === resource.category)?.label}</span></div>
      <div className="learning-detail__body"><p>{resource.content}</p>{resource.steps && <><h3>Follow these steps</h3><ol>{resource.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol></>}</div>
      <footer><button type="button" className={`learning-complete${completed ? " completed" : ""}`} onClick={onToggle}>{completed ? <CheckCircle2 size={16} /> : <Check size={16} />}{completed ? "Completed" : "Mark as complete"}</button></footer>
    </aside>
  );
}

export default function LearningCenterClient({ initialTopic }: { initialTopic?: string | undefined }) {
  const initialResource = learningCatalog.find((resource) => resource.id === initialTopic) ?? learningCatalog.find((resource) => resource.featured) ?? learningCatalog[0];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | LearningCategoryId>(initialResource?.category ?? "all");
  const [kind, setKind] = useState<"all" | LearningKind>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialResource?.id ?? null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(completedStorageKey);
      if (stored) setCompleted(JSON.parse(stored) as string[]);
    } catch {
      localStorage.removeItem(completedStorageKey);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(completedStorageKey, JSON.stringify(completed));
  }, [completed]);

  const filtered = useMemo(() => learningCatalog.filter((resource) => {
    const haystack = `${resource.title} ${resource.summary} ${resource.content} ${resource.keywords.join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (category === "all" || resource.category === category) && (kind === "all" || resource.kind === kind);
  }), [query, category, kind]);

  const selected = learningCatalog.find((resource) => resource.id === selectedId);

  function openResource(resource: LearningResource) {
    setSelectedId(resource.id);
    window.history.replaceState(null, "", `/learn?topic=${resource.id}`);
  }

  function toggleCompleted(resourceId: string) {
    setCompleted((current) => current.includes(resourceId) ? current.filter((id) => id !== resourceId) : [...current, resourceId]);
  }

  return (
    <>
      <section className="workspace-page-head learning-hero">
        <div><p>ExportPanel LEARNING CENTER</p><h1>Know what to do—and why. <HintButton topic="hint-icons" /></h1><span>A managed collection of every contextual hint, tutorial, reference, and practical shortcut in your Export HQ workspace.</span></div>
        <div className="learning-progress"><span><strong>{completed.length}</strong><small>resources completed</small></span><span><strong>{learningCatalog.length}</strong><small>total resources</small></span><span><strong>{learningCategories.length}</strong><small>categories</small></span></div>
      </section>

      <div className="learning-toolbar">
        <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hints, tutorials, tips…" aria-label="Search learning resources" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}</label>
        <select value={kind} onChange={(event) => setKind(event.target.value as "all" | LearningKind)} aria-label="Filter by resource type"><option value="all">All resource types</option><option value="hint">Hints</option><option value="tutorial">Tutorials</option><option value="tip">Tips & tricks</option><option value="reference">References</option></select>
      </div>

      <div className={`learning-layout${selected ? " has-detail" : ""}`}>
        <aside className="learning-categories">
          <div><BookOpenCheck size={17} /><span><strong>Browse by topic</strong><small>Managed and categorized</small></span></div>
          <button type="button" className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}><span>All resources</span><b>{learningCatalog.length}</b></button>
          {learningCategories.map((item) => <button type="button" key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)} title={item.description}><span>{item.label}</span><b>{learningCatalog.filter((resource) => resource.category === item.id).length}</b></button>)}
          <div className="learning-categories__tip"><Lightbulb size={15} /><span>Look for the diamond lightbulb beside components throughout ExportPanel.</span></div>
        </aside>

        <section className="learning-collection" aria-live="polite">
          <header><span><p>RESOURCE COLLECTION</p><h2>{category === "all" ? "All learning resources" : learningCategories.find((item) => item.id === category)?.label}</h2></span><small>{filtered.length} {filtered.length === 1 ? "resource" : "resources"}</small></header>
          {filtered.length === 0 && <div className="learning-empty"><Search size={22} /><strong>No resources match your filters.</strong><button type="button" onClick={() => { setQuery(""); setCategory("all"); setKind("all"); }}>Clear all filters</button></div>}
          <div className="learning-resource-list">{filtered.map((resource) => {
            const meta = kindMeta[resource.kind];
            const Icon = meta.icon;
            const isCompleted = completed.includes(resource.id);
            return <button type="button" key={resource.id} className={`${selectedId === resource.id ? "active" : ""}${isCompleted ? " completed" : ""}`} onClick={() => openResource(resource)}>
              <span className={`learning-resource-icon learning-resource-icon--${resource.kind}`}><Icon size={17} /></span>
              <span><span className="learning-resource-kicker">{meta.label} · {resource.minutes} min</span><strong>{resource.title}</strong><p>{resource.summary}</p></span>
              {isCompleted ? <CheckCircle2 className="learning-resource-state" size={17} /> : resource.steps ? <ListChecks className="learning-resource-state" size={17} /> : null}
            </button>;
          })}</div>
        </section>

        {selected && <LearningDetail resource={selected} completed={completed.includes(selected.id)} onToggle={() => toggleCompleted(selected.id)} onClose={() => setSelectedId(null)} />}
      </div>
    </>
  );
}
