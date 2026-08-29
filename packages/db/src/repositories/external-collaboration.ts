import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { authorizeGuestResource, type GuestPurpose } from "@exporthq/domain";
import { assertReviewedApiScope } from "@exporthq/platform";
import { recordAuditEvent } from "../audit";
import {
  customerApiClients,
  customerWebhookDeliveries,
  customerWebhookSubscriptions,
  externalGuestGrants
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

const allowedGuestTypes = new Set(["buyer", "forwarder", "cf_agent", "inspector"] as const);
const allowedGuestPermissions = new Set(["read", "comment", "upload_approved_evidence"] as const);
const allowedWebhookEvents = new Set(["shipment.updated", "shipment.exception_opened", "invoice.issued", "payment.confirmed", "document.approved"] as const);

export async function createExternalGuestGrant(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly guestActorId: string;
    readonly guestType: "buyer" | "forwarder" | "cf_agent" | "inspector";
    readonly purpose: GuestPurpose;
    readonly resourceType: string;
    readonly resourceId: string;
    readonly permissions: readonly ("read" | "comment" | "upload_approved_evidence")[];
    readonly expiresAt: Date;
  },
  now = new Date()
): Promise<string> {
  if (!allowedGuestTypes.has(input.guestType)) throw new Error("External guest type is not reviewed.");
  if (input.expiresAt <= now || input.expiresAt.getTime() - now.getTime() > 30 * 24 * 60 * 60_000) throw new Error("External guest grant must expire within 30 days.");
  const permissions = [...new Set(input.permissions)];
  if (!permissions.length || permissions.some((permission) => !allowedGuestPermissions.has(permission))) throw new Error("External guest permissions are not reviewed.");
  const [row] = await tx.insert(externalGuestGrants).values({
    organizationId: context.organizationId,
    guestActorId: requiredText(input.guestActorId, "Guest actor"),
    guestType: input.guestType,
    purpose: input.purpose,
    resourceType: requiredText(input.resourceType, "Guest resource type"),
    resourceId: input.resourceId,
    permissions,
    expiresAt: input.expiresAt,
    createdBy: context.actorId
  }).returning({ id: externalGuestGrants.id });
  if (!row) throw new Error("External guest grant was not created.");
  await recordAuditEvent(tx, context, { action: "external_guest.grant_created", entityType: "external_guest_grant", entityId: row.id, metadata: { guestType: input.guestType, purpose: input.purpose, resourceType: input.resourceType, resourceId: input.resourceId, permissions } });
  return row.id;
}

export async function acceptExternalGuestGrant(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly grantId: string; readonly guestActorId: string },
  now = new Date()
): Promise<void> {
  const [row] = await tx.update(externalGuestGrants).set({ status: "active", acceptedAt: now, updatedAt: now }).where(and(
    eq(externalGuestGrants.organizationId, context.organizationId),
    eq(externalGuestGrants.id, input.grantId),
    eq(externalGuestGrants.guestActorId, input.guestActorId),
    eq(externalGuestGrants.status, "pending"),
    gt(externalGuestGrants.expiresAt, now)
  )).returning({ id: externalGuestGrants.id });
  if (!row) throw new Error("Pending external guest grant was not found.");
  await recordAuditEvent(tx, context, { action: "external_guest.grant_accepted", entityType: "external_guest_grant", entityId: input.grantId });
}

export async function revokeExternalGuestGrant(
  tx: ExportHqTransaction,
  context: TenantContext,
  grantId: string,
  now = new Date()
): Promise<void> {
  const [row] = await tx.update(externalGuestGrants).set({ status: "revoked", revokedBy: context.actorId, revokedAt: now, updatedAt: now }).where(and(
    eq(externalGuestGrants.organizationId, context.organizationId), eq(externalGuestGrants.id, grantId), isNull(externalGuestGrants.revokedAt)
  )).returning({ id: externalGuestGrants.id });
  if (!row) throw new Error("Revocable external guest grant was not found.");
  await recordAuditEvent(tx, context, { action: "external_guest.grant_revoked", entityType: "external_guest_grant", entityId: grantId });
}

