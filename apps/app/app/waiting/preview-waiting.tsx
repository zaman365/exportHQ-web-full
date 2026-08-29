import { demoSnapshot } from "@exporthq/domain";
import WaitingClient from "./waiting-client";

export function PreviewWaiting({ canManage }: { canManage: boolean }) {
  return <WaitingClient initialTasks={[...demoSnapshot.tasks]} canManage={canManage} />;
}
