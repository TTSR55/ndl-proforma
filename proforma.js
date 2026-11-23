/* proforma.js — veri modeli, fiyat hesabı, proforma sayfası, PDF ve Excel üreticileri. DOM'a dokunmaz. */
"use strict";

let LOGO_D = "", LOGO_N = "";            // data: URL; açılışta duelsan.jpg / ndl.jpg dosyalarından doldurulur
let LOGO_S = "", LOGO_S_AR = 0;         // PDF/Excel üretilirken proformayı kesen firmanın logosu (data: URL) ve en/boy oranı
let PHOTOS = {};                         // PDF/Excel üretilirken ürün ve opsiyon fotoğrafları: kaynak → {d: data URL, ar: en/boy}
const XLSX_SRC = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
const XLSX_SRI = "sha384-Pqp51FUN2/qzfxZxBCtF0stpc9ONI6MYZpVqmo8m20SoaQCzf+arZvACkLkirlPz";

const TITLES   = ["PROFORMA INVOICE", "REVISED PROFORMA INVOICE", "QUOTATION", "PRICE OFFER"];
/* Şartlar için genel öneriler (Incoterms ve yaygın ödeme şekilleri). Yeni proformada hiçbiri seçili gelmez. */
const PAYMENTS = ["100% ADVANCE PAYMENT", "50% ADVANCE PAYMENT, 50% BEFORE SHIPMENT", "30% ADVANCE PAYMENT, 70% BEFORE SHIPMENT", "CASH AGAINST DOCUMENTS", "L/C AT SIGHT"];
const DELIVERY = ["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"];
const VALIDITY = ["7 DAYS", "15 DAYS", "30 DAYS"];
const DTIME    = ["FROM STOCK", "2 WEEKS AFTER PAYMENT", "4 WEEKS AFTER PAYMENT", "6 WEEKS AFTER PAYMENT"];
const VOLTS    = [{v: "12 V", l: "12 V"}, {v: "24 V", l: "24 V"}, {v: "12 OR 24 V", l: "12 / 24 V"}];
const MATS     = [{v: "ALU", l: "Alüminyum"}, {v: "STEEL", l: "Çelik"}];
const NOTES    = [{v: "", l: "Not yok"}, {v: "(PROMOTION)", l: "Promosyon"}, {v: "(FREE OF CHARGE)", l: "Ücretsiz"}, {v: "(SAMPLE)", l: "Numune"}];
const CUR      = {USD: "$", EUR: "€", TRY: "₺"};
const TYPES    = {LIFT: "Liftler", OPTION: "Opsiyonlar", SPARE: "Yedek parça", OTHER: "Diğer"};
const MONTHS   = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/* Firma ve banka bilgileri koda yazılmaz; yönetici "Firmalar" sayfasından girer (ör. Düelsan, Ahkos Otomotiv).
   Proforma oluşturulurken firma seçilir ve bilgileri proformaya kopyalanır; firma sonradan değişse de kesilmiş proforma değişmez. */
const COMPANY_FIELDS = ["company", "address", "contact", "since", "brandNote", "warranty", "origin", "hs", "prefix",
  "beneficiary", "bank", "branch", "ibanUSD", "ibanEUR", "ibanTRY", "swift"];
const DEFAULT_SETTINGS = {company: "", address: "", contact: "", warranty: "", origin: "", hs: "",
  beneficiary: "", bank: "", branch: "", ibanUSD: "", ibanEUR: "", ibanTRY: "", swift: "", prefix: "PI", since: "", brandNote: ""};
/* firma kaydı olmayan eski proformalar eskisi gibi basılır */
const LEGACY_HEAD = {since: "Since 1982...", brandNote: "The brand of Düelsan", logo: "duelsan.jpg"};

const CAT_BY = Object.fromEntries(CATALOG.map(p => [p.type + "|" + p.code, p]));
/* katalogdaki tüm platform ölçüleri (modelin kendi ölçüleri dışındakiler "Diğer katalog ölçüleri" olarak sunulur) */
const CATALOG_SIZES = [...new Set(CATALOG.flatMap(p => p.sizes || []))].sort((a, b) => { const x = parseSize(a), y = parseSize(b); return x[0] - y[0] || x[1] - y[1]; });