export async function authorizeExternalGuest(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly guestActorId: string; readonly resourceType: string; readonly resourceId: string; readonly permission: "read" | "comment" | "upload_approved_evidence" },
  now = new Date()
): Promise<void> {
  const [grant] = await tx.select().from(externalGuestGrants).where(and(
    eq(externalGuestGrants.organizationId, context.organizationId),
    eq(externalGuestGrants.guestActorId, input.guestActorId),
    eq(externalGuestGrants.resourceType, input.resourceType),
    eq(externalGuestGrants.resourceId, input.resourceId),
    eq(externalGuestGrants.status, "active"),
    gt(externalGuestGrants.expiresAt, now),
    sql`${input.permission} = any(${externalGuestGrants.permissions})`
  )).limit(1);
  if (!grant) throw new Error("No exact external guest grant covers this request.");
  authorizeGuestResource({ grantStatus: grant.status as "active", expiresAt: grant.expiresAt, grantedResourceType: grant.resourceType, grantedResourceId: grant.resourceId, requestedResourceType: input.resourceType, requestedResourceId: input.resourceId, now });
}

export async function createCustomerApiClient(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly name: string; readonly clientKey: string; readonly secretHashSha256: string; readonly scopes: readonly string[]; readonly rateLimitPerMinute: number; readonly expiresAt: Date },
  now = new Date()
): Promise<string> {
  if (input.expiresAt <= now || input.expiresAt.getTime() - now.getTime() > 365 * 24 * 60 * 60_000) throw new Error("Customer API client must expire within one year.");
  if (!Number.isSafeInteger(input.rateLimitPerMinute) || input.rateLimitPerMinute < 1 || input.rateLimitPerMinute > 600) throw new Error("Customer API rate limit must be between 1 and 600 requests per minute.");
  const scopes = [...new Set(input.scopes)];
  if (!scopes.length) throw new Error("Customer API client requires at least one reviewed scope.");
  scopes.forEach(assertReviewedApiScope);
  const [row] = await tx.insert(customerApiClients).values({
    organizationId: context.organizationId,
    name: requiredText(input.name, "Customer API client name"),
    clientKey: requiredText(input.clientKey, "Customer API client key"),
    secretHashSha256: sha256(input.secretHashSha256),
    scopes,
    rateLimitPerMinute: input.rateLimitPerMinute,
    expiresAt: input.expiresAt,
    lastRotatedAt: now,
    createdBy: context.actorId
  }).returning({ id: customerApiClients.id });
  if (!row) throw new Error("Customer API client was not created.");
  await recordAuditEvent(tx, context, { action: "customer_api.client_created", entityType: "customer_api_client", entityId: row.id, metadata: { scopes, rateLimitPerMinute: input.rateLimitPerMinute } });
  return row.id;
}

export async function rotateCustomerApiSecret(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly clientId: string; readonly secretHashSha256: string },
  now = new Date()
): Promise<number> {
  const [row] = await tx.update(customerApiClients).set({ secretHashSha256: sha256(input.secretHashSha256), secretVersion: sql`${customerApiClients.secretVersion} + 1`, lastRotatedAt: now, updatedAt: now }).where(and(
    eq(customerApiClients.organizationId, context.organizationId), eq(customerApiClients.id, input.clientId), eq(customerApiClients.status, "active"), gt(customerApiClients.expiresAt, now)
  )).returning({ version: customerApiClients.secretVersion });
  if (!row) throw new Error("Active customer API client was not found.");
  await recordAuditEvent(tx, context, { action: "customer_api.secret_rotated", entityType: "customer_api_client", entityId: input.clientId, metadata: { secretVersion: row.version } });
  return row.version;
}

