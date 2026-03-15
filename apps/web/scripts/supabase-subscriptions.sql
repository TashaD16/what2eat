-- user_subscriptions: tracks Stripe plan per user
create table if not exists user_subscriptions (
  id                     uuid        default gen_random_uuid() primary key,
  user_id                uuid        references auth.users(id) on delete cascade not null unique,
  plan                   text        not null default 'free',          -- 'free' | 'pro'
  stripe_customer_id     text,
  stripe_subscription_id text,
  stripe_price_id        text,
  status                 text        not null default 'inactive',      -- 'active' | 'inactive' | 'canceled' | 'past_due'
  current_period_end     timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

alter table user_subscriptions enable row level security;

-- Users can only read their own subscription
create policy "Users can read own subscription"
  on user_subscriptions for select
  using (auth.uid() = user_id);

-- Insert/update is done by Edge Functions using the service role key (bypasses RLS)
