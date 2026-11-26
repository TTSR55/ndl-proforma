-- NDL Proforma · Supabase veritabanı kurulumu
-- Supabase → SQL Editor → New query → bu dosyanın tamamını yapıştırın → Run.
-- Tekrar çalıştırılabilir: mevcut verilere dokunmaz, yalnızca eksik yapıları kurar ve kuralları günceller.
--
-- docs     : her satır bir kullanıcıya aittir (user_id). Tür (kind): quote = proforma, customer = cari kart,
--            product = ürün kütüphanesi, settings = firma ve banka bilgileri.
-- profiles : her hesabın rolü (user / admin) ve durumu (pending = onay bekliyor, active, suspended = donduruldu).
-- audit_log, app_sessions : denetim (girişler, kullanım süresi, işlem geçmişi); yalnızca yönetici okur (bkz. 9).
-- profiles ayrıca ad, soyad, unvan, telefon ve fotoğrafı tutar (bkz. 10); proformada "Hazırlayan" bu addır.
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
-- profil: ad, soyad, unvan, telefon ve fotoğraf (bkz. 10)
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name  text;
alter table public.profiles add column if not exists title      text;
alter table public.profiles add column if not exists phone      text;
alter table public.profiles add column if not exists avatar     text;
alter table public.profiles add column if not exists updated_at timestamptz;
alter table public.profiles drop constraint if exists profiles_fields_len;
alter table public.profiles add constraint profiles_fields_len check (
  char_length(first_name) <= 60 and char_length(last_name) <= 60 and char_length(title) <= 80 and char_length(phone) <= 40 and char_length(avatar) <= 200000);

-- 3) Yardımcı fonksiyonlar (security definer: profilleri kuralların dışında okur; arama yolu boş) -------
--    Geçici şifre bekleyen hesap (must_change) yeni şifresini belirleyene kadar veriye erişemez. Böylece
--    şifre sıfırlanmadan önce açılmış eski bir oturumun elindeki erişim anahtarı da hemen işe yaramaz hâle gelir.
create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active' and not p.must_change);
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active' and not p.must_change and p.role = 'admin');
$$;

-- 4) Yeni hesap → onay bekleyen profil; e-posta değişince profil güncellenir ---------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- kayıt formundaki ad ve soyad (bkz. 10) profile yazılır
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email, left(nullif(btrim(new.raw_user_meta_data->>'first_name'), ''), 60), left(nullif(btrim(new.raw_user_meta_data->>'last_name'), ''), 60))
  on conflict (id) do nothing;
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

-- 5b) Ortak ürün kütüphanesi ve firmalar -----------------------------------------------------------------
--    Ürün kütüphanesi (kind = product) ve proformayı kesen firmalar (kind = company; ör. Düelsan, Ahkos Otomotiv)
--    herkes için ortaktır: tüm aktif kullanıcılar okur, yalnızca yönetici ekler, değiştirir ve siler.
create table if not exists public.shared (
  kind       text        not null check (kind in ('product', 'company')),
  id         text        not null check (char_length(id) between 1 and 120),
  data       jsonb       not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 262144),
  updated_at timestamptz not null default now(),
  updated_by uuid        default auth.uid(),
  primary key (kind, id)
);
alter table public.shared enable row level security;
drop policy if exists "shared_read" on public.shared;
drop policy if exists "shared_admin_insert" on public.shared;
drop policy if exists "shared_admin_update" on public.shared;
drop policy if exists "shared_admin_delete" on public.shared;
create policy "shared_read" on public.shared for select to authenticated using ((select public.is_active()));
create policy "shared_admin_insert" on public.shared for insert to authenticated with check ((select public.is_admin()));
create policy "shared_admin_update" on public.shared for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "shared_admin_delete" on public.shared for delete to authenticated using ((select public.is_admin()));
revoke all on public.shared from anon, authenticated;
grant select, insert, update, delete on public.shared to authenticated;