export async function revokeCustomerApiClient(
  tx: ExportHqTransaction,
  context: TenantContext,
  clientId: string,
  now = new Date()
): Promise<void> {
  const [row] = await tx.update(customerApiClients).set({ status: "revoked", updatedAt: now }).where(and(eq(customerApiClients.organizationId, context.organizationId), eq(customerApiClients.id, clientId))).returning({ id: customerApiClients.id });
  if (!row) throw new Error("Customer API client was not found.");
  await tx.update(customerWebhookSubscriptions).set({ status: "revoked", updatedAt: now }).where(and(eq(customerWebhookSubscriptions.organizationId, context.organizationId), eq(customerWebhookSubscriptions.apiClientId, clientId)));
  await recordAuditEvent(tx, context, { action: "customer_api.client_revoked", entityType: "customer_api_client", entityId: clientId });
}

export async function createCustomerWebhookSubscription(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly apiClientId: string; readonly endpointUrl: string; readonly eventTypes: readonly string[]; readonly signingSecretRef: string },
  now = new Date()
): Promise<string> {
  const endpoint = new URL(input.endpointUrl);
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.hash) throw new Error("Customer webhook endpoint must be a credential-free HTTPS URL.");
  const eventTypes = [...new Set(input.eventTypes)];
  if (!eventTypes.length || eventTypes.some((event) => !allowedWebhookEvents.has(event as never))) throw new Error("Customer webhook event type is not reviewed.");
  const [client] = await tx.select({ id: customerApiClients.id }).from(customerApiClients).where(and(
    eq(customerApiClients.organizationId, context.organizationId), eq(customerApiClients.id, input.apiClientId), eq(customerApiClients.status, "active"), gt(customerApiClients.expiresAt, now)
  )).limit(1);
  if (!client) throw new Error("Active customer API client was not found for the webhook.");
  const [row] = await tx.insert(customerWebhookSubscriptions).values({
    organizationId: context.organizationId,
    apiClientId: input.apiClientId,
    endpointUrl: endpoint.toString(),
    eventTypes,
    signingSecretRef: secretRef(input.signingSecretRef),
    lastRotatedAt: now,
    createdBy: context.actorId
  }).returning({ id: customerWebhookSubscriptions.id });
  if (!row) throw new Error("Customer webhook subscription was not created.");
  await recordAuditEvent(tx, context, { action: "customer_webhook.subscription_created", entityType: "customer_webhook_subscription", entityId: row.id, metadata: { endpointOrigin: endpoint.origin, eventTypes } });
  return row.id;
}

export async function verifyCustomerWebhookSubscription(
  tx: ExportHqTransaction,
  context: TenantContext,
  subscriptionId: string,
  now = new Date()
): Promise<void> {
  requireOperations(context, "verify a customer webhook subscription");
  const [row] = await tx.update(customerWebhookSubscriptions).set({ status: "active", verifiedAt: now, updatedAt: now }).where(and(
    eq(customerWebhookSubscriptions.organizationId, context.organizationId), eq(customerWebhookSubscriptions.id, subscriptionId), eq(customerWebhookSubscriptions.status, "pending_verification")
  )).returning({ id: customerWebhookSubscriptions.id });
  if (!row) throw new Error("Pending customer webhook subscription was not found.");
  await recordAuditEvent(tx, context, { action: "customer_webhook.subscription_verified", entityType: "customer_webhook_subscription", entityId: subscriptionId });
}

export async function rotateCustomerWebhookSecret(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly subscriptionId: string; readonly signingSecretRef: string },
  now = new Date()
): Promise<number> {
  const [row] = await tx.update(customerWebhookSubscriptions).set({ signingSecretRef: secretRef(input.signingSecretRef), secretVersion: sql`${customerWebhookSubscriptions.secretVersion} + 1`, lastRotatedAt: now, updatedAt: now }).where(and(
    eq(customerWebhookSubscriptions.organizationId, context.organizationId), eq(customerWebhookSubscriptions.id, input.subscriptionId), sql`${customerWebhookSubscriptions.status} <> 'revoked'`
  )).returning({ version: customerWebhookSubscriptions.secretVersion });
  if (!row) throw new Error("Rotatable customer webhook subscription was not found.");
  await recordAuditEvent(tx, context, { action: "customer_webhook.secret_rotated", entityType: "customer_webhook_subscription", entityId: input.subscriptionId, metadata: { secretVersion: row.version } });
  return row.version;
}

