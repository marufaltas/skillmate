-- Supabase / Postgres schema for Skillmate
-- Tables: users, services, orders, messages, transactions, reviews

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique not null,
  password_hash text not null,
  role text not null default 'buyer', -- buyer | seller | admin
  avatar_url text,
  id_card_url text,
  balance numeric default 0,
  created_at timestamptz default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  price numeric not null default 0,
  media_url text,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references users(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  seller_id uuid references users(id) on delete cascade,
  amount numeric not null,
  status text not null default 'pending', -- pending | paid | completed | cancelled
  created_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references users(id),
  to_user uuid references users(id),
  amount numeric not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references users(id),
  to_user uuid references users(id),
  content text,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  reviewer_id uuid references users(id),
  rating int check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Extended schema: files, verification documents, payouts, withdrawals, notifications, audit logs, favorites, service_images
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id) on delete cascade,
  bucket text not null default 'uploads',
  path text not null,
  url text,
  filename text,
  content_type text,
  size bigint,
  metadata jsonb default '{}',
  purpose text, -- avatar | id_card | cert | service_media | other
  created_at timestamptz default now()
);

create table if not exists verification_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  file_id uuid references files(id) on delete set null,
  doc_type text, -- id_card | passport | certificate
  status text default 'pending', -- pending | approved | rejected
  review_notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create table if not exists withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  amount numeric not null,
  method text, -- bank | vodafone | orange | paypal
  details jsonb,
  status text default 'pending', -- pending | processed | rejected
  processed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  withdrawal_id uuid references withdrawal_requests(id) on delete cascade,
  provider_response jsonb,
  status text,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text,
  body text,
  data jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,
  object_type text,
  object_id text,
  details jsonb,
  created_at timestamptz default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, service_id)
);

create table if not exists service_images (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  file_id uuid references files(id) on delete set null,
  position int default 0,
  created_at timestamptz default now()
);

-- Atomic function: create order and transfer funds atomically
create or replace function create_order_with_transfer(buyer_uuid uuid, svc_id uuid)
returns table(order_id uuid) language plpgsql as $$
declare
  svc record;
  seller uuid;
  amt numeric;
begin
  select * into svc from services where id = svc_id;
  if not found then
    raise exception 'service not found';
  end if;
  seller := svc.seller_id;
  amt := svc.price;

  -- Ensure buyer has enough balance
  perform 1 from users where id = buyer_uuid and balance >= amt;
  if not found then
    raise exception 'insufficient_balance';
  end if;

  -- Do updates atomically
  update users set balance = balance - amt where id = buyer_uuid;
  update users set balance = balance + amt where id = seller;

  insert into transactions(from_user, to_user, amount, note) values (buyer_uuid, seller, amt, 'order payment');

  insert into orders(buyer_id, service_id, seller_id, amount, status) values (buyer_uuid, svc_id, seller, amt, 'paid') returning id into order_id;

  return;
end;
$$;