/* uygulama durumu (oturum açan kullanıcının verisi) */
const S = {
  user: null, auth: "login", authEmail: "",
  view: "proforma", step: 1,
  products: [], companies: [], settings: {}, quotes: [], customers: [],
  q: null, cfg: null, cfgTried: false, flash: null,
  openRows: new Set(), openQ: new Set(),
  qSearch: "", qCur: "", qFrom: "", qTo: "", qStage: "", qView: "group", qColl: new Set(),
  lib: {type: "LIFT", sel: null, search: "", edit: null}, co: {sel: null, edit: null},
  firm: null, menu: null, confirm: null, undo: null, busy: false
};
const products = () => (S.products.length ? S.products : CATALOG);
const settings = () => Object.assign({}, DEFAULT_SETTINGS, S.settings || {});
const companyById = id => (id ? S.companies.find(c => c.id === id) : null) || null;
/* proformayı kesen firma: proformadaki kopya; eski (firmasız) kayıtlı proformada hesabın eski firma ayarı */
const legacyQuote = q => !!(q && q.saved && !q.companyId && !q.seller);
function sellerOf(q) {
  if (q && q.seller) return Object.assign({}, DEFAULT_SETTINGS, q.seller);
  return legacyQuote(q) ? Object.assign({}, DEFAULT_SETTINGS, LEGACY_HEAD, S.settings || {}) : Object.assign({}, DEFAULT_SETTINGS);
}
const companyChosen = q => !!(q && (q.companyId || legacyQuote(q)));
function applyCompany(q, c) {
  q.companyId = c.id;
  q.seller = Object.fromEntries(COMPANY_FIELDS.map(k => [k, str(c[k])]));
  if (c.logo && !/^data:/.test(c.logo)) q.seller.logo = c.logo;   // dosya yolu kopyalanır; yüklenen logo firma kaydında kalır
  return q;
}
/* logo: firmanın güncel kaydı, yoksa proformadaki kopya; eski proformalarda Düelsan logosu */
function logoSrc(q) {
  const c = companyById(q && q.companyId);
  if (c && c.logo) return c.logo;
  if (q && q.seller) return str(q.seller.logo);
  return legacyQuote(q) ? LEGACY_HEAD.logo : "";
}
/* katalogdaki varsayılan ürün fotoğrafı */
const catalogImg = p => ((p && (CATALOG.find(x => x.id === p.id) || CAT_BY[p.type + "|" + p.code])) || {}).img || "";
const pById = id => products().find(p => p.id === id);
/* proformadaki fotoğraf: kütüphanedeki güncel kayıt (yönetici kaldırdıysa yok); ürün kütüphaneden çıkarıldıysa katalogdaki fotoğraf */
function productImg(id, snap) { const p = pById(id); return p ? str(p.img) : catalogImg(Object.assign({}, snap || {}, {id})); }
/* bir satırın fotoğrafları: ana ürün ve açıklamadaki sırasıyla opsiyonlar */
const itemPhotos = it => ({main: productImg(it.pid, it.snap), opts: (it.opts || []).map(o => productImg(o.oid)).filter(Boolean)});
const photoSrcs = q => [...new Set(q.items.flatMap(it => { const p = itemPhotos(it); return [p.main, ...p.opts]; }).filter(Boolean))];
/* PDF/Excel'de yalnızca yüklenebilen fotoğraflar kullanılır */
function loadedPhotos(it) { const p = itemPhotos(it); return {main: PHOTOS[p.main] ? p.main : "", opts: p.opts.filter(s => PHOTOS[s])}; }
const hasPhotos = (q, get) => q.items.some(it => { const p = get(it); return !!(p.main || p.opts.length); });
const optionProducts = () => products().filter(p => p.type === "OPTION");
function liftSizes(p) { if (!p) return []; const src = (p.sizes && p.sizes.length) ? p.sizes : ((CAT_BY[p.type + "|" + p.code] || {}).sizes || []); return src.map(s => parseSize(String(s))).filter(Boolean).map(m => m[0] + "x" + m[1]); }
function allSizes(p) { const s = [...liftSizes(p)]; CATALOG_SIZES.forEach(x => { if (!s.includes(x)) s.push(x); }); return s; }

