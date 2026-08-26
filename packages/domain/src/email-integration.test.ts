import { describe, expect, it } from "vitest";
import { emailProviderCatalog, providerForEmailConnection } from "./email-integration";

describe("email provider catalog", () => {
  it("uses the reviewed provider-specific endpoints", () => {
    expect(providerForEmailConnection("google").inboundEndpoint).toBe("https://gmail.googleapis.com/gmail/v1");
    expect(providerForEmailConnection("microsoft").inboundEndpoint).toBe("https://graph.microsoft.com/v1.0");
    expect(providerForEmailConnection("icloud").inboundEndpoint).toBe("imap.mail.me.com:993");
  });

  it("never carries customer secrets in catalog definitions", () => {
    for (const provider of emailProviderCatalog) {
      expect("password" in provider).toBe(false);
      expect("clientSecret" in provider).toBe(false);
      expect("accessToken" in provider).toBe(false);
    }
  });
});
