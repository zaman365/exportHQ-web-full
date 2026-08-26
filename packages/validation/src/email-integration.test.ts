import { describe, expect, it } from "vitest";
import {
  mailboxConnectionIntentSchema,
  mailboxCredentialActivationSchema
} from "./index";

const organizationId = "11111111-1111-4111-8111-111111111111";

describe("mailbox integration contracts", () => {
  it("accepts provider intents without browser-supplied credentials", () => {
    const parsed = mailboxConnectionIntentSchema.parse({
      organizationId,
      provider: "google",
      emailAddress: "exports@example.com"
    });

    expect(parsed.provider).toBe("google");
    expect("password" in parsed).toBe(false);
    expect("accessToken" in parsed).toBe(false);
  });

  it("requires explicit reviewed server settings for a custom domain", () => {
    expect(mailboxConnectionIntentSchema.safeParse({
      organizationId,
      provider: "custom_imap",
      emailAddress: "exports@example.com"
    }).success).toBe(false);

    expect(mailboxConnectionIntentSchema.safeParse({
      organizationId,
      provider: "custom_imap",
      emailAddress: "exports@example.com",
      customServer: {
        imapHost: "imap.example.com",
        imapPort: 993,
        imapSecurity: "tls",
        smtpHost: "smtp.example.com",
        smtpPort: 587,
        smtpSecurity: "starttls"
      }
    }).success).toBe(true);
  });

  it("keeps the credential activation boundary server-side", () => {
    const parsed = mailboxCredentialActivationSchema.parse({
      organizationId,
      connectionId: "22222222-2222-4222-8222-222222222222",
      credentialSecretRef: "vault://email/connections/2222",
      grantedScopes: ["gmail.modify", "gmail.send"]
    });

    expect(parsed.credentialSecretRef).toContain("vault://");
  });
});
