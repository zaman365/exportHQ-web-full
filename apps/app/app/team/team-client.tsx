"use client";

import Link from "next/link";
import {
  ArrowRight, Building2, CalendarClock, Check, ChevronRight, Crown, Gauge, Hash,
  LockKeyhole, Mail, MessageCircle, MessageSquareText, Plus, Search, Send, Settings,
  ShieldCheck, Sparkles, UserPlus, UserRoundCheck, UsersRound, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Progress } from "@exporthq/ui";
import { HintButton } from "../_components/hint-button";
import {
  businessTeamsStorageKey, businessTeamSeeds, loadCollection, storeCollection,
  teamAccessCatalog, teamConversationsStorageKey, teamConversationSeeds,
  teamMessagesStorageKey, teamMessageSeeds, teamProfiles, teamProfilesStorageKey,
  type BusinessTeam, type TeamAccessRole, type TeamAvailability, type TeamConversation,
  type TeamGroup, type TeamMessage, type TeamProfile
} from "../_components/collaboration-data";

export type TeamWorkspaceView = "messages" | "directory" | "teams";
type GroupFilter = TeamGroup | "All";

const groups: readonly GroupFilter[] = ["All", "Company", "Export HQ", "Partner"];
const roleOrder: readonly TeamAccessRole[] = ["owner", "executive", "department_lead", "manager", "member", "viewer", "external"];
const availabilityLabel: Record<TeamAvailability, string> = { available: "Available", focused: "Focused", away: "Away" };

function toneForGroup(group: TeamGroup): number {
  return group === "Export HQ" ? 1 : group === "Partner" ? 2 : 0;
}

function formatMessageTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin"
  }).format(new Date(value));
}

function RoleBadge({ role }: { role: TeamAccessRole }) {
  const definition = teamAccessCatalog[role];
  return <span className={`team-role-badge team-role-badge--${role}`} title={definition.summary}>{role === "owner" ? <Crown size={11} /> : <ShieldCheck size={11} />}{definition.label}</span>;
}

