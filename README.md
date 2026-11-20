# NDL Proforma

NDL lift proforma portalı. Kullanıcılar e-posta ve şifreyle giriş yapar; proformalar, cari kartlar, ürün kütüphanesi ve firma/banka bilgileri her hesaba özel tutulur.

- **Pano:** menünün ilk sayfası. Proforma sayısı, bu ayki tutar, cari ve lift sayısı, son 6 ayın grafiği, en çok teklif verilen modeller, son proformalar ve en çok çalışılan cariler. Hesap ayarları (şifre değiştirme, çıkış) da buradadır.
- **Duyurular:** yönetici *Yönetim* sayfasından duyuru yayınlar (bilgi / uyarı / önemli); tüm aktif kullanıcılar sayfanın en üstünde görür. Kullanıcı bir duyuruyu kapatabilir; yönetici duyuruyu yayından kaldırabilir ya da silebilir.
- **Üyelik ve onay:** yeni kayıtlar yönetici onayını bekler; yönetici *Yönetim* sayfasından hesapları onaylar, dondurur ya da siler. İlk kaydolan hesap yönetici olur.
- **Şifreler:** şifreler yalnızca tek yönlü özet (bcrypt) olarak saklanır; yönetici dahil hiç kimse bir şifreyi göremez. Yönetici, şifresini unutan kullanıcıya sıfırlama e-postası gönderebilir ya da geçici bir şifre verebilir. Geçici şifre verildiğinde kullanıcının açık oturumları kapanır; daha önce açılmış bir oturum da o andan itibaren hiçbir veriye erişemez. Kullanıcı ilk girişte kendi şifresini belirlemeden devam edemez.
- **Proforma:** cari kart seçimi (zorunlu; yeni proforma boş başlar) → kütüphaneden lift seçimi (kapasite, kapak türü, platform boyutu veya özel boyut, powerpack voltajı, opsiyonlar, fiyat) → önizleme ve oluşturma
- **Sistem numarası:** her proformaya oluşturulduğu anda veritabanı bir numara verir (ör. PI2026/0007). Numara şirket genelinde tektir, sırayla artar ve sonradan değiştirilemez; düzenlenen proforma numarasını korur.
- **Çıktı:** A4 PDF ve formüllü Excel (.xlsx)
- **Kayıtlar:** arama, cari kart, para birimi ve tarih filtresi; *Düzenle* ile değiştirme, *Tekrarla* ile yeni numaralı kopya. Her cari kartın altında o cariye ait proformalar listelenir.
- **Cari, Ürünler, Firma:** cari kart oluşturma ve düzenleme, düzenlenebilir ürün kütüphanesi (NDL 2026 kataloğuyla başlar), proforma üst/alt bilgileri
- **Örnek şablon:** yeni hesaplar boş bir proformayla başlar. İsteyen *Örnek şablonu aç* ile hayali bir firma ve yer tutucu fiyatlarla doldurulmuş bir örnek görebilir; bu şablon gerçek bir müşteri ya da teklif içermez.

Statik bir sitedir (GitHub Pages). Giriş ve veri için [Supabase](https://supabase.com) kullanır; derleme adımı yoktur.

## Kurulum (bir kez, ~10 dakika)

1. **Supabase projesi açın.** supabase.com → *New project*. Bölge olarak Avrupa'dan birini (ör. Frankfurt) seçin. Veritabanı şifresini kendiniz belirleyin ve saklayın.
2. **Tabloyu kurun.** Supabase → *SQL Editor* → *New query* → bu depodaki [`schema.sql`](schema.sql) dosyasının tamamını yapıştırın → *Run*.
3. **Site adresini tanıtın.** Supabase → *Authentication* → *URL Configuration*:
   - *Site URL*: `https://KULLANICI-ADINIZ.github.io/ndl-proforma/`
   - *Redirect URLs*: aynı adresi ekleyin.
   Onay ve şifre yenileme e-postalarındaki bağlantılar bu adrese döner.
4. **Bağlantı bilgilerini yazın.** Supabase → *Project Settings* → *API* sayfasından **Project URL** ve **anon / publishable** anahtarı kopyalayın. GitHub'da [`config.js`](config.js) dosyasını açın → kalem simgesi → iki değeri tırnakların içine yapıştırın → *Commit changes*.
5. Birkaç dakika sonra siteyi açın, **Hesap oluşturun**, e-postanızdaki onay bağlantısına tıklayın.

> `config.js` boşken site **demo modunu** önerir: hesaplar ve veriler yalnızca o tarayıcıda tutulur. Arayüzü denemek içindir.

## Güvenlik

- `anon` / `publishable` anahtar tarayıcıda kullanılmak için tasarlanmıştır ve herkese açık olabilir. Verileri `schema.sql`'deki satır düzeyi güvenlik (RLS) kuralları korur: her kullanıcı yalnızca kendi satırlarını görür ve değiştirir.
- `service_role` / `secret` anahtarı **asla** bu depoya yazmayın.
- Firma unvanı, adres ve banka bilgileri koda yazılmaz; her kullanıcı *Firma* sayfasından kendi hesabına girer.
- Supabase'in ücretsiz e-posta servisi saatte birkaç e-postayla sınırlıdır. Ekip büyürse *Authentication → SMTP Settings* altından kendi e-posta sunucunuzu bağlayın.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html` | Sayfa iskeleti ve kütüphaneler |
| `styles.css` | Tasarım (SF Pro sistem fontu, açık/koyu tema, telefon yerleşimi) |
| `app.js` | Arayüz: giriş, menü, sayfalar, olaylar |
| `proforma.js` | Fiyat hesabı, proforma sayfası, PDF ve Excel üreticileri |
| `store.js` | Supabase oturumu ve kullanıcıya özel kayıt (ya da demo) |
| `catalog.js` | NDL 2026 kataloğu: modeller, kapasiteler, platform ölçüleri, opsiyonlar, yedek parçalar (yalnızca katalogdan; fiyat ve müşteri bilgisi yok) |
| `config.js` | Supabase bağlantı bilgileri |
| `schema.sql` | Veritabanı tabloları, satır kuralları (RLS), proforma numarası, onay, duyuru ve yönetici fonksiyonları |
| `duelsan.jpg`, `ndl.jpg` | Proforma logoları |

## Yerelde çalıştırma

```bash
python3 -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın.
