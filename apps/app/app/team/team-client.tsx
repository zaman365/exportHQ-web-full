"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Gauge,
  Handshake,
  Mail,
  Search,
  Settings,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, Progress } from "@exporthq/ui";
import { HintButton } from "../_components/hint-button";
import { teamProfiles, type TeamAvailability, type TeamGroup, type TeamProfile } from "../_components/collaboration-data";

type GroupFilter = TeamGroup | "All";
const groups: readonly GroupFilter[] = ["All", "Company", "Export HQ", "Partner"];
const availabilityLabel: Record<TeamAvailability, string> = { available: "Available", focused: "Focused", away: "Away" };

function toneForGroup(group: TeamGroup): number {
  return group === "Export HQ" ? 1 : group === "Partner" ? 2 : 0;
}

export default function TeamClient({ canManageAccess }: { canManageAccess: boolean }) {
  const [group, setGroup] = useState<GroupFilter>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(teamProfiles[2]?.id ?? null);
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => teamProfiles.filter((person) => {
    const haystack = `${person.name} ${person.role} ${person.group} ${person.focus} ${person.skills.join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (group === "All" || person.group === group);
  }), [query, group]);
  const selected = teamProfiles.find((person) => person.id === selectedId);
  const averageLoad = Math.round(teamProfiles.reduce((total, person) => total + person.capacity, 0) / teamProfiles.length);
  const handoffs = teamProfiles.reduce((total, person) => total + person.activeHandoffs, 0);

  function revealContact(person: TeamProfile) {
    setToast(`${person.name} · ${person.email}`);
    window.setTimeout(() => setToast(""), 5000);
  }

  return <>
    <section className="workspace-page-head"><div><p>ExportPanel / WORKFLOWS / TEAM</p><h1>Know who can move the work. <HintButton topic="team-overview" /></h1><span>See company members, accountable Export HQ specialists, and external partners together—with focus, availability, workload, and open handoffs.</span></div>{canManageAccess ? <Link href="/settings#members" className="button button--primary"><Settings size={16} /> Manage access</Link> : <Link href="/learn?topic=team-roles" className="button button--secondary">Understand access <ArrowRight size={14} /></Link>}</section>

    <section className="workflow-summary" aria-label="Team summary"><div><UsersRound size={18} /><span><strong>{teamProfiles.length}</strong><small>people & partners</small></span></div><div><UserRoundCheck size={18} /><span><strong>{teamProfiles.filter((person) => person.availability === "available").length}</strong><small>available now</small></span></div><div><Gauge size={18} /><span><strong>{averageLoad}%</strong><small>average workload</small></span></div><div><Handshake size={18} /><span><strong>{handoffs}</strong><small>open handoffs</small></span></div></section>

    <div className="workflow-toolbar team-toolbar"><label><Search size={16} /><input aria-label="Search team" placeholder="Search people, roles, skills…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div role="group" aria-label="Team group">{groups.map((item) => <button type="button" className={group === item ? "active" : ""} key={item} onClick={() => setGroup(item)}>{item}</button>)}</div></div>

    <div className={`team-layout${selected ? " has-detail" : ""}`}><section className="team-directory"><header><span><p>TEAM DIRECTORY</p><h2>{group === "All" ? "Everyone in the workflow" : group}</h2></span><HintButton topic="team-capacity" /></header>{filtered.length === 0 && <div className="record-empty"><Search size={24} /><strong>No team profile matches this search.</strong><button type="button" onClick={() => { setQuery(""); setGroup("All"); }}>Clear filters</button></div>}{filtered.map((person) => <article className={selectedId === person.id ? "active" : ""} key={person.id}><button type="button" className="team-profile__main" onClick={() => setSelectedId(person.id)}><Avatar initials={person.initials} tone={toneForGroup(person.group)} /><span><span><strong>{person.name}</strong><i className={`team-presence team-presence--${person.availability}`} /> </span><small>{person.role} · {person.group}</small><p>{person.focus}</p><em>{person.skills.map((skill) => <b key={skill}>{skill}</b>)}</em></span></button><span className="team-profile__load"><span><small>Workload</small><strong>{person.capacity}%</strong></span><Progress value={person.capacity} label={`${person.name} workload`} /></span><span className="team-profile__handoffs"><strong>{person.activeHandoffs}</strong><small>handoffs</small></span><button type="button" className="record-open" onClick={() => setSelectedId(person.id)} aria-label={`Open ${person.name}`}><ArrowRight size={15} /></button></article>)}</section>

      {selected && <aside className="team-detail"><header><span><p>{selected.group.toUpperCase()}</p><h2>{selected.name}</h2></span><button type="button" aria-label="Close team profile" onClick={() => setSelectedId(null)}><X size={17} /></button></header><div className="team-detail__identity"><Avatar initials={selected.initials} tone={toneForGroup(selected.group)} /><span><strong>{selected.role}</strong><small><i className={`team-presence team-presence--${selected.availability}`} />{availabilityLabel[selected.availability]} · {selected.response}</small></span></div><section><span><h3>Current focus</h3><HintButton topic="accountable-team" /></span><p>{selected.focus}</p></section><section><h3>Workload & handoffs</h3><div className="team-detail__load"><span><strong>{selected.capacity}%</strong><small>allocated workload</small></span><Progress value={selected.capacity} label={`${selected.name} workload`} /><span><Handshake size={14} />{selected.activeHandoffs} active handoffs</span></div></section><section><h3>Skills</h3><div className="team-skill-list">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section><dl><div><dt>Response expectation</dt><dd>{selected.response}</dd></div><div><dt>Team type</dt><dd>{selected.group}</dd></div></dl><footer><button type="button" className="button button--secondary" onClick={() => revealContact(selected)}><Mail size={14} /> Contact details</button><Link className="button button--primary" href={`/waiting?owner=${encodeURIComponent(selected.name)}`}><CalendarClock size={14} /> View handoffs</Link></footer></aside>}
    </div>

    <section className="team-access-note"><Building2 size={18} /><span><strong>Directory and access are intentionally separate.</strong><small>Team shows operational ownership and capacity. Settings controls membership, roles, invitations, suspension, and audit history.</small></span><Link href="/learn?topic=team-roles">How roles work <ArrowRight size={13} /></Link></section>
    {toast && <div className="settings-toast" role="status"><Sparkles size={16} />{toast}</div>}
  </>;
}
