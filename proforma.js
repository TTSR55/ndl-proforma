/* proforma.js — veri modeli, fiyat hesabı, proforma sayfası, PDF ve Excel üreticileri. DOM'a dokunmaz. */
"use strict";

let LOGO_D = "", LOGO_N = "";            // data: URL; açılışta duelsan.jpg / ndl.jpg dosyalarından doldurulur
const XLSX_SRC = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";

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

/* Firma ve banka bilgileri koda yazılmaz; her kullanıcı kendi hesabında "Firma" sayfasından girer. */
const DEFAULT_SETTINGS = {company: "", address: "", contact: "", warranty: "", origin: "", hs: "",
  beneficiary: "", bank: "", branch: "", ibanUSD: "", ibanEUR: "", ibanTRY: "", swift: "", prefix: "PI"};

const CAT_BY = Object.fromEntries(CATALOG.map(p => [p.type + "|" + p.code, p]));
/* katalogdaki tüm platform ölçüleri (modelin kendi ölçüleri dışındakiler "Diğer katalog ölçüleri" olarak sunulur) */
const CATALOG_SIZES = [...new Set(CATALOG.flatMap(p => p.sizes || []))].sort((a, b) => { const x = parseSize(a), y = parseSize(b); return x[0] - y[0] || x[1] - y[1]; });

/* uygulama durumu (oturum açan kullanıcının verisi) */
const S = {
  user: null, auth: "login", authEmail: "",
  view: "proforma", step: 1,
  products: [], settings: {}, quotes: [], customers: [],
  q: null, cfg: null, cfgTried: false, flash: null,
  openRows: new Set(), openQ: new Set(),
  qSearch: "", qCur: "", qFrom: "", qTo: "",
  lib: {type: "LIFT", sel: null, search: "", edit: null},
  firm: null, menu: null, confirm: null, undo: null, busy: false
};
const products = () => (S.products.length ? S.products : CATALOG);
const settings = () => Object.assign({}, DEFAULT_SETTINGS, S.settings || {});
const pById = id => products().find(p => p.id === id);
const optionProducts = () => products().filter(p => p.type === "OPTION");
function liftSizes(p) { if (!p) return []; if (p.sizes && p.sizes.length) return p.sizes.map(String); const c = CAT_BY[p.type + "|" + p.code]; return (c && c.sizes) || []; }
function allSizes(p) { const s = [...liftSizes(p)]; CATALOG_SIZES.forEach(x => { if (!s.includes(x)) s.push(x); }); return s; }

/* ---------- biçimlendirme ---------- */
const nf  = new Intl.NumberFormat("tr-TR", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const nfi = new Intl.NumberFormat("tr-TR", {maximumFractionDigits: 0});
const money  = (v, c) => nf.format(v || 0) + " " + (CUR[c] || "");
const fmtInt = v => nfi.format(Number(v) || 0);
const num = v => (v === "" || v == null || isNaN(Number(v))) ? 0 : Number(v);
const hasPrice = v => v !== "" && v != null && !isNaN(Number(v));
function fmtDate(s) { if (!s) return ""; const [y, m, d] = String(s).split("-"); return d + "/" + m + "/" + y.slice(2); }
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
    buyer: "", address: "", country: "", contact: "", phone: "", email: "", taxId: "",
    payment: "", delivery: "", validity: "", dtime: "",
    items: [], status: "draft", saved: false, dirty: false};
}
function newQuote() { const q = baseQuote(); q.no = nextNo(); q.autoNo = true; return q; }
function normItem(it) {
  it = Object.assign({pid: "", snap: null, cap: "", volt: "", mat: "", size: "", note: "", qty: 1, price: "", opts: []}, it);
  if ((it.price === "" || it.price == null) && it.manual != null) it.price = it.manual;
  delete it.manual;
  it.opts = (it.opts || []).filter(o => o && o.oid).map(o => ({oid: o.oid, name: o.name || "", price: o.price ?? ""}));
  return it;
}
function normQuote(q) { q = Object.assign(baseQuote(), q); q.items = (q.items || []).map(normItem).filter(it => it.pid || it.snap); return q; }
function nextNo() {
  const pre = (settings().prefix || "PI") + new Date().getFullYear() + "/"; let max = 0;
  S.quotes.forEach(x => { const s = String(x.no || ""); if (s.startsWith(pre)) { const n = parseInt(s.slice(pre.length), 10); if (n > max) max = n; } });
  return pre + String(max + 1).padStart(4, "0");
}
/* İsteğe bağlı örnek şablon: tamamen hayali bir firma ve katalogdan rastgele seçilmiş ürünler, yer tutucu fiyatlar.
   Gerçek bir müşteri ya da teklifle ilgisi yoktur; kullanıcı yalnızca "Örnek şablonu aç" derse açılır. */
