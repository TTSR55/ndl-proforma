/* Supabase bağlantısı — README'deki "Kurulum" adımlarına bakın.
   Supabase → Project Settings → API (ya da Data API) sayfasındaki iki değeri tırnakların içine yapıştırın.
   anon / publishable anahtar tarayıcıda kullanılmak için tasarlanmıştır; verileri schema.sql'deki RLS kuralları korur.
   service_role / secret anahtarı ASLA buraya yazmayın. */
window.NDL_CONFIG = {
  supabaseUrl: "https://ggykdpmkzebgabsixlsr.supabase.co",
  supabaseAnonKey: ""    // Supabase → Project Settings → API Keys → "Publishable key" (sb_publishable_...) buraya
};
