CREATE TABLE "billing_checkout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"billing_account_id" uuid NOT NULL,
	"plan_price_id" uuid NOT NULL,
	"provider_configuration_id" uuid NOT NULL,
	"merchant_transaction_id" text NOT NULL,
	"provider_session_reference" text,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"idempotency_key" text NOT NULL,
	"return_state_hash_sha256" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"settled_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_checkout_sessions_merchant_transaction_id_unique" UNIQUE("merchant_transaction_id"),
	CONSTRAINT "billing_checkout_sessions_amount_check" CHECK ("billing_checkout_sessions"."amount_minor" > 0 and "billing_checkout_sessions"."currency" = 'BDT'),
	CONSTRAINT "billing_checkout_sessions_status_check" CHECK ("billing_checkout_sessions"."status" in ('created', 'pending', 'settled', 'risky', 'failed', 'cancelled', 'expired')),
	CONSTRAINT "billing_checkout_sessions_hash_check" CHECK ("billing_checkout_sessions"."return_state_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "billing_checkout_sessions_settlement_check" CHECK ("billing_checkout_sessions"."status" <> 'settled' or "billing_checkout_sessions"."settled_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "billing_dunning_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"customer_notice_reference" text,
	"outcome_reason" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_dunning_status_check" CHECK ("billing_dunning_cases"."status" in ('open', 'notified', 'retrying', 'resolved', 'written_off')),
	CONSTRAINT "billing_dunning_attempts_check" CHECK ("billing_dunning_cases"."attempt_count" between 0 and 12),
	CONSTRAINT "billing_dunning_resolution_check" CHECK ("billing_dunning_cases"."status" not in ('resolved', 'written_off') or num_nonnulls("billing_dunning_cases"."outcome_reason", "billing_dunning_cases"."resolved_at") = 2)
);
--> statement-breakpoint
CREATE TABLE "billing_entitlement_drift_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_id" uuid,
	"severity" text NOT NULL,
	"expected_tier" "subscription_tier" NOT NULL,
	"actual_tier" "subscription_tier" NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"detected_at" timestamp with time zone NOT NULL,
	"evidence_reference" text NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"resolution_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_drift_difference_check" CHECK ("billing_entitlement_drift_incidents"."expected_tier" <> "billing_entitlement_drift_incidents"."actual_tier"),
	CONSTRAINT "billing_drift_status_check" CHECK ("billing_entitlement_drift_incidents"."status" in ('open', 'investigating', 'resolved')),
	CONSTRAINT "billing_drift_resolution_check" CHECK ("billing_entitlement_drift_incidents"."status" <> 'resolved' or num_nonnulls("billing_entitlement_drift_incidents"."resolved_by", "billing_entitlement_drift_incidents"."resolved_at", "billing_entitlement_drift_incidents"."resolution_reference") = 3)
);
--> statement-breakpoint
CREATE TABLE "billing_plan_change_notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"from_plan_price_id" uuid NOT NULL,
	"to_plan_price_id" uuid NOT NULL,
	"treatment" text NOT NULL,
	"notice_reference" text,
	"effective_at" timestamp with time zone NOT NULL,
	"acknowledged_by" text,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_plan_change_treatment_check" CHECK ("billing_plan_change_notices"."treatment" in ('grandfathered', 'notified')),
	CONSTRAINT "billing_plan_change_notice_check" CHECK ("billing_plan_change_notices"."treatment" <> 'notified' or "billing_plan_change_notices"."notice_reference" is not null),
	CONSTRAINT "billing_plan_change_ack_check" CHECK (num_nonnulls("billing_plan_change_notices"."acknowledged_by", "billing_plan_change_notices"."acknowledged_at") in (0, 2))
);
--> statement-breakpoint
CREATE TABLE "billing_provider_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_key" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text DEFAULT 'candidate' NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"checkout_mode" text NOT NULL,
	"documentation_url" text NOT NULL,
	"commercial_review_reference" text,
	"legal_review_reference" text,
	"security_review_reference" text,
	"tax_review_reference" text,
	"credential_secret_ref" text,
	"activated_by" text,
	"activated_at" timestamp with time zone,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_provider_configurations_provider_key_unique" UNIQUE("provider_key"),
	CONSTRAINT "billing_provider_configurations_status_check" CHECK ("billing_provider_configurations"."status" in ('candidate', 'approved', 'active', 'suspended', 'retired')),
	CONSTRAINT "billing_provider_configurations_currency_check" CHECK ("billing_provider_configurations"."currency" = 'BDT'),
	CONSTRAINT "billing_provider_configurations_activation_check" CHECK ("billing_provider_configurations"."status" <> 'active' or (num_nonnulls("billing_provider_configurations"."commercial_review_reference", "billing_provider_configurations"."legal_review_reference", "billing_provider_configurations"."security_review_reference", "billing_provider_configurations"."tax_review_reference", "billing_provider_configurations"."credential_secret_ref", "billing_provider_configurations"."activated_by", "billing_provider_configurations"."activated_at") = 7 and "billing_provider_configurations"."credential_secret_ref" like 'secret://%'))
);
--> statement-breakpoint
CREATE TABLE "billing_settlement_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"checkout_session_id" uuid NOT NULL,
	"provider_event_id" uuid NOT NULL,
	"provider_transaction_id" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"provider_fee_minor" integer DEFAULT 0 NOT NULL,
	"net_settlement_minor" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"status" text NOT NULL,
	"risk_level" text NOT NULL,
	"provider_validation_reference" text NOT NULL,
	"payload_hash_sha256" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_settlement_records_provider_transaction_id_unique" UNIQUE("provider_transaction_id"),
	CONSTRAINT "billing_settlement_money_check" CHECK ("billing_settlement_records"."amount_minor" > 0 and "billing_settlement_records"."provider_fee_minor" >= 0 and "billing_settlement_records"."net_settlement_minor" = "billing_settlement_records"."amount_minor" - "billing_settlement_records"."provider_fee_minor" and "billing_settlement_records"."currency" = 'BDT'),
	CONSTRAINT "billing_settlement_status_check" CHECK ("billing_settlement_records"."status" in ('pending', 'settled', 'reversed')),
	CONSTRAINT "billing_settlement_risk_check" CHECK ("billing_settlement_records"."risk_level" in ('safe', 'risky')),
	CONSTRAINT "billing_settlement_hash_check" CHECK ("billing_settlement_records"."payload_hash_sha256" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "customer_api_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"client_key" text NOT NULL,
	"secret_hash_sha256" text NOT NULL,
	"secret_version" integer DEFAULT 1 NOT NULL,
	"scopes" text[] NOT NULL,
	"rate_limit_per_minute" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_rotated_at" timestamp with time zone NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_api_clients_client_key_unique" UNIQUE("client_key"),
	CONSTRAINT "customer_api_clients_hash_check" CHECK ("customer_api_clients"."secret_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "customer_api_clients_version_check" CHECK ("customer_api_clients"."secret_version" >= 1),
	CONSTRAINT "customer_api_clients_rate_check" CHECK ("customer_api_clients"."rate_limit_per_minute" between 1 and 600),
	CONSTRAINT "customer_api_clients_status_check" CHECK ("customer_api_clients"."status" in ('active', 'suspended', 'revoked', 'expired')),
	CONSTRAINT "customer_api_clients_scope_check" CHECK ("customer_api_clients"."scopes" <@ array['shipment:read','shipment:event:read','invoice:read','payment:read','document:approved:read']::text[])
);
--> statement-breakpoint
CREATE TABLE "customer_webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"payload_hash_sha256" text NOT NULL,
	"secret_version" integer NOT NULL,
	"replay_nonce" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"signed_at" timestamp with time zone NOT NULL,
	"delivered_at" timestamp with time zone,
	"last_failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_webhook_deliveries_replay_nonce_unique" UNIQUE("replay_nonce"),
	CONSTRAINT "customer_webhook_delivery_hash_check" CHECK ("customer_webhook_deliveries"."payload_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "customer_webhook_delivery_status_check" CHECK ("customer_webhook_deliveries"."status" in ('pending', 'delivered', 'retryable_failure', 'dead_letter')),
	CONSTRAINT "customer_webhook_delivery_attempt_check" CHECK ("customer_webhook_deliveries"."attempts" between 0 and 6),
	CONSTRAINT "customer_webhook_delivery_delivered_check" CHECK ("customer_webhook_deliveries"."status" <> 'delivered' or "customer_webhook_deliveries"."delivered_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "customer_webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"api_client_id" uuid NOT NULL,
	"endpoint_url" text NOT NULL,
	"event_types" text[] NOT NULL,
	"signing_secret_ref" text NOT NULL,
	"secret_version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending_verification' NOT NULL,
	"verified_at" timestamp with time zone,
	"last_rotated_at" timestamp with time zone NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_webhook_url_check" CHECK ("customer_webhook_subscriptions"."endpoint_url" ~ '^https://'),
	CONSTRAINT "customer_webhook_secret_check" CHECK ("customer_webhook_subscriptions"."signing_secret_ref" like 'secret://%' and "customer_webhook_subscriptions"."secret_version" >= 1),
	CONSTRAINT "customer_webhook_status_check" CHECK ("customer_webhook_subscriptions"."status" in ('pending_verification', 'active', 'paused', 'revoked')),
	CONSTRAINT "customer_webhook_active_check" CHECK ("customer_webhook_subscriptions"."status" <> 'active' or "customer_webhook_subscriptions"."verified_at" is not null),
	CONSTRAINT "customer_webhook_event_check" CHECK ("customer_webhook_subscriptions"."event_types" <@ array['shipment.updated','shipment.exception_opened','invoice.issued','payment.confirmed','document.approved']::text[])
);
--> statement-breakpoint
CREATE TABLE "external_guest_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"guest_actor_id" text NOT NULL,
	"guest_type" text NOT NULL,
	"purpose" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"permissions" text[] NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"accepted_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_by" text,
	"revoked_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "external_guest_grants_type_check" CHECK ("external_guest_grants"."guest_type" in ('buyer', 'forwarder', 'cf_agent', 'inspector')),
	CONSTRAINT "external_guest_grants_status_check" CHECK ("external_guest_grants"."status" in ('pending', 'active', 'revoked', 'expired')),
	CONSTRAINT "external_guest_grants_permission_check" CHECK ("external_guest_grants"."permissions" <@ array['read','comment','upload_approved_evidence']::text[]),
	CONSTRAINT "external_guest_grants_active_check" CHECK ("external_guest_grants"."status" <> 'active' or "external_guest_grants"."accepted_at" is not null),
	CONSTRAINT "external_guest_grants_revoke_check" CHECK ("external_guest_grants"."status" <> 'revoked' or num_nonnulls("external_guest_grants"."revoked_by", "external_guest_grants"."revoked_at") = 2)
);
--> statement-breakpoint
CREATE TABLE "provider_case_evidence_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider_case_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_by_customer" text NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"revoked_by" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_case_evidence_revoke_check" CHECK (num_nonnulls("provider_case_evidence_shares"."revoked_by", "provider_case_evidence_shares"."revoked_at") in (0, 2))
);
--> statement-breakpoint
CREATE TABLE "provider_case_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider_case_id" uuid NOT NULL,
	"issue_type" text NOT NULL,
	"severity" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"summary" text NOT NULL,
	"evidence_reference" text NOT NULL,
	"owner_actor_id" text NOT NULL,
	"opened_by" text NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"resolution" text,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_case_issues_type_check" CHECK ("provider_case_issues"."issue_type" in ('complaint', 'dispute', 'suspension', 'reverification', 'outcome_review')),
	CONSTRAINT "provider_case_issues_severity_check" CHECK ("provider_case_issues"."severity" in ('low', 'medium', 'high', 'critical')),
	CONSTRAINT "provider_case_issues_status_check" CHECK ("provider_case_issues"."status" in ('open', 'investigating', 'resolved', 'dismissed')),
	CONSTRAINT "provider_case_issues_resolution_check" CHECK ("provider_case_issues"."status" not in ('resolved', 'dismissed') or num_nonnulls("provider_case_issues"."resolution", "provider_case_issues"."resolved_by", "provider_case_issues"."resolved_at") = 3)
);
--> statement-breakpoint
CREATE TABLE "provider_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"referral_id" uuid,
	"provider_id" uuid NOT NULL,
	"export_lane_id" uuid,
	"category" text NOT NULL,
	"scope" text NOT NULL,
	"fee_disclosure" text NOT NULL,
	"commission_disclosure" text NOT NULL,
	"commercial_relationship" text NOT NULL,
	"ranking_basis" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"response_due_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_by" text,
	"accepted_at" timestamp with time zone,
	"introduced_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"outcome_review" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_cases_status_check" CHECK ("provider_cases"."status" in ('draft', 'awaiting_acceptance', 'accepted', 'introduced', 'in_progress', 'completed', 'disputed', 'cancelled')),
	CONSTRAINT "provider_cases_window_check" CHECK ("provider_cases"."expires_at" > "provider_cases"."response_due_at"),
	CONSTRAINT "provider_cases_acceptance_check" CHECK ("provider_cases"."status" in ('draft', 'awaiting_acceptance') or num_nonnulls("provider_cases"."accepted_by", "provider_cases"."accepted_at") = 2),
	CONSTRAINT "provider_cases_introduction_check" CHECK ("provider_cases"."status" not in ('introduced', 'in_progress', 'completed', 'disputed') or "provider_cases"."introduced_at" is not null),
	CONSTRAINT "provider_cases_completion_check" CHECK ("provider_cases"."status" <> 'completed' or num_nonnulls("provider_cases"."completed_at", "provider_cases"."outcome_review") = 2)
);
--> statement-breakpoint
CREATE TABLE "service_provider_verification_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"evidence_type" text NOT NULL,
	"storage_reference" text NOT NULL,
	"content_hash_sha256" text NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"reviewed_by" text NOT NULL,
	"reviewed_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'current' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_verification_evidence_hash_check" CHECK ("service_provider_verification_evidence"."content_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "provider_verification_evidence_window_check" CHECK ("service_provider_verification_evidence"."expires_at" > "service_provider_verification_evidence"."valid_from"),
	CONSTRAINT "provider_verification_evidence_status_check" CHECK ("service_provider_verification_evidence"."status" in ('current', 'expired', 'superseded', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "billing_plan_prices" DROP CONSTRAINT "billing_plan_prices_status_check";--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD COLUMN "included_storage_bytes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD COLUMN "included_automation_units" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD COLUMN "included_work_packs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD COLUMN "active_lane_overage_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD COLUMN "editor_overage_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD COLUMN "storage_gib_overage_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD COLUMN "automation_hundred_overage_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD COLUMN "work_pack_overage_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_provider_profiles" ADD COLUMN "commercial_relationship_disclosure" text DEFAULT 'No commercial relationship recorded.' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_provider_profiles" ADD COLUMN "ranking_basis" text DEFAULT 'No ranking while unverified.' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_provider_profiles" ADD COLUMN "response_sla_minutes" integer;--> statement-breakpoint
ALTER TABLE "service_provider_profiles" ADD COLUMN "verification_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_provider_profiles" ADD COLUMN "suspension_reason" text;--> statement-breakpoint
ALTER TABLE "billing_checkout_sessions" ADD CONSTRAINT "billing_checkout_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_checkout_sessions" ADD CONSTRAINT "billing_checkout_sessions_billing_account_id_billing_accounts_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "public"."billing_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_checkout_sessions" ADD CONSTRAINT "billing_checkout_sessions_plan_price_id_billing_plan_prices_id_fk" FOREIGN KEY ("plan_price_id") REFERENCES "public"."billing_plan_prices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_checkout_sessions" ADD CONSTRAINT "billing_checkout_sessions_provider_configuration_id_billing_provider_configurations_id_fk" FOREIGN KEY ("provider_configuration_id") REFERENCES "public"."billing_provider_configurations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_dunning_cases" ADD CONSTRAINT "billing_dunning_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_dunning_cases" ADD CONSTRAINT "billing_dunning_cases_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_dunning_cases" ADD CONSTRAINT "billing_dunning_cases_invoice_id_customer_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."customer_billing_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_entitlement_drift_incidents" ADD CONSTRAINT "billing_entitlement_drift_incidents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_entitlement_drift_incidents" ADD CONSTRAINT "billing_entitlement_drift_incidents_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_plan_change_notices" ADD CONSTRAINT "billing_plan_change_notices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_plan_change_notices" ADD CONSTRAINT "billing_plan_change_notices_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_plan_change_notices" ADD CONSTRAINT "billing_plan_change_notices_from_plan_price_id_billing_plan_prices_id_fk" FOREIGN KEY ("from_plan_price_id") REFERENCES "public"."billing_plan_prices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_plan_change_notices" ADD CONSTRAINT "billing_plan_change_notices_to_plan_price_id_billing_plan_prices_id_fk" FOREIGN KEY ("to_plan_price_id") REFERENCES "public"."billing_plan_prices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_settlement_records" ADD CONSTRAINT "billing_settlement_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_settlement_records" ADD CONSTRAINT "billing_settlement_records_checkout_session_id_billing_checkout_sessions_id_fk" FOREIGN KEY ("checkout_session_id") REFERENCES "public"."billing_checkout_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_settlement_records" ADD CONSTRAINT "billing_settlement_records_provider_event_id_billing_provider_events_id_fk" FOREIGN KEY ("provider_event_id") REFERENCES "public"."billing_provider_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_api_clients" ADD CONSTRAINT "customer_api_clients_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_webhook_deliveries" ADD CONSTRAINT "customer_webhook_deliveries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_webhook_deliveries" ADD CONSTRAINT "customer_webhook_deliveries_subscription_id_customer_webhook_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."customer_webhook_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_webhook_subscriptions" ADD CONSTRAINT "customer_webhook_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_webhook_subscriptions" ADD CONSTRAINT "customer_webhook_subscriptions_api_client_id_customer_api_clients_id_fk" FOREIGN KEY ("api_client_id") REFERENCES "public"."customer_api_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_guest_grants" ADD CONSTRAINT "external_guest_grants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_case_evidence_shares" ADD CONSTRAINT "provider_case_evidence_shares_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_case_evidence_shares" ADD CONSTRAINT "provider_case_evidence_shares_provider_case_id_provider_cases_id_fk" FOREIGN KEY ("provider_case_id") REFERENCES "public"."provider_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_case_evidence_shares" ADD CONSTRAINT "provider_case_evidence_shares_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_case_issues" ADD CONSTRAINT "provider_case_issues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_case_issues" ADD CONSTRAINT "provider_case_issues_provider_case_id_provider_cases_id_fk" FOREIGN KEY ("provider_case_id") REFERENCES "public"."provider_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_cases" ADD CONSTRAINT "provider_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_cases" ADD CONSTRAINT "provider_cases_referral_id_readiness_provider_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."readiness_provider_referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_cases" ADD CONSTRAINT "provider_cases_provider_id_service_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_cases" ADD CONSTRAINT "provider_cases_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_provider_verification_evidence" ADD CONSTRAINT "service_provider_verification_evidence_provider_id_service_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_checkout_sessions_org_id_unique" ON "billing_checkout_sessions" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_checkout_sessions_org_key_unique" ON "billing_checkout_sessions" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "billing_checkout_sessions_org_status_idx" ON "billing_checkout_sessions" USING btree ("organization_id","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_dunning_invoice_unique" ON "billing_dunning_cases" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "billing_dunning_org_status_idx" ON "billing_dunning_cases" USING btree ("organization_id","status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "billing_drift_org_status_idx" ON "billing_entitlement_drift_incidents" USING btree ("organization_id","status","severity");--> statement-breakpoint
CREATE INDEX "billing_plan_change_org_effective_idx" ON "billing_plan_change_notices" USING btree ("organization_id","effective_at");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_settlement_checkout_unique" ON "billing_settlement_records" USING btree ("checkout_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_settlement_org_id_unique" ON "billing_settlement_records" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "billing_settlement_org_status_idx" ON "billing_settlement_records" USING btree ("organization_id","status","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_api_clients_org_id_unique" ON "customer_api_clients" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "customer_api_clients_org_status_idx" ON "customer_api_clients" USING btree ("organization_id","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_webhook_delivery_key_unique" ON "customer_webhook_deliveries" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "customer_webhook_delivery_status_idx" ON "customer_webhook_deliveries" USING btree ("organization_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_webhook_endpoint_unique" ON "customer_webhook_subscriptions" USING btree ("organization_id","endpoint_url");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_webhook_subscriptions_org_id_unique" ON "customer_webhook_subscriptions" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "customer_webhook_org_status_idx" ON "customer_webhook_subscriptions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "external_guest_grants_actor_resource_unique" ON "external_guest_grants" USING btree ("organization_id","guest_actor_id","resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "external_guest_grants_org_status_idx" ON "external_guest_grants" USING btree ("organization_id","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_case_evidence_share_unique" ON "provider_case_evidence_shares" USING btree ("provider_case_id","document_version_id","purpose");--> statement-breakpoint
CREATE INDEX "provider_case_evidence_org_expiry_idx" ON "provider_case_evidence_shares" USING btree ("organization_id","expires_at");--> statement-breakpoint
CREATE INDEX "provider_case_issues_org_status_idx" ON "provider_case_issues" USING btree ("organization_id","status","severity");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_cases_org_id_unique" ON "provider_cases" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "provider_cases_org_status_idx" ON "provider_cases" USING btree ("organization_id","status","response_due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_verification_evidence_unique" ON "service_provider_verification_evidence" USING btree ("provider_id","evidence_type","content_hash_sha256");--> statement-breakpoint
CREATE INDEX "provider_verification_evidence_expiry_idx" ON "service_provider_verification_evidence" USING btree ("provider_id","status","expires_at");--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD CONSTRAINT "billing_plan_prices_limits_check" CHECK ("billing_plan_prices"."included_storage_bytes" >= 0 and "billing_plan_prices"."included_automation_units" >= 0 and "billing_plan_prices"."included_work_packs" >= 0);--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD CONSTRAINT "billing_plan_prices_overage_check" CHECK ("billing_plan_prices"."active_lane_overage_minor" >= 0 and "billing_plan_prices"."editor_overage_minor" >= 0 and "billing_plan_prices"."storage_gib_overage_minor" >= 0 and "billing_plan_prices"."automation_hundred_overage_minor" >= 0 and "billing_plan_prices"."work_pack_overage_minor" >= 0);--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD CONSTRAINT "billing_plan_prices_status_check" CHECK ("billing_plan_prices"."offer_status" in ('preview', 'manual_pilot', 'planned', 'public_beta'));--> statement-breakpoint
ALTER TABLE "service_provider_profiles" ADD CONSTRAINT "service_provider_profiles_sla_check" CHECK ("service_provider_profiles"."response_sla_minutes" is null or "service_provider_profiles"."response_sla_minutes" between 1 and 43200);--> statement-breakpoint
ALTER TABLE "service_provider_profiles" ADD CONSTRAINT "service_provider_profiles_verification_expiry_check" CHECK ("service_provider_profiles"."verification_status" <> 'verified' or "service_provider_profiles"."verification_expires_at" is not null);--> statement-breakpoint
ALTER TABLE "service_provider_profiles" ADD CONSTRAINT "service_provider_profiles_suspension_check" CHECK ("service_provider_profiles"."verification_status" <> 'suspended' or "service_provider_profiles"."suspension_reason" is not null);
--> statement-breakpoint
-- Every cross-table tenant relationship carries organization_id so a guessed
-- UUID cannot be used to link records across organizations.
CREATE UNIQUE INDEX readiness_provider_referrals_org_id_unique ON readiness_provider_referrals (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX billing_provider_events_org_id_unique ON billing_provider_events (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX billing_dunning_cases_org_id_unique ON billing_dunning_cases (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX billing_entitlement_drift_org_id_unique ON billing_entitlement_drift_incidents (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX billing_plan_change_notices_org_id_unique ON billing_plan_change_notices (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX provider_case_evidence_shares_org_id_unique ON provider_case_evidence_shares (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX provider_case_issues_org_id_unique ON provider_case_issues (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_checkout_sessions ADD CONSTRAINT billing_checkout_account_tenant_fk
  FOREIGN KEY (organization_id, billing_account_id) REFERENCES billing_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_settlement_records ADD CONSTRAINT billing_settlement_checkout_tenant_fk
  FOREIGN KEY (organization_id, checkout_session_id) REFERENCES billing_checkout_sessions (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_settlement_records ADD CONSTRAINT billing_settlement_event_tenant_fk
  FOREIGN KEY (organization_id, provider_event_id) REFERENCES billing_provider_events (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_dunning_cases ADD CONSTRAINT billing_dunning_subscription_tenant_fk
  FOREIGN KEY (organization_id, subscription_id) REFERENCES billing_subscriptions (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_dunning_cases ADD CONSTRAINT billing_dunning_invoice_tenant_fk
  FOREIGN KEY (organization_id, invoice_id) REFERENCES customer_billing_invoices (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_entitlement_drift_incidents ADD CONSTRAINT billing_drift_subscription_tenant_fk
  FOREIGN KEY (organization_id, subscription_id) REFERENCES billing_subscriptions (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_plan_change_notices ADD CONSTRAINT billing_plan_notice_subscription_tenant_fk
  FOREIGN KEY (organization_id, subscription_id) REFERENCES billing_subscriptions (organization_id, id);--> statement-breakpoint
ALTER TABLE provider_cases ADD CONSTRAINT provider_cases_referral_tenant_fk
  FOREIGN KEY (organization_id, referral_id) REFERENCES readiness_provider_referrals (organization_id, id);--> statement-breakpoint
ALTER TABLE provider_cases ADD CONSTRAINT provider_cases_lane_tenant_fk
  FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE provider_case_evidence_shares ADD CONSTRAINT provider_case_share_case_tenant_fk
  FOREIGN KEY (organization_id, provider_case_id) REFERENCES provider_cases (organization_id, id);--> statement-breakpoint
ALTER TABLE provider_case_evidence_shares ADD CONSTRAINT provider_case_share_document_tenant_fk
  FOREIGN KEY (organization_id, document_version_id) REFERENCES document_versions (organization_id, id);--> statement-breakpoint
ALTER TABLE provider_case_issues ADD CONSTRAINT provider_case_issue_case_tenant_fk
  FOREIGN KEY (organization_id, provider_case_id) REFERENCES provider_cases (organization_id, id);--> statement-breakpoint
ALTER TABLE customer_webhook_subscriptions ADD CONSTRAINT customer_webhook_client_tenant_fk
  FOREIGN KEY (organization_id, api_client_id) REFERENCES customer_api_clients (organization_id, id);--> statement-breakpoint
ALTER TABLE customer_webhook_deliveries ADD CONSTRAINT customer_webhook_delivery_subscription_tenant_fk
  FOREIGN KEY (organization_id, subscription_id) REFERENCES customer_webhook_subscriptions (organization_id, id);--> statement-breakpoint
-- R4 tenant envelope.
DO $$
DECLARE
  tenant_table text;
  tenant_tables text[] := ARRAY[
    'billing_checkout_sessions','billing_settlement_records','billing_dunning_cases',
    'billing_entitlement_drift_incidents','billing_plan_change_notices',
    'provider_cases','provider_case_evidence_shares','provider_case_issues',
    'external_guest_grants','customer_api_clients','customer_webhook_subscriptions',
    'customer_webhook_deliveries'
  ];
BEGIN
  FOREACH tenant_table IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid)',
      'tenant_' || tenant_table || '_read', tenant_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid) WITH CHECK (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid)',
      'tenant_' || tenant_table || '_write', tenant_table
    );
  END LOOP;
END $$;
--> statement-breakpoint
-- Checkout creation is impossible until a migration-published catalog and a
-- fully reviewed active provider both exist. Provider evidence, settlement,
-- dunning and entitlement drift are operations-only writes.
DROP POLICY tenant_billing_checkout_sessions_write ON billing_checkout_sessions;--> statement-breakpoint
CREATE POLICY tenant_billing_checkout_sessions_insert ON billing_checkout_sessions FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM billing_provider_configurations configuration
      WHERE configuration.id = provider_configuration_id AND configuration.status = 'active'
    )
    AND EXISTS (
      SELECT 1 FROM billing_plan_prices price
      JOIN billing_plan_catalog_versions catalog ON catalog.id = price.catalog_version_id
      WHERE price.id = plan_price_id AND price.offer_status = 'public_beta'
        AND catalog.status = 'published' AND catalog.self_service_enabled
    )
  );--> statement-breakpoint
CREATE POLICY operations_billing_checkout_sessions_update ON billing_checkout_sessions FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid AND current_setting('app.actor_type', true) IN ('staff', 'system'))
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid AND current_setting('app.actor_type', true) IN ('staff', 'system'));--> statement-breakpoint
DO $$
DECLARE
  operations_table text;
  operations_tables text[] := ARRAY[
    'billing_settlement_records','billing_dunning_cases','billing_entitlement_drift_incidents',
    'billing_plan_change_notices','customer_webhook_deliveries'
  ];
BEGIN
  FOREACH operations_table IN ARRAY operations_tables LOOP
    EXECUTE format('DROP POLICY %I ON %I', 'tenant_' || operations_table || '_write', operations_table);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid AND current_setting(''app.actor_type'', true) IN (''staff'', ''system'')) WITH CHECK (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid AND current_setting(''app.actor_type'', true) IN (''staff'', ''system''))',
      'operations_' || operations_table || '_write', operations_table
    );
  END LOOP;
END $$;
--> statement-breakpoint
-- Technical candidate only. No review references or secret are fabricated and
-- the record cannot satisfy the active-provider check.
INSERT INTO billing_provider_configurations
  (id, provider_key, display_name, status, currency, checkout_mode, documentation_url)
VALUES
  ('d4000000-0000-4000-8000-000000000001', 'sslcommerz', 'SSLCOMMERZ', 'candidate', 'BDT', 'hosted_redirect', 'https://developer.sslcommerz.com/doc/v4/index.html');
--> statement-breakpoint
