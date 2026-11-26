/* app.js — NDL Proforma arayüzü: giriş, menü, sayfalar ve olaylar */
"use strict";

const $ = id => document.getElementById(id);
const root = $("root");
let Store = null;
Object.assign(S, {ann: [], annEdit: {title: "", body: "", level: "info"}, keepQ: false, qCari: "", role: "user", pendingCount: 0, admin: {users: null, loading: false, filter: "", tab: "users"}, cari: {sel: null, search: ""}, cariEdit: null, pick: {search: "", mode: ""}, audit: newAudit()});
const RECOVERY = /type=recovery/.test(location.hash + location.search);
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };
const opt = (v, cur, label) => `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(label ?? v)}</option>`;
const dlist = (id, vals) => `<datalist id="${id}">${vals.map(v => `<option value="${esc(v)}"></option>`).join("")}</datalist>`;
const I = p => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
/* denetim bölümünün durumu (yalnızca yönetici) */
function newAudit() { return {loaded: false, loading: false, err: "", period: "30", user: "", view: "users", group: "user", cat: "", more: 0, at: 0, quotes: [], sessions: [], log: [], open: new Set(), coll: new Set()}; }
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
  pano: I('<rect x="3.5" y="3.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="15.5" width="7" height="5" rx="1.5"/>'),
  bell: I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  key: I('<circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5L20 3M16 7l2.5 2.5M14 9l2 2"/>'),
  chev: I('<path d="M6 9l6 6 6-6"/>'), clock: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  user: I('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.7 3.6-5.7 7-5.7s6.2 2 7 5.7"/>'),
  shield: I('<path d="M12 3l7.5 3v6c0 4.5-3.2 7.7-7.5 9-4.3-1.3-7.5-4.5-7.5-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>')
};
const kv = (k, v, cls = "") => `<div class="kv"><span>${esc(k)}</span><b class="${cls}">${v}</b></div>`;
const noteLabel = v => (NOTES.find(n => n.v === v) || {l: v}).l;
function toast(msg, undo, err) {
  const t = $("toast"), keep = !!(undo || err);
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button data-act="undo">Geri al</button>` : ""}${keep ? `<button class="tx" data-act="toast-x" aria-label="Bildirimi kapat">${ICON.x}</button>` : ""}`;
  t.classList.toggle("err", !!err); t.hidden = false; S.undo = undo || null; clearTimeout(toast._t);
  announce(msg, err);
  if (!keep) toast._t = setTimeout(() => { t.hidden = true; S.undo = null; }, 4000);   /* bilgi amaçlı olanlar kendiliğinden kapanır */
}
const toastErr = msg => toast(msg, null, true);
/* ekran okuyucu duyurusu: sayfa açılışından beri boş duran bölgeye metin yazılır */
function announce(msg, err) {
  const r = $(err ? "srAlert" : "srStatus"); if (!r) return;
  r.textContent = ""; clearTimeout(announce._t); announce._t = setTimeout(() => { r.textContent = msg; }, 50);
}
/* hatalı alanlar: kırmızı çerçevenin yanında aria-invalid ve (yapılandırıcıda) eksik listesine bağlantı */
function syncInvalid(root) {
  if (!root) return; const miss = $("cfgMiss");
  root.querySelectorAll("input, select, textarea").forEach(el => {
    if (el.classList.contains("need")) { el.setAttribute("aria-invalid", "true"); if (miss && el.closest("#formCard") && !el.hasAttribute("aria-describedby")) el.setAttribute("aria-describedby", "cfgMiss"); }
    else { el.removeAttribute("aria-invalid"); if (el.getAttribute("aria-describedby") === "cfgMiss") el.removeAttribute("aria-describedby"); }
  });
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
  try { LOGO_D = await toData("duelsan.jpg"); } catch (e) {}
  await Promise.all(BRANDS.map(async b => { try { LOGO_B[b] = await toData(BRAND_IMG[b]); } catch (e) {} }));
}
/* son kullanılan marka yeni proformaların varsayılanıdır */
const lastBrand = () => { const b = lsGet("ndl-brand"); return BRANDS.includes(b) ? b : "NDL"; };
BRAND_DEF = lastBrand();

/* ---------- kullanım oturumu ----------
   Uygulama açılınca sunucuda bir oturum kaydı başlar; dakikada bir son etkinlik zamanı ve etkin kullanım süresi eklenir.
   Etkin süre yalnızca sekme öndeyken ve son 5 dakikada fare, klavye ya da dokunma varken sayılır. Kayıtları yalnızca yönetici görür. */
const USAGE = {sid: null, t: null, last: 0, input: 0, acc: 0};
const IDLE_MS = 5 * 60000;
function usageCount() {
  const now = Date.now(), dt = Math.min(Math.max(now - USAGE.last, 0), 120000); USAGE.last = now;
  if (document.visibilityState === "visible" && now - USAGE.input < IDLE_MS) USAGE.acc += dt;
}
function usageFlush() {
  if (!USAGE.sid || !Store) return; usageCount();
  const add = Math.round(USAGE.acc / 1000); USAGE.acc = 0;
  Store.rpc("session_ping", {sid: USAGE.sid, add_secs: add}).catch(() => {});
  const v = usageSaved(); if (v && v.sid === USAGE.sid) usageSave(Object.assign(v, {at: Date.now()}));
}
/* aynı sekmede sayfa yenilenince oturum yeniden başlamaz, sürer (sekme kapanınca sessionStorage silinir) */
const USAGE_KEY = "ndl-usage";
const usageSaved = () => { try { return JSON.parse(sessionStorage.getItem(USAGE_KEY) || "null"); } catch (e) { return null; } };
const usageSave = v => { try { if (v) sessionStorage.setItem(USAGE_KEY, JSON.stringify(v)); else sessionStorage.removeItem(USAGE_KEY); } catch (e) {} };
function usageStop(end) { if (USAGE.t) clearInterval(USAGE.t); if (USAGE.sid) usageFlush(); if (end) usageSave(null); Object.assign(USAGE, {sid: null, t: null, acc: 0}); }
function usageStart(kind) {
  usageStop(); USAGE.last = USAGE.input = Date.now(); USAGE.t = setInterval(usageFlush, 60000);
  const uid = S.user && S.user.id, prev = usageSaved();
  if (kind !== "login" && prev && prev.uid === uid && Date.now() - prev.at < 30 * 60000) { USAGE.sid = prev.sid; usageFlush(); return; }
  Store.rpc("session_start", {p_kind: kind}).then(id => { USAGE.sid = id || null; if (id) usageSave({uid, sid: id, at: Date.now()}); }).catch(() => {});   // kurulmamışsa sessizce atlanır
}
const usageInput = () => { USAGE.input = Date.now(); };
["pointerdown", "keydown", "wheel", "touchstart", "mousemove"].forEach(ev => addEventListener(ev, usageInput, {passive: true, capture: true}));
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") usageFlush(); else USAGE.last = Date.now(); });
addEventListener("pagehide", usageFlush);

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
  let prof = null;
  try { prof = await Store.profile(); }
  catch (e) { S.entering = false; if (isMissingTable(e)) renderSetupNeeded(); else renderFatal("Hesap bilgileriniz okunamadı: " + authError(e), true); return; }
  if (!prof || prof.status !== "active") { S.entering = false; renderGate(prof); return; }
  if (prof.must_change) { S.entering = false; renderForcePw(); return; }
  S.me = prof;
  /* her hesabın adı ve soyadı olmalı (proformada "Hazırlayan"); profil sütunları kuruluysa ve eksikse önce tamamlanır */
  if ("first_name" in prof && !hasName(prof)) { S.entering = false; renderNameGate(); return; }
  PREP_DEF = lsGet("ndl-showprep") !== "0";
  S.role = prof.role === "admin" ? "admin" : "user"; S.qView = lsGet("ndl-qview") === "list" ? "list" : "group";
  S.admin.tab = ADM_TABS.some(t => t[0] === lsGet("ndl-admtab")) ? lsGet("ndl-admtab") : "users";
  S.lib.brand = BRANDS.includes(lsGet("ndl-libbrand")) ? lsGet("ndl-libbrand") : "NDL"; BRAND_DEF = lastBrand();
  try { S.ann = await Store.listAnn(); } catch (e) { S.ann = []; }
  try {
    ingest(await Store.loadAll());
    await loadShared();
  } catch (e) {
    S.entering = false;
    if (isMissingTable(e)) renderSetupNeeded(); else renderFatal("Verileriniz yüklenemedi: " + authError(e), true);
    return;
  }
  S.entering = false;
  let d = loadDraft();
  if (d && !d.q.saved && !d.q.buyer.trim() && !d.q.items.length) d = null;   /* boş taslak saklanmaz; yeni, boş proformayla başlanır */
  if (d && d.q.saved && !d.q.dirty) d = null;                                 /* kayıtlı proforma girişte açık gelmez; yeni proforma cari seçimiyle başlar */
  if (d) { S.q = d.q; S.step = d.step; S.cfg = d.cfg; if (S.cfg.edit != null && !S.q.items[S.cfg.edit]) S.cfg.edit = null; }
  else { S.q = newQuote(); S.step = 1; S.cfg = newCfg(); }
  /* taslakların numarası olmaz; kayıtlı bir taslak ise numarayı ve durumu sunucudaki kayıttan al */
  if (S.q.saved) { const rec = S.quotes.find(x => x.id === S.q.id); if (rec) { S.q.no = rec.no || S.q.no; S.q.sysNo = rec.sysNo || ""; } else { S.q.saved = false; S.q.dirty = false; } }
  if (!S.q.saved) { S.q.no = ""; S.q.sysNo = ""; }
  if (/access_token|error_description|type=/.test(location.hash)) history.replaceState(null, "", location.pathname + "#proforma");
  renderShell(); fromHash();
  if (S.role === "admin") loadUsers(true);
  usageStart(S.loginKind || "open"); S.loginKind = "";
}
/* onay bekleyen ya da dondurulmuş hesap: veriye erişim yok, yalnızca durum ekranı */
/* yönetici geçici şifre verdiyse: yeni şifre belirlemeden devam edilmez */
function renderForcePw() {
  root.innerHTML = `<div class="auth-main" style="min-height:100%"><div class="auth-card"><div><div class="eyebrow soft">${esc(S.user ? S.user.email : "")}</div><h1>Yeni şifrenizi belirleyin</h1></div>
    <p class="lead">Hesabınıza yönetici tarafından geçici bir şifre verildi. Devam etmek için yalnızca sizin bildiğiniz yeni bir şifre belirleyin.</p>
    <form class="auth-form" data-form="forcepw" novalidate>${pwField("f_pw", "password", "Yeni şifre", "new-password", "", true)}${pwField("f_pw2", "password2", "Yeni şifre (tekrar)", "new-password")}
    <div class="form-err" role="alert"></div><button class="btn blue wide" type="submit">Şifreyi kaydet ve devam et</button></form>
    <button class="link" data-act="logout">Çıkış yap</button></div></div>`;
  const f = $("f_pw"); if (f) f.focus();
}
function renderNameGate() {
  const m = S.me || {};
  root.innerHTML = `<div class="auth-main" style="min-height:100%"><div class="auth-card"><div><div class="eyebrow soft">${esc(S.user ? S.user.email : "")}</div><h1>Adınızı ve soyadınızı girin</h1></div>
    <p class="lead">Proformalarda “Hazırlayan” olarak adınız ve soyadınız basılır. Bir kez girmeniz yeterli; sonradan Hesap ayarlarından değiştirebilirsiniz.</p>
    <form class="auth-form" data-form="namegate" novalidate><div class="two">${nameFields("g", m)}</div>
    <div class="form-err" role="alert"></div><button class="btn blue wide" type="submit">${ICON.check} Kaydet ve devam et</button></form>
    <button class="link" data-act="logout">Çıkış yap</button></div></div>`;
  const f = $("g_first"); if (f) f.focus();
}
const nameFields = (px, v, attr = "") => `<div class="fld"><label for="${px}_first">Ad</label><input id="${px}_first" name="first_name" autocomplete="given-name" maxlength="60" required value="${esc((v && v.first_name) || "")}"${attr ? attr.replace("%", "first_name") : ""}></div>
  <div class="fld"><label for="${px}_last">Soyad</label><input id="${px}_last" name="last_name" autocomplete="family-name" maxlength="60" required value="${esc((v && v.last_name) || "")}"${attr ? attr.replace("%", "last_name") : ""}></div>`;
function renderGate(prof) {
  const st = prof ? prof.status : "pending", susp = st === "suspended";
  root.innerHTML = `<div class="auth-main" style="min-height:100%"><div class="auth-card"><div class="sent"><span class="bubble${susp ? " red" : ""}">${susp ? ICON.lock : ICON.shield}</span>
    <div class="eyebrow soft">${esc(S.user ? S.user.email : "")}</div><h1>${susp ? "Hesabınız donduruldu" : "Hesabınız onay bekliyor"}</h1>
    <p class="lead" style="margin:0">${susp ? "Bu hesap yönetici tarafından donduruldu; proformalara erişemezsiniz. Bilgi için yöneticinizle görüşün." : "Kaydınız alındı. Yönetici hesabınızı onayladığında proformalara erişebilirsiniz. Onaydan sonra “Tekrar kontrol et” deyin."}</p>
    <div class="row-between" style="width:100%;margin-top:6px">${susp ? "<span></span>" : `<button class="btn blue" data-act="gate-check">${ICON.check} Tekrar kontrol et</button>`}<button class="btn" data-act="logout">${ICON.out} Çıkış yap</button></div></div></div></div>`;
}
function leave() {
  closeViewer(false); usageStop(true); S.me = null; S.acct = null;
  /* önceki hesabın "Geri al" bildirimi bir sonraki girişte kalmasın */
  clearTimeout(toast._t); S.undo = null; const tt = $("toast"); if (tt) { tt.hidden = true; tt.innerHTML = ""; }
  Object.assign(S, {user: null, role: "user", pendingCount: 0, products: [], companies: [], settings: {}, quotes: [], customers: [], q: null, cfg: null, firm: null, menu: null, auth: "login", cariEdit: null});
  S.co = {sel: null, edit: null};
  S.admin = {users: null, loading: false, filter: "", tab: S.admin.tab}; S.audit = newAudit(); S.cari = {sel: null, search: ""}; S.qCari = ""; S.pick = {search: "", mode: ""};
  S.lib.edit = null; S.openRows.clear(); S.openQ.clear(); renderAuth();
}
function ingest(rows) {
  S.quotes = []; S.customers = []; S.settings = {};
  rows.forEach(r => {
    const d = Object.assign({}, r.data, {id: r.id});
    if (r.kind === "quote") S.quotes.push(d);
    else if (r.kind === "customer") S.customers.push(normCari(d));
    else if (r.kind === "settings" && r.id === "main") S.settings = r.data || {};
  });
  S.quotes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
/* ürün kütüphanesi ve firmalar herkes için ortaktır; yalnızca yönetici değiştirir (bkz. schema.sql · shared) */
const isAdmin = () => S.role === "admin";
const coSort = (a, b) => (a.order || 0) - (b.order || 0) || String(a.name || a.company || "").localeCompare(String(b.name || b.company || ""), "tr");
const coName = c => (c && (c.name || c.company)) || "";
async function loadShared() {
  const rows = await Store.listShared();
  S.products = rows.filter(r => r.kind === "product").map(r => Object.assign({}, r.data, {id: r.id})).sort((a, b) => (a.order || 0) - (b.order || 0));
  S.companies = rows.filter(r => r.kind === "company").map(r => Object.assign({}, r.data, {id: r.id})).sort(coSort);
  /* ilk kurulum: kütüphane boşsa yönetici katalogla (fotoğraflarıyla) başlatır */
  if (!S.products.length && isAdmin()) { await Store.putSharedMany(CATALOG.map(({id, ...d}) => ({kind: "product", id, data: d}))); S.products = CATALOG.map(p => ({...p})); }
}
/* yüklenen görseli küçültür (yalnızca yönetici; ortak kayıtta data: URL olarak saklanır) */
function shrinkImage(file, max, type, quality) {
  return new Promise((res, rej) => {
    if (!file || !/^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(file.type)) return rej(new Error("PNG, JPG veya WebP bir görsel seçin"));
    if (file.size > 15 * 1024 * 1024) return rej(new Error("Dosya çok büyük (en fazla 15 MB)"));
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.naturalWidth || max, im.naturalHeight || max)), w = Math.max(1, Math.round((im.naturalWidth || max) * k)), h = Math.max(1, Math.round((im.naturalHeight || max) * k));
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const x = cv.getContext("2d");
      const draw = t => { x.clearRect(0, 0, w, h); if (t === "image/jpeg") { x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); } x.drawImage(im, 0, 0, w, h); return cv.toDataURL(t, quality); };
      let out = draw(type); if (out.length > 200000) out = draw("image/jpeg");
      URL.revokeObjectURL(u); out.length > 240000 ? rej(new Error("Görsel çok büyük; daha küçük bir dosya deneyin")) : res(out);
    };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("Görsel okunamadı")); };
    im.src = u;
  });
}
/* PDF ve Excel için logo: data: URL ve en/boy oranı */
const LOGO_CACHE = {};
async function logoData(src) {
  if (!src) return {d: "", ar: 0};
  if (LOGO_CACHE[src]) return LOGO_CACHE[src];
  let d = src;
  if (!/^data:/.test(src)) { const b = await (await fetch(src)).blob(); d = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); }
  const ar = await new Promise(res => { const im = new Image(); im.onload = () => res(im.naturalHeight ? im.naturalWidth / im.naturalHeight : 0); im.onerror = () => res(0); im.src = d; });
  return (LOGO_CACHE[src] = {d, ar});
}
/* PDF ve Excel için ürün ve opsiyon fotoğrafları: beyaz zemine küçültülmüş JPEG (data: URL) ve en/boy oranı.
   Yüklenemeyen fotoğraf atlanır; proforma yine üretilir. */
const PHOTO_CACHE = {};
function photoData(src) {
  if (!PHOTO_CACHE[src]) PHOTO_CACHE[src] = new Promise(res => {
    const im = new Image();
    im.onload = () => {
      try {
        const k = Math.min(1, 320 / Math.max(im.naturalWidth || 1, im.naturalHeight || 1)), w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const x = cv.getContext("2d");
        x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
        res({d: cv.toDataURL("image/jpeg", 0.86), ar: w / h});
      } catch (e) { res(null); }
    };
    im.onerror = () => res(null);
    im.src = src;
  }).then(r => { if (!r) delete PHOTO_CACHE[src]; return r; });
  return PHOTO_CACHE[src];
}
async function loadPhotos(q) {
  const out = {};
  await Promise.all(photoSrcs(q).map(async s => { const r = await photoData(s); if (r) out[s] = r; }));
  PHOTOS = out;
}
const coLogo = c => `<span class="co-logo">${c && c.logo ? `<img src="${esc(c.logo)}" alt="">` : `<b>${esc((coName(c) || "?").trim().charAt(0).toLocaleUpperCase("tr"))}</b>`}</span>`;
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
    <form class="auth-form" data-form="signup" novalidate><div class="two">${nameFields("a", S.signupName)}</div>${emailField()}${pwField("a_pw", "password", "Şifre", "new-password", "", true)}${pwField("a_pw2", "password2", "Şifre (tekrar)", "new-password")}
    <div class="form-err" role="alert"></div><button class="btn blue wide" type="submit">Hesap oluştur</button></form>
    <p class="auth-alt">Hesabınız var mı? <button class="link" data-act="auth" data-m="login">Giriş yapın</button></p>`;
  if (m === "reset") return `<div><div class="eyebrow soft">Şifre</div><h1>Şifremi unuttum</h1></div><p class="lead">Hesabınızın e-posta adresini yazın; şifre yenileme bağlantısı gönderelim.</p>
    <form class="auth-form" data-form="reset" novalidate>${emailField()}<div class="form-err" role="alert"></div><button class="btn blue wide" type="submit">Bağlantıyı gönder</button></form>
    <p class="auth-alt"><button class="link" data-act="auth" data-m="login">${ICON.left} Girişe dön</button></p>`;
  if (m === "sent" || m === "confirm") return `<div class="sent"><span class="bubble">${ICON.mail}</span><h1>E-postanızı kontrol edin</h1>
    <p class="lead" style="margin:0">${m === "confirm" ? `<b>${esc(S.authEmail)}</b> adresine bir onay bağlantısı gönderdik. Bağlantıya tıkladıktan sonra hesabınız yönetici onayına düşer; onaylandığında giriş yapabilirsiniz.` : `<b>${esc(S.authEmail)}</b> adresine şifre yenileme bağlantısı gönderdik. Bağlantı sizi yeni şifre belirleyeceğiniz sayfaya getirir.`}</p>
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
const NAV = [["pano", "Pano", "pano"], ["proforma", "Proforma", "doc"], ["proformalar", "Kayıtlar", "stack"], ["alicilar", "Cari", "users"], ["urunler", "Ürünler", "cube"], ["firma", "Firmalar", "firm"]];
function renderShell() {
  root.innerHTML = `<button class="skip" data-act="skip">İçeriğe geç</button><div class="app"><header class="top" id="top"></header><nav class="side" id="side" aria-label="Menü"></nav><main class="main" id="main"></main></div>`;
  renderTop(); renderSide();
}
/* ---------- profil ---------- */
const nameOf = p => [p && p.first_name, p && p.last_name].map(v => String(v || "").trim()).filter(Boolean).join(" ");
const hasName = p => !!(p && String(p.first_name || "").trim().length >= 2 && String(p.last_name || "").trim().length >= 2);
function initialsOf(p, email) {
  const n = nameOf(p); if (n) { const w = n.split(/\s+/); return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : "")).toLocaleUpperCase("tr"); }
  const e = email || (p && p.email) || "?", k = e.split("@")[0].split(/[._-]+/).filter(Boolean); return ((k[0] || "?")[0] + ((k[1] || "")[0] || "")).toUpperCase();
}
const initials = () => initialsOf(S.me, S.user && S.user.email);
const avatarHtml = (p, cls, email) => `<span class="av ${cls}" aria-hidden="true">${p && p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : esc(initialsOf(p, email))}</span>`;
const acctBuf = () => { const m = S.me || {}; return {first_name: m.first_name || "", last_name: m.last_name || "", title: m.title || "", phone: m.phone || ""}; };
function renderTop() {
  const t = $("top"); if (!t) return;
  t.innerHTML = `<a class="brand" href="#pano" title="Pano"><img src="ndl.jpg" alt="NDL"><span>NDL PROFORMA</span></a>
   <label class="gsearch">${ICON.search}<input id="gSearch" type="search" placeholder="Proforma no, firma veya ülke ara" value="${esc(S.qSearch)}" autocomplete="off" aria-label="Proformalarda ara"></label>
   <div class="top-r">
     <div class="dmenu"><button class="cart" data-act="draft" aria-haspopup="dialog" aria-expanded="${S.menu === "draft"}" aria-controls="draftPop" aria-label="${esc(cartLabel())}">${cartInner()}</button>${S.menu === "draft" ? draftPop() : ""}</div>
     <button class="round" data-act="theme" title="${isDark() ? "Açık tema" : "Koyu tema"}" aria-label="Temayı değiştir">${isDark() ? ICON.sun : ICON.moon}</button>
     <div class="umenu"><button class="avatar" data-act="umenu" aria-expanded="${S.menu === "user"}" aria-label="Hesap menüsü${S.role === "admin" && S.pendingCount ? ` · ${S.pendingCount} onay bekleyen` : ""}">${S.me && S.me.avatar ? `<img src="${esc(S.me.avatar)}" alt="">` : esc(initials())}${S.role === "admin" && S.pendingCount ? `<i class="abadge" aria-hidden="true">${S.pendingCount}</i>` : ""}</button>
       ${S.menu === "user" ? `<div class="pop" role="menu"><div class="who">${avatarHtml(S.me, "sm", S.user.email)}<div><b>${esc(nameOf(S.me) || S.user.email)}</b><span>${nameOf(S.me) ? esc(S.user.email) : Store.mode === "demo" ? "Demo hesabı · bu tarayıcıda" : "Kayıtlarınız yalnızca bu hesapta"}</span></div></div>
         <a href="#hesap" role="menuitem">${ICON.user} Hesap ayarları</a><a href="#firma" role="menuitem">${ICON.firm} Firmalar</a><a href="#proformalar" role="menuitem">${ICON.stack} Proformalarım</a>${S.role === "admin" ? `<a href="#yonetim" role="menuitem">${ICON.shield} Kullanıcı yönetimi${S.pendingCount ? ` · ${S.pendingCount} onay bekliyor` : ""}</a>` : ""}
         <button class="danger" data-act="logout" role="menuitem">${ICON.out} Çıkış yap</button></div>` : ""}</div>
   </div>`;
}
function renderSide() {
  const s = $("side"); if (!s) return;
  const nav = S.role === "admin" ? [...NAV, ["yonetim", "Yönetim", "shield"]] : NAV;
  s.innerHTML = nav.map(([v, l, ic]) => `<a href="#${v}" data-v="${v}"${S.view === v ? ' aria-current="page"' : ""}>${ICON[ic]}<span>${l}</span>${v === "yonetim" && S.pendingCount ? `<i class="nbadge" aria-label="${S.pendingCount} onay bekleyen">${S.pendingCount}</i>` : ""}</a>`).join("")
    + `<span class="grow"></span>${Store.mode === "demo" ? `<span class="mode">Demo</span>` : ""}`;
}
/* ---------- taslak özeti ----------
   Üst çubuktaki düğme, oluşturulmamış (ya da kaydedilmemiş değişikliği olan) son proformanın özetini açar.
   Proforma oluşturulunca taslak sıfırlanır: düğme "Taslak yok" der. */
