CREATE TYPE "public"."business_verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."conversation_kind" AS ENUM('department', 'direct', 'export_hq');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('quarantine', 'under_review', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."email_message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."entitlement_source" AS ENUM('platform_grant', 'trial', 'paid', 'pilot');--> statement-breakpoint
CREATE TYPE "public"."idempotency_state" AS ENUM('in_progress', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."mailbox_connection_status" AS ENUM('pending_authorization', 'connected', 'reauthorization_required', 'paused', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."market_opportunity_status" AS ENUM('draft', 'published', 'retired');--> statement-breakpoint
CREATE TYPE "public"."market_opportunity_trend" AS ENUM('accelerating', 'established', 'emerging');--> statement-breakpoint
CREATE TYPE "public"."message_delivery_status" AS ENUM('sent', 'read');--> statement-breakpoint
CREATE TYPE "public"."outbox_event_state" AS ENUM('pending', 'processing', 'published', 'dead_letter');--> statement-breakpoint
CREATE TYPE "public"."provider_referral_status" AS ENUM('requested', 'matching', 'introduced', 'engaged', 'closed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."provider_verification_status" AS ENUM('applicant', 'screening', 'verified', 'suspended', 'retired');--> statement-breakpoint
CREATE TYPE "public"."readiness_assessment_status" AS ENUM('draft', 'submitted', 'under_review', 'complete', 'archived');--> statement-breakpoint
CREATE TYPE "public"."readiness_evidence_review_status" AS ENUM('staged', 'under_review', 'needs_action', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."readiness_response_status" AS ENUM('not_started', 'in_progress', 'evidence_added', 'verified', 'blocked', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."requirement_status" AS ENUM('not_assessed', 'required', 'not_applicable', 'in_progress', 'evidence_submitted', 'under_review', 'compliant', 'expired', 'action_required');--> statement-breakpoint
CREATE TYPE "public"."responsibility" AS ENUM('customer', 'export_hq', 'third_party');--> statement-breakpoint
CREATE TYPE "public"."review_state" AS ENUM('pending_review', 'platform_verified', 'human_reviewed');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('preview', 'explore', 'launch', 'scale', 'managed');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'waiting_customer', 'waiting_export_hq', 'waiting_third_party', 'completed', 'blocked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."team_access_role" AS ENUM('owner', 'executive', 'department_lead', 'manager', 'member', 'viewer', 'external');--> statement-breakpoint
CREATE TYPE "public"."webhook_delivery_state" AS ENUM('received', 'processed', 'ignored', 'failed', 'dead_letter');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"actor_id" text NOT NULL,
	"actor_type" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_verification_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" "business_verification_status" DEFAULT 'pending' NOT NULL,
	"legal_name" text NOT NULL,
	"registration_number" text NOT NULL,
	"registration_authority" text NOT NULL,
	"origin_country_code" text NOT NULL,
	"website" text NOT NULL,
	"business_email" text NOT NULL,
	"evidence_url" text NOT NULL,
	"submitted_by" text NOT NULL,
	"reviewed_by" text,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"registration_number" text,
	"origin_country_code" text NOT NULL,
	"industry" text NOT NULL,
	"website" text,
	"employee_count" integer,
	"export_markets" text[] DEFAULT '{}' NOT NULL,
	"onboarding_percent" integer DEFAULT 0 NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"onboarding_version" integer DEFAULT 0 NOT NULL,
	"activated_by" text,
	"activated_at" timestamp with time zone,
	"support_email" text,
	"default_currency" text DEFAULT 'USD' NOT NULL,
	"export_stage" text,
	"primary_sales_channel" text,
	"market_strategy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verification_status" "business_verification_status" DEFAULT 'unverified' NOT NULL,
	"verification_submitted_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verified_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_profiles_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"object_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"checksum_sha256" text,
	"uploaded_by" text NOT NULL,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_versions_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"status" "document_status" DEFAULT 'quarantine' NOT NULL,
	"owner_id" text NOT NULL,
	"expires_at" timestamp with time zone,
	"linked_entity_type" text NOT NULL,
	"linked_entity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email_message_id" uuid NOT NULL,
	"provider_attachment_id" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"object_key" text,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"email_address" text NOT NULL,
	"display_name" text NOT NULL,
	"auth_strategy" text NOT NULL,
	"status" "mailbox_connection_status" DEFAULT 'pending_authorization' NOT NULL,
	"credential_secret_ref" text,
	"granted_scopes" text[] DEFAULT '{}' NOT NULL,
	"sync_cursor" text,
	"subscription_id" text,
	"subscription_expires_at" timestamp with time zone,
	"last_successful_sync_at" timestamp with time zone,
	"last_sync_error_code" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email_connection_id" uuid NOT NULL,
	"email_thread_id" uuid NOT NULL,
	"provider_message_id" text NOT NULL,
	"direction" "email_message_direction" NOT NULL,
	"from_address" text NOT NULL,
	"to_addresses" text[] DEFAULT '{}' NOT NULL,
	"cc_addresses" text[] DEFAULT '{}' NOT NULL,
	"reply_to_address" text,
	"subject" text NOT NULL,
	"text_preview" text DEFAULT '' NOT NULL,
	"body_storage_ref" text,
	"internet_message_id" text,
	"sent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email_connection_id" uuid NOT NULL,
	"provider_thread_id" text NOT NULL,
	"subject" text NOT NULL,
	"snippet" text DEFAULT '' NOT NULL,
	"participants" text[] DEFAULT '{}' NOT NULL,
	"unread" boolean DEFAULT true NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"attachment_count" integer DEFAULT 0 NOT NULL,
	"latest_message_at" timestamp with time zone NOT NULL,
	"related_entity_type" text,
	"related_entity_id" text,
	"related_entity_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"country_code" text NOT NULL,
	"address" text NOT NULL,
	"production_capacity" text,
	"capabilities" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"request_hash" text NOT NULL,
	"state" "idempotency_state" DEFAULT 'in_progress' NOT NULL,
	"result_reference" text,
	"attempts" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_catalog_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"hs_codes" text[] DEFAULT '{}' NOT NULL,
	"origin_country_code" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_catalog_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "market_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"origin_country_code" text NOT NULL,
	"status" "market_opportunity_status" DEFAULT 'draft' NOT NULL,
	"trend" "market_opportunity_trend" NOT NULL,
	"confidence" text NOT NULL,
	"opportunity_score" integer NOT NULL,
	"demand_score" integer NOT NULL,
	"origin_fit_score" integer NOT NULL,
	"public_summary" text NOT NULL,
	"member_insight" text NOT NULL,
	"why_it_ranks" text[] DEFAULT '{}' NOT NULL,
	"buyer_profiles" text[] DEFAULT '{}' NOT NULL,
	"entry_routes" text[] DEFAULT '{}' NOT NULL,
	"barriers" text[] DEFAULT '{}' NOT NULL,
	"proof_to_prepare" text[] DEFAULT '{}' NOT NULL,
	"next_actions" text[] DEFAULT '{}' NOT NULL,
	"method_version" text NOT NULL,
	"last_calculated_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_opportunities_confidence_check" CHECK ("market_opportunities"."confidence" in ('high', 'medium')),
	CONSTRAINT "market_opportunities_score_check" CHECK ("market_opportunities"."opportunity_score" between 0 and 100),
	CONSTRAINT "market_opportunities_demand_score_check" CHECK ("market_opportunities"."demand_score" between 0 and 100),
	CONSTRAINT "market_opportunities_origin_fit_score_check" CHECK ("market_opportunities"."origin_fit_score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "market_opportunity_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"source_label" text NOT NULL,
	"source_publisher" text NOT NULL,
	"source_url" text NOT NULL,
	"source_type" text DEFAULT 'trade_data' NOT NULL,
	"data_period" text NOT NULL,
	"metric" text NOT NULL,
	"raw_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"checked_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"iso3_code" text,
	"name" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"region" text DEFAULT 'Global' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "markets_country_code_unique" UNIQUE("country_code"),
	CONSTRAINT "markets_iso3_code_unique" UNIQUE("iso3_code")
);
--> statement-breakpoint
CREATE TABLE "organization_conversation_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"membership_id" uuid,
	"staff_profile_id" uuid,
	"added_by" text NOT NULL,
	"last_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_participant_identity_check" CHECK (num_nonnulls("organization_conversation_participants"."membership_id", "organization_conversation_participants"."staff_profile_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "organization_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"team_id" uuid,
	"kind" "conversation_kind" NOT NULL,
	"title" text NOT NULL,
	"related_entity_type" text,
	"related_entity_id" text,
	"created_by" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tier" "subscription_tier" NOT NULL,
	"source" "entitlement_source" NOT NULL,
	"reason" text NOT NULL,
	"granted_by" text NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_entitlements_window_check" CHECK ("organization_entitlements"."effective_to" is null or "organization_entitlements"."effective_to" > "organization_entitlements"."effective_from")
);
--> statement-breakpoint
CREATE TABLE "organization_market_shortlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"saved_by" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"role" text NOT NULL,
	"position_title" text DEFAULT 'Member' NOT NULL,
	"access_role" "team_access_role" DEFAULT 'member' NOT NULL,
	"hierarchy_rank" integer DEFAULT 30 NOT NULL,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_membership_hierarchy_rank_check" CHECK ("organization_memberships"."hierarchy_rank" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "organization_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_membership_id" uuid,
	"sender_staff_profile_id" uuid,
	"body" text NOT NULL,
	"delivery_status" "message_delivery_status" DEFAULT 'sent' NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_message_sender_check" CHECK (num_nonnulls("organization_messages"."sender_membership_id", "organization_messages"."sender_staff_profile_id") = 1),
	CONSTRAINT "organization_message_body_check" CHECK (char_length("organization_messages"."body") between 1 and 4000)
);
--> statement-breakpoint
CREATE TABLE "organization_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"team_position_title" text,
	"is_team_lead" boolean DEFAULT false NOT NULL,
	"added_by" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"purpose" text NOT NULL,
	"lead_membership_id" uuid,
	"created_by" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_organization_id" text NOT NULL,
	"slug" text NOT NULL,
	"legal_name" text NOT NULL,
	"trading_name" text NOT NULL,
	"default_locale" text DEFAULT 'en' NOT NULL,
	"default_timezone" text DEFAULT 'UTC' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_clerk_organization_id_unique" UNIQUE("clerk_organization_id"),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"topic" text NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"state" "outbox_event_state" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "product_markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"market_id" uuid NOT NULL,
	"readiness_score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'not_assessed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"composition" text,
	"hs_code" text,
	"country_of_origin" text NOT NULL,
	"currency" text NOT NULL,
	"fob_price_minor" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"method_version" text NOT NULL,
	"status" "readiness_assessment_status" DEFAULT 'draft' NOT NULL,
	"origin_country_code" text DEFAULT 'BD' NOT NULL,
	"business_model" text NOT NULL,
	"product_category" text NOT NULL,
	"product_name" text NOT NULL,
	"hs_code" text,
	"target_market_code" text NOT NULL,
	"sales_channel" text NOT NULL,
	"current_section" text DEFAULT 'business' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"last_saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "readiness_assessments_score_check" CHECK ("readiness_assessments"."score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "readiness_evidence_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"readiness_response_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"status" "readiness_evidence_review_status" DEFAULT 'staged' NOT NULL,
	"extraction" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feedback" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_provider_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"requirement_key" text NOT NULL,
	"provider_category" text NOT NULL,
	"matched_provider_id" uuid,
	"status" "provider_referral_status" DEFAULT 'requested' NOT NULL,
	"requested_by" text NOT NULL,
	"request_note" text,
	"commission_disclosure" text NOT NULL,
	"disclosure_accepted_at" timestamp with time zone NOT NULL,
	"introduced_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"requirement_key" text NOT NULL,
	"status" "readiness_response_status" DEFAULT 'not_started' NOT NULL,
	"note" text,
	"owner_id" text,
	"target_date" timestamp with time zone,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_applicabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"product_market_id" uuid NOT NULL,
	"status" "requirement_status" DEFAULT 'not_assessed' NOT NULL,
	"owner_id" text,
	"deadline" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"description" text NOT NULL,
	"source_label" text NOT NULL,
	"source_url" text NOT NULL,
	"effective_at" timestamp with time zone,
	"last_verified_at" timestamp with time zone NOT NULL,
	"reviewed_by" text,
	"review_state" "review_state" DEFAULT 'pending_review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_provider_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"legal_name" text NOT NULL,
	"trading_name" text NOT NULL,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"countries" text[] DEFAULT '{}' NOT NULL,
	"product_categories" text[] DEFAULT '{}' NOT NULL,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"verification_status" "provider_verification_status" DEFAULT 'applicant' NOT NULL,
	"verification_evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" text,
	"commission_disclosure" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_provider_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "staff_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"staff_profile_id" uuid NOT NULL,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"case_reference" text DEFAULT 'unspecified' NOT NULL,
	"reason" text NOT NULL,
	"approved_by" text NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"break_glass" boolean DEFAULT false NOT NULL,
	"second_approved_by" text,
	"alerted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_access_window_check" CHECK ("staff_access_grants"."expires_at" > "staff_access_grants"."starts_at"),
	CONSTRAINT "staff_access_break_glass_check" CHECK (not "staff_access_grants"."break_glass" or ("staff_access_grants"."second_approved_by" is not null and "staff_access_grants"."alerted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"global_permissions" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_profiles_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"owner_id" text NOT NULL,
	"responsibility" "responsibility" NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"due_at" timestamp with time zone,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"state" "webhook_delivery_state" DEFAULT 'received' NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"payload_hash" text NOT NULL,
	"payload" jsonb NOT NULL,
	"failure_reason" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_verification_requests" ADD CONSTRAINT "business_verification_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_message_id_email_messages_id_fk" FOREIGN KEY ("email_message_id") REFERENCES "public"."email_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_connections" ADD CONSTRAINT "email_connections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_email_connection_id_email_connections_id_fk" FOREIGN KEY ("email_connection_id") REFERENCES "public"."email_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_email_thread_id_email_threads_id_fk" FOREIGN KEY ("email_thread_id") REFERENCES "public"."email_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_email_connection_id_email_connections_id_fk" FOREIGN KEY ("email_connection_id") REFERENCES "public"."email_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_opportunities" ADD CONSTRAINT "market_opportunities_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_opportunities" ADD CONSTRAINT "market_opportunities_product_id_market_catalog_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."market_catalog_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_opportunity_evidence" ADD CONSTRAINT "market_opportunity_evidence_opportunity_id_market_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."market_opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_conversation_participants" ADD CONSTRAINT "organization_conversation_participants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_conversation_participants" ADD CONSTRAINT "organization_conversation_participants_conversation_id_organization_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."organization_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_conversation_participants" ADD CONSTRAINT "organization_conversation_participants_membership_id_organization_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_conversation_participants" ADD CONSTRAINT "organization_conversation_participants_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_conversations" ADD CONSTRAINT "organization_conversations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_conversations" ADD CONSTRAINT "organization_conversations_team_id_organization_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."organization_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_entitlements" ADD CONSTRAINT "organization_entitlements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_market_shortlists" ADD CONSTRAINT "organization_market_shortlists_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_market_shortlists" ADD CONSTRAINT "organization_market_shortlists_opportunity_id_market_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."market_opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_messages" ADD CONSTRAINT "organization_messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_messages" ADD CONSTRAINT "organization_messages_conversation_id_organization_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."organization_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_messages" ADD CONSTRAINT "organization_messages_sender_membership_id_organization_memberships_id_fk" FOREIGN KEY ("sender_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_messages" ADD CONSTRAINT "organization_messages_sender_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("sender_staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_team_members" ADD CONSTRAINT "organization_team_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_team_members" ADD CONSTRAINT "organization_team_members_team_id_organization_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."organization_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_team_members" ADD CONSTRAINT "organization_team_members_membership_id_organization_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_teams" ADD CONSTRAINT "organization_teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_teams" ADD CONSTRAINT "organization_teams_lead_membership_id_organization_memberships_id_fk" FOREIGN KEY ("lead_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_markets" ADD CONSTRAINT "product_markets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_markets" ADD CONSTRAINT "product_markets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_markets" ADD CONSTRAINT "product_markets_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_assessments" ADD CONSTRAINT "readiness_assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_evidence_reviews" ADD CONSTRAINT "readiness_evidence_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_evidence_reviews" ADD CONSTRAINT "readiness_evidence_reviews_assessment_id_readiness_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."readiness_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_evidence_reviews" ADD CONSTRAINT "readiness_evidence_reviews_readiness_response_id_readiness_responses_id_fk" FOREIGN KEY ("readiness_response_id") REFERENCES "public"."readiness_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_evidence_reviews" ADD CONSTRAINT "readiness_evidence_reviews_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_evidence_reviews" ADD CONSTRAINT "readiness_evidence_reviews_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ADD CONSTRAINT "readiness_provider_referrals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ADD CONSTRAINT "readiness_provider_referrals_assessment_id_readiness_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."readiness_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ADD CONSTRAINT "readiness_provider_referrals_matched_provider_id_service_provider_profiles_id_fk" FOREIGN KEY ("matched_provider_id") REFERENCES "public"."service_provider_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_responses" ADD CONSTRAINT "readiness_responses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_responses" ADD CONSTRAINT "readiness_responses_assessment_id_readiness_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."readiness_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_applicabilities" ADD CONSTRAINT "requirement_applicabilities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_applicabilities" ADD CONSTRAINT "requirement_applicabilities_requirement_id_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_applicabilities" ADD CONSTRAINT "requirement_applicabilities_product_market_id_product_markets_id_fk" FOREIGN KEY ("product_market_id") REFERENCES "public"."product_markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_access_grants" ADD CONSTRAINT "staff_access_grants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_access_grants" ADD CONSTRAINT "staff_access_grants_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_org_time_idx" ON "audit_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "business_verification_requests_org_status_idx" ON "business_verification_requests" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "business_verification_requests_status_created_idx" ON "business_verification_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "document_version_unique" ON "document_versions" USING btree ("document_id","version");--> statement-breakpoint
CREATE INDEX "documents_org_idx" ON "documents" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_attachments_message_provider_unique" ON "email_attachments" USING btree ("email_message_id","provider_attachment_id");--> statement-breakpoint
CREATE INDEX "email_attachments_org_idx" ON "email_attachments" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_connections_org_provider_address_unique" ON "email_connections" USING btree ("organization_id","provider","email_address");--> statement-breakpoint
CREATE INDEX "email_connections_org_status_idx" ON "email_connections" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "email_messages_connection_provider_message_unique" ON "email_messages" USING btree ("email_connection_id","provider_message_id");--> statement-breakpoint
CREATE INDEX "email_messages_thread_sent_idx" ON "email_messages" USING btree ("email_thread_id","sent_at");--> statement-breakpoint
CREATE INDEX "email_messages_org_sent_idx" ON "email_messages" USING btree ("organization_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_threads_connection_provider_thread_unique" ON "email_threads" USING btree ("email_connection_id","provider_thread_id");--> statement-breakpoint
CREATE INDEX "email_threads_org_activity_idx" ON "email_threads" USING btree ("organization_id","latest_message_at");--> statement-breakpoint
CREATE INDEX "email_threads_org_unread_idx" ON "email_threads" USING btree ("organization_id","unread");--> statement-breakpoint
CREATE INDEX "facilities_org_idx" ON "facilities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idempotency_keys_expiry_idx" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "market_catalog_products_origin_category_idx" ON "market_catalog_products" USING btree ("origin_country_code","category");--> statement-breakpoint
CREATE UNIQUE INDEX "market_opportunities_origin_market_product_unique" ON "market_opportunities" USING btree ("origin_country_code","market_id","product_id");--> statement-breakpoint
CREATE INDEX "market_opportunities_market_status_idx" ON "market_opportunities" USING btree ("market_id","status");--> statement-breakpoint
CREATE INDEX "market_opportunities_product_status_idx" ON "market_opportunities" USING btree ("product_id","status");--> statement-breakpoint
CREATE INDEX "market_opportunity_evidence_opportunity_idx" ON "market_opportunity_evidence" USING btree ("opportunity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_participant_member_unique" ON "organization_conversation_participants" USING btree ("conversation_id","membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_participant_staff_unique" ON "organization_conversation_participants" USING btree ("conversation_id","staff_profile_id");--> statement-breakpoint
CREATE INDEX "conversation_participants_org_idx" ON "organization_conversation_participants" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_conversations_org_activity_idx" ON "organization_conversations" USING btree ("organization_id","updated_at");--> statement-breakpoint
CREATE INDEX "organization_conversations_team_idx" ON "organization_conversations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "organization_entitlements_org_effective_idx" ON "organization_entitlements" USING btree ("organization_id","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_market_shortlists_unique" ON "organization_market_shortlists" USING btree ("organization_id","opportunity_id");--> statement-breakpoint
CREATE INDEX "organization_market_shortlists_org_idx" ON "organization_market_shortlists" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_membership_user_unique" ON "organization_memberships" USING btree ("organization_id","clerk_user_id");--> statement-breakpoint
CREATE INDEX "organization_membership_user_idx" ON "organization_memberships" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "organization_messages_conversation_created_idx" ON "organization_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "organization_messages_org_created_idx" ON "organization_messages" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_team_members_unique" ON "organization_team_members" USING btree ("team_id","membership_id");--> statement-breakpoint
CREATE INDEX "organization_team_members_org_idx" ON "organization_team_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_team_members_membership_idx" ON "organization_team_members" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_teams_org_slug_unique" ON "organization_teams" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "organization_teams_org_active_idx" ON "organization_teams" USING btree ("organization_id","active");--> statement-breakpoint
CREATE INDEX "outbox_events_dispatch_idx" ON "outbox_events" USING btree ("state","available_at");--> statement-breakpoint
CREATE INDEX "outbox_events_org_created_idx" ON "outbox_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_markets_unique" ON "product_markets" USING btree ("product_id","market_id");--> statement-breakpoint
CREATE INDEX "product_markets_org_idx" ON "product_markets" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_org_sku_unique" ON "products" USING btree ("organization_id","sku");--> statement-breakpoint
CREATE INDEX "products_org_idx" ON "products" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rate_limit_counters_expiry_idx" ON "rate_limit_counters" USING btree ("reset_at");--> statement-breakpoint
CREATE INDEX "readiness_assessments_org_updated_idx" ON "readiness_assessments" USING btree ("organization_id","updated_at");--> statement-breakpoint
CREATE INDEX "readiness_evidence_reviews_org_status_idx" ON "readiness_evidence_reviews" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "readiness_evidence_reviews_response_idx" ON "readiness_evidence_reviews" USING btree ("readiness_response_id");--> statement-breakpoint
CREATE INDEX "readiness_provider_referrals_org_status_idx" ON "readiness_provider_referrals" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "readiness_provider_referrals_provider_idx" ON "readiness_provider_referrals" USING btree ("matched_provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "readiness_responses_assessment_requirement_unique" ON "readiness_responses" USING btree ("assessment_id","requirement_key");--> statement-breakpoint
CREATE INDEX "readiness_responses_org_status_idx" ON "readiness_responses" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "requirement_applicabilities_org_idx" ON "requirement_applicabilities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "service_provider_profiles_status_idx" ON "service_provider_profiles" USING btree ("verification_status","active");--> statement-breakpoint
CREATE INDEX "staff_access_org_idx" ON "staff_access_grants" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "staff_access_staff_window_idx" ON "staff_access_grants" USING btree ("staff_profile_id","starts_at","expires_at");--> statement-breakpoint
CREATE INDEX "tasks_org_status_idx" ON "tasks" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_deliveries_provider_event_unique" ON "webhook_deliveries" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_state_idx" ON "webhook_deliveries" USING btree ("state","received_at");