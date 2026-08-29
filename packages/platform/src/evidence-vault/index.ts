const approvedEvidenceTypes = ["application/pdf", "image/jpeg", "image/png"] as const;
export type ApprovedEvidenceType = typeof approvedEvidenceTypes[number];
export type EvidenceCapabilityAction = "upload_quarantine" | "download_clean";
export const maximumEvidenceBytes = 25 * 1024 * 1024;

export interface EvidenceCapabilityClaims {
  readonly version: 1;
  readonly id: string;
  readonly action: EvidenceCapabilityAction;
  readonly organizationId: string;
  readonly documentVersionId: string;
  readonly objectKey: string;
  readonly mimeType: ApprovedEvidenceType;
  readonly maximumBytes: number;
  readonly expiresAt: number;
}

export interface EvidenceObjectMetadata {
  readonly key: string;
  readonly size: number;
  readonly etag: string;
  readonly version: string;
}

export interface EvidenceObjectBody extends EvidenceObjectMetadata {
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface PrivateEvidenceBucket {
  put(
    key: string,
    value: ArrayBuffer,
    options: {
      readonly httpMetadata: { readonly contentType: string; readonly contentDisposition: string };
      readonly customMetadata: Readonly<Record<string, string>>;
      readonly sha256: string;
    }
  ): Promise<EvidenceObjectMetadata | null>;
  get(key: string): Promise<EvidenceObjectBody | null>;
  head(key: string): Promise<EvidenceObjectMetadata | null>;
  delete(key: string): Promise<void>;
}

export interface EvidenceVaultBuckets {
  readonly quarantine: PrivateEvidenceBucket;
  readonly clean: PrivateEvidenceBucket;
  readonly rejected: PrivateEvidenceBucket;
}

export interface StagedEvidenceObject {
  readonly object: EvidenceObjectMetadata;
  readonly sha256: string;
}

export function validateEvidenceUpload(input: {
  readonly mimeType: string;
  readonly byteSize: number;
  readonly sha256: string;
}): asserts input is { readonly mimeType: ApprovedEvidenceType; readonly byteSize: number; readonly sha256: string } {
  if (!approvedEvidenceTypes.includes(input.mimeType as ApprovedEvidenceType)) {
    throw new Error("Evidence must be a PDF, JPEG or PNG file.");
  }
  if (!Number.isInteger(input.byteSize) || input.byteSize <= 0 || input.byteSize > maximumEvidenceBytes) {
    throw new Error("Evidence must be between 1 byte and 25 MB.");
  }
  if (!/^[a-f0-9]{64}$/i.test(input.sha256)) throw new Error("A valid SHA-256 checksum is required.");
}

export function assertEvidenceMagicBytes(mimeType: ApprovedEvidenceType, value: ArrayBuffer): void {
  const bytes = new Uint8Array(value.slice(0, 12));
  const matches = mimeType === "application/pdf"
    ? startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])
    : mimeType === "image/png"
      ? startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      : startsWith(bytes, [0xff, 0xd8, 0xff]);
  if (!matches) throw new Error("The file signature does not match the declared media type.");
}

export function buildEvidenceObjectKey(input: {
  readonly organizationId: string;
  readonly documentId: string;
  readonly documentVersionId: string;
}): string {
  const organizationId = uuid(input.organizationId, "Organization");
  const documentId = uuid(input.documentId, "Document");
  const documentVersionId = uuid(input.documentVersionId, "Document version");
  return `organizations/${organizationId}/documents/${documentId}/versions/${documentVersionId}`;
}

export function assertTenantEvidenceObjectKey(objectKey: string, organizationId: string): void {
  const expectedPrefix = `organizations/${uuid(organizationId, "Organization")}/documents/`;
  if (!objectKey.startsWith(expectedPrefix) || objectKey.includes("..") || objectKey.startsWith("/")) {
    throw new Error("Evidence object key is outside the authorized organization namespace.");
  }
}

export async function issueEvidenceCapability(
  claims: Omit<EvidenceCapabilityClaims, "version">,
  secret: string
): Promise<string> {
  assertCapabilityClaims({ ...claims, version: 1 });
  const encoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ ...claims, version: 1 })));
  const signature = await sign(encoded, secret);
  return `${encoded}.${base64UrlEncode(signature)}`;
}

export async function verifyEvidenceCapability(
  token: string,
  secret: string,
  expected: {
    readonly action: EvidenceCapabilityAction;
    readonly organizationId: string;
    readonly objectKey: string;
    readonly now: number;
  }
): Promise<EvidenceCapabilityClaims> {
  const [encoded, encodedSignature, extra] = token.split(".");
  if (!encoded || !encodedSignature || extra) throw new Error("Evidence capability is malformed.");
  const signature = base64UrlDecode(encodedSignature);
  if (!(await verifySignature(encoded, signature, secret))) throw new Error("Evidence capability signature is invalid.");
  let claims: EvidenceCapabilityClaims;
  try {
    claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(encoded))) as EvidenceCapabilityClaims;
  } catch {
    throw new Error("Evidence capability payload is invalid.");
  }
  assertCapabilityClaims(claims);
  if (claims.expiresAt <= expected.now) throw new Error("Evidence capability has expired.");
  if (claims.action !== expected.action) throw new Error("Evidence capability does not permit this operation.");
  if (claims.organizationId !== expected.organizationId || claims.objectKey !== expected.objectKey) {
    throw new Error("Evidence capability cannot be reused for another tenant or object.");
  }
  return claims;
}