-- İlk geçiş (yalnızca ortak liste boşken): yöneticinin mevcut ürün kütüphanesi ortak kütüphane olur (fotoğraflar aşağıda eklenir);
-- yöneticinin firma bilgileri ilk firma kaydı olur. Diğer firmalar (ör. Ahkos) uygulamadan eklenir.
insert into public.shared (kind, id, data, updated_by)
select 'product', d.id, d.data, d.user_id
  from public.docs d
 where d.kind = 'product'
   and d.user_id = (select p.id from public.profiles p where p.role = 'admin' and p.status = 'active' order by p.created_at limit 1)
   and not exists (select 1 from public.shared x where x.kind = 'product')
on conflict (kind, id) do nothing;

insert into public.shared (kind, id, data, updated_by)
select 'company', 'firma-1',
       (d.data - 'seeded') || jsonb_build_object('name', d.data->>'company', 'logo', 'duelsan.jpg', 'since', 'Since 1982...', 'brandNote', 'The brand of Düelsan', 'order', 1),
       d.user_id
  from public.docs d
 where d.kind = 'settings' and d.id = 'main' and coalesce(d.data->>'company', '') <> ''
   and d.user_id = (select p.id from public.profiles p where p.role = 'admin' and p.status = 'active' order by p.created_at limit 1)
   and not exists (select 1 from public.shared x where x.kind = 'company')
on conflict (kind, id) do nothing;

-- Katalog fotoğrafları: liftler img/lifts, opsiyonlar img/options, yedek parçalar img/spares altında (dosya adı = ürün kimliği).
-- Yalnızca hiç fotoğraf alanı olmayan katalog ürünlerine eklenir; yöneticinin kaldırdığı fotoğraf ("img": "") geri gelmez.
update public.shared
   set data = data || jsonb_build_object('img',
         case when id ~ '^ndl-[0-9]{4}-' then 'img/lifts/' when id ~ '^opt-[0-9]{2}-' then 'img/options/' else 'img/spares/' end || id || '.jpg'),
       updated_at = now()
 where kind = 'product' and not (data ? 'img')
   and (id ~ '^(ndl-[0-9]{4}|opt-[0-9]{2})-' or id = any (array[
    'el-0701r-12-dc-motor-12v-1-8kw', 'gu-0101-12-ndl-full-powerpack-unit-12v', 'hd-0904l-pump-2-0cc-left',
    'hd-1102-cartridge-2-2', 'hd-1202-ng6-two-way-valve', 'hd-1106-speed-relief-valve',
    'hse-1002-kostal-cable-3950-mm', 'hse-1001-12-kostal-valve-coil-3-2-12v', 'ks-1001-control-box',
    'el-2001-main-switch-100a', 'ks-1401-hand-controller-set', 'el-1201-spiral-cable',
    'el-2501-12-starter-solenoid-12v-150a', 'hd-1301-valve-manifold-single-act', 'hs-0101r-lifting-cylinder-right',
    'hs-0101l-lifting-cylinder-left', 'hs-0206r-tilt-cylinder-right', 'hs-0206l-tilt-cylinder-left',
    'hd-2101-oil-tank-6l', 'gu-1001-powerpack-unit-cover', 'hs-2105-cylinder-cover',
    'mk-2501-bearing-30x34x20']));

