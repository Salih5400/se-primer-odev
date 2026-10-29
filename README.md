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

- Google AI Studio uygulaması: Hazırlanıyor
- Tutor değerlendirmesi (20 sentetik öğrenci cevabı): Hazırlanıyor
- Cypress E2E ve 60 saniyelik demo: Hazırlanıyor

## Ürün kararları

- **Kullanıcı hesabı eklemedim:** kısa, tek oturumluk öğrenme akışı için hesap ve kalıcı profil gerekmiyor.
- **İkinci bölüm eklemedim:** ilk sürümün kapsamını tek bir vaka ve üç kararla sınırlayarak temel etkileşimi değerlendirmeyi kolaylaştırıyorum.
- **Native mobil uygulama yapmadım:** telefonda tarayıcıdan çalışmak ödevin mobil kullanım hedefini karşılıyor ve mağaza dağıtımı gerektirmiyor.

## Not

Senaryo eğitim amaçlıdır ve hiçbir gerçek hasta verisi içermez.
