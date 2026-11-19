/* app.js — NDL Proforma arayüzü: giriş, menü, sayfalar ve olaylar */
"use strict";

const $ = id => document.getElementById(id);
const root = $("root");
let Store = null;
const RECOVERY = /type=recovery/.test(location.hash + location.search);
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };
const opt = (v, cur, label) => `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(label ?? v)}</option>`;
const dlist = (id, vals) => `<datalist id="${id}">${vals.map(v => `<option value="${esc(v)}"></option>`).join("")}</datalist>`;
const I = p => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICON = {
  doc: I('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/>'),
  stack: I('<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4"/>'),
  users: I('<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><path d="M15.5 5.2a3 3 0 0 1 0 5.6M18 14.8c1.6.6 2.7 2.2 3 4.7"/>'),
  cube: I('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>'),
  firm: I('<path d="M4 21V5l8-2v18M12 9h8v12M3 21h18M7.5 8h1M7.5 12h1M7.5 16h1M15.5 13h1M15.5 17h1"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'), minus: I('<path d="M5 12h14"/>'), x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  up: I('<path d="M12 19V5M6 11l6-6 6 6"/>'), down: I('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'), alert: I('<path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  right: I('<path d="M5 12h14M13 6l6 6-6 6"/>'), left: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  eye: I('<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
  eyeOff: I('<path d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3.2 3.9M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/><path d="M9.9 9.9a2.8 2.8 0 0 0 4 4"/>'),
  sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  moon: I('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  out: I('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>'),
  cal: I('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  coins: I('<ellipse cx="10" cy="7" rx="6" ry="2.6"/><path d="M4 7v4c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V7"/><path d="M8 15.8c.6.1 1.3.2 2 .2 3.3 0 6-1.2 6-2.6M14 17.4c.9 1.2 3 1.9 5 1.6"/><path d="M20 12.5v5"/>'),
  file: I('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'),
  grid: I('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/>'),
  list: I('<path d="M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>'),
  lock: I('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
  shield: I('<path d="M12 3l7.5 3v6c0 4.5-3.2 7.7-7.5 9-4.3-1.3-7.5-4.5-7.5-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>')
};
const kv = (k, v, cls = "") => `<div class="kv"><span>${esc(k)}</span><b class="${cls}">${v}</b></div>`;
const noteLabel = v => (NOTES.find(n => n.v === v) || {l: v}).l;
function toast(msg, undo) {
  const t = $("toast"); t.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button data-act="undo">Geri al</button>` : ""}`;
  t.hidden = false; S.undo = undo || null; clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; S.undo = null; }, undo ? 6000 : 3000);
}
/* Şifre kuralları Supabase ayarıyla aynı: en az 10 karakter, küçük harf, büyük harf ve rakam. */
const PW_RULES = [["len", "En az 10 karakter", p => p.length >= 10], ["lower", "Küçük harf (a-z)", p => /[a-z]/.test(p)], ["upper", "Büyük harf (A-Z)", p => /[A-Z]/.test(p)], ["digit", "Rakam (0-9)", p => /[0-9]/.test(p)]];
const pwMissing = p => PW_RULES.filter(r => !r[2](p)).map(r => r[1].charAt(0).toLocaleLowerCase("tr") + r[1].slice(1));
/* Have I Been Pwned "range" sorgusu: şifrenin kendisi ya da tam özeti gönderilmez, yalnızca SHA-1 özetinin ilk 5 karakteri. */
async function pwnedCount(pw) {
  try {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(pw));
    const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch("https://api.pwnedpasswords.com/range/" + hex.slice(0, 5), {headers: {"Add-Padding": "true"}, signal: ctl.signal, referrerPolicy: "no-referrer"});
    clearTimeout(t); if (!r.ok) return -1;
    const line = (await r.text()).split("\n").find(l => l.slice(0, 35) === hex.slice(5));
    return line ? (parseInt(line.split(":")[1], 10) || 1) : 0;
  } catch (e) { return -1; }   /* servis yanıt vermezse kayıt engellenmez; sunucu kuralları yine geçerlidir */
}
function pwChecklist(id) { return `<ul class="pwreq" data-for="${id}">${PW_RULES.map(r => `<li data-r="${r[0]}">${ICON.check}${r[1]}</li>`).join("")}<li class="leak">${ICON.shield}Sızıntı listelerinde olmamalı</li></ul>`; }
function busy(btn, on) { if (!btn || !btn.isConnected) return; btn.disabled = on; btn.classList.toggle("busy", on); }

/* ---------- tema ---------- */
function applyTheme() { const t = lsGet("ndl-theme"); if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; };

/* ---------- logolar (PDF ve Excel için data: URL) ---------- */
async function loadLogos() {
  const toData = async src => { const b = await (await fetch(src)).blob(); return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); };
  try { LOGO_D = await toData("duelsan.jpg"); LOGO_N = await toData("ndl.jpg"); } catch (e) {}
}

/* ---------- açılış ve oturum ---------- */
function framed() { try { return window.top !== window.self; } catch (e) { return true; } }
async function boot() {
  if (framed()) { root.innerHTML = `<div class="auth-main" style="min-height:100%"><div class="auth-card"><h1>Bu sayfa başka bir sitenin içinde açılamaz</h1><p class="lead">Güvenliğiniz için NDL Proforma'yı doğrudan kendi adresinden açın.</p><a class="btn blue" href="${esc(location.href)}" target="_top" rel="noopener">Doğrudan aç</a></div></div>`; return; }
  applyTheme(); renderLoading(); loadLogos();
  if (HAS_SERVER) {
    if (!window.supabase) { renderFatal("Giriş servisi yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin."); return; }
    Store = supabaseStore();
  } else if (lsGet(DEMO_FLAG) === "1") Store = localStore();
  if (!Store) { renderAuth(); return; }
  Store.onChange(onAuth);
  let u = null; try { u = await Store.session(); } catch (e) {}
  if (RECOVERY && u) { S.auth = "recovery"; renderAuth(); return; }
  if (u) await enter(u); else renderAuth();
}
function onAuth(ev, u) {
  if (ev === "PASSWORD_RECOVERY") { S.auth = "recovery"; S.user = null; renderAuth(); return; }
  if (ev === "SIGNED_OUT") { if (S.user) leave(); return; }
  if (u && (!S.user || S.user.id !== u.id) && S.auth !== "recovery" && !S.entering) enter(u);
}
async function enter(u) {
  S.entering = true; S.user = u; Store.uid = u.id; renderLoading("Verileriniz yükleniyor…");
  try {
    ingest(await Store.loadAll());
    if (!S.products.length && !S.settings.seeded) await seedCatalog();
  } catch (e) {
    S.entering = false;
    if (isMissingTable(e)) renderSetupNeeded(); else renderFatal("Verileriniz yüklenemedi: " + authError(e), true);
    return;
  }
  S.entering = false;
  let d = loadDraft();
  if (d && !d.q.saved && !d.q.buyer.trim() && !d.q.items.length) d = null;   /* boş taslak saklanmaz; yeni, boş proformayla başlanır */
  if (d) { S.q = d.q; S.step = d.step; S.cfg = d.cfg; if (S.cfg.edit != null && !S.q.items[S.cfg.edit]) S.cfg.edit = null; }
  else { S.q = newQuote(); S.step = 1; S.cfg = newCfg(); }
  if (/access_token|error_description|type=/.test(location.hash)) history.replaceState(null, "", location.pathname + "#proforma");
  renderShell(); fromHash();
}
function leave() {
  Object.assign(S, {user: null, products: [], settings: {}, quotes: [], customers: [], q: null, cfg: null, firm: null, menu: null, auth: "login"});
  S.lib.edit = null; S.openRows.clear(); S.openQ.clear(); renderAuth();
}
function ingest(rows) {
  S.quotes = []; S.customers = []; S.products = []; S.settings = {};
  rows.forEach(r => {
    const d = Object.assign({}, r.data, {id: r.id});
    if (r.kind === "quote") S.quotes.push(d);
    else if (r.kind === "customer") S.customers.push(d);
    else if (r.kind === "product") S.products.push(d);
    else if (r.kind === "settings" && r.id === "main") S.settings = r.data || {};
  });
  S.quotes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  S.products.sort((a, b) => (a.order || 0) - (b.order || 0));
}
async function seedCatalog() {
  const rows = CATALOG.map(({id, ...d}) => ({kind: "product", id, data: d}));
  const st = Object.assign({}, S.settings, {seeded: true});
  await Store.putMany([...rows, {kind: "settings", id: "main", data: st}]);
  S.products = CATALOG.map(p => ({...p})); S.settings = st;
}
const draftKey = () => "ndl-draft:" + (S.user ? S.user.id : "");
function loadDraft() {
  try { const s = lsGet(draftKey()); if (s) { const d = JSON.parse(s); return {q: normQuote(d.q || {}), step: d.step || 1, cfg: Object.assign(newCfg(), d.cfg || {})}; } } catch (e) {}
  return null;
}
let draftT = null;
function saveDraft() { clearTimeout(draftT); draftT = setTimeout(() => { if (S.user) lsSet(draftKey(), JSON.stringify({q: S.q, step: S.step, cfg: S.cfg})); }, 250); }
function touch() { S.q.sample = false; if (S.q.saved) S.q.dirty = true; saveDraft(); updateCart(); }
const upsertLocal = (arr, d) => { const i = arr.findIndex(x => x.id === d.id); if (i >= 0) arr[i] = d; else arr.unshift(d); };

