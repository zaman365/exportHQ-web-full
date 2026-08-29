"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getWorkspaceSession } from "../_lib/session";

const oneYear = 365 * 24 * 60 * 60;

export async function setWorkspacePresentationPreference(formData: FormData): Promise<void> {
  const session = await getWorkspaceSession();
  if (!session.userId) return;
  const locale = formData.get("locale");
  const lowDataMode = formData.get("lowDataMode");
  const store = await cookies();
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: oneYear
  };
  if (locale === "bn" || locale === "en") store.set("exporthq_locale", locale, options);
  if (lowDataMode === "true" || lowDataMode === "false") store.set("exporthq_low_data", lowDataMode, options);
  revalidatePath("/", "layout");
}
