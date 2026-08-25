import {
  BookOpenCheck,
  CirclePlus,
  FileStack,
  FileQuestion,
  FolderLock,
  Gauge,
  Globe2,
  Hourglass,
  Inbox,
  LayoutDashboard,
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

export type WorkspaceDestination = "dashboard" | "attention" | "inbox" | "work" | "blueprints" | "waiting" | "decisions" | "ideas" | "team" | "create" | "learning" | "settings" | "other";

export const workspaceGroups = [
  { label: "COMMAND", items: [["Dashboard", LayoutDashboard, "/", "dashboard"], ["Attention Center", Radar, "/attention", "attention"], ["Inbox", Inbox, "/inbox", "inbox"], ["My Work", ListChecks, "/work", "work"], ["Waiting", Hourglass, "/waiting", "waiting"], ["Blueprints", FileStack, "/blueprints", "blueprints"]] },
  { label: "WORKFLOWS", items: [["Decisions", FileQuestion, "/decisions", "decisions"], ["Ideas", Lightbulb, "/ideas", "ideas"], ["Team", UsersRound, "/team", "team"], ["Create", CirclePlus, "/create", "create"]] },
  { label: "GROW", items: [["Markets", Globe2, "/#readiness", "other"], ["Opportunities", Target, "/#readiness", "other"], ["Buyers", Users, "/#team", "other"]] },
  { label: "TRADE", items: [["Products", Package, "/#products", "other"], ["Documents", FolderLock, "/#documents", "other"]] },
  { label: "MANAGE", items: [["Export readiness", Gauge, "/#readiness", "other"], ["Requirements", ShieldCheck, "/#requirements", "other"], ["Learning Center", BookOpenCheck, "/learn", "learning"], ["Settings", Settings, "/settings", "settings"]] }
] as const;