/* ---------- biçimlendirme ---------- */
const nf  = new Intl.NumberFormat("tr-TR", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const nfi = new Intl.NumberFormat("tr-TR", {maximumFractionDigits: 0});
const money  = (v, c) => nf.format(v || 0) + " " + (CUR[c] || "");
const fmtInt = v => nfi.format(Number(v) || 0);
const num = v => (v === "" || v == null || isNaN(Number(v))) ? 0 : Number(v);
const hasPrice = v => v !== "" && v != null && !isNaN(Number(v));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function fmtDate(s) { if (!DATE_RE.test(String(s || ""))) return ""; const [y, m, d] = String(s).split("-"); return d + "/" + m + "/" + y.slice(2); }
function today() { const d = new Date(), z = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); }
function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function slug(s) { return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "x"; }
function parseSize(s) { const m = /^\s*(\d{2,5})\s*[x×*]\s*(\d{2,5})\s*$/i.exec(s || ""); return m ? [+m[1], +m[2]] : null; }
const sizeLabel = s => { const m = parseSize(s); return m ? m[0] + " × " + m[1] + " mm" : s; };
const matLabel  = v => (MATS.find(m => m.v === v) || {l: v}).l;
const voltLabel = v => (VOLTS.find(x => x.v === v) || {l: v}).l;
function capRange(p) { const c = (p.caps || []).map(Number).filter(n => n > 0).sort((a, b) => a - b); if (!c.length) return "—"; return c.length === 1 ? fmtInt(c[0]) + " kg" : fmtInt(c[0]) + "–" + fmtInt(c[c.length - 1]) + " kg"; }
const esc = s => String(s ?? "").replace(/[&<>"]/g, ch => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[ch]));

/* ---------- proforma modeli ---------- */
function baseQuote() {
  return {id: rid(), title: TITLES[0], no: "", date: today(), currency: "USD",
    customerId: "", buyer: "", address: "", city: "", country: "", contact: "", phone: "", email: "", taxOffice: "", taxId: "",
    payment: "", delivery: "", validity: "", dtime: "",
    items: [], status: "draft", saved: false, dirty: false};
}
/* Proforma numarasını oluşturma anında veritabanı verir (şirket genelinde tek sayaç, değiştirilemez). Taslakta numara yoktur. */
function newQuote() { return Object.assign(baseQuote(), {hsCodes: []}); }
const str = v => (v == null ? "" : String(v));
const numStr = v => (hasPrice(v) ? String(v) : "");
function normItem(it) {
  it = Object.assign({pid: "", snap: null, cap: "", volt: "", mat: "", size: "", note: "", qty: 1, price: "", opts: []}, it);
  ["pid", "volt", "mat", "note"].forEach(k => { it[k] = str(it[k]); });
  it.cap = /^\d{1,6}$/.test(str(it.cap)) ? str(it.cap) : "";
  it.size = it.size && parseSize(str(it.size)) ? parseSize(str(it.size)).join("x") : "";
  it.qty = Math.max(0, Math.min(1e6, Math.round(Number(it.qty) || 0)));
  if (it.price !== "" && it.price != null) it.price = numStr(it.price);
  if (it.snap) it.snap = {code: str(it.snap.code), name: str(it.snap.name), type: str(it.snap.type)};
  if ((it.price === "" || it.price == null) && it.manual != null) it.price = it.manual;
  delete it.manual;
  it.opts = (Array.isArray(it.opts) ? it.opts : []).filter(o => o && o.oid).map(o => ({oid: str(o.oid), name: str(o.name), price: o.price === "" || o.price == null ? "" : numStr(o.price)}));
  return it;
}
const QUOTE_TEXT = ["id", "title", "no", "sysNo", "companyId", "customerId", "buyer", "address", "city", "country", "contact", "phone", "email", "taxOffice", "taxId", "payment", "delivery", "validity", "dtime"];
function normQuote(q) {
  q = Object.assign(baseQuote(), q);
  QUOTE_TEXT.forEach(k => { q[k] = str(q[k]).slice(0, 500); });
  if (!CUR[q.currency]) q.currency = "USD";
  if (!DATE_RE.test(q.date)) q.date = today();
  q.items = (Array.isArray(q.items) ? q.items : []).map(normItem).filter(it => it.pid || it.snap);
  if (Array.isArray(q.hsCodes)) { const seen = new Set(); q.hsCodes = q.hsCodes.map(normHs).filter(h => h && !seen.has(hsKey(h)) && seen.add(hsKey(h))).slice(0, HS_MAX); }
  else delete q.hsCodes;
  if (STAGE_BY[q.stage]) { q.stageAt = Number(q.stageAt) || 0; q.stageLog = (Array.isArray(q.stageLog) ? q.stageLog : []).filter(e => e && STAGE_BY[e.k]).map(e => ({k: e.k, at: Number(e.at) || 0})).slice(-30); }
  else { delete q.stage; delete q.stageAt; delete q.stageLog; }
  if (q.seller && typeof q.seller === "object") { const o = {}; [...COMPANY_FIELDS, "logo"].forEach(k => { if (q.seller[k] != null) o[k] = str(q.seller[k]).slice(0, 500); }); if (/^data:/.test(o.logo || "")) delete o.logo; q.seller = o; }
  else delete q.seller;
  return q;
}
/* ---------- HS kodları (GTİP) ----------
   Proforma oluşturulurken kullanıcı girer; birden çok kod olabilir. Eski proformalarda firma kaydındaki tek kod geçerlidir. */
const HS_MAX = 10;
function normHs(v) {
  const s = String(v == null ? "" : v).trim().replace(/\s+/g, "").replace(/^\.+|\.+$/g, "");
  if (!/^[0-9][0-9.]*$/.test(s)) return "";
  const n = s.replace(/\./g, "").length; return n >= 4 && n <= 14 ? s : "";
}
const hsKey = s => String(s).replace(/\D/g, "");
function hsList(q) {
  if (q && Array.isArray(q.hsCodes)) return q.hsCodes;
  const old = normHs(sellerOf(q).hs); return old ? [old] : [];
}
const hsText = q => hsList(q).join(", ");

/* ---------- teklif aşamaları ----------
   Proformanın satış sürecindeki yeri. Kullanıcı Kayıtlar'dan günceller; her değişiklik tarihiyle geçmişe yazılır.
   grp: open = süreç devam ediyor · won = olumlu sonuçlandı · lost = olumsuz kapandı */
const STAGES = [
  {k: "prepared",    l: "Hazırlandı",         d: "Proforma oluşturuldu, henüz müşteriye iletilmedi.", tag: "grey",        grp: "open"},
  {k: "sent",        l: "Müşteriye İletildi", d: "Müşteriye gönderildi, yanıt bekleniyor.",           tag: "blue",        grp: "open"},
  {k: "negotiation", l: "Müzakere Sürecinde", d: "Fiyat ya da şartlar müşteriyle görüşülüyor.",       tag: "amber",       grp: "open"},
  {k: "approved",    l: "Onaylandı",          d: "Müşteri proformayı onayladı.",                       tag: "green",       grp: "won"},
  {k: "ordered",     l: "Siparişe Dönüştü",   d: "Ödeme ya da sipariş teyidi alındı.",                 tag: "solid-green", grp: "won"},
  {k: "declined",    l: "Reddedildi",         d: "Müşteri teklifi kabul etmedi.",                      tag: "red",         grp: "lost"},
  {k: "cancelled",   l: "İptal Edildi",       d: "Teklif geri çekildi ya da geçersiz kılındı.",        tag: "void",        grp: "lost"}
];
const STAGE_BY = Object.fromEntries(STAGES.map(s => [s.k, s]));
const stageOf = q => (q && STAGE_BY[q.stage]) ? q.stage : "prepared";   // aşaması olmayan (eski) kayıtlar "Hazırlandı" sayılır
const stageOpen = k => STAGE_BY[k].grp === "open";
/* opsiyon (geçerlilik) süresi: "15 DAYS" → proforma tarihi + 15 gün. Yalnızca süreci devam eden tekliflerde izlenir. */
function validUntil(q) {
  const m = /(\d{1,3})\s*(DAYS?|GÜN|GUN|WEEKS?|HAFTA|MONTHS?|AY)\b/i.exec(String(q.validity || ""));
  if (!m || !DATE_RE.test(String(q.date))) return "";
  const u = m[2].toUpperCase(), n = Number(m[1]) * (/^(WEEK|HAFTA)/.test(u) ? 7 : /^(MONTH|AY)/.test(u) ? 30 : 1);
  const d = new Date(q.date + "T00:00:00"); d.setDate(d.getDate() + n);
  const z = x => String(x).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
}
function expiry(q) {
  if (!stageOpen(stageOf(q))) return null;
  const u = validUntil(q); if (!u) return null;
  return {until: u, days: Math.round((new Date(u + "T00:00:00") - new Date(today() + "T00:00:00")) / 864e5)};
}

/* İsteğe bağlı örnek şablon: tamamen hayali bir firma ve katalogdan rastgele seçilmiş ürünler, yer tutucu fiyatlar.
   Gerçek bir müşteri ya da teklifle ilgisi yoktur; kullanıcı yalnızca "Örnek şablonu aç" derse açılır. */
const TEMPLATE_BUYER = "ÖRNEK FİRMA A.Ş.";
function templateQuote() {
  const L = (code, o) => { const p = CATALOG.find(x => x.code === code) || {}; return Object.assign({pid: p.id, snap: {code: p.code, name: p.name, type: p.type}, opts: [], note: ""}, o); };
  const op = n => { const p = CATALOG.find(x => x.type === "OPTION" && x.name === n); return p ? [{oid: p.id, name: p.name, price: "100"}] : []; };
  const q = normQuote({buyer: TEMPLATE_BUYER, address: "Örnek Mahallesi, Deneme Caddesi No: 1", country: "TÜRKİYE", contact: "Ad Soyad",
    payment: PAYMENTS[0], delivery: "EXW", validity: "15 DAYS", dtime: "FROM STOCK", sample: true, hsCodes: ["8428.90"],
    seller: {company: "ÖRNEK SATICI A.Ş.", address: "Örnek Mahallesi, Örnek Caddesi No: 2, Şehir", contact: "Tel: +90 000 000 00 00 · E-posta: info@ornek.example",
      origin: "TÜRKİYE", beneficiary: "ÖRNEK SATICI A.Ş.", bank: "ÖRNEK BANKA", branch: "MERKEZ", ibanUSD: "TR00 0000 0000 0000 0000 0000 00", ibanEUR: "TR00 0000 0000 0000 0000 0000 00", ibanTRY: "TR00 0000 0000 0000 0000 0000 00", swift: "XXXXTRXX"},
    items: [L("NDL 5010", {cap: "750", mat: "ALU", size: "2200x1800", volt: "12 V", qty: 2, price: "1000"}),
      L("NDL 5050", {cap: "500", mat: "STEEL", size: "2080x1100", volt: "24 V", qty: 1, price: "1000", opts: op("WARNING LIGHT")}),
      L("NDL 5030", {cap: "500", mat: "ALU", size: "1160x980", volt: "12 V", qty: 3, price: "1000"})]});
  return q;
}

const basePrice   = it => num(it.price);
const optsTotal   = it => (it.opts || []).reduce((a, o) => a + num(o.price), 0);
const unitPrice   = it => basePrice(it) + optsTotal(it);
const lineTotal   = it => unitPrice(it) * (Number(it.qty) || 0);
const qTotal      = q => (q.items || []).reduce((a, it) => a + lineTotal(it), 0);
const isPromo     = it => hasPrice(it.price) && unitPrice(it) === 0;
const missingPrice = it => !hasPrice(it.price) || (it.opts || []).some(o => !hasPrice(o.price));
function optName(o) { const p = pById(o.oid); return p ? p.name : (o.name || ""); }
function itemInfo(it) { const p = pById(it.pid) || it.snap || {}; return {code: p.code || "", name: p.name || "", type: p.type || ""}; }
const isSpareOnly = q => q.items.length > 0 && q.items.every(it => { const t = itemInfo(it).type; return t === "SPARE" || t === "OTHER"; });
const addrLine = q => [String(q.address || "").replace(/\s*\n\s*/g, ", ").trim(), q.city, q.country].filter(Boolean).join(", ");

/* ---------- cari kart ---------- */
const CARI_TEXT = ["code", "name", "taxOffice", "taxId", "address", "city", "country", "contact", "phone", "email", "currency", "payment", "delivery", "notes"];
function normCari(c) {
  const o = {id: str(c && c.id)}; CARI_TEXT.forEach(k => { o[k] = str(c && c[k]).slice(0, k === "notes" || k === "address" ? 1000 : 200); });
  if (!CUR[o.currency]) o.currency = "USD"; o.createdAt = Number(c && c.createdAt) || 0; o.updatedAt = Number(c && c.updatedAt) || 0; return o;
}
function nextCariCode() { let max = 0; S.customers.forEach(c => { const m = /^C(\d+)$/.exec(c.code || ""); if (m) max = Math.max(max, +m[1]); }); return "C" + String(max + 1).padStart(4, "0"); }
/* seçilen cari kartın bilgileri proformaya kopyalanır (proforma kendi kopyasını saklar; kart sonradan değişse de eski proforma bozulmaz) */
function applyCari(q, c) {
  Object.assign(q, {customerId: c.id, buyer: c.name, address: c.address, city: c.city, country: c.country, contact: c.contact, phone: c.phone, email: c.email, taxOffice: c.taxOffice, taxId: c.taxId});
  if (!q.saved) { if (CUR[c.currency]) q.currency = c.currency; if (c.payment && !q.payment) q.payment = c.payment; if (c.delivery && !q.delivery) q.delivery = c.delivery; }
  return q;
}

/* açıklama satırları [{t, red}] — önizleme, PDF ve Excel aynı metni kullanır */
function descLines(it) {
  const {name} = itemInfo(it); const L = [];
  if (name) L.push([{t: name}]);
  if (it.cap) L.push([{t: it.cap + " KG"}]);
  if (it.volt) L.push([{t: it.volt, red: true}]);
  if (it.mat || it.size) {
    const seg = [];
    if (it.mat) seg.push({t: it.mat + " PLATFORM" + (it.size ? " SIZE " : "")});
    if (it.size) { if (!it.mat) seg.push({t: "PLATFORM SIZE "}); seg.push({t: it.size, red: true}); }
    L.push(seg);
  }
  (it.opts || []).forEach(o => L.push([{t: "+ " + optName(o)}]));
  if (it.note) L.push([{t: it.note}]);
  return L;
}

/* ---------- ürün yapılandırıcı ---------- */
function newCfg(mode) { return {mode: mode || "lift", pid: "", cap: "", mat: "", size: "", sizeMode: "std", w: "", d: "", volt: "", opts: [], price: "", qty: 1, note: "", edit: null}; }
function cfgSize(c) { if (c.sizeMode === "custom") { const w = Math.round(+c.w), d = Math.round(+c.d); return (w > 0 && d > 0) ? w + "x" + d : ""; } return c.size; }
function cfgFromItem(it, i) {
  const p = pById(it.pid), t = (p || it.snap || {}).type;
  const c = newCfg(t === "LIFT" ? "lift" : "spare");
  Object.assign(c, {pid: it.pid, cap: String(it.cap || ""), mat: it.mat || "", volt: it.volt || "", price: it.price ?? "", qty: it.qty || 1, note: it.note || "", opts: (it.opts || []).map(o => ({...o})), edit: i});
  if (it.size && !(p ? allSizes(p) : CATALOG_SIZES).includes(it.size)) { const m = parseSize(it.size); c.sizeMode = "custom"; c.w = m ? String(m[0]) : ""; c.d = m ? String(m[1]) : ""; }
  else c.size = it.size || "";
  return c;
}
function cfgItem(c) {
  const p = pById(c.pid), lift = c.mode === "lift";
  return normItem({pid: c.pid, snap: p ? {code: p.code, name: p.name, type: p.type} : null,
    cap: lift ? c.cap : "", volt: lift ? c.volt : "", mat: lift ? c.mat : "", size: lift ? cfgSize(c) : "",
    note: c.note, qty: Math.max(1, Math.round(Number(c.qty) || 1)), price: c.price,
    opts: lift ? c.opts.map(o => ({oid: o.oid, name: optName(o), price: o.price})) : []});
}
function cfgMissing(c) {
  const p = pById(c.pid), m = [];
  if (!p) { m.push(c.mode === "lift" ? "model" : "parça"); return m; }
  if (c.mode === "lift") {
    if ((p.caps || []).length && !c.cap) m.push("kapasite");
    if (!c.mat) m.push("kapak türü");
    if (!cfgSize(c)) m.push("boyut");
    if (!c.volt) m.push("powerpack");
    if (c.opts.some(o => !hasPrice(o.price))) m.push("opsiyon fiyatı");
  }
  if (!hasPrice(c.price)) m.push("fiyat");
  if (!(Number(c.qty) > 0)) m.push("adet");
  return m;
}
const cfgUnit = c => num(c.price) + (c.mode === "lift" ? c.opts.reduce((a, o) => a + num(o.price), 0) : 0);

/* ---------- proforma sayfası (HTML önizleme; PDF ile birebir) ---------- */
function paperHtml(q, live) {
  const st = sellerOf(q), sp = isSpareOnly(q), c = q.currency, ls = logoSrc(q);
  const ph = hasPhotos(q, itemPhotos), n = ph ? 7 : 6;
  const photoTd = it => { const p = itemPhotos(it);
    return `<td class="ph">${p.main ? `<img class="m" src="${esc(p.main)}" alt="">` : ""}${p.opts.length ? `<div class="ops">${p.opts.map(s => `<img src="${esc(s)}" alt="">`).join("")}</div>` : ""}</td>`; };
  const rows = q.items.map((it, i) => {
    const desc = descLines(it).map(l => l.map(s => s.red ? `<span class="red">${esc(s.t)}</span>` : esc(s.t)).join("")).join("<br>");
    const cls = [isPromo(it) ? "promo" : "", sp ? "sp" : "", live && S.flash === i ? "flash" : ""].filter(Boolean).join(" ");
    return `<tr class="${cls}"${live ? ` data-act="li-edit" data-i="${i}" title="Düzenlemek için tıklayın"` : ""}><td>${i + 1}</td><td>${esc(itemInfo(it).code)}</td>${ph ? photoTd(it) : ""}<td>${desc}</td><td>${esc(it.qty)}</td><td class="money">${money(unitPrice(it), c)}</td><td class="money">${money(lineTotal(it), c)}</td></tr>`;
  }).join("");
  const w = ph ? [30, 80, 96, 58, 92, 98] : [36, 90, 0, 66, 100, 108];
  return `
   <div class="p-head"><div>${ls ? `<img src="${esc(ls)}" alt="${esc(st.company)}" style="max-width:124px;max-height:44px;width:auto;height:auto">` : `<div style="height:40px"></div>`}<div class="p-since">${esc(st.since)}</div>
     <div class="p-co">${esc(st.company)}<br>${esc(st.address)}<br>${esc(st.contact)}</div></div>
     <div><img src="${LOGO_N || "ndl.jpg"}" width="72" alt="NDL"><div class="p-brand">${esc(st.brandNote)}</div></div></div>
   <div class="p-title">${esc(q.title)}</div>
   <table class="p-info"><tbody>
     <tr><td class="lb">BUYER</td><td>${esc(q.buyer)}</td><td class="rl">DATE</td><td class="rv">${fmtDate(q.date)}</td></tr>
     <tr><td class="lb">ADDRESS</td><td>${esc(addrLine(q))}</td><td class="rl">NO</td><td class="rv">${esc(q.no || "TASLAK")}</td></tr>
     <tr><td class="lb">PAYMENT TERM</td><td>${esc(q.payment)}</td><td class="rl">DELIVERY TERM</td><td class="rv">${esc(q.delivery)}</td></tr>
     <tr><td class="lb">OFFER VALIDITY</td><td>${esc(q.validity)}</td><td class="rl">DELIVERY TIME</td><td class="rv">${esc(q.dtime)}</td></tr>
     <tr><td class="lb">ORIGIN OF THE GOODS</td><td>${esc(st.origin)}</td><td class="rl">HS CODE</td><td class="rv">${esc(hsText(q))}</td></tr>
   </tbody></table>
   <div class="p-warr">${esc(st.warranty)}</div>
   <table class="p-items"><thead><tr><th style="width:${w[0]}px">NO</th><th style="width:${w[1]}px">CODE</th>${ph ? `<th style="width:${w[2]}px">IMAGE</th>` : ""}<th>ITEM DESCRIPTION</th><th style="width:${w[3]}px">QUANTITY</th><th style="width:${w[4]}px">UNIT PRICE(${esc(c)})</th><th style="width:${w[5]}px">TOTAL PRICE(${esc(c)})</th></tr></thead>
   <tbody>${rows || `<tr><td colspan="${n}" style="height:44px;color:#8a8a8a">Henüz kalem eklenmedi</td></tr>`}
   <tr class="total"><td class="blank" colspan="${n - 3}"></td><td colspan="2">TOTAL</td><td class="money">${money(qTotal(q), c)}</td></tr></tbody></table>
   <div class="p-bank-h">BANK DETAILS</div>
   <table class="p-bank"><tbody>
     <tr><td class="lb">BENEFICIARY:</td><td>${esc(st.beneficiary)}</td></tr>
     <tr><td class="lb">BANK:</td><td>${esc(st.bank)}</td></tr>
     <tr><td class="lb">BRANCH:</td><td>${esc(st.branch)}</td></tr>
     <tr><td class="lb">${esc(c)} IBAN:</td><td>${esc(st["iban" + c] || "")}</td></tr>
     <tr><td class="lb">SWIFT CODE:</td><td>${esc(st.swift)}</td></tr>
   </tbody></table>`;
}

/* ---------- PDF (pdfmake; Roboto Türkçe karakterleri kapsar) ---------- */
function pdfDoc(q) {
  const st = sellerOf(q), sp = isSpareOnly(q), B = "#000000", c = q.currency;
  const ph = hasPhotos(q, loadedPhotos), n = ph ? 7 : 6, PW = 64;   // PW: fotoğraf sütununun iç genişliği (pt)
  const images = {}, key = {};
  photoSrcs(q).forEach((s, i) => { if (PHOTOS[s]) { key[s] = "ph" + i; images["ph" + i] = PHOTOS[s].d; } });
  /* fotoğraf hücresi: ana ürün, altında opsiyonlar ikişerli */
  const photoCell = it => {
    const p = loadedPhotos(it), stack = [];
    if (p.main) stack.push({image: key[p.main], fit: [PW, 44], alignment: "center"});
    for (let k = 0; k < p.opts.length; k += 2) {
      const two = p.opts.slice(k, k + 2);
      stack.push({columns: two.map(s => ({width: 30, image: key[s], fit: [30, 21], alignment: "center"})), columnGap: 4, margin: [two.length === 1 ? 17 : 0, stack.length ? 3 : 0, 0, 0]});
    }
    return {stack, margin: [0, 3, 0, 3]};
  };
  const cell = (text, o = {}) => Object.assign({text, alignment: "center", margin: [2, sp ? 2 : 4, 2, sp ? 2 : 4]}, o);
  const head = ["NO", "CODE", ...(ph ? ["IMAGE"] : []), "ITEM DESCRIPTION", "QUANTITY", "UNIT PRICE(" + c + ")", "TOTAL PRICE(" + c + ")"];
  const body = [head.map(h => cell(h, {bold: true, fontSize: 7.5, margin: [2, 6, 2, 6]}))];
  q.items.forEach((it, i) => {
    const desc = descLines(it).flatMap((l, li) => [...(li ? [{text: "\n"}] : []), ...l.map(s => ({text: s.t, color: s.red ? "#E00000" : B}))]);
    const row = [cell(String(i + 1)), cell(itemInfo(it).code), ...(ph ? [photoCell(it)] : []), cell(desc), cell(String(it.qty)), cell(money(unitPrice(it), c)), cell(money(lineTotal(it), c))];
    if (isPromo(it)) row.forEach(x => { x.fillColor = "#FFFF00"; x.bold = true; });
    body.push(row);
  });
  const fill = k => Array.from({length: k}, () => ({}));
  if (!q.items.length) body.push([cell("", {colSpan: n}), ...fill(n - 1)]);
  body.push([{text: "", colSpan: n - 3, border: [false, false, false, false]}, ...fill(n - 4), cell("TOTAL", {colSpan: 2, bold: true}), {}, cell(money(qTotal(q), c), {bold: true})]);
  const info = [["BUYER", q.buyer, "DATE", fmtDate(q.date)], ["ADDRESS", addrLine(q), "NO", q.no || "TASLAK"], ["PAYMENT TERM", q.payment, "DELIVERY TERM", q.delivery], ["OFFER VALIDITY", q.validity, "DELIVERY TIME", q.dtime], ["ORIGIN OF THE GOODS", st.origin, "HS CODE", hsText(q)]]
    .map(r => [{text: r[0], bold: true}, {text: r[1] || ""}, {text: r[2], bold: true, alignment: "center"}, {text: r[3] || "", alignment: "center"}]);
  const bank = [["BENEFICIARY:", st.beneficiary], ["BANK:", st.bank], ["BRANCH:", st.branch], [c + " IBAN:", st["iban" + c] || ""], ["SWIFT CODE:", st.swift]].map(r => [{text: r[0], bold: true}, {text: r[1] || ""}]);
  const thin = {hLineWidth: () => 0.6, vLineWidth: () => 0.6, hLineColor: () => B, vLineColor: () => B};
  const left = [LOGO_S ? {image: LOGO_S, fit: [118, 40]} : {text: " ", fontSize: 26}, {text: st.since || "", fontSize: 7, margin: [104, 0, 0, 0]},
    {text: [st.company, "\n", st.address, "\n", st.contact], fontSize: 7.5, lineHeight: 1.25, margin: [0, 2, 0, 0]}];
  const right = [LOGO_N ? {image: LOGO_N, width: 62, alignment: "center"} : {text: ""}, {text: st.brandNote || "", italics: true, fontSize: 6.5, alignment: "center", margin: [0, 3, 0, 0]}];
  return {pageSize: "A4", pageMargins: [32, 30, 32, 30], defaultStyle: {font: "Roboto", fontSize: 8, color: B},
    info: {title: (q.title || "") + " " + (q.no || "")}, images,
    content: [
      {columns: [{stack: left}, {width: 90, stack: right}]},
      {text: q.title || "", bold: true, fontSize: 12, alignment: "center", margin: [0, 12, 0, 8]},
      {table: {widths: [100, "*", 70, 160], body: info}, layout: Object.assign({paddingTop: () => 4, paddingBottom: () => 4}, thin), fontSize: 7.5},
      {text: st.warranty || "", color: "#E00000", bold: true, italics: true, alignment: "center", fontSize: 7.5, margin: [0, 10, 0, 14]},
      {table: {headerRows: 1, dontBreakRows: true, widths: ph ? [20, 52, PW, "*", 40, 62, 66] : [24, 64, "*", 48, 74, 80], body}, layout: thin},
      {text: "BANK DETAILS", bold: true, fontSize: 7.5, margin: [0, 14, 0, 2]},
      {table: {widths: [120, 220], body: bank}, layout: Object.assign({paddingTop: () => 2, paddingBottom: () => 2}, thin), fontSize: 7.5}
    ]};
}

/* ---------- Excel (ExcelJS) — PDF ile aynı sayfa, tutarlar formüllü ---------- */
async function buildXlsx(EX, q) {
  const st = sellerOf(q), c = q.currency, sym = CUR[c] || "", sp = isSpareOnly(q);
  /* fotoğraf varsa sütunlar: NO · CODE · IMAGE · ITEM DESCRIPTION · QUANTITY · UNIT · TOTAL */
  const ph = hasPhotos(q, loadedPhotos), K = ph ? {qty: "E", unit: "F", tot: "G", n: 7} : {qty: "D", unit: "E", tot: "F", n: 6};
  const wb = new EX.Workbook(); wb.creator = st.company || "NDL Proforma"; wb.created = new Date();
  const ws = wb.addWorksheet("PROFORMA", {views: [{showGridLines: false}],
    pageSetup: {paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true,
      margins: {left: 0.4, right: 0.4, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2}}});
  ws.columns = (ph ? [5, 13, 14, 36, 11, 15, 16] : [6, 14, 47, 12, 16, 17]).map(width => ({width}));
  const F = (o = {}) => Object.assign({name: "Times New Roman", size: 8, color: {argb: "FF000000"}}, o);
  const thin = {style: "thin", color: {argb: "FF000000"}}, box = {top: thin, left: thin, bottom: thin, right: thin};
  const C = a => ({horizontal: "center", vertical: "middle", wrapText: true, ...a}), Lf = {horizontal: "left", vertical: "middle", wrapText: true};
  const put = (addr, v, font, align) => { const x = ws.getCell(addr); x.value = v; x.font = F(font); x.alignment = align || Lf; return x; };
  const mfmt = `#,##0.00 "${sym}"`;
  [1, 2, 3, 4].forEach(r => ws.getRow(r).height = 14);
  if (LOGO_S) ws.addImage(wb.addImage({base64: LOGO_S, extension: /^data:image\/png/i.test(LOGO_S) ? "png" : "jpeg"}), {tl: {col: 0.08, row: 0.15}, ext: {width: LOGO_S_AR ? Math.round(Math.min(220, 54 * LOGO_S_AR)) : 154, height: 54}});
  if (LOGO_N) ws.addImage(wb.addImage({base64: LOGO_N, extension: "jpeg"}), {tl: {col: K.n - 1 + 0.12, row: 0.1}, ext: {width: 96, height: 49}});
  put("B5", st.since || "", {size: 7.5, italic: true}, {horizontal: "left", vertical: "top"});
  put(K.tot + "5", st.brandNote || "", {size: 7, italic: true}, C());
  [[6, st.company], [7, st.address], [8, st.contact]].forEach(([r, v]) => { ws.mergeCells(`A${r}:${K.qty}${r}`); put("A" + r, v || "", {size: 8}, {horizontal: "left", vertical: "middle"}); ws.getRow(r).height = 12; });
  ws.mergeCells(`A10:${K.tot}10`); put("A10", q.title || "", {size: 12, bold: true}, C()); ws.getRow(10).height = 22;
  const info = [["BUYER", q.buyer, "DATE", fmtDate(q.date)], ["ADDRESS", addrLine(q), "NO", q.no || "TASLAK"], ["PAYMENT TERM", q.payment, "DELIVERY TERM", q.delivery], ["OFFER VALIDITY", q.validity, "DELIVERY TIME", q.dtime], ["ORIGIN OF THE GOODS", st.origin, "HS CODE", hsText(q)]];
  info.forEach((r, i) => {
    const n = 12 + i;
    ws.mergeCells(`A${n}:B${n}`); if (ph) ws.mergeCells(`C${n}:D${n}`); ws.mergeCells(`${K.unit}${n}:${K.tot}${n}`);
    put("A" + n, r[0], {bold: true}); put("C" + n, r[1] || ""); put(K.qty + n, r[2], {bold: true}, C()); put(K.unit + n, r[3] || "", {}, C());
    for (let col = 1; col <= K.n; col++) ws.getCell(n, col).border = box;
    const lines = Math.max(Math.ceil(String(r[1] || "").length / 52), Math.ceil(String(r[3] || "").length / 28), r[2].length > 11 ? 2 : 1, 1);
    ws.getRow(n).height = lines > 1 ? 6 + 10 * lines : 16;
  });
  ws.mergeCells(`A18:${K.tot}18`); put("A18", st.warranty || "", {bold: true, italic: true, color: {argb: "FFE00000"}}, C()); ws.getRow(18).height = 16;
  const H = 20;
  ["NO", "CODE", ...(ph ? ["IMAGE"] : []), "ITEM DESCRIPTION", "QUANTITY", `UNIT PRICE(${c})`, `TOTAL PRICE(${c})`].forEach((h, i) => { const x = ws.getCell(H, i + 1); x.value = h; x.font = F({bold: true}); x.alignment = C(); x.border = box; });
  ws.getRow(H).height = 28;
  /* fotoğraflar C sütununa piksel konumuyla yerleşir (sütun ≈ 98 px): ana ürün 88×58, opsiyonlar ikişerli 42×28 */
  const ids = {}; Object.keys(PHOTOS).forEach(s => { ids[s] = wb.addImage({base64: PHOTOS[s].d, extension: "jpeg"}); });
  const EMU = 9525, X0 = 5, Y0 = 5, GAP = 4, MW = 88, MH = 58, OW = 42, OH = 28;
  const photoPx = p => (p.main || p.opts.length) ? Y0 * 2 + (p.main ? MH : 0) + Math.ceil(p.opts.length / 2) * (OH + GAP) - (p.main ? 0 : GAP) : 0;
  const placePhotos = (p, r) => {
    let y = Y0 + Math.max(0, Math.floor((ws.getRow(r).height / 0.75 - photoPx(p)) / 2));   // satırda dikey ortalı
    const place = (s, x, bw, bh) => {
      const a = PHOTOS[s].ar || 1.5, w = Math.max(1, Math.round(Math.min(bw, bh * a))), h = Math.max(1, Math.round(w / a));
      ws.addImage(ids[s], {tl: {nativeCol: 2, nativeColOff: Math.round((x + (bw - w) / 2) * EMU), nativeRow: r - 1, nativeRowOff: Math.round((y + (bh - h) / 2) * EMU)}, ext: {width: w, height: h}});
    };
    if (p.main) { place(p.main, X0, MW, MH); y += MH + GAP; }
    for (let k = 0; k < p.opts.length; k += 2) {
      const two = p.opts.slice(k, k + 2), x = two.length === 1 ? X0 + (MW - OW) / 2 : X0;
      two.forEach((s, j) => place(s, x + j * (OW + GAP), OW, OH)); y += OH + GAP;
    }
  };
  let r = H + 1;
  q.items.forEach((it, i) => {
    const pr = isPromo(it), lines = descLines(it), base = {size: 8.5, bold: pr}, p = ph ? loadedPhotos(it) : null;
    const runs = []; lines.forEach((l, li) => l.forEach((s, si) => runs.push({text: (li && !si ? "\n" : "") + s.t, font: F({...base, color: {argb: s.red ? "FFE00000" : "FF000000"}})})));
    const vals = [i + 1, itemInfo(it).code, ...(ph ? [""] : []), {richText: runs}, Number(it.qty) || 0, unitPrice(it), {formula: `${K.qty}${r}*${K.unit}${r}`, result: lineTotal(it)}];
    vals.forEach((v, ci) => {
      const x = ws.getCell(r, ci + 1); x.value = v; x.font = F(base); x.alignment = C(); x.border = box;
      if (ci >= K.n - 2) x.numFmt = mfmt;
      if (pr) x.fill = {type: "pattern", pattern: "solid", fgColor: {argb: "FFFFFF00"}};
    });
    ws.getRow(r).height = Math.max(sp ? 16 : 40, lines.length * 12.5 + 10, p ? Math.ceil(photoPx(p) * 0.75) + 1 : 0);
    if (p) placePhotos(p, r);
    r++;
  });
  if (!q.items.length) { for (let col = 1; col <= K.n; col++) ws.getCell(r, col).border = box; ws.getRow(r).height = 30; r++; }
  const last = r - 1;
  ws.mergeCells(`${K.qty}${r}:${K.unit}${r}`); put(K.qty + r, "TOTAL", {bold: true}, C()); ws.getCell(K.qty + r).border = box; ws.getCell(K.unit + r).border = box;
  const t = ws.getCell(K.tot + r); t.value = {formula: `SUM(${K.tot}${H + 1}:${K.tot}${last})`, result: qTotal(q)}; t.font = F({bold: true}); t.alignment = C(); t.numFmt = mfmt; t.border = box;
  ws.getRow(r).height = 20;
  r += 2; put("A" + r, "BANK DETAILS", {bold: true}, {horizontal: "left", vertical: "middle", wrapText: false}); r++;
  [["BENEFICIARY:", st.beneficiary], ["BANK:", st.bank], ["BRANCH:", st.branch], [c + " IBAN:", st["iban" + c] || ""], ["SWIFT CODE:", st.swift]].forEach(([a, b]) => {
    ws.mergeCells(`A${r}:B${r}`); if (ph) ws.mergeCells(`C${r}:D${r}`); put("A" + r, a, {bold: true}); put("C" + r, b || "");
    for (let col = 1; col <= (ph ? 4 : 3); col++) ws.getCell(r, col).border = box;
    ws.getRow(r).height = 14; r++;
  });
  ws.pageSetup.printArea = `A1:${K.tot}${r - 1}`;
  return wb;
}