/* ---------- giriş ekranları ---------- */
function renderLoading(msg) { root.innerHTML = `<div class="loading"><img src="ndl.jpg" alt="NDL" width="64"><p>${esc(msg || "Yükleniyor…")}</p></div>`; }
function renderFatal(msg, withLogout) {
  root.innerHTML = `<div class="auth-main" style="min-height:100%"><div class="auth-card"><div class="eyebrow soft">Bir sorun oluştu</div><h1>Sayfa açılamadı</h1><p class="lead">${esc(msg)}</p>
    <div class="row-between"><button class="btn blue" data-act="reload">Sayfayı yenile</button>${withLogout ? `<button class="link" data-act="logout">Çıkış yap</button>` : ""}</div></div></div>`;
}
function renderSetupNeeded() {
  root.innerHTML = `<div class="auth-main" style="min-height:100%"><div class="auth-card" style="max-width:620px"><div class="eyebrow soft">Kurulum · son adım</div><h1>Veritabanı tablosu henüz yok</h1>
    <p class="lead">Supabase projenizde aşağıdaki SQL'i bir kez çalıştırın: Supabase → <b>SQL Editor</b> → <b>New query</b> → yapıştırın → <b>Run</b>. Ardından “Tekrar dene” deyin.</p>
    <pre class="sql" id="sqlBox">schema.sql yükleniyor…</pre>
    <div class="row-between"><button class="btn" data-act="copy-sql">${ICON.copy} SQL'i kopyala</button><button class="btn blue" data-act="reload">Tekrar dene</button></div>
    <button class="link" data-act="logout">Çıkış yap</button></div></div>`;
  fetch("schema.sql").then(r => r.text()).then(t => { const b = $("sqlBox"); if (b) b.textContent = t; }).catch(() => {});
}
function renderAuth() {
  const m = S.auth || "login", demo = Store && Store.mode === "demo", noServer = !HAS_SERVER && !demo;
  root.innerHTML = `<div class="auth">
   <section class="auth-art" aria-hidden="true">
     <div class="auth-brand"><img src="ndl.jpg" alt=""><span>NDL PROFORMA</span></div>
     <div class="auth-copy"><h2>Proformalarınız tek yerde.</h2>
       <p>Lift kütüphanesinden ürünü yapılandırın, proformayı önizleyin, PDF veya Excel olarak alın. Kayıtlarınız yalnızca size görünür.</p>
       <ul class="feats"><li><span>${ICON.cube}</span>Kapasite, kapak, boyut ve powerpack seçimi</li><li><span>${ICON.file}</span>PDF ve Excel çıktı, tek tıkla</li><li><span>${ICON.shield}</span>Her hesabın verisi ayrı tutulur</li></ul></div>
     <div class="mock"><div class="mh"><b>${esc(TEMPLATE_BUYER)}</b><span>Örnek şablon · hayali</span></div>
       <div class="ml"><i>NDL 5010</i><em>Van lift · 750 kg · 12 V</em><b>2 ×</b></div>
       <div class="ml"><i>NDL 5050</i><em>Column lift · Çelik 2080×1100</em><b>1 ×</b></div>
       <div class="ml"><i>NDL 5030</i><em>Pick-up lift · Alüminyum 1160×980</em><b>3 ×</b></div>
       <div class="mt"><span>Toplam</span><span>3 kalem</span></div></div>
   </section>
   <section class="auth-main"><div class="auth-card">
     ${noServer ? `<div class="auth-notice"><b>Sunucu bağlantısı henüz ayarlanmadı</b><p style="margin:0">Gerçek hesaplar için Supabase bilgilerinin <span class="mono">config.js</span> dosyasına yazılması gerekiyor (README'deki adımlar). Bu arada arayüzü demo modunda deneyebilirsiniz; demo hesapları ve verileri yalnızca bu tarayıcıda kalır.</p><div><button class="btn blue sm" data-act="demo-on">Demo modunda dene</button></div></div>` : ""}
     ${noServer ? "" : authBody(m)}
     ${demo ? `<p class="auth-small">Demo modu: hesaplar ve veriler yalnızca bu tarayıcıda tutulur. <button class="link" data-act="demo-off">Demodan çık</button></p>` : ""}
   </div></section></div>`;
  const f = root.querySelector(".auth-form input"); if (f) f.focus();
}
function pwField(id, name, label, ac, extra = "", rules = false) {
  return `<div class="fld"><label for="${id}">${label}</label><div class="pw ico-in">${ICON.lock}<input id="${id}" name="${name}" type="password" autocomplete="${ac}" required minlength="${ac === "new-password" ? 10 : 1}" maxlength="72"${extra}><button type="button" class="ibtn" data-act="pw-toggle" aria-label="Şifreyi göster">${ICON.eye}</button></div>${rules ? pwChecklist(id) : ""}</div>`;
}
const emailField = v => `<div class="fld"><label for="a_email">E-posta</label><div class="ico-in">${ICON.mail}<input id="a_email" name="email" type="email" autocomplete="email" required value="${esc(v || S.authEmail)}" placeholder="ad@firma.com"></div></div>`;
function authBody(m) {
  if (m === "signup") return `<div><div class="eyebrow soft">Yeni hesap</div><h1>Hesap oluşturun</h1></div><p class="lead">E-posta ve şifrenizle bir hesap açın. Proformalarınız, alıcılarınız ve ürün kütüphaneniz bu hesaba özel tutulur.</p>
    <form class="auth-form" data-form="signup" novalidate>${emailField()}${pwField("a_pw", "password", "Şifre", "new-password", "", true)}${pwField("a_pw2", "password2", "Şifre (tekrar)", "new-password")}
    <div class="form-err" role="alert"></div><button class="btn blue wide" type="submit">Hesap oluştur</button></form>
    <p class="auth-alt">Hesabınız var mı? <button class="link" data-act="auth" data-m="login">Giriş yapın</button></p>`;
  if (m === "reset") return `<div><div class="eyebrow soft">Şifre</div><h1>Şifremi unuttum</h1></div><p class="lead">Hesabınızın e-posta adresini yazın; şifre yenileme bağlantısı gönderelim.</p>
    <form class="auth-form" data-form="reset" novalidate>${emailField()}<div class="form-err" role="alert"></div><button class="btn blue wide" type="submit">Bağlantıyı gönder</button></form>
    <p class="auth-alt"><button class="link" data-act="auth" data-m="login">${ICON.left} Girişe dön</button></p>`;
  if (m === "sent" || m === "confirm") return `<div class="sent"><span class="bubble">${ICON.mail}</span><h1>E-postanızı kontrol edin</h1>
    <p class="lead" style="margin:0">${m === "confirm" ? `<b>${esc(S.authEmail)}</b> adresine bir onay bağlantısı gönderdik. Bağlantıya tıkladığınızda hesabınız açılır ve bu sayfaya dönersiniz.` : `<b>${esc(S.authEmail)}</b> adresine şifre yenileme bağlantısı gönderdik. Bağlantı sizi yeni şifre belirleyeceğiniz sayfaya getirir.`}</p>
    <p class="auth-small">E-posta birkaç dakika içinde gelmezse gereksiz klasörüne bakın.</p><button class="btn wide" data-act="auth" data-m="login">Girişe dön</button></div>`;
  if (m === "recovery") return `<div><div class="eyebrow soft">Şifre</div><h1>Yeni şifre belirleyin</h1></div>
    <form class="auth-form" data-form="recovery" novalidate>${pwField("a_pw", "password", "Yeni şifre", "new-password", "", true)}${pwField("a_pw2", "password2", "Yeni şifre (tekrar)", "new-password")}<div class="form-err" role="alert"></div><button class="btn blue wide" type="submit">Şifreyi kaydet</button></form>`;
  return `<div><div class="eyebrow soft">Hoş geldiniz</div><h1>Giriş yapın</h1></div><p class="lead">Proformalarınıza erişmek için e-posta ve şifrenizle giriş yapın.</p>
    <form class="auth-form" data-form="login" novalidate>${emailField()}${pwField("a_pw", "password", "Şifre", "current-password")}
    <div class="row-between"><span></span><button type="button" class="link" data-act="auth" data-m="reset">Şifremi unuttum</button></div>
    <div class="form-err" role="alert"></div><button class="btn blue wide" type="submit">Giriş yap</button></form>
    <p class="auth-alt">Hesabınız yok mu? <button class="link" data-act="auth" data-m="signup">Hesap oluşturun</button></p>`;
}

/* ---------- uygulama çerçevesi ---------- */
const NAV = [["proforma", "Proforma", "doc"], ["proformalar", "Kayıtlar", "stack"], ["alicilar", "Alıcılar", "users"], ["urunler", "Ürünler", "cube"], ["firma", "Firma", "firm"]];
function renderShell() {
  root.innerHTML = `<div class="app"><header class="top" id="top"></header><nav class="side" id="side" aria-label="Menü"></nav><main class="main" id="main"></main></div>`;
  renderTop(); renderSide();
}
function initials() { const e = (S.user && S.user.email) || "?"; const n = e.split("@")[0].split(/[._-]+/).filter(Boolean); return ((n[0] || "?")[0] + ((n[1] || "")[0] || "")).toUpperCase(); }
function renderTop() {
  const t = $("top"); if (!t) return;
  t.innerHTML = `<a class="brand" href="#proforma"><img src="ndl.jpg" alt="NDL"><span>NDL PROFORMA</span></a>
   <label class="gsearch">${ICON.search}<input id="gSearch" type="search" placeholder="Proforma no, firma veya ülke ara" value="${esc(S.qSearch)}" autocomplete="off" aria-label="Proformalarda ara"></label>
   <div class="top-r">
     <a class="cart" href="#proforma" title="Açık proforma"><span class="ic">${ICON.doc}<i id="cartCount">${S.q.items.length}</i></span><span>Toplam: <b id="cartTotal">${money(qTotal(S.q), S.q.currency)}</b></span></a>
     <button class="round" data-act="theme" title="${isDark() ? "Açık tema" : "Koyu tema"}" aria-label="Temayı değiştir">${isDark() ? ICON.sun : ICON.moon}</button>
     <div class="umenu"><button class="avatar" data-act="umenu" aria-expanded="${S.menu === "user"}" aria-label="Hesap menüsü">${esc(initials())}</button>
       ${S.menu === "user" ? `<div class="pop" role="menu"><div class="who"><b>${esc(S.user.email)}</b><span>${Store.mode === "demo" ? "Demo hesabı · bu tarayıcıda" : "Kayıtlarınız yalnızca bu hesapta"}</span></div>
         <a href="#firma" role="menuitem">${ICON.firm} Firma ve hesap</a><a href="#proformalar" role="menuitem">${ICON.stack} Proformalarım</a>
         <button class="danger" data-act="logout" role="menuitem">${ICON.out} Çıkış yap</button></div>` : ""}</div>
   </div>`;
}
function renderSide() {
  const s = $("side"); if (!s) return;
  s.innerHTML = NAV.map(([v, l, ic]) => `<a href="#${v}"${S.view === v ? ' aria-current="page"' : ""}>${ICON[ic]}<span>${l}</span></a>`).join("")
    + `<span class="grow"></span>${Store.mode === "demo" ? `<span class="mode">Demo</span>` : ""}`;
}
function updateCart() { const c = $("cartCount"), t = $("cartTotal"); if (c) c.textContent = S.q.items.length; if (t) t.textContent = money(qTotal(S.q), S.q.currency); }
function keepFocus(el, fn) {
  const a = document.activeElement, id = a && el.contains(a) ? a.id : null; let s0 = null, s1 = null;
  try { s0 = a.selectionStart; s1 = a.selectionEnd; } catch (e) {}
  const top = el.scrollTop; fn(); el.scrollTop = top;
  if (id) { const n = $(id); if (n) { n.focus({preventScroll: true}); try { if (s0 != null) n.setSelectionRange(s0, s1); } catch (e) {} } }
}
function renderMain() {
  const m = $("main"); if (!m) return;
  keepFocus(m, () => { m.innerHTML = S.view === "proformalar" ? pageQuotes() : S.view === "alicilar" ? pageBuyers() : S.view === "urunler" ? pageLib() : S.view === "firma" ? pageFirm() : pageProforma(); });
  paperRO.disconnect(); const p = $("paper"); if (p) paperRO.observe(p); fitPaper();
  if (S.flash != null) { const f = S.flash; setTimeout(() => { if (S.flash === f) S.flash = null; }, 1700); }
}

/* ---------- PROFORMA sayfası ---------- */
function statusTag(q) {
  if (q.sample) return `<span class="tag solid-amber">Örnek</span>`;
  if (q.saved && !q.dirty) return `<span class="tag green">Kayıtlı</span>`;
  if (q.saved) return `<span class="tag amber">Değişiklik var</span>`;
  return `<span class="tag grey">Taslak</span>`;
}
function pageProforma() {
  const n = S.step;
  return `<div class="page"><div class="split"><aside class="intro" id="intro">${introHtml()}</aside>
    <section class="card" id="formCard">${sampleBanner()}${n === 1 ? formBuyer() : n === 2 ? formProducts() : formReview()}</section></div>
    ${n === 3 ? previewCard() : itemsCard()}</div>`;
}
function introHtml() {
  const q = S.q, st = settings();
  const steps = [[1, "Alıcı Bilgileri", q.buyer.trim() || "Girilmedi"], [2, "Ürün Ekle", q.items.length ? q.items.length + " kalem" : "Kalem yok"], [3, "Önizle ve Oluştur", q.saved ? (q.dirty ? "Kaydedilmemiş değişiklik" : "Kaydedildi") : "Taslak"]];
  const done = k => ({1: !!q.buyer.trim(), 2: q.items.length > 0, 3: q.saved && !q.dirty})[k];
  return `<div class="eyebrow">${esc(q.buyer.trim() || "Alıcı seçilmedi")}</div><h1>${q.saved ? "Proforma Düzenle" : "Proforma Oluştur"}</h1>
   <p class="lead">Alıcıyı girin, lifti yapılandırıp proformaya ekleyin, önizleyip oluşturun.</p><hr>
   <dl class="meta"><div><dt>Proforma no</dt><dd class="num">${esc(q.no || "—")}</dd></div><div><dt>Tarih</dt><dd>${fmtDate(q.date)}</dd></div><div><dt>Durum</dt><dd>${statusTag(q)}</dd></div>
     <div><dt>Toplam (${q.currency})</dt><dd class="amount">${money(qTotal(q), q.currency)}</dd></div></dl>
   <ol class="steps">${steps.map(([k, t, s]) => `<li><button class="${S.step === k ? "cur" : done(k) ? "done" : ""}" data-act="step" data-n="${k}"${S.step === k ? ' aria-current="step"' : ""}><span class="n">${done(k) && S.step !== k ? ICON.check : k}</span><span style="min-width:0"><span class="t">${t}</span><span class="s">${esc(s)}</span></span></button></li>`).join("")}</ol>
   ${!st.company ? `<div class="note-card"><b>Firma bilgileriniz eksik</b>Proformanın üst ve alt kısmındaki firma ve banka bilgilerini bir kez girmeniz yeterli.<a class="link" href="#firma">Firma bilgilerini gir ${ICON.right}</a></div>` : ""}`;
}
function refreshIntro() { const el = $("intro"); if (el) el.innerHTML = introHtml(); }
function fld(id, k, label, tag, cls, attrs = "") { return `<div class="fld ${cls}"><label for="${id}">${label}${tag ? ` <em>${tag}</em>` : ""}</label><input id="${id}" data-q="${k}" value="${esc(S.q[k])}"${attrs}></div>`; }
function buyersList() {
  const m = new Map();
  S.customers.forEach(c => { if (c.name) m.set(slug(c.name), Object.assign({key: slug(c.name), stored: true}, c)); });
  S.quotes.forEach(x => { const k = slug(x.buyer); if (x.buyer && !m.has(k)) m.set(k, {key: k, name: x.buyer, address: x.address || "", country: x.country || "", contact: x.contact || "", phone: x.phone || "", email: x.email || "", taxId: x.taxId || ""}); });
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
}
const isBlank = q => !q.saved && !q.sample && !q.buyer.trim() && !q.items.length;
function sampleBanner() {
  if (!S.q.sample) return "";
  return `<div class="banner amber"><span class="dc">${ICON.alert}</span><div class="tx"><b>Örnek şablon</b>Firma ve ürün bilgileri hayalidir, fiyatlar yer tutucudur. Kendi alıcınızı ve ürünlerinizi girerek kullanın.</div><button class="btn sm" data-act="tpl-clear">${ICON.x} Şablonu kapat</button></div>`;
}
function templateCard() {
  return `<div class="tpl"><div><b>Örnek şablonla görmek ister misiniz?</b><span>Hayali bir firma ve üç ürünle doldurulmuş bir proforma açılır. Gerçek bir müşteri ya da teklif içermez.</span></div><button class="btn" data-act="tpl-open">${ICON.eye} Örnek şablonu aç</button></div>`;
}
function formBuyer() {
  const q = S.q, list = buyersList(), cur = slug(q.buyer);
  return `${isBlank(q) ? templateCard() : ""}<div class="card-h"><h2 class="ttl">Alıcı Bilgileri</h2>
    ${list.length ? `<div class="acts" style="flex:0 1 320px"><div class="ico-in" style="width:100%">${ICON.users}<select id="buyerPick" data-pick="buyer" aria-label="Kayıtlı alıcı seç"><option value="">Kayıtlı alıcıdan seçin (${list.length})</option>${list.map(b => opt(b.key, list.some(x => x.key === cur) ? cur : "", b.name + (b.country ? " · " + b.country : ""))).join("")}</select></div></div>` : ""}</div>
   <div class="fgrid">
    ${fld("b_name", "buyer", "Firma adı", "proformada", "s2", ' placeholder="Alıcı firmanın unvanı" autocomplete="organization"')}
    ${fld("b_country", "country", "Ülke", "proformada", "", ' placeholder="Örn. TÜRKİYE"')}
    ${fld("b_tax", "taxId", "Vergi no", "", "")}
    <div class="fld s4"><label for="b_addr">Adres <em>proformada</em></label><textarea id="b_addr" data-q="address" rows="2" placeholder="Cadde, şehir, posta kodu">${esc(q.address)}</textarea></div>
    ${fld("b_contact", "contact", "Yetkili kişi", "yalnızca kayıtta", "s2", ' autocomplete="name"')}
    ${fld("b_phone", "phone", "Telefon", "", "", ' inputmode="tel" autocomplete="tel"')}
    ${fld("b_email", "email", "E-posta", "", "", ' type="email" autocomplete="email"')}
   </div>
   <div class="card-f"><div class="grow muted small">${list.length ? "" : "İlk proformayı oluşturduğunuzda alıcı kaydedilir; sonraki proformalarda listeden seçersiniz."}</div>
     <div class="btns"><button class="btn blue" data-act="step" data-n="2">Devam: Ürün Ekle ${ICON.right}</button></div></div>`;
}
function moneyIn(id, attr, val, need, ph = "0,00") { return `<div class="ico-in money">${ICON.coins}<input id="${id}" type="number" min="0" step="0.01" inputmode="decimal" ${attr} value="${esc(val)}" placeholder="${ph}"${need ? ' class="need"' : ""}><span class="sfx">${CUR[S.q.currency]}</span></div>`; }
function qtyHtml() { return `<div class="qty"><button data-act="qty" data-d="-1" aria-label="Azalt">−</button><input id="cqty" type="number" min="1" step="1" inputmode="numeric" data-c="qty" value="${esc(S.cfg.qty)}" aria-label="Adet"><button data-act="qty" data-d="1" aria-label="Artır">+</button></div>`; }
function formProducts() {
  const c = S.cfg, ed = c.edit != null && S.q.items[c.edit];
  return `<div class="tabs" role="tablist"><button role="tab" data-act="mode" data-v="lift" aria-selected="${c.mode === "lift"}">Lift</button><button role="tab" data-act="mode" data-v="spare" aria-selected="${c.mode === "spare"}">Yedek Parça</button></div>
    ${ed ? `<div class="edit-note"><span>${c.edit + 1}. kalemi düzenliyorsunuz · ${esc(itemInfo(ed).code)}</span><button class="link" data-act="cfg-cancel">Vazgeç</button></div>` : ""}
    ${c.mode === "lift" ? cfgLift() : cfgSpare()}
    <div class="card-f" id="cfgFoot">${cfgFootHtml()}</div>`;
}
function cfgLift() {
  const c = S.cfg, p = pById(c.pid), miss = S.cfgTried ? cfgMissing(c) : [], nd = k => miss.includes(k) ? "need" : "";
  const lifts = products().filter(x => x.type === "LIFT"), fam = {};
  lifts.forEach(x => { (fam[x.name] = fam[x.name] || []).push(x); });
  const caps = p ? (p.caps || []).map(String) : []; if (c.cap && !caps.includes(String(c.cap))) caps.push(String(c.cap));
  const cat = p ? liftSizes(p) : [], std = CATALOG_SIZES.filter(s => !cat.includes(s)), sv = c.sizeMode === "custom" ? "custom" : c.size;
  if (c.sizeMode === "std" && c.size && !cat.includes(c.size) && !std.includes(c.size)) std.push(c.size);
  const dis = p ? "" : " disabled", sz = s => s.replace("x", " × ") + " mm";
  return `<div class="cfg"><div class="fgrid">
    <div class="fld s2"><label for="c_pid">Lift modeli</label><select id="c_pid" data-c="pid" class="${nd("model")}"><option value="">Kütüphaneden model seçin (${lifts.length})</option>${Object.entries(fam).map(([n, ps]) => `<optgroup label="${esc(n)}">${ps.map(x => opt(x.id, c.pid, x.code + "   ·   " + capRange(x))).join("")}</optgroup>`).join("")}</select></div>
    <div class="fld"><label for="c_cap">Kapasite</label><select id="c_cap" data-c="cap" class="${nd("kapasite")}"${dis}><option value="">${p && !caps.length ? "Tanımlı değil" : "Seçin"}</option>${caps.map(v => opt(v, c.cap, fmtInt(v) + " kg")).join("")}</select></div>
    <div class="fld"><label for="cqty">Adet</label>${qtyHtml()}</div>
    <div class="fld s2"><span class="lbl">Kapak türü</span><div class="seg ${nd("kapak türü")}" role="group" aria-label="Kapak türü">${MATS.map(m => `<button data-act="mat" data-v="${m.v}" aria-pressed="${c.mat === m.v}"${dis}>${swatch(m.v)}${m.l}</button>`).join("")}</div></div>
    <div class="fld s2"><span class="lbl">Powerpack voltajı</span><div class="seg ${nd("powerpack")}" role="group" aria-label="Powerpack voltajı">${VOLTS.map(v => `<button data-act="volt" data-v="${v.v}" aria-pressed="${c.volt === v.v}"${dis}>${v.l}</button>`).join("")}</div></div>
    <div class="fld s2"><label for="c_size">Platform boyutu</label><select id="c_size" data-c="sizeSel" class="${nd("boyut")}"${dis}><option value="">Boyut seçin</option>${cat.length ? `<optgroup label="Katalog ölçüleri · ${esc(p.code)}">${cat.map(s => opt(s, sv, sz(s))).join("")}</optgroup>` : ""}<optgroup label="Diğer katalog ölçüleri">${std.map(s => opt(s, sv, sz(s))).join("")}</optgroup><option value="custom"${sv === "custom" ? " selected" : ""}>Özel boyut gir…</option></select></div>
    ${c.sizeMode === "custom" ? `<div class="fld"><label for="cw">Genişlik (mm)</label><input id="cw" type="number" inputmode="numeric" min="300" max="5000" step="10" data-c="w" value="${esc(c.w)}" placeholder="2400"${S.cfgTried && !cfgSize(c) ? ' class="need"' : ""}></div>
      <div class="fld"><label for="cd">Uzunluk (mm)</label><input id="cd" type="number" inputmode="numeric" min="300" max="5000" step="10" data-c="d" value="${esc(c.d)}" placeholder="1800"${S.cfgTried && !cfgSize(c) ? ' class="need"' : ""}></div>` : ""}
    <div class="fld"><label for="cprice">Ana ürün birim fiyatı</label>${moneyIn("cprice", 'data-c="price"', c.price, S.cfgTried && !hasPrice(c.price))}</div>
    <div class="fld"><label for="c_note">Satır notu</label><select id="c_note" data-c="note">${NOTES.map(x => opt(x.v, c.note, x.l)).join("")}</select></div>
   </div>
   <div class="plate-wrap">${p ? `<div class="model-card"><b>${esc(p.code)}</b><span>${esc(p.name)}</span><small>${capRange(p)}${cat.length ? " · katalog: " + cat.map(s => s.replace("x", "×")).join(", ") : ""}</small></div>` : ""}
     <figure class="plate" id="plate">${plateSvg(cfgSize(c), c.mat)}</figure></div></div>
   <div class="optbox"><div class="lbl">Opsiyonlar <em>${c.opts.length ? c.opts.length + " seçili · fiyatları birim fiyata eklenir" : "isteğe bağlı · her birinin fiyatı ayrıca girilir"}</em></div>
    <div class="chips">${optionProducts().map(op => { const on = c.opts.some(o => o.oid === op.id); return `<button class="chip" data-act="opt" data-id="${op.id}" aria-pressed="${on}"${dis}>${on ? ICON.check : ICON.plus}${esc(op.name)}</button>`; }).join("")}</div>
    ${c.opts.length ? `<div class="optsel">${c.opts.map((o, i) => `<div class="r"><span>${esc(optName(o))}</span>${moneyIn("opp_" + o.oid, `data-co="${i}" aria-label="${esc(optName(o))} fiyatı"`, o.price, S.cfgTried && !hasPrice(o.price), "Fiyat")}<button class="ibtn danger" data-act="opt" data-id="${o.oid}" title="Kaldır" aria-label="${esc(optName(o))} opsiyonunu kaldır">${ICON.x}</button></div>`).join("")}</div>` : ""}
   </div>`;
}
function cfgSpare() {
  const c = S.cfg, miss = S.cfgTried ? cfgMissing(c) : [], p = pById(c.pid);
  const grp = t => products().filter(x => x.type === t);
  const og = (t, l) => grp(t).length ? `<optgroup label="${l}">${grp(t).map(x => opt(x.id, c.pid, x.code + "   ·   " + x.name)).join("")}</optgroup>` : "";
  return `<div class="fgrid">
    <div class="fld s2"><label for="c_pid">Parça</label><select id="c_pid" data-c="pid" class="${miss.includes("parça") ? "need" : ""}"><option value="">Parça seçin (${grp("SPARE").length + grp("OTHER").length})</option>${og("SPARE", "Yedek parça")}${og("OTHER", "Diğer")}</select></div>
    <div class="fld"><label for="cqty">Adet</label>${qtyHtml()}</div>
    <div class="fld"><label for="cprice">Birim fiyat</label>${moneyIn("cprice", 'data-c="price"', c.price, S.cfgTried && !hasPrice(c.price))}</div>
    <div class="fld s2"><label for="c_note">Satır notu</label><select id="c_note" data-c="note">${NOTES.map(x => opt(x.v, c.note, x.l)).join("")}</select></div>
    ${p ? `<div class="fld s2"><span class="lbl">Seçili parça</span><div class="tags" style="margin:0;min-height:42px;align-items:center"><span class="tag blue">${esc(p.code)}</span><b>${esc(p.name)}</b></div></div>` : ""}
   </div>`;
}
function cfgFootHtml() {
  const c = S.cfg, p = pById(c.pid), cur = S.q.currency;
  if (!p) return `<div class="grow sum">${c.mode === "lift" ? "Kütüphaneden bir lift modeli seçerek başlayın." : "Listeden bir parça seçin."}</div>
    <div class="btns">${S.q.items.length ? `<button class="btn" data-act="step" data-n="3">${ICON.eye} Önizle ve Oluştur</button>` : ""}</div>`;
  const miss = cfgMissing(c), unit = cfgUnit(c), qty = Math.max(0, Number(c.qty) || 0), ot = c.mode === "lift" ? c.opts.reduce((a, o) => a + num(o.price), 0) : 0;
  const calc = c.mode === "lift" && c.opts.length ? `${money(num(c.price), cur)} + ${c.opts.length} opsiyon ${money(ot, cur)} = ${money(unit, cur)} × ${qty}` : `${money(unit, cur)} × ${qty}`;
  return `<div class="grow sum"><span class="calc">${calc}</span><span class="big">${money(unit * qty, cur)}</span>${miss.length ? `<span class="${S.cfgTried ? "miss" : ""}">Eksik: ${miss.join(", ")}</span>` : `<span class="ok">Eklemeye hazır</span>`}</div>
    <div class="btns">${c.edit != null ? `<button class="btn ghost" data-act="cfg-cancel">Vazgeç</button>` : `<button class="btn ghost" data-act="cfg-reset">Temizle</button>`}
    <button class="btn blue" data-act="cfg-add">${c.edit != null ? ICON.check + " Kalemi Güncelle" : ICON.plus + " Proformaya Ekle"}</button></div>`;
}
function refreshCfg() {
  const f = $("cfgFoot"); if (f) f.innerHTML = cfgFootHtml();
  const pl = $("plate"); if (pl) pl.innerHTML = plateSvg(cfgSize(S.cfg), S.cfg.mat);
}
function swatch(m) {
  return m === "STEEL"
    ? `<svg class="sw" viewBox="0 0 22 16" aria-hidden="true"><defs><pattern id="swS" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" style="fill:var(--steel)"/><path d="M0 5L5 0" style="stroke:var(--steel-mark)" stroke-width="1"/></pattern></defs><rect width="22" height="16" rx="3" style="fill:url(#swS)"/></svg>`
    : `<svg class="sw" viewBox="0 0 22 16" aria-hidden="true"><defs><pattern id="swA" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" style="fill:var(--plate)"/><rect x="1" y="1.6" width="3.6" height="1.4" rx=".7" style="fill:var(--plate-mark)" transform="rotate(45 2.8 2.3)"/><rect x="4.6" y="5" width="3.6" height="1.4" rx=".7" style="fill:var(--plate-mark)" transform="rotate(-45 6.4 5.7)"/></pattern></defs><rect width="22" height="16" rx="3" style="fill:url(#swA)"/></svg>`;
}
/* platform ölçekli çizilir: üstte araç arkası, altta platform, ölçü çizgileri mm */
function plateSvg(size, mat) {
  const m = parseSize(size), VW = 380, VH = 176;
  const defs = `<defs><pattern id="plA" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" style="fill:var(--plate)"/><rect x="2" y="2.5" width="5" height="1.7" rx=".85" style="fill:var(--plate-mark)" transform="rotate(45 4.5 3.35)"/><rect x="7.5" y="8" width="5" height="1.7" rx=".85" style="fill:var(--plate-mark)" transform="rotate(-45 10 8.85)"/></pattern><pattern id="plS" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" style="fill:var(--steel)"/><path d="M0 7L7 0" style="stroke:var(--steel-mark)" stroke-width="1"/></pattern></defs>`;
  const cap = `<div class="cap">Platform</div>`;
  if (!m) return cap + `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Boyut seçilmedi">${defs}<rect x="70" y="14" width="240" height="18" class="body" rx="2"/><text x="190" y="26.5" text-anchor="middle" class="bodyt">ARAÇ ARKASI</text><rect x="90" y="40" width="200" height="104" style="fill:none;stroke:var(--line-2)" stroke-dasharray="5 4" rx="2"/><text x="190" y="96" text-anchor="middle" class="dimt">Boyut seçin</text></svg><figcaption><span>Ölçü seçilince ölçekli çizilir</span></figcaption>`;
  const [W, D] = m, aw = 250, ah = 112, k = Math.min(aw / W, ah / D), w = W * k, h = D * k, x = (VW - w) / 2 - 14, y = 40;
  const area = (W * D / 1e6).toLocaleString("tr-TR", {maximumFractionDigits: 2});
  const bx = Math.max(16, x - 18), bw = Math.min(VW - 32, w + 36);
  return cap + `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Platform ${W} x ${D} mm">${defs}
    <rect x="${bx}" y="12" width="${bw}" height="20" class="body" rx="2"/><text x="${bx + bw / 2}" y="25.5" text-anchor="middle" class="bodyt">ARAÇ ARKASI</text>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" style="fill:url(#${mat === "STEEL" ? "plS" : "plA"})" rx="1.5"/><rect x="${x}" y="${y}" width="${w}" height="${h}" class="edge" rx="1.5"/>
    <g class="dim"><path d="M${x} ${y + h + 8}v14M${x + w} ${y + h + 8}v14M${x} ${y + h + 16}H${x + w}"/><path d="M${x + 5} ${y + h + 12}L${x} ${y + h + 16}L${x + 5} ${y + h + 20}M${x + w - 5} ${y + h + 12}L${x + w} ${y + h + 16}L${x + w - 5} ${y + h + 20}"/>
      <path d="M${x + w + 8} ${y}h14M${x + w + 8} ${y + h}h14M${x + w + 16} ${y}V${y + h}"/><path d="M${x + w + 12} ${y + 5}L${x + w + 16} ${y}L${x + w + 20} ${y + 5}M${x + w + 12} ${y + h - 5}L${x + w + 16} ${y + h}L${x + w + 20} ${y + h - 5}"/></g>
    <rect x="${x + w / 2 - 34}" y="${y + h + 9}" width="68" height="14" style="fill:var(--surface-2)"/><text x="${x + w / 2}" y="${y + h + 20}" text-anchor="middle" class="dimt">${W} mm</text>
    <text x="${x + w + 28}" y="${y + h / 2 + 4}" class="dimt">${D} mm</text></svg>
    <figcaption><span>${mat ? matLabel(mat) + " · " : ""}${W} × ${D} mm</span><span>${area} m²</span></figcaption>`;
}
function outBtns(src) { return `<button class="btn amber" data-act="out" data-k="pdf" data-src="${src}">${ICON.file} PDF İndir</button><button class="btn greensoft" data-act="out" data-k="xlsx" data-src="${src}">${ICON.grid} Excel İndir</button>`; }
function itemsCard() {
  const q = S.q, c = q.currency;
  const rows = q.items.map((it, i) => {
    const inf = itemInfo(it), open = S.openRows.has(i);
    const tags = [it.cap && `<span class="tag blue">${fmtInt(it.cap)} kg</span>`, it.mat && `<span class="tag grey">${esc(matLabel(it.mat))}</span>`, it.size && `<span class="tag grey num">${esc(it.size.replace("x", " × "))}</span>`,
      it.volt && `<span class="tag amber">${esc(voltLabel(it.volt))}</span>`, it.opts.length && `<span class="tag green">+${it.opts.length} opsiyon</span>`, it.note && `<span class="tag solid-amber">${esc(noteLabel(it.note))}</span>`].filter(Boolean).join("");
    return `<tr class="row${isPromo(it) ? " promo" : ""}${S.flash === i ? " flash" : ""}"><td class="c muted">${i + 1}</td><td class="code">${esc(inf.code)}</td><td><b>${esc(inf.name)}</b>${tags ? `<div class="tags">${tags}</div>` : ""}</td>
      <td class="r">${esc(it.qty)}</td><td class="r">${missingPrice(it) ? `<span class="tag red">Fiyat eksik</span>` : money(unitPrice(it), c)}</td><td class="r strong">${money(lineTotal(it), c)}</td>
      <td><div class="acts"><button class="btn green sm" data-act="row-open" data-i="${i}" aria-expanded="${open}">${open ? ICON.minus : ICON.plus} Detay</button>
        <button class="ibtn" data-act="li-edit" data-i="${i}" title="Düzenle" aria-label="${i + 1}. kalemi düzenle">${ICON.edit}</button>
        <button class="ibtn" data-act="li-up" data-i="${i}" title="Yukarı" aria-label="Yukarı taşı"${i === 0 ? " disabled" : ""}>${ICON.up}</button>
        <button class="ibtn" data-act="li-down" data-i="${i}" title="Aşağı" aria-label="Aşağı taşı"${i === q.items.length - 1 ? " disabled" : ""}>${ICON.down}</button>
        <button class="ibtn danger" data-act="li-del" data-i="${i}" title="Sil" aria-label="${i + 1}. kalemi sil">${ICON.trash}</button></div></td></tr>
      ${open ? `<tr class="detail"><td colspan="7"><div class="detail-in">${kv("Ana ürün fiyatı", money(basePrice(it), c))}${it.opts.map(o => kv("+ " + optName(o), money(num(o.price), c))).join("")}${kv("Birim fiyat", money(unitPrice(it), c), "blue")}${kv("Adet", esc(it.qty))}${kv("Tutar", money(lineTotal(it), c), "blue")}${it.size ? kv("Platform", esc(sizeLabel(it.size))) : ""}</div></td></tr>` : ""}`;
  }).join("");
  return `<section class="card" id="bottomCard"><div class="card-h"><h2 class="ttl">Proforma Kalemleri</h2><span class="muted small">${q.items.length} kalem</span>
     <div class="acts">${q.items.length ? outBtns("cur") : ""}<button class="btn blue" data-act="step" data-n="3"${q.items.length ? "" : " disabled"}>${ICON.eye} Önizle ve Oluştur</button></div></div>
    ${q.items.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="c">No</th><th>Kod</th><th>Ürün</th><th class="r">Adet</th><th class="r">Birim fiyat</th><th class="r">Tutar</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="total-line" style="margin-top:16px">Toplam (${c}) <b>${money(qTotal(q), c)}</b></div>`
    : `<div class="empty">Henüz kalem yok. Yukarıda bir lift seçip <b>Proformaya Ekle</b> deyin.${isBlank(q) ? `<div><button class="btn" data-act="tpl-open">${ICON.eye} Örnek şablonu aç</button></div>` : ""}</div>`}</section>`;
}
function formReview() {
  const q = S.q, st = settings(), mp = q.items.filter(missingPrice).length, iban = st["iban" + q.currency], ok = q.saved && !q.dirty;
  const chk = (cls, html) => `<span class="check ${cls}">${cls === "ok" ? ICON.check : ICON.alert}<span>${html}</span></span>`;
  let main;
  if (ok) main = outBtns("cur");
  else main = `<button class="btn blue" data-act="create">${ICON.check} ${q.saved ? "Değişiklikleri Kaydet" : "Proformayı Oluştur"}</button>`;
  return `${ok ? `<div class="banner"><span class="dc">${ICON.check}</span><div class="tx"><b>${esc(q.no)} kaydedildi</b>Kayıtlar sayfasında listelenir; tekrar kullanmak için oradan seçebilirsiniz.</div><button class="btn sm" data-act="dup" data-id="cur">${ICON.copy} Tekrarla</button><button class="btn sm" data-act="new">${ICON.plus} Yeni proforma</button></div>` : ""}
   <div class="card-h"><h2 class="ttl">Belge Bilgileri</h2></div>
   <div class="fgrid">
    <div class="fld"><label for="r_title">Belge başlığı</label><select id="r_title" data-q="title">${TITLES.map(t => opt(t, q.title)).join("")}${TITLES.includes(q.title) ? "" : opt(q.title, q.title)}</select></div>
    <div class="fld"><label for="r_no">Proforma no</label><div class="with-btn"><input id="r_no" data-q="no" value="${esc(q.no)}" class="num">${q.saved ? "" : `<button class="btn" data-act="nextno" title="Kayıtlardaki son numaradan devam et">Sıradaki</button>`}</div></div>
    <div class="fld"><label for="r_date">Tarih</label><div class="ico-in">${ICON.cal}<input id="r_date" type="date" data-q="date" value="${esc(q.date)}"></div></div>
    <div class="fld"><label for="r_cur">Para birimi</label><select id="r_cur" data-q="currency">${Object.keys(CUR).map(k => opt(k, q.currency, k + " (" + CUR[k] + ")")).join("")}</select></div>
    <div class="fld s2"><label for="r_pay">Ödeme şekli</label><input id="r_pay" data-q="payment" list="dlPay" value="${esc(q.payment)}"></div>
    <div class="fld"><label for="r_del">Teslim şekli</label><input id="r_del" data-q="delivery" list="dlDel" value="${esc(q.delivery)}"></div>
    <div class="fld"><label for="r_val">Opsiyon süresi</label><input id="r_val" data-q="validity" list="dlVal" value="${esc(q.validity)}"></div>
    <div class="fld s2"><label for="r_dt">Teslim süresi</label><input id="r_dt" data-q="dtime" list="dlDt" value="${esc(q.dtime)}"></div>
    <div class="fld s2"><span class="lbl">&nbsp;</span><span class="hint" style="align-self:center">Şartları listeden seçebilir ya da serbestçe yazabilirsiniz.</span></div>
   </div>
   <div class="checks">${q.buyer.trim() ? chk("ok", "Alıcı: " + esc(q.buyer)) : chk("bad", `Alıcı girilmedi · <button class="link" data-act="step" data-n="1">Ekle</button>`)}
     ${q.items.length ? chk("ok", q.items.length + " kalem") : chk("bad", `Kalem yok · <button class="link" data-act="step" data-n="2">Ekle</button>`)}
     ${mp ? chk("warn", mp + " kalemde fiyat eksik") : ""}
     ${iban ? chk("ok", q.currency + " IBAN tanımlı") : chk("warn", `${q.currency} IBAN tanımlı değil · <a href="#firma">Ekle</a>`)}</div>
   ${dlist("dlPay", PAYMENTS)}${dlist("dlDel", DELIVERY)}${dlist("dlVal", VALIDITY)}${dlist("dlDt", DTIME)}
   <div class="card-f"><button class="btn ghost" data-act="step" data-n="2">${ICON.left} Ürünler</button><div class="grow sum" style="text-align:right">${ok ? "Kayıtlı" : q.saved ? "Kaydedilmemiş değişiklik var" : "Oluşturunca Kayıtlar sayfasına eklenir"}</div><div class="btns">${main}</div></div>`;
}
function previewCard() {
  return `<section class="card" id="bottomCard"><div class="card-h"><h2 class="ttl">Önizleme</h2><span class="muted small">A4 · PDF ve Excel çıktısı bu sayfayla aynıdır</span><div class="acts">${outBtns("cur")}</div></div>
    <div class="sheet"><div class="sheet-in"><div class="paper-frame" id="paperFrame"><div class="paper-scale" id="paperScale"><div class="paper live" id="paper">${paperHtml(S.q, true)}</div></div></div>
    ${S.q.items.length ? `<p class="sheet-hint">Bir satıra tıklayınca o kalem düzenlemeye açılır.</p>` : ""}</div></div></section>`;
}
function refreshPaper() { const p = $("paper"); if (p) { p.innerHTML = paperHtml(S.q, true); fitPaper(); } }
function fitPaper() {
  const fr = $("paperFrame"), sc = $("paperScale"), p = $("paper"); if (!fr) return;
  const w = fr.parentElement.clientWidth, k = Math.min(1, w / 794);
  sc.style.transform = `scale(${k})`; fr.style.width = (794 * k) + "px"; fr.style.height = (p.offsetHeight * k) + "px";
}
const paperRO = new ResizeObserver(() => fitPaper());
window.addEventListener("resize", fitPaper);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPaper);

/* ---------- KAYITLAR sayfası ---------- */
function filteredQuotes() {
  const s = S.qSearch.toLowerCase().trim();
  return S.quotes.filter(x => (!s || [x.no, x.buyer, x.country, x.address, x.title].join(" ").toLowerCase().includes(s))
    && (!S.qCur || x.currency === S.qCur) && (!S.qFrom || String(x.date) >= S.qFrom) && (!S.qTo || String(x.date) <= S.qTo));
}
function pageQuotes() {
  const list = filteredQuotes(), by = {};
  list.forEach(x => { by[x.currency] = (by[x.currency] || 0) + (x.total || 0); });
  const rows = list.map(x => {
    const open = S.openQ.has(x.id), items = x.items || [];
    return `<tr class="row"><td class="num">${fmtDate(x.date)}</td><td class="code num">${esc(x.no)}</td><td><b>${esc(x.buyer || "—")}</b><span class="sub">${esc(x.country || x.address || "")}</span></td>
      <td class="c"><span class="tag blue">${items.length} kalem</span></td><td class="r strong">${money(x.total, x.currency)}</td><td><span class="tag ${x.title === "PROFORMA INVOICE" ? "green" : "grey"}">${esc(x.title === "PROFORMA INVOICE" ? "Proforma" : x.title === "REVISED PROFORMA INVOICE" ? "Revize" : x.title === "QUOTATION" ? "Teklif" : "Fiyat teklifi")}</span></td>
      <td><div class="acts"><button class="btn green sm" data-act="q-open" data-id="${x.id}" aria-expanded="${open}">${open ? ICON.minus : ICON.plus} Detay</button>
        <button class="btn blue sm" data-act="dup" data-id="${x.id}" title="Yeni numarayla kopyasını aç">${ICON.copy} Tekrarla</button>
        <button class="btn sm" data-act="q-edit" data-id="${x.id}">${ICON.edit} Aç</button>
        <button class="ibtn" data-act="out" data-k="pdf" data-src="${x.id}" title="PDF indir" aria-label="PDF indir">${ICON.file}</button>
        <button class="ibtn" data-act="out" data-k="xlsx" data-src="${x.id}" title="Excel indir" aria-label="Excel indir">${ICON.grid}</button>
        <button class="ibtn danger" data-act="q-del" data-id="${x.id}" title="Sil" aria-label="Proformayı sil">${ICON.trash}</button></div></td></tr>
      ${open ? `<tr class="detail"><td colspan="7"><div class="detail-in">${items.map(it => kv(itemInfo(it).code + " · " + itemInfo(it).name, `${esc(it.qty)} × ${money(unitPrice(it), x.currency)} = ${money(lineTotal(it), x.currency)}`)).join("")}${kv("Ödeme", esc(x.payment))}${kv("Teslim", esc(x.delivery))}</div></td></tr>` : ""}`;
  }).join("");
  return `<div class="page"><div class="head-row"><div><div class="eyebrow soft">Kayıtlar</div><h1>Proformalar</h1><p class="lead">Oluşturduğunuz proformalar yalnızca sizin hesabınızda görünür. Tekrar kullanmak için <b>Tekrarla</b> deyin; yeni numarayla kopyası açılır.</p></div>
     <button class="btn blue" data-act="new">${ICON.plus} Yeni Proforma</button></div>
   <div class="toolbar"><section class="card"><div class="filters">
     <div class="fld s-wide"><label for="f_s">Ara</label><div class="ico-in">${ICON.search}<input id="f_s" data-f="qSearch" value="${esc(S.qSearch)}" placeholder="No, firma veya ülke" autocomplete="off"></div></div>
     <div class="fld"><label for="f_c">Para birimi</label><select id="f_c" data-f="qCur"><option value="">Tümü</option>${Object.keys(CUR).map(k => opt(k, S.qCur, k)).join("")}</select></div>
     <div class="fld"><label for="f_from">Başlangıç</label><input id="f_from" type="date" data-f="qFrom" value="${esc(S.qFrom)}"></div>
     <div class="fld"><label for="f_to">Bitiş</label><input id="f_to" type="date" data-f="qTo" value="${esc(S.qTo)}"></div>
     <button class="btn amber" data-act="f-clear" style="height:42px">${ICON.list} Tümünü Listele</button></div></section>
    <section class="card"><dl class="sumbox"><div><dt>Proforma</dt><dd>${list.length}</dd></div>${Object.keys(CUR).map(k => `<div><dt>Toplam ${k}</dt><dd class="${k === "USD" ? "blue" : k === "EUR" ? "green" : ""}">${money(by[k] || 0, k)}</dd></div>`).join("")}</dl></section></div>
   <section class="card"><div class="card-h"><h2 class="ttl">Proforma Listesi</h2><span class="muted small">${list.length} / ${S.quotes.length}</span></div>
    ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tarih</th><th>No</th><th>Alıcı</th><th class="c">Kalem</th><th class="r">Tutar</th><th>Belge</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
      : `<div class="empty">${S.quotes.length ? "Filtreyle eşleşen proforma yok." : `Henüz kayıtlı proforma yok.<br>Proforma sayfasında <b>Proformayı Oluştur</b> dediğinizde burada listelenir.`}${S.quotes.length ? "" : `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn blue" data-act="go" data-v="proforma">${ICON.plus} Proforma oluştur</button><button class="btn" data-act="tpl-open">${ICON.eye} Örnek şablonu aç</button></div>`}</div>`}</section></div>`;
}

/* ---------- ALICILAR sayfası ---------- */
function pageBuyers() {
  const list = buyersList();
  const stat = k => { const qs = S.quotes.filter(x => slug(x.buyer) === k), by = {}; qs.forEach(x => { by[x.currency] = (by[x.currency] || 0) + (x.total || 0); }); return {n: qs.length, last: qs.map(x => x.date).sort().pop() || "", by}; };
  const rows = list.map(b => { const s = stat(b.key);
    return `<tr class="row"><td><b>${esc(b.name)}</b><span class="sub">${esc(b.address || "")}</span></td><td>${esc(b.country || "—")}</td><td>${esc(b.contact || "—")}</td><td class="num">${esc(b.phone || "—")}</td><td>${esc(b.email || "—")}</td>
      <td class="c"><span class="tag blue">${s.n}</span></td><td class="num">${fmtDate(s.last) || "—"}</td><td class="r strong">${Object.entries(s.by).map(([c, v]) => money(v, c)).join("<br>") || "—"}</td>
      <td><div class="acts"><button class="btn blue sm" data-act="buyer-new" data-k="${esc(b.key)}">${ICON.plus} Proforma</button>${b.stored ? `<button class="ibtn danger" data-act="buyer-del" data-k="${esc(b.key)}" title="Alıcıyı sil" aria-label="Alıcıyı sil">${ICON.trash}</button>` : ""}</div></td></tr>`; }).join("");
  return `<div class="page"><div><div class="eyebrow soft">Cari</div><h1>Alıcılar</h1><p class="lead">Proforma kestiğiniz firmalar. Bir firmaya yeni proforma açtığınızda bilgileri otomatik dolar.</p></div>
   <section class="card"><div class="card-h"><h2 class="ttl">Alıcı Listesi</h2><span class="muted small">${list.length} firma</span></div>
    ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Firma</th><th>Ülke</th><th>Yetkili</th><th>Telefon</th><th>E-posta</th><th class="c">Proforma</th><th>Son</th><th class="r">Toplam</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
      : `<div class="empty">Henüz alıcı yok. İlk proformayı oluşturduğunuzda alıcı burada listelenir.</div>`}</section></div>`;
}

/* ---------- ÜRÜNLER sayfası ---------- */
function pageLib() {
  const L = S.lib, all = products(), s = L.search.toLowerCase().trim();
  const list = all.filter(p => p.type === L.type && (!s || (p.code + " " + p.name).toLowerCase().includes(s)));
  if (!L.edit || (L.edit.id && !all.some(p => p.id === L.edit.id))) { const sel = pById(L.sel) || list[0]; L.edit = sel ? editBuf(sel) : null; }
  const e = L.edit, lift = L.type === "LIFT";
  const rows = list.map(p => `<tr class="row clk${e && e.id === p.id ? " on" : ""}" data-act="lib-sel" data-id="${p.id}"><td class="code">${esc(p.code)}</td><td>${esc(p.name)}</td>${lift ? `<td class="num">${capRange(p)}</td><td class="num muted">${liftSizes(p).map(x => x.replace("x", "×")).join(", ") || "—"}</td>` : ""}</tr>`).join("");
  return `<div class="page"><div class="head-row"><div><div class="eyebrow soft">Kütüphane · ${all.length} ürün</div><h1>Ürünler</h1><p class="lead">Proformada seçilen modeller, kapasiteler, platform ölçüleri, opsiyonlar ve yedek parçalar. Bu liste yalnızca sizin hesabınıza aittir; fiyatlar burada tutulmaz.</p></div>
     <button class="btn blue" data-act="lib-add">${ICON.plus} Yeni Ürün</button></div>
   <div class="lib"><section class="card"><div class="lib-tools"><div class="seg" role="group" aria-label="Ürün türü">${Object.entries(TYPES).map(([k, v]) => `<button data-act="lib-type" data-t="${k}" aria-pressed="${L.type === k}">${v} <span class="muted">${all.filter(p => p.type === k).length}</span></button>`).join("")}</div>
       <div class="ico-in">${ICON.search}<input id="libSearch" data-f="lib.search" value="${esc(L.search)}" placeholder="Kod veya ad ara" autocomplete="off"></div></div>
     ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kod</th><th>Ürün adı</th>${lift ? "<th>Kapasite</th><th>Platform ölçüleri</th>" : ""}</tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty">Bu grupta ürün yok.</div>`}</section>
    <section class="card editor">${e ? libEditor(e) : `<div class="empty">Soldan bir ürün seçin.</div>`}</section></div></div>`;
}
function editBuf(p) { return {id: p.id, code: p.code, name: p.name, type: p.type, order: p.order, caps: (p.caps || []).join(", "), sizes: liftSizes(p).join(", ")}; }
function libEditor(e) {
  const f = (id, k, label, attrs = "") => `<div class="fld s4"><label for="${id}">${label}</label><input id="${id}" data-le="${k}" value="${esc(e[k])}"${attrs}></div>`;
  return `<div class="card-h"><h2 class="ttl">${e.id ? "Ürün Kartı" : "Yeni Ürün"}</h2>${e.id ? `<span class="tag grey">${esc(TYPES[e.type] || e.type)}</span>` : ""}</div>
   ${e.type === "LIFT" && e.code ? `<div class="model-card" style="margin:0 0 18px"><b>${esc(e.code)}</b><span>${esc(e.name)}</span><small>${S.quotes.filter(x => (x.items || []).some(it => it.pid === e.id)).length} proformada kullanıldı</small></div>` : ""}
   <div class="fgrid">
    <div class="fld s2"><label for="le_code">Kod</label><input id="le_code" data-le="code" value="${esc(e.code)}" placeholder="Örn. NDL 5010"></div>
    <div class="fld s2"><label for="le_type">Tür</label><select id="le_type" data-le="type">${Object.entries(TYPES).map(([k, v]) => opt(k, e.type, v)).join("")}</select></div>
    ${f("le_name", "name", "Ürün adı <em>proformada böyle basılır</em>", ' placeholder="CANTILEVER LIFT"')}
    ${e.type === "LIFT" ? f("le_caps", "caps", "Kapasiteler <em>kg, virgülle</em>", ' placeholder="2000, 2500" inputmode="numeric"') + f("le_sizes", "sizes", "Platform ölçüleri <em>mm, virgülle</em>", ' placeholder="2400x1800, 2500x1800"') : ""}
   </div>
   ${e.type === "LIFT" ? `<p class="hint" style="margin:12px 0 0">Ölçüler yapılandırıcıda “Katalog ölçüleri” olarak öne çıkar; standart ölçüler ve özel boyut her zaman seçilebilir.</p>` : ""}
   <div class="card-f">${e.id ? `<button class="btn ghost danger" data-act="lib-del" data-id="${e.id}">${ICON.trash} Sil</button>` : `<button class="btn ghost" data-act="lib-cancel">Vazgeç</button>`}<div class="btns"><button class="btn blue" data-act="lib-save">${ICON.check} Kaydet</button></div></div>`;
}

/* ---------- FİRMA sayfası ---------- */
function pageFirm() {
  if (!S.firm) S.firm = Object.assign({}, settings());
  const F = S.firm, f = (k, label, cls = "", attrs = "") => `<div class="fld ${cls}"><label for="s_${k}">${label}</label><input id="s_${k}" data-fe="${k}" value="${esc(F[k] || "")}"${attrs}></div>`;
  return `<div class="page"><div><div class="eyebrow soft">Ayarlar</div><h1>Firma ve Hesap</h1><p class="lead">Bu bilgiler proformanın üst ve alt kısmında görünür ve yalnızca sizin hesabınızda saklanır. IBAN, proformanın para birimine göre seçilir.</p></div>
   <section class="card"><div class="card-h"><h2 class="ttl">Firma Bilgileri</h2></div><div class="fgrid">
     ${f("company", "Firma unvanı", "s2", ' placeholder="Firma unvanı" autocomplete="organization"')}${f("contact", "Telefon ve e-posta satırı", "s2", ' placeholder="Tel: … Email: …"')}${f("address", "Adres", "s4")}</div>
    <div class="card-h" style="margin-top:26px"><h2 class="ttl">Proforma</h2></div><div class="fgrid">
     ${f("warranty", "Garanti notu <em>kırmızı, ortalı basılır</em>", "s4", ' placeholder="Örn. ürünlerinizin garanti açıklaması"')}${f("origin", "Menşe", "", ' placeholder="Örn. TÜRKİYE"')}${f("hs", "GTİP (HS code)", "", ' inputmode="numeric" placeholder="Ürünlerinizin GTİP kodu"')}${f("prefix", "Numara öneki", "", ' placeholder="PI"')}</div>
    <div class="card-h" style="margin-top:26px"><h2 class="ttl">Banka Bilgileri</h2></div><div class="fgrid">
     ${f("beneficiary", "Lehtar (beneficiary)", "s2")}${f("bank", "Banka")}${f("branch", "Şube")}${f("ibanUSD", "USD IBAN", "s2", ' spellcheck="false"')}${f("ibanEUR", "EUR IBAN", "s2", ' spellcheck="false"')}${f("ibanTRY", "TRY IBAN", "s2", ' spellcheck="false"')}${f("swift", "SWIFT", "", ' spellcheck="false"')}</div>
    <div class="card-f"><div class="grow muted small">Değişiklikler yeni ve açık proformalara yansır.</div><div class="btns"><button class="btn ghost" data-act="firm-reset">Vazgeç</button><button class="btn blue" data-act="firm-save">${ICON.check} Kaydet</button></div></div></section>
   <section class="card"><div class="card-h"><h2 class="ttl">Hesap</h2><span class="tag ${Store.mode === "demo" ? "amber" : "green"}">${Store.mode === "demo" ? "Demo · bu tarayıcıda" : "Güvenli hesap"}</span></div>
    <div class="fgrid"><div class="fld s2"><span class="lbl">E-posta</span><div style="height:42px;display:flex;align-items:center;font-weight:600">${esc(S.user.email)}</div></div></div>
    <form class="fgrid" data-form="pwchange" style="margin-top:16px" novalidate>${pwField("p_new", "password", "Yeni şifre", "new-password", "", true).replace('class="fld"', 'class="fld s2"')}${pwField("p_new2", "password2", "Yeni şifre (tekrar)", "new-password").replace('class="fld"', 'class="fld s2"')}
     <div class="form-err s4" role="alert"></div><div class="s4" style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button class="btn danger" type="button" data-act="logout">${ICON.out} Çıkış yap</button><button class="btn" type="submit">${ICON.lock} Şifreyi değiştir</button></div></form></section></div>`;
}

/* ---------- onay penceresi ---------- */
function ask(o) { S.confirm = o; renderConfirm(); }
function renderConfirm() {
  const c = $("confirm"), x = S.confirm; if (!x) { c.hidden = true; c.innerHTML = ""; return; }
  c.innerHTML = `<div class="confirm" role="alertdialog" aria-modal="true" aria-labelledby="cfT"><h3 id="cfT">${esc(x.title)}</h3><p>${x.msg}</p><div class="row"><button class="btn" data-act="cf-no">Vazgeç</button><button class="btn ${x.danger ? "red" : "blue"}" data-act="cf-yes">${esc(x.yes)}</button></div></div>`;
  c.hidden = false; c.querySelector('[data-act="cf-yes"]').focus();
}
function needsGuard() { const q = S.q; if (!q) return false; return !q.sample && q.items.length > 0 && (!q.saved || q.dirty); }
function guard(what, fn) { if (!needsGuard()) { fn(); return; } ask({title: "Kaydedilmemiş taslak", msg: `Açık proforma (<b>${esc(S.q.no)}</b>) kaydedilmedi. ${what} bu taslak silinir.`, yes: "Devam et", fn}); }

/* ---------- işlemler ---------- */
function go(v) { if (location.hash !== "#" + v) location.hash = v; else { S.view = v; renderSide(); renderMain(); } }
function setStep(n) { S.step = n; saveDraft(); if (S.view !== "proforma") go("proforma"); else renderMain(); const m = $("main"); if (m) m.scrollTop = 0; window.scrollTo(0, 0); }
function startNew(prefill) {
  S.q = newQuote(); if (prefill) Object.assign(S.q, prefill);
  S.cfg = newCfg(); S.cfgTried = false; S.openRows.clear(); S.step = prefill ? 2 : 1; saveDraft(); updateCart(); go("proforma"); renderMain(); toast("Yeni proforma: " + S.q.no);
}
function duplicate(src) {
  const q = normQuote(JSON.parse(JSON.stringify(src)));
  Object.assign(q, {id: rid(), no: nextNo(), autoNo: true, date: today(), status: "draft", saved: false, dirty: false, sample: false});
  delete q.createdAt; delete q.updatedAt; delete q.total;
  if (q.title === "REVISED PROFORMA INVOICE") q.title = "PROFORMA INVOICE";
  return q;
}
function quoteDoc(q) {
  const d = JSON.parse(JSON.stringify(q)); ["saved", "dirty", "sample", "autoNo", "id"].forEach(k => delete d[k]);
  d.items = d.items.map(it => { const p = pById(it.pid); if (p) it.snap = {code: p.code, name: p.name, type: p.type}; it.opts = (it.opts || []).map(o => ({oid: o.oid, name: optName(o), price: o.price})); return it; });
  d.total = qTotal(q); d.updatedAt = Date.now(); d.createdAt = q.createdAt || Date.now(); d.status = "created"; return d;
}
async function createProforma(btn) {
  const q = S.q;
  if (!q.buyer.trim()) { toast("Önce alıcı firmayı girin"); setStep(1); return; }
  if (q.buyer.trim() === TEMPLATE_BUYER) { toast("Örnek şablondaki hayali firmayı kendi alıcınızla değiştirin"); setStep(1); return; }
  if (!q.items.length) { toast("Önce en az bir kalem ekleyin"); setStep(2); return; }
  busy(btn, true);
  try {
    if (!q.saved && S.quotes.some(x => x.no === q.no && x.id !== q.id)) q.no = nextNo();
    const d = quoteDoc(q); await Store.put("quote", q.id, d); upsertLocal(S.quotes, Object.assign({id: q.id}, d));
    const ck = slug(q.buyer), cd = {name: q.buyer.trim(), address: q.address, country: q.country, contact: q.contact, phone: q.phone, email: q.email, taxId: q.taxId, updatedAt: Date.now()};
    upsertLocal(S.customers, Object.assign({id: ck}, cd)); Store.put("customer", ck, cd).catch(() => {});
    Object.assign(q, {createdAt: d.createdAt, saved: true, dirty: false, autoNo: false, status: "created", sample: false});
    saveDraft(); toast(q.no + " kaydedildi"); renderMain(); updateCart();
  } catch (e) { toast("Kaydedilemedi: " + authError(e)); busy(btn, false); }
}
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.integrity = XLSX_SRI; s.crossOrigin = "anonymous"; s.referrerPolicy = "no-referrer"; s.onload = res; s.onerror = () => rej(new Error("Excel modülü yüklenemedi")); document.head.appendChild(s); }); }
function safeName(s) { return String(s || "").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().replace(/[.\s]+$/, ""); }
function saveBlob(blob, name) { const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); }
async function makeFile(kind, src, btn) {
  const raw = src === "cur" ? S.q : S.quotes.find(x => x.id === src); if (!raw || S.busy) return;
  const q = src === "cur" ? raw : normQuote(JSON.parse(JSON.stringify(raw)));
  S.busy = true; busy(btn, true);
  try {
    let blob;
    if (kind === "pdf") {
      if (!window.pdfMake) throw new Error("PDF modülü yüklenemedi; sayfayı yenileyin");
      if (!LOGO_D) await loadLogos();
      blob = await new Promise((res, rej) => { try { pdfMake.createPdf(pdfDoc(q)).getBlob(res); } catch (e) { rej(e); } });
    } else {
      if (!window.ExcelJS) { toast("Excel hazırlanıyor…"); await loadScript(XLSX_SRC); }
      if (!LOGO_D) await loadLogos();
      const wb = await buildXlsx(window.ExcelJS, q);
      blob = new Blob([await wb.xlsx.writeBuffer()], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    }
    saveBlob(blob, safeName([q.no, q.buyer].filter(Boolean).join(" ") || "proforma") + (kind === "pdf" ? ".pdf" : ".xlsx"));
    toast((kind === "pdf" ? "PDF" : "Excel") + " indirildi");
  } catch (e) { toast((kind === "pdf" ? "PDF" : "Excel") + " oluşturulamadı: " + ((e && e.message) || e)); }
  finally { S.busy = false; busy(btn, false); }
}
async function saveProduct(btn) {
  const e = S.lib.edit; if (!e) return;
  if (!String(e.code).trim() || !String(e.name).trim()) { toast("Kod ve ürün adı boş olamaz"); return; }
  const id = e.id || ("p-" + rid()), order = e.order || Math.max(0, ...products().map(p => p.order || 0)) + 1;
  const d = {code: String(e.code).trim(), name: String(e.name).trim(), type: e.type, order,
    caps: String(e.caps || "").split(/[,;\s]+/).map(Number).filter(n => n > 0)};
  if (e.type === "LIFT") d.sizes = String(e.sizes || "").split(/[,;\s]+/).map(s => parseSize(s.replace("×", "x"))).filter(Boolean).map(m => m[0] + "x" + m[1]);
  busy(btn, true);
  try {
    await Store.put("product", id, d);
    if (!S.products.length) S.products = CATALOG.map(p => ({...p}));
    upsertLocal(S.products, Object.assign({id}, d)); S.products.sort((a, b) => (a.order || 0) - (b.order || 0));
    S.lib.sel = id; S.lib.type = d.type; S.lib.edit = null; toast("Ürün kaydedildi"); renderMain();
  } catch (err) { toast("Kaydedilemedi: " + authError(err)); busy(btn, false); }
}
async function saveFirm(btn) {
  busy(btn, true);
  try {
    const st = Object.assign({}, S.settings, S.firm, {seeded: true}); Object.keys(st).forEach(k => { if (typeof st[k] === "string") st[k] = st[k].trim(); });
    await Store.put("settings", "main", st); S.settings = st; S.firm = null; toast("Firma bilgileri kaydedildi"); renderMain();
  } catch (e) { toast("Kaydedilemedi: " + authError(e)); busy(btn, false); }
}

/* ---------- olaylar ---------- */
document.addEventListener("input", e => {
  const t = e.target, d = t.dataset;
  if (t.type === "password" || (t.name === "password" && t.closest("[data-form]"))) {
    const ul = document.querySelector(`.pwreq[data-for="${t.id}"]`);
    if (ul) { PW_RULES.forEach(r => { const li = ul.querySelector(`[data-r="${r[0]}"]`); if (li) li.classList.toggle("ok", r[2](t.value)); }); const lk = ul.querySelector(".leak"); if (lk) lk.classList.remove("bad"); }
  }
  if (t.id === "gSearch") { S.qSearch = t.value; if (S.view !== "proformalar") go("proformalar"); else renderMain(); return; }
  if (d.q) {
    S.q[d.q] = t.value; if (d.q === "no") S.q.autoNo = false; touch();
    if (d.q === "currency") { if (!CUR[S.q.currency]) S.q.currency = "USD"; renderMain(); return; }
    refreshIntro(); refreshPaper(); return;
  }
  if (d.c && t.tagName !== "SELECT") {
    S.cfg[d.c] = t.value;
    if (S.cfgTried && (d.c === "w" || d.c === "d")) { const ok = !!cfgSize(S.cfg); ["cw", "cd"].forEach(id => $(id) && $(id).classList.toggle("need", !ok)); }
    if (d.c === "price") t.classList.toggle("need", S.cfgTried && !hasPrice(t.value));
    saveDraft(); refreshCfg(); return;
  }
  if (d.co != null) { const o = S.cfg.opts[+d.co]; if (o) { o.price = t.value; t.classList.toggle("need", S.cfgTried && !hasPrice(t.value)); } saveDraft(); refreshCfg(); return; }
  if (d.f) { if (d.f === "lib.search") S.lib.search = t.value; else S[d.f] = t.value; if (d.f === "qSearch" && $("gSearch")) $("gSearch").value = t.value; renderMain(); return; }
  if (d.le) { S.lib.edit[d.le] = t.value; if (d.le === "type") renderMain(); return; }
  if (d.fe) { S.firm[d.fe] = t.value; return; }
});
document.addEventListener("change", e => {
  const t = e.target, d = t.dataset, c = S.cfg;
  if (d.c && t.tagName === "SELECT") {
    if (d.c === "pid") {
      c.pid = t.value; const p = pById(t.value);
      if (p && p.type === "LIFT") { c.cap = (p.caps || []).length === 1 ? String(p.caps[0]) : ""; const cs = liftSizes(p); if (c.sizeMode === "std" && (!c.size || !allSizes(p).includes(c.size))) c.size = cs.length === 1 ? cs[0] : (allSizes(p).includes(c.size) ? c.size : ""); }
    } else if (d.c === "sizeSel") {
      if (t.value === "custom") { c.sizeMode = "custom"; const m = parseSize(c.size); if (m && !c.w && !c.d) { c.w = String(m[0]); c.d = String(m[1]); } }
      else { c.sizeMode = "std"; c.size = t.value; }
    } else c[d.c] = t.value;
    saveDraft(); renderMain();
    if (d.c === "sizeSel" && t.value === "custom") setTimeout(() => { const w = $("cw"); if (w && !w.value) w.focus(); }, 0);
    return;
  }
  if (d.pick === "buyer") { const r = buyersList().find(x => x.key === t.value); if (r) { ["address", "country", "contact", "phone", "email", "taxId"].forEach(k => S.q[k] = r[k] || ""); S.q.buyer = r.name; touch(); renderMain(); toast(r.name + " seçildi"); } }
});
document.addEventListener("submit", async e => {
  const f = e.target; if (!f.dataset.form) return; e.preventDefault();
  const kind = f.dataset.form, fd = new FormData(f), email = String(fd.get("email") || "").trim(), pw = String(fd.get("password") || ""), pw2 = String(fd.get("password2") || "");
  const err = f.querySelector(".form-err"), btn = f.querySelector("button[type=submit]"), setErr = m => { if (err) err.textContent = m; };
  setErr("");
  if (["login", "signup", "reset"].includes(kind) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Geçerli bir e-posta adresi yazın.");
  if (kind === "login" && !pw) return setErr("Şifrenizi yazın.");
  const newPw = ["signup", "recovery", "pwchange"].includes(kind);
  if (newPw) {
    const miss = pwMissing(pw); if (miss.length) return setErr("Şifrede eksik: " + miss.join(", ") + ".");
    if (pw.length > 72) return setErr("Şifre en fazla 72 karakter olabilir.");
    if (pw !== pw2) return setErr("Şifreler eşleşmiyor.");
    if (email && pw.toLowerCase().includes(email.split("@")[0].toLowerCase())) return setErr("Şifre e-posta adınızı içermemeli.");
  }
  busy(btn, true);
  if (newPw) {
    const n = await pwnedCount(pw);
    if (n > 0) { busy(btn, false); const leak = f.querySelector(".pwreq .leak"); if (leak) leak.classList.add("bad"); return setErr(`Bu şifre bilinen veri sızıntılarında ${n.toLocaleString("tr-TR")} kez görülmüş; Chrome'un uyardığı durum budur. Başka bir yerde kullanmadığınız yeni bir şifre seçin.`); }
  }
  try {
    if (kind === "login") { await Store.signIn(email, pw); if (!S.user) { const u = await Store.session(); if (u) await enter(u); } }
    else if (kind === "signup") { const r = await Store.signUp(email, pw); S.authEmail = email; if (r.confirm) { S.auth = "confirm"; renderAuth(); } }
    else if (kind === "reset") { await Store.reset(email); S.authEmail = email; S.auth = "sent"; renderAuth(); }
    else if (kind === "recovery") { await Store.setPassword(pw); S.auth = "login"; toast("Şifreniz güncellendi"); history.replaceState(null, "", location.pathname + "#proforma"); const u = await Store.session(); if (u) await enter(u); else renderAuth(); }
    else if (kind === "pwchange") { await Store.setPassword(pw); f.reset(); toast("Şifreniz değiştirildi"); }
  } catch (x) { setErr(authError(x)); }
  finally { busy(btn, false); }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") { if (S.confirm) { S.confirm = null; renderConfirm(); } else if (S.menu) { S.menu = null; renderTop(); } } });