const TEMPLATE_BUYER = "ÖRNEK FİRMA A.Ş.";
function templateQuote() {
  const L = (code, o) => { const p = CATALOG.find(x => x.code === code) || {}; return Object.assign({pid: p.id, snap: {code: p.code, name: p.name, type: p.type}, opts: [], note: ""}, o); };
  const op = n => { const p = CATALOG.find(x => x.type === "OPTION" && x.name === n); return p ? [{oid: p.id, name: p.name, price: "100"}] : []; };
  const q = normQuote({buyer: TEMPLATE_BUYER, address: "Örnek Mahallesi, Deneme Caddesi No: 1", country: "TÜRKİYE", contact: "Ad Soyad",
    payment: PAYMENTS[0], delivery: "EXW", validity: "15 DAYS", dtime: "FROM STOCK", sample: true,
    items: [L("NDL 5010", {cap: "750", mat: "ALU", size: "2200x1800", volt: "12 V", qty: 2, price: "1000"}),
      L("NDL 5050", {cap: "500", mat: "STEEL", size: "2080x1100", volt: "24 V", qty: 1, price: "1000", opts: op("WARNING LIGHT")}),
      L("NDL 5030", {cap: "500", mat: "ALU", size: "1160x980", volt: "12 V", qty: 3, price: "1000"})]});
  q.no = nextNo(); q.autoNo = true; return q;
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
const addrLine = q => [String(q.address || "").replace(/\s*\n\s*/g, ", ").trim(), q.country].filter(Boolean).join(", ");

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
  const st = settings(), sp = isSpareOnly(q), c = q.currency;
  const rows = q.items.map((it, i) => {
    const desc = descLines(it).map(l => l.map(s => s.red ? `<span class="red">${esc(s.t)}</span>` : esc(s.t)).join("")).join("<br>");
    const cls = [isPromo(it) ? "promo" : "", sp ? "sp" : "", live && S.flash === i ? "flash" : ""].filter(Boolean).join(" ");
    return `<tr class="${cls}"${live ? ` data-act="li-edit" data-i="${i}" title="Düzenlemek için tıklayın"` : ""}><td>${i + 1}</td><td>${esc(itemInfo(it).code)}</td><td>${desc}</td><td>${esc(it.qty)}</td><td class="money">${money(unitPrice(it), c)}</td><td class="money">${money(lineTotal(it), c)}</td></tr>`;
  }).join("");
  return `
   <div class="p-head"><div><img src="${LOGO_D || "duelsan.jpg"}" width="112" alt="Düelsan"><div class="p-since">Since 1982...</div>
     <div class="p-co">${esc(st.company)}<br>${esc(st.address)}<br>${esc(st.contact)}</div></div>
     <div><img src="${LOGO_N || "ndl.jpg"}" width="72" alt="NDL"><div class="p-brand">The brand of Düelsan</div></div></div>
   <div class="p-title">${esc(q.title)}</div>
   <table class="p-info"><tbody>
     <tr><td class="lb">BUYER</td><td>${esc(q.buyer)}</td><td class="rl">DATE</td><td class="rv">${fmtDate(q.date)}</td></tr>
     <tr><td class="lb">ADDRESS</td><td>${esc(addrLine(q))}</td><td class="rl">NO</td><td class="rv">${esc(q.no)}</td></tr>
     <tr><td class="lb">PAYMENT TERM</td><td>${esc(q.payment)}</td><td class="rl">DELIVERY TERM</td><td class="rv">${esc(q.delivery)}</td></tr>
     <tr><td class="lb">OFFER VALIDITY</td><td>${esc(q.validity)}</td><td class="rl">DELIVERY TIME</td><td class="rv">${esc(q.dtime)}</td></tr>
     <tr><td class="lb">ORIGIN OF THE GOODS</td><td>${esc(st.origin)}</td><td class="rl">HS CODE</td><td class="rv">${esc(st.hs)}</td></tr>
   </tbody></table>
   <div class="p-warr">${esc(st.warranty)}</div>
   <table class="p-items"><thead><tr><th style="width:36px">NO</th><th style="width:90px">CODE</th><th>ITEM DESCRIPTION</th><th style="width:66px">QUANTITY</th><th style="width:100px">UNIT PRICE(${esc(c)})</th><th style="width:108px">TOTAL PRICE(${esc(c)})</th></tr></thead>
   <tbody>${rows || `<tr><td colspan="6" style="height:44px;color:#8a8a8a">Henüz kalem eklenmedi</td></tr>`}
   <tr class="total"><td class="blank" colspan="3"></td><td colspan="2">TOTAL</td><td class="money">${money(qTotal(q), c)}</td></tr></tbody></table>
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
  const st = settings(), sp = isSpareOnly(q), B = "#000000", c = q.currency;
  const cell = (text, o = {}) => Object.assign({text, alignment: "center", margin: [2, sp ? 2 : 4, 2, sp ? 2 : 4]}, o);
  const body = [["NO", "CODE", "ITEM DESCRIPTION", "QUANTITY", "UNIT PRICE(" + c + ")", "TOTAL PRICE(" + c + ")"].map(h => cell(h, {bold: true, fontSize: 7.5, margin: [2, 6, 2, 6]}))];
  q.items.forEach((it, i) => {
    const desc = descLines(it).flatMap((l, li) => [...(li ? [{text: "\n"}] : []), ...l.map(s => ({text: s.t, color: s.red ? "#E00000" : B}))]);
    const row = [cell(String(i + 1)), cell(itemInfo(it).code), cell(desc), cell(String(it.qty)), cell(money(unitPrice(it), c)), cell(money(lineTotal(it), c))];
    if (isPromo(it)) row.forEach(x => { x.fillColor = "#FFFF00"; x.bold = true; });
    body.push(row);
  });
  if (!q.items.length) body.push([cell("", {colSpan: 6}), {}, {}, {}, {}, {}]);
  body.push([{text: "", colSpan: 3, border: [false, false, false, false]}, {}, {}, cell("TOTAL", {colSpan: 2, bold: true}), {}, cell(money(qTotal(q), c), {bold: true})]);
  const info = [["BUYER", q.buyer, "DATE", fmtDate(q.date)], ["ADDRESS", addrLine(q), "NO", q.no], ["PAYMENT TERM", q.payment, "DELIVERY TERM", q.delivery], ["OFFER VALIDITY", q.validity, "DELIVERY TIME", q.dtime], ["ORIGIN OF THE GOODS", st.origin, "HS CODE", st.hs]]
    .map(r => [{text: r[0], bold: true}, {text: r[1] || ""}, {text: r[2], bold: true, alignment: "center"}, {text: r[3] || "", alignment: "center"}]);
  const bank = [["BENEFICIARY:", st.beneficiary], ["BANK:", st.bank], ["BRANCH:", st.branch], [c + " IBAN:", st["iban" + c] || ""], ["SWIFT CODE:", st.swift]].map(r => [{text: r[0], bold: true}, {text: r[1] || ""}]);
  const thin = {hLineWidth: () => 0.6, vLineWidth: () => 0.6, hLineColor: () => B, vLineColor: () => B};
  const left = [LOGO_D ? {image: LOGO_D, width: 96} : {text: ""}, {text: "Since 1982...", fontSize: 7, margin: [104, 0, 0, 0]},
    {text: [st.company, "\n", st.address, "\n", st.contact], fontSize: 7.5, lineHeight: 1.25, margin: [0, 2, 0, 0]}];
  const right = [LOGO_N ? {image: LOGO_N, width: 62, alignment: "center"} : {text: ""}, {text: "The brand of Düelsan", italics: true, fontSize: 6.5, alignment: "center", margin: [0, 3, 0, 0]}];
  return {pageSize: "A4", pageMargins: [32, 30, 32, 30], defaultStyle: {font: "Roboto", fontSize: 8, color: B},
    info: {title: (q.title || "") + " " + (q.no || "")},
    content: [
      {columns: [{stack: left}, {width: 90, stack: right}]},
      {text: q.title || "", bold: true, fontSize: 12, alignment: "center", margin: [0, 12, 0, 8]},
      {table: {widths: [100, "*", 70, 160], body: info}, layout: Object.assign({paddingTop: () => 4, paddingBottom: () => 4}, thin), fontSize: 7.5},
      {text: st.warranty || "", color: "#E00000", bold: true, italics: true, alignment: "center", fontSize: 7.5, margin: [0, 10, 0, 14]},
      {table: {headerRows: 1, dontBreakRows: true, widths: [24, 64, "*", 48, 74, 80], body}, layout: thin},
      {text: "BANK DETAILS", bold: true, fontSize: 7.5, margin: [0, 14, 0, 2]},
      {table: {widths: [120, 220], body: bank}, layout: Object.assign({paddingTop: () => 2, paddingBottom: () => 2}, thin), fontSize: 7.5}
    ]};
}

/* ---------- Excel (ExcelJS) — PDF ile aynı sayfa, tutarlar formüllü ---------- */
async function buildXlsx(EX, q) {
  const st = settings(), c = q.currency, sym = CUR[c] || "", sp = isSpareOnly(q);
  const wb = new EX.Workbook(); wb.creator = st.company || "NDL Proforma"; wb.created = new Date();
  const ws = wb.addWorksheet("PROFORMA", {views: [{showGridLines: false}],
    pageSetup: {paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true,
      margins: {left: 0.4, right: 0.4, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2}}});
  ws.columns = [{width: 6}, {width: 14}, {width: 47}, {width: 12}, {width: 16}, {width: 17}];
  const F = (o = {}) => Object.assign({name: "Times New Roman", size: 8, color: {argb: "FF000000"}}, o);
  const thin = {style: "thin", color: {argb: "FF000000"}}, box = {top: thin, left: thin, bottom: thin, right: thin};
  const C = a => ({horizontal: "center", vertical: "middle", wrapText: true, ...a}), Lf = {horizontal: "left", vertical: "middle", wrapText: true};
  const put = (addr, v, font, align) => { const x = ws.getCell(addr); x.value = v; x.font = F(font); x.alignment = align || Lf; return x; };
  const mfmt = `#,##0.00 "${sym}"`;
  [1, 2, 3, 4].forEach(r => ws.getRow(r).height = 14);
  if (LOGO_D) ws.addImage(wb.addImage({base64: LOGO_D, extension: "jpeg"}), {tl: {col: 0.08, row: 0.15}, ext: {width: 154, height: 54}});
  if (LOGO_N) ws.addImage(wb.addImage({base64: LOGO_N, extension: "jpeg"}), {tl: {col: 5.12, row: 0.1}, ext: {width: 96, height: 49}});
  put("B5", "Since 1982...", {size: 7.5, italic: true}, {horizontal: "left", vertical: "top"});
  put("F5", "The brand of Düelsan", {size: 7, italic: true}, C());
  [[6, st.company], [7, st.address], [8, st.contact]].forEach(([r, v]) => { ws.mergeCells(`A${r}:D${r}`); put("A" + r, v || "", {size: 8}, {horizontal: "left", vertical: "middle"}); ws.getRow(r).height = 12; });
  ws.mergeCells("A10:F10"); put("A10", q.title || "", {size: 12, bold: true}, C()); ws.getRow(10).height = 22;
  const info = [["BUYER", q.buyer, "DATE", fmtDate(q.date)], ["ADDRESS", addrLine(q), "NO", q.no], ["PAYMENT TERM", q.payment, "DELIVERY TERM", q.delivery], ["OFFER VALIDITY", q.validity, "DELIVERY TIME", q.dtime], ["ORIGIN OF THE GOODS", st.origin, "HS CODE", st.hs]];
  info.forEach((r, i) => {
    const n = 12 + i;
    ws.mergeCells(`A${n}:B${n}`); ws.mergeCells(`E${n}:F${n}`);
    put("A" + n, r[0], {bold: true}); put("C" + n, r[1] || ""); put("D" + n, r[2], {bold: true}, C()); put("E" + n, r[3] || "", {}, C());
    for (let col = 1; col <= 6; col++) ws.getCell(n, col).border = box;
    ws.getRow(n).height = (String(r[1] || "").length > 52 || r[2].length > 11) ? 24 : 16;
  });
  ws.mergeCells("A18:F18"); put("A18", st.warranty || "", {bold: true, italic: true, color: {argb: "FFE00000"}}, C()); ws.getRow(18).height = 16;
  const H = 20;
  ["NO", "CODE", "ITEM DESCRIPTION", "QUANTITY", `UNIT PRICE(${c})`, `TOTAL PRICE(${c})`].forEach((h, i) => { const x = ws.getCell(H, i + 1); x.value = h; x.font = F({bold: true}); x.alignment = C(); x.border = box; });
  ws.getRow(H).height = 28;
  let r = H + 1;
  q.items.forEach((it, i) => {
    const pr = isPromo(it), lines = descLines(it), base = {size: 8.5, bold: pr};
    const runs = []; lines.forEach((l, li) => l.forEach((s, si) => runs.push({text: (li && !si ? "\n" : "") + s.t, font: F({...base, color: {argb: s.red ? "FFE00000" : "FF000000"}})})));
    const vals = [i + 1, itemInfo(it).code, {richText: runs}, Number(it.qty) || 0, unitPrice(it), {formula: `D${r}*E${r}`, result: lineTotal(it)}];
    vals.forEach((v, ci) => {
      const x = ws.getCell(r, ci + 1); x.value = v; x.font = F(base); x.alignment = C(); x.border = box;
      if (ci >= 4) x.numFmt = mfmt;
      if (pr) x.fill = {type: "pattern", pattern: "solid", fgColor: {argb: "FFFFFF00"}};
    });
    ws.getRow(r).height = Math.max(sp ? 16 : 40, lines.length * 12.5 + 10);
    r++;
  });
  if (!q.items.length) { for (let col = 1; col <= 6; col++) ws.getCell(r, col).border = box; ws.getRow(r).height = 30; r++; }
  const last = r - 1;
  ws.mergeCells(`D${r}:E${r}`); put("D" + r, "TOTAL", {bold: true}, C()); ws.getCell("D" + r).border = box; ws.getCell("E" + r).border = box;
  const t = ws.getCell("F" + r); t.value = {formula: `SUM(F${H + 1}:F${last})`, result: qTotal(q)}; t.font = F({bold: true}); t.alignment = C(); t.numFmt = mfmt; t.border = box;
  ws.getRow(r).height = 20;
  r += 2; put("A" + r, "BANK DETAILS", {bold: true}, {horizontal: "left", vertical: "middle", wrapText: false}); r++;
  [["BENEFICIARY:", st.beneficiary], ["BANK:", st.bank], ["BRANCH:", st.branch], [c + " IBAN:", st["iban" + c] || ""], ["SWIFT CODE:", st.swift]].forEach(([a, b]) => {
    ws.mergeCells(`A${r}:B${r}`); put("A" + r, a, {bold: true}); put("C" + r, b || "");
    for (let col = 1; col <= 3; col++) ws.getCell(r, col).border = box;
    ws.getRow(r).height = 14; r++;
  });
  ws.pageSetup.printArea = `A1:F${r - 1}`;
  return wb;
}
