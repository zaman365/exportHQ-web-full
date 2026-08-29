import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildEvidenceObjectKey,
  EvidenceVault,
  expectedEvidencePartBytes,
  issueEvidenceCapability,
  minimumEvidenceMultipartPartBytes,
  planEvidenceUpload,
  verifyEvidenceCapability,
  type EvidenceUploadedPart,
  type MultipartPrivateEvidenceBucket,
  type EvidenceObjectBody,
  type EvidenceObjectMetadata,
  type PrivateEvidenceMultipartUpload,
  type PrivateEvidenceBucket
} from "./index";

const organizationId = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const documentId = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
const documentVersionId = "d9428888-122b-4f22-b6a9-6e0c490aeac4";
const capabilityId = "794b9f30-aeec-4ba5-b3ae-0d91b9f86331";
const secret = "synthetic-test-secret-at-least-32-bytes-long";

class MemoryBucket implements PrivateEvidenceBucket {
  readonly objects = new Map<string, { bytes: ArrayBuffer; metadata: EvidenceObjectMetadata }>();

  constructor(private readonly confirmPuts = true) {}

  async put(key: string, value: ArrayBuffer): Promise<EvidenceObjectMetadata | null> {
    if (!this.confirmPuts) return null;
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

class MultipartMemoryBucket extends MemoryBucket implements MultipartPrivateEvidenceBucket {
  readonly uploads = new Map<string, { key: string; parts: Map<number, ArrayBuffer> }>();

  async createMultipartUpload(key: string): Promise<PrivateEvidenceMultipartUpload> {
    const uploadId = crypto.randomUUID();
    this.uploads.set(uploadId, { key, parts: new Map() });
    return this.multipart(key, uploadId);
  }

  resumeMultipartUpload(key: string, uploadId: string): PrivateEvidenceMultipartUpload {
    return this.multipart(key, uploadId);
  }

  private multipart(key: string, uploadId: string): PrivateEvidenceMultipartUpload {
    return {
      key,
      uploadId,
      uploadPart: async (partNumber, value) => {
        const upload = this.uploads.get(uploadId);
        if (!upload || upload.key !== key) throw new Error("NoSuchUpload");
        upload.parts.set(partNumber, value.slice(0));
        return { partNumber, etag: sha256(value) };
      },
      abort: async () => {
        if (!this.uploads.delete(uploadId)) throw new Error("NoSuchUpload");
      },
      complete: async (parts: readonly EvidenceUploadedPart[]) => {
        const upload = this.uploads.get(uploadId);
        if (!upload || upload.key !== key) throw new Error("NoSuchUpload");
        const values = [...parts].sort((a, b) => a.partNumber - b.partNumber).map((part) => {
          const value = upload.parts.get(part.partNumber);
          if (!value || sha256(value) !== part.etag) throw new Error("InvalidPart");
          return new Uint8Array(value);
        });
        const bytes = new Uint8Array(values.reduce((total, value) => total + value.byteLength, 0));
        let offset = 0;
        for (const value of values) {
          bytes.set(value, offset);
          offset += value.byteLength;
        }
        this.uploads.delete(uploadId);
        const object = await this.put(key, bytes.buffer);
        if (!object) throw new Error("Multipart completion failed");
        return object;
      }
    };
  }
}

function pdfBytes(): ArrayBuffer {
  return new TextEncoder().encode("%PDF-1.7\nsynthetic evidence").buffer;
}

function sha256(bytes: ArrayBuffer): string {
  return createHash("sha256").update(new Uint8Array(bytes)).digest("hex");
}

describe("evidence vault", () => {
  it("plans low-data image preparation and fixed-size resumable parts", () => {
    const plan = planEvidenceUpload({
      mimeType: "image/jpeg",
      byteSize: minimumEvidenceMultipartPartBytes + 123,
      sha256: "a".repeat(64),
      lowDataMode: true
    });
    expect(plan).toEqual({
      strategy: "multipart",
      byteSize: minimumEvidenceMultipartPartBytes + 123,
      partSize: minimumEvidenceMultipartPartBytes,
      partCount: 2,
      clientPreparation: "reencode-image-if-smaller"
    });
    expect(expectedEvidencePartBytes(plan, 1)).toBe(minimumEvidenceMultipartPartBytes);
    expect(expectedEvidencePartBytes(plan, 2)).toBe(123);
    expect(() => expectedEvidencePartBytes(plan, 0)).toThrow("outside the upload plan");
  });

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
    await expect(verifyEvidenceCapability(token, secret, {
      action: "upload_quarantine",
      organizationId,
      objectKey,
      now: 2_000
    })).rejects.toThrow("expired");
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

  it("resumes multipart quarantine staging and verifies the complete object", async () => {
    const quarantine = new MultipartMemoryBucket();
    const vault = new EvidenceVault({ quarantine, clean: new MemoryBucket(), rejected: new MemoryBucket() });
    const objectKey = buildEvidenceObjectKey({ organizationId, documentId, documentVersionId });
    const bytes = new Uint8Array(minimumEvidenceMultipartPartBytes + 23);
    bytes.set(new TextEncoder().encode("%PDF-1.7\n"), 0);
    const checksum = sha256(bytes.buffer);
    const session = await vault.beginResumableQuarantine({
      organizationId,
      documentVersionId,
      objectKey,
      mimeType: "application/pdf",
      byteSize: bytes.byteLength,
      sha256: checksum,
      lowDataMode: true
    });
    const first = await vault.uploadResumableQuarantinePart({
      session,
      partNumber: 1,
      bytes: bytes.slice(0, session.partSize).buffer
    });
    const second = await vault.uploadResumableQuarantinePart({
      session,
      partNumber: 2,
      bytes: bytes.slice(session.partSize).buffer
    });
    await expect(vault.completeResumableQuarantine({
      organizationId,
      documentVersionId,
      mimeType: "application/pdf",
      sha256: checksum,
      session,
      parts: [second, first]
    })).resolves.toMatchObject({ sha256: checksum, object: { key: objectKey, size: bytes.byteLength } });
  });

  it("rejects malformed resumable parts and deletes a checksum-mismatched completion", async () => {
    const quarantine = new MultipartMemoryBucket();
    const vault = new EvidenceVault({ quarantine, clean: new MemoryBucket(), rejected: new MemoryBucket() });
    const objectKey = buildEvidenceObjectKey({ organizationId, documentId, documentVersionId });
    const bytes = new Uint8Array(minimumEvidenceMultipartPartBytes + 1);
    bytes.set(new TextEncoder().encode("%PDF-1.7\n"), 0);
    const session = await vault.beginResumableQuarantine({
      organizationId,
      documentVersionId,
      objectKey,
      mimeType: "application/pdf",
      byteSize: bytes.byteLength,
      sha256: "0".repeat(64)
    });
    await expect(vault.uploadResumableQuarantinePart({ session, partNumber: 1, bytes: new ArrayBuffer(1) }))
      .rejects.toThrow("exactly");
    const first = await vault.uploadResumableQuarantinePart({ session, partNumber: 1, bytes: bytes.slice(0, session.partSize).buffer });
    const second = await vault.uploadResumableQuarantinePart({ session, partNumber: 2, bytes: bytes.slice(session.partSize).buffer });
    await expect(vault.completeResumableQuarantine({
      organizationId,
      documentVersionId,
      mimeType: "application/pdf",
      sha256: "0".repeat(64),
      session,
      parts: [first, second]
    })).rejects.toThrow("completed resumable upload");
    expect(await quarantine.head(objectKey)).toBeNull();
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

  it("refuses oversized, cross-tenant, duplicate and interrupted staging", async () => {
    const quarantine = new MemoryBucket();
    const vault = new EvidenceVault({ quarantine, clean: new MemoryBucket(), rejected: new MemoryBucket() });
    const objectKey = buildEvidenceObjectKey({ organizationId, documentId, documentVersionId });
    const bytes = pdfBytes();
    await expect(vault.stageQuarantine({
      organizationId: documentId,
      documentVersionId,
      objectKey,
      mimeType: "application/pdf",
      bytes,
      sha256: sha256(bytes)
    })).rejects.toThrow("outside the authorized organization namespace");
    const oversized = new ArrayBuffer(25 * 1024 * 1024 + 1);
    await expect(vault.stageQuarantine({
      organizationId,
      documentVersionId,
      objectKey,
      mimeType: "application/pdf",
      bytes: oversized,
      sha256: "0".repeat(64)
    })).rejects.toThrow("between 1 byte and 25 MB");
    await vault.stageQuarantine({ organizationId, documentVersionId, objectKey, mimeType: "application/pdf", bytes, sha256: sha256(bytes) });
    await expect(vault.stageQuarantine({
      organizationId,
      documentVersionId,
      objectKey,
      mimeType: "application/pdf",
      bytes,
      sha256: sha256(bytes)
    })).rejects.toThrow("already exists");

    const interruptedKey = buildEvidenceObjectKey({ organizationId, documentId, documentVersionId: crypto.randomUUID() });
    const interrupted = new EvidenceVault({ quarantine: new MemoryBucket(false), clean: new MemoryBucket(), rejected: new MemoryBucket() });
    await expect(interrupted.stageQuarantine({
      organizationId,
      documentVersionId,
      objectKey: interruptedKey,
      mimeType: "application/pdf",
      bytes,
      sha256: sha256(bytes)
    })).rejects.toThrow("did not confirm");
  });

  it("moves scanner-rejected bytes out of quarantine without exposing them as clean", async () => {
    const quarantine = new MemoryBucket();
    const clean = new MemoryBucket();
    const rejected = new MemoryBucket();
    const vault = new EvidenceVault({ quarantine, clean, rejected });
    const objectKey = buildEvidenceObjectKey({ organizationId, documentId, documentVersionId });
    const bytes = pdfBytes();
    const checksum = sha256(bytes);
    await vault.stageQuarantine({ organizationId, documentVersionId, objectKey, mimeType: "application/pdf", bytes, sha256: checksum });
    await vault.reject({ organizationId, objectKey, mimeType: "application/pdf", sha256: checksum });
    expect(await quarantine.head(objectKey)).toBeNull();
    expect(await clean.head(objectKey)).toBeNull();
    expect(await rejected.head(objectKey)).not.toBeNull();
  });
});
