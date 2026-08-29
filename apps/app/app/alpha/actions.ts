"use server";

import { privateAlphaAgreement } from "@exporthq/domain";
import { acceptPilotAgreement } from "@exporthq/db";
import { revalidatePath } from "next/cache";
import { getWorkspaceFeatureSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";

export type PilotAcceptanceActionResult = { readonly ok: boolean; readonly message: string };

export async function acceptCurrentPilotAgreement(
  _previous: PilotAcceptanceActionResult,
  formData: FormData
): Promise<PilotAcceptanceActionResult> {
  const session = await getWorkspaceFeatureSession("home");
  if (!session.userId || !session.organizationId || session.isDemo) {
    return { ok: false, message: "Use a real signed-in organization workspace to record acceptance." };
  }
  const version = stringValue(formData, "version");
  const contentHashSha256 = stringValue(formData, "contentHashSha256").toLowerCase();
  if (version !== privateAlphaAgreement.version || contentHashSha256 !== privateAlphaAgreement.contentHashSha256) {
    return { ok: false, message: "The offered agreement does not match the current exact internal Alpha version." };
  }
  if (stringValue(formData, "confirmed") !== "on") {
    return { ok: false, message: "Explicit confirmation is required before acceptance can be recorded." };
  }
  try {
    const result = await runTenantCommand(session, (tx, context) => acceptPilotAgreement(tx, context, {
      agreementVersion: version,
      agreementHashSha256: contentHashSha256
    }));
    if (!result.ran) return { ok: false, message: "Protected workspace storage is unavailable. Nothing was accepted." };
    revalidatePath("/alpha");
    return { ok: true, message: "The exact internal Alpha agreement version and hash were accepted." };
  } catch {
    return { ok: false, message: "The invitation no longer matches or acceptance could not be recorded. Nothing changed." };
  }
}

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
