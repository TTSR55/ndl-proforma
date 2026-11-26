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
  if (has("user_banned") || /banned/i.test(msg)) return "Hesabınız yönetici tarafından donduruldu. Bilgi için yöneticinizle görüşün.";
  if (/not_admin/.test(msg)) return "Bu işlem için yönetici yetkisi gerekiyor.";
  if (/cannot_change_self/.test(msg)) return "Bu işlemi kendi hesabınıza uygulayamazsınız.";
  if (/no_user/.test(msg)) return "Kullanıcı bulunamadı; liste güncel olmayabilir.";
  if (has("email_not_confirmed") || /not confirmed/i.test(msg)) return "E-posta adresiniz henüz onaylanmadı. Gelen kutunuzdaki onay bağlantısına tıklayın.";
  if (has("user_already_exists") || /already registered/i.test(msg)) return "Bu e-posta ile kayıtlı bir hesap var. Giriş yapın ya da şifrenizi sıfırlayın.";
  if (has("weak_password") || /password should|password is known|pwned/i.test(msg)) return "Şifre yeterince güçlü değil. En az 10 karakter; büyük harf, küçük harf ve rakam kullanın.";
  if (has("same_password") || /should be different/i.test(msg)) return "Yeni şifre eskisinden farklı olmalı.";
  if (has("reauthentication_needed") || /reauthenticat/i.test(msg)) return "Güvenlik nedeniyle şifre değiştirmek için yakın zamanda giriş yapmış olmanız gerekiyor. Çıkış yapıp yeniden giriş yapın, sonra tekrar deneyin.";
  if (/rate limit|too many/i.test(msg) || code === "over_email_send_rate_limit") return "Çok sık deneme yapıldı. Birkaç dakika sonra tekrar deneyin.";
  if (has("validation_failed") || /invalid format|unable to validate email/i.test(msg)) return "E-posta adresini kontrol edin.";
  if (code === "demo_reset") return "Demo modunda şifre sıfırlama e-postası gönderilemez.";
  if (/failed to fetch|network/i.test(msg)) return "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.";
  if (code === "42501" || /row-level security|permission denied/i.test(msg)) return "Bu işlem için yetkiniz yok. Hesabınızın durumu ya da şifreniz değişmiş olabilir; sayfayı yenileyip tekrar giriş yapın.";
  return msg || "Beklenmeyen bir hata oluştu.";
}
/* docs ya da profiles tablosu (veya yönetici fonksiyonları) kurulmamışsa true */
function isMissingTable(e) { const m = String((e && e.message) || ""); return (e && (e.code === "42P01" || e.code === "PGRST205" || e.code === "PGRST202")) || /does not exist|could not find the (table|function)/i.test(m); }

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
    /* kaydedilen satırı geri döndürür: proforma numarasını veritabanı verir (bkz. schema.sql · assign_quote_no) */
    async put(kind, id, data) { const {data: row, error} = await sb.from("docs").upsert({user_id: this.uid, kind, id, data, updated_at: new Date().toISOString()}, {onConflict: "user_id,kind,id"}).select("data").single(); if (error) throw error; return row ? row.data : data; },
    async putMany(rows) {
      const now = new Date().toISOString();
      for (let i = 0; i < rows.length; i += 200) {
        const {error} = await sb.from("docs").upsert(rows.slice(i, i + 200).map(r => ({user_id: this.uid, kind: r.kind, id: r.id, data: r.data, updated_at: now})), {onConflict: "user_id,kind,id"});
        if (error) throw error;
      }
    },
    async del(kind, id) { const {error} = await sb.from("docs").delete().eq("kind", kind).eq("id", id); if (error) throw error; },
    async profile() { const {data, error} = await sb.from("profiles").select("id,email,role,status,must_change").eq("id", this.uid).maybeSingle(); if (error) throw error; return data; },
    /* duyurular: okuma tüm aktif kullanıcılara, yazma yalnızca yöneticiye (RLS) */
    async listAnn() { const {data, error} = await sb.from("announcements").select("id,title,body,level,active,created_at").order("created_at", {ascending: false}).limit(50); if (error) throw error; return data || []; },
    async addAnn(a) { const {error} = await sb.from("announcements").insert({title: a.title, body: a.body, level: a.level, active: true}); if (error) throw error; },
    async updAnn(id, patch) { const {error} = await sb.from("announcements").update(patch).eq("id", id); if (error) throw error; },
    async delAnn(id) { const {error} = await sb.from("announcements").delete().eq("id", id); if (error) throw error; },
    async rpc(fn, args) { const {data, error} = await sb.rpc(fn, args || {}); if (error) throw error; return data; },
    /* ortak ürün kütüphanesi ve firmalar: tüm aktif kullanıcılar okur, yalnızca yönetici yazar (RLS) */
    async listShared() { const {data, error} = await sb.from("shared").select("kind,id,data").limit(5000); if (error) throw error; return data || []; },
    async putShared(kind, id, data) { const {data: row, error} = await sb.from("shared").upsert({kind, id, data, updated_at: new Date().toISOString()}, {onConflict: "kind,id"}).select("data").single(); if (error) throw error; return row ? row.data : data; },
    async putSharedMany(rows) {
      const now = new Date().toISOString();
      for (let i = 0; i < rows.length; i += 200) {
        const {error} = await sb.from("shared").upsert(rows.slice(i, i + 200).map(r => ({kind: r.kind, id: r.id, data: r.data, updated_at: now})), {onConflict: "kind,id"});
        if (error) throw error;
      }
    },
    async delShared(kind, id) { const {error} = await sb.from("shared").delete().eq("kind", kind).eq("id", id); if (error) throw error; }
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
      const salt = rid(), first = !Object.values(d.users).some(u => u.role === "admin");
      d.users[e] = {id: "demo-" + rid(), salt, hash: await hash(pw, salt), role: first ? "admin" : "user", status: first ? "active" : "pending", created_at: new Date().toISOString()};
      d.session = {id: d.users[e].id, email: e}; demoAudit(d, d.users[e].id, "login", "session", null, null, {ua: navigator.userAgent}); save(d); setTimeout(() => cb("SIGNED_IN", d.session), 0); return {confirm: false};
    },
    async signIn(email, pw) {
      const d = load(), e = email.toLowerCase(), u = d.users[e];
      if (!u || u.hash !== await hash(pw, u.salt)) throw {code: "invalid_credentials"};
      if (u.status === "suspended") throw {code: "user_banned"};
      u.last_sign_in_at = new Date().toISOString();
      d.session = {id: u.id, email: e}; demoAudit(d, u.id, "login", "session", null, null, {ua: navigator.userAgent}); save(d); setTimeout(() => cb("SIGNED_IN", d.session), 0);
    },
    async signOut() { const d = load(); d.session = null; save(d); setTimeout(() => cb("SIGNED_OUT", null), 0); },
    async reset() { throw {code: "demo_reset"}; },
    async setPassword(pw) { const d = load(), s = d.session; if (!s) return; const u = d.users[s.email]; u.salt = rid(); u.hash = await hash(pw, u.salt); u.must_change = false; save(d); },
    async loadAll() { return Object.values(load().docs[this.uid] || {}); },
    async put(kind, id, data) {
      const d = load(), m = d.docs[this.uid] = d.docs[this.uid] || {}, key = kind + "|" + id, old = m[key];
      data = JSON.parse(JSON.stringify(data));
      if (kind === "quote") {   /* sunucudaki numaralandırmanın demo karşılığı: tüm demo hesaplarında ortak sayaç */
        if (!old) {
          const y = new Date().getFullYear(); d.counters = d.counters || {}; d.counters[y] = (d.counters[y] || 0) + 1;
          const co = ((d.shared || {})["company|" + data.companyId] || {}).data || {};
          const pre = String(co.prefix || ((m["settings|main"] || {}).data || {}).prefix || "PI").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8) || "PI";
          data.sysNo = data.no = pre + y + "/" + String(d.counters[y]).padStart(4, "0");
        } else if (old.data && old.data.sysNo) { data.sysNo = data.no = old.data.sysNo; }
      }
      demoDocAudit(d, this.uid, kind, id, old && old.data, data);
      m[key] = {kind, id, data, updated_at: new Date().toISOString()}; save(d); return data;
    },
    async putMany(rows) { const d = load(), m = d.docs[this.uid] = d.docs[this.uid] || {}, now = new Date().toISOString(); rows.forEach(r => { m[r.kind + "|" + r.id] = {kind: r.kind, id: r.id, data: r.data, updated_at: now}; }); save(d); },
    async del(kind, id) { const d = load(), m = d.docs[this.uid] || {}, old = m[kind + "|" + id]; if (old) demoDocAudit(d, this.uid, kind, id, old.data, null); delete m[kind + "|" + id]; save(d); },
    async profile() {
      const d = load(), e = Object.keys(d.users).find(k => d.users[k].id === this.uid), u = e && d.users[e];
      if (!u) return null;
      if (!u.role) { u.role = Object.values(d.users).some(x => x.role === "admin") ? "user" : "admin"; u.status = u.role === "admin" ? "active" : "pending"; save(d); }
      return {id: u.id, email: e, role: u.role, status: u.status, must_change: !!u.must_change};
    },
    async listAnn() { const d = load(), me = Object.values(d.users).find(u => u.id === this.uid), admin = me && me.role === "admin"; return (d.ann || []).filter(a => a.active || admin).sort((a, b) => b.id - a.id); },
    async addAnn(a) { const d = load(); d.ann = d.ann || []; d.ann.push({id: Date.now(), title: a.title, body: a.body, level: a.level, active: true, created_at: new Date().toISOString()}); save(d); },
    async updAnn(id, patch) { const d = load(), a = (d.ann || []).find(x => x.id === id); if (a) Object.assign(a, patch); save(d); },
    async delAnn(id) { const d = load(); d.ann = (d.ann || []).filter(x => x.id !== id); save(d); },
    async rpc(fn, args) {
      const d = load(), me = Object.values(d.users).find(u => u.id === this.uid), now = new Date().toISOString();
      args = args || {};
      if (fn === "session_start") {
        if (!me || me.status !== "active") return null;
        const s = {id: "s-" + rid(), user_id: this.uid, email: demoEmail(d, this.uid), kind: args.p_kind === "login" ? "login" : "open", started_at: now, last_seen: now, active_secs: 0, device: navigator.userAgent.slice(0, 300)};
        d.sessions = (d.sessions || []).concat(s).slice(-3000); save(d); return s.id;
      }
      if (fn === "session_ping") {
        const s = (d.sessions || []).find(x => x.id === args.sid && x.user_id === this.uid);
        if (s && me && me.status === "active") { const el = Math.ceil((Date.now() - Date.parse(s.last_seen)) / 1000) + 5; s.active_secs += Math.min(Math.max(Number(args.add_secs) || 0, 0), 300, el); s.last_seen = now; save(d); }
        return null;
      }
      if (fn === "audit_event") {
        if (!me || me.status !== "active") return null;
        if (!["pdf", "xlsx"].includes(args.p_action)) throw {message: "bad_action"};
        demoAudit(d, this.uid, args.p_action, "quote", args.p_target, args.p_label, args.p_detail); save(d); return null;
      }
      if (!me || me.role !== "admin" || me.status !== "active") throw {message: "not_admin"};
      const since = args.since ? Date.parse(args.since) : 0;
      if (fn === "admin_audit_quotes") return Object.entries(d.docs).flatMap(([uid, m]) => Object.values(m).filter(r => r.kind === "quote").map(r => {
        const {items, seller, ...rest} = r.data || {};
        return {owner: uid, email: demoEmail(d, uid), id: r.id, data: Object.assign(rest, {sellerName: (seller && seller.company) || ""}), item_count: (items || []).length, updated_at: r.updated_at};
      }));
      if (fn === "admin_audit_sessions") return (d.sessions || []).filter(s => !since || Date.parse(s.last_seen) >= since).map(s => Object.assign({}, s, {email: demoEmail(d, s.user_id) || s.email})).sort((a, b) => b.started_at.localeCompare(a.started_at));
      if (fn === "admin_audit_log") return (d.audit || []).filter(e => !since || Date.parse(e.at) >= since).map(e => Object.assign({}, e, {email: demoEmail(d, e.user_id) || e.email})).sort((a, b) => b.id - a.id).slice(0, Math.min(Math.max(Number(args.max_rows) || 5000, 1), 20000));
      const entry = id => Object.entries(d.users).find(([, u]) => u.id === id);
      if (fn === "admin_list_users") return Object.entries(d.users).map(([email, u]) => ({id: u.id, email, role: u.role || "user", status: u.status || "pending", created_at: u.created_at || null, last_sign_in_at: u.last_sign_in_at || null, email_confirmed_at: u.created_at || null, decided_at: u.decided_at || null, doc_count: Object.keys(d.docs[u.id] || {}).length, must_change: !!u.must_change}))
        .sort((a, b) => (b.status === "pending") - (a.status === "pending") || String(b.created_at).localeCompare(String(a.created_at)));
      const hit = entry(args && args.target); if (!hit) throw {message: "no_user"};
      if (hit[1].id === this.uid) throw {message: "cannot_change_self"};
      if (fn === "admin_set_status") { if (!["active", "suspended"].includes(args.new_status)) throw {message: "bad_status"}; const prev = hit[1].status; hit[1].status = args.new_status; hit[1].decided_at = now; demoAudit(d, this.uid, "user_status", "user", hit[1].id, hit[0], {from: prev, to: args.new_status}); save(d); return null; }
      if (fn === "admin_set_password") { const pw = String(args.new_password || ""); if (pw.length < 10 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) throw {message: "weak_password"}; hit[1].salt = rid(); hit[1].hash = await hash(pw, hit[1].salt); hit[1].must_change = true; demoAudit(d, this.uid, "user_password", "user", hit[1].id, hit[0], {}); save(d); return null; }
      if (fn === "admin_delete_user") { const nq = Object.values(d.docs[hit[1].id] || {}).filter(r => r.kind === "quote").length; demoAudit(d, this.uid, "user_delete", "user", hit[1].id, hit[0], {quotes: nq}); delete d.users[hit[0]]; delete d.docs[hit[1].id]; save(d); return null; }
      throw {message: "unknown_function"};
    },
    /* ortak kütüphane ve firmaların demo karşılığı: tüm demo hesaplarında ortak, yalnızca yönetici yazar */
    async listShared() { return Object.values(load().shared || {}); },
    async putShared(kind, id, data) { const d = load(); demoAdmin(d, this.uid); d.shared = d.shared || {}; demoSharedAudit(d, this.uid, kind, id, (d.shared[kind + "|" + id] || {}).data, data); d.shared[kind + "|" + id] = {kind, id, data: JSON.parse(JSON.stringify(data))}; save(d); return data; },
    async putSharedMany(rows) { const d = load(); demoAdmin(d, this.uid); d.shared = d.shared || {}; rows.forEach(r => { d.shared[r.kind + "|" + r.id] = {kind: r.kind, id: r.id, data: r.data}; }); save(d); },
    async delShared(kind, id) { const d = load(); demoAdmin(d, this.uid); if (d.shared && d.shared[kind + "|" + id]) demoSharedAudit(d, this.uid, kind, id, d.shared[kind + "|" + id].data, null); if (d.shared) delete d.shared[kind + "|" + id]; save(d); }
  };
}
function demoAdmin(d, uid) { const me = Object.values(d.users).find(u => u.id === uid); if (!me || me.role !== "admin" || me.status !== "active") throw {code: "42501", message: "row-level security"}; }

