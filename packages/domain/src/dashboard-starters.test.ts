import { describe, expect, it } from "vitest";
import {
  createDashboardStarterWorkspace,
  normalizeDashboardStarterWorkspace
} from "./dashboard-starters";

describe("dashboard starter workspace", () => {
  it("starts with visible, explicitly non-authoritative example modules", () => {
    const workspace = createDashboardStarterWorkspace();

    expect(workspace.moduleOrder).toEqual(["managed_work", "requirements", "accountable_team"]);
    expect(workspace.hiddenModules).toEqual([]);
    expect([...workspace.managedWork, ...workspace.requirements, ...workspace.accountableRoles]
      .every((record) => record.state === "example")).toBe(true);
    expect(JSON.stringify(workspace)).not.toMatch(/Anna|Rahim|Lisa|organizationId|actorId/);
  });

  it("restores editable planning fields while keeping requirement provenance locked", () => {
    const defaultWorkspace = createDashboardStarterWorkspace();
    const original = defaultWorkspace.requirements[0]!;
    const restored = normalizeDashboardStarterWorkspace({
      ...defaultWorkspace,
      requirements: [{
        ...original,
        state: "draft",
        evidence: "Our draft label artwork",
        ownerRole: "Quality manager",
        dueLabel: "Review next Tuesday",
        notes: "Confirm the fibre order for the intended German retail channel.",
        title: "Fabricated legal title",
        jurisdiction: "Invented jurisdiction",
        sourceLabel: "Untrusted publisher",
        sourceUrl: "https://example.invalid",
        sourceReviewedAt: "2099-01-01"
      }]
    });
    const requirement = restored.requirements[0]!;

    expect(requirement).toMatchObject({
      state: "draft",
      evidence: "Our draft label artwork",
      ownerRole: "Quality manager",
      dueLabel: "Review next Tuesday",
      notes: "Confirm the fibre order for the intended German retail channel."
    });
    expect(requirement.title).toBe(original.title);
    expect(requirement.jurisdiction).toBe(original.jurisdiction);
    expect(requirement.sourceLabel).toBe(original.sourceLabel);
    expect(requirement.sourceUrl).toBe(original.sourceUrl);
    expect(requirement.sourceReviewedAt).toBe(original.sourceReviewedAt);
  });

  it("normalizes untrusted browser layout and bounds editable values", () => {
    const defaultWorkspace = createDashboardStarterWorkspace();
    const restored = normalizeDashboardStarterWorkspace({
      version: 1,
      moduleOrder: ["requirements", "requirements", "unknown"],
      hiddenModules: ["managed_work", "unknown"],
      managedWork: [{
        ...defaultWorkspace.managedWork[0],
        state: "draft",
        title: `  ${"x".repeat(150)}  `,
        progress: 400
      }]
    });

    expect(restored.moduleOrder).toEqual(["requirements", "managed_work", "accountable_team"]);
    expect(restored.hiddenModules).toEqual(["managed_work"]);
    expect(restored.managedWork[0]!.title).toHaveLength(100);
    expect(restored.managedWork[0]!.progress).toBe(100);
    expect(restored.managedWork[0]!.state).toBe("draft");
  });

  it("resets malformed or versionless browser state to maintained examples", () => {
    expect(normalizeDashboardStarterWorkspace(null)).toEqual(createDashboardStarterWorkspace());
    expect(normalizeDashboardStarterWorkspace({ version: 99 })).toEqual(createDashboardStarterWorkspace());
  });
});
