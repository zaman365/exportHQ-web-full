"use server";

import { acceptLegalDocument } from "@exporthq/db";
import { revalidatePath } from "next/cache";
import { getWorkspaceFeatureSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";

export type LegalAcceptanceActionResult = { readonly ok: boolean; readonly message: string };

export async function acceptEffectiveLegalDocument(
  _previous: LegalAcceptanceActionResult,
  formData: FormData
): Promise<LegalAcceptanceActionResult> {
  const session = await getWorkspaceFeatureSession("settings");
  if (!session.userId || !session.organizationId || session.isDemo) {
    return { ok: false, message: "Use a real signed-in organization workspace to record acceptance." };
  }
  const legalDocumentId = stringValue(formData, "legalDocumentId");
  const version = stringValue(formData, "version");
  const contentHashSha256 = stringValue(formData, "contentHashSha256");
  const confirmed = stringValue(formData, "confirmed") === "on";
  if (!legalDocumentId || !version || !/^[a-f0-9]{64}$/.test(contentHashSha256)) {
    return { ok: false, message: "The legal document identity, version or hash is invalid." };
  }
  if (!confirmed) return { ok: false, message: "Explicit confirmation is required before acceptance can be recorded." };
  try {
    const result = await runTenantCommand(session, (tx, context) => acceptLegalDocument(tx, context, {
      legalDocumentId,
      version,
      contentHashSha256,
      acceptanceSource: "workspace"
    }));
    if (!result.ran) return { ok: false, message: "Protected workspace storage is unavailable. Nothing was accepted." };
    revalidatePath("/legal-acceptances");
    return {
      ok: true,
      message: result.value.duplicate ? "This exact version was already accepted." : "Acceptance recorded with the exact version and content hash."
    };
  } catch {
    return { ok: false, message: "This version is not effective or could not be recorded. Nothing changed." };
  }
}

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
