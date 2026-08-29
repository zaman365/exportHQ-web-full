"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Handshake,
  Info,
  LoaderCircle,
  LockKeyhole,
  Paperclip,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type {
  ReadinessProfile,
  ReadinessProviderCategory,
  ReadinessRequirementView,
  ReadinessSectionId,
  ReadinessStatus
} from "@exporthq/domain";
import type { BusinessVerificationStatus, ReadinessAccess } from "@exporthq/authorization";
import type { ReadinessProgressInput } from "@exporthq/validation";
import { HintButton } from "../_components/hint-button";
import { exportPanelPath } from "../_lib/export-panel-paths";
import { prepareLowDataEvidenceFile } from "../_lib/evidence-preparation";
import { useSafeAutosave } from "../_lib/safe-autosave";
import { requestReadinessProviderMatch, saveReadinessProgress } from "./actions";

type EvidenceItem = ReadinessProgressInput["evidence"][number];
type ReadinessInitialProgress = Omit<ReadinessProgressInput, "evidence"> & {
  readonly evidence: readonly EvidenceItem[];
};
type ProviderCatalog = Partial<Record<ReadinessProviderCategory, { label: string; description: string }>>;

const sections: ReadonlyArray<{ id: ReadinessSectionId; label: string; description: string }> = [
  { id: "business", label: "Business identity", description: "Entity, tax and local authority foundations" },
  { id: "registrations", label: "Export registrations", description: "Export permission and banking route" },
  { id: "facility", label: "Facility & operations", description: "Site, safety, labour and environmental controls" },
  { id: "product", label: "Product evidence", description: "Classification, testing, labels and specifications" },
  { id: "market", label: "Target market", description: "Destination duties, controls and importer obligations" },
  { id: "commercial", label: "Commercial readiness", description: "Capacity, costing, buyers and contracts" },
  { id: "delivery", label: "Trade delivery", description: "Shipment, payment and customs execution" },
  { id: "digital", label: "Digital trust", description: "Buyer credibility, assets and IP" }
];

const targetMarkets: ReadonlyArray<{ code: ReadinessProfile["targetMarketCode"]; label: string }> = [
  { code: "DE", label: "Germany / EU" },
  { code: "NL", label: "Netherlands / EU" },
  { code: "GB", label: "United Kingdom" },
  { code: "JP", label: "Japan" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "AE", label: "United Arab Emirates" }
];

const statusOptions: ReadonlyArray<{ value: ReadinessStatus; label: string; reviewControlled?: boolean }> = [
  { value: "not_started", label: "Not checked" },
  { value: "in_progress", label: "In progress" },
  { value: "evidence_added", label: "Evidence added", reviewControlled: true },
  { value: "verified", label: "Verified / complete", reviewControlled: true },
  { value: "blocked", label: "Blocked" },
  { value: "not_applicable", label: "Not applicable", reviewControlled: true }
];

const statusCredit: Readonly<Record<ReadinessStatus, number | null>> = {
  not_started: 0,
  in_progress: 0.35,
  evidence_added: 0.65,
  verified: 1,
  blocked: 0,
  not_applicable: null
};

const evidenceDbName = "exportpanel-evidence-drafts-v1";

function openEvidenceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(evidenceDbName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("files")) request.result.createObjectStore("files");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putEvidenceFile(id: string, file: File) {
  const database = await openEvidenceDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("files", "readwrite");
    transaction.objectStore("files").put(file, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function getEvidenceFile(id: string): Promise<File | undefined> {
  const database = await openEvidenceDb();
  const file = await new Promise<File | undefined>((resolve, reject) => {
    const request = database.transaction("files", "readonly").objectStore("files").get(id);
    request.onsuccess = () => resolve(request.result as File | undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return file;
}

async function deleteEvidenceFile(id: string) {
  const database = await openEvidenceDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("files", "readwrite");
    transaction.objectStore("files").delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

function readinessScore(requirements: readonly ReadinessRequirementView[], responses: Readonly<Record<string, ReadinessStatus>>) {
  const included = requirements.filter((item) => statusCredit[responses[item.id] ?? "not_started"] !== null);
  const totalWeight = included.reduce((total, item) => total + item.weight, 0);
  const earned = included.reduce((total, item) => total + item.weight * (statusCredit[responses[item.id] ?? "not_started"] ?? 0), 0);
  const overall = totalWeight ? Math.round((earned / totalWeight) * 100) : 0;
  const sectionScores = Object.fromEntries(sections.map((section) => {
    const rows = included.filter((item) => item.section === section.id);
    const weight = rows.reduce((total, item) => total + item.weight, 0);
    const sectionEarned = rows.reduce((total, item) => total + item.weight * (statusCredit[responses[item.id] ?? "not_started"] ?? 0), 0);
    return [section.id, weight ? Math.round((sectionEarned / weight) * 100) : 100];
  })) as Record<ReadinessSectionId, number>;
  const blockers = requirements.filter((item) => item.priority === "blocker" && !["verified", "not_applicable"].includes(responses[item.id] ?? "not_started"));
  return { overall, sectionScores, blockers };
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusPill({ value }: { value: ReadinessStatus }) {
  const label = statusOptions.find((item) => item.value === value)?.label ?? value;
  return <span className={`readiness-status readiness-status--${value}`}>{value === "verified" && <Check size={12} />}{value === "blocked" && <AlertTriangle size={12} />}{label}</span>;
}

function AccessBanner({ access, tierName, verification }: { access: ReadinessAccess; tierName: string; verification: BusinessVerificationStatus }) {
  if (access === "full") {
    return <section className="readiness-access readiness-access--full"><span><ShieldCheck size={19} /></span><div><strong>Full resolution layer active</strong><p>{verification === "verified" ? "Verified-business access" : `${tierName} access`} includes evidence checklists, blocker playbooks and transparent specialist-support requests. Provider introductions remain unavailable until referral governance is activated.</p></div><Link href="/verify-business">Trust & access <ArrowRight size={14} /></Link></section>;
  }
  if (access === "public") {
    return <section className="readiness-access"><span><Sparkles size={19} /></span><div><strong>You are exploring a public readiness sample</strong><p>Review one representative checkpoint in each of eight readiness areas. Create a free account to open the complete conditional assessment and save it to your business.</p></div><div><Link href="/sign-up">Create free account</Link><Link href="/sign-in">Sign in</Link></div></section>;
  }
  return <section className="readiness-access"><span><Sparkles size={19} /></span><div><strong>Your Basic assessment is active</strong><p>Complete every checkpoint and save your score. Verify the business or subscribe to reveal resolution steps, evidence criteria and verified provider matching.</p></div><div><Link href="/verify-business">Verify business</Link><Link href="/plans">See plans</Link></div></section>;
}

function ProviderDrawer({
  access,
  item,
  providerCatalog,
  assessmentId,
  onClose
}: {
  access: ReadinessAccess;
  item: ReadinessRequirementView;
  providerCatalog: ProviderCatalog;
  assessmentId?: string | undefined;
  onClose: () => void;
}) {
  const categories = item.fullResolution?.providerCategories ?? [];
  const [selected, setSelected] = useState<ReadinessProviderCategory | "">(categories[0] ?? "");
  const [consent, setConsent] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function requestMatch() {
    if (!assessmentId) {
      setMessage("Save this lane assessment before requesting specialist support.");
      return;
    }
    if (!selected || !consent) {
      setMessage("Choose a specialist type and accept the referral disclosure.");
      return;
    }
    startTransition(async () => {
      const result = await requestReadinessProviderMatch(JSON.stringify({
        requestId: crypto.randomUUID(),
        assessmentId,
        requirementId: item.id,
        providerCategory: selected,
        consentToReferralDisclosure: true
      }));
      setMessage(result.message);
    });
  }

  return <aside className="readiness-provider" aria-label={`Get help with ${item.title}`}>
    <header><div><span><Handshake size={17} /></span><p>SPECIALIST SUPPORT PATH</p><h2>Request help for this blocker</h2></div><button type="button" onClick={onClose} aria-label="Close provider support"><X size={18} /></button></header>
    {access !== "full" ? <div className="readiness-provider__locked"><LockKeyhole size={24} /><h3>{access === "public" ? "Create an account before requesting help" : "Provider matching unlocks with trust"}</h3><p>{access === "public" ? "A free account opens the complete assessment. Business verification or a paid plan then reveals qualified professional categories and match requests." : "Verify this business or activate a paid plan to see the relevant professional categories and request a qualified match."}</p><div>{access === "public" ? <><Link href="/sign-up">Create free account <ArrowRight size={14} /></Link><Link href="/sign-in">Sign in</Link></> : <><Link href="/verify-business">Verify business <ArrowRight size={14} /></Link><Link href="/plans">Compare plans</Link></>}</div></div> : <>
      <div className="readiness-provider__context"><small>BLOCKER</small><strong>{item.title}</strong><p>{item.memberSummary}</p></div>
      <div className="readiness-provider__list">
        <p>CHOOSE THE HELP YOU NEED</p>
        {categories.map((category) => {
          const provider = providerCatalog[category];
          return <label className={selected === category ? "active" : ""} key={category}><input type="radio" name="provider" checked={selected === category} onChange={() => setSelected(category)} /><span><strong>{provider?.label ?? category}</strong><small>{provider?.description ?? "Qualified support for this readiness requirement."}</small></span><CheckCircle2 size={16} /></label>;
        })}
      </div>
      <label className="readiness-provider__consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span><strong>Share this requirement with Export HQ operations</strong><small>This records a support request. Until referral governance is activated, no provider match, introduction, availability or outcome is promised.</small></span></label>
      {message && <p className="readiness-action-message" role="status">{message}</p>}
      <button className="readiness-provider__request" type="button" onClick={requestMatch} disabled={pending}>{pending ? <LoaderCircle className="spin" size={15} /> : <Handshake size={15} />} Request specialist support <ArrowRight size={14} /></button>
    </>}
  </aside>;
}

export default function ReadinessClient({
  access,
  businessName,
  initialProgress,
  laneOptions,
  persistenceMode,
  profile,
  providerCatalog,
  requirements,
  tierName,
  verification,
  selectedLaneId
}: {
  access: ReadinessAccess;
  businessName: string;
  initialProgress?: ReadinessInitialProgress | undefined;
  laneOptions: readonly {
    id: string;
    label: string;
    productName: string;
    productCategory: string;
    hsCode: string;
    destinationCountryCode: string;
    salesChannel: string;
  }[];
  persistenceMode: "preview" | "tenant";
  profile: ReadinessProfile;
  providerCatalog: ProviderCatalog;
  requirements: readonly ReadinessRequirementView[];
  tierName: string;
  verification: BusinessVerificationStatus;
  selectedLaneId?: string | undefined;
}) {
  const storageKey = `exportpanel.readiness.v1.${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const [currentSection, setCurrentSection] = useState<ReadinessSectionId>(initialProgress?.currentSection ?? "business");
  const [responses, setResponses] = useState<Record<string, ReadinessStatus>>(initialProgress?.responses ?? {});
  const [notes, setNotes] = useState<Record<string, string>>(initialProgress?.notes ?? {});
  const [evidence, setEvidence] = useState<EvidenceItem[]>([...(initialProgress?.evidence ?? [])]);
  const [assessmentId, setAssessmentId] = useState(initialProgress?.assessmentId);
  const [assessmentVersion, setAssessmentVersion] = useState(initialProgress?.assessmentVersion);
  const [selectedId, setSelectedId] = useState("");
  const [providerItem, setProviderItem] = useState<ReadinessRequirementView | null>(null);
  const [loaded, setLoaded] = useState(persistenceMode === "tenant");
  const [saveMessage, setSaveMessage] = useState("");
  const [savedAt, setSavedAt] = useState<string | undefined>();
  const [isSaving, startSaving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const selected = selectedId ? requirements.find((item) => item.id === selectedId) : undefined;
  const score = useMemo(() => readinessScore(requirements, responses), [requirements, responses]);
  const visible = requirements.filter((item) => item.section === currentSection);
  const completedCount = requirements.filter((item) => ["verified", "not_applicable"].includes(responses[item.id] ?? "not_started")).length;
  const reviewCount = evidence.filter((item) => item.status === "under_review" || item.status === "staged").length;
  const isPublic = access === "public";
  const learningHref = (topic: string) => `/learn?topic=${topic}${isPublic ? "&access=public" : ""}`;
  const autosaveKey = useMemo(() => JSON.stringify({ currentSection, responses, notes, evidence }), [currentSection, evidence, notes, responses]);

  useEffect(() => {
    if (persistenceMode !== "preview") {
      setLoaded(true);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const draft = JSON.parse(raw) as ReadinessProgressInput;
        if (draft.version === 1) {
          setCurrentSection(draft.currentSection);
          setResponses((current) => Object.keys(current).length ? current : draft.responses);
          setNotes((current) => Object.keys(current).length ? current : draft.notes);
          setEvidence((current) => current.length ? current : draft.evidence);
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    } finally {
      setLoaded(true);
    }
  }, [persistenceMode, storageKey]);

  useEffect(() => {
    if (!loaded || persistenceMode !== "preview") return;
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, currentSection, profile, responses, notes, evidence }));
  }, [currentSection, evidence, loaded, notes, persistenceMode, profile, responses, storageKey]);

  useEffect(() => {
    if (!selected || selected.section === currentSection) return;
    setSelectedId(requirements.find((item) => item.section === currentSection)?.id ?? "");
  }, [currentSection, requirements, selected]);

  function updateStatus(requirementId: string, value: ReadinessStatus) {
    setResponses((current) => ({ ...current, [requirementId]: value }));
  }

  async function persistAssessment(automatic = false): Promise<boolean> {
    const result = await saveReadinessProgress(JSON.stringify({
      version: 1,
      ...(assessmentId ? { assessmentId } : {}),
      ...(assessmentVersion ? { assessmentVersion } : {}),
      ...(selectedLaneId ? { exportLaneId: selectedLaneId } : {}),
      currentSection,
      profile,
      responses,
      notes,
      evidence
    }));
    setSaveMessage(automatic && result.ok ? "Changes autosaved to the protected workspace." : result.message);
    setSavedAt(result.savedAt);
    if (result.assessmentId) setAssessmentId(result.assessmentId);
    if (result.assessmentVersion) setAssessmentVersion(result.assessmentVersion);
    return result.ok;
  }

  useSafeAutosave({
    enabled: loaded && persistenceMode === "tenant" && Boolean(selectedLaneId),
    changeKey: autosaveKey,
    save: () => persistAssessment(true)
  });

  function saveAssessment() {
    startSaving(async () => {
      await persistAssessment(false);
    });
  }

  async function addEvidence(file: File) {
    if (!selected || access !== "full") return;
    if (persistenceMode !== "preview") {
      setSaveMessage("Private evidence upload is not activated yet. The file was not stored in this browser or sent to Export HQ.");
      return;
    }
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setSaveMessage("Use a PDF, JPEG or PNG file.");
      return;
    }
    const prepared = await prepareLowDataEvidenceFile(file, document.documentElement.classList.contains("low-data"));
    const uploadFile = prepared.file;
    if (uploadFile.size > 25 * 1024 * 1024) {
      setSaveMessage("Evidence files must be 25 MB or smaller.");
      return;
    }
    const id = `ev_${crypto.randomUUID()}`;
    try {
      await putEvidenceFile(id, uploadFile);
      const item: EvidenceItem = {
        id,
        requirementId: selected.id,
        fileName: uploadFile.name,
        mimeType: uploadFile.type as EvidenceItem["mimeType"],
        byteSize: uploadFile.size,
        status: "under_review",
        feedback: "Format and file integrity check passed. Issuer, entity-name match, scope, dates and validity still require review.",
        addedAt: new Date().toISOString()
      };
      setEvidence((current) => [...current, item]);
      updateStatus(selected.id, "evidence_added");
      setSaveMessage(prepared.savedBytes > 0
        ? `Low-data preparation saved ${Math.max(1, Math.round(prepared.savedBytes / 1024))} KB. Evidence is staged locally; save the assessment to sync its review record.`
        : "Evidence staged and queued for review. Save the assessment to sync its review record.");
    } catch {
      setSaveMessage("This browser could not stage the file. Check storage permissions and try again.");
    }
  }

  async function openEvidence(item: EvidenceItem) {
    if (persistenceMode !== "preview") {
      setSaveMessage("Authorized evidence download will become available only through the private vault.");
      return;
    }
    const file = await getEvidenceFile(item.id);
    if (!file) {
      setSaveMessage("The file is not stored on this device. Its review record remains in the workspace.");
      return;
    }
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function removeEvidence(item: EvidenceItem) {
    if (persistenceMode !== "preview") {
      setSaveMessage("Workspace evidence can be changed only through the versioned private-vault workflow.");
      return;
    }
    await deleteEvidenceFile(item.id).catch(() => undefined);
    setEvidence((current) => current.filter((candidate) => candidate.id !== item.id));
  }

  function chooseSection(section: ReadinessSectionId) {
    setCurrentSection(section);
    setSelectedId("");
  }

  return <div className="readiness-page">
    <section className="readiness-hero">
      <div><p>MANAGE / EXPORT READINESS</p><div className="readiness-title"><h1>Your route from blocker to export-ready.</h1><HintButton topic="readiness-command-center" /></div><span>ExportPanel checks Bangladesh business foundations, your exact product, the destination market and the shipment path—then connects every gap to knowledge or qualified help.</span></div>
      <div className="readiness-hero__score"><CircleGauge size={28} /><span><small>CURRENT READINESS</small><strong>{score.overall}%</strong><em>{score.blockers.length} blockers open</em></span></div>
    </section>

    <AccessBanner access={access} tierName={tierName} verification={verification} />

    <section className="readiness-context">
      <header><div><p>ASSESSMENT CONTEXT</p><h2>{businessName}</h2><span>Bangladesh origin · change the product, operating model or destination to rebuild the applicable path.</span></div><div><span><RefreshCw size={13} /> Conditional rules update with this context</span></div></header>
      <form method="get" action={exportPanelPath("/readiness")}>
        {access === "public" && <input type="hidden" name="access" value="public" />}
        {access === "member" && <input type="hidden" name="access" value="basic" />}
        {access === "member" && <input type="hidden" name="business" value={businessName} />}
        {persistenceMode === "tenant" && <label><span>Export Lane</span><select name="lane" defaultValue={selectedLaneId ?? ""} disabled={!laneOptions.length}><option value="">{laneOptions.length ? "Select a lane" : "Create an Export Lane first"}</option>{laneOptions.map((lane) => <option value={lane.id} key={lane.id}>{lane.label}</option>)}</select></label>}
        <label><span>Business model</span><select name="businessModel" defaultValue={profile.businessModel}><option value="manufacturer">Manufacturer</option><option value="trader">Trader / merchant exporter</option><option value="service">Service exporter</option></select></label>
        <label><span>Product category</span><select name="productCategory" defaultValue={profile.productCategory}><option value="apparel">Apparel & textiles</option><option value="leather">Leather & footwear</option><option value="jute">Jute products</option><option value="food">Food & agro</option><option value="engineering">Engineering goods</option><option value="software">Software / services</option><option value="other">Other</option></select></label>
        <label><span>Product / service</span><input name="productName" defaultValue={profile.productName} maxLength={180} /></label>
        <label><span>HS code · optional</span><input name="hsCode" defaultValue={profile.hsCode} maxLength={16} placeholder="Add after classification" /></label>
        <label><span>Target market</span><select name="market" defaultValue={profile.targetMarketCode}>{targetMarkets.map((market) => <option value={market.code} key={market.code}>{market.label}</option>)}</select></label>
        <label><span>Sales route</span><select name="salesChannel" defaultValue={profile.salesChannel}><option value="wholesale">Wholesale / distributor</option><option value="retail">Direct retail</option><option value="marketplace">Marketplace</option><option value="services">Direct services</option></select></label>
        <button type="submit">Rebuild my path <RefreshCw size={14} /></button>
      </form>
    </section>

    <section className="readiness-metrics" aria-label="Assessment summary">
      <article><span><CircleGauge size={19} /></span><div><small>WEIGHTED SCORE</small><strong>{score.overall}%</strong><p>Direction, not a legal certification</p></div></article>
      <article><span><AlertTriangle size={19} /></span><div><small>EXPORT BLOCKERS</small><strong>{score.blockers.length}</strong><p>Must be verified or ruled out</p></div></article>
      <article><span><CheckCircle2 size={19} /></span><div><small>CHECKPOINTS CLOSED</small><strong>{completedCount}/{requirements.length}</strong><p>Across the applicable route</p></div></article>
      <article><span><FileCheck2 size={19} /></span><div><small>EVIDENCE IN REVIEW</small><strong>{reviewCount}</strong><p>PDF, JPEG and PNG accepted</p></div></article>
    </section>

    <div className={`readiness-workspace${selected ? " has-detail" : ""}`}>
      <aside className="readiness-sections">
        <header><p>YOUR READINESS MAP</p><strong>{requirements.length} applicable checkpoints</strong></header>
        {sections.map((section) => {
          const count = requirements.filter((item) => item.section === section.id).length;
          const blockers = requirements.filter((item) => item.section === section.id && item.priority === "blocker" && !["verified", "not_applicable"].includes(responses[item.id] ?? "not_started")).length;
          return <button type="button" className={currentSection === section.id ? "active" : ""} onClick={() => chooseSection(section.id)} key={section.id} disabled={!count}><span className="readiness-section__score">{score.sectionScores[section.id]}</span><span><strong>{section.label}</strong><small>{section.description}</small><i><b style={{ width: `${score.sectionScores[section.id]}%` }} /></i></span><em>{blockers ? `${blockers} blockers` : count ? `${count} checks` : "Not applicable"}</em><ChevronRight size={15} /></button>;
        })}
        <div className="readiness-sections__legend"><Info size={14} /><span>Rules are selected for Bangladesh, your business model, product family and destination. Confirm legal conclusions with the issuing authority or qualified adviser.</span></div>
      </aside>

      <section className="readiness-checkpoints">
        <header><div><p>{sections.find((section) => section.id === currentSection)?.label.toUpperCase()}</p><h2>{sections.find((section) => section.id === currentSection)?.description}</h2></div><span>{visible.length} applicable</span></header>
        <div className="readiness-checkpoint-list">
          {visible.map((item) => {
            const status = responses[item.id] ?? "not_started";
            const files = evidence.filter((candidate) => candidate.requirementId === item.id).length;
            return <article className={`${selected?.id === item.id ? "active" : ""} ${item.priority === "blocker" ? "is-blocker" : ""}`} key={item.id}>
              <button type="button" className="readiness-checkpoint__main" onClick={() => setSelectedId(item.id)}>
                <span className={`readiness-priority readiness-priority--${item.priority}`}>{item.priority === "blocker" ? <AlertTriangle size={15} /> : item.priority === "important" ? <ShieldCheck size={15} /> : <Sparkles size={15} />}</span>
                <span><small>{item.priority} · {item.section}</small><strong>{item.title}</strong><p>{item.memberSummary}</p><span className="readiness-checkpoint__meta"><StatusPill value={status} />{files > 0 && <em><Paperclip size={12} /> {files}</em>}</span></span>
                <ChevronRight size={16} />
              </button>
              <div className="readiness-checkpoint__aids" aria-label={`Help options for ${item.title}`}><Link className="readiness-aid" href={learningHref(item.learnTopic)} title="Open the knowledge path" aria-label={`Learn how to resolve ${item.title}`}><BookOpenCheck size={15} /></Link><button className="readiness-aid" type="button" onClick={() => setProviderItem(item)} title="Find qualified professional help" aria-label={`Find qualified help for ${item.title}`}><Handshake size={15} />{access !== "full" && <LockKeyhole size={8} />}</button></div>
            </article>;
          })}
          {!visible.length && <div className="readiness-empty"><CheckCircle2 size={23} /><strong>No checkpoints apply in this section.</strong><p>ExportPanel removed them based on the current business and product context.</p></div>}
        </div>
      </section>

      {selected && <aside className="readiness-detail" aria-label={`${selected.title} details`}>
        <header><div><small>{selected.priority} checkpoint</small><h2>{selected.title}</h2></div><button type="button" aria-label="Close details" onClick={() => setSelectedId("")}><X size={17} /></button></header>
        <div className="readiness-detail__body">
          <section className="readiness-detail__check"><p>WHAT ExportPanel IS CHECKING</p><strong>{selected.checkpoint}</strong><label><span>Your position</span><select value={responses[selected.id] ?? "not_started"} onChange={(event) => updateStatus(selected.id, event.target.value as ReadinessStatus)}>{statusOptions.map((option) => <option value={option.value} key={option.value} disabled={persistenceMode === "tenant" && option.reviewControlled}>{option.label}{persistenceMode === "tenant" && option.reviewControlled ? " · review controlled" : ""}</option>)}</select></label></section>
          <div className="readiness-detail__paths"><Link href={learningHref(selected.learnTopic)}><BookOpenCheck size={16} /><span><small>KNOWLEDGE PATH</small><strong>Understand and solve it yourself</strong></span><ArrowRight size={14} /></Link><button type="button" onClick={() => setProviderItem(selected)}><Handshake size={16} /><span><small>HELP PATH</small><strong>Find a qualified specialist</strong></span>{access !== "full" ? <LockKeyhole size={13} /> : <ArrowRight size={14} />}</button></div>
          {selected.fullResolution ? <>
            <section className="readiness-playbook"><p>RESOLUTION PLAYBOOK</p><ol>{selected.fullResolution.resolution.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol></section>
            <section className="readiness-evidence"><div><p>EVIDENCE ExportPanel EXPECTS</p><HintButton topic="readiness-product-file" /></div><ul>{selected.fullResolution.evidence.map((item) => <li key={item}><FileText size={14} />{item}</li>)}</ul><input ref={fileInput} hidden type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addEvidence(file); event.target.value = ""; }} /><button type="button" onClick={() => fileInput.current?.click()} disabled={persistenceMode === "tenant"}><Upload size={14} /> {persistenceMode === "tenant" ? "Private vault not activated" : "Add PDF or image"} <small>max 25 MB</small></button><span className="readiness-evidence__privacy"><ShieldCheck size={12} /> {persistenceMode === "tenant" ? "Files are not staged in browser storage. Upload stays disabled until quarantine, scanning and authorized download are activated." : "Synthetic preview file stays on this device and is never treated as reviewed evidence."}</span></section>
            {evidence.filter((item) => item.requirementId === selected.id).map((item) => <article className="readiness-file" key={item.id}><span><FileCheck2 size={17} /></span><div><strong>{item.fileName}</strong><small>{formatBytes(item.byteSize)} · {item.status.replaceAll("_", " ")}</small><p>{item.feedback}</p><div><button type="button" onClick={() => void openEvidence(item)}>Open</button><button type="button" onClick={() => void removeEvidence(item)}>Remove</button></div></div></article>)}
          </> : <section className="readiness-locked"><LockKeyhole size={22} /><p>{isPublic ? "ACCOUNT + TRUST LAYERS" : "FULL RESOLUTION LAYER"}</p><h3>Open the exact steps, evidence and expert route</h3><ul><li><Check size={13} /> Requirement-specific resolution plan</li><li><Check size={13} /> Document checklist and evidence review</li><li><Check size={13} /> Qualified lawyer, bank, lab or agency matching</li></ul><div>{isPublic ? <><Link href="/sign-up">Create free account <ArrowRight size={14} /></Link><Link href="/sign-in">Sign in</Link></> : <><Link href="/verify-business">Verify business <ArrowRight size={14} /></Link><Link href="/plans">Upgrade</Link></>}</div></section>}
          {isPublic ? <section className="readiness-notes"><p>PRIVATE WORKING NOTE</p><div className="readiness-note-lock"><LockKeyhole size={16} /><span><strong>Create an account to keep private notes</strong><small>Notes belong to your business workspace and are never included in the public sample.</small></span></div></section> : <section className="readiness-notes"><p>PRIVATE WORKING NOTE</p><textarea value={notes[selected.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [selected.id]: event.target.value.slice(0, 1000) }))} placeholder="Record the owner, gap, response from an authority, or next follow-up…" /></section>}
          <section className="readiness-sources"><p>AUTHORITY SOURCES</p>{selected.sources.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.url}><span><strong>{item.label}</strong><small>{item.publisher} · reviewed {item.reviewedAt}</small></span><ExternalLink size={13} /></a>)}</section>
        </div>
      </aside>}
    </div>

    {isPublic ? <footer className="readiness-savebar readiness-savebar--public"><div><span className={loaded ? "is-ready" : ""}><span />{loaded ? "Sample progress saved on this device" : "Loading sample…"}</span><small>Create an account for the full checklist and secure workspace saving.</small></div><Link href="/sign-up"><Save size={15} /> Create account to continue</Link></footer> : <footer className="readiness-savebar"><div><span className={loaded ? "is-ready" : ""}><span />{persistenceMode === "tenant" ? "Protected workspace persistence" : loaded ? "Synthetic preview draft on this device" : "Loading preview draft…"}</span>{savedAt && <small><Clock3 size={12} /> Workspace saved {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(savedAt))}</small>}{saveMessage && <small role="status">{saveMessage}</small>}</div><button type="button" onClick={saveAssessment} disabled={isSaving || (persistenceMode === "tenant" && !selectedLaneId)}>{isSaving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />} Save & continue later</button></footer>}

    {providerItem && <><button className="readiness-provider-backdrop" type="button" aria-label="Close provider support" onClick={() => setProviderItem(null)} /><ProviderDrawer access={access} assessmentId={assessmentId} item={providerItem} providerCatalog={providerCatalog} onClose={() => setProviderItem(null)} /></>}
    <footer className="readiness-method"><span>Bangladesh Export Readiness v1.0 · rules reviewed 25 Aug 2026</span><span>Decision support; official authority and qualified professional advice remain controlling.</span></footer>
  </div>;
}
