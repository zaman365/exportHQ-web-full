CREATE TYPE team_access_role AS ENUM (
  'owner', 'executive', 'department_lead', 'manager', 'member', 'viewer', 'external'
);

CREATE TYPE conversation_kind AS ENUM ('department', 'direct', 'export_hq');
CREATE TYPE message_delivery_status AS ENUM ('sent', 'read');

ALTER TABLE organization_memberships
  ADD COLUMN position_title text NOT NULL DEFAULT 'Member',
  ADD COLUMN access_role team_access_role NOT NULL DEFAULT 'member',
  ADD COLUMN hierarchy_rank integer NOT NULL DEFAULT 30,
  ADD CONSTRAINT organization_membership_hierarchy_rank_check CHECK (hierarchy_rank BETWEEN 0 AND 100);

CREATE TABLE organization_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  purpose text NOT NULL,
  lead_membership_id uuid REFERENCES organization_memberships(id) ON DELETE SET NULL,
  created_by text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organization_teams_org_slug_unique ON organization_teams(organization_id, slug);
CREATE INDEX organization_teams_org_active_idx ON organization_teams(organization_id, active);

CREATE TABLE organization_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES organization_teams(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES organization_memberships(id) ON DELETE CASCADE,
  team_position_title text,
  is_team_lead boolean NOT NULL DEFAULT false,
  added_by text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organization_team_members_unique ON organization_team_members(team_id, membership_id);
CREATE INDEX organization_team_members_org_idx ON organization_team_members(organization_id);
CREATE INDEX organization_team_members_membership_idx ON organization_team_members(membership_id);

CREATE TABLE organization_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES organization_teams(id) ON DELETE SET NULL,
  kind conversation_kind NOT NULL,
  title text NOT NULL,
  related_entity_type text,
  related_entity_id text,
  created_by text NOT NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX organization_conversations_org_activity_idx ON organization_conversations(organization_id, updated_at);
CREATE INDEX organization_conversations_team_idx ON organization_conversations(team_id);

CREATE TABLE organization_conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES organization_conversations(id) ON DELETE CASCADE,
  membership_id uuid REFERENCES organization_memberships(id) ON DELETE CASCADE,
  staff_profile_id uuid REFERENCES staff_profiles(id) ON DELETE CASCADE,
  added_by text NOT NULL,
  last_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversation_participant_identity_check CHECK (num_nonnulls(membership_id, staff_profile_id) = 1)
);
CREATE UNIQUE INDEX conversation_participant_member_unique ON organization_conversation_participants(conversation_id, membership_id);
CREATE UNIQUE INDEX conversation_participant_staff_unique ON organization_conversation_participants(conversation_id, staff_profile_id);
CREATE INDEX conversation_participants_org_idx ON organization_conversation_participants(organization_id);

CREATE TABLE organization_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES organization_conversations(id) ON DELETE CASCADE,
  sender_membership_id uuid REFERENCES organization_memberships(id) ON DELETE SET NULL,
  sender_staff_profile_id uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  delivery_status message_delivery_status NOT NULL DEFAULT 'sent',
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_message_sender_check CHECK (num_nonnulls(sender_membership_id, sender_staff_profile_id) = 1),
  CONSTRAINT organization_message_body_check CHECK (char_length(body) BETWEEN 1 AND 4000)
);
CREATE INDEX organization_messages_conversation_created_idx ON organization_messages(conversation_id, created_at);
CREATE INDEX organization_messages_org_created_idx ON organization_messages(organization_id, created_at);

ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_organization_memberships ON organization_memberships
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

CREATE POLICY tenant_organization_teams ON organization_teams
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

CREATE POLICY tenant_organization_team_members ON organization_team_members
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

CREATE POLICY tenant_organization_conversations ON organization_conversations
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

CREATE POLICY tenant_organization_conversation_participants ON organization_conversation_participants
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

CREATE POLICY tenant_organization_messages ON organization_messages
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
