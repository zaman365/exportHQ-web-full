import {
  BookOpenCheck,
  CirclePlus,
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
  Settings,
  ShieldCheck,
  Target,
  Users,
  UsersRound
} from "lucide-react";
import type { WorkspaceFeature } from "@exporthq/authorization";

export type WorkspaceDestination = "dashboard" | "attention" | "inbox" | "work" | "blueprints" | "waiting" | "decisions" | "ideas" | "team" | "create" | "learning" | "settings" | "markets" | "opportunities" | "readiness" | "other";

export const workspaceGroups = [
  { label: "HOME", items: [["Home", House, "/", "dashboard", "home"], ["Attention Center", Radar, "/attention", "attention", "attention"], ["Inbox", Inbox, "/inbox", "inbox", "inbox"], ["My Work", ListChecks, "/work", "work", "my-work"], ["Waiting", Hourglass, "/waiting", "waiting", "waiting"], ["Blueprints", FileStack, "/blueprints", "blueprints", "blueprints"]] },
  { label: "WORKFLOWS", items: [["Decisions", FileQuestion, "/decisions", "decisions", "decisions"], ["Ideas", Lightbulb, "/ideas", "ideas", "ideas"], ["Team", UsersRound, "/team", "team", "team"], ["Create", CirclePlus, "/create", "create", "create"]] },
  { label: "GROW", items: [["Markets", Globe2, "/opportunities?view=countries", "markets", "markets"], ["Opportunities", Target, "/opportunities", "opportunities", "opportunities"], ["Buyers", Users, "/#team", "other", "buyers"]] },
  { label: "TRADE", items: [["Products", Package, "/#products", "other", "products"], ["Documents", FolderLock, "/#documents", "other", "documents"]] },
  { label: "MANAGE", items: [["Export readiness", Gauge, "/readiness", "readiness", "readiness"], ["Requirements", ShieldCheck, "/#requirements", "other", "requirements"], ["Learning Center", BookOpenCheck, "/learn", "learning", "learning"], ["Settings", Settings, "/settings", "settings", "home"]] }
] as const satisfies ReadonlyArray<{
  label: string;
  items: ReadonlyArray<readonly [string, typeof House, string, WorkspaceDestination, WorkspaceFeature]>;
}>;
