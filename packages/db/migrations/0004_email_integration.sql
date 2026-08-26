CREATE TYPE mailbox_connection_status AS ENUM (
  'pending_authorization', 'connected', 'reauthorization_required', 'paused', 'disconnected'
);
CREATE TYPE email_message_direction AS ENUM ('inbound', 'outbound');

CREATE TABLE email_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  email_address text NOT NULL,
  display_name text NOT NULL,
  auth_strategy text NOT NULL,
  status mailbox_connection_status NOT NULL DEFAULT 'pending_authorization',
  credential_secret_ref text,
  granted_scopes text[] NOT NULL DEFAULT '{}',
  sync_cursor text,
  subscription_id text,
  subscription_expires_at timestamptz,
  last_successful_sync_at timestamptz,
  last_sync_error_code text,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX email_connections_org_provider_address_unique ON email_connections(organization_id, provider, email_address);
CREATE INDEX email_connections_org_status_idx ON email_connections(organization_id, status);

CREATE TABLE email_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email_connection_id uuid NOT NULL REFERENCES email_connections(id) ON DELETE CASCADE,
  provider_thread_id text NOT NULL,
  subject text NOT NULL,
  snippet text NOT NULL DEFAULT '',
  participants text[] NOT NULL DEFAULT '{}',
  unread boolean NOT NULL DEFAULT true,
  flagged boolean NOT NULL DEFAULT false,
  attachment_count integer NOT NULL DEFAULT 0,
  latest_message_at timestamptz NOT NULL,
  related_entity_type text,
  related_entity_id text,
  related_entity_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX email_threads_connection_provider_thread_unique ON email_threads(email_connection_id, provider_thread_id);
CREATE INDEX email_threads_org_activity_idx ON email_threads(organization_id, latest_message_at);
CREATE INDEX email_threads_org_unread_idx ON email_threads(organization_id, unread);

CREATE TABLE email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email_connection_id uuid NOT NULL REFERENCES email_connections(id) ON DELETE CASCADE,
  email_thread_id uuid NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
  provider_message_id text NOT NULL,
  direction email_message_direction NOT NULL,
  from_address text NOT NULL,
  to_addresses text[] NOT NULL DEFAULT '{}',
  cc_addresses text[] NOT NULL DEFAULT '{}',
  reply_to_address text,
  subject text NOT NULL,
  text_preview text NOT NULL DEFAULT '',
  body_storage_ref text,
  internet_message_id text,
  sent_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX email_messages_connection_provider_message_unique ON email_messages(email_connection_id, provider_message_id);
CREATE INDEX email_messages_thread_sent_idx ON email_messages(email_thread_id, sent_at);
CREATE INDEX email_messages_org_sent_idx ON email_messages(organization_id, sent_at);

CREATE TABLE email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email_message_id uuid NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
  provider_attachment_id text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  byte_size integer NOT NULL,
  object_key text,
  scan_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX email_attachments_message_provider_unique ON email_attachments(email_message_id, provider_attachment_id);
CREATE INDEX email_attachments_org_idx ON email_attachments(organization_id);

ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_email_connections ON email_connections
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
CREATE POLICY tenant_email_threads ON email_threads
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
CREATE POLICY tenant_email_messages ON email_messages
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
CREATE POLICY tenant_email_attachments ON email_attachments
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
