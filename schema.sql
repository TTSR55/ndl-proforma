-- NDL Proforma · Supabase veritabanı kurulumu
-- Supabase → SQL Editor → New query → bu dosyanın tamamını yapıştırın → Run.
-- Tekrar çalıştırılabilir: mevcut verilere dokunmaz, yalnızca eksik yapıları kurar ve kuralları günceller.
--
-- docs     : her satır bir kullanıcıya aittir (user_id). Tür (kind): quote = proforma, customer = cari kart,
--            product = ürün kütüphanesi, settings = firma ve banka bilgileri.
-- profiles : her hesabın rolü (user / admin) ve durumu (pending = onay bekliyor, active, suspended = donduruldu).
-- Yeni kayıtlar "pending" başlar; yönetici onaylayana kadar hiçbir veriye erişemez. Dondurulan hesap giriş yapamaz.

-- 1) Kullanıcı verileri ------------------------------------------------------------------------------
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

alter table public.docs drop constraint if exists docs_id_len;
alter table public.docs drop constraint if exists docs_data_object;
alter table public.docs drop constraint if exists docs_data_size;
alter table public.docs add constraint docs_id_len check (char_length(id) between 1 and 120);
alter table public.docs add constraint docs_data_object check (jsonb_typeof(data) = 'object');
alter table public.docs add constraint docs_data_size check (pg_column_size(data) <= 262144);

-- 2) Profiller: rol ve onay durumu -------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid        primary key references auth.users (id) on delete cascade,
  email      text,
  role       text        not null default 'user'    check (role in ('user', 'admin')),
  status     text        not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid
);
alter table public.profiles enable row level security;
-- yönetici geçici şifre verdiğinde true: kullanıcı ilk girişte yeni şifre belirlemeden devam edemez
alter table public.profiles add column if not exists must_change boolean not null default false;

-- 3) Yardımcı fonksiyonlar (security definer: profilleri kuralların dışında okur; arama yolu boş) -------
create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active');
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active' and p.role = 'admin');
$$;

-- 4) Yeni hesap → onay bekleyen profil; e-posta değişince profil güncellenir ---------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists ndl_on_auth_user_created on auth.users;
create trigger ndl_on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_user_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;
drop trigger if exists ndl_on_auth_user_email on auth.users;
create trigger ndl_on_auth_user_email after update of email on auth.users for each row execute function public.handle_user_email();

-- kullanıcı şifresini değiştirince "geçici şifre" bayrağı kalkar
create or replace function public.handle_password_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.profiles set must_change = false where id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists ndl_on_auth_password on auth.users;
create trigger ndl_on_auth_password after update of encrypted_password on auth.users for each row execute function public.handle_password_change();

-- Mevcut hesaplar için profil (onay bekliyor olarak)
insert into public.profiles (id, email, created_at) select id, email, created_at from auth.users on conflict (id) do nothing;
-- Hiç yönetici yoksa en eski hesap yönetici olur (yeni kurulumda ilk kaydolan kişi)
update public.profiles set role = 'admin', status = 'active', decided_at = now()
 where id = (select id from public.profiles order by created_at limit 1)
   and not exists (select 1 from public.profiles where role = 'admin');

-- 5) Satır kuralları -------------------------------------------------------------------------------------
drop policy if exists "docs_select_own" on public.docs;
drop policy if exists "docs_insert_own" on public.docs;
drop policy if exists "docs_update_own" on public.docs;
drop policy if exists "docs_delete_own" on public.docs;
create policy "docs_select_own" on public.docs for select to authenticated using ((select auth.uid()) = user_id and (select public.is_active()));
create policy "docs_insert_own" on public.docs for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_active()));
create policy "docs_update_own" on public.docs for update to authenticated using ((select auth.uid()) = user_id and (select public.is_active())) with check ((select auth.uid()) = user_id and (select public.is_active()));
create policy "docs_delete_own" on public.docs for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_active()));

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);

-- Yalnızca gereken yetkiler. TRUNCATE / TRIGGER / REFERENCES verilmez; profiller doğrudan değiştirilemez.
revoke all on public.docs from anon, authenticated;
grant select, insert, update, delete on public.docs to authenticated;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- 6) Proforma numarası: veritabanı verir, şirket genelinde tek ve sıralı, sonradan değiştirilemez ------
--    Biçim: <önek><yıl>/<sıra>, ör. PI2026/0007. Önek her kullanıcının Firma ayarındaki "Numara öneki"dir.
create table if not exists public.quote_counters (year int primary key, last int not null default 0);
alter table public.quote_counters enable row level security;
revoke all on public.quote_counters from anon, authenticated;

create or replace function public.assign_quote_no() returns trigger
language plpgsql security definer set search_path = '' as $$
declare y int := extract(year from (now() at time zone 'Europe/Istanbul'))::int; seq int; pre text; num text;
begin
  if tg_op = 'UPDATE' then
    -- kayıtlı proformanın numarası değişmez
    if old.data ? 'sysNo' then
      new.data := jsonb_set(jsonb_set(new.data, '{sysNo}', old.data->'sysNo'), '{no}', old.data->'sysNo');
    end if;
    return new;
  end if;
  -- var olan kaydın güncellemesi (upsert) numara harcamaz
  if exists (select 1 from public.docs d where d.user_id = new.user_id and d.kind = new.kind and d.id = new.id) then return new; end if;
  insert into public.quote_counters as c (year, last) values (y, 1)
    on conflict (year) do update set last = c.last + 1 returning c.last into seq;
  select upper(regexp_replace(coalesce(d.data->>'prefix', ''), '[^A-Za-z0-9]', '', 'g')) into pre
    from public.docs d where d.user_id = new.user_id and d.kind = 'settings' and d.id = 'main';
  pre := left(coalesce(nullif(pre, ''), 'PI'), 8);
  num := pre || y || '/' || lpad(seq::text, 4, '0');
  new.data := jsonb_set(jsonb_set(new.data, '{sysNo}', to_jsonb(num)), '{no}', to_jsonb(num));
  return new;