$("confirm").addEventListener("click", e => { if (e.target.id === "confirm") { S.confirm = null; renderConfirm(); } });
document.addEventListener("click", async e => {
  if (S.menu && !e.target.closest(".umenu")) { S.menu = null; renderTop(); }
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, c = S.cfg, q = S.q, i = b.dataset.i != null ? +b.dataset.i : -1;
  switch (a) {
    /* giriş */
    case "auth": S.auth = b.dataset.m; renderAuth(); break;
    case "pw-toggle": { const inp = b.parentElement.querySelector("input"); const show = inp.type === "password"; inp.type = show ? "text" : "password"; b.innerHTML = show ? ICON.eyeOff : ICON.eye; b.setAttribute("aria-label", show ? "Şifreyi gizle" : "Şifreyi göster"); break; }
    case "demo-on": lsSet(DEMO_FLAG, "1"); Store = localStore(); Store.onChange(onAuth); S.auth = "signup"; renderAuth(); break;
    case "demo-off": lsSet(DEMO_FLAG, null); location.reload(); break;
    case "logout": S.menu = null; guard("Çıkış yapılırsa", async () => { if (S.user) lsSet(draftKey(), null); clearTimeout(draftT); try { await Store.signOut(); } catch (x) {} if (S.user || !$("top")) leave(); }); break;
    case "reload": location.reload(); break;
    case "copy-sql": { const t = ($("sqlBox") || {}).textContent || ""; try { await navigator.clipboard.writeText(t); toast("SQL kopyalandı"); } catch (x) { const r = document.createRange(); r.selectNodeContents($("sqlBox")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Metin seçildi; kopyalayın"); } break; }
    /* çerçeve */
    case "theme": lsSet("ndl-theme", isDark() ? "light" : "dark"); applyTheme(); renderTop(); break;
    case "umenu": S.menu = S.menu === "user" ? null : "user"; renderTop(); break;
    case "go": go(b.dataset.v); break;
    case "step": setStep(+b.dataset.n); break;
    case "new": guard("Yeni proforma açılırsa", () => startNew()); break;
    case "tpl-open": guard("Örnek şablon açılırsa", () => { S.q = templateQuote(); S.cfg = newCfg(); S.cfgTried = false; S.openRows.clear(); S.step = 3; saveDraft(); updateCart(); go("proforma"); renderMain(); toast("Örnek şablon açıldı · bilgiler hayalidir"); }); break;
    case "tpl-clear": startNew(); break;
    case "undo": if (S.undo) { S.undo(); S.undo = null; $("toast").hidden = true; } break;
    case "cf-no": S.confirm = null; renderConfirm(); break;
    case "cf-yes": { const fn = S.confirm && S.confirm.fn; S.confirm = null; renderConfirm(); if (fn) await fn(); break; }
    /* yapılandırıcı */
    case "mode": if (c.mode !== b.dataset.v) { S.cfg = newCfg(b.dataset.v); S.cfgTried = false; saveDraft(); renderMain(); } break;
    case "mat": c.mat = b.dataset.v; saveDraft(); renderMain(); break;
    case "volt": c.volt = b.dataset.v; saveDraft(); renderMain(); break;
    case "opt": { const id = b.dataset.id, k = c.opts.findIndex(o => o.oid === id); if (k >= 0) c.opts.splice(k, 1); else c.opts.push({oid: id, name: (pById(id) || {}).name || "", price: ""}); saveDraft(); renderMain(); if (k < 0) setTimeout(() => { const n = $("opp_" + id); if (n) n.focus(); }, 0); break; }
    case "qty": { c.qty = Math.max(1, (Math.round(Number(c.qty)) || 0) + (+b.dataset.d)); const n = $("cqty"); if (n) n.value = c.qty; saveDraft(); refreshCfg(); break; }
    case "cfg-reset": S.cfg = newCfg(c.mode); S.cfgTried = false; saveDraft(); renderMain(); break;
    case "cfg-cancel": S.cfg = newCfg(c.mode); S.cfgTried = false; saveDraft(); renderMain(); break;
    case "cfg-add": {
      const miss = cfgMissing(c);
      if (miss.length) { S.cfgTried = true; renderMain(); const n = document.querySelector("#formCard .need"); if (n) n.scrollIntoView({block: "center", behavior: "smooth"}); toast("Eksik: " + miss.join(", ")); break; }
      const it = cfgItem(c), code = itemInfo(it).code; let idx;
      if (c.edit != null && q.items[c.edit]) { idx = c.edit; q.items[idx] = it; toast(`${idx + 1}. kalem güncellendi`); }
      else { q.items.push(it); idx = q.items.length - 1; toast(`${code} proformaya eklendi · ${idx + 1}. kalem`); }
      S.flash = idx; S.cfg = newCfg(c.mode); S.cfgTried = false; touch(); renderMain();
      break;
    }
    case "row-open": if (S.openRows.has(i)) S.openRows.delete(i); else S.openRows.add(i); renderMain(); break;
    case "li-edit": if (q.items[i]) { S.cfg = cfgFromItem(q.items[i], i); S.cfgTried = false; S.step = 2; saveDraft(); if (S.view !== "proforma") go("proforma"); else renderMain(); const m = $("main"); if (m) m.scrollTop = 0; window.scrollTo(0, 0); } break;
    case "li-up": if (i > 0) { [q.items[i - 1], q.items[i]] = [q.items[i], q.items[i - 1]]; if (c.edit === i) c.edit = i - 1; else if (c.edit === i - 1) c.edit = i; S.flash = i - 1; S.openRows.clear(); touch(); renderMain(); } break;
    case "li-down": if (i < q.items.length - 1) { [q.items[i + 1], q.items[i]] = [q.items[i], q.items[i + 1]]; if (c.edit === i) c.edit = i + 1; else if (c.edit === i + 1) c.edit = i; S.flash = i + 1; S.openRows.clear(); touch(); renderMain(); } break;
    case "li-del": { const [gone] = q.items.splice(i, 1); if (c.edit === i) S.cfg = newCfg(c.mode); else if (c.edit > i) c.edit--; S.openRows.clear(); touch(); renderMain();
      toast(`${itemInfo(gone).code} silindi`, () => { S.q.items.splice(Math.min(i, S.q.items.length), 0, gone); touch(); renderMain(); }); break; }
    /* belge */
    case "nextno": q.no = nextNo(); q.autoNo = true; touch(); renderMain(); break;
    case "create": createProforma(b); break;
    case "out": makeFile(b.dataset.k, b.dataset.src, b); break;
    /* kayıtlar */
    case "f-clear": S.qSearch = ""; S.qCur = ""; S.qFrom = ""; S.qTo = ""; if ($("gSearch")) $("gSearch").value = ""; renderMain(); break;
    case "q-open": { const id = b.dataset.id; if (S.openQ.has(id)) S.openQ.delete(id); else S.openQ.add(id); renderMain(); break; }
    case "dup": { const src = b.dataset.id === "cur" ? S.q : S.quotes.find(x => x.id === b.dataset.id); if (!src) break;
      const run = () => { const n = duplicate(src); S.q = n; S.cfg = newCfg(); S.step = 3; S.openRows.clear(); saveDraft(); updateCart(); go("proforma"); renderMain(); toast("Kopya hazır · yeni no " + n.no); };
      if (b.dataset.id === "cur") run(); else guard("Kopya açılırsa", run); break; }
    case "q-edit": { const src = S.quotes.find(x => x.id === b.dataset.id); if (!src) break;
      guard("Kayıt açılırsa", () => { S.q = Object.assign(normQuote(JSON.parse(JSON.stringify(src))), {id: src.id, saved: true, dirty: false, sample: false}); S.cfg = newCfg(); S.step = 2; S.openRows.clear(); saveDraft(); updateCart(); go("proforma"); renderMain(); toast(src.no + " düzenlemeye açıldı"); }); break; }
    case "q-del": { const x = S.quotes.find(z => z.id === b.dataset.id); if (!x) break;
      ask({title: "Proforma silinsin mi?", msg: `<b>${esc(x.no)}</b> · ${esc(x.buyer || "")} kalıcı olarak silinir. Bu işlem geri alınamaz.`, yes: "Sil", danger: true,
        fn: async () => { try { await Store.del("quote", x.id); S.quotes = S.quotes.filter(z => z.id !== x.id); if (S.q.id === x.id) { S.q.saved = false; saveDraft(); } toast(x.no + " silindi"); renderMain(); } catch (err) { toast("Silinemedi: " + authError(err)); } }}); break; }
    /* alıcılar */
    case "buyer-new": { const r = buyersList().find(x => x.key === b.dataset.k); if (!r) break;
      guard("Yeni proforma açılırsa", () => startNew({buyer: r.name, address: r.address || "", country: r.country || "", contact: r.contact || "", phone: r.phone || "", email: r.email || "", taxId: r.taxId || ""})); break; }
    case "buyer-del": { const r = buyersList().find(x => x.key === b.dataset.k); if (!r) break;
      ask({title: "Alıcı silinsin mi?", msg: `<b>${esc(r.name)}</b> alıcı listesinden kaldırılır. Bu firmaya kesilmiş proformalar silinmez.`, yes: "Sil", danger: true,
        fn: async () => { try { await Store.del("customer", r.id || r.key); S.customers = S.customers.filter(z => (z.id || slug(z.name)) !== (r.id || r.key)); toast(r.name + " silindi"); renderMain(); } catch (err) { toast("Silinemedi: " + authError(err)); } }}); break; }
    /* ürünler */
    case "lib-type": S.lib.type = b.dataset.t; S.lib.sel = null; S.lib.edit = null; renderMain(); break;
    case "lib-sel": S.lib.sel = b.dataset.id; S.lib.edit = editBuf(pById(b.dataset.id)); renderMain(); if (window.innerWidth < 1100) { const ed = document.querySelector(".editor"); if (ed) ed.scrollIntoView({block: "start", behavior: "smooth"}); } break;
    case "lib-add": S.lib.edit = {id: "", code: "", name: "", type: S.lib.type, caps: "", sizes: ""}; renderMain(); setTimeout(() => { const n = $("le_code"); if (n) { n.focus(); n.scrollIntoView({block: "center"}); } }, 0); break;
    case "lib-cancel": S.lib.edit = null; renderMain(); break;
    case "lib-save": saveProduct(b); break;
    case "lib-del": { const p = pById(b.dataset.id); if (!p) break;
      ask({title: "Ürün silinsin mi?", msg: `<b>${esc(p.code)}</b> · ${esc(p.name)} kütüphanenizden kaldırılır. Kayıtlı proformalar etkilenmez.`, yes: "Sil", danger: true,
        fn: async () => { try { await Store.del("product", p.id); S.products = S.products.filter(z => z.id !== p.id); S.lib.sel = null; S.lib.edit = null; toast("Ürün silindi"); renderMain(); } catch (err) { toast("Silinemedi: " + authError(err)); } }}); break; }
    /* firma */
    case "firm-save": saveFirm(b); break;
    case "firm-reset": S.firm = null; renderMain(); break;
  }
});

/* ---------- yönlendirme ---------- */
const VIEWS = ["proforma", "proformalar", "alicilar", "urunler", "firma"];
function fromHash() {
  if (!S.user || !$("main")) return;
  const h = location.hash.slice(1); S.view = VIEWS.includes(h) ? h : "proforma"; S.menu = null;
  if (S.view !== "firma") S.firm = null;
  renderSide(); renderMain(); const m = $("main"); if (m) m.scrollTop = 0;
}
window.addEventListener("hashchange", fromHash);

boot();
