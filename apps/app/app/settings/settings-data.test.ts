import { describe, expect, it } from "vitest";
import { createAuditCsv, createWorkspaceExport, initialWorkspaceSettings } from "./settings-data";

describe("settings exports", () => {
  it("escapes audit values as valid CSV cells", () => {
    const csv = createAuditCsv([
      {
        ...initialWorkspaceSettings.audit[0]!,
        detail: 'Changed "Documents, reports" access.'
      }
    ]);

    expect(csv).toContain('"Changed ""Documents, reports"" access."');
    expect(csv.split("\n")).toHaveLength(2);
  });

  it("includes only selected workspace sections", () => {
    const exported = createWorkspaceExport(initialWorkspaceSettings, ["organization", "members"], "json");
    const parsed = JSON.parse(exported) as { data: Record<string, unknown> };

    expect(parsed.data.organization).toBeDefined();
    expect(parsed.data.members).toBeDefined();
    expect(parsed.data.security).toBeUndefined();
    expect(parsed.data.audit).toBeUndefined();
  });

  it("normalizes the domain allow-list in exports", () => {
    const state = {
      ...initialWorkspaceSettings,
      security: { ...initialWorkspaceSettings.security, allowedDomains: "example.com, partner.test" }
    };
    const exported = createWorkspaceExport(state, ["security"], "json");
    const parsed = JSON.parse(exported) as { data: { security: { allowedDomains: string[] } } };

    expect(parsed.data.security.allowedDomains).toEqual(["example.com", "partner.test"]);
  });
});
