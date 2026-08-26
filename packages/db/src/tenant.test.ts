import { describe, expect, it } from "vitest";
import { assertOrganizationId, TenantContextError } from "./tenant";

describe("organization id validation", () => {
  it("accepts a UUID and normalises its case", () => {
    expect(assertOrganizationId("3F2504E0-4F89-41D3-9A0C-0305E82C3301")).toBe(
      "3f2504e0-4f89-41d3-9a0c-0305e82c3301"
    );
  });

  it("refuses an identity-provider organization id with a message that names the mistake", () => {
    /* Passing a Clerk id would produce a context matching no rows, which reads
       as "this tenant has no data" rather than as the bug it is. */
    expect(() => assertOrganizationId("org_3IRabAnEQBciVzmSDLT4Qhzb5go")).toThrowError(
      /organizations.id UUID/
    );
  });

  it("refuses anything else, including values shaped to break out of the setting", () => {
    for (const value of ["", "'; select 1 --", "1 OR 1=1", "not-a-uuid"]) {
      expect(() => assertOrganizationId(value)).toThrowError(TenantContextError);
    }
  });
});
