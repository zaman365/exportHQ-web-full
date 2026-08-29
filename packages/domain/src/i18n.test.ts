import { describe, expect, it } from "vitest";
import { resolveLocale, supportedLocales, translationCatalog, translate } from "./i18n";

describe("Bangla-first localization", () => {
  it("defaults Bangladesh organizations to Bangla and others to English", () => {
    expect(resolveLocale(undefined, "BD")).toBe("bn");
    expect(resolveLocale(undefined, "DE")).toBe("en");
    expect(resolveLocale("en", "BD")).toBe("en");
  });

  it("keeps complete key parity across supported locales", () => {
    const englishKeys = Object.keys(translationCatalog("en")).sort();
    for (const locale of supportedLocales) expect(Object.keys(translationCatalog(locale)).sort()).toEqual(englishKeys);
    expect(translate("bn", "plain.hs_code")).toContain("HS");
  });
});
