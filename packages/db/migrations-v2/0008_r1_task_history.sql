CREATE TABLE "task_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"from_status" "task_status" NOT NULL,
	"to_status" "task_status" NOT NULL,
	"task_version" integer NOT NULL,
	"rationale" text NOT NULL,
	"changed_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_status_history_version_check" CHECK ("task_status_history"."task_version" >= 2),
	CONSTRAINT "task_status_history_rationale_check" CHECK (char_length(trim("task_status_history"."rationale")) > 0)
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "task_status_history_task_version_unique" ON "task_status_history" USING btree ("task_id","task_version");--> statement-breakpoint
CREATE INDEX "task_status_history_org_task_idx" ON "task_status_history" USING btree ("organization_id","task_id","created_at");--> statement-breakpoint
ALTER TABLE task_status_history ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE task_status_history FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_task_status_history_read ON task_status_history FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY tenant_task_status_history_insert ON task_status_history FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND changed_by = current_setting('app.actor_id', true)
  );