-- 6) Proforma numarası: veritabanı verir, şirket genelinde tek ve sıralı, sonradan değiştirilemez ------
--    Biçim: <önek><yıl>/<sıra>, ör. PI2026/0007. Önek, proformada seçilen firmanın "Numara öneki"dir
--    (firmasız eski kayıtlarda kullanıcının eski firma ayarı). Sıra numarası tüm firmalarda ortaktır.
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
    else
      -- numara sistemi kurulmadan önceki kayıt: eski numarası da değişmez, sonradan sistem numarası eklenemez
      -- (eklenebilseydi biri ileri bir numarayı önceden kapıp herkesin yeni proformasını kilitleyebilirdi)
      new.data := new.data - 'sysNo' - 'no';
      if old.data ? 'no' then new.data := jsonb_set(new.data, '{no}', old.data->'no'); end if;
    end if;
    return new;
  end if;
  -- var olan kaydın güncellemesi (upsert) numara harcamaz
  if exists (select 1 from public.docs d where d.user_id = new.user_id and d.kind = new.kind and d.id = new.id) then return new; end if;
  insert into public.quote_counters as c (year, last) values (y, 1)
    on conflict (year) do update set last = c.last + 1 returning c.last into seq;
  select upper(regexp_replace(coalesce(c.data->>'prefix', ''), '[^A-Za-z0-9]', '', 'g')) into pre
    from public.shared c where c.kind = 'company' and c.id = new.data->>'companyId';
  if coalesce(pre, '') = '' then
    select upper(regexp_replace(coalesce(d.data->>'prefix', ''), '[^A-Za-z0-9]', '', 'g')) into pre
      from public.docs d where d.user_id = new.user_id and d.kind = 'settings' and d.id = 'main';
  end if;
  pre := left(coalesce(nullif(pre, ''), 'PI'), 8);
  num := pre || y || '/' || lpad(seq::text, 4, '0');
  new.data := jsonb_set(jsonb_set(new.data, '{sysNo}', to_jsonb(num)), '{no}', to_jsonb(num));
  return new;
end $$;
drop trigger if exists ndl_quote_no on public.docs;
create trigger ndl_quote_no before insert or update on public.docs for each row when (new.kind = 'quote') execute function public.assign_quote_no();
revoke all on function public.assign_quote_no() from public, anon, authenticated;
create unique index if not exists docs_quote_sysno_uniq on public.docs ((data->>'sysNo')) where kind = 'quote' and data ? 'sysNo';
-- bir kaydın sahibi, türü ve kimliği sonradan değiştirilemez. Aksi hâlde bir kaydı önce "cari" yazıp sonra
-- "proforma"ya çevirerek numara kurallarını atlatmak mümkün olurdu. Uygulama bu alanları hiç değiştirmez.
create or replace function public.docs_lock_keys() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.user_id is distinct from old.user_id or new.kind is distinct from old.kind or new.id is distinct from old.id then
    raise exception 'docs_key_immutable' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists ndl_docs_lock_keys on public.docs;
create trigger ndl_docs_lock_keys before update on public.docs for each row execute function public.docs_lock_keys();
revoke all on function public.docs_lock_keys() from public, anon, authenticated;

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
               email_confirmed_at timestamptz, decided_at timestamptz, doc_count bigint, must_change boolean,
               first_name text, last_name text, title text, phone text, avatar text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.email, p.role, p.status, p.created_at, u.last_sign_in_at, u.email_confirmed_at, p.decided_at,
         (select count(*) from public.docs d where d.user_id = p.id), p.must_change,
         p.first_name, p.last_name, p.title, p.phone, p.avatar
    from public.profiles p left join auth.users u on u.id = p.id
   where public.is_admin()
   order by (p.status = 'pending') desc, p.created_at desc;
$$;

