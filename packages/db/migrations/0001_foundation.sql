-- 0001: foundation. Schemas by bounded context (docs/spec/03 §9.2), app internals, collector profile.
-- Plain SQL so it runs unchanged on local Postgres, Neon, and Aurora.

CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS collection;
CREATE SCHEMA IF NOT EXISTS market;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS ingest;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Sessions for Substratal sign-in (docs/spec/04 §6). The cookie holds only the id.
CREATE TABLE app.session (
  id                       uuid PRIMARY KEY,
  sub                      text        NOT NULL,
  org_id                   text,
  refresh_token_ciphertext text        NOT NULL,
  created_at               timestamptz NOT NULL DEFAULT now(),
  last_seen_at             timestamptz NOT NULL DEFAULT now(),
  expires_at               timestamptz NOT NULL
);
CREATE INDEX session_sub_idx ON app.session (sub);

-- Background jobs (docs/spec/04 §9): outbox + after() + Vercel Cron.
CREATE TABLE app.job (
  id           uuid PRIMARY KEY,
  type         text        NOT NULL,
  payload      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status       text        NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'dead')),
  run_after    timestamptz NOT NULL DEFAULT now(),
  attempts     integer     NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX job_ready_idx ON app.job (run_after) WHERE status = 'queued';

-- Processed webhook deliveries, so redeliveries are idempotent.
CREATE TABLE app.webhook_delivery (
  id          text PRIMARY KEY,
  event_type  text        NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

-- The collector profile. Identity (email, password, MFA) lives in Substratal.
CREATE TABLE collection.collector (
  sub                text PRIMARY KEY,
  handle             text        NOT NULL,
  display_name       text,
  bio_md             text,
  profile_visibility text        NOT NULL DEFAULT 'private' CHECK (profile_visibility IN ('private', 'public')),
  search_indexing    boolean     NOT NULL DEFAULT false,
  show_values        boolean     NOT NULL DEFAULT false,
  default_currency   char(3)     NOT NULL DEFAULT 'USD',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collector_handle_format CHECK (handle ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$')
);
CREATE UNIQUE INDEX collector_handle_uidx ON collection.collector (lower(handle));
