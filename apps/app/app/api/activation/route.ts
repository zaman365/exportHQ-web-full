import { readActivationReport } from "../../_lib/activation";
import { getWorkspaceSession } from "../../_lib/session";

/* Deployment smoke tests and the operations console read the activation state
   from the deployment itself rather than from a hand-maintained table, so the
   status documentation can be checked against reality. The report names gates
   and capabilities only — never secrets, origins or customer data — but it is
   still restricted to platform administrators. */

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await getWorkspaceSession();
  if (!session.isPlatformAdmin) {
    return new Response(JSON.stringify({ error: "Not found." }), {
      status: 404,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }

  const report = readActivationReport();
  return new Response(
    JSON.stringify({
      environment: report.state.environment,
      effectiveGates: report.state.effective,
      recordedGates: report.state.recorded.map((gate) => gate.gate),
      capabilities: report.capabilities.map((capability) => ({
        capability: capability.capability,
        enabled: capability.enabled,
        mode: capability.mode,
        requiredGate: capability.requiredGate,
        missingGates: capability.missingGates
      }))
    }),
    { headers: { "content-type": "application/json", "cache-control": "no-store" } }
  );
}