const draftOf = () => { const q = S.q; return q && !isBlank(q) && (!q.saved || q.dirty) ? q : null; };
const cartLabel = () => { const d = draftOf(); return d ? `Taslak proforma: ${d.items.length} kalem, toplam ${money(qTotal(d), d.currency)}` : "Taslak proforma yok"; };
function cartInner() {
  const d = draftOf(), n = d ? d.items.length : 0;
  return `<span class="ic">${ICON.doc}${n ? `<i id="cartCount">${n}</i>` : ""}</span><span class="ct">${d ? `Toplam: <b id="cartTotal">${money(qTotal(d), d.currency)}</b>` : "Taslak yok"}</span>`;
}
const DRAFT_STEPS = ["Firma ve Cari Kart", "Ürün Ekle", "Önizle ve Oluştur"];
function draftPop() {
  const d = draftOf(), head = (title, tag) => `<div class="dp-h"><div><h2 id="dpT">${title}</h2>${tag || ""}</div><button class="ibtn" data-act="draft-close" aria-label="Taslak özetini kapat">${ICON.x}</button></div>`;
  if (!d) return `<div class="dpop" id="draftPop" role="dialog" aria-labelledby="dpT" tabindex="-1">${head("Taslak proforma")}
    <div class="dp-empty"><span class="dp-ic">${ICON.doc}</span><b>Bekleyen taslak yok</b><span>Oluşturulan proformalar taslaktan çıkar ve Kayıtlar'da saklanır. Yeni bir proforma hazırladıkça özeti burada görünür.</span>
      <div class="dp-eb"><button class="btn blue sm" data-act="draft-new">${ICON.plus} Yeni proforma</button><a class="btn sm" href="#proformalar" data-act="draft-close">${ICON.stack} Kayıtlar</a></div></div></div>`;
  const st = d.sample ? ["amber", "Örnek şablon"] : d.saved ? ["amber", "Kaydedilmemiş değişiklik"] : ["grey", "Oluşturulmadı"];
  const seller = companyChosen(d) ? (sellerOf(d).company || coName(companyById(d.companyId))) : "", miss = d.items.filter(missingPrice).length, B = brandOf(d);
  const li = it => { const inf = itemInfo(it, B), ph = itemPhotos(it).main;
    return `<li><span class="dp-th">${ph ? `<img src="${esc(thumbOf(ph))}" alt="" loading="lazy">` : ICON.cube}</span><span class="dp-n"><b>${esc(inf.code)}</b><span>${esc(inf.name)}${it.opts.length ? ` · +${it.opts.length} opsiyon` : ""}</span></span>
      <span class="dp-p">${missingPrice(it) ? `<span class="tag red">Fiyat eksik</span>` : `<b>${money(lineTotal(it), d.currency)}</b>`}<span>${esc(it.qty)} × ${money(unitPrice(it), d.currency)}</span></span></li>`; };
  return `<div class="dpop" id="draftPop" role="dialog" aria-labelledby="dpT" tabindex="-1">${head(d.saved ? esc(d.no) + " · düzenleniyor" : "Taslak proforma", `<span class="tag ${st[0]}">${st[1]}</span>`)}
    <dl class="dp-meta"><div><dt>Cari</dt><dd>${esc(d.buyer || "Seçilmedi")}</dd></div><div><dt>Firma</dt><dd>${esc(seller || "Seçilmedi")}</dd></div>
      <div><dt>Marka · dil</dt><dd>${B} · ${LANG_BY[langOf(d)]}</dd></div><div><dt>Kaldığınız adım</dt><dd>${S.step}/3 · ${DRAFT_STEPS[S.step - 1] || ""}</dd></div></dl>
    ${d.items.length ? `<ul class="dp-items">${d.items.slice(0, 4).map(li).join("")}</ul>${d.items.length > 4 ? `<p class="dp-more">+${d.items.length - 4} kalem daha</p>` : ""}` : `<p class="dp-none">Henüz kalem eklenmedi.</p>`}
    ${miss ? `<p class="dp-warn">${ICON.alert} ${miss} kalemde fiyat eksik</p>` : ""}
    <div class="dp-f"><div class="dp-tot"><span>Toplam · ${d.items.length} kalem</span><b>${money(qTotal(d), d.currency)}</b></div>
      <div class="dp-fb"><button class="btn" data-act="draft-prev" aria-haspopup="dialog">${ICON.eye} Önizle</button><button class="btn blue" data-act="draft-cont">Devam et ${ICON.right}</button></div></div></div>`;
}
function updateCart() {
  const b = document.querySelector(".cart"); if (!b) return;
  const c0 = $("cartCount"), was = c0 ? Number(c0.textContent) || 0 : 0;
  b.innerHTML = cartInner(); b.setAttribute("aria-label", cartLabel());
  const c = $("cartCount"); if (c && Number(c.textContent) > was) c.classList.add("bump");
  if (S.menu === "draft") { const p = $("draftPop"); if (p) p.outerHTML = draftPop(); }
}
/* önizleme penceresi: taslağın A4 sayfası, PDF'teki görünümüyle (önizleme, PDF ve Excel aynı sayfayı kullanır) */
const vwRO = new ResizeObserver(() => fitViewer());
function openPreview() {
  const d = draftOf(); if (!d) return;
  const c = $("confirm"), app = document.querySelector(".app");
  S.viewer = {zoom: false};
  const note = d.sample ? "Örnek şablon önizlemesi; bilgiler hayalidir." : d.saved ? "Kaydedilmemiş değişikliklerle önizleme. PDF ve Excel, değişiklikler kaydedilince güncellenir."
    : "Taslak önizlemesi. Proforma numarası ile PDF ve Excel dosyaları, proforma oluşturulunca hazır olur.";
  c.innerHTML = `<div class="viewer" role="dialog" aria-modal="true" aria-labelledby="vwT" aria-describedby="vwN" tabindex="-1">
    <div class="vw-h"><div><h2 id="vwT">Önizleme</h2><span class="muted small">${esc(d.no || "Taslak")} · ${esc(d.buyer || "Cari seçilmedi")} · ${brandOf(d)} · ${LANG_BY[langOf(d)]}</span></div>
      <div class="vw-acts"><button class="btn sm vw-zoom" data-act="vw-zoom" aria-pressed="false" aria-label="Yakınlaştır" hidden>${ICON.search}<span class="lbl">Yakınlaştır</span></button><button class="btn blue sm" data-act="vw-cont">Devam et ${ICON.right}</button><button class="ibtn" data-act="vw-close" aria-label="Önizlemeyi kapat">${ICON.x}</button></div></div>
    <div class="vw-body" id="vwBody"><div class="vw-frame" id="vwFrame"><div class="vw-scale" id="vwScale"><div class="paper" id="vwPaper">${paperHtml(d, false)}</div></div></div></div>
    <p class="vw-f" id="vwN">${ICON.file} ${esc(note)}</p></div>`;
  c.classList.add("vw-open"); c.hidden = false; if (app) app.inert = true;
  vwRO.observe($("vwPaper")); fitViewer(); requestAnimationFrame(fitViewer);
  const v = c.querySelector(".viewer"); if (v) v.focus();
}
function fitViewer() {
  const body = $("vwBody"), fr = $("vwFrame"), sc = $("vwScale"), p = $("vwPaper"); if (!body || !fr || !S.viewer) return;
  const pad = parseFloat(getComputedStyle(body).paddingLeft) || 0, avail = body.clientWidth - pad * 2, small = avail < 794;
  const k = S.viewer.zoom ? 1 : Math.min(1, avail / 794);
  sc.style.transform = `scale(${k})`; fr.style.width = (794 * k) + "px"; fr.style.height = (p.offsetHeight * k) + "px";
  fr.classList.toggle("wide", 794 * k > avail);
  const zb = document.querySelector('[data-act="vw-zoom"]');
  if (zb) { const t = S.viewer.zoom ? "Sayfaya sığdır" : "Yakınlaştır"; zb.hidden = !small; zb.setAttribute("aria-pressed", String(!!S.viewer.zoom)); zb.setAttribute("aria-label", t); zb.innerHTML = `${S.viewer.zoom ? ICON.grid : ICON.search}<span class="lbl">${t}</span>`; }
}
function closeViewer(focusBack) {
  const c = $("confirm"), app = document.querySelector(".app"); if (!S.viewer) return;
  S.viewer = null; vwRO.disconnect(); c.hidden = true; c.innerHTML = ""; c.classList.remove("vw-open"); if (app) app.inert = false;
  if (focusBack) { const t = document.querySelector("#top .cart"); if (t) t.focus(); }
}
window.addEventListener("resize", () => { if (S.viewer) fitViewer(); });
/* "Devam et": proforma oluşturucuda kalınan adım açılır ve form görünür alana getirilir (firma ya da cari eksikse 1. adım) */
function continueDraft() {
  const q = S.q; if (!q) return;
  let n = Math.min(3, Math.max(1, S.step || 1)); if (n > 1 && step1Missing(q).length && !q.sample) n = 1;
  S.step = n; S.hsErr = ""; saveDraft();
  if (S.view !== "proforma") { S.afterRoute = landOnForm; go("proforma"); } else { renderMain(); landOnForm(); }
}
function landOnForm() {
  const f = $("formCard"); if (!f) return;
  f.classList.remove("step-in"); void f.offsetWidth; f.classList.add("step-in");
  f.scrollIntoView({block: "start", behavior: scrollMode()}); focusHeading("#formCard h2");
}
function closeMenu(focusBack) {
  const was = S.menu; S.menu = null; renderTop();
  if (focusBack) { const t = document.querySelector(was === "draft" ? "#top .cart" : "#top .avatar"); if (t) t.focus(); }
}
/* yumuşak kaydırma yalnızca hareket azaltma istenmediğinde (stil dosyasındaki kural JavaScript kaydırmasına ulaşmaz) */
const scrollMode = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
/* Odaklı öğeyi yeniden çizimden sonra bulmak için seçici: kimlik, yoksa data-act ve ilgili data-* değerleri */
function focusKey(a) {
  if (!a || a === document.body || !a.tagName) return null;
  if (a.id) return "#" + CSS.escape(a.id);
  const d = a.dataset || {}; if (!d.act && !d.stage) return null;
  let k = a.tagName.toLowerCase();
  ["act", "id", "k", "v", "i", "n", "stage", "src"].forEach(x => { if (d[x] != null) k += `[data-${x}="${CSS.escape(d[x])}"]`; });
  return k;
}
const visibleOf = key => { const all = [...document.querySelectorAll(key)]; return all.find(n => n.offsetParent !== null) || all[0] || null; };
/* Yeniden çizim odağı kaybettirmez: klavye kullanıcısı işlem yaptığı denetimde kalır */
function keepFocus(el, fn) {
  const a = document.activeElement, key = a && el.contains(a) ? focusKey(a) : null; let s0 = null, s1 = null;
  try { s0 = a.selectionStart; s1 = a.selectionEnd; } catch (e) {}
  const top = el.scrollTop; fn(); el.scrollTop = top;
  if (key) { const n = visibleOf(key); if (n) { n.focus({preventScroll: true}); try { if (s0 != null) n.setSelectionRange(s0, s1); } catch (e) {} } }
}
/* görünüm ya da adım değişince odak yeni bölümün başlığına gider */
function focusHeading(sel) {
  const h = document.querySelector(sel); if (!h) return;
  if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
  h.focus({preventScroll: true});
}
const viewTitle = () => { const n = NAV.find(x => x[0] === S.view); return (S.view === "yonetim" ? "Yönetim" : S.view === "hesap" ? "Hesap ayarları" : n ? n[1] : "") + (S.view === "proforma" && S.q ? ` · Adım ${S.step}/3` : ""); };
function renderMain() {
  const m = $("main"); if (!m) return;
  keepFocus(m, () => { m.innerHTML = (S.view === "pano" ? pagePano() : S.view === "proformalar" ? pageQuotes() : S.view === "alicilar" ? pageCari() : S.view === "yonetim" ? pageAdmin() : S.view === "urunler" ? pageLib() : S.view === "firma" ? pageFirm() : S.view === "hesap" ? pageAccount() : pageProforma()).replace('<div class="page">', '<div class="page">' + annBar()); });
  paperRO.disconnect(); const p = $("paper"); if (p) paperRO.observe(p); fitPaper();
  const vt = viewTitle(); document.title = (vt ? vt + " · " : "") + "NDL Proforma";
  syncInvalid(m);
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
  /* firma veya cari seçilmemişse (ör. eski bir taslak) önce 1. adım */
  if (S.step > 1 && S.q && !S.q.sample && step1Missing(S.q).length) S.step = 1;
  const n = S.step;
  return `<div class="page"><div class="split"><aside class="intro" id="intro">${introHtml()}</aside>
    <section class="card" id="formCard">${sampleBanner()}${savedBanner()}${n === 1 ? formBuyer() : n === 2 ? formProducts() : formReview()}</section></div>
    ${n === 3 ? previewCard() : itemsCard()}</div>`;
}
function introHtml() {
  const q = S.q, hasCo = companyChosen(q), hasCari = cariChosen(q), ready = hasCo && hasCari, locked = k => k > 1 && !ready && !q.sample;
  const coLbl = hasCo ? (sellerOf(q).company || coName(companyById(q.companyId))) : "";
  const steps = [[1, "Firma ve Cari Kart", ready ? coLbl + " → " + q.buyer : hasCari ? "Firma seçilmedi" : hasCo ? coLbl + " · cari seçilmedi" : "Seçilmedi"], [2, "Ürün Ekle", q.items.length ? q.items.length + " kalem" : "Kalem yok"], [3, "Önizle ve Oluştur", q.saved ? (q.dirty ? "Kaydedilmemiş değişiklik" : "Kaydedildi") : "Taslak"]];
  const done = k => ({1: ready, 2: q.items.length > 0, 3: q.saved && !q.dirty})[k];
  return `<div class="eyebrow">${esc(hasCari ? q.buyer : "Cari kart seçilmedi")}</div><h1>${q.saved ? "Proforma Düzenle" : "Proforma Oluştur"}</h1>
   <p class="lead">Firmayı ve cari kartı seçin, lifti yapılandırıp proformaya ekleyin, önizleyip oluşturun.</p><hr>
   <dl class="meta"><div><dt>Proforma no</dt><dd class="num">${q.no ? esc(q.no) : `<span class="muted" style="font-weight:500">oluşturulunca verilir</span>`}</dd></div><div><dt>Tarih</dt><dd>${fmtDate(q.date)}</dd></div><div><dt>Durum</dt><dd>${statusTag(q)}</dd></div>${q.saved ? `<div><dt>Aşama</dt><dd>${stageTag(q)}</dd></div>` : ""}
     <div><dt>Marka · dil</dt><dd>${brandOf(q)} · ${LANG_BY[langOf(q)]}</dd></div>
     <div><dt>Toplam (${q.currency})</dt><dd class="amount">${money(qTotal(q), q.currency)}</dd></div></dl>
   <ol class="steps">${steps.map(([k, t, s]) => `<li><button class="${S.step === k ? "cur" : done(k) ? "done" : ""}${locked(k) ? " locked" : ""}" data-act="step" data-n="${k}"${S.step === k ? ' aria-current="step"' : ""}${locked(k) ? ` aria-disabled="true" title="${step1Msg(q)}"` : ""}><span class="n">${done(k) && S.step !== k ? ICON.check : k}</span><span style="min-width:0"><span class="t">${t}</span><span class="s">${esc(s)}</span></span></button></li>`).join("")}</ol>
   ${!S.companies.length ? `<div class="note-card"><b>Firma tanımlı değil</b>${isAdmin() ? `Proformayı kesecek firmaları (ör. Düelsan, Ahkos Otomotiv) bir kez ekleyin; her proformada bunlardan biri seçilir.<a class="link" href="#firma">Firma ekle ${ICON.right}</a>` : "Proforma oluşturmak için yöneticinin firma tanımlaması gerekiyor."}</div>` : ""}`;
}
function refreshIntro() { const el = $("intro"); if (el) el.innerHTML = introHtml(); }
function fld(id, k, label, tag, cls, attrs = "") { return `<div class="fld ${cls}"><label for="${id}">${label}${tag ? ` <em>${tag}</em>` : ""}</label><input id="${id}" data-q="${k}" value="${esc(S.q[k])}"${attrs}></div>`; }
const cariList = () => [...S.customers].sort((a, b) => String(a.name).localeCompare(String(b.name), "tr"));
const cariById = id => S.customers.find(c => c.id === id);
const isBlank = q => !q.saved && !q.sample && !q.buyer.trim() && !q.items.length;
function sampleBanner() {
  if (!S.q.sample) return "";
  return `<div class="banner amber"><span class="dc">${ICON.alert}</span><div class="tx"><b>Örnek şablon</b>Firma ve ürün bilgileri hayalidir, fiyatlar yer tutucudur. Kendi alıcınızı ve ürünlerinizi girerek kullanın.</div><button class="btn sm" data-act="tpl-clear">${ICON.x} Şablonu kapat</button></div>`;
}
function savedBanner() {
  const q = S.q; if (!q.saved) return "";
  const card = cariById(q.customerId);
  return `<div class="banner${q.dirty ? " amber" : ""}"><span class="dc">${q.dirty ? ICON.alert : ICON.check}</span><div class="tx"><b>${esc(q.no)} · kayıtlı proforma</b>${q.dirty ? "Bu kayıtta kaydedilmemiş değişiklik var. Kaydetmek için Önizle ve Oluştur adımında “Değişiklikleri Kaydet” deyin." : "Bu kaydı düzenliyorsunuz; değişiklikler aynı numarayla kaydedilir. Yeni bir proforma için aşağıdaki düğmeleri kullanın."}</div>
    ${card ? `<button class="btn sm" data-act="new-same">${ICON.plus} ${esc(card.code)} için yeni proforma</button>` : ""}<button class="btn sm" data-act="dup" data-id="cur">${ICON.copy} Tekrarla</button><button class="btn sm" data-act="new">${ICON.plus} Boş proforma</button></div>`;
}
function templateCard() {
  return `<div class="tpl"><div><b>Örnek şablonla görmek ister misiniz?</b><span>Hayali bir firma ve üç ürünle doldurulmuş bir proforma açılır. Gerçek bir müşteri ya da teklif içermez.</span></div><button class="btn" data-act="tpl-open">${ICON.eye} Örnek şablonu aç</button></div>`;
}
function cariFields(e, need) {
  const f = (k, label, cls = "", attrs = "") => `<div class="fld ${cls}"><label for="ce_${k}">${label}</label><input id="ce_${k}" data-ce="${k}" value="${esc(e[k])}"${attrs}${need && k === "name" && !String(e.name).trim() ? ' class="need"' : ""}></div>`;
  return `<div class="fgrid">
    ${f("code", "Cari kodu", "", ' class="num" maxlength="20"')}${f("name", "Firma unvanı <em>proformada</em>", "s3", ' placeholder="Alıcı firmanın tam unvanı" autocomplete="organization"')}
    ${f("taxOffice", "Vergi dairesi", "s2")}${f("taxId", "Vergi no", "s2", ' inputmode="numeric"')}
    <div class="fld s4"><label for="ce_address">Adres <em>proformada</em></label><textarea id="ce_address" data-ce="address" rows="2" placeholder="Cadde, mahalle, posta kodu">${esc(e.address)}</textarea></div>
    ${f("city", "Şehir")}${f("country", "Ülke", "", ' placeholder="Örn. TÜRKİYE"')}
    <div class="fld s2"><label for="ce_currency">Para birimi</label><select id="ce_currency" data-ce="currency">${Object.keys(CUR).map(k => opt(k, e.currency, k + " (" + CUR[k] + ")")).join("")}</select></div>
    ${f("contact", "Yetkili kişi", "s2", ' autocomplete="name"')}${f("phone", "Telefon", "", ' inputmode="tel"')}${f("email", "E-posta", "", ' type="email"')}
    ${f("payment", "Varsayılan ödeme şekli", "s2", ' list="dlPay"')}${f("delivery", "Varsayılan teslim şekli", "s2", ' list="dlDel"')}
    <div class="fld s2"><label for="ce_lang">Proforma dili <em>yeni proformalarda</em></label><select id="ce_lang" data-ce="lang"><option value=""${LANG_BY[e.lang] ? "" : " selected"}>Ülkeye göre (Türkiye → Türkçe)</option>${LANGS.map(l => opt(l.k, e.lang, l.l)).join("")}</select></div>
    <div class="fld s4"><label for="ce_notes">Notlar <em>yalnızca kayıtta</em></label><textarea id="ce_notes" data-ce="notes" rows="2">${esc(e.notes)}</textarea></div>
   </div>${dlist("dlPay", termList("payment", cariLang(e)))}${dlist("dlDel", DELIVERY)}`;
}
function cariSummary(q) {
  const line = (k, v) => v ? `<div class="kv"><span>${k}</span><b>${esc(v)}</b></div>` : "";
  return `<div class="cari-sum"><div class="cs-head">${cariById(q.customerId) ? `<span class="tag blue">${esc(cariById(q.customerId).code || "—")}</span>` : ""}<b>${esc(q.buyer)}</b></div>
    <p>${esc(addrLine(q)) || "Adres girilmemiş"}</p>
    <div class="cs-grid">${line("Vergi dairesi", q.taxOffice)}${line("Vergi no", q.taxId)}${line("Yetkili", q.contact)}${line("Telefon", q.phone)}${line("E-posta", q.email)}</div></div>`;
}
/* 1. adım: proformayı kesen firma (ortak listeden, zorunlu) */
function coPick() {
  const q = S.q, cur = companyById(q.companyId), chosen = companyChosen(q) && !S.pick.co;
  if (chosen) {
    const st = sellerOf(q);
    return `<div class="card-h"><h2 class="ttl">Firma</h2><div class="acts"><button class="btn sm" data-act="pick-co-change">${ICON.firm} Değiştir</button></div></div>
      <div class="co-sum">${coLogo(cur || {logo: logoSrc(q), name: st.company})}<div><b>${esc(st.company || coName(cur) || "—")}</b><span>${esc([st.address, st.contact].filter(Boolean).join(" · ") || "Proformayı bu firma keser")}</span></div></div>`;
  }
  if (!S.companies.length) return `<div class="card-h"><h2 class="ttl">Firma Seçin</h2></div><div class="empty">${isAdmin() ? `Henüz firma yok. Proformayı kesecek firmaları (ör. Düelsan, Ahkos Otomotiv) ekleyin.<div><a class="btn blue" href="#firma">${ICON.plus} Firma ekle</a></div>` : "Yönetici henüz firma tanımlamadı. Proforma oluşturmak için yöneticinize başvurun."}</div>`;
  return `<div class="card-h"><h2 class="ttl">Firma Seçin</h2><span class="muted small">Proformayı hangi firma kesiyor?</span>${S.pick.co && companyChosen(q) ? `<div class="acts"><button class="btn ghost sm" data-act="pick-co-cancel">Vazgeç</button></div>` : ""}</div>
    <div class="pick-list co-list">${S.companies.map(c => `<button class="pick co${c.id === q.companyId ? " on" : ""}" data-act="pick-co" data-id="${esc(c.id)}">${coLogo(c)}<span class="pk-main"><b>${esc(coName(c))}</b><span>${esc(c.company || "—")}</span></span>${ICON.right}</button>`).join("")}</div>`;
}
/* 1. adım: marka. Ürün kodları (NDL 5010 ↔ DLP 5010) ve sağ üstteki logo buna göre basılır. */
function brandPick() {
  const b = brandOf(S.q);
  return `<div class="brand-pick"><div><span class="lbl" id="brandLbl">Marka</span><span class="muted small">Ürün kodları ve proformanın sağ üstündeki logo bu markayla basılır.</span></div>
    <div class="seg brand-seg" role="group" aria-labelledby="brandLbl">${BRANDS.map(k => `<button data-act="q-brand" data-v="${k}" aria-pressed="${b === k}"><img src="${BRAND_IMG[k]}" alt="">${k}</button>`).join("")}</div></div>`;
}
const step1Missing = q => [companyChosen(q) ? "" : "firma", cariChosen(q) ? "" : "cari kart"].filter(Boolean);
const step1Msg = q => { const m = step1Missing(q); return m.length === 2 ? "Önce firmayı ve cari kartı seçin" : m[0] === "firma" ? "Önce proformayı kesecek firmayı seçin" : "Önce bir cari kart seçin"; };
function formBuyer() {
  const q = S.q, P = S.pick, card = cariById(q.customerId);
  const top = (isBlank(q) && !q.companyId ? templateCard() : "") + coPick() + brandPick() + `<div class="blk-sep"></div>`;
  if (P.mode === "new" || P.mode === "edit") return `<div class="card-h"><h2 class="ttl">${P.mode === "new" ? "Yeni Cari Kart" : "Cari Kartı Düzenle"}</h2></div>${cariFields(S.cariEdit, S.cariTried)}
    <div class="card-f"><button class="btn ghost" data-act="pick-cancel">Vazgeç</button><div class="grow muted small">Kart kaydedilir ve bu proforma için seçilir.</div><div class="btns"><button class="btn blue" data-act="pick-save">${ICON.check} Kaydet ve Seç</button></div></div>`;
  if ((card || (q.saved && q.buyer.trim())) && P.mode !== "change") return `${top}<div class="card-h"><h2 class="ttl">Cari Kart</h2><div class="acts">${card ? `<button class="btn sm" data-act="pick-edit">${ICON.edit} Kartı düzenle</button>` : ""}<button class="btn sm" data-act="pick-change">${ICON.users} Değiştir</button></div></div>
    ${cariSummary(q)}${card ? "" : `<p class="hint" style="margin:12px 0 0">Bu proforma bir cari karta bağlı değil; bilgiler proformanın kendi kopyasından geliyor.</p>`}
    <div class="card-f"><div class="grow muted small">Proformadaki alıcı bilgileri bu karttan alınır.</div><div class="btns"><button class="btn blue" data-act="step" data-n="2">Devam: Ürün Ekle ${ICON.right}</button></div></div>`;
  const s = P.search.toLowerCase().trim(), list = cariList().filter(c => !s || [c.code, c.name, c.city, c.country, c.contact, c.taxId].join(" ").toLowerCase().includes(s));
  return `${top}<div class="card-h"><h2 class="ttl">Cari Kart Seçin</h2><span class="muted small">${S.customers.length} kart</span><div class="acts">${P.mode === "change" ? `<button class="btn ghost sm" data-act="pick-cancel">Vazgeç</button>` : ""}<button class="btn blue sm" data-act="pick-new">${ICON.plus} Yeni Cari Kart</button></div></div>
    ${S.customers.length ? `<div class="ico-in" style="margin-bottom:12px">${ICON.search}<input id="pickSearch" data-f="pick.search" value="${esc(P.search)}" placeholder="Kod, unvan, şehir veya vergi no ara" autocomplete="off"></div>
      <div class="pick-list">${list.map(c => `<button class="pick${c.id === q.customerId ? " on" : ""}" data-act="pick" data-id="${esc(c.id)}"><span class="tag blue">${esc(c.code || "—")}</span><span class="pk-main"><b>${esc(c.name)}</b><span>${esc([c.city, c.country].filter(Boolean).join(", ") || "—")}${c.contact ? " · " + esc(c.contact) : ""}</span></span>${ICON.right}</button>`).join("") || `<p class="empty-sm">Aramayla eşleşen cari kart yok.</p>`}</div>`
    : `<div class="empty">Henüz cari kart yok. Proformaya başlamak için ilk cari kartı oluşturun.<div><button class="btn blue" data-act="pick-new">${ICON.plus} Yeni Cari Kart</button></div></div>`}
    <div class="card-f"><div class="grow muted small">Proforma, seçtiğiniz cari kartın unvan ve adres bilgileriyle oluşturulur.</div></div>`;
}
function moneyIn(id, attr, val, need, ph = "0,00") { return `<div class="ico-in money">${ICON.coins}<input id="${id}" type="number" min="0" step="0.01" inputmode="decimal" ${attr} value="${esc(val)}" placeholder="${ph}"${need ? ' class="need"' : ""}><span class="sfx">${CUR[S.q.currency]}</span></div>`; }
function qtyHtml() { return `<div class="qty"><button data-act="qty" data-d="-1" aria-label="Azalt">−</button><input id="cqty" type="number" min="1" step="1" inputmode="numeric" data-c="qty" value="${esc(S.cfg.qty)}" aria-label="Adet"><button data-act="qty" data-d="1" aria-label="Artır">+</button></div>`; }
function formProducts() {
  const c = S.cfg, ed = c.edit != null && S.q.items[c.edit];
  return `<h2 class="sr-only">Ürün Ekle</h2><div class="tabs" role="tablist"><button role="tab" data-act="mode" data-v="lift" aria-selected="${c.mode === "lift"}">Lift</button><button role="tab" data-act="mode" data-v="spare" aria-selected="${c.mode === "spare"}">Yedek Parça</button></div>
    ${ed ? `<div class="edit-note"><span>${c.edit + 1}. kalemi düzenliyorsunuz · ${esc(itemInfo(ed, brandOf(S.q)).code)}</span><button class="link" data-act="cfg-cancel">Vazgeç</button></div>` : ""}
    ${c.mode === "lift" ? cfgLift() : cfgSpare()}
    <div class="card-f" id="cfgFoot">${cfgFootHtml()}</div>`;
}
function cfgLift() {
  const c = S.cfg, p = pById(c.pid), miss = S.cfgTried ? cfgMissing(c) : [], nd = k => miss.includes(k) ? "need" : "", B = brandOf(S.q);
  const lifts = products().filter(x => x.type === "LIFT" && (inBrand(x, B) || x.id === c.pid)), fam = {};
  lifts.forEach(x => { (fam[x.name] = fam[x.name] || []).push(x); });
  const caps = p ? (p.caps || []).map(String) : []; if (c.cap && !caps.includes(String(c.cap))) caps.push(String(c.cap));
  const cat = p ? liftSizes(p) : [], std = CATALOG_SIZES.filter(s => !cat.includes(s)), sv = c.sizeMode === "custom" ? "custom" : c.size;
  if (c.sizeMode === "std" && c.size && !cat.includes(c.size) && !std.includes(c.size)) std.push(c.size);
  const dis = p ? "" : " disabled", sz = s => s.replace("x", " × ") + " mm";
  return `<div class="cfg"><div class="fgrid">
    <div class="fld s2"><label for="c_pid">Lift modeli</label><select id="c_pid" data-c="pid" class="${nd("model")}"><option value="">${B} kütüphanesinden model seçin (${lifts.length})</option>${Object.entries(fam).map(([n, ps]) => `<optgroup label="${esc(bName(n, B))}">${ps.map(x => opt(x.id, c.pid, bCode(x.code, B) + "   ·   " + capRange(x))).join("")}</optgroup>`).join("")}</select></div>
    <div class="fld"><label for="c_cap">Kapasite</label><select id="c_cap" data-c="cap" class="${nd("kapasite")}"${dis}><option value="">${p && !caps.length ? "Tanımlı değil" : "Seçin"}</option>${caps.map(v => opt(v, c.cap, fmtInt(v) + " kg")).join("")}</select></div>
    <div class="fld"><label for="cqty">Adet</label>${qtyHtml()}</div>
    <div class="fld s2"><span class="lbl">Kapak türü</span><div class="seg ${nd("kapak türü")}" role="group" aria-label="Kapak türü">${MATS.map(m => `<button data-act="mat" data-v="${m.v}" aria-pressed="${c.mat === m.v}"${dis}>${swatch(m.v)}${m.l}</button>`).join("")}</div></div>
    <div class="fld s2"><span class="lbl">Powerpack voltajı</span><div class="seg ${nd("powerpack")}" role="group" aria-label="Powerpack voltajı">${VOLTS.map(v => `<button data-act="volt" data-v="${v.v}" aria-pressed="${c.volt === v.v}"${dis}>${v.l}</button>`).join("")}</div></div>
    <div class="fld s2"><label for="c_size">Platform boyutu</label><select id="c_size" data-c="sizeSel" class="${nd("boyut")}"${dis}><option value="">Boyut seçin</option>${cat.length ? `<optgroup label="Katalog ölçüleri · ${esc(bCode(p.code, B))}">${cat.map(s => opt(s, sv, sz(s))).join("")}</optgroup>` : ""}<optgroup label="Diğer katalog ölçüleri">${std.map(s => opt(s, sv, sz(s))).join("")}</optgroup><option value="custom"${sv === "custom" ? " selected" : ""}>Özel boyut gir…</option></select></div>
    ${c.sizeMode === "custom" ? `<div class="fld"><label for="cw">Genişlik (mm)</label><input id="cw" type="number" inputmode="numeric" min="300" max="5000" step="10" data-c="w" value="${esc(c.w)}" placeholder="2400"${S.cfgTried && !cfgSize(c) ? ' class="need"' : ""}></div>
      <div class="fld"><label for="cd">Uzunluk (mm)</label><input id="cd" type="number" inputmode="numeric" min="300" max="5000" step="10" data-c="d" value="${esc(c.d)}" placeholder="1800"${S.cfgTried && !cfgSize(c) ? ' class="need"' : ""}></div>` : ""}
    <div class="fld"><label for="cprice">Ana ürün birim fiyatı</label>${moneyIn("cprice", 'data-c="price"', c.price, S.cfgTried && !hasPrice(c.price))}</div>
    <div class="fld"><label for="c_note">Satır notu</label><select id="c_note" data-c="note">${NOTES.map(x => opt(x.v, c.note, x.l)).join("")}</select></div>
   </div>
   <div class="plate-wrap">${p && p.img ? `<figure class="pphoto sm"><img src="${esc(p.img)}" alt="${esc(bCode(p.code, B))}"></figure>` : ""}${p ? `<div class="model-card"><b>${esc(bCode(p.code, B))}</b><span>${esc(bName(p.name, B))}</span><small>${capRange(p)}${cat.length ? " · katalog: " + cat.map(s => s.replace("x", "×")).join(", ") : ""}</small></div>` : ""}
     <figure class="plate" id="plate">${plateSvg(cfgSize(c), c.mat)}</figure></div></div>
   <div class="optbox"><div class="lbl">Opsiyonlar <em>${c.opts.length ? c.opts.length + " seçili · fiyatları birim fiyata eklenir" : "isteğe bağlı · her birinin fiyatı ayrıca girilir"}</em></div>
    <div class="chips">${optionProducts(B).map(op => { const on = c.opts.some(o => o.oid === op.id); return `<button class="chip" data-act="opt" data-id="${op.id}" aria-pressed="${on}"${dis}>${on ? ICON.check : ICON.plus}${esc(bName(op.name, B))}</button>`; }).join("")}</div>
    ${c.opts.length ? `<div class="optsel">${c.opts.map((o, i) => `<div class="r"><span>${productImg(o.oid) ? `<img class="othumb" src="${esc(thumbOf(productImg(o.oid)))}" alt="">` : ""}${esc(optName(o, B))}</span>${moneyIn("opp_" + o.oid, `data-co="${i}" aria-label="${esc(optName(o, B))} fiyatı"`, o.price, S.cfgTried && !hasPrice(o.price), "Fiyat")}<button class="ibtn danger" data-act="opt" data-id="${o.oid}" title="Kaldır" aria-label="${esc(optName(o, B))} opsiyonunu kaldır">${ICON.x}</button></div>`).join("")}</div>` : ""}
   </div>`;
}
function cfgSpare() {
  const c = S.cfg, miss = S.cfgTried ? cfgMissing(c) : [], p = pById(c.pid), B = brandOf(S.q);
  const grp = t => products().filter(x => x.type === t && (inBrand(x, B) || x.id === c.pid));
  const og = (t, l) => grp(t).length ? `<optgroup label="${l}">${grp(t).map(x => opt(x.id, c.pid, bCode(x.code, B) + "   ·   " + bName(x.name, B))).join("")}</optgroup>` : "";
  return `<div class="fgrid">
    <div class="fld s2"><label for="c_pid">Parça</label><select id="c_pid" data-c="pid" class="${miss.includes("parça") ? "need" : ""}"><option value="">Parça seçin (${grp("SPARE").length + grp("OTHER").length})</option>${og("SPARE", "Yedek parça")}${og("OTHER", "Diğer")}</select></div>
    <div class="fld"><label for="cqty">Adet</label>${qtyHtml()}</div>
    <div class="fld"><label for="cprice">Birim fiyat</label>${moneyIn("cprice", 'data-c="price"', c.price, S.cfgTried && !hasPrice(c.price))}</div>
    <div class="fld s2"><label for="c_note">Satır notu</label><select id="c_note" data-c="note">${NOTES.map(x => opt(x.v, c.note, x.l)).join("")}</select></div>
    ${p ? `<div class="fld s2"><span class="lbl">Seçili parça</span><div class="tags" style="margin:0;min-height:42px;align-items:center">${p.img ? `<img class="sthumb" src="${esc(thumbOf(p.img))}" alt="">` : ""}<span class="tag blue">${esc(bCode(p.code, B))}</span><b>${esc(bName(p.name, B))}</b></div></div>` : ""}
   </div>`;
}
function cfgFootHtml() {
  const c = S.cfg, p = pById(c.pid), cur = S.q.currency;
  if (!p) return `<div class="grow sum">${c.mode === "lift" ? "Kütüphaneden bir lift modeli seçerek başlayın." : "Listeden bir parça seçin."}</div>
    <div class="btns">${S.q.items.length ? `<button class="btn" data-act="step" data-n="3">${ICON.eye} Önizle ve Oluştur</button>` : ""}</div>`;
  const miss = cfgMissing(c), unit = cfgUnit(c), qty = Math.max(0, Number(c.qty) || 0), ot = c.mode === "lift" ? c.opts.reduce((a, o) => a + num(o.price), 0) : 0;
  const calc = c.mode === "lift" && c.opts.length ? `${money(num(c.price), cur)} + ${c.opts.length} opsiyon ${money(ot, cur)} = ${money(unit, cur)} × ${qty}` : `${money(unit, cur)} × ${qty}`;
  return `<div class="grow sum"><span class="calc">${calc}</span><span class="big">${money(unit * qty, cur)}</span>${miss.length ? `<span id="cfgMiss" class="${S.cfgTried ? "miss" : ""}">Eksik: ${miss.join(", ")}</span>` : `<span class="ok">Eklemeye hazır</span>`}</div>
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
    const inf = itemInfo(it, brandOf(q)), open = S.openRows.has(i);
    const tags = [it.cap && `<span class="tag blue">${fmtInt(it.cap)} kg</span>`, it.mat && `<span class="tag grey">${esc(matLabel(it.mat))}</span>`, it.size && `<span class="tag grey num">${esc(it.size.replace("x", " × "))}</span>`,
      it.volt && `<span class="tag amber">${esc(voltLabel(it.volt))}</span>`, it.opts.length && `<span class="tag green">+${it.opts.length} opsiyon</span>`, it.note && `<span class="tag solid-amber">${esc(noteLabel(it.note))}</span>`].filter(Boolean).join("");
    return `<tr class="row${isPromo(it) ? " promo" : ""}${S.flash === i ? " flash" : ""}"><td class="c muted">${i + 1}</td><td class="thumb sm">${itemPhotos(it).main ? `<img src="${esc(thumbOf(itemPhotos(it).main))}" alt="" loading="lazy">` : ""}</td><td class="code">${esc(inf.code)}</td><td><b>${esc(inf.name)}</b>${tags ? `<div class="tags">${tags}</div>` : ""}</td>
      <td class="r">${esc(it.qty)}</td><td class="r">${missingPrice(it) ? `<span class="tag red">Fiyat eksik</span>` : money(unitPrice(it), c)}</td><td class="r strong">${money(lineTotal(it), c)}</td>
      <td><div class="acts"><button class="btn sm" data-act="row-open" data-i="${i}" aria-expanded="${open}">${open ? ICON.minus : ICON.plus} Detay</button>
        <button class="ibtn" data-act="li-edit" data-i="${i}" title="Düzenle" aria-label="${i + 1}. kalemi düzenle">${ICON.edit}</button>
        <button class="ibtn" data-act="li-up" data-i="${i}" title="Yukarı" aria-label="Yukarı taşı"${i === 0 ? " disabled" : ""}>${ICON.up}</button>
        <button class="ibtn" data-act="li-down" data-i="${i}" title="Aşağı" aria-label="Aşağı taşı"${i === q.items.length - 1 ? " disabled" : ""}>${ICON.down}</button>
        <button class="ibtn danger" data-act="li-del" data-i="${i}" title="Sil" aria-label="${i + 1}. kalemi sil">${ICON.trash}</button></div></td></tr>
      ${open ? `<tr class="detail"><td colspan="8"><div class="detail-in">${kv("Ana ürün fiyatı", money(basePrice(it), c))}${it.opts.map(o => kv("+ " + optName(o, brandOf(q)), money(num(o.price), c))).join("")}${kv("Birim fiyat", money(unitPrice(it), c), "blue")}${kv("Adet", esc(it.qty))}${kv("Tutar", money(lineTotal(it), c), "blue")}${it.size ? kv("Platform", esc(sizeLabel(it.size))) : ""}</div></td></tr>` : ""}`;
  }).join("");
  return `<section class="card" id="bottomCard"><div class="card-h"><h2 class="ttl">Proforma Kalemleri</h2><span class="muted small">${q.items.length} kalem</span>
     <div class="acts">${q.items.length ? outBtns("cur") : ""}<button class="btn blue" data-act="step" data-n="3"${q.items.length ? "" : " disabled"}>${ICON.eye} Önizle ve Oluştur</button></div></div>
    ${q.items.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="c">No</th><th class="thumb sm"><span class="sr-only">Fotoğraf</span></th><th>Kod</th><th>Ürün</th><th class="r">Adet</th><th class="r">Birim fiyat</th><th class="r">Tutar</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="total-line" style="margin-top:16px">Toplam (${c}) <b>${money(qTotal(q), c)}</b></div>`
    : `<div class="empty">Henüz kalem yok. Yukarıda bir lift seçip <b>Proformaya Ekle</b> deyin.${isBlank(q) ? `<div><button class="btn" data-act="tpl-open">${ICON.eye} Örnek şablonu aç</button></div>` : ""}</div>`}</section>`;
}
function formReview() {
  const q = S.q, st = sellerOf(q), mp = q.items.filter(missingPrice).length, iban = st["iban" + q.currency], ok = q.saved && !q.dirty, lang = langOf(q);
  const chk = (cls, html) => `<span class="check ${cls}">${cls === "ok" ? ICON.check : ICON.alert}<span>${html}</span></span>`;
  /* dil uyarıları: diğer dilde kalmış şartlar, Türkçesi olmayan firma metinleri ve ürün adları */
  const foreign = TERM_KEYS.filter(k => termForeign(k, q[k], lang));
  const noTrSeller = lang === "tr" && companyChosen(q) ? SELLER_TR.filter(k => str(st[k]).trim() && !str(st[k + "Tr"]).trim() && k !== "origin") : [];
  const noTr = lang === "tr" ? noTrName(q) : 0;
  let main;
  if (ok) main = outBtns("cur");
  else main = `<button class="btn blue" data-act="create">${ICON.check} ${q.saved ? "Değişiklikleri Kaydet" : "Proformayı Oluştur"}</button>`;
  const tl = t => lang === "tr" ? (TITLE_TR[t] || t) : t;
  return `<div class="card-h"><h2 class="ttl">Belge Bilgileri</h2></div>
   <div class="fgrid">
    <div class="fld s2"><span class="lbl" id="langLbl">Proforma dili <em>başlıklar, şartlar ve ürün adları</em></span><div class="seg lang-seg" role="group" aria-labelledby="langLbl">${LANGS.map(l => `<button data-act="q-lang" data-v="${l.k}" aria-pressed="${lang === l.k}">${l.l}</button>`).join("")}</div></div>
    <div class="fld"><label for="r_title">Belge başlığı</label><select id="r_title" data-q="title">${TITLES.map(t => opt(t, q.title, tl(t))).join("")}${TITLES.includes(q.title) ? "" : opt(q.title, q.title)}</select></div>
    <div class="fld"><label for="r_cur">Para birimi</label><select id="r_cur" data-q="currency">${Object.keys(CUR).map(k => opt(k, q.currency, k + " (" + CUR[k] + ")")).join("")}</select></div>
    <div class="fld"><span class="lbl">Proforma no <em>sistem verir</em></span><div class="sysno">${q.no ? `${ICON.lock}<b class="num">${esc(q.no)}</b>` : `<span>Oluşturulunca verilir</span>`}</div></div>
    <div class="fld"><label for="r_date">Tarih</label><div class="ico-in">${ICON.cal}<input id="r_date" type="date" data-q="date" value="${esc(q.date)}"></div></div>
    <div class="fld s2"><label for="r_pay">Ödeme şekli</label><input id="r_pay" data-q="payment" list="dlPay" value="${esc(q.payment)}"></div>
    <div class="fld"><label for="r_del">Teslim şekli</label><input id="r_del" data-q="delivery" list="dlDel" value="${esc(q.delivery)}"></div>
    <div class="fld"><label for="r_val">Geçerlilik süresi</label><input id="r_val" data-q="validity" list="dlVal" value="${esc(q.validity)}"></div>
    <div class="fld s2"><label for="r_dt">Sevkiyat süresi</label><input id="r_dt" data-q="dtime" list="dlDt" value="${esc(q.dtime)}"></div>
    ${prepSwitch(q)}
    <p class="hint s4" style="margin:0">Şartları listeden seçebilir ya da serbestçe yazabilirsiniz. Listedeki şartlar dil değiştirilince kendiliğinden çevrilir; serbest yazılan metin olduğu gibi kalır.</p>
    ${hsField(q)}
   </div>
   <div class="checks">${companyChosen(q) ? chk("ok", "Firma: " + esc(st.company || coName(companyById(q.companyId)))) : chk("bad", `Firma seçilmedi · <button class="link" data-act="step" data-n="1">Seç</button>`)}
     ${q.customerId || (q.saved && q.buyer.trim()) ? chk("ok", "Cari: " + esc(q.buyer)) : chk("bad", `Cari kart seçilmedi · <button class="link" data-act="step" data-n="1">Seç</button>`)}
     ${q.items.length ? chk("ok", q.items.length + " kalem") : chk("bad", `Kalem yok · <button class="link" data-act="step" data-n="2">Ekle</button>`)}
     ${mp ? chk("warn", mp + " kalemde fiyat eksik") : ""}
     ${hsList(q).length ? chk("ok", "HS: " + esc(hsText(q))) : chk("warn", `HS kodu girilmedi · proformada boş kalır`)}
     ${!companyChosen(q) ? "" : iban ? chk("ok", q.currency + " IBAN tanımlı") : chk("warn", `Seçili firmada ${q.currency} IBAN tanımlı değil · ${isAdmin() ? `<a href="#firma">Ekle</a>` : "yöneticiye bildirin"}`)}
     ${foreign.length ? chk("warn", `${foreign.map(k => TERM_LABEL[k]).join(", ")} ${lang === "tr" ? "İngilizce" : "Türkçe"} yazılmış · <button class="link" data-act="q-lang" data-v="${lang}" data-fix="1">Çevir</button>`) : ""}
     ${noTrSeller.length ? chk("warn", `Firmanın Türkçe ${noTrSeller.map(k => ({since: "logo altı yazısı", brandNote: "marka logosu altı yazısı", warranty: "garanti notu"})[k]).join(", ")} yok · İngilizcesi basılır${isAdmin() ? ` · <a href="#firma">Ekle</a>` : ""}`) : ""}
     ${noTr ? chk("warn", `${noTr} kalemin Türkçe adı yok · İngilizce adıyla basılır${isAdmin() ? ` · <a href="#urunler">Ürünler</a>` : ""}`) : ""}</div>
   ${dlist("dlPay", termList("payment", lang))}${dlist("dlDel", DELIVERY)}${dlist("dlVal", termList("validity", lang))}${dlist("dlDt", termList("dtime", lang))}
   <div class="card-f"><button class="btn ghost" data-act="step" data-n="2">${ICON.left} Ürünler</button><div class="grow sum" style="text-align:right">${ok ? "Kayıtlı" : q.saved ? "Kaydedilmemiş değişiklik var" : "Oluşturunca sistem numarası verilir ve cari kartın kayıtlarına eklenir"}</div><div class="btns">${main}</div></div>`;
}
/* hazırlayan: hesap ayarlarındaki ad ve soyad; proformada gösterilip gösterilmeyeceği seçilir */
function prepSwitch(q) {
  const p = preparerOf(q), on = q.showPreparer !== false, lbl = OUT[langOf(q)].prep;
  return `<div class="fld s4"><label class="switch"><input type="checkbox" role="switch" data-qb="showPreparer"${on ? " checked" : ""}${p ? "" : " disabled"}><span class="sw-t" aria-hidden="true"></span>
    <span class="tx"><b>Hazırlayanı proformada göster</b><span>${p ? `${esc(prepText(p))} · ${on ? `“${lbl}” satırında basılır` : "proformada basılmaz, yalnızca kayıtta tutulur"}` : `Önce <a href="#hesap">Hesap ayarlarından</a> adınızı ve soyadınızı girin.`}</span></span></label></div>`;
}
/* HS kodları: birden çok kod; Enter, virgül ya da Ekle ile eklenir. Öneriler bu hesabın önceki proformalarından gelir. */
function hsSuggest(q) {
  const cnt = {}, have = new Set(hsList(q).map(hsKey));
  S.quotes.forEach(x => hsList(x).forEach(h => { const k = hsKey(h); if (!have.has(k)) (cnt[k] = cnt[k] || {h, n: 0}).n++; }));
  return Object.values(cnt).sort((a, b) => b.n - a.n).slice(0, 6).map(c => c.h);
}
function hsHint(q) {
  if (S.hsErr) return esc(S.hsErr);
  const sug = hsSuggest(q);
  return sug.length && hsList(q).length < HS_MAX ? `Son kullanılanlar: ${sug.map(c => `<button class="chip xs" data-act="hs-sug" data-v="${esc(c)}">${ICON.plus}${esc(c)}</button>`).join("")}` : "Enter ya da virgülle ekleyin. Rakam ve nokta kullanılabilir (4–14 rakam).";
}
function hsField(q) {
  const codes = hsList(q), full = codes.length >= HS_MAX;
  return `<div class="fld s4"><span class="lbl" id="hsLbl">HS kodları (GTİP) <em>birden çok kod girilebilir · proformada virgülle ayrılarak basılır</em></span>
    <div class="hs-box">${codes.map((c, i) => `<span class="hs-chip"><b class="num">${esc(c)}</b><button data-act="hs-del" data-i="${i}" title="Kaldır" aria-label="${esc(c)} kodunu kaldır">${ICON.x}</button></span>`).join("")}
      ${full ? `<span class="hint">En fazla ${HS_MAX} kod</span>` : `<input id="r_hs" class="hs-in${S.hsErr ? " need" : ""}"${S.hsErr ? ' aria-invalid="true"' : ""} inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="${codes.length ? "Başka kod ekle" : "Örn. 8428.90"}" aria-labelledby="hsLbl" aria-describedby="hsHint">
      <button class="btn sm" data-act="hs-add">${ICON.plus} Ekle</button>`}</div>
    <span class="hint${S.hsErr ? " err" : ""}" id="hsHint">${hsHint(q)}</span></div>`;
}
function addHs(raw) {
  const q = S.q, parts = String(raw || "").split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);
  if (!parts.length) return true;
  const bad = parts.filter(x => !normHs(x)), list = hsList(q).slice(); let dup = 0, over = 0, added = 0;
  parts.map(normHs).filter(Boolean).forEach(h => { if (list.some(x => hsKey(x) === hsKey(h))) dup++; else if (list.length >= HS_MAX) over++; else { list.push(h); added++; } });
  if (added) { q.hsCodes = list; touch(); }
  /* geçerli kodlar eklenir; hatalı kısım düzeltilmek üzere kutuda kalır, hata alanın hemen altında yazar */
  S.hsErr = bad.length ? `“${bad[0]}” geçerli bir HS kodu değil. 4–14 rakam girin; nokta kullanılabilir (ör. 8428.90).` : "";
  renderMain();
  const inp = $("r_hs"); if (inp) { inp.value = bad.join(", "); inp.focus(); }
  if (bad.length) announce(S.hsErr, true);
  else if (over) toast("En fazla " + HS_MAX + " HS kodu girilebilir");
  else if (dup) toast(dup === parts.length ? "Bu kod zaten ekli" : "Tekrarlanan kodlar atlandı");
  return !bad.length;
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

/* ---------- teklif aşamaları (arayüz) ---------- */
const stageTag = q => { const s = STAGE_BY[stageOf(q)]; return `<span class="tag ${s.tag}">${esc(s.l)}</span>`; };
const isExpired = x => { const e = expiry(x); return !!e && e.days < 0; };
function expiryTag(x) {
  const e = expiry(x); if (!e || e.days > 3) return "";
  return e.days < 0 ? `<span class="tag red" title="Geçerlilik süresi ${fmtDate(e.until)} tarihinde doldu">${ICON.clock}Süresi doldu</span>`
    : `<span class="tag amber" title="Geçerlilik süresi ${fmtDate(e.until)} tarihinde doluyor">${ICON.clock}${e.days === 0 ? "Bugün doluyor" : e.days + " gün kaldı"}</span>`;
}
function ago(ts) { if (!ts) return ""; const d = Math.floor((new Date(today() + "T23:59:59") - ts) / 864e5); return d <= 0 ? "bugün" : d === 1 ? "dün" : d + " gün önce"; }
function stagePick(x) {
  const k = stageOf(x);
  return `<span class="stage-pick st-${k}"><i class="dot" aria-hidden="true"></i><select data-stage="${esc(x.id)}" aria-label="${esc(x.no)} aşaması" title="${esc(STAGE_BY[k].d)}">${STAGES.map(s => opt(s.k, k, s.l)).join("")}</select></span>`;
}
const stageLogOf = x => (Array.isArray(x.stageLog) && x.stageLog.length) ? x.stageLog : [{k: stageOf(x), at: x.stageAt || x.createdAt || 0}];
/* aşama değişikliği anında görünür, arka planda kaydedilir; kaydedilemezse geri alınır */
async function putQuoteRow(x) {
  const prev = S.quotes.find(z => z.id === x.id);
  upsertLocal(S.quotes, x); syncOpenQuote(x); renderMain();
  try {
    const d = JSON.parse(JSON.stringify(x)); delete d.id;
    const stored = await Store.put("quote", x.id, d);
    if (stored) { const y = Object.assign({id: x.id}, stored); upsertLocal(S.quotes, y); syncOpenQuote(y); }
    return true;
  } catch (e) { if (prev) { upsertLocal(S.quotes, prev); syncOpenQuote(prev); } renderMain(); toastErr("Aşama kaydedilemedi: " + authError(e)); return false; }
}
function syncOpenQuote(x) {
  if (!S.q || S.q.id !== x.id || !S.q.saved) return;
  ["stage", "stageAt", "stageLog"].forEach(k => { if (x[k] === undefined) delete S.q[k]; else S.q[k] = JSON.parse(JSON.stringify(x[k])); });
  saveDraft();
}
async function setStage(id, k) {
  const x = S.quotes.find(z => z.id === id); if (!x || !STAGE_BY[k] || stageOf(x) === k) return;
  const prev = {stage: x.stage, stageAt: x.stageAt, stageLog: x.stageLog}, at = Date.now();
  S.qFlash = id; clearTimeout(setStage._t); setStage._t = setTimeout(() => { if (S.qFlash === id) S.qFlash = null; }, 1700);
  const pending = putQuoteRow(Object.assign(JSON.parse(JSON.stringify(x)), {stage: k, stageAt: at, stageLog: [...stageLogOf(x), {k, at}].slice(-30)}));
  const row = [...document.querySelectorAll(".qtbl tr.row.flash")].find(r => r.offsetParent !== null);
  if (row) row.scrollIntoView({block: "nearest", behavior: scrollMode()});
  const ok = await pending;
  if (ok) toast(`${x.no || "Proforma"} · ${STAGE_BY[k].l}`, () => {
    const cur = S.quotes.find(z => z.id === id); if (!cur) return;
    const y = JSON.parse(JSON.stringify(cur)); ["stage", "stageAt", "stageLog"].forEach(f => { if (prev[f] === undefined) delete y[f]; else y[f] = JSON.parse(JSON.stringify(prev[f])); });
    putQuoteRow(y);
  });
}

/* ---------- KAYITLAR sayfası ---------- */
function filteredQuotes(anyStage) {
  const s = S.qSearch.toLowerCase().trim();
  return S.quotes.filter(x => (!s || [x.no, x.buyer, x.country, x.city, x.address, x.title, brandOf(x)].join(" ").toLowerCase().includes(s))
    && (!S.qCari || x.customerId === S.qCari) && (!S.qCur || x.currency === S.qCur) && (!S.qBrand || brandOf(x) === S.qBrand) && (!S.qFrom || String(x.date) >= S.qFrom) && (!S.qTo || String(x.date) <= S.qTo)
    && (anyStage || !S.qStage || (S.qStage === "expired" ? isExpired(x) : stageOf(x) === S.qStage)));
}
const byDateDesc = (a, b) => String(b.date).localeCompare(String(a.date)) || String(b.no).localeCompare(String(a.no), "tr", {numeric: true});
const TITLE_SHORT = {"PROFORMA INVOICE": "Proforma", "REVISED PROFORMA INVOICE": "Revize proforma", "QUOTATION": "Teklif", "PRICE OFFER": "Fiyat teklifi"};
/* süreç şeridi: aşamalar sırasıyla; tıklanınca liste o aşamaya süzülür. Sayılar diğer filtrelerle uyumludur. */
function stageStrip(base) {
  const tile = (k, label, list, desc) => { const on = S.qStage === k;
    return `<button class="stg st-${k || "all"}${on ? " on" : ""}" data-act="q-stage" data-k="${k}" aria-pressed="${on}"${desc ? ` title="${esc(desc)}"` : ""}><span class="stg-h"><i class="dot" aria-hidden="true"></i>${esc(label)}</span><b class="num">${list.length}</b><span class="stg-v num">${byCurText(sumByCur(list)) || "—"}</span></button>`; };
  const G = [["open", "Süreçte"], ["won", "Olumlu sonuçlanan"], ["lost", "Olumsuz kapanan"]];
  const exp = base.filter(isExpired);
  return `<section class="card pipe"><div class="card-h"><h2 class="ttl">Teklif Süreci</h2><span class="muted small">Bir aşamaya tıklayarak listeyi süzün</span>
      ${exp.length ? `<div class="acts"><button class="btn sm ${S.qStage === "expired" ? "amber" : "ghost"}" data-act="q-stage" data-k="expired" aria-pressed="${S.qStage === "expired"}">${ICON.clock} Geçerlilik süresi dolan: <b>${exp.length}</b></button></div>` : ""}</div>
    <div class="pipe-row">${tile("", "Tümü", base, "")}
      ${G.map(([g, gl]) => `<div class="pipe-g g-${g}"><span class="pipe-gl">${gl}</span><div class="pipe-tiles">${STAGES.filter(s => s.grp === g).map(s => tile(s.k, s.l, base.filter(x => stageOf(x) === s.k), s.d)).join("")}</div></div>`).join("")}</div></section>`;
}
function quoteRow(x) {
  const open = S.openQ.has(x.id), items = x.items || [], cari = x.customerId && cariById(x.customerId), vu = validUntil(x);
  const log = stageLogOf(x).filter(e => e.at).map(e => `${esc(STAGE_BY[e.k].l)} <span class="muted">${fmtTs(e.at)}</span>`).join(" → ");
  return `<tr class="row${S.qFlash === x.id ? " flash" : ""}"><td class="num d-col">${fmtDate(x.date)}</td><td class="code num">${esc(x.no)}<span class="sub">${esc(TITLE_SHORT[x.title] || x.title || "")} · ${brandOf(x)} · ${langOf(x).toUpperCase()}<span class="m-only"> · ${fmtDate(x.date)}</span></span><span class="m-amt">${money(x.total, x.currency)}</span></td>
      <td><b>${esc(x.buyer || "—")}</b><span class="sub">${cari ? esc(cari.code) + " · " : ""}${esc([x.city, x.country].filter(Boolean).join(", ") || x.address || "")}</span><div class="stg-m">${stagePick(x)}${expiryTag(x)}</div></td>
      <td class="stg-cell">${stagePick(x)}<span class="sub">${x.stageAt ? `${esc(ago(x.stageAt))} güncellendi` : ""}${expiryTag(x)}</span></td>
      <td class="c k-col"><span class="tag blue">${items.length} kalem</span></td><td class="r strong k-col">${money(x.total, x.currency)}</td>
      <td><div class="acts"><button class="btn sm" data-act="q-open" data-id="${x.id}" aria-expanded="${open}">${open ? ICON.minus : ICON.plus} Detay</button>
        <button class="btn sm" data-act="dup" data-id="${x.id}" title="Yeni numarayla kopyasını aç">${ICON.copy} Tekrarla</button>
        <button class="btn sm" data-act="q-edit" data-id="${x.id}">${ICON.edit} Düzenle</button>
        <button class="ibtn" data-act="out" data-k="pdf" data-src="${x.id}" title="PDF indir" aria-label="PDF indir">${ICON.file}</button>
        <button class="ibtn" data-act="out" data-k="xlsx" data-src="${x.id}" title="Excel indir" aria-label="Excel indir">${ICON.grid}</button>
        <button class="ibtn danger" data-act="q-del" data-id="${x.id}" title="Sil" aria-label="Proformayı sil">${ICON.trash}</button></div></td></tr>
    ${open ? `<tr class="detail"><td colspan="7"><div class="detail-in">${items.map(it => kv(itemInfo(it, brandOf(x)).code + " · " + itemInfo(it, brandOf(x)).name, `${esc(it.qty)} × ${money(unitPrice(it), x.currency)} = ${money(lineTotal(it), x.currency)}`)).join("")}${kv("Hazırlayan", x.preparer ? esc(prepText(x.preparer)) + (x.showPreparer === false ? ' <span class="muted">· proformada gizli</span>' : "") : "—")}${kv("Proforma dili", LANG_BY[langOf(x)])}${kv("Ödeme", esc(x.payment || "—"))}${kv("Teslim", esc(x.delivery || "—"))}${kv("Sevkiyat", esc(x.dtime || "—"))}
      ${kv("Geçerlilik süresi", esc(x.validity || "—") + (vu ? ` <span class="muted">· ${fmtDate(vu)} tarihine kadar</span>` : ""))}${kv("HS kodları", esc(hsText(x) || "—"))}
      ${log ? `<div class="kv wide"><span>Aşama geçmişi</span><b>${log}</b></div>` : ""}</div></td></tr>` : ""}`;
}
function pageQuotes() {
  const base = filteredQuotes(true), list = filteredQuotes().sort(byDateDesc), by = {};
  list.forEach(x => { by[x.currency] = (by[x.currency] || 0) + (x.total || 0); });
  const grouped = S.qView !== "list", fl = S.qStage === "expired" ? "Geçerlilik süresi dolan" : S.qStage ? STAGE_BY[S.qStage].l : "";
  let body;
  if (grouped) body = STAGES.map(st => {
    const l = list.filter(x => stageOf(x) === st.k); if (!l.length) return "";
    const coll = S.qColl.has(st.k);
    return `<tbody class="grp st-${st.k}"><tr class="grp-h"><th colspan="7"><button data-act="q-grp" data-k="${st.k}" aria-expanded="${!coll}"><span class="chev">${ICON.chev}</span><i class="dot" aria-hidden="true"></i><b>${esc(st.l)}</b><span class="cnt">${l.length}</span><span class="sum num">${byCurText(sumByCur(l))}</span><span class="grp-d">${esc(st.d)}</span></button></th></tr>${coll ? "" : l.map(quoteRow).join("")}</tbody>`;
  }).join("");
  else body = `<tbody>${list.map(quoteRow).join("")}</tbody>`;
  return `<div class="page"><div class="head-row"><div><div class="eyebrow soft">Kayıtlar</div><h1>Proformalar</h1><p class="lead">Her proforma sistem numarasıyla saklanır ve bir <b>aşamada</b> bulunur: hazırlandı, müşteriye iletildi, müzakere, onay ya da sipariş. Aşamayı listeden güncelleyin; <b>Düzenle</b> numarayı değiştirmez, <b>Tekrarla</b> yeni numaralı bir kopya açar.</p></div>
     <button class="btn blue" data-act="new">${ICON.plus} Yeni Proforma</button></div>
   ${S.quotes.length ? stageStrip(base) : ""}
   <div class="toolbar"><section class="card"><div class="filters">
     <div class="fld s-wide"><label for="f_s">Ara</label><div class="ico-in">${ICON.search}<input id="f_s" data-f="qSearch" value="${esc(S.qSearch)}" placeholder="No, firma veya ülke" autocomplete="off"></div></div>
     <div class="fld"><label for="f_cari">Cari kart</label><select id="f_cari" data-f="qCari"><option value="">Tümü</option>${cariList().map(c => opt(c.id, S.qCari, c.code + " · " + c.name)).join("")}</select></div>
     <div class="fld"><label for="f_c">Para birimi</label><select id="f_c" data-f="qCur"><option value="">Tümü</option>${Object.keys(CUR).map(k => opt(k, S.qCur, k)).join("")}</select></div>
     <div class="fld"><label for="f_b">Marka</label><select id="f_b" data-f="qBrand"><option value="">Tümü</option>${BRANDS.map(k => opt(k, S.qBrand, k)).join("")}</select></div>
     <div class="fld"><label for="f_from">Başlangıç</label><input id="f_from" type="date" data-f="qFrom" value="${esc(S.qFrom)}"></div>
     <div class="fld"><label for="f_to">Bitiş</label><input id="f_to" type="date" data-f="qTo" value="${esc(S.qTo)}"></div>
     <button class="btn amber" data-act="f-clear">${ICON.list} Tümünü Listele</button></div></section>
    <section class="card"><dl class="sumbox"><div><dt>Proforma</dt><dd>${list.length}</dd></div>${Object.keys(CUR).map(k => `<div><dt>Toplam ${k}</dt><dd class="${k === "USD" ? "blue" : k === "EUR" ? "green" : ""}">${money(by[k] || 0, k)}</dd></div>`).join("")}</dl></section></div>
   <section class="card"><div class="card-h"><h2 class="ttl">Proforma Listesi</h2><span class="muted small">${list.length} / ${S.quotes.length}</span>${fl ? `<button class="tag blue fchip" data-act="q-stage" data-k="" title="Aşama filtresini kaldır">${esc(fl)} ${ICON.x}</button>` : ""}
      <div class="acts"><div class="seg sm" role="group" aria-label="Liste görünümü"><button data-act="q-view" data-v="group" aria-pressed="${grouped}">${ICON.stack} Aşamaya göre</button><button data-act="q-view" data-v="list" aria-pressed="${!grouped}">${ICON.list} Tarihe göre</button></div></div></div>
    ${list.length ? `<div class="tbl-wrap"><table class="tbl qtbl"><thead><tr><th class="d-col">Tarih</th><th>No</th><th>Alıcı</th><th class="stg-th">Aşama</th><th class="c k-col">Kalem</th><th class="r k-col">Tutar</th><th></th></tr></thead>${body}</table></div>`
      : `<div class="empty">${S.quotes.length ? (fl ? `“${esc(fl)}” aşamasında filtreyle eşleşen proforma yok.` : "Filtreyle eşleşen proforma yok.") + `<div><button class="btn" data-act="f-clear">${ICON.x} Filtreleri temizle</button></div>` : `Henüz kayıtlı proforma yok.<br>Proforma sayfasında <b>Proformayı Oluştur</b> dediğinizde burada listelenir.`}${S.quotes.length ? "" : `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn blue" data-act="go" data-v="proforma">${ICON.plus} Proforma oluştur</button><button class="btn" data-act="tpl-open">${ICON.eye} Örnek şablonu aç</button></div>`}</div>`}</section></div>`;
}

/* ---------- duyurular ---------- */
const annOffKey = () => "ndl-ann-off:" + (S.user ? S.user.id : "");
const annOff = () => { try { return JSON.parse(lsGet(annOffKey()) || "[]"); } catch (e) { return []; } };
const ANN_LEVEL = {info: ["blue", "Bilgi"], warning: ["amber", "Uyarı"], important: ["red", "Önemli"]};
function annBar() {
  const off = annOff(), list = (S.ann || []).filter(a => a.active && !off.includes(a.id)).slice(0, 3);
  if (!list.length) return "";
  return `<div class="ann-wrap">${list.map(a => `<div class="ann ${esc(a.level)}" role="status"><span class="ann-ic">${ICON.bell}</span><div class="ann-tx"><b>${esc(a.title)}</b>${a.body ? `<span>${esc(a.body)}</span>` : ""}</div><span class="ann-d">${fmtTs(a.created_at).slice(0, 10)}</span><button class="ibtn" data-act="ann-dismiss" data-id="${esc(a.id)}" title="Kapat" aria-label="Duyuruyu kapat">${ICON.x}</button></div>`).join("")}</div>`;
}
async function refreshAnn() { if (!S.user || !Store) return; try { S.ann = await Store.listAnn(); if ($("main")) renderMain(); } catch (e) {} }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.user && $("main")) refreshAnn(); });

