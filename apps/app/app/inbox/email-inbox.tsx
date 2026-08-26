"use client";

import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  AtSign,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Flag,
  Inbox,
  LockKeyhole,
  Mail,
  MailCheck,
  Paperclip,
  PenLine,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldCheck,
  Ship,
  Sparkles,
  Tag,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { emailProviderCatalog, type EmailProviderId } from "@exporthq/domain";
import { HintButton } from "../_components/hint-button";
import {
  emailDraftStorageKey,
  emailThreadSeeds,
  type EmailCategory,
  type EmailThreadPreview
} from "../_components/email-data";
import { loadCollection, storeCollection } from "../_components/collaboration-data";

type DraftRecord = { threadId: string; body: string; savedAt: string };

const categoryItems: ReadonlyArray<{
  id: EmailCategory;
  label: string;
  icon: typeof Inbox;
}> = [
  { id: "all", label: "All mail", icon: Inbox },
  { id: "unread", label: "Unread", icon: Mail },
  { id: "flagged", label: "Flagged", icon: Flag },
  { id: "buyers", label: "Buyers", icon: AtSign },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "logistics", label: "Shipping & customs", icon: Ship },
  { id: "finance", label: "Finance & payment", icon: CircleDollarSign }
];

function formatMailTime(value: string): string {
  const date = new Date(value);
  const now = new Date("2026-08-26T12:00:00.000Z");
  if (date.toLocaleDateString("en-CA") === now.toLocaleDateString("en-CA")) {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(date);
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/Berlin" }).format(date);
}

function providerTone(provider: EmailProviderId): string {
  if (provider === "google") return "google";
  if (provider === "microsoft") return "microsoft";
  if (provider === "yahoo_aol") return "yahoo";
  if (provider === "icloud") return "icloud";
  if (provider === "zoho") return "zoho";
  return "custom";
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function ProviderSetup({ accountLimit, canManageAccount, onClose }: { accountLimit: number; canManageAccount: boolean; onClose: () => void }) {
  const [providerId, setProviderId] = useState<EmailProviderId>("google");
  const provider = emailProviderCatalog.find((item) => item.id === providerId)!;

  return <div className="mail-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="mail-modal" role="dialog" aria-modal="true" aria-labelledby="mail-connect-title">
      <header><span><small>Secure mailbox setup</small><h2 id="mail-connect-title">Connect work email</h2></span><button type="button" aria-label="Close mailbox setup" onClick={onClose}><X size={18} /></button></header>
      <div className="mail-provider-grid">{emailProviderCatalog.map((item) => <button type="button" key={item.id} className={item.id === providerId ? "active" : ""} onClick={() => setProviderId(item.id)}><i className={`mail-provider-mark mail-provider-mark--${providerTone(item.id)}`}>{item.shortName}</i><span><strong>{item.name}</strong><small>{item.auth === "oauth2" ? "OAuth 2.0" : item.auth === "app_password" ? "Secure app password" : "OAuth or app password"}</small></span>{item.id === providerId && <Check size={15} />}</button>)}</div>
      <article className="mail-provider-detail"><header><i className={`mail-provider-mark mail-provider-mark--${providerTone(provider.id)}`}>{provider.shortName}</i><span><h3>{provider.name}</h3><p>{provider.description}</p></span></header><dl><div><dt>Read</dt><dd>{provider.inboundEndpoint}</dd></div><div><dt>Send</dt><dd>{provider.outboundEndpoint}</dd></div><div><dt>New mail</dt><dd>{provider.changeDelivery === "pubsub" ? "Google Pub/Sub" : provider.changeDelivery === "webhook" ? "Microsoft webhook" : "IMAP IDLE + scheduled catch-up"}</dd></div></dl><div className="mail-provider-note"><ShieldCheck size={16} /><p>{provider.setupNote}</p></div></article>
      <section className="mail-activation-state"><LockKeyhole size={17} /><span><strong>{accountLimit === 0 ? "Mailbox connection is a Launch feature" : !canManageAccount ? "Owner or administrator access required" : "Production adapter activation required"}</strong><p>{accountLimit === 0 ? "Your current access includes the safe mailbox preview. Launch connects one account; Scale connects up to five shared or personal mailboxes." : !canManageAccount ? "You can read or draft according to your role, but only an owner or administrator can connect, reauthorize, or disconnect a company mailbox." : "The interface and tenant contracts are ready. Live authorization stays disabled until the encrypted credential vault, provider application, sync worker, and webhook monitoring are activated."}</p></span></section>
      <footer><Link href="/learn?topic=email-provider-setup">Read the secure setup guide <ArrowRight size={13} /></Link>{accountLimit === 0 ? <Link className="button button--primary" href="/plans?feature=inbox">Compare plans <ArrowRight size={14} /></Link> : <button type="button" className="button button--primary" disabled><LockKeyhole size={14} /> Awaiting production activation</button>}</footer>
    </section>
  </div>;
}

export function EmailInbox({
  canManage,
  canSend,
  canManageAccount,
  accountLimit,
  onCreateAction
}: {
  canManage: boolean;
  canSend: boolean;
  canManageAccount: boolean;
  accountLimit: number;
  onCreateAction: (thread: EmailThreadPreview) => void;
}) {
  const [threads, setThreads] = useState<EmailThreadPreview[]>([...emailThreadSeeds]);
  const [category, setCategory] = useState<EmailCategory>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(emailThreadSeeds[0]?.id ?? "");
  const [connectOpen, setConnectOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftBody, setDraftBody] = useState("");
  const [notice, setNotice] = useState("");

  const visibleThreads = useMemo(() => threads.filter((thread) => {
    const matchesCategory = category === "all"
      || (category === "unread" && thread.unread)
      || (category === "flagged" && thread.flagged)
      || thread.category === category;
    const haystack = `${thread.senderName} ${thread.senderEmail} ${thread.subject} ${thread.snippet} ${thread.relatedEntity}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [threads, category, query]);
  const selected = threads.find((thread) => thread.id === selectedId) ?? visibleThreads[0];
  const unreadCount = threads.filter((thread) => thread.unread).length;

  function updateThread(id: string, patch: Partial<EmailThreadPreview>) {
    setThreads((current) => current.map((thread) => thread.id === id ? { ...thread, ...patch } : thread));
  }

  function openThread(thread: EmailThreadPreview) {
    setSelectedId(thread.id);
    if (thread.unread) updateThread(thread.id, { unread: false });
    setDraftOpen(false);
    setDraftBody("");
  }

  function saveDraft() {
    if (!selected || !draftBody.trim()) return;
    const drafts = loadCollection<DraftRecord>(emailDraftStorageKey, []);
    const record: DraftRecord = { threadId: selected.id, body: draftBody.trim(), savedAt: new Date().toISOString() };
    storeCollection(emailDraftStorageKey, [record, ...drafts.filter((draft) => draft.threadId !== selected.id)]);
    setDraftOpen(false);
    setNotice("Private draft saved locally. It has not been sent.");
  }

  return <>
    <section className="mail-preview-banner"><span><Sparkles size={16} /><strong>Illustrative mailbox preview <HintButton topic="email-security-boundary" /></strong><small>No provider is connected and no private email is being read.</small></span><Link href="/learn?topic=email-inbox-overview">How Email becomes export work <ArrowRight size={13} /></Link></section>
    <section className="mail-command"><div className="mail-account-control"><i className="mail-provider-mark mail-provider-mark--custom">@</i><span><small>Workspace mailbox</small><strong>No live account connected</strong></span><ChevronDown size={14} /></div><div><button type="button" onClick={() => setNotice("Preview refreshed. Live sync starts only after a secure provider connection.")}><RefreshCw size={14} /> Refresh</button><button type="button" onClick={() => setConnectOpen(true)} className="button button--primary"><Plus size={15} /> Connect mailbox</button></div></section>
    <div className="mail-layout">
      <nav className="mail-folders" aria-label="Email categories"><button type="button" className="mail-compose" onClick={() => { if (!selected) return; setDraftOpen(true); }} disabled={!selected}><PenLine size={15} /> Draft email</button><p>MAIL</p>{categoryItems.map((item) => { const Icon = item.icon; const count = item.id === "unread" ? unreadCount : item.id === "flagged" ? threads.filter((thread) => thread.flagged).length : item.id === "all" ? threads.length : threads.filter((thread) => thread.category === item.id).length; return <button type="button" key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}><Icon size={15} /><span>{item.label}</span><small>{count}</small></button>; })}<p>EXPORTPANEL</p><Link href="/inbox?tab=actionable"><MailCheck size={15} /><span>Actionable Inbox</span><small>{5}</small></Link></nav>

      <section className="mail-thread-pane"><header><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sender, subject, lane…" aria-label="Search email" /></label><span>{visibleThreads.length} conversations</span></header><div className="mail-thread-list" aria-live="polite">{visibleThreads.map((thread) => <button type="button" key={thread.id} className={`${thread.id === selected?.id ? "active " : ""}${thread.unread ? "unread" : ""}`} onClick={() => openThread(thread)}><i className={`mail-avatar mail-avatar--${providerTone(thread.provider)}`}>{initials(thread.senderName)}</i><span><small><strong>{thread.senderName}</strong><time>{formatMailTime(thread.latestMessageAt)}</time></small><b>{thread.subject}</b><p>{thread.snippet}</p><footer><em><Tag size={11} />{thread.relatedEntity}</em>{thread.attachmentNames.length > 0 && <i><Paperclip size={11} />{thread.attachmentNames.length}</i>}</footer></span><Flag size={13} fill={thread.flagged ? "currentColor" : "none"} /></button>)}{visibleThreads.length === 0 && <div className="mail-empty"><MailCheck size={28} /><strong>No conversations match this view.</strong><p>Try another category or clear the search.</p></div>}</div></section>

      {selected ? <article className="mail-reader"><header><button type="button" className="mail-reader-back" onClick={() => setSelectedId("")}><ArrowLeft size={15} /> Back</button><span><small>{selected.category} · {formatMailTime(selected.latestMessageAt)}</small><h2>{selected.subject}</h2></span><div><button type="button" aria-label={selected.flagged ? "Remove flag" : "Flag email"} onClick={() => updateThread(selected.id, { flagged: !selected.flagged })}><Flag size={15} fill={selected.flagged ? "currentColor" : "none"} /></button><button type="button" aria-label="Archive preview email" onClick={() => setNotice("Archive is disabled in the preview because no provider mailbox is connected.")}><Archive size={15} /></button></div></header><section className="mail-reader-context"><Sparkles size={16} /><span><strong>ExportPanel sees the next move</strong><p>{selected.suggestedAction}</p></span><button type="button" onClick={() => onCreateAction(selected)} disabled={!canManage}>Create follow-up <ArrowRight size={13} /></button></section><Link className="mail-related-link" href={selected.relatedHref}><BadgeCheck size={15} /><span><small>Related export context</small><strong>{selected.relatedEntity}</strong></span><ArrowRight size={14} /></Link><div className="mail-message-stack">{selected.messages.map((message) => <article key={message.id}><header><i>{initials(message.senderName)}</i><span><strong>{message.senderName}</strong><small>{message.senderEmail} → {message.recipientLabel}</small></span><time>{formatMailTime(message.sentAt)}</time></header><p>{message.body}</p>{selected.attachmentNames.length > 0 && <div className="mail-attachments">{selected.attachmentNames.map((attachment) => <button type="button" key={attachment} onClick={() => setNotice("Attachment download stays disabled until private storage, scanning, and authorization are active.")}><FileText size={15} /><span><strong>{attachment}</strong><small>Illustrative attachment</small></span></button>)}</div>}</article>)}</div>{draftOpen ? <section className="mail-draft"><header><span><strong>Private draft</strong><small>To {selected.senderName} · not connected</small></span><button type="button" onClick={() => setDraftOpen(false)} aria-label="Close draft"><X size={15} /></button></header><textarea autoFocus value={draftBody} onChange={(event) => setDraftBody(event.target.value)} placeholder="Draft a clear reply…" /><footer><small><LockKeyhole size={12} /> {canSend ? "Sending activates after a secure mailbox connection." : "Your role can read this Inbox but cannot send email."}</small><button type="button" onClick={saveDraft} disabled={!draftBody.trim()}><Check size={14} /> Save draft</button><button type="button" disabled title="No live mailbox is connected"><Send size={14} /> Send</button></footer></section> : <footer className="mail-reader-actions"><button type="button" onClick={() => setDraftOpen(true)}><Reply size={15} /> Draft reply</button><button type="button" onClick={() => onCreateAction(selected)} disabled={!canManage}><MailCheck size={15} /> Make actionable</button></footer>}</article> : <div className="mail-reader mail-reader--empty"><Mail size={30} /><strong>Select a conversation</strong><p>Read the context, connect it to an Export Lane, and turn the commitment into owned work.</p></div>}
    </div>
    {notice && <div className="settings-toast inbox-toast" role="status"><Sparkles size={16} /><span>{notice}</span><button type="button" onClick={() => setNotice("")}>Dismiss</button></div>}
    {connectOpen && <ProviderSetup accountLimit={accountLimit} canManageAccount={canManageAccount} onClose={() => setConnectOpen(false)} />}
  </>;
}
