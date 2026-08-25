DO $$ BEGIN
  CREATE TYPE readiness_assessment_status AS ENUM ('draft', 'submitted', 'under_review', 'complete', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE readiness_response_status AS ENUM ('not_started', 'in_progress', 'evidence_added', 'verified', 'blocked', 'not_applicable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE readiness_evidence_review_status AS ENUM ('staged', 'under_review', 'needs_action', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE provider_verification_status AS ENUM ('applicant', 'screening', 'verified', 'suspended', 'retired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE provider_referral_status AS ENUM ('requested', 'matching', 'introduced', 'engaged', 'closed', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS readiness_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by text NOT NULL,
  method_version text NOT NULL,
  status readiness_assessment_status NOT NULL DEFAULT 'draft',
  origin_country_code text NOT NULL DEFAULT 'BD',
  business_model text NOT NULL,
  product_category text NOT NULL,
  product_name text NOT NULL,
  hs_code text,
  target_market_code text NOT NULL,
  sales_channel text NOT NULL,
  current_section text NOT NULL DEFAULT 'business',
  score integer NOT NULL DEFAULT 0 CONSTRAINT readiness_assessments_score_check CHECK (score BETWEEN 0 AND 100),
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS readiness_assessments_org_updated_idx ON readiness_assessments (organization_id, updated_at);

CREATE TABLE IF NOT EXISTS readiness_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES readiness_assessments(id) ON DELETE CASCADE,
  requirement_key text NOT NULL,
  status readiness_response_status NOT NULL DEFAULT 'not_started',
  note text,
  owner_id text,
  target_date timestamptz,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT readiness_responses_assessment_requirement_unique UNIQUE (assessment_id, requirement_key)
);

CREATE INDEX IF NOT EXISTS readiness_responses_org_status_idx ON readiness_responses (organization_id, status);

CREATE TABLE IF NOT EXISTS readiness_evidence_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES readiness_assessments(id) ON DELETE CASCADE,
  readiness_response_id uuid NOT NULL REFERENCES readiness_responses(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_version_id uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  status readiness_evidence_review_status NOT NULL DEFAULT 'staged',
  extraction jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS readiness_evidence_reviews_org_status_idx ON readiness_evidence_reviews (organization_id, status);
CREATE INDEX IF NOT EXISTS readiness_evidence_reviews_response_idx ON readiness_evidence_reviews (readiness_response_id);

CREATE TABLE IF NOT EXISTS service_provider_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  legal_name text NOT NULL,
  trading_name text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  countries text[] NOT NULL DEFAULT '{}',
  product_categories text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  verification_status provider_verification_status NOT NULL DEFAULT 'applicant',
  verification_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  verified_by text,
  commission_disclosure text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_provider_profiles_status_idx ON service_provider_profiles (verification_status, active);

CREATE TABLE IF NOT EXISTS readiness_provider_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES readiness_assessments(id) ON DELETE CASCADE,
  requirement_key text NOT NULL,
  provider_category text NOT NULL,
  matched_provider_id uuid REFERENCES service_provider_profiles(id) ON DELETE SET NULL,
  status provider_referral_status NOT NULL DEFAULT 'requested',
  requested_by text NOT NULL,
  request_note text,
  commission_disclosure text NOT NULL,
  disclosure_accepted_at timestamptz NOT NULL,
  introduced_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS readiness_provider_referrals_org_status_idx ON readiness_provider_referrals (organization_id, status);
CREATE INDEX IF NOT EXISTS readiness_provider_referrals_provider_idx ON readiness_provider_referrals (matched_provider_id);

ALTER TABLE readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_evidence_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_provider_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_readiness_assessments ON readiness_assessments
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

CREATE POLICY tenant_readiness_responses ON readiness_responses
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

CREATE POLICY tenant_readiness_evidence_reviews ON readiness_evidence_reviews
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

CREATE POLICY tenant_readiness_provider_referrals ON readiness_provider_referrals
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

REVOKE INSERT, UPDATE, DELETE ON service_provider_profiles FROM PUBLIC;
