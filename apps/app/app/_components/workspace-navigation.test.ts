import { describe, expect, it } from "vitest";
import { workspaceFeatureForDestination, workspaceGroups } from "./workspace-navigation";

describe("workspace navigation", () => {
  it("routes Buyers and Requirements to dedicated modules", () => {
    const buyers = workspaceGroups[2].items[2];
    const requirements = workspaceGroups[4].items[1];
    expect(buyers[0]).toBe("Buyers");
    expect(buyers[2]).toBe("/buyers");
    expect(requirements[0]).toBe("Requirements");
    expect(requirements[2]).toBe("/requirements");
    expect(workspaceFeatureForDestination("buyers")).toBe("buyers");
    expect(workspaceFeatureForDestination("requirements")).toBe("requirements");
  });
});
