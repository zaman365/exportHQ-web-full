import { redactStructure } from "./redaction";

export interface StructuredLogFields {
  readonly [key: string]: unknown;
}

/**
 * Cloudflare Workers Logs treats each console argument independently. Emit a
 * single JSON object so event names and redacted fields remain searchable and
 * no newly-added credential/evidence field can bypass central redaction.
 */
export function structuredLogLine(
  event: string,
  fields: StructuredLogFields = {}
): string {
  return JSON.stringify(redactStructure({ event, ...fields }));
}
