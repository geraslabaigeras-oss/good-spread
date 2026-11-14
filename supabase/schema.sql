create extension if not exists pgcrypto;

create table if not exists productions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  version int not null default 1,
  updated_at timestamptz not null default now()
);
create table if not exists events (            -- activity log
  id bigserial primary key,
  production_id uuid references productions(id) on delete cascade,
  type text not null,            -- inbox_read | conflict | approved | sms_sent | sms_skipped | ack | late | reset
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists revisions (
  id bigserial primary key,
  production_id uuid references productions(id) on delete cascade,
  version int not null,
  fix_kind text, changes jsonb not null, receipt jsonb,
  created_at timestamptz not null default now()
);
create table if not exists viewers (           -- a judge/crew device that joined via QR
  id uuid primary key default gen_random_uuid(),
  production_id uuid references productions(id) on delete cascade,
  person_id text not null,
  token text unique not null,
  phone text,                    -- optional, opt-in, deleted on full reset
  created_at timestamptz not null default now()
);
create table if not exists acks (
  viewer_id uuid references viewers(id) on delete cascade,
  version int not null,
  acked_at timestamptz not null default now(),
  primary key (viewer_id, version)
);
create table if not exists extractions (       -- cache keyed by sha256 of input
  sha256 text primary key,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists events_prod_idx on events (production_id, id desc);
create index if not exists revisions_prod_idx on revisions (production_id, version desc);
create index if not exists viewers_prod_idx on viewers (production_id);

alter table productions enable row level security;
alter table events enable row level security;
alter table revisions enable row level security;
alter table viewers enable row level security;
alter table acks enable row level security;
alter table extractions enable row level security;

-- The producer's real people (roster). id is a short text id like "p-1a2b3c4d".
create table if not exists people (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table people enable row level security;