end $$;
drop trigger if exists ndl_quote_no on public.docs;
create trigger ndl_quote_no before insert or update on public.docs for each row when (new.kind = 'quote') execute function public.assign_quote_no();
revoke all on function public.assign_quote_no() from public, anon, authenticated;
create unique index if not exists docs_quote_sysno_uniq on public.docs ((data->>'sysNo')) where kind = 'quote' and data ? 'sysNo';

-- sayaç, bu yıl kullanılmış en büyük numaradan devam eder
insert into public.quote_counters (year, last)
select extract(year from (now() at time zone 'Europe/Istanbul'))::int,
       coalesce(max((regexp_match(data->>'no', '/(\d+)$'))[1]::int), 0)
  from public.docs
 where kind = 'quote' and data->>'no' ~ ('^[A-Za-z0-9]*' || extract(year from (now() at time zone 'Europe/Istanbul'))::int || '/\d+$')
on conflict (year) do update set last = greatest(public.quote_counters.last, excluded.last);

-- 7) Yönetici işlemleri (yalnızca aktif yönetici çalıştırabilir; kendi hesabına uygulanamaz) --------------
--    Şifreler yalnızca tek yönlü özet (bcrypt) olarak saklanır; hiç kimse, yönetici de, bir şifreyi göremez.
drop function if exists public.admin_list_users();
create or replace function public.admin_list_users()
returns table (id uuid, email text, role text, status text, created_at timestamptz, last_sign_in_at timestamptz,
               email_confirmed_at timestamptz, decided_at timestamptz, doc_count bigint, must_change boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.email, p.role, p.status, p.created_at, u.last_sign_in_at, u.email_confirmed_at, p.decided_at,
         (select count(*) from public.docs d where d.user_id = p.id), p.must_change
    from public.profiles p left join auth.users u on u.id = p.id
   where public.is_admin()
   order by (p.status = 'pending') desc, p.created_at desc;
$$;

create or replace function public.admin_set_status(target uuid, new_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  if target = auth.uid() then raise exception 'cannot_change_self' using errcode = '42501'; end if;
  if new_status not in ('active', 'suspended') then raise exception 'bad_status' using errcode = '22023'; end if;
  update public.profiles set status = new_status, decided_at = now(), decided_by = auth.uid() where id = target;
  if not found then raise exception 'no_user' using errcode = 'P0002'; end if;
  -- dondurulan hesap giriş de yapamaz; aktif edilince yasak kalkar
  update auth.users set banned_until = case when new_status = 'suspended' then now() + interval '100 years' else null end where id = target;
end $$;

create or replace function public.admin_delete_user(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  if target = auth.uid() then raise exception 'cannot_change_self' using errcode = '42501'; end if;
  delete from auth.users where id = target;   -- profil ve tüm kayıtları (docs) da silinir
  if not found then raise exception 'no_user' using errcode = 'P0002'; end if;
end $$;

-- geçici şifre: kurallara uymalı; kullanıcının açık oturumları kapatılır ve ilk girişte yeni şifre ister
create or replace function public.admin_set_password(target uuid, new_password text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  if target = auth.uid() then raise exception 'cannot_change_self' using errcode = '42501'; end if;
  if char_length(new_password) < 10 or char_length(new_password) > 72 or new_password !~ '[a-z]' or new_password !~ '[A-Z]' or new_password !~ '[0-9]' then
    raise exception 'weak_password' using errcode = '22023'; end if;
  update auth.users set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')), updated_at = now() where id = target;
  if not found then raise exception 'no_user' using errcode = 'P0002'; end if;
  update public.profiles set must_change = true where id = target;
  delete from auth.sessions where user_id = target;
end $$;

-- 8) Duyurular: yönetici yazar, tüm aktif kullanıcılar görür ------------------------------------------
create table if not exists public.announcements (
  id         bigint      generated always as identity primary key,
  title      text        not null check (char_length(title) between 1 and 120),
  body       text        not null default '' check (char_length(body) <= 2000),
  level      text        not null default 'info' check (level in ('info', 'warning', 'important')),
  active     boolean     not null default true,
  created_at timestamptz not null default now(),
  created_by uuid        default auth.uid()
);
alter table public.announcements enable row level security;
drop policy if exists "ann_read" on public.announcements;
drop policy if exists "ann_admin_insert" on public.announcements;
drop policy if exists "ann_admin_update" on public.announcements;
drop policy if exists "ann_admin_delete" on public.announcements;
create policy "ann_read" on public.announcements for select to authenticated using ((select public.is_active()) and (active or (select public.is_admin())));
create policy "ann_admin_insert" on public.announcements for insert to authenticated with check ((select public.is_admin()));
create policy "ann_admin_update" on public.announcements for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "ann_admin_delete" on public.announcements for delete to authenticated using ((select public.is_admin()));
revoke all on public.announcements from anon, authenticated;
grant select, insert, update, delete on public.announcements to authenticated;

revoke all on function public.is_active() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_user_email() from public, anon, authenticated;
revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_set_status(uuid, text) from public, anon;
revoke all on function public.admin_delete_user(uuid) from public, anon;
revoke all on function public.admin_set_password(uuid, text) from public, anon;
revoke all on function public.handle_password_change() from public, anon, authenticated;
grant execute on function public.is_active() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_status(uuid, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_set_password(uuid, text) to authenticated;
