DO $$ BEGIN
  CREATE TYPE business_verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE market_opportunity_status AS ENUM ('draft', 'published', 'retired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE market_opportunity_trend AS ENUM ('accelerating', 'established', 'emerging');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS verification_status business_verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by text;

ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS iso3_code text,
  ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'Global',
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS markets_iso3_code_unique ON markets (iso3_code) WHERE iso3_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS business_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status business_verification_status NOT NULL DEFAULT 'pending',
  legal_name text NOT NULL,
  registration_number text NOT NULL,
  registration_authority text NOT NULL,
  origin_country_code text NOT NULL,
  website text NOT NULL,
  business_email text NOT NULL,
  evidence_url text NOT NULL,
  submitted_by text NOT NULL,
  reviewed_by text,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_verification_requests_org_status_idx ON business_verification_requests (organization_id, status);
CREATE INDEX IF NOT EXISTS business_verification_requests_status_created_idx ON business_verification_requests (status, created_at);

CREATE TABLE IF NOT EXISTS market_catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  hs_codes text[] NOT NULL DEFAULT '{}',
  origin_country_code text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_catalog_products_origin_category_idx ON market_catalog_products (origin_country_code, category);

CREATE TABLE IF NOT EXISTS market_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES market_catalog_products(id) ON DELETE CASCADE,
  origin_country_code text NOT NULL,
  status market_opportunity_status NOT NULL DEFAULT 'draft',
  trend market_opportunity_trend NOT NULL,
  confidence text NOT NULL CONSTRAINT market_opportunities_confidence_check CHECK (confidence IN ('high', 'medium')),
  opportunity_score integer NOT NULL CONSTRAINT market_opportunities_score_check CHECK (opportunity_score BETWEEN 0 AND 100),
  demand_score integer NOT NULL CONSTRAINT market_opportunities_demand_score_check CHECK (demand_score BETWEEN 0 AND 100),
  origin_fit_score integer NOT NULL CONSTRAINT market_opportunities_origin_fit_score_check CHECK (origin_fit_score BETWEEN 0 AND 100),
  public_summary text NOT NULL,
  member_insight text NOT NULL,
  why_it_ranks text[] NOT NULL DEFAULT '{}',
  buyer_profiles text[] NOT NULL DEFAULT '{}',
  entry_routes text[] NOT NULL DEFAULT '{}',
  barriers text[] NOT NULL DEFAULT '{}',
  proof_to_prepare text[] NOT NULL DEFAULT '{}',
  next_actions text[] NOT NULL DEFAULT '{}',
  method_version text NOT NULL,
  last_calculated_at timestamptz NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT market_opportunities_origin_market_product_unique UNIQUE (origin_country_code, market_id, product_id)
);

CREATE INDEX IF NOT EXISTS market_opportunities_market_status_idx ON market_opportunities (market_id, status);
CREATE INDEX IF NOT EXISTS market_opportunities_product_status_idx ON market_opportunities (product_id, status);

CREATE TABLE IF NOT EXISTS market_opportunity_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES market_opportunities(id) ON DELETE CASCADE,
  source_label text NOT NULL,
  source_publisher text NOT NULL,
  source_url text NOT NULL,
  source_type text NOT NULL DEFAULT 'trade_data',
  data_period text NOT NULL,
  metric text NOT NULL,
  raw_metrics jsonb NOT NULL DEFAULT '{}',
  checked_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_opportunity_evidence_opportunity_idx ON market_opportunity_evidence (opportunity_id);

CREATE TABLE IF NOT EXISTS organization_market_shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES market_opportunities(id) ON DELETE CASCADE,
  saved_by text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_market_shortlists_unique UNIQUE (organization_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS organization_market_shortlists_org_idx ON organization_market_shortlists (organization_id);

ALTER TABLE business_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_market_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_business_verification_requests ON business_verification_requests
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

CREATE POLICY tenant_organization_market_shortlists ON organization_market_shortlists
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

REVOKE INSERT, UPDATE, DELETE ON market_catalog_products, market_opportunities, market_opportunity_evidence FROM PUBLIC;