/* ---------- PANO sayfası ---------- */
const monthKey = d => String(d || "").slice(0, 7);
function sumByCur(list) { const by = {}; list.forEach(x => { const c = CUR[x.currency] ? x.currency : "USD"; by[c] = (by[c] || 0) + (Number(x.total) || 0); }); return by; }
const byCurText = by => Object.entries(by).filter(([, v]) => v).map(([c, v]) => money(v, c)).join(" · ");
function pagePano() {
  const qs = S.quotes.filter(x => DATE_RE.test(String(x.date))), now = new Date(), z = n => String(n).padStart(2, "0");
  const ym = now.getFullYear() + "-" + z(now.getMonth() + 1), month = qs.filter(x => monthKey(x.date) === ym), mBy = sumByCur(month);
  const mMain = Object.entries(mBy).sort((a, b) => b[1] - a[1]);
  const liftQty = S.quotes.reduce((a, x) => a + (x.items || []).filter(it => itemInfo(it).type === "LIFT").reduce((t, it) => t + (Number(it.qty) || 0), 0), 0);
  const months = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1), k = d.getFullYear() + "-" + z(d.getMonth() + 1), l = qs.filter(x => monthKey(x.date) === k); months.push({k, label: MONTHS[d.getMonth()].slice(0, 3), full: MONTHS[d.getMonth()] + " " + d.getFullYear(), n: l.length, by: sumByCur(l)}); }
  const cariAgg = cariList().map(c => { const l = S.quotes.filter(x => x.customerId === c.id); return {c, n: l.length, by: sumByCur(l)}; }).filter(a => a.n).sort((a, b) => b.n - a.n).slice(0, 5);
  const mAgg = {};
  S.quotes.forEach(x => (x.items || []).forEach(it => { const inf = itemInfo(it, brandOf(x)); if (inf.type !== "LIFT") return; (mAgg[inf.code] = mAgg[inf.code] || {code: inf.code, name: inf.name, qty: 0}).qty += Number(it.qty) || 0; }));
  const models = Object.values(mAgg).sort((a, b) => b.qty - a.qty).slice(0, 5), mMax = Math.max(1, ...models.map(m => m.qty));
  const recent = [...S.quotes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 5);
  const kpi = (label, value, sub) => `<div class="kpi card"><span class="k-l">${label}</span><b class="k-v num">${value}</b><span class="k-s">${sub}</span></div>`;
  const name = (S.me && String(S.me.first_name || "").trim()) || (S.user.email || "").split("@")[0];
  return `<div class="page"><div class="head-row"><div><div class="eyebrow soft">Pano</div><h1>Hoş geldiniz${name ? ", " + esc(name) : ""}</h1><p class="lead">Proformalarınızın özeti, son proformalar ve en çok çalıştığınız cariler.</p></div>
     <button class="btn blue" data-act="new">${ICON.plus} Yeni Proforma</button></div>
   <div class="kpis">
     ${kpi("Proforma", S.quotes.length, `bu ay <b>${month.length}</b>`)}
     ${kpi("Bu ay teklif tutarı", mMain.length ? money(mMain[0][1], mMain[0][0]) : money(0, "USD"), mMain.length > 1 ? mMain.slice(1).map(([c, v]) => money(v, c)).join(" · ") : MONTHS[now.getMonth()] + " " + now.getFullYear())}
     ${kpi("Cari kart", S.customers.length, `<b>${cariAgg.length ? S.customers.filter(c => S.quotes.some(x => x.customerId === c.id)).length : 0}</b> cariye proforma verildi`)}
     ${kpi("Teklif edilen lift", fmtInt(liftQty), `${Object.keys(mAgg).length} farklı model`)}
   </div>
   <div class="dash">
     <section class="card"><div class="card-h"><h2 class="ttl">Son 6 ay</h2><span class="muted small">aylık proforma sayısı</span></div>${monthChart(months)}</section>
     <section class="card"><div class="card-h"><h2 class="ttl">En çok teklif edilen modeller</h2></div>
       ${models.length ? `<ol class="rank">${models.map(m => `<li><span class="r-name"><b>${esc(m.code)}</b><span>${esc(m.name)}</span></span><span class="r-bar"><i style="width:${Math.max(4, Math.round(m.qty / mMax * 100))}%"></i></span><b class="r-val num">${fmtInt(m.qty)} adet</b></li>`).join("")}</ol>` : `<div class="empty">Henüz lift içeren proforma yok.</div>`}</section>
   </div>
   <div class="dash even">
     <section class="card"><div class="card-h"><h2 class="ttl">Son proformalar</h2><div class="acts"><a class="btn ghost sm" href="#proformalar">Tümü ${ICON.right}</a></div></div>
       ${recent.length ? `<div class="tbl-wrap"><table class="tbl"><tbody>${recent.map(x => `<tr class="row"><td class="code num">${esc(x.no || "—")}</td><td><b>${esc(x.buyer || "—")}</b><span class="sub">${fmtDate(x.date)}</span></td><td>${stageTag(x)}</td><td class="r strong">${money(x.total, x.currency)}</td><td><div class="acts"><button class="btn sm" data-act="q-edit" data-id="${esc(x.id)}">${ICON.edit} Düzenle</button></div></td></tr>`).join("")}</tbody></table></div>`
         : `<div class="empty">Henüz proforma yok.<div><button class="btn blue" data-act="new">${ICON.plus} İlk proformayı oluştur</button></div></div>`}</section>
     <section class="card"><div class="card-h"><h2 class="ttl">En çok çalışılan cariler</h2><div class="acts"><a class="btn ghost sm" href="#alicilar">Cari kartlar ${ICON.right}</a></div></div>
       ${cariAgg.length ? `<div class="tbl-wrap"><table class="tbl"><tbody>${cariAgg.map(a => `<tr class="row clk" data-act="cari-open" data-id="${esc(a.c.id)}"><td class="code num">${esc(a.c.code)}</td><td><b>${esc(a.c.name)}</b><span class="sub">${a.n} proforma</span></td><td class="r strong">${byCurText(a.by) || "—"}</td></tr>`).join("")}</tbody></table></div>`
         : `<div class="empty">Henüz bir cariye proforma verilmedi.</div>`}</section>
   </div></div>`;
}
/* tek seri sütun grafik: ölçek 0'dan, yatay ızgara, son ay etiketli, diğerleri üzerine gelince */
function monthChart(months) {
  const total = months.reduce((a, m) => a + m.n, 0);
  if (!total) return `<div class="empty">Son 6 ayda proforma yok. Oluşturdukça burada aylık dağılım görünür.</div>`;
  const max = Math.max(...months.map(m => m.n)), top = max <= 4 ? 4 : Math.ceil(max / 4) * 4, ticks = [top, top / 2, 0];
  const grow = !S.chartShown; S.chartShown = true;
  return `<div class="mchart${grow ? " grow" : ""}" role="group" aria-label="Son 6 ayın aylık proforma sayısı">
    <div class="mc-grid">${ticks.map(t => `<div class="mc-line" style="bottom:${t / top * 100}%"><span>${fmtInt(t)}</span></div>`).join("")}</div>
    <div class="mc-bars">${months.map((m, i) => { const last = i === months.length - 1, name = `${m.full}: ${m.n} proforma${m.n ? ", " + byCurText(m.by) : ""}`;
      return `<button type="button" class="mc-col" data-act="mc-tip" data-i="${i}" aria-label="${esc(name)}"><span class="mc-bar${m.n ? "" : " zero"}" style="height:${m.n / top * 100}%;--i:${i}">${last && m.n ? `<em class="num" aria-hidden="true">${m.n}</em>` : ""}</span>
      <span class="mc-tip" aria-hidden="true"><b>${esc(m.full)}</b><span>${m.n} proforma</span>${m.n ? `<span>${byCurText(m.by)}</span>` : ""}</span><span class="mc-x" aria-hidden="true">${esc(m.label)}</span></button>`; }).join("")}</div></div>`;
}
/* ---------- HESAP AYARLARI sayfası ---------- */
function pageAccount() {
  const m = S.me || {}, A = S.acct || (S.acct = acctBuf()), nm = nameOf(m), prof = "first_name" in m;
  const fld = (k, label, em, attrs) => `<div class="fld s2"><label for="pf_${k}">${label}${em ? ` <em>${em}</em>` : ""}</label><input id="pf_${k}" name="${k}" data-acct="${k}" value="${esc(A[k])}"${attrs}></div>`;
  return `<div class="page"><div class="head-row"><div><div class="eyebrow soft">Hesap</div><h1>Hesap ayarları</h1><p class="lead">Profil bilgileriniz, fotoğrafınız ve şifreniz. Adınız ve soyadınız proformalarda “Hazırlayan” olarak basılır; her proformada gizleyebilirsiniz.</p></div></div>
   <div class="acct-grid">
    <section class="card"><div class="card-h"><h2 class="ttl">Profil</h2></div>
     ${prof ? `<div class="acct-photo">${avatarHtml(m, "lg", S.user.email)}<div><b>${esc(nm || "Ad ve soyad girilmedi")}</b><span>${esc(S.user.email)}</span>
        <div class="acct-pb"><button class="btn sm" data-act="avatar-up">${ICON.plus} ${m.avatar ? "Fotoğrafı değiştir" : "Fotoğraf yükle"}</button>${m.avatar ? `<button class="btn ghost sm" data-act="avatar-del">${ICON.x} Kaldır</button>` : ""}
          <input type="file" id="avatarIn" accept="image/png,image/jpeg,image/webp" data-up="avatar" hidden></div>
        <p class="hint" style="margin:0">JPG, PNG ya da WebP. 256 piksele küçültülür; yalnızca uygulamada görünür, proformaya basılmaz.</p></div></div>
     <form class="fgrid" data-form="profile" novalidate>
       ${fld("first_name", "Ad", "zorunlu", ' autocomplete="given-name" maxlength="60" required')}${fld("last_name", "Soyad", "zorunlu", ' autocomplete="family-name" maxlength="60" required')}
       ${fld("title", "Unvan", "isteğe bağlı · proformada adınızın yanında", ' autocomplete="organization-title" maxlength="80" placeholder="Örn. Satış Müdürü"')}${fld("phone", "Telefon", "isteğe bağlı", ' type="tel" inputmode="tel" autocomplete="tel" maxlength="40" placeholder="+90 5xx xxx xx xx"')}
       <div class="fld s4"><span class="lbl">E-posta <em>giriş adresiniz · değiştirilemez</em></span><div class="sysno"><b>${esc(S.user.email)}</b></div></div>
       <div class="form-err s4" role="alert"></div>
       <div class="card-f s4"><div class="grow muted small">Proformada: <b id="pfPrev">${esc(prepText(acctPrep(A)) || "—")}</b></div><div class="btns"><button class="btn blue" type="submit">${ICON.check} Kaydet</button></div></div>
     </form>` : `<div class="empty">Profil bilgileri için veritabanı güncellemesi bekleniyor. Yönetici güncel <code>schema.sql</code> dosyasını çalıştırdığında burada adınızı, unvanınızı, telefonunuzu ve fotoğrafınızı düzenleyebilirsiniz.</div>`}
    </section>
    <div class="acct-side">
     <section class="card"><div class="card-h"><h2 class="ttl">Hesap</h2><span class="tag ${S.role === "admin" ? "blue" : "green"}">${S.role === "admin" ? "Yönetici" : "Kullanıcı"}</span>${Store.mode === "demo" ? `<span class="tag amber">Demo · bu tarayıcıda</span>` : ""}</div>
       <div class="kvs">${kv("E-posta", esc(S.user.email))}${kv("Firmalar", `<a href="#firma">${isAdmin() ? "Firma ve banka bilgilerini düzenle" : "Firma ve banka bilgilerini gör"}</a>`)}</div></section>
     <section class="card"><div class="card-h"><h2 class="ttl">Şifre değiştir</h2></div>
       <form class="fgrid acct-pw" data-form="pwchange" novalidate>${pwField("p_new", "password", "Yeni şifre", "new-password", "", true).replace('class="fld"', 'class="fld s4"')}${pwField("p_new2", "password2", "Yeni şifre (tekrar)", "new-password").replace('class="fld"', 'class="fld s4"')}
        <div class="form-err s4" role="alert"></div><div class="s4" style="display:flex;justify-content:flex-end"><button class="btn" type="submit">${ICON.lock} Şifreyi değiştir</button></div></form></section>
     <section class="card"><div class="card-h"><h2 class="ttl">Oturum</h2></div><p class="muted small" style="margin:0 0 14px">Bu cihazdaki oturumunuzu kapatır. Kaydedilmemiş taslak varsa önce uyarılırsınız.</p><button class="btn danger" data-act="logout">${ICON.out} Çıkış yap</button></section>
    </div></div></div>`;
}
const acctPrep = A => { const n = [A.first_name, A.last_name].map(v => String(v || "").trim()).filter(Boolean).join(" "); return n ? {name: n, title: String(A.title || "").trim()} : null; };
async function saveAvatar(u) {
  const m = S.me || {};
  try {
    await Store.rpc("update_my_profile", {p_first: m.first_name, p_last: m.last_name, p_title: m.title || null, p_phone: m.phone || null, p_avatar: u || null, p_set_avatar: true});
    m.avatar = u || null; renderTop(); renderMain(); toast(u ? "Profil fotoğrafınız güncellendi" : "Profil fotoğrafınız kaldırıldı");
  } catch (e) { toastErr("Fotoğraf kaydedilemedi: " + authError(e)); }
}

