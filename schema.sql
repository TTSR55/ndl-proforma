-- NDL Proforma · Supabase veritabanı kurulumu
-- Supabase → SQL Editor → New query → bu dosyanın tamamını yapıştırın → Run. Bir kez çalıştırmanız yeterli.
--
-- Tek tablo: her satır bir kullanıcıya aittir (user_id). Tür (kind):
--   quote = proforma, customer = alıcı, product = ürün kütüphanesi, settings = firma ve banka bilgileri.
-- Satır düzeyi güvenlik (RLS) sayesinde her kullanıcı yalnızca kendi satırlarını görür, ekler, değiştirir ve siler.

create table if not exists public.docs (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text        not null check (kind in ('quote', 'customer', 'product', 'settings')),
  id         text        not null,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

create index if not exists docs_user_kind_updated on public.docs (user_id, kind, updated_at desc);

alter table public.docs enable row level security;

drop policy if exists "docs_select_own" on public.docs;
drop policy if exists "docs_insert_own" on public.docs;
drop policy if exists "docs_update_own" on public.docs;
drop policy if exists "docs_delete_own" on public.docs;

create policy "docs_select_own" on public.docs for select to authenticated using ((select auth.uid()) = user_id);
create policy "docs_insert_own" on public.docs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "docs_update_own" on public.docs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "docs_delete_own" on public.docs for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.docs to authenticated;
revoke all on public.docs from anon;
