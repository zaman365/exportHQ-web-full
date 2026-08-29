import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildEvidenceObjectKey,
  EvidenceVault,
  issueEvidenceCapability,
  verifyEvidenceCapability,
  type EvidenceObjectBody,
  type EvidenceObjectMetadata,
  type PrivateEvidenceBucket
} from "./index";

const organizationId = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const documentId = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
const documentVersionId = "d9428888-122b-4f22-b6a9-6e0c490aeac4";
const capabilityId = "794b9f30-aeec-4ba5-b3ae-0d91b9f86331";
const secret = "synthetic-test-secret-at-least-32-bytes-long";

class MemoryBucket implements PrivateEvidenceBucket {
  readonly objects = new Map<string, { bytes: ArrayBuffer; metadata: EvidenceObjectMetadata }>();

  async put(key: string, value: ArrayBuffer): Promise<EvidenceObjectMetadata> {
    const metadata = { key, size: value.byteLength, etag: "synthetic-etag", version: crypto.randomUUID() };
    this.objects.set(key, { bytes: value.slice(0), metadata });
    return metadata;
  }

  async get(key: string): Promise<EvidenceObjectBody | null> {
    const stored = this.objects.get(key);
    return stored ? { ...stored.metadata, arrayBuffer: async () => stored.bytes.slice(0) } : null;
  }

  async head(key: string): Promise<EvidenceObjectMetadata | null> {
    return this.objects.get(key)?.metadata ?? null;
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }
}

function pdfBytes(): ArrayBuffer {
  return new TextEncoder().encode("%PDF-1.7\nsynthetic evidence").buffer;
}

function sha256(bytes: ArrayBuffer): string {
  return createHash("sha256").update(new Uint8Array(bytes)).digest("hex");
}

describe("evidence vault", () => {
  it("issues operation-, tenant- and object-scoped short-lived capabilities", async () => {
    const objectKey = buildEvidenceObjectKey({ organizationId, documentId, documentVersionId });
    const token = await issueEvidenceCapability({
      id: capabilityId,
      action: "upload_quarantine",
      organizationId,
      documentVersionId,
      objectKey,
      mimeType: "application/pdf",
      maximumBytes: 1024,
      expiresAt: 2_000
    }, secret);
    await expect(verifyEvidenceCapability(token, secret, {
      action: "upload_quarantine",
      organizationId,
      objectKey,
      now: 1_000
    })).resolves.toMatchObject({ id: capabilityId, documentVersionId });
    await expect(verifyEvidenceCapability(token, secret, {
      action: "download_clean",
      organizationId,
      objectKey,
      now: 1_000
    })).rejects.toThrow("does not permit");
    await expect(verifyEvidenceCapability(token, secret, {
      action: "upload_quarantine",
      organizationId: documentId,
      objectKey,
      now: 1_000
    })).rejects.toThrow("another tenant or object");
  });

  it("stages only validated bytes in quarantine and promotes clean evidence", async () => {
    const quarantine = new MemoryBucket();
    const clean = new MemoryBucket();
    const rejected = new MemoryBucket();
    const vault = new EvidenceVault({ quarantine, clean, rejected });
    const objectKey = buildEvidenceObjectKey({ organizationId, documentId, documentVersionId });
    const bytes = pdfBytes();
    const checksum = sha256(bytes);
    await vault.stageQuarantine({
      organizationId,
      documentVersionId,
      objectKey,
      mimeType: "application/pdf",
      bytes,
      sha256: checksum
    });
    expect(await quarantine.head(objectKey)).not.toBeNull();
    await vault.promoteClean({ organizationId, objectKey, mimeType: "application/pdf", sha256: checksum });
    expect(await quarantine.head(objectKey)).toBeNull();
    expect(await clean.head(objectKey)).not.toBeNull();
  });

  it("rejects spoofed media types and checksum mismatches", async () => {
    const bucket = new MemoryBucket();
    const vault = new EvidenceVault({ quarantine: bucket, clean: new MemoryBucket(), rejected: new MemoryBucket() });
    const objectKey = buildEvidenceObjectKey({ organizationId, documentId, documentVersionId });
    const bytes = new TextEncoder().encode("not a PDF").buffer;
    await expect(vault.stageQuarantine({
      organizationId,
      documentVersionId,
      objectKey,
      mimeType: "application/pdf",
      bytes,
      sha256: sha256(bytes)
    })).rejects.toThrow("file signature");

    const valid = pdfBytes();
    await expect(vault.stageQuarantine({
      organizationId,
      documentVersionId,
      objectKey,
      mimeType: "application/pdf",
      bytes: valid,
      sha256: "0".repeat(64)
    })).rejects.toThrow("checksum");
  });
});
