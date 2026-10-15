-- ENTRE | schema inicial do Supabase
-- Execute este arquivo uma vez em Supabase > SQL Editor > New query.

create extension if not exists pgcrypto;

create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('expense', 'income')),
  category text not null default 'Outros',
  day_of_month smallint not null check (day_of_month between 1 and 31),
  start_date date not null,
  end_date date,
  active boolean not null default true,
  active_from date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recurring_rule_id uuid references public.recurring_rules(id) on delete set null,
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('expense', 'income')),
  category text not null default 'Outros',
  due_date date not null,
  month_key date not null,
  is_paid boolean not null default false,
  is_deleted boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (date_trunc('month', month_key)::date = month_key)
);

alter table public.transactions add column if not exists is_deleted boolean not null default false;
alter table public.recurring_rules add column if not exists active_from date not null default current_date;

create index if not exists transactions_user_month_idx
  on public.transactions (user_id, month_key, type, due_date);
create index if not exists recurring_rules_user_active_idx
  on public.recurring_rules (user_id, active, start_date);
create unique index if not exists transactions_recurring_month_unique
  on public.transactions (user_id, recurring_rule_id, month_key)
  where recurring_rule_id is not null;

alter table public.transactions enable row level security;
alter table public.recurring_rules enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions for delete using (auth.uid() = user_id);

drop policy if exists "recurring_rules_select_own" on public.recurring_rules;
drop policy if exists "recurring_rules_insert_own" on public.recurring_rules;
drop policy if exists "recurring_rules_update_own" on public.recurring_rules;
drop policy if exists "recurring_rules_delete_own" on public.recurring_rules;
create policy "recurring_rules_select_own" on public.recurring_rules for select using (auth.uid() = user_id);
create policy "recurring_rules_insert_own" on public.recurring_rules for insert with check (auth.uid() = user_id);
create policy "recurring_rules_update_own" on public.recurring_rules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recurring_rules_delete_own" on public.recurring_rules for delete using (auth.uid() = user_id);

-- Cria a ocorrência do mês para cada regra recorrente ativa.
-- Os lançamentos já existentes no mês não são sobrescritos: editar uma ocorrência
-- altera somente aquele mês, sem mudar a regra ou os outros meses.
create or replace function public.ensure_month_occurrences(p_month date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_start date := date_trunc('month', p_month)::date;
  v_end date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  insert into public.transactions (
    user_id, recurring_rule_id, title, amount, type, category,
    due_date, month_key, is_paid, notes
  )
  select
    r.user_id,
    r.id,
    r.title,
    r.amount,
    r.type,
    r.category,
    make_date(
      extract(year from v_start)::int,
      extract(month from v_start)::int,
      least(r.day_of_month, extract(day from v_end)::int)
    ),
    v_start,
    false,
    r.notes
  from public.recurring_rules r
  where r.user_id = auth.uid()
    and r.active = true
    and make_date(
      extract(year from v_start)::int,
      extract(month from v_start)::int,
      least(r.day_of_month, extract(day from v_end)::int)
    ) >= r.start_date
    and make_date(
      extract(year from v_start)::int,
      extract(month from v_start)::int,
      least(r.day_of_month, extract(day from v_end)::int)
    ) >= r.active_from
    and (r.end_date is null or r.end_date >= make_date(
      extract(year from v_start)::int,
      extract(month from v_start)::int,
      least(r.day_of_month, extract(day from v_end)::int)
    ))
  on conflict (user_id, recurring_rule_id, month_key)
    where recurring_rule_id is not null
  do nothing;
end;
$$;

revoke all on function public.ensure_month_occurrences(date) from public, anon;
grant execute on function public.ensure_month_occurrences(date) to authenticated;
