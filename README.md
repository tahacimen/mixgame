# MixGame — görsel oyun kısayolları

Mobil öncelikli, tek sayfalık oyun bağlantı vitrini. Bu proje oyun çalıştırmaz; kare kartlardan harici oyun sayfalarına hızlı geçiş sağlar.

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

## Görsel sistem

- **Stil:** Modern Dark / cinematic gaming; derin lacivert yüzeyler, mor ve roze aksanlar.
- **Renkler:** arka plan `#0F0F23`, yüzey `#17172D`, ana vurgu `#7C3AED`, ikincil `#A78BFA`, aksiyon `#F43F5E`, metin `#F7F6FF`.
- **Tipografi:** başlıklar `Russo One`, metin ve oyun adları `Chakra Petch`.
- **Kart:** 1:1 kare, 12–18px yarıçap, ince kontrast border; hover'da hafif yukarı kalkma/ışıma, dokunmada `scale(.97)`.
- **Carousel:** kaydırılabilir kart şeridi, önce/sonra kontrolleri, dot göstergesi ve 4.5 saniyelik otomatik ilerleme.

## Çalıştırma

`index.html` dosyasını tarayıcıda aç. Gerçek oyun bağlantıları için `app.js` içindeki örnek `example.com` URL'lerini değiştir.

## Erişilebilirlik ve performans

- Klavye odağı, açıklayıcı bağlantı etiketleri ve atlama bağlantısı içerir.
- En küçük dokunma hedefi 42–44px; grid mobilde 2, tablette 4, masaüstünde 6 sütundur.
- Hareket azaltma tercihi CSS ile desteklenir; animasyonlar transform/opacity tabanlıdır.
