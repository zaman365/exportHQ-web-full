ALTER TABLE "billing_checkout_sessions" ADD COLUMN "invoice_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_checkout_sessions" ADD CONSTRAINT "billing_checkout_sessions_invoice_id_customer_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."customer_billing_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE billing_checkout_sessions ADD CONSTRAINT billing_checkout_invoice_tenant_fk
  FOREIGN KEY (organization_id, invoice_id) REFERENCES customer_billing_invoices (organization_id, id);