create or replace function public.admin_set_status(target uuid, new_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare prev text;
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  if target = auth.uid() then raise exception 'cannot_change_self' using errcode = '42501'; end if;
  if new_status not in ('active', 'suspended') then raise exception 'bad_status' using errcode = '22023'; end if;
  select p.status into prev from public.profiles p where p.id = target;
  update public.profiles set status = new_status, decided_at = now(), decided_by = auth.uid() where id = target;
  if not found then raise exception 'no_user' using errcode = 'P0002'; end if;
  -- dondurulan hesap giriş de yapamaz; aktif edilince yasak kalkar
  update auth.users set banned_until = case when new_status = 'suspended' then now() + interval '100 years' else null end where id = target;
  perform public.audit_add(auth.uid(), 'user_status', 'user', target::text, (select p.email from public.profiles p where p.id = target), jsonb_build_object('from', prev, 'to', new_status));
end $$;

create or replace function public.admin_delete_user(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare em text; nq bigint;
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  if target = auth.uid() then raise exception 'cannot_change_self' using errcode = '42501'; end if;
  select p.email into em from public.profiles p where p.id = target;
  select count(*) into nq from public.docs d where d.user_id = target and d.kind = 'quote';
  perform set_config('ndl.cascade', 'on', true);   -- zincirleme silinen kayıtlar tek tek denetime yazılmaz (bkz. audit_docs)
  delete from auth.users where id = target;   -- profil ve tüm kayıtları (docs) da silinir; denetim geçmişi korunur
  perform set_config('ndl.cascade', 'off', true);
  if not found then raise exception 'no_user' using errcode = 'P0002'; end if;
  perform public.audit_add(auth.uid(), 'user_delete', 'user', target::text, em, jsonb_build_object('quotes', nq));
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
  perform public.audit_add(auth.uid(), 'user_password', 'user', target::text, (select p.email from public.profiles p where p.id = target), '{}'::jsonb);
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

-- 9) Denetim: girişler, kullanım süresi ve işlem geçmişi ----------------------------------------------
--    Yalnızca aktif yönetici okur (aşağıdaki admin_audit_* fonksiyonları). Kullanıcılar bu tabloları hiçbir şekilde
--    okuyamaz ve doğrudan yazamaz; tablolarda kullanıcı kuralı (policy) yoktur ve tüm yetkiler kaldırılmıştır.
--    Kayıtlar veritabanında üretilir: proforma ve cari değişiklikleri tetikleyiciyle, girişler oturum açılışıyla yazılır.
--    Denetim kaydı yazılamazsa (ör. beklenmeyen bir hata) asıl işlem yine tamamlanır.
--    Silinen hesabın geçmişi korunur (e-postası kayıtta saklanır).
create table if not exists public.audit_log (
  id        bigint      generated always as identity primary key,
  at        timestamptz not null default now(),
  user_id   uuid,
  email     text,
  action    text        not null check (char_length(action) <= 40),
  kind      text        check (char_length(kind) <= 20),
  target_id text        check (char_length(target_id) <= 120),
  label     text        check (char_length(label) <= 200),
  detail    jsonb       not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object' and pg_column_size(detail) <= 4096)
);
create index if not exists audit_log_at on public.audit_log (at desc);
create index if not exists audit_log_user_at on public.audit_log (user_id, at desc);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;

-- kullanım oturumu: uygulama açıldığında başlar; açık ve etkin olduğu sürece dakikada bir güncellenir.
-- active_secs: sekme önde ve son 5 dakikada etkileşim varken geçen süre (gerçek kullanım).
create table if not exists public.app_sessions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null,
  email       text,
  kind        text        not null default 'open' check (kind in ('login', 'open')),
  started_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  active_secs integer     not null default 0 check (active_secs >= 0),
  device      text        check (char_length(device) <= 300)
);
create index if not exists app_sessions_started on public.app_sessions (started_at desc);
create index if not exists app_sessions_user on public.app_sessions (user_id, started_at desc);
alter table public.app_sessions enable row level security;
revoke all on public.app_sessions from anon, authenticated;

