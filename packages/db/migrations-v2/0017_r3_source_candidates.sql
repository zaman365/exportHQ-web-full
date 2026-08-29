CREATE TABLE "regulatory_source_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" uuid NOT NULL,
	"canonical_url" text NOT NULL,
	"title" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"source_type" text NOT NULL,
	"candidate_for" text NOT NULL,
	"discovered_at" timestamp with time zone NOT NULL,
	"last_checked_at" timestamp with time zone NOT NULL,
	"candidate_state" text DEFAULT 'pending_review' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulatory_source_candidates_canonical_url_unique" UNIQUE("canonical_url"),
	CONSTRAINT "regulatory_source_candidates_state_check" CHECK ("regulatory_source_candidates"."candidate_state" in ('pending_review', 'promoted', 'rejected')),
	CONSTRAINT "regulatory_source_candidates_review_boundary_check" CHECK ("regulatory_source_candidates"."candidate_state" <> 'promoted' or "regulatory_source_candidates"."notes" <> '')
);
--> statement-breakpoint
ALTER TABLE "regulatory_source_candidates" ADD CONSTRAINT "regulatory_source_candidates_publisher_id_regulatory_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."regulatory_publishers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "regulatory_source_candidates_review_idx" ON "regulatory_source_candidates" USING btree ("candidate_state","jurisdiction","last_checked_at");
--> statement-breakpoint
INSERT INTO "regulatory_publishers" (
	"slug", "name", "publisher_type", "jurisdiction", "canonical_base_url"
) VALUES
	('bangladesh-single-window', 'Bangladesh Single Window', 'official', 'BD', 'https://bswnbr.gov.bd'),
	('bangladesh-ccie', 'Office of the Chief Controller of Imports and Exports', 'official', 'BD', 'https://olm.ccie.gov.bd'),
	('bangladesh-epb', 'Export Promotion Bureau Bangladesh', 'official', 'BD', 'https://epb.gov.bd'),
	('bangladesh-bank', 'Bangladesh Bank', 'official', 'BD', 'https://www.bb.org.bd'),
	('bangladesh-trade-portal', 'Bangladesh Trade Portal', 'official', 'BD', 'https://www.bangladeshtradeportal.gov.bd'),
	('eu-dg-trade', 'European Commission Directorate-General for Trade and Economic Security', 'official', 'EU', 'https://policy.trade.ec.europa.eu'),
	('eu-access2markets', 'European Commission Access2Markets', 'official', 'EU', 'https://trade.ec.europa.eu/access-to-markets'),
	('un-ldc-portal', 'United Nations LDC Portal', 'intergovernmental', 'GLOBAL', 'https://www.un.org/ldcportal')
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "regulatory_source_candidates" (
	"publisher_id", "canonical_url", "title", "jurisdiction", "source_type",
	"candidate_for", "discovered_at", "last_checked_at", "notes"
)
SELECT
	p."id", v."canonical_url", v."title", v."jurisdiction", v."source_type",
	v."candidate_for", '2026-08-29T00:00:00Z'::timestamptz,
	'2026-08-29T00:00:00Z'::timestamptz,
	'Discovery only. Pending named human review, captured-content hash, effective-date analysis, and publication approval.'
FROM (VALUES
	('bangladesh-single-window', 'https://bswnbr.gov.bd/wu/registration/index', 'Bangladesh Single Window registration', 'BD', 'official_portal', 'customs and single-window registration'),
	('bangladesh-ccie', 'https://olm.ccie.gov.bd/', 'CCI&E Online Licensing Module', 'BD', 'official_portal', 'import/export registration and licensing'),
	('bangladesh-epb', 'https://epb.gov.bd/', 'Export Promotion Bureau Bangladesh', 'BD', 'official_portal', 'exporter support and official notices'),
	('bangladesh-epb', 'https://edb.epb.gov.bd/signup', 'EPB exporter database registration', 'BD', 'official_portal', 'exporter database registration'),
	('bangladesh-bank', 'https://www.bb.org.bd/en/index.php/mediaroom/circular', 'Bangladesh Bank circular index', 'BD', 'official_registry', 'foreign exchange circular discovery'),
	('bangladesh-bank', 'https://www.bb.org.bd/mediaroom/circulars/fepd/jul302026fepd-126e.pdf', 'Consolidated export trade circular, 30 July 2026', 'BD', 'official_circular', 'export proceeds and foreign exchange requirements'),
	('bangladesh-trade-portal', 'https://www.bangladeshtradeportal.gov.bd/index.php?r=site%2Findex', 'Bangladesh Trade Portal', 'BD', 'official_portal', 'trade procedures and measures'),
	('eu-access2markets', 'https://trade.ec.europa.eu/access-to-markets/en/home', 'EU Access2Markets', 'EU', 'official_portal', 'tariffs, origin, procedures, and product requirements'),
	('eu-dg-trade', 'https://policy.trade.ec.europa.eu/development-and-sustainability/generalised-scheme-preferences_en', 'EU Generalised Scheme of Preferences', 'EU', 'official_guidance', 'GSP and EBA scheme status'),
	('eu-dg-trade', 'https://policy.trade.ec.europa.eu/development-and-sustainability/generalised-scheme-preferences/questions-answers-new-eu-generalised-scheme-preferences_en', 'Questions and answers on the new EU GSP', 'EU', 'official_guidance', '2027 GSP rules and LDC graduation transition scenario'),
	('un-ldc-portal', 'https://www.un.org/ldcportal/content/bangladesh-graduation-status', 'Bangladesh graduation status', 'GLOBAL', 'intergovernmental_status', 'Bangladesh LDC graduation scenario and status')
) AS v("publisher_slug", "canonical_url", "title", "jurisdiction", "source_type", "candidate_for")
JOIN "regulatory_publishers" p ON p."slug" = v."publisher_slug"
ON CONFLICT ("canonical_url") DO NOTHING;
