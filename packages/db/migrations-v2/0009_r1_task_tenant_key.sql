CREATE UNIQUE INDEX "tasks_org_id_unique" ON "tasks" USING btree ("organization_id","id");--> statement-breakpoint
ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_task_tenant_fk"
  FOREIGN KEY ("organization_id", "task_id") REFERENCES "tasks" ("organization_id", "id") ON DELETE CASCADE;
