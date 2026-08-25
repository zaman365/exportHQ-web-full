"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, LockKeyhole, LogOut, Plus, Settings } from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Avatar } from "@exporthq/ui";
import { exportPanelPath } from "../_lib/export-panel-paths";

type DemoBusiness = { id: string; name: string };

const demoBusinessesKey = "exportpanel.demo-businesses";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B";
}

function AccountTrigger({ userName, organizationName, tierName }: { userName: string; organizationName: string; tierName: string }) {
  return (
    <summary className="workspace-account__trigger" aria-label="Open account and business menu">
      <Avatar initials={initials(userName)} tone={2} />
      <span><strong>{userName}</strong><small>{organizationName} · {tierName}</small></span>
      <ChevronDown size={15} />
    </summary>
  );
}

function DemoAccountControl({ organizationName, tierName, userName }: { organizationName: string; tierName: string; userName: string }) {
  const router = useRouter();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [businesses, setBusinesses] = useState<DemoBusiness[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(demoBusinessesKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setBusinesses(parsed.filter((business): business is DemoBusiness => Boolean(
            business && typeof business === "object" &&
            "id" in business && typeof business.id === "string" &&
            "name" in business && typeof business.name === "string"
          )));
        }
      }
    } catch {
      window.localStorage.removeItem(demoBusinessesKey);
    }
  }, []);

  const close = () => detailsRef.current?.removeAttribute("open");
  const openBusiness = (business: DemoBusiness) => {
    close();
    router.push(`/?business=${encodeURIComponent(business.name)}&access=basic`);
  };

  const addBusiness = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    const existing = businesses.find((business) => business.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase());
    if (existing) {
      openBusiness(existing);
      return;
    }
    const business = { id: `business-${Date.now()}`, name: cleanName };
    const next = [...businesses, business];
    setBusinesses(next);
    window.localStorage.setItem(demoBusinessesKey, JSON.stringify(next));
    setName("");
    setCreating(false);
    close();
    router.push(`/onboarding?business=${encodeURIComponent(business.name)}&access=basic`);
  };

  const currentIsBasic = tierName === "Basic";

  return (
    <details className="workspace-account" ref={detailsRef}>
      <AccountTrigger userName={userName} organizationName={organizationName} tierName={tierName} />
      <div className="workspace-account__menu">
        <header className="workspace-account__identity">
          <Avatar initials={initials(userName)} tone={2} />
          <span><strong>{userName}</strong><small>Managing Director · Demo account</small></span>
          <Link href="/settings" onClick={close} aria-label="Open settings"><Settings size={16} /></Link>
        </header>

        <section className="workspace-account__businesses">
          <header><span><Building2 size={14} /><strong>Business workspaces</strong></span><Link href="/plans" onClick={close}>Compare plans</Link></header>
          <button type="button" className={`business-switcher__business${!currentIsBasic ? " current" : ""}`} onClick={() => { close(); router.push("/"); }}>
            <span className="business-switcher__initials">AT</span>
            <span><strong>ABC Textiles</strong><small>Managed · Full workspace</small></span>
            {!currentIsBasic ? <Check size={15} /> : null}
          </button>
          {businesses.map((business) => (
            <button type="button" className={`business-switcher__business${currentIsBasic && business.name === organizationName ? " current" : ""}`} onClick={() => openBusiness(business)} key={business.id}>
              <span className="business-switcher__initials basic">{initials(business.name)}</span>
              <span><strong>{business.name}</strong><small>Basic · Home and learning</small></span>
              {currentIsBasic && business.name === organizationName ? <Check size={15} /> : <LockKeyhole size={14} />}
            </button>
          ))}
          <p><LockKeyhole size={13} /> New businesses start with Basic access. Upgrade each business independently to unlock its full workspace.</p>
          {creating ? (
            <form className="business-switcher__form" onSubmit={addBusiness}>
              <label htmlFor="new-business-name">Business name</label>
              <input id="new-business-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Northstar Trading" />
              <div><button type="button" onClick={() => setCreating(false)}>Cancel</button><button type="submit" disabled={!name.trim()}>Create Basic workspace</button></div>
            </form>
          ) : (
            <button type="button" className="business-switcher__add" onClick={() => setCreating(true)}><Plus size={15} /> Add another business</button>
          )}
        </section>

        <footer><Link href="/settings" onClick={close}><Settings size={14} /> Settings</Link><Link href="/preview"><LogOut size={14} /> Exit demo</Link></footer>
      </div>
    </details>
  );
}

function AuthenticatedAccountControl({ organizationName, tierName, userName }: { organizationName: string; tierName: string; userName: string }) {
  return (
    <details className="workspace-account">
      <AccountTrigger userName={userName} organizationName={organizationName} tierName={tierName} />
      <div className="workspace-account__menu workspace-account__menu--authenticated">
        <header className="workspace-account__identity">
          <UserButton showName />
          <span><strong>Account</strong><small>Profile, security, and sign out</small></span>
        </header>
        <section className="workspace-account__businesses">
          <header><span><Building2 size={14} /><strong>Business workspaces</strong></span><Link href="/plans">Compare plans</Link></header>
          <div className="workspace-account__organization-switcher">
            <OrganizationSwitcher hidePersonal afterCreateOrganizationUrl={exportPanelPath("/onboarding")} afterSelectOrganizationUrl={exportPanelPath()} />
            <small>{tierName} access · New businesses start on Basic</small>
          </div>
        </section>
        <footer><Link href="/settings"><Settings size={14} /> Workspace settings</Link></footer>
      </div>
    </details>
  );
}

export function WorkspaceAccountControl({
  enabled,
  organizationName,
  tierName,
  userName
}: {
  enabled: boolean;
  organizationName: string;
  tierName: string;
  userName: string;
}) {
  return enabled
    ? <AuthenticatedAccountControl organizationName={organizationName} tierName={tierName} userName={userName} />
    : <DemoAccountControl organizationName={organizationName} tierName={tierName} userName={userName} />;
}
