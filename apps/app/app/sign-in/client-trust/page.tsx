import { redirect } from "next/navigation";
import { exportPanelPath } from "../../_lib/export-panel-paths";

export default function ClientTrustRecoveryPage() {
  redirect(exportPanelPath("/sign-in"));
}
