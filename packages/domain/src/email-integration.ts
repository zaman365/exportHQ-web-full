export type EmailProviderId =
  | "google"
  | "microsoft"
  | "yahoo_aol"
  | "icloud"
  | "zoho"
  | "custom_imap";

export type EmailAuthStrategy = "oauth2" | "app_password" | "oauth2_or_app_password";
export type EmailTransportStrategy = "rest" | "imap_smtp" | "rest_or_imap_smtp";
export type EmailChangeDelivery = "pubsub" | "webhook" | "imap_idle_with_polling";

export interface EmailProviderDefinition {
  id: EmailProviderId;
  name: string;
  shortName: string;
  description: string;
  auth: EmailAuthStrategy;
  transport: EmailTransportStrategy;
  changeDelivery: EmailChangeDelivery;
  inboundEndpoint: string;
  outboundEndpoint: string;
  setupNote: string;
  oauthScopes?: readonly string[];
}

/**
 * Adapter metadata only. It contains no customer credentials and does not
 * imply that ExportPanel's production OAuth applications are activated.
 */
export const emailProviderCatalog: readonly EmailProviderDefinition[] = [
  {
    id: "google",
    name: "Gmail / Google Workspace",
    shortName: "G",
    description: "Google-hosted personal or company mail through the Gmail API.",
    auth: "oauth2",
    transport: "rest",
    changeDelivery: "pubsub",
    inboundEndpoint: "https://gmail.googleapis.com/gmail/v1",
    outboundEndpoint: "https://gmail.googleapis.com/gmail/v1",
    setupNote: "Uses Google consent, narrow Gmail scopes, Pub/Sub notifications, and history-based catch-up.",
    oauthScopes: [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send"
    ]
  },
  {
    id: "microsoft",
    name: "Outlook / Microsoft 365",
    shortName: "M",
    description: "Consumer Outlook, Hotmail, and Microsoft 365 mail through Microsoft Graph.",
    auth: "oauth2",
    transport: "rest",
    changeDelivery: "webhook",
    inboundEndpoint: "https://graph.microsoft.com/v1.0",
    outboundEndpoint: "https://graph.microsoft.com/v1.0",
    setupNote: "Uses delegated Graph permissions, renewable subscriptions, lifecycle handling, and delta catch-up.",
    oauthScopes: ["offline_access", "Mail.ReadWrite", "Mail.Send"]
  },
  {
    id: "yahoo_aol",
    name: "Yahoo Mail / AOL",
    shortName: "Y",
    description: "Yahoo and AOL mail over standards-based IMAP and SMTP with Yahoo authorization where approved.",
    auth: "oauth2_or_app_password",
    transport: "imap_smtp",
    changeDelivery: "imap_idle_with_polling",
    inboundEndpoint: "imap.mail.yahoo.com:993",
    outboundEndpoint: "smtp.mail.yahoo.com:465",
    setupNote: "Mail scopes are restricted by Yahoo. Activation requires approved access; app passwords are a fallback for eligible accounts.",
    oauthScopes: ["openid", "mail-r", "mail-w"]
  },
  {
    id: "icloud",
    name: "Apple iCloud Mail",
    shortName: "A",
    description: "iCloud mail using Apple's supported third-party authorization or an app-specific password.",
    auth: "oauth2_or_app_password",
    transport: "imap_smtp",
    changeDelivery: "imap_idle_with_polling",
    inboundEndpoint: "imap.mail.me.com:993",
    outboundEndpoint: "smtp.mail.me.com:587",
    setupNote: "Never use the primary Apple Account password. Unsupported clients require an app-specific password with two-factor authentication."
  },
  {
    id: "zoho",
    name: "Zoho Mail",
    shortName: "Z",
    description: "Zoho-hosted business mail through OAuth and its supported mail interfaces.",
    auth: "oauth2_or_app_password",
    transport: "rest_or_imap_smtp",
    changeDelivery: "imap_idle_with_polling",
    inboundEndpoint: "imap.zoho.com:993",
    outboundEndpoint: "smtp.zoho.com:465",
    setupNote: "Organization policy and data-center-specific endpoints must be confirmed during connection."
  },
  {
    id: "custom_imap",
    name: "Custom domain email",
    shortName: "@",
    description: "Standards-based IMAP and SMTP for a company domain or compatible hosted provider.",
    auth: "app_password",
    transport: "imap_smtp",
    changeDelivery: "imap_idle_with_polling",
    inboundEndpoint: "Customer-defined IMAP host (TLS)",
    outboundEndpoint: "Customer-defined SMTP host (TLS/STARTTLS)",
    setupNote: "Server settings are validated first; credentials go directly to the encrypted server vault and never enter browser storage."
  }
];

export type MailboxConnectionStatus =
  | "pending_authorization"
  | "connected"
  | "reauthorization_required"
  | "paused"
  | "disconnected";

export interface MailboxConnectionSummary {
  id: string;
  organizationId: string;
  provider: EmailProviderId;
  emailAddress: string;
  displayName: string;
  status: MailboxConnectionStatus;
  credentialSecretRef: string;
  grantedScopes: readonly string[];
  syncCursor?: string;
  subscriptionExpiresAt?: string;
  lastSuccessfulSyncAt?: string;
}

export interface EmailThreadSummary {
  id: string;
  organizationId: string;
  mailboxConnectionId: string;
  providerThreadId: string;
  subject: string;
  participants: readonly string[];
  snippet: string;
  latestMessageAt: string;
  unread: boolean;
  flagged: boolean;
  attachmentCount: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityLabel?: string;
}

export function providerForEmailConnection(id: EmailProviderId): EmailProviderDefinition {
  const provider = emailProviderCatalog.find((candidate) => candidate.id === id);
  if (!provider) throw new Error(`Unknown email provider: ${id}`);
  return provider;
}