export default function TeamClient({ canManageAccess, canMessage, initialView = "messages" }: { canManageAccess: boolean; canMessage: boolean; initialView?: TeamWorkspaceView }) {
  const [view, setView] = useState<TeamWorkspaceView>(initialView);
  const [group, setGroup] = useState<GroupFilter>("All");
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<TeamProfile[]>([...teamProfiles]);
  const [teams, setTeams] = useState<BusinessTeam[]>([...businessTeamSeeds]);
  const [conversations, setConversations] = useState<TeamConversation[]>([...teamConversationSeeds]);
  const [messages, setMessages] = useState<TeamMessage[]>([...teamMessageSeeds]);
  const [selectedId, setSelectedId] = useState<string | null>(teamProfiles[0]?.id ?? null);
  const [selectedConversationId, setSelectedConversationId] = useState(teamConversationSeeds[0]?.id ?? "");
  const [messageDraft, setMessageDraft] = useState("");
  const [toast, setToast] = useState("");
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamPurpose, setNewTeamPurpose] = useState("");
  const [newTeamLead, setNewTeamLead] = useState("team-kamal");
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>(["team-nadia", "team-kamal"]);
  const [newConversationMember, setNewConversationMember] = useState("team-samira");

  useEffect(() => {
    setMembers(loadCollection(teamProfilesStorageKey, teamProfiles));
    setTeams(loadCollection(businessTeamsStorageKey, businessTeamSeeds));
    setConversations(loadCollection(teamConversationsStorageKey, teamConversationSeeds));
    setMessages(loadCollection(teamMessagesStorageKey, teamMessageSeeds));
  }, []);

  const filtered = useMemo(() => members.filter((person) => {
    const roleLabel = teamAccessCatalog[person.accessRole].label;
    const haystack = `${person.name} ${person.role} ${roleLabel} ${person.group} ${person.focus} ${person.skills.join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (group === "All" || person.group === group);
  }), [members, query, group]);
  const visibleConversations = useMemo(() => [...conversations]
    .filter((conversation) => `${conversation.title} ${conversation.relatedEntity ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()), [conversations, query]);
  const selected = members.find((person) => person.id === selectedId);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0];
  const selectedMessages = selectedConversation ? messages.filter((message) => message.conversationId === selectedConversation.id) : [];
  const selectedParticipants = selectedConversation ? members.filter((person) => selectedConversation.participantIds.includes(person.id)) : [];
  const averageLoad = Math.round(members.reduce((total, person) => total + person.capacity, 0) / Math.max(members.length, 1));
  const companyMembers = members.filter((person) => person.group === "Company");

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 4200);
  }

  function saveMembers(next: TeamProfile[]) { setMembers(next); storeCollection(teamProfilesStorageKey, next); }
  function saveTeams(next: BusinessTeam[]) { setTeams(next); storeCollection(businessTeamsStorageKey, next); }
  function saveConversations(next: TeamConversation[]) { setConversations(next); storeCollection(teamConversationsStorageKey, next); }
  function saveMessages(next: TeamMessage[]) { setMessages(next); storeCollection(teamMessagesStorageKey, next); }

  function openConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setView("messages");
    saveConversations(conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation));
  }

  function sendMessage() {
    if (!canMessage || !selectedConversation || !messageDraft.trim()) return;
    const now = new Date().toISOString();
    const message: TeamMessage = { id: `message-${Date.now()}`, conversationId: selectedConversation.id, senderId: "team-nadia", body: messageDraft.trim(), sentAt: now, delivery: "sent" };
    saveMessages([...messages, message]);
    saveConversations(conversations.map((conversation) => conversation.id === selectedConversation.id ? { ...conversation, lastActivity: now, unread: 0 } : conversation));
    setMessageDraft("");
    notify("Message sent to the selected team conversation.");
  }

  function createDirectConversation() {
    if (!canMessage) return;
    const person = members.find((member) => member.id === newConversationMember);
    if (!person) return;
    const existing = conversations.find((conversation) => conversation.kind === "direct" && conversation.participantIds.includes(person.id));
    if (existing) { openConversation(existing.id); setMessageModalOpen(false); return; }
    const now = new Date().toISOString();
    const conversation: TeamConversation = { id: `conversation-${Date.now()}`, title: person.name, kind: "direct", participantIds: ["team-nadia", person.id], unread: 0, lastActivity: now };
    saveConversations([conversation, ...conversations]);
    setSelectedConversationId(conversation.id);
    setMessageModalOpen(false);
    setView("messages");
    notify(`Private conversation with ${person.name} created.`);
  }

  function createTeam() {
    if (!canManageAccess || !newTeamName.trim() || !newTeamPurpose.trim()) return;
    const now = new Date().toISOString();
    const teamId = `team-${Date.now()}`;
    const channelId = `conversation-${Date.now()}`;
    const memberIds = [...new Set(["team-nadia", newTeamLead, ...newTeamMembers])];
    const team: BusinessTeam = { id: teamId, name: newTeamName.trim(), purpose: newTeamPurpose.trim(), leadId: newTeamLead, memberIds, channelId, createdAt: now };
    const conversation: TeamConversation = { id: channelId, title: team.name, kind: "department", participantIds: memberIds, teamId, unread: 0, lastActivity: now };
    saveTeams([team, ...teams]);
    saveConversations([conversation, ...conversations]);
    saveMembers(members.map((member) => memberIds.includes(member.id) ? { ...member, departmentIds: [...new Set([...member.departmentIds, teamId])] } : member));
    setTeamModalOpen(false); setNewTeamName(""); setNewTeamPurpose(""); setNewTeamMembers(["team-nadia", "team-kamal"]);
    notify(`${team.name} created with a dedicated conversation.`);
  }

  function updateAccessRole(person: TeamProfile, accessRole: TeamAccessRole) {
    if (!canManageAccess || person.accessRole === "owner") return;
    saveMembers(members.map((member) => member.id === person.id ? { ...member, accessRole } : member));
    notify(`${person.name} is now flagged as ${teamAccessCatalog[accessRole].label}.`);
  }

  function openDirectMessage(person: TeamProfile) {
    const existing = conversations.find((conversation) => conversation.kind === "direct" && conversation.participantIds.includes(person.id));
    if (existing) return openConversation(existing.id);
    setNewConversationMember(person.id);
    if (canMessage) setMessageModalOpen(true); else setView("messages");
  }

  return <>
    <section className="workspace-page-head team-workspace-head"><div><p>ExportPanel / COLLABORATION</p><h1>One company. Clear teams. Accountable conversations. <HintButton topic="team-overview" /></h1><span>Coordinate company departments, Export HQ specialists, and scoped partners without losing role boundaries, ownership, or the related export context.</span></div><div className="team-head-actions">{canMessage ? <button type="button" className="button button--secondary" onClick={() => setMessageModalOpen(true)}><MessageSquareText size={16} /> New message</button> : <Link href="/plans?feature=team" className="button button--secondary"><LockKeyhole size={15} /> Unlock messaging</Link>}{canManageAccess ? <button type="button" className="button button--primary" onClick={() => setTeamModalOpen(true)}><Plus size={16} /> Create team</button> : <Link href="/learn?topic=team-roles" className="button button--primary">How access works <ArrowRight size={14} /></Link>}</div></section>

    {!canMessage && <section className="team-preview-notice"><Sparkles size={18} /><span><strong>Interactive team preview</strong><small>Explore sample departments, role flags, profiles, and conversations. Scale unlocks private company messaging and team administration.</small></span><Link href="/plans?feature=team">Unlock Team <ArrowRight size={13} /></Link></section>}

    <section className="workflow-summary team-summary" aria-label="Team summary"><div><UsersRound size={18} /><span><strong>{members.length}</strong><small>people & partners</small></span></div><div><Building2 size={18} /><span><strong>{teams.filter((team) => team.id !== "team-export-hq").length}</strong><small>company teams</small></span></div><div><Gauge size={18} /><span><strong>{averageLoad}%</strong><small>average workload</small></span></div><div><MessageCircle size={18} /><span><strong>{conversations.reduce((total, item) => total + item.unread, 0)}</strong><small>unread messages</small></span></div></section>

    <div className="team-workspace-tabs" role="tablist" aria-label="Team workspace sections"><button type="button" role="tab" aria-selected={view === "messages"} className={view === "messages" ? "active" : ""} onClick={() => setView("messages")}><MessageSquareText size={15} /> Messages</button><button type="button" role="tab" aria-selected={view === "directory"} className={view === "directory" ? "active" : ""} onClick={() => setView("directory")}><UsersRound size={15} /> People & profiles</button><button type="button" role="tab" aria-selected={view === "teams"} className={view === "teams" ? "active" : ""} onClick={() => setView("teams")}><Building2 size={15} /> Teams & access</button></div>

    {view === "messages" && <div className="team-messaging-layout">
      <aside className="team-thread-list"><header><span><p>CONVERSATIONS</p><h2>Keep work in context <HintButton topic="team-messaging" /></h2></span><button type="button" onClick={() => canMessage ? setMessageModalOpen(true) : notify("Messaging unlocks with Scale.")} aria-label="Start conversation"><Plus size={16} /></button></header><label><Search size={14} /><input aria-label="Search conversations" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations…" /></label><div>{visibleConversations.map((conversation) => { const participant = members.find((member) => conversation.kind === "direct" && conversation.participantIds.includes(member.id) && member.id !== "team-nadia"); return <button type="button" className={selectedConversation?.id === conversation.id ? "active" : ""} key={conversation.id} onClick={() => openConversation(conversation.id)}><span className="team-thread-icon">{conversation.kind === "direct" && participant ? <Avatar initials={participant.initials} tone={toneForGroup(participant.group)} /> : conversation.kind === "export_hq" ? <Sparkles size={16} /> : <Hash size={16} />}</span><span><strong>{conversation.title}</strong><small>{conversation.relatedEntity ?? (conversation.kind === "direct" ? "Private conversation" : "Team channel")}</small></span>{conversation.unread > 0 && <b>{conversation.unread}</b>}</button>; })}</div></aside>

      <section className="team-chat"><header><span className="team-chat__icon">{selectedConversation?.kind === "export_hq" ? <Sparkles size={18} /> : selectedConversation?.kind === "direct" ? <MessageCircle size={18} /> : <Hash size={18} />}</span><span><strong>{selectedConversation?.title ?? "Choose a conversation"}</strong><small>{selectedConversation?.relatedEntity ?? `${selectedParticipants.length} participants`}</small></span><button type="button" onClick={() => setView("teams")}><UsersRound size={15} /> Participants</button></header><div className="team-chat__messages" aria-live="polite">{selectedMessages.map((message) => { const sender = members.find((member) => member.id === message.senderId); if (!sender) return null; const own = message.senderId === "team-nadia"; return <article className={own ? "own" : ""} key={message.id}><Avatar initials={sender.initials} tone={toneForGroup(sender.group)} /><div><header><strong>{sender.name}</strong><RoleBadge role={sender.accessRole} /><time dateTime={message.sentAt}>{formatMessageTime(message.sentAt)}</time></header><p>{message.body}</p>{own && <small><Check size={11} />{message.delivery === "read" ? "Read" : "Sent"}</small>}</div></article>; })}{selectedMessages.length === 0 && <div className="team-chat__empty"><MessageSquareText size={26} /><strong>Start this conversation with a clear outcome.</strong><span>Messages stay tied to this organization and its selected participants.</span></div>}</div><footer className={canMessage ? "" : "locked"}><textarea aria-label="Write a message" value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); sendMessage(); } }} placeholder={canMessage ? "Write an update, ask a question, or confirm the next action…" : "Messaging is available with Scale."} disabled={!canMessage || !selectedConversation} /><div><span>{canMessage ? "⌘ Enter to send" : <><LockKeyhole size={12} /> Preview is read-only</>}</span><button type="button" onClick={sendMessage} disabled={!canMessage || !messageDraft.trim()}><Send size={15} /> Send</button></div></footer></section>

      <aside className="team-chat-context"><header><p>PEOPLE & CONTEXT</p><h2>{selectedParticipants.length} participants</h2></header><div className="team-chat-context__people">{selectedParticipants.map((person) => <button type="button" key={person.id} onClick={() => { setSelectedId(person.id); setView("directory"); }}><Avatar initials={person.initials} tone={toneForGroup(person.group)} /><span><strong>{person.name}</strong><small>{person.role}</small></span><RoleBadge role={person.accessRole} /><ChevronRight size={14} /></button>)}</div>{selectedConversation?.relatedEntity && <section><small>RELATED WORK</small><strong>{selectedConversation.relatedEntity}</strong><Link href="/work">Open work context <ArrowRight size={13} /></Link></section>}<section className="team-chat-context__security"><ShieldCheck size={16} /><span><strong>Organization-scoped</strong><small>Only listed participants and authorized organization roles can access this thread.</small></span></section></aside>
    </div>}

    {view === "directory" && <>
      <div className="workflow-toolbar team-toolbar"><label><Search size={16} /><input aria-label="Search team" placeholder="Search people, roles, skills…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div role="group" aria-label="Team group">{groups.map((item) => <button type="button" className={group === item ? "active" : ""} key={item} onClick={() => setGroup(item)}>{item}</button>)}</div></div>
      <div className={`team-layout${selected ? " has-detail" : ""}`}><section className="team-directory"><header><span><p>TEAM DIRECTORY</p><h2>{group === "All" ? "Everyone in the workflow" : group}</h2></span><HintButton topic="team-capacity" /></header>{filtered.length === 0 && <div className="record-empty"><Search size={24} /><strong>No team profile matches this search.</strong><button type="button" onClick={() => { setQuery(""); setGroup("All"); }}>Clear filters</button></div>}{filtered.map((person) => <article className={selectedId === person.id ? "active" : ""} key={person.id}><button type="button" className="team-profile__main" onClick={() => setSelectedId(person.id)}><Avatar initials={person.initials} tone={toneForGroup(person.group)} /><span><span><strong>{person.name}</strong><i className={`team-presence team-presence--${person.availability}`} /><RoleBadge role={person.accessRole} /></span><small>{person.role} · {person.group}</small><p>{person.focus}</p><em>{person.skills.map((skill) => <b key={skill}>{skill}</b>)}</em></span></button><span className="team-profile__load"><span><small>Workload</small><strong>{person.capacity}%</strong></span><Progress value={person.capacity} label={`${person.name} workload`} /></span><span className="team-profile__handoffs"><strong>{person.activeHandoffs}</strong><small>handoffs</small></span><button type="button" className="record-open" onClick={() => setSelectedId(person.id)} aria-label={`Open ${person.name}`}><ArrowRight size={15} /></button></article>)}</section>
        {selected && <aside className="team-detail"><header><span><p>{selected.group.toUpperCase()}</p><h2>{selected.name}</h2></span><button type="button" aria-label="Close team profile" onClick={() => setSelectedId(null)}><X size={17} /></button></header><div className="team-detail__identity"><Avatar initials={selected.initials} tone={toneForGroup(selected.group)} /><span><strong>{selected.role}</strong><small><i className={`team-presence team-presence--${selected.availability}`} />{availabilityLabel[selected.availability]} · {selected.response}</small><RoleBadge role={selected.accessRole} /></span></div><section><span><h3>Position & access</h3><HintButton topic="team-roles" /></span><p>{teamAccessCatalog[selected.accessRole].summary}</p>{canManageAccess && selected.group === "Company" ? <label className="team-role-select"><span>Access role</span><select value={selected.accessRole} onChange={(event) => updateAccessRole(selected, event.target.value as TeamAccessRole)} disabled={selected.accessRole === "owner"}>{roleOrder.filter((role) => role !== "external").map((role) => <option value={role} key={role}>{teamAccessCatalog[role].label}</option>)}</select>{selected.accessRole === "owner" && <small>Protected owner role</small>}</label> : <div className="team-access-scope"><small>ACCESS SCOPE</small><strong>{selected.accessScope}</strong></div>}</section><section><h3>Assigned teams</h3><div className="team-skill-list">{teams.filter((team) => selected.departmentIds.includes(team.id)).map((team) => <span key={team.id}>{team.name}</span>)}{selected.departmentIds.length === 0 && <span>Scoped handoff only</span>}</div></section><section><h3>Current focus</h3><p>{selected.focus}</p></section><section><h3>Workload & handoffs</h3><div className="team-detail__load"><span><strong>{selected.capacity}%</strong><small>allocated workload</small></span><Progress value={selected.capacity} label={`${selected.name} workload`} /><span><CalendarClock size={14} />{selected.activeHandoffs} active handoffs</span></div></section><section><h3>Skills</h3><div className="team-skill-list">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section><dl><div><dt>Response expectation</dt><dd>{selected.response}</dd></div><div><dt>Team type</dt><dd>{selected.group}</dd></div></dl><footer><button type="button" className="button button--secondary" onClick={() => canManageAccess && notify(`${selected.name} · ${selected.email}`)} disabled={!canManageAccess}><Mail size={14} /> Contact details</button><button type="button" className="button button--primary" onClick={() => openDirectMessage(selected)}><MessageCircle size={14} /> Message</button></footer></aside>}
      </div>
    </>}

    {view === "teams" && <div className="teams-access-layout"><section className="business-team-list"><header><span><p>COMPANY TEAMS</p><h2>Departments with a clear lead and channel <HintButton topic="team-departments" /></h2></span>{canManageAccess ? <button type="button" onClick={() => setTeamModalOpen(true)}><Plus size={15} /> Create team</button> : <Link href="/plans?feature=team"><LockKeyhole size={13} /> Scale required</Link>}</header><div>{teams.map((team) => { const lead = members.find((member) => member.id === team.leadId); const teamMembers = members.filter((member) => team.memberIds.includes(member.id)); return <article key={team.id}><header><span className="business-team-icon"><Building2 size={17} /></span><span><strong>{team.name}</strong><small>{team.id === "team-export-hq" ? "External accountable team" : "Company team"}</small></span>{team.id === "team-export-hq" && <RoleBadge role="external" />}</header><p>{team.purpose}</p><div className="business-team-people"><span className="avatar-stack">{teamMembers.slice(0, 5).map((member, index) => <Avatar key={member.id} initials={member.initials} tone={index} />)}</span><span><strong>{teamMembers.length} participants</strong><small>Lead · {lead?.name ?? "Unassigned"}</small></span></div><footer><button type="button" onClick={() => openConversation(team.channelId)}><MessageSquareText size={14} /> Open channel</button><button type="button" onClick={() => { setSelectedId(team.leadId); setView("directory"); }}><UserRoundCheck size={14} /> View lead</button></footer></article>; })}</div></section><aside className="role-hierarchy"><header><p>ACCESS HIERARCHY</p><h2>Position controls the ceiling <HintButton topic="team-roles" /></h2><span>Subscription unlocks the module; each person&apos;s role still controls what they can view or change.</span></header><ol>{roleOrder.map((role) => { const definition = teamAccessCatalog[role]; const count = members.filter((member) => member.accessRole === role).length; return <li key={role}><span>{definition.rank}</span><div><strong>{definition.label}</strong><small>{definition.summary}</small><em>{definition.capabilities.map((capability) => <b key={capability}>{capability}</b>)}</em></div><i>{count}</i></li>; })}</ol><Link href="/settings#members"><Settings size={14} /> Open membership settings <ArrowRight size={13} /></Link></aside></div>}

    <section className="team-access-note"><Building2 size={18} /><span><strong>Teams, messaging, and authorization stay connected—but never confused.</strong><small>Owners create departments and assign position-based roles. Export HQ specialists and partners receive explicit scoped access instead of silently becoming company members.</small></span><Link href="/learn?topic=team-roles">How roles work <ArrowRight size={13} /></Link></section>

    {teamModalOpen && <div className="team-modal-backdrop" role="presentation"><section className="team-modal" role="dialog" aria-modal="true" aria-labelledby="create-team-title"><header><span><p>OWNER CONTROL</p><h2 id="create-team-title">Create a company team</h2></span><button type="button" onClick={() => setTeamModalOpen(false)} aria-label="Close"><X size={17} /></button></header><div className="team-modal__body"><label><span>Team name</span><input value={newTeamName} onChange={(event) => setNewTeamName(event.target.value)} placeholder="e.g. Finance & Trade Documentation" maxLength={80} /></label><label><span>Purpose</span><textarea value={newTeamPurpose} onChange={(event) => setNewTeamPurpose(event.target.value)} placeholder="What should this team own and coordinate?" maxLength={240} /></label><label><span>Team lead</span><select value={newTeamLead} onChange={(event) => setNewTeamLead(event.target.value)}>{companyMembers.map((member) => <option value={member.id} key={member.id}>{member.name} · {member.role}</option>)}</select></label><fieldset><legend>Initial members</legend>{companyMembers.map((member) => <label key={member.id}><input type="checkbox" checked={newTeamMembers.includes(member.id)} onChange={(event) => setNewTeamMembers(event.target.checked ? [...new Set([...newTeamMembers, member.id])] : newTeamMembers.filter((id) => id !== member.id))} /><Avatar initials={member.initials} /><span><strong>{member.name}</strong><small>{teamAccessCatalog[member.accessRole].label}</small></span></label>)}</fieldset><div className="team-modal__promise"><MessageSquareText size={15} /><span>A dedicated channel is created automatically. Access remains organization-scoped.</span></div></div><footer><button type="button" className="button button--secondary" onClick={() => setTeamModalOpen(false)}>Cancel</button><button type="button" className="button button--primary" onClick={createTeam} disabled={!newTeamName.trim() || !newTeamPurpose.trim()}><Plus size={15} /> Create team & channel</button></footer></section></div>}

    {messageModalOpen && <div className="team-modal-backdrop" role="presentation"><section className="team-modal team-modal--message" role="dialog" aria-modal="true" aria-labelledby="new-message-title"><header><span><p>PRIVATE CONVERSATION</p><h2 id="new-message-title">Start a message</h2></span><button type="button" onClick={() => setMessageModalOpen(false)} aria-label="Close"><X size={17} /></button></header><div className="team-modal__body"><label><span>Message</span><select value={newConversationMember} onChange={(event) => setNewConversationMember(event.target.value)}>{members.filter((member) => member.id !== "team-nadia").map((member) => <option value={member.id} key={member.id}>{member.name} · {member.role}</option>)}</select></label><div className="team-modal__promise"><ShieldCheck size={15} /><span>The conversation is visible only to its participants and authorized organization administrators.</span></div></div><footer><button type="button" className="button button--secondary" onClick={() => setMessageModalOpen(false)}>Cancel</button><button type="button" className="button button--primary" onClick={createDirectConversation}><UserPlus size={15} /> Open conversation</button></footer></section></div>}

    {toast && <div className="settings-toast" role="status"><Sparkles size={16} />{toast}</div>}
  </>;
}