/* ---------- CARİ KARTLAR sayfası ---------- */
function cariStats(c) {
  const qs = S.quotes.filter(x => x.customerId ? x.customerId === c.id : slug(x.buyer) === slug(c.name)), by = {};
  qs.forEach(x => { by[x.currency] = (by[x.currency] || 0) + (Number(x.total) || 0); });
  return {n: qs.length, last: qs.map(x => x.date).filter(d => DATE_RE.test(String(d))).sort().pop() || "", by};
}
function pageCari() {
  const C = S.cari, s = C.search.toLowerCase().trim();
  const list = cariList().filter(c => !s || [c.code, c.name, c.city, c.country, c.contact, c.taxId, c.email].join(" ").toLowerCase().includes(s));
  if (!S.cariEdit || (S.cariEdit.id && !cariById(S.cariEdit.id))) { const sel = cariById(C.sel) || list[0]; S.cariEdit = sel ? {...sel} : null; }
  const e = S.cariEdit;
  const rows = list.map(c => { const st = cariStats(c);
    return `<tr class="row clk${e && e.id === c.id ? " on" : ""}" data-act="cari-sel" data-id="${esc(c.id)}"><td class="code num">${esc(c.code || "—")}</td><td><b>${esc(c.name)}</b><span class="sub">${esc([c.city, c.country].filter(Boolean).join(", "))}</span></td><td>${esc(c.contact || "—")}</td><td class="c"><span class="tag blue">${st.n}</span></td><td class="r strong">${Object.entries(st.by).map(([k, v]) => money(v, k)).join("<br>") || "—"}</td></tr>`; }).join("");
  let editor;
  if (!e) editor = `<div class="empty">Henüz cari kart yok.<div><button class="btn blue" data-act="cari-new">${ICON.plus} Yeni Cari Kart</button></div></div>`;
  else { const st = e.id ? cariStats(e) : {n: 0, last: ""};
    editor = `<div class="card-h"><h2 class="ttl">${e.id ? "Cari Kart" : "Yeni Cari Kart"}</h2>${e.id ? `<span class="muted small">${st.n} proforma${st.last ? " · son " + fmtDate(st.last) : ""}</span>` : ""}</div>${cariFields(e, S.cariTried)}
     <div class="card-f">${e.id ? `<button class="btn ghost danger" data-act="cari-del" data-id="${esc(e.id)}">${ICON.trash} Sil</button>` : `<button class="btn ghost" data-act="cari-cancel">Vazgeç</button>`}
       <div class="btns"><button class="btn blue" data-act="cari-save">${ICON.check} Kaydet</button></div></div>
     ${e.id ? cariQuotes(e) : ""}`; }
  return `<div class="page"><div class="head-row"><div><div class="eyebrow soft">Cari · ${S.customers.length} kart</div><h1>Cari Kartlar</h1><p class="lead">Proforma kestiğiniz firmaların kartları. Proformaya bir cari kart seçerek başlarsınız; unvan ve adres bilgileri karttan alınır.</p></div>
     <button class="btn blue" data-act="cari-new">${ICON.plus} Yeni Cari Kart</button></div>
   <div class="lib cari"><section class="card"><div class="lib-tools"><div class="ico-in">${ICON.search}<input id="cariSearch" data-f="cari.search" value="${esc(C.search)}" placeholder="Kod, unvan, şehir, yetkili veya vergi no ara" autocomplete="off"></div></div>
     ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kod</th><th>Unvan</th><th>Yetkili</th><th class="c">Proforma</th><th class="r">Toplam</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty">${S.customers.length ? "Aramayla eşleşen kart yok." : "Henüz cari kart yok. Sağdaki formdan ya da Yeni Cari Kart ile ilk kartı oluşturun."}</div>`}</section>
    <section class="card editor">${editor}</section></div></div>`;
}

function cariQuotes(c) {
  const qs = S.quotes.filter(x => x.customerId === c.id).sort((a, b) => String(b.no).localeCompare(String(a.no), "tr", {numeric: true}));
  const rows = qs.map(x => `<tr class="row"><td class="code num">${esc(x.no || "—")}</td><td class="num">${fmtDate(x.date)}</td><td>${stageTag(x)}</td><td class="c">${(x.items || []).length}</td><td class="r strong">${money(x.total, x.currency)}</td>
    <td><div class="acts"><button class="btn sm" data-act="q-edit" data-id="${esc(x.id)}">${ICON.edit} Düzenle</button><button class="ibtn" data-act="out" data-k="pdf" data-src="${esc(x.id)}" title="PDF indir" aria-label="PDF indir">${ICON.file}</button><button class="ibtn" data-act="out" data-k="xlsx" data-src="${esc(x.id)}" title="Excel indir" aria-label="Excel indir">${ICON.grid}</button></div></td></tr>`).join("");
  return `<div class="cari-quotes"><div class="card-h" style="margin:22px 0 12px"><h2 class="ttl">Proformaları</h2><span class="muted small">${qs.length}</span><div class="acts"><button class="btn blue sm" data-act="cari-quote" data-id="${esc(c.id)}">${ICON.plus} Yeni proforma</button></div></div>
    ${qs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>No</th><th>Tarih</th><th>Aşama</th><th class="c">Kalem</th><th class="r">Tutar</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty">Bu cari için henüz proforma yok. <b>Yeni proforma</b> ile ilk proformayı oluşturun.</div>`}</div>`;
}