/* denetim kayıtlarının demo karşılığı (sunucuda schema.sql · 9: audit_log tablosu ve tetikleyiciler) */
const demoEmail = (d, uid) => (Object.entries(d.users).find(([, u]) => u.id === uid) || [null])[0];
function demoAudit(d, uid, action, kind, target, label, detail) {
  d.audit = d.audit || []; d.auditSeq = (d.auditSeq || 0) + 1;
  d.audit.push({id: d.auditSeq, at: new Date().toISOString(), user_id: uid, email: demoEmail(d, uid), action, kind, target_id: target || null, label: label || null, detail: detail || {}});
  if (d.audit.length > 5000) d.audit.splice(0, d.audit.length - 5000);
}
function demoDocAudit(d, uid, kind, id, o, n) {
  const x = n || o || {};
  if (kind === "quote") {
    if (!o) return demoAudit(d, uid, "quote_create", "quote", id, x.no, {buyer: x.buyer, total: x.total, currency: x.currency, brand: x.brand, lang: x.lang});
    if (!n) return demoAudit(d, uid, "quote_delete", "quote", id, x.no, {buyer: x.buyer, total: x.total, currency: x.currency, stage: x.stage});
    const strip = v => { const c = Object.assign({}, v); ["stage", "stageAt", "stageLog", "updatedAt"].forEach(k => delete c[k]); return JSON.stringify(c); };
    if ((o.stage || "prepared") !== (n.stage || "prepared")) demoAudit(d, uid, "quote_stage", "quote", id, x.no, {from: o.stage || "prepared", to: n.stage, buyer: x.buyer});
    if (strip(o) !== strip(n)) demoAudit(d, uid, "quote_update", "quote", id, x.no, {buyer: x.buyer, total: n.total, prevTotal: o.total, currency: x.currency});
  } else if (kind === "customer") {
    const same = o && n && JSON.stringify(Object.assign({}, o, {updatedAt: 0})) === JSON.stringify(Object.assign({}, n, {updatedAt: 0}));
    if (!same) demoAudit(d, uid, "customer_" + (!o ? "create" : !n ? "delete" : "update"), "customer", id, x.name || id, {code: x.code});
  }
}
function demoSharedAudit(d, uid, kind, id, o, n) {
  if (o && n && JSON.stringify(o) === JSON.stringify(n)) return;
  const x = n || o || {};
  demoAudit(d, uid, kind + "_" + (!o ? "create" : !n ? "delete" : "update"), kind, id, kind === "product" ? [x.code, x.name].filter(Boolean).join(" ") : (x.name || x.company || id), {});
}
