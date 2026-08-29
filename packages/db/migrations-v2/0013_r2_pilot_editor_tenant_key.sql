CREATE UNIQUE INDEX "pilot_pass_grants_org_id_unique" ON "pilot_pass_grants" USING btree ("organization_id","id");--> statement-breakpoint
ALTER TABLE "pilot_pass_editors" ADD CONSTRAINT "pilot_pass_editors_grant_tenant_fk"
  FOREIGN KEY ("organization_id", "pilot_pass_grant_id") REFERENCES "pilot_pass_grants" ("organization_id", "id") ON DELETE CASCADE;