/* ---------- YÖNETİM sayfası (yalnızca yönetici) ---------- */
function fmtTs(s) { const d = s ? new Date(s) : null; if (!d || isNaN(d)) return "—"; const z = n => String(n).padStart(2, "0"); return z(d.getDate()) + "." + z(d.getMonth() + 1) + "." + d.getFullYear() + " " + z(d.getHours()) + ":" + z(d.getMinutes()); }
const USER_STATUS = {pending: ["amber", "Onay bekliyor"], active: ["green", "Aktif"], suspended: ["red", "Donduruldu"]};
async function loadUsers(quiet) {
  if (S.role !== "admin" || S.admin.loading) return; S.admin.loading = true;
  try { S.admin.users = (await Store.rpc("admin_list_users")) || []; S.pendingCount = S.admin.users.filter(u => u.status === "pending").length; }
  catch (e) { if (!quiet) toastErr("Kullanıcılar alınamadı: " + authError(e)); S.admin.users = S.admin.users || []; }
  finally { S.admin.loading = false; renderSide(); renderTop(); if (S.view === "yonetim") renderMain(); }
}
/* Yönetim üç bölümdür: hesaplar, denetim ve duyurular. Denetim yalnızca yöneticiye görünür. */
const ADM_TABS = [["users", "Hesaplar"], ["audit", "Denetim"], ["ann", "Duyurular"]];
function pageAdmin() {
  if (S.role !== "admin") return pageProforma();
  const tab = ADM_TABS.some(t => t[0] === S.admin.tab) ? S.admin.tab : "users";
  if (tab === "users" && S.admin.users == null) loadUsers();
  if (tab === "audit" && !S.audit.loaded && !S.audit.loading && !S.audit.err) queueMicrotask(loadAudit);
  const head = {users: ["Kullanıcılar", "Yeni kayıtlar sizin onayınızı bekler; onaylanmayan hesap hiçbir veriye erişemez. Dondurulan hesap giriş yapamaz. Silinen hesabın tüm kayıtları da silinir."],
    audit: ["Denetim", "Kim hangi proformayı oluşturdu, proformalar hangi aşamada, hangi hesap ne zaman giriş yaptı ve ne kadar kullandı. Bu bölümü yalnızca yöneticiler görür; kullanıcılar kendi kayıtlarını da göremez."],
    ann: ["Duyurular", "Yayınlanan duyuru tüm aktif kullanıcıların sayfasının en üstünde görünür."]}[tab];
  const btn = tab === "users" ? `<button class="btn" data-act="adm-refresh">${ICON.list} Yenile</button>` : tab === "audit" ? `<button class="btn" data-act="aud-refresh"${S.audit.loading ? " disabled" : ""}>${ICON.list} Yenile</button>` : "";
  const tabs = `<div class="seg adm-tabs" role="group" aria-label="Yönetim bölümleri">${ADM_TABS.map(([k, l]) => `<button data-act="adm-tab" data-v="${k}" aria-pressed="${tab === k}">${l}${k === "users" && S.pendingCount ? ` <span class="tag red">${S.pendingCount}</span>` : ""}</button>`).join("")}</div>`;
  const body = tab === "audit" ? auditBody() : tab === "ann" ? annAdmin() : usersBody();
  return `<div class="page"><div class="head-row"><div><div class="eyebrow soft">Yönetim</div><h1>${head[0]}</h1><p class="lead">${head[1]}</p></div>${btn}</div>${tabs}${body}</div>`;
}
function usersBody() {
  if (S.admin.users == null) return `<div class="empty">Kullanıcılar yükleniyor…</div>`;
  const all = S.admin.users, f = S.admin.filter, cnt = st => all.filter(u => u.status === st).length, list = all.filter(u => !f || u.status === f);
  const rows = list.map(u => { const me = S.user && u.id === S.user.id, [cls, lbl] = USER_STATUS[u.status] || ["grey", u.status];
    const acts = me ? `<span class="muted small">Kendi hesabınız</span>`
      : (u.status === "pending" ? `<button class="btn green sm" data-act="adm-approve" data-id="${esc(u.id)}">${ICON.check} Onayla</button>` : "")
      + (u.status === "active" ? `<button class="btn amber sm" data-act="adm-freeze" data-id="${esc(u.id)}">${ICON.lock} Dondur</button>` : "")
      + (u.status === "suspended" ? `<button class="btn blue sm" data-act="adm-unfreeze" data-id="${esc(u.id)}">${ICON.check} Aktif et</button>` : "")
      + `<button class="btn sm" data-act="adm-pw" data-id="${esc(u.id)}">${ICON.key} Şifre</button>`
      + `<button class="ibtn danger" data-act="adm-delete" data-id="${esc(u.id)}" title="Hesabı sil" aria-label="Hesabı sil">${ICON.trash}</button>`;
    return `<tr class="row${u.status === "pending" ? " promo" : ""}"><td><div class="person">${avatarHtml(u, "sm")}<div><b>${esc(nameOf(u) || u.email || "—")}</b>${me ? ` <span class="tag blue">Siz</span>` : ""}<span class="sub">${nameOf(u) ? esc(u.email) + " · " : ""}${u.role === "admin" ? "Yönetici" : "Kullanıcı"}${u.title ? " · " + esc(u.title) : ""}</span></div></div></td>
      <td><span class="tag ${cls}">${lbl}</span>${u.must_change ? ` <span class="tag grey">Geçici şifre</span>` : ""}</td><td class="num">${fmtTs(u.created_at)}</td><td class="num">${fmtTs(u.last_sign_in_at)}</td>
      <td>${u.email_confirmed_at ? `<span class="tag green">Onaylı</span>` : `<span class="tag amber">Bekliyor</span>`}</td><td class="c">${esc(u.doc_count ?? 0)}</td><td><div class="acts">${acts}</div></td></tr>`; }).join("");
  return `<div class="toolbar"><section class="card"><div class="seg" role="group" aria-label="Duruma göre filtrele" style="width:100%">${[["", "Tümü", all.length], ["pending", "Onay bekleyen", cnt("pending")], ["active", "Aktif", cnt("active")], ["suspended", "Dondurulan", cnt("suspended")]].map(([k, l, n]) => `<button data-act="adm-filter" data-f="${k}" aria-pressed="${f === k}">${l} <span class="muted">${n}</span></button>`).join("")}</div></section>
    <section class="card"><dl class="sumbox"><div><dt>Onay bekleyen</dt><dd class="${cnt("pending") ? "red" : ""}">${cnt("pending")}</dd></div><div><dt>Aktif</dt><dd class="green">${cnt("active")}</dd></div><div><dt>Dondurulan</dt><dd>${cnt("suspended")}</dd></div></dl></section></div>
   <section class="card"><div class="card-h"><h2 class="ttl">Hesaplar</h2><span class="muted small">${list.length} / ${all.length}</span></div>
    ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kullanıcı</th><th>Durum</th><th>Kayıt</th><th>Son giriş</th><th>E-posta onayı</th><th class="c">Kayıt sayısı</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty">Bu filtrede hesap yok.</div>`}</section>`;
}

/* ---------- DENETİM ----------
   Veriler yalnızca yönetici fonksiyonlarından gelir (schema.sql · 9): tüm kullanıcıların proformaları, kullanım oturumları ve işlem geçmişi. */
const AUD_PERIODS = [["1", "Bugün"], ["7", "Son 7 gün"], ["30", "Son 30 gün"], ["month", "Bu ay"], ["all", "Tümü"]];
const AUD_VIEWS = [["users", "Kullanıcılar"], ["quotes", "Proformalar"], ["sessions", "Oturumlar"], ["log", "İşlem geçmişi"]];
const AUD_CATS = [["", "Tümü"], ["login", "Girişler"], ["quote", "Proforma"], ["stage", "Aşama"], ["customer", "Cari"], ["download", "İndirme"], ["profile", "Profil"], ["admin", "Yönetim"]];
const AUD_PAGE = 150, ONLINE_MS = 150000;
function auditSince(p) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (p === "all") return null;
  if (p === "month") d.setDate(1); else d.setDate(d.getDate() - (Number(p) - 1));
  return d;
}
async function loadAudit() {
  const A = S.audit; if (A.loading || S.role !== "admin") return;
  A.loading = true; A.err = ""; if (S.view === "yonetim") renderMain();
  const since = auditSince(A.period), iso = since ? since.toISOString() : null;
  try {
    const [qs, ss, lg] = await Promise.all([Store.rpc("admin_audit_quotes"), Store.rpc("admin_audit_sessions", {since: iso}), Store.rpc("admin_audit_log", {since: iso, max_rows: 5000})]);
    A.quotes = (qs || []).map(r => Object.assign({}, r.data || {}, {id: r.id, owner: r.owner, ownerEmail: r.email, itemCount: r.item_count, rowAt: r.updated_at}));
    A.sessions = ss || []; A.log = lg || []; A.loaded = true; A.at = Date.now(); A.more = 0;
    if (S.admin.users == null) loadUsers(true);
  } catch (e) { A.err = isMissingTable(e) ? "setup" : authError(e); }
  finally { A.loading = false; if (S.view === "yonetim") renderMain(); }
}
const tsMs = v => (typeof v === "number" ? v : Date.parse(v)) || 0;
function fmtDur(sec) { sec = Math.max(0, Math.round(Number(sec) || 0)); if (sec < 60) return sec ? "1 dk'dan az" : "—"; const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60); return h ? `${h} sa${m ? " " + m + " dk" : ""}` : `${m} dk`; }
function relTime(ms) {
  if (!ms) return "—"; const s = Math.round((Date.now() - ms) / 1000);
  if (s < 90) return "az önce"; if (s < 3600) return Math.round(s / 60) + " dk önce"; if (s < 86400) return Math.round(s / 3600) + " sa önce";
  const d = Math.floor((new Date(today() + "T23:59:59") - ms) / 864e5); return d <= 1 ? "dün" : d + " gün önce";
}
function uaShort(ua) {
  ua = String(ua || ""); if (!ua) return "—";
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Macintosh|Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return [br, os].filter(Boolean).join(" · ") || "Diğer";
}
const audCreated = x => Number(x.createdAt) || tsMs(x.date ? x.date + "T12:00:00" : 0) || tsMs(x.rowAt);
const audCat = a => a === "login" ? "login" : a === "profile_update" ? "profile" : a === "quote_stage" ? "stage" : /^quote_/.test(a) ? "quote" : /^customer_/.test(a) ? "customer" : (a === "pdf" || a === "xlsx") ? "download" : "admin";
const stageName = k => (STAGE_BY[k] || {l: k || "—"}).l;
/* kişi listesi: tüm hesaplar ve kayıtlarda geçen (sonradan silinmiş) hesaplar */
function audPeople() {
  const A = S.audit, by = new Map();
  (S.admin.users || []).forEach(u => by.set(u.id, {id: u.id, email: u.email || "—", name: nameOf(u), avatar: u.avatar, first_name: u.first_name, last_name: u.last_name, role: u.role, status: u.status, lastSignIn: tsMs(u.last_sign_in_at)}));
  const add = (id, email) => { if (id && !by.has(id)) by.set(id, {id, email: email || "Silinmiş hesap", gone: true}); };
  A.quotes.forEach(x => add(x.owner, x.ownerEmail)); A.sessions.forEach(s => add(s.user_id, s.email)); A.log.forEach(e => add(e.user_id, e.email));
  return by;
}
function audData() {
  const A = S.audit, since = auditSince(A.period), from = since ? since.getTime() : 0, u = A.user;
  const quotes = A.quotes.filter(x => audCreated(x) >= from && (!u || x.owner === u));
  const sessions = A.sessions.filter(s => !u || s.user_id === u), log = A.log.filter(e => !u || e.user_id === u);
  const hasLoginEv = A.log.some(e => e.action === "login");
  const logins = hasLoginEv ? log.filter(e => e.action === "login").map(e => ({user_id: e.user_id, at: tsMs(e.at), ua: (e.detail || {}).ua}))
    : sessions.filter(s => s.kind === "login").map(s => ({user_id: s.user_id, at: tsMs(s.started_at), ua: s.device}));
  return {quotes, sessions, log, logins};
}
function auditBody() {
  const A = S.audit;
  if (A.err === "setup") return `<section class="card"><div class="empty"><b>Denetim kayıtları henüz kurulmamış.</b><br>Supabase → SQL Editor'de güncel <code>schema.sql</code> dosyasını bir kez çalıştırın; kayıtlar o andan itibaren tutulur.</div></section>`;
  if (A.err) return `<section class="card"><div class="empty">Denetim verileri alınamadı: ${esc(A.err)}<div><button class="btn" data-act="aud-refresh">${ICON.list} Tekrar dene</button></div></div></section>`;
  if (!A.loaded) return `<section class="card"><div class="empty">Denetim verileri yükleniyor…</div></section>`;
  const people = audPeople(), D = audData(), act = sessionsActive(D.sessions);
  const byCurT = byCurText(sumByCur(D.quotes)), won = D.quotes.filter(x => STAGE_BY[stageOf(x)].grp === "won").length;
  const users = new Set(D.logins.map(l => l.user_id)), act7 = D.sessions.reduce((a, s) => a + (Number(s.active_secs) || 0), 0);
  const kpi = (label, value, sub) => `<div class="kpi card"><span class="k-l">${label}</span><b class="k-v num">${value}</b><span class="k-s">${sub}</span></div>`;
  const sel = `<div class="fld aud-user"><label for="aud_u">Kullanıcı</label><select id="aud_u" data-f="audit.user"><option value="">Tüm kullanıcılar</option>${[...people.values()].sort((a, b) => personLabel(a).localeCompare(personLabel(b), "tr")).map(p => opt(p.id, A.user, (p.name ? p.name + " · " + p.email : p.email) + (p.gone ? " (silinmiş)" : ""))).join("")}</select></div>`;
  const per = `<div class="fld"><span class="lbl" id="audPerLbl">Dönem</span><div class="seg" role="group" aria-labelledby="audPerLbl">${AUD_PERIODS.map(([k, l]) => `<button data-act="aud-period" data-v="${k}" aria-pressed="${A.period === k}"${A.loading ? " disabled" : ""}>${l}</button>`).join("")}</div></div>`;
  const view = AUD_VIEWS.some(v => v[0] === A.view) ? A.view : "users";
  return `<section class="card aud-bar">${per}${sel}<p class="muted small aud-at">${A.loading ? "Güncelleniyor…" : "Güncellendi: " + fmtTs(new Date(A.at).toISOString())}${act ? ` · <span class="online"><i aria-hidden="true"></i>${act} kişi şu an çevrimiçi</span>` : ""}</p></section>
   <div class="kpis aud-kpis">${kpi("Giriş", D.logins.length, `${users.size} farklı hesap`)}${kpi("Etkin kullanım", fmtDur(act7), `${D.sessions.length} oturum`)}${kpi("Oluşturulan proforma", D.quotes.length, byCurT || "—")}${kpi("Olumlu sonuçlanan", won, D.quotes.length ? `%${Math.round(won * 100 / D.quotes.length)} · onaylanan ve siparişe dönüşen` : "dönemde proforma yok")}</div>
   <div class="seg aud-views" role="group" aria-label="Denetim görünümü">${AUD_VIEWS.map(([k, l]) => `<button data-act="aud-view" data-v="${k}" aria-pressed="${view === k}">${l}</button>`).join("")}</div>
   ${view === "quotes" ? audQuotes(D, people) : view === "sessions" ? audSessions(D, people) : view === "log" ? audLog(D, people) : audUsers(D, people)}`;
}
function sessionsActive(list) { const now = Date.now(); return new Set(list.filter(s => now - tsMs(s.last_seen) < ONLINE_MS).map(s => s.user_id)).size; }
const curLines = by => Object.keys(by).length ? Object.entries(by).map(([c, v]) => `<span class="cl">${money(v, c)}</span>`).join("") : "—";
const personLabel = p => (p && (p.name || p.email)) || "—";
const personCell = (p, sub) => `<div class="person">${avatarHtml(p, "sm", p && p.email)}<div><b>${esc(personLabel(p))}</b>${p && p.gone ? ` <span class="tag grey">Silinmiş</span>` : ""}${(p && p.name) || sub ? `<span class="sub">${[p && p.name ? esc(p.email) : "", sub].filter(Boolean).join(" · ")}</span>` : ""}</div></div>`;
/* kullanıcı özeti: kişi başına giriş, kullanım, proforma ve aşama dağılımı */
function audUsers(D, people) {
  const A = S.audit, now = Date.now();
  const rows = [...people.values()].filter(p => !A.user || p.id === A.user).map(p => {
    const qs = D.quotes.filter(x => x.owner === p.id), ss = D.sessions.filter(s => s.user_id === p.id), lg = D.logins.filter(l => l.user_id === p.id);
    const g = k => qs.filter(x => STAGE_BY[stageOf(x)].grp === k).length;
    const lastLogin = Math.max(p.lastSignIn || 0, ...lg.map(l => l.at)), lastAct = Math.max(0, ...ss.map(s => tsMs(s.last_seen)), ...D.log.filter(e => e.user_id === p.id).map(e => tsMs(e.at)));
    return {p, qs, ss, lg, open: g("open"), won: g("won"), lost: g("lost"), usage: ss.reduce((a, s) => a + (Number(s.active_secs) || 0), 0), lastLogin, lastAct, online: ss.some(s => now - tsMs(s.last_seen) < ONLINE_MS)};
  }).filter(r => r.qs.length || r.ss.length || r.lg.length || !r.p.gone).sort((a, b) => b.lastAct - a.lastAct || personLabel(a.p).localeCompare(personLabel(b.p), "tr"));
  const tr = r => `<tr class="row clk${A.user === r.p.id ? " on" : ""}" data-act="aud-user" data-id="${esc(r.p.id)}" title="Yalnızca bu kullanıcıyı göster">
      <td>${personCell(r.p, (r.p.role === "admin" ? "Yönetici" : r.p.gone ? "" : "Kullanıcı") + (r.p.status && r.p.status !== "active" ? " · " + (USER_STATUS[r.p.status] || ["", r.p.status])[1] : ""))}${r.online ? ` <span class="online"><i aria-hidden="true"></i>Çevrimiçi</span>` : ""}</td>
      <td class="num">${r.lastLogin ? fmtTs(new Date(r.lastLogin).toISOString()) : "—"}<span class="sub">${r.lastLogin ? relTime(r.lastLogin) : ""}</span></td>
      <td class="c num">${r.lg.length}</td><td class="num">${fmtDur(r.usage)}<span class="sub">${r.ss.length} oturum</span></td>
      <td class="c num"><b>${r.qs.length}</b></td>
      <td><div class="aud-mix">${r.open ? `<span class="tag blue">${r.open} süreçte</span>` : ""}${r.won ? `<span class="tag green">${r.won} olumlu</span>` : ""}${r.lost ? `<span class="tag red">${r.lost} olumsuz</span>` : ""}${r.qs.length ? "" : `<span class="muted">—</span>`}</div></td>
      <td class="num">${curLines(sumByCur(r.qs))}</td><td class="num">${relTime(r.lastAct)}</td></tr>`;
  return `<section class="card"><div class="card-h"><h2 class="ttl">Kullanıcı özeti</h2><span class="muted small">Seçili dönem · satıra tıklayınca yalnızca o kullanıcı gösterilir</span>${A.user ? `<div class="acts"><button class="tag blue fchip" data-act="aud-user" data-id="" title="Kullanıcı filtresini kaldır">${esc(personLabel(people.get(A.user)))} ${ICON.x}</button></div>` : ""}</div>
    ${rows.length ? `<div class="tbl-wrap"><table class="tbl aud"><thead><tr><th>Kullanıcı</th><th>Son giriş</th><th class="c">Giriş</th><th>Etkin kullanım</th><th class="c">Proforma</th><th>Aşamalar</th><th>Tutar</th><th>Son işlem</th></tr></thead><tbody>${rows.map(tr).join("")}</tbody></table></div>` : `<div class="empty">Bu dönemde kayıt yok.</div>`}</section>`;
}
/* proformalar: kullanıcıya ya da aşamaya göre gruplu */
function audQuotes(D, people) {
  const A = S.audit, byStage = A.group === "stage", list = [...D.quotes].sort((a, b) => audCreated(b) - audCreated(a));
  const groups = byStage ? STAGES.map(st => ({k: "s:" + st.k, cls: "st-" + st.k, label: st.l, desc: st.d, items: list.filter(x => stageOf(x) === st.k)}))
    : [...new Set(list.map(x => x.owner))].map(id => ({k: "u:" + id, cls: "st-all", label: personLabel(people.get(id)), desc: "", items: list.filter(x => x.owner === id)})).sort((a, b) => b.items.length - a.items.length);
  const row = x => { const open = A.open.has(x.id), log = (Array.isArray(x.stageLog) ? x.stageLog : []).filter(e => e && STAGE_BY[e.k]);
    return `<tr class="row"><td class="num d-col">${fmtDate(x.date)}</td><td class="code num">${esc(x.no || "—")}<span class="sub">${esc(TITLE_SHORT[x.title] || x.title || "")} · ${brandOf(x)} · ${langOf(x).toUpperCase()}</span></td>
      <td><b>${esc(x.buyer || "—")}</b><span class="sub">${esc([x.city, x.country].filter(Boolean).join(", ") || x.sellerName || "")}</span></td>
      <td>${byStage ? personCell(people.get(x.owner)) : `${stageTag(x)}<span class="sub">${x.stageAt ? relTime(Number(x.stageAt)) + " güncellendi" : ""}</span>`}</td>
      <td class="c k-col"><span class="tag blue">${x.itemCount || 0} kalem</span></td><td class="r strong">${money(x.total, x.currency)}</td>
      <td class="num k-col">${fmtTs(new Date(audCreated(x)).toISOString())}</td>
      <td><button class="btn sm" data-act="aud-open" data-id="${esc(x.id)}" aria-expanded="${open}">${open ? ICON.minus : ICON.plus} Detay</button></td></tr>
      ${open ? `<tr class="detail"><td colspan="8"><div class="detail-in">${kv("Oluşturan", esc(personLabel(people.get(x.owner))))}${kv("Hazırlayan", x.preparer ? esc(prepText(x.preparer)) + (x.showPreparer === false ? ' <span class="muted">· proformada gizli</span>' : "") : "—")}${kv("Firma", esc(x.sellerName || "—"))}${kv("Ödeme", esc(x.payment || "—"))}${kv("Teslim", esc(x.delivery || "—"))}${kv("Oluşturma", fmtTs(new Date(audCreated(x)).toISOString()))}${kv("Son değişiklik", fmtTs(x.rowAt))}
        ${log.length ? `<div class="kv wide"><span>Aşama geçmişi</span><b>${log.map(e => `${esc(STAGE_BY[e.k].l)} <span class="muted">${e.at ? fmtTs(new Date(e.at).toISOString()) : ""}</span>`).join(" → ")}</b></div>` : ""}</div></td></tr>` : ""}`; };
  const body = groups.filter(g => g.items.length).map(g => { const coll = A.coll.has(g.k);
    return `<tbody class="grp ${g.cls}"><tr class="grp-h"><th colspan="8"><button data-act="aud-grp" data-k="${esc(g.k)}" aria-expanded="${!coll}"><span class="chev">${ICON.chev}</span><i class="dot" aria-hidden="true"></i><b>${esc(g.label)}</b><span class="cnt">${g.items.length}</span><span class="sum num">${byCurText(sumByCur(g.items))}</span>${g.desc ? `<span class="grp-d">${esc(g.desc)}</span>` : ""}</button></th></tr>${coll ? "" : g.items.map(row).join("")}</tbody>`; }).join("");
  return `<section class="card"><div class="card-h"><h2 class="ttl">Proformalar</h2><span class="muted small">Seçili dönemde oluşturulan ${list.length} proforma</span>
      <div class="acts"><div class="seg sm" role="group" aria-label="Gruplama"><button data-act="aud-group" data-v="user" aria-pressed="${!byStage}">${ICON.users} Kullanıcıya göre</button><button data-act="aud-group" data-v="stage" aria-pressed="${byStage}">${ICON.stack} Aşamaya göre</button></div></div></div>
    ${list.length ? `<div class="tbl-wrap"><table class="tbl qtbl aud"><thead><tr><th class="d-col">Tarih</th><th>No</th><th>Alıcı</th><th>${byStage ? "Oluşturan" : "Aşama"}</th><th class="c k-col">Kalem</th><th class="r">Tutar</th><th class="k-col">Oluşturma</th><th></th></tr></thead>${body}</table></div>` : `<div class="empty">Bu dönemde oluşturulmuş proforma yok.</div>`}</section>`;
}
/* oturumlar: giriş ya da açılış zamanı, son etkinlik, açık kalma ve etkin kullanım süresi, cihaz */
function audSessions(D, people) {
  const A = S.audit, now = Date.now(), n = AUD_PAGE * (A.more + 1), list = D.sessions.slice(0, n);
  const rows = list.map(s => { const st = tsMs(s.started_at), ls = tsMs(s.last_seen), on = now - ls < ONLINE_MS;
    return `<tr class="row"><td>${personCell(people.get(s.user_id) || {email: s.email})}</td>
      <td class="num">${fmtTs(s.started_at)}<span class="sub">${s.kind === "login" ? "Şifreyle giriş" : "Açık oturumla açtı"}</span></td>
      <td class="num">${on ? `<span class="online"><i aria-hidden="true"></i>Şu an çevrimiçi</span>` : fmtTs(s.last_seen)}</td>
      <td class="num">${fmtDur((ls - st) / 1000)}</td><td class="num"><b>${fmtDur(s.active_secs)}</b></td><td>${esc(uaShort(s.device))}</td></tr>`; }).join("");
  return `<section class="card"><div class="card-h"><h2 class="ttl">Oturumlar</h2><span class="muted small">${D.sessions.length} oturum · etkin kullanım, sekme öndeyken ve son 5 dakikada etkileşim varken geçen süredir</span></div>
    ${list.length ? `<div class="tbl-wrap"><table class="tbl aud"><thead><tr><th>Kullanıcı</th><th>Başlangıç</th><th>Son etkinlik</th><th>Açık kalma</th><th>Etkin kullanım</th><th>Cihaz</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${D.sessions.length > n ? `<div class="more"><button class="btn" data-act="aud-more">Daha fazla göster (${D.sessions.length - n})</button></div>` : ""}` : `<div class="empty">Bu dönemde oturum yok. Kullanım kayıtları bu sürümle başlar; önceki kullanım geriye dönük görünmez.</div>`}</section>`;
}
function audText(e) {
  const d = e.detail || {}, L = `<b>${esc(e.label || "—")}</b>`, verb = {create: "ekledi", update: "düzenledi", delete: "sildi"}[String(e.action).split("_")[1]] || "";
  const amt = (v, c) => (v == null || v === "" ? "" : money(v, c));
  switch (e.action) {
    case "login": return `Giriş yaptı${d.ua ? ` <span class="muted">· ${esc(uaShort(d.ua))}</span>` : ""}`;
    case "quote_create": return `${L} proformasını oluşturdu${d.buyer ? " · " + esc(d.buyer) : ""}${d.total != null ? " · " + amt(d.total, d.currency) : ""}`;
    case "quote_update": return `${L} proformasını düzenledi${d.prevTotal != null && d.total != null && Number(d.prevTotal) !== Number(d.total) ? ` · tutar ${amt(d.prevTotal, d.currency)} → ${amt(d.total, d.currency)}` : ""}`;
    case "quote_stage": return `${L} aşamasını değiştirdi: ${esc(stageName(d.from))} → <b>${esc(stageName(d.to))}</b>`;
    case "quote_delete": return `${L} proformasını <b class="red-t">sildi</b>${d.buyer ? " · " + esc(d.buyer) : ""}${d.total != null ? " · " + amt(d.total, d.currency) : ""}`;
    case "pdf": return `${L} proformasının PDF'ini indirdi`;
    case "xlsx": return `${L} proformasının Excel dosyasını indirdi`;
    case "customer_create": case "customer_update": case "customer_delete": return `${L} cari kartını ${verb}`;
    case "product_create": case "product_update": case "product_delete": return `${L} ürününü ${verb}`;
    case "company_create": case "company_update": case "company_delete": return `${L} firma kaydını ${verb}`;
    case "user_status": return `${L} hesabını ${d.to === "suspended" ? "dondurdu" : d.from === "pending" ? "onayladı" : "yeniden aktif etti"}`;
    case "user_password": return `${L} hesabına geçici şifre verdi`;
    case "profile_update": return d.avatar ? "Profil fotoğrafını güncelledi" : `Profil bilgilerini güncelledi · ${L}`;
    case "user_delete": return `${L} hesabını sildi${d.quotes ? ` · ${d.quotes} proformasıyla birlikte` : ""}`;
    default: return esc(e.action);
  }
}
function audLog(D, people) {
  const A = S.audit, all = D.log.filter(e => !A.cat || audCat(e.action) === A.cat), n = AUD_PAGE * (A.more + 1), list = all.slice(0, n);
  const rows = list.map(e => `<tr class="row"><td class="num">${fmtTs(e.at)}<span class="sub">${relTime(tsMs(e.at))}</span></td><td>${personCell(people.get(e.user_id) || {email: e.email || "Sistem"})}</td><td>${audText(e)}</td></tr>`).join("");
  return `<section class="card"><div class="card-h"><h2 class="ttl">İşlem geçmişi</h2><span class="muted small">${all.length} kayıt</span></div>
    <div class="chips aud-cats" role="group" aria-label="İşlem türü">${AUD_CATS.map(([k, l]) => `<button class="chip" data-act="aud-cat" data-v="${k}" aria-pressed="${A.cat === k}">${l} <span class="muted">${k ? D.log.filter(e => audCat(e.action) === k).length : D.log.length}</span></button>`).join("")}</div>
    ${list.length ? `<div class="tbl-wrap"><table class="tbl aud"><thead><tr><th>Zaman</th><th>Kullanıcı</th><th>İşlem</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${all.length > n ? `<div class="more"><button class="btn" data-act="aud-more">Daha fazla göster (${all.length - n})</button></div>` : ""}` : `<div class="empty">Bu dönemde bu türde işlem yok. İşlem kayıtları bu sürümle başlar; önceki işlemler geriye dönük görünmez.</div>`}</section>`;
}

