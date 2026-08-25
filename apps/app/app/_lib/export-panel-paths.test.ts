import { describe, expect, it } from "vitest";
import { EXPORT_PANEL_BASE_PATH, exportPanelPath } from "./export-panel-paths";

describe("ExportPanel path mounting", () => {
  it("mounts the application root at the public ExportPanel path", () => {
    expect(EXPORT_PANEL_BASE_PATH).toBe("/ExportPanel");
    expect(exportPanelPath()).toBe("/ExportPanel");
    expect(exportPanelPath("/")).toBe("/ExportPanel");
  });

  it("prefixes application routes and preserves their query strings", () => {
    expect(exportPanelPath("/preview")).toBe("/ExportPanel/preview");
    expect(exportPanelPath("/sign-in?reason=configuration")).toBe(
      "/ExportPanel/sign-in?reason=configuration"
    );
  });

  it("never prefixes an already mounted URL twice", () => {
    expect(exportPanelPath("/ExportPanel")).toBe("/ExportPanel");
    expect(exportPanelPath("/ExportPanel/readiness")).toBe(
      "/ExportPanel/readiness"
    );
  });
});
