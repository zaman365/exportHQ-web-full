CREATE TYPE "public"."approval_decision" AS ENUM('approved', 'rejected', 'changes_requested');--> statement-breakpoint
CREATE TYPE "public"."billing_invoice_status" AS ENUM('draft', 'issued', 'paid', 'void', 'refunded', 'past_due');--> statement-breakpoint
CREATE TYPE "public"."billing_subscription_status" AS ENUM('pending', 'active', 'past_due', 'paused', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."billing_transaction_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."buyer_rfq_status" AS ENUM('draft', 'received', 'clarifying', 'ready_to_quote', 'quoted', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."buyer_risk_status" AS ENUM('not_assessed', 'low', 'medium', 'high', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."buyer_verification_status" AS ENUM('unverified', 'source_supported', 'provider_attested', 'human_reviewed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."companion_workflow_status" AS ENUM('draft', 'in_progress', 'ready_for_submission', 'submitted', 'completed', 'blocked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."consistency_issue_status" AS ENUM('open', 'resolved', 'waived');--> statement-breakpoint
CREATE TYPE "public"."exception_case_status" AS ENUM('open', 'investigating', 'mitigating', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."external_delivery_status" AS ENUM('pending', 'queued', 'delivered', 'retryable_failure', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."generated_document_status" AS ENUM('draft', 'under_review', 'approved', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."outbound_draft_status" AS ENUM('draft', 'awaiting_approval', 'approved', 'queued', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."outreach_consent_state" AS ENUM('unknown', 'permitted', 'objected', 'opted_out');--> statement-breakpoint
CREATE TYPE "public"."payment_receipt_status" AS ENUM('reported', 'bank_advice_received', 'matched', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."production_batch_status" AS ENUM('planned', 'in_progress', 'inspection', 'released', 'blocked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."quotation_status" AS ENUM('draft', 'awaiting_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."sales_opportunity_status" AS ENUM('identified', 'qualified', 'rfq_received', 'quoted', 'won', 'lost', 'archived');--> statement-breakpoint
CREATE TYPE "public"."sales_order_status" AS ENUM('draft', 'confirmed', 'in_production', 'ready_to_ship', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('planning', 'booked', 'in_transit', 'arrived', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."trade_invoice_status" AS ENUM('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'disputed', 'void');--> statement-breakpoint
CREATE TABLE "billing_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"billing_email" text NOT NULL,
	"billing_address" jsonb NOT NULL,
	"tax_registration_reference" text,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"provider_customer_reference" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_accounts_organization_id_unique" UNIQUE("organization_id"),
	CONSTRAINT "billing_accounts_currency_check" CHECK ("billing_accounts"."currency" = 'BDT')
);
--> statement-breakpoint
CREATE TABLE "billing_entitlement_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"entitlement_id" uuid NOT NULL,
	"from_tier" "subscription_tier" NOT NULL,
	"to_tier" "subscription_tier" NOT NULL,
	"reason" text NOT NULL,
	"reconciliation_reference" text,
	"changed_by" text NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_entitlement_transitions_change_check" CHECK ("billing_entitlement_transitions"."from_tier" <> "billing_entitlement_transitions"."to_tier")
);
--> statement-breakpoint
CREATE TABLE "billing_plan_catalog_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"self_service_enabled" boolean DEFAULT false NOT NULL,
	"effective_from" timestamp with time zone,
	"published_by" text,
	"review_reference" text,
	"content_hash_sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_plan_catalog_versions_version_unique" UNIQUE("version"),
	CONSTRAINT "billing_plan_catalog_versions_currency_check" CHECK ("billing_plan_catalog_versions"."currency" = 'BDT'),
	CONSTRAINT "billing_plan_catalog_versions_status_check" CHECK ("billing_plan_catalog_versions"."status" in ('draft', 'published', 'retired')),
	CONSTRAINT "billing_plan_catalog_versions_hash_check" CHECK ("billing_plan_catalog_versions"."content_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "billing_plan_catalog_versions_publication_check" CHECK ("billing_plan_catalog_versions"."status" <> 'published' or num_nonnulls("billing_plan_catalog_versions"."effective_from", "billing_plan_catalog_versions"."published_by", "billing_plan_catalog_versions"."review_reference") = 3),
	CONSTRAINT "billing_plan_catalog_versions_r3_gate_check" CHECK (not "billing_plan_catalog_versions"."self_service_enabled")
);
--> statement-breakpoint
CREATE TABLE "billing_plan_prices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"catalog_version_id" uuid NOT NULL,
	"product_key" text NOT NULL,
	"display_name" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"billing_interval" text NOT NULL,
	"billing_cadence_months" integer,
	"offer_status" text NOT NULL,
	"included_active_lanes" integer,
	"included_editors" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_plan_prices_product_check" CHECK ("billing_plan_prices"."product_key" in ('explore', 'first_shipment_pass', 'launch', 'scale', 'managed_ops')),
	CONSTRAINT "billing_plan_prices_amount_check" CHECK ("billing_plan_prices"."amount_minor" >= 0 and "billing_plan_prices"."currency" = 'BDT'),
	CONSTRAINT "billing_plan_prices_interval_check" CHECK ("billing_plan_prices"."billing_interval" in ('one_time', 'quarterly', 'annual', 'monthly')),
	CONSTRAINT "billing_plan_prices_cadence_check" CHECK (("billing_plan_prices"."billing_interval" = 'one_time' and "billing_plan_prices"."billing_cadence_months" is null) or ("billing_plan_prices"."billing_interval" <> 'one_time' and "billing_plan_prices"."billing_cadence_months" >= 1)),
	CONSTRAINT "billing_plan_prices_status_check" CHECK ("billing_plan_prices"."offer_status" in ('preview', 'manual_pilot', 'planned'))
);
--> statement-breakpoint
CREATE TABLE "billing_provider_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload_hash_sha256" text NOT NULL,
	"signature_verified" boolean NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone,
	"processing_result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_provider_events_hash_check" CHECK ("billing_provider_events"."payload_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "billing_provider_events_process_check" CHECK (num_nonnulls("billing_provider_events"."processed_at", "billing_provider_events"."processing_result") in (0, 2))
);
--> statement-breakpoint
CREATE TABLE "billing_reconciliation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"billing_account_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"expected_minor" integer NOT NULL,
	"received_minor" integer NOT NULL,
	"credited_minor" integer NOT NULL,
	"refunded_minor" integer NOT NULL,
	"variance_minor" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"status" text NOT NULL,
	"evidence_reference" text NOT NULL,
	"reconciled_by" text NOT NULL,
	"reconciled_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_reconciliation_period_check" CHECK ("billing_reconciliation_results"."period_end" > "billing_reconciliation_results"."period_start"),
	CONSTRAINT "billing_reconciliation_money_check" CHECK ("billing_reconciliation_results"."expected_minor" >= 0 and "billing_reconciliation_results"."received_minor" >= 0 and "billing_reconciliation_results"."credited_minor" >= 0 and "billing_reconciliation_results"."refunded_minor" >= 0 and "billing_reconciliation_results"."variance_minor" = "billing_reconciliation_results"."received_minor" + "billing_reconciliation_results"."credited_minor" - "billing_reconciliation_results"."refunded_minor" - "billing_reconciliation_results"."expected_minor" and "billing_reconciliation_results"."currency" = 'BDT'),
	CONSTRAINT "billing_reconciliation_status_check" CHECK ("billing_reconciliation_results"."status" in ('matched', 'variance', 'resolved'))
);
--> statement-breakpoint
CREATE TABLE "billing_subscription_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"from_status" "billing_subscription_status" NOT NULL,
	"to_status" "billing_subscription_status" NOT NULL,
	"aggregate_version" integer NOT NULL,
	"reason" text NOT NULL,
	"changed_by" text NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscription_history_version_check" CHECK ("billing_subscription_history"."aggregate_version" >= 2),
	CONSTRAINT "billing_subscription_history_change_check" CHECK ("billing_subscription_history"."from_status" <> "billing_subscription_history"."to_status")
);
--> statement-breakpoint
CREATE TABLE "billing_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"billing_account_id" uuid NOT NULL,
	"plan_price_id" uuid NOT NULL,
	"entitlement_id" uuid,
	"status" "billing_subscription_status" DEFAULT 'pending' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"provider_subscription_reference" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscriptions_source_check" CHECK ("billing_subscriptions"."source" in ('manual', 'provider')),
	CONSTRAINT "billing_subscriptions_period_check" CHECK ("billing_subscriptions"."current_period_end" > "billing_subscriptions"."current_period_start"),
	CONSTRAINT "billing_subscriptions_cancellation_check" CHECK ("billing_subscriptions"."status" <> 'cancelled' or num_nonnulls("billing_subscriptions"."cancelled_at", "billing_subscriptions"."cancellation_reason") = 2),
	CONSTRAINT "billing_subscriptions_version_check" CHECK ("billing_subscriptions"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "billing_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"invoice_id" uuid,
	"provider" text NOT NULL,
	"provider_transaction_id" text,
	"transaction_type" text NOT NULL,
	"status" "billing_transaction_status" DEFAULT 'pending' NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"idempotency_key" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_transactions_type_check" CHECK ("billing_transactions"."transaction_type" in ('charge', 'payment', 'refund', 'credit')),
	CONSTRAINT "billing_transactions_amount_check" CHECK ("billing_transactions"."amount_minor" > 0 and "billing_transactions"."currency" = 'BDT')
);
--> statement-breakpoint
CREATE TABLE "buyer_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"trading_name" text,
	"country_code" text NOT NULL,
	"website_url" text,
	"verification_status" "buyer_verification_status" DEFAULT 'unverified' NOT NULL,
	"verification_evidence_level" text,
	"verification_source_ref" text,
	"verified_at" timestamp with time zone,
	"verified_by" text,
	"risk_status" "buyer_risk_status" DEFAULT 'not_assessed' NOT NULL,
	"risk_rationale" text,
	"correction_requested_at" timestamp with time zone,
	"opted_out_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_accounts_country_check" CHECK ("buyer_accounts"."country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "buyer_accounts_version_check" CHECK ("buyer_accounts"."version" >= 1),
	CONSTRAINT "buyer_accounts_verification_evidence_check" CHECK ("buyer_accounts"."verification_status" in ('unverified', 'rejected') or num_nonnulls("buyer_accounts"."verification_evidence_level", "buyer_accounts"."verification_source_ref", "buyer_accounts"."verified_at", "buyer_accounts"."verified_by") = 4),
	CONSTRAINT "buyer_accounts_risk_rationale_check" CHECK ("buyer_accounts"."risk_status" = 'not_assessed' or "buyer_accounts"."risk_rationale" is not null)
);
--> statement-breakpoint
CREATE TABLE "buyer_communication_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"buyer_account_id" uuid NOT NULL,
	"buyer_contact_id" uuid,
	"export_lane_id" uuid,
	"direction" text NOT NULL,
	"channel" text NOT NULL,
	"purpose" text NOT NULL,
	"consent_record_id" uuid,
	"external_reference" text,
	"outcome_code" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_communication_direction_check" CHECK ("buyer_communication_audit"."direction" in ('inbound', 'outbound')),
	CONSTRAINT "buyer_communication_consent_check" CHECK ("buyer_communication_audit"."direction" = 'inbound' or "buyer_communication_audit"."consent_record_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "buyer_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"buyer_account_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"role_title" text,
	"email_address" text,
	"phone_number" text,
	"preferred_channel" text,
	"correction_requested_at" timestamp with time zone,
	"opted_out_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_contacts_channel_check" CHECK ("buyer_contacts"."preferred_channel" is null or "buyer_contacts"."preferred_channel" in ('email', 'phone', 'whatsapp', 'other')),
	CONSTRAINT "buyer_contacts_reachability_check" CHECK (num_nonnulls("buyer_contacts"."email_address", "buyer_contacts"."phone_number") >= 1)
);
--> statement-breakpoint
CREATE TABLE "buyer_outreach_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"buyer_account_id" uuid NOT NULL,
	"buyer_contact_id" uuid,
	"channel" text NOT NULL,
	"state" "outreach_consent_state" DEFAULT 'unknown' NOT NULL,
	"lawful_basis" text,
	"evidence_reference" text,
	"effective_at" timestamp with time zone NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_outreach_channel_check" CHECK ("buyer_outreach_consents"."channel" in ('email', 'phone', 'whatsapp', 'other')),
	CONSTRAINT "buyer_outreach_permission_evidence_check" CHECK ("buyer_outreach_consents"."state" <> 'permitted' or num_nonnulls("buyer_outreach_consents"."lawful_basis", "buyer_outreach_consents"."evidence_reference") = 2)
);
--> statement-breakpoint
CREATE TABLE "buyer_provenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"buyer_account_id" uuid NOT NULL,
	"buyer_contact_id" uuid,
	"field_key" text NOT NULL,
	"source_type" text NOT NULL,
	"source_reference" text NOT NULL,
	"rights_basis" text NOT NULL,
	"value_hash_sha256" text NOT NULL,
	"captured_by" text NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"correction_reason" text,
	"supersedes_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_provenance_source_type_check" CHECK ("buyer_provenance_records"."source_type" in ('customer_supplied', 'buyer_supplied', 'official_registry', 'licensed_provider', 'public_business_site', 'correction')),
	CONSTRAINT "buyer_provenance_rights_check" CHECK (char_length(btrim("buyer_provenance_records"."rights_basis")) > 0 and lower("buyer_provenance_records"."rights_basis") <> 'unknown'),
	CONSTRAINT "buyer_provenance_hash_check" CHECK ("buyer_provenance_records"."value_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "buyer_provenance_correction_check" CHECK (("buyer_provenance_records"."source_type" = 'correction') = ("buyer_provenance_records"."correction_reason" is not null and "buyer_provenance_records"."supersedes_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "buyer_rfq_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"rfq_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"attached_by" text NOT NULL,
	"attached_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyer_rfq_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"rfq_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"buyer_sku" text,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text NOT NULL,
	"target_unit_price_minor" integer,
	"target_currency" text,
	"required_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_rfq_lines_quantity_check" CHECK ("buyer_rfq_lines"."quantity" > 0),
	CONSTRAINT "buyer_rfq_lines_price_check" CHECK ("buyer_rfq_lines"."target_unit_price_minor" is null or ("buyer_rfq_lines"."target_unit_price_minor" >= 0 and char_length("buyer_rfq_lines"."target_currency") = 3))
);
--> statement-breakpoint
CREATE TABLE "buyer_rfq_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"rfq_id" uuid NOT NULL,
	"rfq_line_id" uuid,
	"requirement_type" text NOT NULL,
	"description" text NOT NULL,
	"mandatory" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"response" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_rfq_requirements_status_check" CHECK ("buyer_rfq_requirements"."status" in ('open', 'met', 'not_met', 'not_applicable')),
	CONSTRAINT "buyer_rfq_requirements_review_check" CHECK ("buyer_rfq_requirements"."status" = 'open' or num_nonnulls("buyer_rfq_requirements"."reviewed_by", "buyer_rfq_requirements"."reviewed_at") = 2)
);
--> statement-breakpoint
CREATE TABLE "buyer_rfqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"buyer_reference" text,
	"status" "buyer_rfq_status" DEFAULT 'draft' NOT NULL,
	"received_at" timestamp with time zone,
	"response_due_at" timestamp with time zone,
	"requested_currency" text NOT NULL,
	"requested_incoterm" "export_lane_incoterm",
	"delivery_country_code" text NOT NULL,
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_rfqs_currency_check" CHECK (char_length("buyer_rfqs"."requested_currency") = 3),
	CONSTRAINT "buyer_rfqs_country_check" CHECK ("buyer_rfqs"."delivery_country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "buyer_rfqs_received_check" CHECK ("buyer_rfqs"."status" = 'draft' or "buyer_rfqs"."received_at" is not null),
	CONSTRAINT "buyer_rfqs_version_check" CHECK ("buyer_rfqs"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "companion_workflow_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid,
	"workflow_type" text NOT NULL,
	"authority_name" text NOT NULL,
	"external_portal_url" text NOT NULL,
	"status" "companion_workflow_status" DEFAULT 'draft' NOT NULL,
	"due_at" timestamp with time zone,
	"reminder_at" timestamp with time zone,
	"owner_membership_id" uuid NOT NULL,
	"submission_reference" text,
	"submitted_by_actor_id" text,
	"submitted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companion_workflow_cases_type_check" CHECK ("companion_workflow_cases"."workflow_type" in ('bsw_clp_preparation', 'erc_olm_renewal', 'epb_exporter_pack', 'gsp_origin_pack', 'cash_incentive_pack', 'ad_bank_exp_proceeds', 'forwarder_handoff', 'eu_tariff_origin_evidence')),
	CONSTRAINT "companion_workflow_cases_submission_check" CHECK ("companion_workflow_cases"."status" not in ('submitted', 'completed') or num_nonnulls("companion_workflow_cases"."submission_reference", "companion_workflow_cases"."submitted_by_actor_id", "companion_workflow_cases"."submitted_at") = 3),
	CONSTRAINT "companion_workflow_cases_completion_check" CHECK ("companion_workflow_cases"."status" <> 'completed' or "companion_workflow_cases"."completed_at" is not null),
	CONSTRAINT "companion_workflow_cases_version_check" CHECK ("companion_workflow_cases"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "companion_workflow_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_case_id" uuid NOT NULL,
	"workflow_item_id" uuid,
	"document_version_id" uuid NOT NULL,
	"byte_size" integer NOT NULL,
	"purpose" text NOT NULL,
	"submitted_to_portal_by_customer" boolean DEFAULT false NOT NULL,
	"recorded_by" text NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companion_workflow_evidence_size_check" CHECK ("companion_workflow_evidence"."byte_size" > 0)
);
--> statement-breakpoint
CREATE TABLE "companion_workflow_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_case_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"source_rule_id" uuid,
	"status" text DEFAULT 'open' NOT NULL,
	"portal_max_bytes" integer,
	"responsibility" "responsibility" NOT NULL,
	"completed_by" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companion_workflow_items_sequence_check" CHECK ("companion_workflow_items"."sequence" >= 1),
	CONSTRAINT "companion_workflow_items_status_check" CHECK ("companion_workflow_items"."status" in ('open', 'in_progress', 'ready', 'completed', 'not_applicable', 'blocked')),
	CONSTRAINT "companion_workflow_items_portal_size_check" CHECK ("companion_workflow_items"."portal_max_bytes" is null or "companion_workflow_items"."portal_max_bytes" between 1024 and 104857600),
	CONSTRAINT "companion_workflow_items_completion_check" CHECK ("companion_workflow_items"."status" not in ('completed', 'not_applicable') or num_nonnulls("companion_workflow_items"."completed_by", "companion_workflow_items"."completed_at") = 2)
);
--> statement-breakpoint
CREATE TABLE "customer_billing_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"billing_account_id" uuid NOT NULL,
	"invoice_id" uuid,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"reason" text NOT NULL,
	"reference" text NOT NULL,
	"granted_by" text NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_billing_credits_amount_check" CHECK ("customer_billing_credits"."amount_minor" > 0 and "customer_billing_credits"."currency" = 'BDT')
);
--> statement-breakpoint
CREATE TABLE "customer_billing_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"billing_account_id" uuid NOT NULL,
	"subscription_id" uuid,
	"invoice_number" text NOT NULL,
	"status" "billing_invoice_status" DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"subtotal_minor" integer NOT NULL,
	"tax_minor" integer DEFAULT 0 NOT NULL,
	"credit_applied_minor" integer DEFAULT 0 NOT NULL,
	"total_minor" integer NOT NULL,
	"issued_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"document_storage_ref" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_billing_invoices_money_check" CHECK ("customer_billing_invoices"."currency" = 'BDT' and "customer_billing_invoices"."subtotal_minor" >= 0 and "customer_billing_invoices"."tax_minor" >= 0 and "customer_billing_invoices"."credit_applied_minor" >= 0 and "customer_billing_invoices"."total_minor" = "customer_billing_invoices"."subtotal_minor" + "customer_billing_invoices"."tax_minor" - "customer_billing_invoices"."credit_applied_minor" and "customer_billing_invoices"."total_minor" >= 0),
	CONSTRAINT "customer_billing_invoices_issue_check" CHECK ("customer_billing_invoices"."status" = 'draft' or num_nonnulls("customer_billing_invoices"."issued_at", "customer_billing_invoices"."due_at") = 2),
	CONSTRAINT "customer_billing_invoices_paid_check" CHECK ("customer_billing_invoices"."status" <> 'paid' or "customer_billing_invoices"."paid_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "customer_billing_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"reason" text NOT NULL,
	"status" "billing_transaction_status" DEFAULT 'pending' NOT NULL,
	"provider_reference" text,
	"approved_by" text NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_billing_refunds_amount_check" CHECK ("customer_billing_refunds"."amount_minor" > 0 and "customer_billing_refunds"."currency" = 'BDT'),
	CONSTRAINT "customer_billing_refunds_complete_check" CHECK ("customer_billing_refunds"."status" <> 'refunded' or "customer_billing_refunds"."completed_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "document_consistency_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_set_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"severity" text DEFAULT 'blocking' NOT NULL,
	"mismatch_snapshot" jsonb NOT NULL,
	"status" "consistency_issue_status" DEFAULT 'open' NOT NULL,
	"detected_at" timestamp with time zone NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_consistency_severity_check" CHECK ("document_consistency_issues"."severity" = 'blocking'),
	CONSTRAINT "document_consistency_resolution_check" CHECK ("document_consistency_issues"."status" = 'open' or num_nonnulls("document_consistency_issues"."resolved_by", "document_consistency_issues"."resolved_at", "document_consistency_issues"."resolution") = 3)
);
--> statement-breakpoint
CREATE TABLE "email_connection_deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email_connection_id" uuid NOT NULL,
	"requested_by" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"disconnected_at" timestamp with time zone,
	"provider_deletion_confirmed_at" timestamp with time zone,
	"local_deletion_confirmed_at" timestamp with time zone,
	"confirmation_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_connection_deletion_complete_check" CHECK (num_nonnulls("email_connection_deletion_requests"."provider_deletion_confirmed_at", "email_connection_deletion_requests"."local_deletion_confirmed_at", "email_connection_deletion_requests"."confirmation_reference") in (0, 3))
);
--> statement-breakpoint
CREATE TABLE "email_thread_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email_thread_id" uuid NOT NULL,
	"classification" text NOT NULL,
	"buyer_account_id" uuid,
	"opportunity_id" uuid,
	"rfq_id" uuid,
	"export_lane_id" uuid,
	"confidence_bps" integer NOT NULL,
	"method_version" text NOT NULL,
	"human_confirmed_by" text,
	"human_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_thread_mappings_class_check" CHECK ("email_thread_mappings"."classification" in ('rfq', 'buyer_reply', 'order', 'shipment', 'payment', 'other')),
	CONSTRAINT "email_thread_mappings_confidence_check" CHECK ("email_thread_mappings"."confidence_bps" between 0 and 10000),
	CONSTRAINT "email_thread_mappings_confirmation_check" CHECK (num_nonnulls("email_thread_mappings"."human_confirmed_by", "email_thread_mappings"."human_confirmed_at") in (0, 2))
);
--> statement-breakpoint
CREATE TABLE "financial_discrepancies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"trade_invoice_id" uuid,
	"payment_receipt_id" uuid,
	"discrepancy_type" text NOT NULL,
	"expected_minor" integer,
	"actual_minor" integer,
	"currency" text NOT NULL,
	"status" "exception_case_status" DEFAULT 'open' NOT NULL,
	"owner_membership_id" uuid NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"resolution" text,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financial_discrepancies_link_check" CHECK (num_nonnulls("financial_discrepancies"."trade_invoice_id", "financial_discrepancies"."payment_receipt_id") >= 1),
	CONSTRAINT "financial_discrepancies_money_check" CHECK (char_length("financial_discrepancies"."currency") = 3 and num_nonnulls("financial_discrepancies"."expected_minor", "financial_discrepancies"."actual_minor") >= 1),
	CONSTRAINT "financial_discrepancies_resolution_check" CHECK ("financial_discrepancies"."status" not in ('resolved', 'closed') or num_nonnulls("financial_discrepancies"."resolution", "financial_discrepancies"."resolved_by", "financial_discrepancies"."resolved_at") = 3)
);
--> statement-breakpoint
CREATE TABLE "generated_document_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"generated_document_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"normalized_value" text NOT NULL,
	"display_value" text NOT NULL,
	"source_entity_type" text NOT NULL,
	"source_entity_id" text NOT NULL,
	"source_field" text NOT NULL,
	"approved_value_hash_sha256" text NOT NULL,
	"source_approved_by" text NOT NULL,
	"source_approved_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "generated_document_fields_hash_check" CHECK ("generated_document_fields"."approved_value_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "generated_document_fields_source_check" CHECK (char_length(btrim("generated_document_fields"."source_entity_type")) > 0 and char_length(btrim("generated_document_fields"."source_entity_id")) > 0 and char_length(btrim("generated_document_fields"."source_field")) > 0)
);
--> statement-breakpoint
CREATE TABLE "generated_document_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"sales_order_version_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" "generated_document_status" DEFAULT 'draft' NOT NULL,
	"generation_policy_version" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "generated_document_sets_version_check" CHECK ("generated_document_sets"."version" >= 1),
	CONSTRAINT "generated_document_sets_approval_check" CHECK ("generated_document_sets"."status" <> 'approved' or num_nonnulls("generated_document_sets"."approved_by", "generated_document_sets"."approved_at") = 2)
);
--> statement-breakpoint
CREATE TABLE "generated_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_set_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"status" "generated_document_status" DEFAULT 'draft' NOT NULL,
	"output_storage_ref" text,
	"output_hash_sha256" text,
	"rendered_at" timestamp with time zone,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "generated_documents_type_check" CHECK ("generated_documents"."document_type" in ('pro_forma_invoice', 'commercial_invoice', 'packing_list', 'shipping_instruction', 'certificate_origin_checklist', 'exp_ad_bank_checklist', 'market_evidence_pack')),
	CONSTRAINT "generated_documents_output_check" CHECK (num_nonnulls("generated_documents"."output_storage_ref", "generated_documents"."output_hash_sha256", "generated_documents"."rendered_at") in (0, 3)),
	CONSTRAINT "generated_documents_hash_check" CHECK ("generated_documents"."output_hash_sha256" is null or "generated_documents"."output_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "generated_documents_review_check" CHECK ("generated_documents"."status" <> 'approved' or num_nonnulls("generated_documents"."reviewed_by", "generated_documents"."reviewed_at") = 2)
);
--> statement-breakpoint
CREATE TABLE "invoice_payment_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"trade_invoice_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"expected_amount_minor" integer NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"condition" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_payment_schedules_amount_check" CHECK ("invoice_payment_schedules"."sequence" >= 1 and "invoice_payment_schedules"."expected_amount_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "lane_outcome_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"metric_name" text NOT NULL,
	"integer_value" integer NOT NULL,
	"unit" text NOT NULL,
	"source_entity_type" text NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"measured_at" timestamp with time zone NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lane_outcome_metrics_name_check" CHECK ("lane_outcome_metrics"."metric_name" in ('actual_margin_bps', 'order_to_proceeds_minutes', 'invoiced_minor', 'realized_minor', 'exception_resolution_minutes'))
);
--> statement-breakpoint
CREATE TABLE "outbound_email_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"draft_id" uuid NOT NULL,
	"draft_version" integer NOT NULL,
	"body_hash_sha256" text NOT NULL,
	"decision" "approval_decision" NOT NULL,
	"decided_by" text NOT NULL,
	"rationale" text NOT NULL,
	"decided_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbound_email_approvals_version_check" CHECK ("outbound_email_approvals"."draft_version" >= 1),
	CONSTRAINT "outbound_email_approvals_hash_check" CHECK ("outbound_email_approvals"."body_hash_sha256" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "outbound_email_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"draft_id" uuid NOT NULL,
	"approval_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" "external_delivery_status" DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbound_email_deliveries_attempts_check" CHECK ("outbound_email_deliveries"."attempts" >= 0),
	CONSTRAINT "outbound_email_deliveries_delivered_check" CHECK ("outbound_email_deliveries"."status" <> 'delivered' or "outbound_email_deliveries"."delivered_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "outbound_email_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email_connection_id" uuid NOT NULL,
	"email_thread_id" uuid,
	"buyer_account_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"export_lane_id" uuid,
	"to_addresses" text[] NOT NULL,
	"cc_addresses" text[] DEFAULT '{}' NOT NULL,
	"subject" text NOT NULL,
	"body_storage_ref" text NOT NULL,
	"body_hash_sha256" text NOT NULL,
	"status" "outbound_draft_status" DEFAULT 'draft' NOT NULL,
	"next_task_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbound_email_drafts_recipient_check" CHECK (cardinality("outbound_email_drafts"."to_addresses") >= 1),
	CONSTRAINT "outbound_email_drafts_hash_check" CHECK ("outbound_email_drafts"."body_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "outbound_email_drafts_version_check" CHECK ("outbound_email_drafts"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payment_receipt_id" uuid NOT NULL,
	"trade_invoice_id" uuid NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"amount_minor" integer NOT NULL,
	"allocated_by" text NOT NULL,
	"allocated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_allocations_amount_check" CHECK ("payment_allocations"."amount_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"buyer_account_id" uuid NOT NULL,
	"status" "payment_receipt_status" DEFAULT 'reported' NOT NULL,
	"currency" text NOT NULL,
	"gross_amount_minor" integer NOT NULL,
	"bank_fee_minor" integer DEFAULT 0 NOT NULL,
	"other_fee_minor" integer DEFAULT 0 NOT NULL,
	"net_amount_minor" integer NOT NULL,
	"fx_rate_numerator" integer,
	"fx_rate_denominator" integer,
	"value_date" timestamp with time zone NOT NULL,
	"bank_advice_document_version_id" uuid,
	"bank_reference" text,
	"recorded_by" text NOT NULL,
	"confirmed_by" text,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_receipts_money_check" CHECK (char_length("payment_receipts"."currency") = 3 and "payment_receipts"."gross_amount_minor" > 0 and "payment_receipts"."bank_fee_minor" >= 0 and "payment_receipts"."other_fee_minor" >= 0 and "payment_receipts"."net_amount_minor" = "payment_receipts"."gross_amount_minor" - "payment_receipts"."bank_fee_minor" - "payment_receipts"."other_fee_minor" and "payment_receipts"."net_amount_minor" >= 0),
	CONSTRAINT "payment_receipts_fx_check" CHECK (num_nonnulls("payment_receipts"."fx_rate_numerator", "payment_receipts"."fx_rate_denominator") in (0, 2) and coalesce("payment_receipts"."fx_rate_numerator", 1) > 0 and coalesce("payment_receipts"."fx_rate_denominator", 1) > 0),
	CONSTRAINT "payment_receipts_advice_check" CHECK ("payment_receipts"."status" = 'reported' or "payment_receipts"."bank_advice_document_version_id" is not null),
	CONSTRAINT "payment_receipts_confirm_check" CHECK ("payment_receipts"."status" <> 'confirmed' or num_nonnulls("payment_receipts"."confirmed_by", "payment_receipts"."confirmed_at") = 2)
);
--> statement-breakpoint
CREATE TABLE "production_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"batch_reference" text NOT NULL,
	"product_id" uuid NOT NULL,
	"facility_id" uuid,
	"planned_quantity" integer NOT NULL,
	"completed_quantity" integer DEFAULT 0 NOT NULL,
	"capacity_reserved" integer NOT NULL,
	"status" "production_batch_status" DEFAULT 'planned' NOT NULL,
	"owner_membership_id" uuid NOT NULL,
	"planned_start_at" timestamp with time zone NOT NULL,
	"planned_release_at" timestamp with time zone NOT NULL,
	"actual_start_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"released_by" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_batches_quantity_check" CHECK ("production_batches"."planned_quantity" > 0 and "production_batches"."completed_quantity" between 0 and "production_batches"."planned_quantity" and "production_batches"."capacity_reserved" >= "production_batches"."planned_quantity"),
	CONSTRAINT "production_batches_window_check" CHECK ("production_batches"."planned_release_at" > "production_batches"."planned_start_at"),
	CONSTRAINT "production_batches_release_check" CHECK ("production_batches"."status" <> 'released' or num_nonnulls("production_batches"."released_at", "production_batches"."released_by") = 2),
	CONSTRAINT "production_batches_version_check" CHECK ("production_batches"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "production_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"production_batch_id" uuid NOT NULL,
	"inspection_type" text NOT NULL,
	"inspector_reference" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"result" text DEFAULT 'pending' NOT NULL,
	"evidence_document_version_id" uuid,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_inspections_result_check" CHECK ("production_inspections"."result" in ('pending', 'passed', 'conditional', 'failed')),
	CONSTRAINT "production_inspections_result_evidence_check" CHECK ("production_inspections"."result" = 'pending' or num_nonnulls("production_inspections"."completed_at", "production_inspections"."evidence_document_version_id", "production_inspections"."reviewed_by", "production_inspections"."reviewed_at") = 4)
);
--> statement-breakpoint
CREATE TABLE "production_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"production_batch_id" uuid NOT NULL,
	"title" text NOT NULL,
	"sequence" integer NOT NULL,
	"owner_membership_id" uuid NOT NULL,
	"planned_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_milestones_sequence_check" CHECK ("production_milestones"."sequence" >= 1),
	CONSTRAINT "production_milestones_completion_check" CHECK (num_nonnulls("production_milestones"."completed_at", "production_milestones"."completed_by") in (0, 2))
);
--> statement-breakpoint
CREATE TABLE "quotation_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"quotation_id" uuid NOT NULL,
	"quotation_version_id" uuid NOT NULL,
	"decision" "approval_decision" NOT NULL,
	"signatory_actor_id" text NOT NULL,
	"signatory_role" text NOT NULL,
	"policy_version" text NOT NULL,
	"rationale" text NOT NULL,
	"decided_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"quotation_id" uuid NOT NULL,
	"quotation_version_id" uuid NOT NULL,
	"approval_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"recipient" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" "external_delivery_status" DEFAULT 'pending' NOT NULL,
	"provider_reference" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failure_code" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotation_deliveries_attempts_check" CHECK ("quotation_deliveries"."attempts" >= 0),
	CONSTRAINT "quotation_deliveries_delivered_check" CHECK ("quotation_deliveries"."status" <> 'delivered' or "quotation_deliveries"."delivered_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "quotation_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"quotation_version_id" uuid NOT NULL,
	"rfq_line_id" uuid,
	"product_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"line_total_minor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotation_lines_math_check" CHECK ("quotation_lines"."quantity" > 0 and "quotation_lines"."unit_price_minor" >= 0 and "quotation_lines"."line_total_minor" = "quotation_lines"."quantity" * "quotation_lines"."unit_price_minor")
);
--> statement-breakpoint
CREATE TABLE "quotation_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"quotation_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"currency" text NOT NULL,
	"incoterm" "export_lane_incoterm" NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"assumptions" text[] DEFAULT '{}' NOT NULL,
	"freight_minor" integer DEFAULT 0 NOT NULL,
	"testing_minor" integer DEFAULT 0 NOT NULL,
	"finance_minor" integer DEFAULT 0 NOT NULL,
	"commission_minor" integer DEFAULT 0 NOT NULL,
	"fx_buffer_minor" integer DEFAULT 0 NOT NULL,
	"subtotal_minor" integer NOT NULL,
	"total_minor" integer NOT NULL,
	"payment_terms" text NOT NULL,
	"delivery_terms" text NOT NULL,
	"approval_policy_version" text NOT NULL,
	"content_hash_sha256" text NOT NULL,
	"generated_output_ref" text,
	"generated_output_hash_sha256" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotation_versions_version_check" CHECK ("quotation_versions"."version" >= 1),
	CONSTRAINT "quotation_versions_currency_check" CHECK (char_length("quotation_versions"."currency") = 3),
	CONSTRAINT "quotation_versions_money_check" CHECK ("quotation_versions"."freight_minor" >= 0 and "quotation_versions"."testing_minor" >= 0 and "quotation_versions"."finance_minor" >= 0 and "quotation_versions"."commission_minor" >= 0 and "quotation_versions"."fx_buffer_minor" >= 0 and "quotation_versions"."subtotal_minor" >= 0 and "quotation_versions"."total_minor" = "quotation_versions"."subtotal_minor" + "quotation_versions"."freight_minor" + "quotation_versions"."testing_minor" + "quotation_versions"."finance_minor" + "quotation_versions"."commission_minor" + "quotation_versions"."fx_buffer_minor"),
	CONSTRAINT "quotation_versions_hash_check" CHECK ("quotation_versions"."content_hash_sha256" ~ '^[a-f0-9]{64}$' and ("quotation_versions"."generated_output_hash_sha256" is null or "quotation_versions"."generated_output_hash_sha256" ~ '^[a-f0-9]{64}$')),
	CONSTRAINT "quotation_versions_output_check" CHECK (num_nonnulls("quotation_versions"."generated_output_ref", "quotation_versions"."generated_output_hash_sha256") in (0, 2))
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"rfq_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"status" "quotation_status" DEFAULT 'draft' NOT NULL,
	"current_version" integer DEFAULT 0 NOT NULL,
	"approved_version" integer,
	"accepted_version" integer,
	"owner_membership_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotations_current_version_check" CHECK ("quotations"."current_version" >= 0 and "quotations"."version" >= 1),
	CONSTRAINT "quotations_approval_version_check" CHECK ("quotations"."approved_version" is null or "quotations"."approved_version" between 1 and "quotations"."current_version"),
	CONSTRAINT "quotations_acceptance_version_check" CHECK ("quotations"."accepted_version" is null or ("quotations"."approved_version" = "quotations"."accepted_version" and "quotations"."accepted_version" = "quotations"."current_version"))
);
--> statement-breakpoint
CREATE TABLE "realized_proceeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"trade_invoice_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"invoiced_minor" integer NOT NULL,
	"received_minor" integer NOT NULL,
	"fees_minor" integer NOT NULL,
	"realized_minor" integer NOT NULL,
	"contribution_cost_minor" integer NOT NULL,
	"actual_margin_bps" integer NOT NULL,
	"cycle_time_minutes" integer NOT NULL,
	"confirmed_by" text NOT NULL,
	"confirmed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "realized_proceeds_money_check" CHECK (char_length("realized_proceeds"."currency") = 3 and "realized_proceeds"."invoiced_minor" > 0 and "realized_proceeds"."received_minor" >= 0 and "realized_proceeds"."fees_minor" >= 0 and "realized_proceeds"."realized_minor" = "realized_proceeds"."received_minor" - "realized_proceeds"."fees_minor" and "realized_proceeds"."realized_minor" >= 0 and "realized_proceeds"."contribution_cost_minor" >= 0),
	CONSTRAINT "realized_proceeds_margin_check" CHECK ("realized_proceeds"."actual_margin_bps" between -100000 and 10000 and "realized_proceeds"."cycle_time_minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sales_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"buyer_account_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "sales_opportunity_status" DEFAULT 'identified' NOT NULL,
	"owner_membership_id" uuid NOT NULL,
	"expected_value_minor" integer,
	"currency" text,
	"expected_close_at" timestamp with time zone,
	"loss_reason" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_opportunities_money_check" CHECK ("sales_opportunities"."expected_value_minor" is null or ("sales_opportunities"."expected_value_minor" >= 0 and char_length("sales_opportunities"."currency") = 3)),
	CONSTRAINT "sales_opportunities_loss_check" CHECK ("sales_opportunities"."status" <> 'lost' or "sales_opportunities"."loss_reason" is not null),
	CONSTRAINT "sales_opportunities_version_check" CHECK ("sales_opportunities"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "sales_order_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"change_type" text NOT NULL,
	"reason" text NOT NULL,
	"currency" text NOT NULL,
	"incoterm" "export_lane_incoterm" NOT NULL,
	"total_minor" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"content_hash_sha256" text NOT NULL,
	"confirmed_by" text NOT NULL,
	"confirmed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_order_versions_version_check" CHECK ("sales_order_versions"."version" >= 1),
	CONSTRAINT "sales_order_versions_change_check" CHECK ("sales_order_versions"."change_type" in ('initial', 'change_order') and ("sales_order_versions"."version" = 1) = ("sales_order_versions"."change_type" = 'initial')),
	CONSTRAINT "sales_order_versions_money_check" CHECK (char_length("sales_order_versions"."currency") = 3 and "sales_order_versions"."total_minor" >= 0),
	CONSTRAINT "sales_order_versions_hash_check" CHECK ("sales_order_versions"."content_hash_sha256" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"buyer_account_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"quotation_id" uuid NOT NULL,
	"accepted_quotation_version_id" uuid NOT NULL,
	"order_number" text NOT NULL,
	"status" "sales_order_status" DEFAULT 'draft' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"confirmed_by" text NOT NULL,
	"confirmed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_orders_version_check" CHECK ("sales_orders"."current_version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "shipment_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"shipment_id" uuid NOT NULL,
	"checkpoint_type" text NOT NULL,
	"location" text NOT NULL,
	"planned_at" timestamp with time zone,
	"actual_at" timestamp with time zone,
	"source" text NOT NULL,
	"external_reference" text,
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipment_checkpoints_time_check" CHECK (num_nonnulls("shipment_checkpoints"."planned_at", "shipment_checkpoints"."actual_at") >= 1)
);
--> statement-breakpoint
CREATE TABLE "shipment_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"shipment_id" uuid,
	"production_batch_id" uuid,
	"exception_type" text NOT NULL,
	"summary" text NOT NULL,
	"status" "exception_case_status" DEFAULT 'open' NOT NULL,
	"cost_impact_minor" integer DEFAULT 0 NOT NULL,
	"currency" text NOT NULL,
	"deadline_impact_minutes" integer DEFAULT 0 NOT NULL,
	"document_impact" boolean DEFAULT false NOT NULL,
	"buyer_communication_required" boolean DEFAULT false NOT NULL,
	"buyer_communication_audit_id" uuid,
	"owner_membership_id" uuid NOT NULL,
	"resolution" text,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipment_exceptions_link_check" CHECK (num_nonnulls("shipment_exceptions"."shipment_id", "shipment_exceptions"."production_batch_id") >= 1),
	CONSTRAINT "shipment_exceptions_impact_check" CHECK ("shipment_exceptions"."cost_impact_minor" >= 0 and char_length("shipment_exceptions"."currency") = 3 and "shipment_exceptions"."deadline_impact_minutes" >= 0),
	CONSTRAINT "shipment_exceptions_communication_check" CHECK (not "shipment_exceptions"."buyer_communication_required" or "shipment_exceptions"."buyer_communication_audit_id" is not null or "shipment_exceptions"."status" not in ('resolved', 'closed')),
	CONSTRAINT "shipment_exceptions_resolution_check" CHECK ("shipment_exceptions"."status" not in ('resolved', 'closed') or num_nonnulls("shipment_exceptions"."resolution", "shipment_exceptions"."resolved_by", "shipment_exceptions"."resolved_at") = 3),
	CONSTRAINT "shipment_exceptions_version_check" CHECK ("shipment_exceptions"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "shipment_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"shipment_id" uuid NOT NULL,
	"package_reference" text NOT NULL,
	"package_type" text NOT NULL,
	"item_count" integer NOT NULL,
	"net_weight_grams" integer NOT NULL,
	"gross_weight_grams" integer NOT NULL,
	"length_mm" integer,
	"width_mm" integer,
	"height_mm" integer,
	"marks_and_numbers" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipment_packages_count_weight_check" CHECK ("shipment_packages"."item_count" > 0 and "shipment_packages"."net_weight_grams" > 0 and "shipment_packages"."gross_weight_grams" >= "shipment_packages"."net_weight_grams"),
	CONSTRAINT "shipment_packages_dimensions_check" CHECK (num_nonnulls("shipment_packages"."length_mm", "shipment_packages"."width_mm", "shipment_packages"."height_mm") in (0, 3))
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"shipment_reference" text NOT NULL,
	"booking_reference" text,
	"carrier_reference" text,
	"forwarder_reference" text,
	"status" "shipment_status" DEFAULT 'planning' NOT NULL,
	"mode" text NOT NULL,
	"origin_location" text NOT NULL,
	"destination_location" text NOT NULL,
	"planned_departure_at" timestamp with time zone NOT NULL,
	"planned_arrival_at" timestamp with time zone NOT NULL,
	"actual_departure_at" timestamp with time zone,
	"actual_arrival_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"owner_membership_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_mode_check" CHECK ("shipments"."mode" in ('sea', 'air', 'road', 'rail', 'multimodal', 'courier')),
	CONSTRAINT "shipments_plan_window_check" CHECK ("shipments"."planned_arrival_at" > "shipments"."planned_departure_at"),
	CONSTRAINT "shipments_booked_check" CHECK ("shipments"."status" = 'planning' or "shipments"."booking_reference" is not null),
	CONSTRAINT "shipments_delivery_check" CHECK ("shipments"."status" <> 'delivered' or "shipments"."delivered_at" is not null),
	CONSTRAINT "shipments_version_check" CHECK ("shipments"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "trade_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"shipment_id" uuid,
	"invoice_number" text NOT NULL,
	"status" "trade_invoice_status" DEFAULT 'draft' NOT NULL,
	"currency" text NOT NULL,
	"invoice_total_minor" integer NOT NULL,
	"allocated_minor" integer DEFAULT 0 NOT NULL,
	"payment_terms" text NOT NULL,
	"issued_at" timestamp with time zone,
	"due_at" timestamp with time zone NOT NULL,
	"generated_document_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trade_invoices_money_check" CHECK (char_length("trade_invoices"."currency") = 3 and "trade_invoices"."invoice_total_minor" > 0 and "trade_invoices"."allocated_minor" between 0 and "trade_invoices"."invoice_total_minor"),
	CONSTRAINT "trade_invoices_issue_check" CHECK ("trade_invoices"."status" = 'draft' or "trade_invoices"."issued_at" is not null),
	CONSTRAINT "trade_invoices_version_check" CHECK ("trade_invoices"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "usage_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_id" uuid,
	"usage_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost_minor" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"source_entity_type" text NOT NULL,
	"source_entity_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_ledger_entries_type_check" CHECK ("usage_ledger_entries"."usage_type" in ('automation_unit', 'work_pack', 'active_lane', 'editor', 'specialist_minute')),
	CONSTRAINT "usage_ledger_entries_quantity_check" CHECK ("usage_ledger_entries"."quantity" > 0 and "usage_ledger_entries"."unit_cost_minor" >= 0 and "usage_ledger_entries"."currency" = 'BDT')
);
--> statement-breakpoint
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_entitlement_transitions" ADD CONSTRAINT "billing_entitlement_transitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_entitlement_transitions" ADD CONSTRAINT "billing_entitlement_transitions_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_entitlement_transitions" ADD CONSTRAINT "billing_entitlement_transitions_entitlement_id_organization_entitlements_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."organization_entitlements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD CONSTRAINT "billing_plan_prices_catalog_version_id_billing_plan_catalog_versions_id_fk" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."billing_plan_catalog_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_provider_events" ADD CONSTRAINT "billing_provider_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_reconciliation_results" ADD CONSTRAINT "billing_reconciliation_results_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_reconciliation_results" ADD CONSTRAINT "billing_reconciliation_results_billing_account_id_billing_accounts_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "public"."billing_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscription_history" ADD CONSTRAINT "billing_subscription_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscription_history" ADD CONSTRAINT "billing_subscription_history_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_billing_account_id_billing_accounts_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "public"."billing_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_plan_price_id_billing_plan_prices_id_fk" FOREIGN KEY ("plan_price_id") REFERENCES "public"."billing_plan_prices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_entitlement_id_organization_entitlements_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."organization_entitlements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_invoice_id_customer_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."customer_billing_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_accounts" ADD CONSTRAINT "buyer_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_communication_audit" ADD CONSTRAINT "buyer_communication_audit_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_communication_audit" ADD CONSTRAINT "buyer_communication_audit_buyer_account_id_buyer_accounts_id_fk" FOREIGN KEY ("buyer_account_id") REFERENCES "public"."buyer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_communication_audit" ADD CONSTRAINT "buyer_communication_audit_buyer_contact_id_buyer_contacts_id_fk" FOREIGN KEY ("buyer_contact_id") REFERENCES "public"."buyer_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_communication_audit" ADD CONSTRAINT "buyer_communication_audit_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_communication_audit" ADD CONSTRAINT "buyer_communication_audit_consent_record_id_buyer_outreach_consents_id_fk" FOREIGN KEY ("consent_record_id") REFERENCES "public"."buyer_outreach_consents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_contacts" ADD CONSTRAINT "buyer_contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_contacts" ADD CONSTRAINT "buyer_contacts_buyer_account_id_buyer_accounts_id_fk" FOREIGN KEY ("buyer_account_id") REFERENCES "public"."buyer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_outreach_consents" ADD CONSTRAINT "buyer_outreach_consents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_outreach_consents" ADD CONSTRAINT "buyer_outreach_consents_buyer_account_id_buyer_accounts_id_fk" FOREIGN KEY ("buyer_account_id") REFERENCES "public"."buyer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_outreach_consents" ADD CONSTRAINT "buyer_outreach_consents_buyer_contact_id_buyer_contacts_id_fk" FOREIGN KEY ("buyer_contact_id") REFERENCES "public"."buyer_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_provenance_records" ADD CONSTRAINT "buyer_provenance_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_provenance_records" ADD CONSTRAINT "buyer_provenance_records_buyer_account_id_buyer_accounts_id_fk" FOREIGN KEY ("buyer_account_id") REFERENCES "public"."buyer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_provenance_records" ADD CONSTRAINT "buyer_provenance_records_buyer_contact_id_buyer_contacts_id_fk" FOREIGN KEY ("buyer_contact_id") REFERENCES "public"."buyer_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfq_attachments" ADD CONSTRAINT "buyer_rfq_attachments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfq_attachments" ADD CONSTRAINT "buyer_rfq_attachments_rfq_id_buyer_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."buyer_rfqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfq_attachments" ADD CONSTRAINT "buyer_rfq_attachments_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfq_lines" ADD CONSTRAINT "buyer_rfq_lines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfq_lines" ADD CONSTRAINT "buyer_rfq_lines_rfq_id_buyer_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."buyer_rfqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfq_lines" ADD CONSTRAINT "buyer_rfq_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfq_requirements" ADD CONSTRAINT "buyer_rfq_requirements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfq_requirements" ADD CONSTRAINT "buyer_rfq_requirements_rfq_id_buyer_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."buyer_rfqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfq_requirements" ADD CONSTRAINT "buyer_rfq_requirements_rfq_line_id_buyer_rfq_lines_id_fk" FOREIGN KEY ("rfq_line_id") REFERENCES "public"."buyer_rfq_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfqs" ADD CONSTRAINT "buyer_rfqs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfqs" ADD CONSTRAINT "buyer_rfqs_opportunity_id_sales_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."sales_opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_rfqs" ADD CONSTRAINT "buyer_rfqs_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_workflow_cases" ADD CONSTRAINT "companion_workflow_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_workflow_cases" ADD CONSTRAINT "companion_workflow_cases_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_workflow_cases" ADD CONSTRAINT "companion_workflow_cases_owner_membership_id_organization_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_workflow_evidence" ADD CONSTRAINT "companion_workflow_evidence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_workflow_evidence" ADD CONSTRAINT "companion_workflow_evidence_workflow_case_id_companion_workflow_cases_id_fk" FOREIGN KEY ("workflow_case_id") REFERENCES "public"."companion_workflow_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_workflow_evidence" ADD CONSTRAINT "companion_workflow_evidence_workflow_item_id_companion_workflow_items_id_fk" FOREIGN KEY ("workflow_item_id") REFERENCES "public"."companion_workflow_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_workflow_evidence" ADD CONSTRAINT "companion_workflow_evidence_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_workflow_items" ADD CONSTRAINT "companion_workflow_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_workflow_items" ADD CONSTRAINT "companion_workflow_items_workflow_case_id_companion_workflow_cases_id_fk" FOREIGN KEY ("workflow_case_id") REFERENCES "public"."companion_workflow_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_workflow_items" ADD CONSTRAINT "companion_workflow_items_source_rule_id_regulatory_rules_id_fk" FOREIGN KEY ("source_rule_id") REFERENCES "public"."regulatory_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_billing_credits" ADD CONSTRAINT "customer_billing_credits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_billing_credits" ADD CONSTRAINT "customer_billing_credits_billing_account_id_billing_accounts_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "public"."billing_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_billing_credits" ADD CONSTRAINT "customer_billing_credits_invoice_id_customer_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."customer_billing_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_billing_invoices" ADD CONSTRAINT "customer_billing_invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_billing_invoices" ADD CONSTRAINT "customer_billing_invoices_billing_account_id_billing_accounts_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "public"."billing_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_billing_invoices" ADD CONSTRAINT "customer_billing_invoices_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_billing_refunds" ADD CONSTRAINT "customer_billing_refunds_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_billing_refunds" ADD CONSTRAINT "customer_billing_refunds_invoice_id_customer_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."customer_billing_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_consistency_issues" ADD CONSTRAINT "document_consistency_issues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_consistency_issues" ADD CONSTRAINT "document_consistency_issues_document_set_id_generated_document_sets_id_fk" FOREIGN KEY ("document_set_id") REFERENCES "public"."generated_document_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_connection_deletion_requests" ADD CONSTRAINT "email_connection_deletion_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_connection_deletion_requests" ADD CONSTRAINT "email_connection_deletion_requests_email_connection_id_email_connections_id_fk" FOREIGN KEY ("email_connection_id") REFERENCES "public"."email_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_thread_mappings" ADD CONSTRAINT "email_thread_mappings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_thread_mappings" ADD CONSTRAINT "email_thread_mappings_email_thread_id_email_threads_id_fk" FOREIGN KEY ("email_thread_id") REFERENCES "public"."email_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_thread_mappings" ADD CONSTRAINT "email_thread_mappings_buyer_account_id_buyer_accounts_id_fk" FOREIGN KEY ("buyer_account_id") REFERENCES "public"."buyer_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_thread_mappings" ADD CONSTRAINT "email_thread_mappings_opportunity_id_sales_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."sales_opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_thread_mappings" ADD CONSTRAINT "email_thread_mappings_rfq_id_buyer_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."buyer_rfqs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_thread_mappings" ADD CONSTRAINT "email_thread_mappings_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_discrepancies" ADD CONSTRAINT "financial_discrepancies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_discrepancies" ADD CONSTRAINT "financial_discrepancies_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_discrepancies" ADD CONSTRAINT "financial_discrepancies_trade_invoice_id_trade_invoices_id_fk" FOREIGN KEY ("trade_invoice_id") REFERENCES "public"."trade_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_discrepancies" ADD CONSTRAINT "financial_discrepancies_payment_receipt_id_payment_receipts_id_fk" FOREIGN KEY ("payment_receipt_id") REFERENCES "public"."payment_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_discrepancies" ADD CONSTRAINT "financial_discrepancies_owner_membership_id_organization_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_document_fields" ADD CONSTRAINT "generated_document_fields_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_document_fields" ADD CONSTRAINT "generated_document_fields_generated_document_id_generated_documents_id_fk" FOREIGN KEY ("generated_document_id") REFERENCES "public"."generated_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_document_sets" ADD CONSTRAINT "generated_document_sets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_document_sets" ADD CONSTRAINT "generated_document_sets_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_document_sets" ADD CONSTRAINT "generated_document_sets_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_document_sets" ADD CONSTRAINT "generated_document_sets_sales_order_version_id_sales_order_versions_id_fk" FOREIGN KEY ("sales_order_version_id") REFERENCES "public"."sales_order_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_document_set_id_generated_document_sets_id_fk" FOREIGN KEY ("document_set_id") REFERENCES "public"."generated_document_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment_schedules" ADD CONSTRAINT "invoice_payment_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment_schedules" ADD CONSTRAINT "invoice_payment_schedules_trade_invoice_id_trade_invoices_id_fk" FOREIGN KEY ("trade_invoice_id") REFERENCES "public"."trade_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lane_outcome_metrics" ADD CONSTRAINT "lane_outcome_metrics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lane_outcome_metrics" ADD CONSTRAINT "lane_outcome_metrics_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_approvals" ADD CONSTRAINT "outbound_email_approvals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_approvals" ADD CONSTRAINT "outbound_email_approvals_draft_id_outbound_email_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."outbound_email_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_deliveries" ADD CONSTRAINT "outbound_email_deliveries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_deliveries" ADD CONSTRAINT "outbound_email_deliveries_draft_id_outbound_email_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."outbound_email_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_deliveries" ADD CONSTRAINT "outbound_email_deliveries_approval_id_outbound_email_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."outbound_email_approvals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_drafts" ADD CONSTRAINT "outbound_email_drafts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_drafts" ADD CONSTRAINT "outbound_email_drafts_email_connection_id_email_connections_id_fk" FOREIGN KEY ("email_connection_id") REFERENCES "public"."email_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_drafts" ADD CONSTRAINT "outbound_email_drafts_email_thread_id_email_threads_id_fk" FOREIGN KEY ("email_thread_id") REFERENCES "public"."email_threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_drafts" ADD CONSTRAINT "outbound_email_drafts_buyer_account_id_buyer_accounts_id_fk" FOREIGN KEY ("buyer_account_id") REFERENCES "public"."buyer_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_drafts" ADD CONSTRAINT "outbound_email_drafts_opportunity_id_sales_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."sales_opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_drafts" ADD CONSTRAINT "outbound_email_drafts_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_email_drafts" ADD CONSTRAINT "outbound_email_drafts_next_task_id_tasks_id_fk" FOREIGN KEY ("next_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_receipt_id_payment_receipts_id_fk" FOREIGN KEY ("payment_receipt_id") REFERENCES "public"."payment_receipts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_trade_invoice_id_trade_invoices_id_fk" FOREIGN KEY ("trade_invoice_id") REFERENCES "public"."trade_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_buyer_account_id_buyer_accounts_id_fk" FOREIGN KEY ("buyer_account_id") REFERENCES "public"."buyer_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_bank_advice_document_version_id_document_versions_id_fk" FOREIGN KEY ("bank_advice_document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_owner_membership_id_organization_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_inspections" ADD CONSTRAINT "production_inspections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_inspections" ADD CONSTRAINT "production_inspections_production_batch_id_production_batches_id_fk" FOREIGN KEY ("production_batch_id") REFERENCES "public"."production_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_inspections" ADD CONSTRAINT "production_inspections_evidence_document_version_id_document_versions_id_fk" FOREIGN KEY ("evidence_document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_milestones" ADD CONSTRAINT "production_milestones_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_milestones" ADD CONSTRAINT "production_milestones_production_batch_id_production_batches_id_fk" FOREIGN KEY ("production_batch_id") REFERENCES "public"."production_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_milestones" ADD CONSTRAINT "production_milestones_owner_membership_id_organization_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_approvals" ADD CONSTRAINT "quotation_approvals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_approvals" ADD CONSTRAINT "quotation_approvals_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_approvals" ADD CONSTRAINT "quotation_approvals_quotation_version_id_quotation_versions_id_fk" FOREIGN KEY ("quotation_version_id") REFERENCES "public"."quotation_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_deliveries" ADD CONSTRAINT "quotation_deliveries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_deliveries" ADD CONSTRAINT "quotation_deliveries_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_deliveries" ADD CONSTRAINT "quotation_deliveries_quotation_version_id_quotation_versions_id_fk" FOREIGN KEY ("quotation_version_id") REFERENCES "public"."quotation_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_deliveries" ADD CONSTRAINT "quotation_deliveries_approval_id_quotation_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."quotation_approvals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_quotation_version_id_quotation_versions_id_fk" FOREIGN KEY ("quotation_version_id") REFERENCES "public"."quotation_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_rfq_line_id_buyer_rfq_lines_id_fk" FOREIGN KEY ("rfq_line_id") REFERENCES "public"."buyer_rfq_lines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_versions" ADD CONSTRAINT "quotation_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_versions" ADD CONSTRAINT "quotation_versions_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_rfq_id_buyer_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."buyer_rfqs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_opportunity_id_sales_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."sales_opportunities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_owner_membership_id_organization_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realized_proceeds" ADD CONSTRAINT "realized_proceeds_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realized_proceeds" ADD CONSTRAINT "realized_proceeds_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realized_proceeds" ADD CONSTRAINT "realized_proceeds_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realized_proceeds" ADD CONSTRAINT "realized_proceeds_trade_invoice_id_trade_invoices_id_fk" FOREIGN KEY ("trade_invoice_id") REFERENCES "public"."trade_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_buyer_account_id_buyer_accounts_id_fk" FOREIGN KEY ("buyer_account_id") REFERENCES "public"."buyer_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_owner_membership_id_organization_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_versions" ADD CONSTRAINT "sales_order_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_versions" ADD CONSTRAINT "sales_order_versions_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_buyer_account_id_buyer_accounts_id_fk" FOREIGN KEY ("buyer_account_id") REFERENCES "public"."buyer_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_opportunity_id_sales_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."sales_opportunities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_accepted_quotation_version_id_quotation_versions_id_fk" FOREIGN KEY ("accepted_quotation_version_id") REFERENCES "public"."quotation_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_checkpoints" ADD CONSTRAINT "shipment_checkpoints_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_checkpoints" ADD CONSTRAINT "shipment_checkpoints_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_exceptions" ADD CONSTRAINT "shipment_exceptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_exceptions" ADD CONSTRAINT "shipment_exceptions_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_exceptions" ADD CONSTRAINT "shipment_exceptions_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_exceptions" ADD CONSTRAINT "shipment_exceptions_production_batch_id_production_batches_id_fk" FOREIGN KEY ("production_batch_id") REFERENCES "public"."production_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_exceptions" ADD CONSTRAINT "shipment_exceptions_buyer_communication_audit_id_buyer_communication_audit_id_fk" FOREIGN KEY ("buyer_communication_audit_id") REFERENCES "public"."buyer_communication_audit"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_exceptions" ADD CONSTRAINT "shipment_exceptions_owner_membership_id_organization_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_packages" ADD CONSTRAINT "shipment_packages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_packages" ADD CONSTRAINT "shipment_packages_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_owner_membership_id_organization_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_invoices" ADD CONSTRAINT "trade_invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_invoices" ADD CONSTRAINT "trade_invoices_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_invoices" ADD CONSTRAINT "trade_invoices_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_invoices" ADD CONSTRAINT "trade_invoices_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_invoices" ADD CONSTRAINT "trade_invoices_generated_document_id_generated_documents_id_fk" FOREIGN KEY ("generated_document_id") REFERENCES "public"."generated_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger_entries" ADD CONSTRAINT "usage_ledger_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger_entries" ADD CONSTRAINT "usage_ledger_entries_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_accounts_org_id_unique" ON "billing_accounts" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "billing_entitlement_transitions_org_subscription_idx" ON "billing_entitlement_transitions" USING btree ("organization_id","subscription_id","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_plan_prices_catalog_name_unique" ON "billing_plan_prices" USING btree ("catalog_version_id","display_name");--> statement-breakpoint
CREATE INDEX "billing_plan_prices_catalog_product_idx" ON "billing_plan_prices" USING btree ("catalog_version_id","product_key");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_provider_events_provider_event_unique" ON "billing_provider_events" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE INDEX "billing_provider_events_org_received_idx" ON "billing_provider_events" USING btree ("organization_id","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_reconciliation_account_period_unique" ON "billing_reconciliation_results" USING btree ("billing_account_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "billing_reconciliation_org_status_idx" ON "billing_reconciliation_results" USING btree ("organization_id","status","reconciled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscription_history_version_unique" ON "billing_subscription_history" USING btree ("subscription_id","aggregate_version");--> statement-breakpoint
CREATE INDEX "billing_subscription_history_org_subscription_idx" ON "billing_subscription_history" USING btree ("organization_id","subscription_id","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_org_id_unique" ON "billing_subscriptions" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_org_status_idx" ON "billing_subscriptions" USING btree ("organization_id","status","current_period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_transactions_org_key_unique" ON "billing_transactions" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_transactions_provider_id_unique" ON "billing_transactions" USING btree ("provider","provider_transaction_id");--> statement-breakpoint
CREATE INDEX "billing_transactions_org_status_idx" ON "billing_transactions" USING btree ("organization_id","status","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "buyer_accounts_org_id_unique" ON "buyer_accounts" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "buyer_accounts_org_name_idx" ON "buyer_accounts" USING btree ("organization_id","legal_name");--> statement-breakpoint
CREATE INDEX "buyer_accounts_org_status_idx" ON "buyer_accounts" USING btree ("organization_id","verification_status","risk_status");--> statement-breakpoint
CREATE INDEX "buyer_communication_org_buyer_time_idx" ON "buyer_communication_audit" USING btree ("organization_id","buyer_account_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "buyer_contacts_org_id_unique" ON "buyer_contacts" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "buyer_contacts_org_buyer_idx" ON "buyer_contacts" USING btree ("organization_id","buyer_account_id");--> statement-breakpoint
CREATE INDEX "buyer_outreach_org_buyer_channel_idx" ON "buyer_outreach_consents" USING btree ("organization_id","buyer_account_id","channel","effective_at");--> statement-breakpoint
CREATE UNIQUE INDEX "buyer_provenance_org_id_unique" ON "buyer_provenance_records" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "buyer_provenance_org_buyer_field_idx" ON "buyer_provenance_records" USING btree ("organization_id","buyer_account_id","field_key");--> statement-breakpoint
CREATE UNIQUE INDEX "buyer_rfq_attachments_unique" ON "buyer_rfq_attachments" USING btree ("rfq_id","document_version_id");--> statement-breakpoint
CREATE INDEX "buyer_rfq_attachments_org_rfq_idx" ON "buyer_rfq_attachments" USING btree ("organization_id","rfq_id");--> statement-breakpoint
CREATE UNIQUE INDEX "buyer_rfq_lines_org_id_unique" ON "buyer_rfq_lines" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "buyer_rfq_lines_org_rfq_idx" ON "buyer_rfq_lines" USING btree ("organization_id","rfq_id");--> statement-breakpoint
CREATE INDEX "buyer_rfq_requirements_org_rfq_idx" ON "buyer_rfq_requirements" USING btree ("organization_id","rfq_id");--> statement-breakpoint
CREATE UNIQUE INDEX "buyer_rfqs_org_id_unique" ON "buyer_rfqs" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "buyer_rfqs_org_status_due_idx" ON "buyer_rfqs" USING btree ("organization_id","status","response_due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "companion_workflow_cases_org_id_unique" ON "companion_workflow_cases" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "companion_workflow_cases_org_status_due_idx" ON "companion_workflow_cases" USING btree ("organization_id","status","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "companion_workflow_evidence_unique" ON "companion_workflow_evidence" USING btree ("workflow_case_id","document_version_id","purpose");--> statement-breakpoint
CREATE INDEX "companion_workflow_evidence_org_case_idx" ON "companion_workflow_evidence" USING btree ("organization_id","workflow_case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "companion_workflow_items_case_sequence_unique" ON "companion_workflow_items" USING btree ("workflow_case_id","sequence");--> statement-breakpoint
CREATE INDEX "companion_workflow_items_org_case_idx" ON "companion_workflow_items" USING btree ("organization_id","workflow_case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_billing_credits_org_reference_unique" ON "customer_billing_credits" USING btree ("organization_id","reference");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_billing_invoices_org_id_unique" ON "customer_billing_invoices" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_billing_invoices_org_number_unique" ON "customer_billing_invoices" USING btree ("organization_id","invoice_number");--> statement-breakpoint
CREATE INDEX "customer_billing_invoices_org_status_due_idx" ON "customer_billing_invoices" USING btree ("organization_id","status","due_at");--> statement-breakpoint
CREATE INDEX "customer_billing_refunds_org_status_idx" ON "customer_billing_refunds" USING btree ("organization_id","status","approved_at");--> statement-breakpoint
CREATE UNIQUE INDEX "document_consistency_open_unique" ON "document_consistency_issues" USING btree ("document_set_id","field_key") WHERE "document_consistency_issues"."status" = 'open';--> statement-breakpoint
CREATE INDEX "document_consistency_org_status_idx" ON "document_consistency_issues" USING btree ("organization_id","status","detected_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_connection_deletion_connection_unique" ON "email_connection_deletion_requests" USING btree ("email_connection_id");--> statement-breakpoint
CREATE INDEX "email_connection_deletion_org_requested_idx" ON "email_connection_deletion_requests" USING btree ("organization_id","requested_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_thread_mappings_thread_unique" ON "email_thread_mappings" USING btree ("email_thread_id");--> statement-breakpoint
CREATE INDEX "email_thread_mappings_org_class_idx" ON "email_thread_mappings" USING btree ("organization_id","classification");--> statement-breakpoint
CREATE INDEX "financial_discrepancies_org_status_due_idx" ON "financial_discrepancies" USING btree ("organization_id","status","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "generated_document_fields_document_key_unique" ON "generated_document_fields" USING btree ("generated_document_id","field_key");--> statement-breakpoint
CREATE INDEX "generated_document_fields_org_key_idx" ON "generated_document_fields" USING btree ("organization_id","field_key");--> statement-breakpoint
CREATE UNIQUE INDEX "generated_document_sets_order_version_unique" ON "generated_document_sets" USING btree ("sales_order_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "generated_document_sets_org_id_unique" ON "generated_document_sets" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "generated_document_sets_org_lane_idx" ON "generated_document_sets" USING btree ("organization_id","export_lane_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "generated_documents_set_type_unique" ON "generated_documents" USING btree ("document_set_id","document_type");--> statement-breakpoint
CREATE UNIQUE INDEX "generated_documents_org_id_unique" ON "generated_documents" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_payment_schedules_invoice_sequence_unique" ON "invoice_payment_schedules" USING btree ("trade_invoice_id","sequence");--> statement-breakpoint
CREATE INDEX "invoice_payment_schedules_org_due_idx" ON "invoice_payment_schedules" USING btree ("organization_id","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lane_outcome_metrics_source_metric_unique" ON "lane_outcome_metrics" USING btree ("organization_id","source_entity_type","source_entity_id","metric_name");--> statement-breakpoint
CREATE INDEX "lane_outcome_metrics_org_lane_time_idx" ON "lane_outcome_metrics" USING btree ("organization_id","export_lane_id","measured_at");--> statement-breakpoint
CREATE UNIQUE INDEX "outbound_email_approvals_draft_version_unique" ON "outbound_email_approvals" USING btree ("draft_id","draft_version");--> statement-breakpoint
CREATE UNIQUE INDEX "outbound_email_deliveries_org_key_unique" ON "outbound_email_deliveries" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "outbound_email_deliveries_org_status_idx" ON "outbound_email_deliveries" USING btree ("organization_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "outbound_email_drafts_org_id_unique" ON "outbound_email_drafts" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "outbound_email_drafts_org_status_idx" ON "outbound_email_drafts" USING btree ("organization_id","status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_allocations_receipt_invoice_unique" ON "payment_allocations" USING btree ("payment_receipt_id","trade_invoice_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_org_lane_idx" ON "payment_allocations" USING btree ("organization_id","export_lane_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_receipts_org_id_unique" ON "payment_receipts" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "payment_receipts_org_value_date_idx" ON "payment_receipts" USING btree ("organization_id","value_date");--> statement-breakpoint
CREATE UNIQUE INDEX "production_batches_org_id_unique" ON "production_batches" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "production_batches_org_ref_unique" ON "production_batches" USING btree ("organization_id","batch_reference");--> statement-breakpoint
CREATE INDEX "production_batches_org_status_release_idx" ON "production_batches" USING btree ("organization_id","status","planned_release_at");--> statement-breakpoint
CREATE INDEX "production_inspections_org_batch_idx" ON "production_inspections" USING btree ("organization_id","production_batch_id","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "production_milestones_batch_sequence_unique" ON "production_milestones" USING btree ("production_batch_id","sequence");--> statement-breakpoint
CREATE INDEX "production_milestones_org_plan_idx" ON "production_milestones" USING btree ("organization_id","planned_at");--> statement-breakpoint
CREATE UNIQUE INDEX "quotation_approvals_version_signatory_unique" ON "quotation_approvals" USING btree ("quotation_version_id","signatory_actor_id");--> statement-breakpoint
CREATE INDEX "quotation_approvals_org_quote_idx" ON "quotation_approvals" USING btree ("organization_id","quotation_id","decided_at");--> statement-breakpoint
CREATE UNIQUE INDEX "quotation_deliveries_org_idempotency_unique" ON "quotation_deliveries" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "quotation_deliveries_org_status_idx" ON "quotation_deliveries" USING btree ("organization_id","status","created_at");--> statement-breakpoint
CREATE INDEX "quotation_lines_org_version_idx" ON "quotation_lines" USING btree ("organization_id","quotation_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotation_versions_quotation_version_unique" ON "quotation_versions" USING btree ("quotation_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "quotation_versions_org_id_unique" ON "quotation_versions" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "quotation_versions_org_quotation_idx" ON "quotation_versions" USING btree ("organization_id","quotation_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "quotations_org_id_unique" ON "quotations" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotations_org_rfq_unique" ON "quotations" USING btree ("organization_id","rfq_id");--> statement-breakpoint
CREATE INDEX "quotations_org_status_idx" ON "quotations" USING btree ("organization_id","status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "realized_proceeds_invoice_unique" ON "realized_proceeds" USING btree ("organization_id","trade_invoice_id");--> statement-breakpoint
CREATE INDEX "realized_proceeds_org_lane_idx" ON "realized_proceeds" USING btree ("organization_id","export_lane_id","confirmed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_opportunities_org_id_unique" ON "sales_opportunities" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "sales_opportunities_org_status_idx" ON "sales_opportunities" USING btree ("organization_id","status","expected_close_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_order_versions_order_version_unique" ON "sales_order_versions" USING btree ("sales_order_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_order_versions_org_id_unique" ON "sales_order_versions" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_orders_org_id_unique" ON "sales_orders" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_orders_org_number_unique" ON "sales_orders" USING btree ("organization_id","order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_orders_quote_unique" ON "sales_orders" USING btree ("organization_id","quotation_id");--> statement-breakpoint
CREATE INDEX "sales_orders_org_status_idx" ON "sales_orders" USING btree ("organization_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "shipment_checkpoints_org_shipment_time_idx" ON "shipment_checkpoints" USING btree ("organization_id","shipment_id","actual_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shipment_exceptions_org_id_unique" ON "shipment_exceptions" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "shipment_exceptions_org_status_idx" ON "shipment_exceptions" USING btree ("organization_id","status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shipment_packages_shipment_ref_unique" ON "shipment_packages" USING btree ("shipment_id","package_reference");--> statement-breakpoint
CREATE INDEX "shipment_packages_org_shipment_idx" ON "shipment_packages" USING btree ("organization_id","shipment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shipments_org_id_unique" ON "shipments" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "shipments_org_ref_unique" ON "shipments" USING btree ("organization_id","shipment_reference");--> statement-breakpoint
CREATE INDEX "shipments_org_status_departure_idx" ON "shipments" USING btree ("organization_id","status","planned_departure_at");--> statement-breakpoint
CREATE UNIQUE INDEX "trade_invoices_org_id_unique" ON "trade_invoices" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "trade_invoices_org_number_unique" ON "trade_invoices" USING btree ("organization_id","invoice_number");--> statement-breakpoint
CREATE INDEX "trade_invoices_org_status_due_idx" ON "trade_invoices" USING btree ("organization_id","status","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_ledger_entries_org_key_unique" ON "usage_ledger_entries" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "usage_ledger_entries_org_type_time_idx" ON "usage_ledger_entries" USING btree ("organization_id","usage_type","occurred_at");
--> statement-breakpoint
-- Composite tenant keys prevent a same-shaped identifier from another tenant
-- being attached through a valid single-column foreign key.
CREATE UNIQUE INDEX email_connections_org_id_unique_r3 ON email_connections (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX email_threads_org_id_unique_r3 ON email_threads (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX organization_entitlements_org_id_unique_r3 ON organization_entitlements (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX buyer_outreach_consents_org_id_unique ON buyer_outreach_consents (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX buyer_communication_audit_org_id_unique ON buyer_communication_audit (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX quotation_approvals_org_id_unique ON quotation_approvals (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX outbound_email_approvals_org_id_unique ON outbound_email_approvals (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX companion_workflow_items_org_id_unique ON companion_workflow_items (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX billing_accounts_org_id_fk_unique ON billing_accounts (organization_id, id);--> statement-breakpoint
CREATE UNIQUE INDEX billing_subscriptions_org_id_fk_unique ON billing_subscriptions (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_contacts ADD CONSTRAINT buyer_contacts_account_tenant_fk FOREIGN KEY (organization_id, buyer_account_id) REFERENCES buyer_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_provenance_records ADD CONSTRAINT buyer_provenance_account_tenant_fk FOREIGN KEY (organization_id, buyer_account_id) REFERENCES buyer_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_provenance_records ADD CONSTRAINT buyer_provenance_contact_tenant_fk FOREIGN KEY (organization_id, buyer_contact_id) REFERENCES buyer_contacts (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_provenance_records ADD CONSTRAINT buyer_provenance_supersedes_tenant_fk FOREIGN KEY (organization_id, supersedes_id) REFERENCES buyer_provenance_records (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_outreach_consents ADD CONSTRAINT buyer_outreach_account_tenant_fk FOREIGN KEY (organization_id, buyer_account_id) REFERENCES buyer_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_outreach_consents ADD CONSTRAINT buyer_outreach_contact_tenant_fk FOREIGN KEY (organization_id, buyer_contact_id) REFERENCES buyer_contacts (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_communication_audit ADD CONSTRAINT buyer_communication_account_tenant_fk FOREIGN KEY (organization_id, buyer_account_id) REFERENCES buyer_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_communication_audit ADD CONSTRAINT buyer_communication_contact_tenant_fk FOREIGN KEY (organization_id, buyer_contact_id) REFERENCES buyer_contacts (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_communication_audit ADD CONSTRAINT buyer_communication_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_communication_audit ADD CONSTRAINT buyer_communication_consent_tenant_fk FOREIGN KEY (organization_id, consent_record_id) REFERENCES buyer_outreach_consents (organization_id, id);--> statement-breakpoint
ALTER TABLE sales_opportunities ADD CONSTRAINT sales_opportunities_buyer_tenant_fk FOREIGN KEY (organization_id, buyer_account_id) REFERENCES buyer_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE sales_opportunities ADD CONSTRAINT sales_opportunities_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE sales_opportunities ADD CONSTRAINT sales_opportunities_owner_tenant_fk FOREIGN KEY (organization_id, owner_membership_id) REFERENCES organization_memberships (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_rfqs ADD CONSTRAINT buyer_rfqs_opportunity_tenant_fk FOREIGN KEY (organization_id, opportunity_id) REFERENCES sales_opportunities (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_rfqs ADD CONSTRAINT buyer_rfqs_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_rfq_lines ADD CONSTRAINT buyer_rfq_lines_rfq_tenant_fk FOREIGN KEY (organization_id, rfq_id) REFERENCES buyer_rfqs (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_rfq_lines ADD CONSTRAINT buyer_rfq_lines_product_tenant_fk FOREIGN KEY (organization_id, product_id) REFERENCES products (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_rfq_requirements ADD CONSTRAINT buyer_rfq_requirements_rfq_tenant_fk FOREIGN KEY (organization_id, rfq_id) REFERENCES buyer_rfqs (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_rfq_requirements ADD CONSTRAINT buyer_rfq_requirements_line_tenant_fk FOREIGN KEY (organization_id, rfq_line_id) REFERENCES buyer_rfq_lines (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_rfq_attachments ADD CONSTRAINT buyer_rfq_attachments_rfq_tenant_fk FOREIGN KEY (organization_id, rfq_id) REFERENCES buyer_rfqs (organization_id, id);--> statement-breakpoint
ALTER TABLE buyer_rfq_attachments ADD CONSTRAINT buyer_rfq_attachments_document_tenant_fk FOREIGN KEY (organization_id, document_version_id) REFERENCES document_versions (organization_id, id);--> statement-breakpoint
ALTER TABLE quotations ADD CONSTRAINT quotations_rfq_tenant_fk FOREIGN KEY (organization_id, rfq_id) REFERENCES buyer_rfqs (organization_id, id);--> statement-breakpoint
ALTER TABLE quotations ADD CONSTRAINT quotations_opportunity_tenant_fk FOREIGN KEY (organization_id, opportunity_id) REFERENCES sales_opportunities (organization_id, id);--> statement-breakpoint
ALTER TABLE quotations ADD CONSTRAINT quotations_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE quotations ADD CONSTRAINT quotations_owner_tenant_fk FOREIGN KEY (organization_id, owner_membership_id) REFERENCES organization_memberships (organization_id, id);--> statement-breakpoint
ALTER TABLE quotation_versions ADD CONSTRAINT quotation_versions_quote_tenant_fk FOREIGN KEY (organization_id, quotation_id) REFERENCES quotations (organization_id, id);--> statement-breakpoint
ALTER TABLE quotation_lines ADD CONSTRAINT quotation_lines_version_tenant_fk FOREIGN KEY (organization_id, quotation_version_id) REFERENCES quotation_versions (organization_id, id);--> statement-breakpoint
ALTER TABLE quotation_lines ADD CONSTRAINT quotation_lines_rfq_line_tenant_fk FOREIGN KEY (organization_id, rfq_line_id) REFERENCES buyer_rfq_lines (organization_id, id);--> statement-breakpoint
ALTER TABLE quotation_lines ADD CONSTRAINT quotation_lines_product_tenant_fk FOREIGN KEY (organization_id, product_id) REFERENCES products (organization_id, id);--> statement-breakpoint
ALTER TABLE quotation_approvals ADD CONSTRAINT quotation_approvals_quote_tenant_fk FOREIGN KEY (organization_id, quotation_id) REFERENCES quotations (organization_id, id);--> statement-breakpoint
ALTER TABLE quotation_approvals ADD CONSTRAINT quotation_approvals_version_tenant_fk FOREIGN KEY (organization_id, quotation_version_id) REFERENCES quotation_versions (organization_id, id);--> statement-breakpoint
ALTER TABLE quotation_deliveries ADD CONSTRAINT quotation_deliveries_quote_tenant_fk FOREIGN KEY (organization_id, quotation_id) REFERENCES quotations (organization_id, id);--> statement-breakpoint
ALTER TABLE quotation_deliveries ADD CONSTRAINT quotation_deliveries_version_tenant_fk FOREIGN KEY (organization_id, quotation_version_id) REFERENCES quotation_versions (organization_id, id);--> statement-breakpoint
ALTER TABLE quotation_deliveries ADD CONSTRAINT quotation_deliveries_approval_tenant_fk FOREIGN KEY (organization_id, approval_id) REFERENCES quotation_approvals (organization_id, id);--> statement-breakpoint
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_buyer_tenant_fk FOREIGN KEY (organization_id, buyer_account_id) REFERENCES buyer_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_opportunity_tenant_fk FOREIGN KEY (organization_id, opportunity_id) REFERENCES sales_opportunities (organization_id, id);--> statement-breakpoint
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_quote_tenant_fk FOREIGN KEY (organization_id, quotation_id) REFERENCES quotations (organization_id, id);--> statement-breakpoint
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_quote_version_tenant_fk FOREIGN KEY (organization_id, accepted_quotation_version_id) REFERENCES quotation_versions (organization_id, id);--> statement-breakpoint
ALTER TABLE sales_order_versions ADD CONSTRAINT sales_order_versions_order_tenant_fk FOREIGN KEY (organization_id, sales_order_id) REFERENCES sales_orders (organization_id, id);--> statement-breakpoint
ALTER TABLE generated_document_sets ADD CONSTRAINT generated_document_sets_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE generated_document_sets ADD CONSTRAINT generated_document_sets_order_tenant_fk FOREIGN KEY (organization_id, sales_order_id) REFERENCES sales_orders (organization_id, id);--> statement-breakpoint
ALTER TABLE generated_document_sets ADD CONSTRAINT generated_document_sets_order_version_tenant_fk FOREIGN KEY (organization_id, sales_order_version_id) REFERENCES sales_order_versions (organization_id, id);--> statement-breakpoint
ALTER TABLE generated_documents ADD CONSTRAINT generated_documents_set_tenant_fk FOREIGN KEY (organization_id, document_set_id) REFERENCES generated_document_sets (organization_id, id);--> statement-breakpoint
ALTER TABLE generated_document_fields ADD CONSTRAINT generated_document_fields_document_tenant_fk FOREIGN KEY (organization_id, generated_document_id) REFERENCES generated_documents (organization_id, id);--> statement-breakpoint
ALTER TABLE document_consistency_issues ADD CONSTRAINT document_consistency_set_tenant_fk FOREIGN KEY (organization_id, document_set_id) REFERENCES generated_document_sets (organization_id, id);--> statement-breakpoint
ALTER TABLE email_thread_mappings ADD CONSTRAINT email_thread_mappings_thread_tenant_fk FOREIGN KEY (organization_id, email_thread_id) REFERENCES email_threads (organization_id, id);--> statement-breakpoint
ALTER TABLE email_thread_mappings ADD CONSTRAINT email_thread_mappings_buyer_tenant_fk FOREIGN KEY (organization_id, buyer_account_id) REFERENCES buyer_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE email_thread_mappings ADD CONSTRAINT email_thread_mappings_opportunity_tenant_fk FOREIGN KEY (organization_id, opportunity_id) REFERENCES sales_opportunities (organization_id, id);--> statement-breakpoint
ALTER TABLE email_thread_mappings ADD CONSTRAINT email_thread_mappings_rfq_tenant_fk FOREIGN KEY (organization_id, rfq_id) REFERENCES buyer_rfqs (organization_id, id);--> statement-breakpoint
ALTER TABLE email_thread_mappings ADD CONSTRAINT email_thread_mappings_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE outbound_email_drafts ADD CONSTRAINT outbound_email_drafts_connection_tenant_fk FOREIGN KEY (organization_id, email_connection_id) REFERENCES email_connections (organization_id, id);--> statement-breakpoint
ALTER TABLE outbound_email_drafts ADD CONSTRAINT outbound_email_drafts_thread_tenant_fk FOREIGN KEY (organization_id, email_thread_id) REFERENCES email_threads (organization_id, id);--> statement-breakpoint
ALTER TABLE outbound_email_drafts ADD CONSTRAINT outbound_email_drafts_buyer_tenant_fk FOREIGN KEY (organization_id, buyer_account_id) REFERENCES buyer_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE outbound_email_drafts ADD CONSTRAINT outbound_email_drafts_opportunity_tenant_fk FOREIGN KEY (organization_id, opportunity_id) REFERENCES sales_opportunities (organization_id, id);--> statement-breakpoint
ALTER TABLE outbound_email_drafts ADD CONSTRAINT outbound_email_drafts_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE outbound_email_drafts ADD CONSTRAINT outbound_email_drafts_task_tenant_fk FOREIGN KEY (organization_id, next_task_id) REFERENCES tasks (organization_id, id);--> statement-breakpoint
ALTER TABLE outbound_email_approvals ADD CONSTRAINT outbound_email_approvals_draft_tenant_fk FOREIGN KEY (organization_id, draft_id) REFERENCES outbound_email_drafts (organization_id, id);--> statement-breakpoint
ALTER TABLE outbound_email_deliveries ADD CONSTRAINT outbound_email_deliveries_draft_tenant_fk FOREIGN KEY (organization_id, draft_id) REFERENCES outbound_email_drafts (organization_id, id);--> statement-breakpoint
ALTER TABLE outbound_email_deliveries ADD CONSTRAINT outbound_email_deliveries_approval_tenant_fk FOREIGN KEY (organization_id, approval_id) REFERENCES outbound_email_approvals (organization_id, id);--> statement-breakpoint
ALTER TABLE email_connection_deletion_requests ADD CONSTRAINT email_connection_deletion_connection_tenant_fk FOREIGN KEY (organization_id, email_connection_id) REFERENCES email_connections (organization_id, id);--> statement-breakpoint
ALTER TABLE production_batches ADD CONSTRAINT production_batches_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE production_batches ADD CONSTRAINT production_batches_order_tenant_fk FOREIGN KEY (organization_id, sales_order_id) REFERENCES sales_orders (organization_id, id);--> statement-breakpoint
ALTER TABLE production_batches ADD CONSTRAINT production_batches_product_tenant_fk FOREIGN KEY (organization_id, product_id) REFERENCES products (organization_id, id);--> statement-breakpoint
ALTER TABLE production_batches ADD CONSTRAINT production_batches_facility_tenant_fk FOREIGN KEY (organization_id, facility_id) REFERENCES facilities (organization_id, id);--> statement-breakpoint
ALTER TABLE production_batches ADD CONSTRAINT production_batches_owner_tenant_fk FOREIGN KEY (organization_id, owner_membership_id) REFERENCES organization_memberships (organization_id, id);--> statement-breakpoint
ALTER TABLE production_milestones ADD CONSTRAINT production_milestones_batch_tenant_fk FOREIGN KEY (organization_id, production_batch_id) REFERENCES production_batches (organization_id, id);--> statement-breakpoint
ALTER TABLE production_milestones ADD CONSTRAINT production_milestones_owner_tenant_fk FOREIGN KEY (organization_id, owner_membership_id) REFERENCES organization_memberships (organization_id, id);--> statement-breakpoint
ALTER TABLE production_inspections ADD CONSTRAINT production_inspections_batch_tenant_fk FOREIGN KEY (organization_id, production_batch_id) REFERENCES production_batches (organization_id, id);--> statement-breakpoint
ALTER TABLE production_inspections ADD CONSTRAINT production_inspections_evidence_tenant_fk FOREIGN KEY (organization_id, evidence_document_version_id) REFERENCES document_versions (organization_id, id);--> statement-breakpoint
ALTER TABLE shipments ADD CONSTRAINT shipments_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE shipments ADD CONSTRAINT shipments_order_tenant_fk FOREIGN KEY (organization_id, sales_order_id) REFERENCES sales_orders (organization_id, id);--> statement-breakpoint
ALTER TABLE shipments ADD CONSTRAINT shipments_owner_tenant_fk FOREIGN KEY (organization_id, owner_membership_id) REFERENCES organization_memberships (organization_id, id);--> statement-breakpoint
ALTER TABLE shipment_packages ADD CONSTRAINT shipment_packages_shipment_tenant_fk FOREIGN KEY (organization_id, shipment_id) REFERENCES shipments (organization_id, id);--> statement-breakpoint
ALTER TABLE shipment_checkpoints ADD CONSTRAINT shipment_checkpoints_shipment_tenant_fk FOREIGN KEY (organization_id, shipment_id) REFERENCES shipments (organization_id, id);--> statement-breakpoint
ALTER TABLE shipment_exceptions ADD CONSTRAINT shipment_exceptions_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE shipment_exceptions ADD CONSTRAINT shipment_exceptions_shipment_tenant_fk FOREIGN KEY (organization_id, shipment_id) REFERENCES shipments (organization_id, id);--> statement-breakpoint
ALTER TABLE shipment_exceptions ADD CONSTRAINT shipment_exceptions_batch_tenant_fk FOREIGN KEY (organization_id, production_batch_id) REFERENCES production_batches (organization_id, id);--> statement-breakpoint
ALTER TABLE shipment_exceptions ADD CONSTRAINT shipment_exceptions_communication_tenant_fk FOREIGN KEY (organization_id, buyer_communication_audit_id) REFERENCES buyer_communication_audit (organization_id, id);--> statement-breakpoint
ALTER TABLE shipment_exceptions ADD CONSTRAINT shipment_exceptions_owner_tenant_fk FOREIGN KEY (organization_id, owner_membership_id) REFERENCES organization_memberships (organization_id, id);--> statement-breakpoint
ALTER TABLE trade_invoices ADD CONSTRAINT trade_invoices_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE trade_invoices ADD CONSTRAINT trade_invoices_order_tenant_fk FOREIGN KEY (organization_id, sales_order_id) REFERENCES sales_orders (organization_id, id);--> statement-breakpoint
ALTER TABLE trade_invoices ADD CONSTRAINT trade_invoices_shipment_tenant_fk FOREIGN KEY (organization_id, shipment_id) REFERENCES shipments (organization_id, id);--> statement-breakpoint
ALTER TABLE trade_invoices ADD CONSTRAINT trade_invoices_generated_document_tenant_fk FOREIGN KEY (organization_id, generated_document_id) REFERENCES generated_documents (organization_id, id);--> statement-breakpoint
ALTER TABLE invoice_payment_schedules ADD CONSTRAINT invoice_payment_schedules_invoice_tenant_fk FOREIGN KEY (organization_id, trade_invoice_id) REFERENCES trade_invoices (organization_id, id);--> statement-breakpoint
ALTER TABLE payment_receipts ADD CONSTRAINT payment_receipts_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE payment_receipts ADD CONSTRAINT payment_receipts_buyer_tenant_fk FOREIGN KEY (organization_id, buyer_account_id) REFERENCES buyer_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE payment_receipts ADD CONSTRAINT payment_receipts_advice_tenant_fk FOREIGN KEY (organization_id, bank_advice_document_version_id) REFERENCES document_versions (organization_id, id);--> statement-breakpoint
ALTER TABLE payment_allocations ADD CONSTRAINT payment_allocations_receipt_tenant_fk FOREIGN KEY (organization_id, payment_receipt_id) REFERENCES payment_receipts (organization_id, id);--> statement-breakpoint
ALTER TABLE payment_allocations ADD CONSTRAINT payment_allocations_invoice_tenant_fk FOREIGN KEY (organization_id, trade_invoice_id) REFERENCES trade_invoices (organization_id, id);--> statement-breakpoint
ALTER TABLE payment_allocations ADD CONSTRAINT payment_allocations_order_tenant_fk FOREIGN KEY (organization_id, sales_order_id) REFERENCES sales_orders (organization_id, id);--> statement-breakpoint
ALTER TABLE payment_allocations ADD CONSTRAINT payment_allocations_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE financial_discrepancies ADD CONSTRAINT financial_discrepancies_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE financial_discrepancies ADD CONSTRAINT financial_discrepancies_invoice_tenant_fk FOREIGN KEY (organization_id, trade_invoice_id) REFERENCES trade_invoices (organization_id, id);--> statement-breakpoint
ALTER TABLE financial_discrepancies ADD CONSTRAINT financial_discrepancies_receipt_tenant_fk FOREIGN KEY (organization_id, payment_receipt_id) REFERENCES payment_receipts (organization_id, id);--> statement-breakpoint
ALTER TABLE financial_discrepancies ADD CONSTRAINT financial_discrepancies_owner_tenant_fk FOREIGN KEY (organization_id, owner_membership_id) REFERENCES organization_memberships (organization_id, id);--> statement-breakpoint
ALTER TABLE realized_proceeds ADD CONSTRAINT realized_proceeds_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE realized_proceeds ADD CONSTRAINT realized_proceeds_order_tenant_fk FOREIGN KEY (organization_id, sales_order_id) REFERENCES sales_orders (organization_id, id);--> statement-breakpoint
ALTER TABLE realized_proceeds ADD CONSTRAINT realized_proceeds_invoice_tenant_fk FOREIGN KEY (organization_id, trade_invoice_id) REFERENCES trade_invoices (organization_id, id);--> statement-breakpoint
ALTER TABLE lane_outcome_metrics ADD CONSTRAINT lane_outcome_metrics_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE companion_workflow_cases ADD CONSTRAINT companion_workflow_cases_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id);--> statement-breakpoint
ALTER TABLE companion_workflow_cases ADD CONSTRAINT companion_workflow_cases_owner_tenant_fk FOREIGN KEY (organization_id, owner_membership_id) REFERENCES organization_memberships (organization_id, id);--> statement-breakpoint
ALTER TABLE companion_workflow_items ADD CONSTRAINT companion_workflow_items_case_tenant_fk FOREIGN KEY (organization_id, workflow_case_id) REFERENCES companion_workflow_cases (organization_id, id);--> statement-breakpoint
ALTER TABLE companion_workflow_evidence ADD CONSTRAINT companion_workflow_evidence_case_tenant_fk FOREIGN KEY (organization_id, workflow_case_id) REFERENCES companion_workflow_cases (organization_id, id);--> statement-breakpoint
ALTER TABLE companion_workflow_evidence ADD CONSTRAINT companion_workflow_evidence_item_tenant_fk FOREIGN KEY (organization_id, workflow_item_id) REFERENCES companion_workflow_items (organization_id, id);--> statement-breakpoint
ALTER TABLE companion_workflow_evidence ADD CONSTRAINT companion_workflow_evidence_document_tenant_fk FOREIGN KEY (organization_id, document_version_id) REFERENCES document_versions (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_subscriptions ADD CONSTRAINT billing_subscriptions_account_tenant_fk FOREIGN KEY (organization_id, billing_account_id) REFERENCES billing_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_subscriptions ADD CONSTRAINT billing_subscriptions_entitlement_tenant_fk FOREIGN KEY (organization_id, entitlement_id) REFERENCES organization_entitlements (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_subscription_history ADD CONSTRAINT billing_subscription_history_subscription_tenant_fk FOREIGN KEY (organization_id, subscription_id) REFERENCES billing_subscriptions (organization_id, id);--> statement-breakpoint
ALTER TABLE customer_billing_invoices ADD CONSTRAINT customer_billing_invoices_account_tenant_fk FOREIGN KEY (organization_id, billing_account_id) REFERENCES billing_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE customer_billing_invoices ADD CONSTRAINT customer_billing_invoices_subscription_tenant_fk FOREIGN KEY (organization_id, subscription_id) REFERENCES billing_subscriptions (organization_id, id);--> statement-breakpoint
ALTER TABLE customer_billing_credits ADD CONSTRAINT customer_billing_credits_account_tenant_fk FOREIGN KEY (organization_id, billing_account_id) REFERENCES billing_accounts (organization_id, id);--> statement-breakpoint
ALTER TABLE customer_billing_credits ADD CONSTRAINT customer_billing_credits_invoice_tenant_fk FOREIGN KEY (organization_id, invoice_id) REFERENCES customer_billing_invoices (organization_id, id);--> statement-breakpoint
ALTER TABLE customer_billing_refunds ADD CONSTRAINT customer_billing_refunds_invoice_tenant_fk FOREIGN KEY (organization_id, invoice_id) REFERENCES customer_billing_invoices (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_transactions ADD CONSTRAINT billing_transactions_invoice_tenant_fk FOREIGN KEY (organization_id, invoice_id) REFERENCES customer_billing_invoices (organization_id, id);--> statement-breakpoint
ALTER TABLE usage_ledger_entries ADD CONSTRAINT usage_ledger_entries_subscription_tenant_fk FOREIGN KEY (organization_id, subscription_id) REFERENCES billing_subscriptions (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_entitlement_transitions ADD CONSTRAINT billing_entitlement_transitions_subscription_tenant_fk FOREIGN KEY (organization_id, subscription_id) REFERENCES billing_subscriptions (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_entitlement_transitions ADD CONSTRAINT billing_entitlement_transitions_entitlement_tenant_fk FOREIGN KEY (organization_id, entitlement_id) REFERENCES organization_entitlements (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_reconciliation_results ADD CONSTRAINT billing_reconciliation_account_tenant_fk FOREIGN KEY (organization_id, billing_account_id) REFERENCES billing_accounts (organization_id, id);--> statement-breakpoint
-- R3 tenant envelope. All tenant-owned tables are FORCE RLS; absence of the
-- transaction-local tenant setting therefore fails closed.
DO $$
DECLARE
  tenant_table text;
  tenant_tables text[] := ARRAY[
    'buyer_accounts','buyer_contacts','buyer_provenance_records','buyer_outreach_consents','buyer_communication_audit',
    'sales_opportunities','buyer_rfqs','buyer_rfq_lines','buyer_rfq_requirements','buyer_rfq_attachments',
    'quotations','quotation_versions','quotation_lines','quotation_approvals','quotation_deliveries',
    'sales_orders','sales_order_versions','generated_document_sets','generated_documents','generated_document_fields','document_consistency_issues',
    'email_thread_mappings','outbound_email_drafts','outbound_email_approvals','outbound_email_deliveries','email_connection_deletion_requests',
    'production_batches','production_milestones','production_inspections','shipments','shipment_packages','shipment_checkpoints','shipment_exceptions',
    'trade_invoices','invoice_payment_schedules','payment_receipts','payment_allocations','financial_discrepancies','realized_proceeds','lane_outcome_metrics',
    'companion_workflow_cases','companion_workflow_items','companion_workflow_evidence',
    'billing_accounts','billing_subscriptions','billing_subscription_history','customer_billing_invoices','customer_billing_credits',
    'customer_billing_refunds','billing_transactions','billing_provider_events','usage_ledger_entries','billing_entitlement_transitions','billing_reconciliation_results'
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
-- R3 is manual-billing only. Ledger/provider mutations require an operations
-- transaction even if a customer guesses a tenant-local identifier.
DO $$
DECLARE
  ledger_table text;
  ledger_tables text[] := ARRAY[
    'billing_subscriptions','billing_subscription_history','customer_billing_invoices','customer_billing_credits',
    'customer_billing_refunds','billing_transactions','billing_provider_events','usage_ledger_entries',
    'billing_entitlement_transitions','billing_reconciliation_results'
  ];
BEGIN
  FOREACH ledger_table IN ARRAY ledger_tables LOOP
    EXECUTE format('DROP POLICY %I ON %I', 'tenant_' || ledger_table || '_write', ledger_table);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid AND current_setting(''app.actor_type'', true) IN (''staff'', ''system'')) WITH CHECK (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid AND current_setting(''app.actor_type'', true) IN (''staff'', ''system''))',
      'operations_' || ledger_table || '_write', ledger_table
    );
  END LOOP;
END $$;
--> statement-breakpoint
-- Reviewed, global catalog stays read-only to runtime roles. The migration
-- seed is deliberately draft/planned and has self-service hard-disabled.
INSERT INTO billing_plan_catalog_versions
  (id, version, currency, status, self_service_enabled, content_hash_sha256)
VALUES
  ('d3000000-0000-4000-8000-000000000001', '2026-08-29.r3-hypothesis-1', 'BDT', 'draft', false,
   '14765cd5b24df7460eb63da6d025addca5aa9d81645a51911bb4f561ceeb465e');
--> statement-breakpoint
INSERT INTO billing_plan_prices
  (id, catalog_version_id, product_key, display_name, amount_minor, currency, billing_interval, billing_cadence_months, offer_status, included_active_lanes, included_editors)
VALUES
  ('d3000000-0000-4000-8000-000000000101', 'd3000000-0000-4000-8000-000000000001', 'explore', 'Explore', 0, 'BDT', 'monthly', 1, 'preview', 1, 1),
  ('d3000000-0000-4000-8000-000000000102', 'd3000000-0000-4000-8000-000000000001', 'first_shipment_pass', 'First Shipment Pass', 750000, 'BDT', 'one_time', NULL, 'manual_pilot', 1, 3),
  ('d3000000-0000-4000-8000-000000000103', 'd3000000-0000-4000-8000-000000000001', 'launch', 'Launch quarterly', 747000, 'BDT', 'quarterly', 3, 'planned', NULL, NULL),
  ('d3000000-0000-4000-8000-000000000104', 'd3000000-0000-4000-8000-000000000001', 'launch', 'Launch annual', 2490000, 'BDT', 'annual', 12, 'planned', NULL, NULL),
  ('d3000000-0000-4000-8000-000000000105', 'd3000000-0000-4000-8000-000000000001', 'scale', 'Scale monthly', 799000, 'BDT', 'monthly', 1, 'planned', NULL, NULL),
  ('d3000000-0000-4000-8000-000000000106', 'd3000000-0000-4000-8000-000000000001', 'scale', 'Scale annual', 7990000, 'BDT', 'annual', 12, 'planned', NULL, NULL),
  ('d3000000-0000-4000-8000-000000000107', 'd3000000-0000-4000-8000-000000000001', 'managed_ops', 'Managed Ops base', 1990000, 'BDT', 'monthly', 1, 'planned', NULL, NULL);