function annAdmin() {
  const A = S.annEdit, list = S.ann || [];
  const rows = list.map(a => { const [cls, lbl] = ANN_LEVEL[a.level] || ANN_LEVEL.info;
    return `<tr class="row"><td><b>${esc(a.title)}</b>${a.body ? `<span class="sub">${esc(a.body)}</span>` : ""}</td><td><span class="tag ${cls}">${lbl}</span></td><td class="num">${fmtTs(a.created_at)}</td><td>${a.active ? `<span class="tag green">Yayında</span>` : `<span class="tag grey">Kaldırıldı</span>`}</td>
      <td><div class="acts"><button class="btn sm" data-act="ann-toggle" data-id="${esc(a.id)}">${a.active ? "Yayından kaldır" : "Yeniden yayınla"}</button><button class="ibtn danger" data-act="ann-del" data-id="${esc(a.id)}" title="Sil" aria-label="Duyuruyu sil">${ICON.trash}</button></div></td></tr>`; }).join("");
  return `<section class="card" id="duyurular"><div class="card-h"><h2 class="ttl">Duyurular</h2><span class="muted small">${list.filter(a => a.active).length} yayında</span></div>
    <div class="fgrid"><div class="fld s3"><label for="an_title">Başlık</label><input id="an_title" data-an="title" maxlength="120" value="${esc(A.title)}" placeholder="Örn. Yeni fiyat listesi 1 Aralık'ta geçerli"></div>
      <div class="fld"><label for="an_level">Önem</label><select id="an_level" data-an="level">${Object.entries(ANN_LEVEL).map(([k, [, l]]) => opt(k, A.level, l)).join("")}</select></div>
      <div class="fld s4"><label for="an_body">Metin <em>isteğe bağlı</em></label><textarea id="an_body" data-an="body" rows="2" maxlength="2000">${esc(A.body)}</textarea></div></div>
    <div class="card-f"><div class="grow muted small">Yayınlanan duyuru tüm aktif kullanıcıların sayfasının en üstünde görünür. Kullanıcı kapatabilir; kapattığı duyuru ona tekrar gösterilmez.</div><div class="btns"><button class="btn blue" data-act="ann-publish">${ICON.bell} Yayınla</button></div></div>
    ${list.length ? `<div class="tbl-wrap" style="margin-top:18px"><table class="tbl"><thead><tr><th>Duyuru</th><th>Önem</th><th>Tarih</th><th>Durum</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : ""}</section>`;
}
/* şifre paneli: şifreler görülemez; sıfırlama e-postası ya da ilk girişte değiştirilecek geçici şifre */
function openPwModal(u) {
  const c = $("confirm"); S.confirm = null;
  c.innerHTML = `<div class="confirm wide" role="dialog" aria-modal="true" aria-labelledby="pwT"><h3 id="pwT">Şifre · ${esc(u.email)}</h3>
    <p>Şifreler yalnızca tek yönlü özet olarak saklanır; hiç kimse, yönetici de, bir kullanıcının şifresini göremez. Aşağıdaki iki yoldan birini kullanın.</p>
    <div class="pw-opt"><div><b>Sıfırlama e-postası gönder</b><span>Kullanıcı e-postasındaki bağlantıyla kendi şifresini belirler. Önerilen yol.</span></div><button class="btn" data-act="adm-resetmail" data-id="${esc(u.id)}">${ICON.mail} Gönder</button></div>
    <form class="pw-opt col" data-form="adminpw" data-id="${esc(u.id)}" novalidate><div><b>Geçici şifre belirle</b><span>Kullanıcının açık oturumları kapanır; ilk girişinde yeni şifre belirlemesi istenir. Geçici şifreyi kullanıcıya güvenli bir yoldan iletin.</span></div>
      <div class="fld"><label for="ap_pw">Geçici şifre</label><div class="with-btn"><input id="ap_pw" name="password" type="text" autocomplete="off" spellcheck="false" maxlength="72" class="mono"><button type="button" class="btn" data-act="pw-gen">Oluştur</button></div>${pwChecklist("ap_pw")}</div>
      <div class="form-err" role="alert"></div><div class="row"><button type="button" class="btn" data-act="cf-no">Vazgeç</button><button type="submit" class="btn blue">${ICON.key} Geçici şifreyi kaydet</button></div></form></div>`;
  c.hidden = false;
}
function genPassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789"], all = sets.join(""), r = new Uint32Array(16); crypto.getRandomValues(r);
  const ch = [...r].map((v, i) => (i < 3 ? sets[i] : all)[v % (i < 3 ? sets[i] : all).length]);
  for (let i = ch.length - 1; i > 0; i--) { const j = r[i] % (i + 1); [ch[i], ch[j]] = [ch[j], ch[i]]; }
  return ch.join("");
}

/* ---------- ÜRÜNLER sayfası ---------- */
/* Kütüphane NDL ve DLP olarak iki görünümdedir. Ortak ürünler iki markada aynı kod numarası ve ölçülerle görünür;
   yalnızca bir markada satılan ürün kartında işaretlenir. */
const libBrand = () => BRANDS.includes(S.lib.brand) ? S.lib.brand : "NDL";
function pageLib() {
  const L = S.lib, B = libBrand(), all = products(), mine = all.filter(p => inBrand(p, B)), s = L.search.toLocaleLowerCase("tr").trim(), adm = isAdmin();
  const list = mine.filter(p => p.type === L.type && (!s || [bCode(p.code, B), bName(p.name, B), trNameOf(p)].join(" ").toLocaleLowerCase("tr").includes(s)));
  if (!L.edit || (L.edit.id && !mine.some(p => p.id === L.edit.id))) { const sel = (pById(L.sel) && inBrand(pById(L.sel), B) && pById(L.sel).type === L.type ? pById(L.sel) : null) || list[0]; L.edit = sel ? editBuf(sel) : null; }
  if (!adm && L.edit && !L.edit.id) L.edit = null;
  const e = L.edit, lift = L.type === "LIFT", only = p => Array.isArray(p.brands) && p.brands.length && p.brands.length < BRANDS.length;
  const rows = list.map(p => `<tr class="row clk${e && e.id === p.id ? " on" : ""}" data-act="lib-sel" data-id="${p.id}"><td class="thumb">${p.img ? `<img src="${esc(thumbOf(p.img))}" alt="" loading="lazy">` : ""}</td><td class="code">${esc(bCode(p.code, B))}</td><td>${esc(bName(p.name, B))}${only(p) ? ` <span class="tag amber">Yalnızca ${B}</span>` : ""}${trNameOf(p) ? `<span class="sub">${esc(bName(trNameOf(p), B))}</span>` : ""}</td>${lift ? `<td class="num">${capRange(p)}</td><td class="num muted">${liftSizes(p).map(x => x.replace("x", "×")).join(", ") || "—"}</td>` : ""}</tr>`).join("");
  return `<div class="page"><div class="head-row"><div><div class="eyebrow soft">Ortak kütüphane · ${BRANDS.map(b => `${b} ${all.filter(p => inBrand(p, b)).length}`).join(" · ")} ürün</div><h1>Ürünler</h1><p class="lead">Proformada seçilen modeller, kapasiteler, platform ölçüleri, opsiyonlar ve yedek parçalar. NDL ve DLP aynı ürünleri aynı kod numarası ve ölçülerle kullanır; kodlar seçili markayla görünür (NDL 5010 ↔ DLP 5010). Kütüphane tüm kullanıcılar için ortaktır ve ${adm ? "yalnızca siz (yönetici) değiştirebilirsiniz" : "yalnızca yönetici değiştirebilir"}. Fiyatlar burada tutulmaz, her proformada girilir.</p></div>
     ${adm ? `<button class="btn blue" data-act="lib-add">${ICON.plus} Yeni Ürün</button>` : `<span class="tag grey">${ICON.lock} Salt okunur</span>`}</div>
   <div class="lib"><section class="card"><div class="lib-brand"><div class="seg brand-seg" role="group" aria-label="Marka">${BRANDS.map(b => `<button data-act="lib-brand" data-v="${b}" aria-pressed="${B === b}"><img src="${BRAND_IMG[b]}" alt="">${b} <span class="muted">${all.filter(p => inBrand(p, b)).length}</span></button>`).join("")}</div></div>
     <div class="lib-tools"><div class="seg" role="group" aria-label="Ürün türü">${Object.entries(TYPES).map(([k, v]) => `<button data-act="lib-type" data-t="${k}" aria-pressed="${L.type === k}">${v} <span class="muted">${mine.filter(p => p.type === k).length}</span></button>`).join("")}</div>
       <div class="ico-in">${ICON.search}<input id="libSearch" data-f="lib.search" value="${esc(L.search)}" placeholder="Kod veya ad ara (Türkçe ad dahil)" autocomplete="off"></div></div>
     ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="thumb"><span class="sr-only">Fotoğraf</span></th><th>Kod</th><th>Ürün adı</th>${lift ? "<th>Kapasite</th><th>Platform ölçüleri</th>" : ""}</tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty">${s ? "Aramayla eşleşen ürün yok." : `${B} kütüphanesinde bu grupta ürün yok.`}</div>`}</section>
    <section class="card editor">${e ? (adm ? libEditor(e) : libView(e)) : `<div class="empty">Soldan bir ürün seçin.</div>`}</section></div></div>`;
}
/* düzenleme kopyası seçili markanın koduyla gösterilir; kaydedilirken marka önekine göre saklanır */
function editBuf(p) {
  const B = libBrand();
  return {id: p.id, code: bCode(p.code, B), name: bName(p.name, B), nameTr: bName(p.nameTr != null ? str(p.nameTr) : trNameOf(p), B), type: p.type, order: p.order, img: p.img || "",
    brands: Array.isArray(p.brands) && p.brands.length ? p.brands.filter(b => BRANDS.includes(b)) : [...BRANDS], caps: (p.caps || []).join(", "), sizes: liftSizes(p).join(", ")};
}
const usedIn = id => S.quotes.filter(x => (x.items || []).some(it => it.pid === id)).length;
const brandsText = bs => (!bs || bs.length >= BRANDS.length) ? "NDL ve DLP" : "Yalnızca " + bs.join(", ");
function photoBox(img, alt) { return `<figure class="pphoto">${img ? `<img src="${esc(img)}" alt="${esc(alt || "")}">` : `<div class="ph-empty">${ICON.cube}<span>Fotoğraf yok</span></div>`}</figure>`; }
function libView(e) {
  const p = pById(e.id) || e, sz = liftSizes(p), B = libBrand();
  return `<div class="card-h"><h2 class="ttl">Ürün Kartı</h2><span class="tag grey">${esc(TYPES[p.type] || p.type)}</span></div>
   ${photoBox(p.img, bCode(p.code, B))}
   <div class="model-card" style="margin:16px 0"><b>${esc(bCode(p.code, B))}</b><span>${esc(bName(p.name, B))}</span>${p.type === "LIFT" ? `<small>${capRange(p)}${sz.length ? " · katalog: " + sz.map(x => x.replace("x", "×")).join(", ") : ""}</small>` : ""}</div>
   <div class="kvs">${kv("Türkçe adı", esc(bName(trNameOf(p), B)) || `<span class="muted">Yok · İngilizce adı basılır</span>`)}${kv("Marka", esc(brandsText(e.brands)))}</div>
   ${p.type === "LIFT" ? `<p class="muted small" style="margin:12px 0 0">${usedIn(p.id)} proformanızda kullanıldı.</p>` : ""}
   <p class="hint" style="margin:12px 0 0">${ICON.lock} Bu kütüphane ortaktır; ürünleri yalnızca yönetici ekleyip değiştirebilir.</p>`;
}
function libEditor(e) {
  const f = (id, k, label, attrs = "") => `<div class="fld s4"><label for="${id}">${label}</label><input id="${id}" data-le="${k}" value="${esc(e[k])}"${attrs}></div>`;
  const def = catalogImg(e), B = libBrand(), bs = e.brands || BRANDS;
  return `<div class="card-h"><h2 class="ttl">${e.id ? "Ürün Kartı" : "Yeni Ürün"}</h2>${e.id ? `<span class="tag grey">${esc(TYPES[e.type] || e.type)}</span>` : ""}</div>
   <div class="pphoto-ed">${photoBox(e.img, e.code)}
     <div class="btns"><button class="btn sm" data-act="lib-img-up">${ICON.plus} ${e.img ? "Fotoğrafı değiştir" : "Fotoğraf yükle"}</button>${e.img ? `<button class="btn ghost sm" data-act="lib-img-clear">${ICON.x} Kaldır</button>` : ""}${def && def !== e.img ? `<button class="btn ghost sm" data-act="lib-img-def">Katalog fotoğrafı</button>` : ""}
       <input type="file" id="libImg" accept="image/png,image/jpeg,image/webp" data-up="lib" hidden></div>
     <p class="hint" style="margin:0">Fotoğraf 640 piksele küçültülür; değişiklik “Kaydet” ile tüm kullanıcılara yansır.</p></div>
   ${e.type === "LIFT" && e.code && e.id ? `<div class="model-card" style="margin:0 0 18px"><b>${esc(e.code)}</b><span>${esc(e.name)}</span><small>${usedIn(e.id)} proformanızda kullanıldı</small></div>` : ""}
   <div class="fgrid">
    <div class="fld s2"><label for="le_code">Kod</label><input id="le_code" data-le="code" value="${esc(e.code)}" placeholder="Örn. ${B} 5010"></div>
    <div class="fld s2"><label for="le_type">Tür</label><select id="le_type" data-le="type">${Object.entries(TYPES).map(([k, v]) => opt(k, e.type, v)).join("")}</select></div>
    <div class="fld s4"><span class="lbl" id="leBrandLbl">Marka <em>${bs.length >= BRANDS.length ? "iki markada aynı kod numarası ve ölçülerle görünür" : "yalnızca bu markanın kütüphanesinde görünür"}</em></span><div class="seg" role="group" aria-labelledby="leBrandLbl">${BRANDS.map(b => `<button data-act="le-brand" data-v="${b}" aria-pressed="${bs.includes(b)}"><img src="${BRAND_IMG[b]}" alt="">${b}</button>`).join("")}</div></div>
    ${f("le_name", "name", "Ürün adı <em>İngilizce proformada böyle basılır</em>", ' placeholder="CANTILEVER LIFT"')}
    ${f("le_nameTr", "nameTr", "Türkçe ürün adı <em>Türkçe proformada; boşsa İngilizce adı basılır</em>", ' placeholder="KANTİLEVER LİFT"')}
    ${e.type === "LIFT" ? f("le_caps", "caps", "Kapasiteler <em>kg, virgülle</em>", ' placeholder="2000, 2500" inputmode="numeric"') + f("le_sizes", "sizes", "Platform ölçüleri <em>mm, virgülle</em>", ' placeholder="2400x1800, 2500x1800"') : ""}
   </div>
   ${e.type === "LIFT" ? `<p class="hint" style="margin:12px 0 0">Ölçüler yapılandırıcıda “Katalog ölçüleri” olarak öne çıkar; standart ölçüler ve özel boyut her zaman seçilebilir.</p>` : ""}
   <div class="card-f">${e.id ? `<button class="btn ghost danger" data-act="lib-del" data-id="${e.id}">${ICON.trash} Sil</button>` : `<button class="btn ghost" data-act="lib-cancel">Vazgeç</button>`}<div class="grow muted small">Değişiklik tüm kullanıcıların kütüphanesine yansır.</div><div class="btns"><button class="btn blue" data-act="lib-save">${ICON.check} Kaydet</button></div></div>`;
}

/* ---------- FİRMALAR sayfası (ortak; yalnızca yönetici değiştirir) ---------- */
const CO_LABELS = {company: "Firma unvanı", contact: "Telefon ve e-posta satırı", address: "Adres", since: "Logo altı yazı", brandNote: "Marka logosu altı yazı",
  warranty: "Garanti notu", origin: "Menşe", sinceTr: "Logo altı yazı · Türkçe", brandNoteTr: "Marka logosu altı yazı · Türkçe", warrantyTr: "Garanti notu · Türkçe", originTr: "Menşe · Türkçe", hs: "GTİP (HS code)", prefix: "Numara öneki", beneficiary: "Lehtar (beneficiary)", bank: "Banka", branch: "Şube",
  ibanUSD: "USD IBAN", ibanEUR: "EUR IBAN", ibanTRY: "TRY IBAN", swift: "SWIFT"};
function coBuf(c) { const e = {id: "", name: "", logo: "", order: 0}; COMPANY_FIELDS.forEach(k => { e[k] = ""; }); return Object.assign(e, c ? JSON.parse(JSON.stringify(c)) : {prefix: "PI"}); }
function pageFirm() {
  const C = S.co, adm = isAdmin(), list = S.companies;
  if (!C.edit || (C.edit.id && !list.some(c => c.id === C.edit.id))) { const sel = list.find(c => c.id === C.sel) || list[0]; C.edit = sel ? coBuf(sel) : null; }
  if (!adm && C.edit && !C.edit.id) C.edit = null;
  const e = C.edit;
  const cards = list.map(c => `<button class="pick co${e && e.id === c.id ? " on" : ""}" data-act="co-sel" data-id="${esc(c.id)}">${coLogo(c)}<span class="pk-main"><b>${esc(coName(c))}</b><span>${esc(c.company || "—")}${c.prefix ? " · önek " + esc(c.prefix) : ""}</span></span>${ICON.right}</button>`).join("");
  return `<div class="page"><div class="head-row"><div><div class="eyebrow soft">Ayarlar · ${list.length} firma</div><h1>Firmalar</h1><p class="lead">Proformayı kesen firma. Her proformada bu listeden biri seçilir; unvan, adres, logo ve banka bilgileri proformaya bu kayıttan basılır. Liste tüm kullanıcılar için ortaktır ve ${adm ? "yalnızca siz (yönetici) değiştirebilirsiniz" : "yalnızca yönetici değiştirebilir"}.</p></div>
     ${adm ? `<button class="btn blue" data-act="co-add">${ICON.plus} Yeni Firma</button>` : `<span class="tag grey">${ICON.lock} Salt okunur</span>`}</div>
   <div class="lib cari"><section class="card">${list.length ? `<div class="pick-list">${cards}</div>` : `<div class="empty">${adm ? "Henüz firma yok. Proforma kesen firmaları (ör. Düelsan, Ahkos Otomotiv) ekleyin." : "Yönetici henüz firma tanımlamadı."}${adm ? `<div><button class="btn blue" data-act="co-add">${ICON.plus} Yeni Firma</button></div>` : ""}</div>`}</section>
    <section class="card editor">${e ? (adm ? coEditor(e) : coView(e)) : `<div class="empty">${adm ? "Soldan bir firma seçin ya da yeni firma ekleyin." : "Görüntülenecek firma yok."}</div>`}</section></div></div>`;
}
function coView(e) {
  const row = k => e[k] ? kv(CO_LABELS[k], esc(e[k])) : "";
  return `<div class="card-h"><h2 class="ttl">${esc(coName(e))}</h2></div>
   <div class="co-sum" style="margin-bottom:16px">${coLogo(e)}<div><b>${esc(e.company)}</b><span>${esc([e.address, e.contact].filter(Boolean).join(" · "))}</span></div></div>
   <div class="kvs">${["since", "sinceTr", "brandNote", "brandNoteTr", "warranty", "warrantyTr", "origin", "originTr", "prefix", "beneficiary", "bank", "branch", "ibanUSD", "ibanEUR", "ibanTRY", "swift"].map(row).join("")}</div>
   <p class="hint" style="margin:14px 0 0">${ICON.lock} Firma bilgilerini yalnızca yönetici değiştirebilir.</p>`;
}
function coEditor(e) {
  const f = (k, cls = "", attrs = "", em = "") => `<div class="fld ${cls}"><label for="co_${k}">${CO_LABELS[k] || k}${em ? ` <em>${em}</em>` : ""}</label><input id="co_${k}" data-coe="${k}" value="${esc(e[k] || "")}"${attrs}></div>`;
  return `<div class="card-h"><h2 class="ttl">${e.id ? "Firma Kaydı" : "Yeni Firma"}</h2></div>
   <div class="fgrid">
     <div class="fld s2"><label for="co_name">Kayıt adı <em>seçim listesinde görünür</em></label><input id="co_name" data-coe="name" value="${esc(e.name || "")}" placeholder="Örn. Düelsan"></div>
     <div class="fld s2"><span class="lbl">Logo <em>proformanın sol üstüne basılır</em></span><div class="co-logo-ed">${coLogo(e)}<button class="btn sm" data-act="co-logo-up">${ICON.plus} ${e.logo ? "Değiştir" : "Logo yükle"}</button>${e.logo ? `<button class="btn ghost sm" data-act="co-logo-clear">${ICON.x} Kaldır</button>` : ""}<input type="file" id="coLogo" accept="image/png,image/jpeg,image/webp" data-up="co" hidden></div></div>
   </div>
   <div class="card-h" style="margin-top:22px"><h2 class="ttl">Proforma Başlığı</h2></div><div class="fgrid">
     ${f("company", "s2", ' placeholder="Firma unvanı" autocomplete="organization"')}${f("contact", "s2", ' placeholder="Tel: … Email: …"')}${f("address", "s4")}
     ${f("since", "s2", ' placeholder="Örn. Since 1982..."', "İngilizce · logonun altında")}${f("sinceTr", "s2", ' placeholder="Örn. 1982\'den beri..."', "boşsa İngilizcesi basılır")}
     ${f("brandNote", "s2", ' placeholder="Örn. The brand of Düelsan"', "İngilizce · sağ üstte")}${f("brandNoteTr", "s2", ' placeholder="Örn. Bir Düelsan markasıdır"', "boşsa İngilizcesi basılır")}</div>
   <p class="hint" style="margin:8px 0 0">Proforma İngilizce ya da Türkçe basılabilir. Türkçe alan boş bırakılırsa Türkçe proformada İngilizce metin kullanılır.</p>
   <div class="card-h" style="margin-top:22px"><h2 class="ttl">Proforma</h2></div><div class="fgrid">
     ${f("warranty", "s4", ' placeholder="Örn. ürünlerin garanti açıklaması"', "İngilizce · kırmızı, ortalı basılır")}${f("warrantyTr", "s4", ' placeholder="Garanti açıklamasının Türkçesi"', "boşsa İngilizcesi basılır")}
     ${f("origin", "", ' placeholder="Örn. TÜRKİYE"', "İngilizce")}${f("originTr", "", ' placeholder="Örn. TÜRKİYE"')}${f("prefix", "s2", ' placeholder="PI" maxlength="8" style="text-transform:uppercase"', "ör. DU → DU2026/0012")}</div>
   <p class="hint" style="margin:8px 0 0">Sıra numarası tüm firmalarda ortaktır; önek yalnızca numaranın başını belirler.</p>
   <div class="card-h" style="margin-top:22px"><h2 class="ttl">Banka Bilgileri</h2></div><div class="fgrid">
     ${f("beneficiary", "s2")}${f("bank")}${f("branch")}${f("ibanUSD", "s2", ' spellcheck="false"')}${f("ibanEUR", "s2", ' spellcheck="false"')}${f("ibanTRY", "s2", ' spellcheck="false"')}${f("swift", "", ' spellcheck="false"')}</div>
   <div class="card-f">${e.id ? `<button class="btn ghost danger" data-act="co-del" data-id="${esc(e.id)}">${ICON.trash} Sil</button>` : `<button class="btn ghost" data-act="co-cancel">Vazgeç</button>`}<div class="grow muted small">Kesilmiş proformalar değişmez; değişiklik yeni proformalara yansır.</div><div class="btns"><button class="btn blue" data-act="co-save">${ICON.check} Kaydet</button></div></div>`;
}

/* ---------- onay penceresi ---------- */
function ask(o) { const a = document.activeElement; S.cfFrom = {el: a, key: focusKey(a)}; S.confirm = o; renderConfirm(); }
function renderConfirm(keepClosedFocus) {
  const c = $("confirm"), x = S.confirm, app = document.querySelector(".app");
  if (!x) { const was = !c.hidden; c.hidden = true; c.innerHTML = ""; if (app) app.inert = false; if (was && !keepClosedFocus) restoreConfirmFocus(); return; }
  c.innerHTML = `<div class="confirm" role="alertdialog" aria-modal="true" aria-labelledby="cfT" aria-describedby="cfM"><h3 id="cfT">${esc(x.title)}</h3><p id="cfM">${x.msg}</p><div class="row"><button class="btn" data-act="cf-no">Vazgeç</button><button class="btn ${x.danger ? "red" : "blue"}" data-act="cf-yes">${esc(x.yes)}</button></div></div>`;
  c.hidden = false; if (app) app.inert = true;
  c.querySelector(x.danger ? '[data-act="cf-no"]' : '[data-act="cf-yes"]').focus();
}
function restoreConfirmFocus() {
  const el = S.cfFrom && S.cfFrom.el, key = S.cfFrom && S.cfFrom.key; S.cfFrom = null;
  const n = el && el.isConnected && el.offsetParent !== null ? el : key ? visibleOf(key) : null;
  if (n && n.offsetParent !== null) n.focus({preventScroll: true}); else focusHeading("#main h1");
}
function needsGuard() { const q = S.q; if (!q) return false; return !q.sample && q.items.length > 0 && (!q.saved || q.dirty); }
function guard(what, fn) { if (!needsGuard()) { fn(); return; } ask({title: "Kaydedilmemiş taslak", msg: `Açık proforma (<b>${esc(S.q.no || "taslak")}</b>) kaydedilmedi. ${what} bu taslak silinir.`, yes: "Devam et", fn}); }

/* ---------- işlemler ---------- */
const cariChosen = q => !!q.customerId || (q.saved && !!String(q.buyer).trim());
/* uygulama içi geçişler açık proformayı korur; menüden Proforma'ya gelince kayıtlı ve değişmemiş proforma yerine yenisi açılır */
function go(v) { S.keepQ = true; if (location.hash !== "#" + v) location.hash = v; else { S.keepQ = false; S.view = v; renderSide(); renderMain(); } }
function setStep(n) {
  if (n > 1 && S.q && step1Missing(S.q).length && !S.q.sample) { if (S.step !== 1 || S.view !== "proforma") { S.step = 1; if (S.view !== "proforma") go("proforma"); else renderMain(); } toast(step1Msg(S.q)); return; }
  const moved = S.step !== n; S.step = n; S.hsErr = ""; saveDraft(); if (S.view !== "proforma") go("proforma"); else renderMain(); const m = $("main"); if (m) m.scrollTop = 0; window.scrollTo(0, 0);
  if (moved) { focusHeading("#formCard h2"); ["formCard", "bottomCard"].forEach(id => { const el = $(id); if (el) el.classList.add("step-in"); }); } }
function startNew(prefill) {
  S.q = newQuote(); if (prefill) Object.assign(S.q, prefill);
  S.cfg = newCfg(); S.cfgTried = false; S.openRows.clear(); S.step = prefill ? 2 : 1; saveDraft(); updateCart(); go("proforma"); renderMain(); toast("Yeni proforma açıldı · numara oluşturulunca verilir");
}
function duplicate(src) {
  const q = normQuote(JSON.parse(JSON.stringify(src)));
  Object.assign(q, {id: rid(), no: "", sysNo: "", date: today(), status: "draft", saved: false, dirty: false, sample: false, hsCodes: hsList(q).slice()});
  delete q.createdAt; delete q.updatedAt; delete q.total; delete q.stage; delete q.stageAt; delete q.stageLog; delete q.preparer;
  if (q.title === "REVISED PROFORMA INVOICE") q.title = "PROFORMA INVOICE";
  return q;
}
function quoteDoc(q) {
  const d = JSON.parse(JSON.stringify(q)); ["saved", "dirty", "sample", "autoNo", "id"].forEach(k => delete d[k]);
  d.items = d.items.map(it => { const p = pById(it.pid); if (p) it.snap = prodSnap(p);
    it.opts = (it.opts || []).map(o => { const op = pById(o.oid), t = op ? trNameOf(op) : (o.nameTr != null ? str(o.nameTr) : ""); return Object.assign({oid: o.oid, name: optName(o), price: o.price}, t ? {nameTr: t} : {}); }); return it; });
  d.total = qTotal(q); d.updatedAt = Date.now(); d.createdAt = q.createdAt || Date.now(); d.status = "created";
  if (!STAGE_BY[d.stage]) { d.stage = "prepared"; d.stageAt = d.createdAt; d.stageLog = [{k: "prepared", at: d.createdAt}]; }
  return d;
}
async function createProforma(btn) {
  const q = S.q;
  if (step1Missing(q).length) { toast(q.sample ? "Örnek şablonu kullanmak için firmayı ve cari kartı seçin" : step1Msg(q)); S.step = 1; S.pick.co = false; renderMain(); return; }
  if (!q.items.length) { toast("Önce en az bir kalem ekleyin"); setStep(2); return; }
  const hin = $("r_hs"); if (hin && hin.value.trim() && !addHs(hin.value)) return;   /* yazılıp eklenmemiş HS kodu */
  busy(btn, true);
  try {
    const isNew = !q.saved, co = companyById(q.companyId);
    if (isNew && co) applyCompany(q, co);   /* yeni proforma firmanın o anki bilgileriyle kesilir */
    if (isNew || !q.preparer) { const me = mePrep(); if (me) q.preparer = me; }   /* hazırlayan: oluşturan kişi (sonradan değişmez) */
    const d = quoteDoc(q), cur = !isNew && S.quotes.find(x => x.id === q.id);
    if (isNew) { d.no = ""; delete d.sysNo; }
    if (cur && STAGE_BY[cur.stage]) ["stage", "stageAt", "stageLog"].forEach(k => { d[k] = JSON.parse(JSON.stringify(cur[k] ?? null)); });   /* aşama Kayıtlar'dan yönetilir */
    const stored = (await Store.put("quote", q.id, d)) || d;
    if (!stored.no) throw new Error("Proforma numarası alınamadı");
    upsertLocal(S.quotes, Object.assign({id: q.id}, stored));
    Object.assign(q, {no: stored.no, sysNo: stored.sysNo || "", createdAt: stored.createdAt, saved: true, dirty: false, status: "created", sample: false,
      stage: stored.stage, stageAt: stored.stageAt, stageLog: stored.stageLog});
    saveDraft(); toast(isNew ? `${q.no} oluşturuldu · ${q.buyer} kayıtlarına eklendi` : `${q.no} güncellendi`); renderMain(); updateCart();
  } catch (e) { toastErr("Kaydedilemedi: " + authError(e)); busy(btn, false); }
}
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.integrity = XLSX_SRI; s.crossOrigin = "anonymous"; s.referrerPolicy = "no-referrer"; s.onload = res; s.onerror = () => rej(new Error("Excel modülü yüklenemedi")); document.head.appendChild(s); }); }
function safeName(s) { return String(s || "").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().replace(/[.\s]+$/, ""); }
function saveBlob(blob, name) { const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); }
async function makeFile(kind, src, btn) {
  const raw = src === "cur" ? S.q : S.quotes.find(x => x.id === src); if (!raw || S.busy) return;
  if (src === "cur" && !raw.saved) { toast(raw.sample ? "Örnek şablon indirilemez; bir cari kart seçip proformayı oluşturun" : "Önce proformayı oluşturun; numara oluşturulunca verilir"); if (S.step !== 3) setStep(3); return; }
  if (src === "cur" && raw.dirty) { toast("Önce değişiklikleri kaydedin; dosya kayıtlı sürümden üretilir"); if (S.step !== 3) setStep(3); return; }
  const q = src === "cur" ? raw : normQuote(JSON.parse(JSON.stringify(raw)));
  S.busy = true; busy(btn, true);
  try {
    let blob;
    if (kind === "pdf") {
      if (!window.pdfMake) throw new Error("PDF modülü yüklenemedi; sayfayı yenileyin");
      if (!LOGO_B[brandOf(q)]) await loadLogos();
      const lg = await logoData(logoSrc(q)); LOGO_S = lg.d; LOGO_S_AR = lg.ar; await loadPhotos(q);
      blob = await new Promise((res, rej) => { try { pdfMake.createPdf(pdfDoc(q)).getBlob(res); } catch (e) { rej(e); } });
    } else {
      if (!window.ExcelJS) { toast("Excel hazırlanıyor…"); await loadScript(XLSX_SRC); }
      if (!LOGO_B[brandOf(q)]) await loadLogos();
      const lg = await logoData(logoSrc(q)); LOGO_S = lg.d; LOGO_S_AR = lg.ar; await loadPhotos(q);
      const wb = await buildXlsx(window.ExcelJS, q);
      blob = new Blob([await wb.xlsx.writeBuffer()], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    }
    saveBlob(blob, safeName([q.no, q.buyer].filter(Boolean).join(" ") || "proforma") + (kind === "pdf" ? ".pdf" : ".xlsx"));
    Store.rpc("audit_event", {p_action: kind === "pdf" ? "pdf" : "xlsx", p_target: q.id, p_label: q.no || "", p_detail: {buyer: q.buyer, brand: brandOf(q), lang: langOf(q)}}).catch(() => {});
    toast((kind === "pdf" ? "PDF" : "Excel") + " indirildi");
  } catch (e) { toastErr((kind === "pdf" ? "PDF" : "Excel") + " oluşturulamadı: " + ((e && e.message) || e)); }
  finally { S.busy = false; busy(btn, false); }
}
async function saveProduct(btn) {
  const e = S.lib.edit; if (!e) return;
  if (!isAdmin()) { toastErr("Ürün kütüphanesini yalnızca yönetici değiştirebilir"); return; }
  if (!String(e.code).trim() || !String(e.name).trim()) { toastErr("Kod ve ürün adı boş olamaz"); return; }
  const bs = (e.brands || BRANDS).filter(b => BRANDS.includes(b));
  if (!bs.length) { toastErr("Ürünün satıldığı en az bir markayı seçin"); return; }
  /* iki markada da olan ürün NDL önekiyle saklanır; DLP görünümünde DLP koduyla gösterilir */
  const canon = bs.includes("NDL") ? "NDL" : bs[0];
  const id = e.id || ("p-" + rid()), order = e.order || Math.max(0, ...products().map(p => p.order || 0)) + 1;
  const d = {code: bCode(String(e.code).trim(), canon), name: bName(String(e.name).trim(), canon), nameTr: bName(String(e.nameTr || "").trim(), canon), type: e.type, order,
    caps: String(e.caps || "").split(/[,;\s]+/).map(Number).filter(n => n > 0)};
  if (bs.length < BRANDS.length) d.brands = bs;
  if (e.type === "LIFT") d.sizes = String(e.sizes || "").split(/[,;\s]+/).map(s => parseSize(s.replace("×", "x"))).filter(Boolean).map(m => m[0] + "x" + m[1]);
  d.img = e.img || "";
  busy(btn, true);
  try {
    await Store.putShared("product", id, d);
    if (!S.products.length) S.products = CATALOG.map(p => ({...p}));
    upsertLocal(S.products, Object.assign({id}, d)); S.products.sort((a, b) => (a.order || 0) - (b.order || 0));
    S.lib.sel = id; S.lib.type = d.type; S.lib.edit = null; if (!bs.includes(libBrand())) S.lib.brand = bs[0];
    toast("Ürün kaydedildi · " + brandsText(d.brands)); renderMain();
  } catch (err) { toastErr("Kaydedilemedi: " + authError(err)); busy(btn, false); }
}
async function saveCari(btn) {
  const e = S.cariEdit; if (!e) return null;
  if (!String(e.name).trim()) { S.cariTried = true; renderMain(); toastErr("Firma unvanı boş olamaz"); return null; }
  const c = normCari(Object.assign({}, e, {id: e.id || ("c-" + rid())}));
  c.name = c.name.trim(); c.code = (c.code || "").trim() || nextCariCode();
  if (S.customers.some(x => x.id !== c.id && x.code && x.code === c.code)) { toastErr("Bu cari kodu başka bir kartta kullanılıyor"); return null; }
  c.createdAt = c.createdAt || Date.now(); c.updatedAt = Date.now();
  busy(btn, true);
  try { const {id, ...data} = c; await Store.put("customer", id, data); upsertLocal(S.customers, c); S.cariTried = false; toast(c.code + " · " + c.name + " kaydedildi"); return c; }
  catch (err) { toastErr("Kaydedilemedi: " + authError(err)); return null; }
  finally { busy(btn, false); }
}
async function adminAction(fn, args, okMsg) {
  try { await Store.rpc(fn, args); toast(okMsg); } catch (e) { toastErr(authError(e)); }
  await loadUsers();
}
async function saveCompany(btn) {
  const e = S.co.edit; if (!e) return;
  if (!isAdmin()) { toastErr("Firmaları yalnızca yönetici değiştirebilir"); return; }
  if (!String(e.company || "").trim()) { toastErr("Firma unvanı boş olamaz"); const n = $("co_company"); if (n) n.focus(); return; }
  const id = e.id || ("firma-" + rid()), d = {};
  ["name", "logo", ...COMPANY_FIELDS].forEach(k => { const v = typeof e[k] === "string" ? e[k].trim() : e[k]; if (v) d[k] = v; });
  d.prefix = String(d.prefix || "PI").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8) || "PI";
  d.name = d.name || d.company; d.order = e.order || Math.max(0, ...S.companies.map(c => c.order || 0)) + 1;
  busy(btn, true);
  try { await Store.putShared("company", id, d); upsertLocal(S.companies, Object.assign({id}, d)); S.companies.sort(coSort); S.co.sel = id; S.co.edit = null; toast(d.name + " kaydedildi"); renderMain(); }
  catch (err) { toastErr("Kaydedilemedi: " + authError(err)); busy(btn, false); }
}

/* ---------- olaylar ---------- */
document.addEventListener("input", e => {
  const t = e.target, d = t.dataset;
  if (t.type === "password" || (t.name === "password" && t.closest("[data-form]"))) {
    const ul = document.querySelector(`.pwreq[data-for="${t.id}"]`);
    if (ul) { PW_RULES.forEach(r => { const li = ul.querySelector(`[data-r="${r[0]}"]`); if (li) li.classList.toggle("ok", r[2](t.value)); }); const lk = ul.querySelector(".leak"); if (lk) lk.classList.remove("bad"); }
  }
  if (t.id === "r_hs") {   /* virgül ya da noktalı virgül yazılınca (telefon klavyeleri dahil) önceki kısım eklenir */
    if (S.hsErr) { S.hsErr = ""; t.classList.remove("need"); t.removeAttribute("aria-invalid"); const h = $("hsHint"); if (h) { h.classList.remove("err"); h.innerHTML = hsHint(S.q); } }
    if (/[,;]/.test(t.value)) { const parts = t.value.split(/[,;]/), rest = parts.pop(); if (parts.join("").trim() && addHs(parts.join(","))) { const i = $("r_hs"); if (i) i.value = rest.trimStart(); } }
    return;
  }
  if (t.id === "gSearch") { S.qSearch = t.value; if (S.view !== "proformalar") go("proformalar"); else renderMain(); return; }
  if (d.q) {
    S.q[d.q] = t.value; touch();
    if (d.q === "currency") { if (!CUR[S.q.currency]) S.q.currency = "USD"; renderMain(); return; }
    refreshIntro(); refreshPaper();
    /* şart yazılırken dil uyarısı güncellenir (ör. Türkçe proformada "15 DAYS") */
    if (TERM_KEYS.includes(d.q)) { const ck = document.querySelector("#formCard .checks"), tmp = document.createElement("div"); tmp.innerHTML = formReview(); const n = tmp.querySelector(".checks"); if (ck && n && ck.innerHTML !== n.innerHTML) ck.innerHTML = n.innerHTML; }
    return;
  }
  if (d.c && t.tagName !== "SELECT") {
    S.cfg[d.c] = t.value;
    if (S.cfgTried && (d.c === "w" || d.c === "d")) { const ok = !!cfgSize(S.cfg); ["cw", "cd"].forEach(id => $(id) && $(id).classList.toggle("need", !ok)); }
    if (d.c === "price") t.classList.toggle("need", S.cfgTried && !hasPrice(t.value));
    saveDraft(); refreshCfg(); return;
  }
  if (d.co != null) { const o = S.cfg.opts[+d.co]; if (o) { o.price = t.value; t.classList.toggle("need", S.cfgTried && !hasPrice(t.value)); } saveDraft(); refreshCfg(); return; }
  if (d.f) { const [a, b] = d.f.split("."); if (b) S[a][b] = t.value; else S[a] = t.value; if (d.f === "qSearch" && $("gSearch")) $("gSearch").value = t.value; renderMain(); return; }
  if (d.ce) { if (S.cariEdit) S.cariEdit[d.ce] = t.value; if (d.ce === "name" && S.cariTried) t.classList.toggle("need", !t.value.trim()); return; }
  if (d.le) { S.lib.edit[d.le] = t.value; if (d.le === "type") renderMain(); return; }
  if (d.coe) { if (S.co.edit) S.co.edit[d.coe] = t.value; return; }
  if (d.acct) { if (S.acct) S.acct[d.acct] = t.value; t.classList.remove("need"); t.removeAttribute("aria-invalid"); const pv = $("pfPrev"); if (pv && S.acct) pv.textContent = prepText(acctPrep(S.acct)) || "—"; return; }
  if (d.an) { S.annEdit[d.an] = t.value; return; }
});
/* alan düzeltildikçe aria-invalid güncellenir */
document.addEventListener("input", e => { const t = e.target; if (t.matches && t.matches("input, select, textarea")) queueMicrotask(() => syncInvalid($("main"))); });
document.addEventListener("change", e => {
  const t = e.target, d = t.dataset, c = S.cfg;
  if (d.up === "avatar") {
    const file = t.files && t.files[0]; t.value = ""; if (!file) return;
    shrinkImage(file, 256, "image/jpeg", 0.85).then(saveAvatar).catch(err => toastErr((err && err.message) || "Fotoğraf eklenemedi"));
    return;
  }
  if (d.qb) {
    S.q[d.qb] = t.checked; touch(); refreshPaper();
    if (d.qb === "showPreparer") {
      PREP_DEF = t.checked; lsSet("ndl-showprep", t.checked ? "1" : "0");
      const box = t.closest(".fld"); if (box) { box.outerHTML = prepSwitch(S.q); const n = document.querySelector('[data-qb="showPreparer"]'); if (n) n.focus({preventScroll: true}); }
      announce(t.checked ? "Hazırlayan proformada gösterilecek" : "Hazırlayan proformada gösterilmeyecek");
    }
    return;
  }
  if (d.up) {
    const file = t.files && t.files[0]; t.value = ""; if (!file || !isAdmin()) return;
    const lib = d.up === "lib";
    shrinkImage(file, lib ? 640 : 480, lib ? "image/jpeg" : "image/png", 0.82)
      .then(u => { if (lib && S.lib.edit) S.lib.edit.img = u; else if (!lib && S.co.edit) S.co.edit.logo = u; renderMain(); toast((lib ? "Fotoğraf" : "Logo") + " eklendi · kaydetmeyi unutmayın"); })
      .catch(err => toastErr((err && err.message) || "Görsel eklenemedi"));
    return;
  }
  if (d.stage) { setStage(d.stage, t.value); return; }
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
});
document.addEventListener("submit", async e => {
  const f = e.target; if (!f.dataset.form) return; e.preventDefault();
  const kind = f.dataset.form, fd = new FormData(f), email = String(fd.get("email") || "").trim(), pw = String(fd.get("password") || ""), pw2 = String(fd.get("password2") || "");
  const err = f.querySelector(".form-err"), btn = f.querySelector("button[type=submit]"), setErr = m => { if (err) err.textContent = m; };
  setErr("");
  const fn = String(fd.get("first_name") || "").trim(), ln = String(fd.get("last_name") || "").trim(), phone = String(fd.get("phone") || "").trim(), title = String(fd.get("title") || "").trim();
  if (["signup", "namegate", "profile"].includes(kind)) {
    const bad = [["first_name", fn], ["last_name", ln]].filter(([, v]) => v.length < 2);
    f.querySelectorAll('[name="first_name"], [name="last_name"]').forEach(i => { const on = bad.some(([k]) => k === i.name); i.classList.toggle("need", on); if (on) i.setAttribute("aria-invalid", "true"); else i.removeAttribute("aria-invalid"); });
    if (bad.length) { const i = f.querySelector(`[name="${bad[0][0]}"]`); if (i) i.focus(); return setErr(bad.length === 2 ? "Adınızı ve soyadınızı yazın (en az 2 karakter)." : bad[0][0] === "first_name" ? "Adınızı yazın (en az 2 karakter)." : "Soyadınızı yazın (en az 2 karakter)."); }
    if (phone && !/^[0-9+(). /-]+$/.test(phone)) { const i = f.querySelector('[name="phone"]'); if (i) { i.classList.add("need"); i.focus(); } return setErr("Telefon numarasında yalnızca rakam, boşluk ve + ( ) - . / kullanılabilir."); }
  }
  if (["login", "signup", "reset"].includes(kind) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Geçerli bir e-posta adresi yazın.");
  if (kind === "login" && !pw) return setErr("Şifrenizi yazın.");
  const newPw = ["signup", "recovery", "pwchange", "forcepw", "adminpw"].includes(kind);
  if (newPw) {
    const miss = pwMissing(pw); if (miss.length) return setErr("Şifrede eksik: " + miss.join(", ") + ".");
    if (pw.length > 72) return setErr("Şifre en fazla 72 karakter olabilir.");
    if (kind !== "adminpw" && pw !== pw2) return setErr("Şifreler eşleşmiyor.");
    if (email && pw.toLowerCase().includes(email.split("@")[0].toLowerCase())) return setErr("Şifre e-posta adınızı içermemeli.");
  }
  busy(btn, true);
  if (newPw) {
    const n = await pwnedCount(pw);
    if (n > 0) { busy(btn, false); const leak = f.querySelector(".pwreq .leak"); if (leak) leak.classList.add("bad"); return setErr(`Bu şifre bilinen veri sızıntılarında ${n.toLocaleString("tr-TR")} kez görülmüş; Chrome'un uyardığı durum budur. Başka bir yerde kullanmadığınız yeni bir şifre seçin.`); }
  }
  try {
    if (kind === "login") { S.loginKind = "login"; await Store.signIn(email, pw); if (!S.user) { const u = await Store.session(); if (u) await enter(u); } }
    else if (kind === "signup") { S.loginKind = "login"; S.signupName = {first_name: fn, last_name: ln}; const r = await Store.signUp(email, pw, {first_name: fn, last_name: ln}); S.authEmail = email; if (r.confirm) { S.auth = "confirm"; renderAuth(); } }
    else if (kind === "reset") { await Store.reset(email); S.authEmail = email; S.auth = "sent"; renderAuth(); }
    else if (kind === "recovery") { S.loginKind = "login"; await Store.setPassword(pw); S.auth = "login"; toast("Şifreniz güncellendi"); history.replaceState(null, "", location.pathname + "#proforma"); const u = await Store.session(); if (u) await enter(u); else renderAuth(); }
    else if (kind === "pwchange") { await Store.setPassword(pw); f.reset(); toast("Şifreniz değiştirildi"); }
    else if (kind === "namegate") { const m = S.me || {}; await Store.rpc("update_my_profile", {p_first: fn, p_last: ln, p_title: m.title || null, p_phone: m.phone || null}); Object.assign(m, {first_name: fn, last_name: ln}); toast("Teşekkürler, " + fn); if (S.user) await enter(S.user); }
    else if (kind === "profile") {
      await Store.rpc("update_my_profile", {p_first: fn, p_last: ln, p_title: title || null, p_phone: phone || null});
      Object.assign(S.me, {first_name: fn, last_name: ln, title: title || null, phone: phone || null}); S.acct = acctBuf(); renderTop(); renderMain(); toast("Profiliniz kaydedildi");
    }
    else if (kind === "forcepw") { await Store.setPassword(pw); toast("Yeni şifreniz kaydedildi"); const u = S.user; if (u) await enter(u); }
    else if (kind === "adminpw") { const u = (S.admin.users || []).find(x => x.id === f.dataset.id); await Store.rpc("admin_set_password", {target: f.dataset.id, new_password: pw}); $("confirm").hidden = true; toast((u ? u.email : "Kullanıcı") + " için geçici şifre kaydedildi; ilk girişte değiştirmesi istenecek"); loadUsers(); }
  } catch (x) { S.loginKind = ""; setErr(authError(x)); }
  finally { busy(btn, false); }
});
document.addEventListener("keydown", e => {
  const t = e.target;
  if (t && t.id === "r_hs" && (e.key === "Enter" || e.key === "," || e.key === ";")) { e.preventDefault(); if (t.value.trim()) addHs(t.value); return; }
  if (e.key === "Escape") { if (S.viewer) closeViewer(true); else if (S.confirm) { S.confirm = null; renderConfirm(); } else if (S.menu) closeMenu(true); } });
