import { isHandledWebhookEvent, type HandledWebhookEventType } from "./webhook-signature";

type UnknownRecord = Record<string, unknown>;

export type ClerkProjectionCommand =
  | {
      readonly kind: "organization-upsert";
      readonly clerkOrganizationId: string;
      readonly slug: string;
      readonly legalName: string;
      readonly tradingName: string;
    }
  | { readonly kind: "organization-deactivate"; readonly clerkOrganizationId: string }
  | {
      readonly kind: "membership-upsert";
      readonly clerkOrganizationId: string;
      readonly clerkUserId: string;
      readonly role: string;
      readonly active: boolean;
    }
  | {
      readonly kind: "reconciliation-request";
      readonly scope: "membership" | "role" | "invitation" | "subscription";
      readonly clerkOrganizationId: string | null;
    }
  | { readonly kind: "ignored" };

export interface ParsedClerkEvent {
  readonly type: string;
  readonly handled: boolean;
  readonly command: ClerkProjectionCommand;
}

function record(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

function string(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function clerkOrganizationId(data: UnknownRecord): string | null {
  const direct = string(data.organization_id) ?? string(data.organizationId);
  if (direct) return direct;
  return string(record(data.organization).id);
}

function clerkUserId(data: UnknownRecord): string | null {
  return string(data.user_id)
    ?? string(data.userId)
    ?? string(record(data.public_user_data).user_id)
    ?? string(record(data.user).id);
}

function requireValue(value: string | null, label: string, type: string): string {
  if (value) return value;
  throw new Error(`Clerk ${type} event is missing ${label}.`);
}

function reviewedCommand(type: HandledWebhookEventType, data: UnknownRecord): ClerkProjectionCommand {
  if (type === "organization.created" || type === "organization.updated") {
    const id = requireValue(string(data.id), "organization id", type);
    const name = requireValue(string(data.name), "organization name", type);
    return {
      kind: "organization-upsert",
      clerkOrganizationId: id,
      slug: string(data.slug) ?? id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      legalName: name,
      tradingName: name
    };
  }

  if (type === "organization.deleted") {
    return {
      kind: "organization-deactivate",
      clerkOrganizationId: requireValue(string(data.id), "organization id", type)
    };
  }

  if (type.startsWith("organizationMembership.")) {
    return {
      kind: "membership-upsert",
      clerkOrganizationId: requireValue(clerkOrganizationId(data), "organization id", type),
      clerkUserId: requireValue(clerkUserId(data), "user id", type),
      role: string(data.role) ?? "org:member",
      active: type !== "organizationMembership.deleted"
    };
  }

  if (type.startsWith("organizationInvitation.")) {
    return { kind: "reconciliation-request", scope: "invitation", clerkOrganizationId: clerkOrganizationId(data) };
  }
  if (type.startsWith("role.")) {
    return { kind: "reconciliation-request", scope: "role", clerkOrganizationId: clerkOrganizationId(data) };
  }
  if (type.startsWith("subscription")) {
    // Billing-provider evidence never directly changes Export HQ entitlements.
    // A reconciliation worker compares it with the internal billing ledger.
    return { kind: "reconciliation-request", scope: "subscription", clerkOrganizationId: clerkOrganizationId(data) };
  }

  return { kind: "ignored" };
}

export function parseClerkEvent(payload: unknown): ParsedClerkEvent {
  const envelope = record(payload);
  const type = string(envelope.type) ?? "";
  if (!isHandledWebhookEvent(type)) return { type, handled: false, command: { kind: "ignored" } };
  return { type, handled: true, command: reviewedCommand(type, record(envelope.data)) };
}
