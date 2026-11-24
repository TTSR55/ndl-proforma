# NDL Proforma

NDL lift proforma portalı. Kullanıcılar e-posta ve şifreyle giriş yapar; proformalar ve cari kartlar her hesaba özel tutulur. Ürün kütüphanesi ve proformayı kesen firmalar herkes için ortaktır ve yalnızca yönetici tarafından değiştirilir.

- **Pano:** menünün ilk sayfası. Proforma sayısı, bu ayki tutar, cari ve lift sayısı, son 6 ayın grafiği, en çok teklif verilen modeller, son proformalar ve en çok çalışılan cariler. Hesap ayarları (şifre değiştirme, çıkış) da buradadır.
- **Duyurular:** yönetici *Yönetim* sayfasından duyuru yayınlar (bilgi / uyarı / önemli); tüm aktif kullanıcılar sayfanın en üstünde görür. Kullanıcı bir duyuruyu kapatabilir; yönetici duyuruyu yayından kaldırabilir ya da silebilir.
- **Üyelik ve onay:** yeni kayıtlar yönetici onayını bekler; yönetici *Yönetim* sayfasından hesapları onaylar, dondurur ya da siler. İlk kaydolan hesap yönetici olur.
- **Şifreler:** şifreler yalnızca tek yönlü özet (bcrypt) olarak saklanır; yönetici dahil hiç kimse bir şifreyi göremez. Yönetici, şifresini unutan kullanıcıya sıfırlama e-postası gönderebilir ya da geçici bir şifre verebilir. Geçici şifre verildiğinde kullanıcının açık oturumları kapanır; daha önce açılmış bir oturum da o andan itibaren hiçbir veriye erişemez. Kullanıcı ilk girişte kendi şifresini belirlemeden devam edemez.
- **Firmalar:** proformayı kesen firmalar (ör. Düelsan, Ahkos Otomotiv) ortak bir listede tutulur: unvan, adres, logo, başlık yazıları, garanti notu, numara öneki ve banka bilgileri. Yalnızca yönetici ekler ve değiştirir. Firma bilgileri proforma oluşturulurken proformaya kopyalanır; firma sonradan değişse de kesilmiş proforma değişmez.
- **Proforma:** firma ve cari kart seçimi (ikisi de zorunlu; yeni proforma boş başlar) → kütüphaneden lift seçimi (kapasite, kapak türü, platform boyutu veya özel boyut, powerpack voltajı, opsiyonlar, fiyat) → belge bilgileri, şartlar ve **HS kodları** → önizleme ve oluşturma. HS kodlarını (GTİP) kullanıcı girer; bir proformaya birden çok kod eklenebilir ve proformada virgülle ayrılarak basılır. Daha önce kullanılan kodlar öneri olarak gelir.
- **Sistem numarası:** her proformaya oluşturulduğu anda veritabanı bir numara verir (ör. PI2026/0007). Önek seçilen firmadan gelir (ör. DU2026/0012, AH2026/0013); sıra numarası tüm firmalarda ortaktır, sırayla artar ve sonradan değiştirilemez. Düzenlenen proforma numarasını korur.
- **Çıktı:** A4 PDF ve formüllü Excel (.xlsx). Ürün, opsiyon ve yedek parça fotoğrafları önizlemede, PDF'te ve Excel'de *IMAGE* sütununda görünür (opsiyonlar ana ürünün fotoğrafının altında). Hiçbir kalemin fotoğrafı yoksa sütun gösterilmez.
- **Kayıtlar:** her proformanın bir **aşaması** vardır: *Hazırlandı*, *Müşteriye İletildi*, *Müzakere Sürecinde* (süreçte); *Onaylandı*, *Siparişe Dönüştü* (olumlu); *Reddedildi*, *İptal Edildi* (olumsuz). Aşama listeden değiştirilir, anında kaydedilir ve tarihiyle aşama geçmişine yazılır (*Geri al* ile hemen geri alınabilir). Üstteki *Teklif Süreci* şeridi her aşamadaki proforma sayısını ve tutarını gösterir; tıklanınca liste o aşamaya süzülür. Liste aşamaya göre gruplu (gruplar açılıp kapanır) ya da tarihe göre görüntülenir. Süreçteki tekliflerde geçerlilik (opsiyon) süresi dolanlar ve 3 gün içinde dolacaklar işaretlenir. Arama, cari kart, para birimi ve tarih filtresi; *Düzenle* ile değiştirme (aşama korunur), *Tekrarla* ile yeni numaralı kopya. Her cari kartın altında o cariye ait proformalar aşamalarıyla listelenir.
- **Ürünler:** ortak ve sabit ürün kütüphanesi (NDL 2026 kataloğuyla başlar). Lift, opsiyon ve yedek parça fotoğrafları katalogdan alınmıştır (`img/lifts`, `img/options`, `img/spares`). Diğer kullanıcılar yalnızca görüntüler; ürün eklemek, silmek, değiştirmek ve fotoğraf yüklemek yöneticiye aittir.
- **Cari:** cari kart oluşturma ve düzenleme
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
- Firma unvanı, adres ve banka bilgileri koda yazılmaz; yönetici *Firmalar* sayfasından girer ve veritabanında saklanır.
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
| `img/lifts/`, `img/options/`, `img/spares/` | Katalogdan alınmış ürün fotoğrafları (ürün başına bir JPEG; dosya adı ürün kimliğidir) |
| `config.js` | Supabase bağlantı bilgileri |
| `schema.sql` | Veritabanı tabloları, satır kuralları (RLS), ortak ürün kütüphanesi ve firmalar, proforma numarası, onay, duyuru ve yönetici fonksiyonları |
| `duelsan.jpg`, `ndl.jpg` | Proforma logoları |

## Yerelde çalıştırma

```bash
python3 -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın.