export class EvidenceVault {
  constructor(private readonly buckets: EvidenceVaultBuckets) {}

  async stageQuarantine(input: {
    readonly organizationId: string;
    readonly documentVersionId: string;
    readonly objectKey: string;
    readonly mimeType: string;
    readonly bytes: ArrayBuffer;
    readonly sha256: string;
  }): Promise<StagedEvidenceObject> {
    assertTenantEvidenceObjectKey(input.objectKey, input.organizationId);
    const upload = { mimeType: input.mimeType, byteSize: input.bytes.byteLength, sha256: input.sha256 };
    validateEvidenceUpload(upload);
    assertEvidenceMagicBytes(upload.mimeType, input.bytes);
    const calculated = await sha256Hex(input.bytes);
    if (calculated !== input.sha256.toLowerCase()) throw new Error("Evidence checksum does not match the uploaded bytes.");
    const object = await this.buckets.quarantine.put(input.objectKey, input.bytes, {
      httpMetadata: {
        contentType: upload.mimeType,
        contentDisposition: "attachment"
      },
      customMetadata: {
        organizationId: input.organizationId,
        documentVersionId: input.documentVersionId,
        classification: "customer-confidential"
      },
      sha256: calculated
    });
    if (!object) throw new Error("Quarantine storage did not confirm the upload.");
    if (object.size !== input.bytes.byteLength) throw new Error("Quarantine storage size does not match the upload.");
    return { object, sha256: calculated };
  }

  async promoteClean(input: {
    readonly organizationId: string;
    readonly objectKey: string;
    readonly mimeType: ApprovedEvidenceType;
    readonly sha256: string;
  }): Promise<EvidenceObjectMetadata> {
    assertTenantEvidenceObjectKey(input.objectKey, input.organizationId);
    const quarantined = await this.buckets.quarantine.get(input.objectKey);
    if (!quarantined) throw new Error("Quarantined evidence was not found.");
    if (quarantined.size > maximumEvidenceBytes) throw new Error("Quarantined evidence exceeds the allowed size.");
    const bytes = await quarantined.arrayBuffer();
    assertEvidenceMagicBytes(input.mimeType, bytes);
    if (await sha256Hex(bytes) !== input.sha256.toLowerCase()) throw new Error("Quarantined evidence checksum changed before promotion.");
    const clean = await this.buckets.clean.put(input.objectKey, bytes, {
      httpMetadata: { contentType: input.mimeType, contentDisposition: "attachment" },
      customMetadata: { classification: "customer-confidential" },
      sha256: input.sha256.toLowerCase()
    });
    if (!clean) throw new Error("Clean storage did not confirm the promotion.");
    await this.buckets.quarantine.delete(input.objectKey);
    return clean;
  }

  async reject(input: {
    readonly organizationId: string;
    readonly objectKey: string;
    readonly mimeType: ApprovedEvidenceType;
    readonly sha256: string;
  }): Promise<EvidenceObjectMetadata> {
    assertTenantEvidenceObjectKey(input.objectKey, input.organizationId);
    const quarantined = await this.buckets.quarantine.get(input.objectKey);
    if (!quarantined) throw new Error("Quarantined evidence was not found.");
    const bytes = await quarantined.arrayBuffer();
    if (await sha256Hex(bytes) !== input.sha256.toLowerCase()) throw new Error("Quarantined evidence checksum changed before rejection.");
    const rejected = await this.buckets.rejected.put(input.objectKey, bytes, {
      httpMetadata: { contentType: input.mimeType, contentDisposition: "attachment" },
      customMetadata: { classification: "customer-confidential" },
      sha256: input.sha256.toLowerCase()
    });
    if (!rejected) throw new Error("Rejected storage did not confirm the move.");
    await this.buckets.quarantine.delete(input.objectKey);
    return rejected;
  }
}

async function sha256Hex(value: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assertCapabilityClaims(claims: EvidenceCapabilityClaims): void {
  if (claims.version !== 1) throw new Error("Evidence capability version is unsupported.");
  uuid(claims.id, "Capability");
  uuid(claims.organizationId, "Organization");
  uuid(claims.documentVersionId, "Document version");
  assertTenantEvidenceObjectKey(claims.objectKey, claims.organizationId);
  if (!approvedEvidenceTypes.includes(claims.mimeType)) throw new Error("Evidence capability media type is invalid.");
  if (!Number.isInteger(claims.maximumBytes) || claims.maximumBytes <= 0 || claims.maximumBytes > maximumEvidenceBytes) {
    throw new Error("Evidence capability size is invalid.");
  }
  if (!Number.isSafeInteger(claims.expiresAt) || claims.expiresAt <= 0) throw new Error("Evidence capability expiry is invalid.");
}

async function sign(value: string, secret: string): Promise<ArrayBuffer> {
  const key = await hmacKey(secret);
  return crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
}

async function verifySignature(value: string, signature: Uint8Array<ArrayBuffer>, secret: string): Promise<boolean> {
  const key = await hmacKey(secret);
  return crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(value));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  if (new TextEncoder().encode(secret).byteLength < 32) throw new Error("Evidence capability secret must be at least 32 bytes.");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function base64UrlEncode(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function startsWith(actual: Uint8Array, expected: readonly number[]): boolean {
  return expected.every((value, index) => actual[index] === value);
}

function uuid(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) {
    throw new Error(`${label} identifier must be a UUID.`);
  }
  return normalized;
}
