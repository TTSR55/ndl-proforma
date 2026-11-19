/* store.js — üyelik ve kullanıcıya özel kayıt.
   config.js doluysa Supabase kullanılır: e-posta + şifre ile giriş, her satır sahibine ait (RLS, bkz. schema.sql).
   config.js boşsa sayfa "demo" modunu önerir: hesaplar ve veriler yalnızca o tarayıcıda tutulur. */
"use strict";

const CFG = window.NDL_CONFIG || {};
const HAS_SERVER = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const DEMO_FLAG = "ndl-demo-on";

/* Supabase ve demo hatalarını kullanıcıya Türkçe, ne yapacağını söyleyen bir cümleyle anlatır */
function authError(e) {
  const code = (e && (e.code || e.error_code)) || "", msg = String((e && (e.message || e.error_description)) || e || "");
  const has = s => code === s || msg.toLowerCase().includes(s.replace(/_/g, " "));
  if (has("invalid_credentials") || /invalid login credentials/i.test(msg)) return "E-posta veya şifre hatalı.";
  if (has("email_not_confirmed") || /not confirmed/i.test(msg)) return "E-posta adresiniz henüz onaylanmadı. Gelen kutunuzdaki onay bağlantısına tıklayın.";
  if (has("user_already_exists") || /already registered/i.test(msg)) return "Bu e-posta ile kayıtlı bir hesap var. Giriş yapın ya da şifrenizi sıfırlayın.";
  if (has("weak_password") || /password should|password is known|pwned/i.test(msg)) return "Şifre yeterince güçlü değil. En az 10 karakter; büyük harf, küçük harf ve rakam kullanın.";
  if (has("same_password") || /should be different/i.test(msg)) return "Yeni şifre eskisinden farklı olmalı.";
  if (has("reauthentication_needed") || /reauthenticat/i.test(msg)) return "Güvenlik nedeniyle şifre değiştirmek için yakın zamanda giriş yapmış olmanız gerekiyor. Çıkış yapıp yeniden giriş yapın, sonra tekrar deneyin.";
  if (/rate limit|too many/i.test(msg) || code === "over_email_send_rate_limit") return "Çok sık deneme yapıldı. Birkaç dakika sonra tekrar deneyin.";
  if (has("validation_failed") || /invalid format|unable to validate email/i.test(msg)) return "E-posta adresini kontrol edin.";
  if (code === "demo_reset") return "Demo modunda şifre sıfırlama e-postası gönderilemez.";
  if (/failed to fetch|network/i.test(msg)) return "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.";
  return msg || "Beklenmeyen bir hata oluştu.";
}
/* docs tablosu kurulmamışsa true */
function isMissingTable(e) { const m = String((e && e.message) || ""); return (e && (e.code === "42P01" || e.code === "PGRST205")) || /does not exist|could not find the table/i.test(m); }

function supabaseStore() {
  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true}});
  const here = () => location.origin + location.pathname;
  const user = s => (s && s.user ? {id: s.user.id, email: s.user.email} : null);
  return {
    mode: "server", uid: null,
    async session() { const {data} = await sb.auth.getSession(); return user(data.session); },
    onChange(cb) { sb.auth.onAuthStateChange((ev, s) => setTimeout(() => cb(ev, user(s)), 0)); },
    async signUp(email, pw) { const {data, error} = await sb.auth.signUp({email, password: pw, options: {emailRedirectTo: here()}}); if (error) throw error; return {confirm: !data.session}; },
    async signIn(email, pw) { const {error} = await sb.auth.signInWithPassword({email, password: pw}); if (error) throw error; },
    async signOut() { await sb.auth.signOut(); },
    async reset(email) { const {error} = await sb.auth.resetPasswordForEmail(email, {redirectTo: here()}); if (error) throw error; },
    async setPassword(pw) { const {error} = await sb.auth.updateUser({password: pw}); if (error) throw error; },
    async loadAll() {
      let all = [], from = 0;
      for (;;) {
        const {data, error} = await sb.from("docs").select("kind,id,data,updated_at").order("updated_at", {ascending: false}).range(from, from + 999);
        if (error) throw error;
        all = all.concat(data); if (data.length < 1000) break; from += 1000;
      }
      return all;
    },
    async put(kind, id, data) { const {error} = await sb.from("docs").upsert({user_id: this.uid, kind, id, data, updated_at: new Date().toISOString()}, {onConflict: "user_id,kind,id"}); if (error) throw error; },
    async putMany(rows) {
      const now = new Date().toISOString();
      for (let i = 0; i < rows.length; i += 200) {
        const {error} = await sb.from("docs").upsert(rows.slice(i, i + 200).map(r => ({user_id: this.uid, kind: r.kind, id: r.id, data: r.data, updated_at: now})), {onConflict: "user_id,kind,id"});
        if (error) throw error;
      }
    },
    async del(kind, id) { const {error} = await sb.from("docs").delete().eq("kind", kind).eq("id", id); if (error) throw error; }
  };
}

function localStore() {
  const K = "ndl-demo-v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {users: {}, docs: {}, session: null}; } catch (e) { return {users: {}, docs: {}, session: null}; } };
  const save = d => { try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) {} };
  const hash = async (pw, salt) => {
    if (!(window.crypto && crypto.subtle)) return salt + ":" + pw.length;
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pw));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  };
  let cb = () => {};
  return {
    mode: "demo", uid: null,
    async session() { return load().session; },
    onChange(f) { cb = f; },
    async signUp(email, pw) {
      const d = load(), e = email.toLowerCase();
      if (d.users[e]) throw {code: "user_already_exists"};
      const salt = rid(); d.users[e] = {id: "demo-" + rid(), salt, hash: await hash(pw, salt)};
      d.session = {id: d.users[e].id, email: e}; save(d); setTimeout(() => cb("SIGNED_IN", d.session), 0); return {confirm: false};
    },
    async signIn(email, pw) {
      const d = load(), e = email.toLowerCase(), u = d.users[e];
      if (!u || u.hash !== await hash(pw, u.salt)) throw {code: "invalid_credentials"};
      d.session = {id: u.id, email: e}; save(d); setTimeout(() => cb("SIGNED_IN", d.session), 0);
    },
    async signOut() { const d = load(); d.session = null; save(d); setTimeout(() => cb("SIGNED_OUT", null), 0); },
    async reset() { throw {code: "demo_reset"}; },
    async setPassword(pw) { const d = load(), s = d.session; if (!s) return; const u = d.users[s.email]; u.salt = rid(); u.hash = await hash(pw, u.salt); save(d); },
    async loadAll() { return Object.values(load().docs[this.uid] || {}); },
    async put(kind, id, data) { const d = load(), m = d.docs[this.uid] = d.docs[this.uid] || {}; m[kind + "|" + id] = {kind, id, data, updated_at: new Date().toISOString()}; save(d); },
    async putMany(rows) { const d = load(), m = d.docs[this.uid] = d.docs[this.uid] || {}, now = new Date().toISOString(); rows.forEach(r => { m[r.kind + "|" + r.id] = {kind: r.kind, id: r.id, data: r.data, updated_at: now}; }); save(d); },
    async del(kind, id) { const d = load(), m = d.docs[this.uid] || {}; delete m[kind + "|" + id]; save(d); }
  };
}
