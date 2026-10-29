# SE Primer — Ödev

YZM301 için geliştirilen, yazılım mühendisliği kararlarını kısa bir vaka simülasyonuyla öğreten mobil uyumlu öğrenme oyunu.

## Tasarım

![SE Primer ekranları](design/assets/overview.png)

Ayrı ekranlar: [Giriş](design/assets/onboarding.png) · [Sahne](design/assets/scene.png) · [Son](design/assets/ending.png)

Stitch projesi: https://stitch.withgoogle.com/projects/10280267099388934499

## Ürün kapsamı

- [Ürün spesifikasyonu](spec.md)
- [Tasarım sistemi ve ekran davranışları](DESIGN.md)
- [Stitch için kullanılan prompt](design/stitch-prompt.md)

## Uygulama ve kanıtlar

- React/Vite mobil uyumlu prototip ve Express tutor API: `npm install`, ardından `npm run dev`
- Tutor değerlendirmesi: [20 sentetik yanıt ve etiketleme yönergesi](eval/README.md); API yanıtlarını `npm run eval:tutor` ile üretin.
- Cypress E2E: `npm run test:e2e` ile 8 karar yolunu, ipucu/tutor ve 60 saniyelik sayacı kapsar.
- Google AI Studio uygulaması ve 60 saniyelik demo: henüz yayımlanmadı; teslimden önce bağlantıları ekleyin.

## Ürün kararları

- **Kullanıcı hesabı eklemedim:** kısa, tek oturumluk öğrenme akışı için hesap ve kalıcı profil gerekmiyor.
- **İkinci bölüm eklemedim:** ilk sürümün kapsamını tek bir vaka ve üç kararla sınırlayarak temel etkileşimi değerlendirmeyi kolaylaştırıyorum.
- **Native mobil uygulama yapmadım:** telefonda tarayıcıdan çalışmak ödevin mobil kullanım hedefini karşılıyor ve mağaza dağıtımı gerektirmiyor.

## Not

Senaryo eğitim amaçlıdır ve hiçbir gerçek hasta verisi içermez.
