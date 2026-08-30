/**
 * Normalize the intentionally small email-address contract used by repository
 * commands. This is linear in the input size and applies explicit RFC length
 * ceilings before values reach PostgreSQL or an external provider.
 */
export function normalizeEmailAddress(value: string, errorMessage: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.length > 254) throw new Error(errorMessage);
  const separator = normalized.indexOf("@");
  const local = separator < 0 ? "" : normalized.slice(0, separator);
  const domain = separator < 0 ? "" : normalized.slice(separator + 1);
  const finalDot = domain.lastIndexOf(".");
  const invalidWhitespace = [...normalized].some((character) =>
    character === " " || character === "\t" || character === "\n" ||
    character === "\r" || character === "\f" || character === "\v"
  );
  const invalid =
    local.length === 0 ||
    local.length > 64 ||
    domain.length === 0 ||
    domain.length > 253 ||
    separator !== normalized.lastIndexOf("@") ||
    finalDot <= 0 ||
    finalDot === domain.length - 1 ||
    invalidWhitespace;
  if (invalid) throw new Error(errorMessage);
  return normalized;
}