$("confirm").addEventListener("click", e => { if (e.target.id !== "confirm") return; if (S.viewer) closeViewer(true); else { S.confirm = null; renderConfirm(); } });
document.addEventListener("click", async e => {
  if (S.menu && !e.target.closest(S.menu === "draft" ? ".dmenu" : ".umenu")) { S.menu = null; renderTop(); }
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
    case "mc-tip": { const on = !b.classList.contains("on"); document.querySelectorAll(".mc-col.on").forEach(x => x.classList.remove("on")); b.classList.toggle("on", on); break; }   /* dokunmatikte ay değeri */
    case "skip": focusHeading("#main h1"); break;
    case "theme": { const r = document.documentElement; r.classList.add("notr"); lsSet("ndl-theme", isDark() ? "light" : "dark"); applyTheme(); renderTop();
      void getComputedStyle(r).color; const off = () => r.classList.remove("notr"); requestAnimationFrame(() => requestAnimationFrame(off)); setTimeout(off, 200); break; }
    case "umenu": S.menu = S.menu === "user" ? null : "user"; renderTop(); break;
    case "draft": if (S.menu === "draft") closeMenu(true); else { S.menu = "draft"; renderTop(); const p = $("draftPop"); if (p) p.focus(); } break;
    case "draft-close": closeMenu(b.tagName !== "A"); break;
    case "draft-prev": closeMenu(false); openPreview(); break;
    case "draft-cont": closeMenu(false); continueDraft(); break;
    case "vw-close": closeViewer(true); break;
    case "vw-cont": closeViewer(false); continueDraft(); break;
    case "vw-zoom": if (S.viewer) { S.viewer.zoom = !S.viewer.zoom; fitViewer(); } break;
    case "draft-new": closeMenu(false); guard("Yeni proforma açılırsa", () => startNew()); break;
    case "avatar-up": { const i = $("avatarIn"); if (i) i.click(); break; }
    case "avatar-del": saveAvatar(null); break;
    case "go": go(b.dataset.v); break;
    case "step": setStep(+b.dataset.n); break;
    case "new": guard("Yeni proforma açılırsa", () => startNew()); break;
    case "new-same": { const c = cariById(q.customerId); if (!c) break; guard("Yeni proforma açılırsa", () => { startNew(); applyCari(S.q, c); saveDraft(); updateCart(); S.step = 1; renderMain(); toast(c.name + " için yeni proforma · şimdi firmayı seçin"); }); break; }
    case "tpl-open": guard("Örnek şablon açılırsa", () => { S.q = templateQuote(); S.cfg = newCfg(); S.cfgTried = false; S.openRows.clear(); S.step = 3; saveDraft(); updateCart(); go("proforma"); renderMain(); toast("Örnek şablon açıldı · bilgiler hayalidir"); }); break;
    case "tpl-clear": startNew(); break;
    case "undo": if (S.undo) { S.undo(); S.undo = null; $("toast").hidden = true; } break;
    case "toast-x": clearTimeout(toast._t); S.undo = null; $("toast").hidden = true; break;
    case "cf-no": S.confirm = null; renderConfirm(); $("confirm").hidden = true; break;
    case "cf-yes": { const fn = S.confirm && S.confirm.fn; S.confirm = null; renderConfirm(true); if (fn) await fn(); restoreConfirmFocus(); break; }
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
      if (miss.length) { S.cfgTried = true; renderMain(); const n = document.querySelector("#formCard .need"); if (n) n.scrollIntoView({block: "center", behavior: scrollMode()}); toastErr("Eksik: " + miss.join(", ")); break; }
      const it = cfgItem(c), code = itemInfo(it, brandOf(q)).code; let idx;
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
      toast(`${itemInfo(gone, brandOf(S.q)).code} silindi`, () => { S.q.items.splice(Math.min(i, S.q.items.length), 0, gone); touch(); renderMain(); }); break; }
    /* belge */
    case "create": createProforma(b); break;
    case "out": makeFile(b.dataset.k, b.dataset.src, b); break;
    /* kayıtlar */
    case "q-stage": S.qStage = S.qStage === b.dataset.k ? "" : b.dataset.k; renderMain(); break;
    case "q-view": S.qView = b.dataset.v === "list" ? "list" : "group"; lsSet("ndl-qview", S.qView); renderMain(); break;
    case "q-brand": { const v = b.dataset.v; if (!BRANDS.includes(v) || v === brandOf(q)) break;
      const off = q.items.filter(it => { const p = pById(it.pid); return p && !inBrand(p, v); });
      if (off.length) { toastErr(`${off.length} kalem ${v} kütüphanesinde yok; marka değiştirmek için önce bu kalemleri kaldırın`); break; }
      q.brand = v; BRAND_DEF = v; lsSet("ndl-brand", v);
      if (c.pid && !inBrand(pById(c.pid), v)) { S.cfg = newCfg(c.mode); S.cfgTried = false; }
      touch(); keepFocus(b, renderMain); announce(`Marka ${v} · ürün kodları ${v} ile basılır`); break; }
    case "q-lang": { const v = b.dataset.v === "tr" ? "tr" : "en", fix = !!b.dataset.fix; if (!fix && v === langOf(q)) break;
      const kept = setLang(q, v).filter(k => q[k]); touch();
      if (fix) { renderMain(); focusHeading("#formCard h2"); } else keepFocus(b, renderMain);
      if (kept.length) toast(`Proforma ${LANG_BY[v]} · serbest yazılan ${kept.map(k => TERM_LABEL[k].toLocaleLowerCase("tr")).join(", ")} çevrilmedi, kontrol edin`);
      else announce(`Proforma dili ${LANG_BY[v]} · şartlar çevrildi`); break; }
    case "q-grp": { const k = b.dataset.k; if (S.qColl.has(k)) S.qColl.delete(k); else S.qColl.add(k); renderMain(); break; }
    case "hs-add": addHs(($("r_hs") || {}).value); break;
    case "hs-sug": addHs(b.dataset.v); break;
    case "hs-del": { const l = hsList(q).slice(); l.splice(+b.dataset.i, 1); q.hsCodes = l; touch(); renderMain(); break; }
    case "f-clear": S.qStage = ""; S.qSearch = ""; S.qCari = ""; S.qCur = ""; S.qBrand = ""; S.qFrom = ""; S.qTo = ""; if ($("gSearch")) $("gSearch").value = ""; renderMain(); break;
    case "q-open": { const id = b.dataset.id; if (S.openQ.has(id)) S.openQ.delete(id); else S.openQ.add(id); renderMain(); break; }
    case "dup": { const src = b.dataset.id === "cur" ? S.q : S.quotes.find(x => x.id === b.dataset.id); if (!src) break;
      const run = () => { const n = duplicate(src); S.q = n; S.cfg = newCfg(); S.step = 3; S.openRows.clear(); saveDraft(); updateCart(); go("proforma"); renderMain(); toast("Kopya hazır · yeni no " + n.no); };
      if (b.dataset.id === "cur") run(); else guard("Kopya açılırsa", run); break; }
    case "q-edit": { const src = S.quotes.find(x => x.id === b.dataset.id); if (!src) break;
      if (S.q && S.q.id === src.id && S.q.saved) { go("proforma"); setStep(2); break; }
      guard("Kayıt açılırsa", () => { S.q = Object.assign(normQuote(JSON.parse(JSON.stringify(src))), {id: src.id, saved: true, dirty: false, sample: false}); S.cfg = newCfg(); S.step = 2; S.openRows.clear(); saveDraft(); updateCart(); go("proforma"); renderMain(); toast(src.no + " düzenlemeye açıldı"); }); break; }
    case "q-del": { const x = S.quotes.find(z => z.id === b.dataset.id); if (!x) break;
      ask({title: "Proforma silinsin mi?", msg: `<b>${esc(x.no)}</b> · ${esc(x.buyer || "")} kalıcı olarak silinir. Bu işlem geri alınamaz.`, yes: "Proformayı sil", danger: true,
        fn: async () => { try { await Store.del("quote", x.id); S.quotes = S.quotes.filter(z => z.id !== x.id); if (S.q.id === x.id) { S.q.saved = false; saveDraft(); } toast(x.no + " silindi"); renderMain(); } catch (err) { toastErr("Silinemedi: " + authError(err)); } }}); break; }
    /* cari kart seçimi (proforma 1. adım) */
    case "pick": { const c = cariById(b.dataset.id); if (!c) break; applyCari(q, c); S.pick = {search: "", mode: ""}; touch(); if (companyChosen(q)) { toast(c.name + " seçildi"); setStep(2); } else { renderMain(); toast(c.name + " seçildi · şimdi firmayı seçin"); } break; }
    case "pick-co": { const c = companyById(b.dataset.id); if (!c) break; applyCompany(q, c); S.pick.co = false; touch(); if (cariChosen(q)) { toast(coName(c) + " seçildi"); setStep(2); } else { renderMain(); toast(coName(c) + " seçildi · şimdi cari kartı seçin"); } break; }
    case "pick-co-change": S.pick.co = true; renderMain(); break;
    case "pick-co-cancel": S.pick.co = false; renderMain(); break;
    case "pick-new": S.cariEdit = normCari({code: nextCariCode()}); S.cariTried = false; S.pick.mode = "new"; renderMain(); setTimeout(() => { const n = $("ce_name"); if (n) n.focus(); }, 0); break;
    case "pick-edit": { const c = cariById(q.customerId); if (!c) break; S.cariEdit = {...c}; S.cariTried = false; S.pick.mode = "edit"; renderMain(); break; }
    case "pick-change": S.pick.mode = "change"; renderMain(); break;
    case "pick-cancel": S.pick.mode = ""; S.cariEdit = null; renderMain(); break;
    case "pick-save": { const c = await saveCari(b); if (!c) break; applyCari(q, c); S.pick = {search: "", mode: ""}; S.cariEdit = null; touch(); renderMain(); break; }
    /* cari kartlar sayfası */
    case "cari-sel": { const c = cariById(b.dataset.id); if (!c) break; S.cari.sel = c.id; S.cariEdit = {...c}; S.cariTried = false; renderMain(); if (window.innerWidth < 1100) { const ed = document.querySelector(".editor"); if (ed) ed.scrollIntoView({block: "start", behavior: scrollMode()}); } break; }
    case "cari-new": S.cariEdit = normCari({code: nextCariCode()}); S.cariTried = false; S.cari.sel = null; if (S.view !== "alicilar") go("alicilar"); renderMain(); setTimeout(() => { const n = $("ce_name"); if (n) { n.focus(); n.scrollIntoView({block: "center"}); } }, 0); break;
    case "cari-cancel": S.cariEdit = null; renderMain(); break;
    case "cari-save": { const c = await saveCari(b); if (c) { S.cari.sel = c.id; S.cariEdit = {...c}; renderMain(); } break; }
    case "cari-quote": { const c = cariById(b.dataset.id); if (!c) break; guard("Yeni proforma açılırsa", () => { startNew(); applyCari(S.q, c); saveDraft(); updateCart(); S.step = 1; renderMain(); toast(c.name + " için yeni proforma · şimdi firmayı seçin"); }); break; }
    case "cari-del": { const c = cariById(b.dataset.id); if (!c) break; const n = cariStats(c).n;
      ask({title: "Cari kart silinsin mi?", msg: `<b>${esc(c.code)}</b> · ${esc(c.name)} kartı kalıcı olarak silinir.${n ? ` Bu karta ait ${n} proforma silinmez; bilgileri proformalarda kalır.` : ""}`, yes: "Sil", danger: true,
        fn: async () => { try { await Store.del("customer", c.id); S.customers = S.customers.filter(z => z.id !== c.id); S.cariEdit = null; S.cari.sel = null; toast(c.name + " silindi"); renderMain(); } catch (err) { toastErr("Silinemedi: " + authError(err)); } }}); break; }
    /* yönetim */
    case "gate-check": { const u = S.user; if (u) enter(u); break; }
    case "adm-refresh": loadUsers(); refreshAnn(); break;
    case "adm-pw": { const u = (S.admin.users || []).find(x => x.id === b.dataset.id); if (u) openPwModal(u); break; }
    case "adm-resetmail": { const u = (S.admin.users || []).find(x => x.id === b.dataset.id); if (!u) break; busy(b, true);
      try { await Store.reset(u.email); $("confirm").hidden = true; toast(u.email + " adresine şifre sıfırlama bağlantısı gönderildi"); } catch (err) { toastErr(authError(err)); busy(b, false); } break; }
    case "pw-gen": { const inp = $("ap_pw"); if (inp) { inp.value = genPassword(); inp.dispatchEvent(new Event("input", {bubbles: true})); inp.select(); } break; }
    case "ann-dismiss": { const off = annOff(); off.push(isNaN(+b.dataset.id) ? b.dataset.id : +b.dataset.id); lsSet(annOffKey(), JSON.stringify(off.slice(-100))); renderMain(); break; }
    case "ann-publish": { const A = S.annEdit; if (!A.title.trim()) { toastErr("Duyuru başlığı boş olamaz"); const t = $("an_title"); if (t) t.focus(); break; }
      busy(b, true); try { await Store.addAnn({title: A.title.trim(), body: A.body.trim(), level: ANN_LEVEL[A.level] ? A.level : "info"}); S.annEdit = {title: "", body: "", level: "info"}; await refreshAnn(); toast("Duyuru yayınlandı"); } catch (err) { toastErr("Yayınlanamadı: " + authError(err)); busy(b, false); } break; }
    case "ann-toggle": { const a = (S.ann || []).find(x => String(x.id) === b.dataset.id); if (!a) break; try { await Store.updAnn(a.id, {active: !a.active}); await refreshAnn(); toast(a.active ? "Duyuru yayından kaldırıldı" : "Duyuru yeniden yayında"); } catch (err) { toastErr(authError(err)); } break; }
    case "ann-del": { const a = (S.ann || []).find(x => String(x.id) === b.dataset.id); if (!a) break;
      ask({title: "Duyuru silinsin mi?", msg: `<b>${esc(a.title)}</b> kalıcı olarak silinir.`, yes: "Sil", danger: true, fn: async () => { try { await Store.delAnn(a.id); await refreshAnn(); toast("Duyuru silindi"); } catch (err) { toastErr(authError(err)); } }}); break; }
    case "cari-open": { const c = cariById(b.dataset.id); if (!c) break; S.cari.sel = c.id; S.cariEdit = {...c}; go("alicilar"); break; }
    case "adm-filter": S.admin.filter = b.dataset.f; renderMain(); break;
    case "adm-tab": { const v = b.dataset.v; if (!ADM_TABS.some(t => t[0] === v) || v === S.admin.tab) break; S.admin.tab = v; lsSet("ndl-admtab", v); keepFocus(b, renderMain); break; }
    /* denetim */
    case "aud-refresh": loadAudit(); break;
    case "aud-period": { const v = b.dataset.v; if (v === S.audit.period || S.audit.loading) break; S.audit.period = v; S.audit.more = 0; loadAudit(); break; }
    case "aud-view": S.audit.view = b.dataset.v; S.audit.more = 0; keepFocus(b, renderMain); break;
    case "aud-user": { const v = b.dataset.id || ""; S.audit.user = S.audit.user === v ? "" : v; S.audit.more = 0; renderMain(); break; }
    case "aud-group": S.audit.group = b.dataset.v === "stage" ? "stage" : "user"; keepFocus(b, renderMain); break;
    case "aud-grp": { const k = b.dataset.k; if (S.audit.coll.has(k)) S.audit.coll.delete(k); else S.audit.coll.add(k); keepFocus(b, renderMain); break; }
    case "aud-cat": S.audit.cat = b.dataset.v; S.audit.more = 0; keepFocus(b, renderMain); break;
    case "aud-more": S.audit.more++; renderMain(); break;
    case "aud-open": { const id = b.dataset.id; if (S.audit.open.has(id)) S.audit.open.delete(id); else S.audit.open.add(id); keepFocus(b, renderMain); break; }
    case "adm-approve": { const u = (S.admin.users || []).find(x => x.id === b.dataset.id); if (u) adminAction("admin_set_status", {target: u.id, new_status: "active"}, u.email + " onaylandı"); break; }
    case "adm-unfreeze": { const u = (S.admin.users || []).find(x => x.id === b.dataset.id); if (u) adminAction("admin_set_status", {target: u.id, new_status: "active"}, u.email + " yeniden aktif"); break; }
    case "adm-freeze": { const u = (S.admin.users || []).find(x => x.id === b.dataset.id); if (!u) break;
      ask({title: "Hesap dondurulsun mu?", msg: `<b>${esc(u.email)}</b> giriş yapamaz ve kayıtlarına erişemez. Kayıtları silinmez; daha sonra yeniden aktif edebilirsiniz.`, yes: "Dondur", danger: true, fn: () => adminAction("admin_set_status", {target: u.id, new_status: "suspended"}, u.email + " donduruldu")}); break; }
    case "adm-delete": { const u = (S.admin.users || []).find(x => x.id === b.dataset.id); if (!u) break;
      ask({title: "Hesap kalıcı olarak silinsin mi?", msg: `<b>${esc(u.email)}</b> hesabı ve bu hesaba ait <b>${esc(u.doc_count ?? 0)}</b> kayıt (proformalar, cari kartlar, ürünler, ayarlar) kalıcı olarak silinir. Bu işlem geri alınamaz.`, yes: "Kalıcı olarak sil", danger: true, fn: () => adminAction("admin_delete_user", {target: u.id}, u.email + " silindi")}); break; }
    /* ürünler */
    case "lib-type": S.lib.type = b.dataset.t; S.lib.sel = null; S.lib.edit = null; renderMain(); break;
    case "lib-brand": { const v = b.dataset.v; if (!BRANDS.includes(v) || v === libBrand()) break; S.lib.brand = v; lsSet("ndl-libbrand", v); S.lib.edit = null; keepFocus(b, renderMain); break; }
    case "le-brand": { const e = S.lib.edit, v = b.dataset.v; if (!e || !BRANDS.includes(v)) break; const bs = new Set(e.brands || BRANDS);
      if (bs.has(v)) { if (bs.size === 1) { toast("Ürün en az bir markada satılmalı"); break; } bs.delete(v); } else bs.add(v);
      e.brands = BRANDS.filter(x => bs.has(x)); keepFocus(b, renderMain); break; }
    case "lib-sel": S.lib.sel = b.dataset.id; S.lib.edit = editBuf(pById(b.dataset.id)); renderMain(); if (window.innerWidth < 1100) { const ed = document.querySelector(".editor"); if (ed) ed.scrollIntoView({block: "start", behavior: scrollMode()}); } break;
    case "lib-img-up": { const i = $("libImg"); if (i) i.click(); break; }
    case "lib-img-clear": if (S.lib.edit) { S.lib.edit.img = ""; renderMain(); } break;
    case "lib-img-def": if (S.lib.edit) { S.lib.edit.img = catalogImg(S.lib.edit); renderMain(); } break;
    case "lib-add": if (!isAdmin()) break; S.lib.edit = {id: "", code: "", name: "", nameTr: "", brands: [...BRANDS], type: S.lib.type, caps: "", sizes: ""}; renderMain(); setTimeout(() => { const n = $("le_code"); if (n) { n.focus(); n.scrollIntoView({block: "center"}); } }, 0); break;
    case "lib-cancel": S.lib.edit = null; renderMain(); break;
    case "lib-save": saveProduct(b); break;
    case "lib-del": { const p = pById(b.dataset.id); if (!p) break;
      if (!isAdmin()) break;
      ask({title: "Ürün silinsin mi?", msg: `<b>${esc(p.code)}</b> · ${esc(p.name)} ortak kütüphaneden kaldırılır; hiçbir kullanıcı artık seçemez. Kayıtlı proformalar etkilenmez.`, yes: "Sil", danger: true,
        fn: async () => { try { await Store.delShared("product", p.id); S.products = S.products.filter(z => z.id !== p.id); S.lib.sel = null; S.lib.edit = null; toast("Ürün silindi"); renderMain(); } catch (err) { toastErr("Silinemedi: " + authError(err)); } }}); break; }
    /* firmalar */
    case "co-sel": S.co.sel = b.dataset.id; S.co.edit = coBuf(companyById(b.dataset.id)); renderMain(); if (window.innerWidth < 1100) { const ed = document.querySelector(".editor"); if (ed) ed.scrollIntoView({block: "start", behavior: scrollMode()}); } break;
    case "co-add": if (!isAdmin()) break; S.co.edit = coBuf(null); renderMain(); setTimeout(() => { const n = $("co_name"); if (n) { n.focus(); n.scrollIntoView({block: "center"}); } }, 0); break;
    case "co-cancel": S.co.edit = null; renderMain(); break;
    case "co-save": saveCompany(b); break;
    case "co-logo-up": { const i = $("coLogo"); if (i) i.click(); break; }
    case "co-logo-clear": if (S.co.edit) { S.co.edit.logo = ""; renderMain(); } break;
    case "co-del": { const c = companyById(b.dataset.id); if (!c || !isAdmin()) break;
      ask({title: "Firma silinsin mi?", msg: `<b>${esc(coName(c))}</b> listeden kaldırılır ve yeni proformalarda seçilemez. Bu firmayla kesilmiş proformalar kendi kopyalarını korur.`, yes: "Sil", danger: true,
        fn: async () => { try { await Store.delShared("company", c.id); S.companies = S.companies.filter(z => z.id !== c.id); S.co.sel = null; S.co.edit = null; toast("Firma silindi"); renderMain(); } catch (err) { toastErr("Silinemedi: " + authError(err)); } }}); break; }
  }
});