export async function queueCustomerWebhookDelivery(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly subscriptionId: string; readonly eventType: string; readonly resourceType: string; readonly resourceId: string; readonly payloadHashSha256: string; readonly replayNonce: string; readonly idempotencyKey: string },
  now = new Date()
): Promise<string> {
  requireOperations(context, "queue a customer webhook delivery");
  const [subscription] = await tx.select({ secretVersion: customerWebhookSubscriptions.secretVersion, eventTypes: customerWebhookSubscriptions.eventTypes }).from(customerWebhookSubscriptions).where(and(
    eq(customerWebhookSubscriptions.organizationId, context.organizationId), eq(customerWebhookSubscriptions.id, input.subscriptionId), eq(customerWebhookSubscriptions.status, "active")
  )).limit(1);
  if (!subscription || !subscription.eventTypes.includes(input.eventType)) throw new Error("Active customer webhook subscription does not cover this event.");
  const [row] = await tx.insert(customerWebhookDeliveries).values({
    organizationId: context.organizationId,
    subscriptionId: input.subscriptionId,
    eventType: input.eventType,
    resourceType: requiredText(input.resourceType, "Customer webhook resource type"),
    resourceId: input.resourceId,
    payloadHashSha256: sha256(input.payloadHashSha256),
    secretVersion: subscription.secretVersion,
    replayNonce: requiredText(input.replayNonce, "Customer webhook replay nonce"),
    idempotencyKey: requiredText(input.idempotencyKey, "Customer webhook idempotency key"),
    signedAt: now
  }).onConflictDoNothing({ target: [customerWebhookDeliveries.organizationId, customerWebhookDeliveries.idempotencyKey] }).returning({ id: customerWebhookDeliveries.id });
  if (row) return row.id;
  const [existing] = await tx.select({ id: customerWebhookDeliveries.id, payloadHashSha256: customerWebhookDeliveries.payloadHashSha256 }).from(customerWebhookDeliveries).where(and(
    eq(customerWebhookDeliveries.organizationId, context.organizationId), eq(customerWebhookDeliveries.idempotencyKey, input.idempotencyKey)
  )).limit(1);
  if (!existing || existing.payloadHashSha256 !== input.payloadHashSha256) throw new Error("Customer webhook idempotency key conflicts with another payload.");
  return existing.id;
}

export async function recordCustomerWebhookOutcome(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly deliveryId: string; readonly delivered: boolean; readonly retryable: boolean; readonly failureCode?: string | null },
  now = new Date()
): Promise<void> {
  requireOperations(context, "record a customer webhook outcome");
  const [current] = await tx.select({ attempts: customerWebhookDeliveries.attempts }).from(customerWebhookDeliveries).where(and(
    eq(customerWebhookDeliveries.organizationId, context.organizationId), eq(customerWebhookDeliveries.id, input.deliveryId)
  )).for("update").limit(1);
  if (!current || current.attempts >= 6) throw new Error("Deliverable customer webhook record was not found.");
  const attempts = current.attempts + 1;
  const status = input.delivered ? "delivered" : input.retryable && attempts < 6 ? "retryable_failure" : "dead_letter";
  await tx.update(customerWebhookDeliveries).set({ status, attempts, deliveredAt: input.delivered ? now : null, lastFailureCode: input.delivered ? null : requiredText(input.failureCode ?? "unspecified", "Customer webhook failure code") }).where(and(
    eq(customerWebhookDeliveries.organizationId, context.organizationId), eq(customerWebhookDeliveries.id, input.deliveryId)
  ));
}

function requireOperations(context: TenantContext, action: string): void {
  if (context.actorType === "customer") throw new Error(`Only reviewed operations may ${action}.`);
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function sha256(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error("A SHA-256 hash is required.");
  return normalized;
}

function secretRef(value: string): string {
  const normalized = value.trim();
  if (!normalized.startsWith("secret://") || /pending|todo|placeholder/i.test(normalized)) throw new Error("Customer webhook secret must use a final managed secret reference.");
  return normalized;
}
