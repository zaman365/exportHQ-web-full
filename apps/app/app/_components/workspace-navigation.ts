import {
  BookOpenCheck,
  CirclePlus,
  CreditCard,
  FileStack,
  FileQuestion,
  FolderLock,
  Gauge,
  Globe2,
  House,
  Hourglass,
  Inbox,
  Lightbulb,
  ListChecks,
  Package,
  Radar,
  Route,
  Settings,
  ShieldCheck,
  Target,
  Users,
  UsersRound
} from "lucide-react";
import type { WorkspaceFeature } from "@exporthq/authorization";

export type WorkspaceDestination = "dashboard" | "attention" | "inbox" | "work" | "blueprints" | "waiting" | "decisions" | "ideas" | "team" | "create" | "learning" | "settings" | "billing" | "markets" | "opportunities" | "buyers" | "studio" | "readiness" | "requirements" | "other";

export function workspaceHref(href: string, publicPreview: boolean): string {
  if (!publicPreview || href.startsWith("http")) return href;
  const [pathAndQuery, hash] = href.split("#", 2);
  const path = pathAndQuery || "/";
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}access=public${hash ? `#${hash}` : ""}`;
}

export const workspaceGroups = [
  { label: "HOME", items: [["Home", House, "/", "dashboard", "home"], ["Attention Center", Radar, "/attention", "attention", "attention"], ["Inbox", Inbox, "/inbox", "inbox", "inbox"], ["My Work", ListChecks, "/work", "work", "my-work"], ["Waiting", Hourglass, "/waiting", "waiting", "waiting"], ["Blueprints", FileStack, "/blueprints", "blueprints", "blueprints"]] },
  { label: "WORKFLOWS", items: [["Decisions", FileQuestion, "/decisions", "decisions", "decisions"], ["Ideas", Lightbulb, "/ideas", "ideas", "ideas"], ["Team", UsersRound, "/team", "team", "team"], ["Create", CirclePlus, "/create", "create", "create"]] },
  { label: "GROW", items: [["Markets", Globe2, "/opportunities?view=countries", "markets", "markets"], ["Opportunities", Target, "/opportunities", "opportunities", "opportunities"], ["Buyers", Users, "/buyers", "buyers", "buyers"]] },
  { label: "TRADE", items: [["Export Studio", Route, "/studio", "studio", "export-studio"], ["Products", Package, "/#products", "other", "products"], ["Documents", FolderLock, "/#documents", "other", "documents"]] },
  { label: "MANAGE", items: [["Export readiness", Gauge, "/readiness", "readiness", "readiness"], ["Requirements", ShieldCheck, "/requirements", "requirements", "requirements"], ["Billing & usage", CreditCard, "/billing", "billing", "billing"], ["Learning Center", BookOpenCheck, "/learn", "learning", "learning"], ["Settings", Settings, "/settings", "settings", "settings"]] }
] as const satisfies ReadonlyArray<{
  label: string;
  items: ReadonlyArray<readonly [string, typeof House, string, WorkspaceDestination, WorkspaceFeature]>;
}>;

export function workspaceFeatureForDestination(destination: WorkspaceDestination): WorkspaceFeature | undefined {
  for (const group of workspaceGroups) {
    const item = group.items.find(([, , , id]) => id === destination);
    if (item) return item[4];
  }
  return undefined;
}

export function workspaceFeatureLabel(feature: WorkspaceFeature): string {
  for (const group of workspaceGroups) {
    const item = group.items.find(([, , , , itemFeature]) => itemFeature === feature);
    if (item) return item[0];
  }
  return feature.replaceAll("-", " ");
}