/* ---------- yönlendirme ---------- */
const VIEWS = ["pano", "proforma", "proformalar", "alicilar", "urunler", "firma", "yonetim", "hesap"];
function fromHash() {
  if (!S.user || !$("main")) return;
  const prev = S.view, keep = S.keepQ; S.keepQ = false;
  const h = location.hash.slice(1); S.view = VIEWS.includes(h) ? h : "pano"; S.menu = null;
  if (S.view === "proforma" && prev !== "proforma" && !keep && S.q && S.q.saved && !S.q.dirty) { S.q = newQuote(); S.cfg = newCfg(); S.cfgTried = false; S.step = 1; S.openRows.clear(); S.pick = {search: "", mode: ""}; saveDraft(); updateCart(); }
  if (S.view !== "firma" && S.co.edit && !S.co.edit.id) S.co.edit = null;
  if (S.view === "yonetim" && S.role !== "admin") S.view = "pano";
  if (S.view === "hesap" && prev !== "hesap") S.acct = acctBuf();
  if (S.view === "yonetim") loadUsers(true);
  if (S.view !== "alicilar" && S.view !== "proforma") { S.cariEdit = null; S.pick.mode = ""; }
  renderSide(); renderMain(); const m = $("main"); if (m) m.scrollTop = 0;
  const a = document.activeElement, after = S.afterRoute; S.afterRoute = null;
  if (after) after();
  else if (prev !== S.view && !(a && a.closest && a.closest("#top"))) focusHeading("#main h1");
}
window.addEventListener("hashchange", fromHash);

boot();