-- iç yardımcı: denetim kaydı ekler. Kullanıcılar çağıramaz (yalnızca aşağıdaki tetikleyiciler ve fonksiyonlar).
create or replace function public.audit_add(a_user uuid, a_action text, a_kind text, a_target text, a_label text, a_detail jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (user_id, email, action, kind, target_id, label, detail)
  values (a_user, (select p.email from public.profiles p where p.id = a_user), left(a_action, 40), left(a_kind, 20), left(a_target, 120), left(a_label, 200),
          case when jsonb_typeof(a_detail) = 'object' and pg_column_size(a_detail) <= 4096 then a_detail else '{}'::jsonb end);
exception when others then null;   -- denetim kaydı hiçbir işlemi engellemez
end $$;

-- proforma ve cari kart değişiklikleri. Hesap silinirken zincirleme silinen kayıtlar ayrıca yazılmaz (hesap silme kaydı yeterli).
create or replace function public.audit_docs() returns trigger
language plpgsql security definer set search_path = '' as $$
declare k text; rid text; owner uuid; d jsonb; who uuid; strip text[] := array['stage', 'stageAt', 'stageLog', 'updatedAt'];
begin
  if pg_trigger_depth() > 1 or current_setting('ndl.cascade', true) = 'on' then return null; end if;
  if tg_op = 'DELETE' then k := old.kind; rid := old.id; owner := old.user_id; d := old.data;
  else k := new.kind; rid := new.id; owner := new.user_id; d := new.data; end if;
  if k not in ('quote', 'customer') then return null; end if;
  who := coalesce(auth.uid(), owner);
  if k = 'quote' then
    if tg_op = 'INSERT' then
      perform public.audit_add(who, 'quote_create', 'quote', rid, d->>'no', jsonb_build_object('buyer', d->'buyer', 'total', d->'total', 'currency', d->'currency', 'brand', d->'brand', 'lang', d->'lang'));
    elsif tg_op = 'DELETE' then
      perform public.audit_add(who, 'quote_delete', 'quote', rid, d->>'no', jsonb_build_object('buyer', d->'buyer', 'total', d->'total', 'currency', d->'currency', 'stage', d->'stage'));
    else
      if coalesce(old.data->>'stage', 'prepared') is distinct from coalesce(new.data->>'stage', 'prepared') then
        perform public.audit_add(who, 'quote_stage', 'quote', rid, d->>'no', jsonb_build_object('from', coalesce(old.data->>'stage', 'prepared'), 'to', new.data->>'stage', 'buyer', d->'buyer'));
      end if;
      if (old.data - strip) is distinct from (new.data - strip) then
        perform public.audit_add(who, 'quote_update', 'quote', rid, d->>'no', jsonb_build_object('buyer', d->'buyer', 'total', d->'total', 'prevTotal', old.data->'total', 'currency', d->'currency'));
      end if;
    end if;
  else
    if tg_op = 'UPDATE' and (old.data - 'updatedAt') is not distinct from (new.data - 'updatedAt') then return null; end if;
    perform public.audit_add(who, 'customer_' || case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end,
                             'customer', rid, coalesce(nullif(d->>'name', ''), rid), jsonb_build_object('code', d->'code'));
  end if;
  return null;
exception when others then return null;
end $$;
drop trigger if exists ndl_audit_docs on public.docs;
create trigger ndl_audit_docs after insert or update or delete on public.docs for each row execute function public.audit_docs();

-- ortak ürün kütüphanesi ve firma kayıtlarındaki değişiklikler (yönetici işlemleri)
create or replace function public.audit_shared() returns trigger
language plpgsql security definer set search_path = '' as $$
declare k text; rid text; d jsonb;
begin
  if pg_trigger_depth() > 1 then return null; end if;
  if tg_op = 'UPDATE' and old.data is not distinct from new.data then return null; end if;
  if tg_op = 'DELETE' then k := old.kind; rid := old.id; d := old.data; else k := new.kind; rid := new.id; d := new.data; end if;
  perform public.audit_add(auth.uid(), k || '_' || case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end, k, rid,
    case when k = 'product' then trim(coalesce(d->>'code', '') || ' ' || coalesce(d->>'name', '')) else coalesce(nullif(d->>'name', ''), d->>'company', rid) end, '{}'::jsonb);
  return null;
exception when others then return null;
end $$;
drop trigger if exists ndl_audit_shared on public.shared;
create trigger ndl_audit_shared after insert or update or delete on public.shared for each row execute function public.audit_shared();

-- girişler: her başarılı giriş (şifre, e-posta bağlantısı, şifre yenileme) yeni bir oturum açar.
-- Tetikleyici kurulamazsa (ör. barındırma kısıtı) kurulum yine tamamlanır; girişler bu durumda uygulamanın açılış kaydından izlenir.
create or replace function public.audit_login() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.audit_add(new.user_id, 'login', 'session', new.id::text, null, jsonb_build_object('ua', left(coalesce(to_jsonb(new)->>'user_agent', ''), 300)));
  return new;
exception when others then return new;
end $$;
do $$ begin
  execute 'drop trigger if exists ndl_audit_login on auth.sessions';
  execute 'create trigger ndl_audit_login after insert on auth.sessions for each row execute function public.audit_login()';
exception when others then raise notice 'Giriş tetikleyicisi kurulamadı: %', sqlerrm;
end $$;

-- uygulama açılışı: oturum kaydı başlatır ve kimliğini döndürür (cihaz bilgisi isteğin tarayıcı bilgisinden alınır)
create or replace function public.session_start(p_kind text default 'open') returns uuid
language plpgsql security definer set search_path = '' as $$
declare sid uuid; ua text;
begin
  if not public.is_active() then return null; end if;
  begin ua := nullif(current_setting('request.headers', true), '')::json->>'user-agent'; exception when others then ua := null; end;
  insert into public.app_sessions (user_id, email, kind, device)
  values (auth.uid(), (select p.email from public.profiles p where p.id = auth.uid()), case when p_kind = 'login' then 'login' else 'open' end, left(coalesce(ua, ''), 300))
  returning id into sid;
  return sid;
end $$;

-- dakikada bir: son etkinlik zamanı ve etkin kullanım süresi. Eklenen süre, son güncellemeden bu yana geçen süreyi aşamaz.
create or replace function public.session_ping(sid uuid, add_secs integer default 0) returns void
language sql security definer set search_path = '' as $$
  update public.app_sessions
     set active_secs = active_secs + least(greatest(coalesce(add_secs, 0), 0), 300, ceil(extract(epoch from (now() - last_seen)))::int + 5),
         last_seen = now()
   where id = sid and user_id = auth.uid() and last_seen > now() - interval '12 hours' and public.is_active();
$$;

-- uygulamadaki işlemler: PDF ve Excel indirme
create or replace function public.audit_event(p_action text, p_target text default null, p_label text default null, p_detail jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active() then return; end if;
  if p_action not in ('pdf', 'xlsx') then raise exception 'bad_action' using errcode = '22023'; end if;
  perform public.audit_add(auth.uid(), p_action, 'quote', p_target, p_label, p_detail);
end $$;

-- yönetici okuma fonksiyonları
create or replace function public.admin_audit_quotes()
returns table (owner uuid, email text, id text, data jsonb, item_count integer, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select d.user_id, p.email, d.id,
         (d.data - 'items' - 'seller') || jsonb_build_object('sellerName', coalesce(d.data->'seller'->>'company', '')),
         case when jsonb_typeof(d.data->'items') = 'array' then jsonb_array_length(d.data->'items') else 0 end, d.updated_at
    from public.docs d left join public.profiles p on p.id = d.user_id
   where public.is_admin() and d.kind = 'quote'
   order by d.updated_at desc
   limit 20000;
$$;
create or replace function public.admin_audit_sessions(since timestamptz default null)
returns table (id uuid, user_id uuid, email text, kind text, started_at timestamptz, last_seen timestamptz, active_secs integer, device text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.user_id, coalesce(p.email, s.email), s.kind, s.started_at, s.last_seen, s.active_secs, s.device
    from public.app_sessions s left join public.profiles p on p.id = s.user_id
   where public.is_admin() and (since is null or s.last_seen >= since)
   order by s.started_at desc
   limit 10000;
$$;
create or replace function public.admin_audit_log(since timestamptz default null, max_rows integer default 5000)
returns table (id bigint, at timestamptz, user_id uuid, email text, action text, kind text, target_id text, label text, detail jsonb)
language sql stable security definer set search_path = '' as $$
  select a.id, a.at, a.user_id, coalesce(p.email, a.email), a.action, a.kind, a.target_id, a.label, a.detail
    from public.audit_log a left join public.profiles p on p.id = a.user_id
   where public.is_admin() and (since is null or a.at >= since)
   order by a.at desc
   limit least(greatest(coalesce(max_rows, 5000), 1), 20000);
$$;

revoke all on function public.audit_add(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.audit_docs() from public, anon, authenticated;
revoke all on function public.audit_shared() from public, anon, authenticated;
revoke all on function public.audit_login() from public, anon, authenticated;
revoke all on function public.session_start(text) from public, anon;
revoke all on function public.session_ping(uuid, integer) from public, anon;
revoke all on function public.audit_event(text, text, text, jsonb) from public, anon;
revoke all on function public.admin_audit_quotes() from public, anon;
revoke all on function public.admin_audit_sessions(timestamptz) from public, anon;
revoke all on function public.admin_audit_log(timestamptz, integer) from public, anon;
grant execute on function public.session_start(text) to authenticated;
grant execute on function public.session_ping(uuid, integer) to authenticated;
grant execute on function public.audit_event(text, text, text, jsonb) to authenticated;
grant execute on function public.admin_audit_quotes() to authenticated;
grant execute on function public.admin_audit_sessions(timestamptz) to authenticated;
grant execute on function public.admin_audit_log(timestamptz, integer) to authenticated;

-- 10) Profil: ad, soyad, unvan, telefon ve fotoğraf -----------------------------------------------------
--     Her hesap adını ve soyadını girer; proformalarda "Hazırlayan" olarak bu ad basılır (kullanıcı isterse gizler).
--     Kullanıcı yalnızca kendi profilini update_my_profile ile değiştirir; rol, durum ve e-posta alanlarına dokunamaz.
--     Fotoğraf küçültülmüş bir görsel (data: URL, en fazla ~200 KB) olarak saklanır.
--     Profil sütunları (ad, soyad, unvan, telefon, fotoğraf) 2. bölümde tanımlanır.

create or replace function public.update_my_profile(p_first text, p_last text, p_title text default null, p_phone text default null,
                                                    p_avatar text default null, p_set_avatar boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare f text := btrim(coalesce(p_first, '')); l text := btrim(coalesce(p_last, ''));
        ti text := nullif(btrim(coalesce(p_title, '')), ''); ph text := nullif(btrim(coalesce(p_phone, '')), '');
begin
  if auth.uid() is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if char_length(f) not between 2 and 60 or char_length(l) not between 2 and 60 then raise exception 'name_required' using errcode = '22023'; end if;
  if char_length(ti) > 80 then raise exception 'bad_title' using errcode = '22023'; end if;
  if ph is not null and (char_length(ph) > 40 or ph !~ '^[0-9+(). /-]+$') then raise exception 'bad_phone' using errcode = '22023'; end if;
  if p_set_avatar and p_avatar is not null and (char_length(p_avatar) > 200000 or p_avatar !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$') then
    raise exception 'bad_avatar' using errcode = '22023'; end if;
  update public.profiles
     set first_name = f, last_name = l, title = ti, phone = ph,
         avatar = case when p_set_avatar then p_avatar else avatar end, updated_at = now()
   where id = auth.uid();
  if not found then raise exception 'no_user' using errcode = 'P0002'; end if;
  perform public.audit_add(auth.uid(), 'profile_update', 'user', auth.uid()::text, f || ' ' || l, jsonb_build_object('avatar', p_set_avatar));
end $$;
revoke all on function public.update_my_profile(text, text, text, text, text, boolean) from public, anon;
grant execute on function public.update_my_profile(text, text, text, text, text, boolean) to authenticated;
-- admin_list_users yeniden tanımlandığı için yetkisi yeniden verilir
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
