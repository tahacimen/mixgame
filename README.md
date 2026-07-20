# MixGame — görsel oyun kısayolları

Mobil öncelikli, tek sayfalık oyun bağlantı vitrini. Bu proje oyun çalıştırmaz; kare kartlardan harici oyun sayfalarına hızlı geçiş sağlar. Supabase bağlandığında güvenli roller ve cihazlar arası ortak oyun kütüphanesi kullanır; yapılandırma yokken yerel demo moduna döner.

## Wireframe

```
MOBİL (360–480)                 TABLET (600–1024)
┌────────────────────┐          ┌──────────────────────────────────┐
│ ◫ MixGame  Tümü ↓  │          │ ◫ MixGame                  Tümü ↓ │
│                    │          │                                  │
│ KISA YOLUN AÇIK    │          │ KISA YOLUN AÇIK                  │
│ Bir sonraki oyun   │          │ Bir sonraki oyun + açıklama      │
│                    │          │                 ┌──────────────┐ │
│ Öne çıkanlar  ← →  │          │                 │ featured      │ │
│ ┌────────────────┐ │          │                 └──────────────┘ │
│ │   featured     │ │          │                                  │
│ └────────────────┘ │          │ [Tümü][Aksiyon][Bulmaca] →       │
│ • ─ • •            │          │ ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│                    │          │ │ ▣ │ │ ▣ │ │ ▣ │ │ ▣ │           │
│ [Tümü][Aksiyon] →  │          │ └───┘ └───┘ └───┘ └───┘           │
│ ┌──────┐ ┌──────┐  │          └──────────────────────────────────┘
│ │  ▣   │ │  ▣   │  │
│ └──────┘ └──────┘  │          DESKTOP (1024+): hero iki sütun,
│ ┌──────┐ ┌──────┐  │          carousel ve 6 sütunluk oyun grid'i.
└────────────────────┘
```

## Yeni özellikler

- Linkten otomatik oyun adı, açıklama ve kapak görseli çıkarma
- Öne çıkan oyuna göre değişen karartılmış hero arka planı
- Yönetici için erişilebilir yukarı/aşağı sıralama kontrolleri
- Arama, favoriler, son açılanlar ve kişisel hızlı erişim
- PWA manifesti, çevrimdışı uygulama kabuğu ve ana ekrana kurulum
- Supabase Auth, Postgres, Storage, Realtime ve RLS için hazır altyapı

## Çalıştırma

Yerel sunucuda çalıştır:

```sh
python -m http.server 4173
```

Ardından `http://127.0.0.1:4173` adresini aç.

Supabase kurulumu için [`supabase/SETUP.md`](supabase/SETUP.md) dosyasını izle.

## Giriş modları

`config.js` boşken üç geçici demo hesabı kullanılabilir: `oyuncu1` yönetici, `oyuncu2` oyuncu ve `oyuncu3` içerik editörüdür. Test şifresi `mixgame2026`dır. Bu mod yalnızca yerel geliştirme kolaylığı içindir.

Supabase değerleri girildiğinde girişler Supabase Auth üzerinden doğrulanır; roller `profiles` tablosundan, oyunlar RLS korumalı `games` tablosundan gelir. Yönetici değişiklikleri Realtime ile açık oturumlara aktarılır.

## Klavye kısa yolları

- `/` veya `Ctrl/Cmd + K`: aramaya git
- `F`: favorileri aç
- `Alt + 1–9`: ilk dokuz oyundan birini aç
- `N`: yönetici/editör için yeni oyun satırı
- `Escape`: aramayı temizle veya yönetim panelini kapat

## Erişilebilirlik ve performans

- Klavye odağı, açıklayıcı bağlantı etiketleri ve atlama bağlantısı içerir.
- En küçük dokunma hedefi 42–44px; grid mobilde 2, tablette 4, masaüstünde 6 sütundur.
- Hareket azaltma tercihi CSS ile desteklenir; animasyonlar transform/opacity tabanlıdır.
