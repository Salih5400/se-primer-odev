# SE Primer — Ödev

YZM301 için geliştirilen, yazılım mühendisliği kararlarını kısa bir vaka simülasyonuyla öğreten mobil uyumlu öğrenme oyunu.

Ödev deposu herkese açıktır: https://github.com/Salih5400/se-primer-odev

## Tasarım

![SE Primer ekranları](design/assets/overview.png)

Ayrı ekranlar: [Giriş](design/assets/onboarding.png) · [Sahne](design/assets/scene.png) · [Son](design/assets/ending.png)

Stitch projesi: https://stitch.withgoogle.com/projects/10280267099388934499

## Ürün kapsamı

- [Ürün spesifikasyonu](spec.md)
- [Tasarım sistemi ve ekran davranışları](DESIGN.md)
- [Tek sayfalık klasik vize tasarımı](SINAV_TASARIMI.md)
- [Yayın, dağıtım ve geri alma planı](RELEASE.md)
- [Stitch için kullanılan prompt](design/stitch-prompt.md)

## The Primer v2 veri toplama

Canlı veri toplama sayfası: https://salih5400.github.io/se-primer-odev/?collect=1 (GitHub Pages dağıtımı tamamlandıktan sonra açılır).

- Yerelde `npm install` ve `npm run dev` çalıştırın; sonra `http://localhost:5173/?collect=1` adresini açın. GitHub Pages dağıtımı açıldığında aynı modu canlı linkin sonuna `?collect=1` ekleyerek kullanabilirsiniz.
- Üç farklı katılımcı beşer oturum oynasın. Her oturumda rıza kutusunu işaretlesin; uygulama her sahnede oyuncunun seçtiği güvenli/riskli seçeneği otomatik kaydeder. Katılımcılar farklı cihaz kullanırsa final ekranında her cihazdan CSV dışa aktarın ve dosyaları birleştirin.
- Katılımcıdan isim, e-posta veya başka tanımlayıcı istemeyin. Her kişi aynı cihaz/tarayıcıda beş tam oturumu bitirip son oturumda CSV'yi dışa aktarsın; oturumlar arası localStorage silinirse her oturum sonunda ayrı CSV alın.
- Finalde **CSV dışa aktar** düğmesini kullanın. Gerçek katılımcı CSV satırlarını `data/oturumlar.csv` başlığıyla birleştirin. Cypress testlerindeki `kaynak=sentetik` satırları eğitime girmez.
- Uygulama ad, e-posta, cihaz kimliği, IP, konum veya serbest metin toplamaz. Oturumlar rastgele kimlikle ilişkilendirilir ve yalnızca tarayıcıda tutulur.

Model hedefi, özellik sırası ve eğitimden önce sabitlenen kabul eşikleri [spec.md](spec.md)'de; CSV sütunlarının tanımı [data/SOZLUK.md](data/SOZLUK.md)'dedir.

### ML eğitimi

Windows'ta kurulum ve eğitim için üç komut:

```powershell
& 'C:\ProgramData\anaconda3\python.exe' -m venv .venv
& '.\.venv\Scripts\python.exe' -m pip install -r requirements-ml.txt
& '.\.venv\Scripts\python.exe' train.py
```

Eğitim eval kapısını geçerse HF hesabında oturum açıp `HF_REPO_ID=kullanici/model-adi` ayarla, ardından `python publish_model.py` çalıştır. Script public modele yükler ve web manifestini tam commit SHA'larına sabitler. Token'ı repoya veya sohbete ekleme; manifesti ve HF commit kaydını GitHub'a gönderdikten sonra Pages deployment ve Cypress'i doğrula.

Python 3.12 kullanın. `.venv` oluşturup [requirements-ml.txt](requirements-ml.txt)'deki sürümleri kurun, sonra `python train.py` çalıştırın. Betik en az 15 tam gerçek oturum ve önceden belirlenen eval eşiği olmadan model üretmez. Eşik geçilirse `model/` ve `tests/parite.json` üretilir.

### Tarayıcı çıkarımı ve test kahini

Yayımlanan model, `public/model/release.json` içindeki tam Hugging Face commit URL'sinden tarayıcıda ONNX Runtime Web ile çalışır. `?parity=1` sayfası aynı beş referans girdiyi tarayıcıda çalıştırır; `npm run test:e2e` Python Oracle sonuçlarına karşı `1e-4` toleransını denetler. Model kapalıysa uygulama mevcut Primer akışını korur.

## Uygulama ve kanıtlar

- React/Vite mobil uyumlu prototip ve Express tutor API: `npm install`, ardından `npm run dev`. Gemini anahtarı isteğe bağlıdır; anahtar yoksa veya Gemini kotası/bağlantısı kullanılamıyorsa API karar konusuna uygun çevrimdışı yedek tutor ipucu verir.
- Tutor değerlendirmesi: [20 sentetik yanıt ve etiketleme yönergesi](eval/README.md), [yedek tutor değerlendirme raporu](eval/tutor-evaluation.md); API yanıtlarını `npm run eval:tutor` ile üretin.
- Cypress E2E: `npm run test:e2e` ile 8 karar yolunu, tutor/yedek tutor, rıza ve anonim kayıt, beş girdilik parite kahini, ipucu, 60 saniyelik sayacı ve yeniden başlatmayı kapsar (15 test).
- Google AI Studio uygulaması: [SE Primer](https://aistudio.google.com/apps/d0ee75f8-fc12-4804-be2c-4e630190cfec) (bağlantıya sahip herkes görüntüleyebilir).
- AI Studio önizlemesinde 429 kota aşımında güvenli yedek ipucu gösterimi doğrulandı. Yerel Express tutor API'si de anahtar yokluğu, kota/hizmet hatası ve zaman aşımında karar konusuna uygun yedek ipucuna döner; Gemini yanıtları ayrıca kaynak etiketiyle raporlanır.

## Doğrulama durumu

- Sunucu ve eval betiği Node.js sözdizimi kontrolünden geçti; 20 eval girdisi JSON olarak doğrulandı.
- AI Studio'da sentetik tutor sorusu gönderildi; Gemini `429 RESOURCE_EXHAUSTED` döndürdü, arayüz yedek yanıtı gösterdi ve yükleme durumu kapandı. 20 model yanıtı değerlendirmesi henüz yapılmadı.
- `npm install` ve GitHub Pages taban yoluyla `npm run build` başarıyla tamamlandı. Cypress E2E: **15/15 geçti**. Çevrimdışı yedek tutor'ın 20 sentetik vakası **20/20 HTTP 200** döndürdü; elle değerlendirme raporu yukarıda. Gemini kotası yüzünden gerçek modelin 20 yanıtı ayrıca puanlanamadı. v2 ONNX modeli henüz üretilmedi; gerçek katılımcı verisi ve önceden tanımlı eval kapısının geçilmesi bekleniyor.

## Ürün kararları

- **Kullanıcı hesabı eklemedim:** kısa, tek oturumluk öğrenme akışı için hesap ve kalıcı profil gerekmiyor.
- **İkinci bölüm eklemedim:** ilk sürümün kapsamını tek bir vaka ve üç kararla sınırlayarak temel etkileşimi değerlendirmeyi kolaylaştırıyorum.
- **Native mobil uygulama yapmadım:** telefonda tarayıcıdan çalışmak ödevin mobil kullanım hedefini karşılıyor ve mağaza dağıtımı gerektirmiyor.

## AI araçları ve insan katkısı

- **Codex coding agent:** Ödev isterlerini yapılandırmak ve `spec.md`, veri toplama akışı, testler, eğitim/ONNX betiği ile teknik dokümantasyon taslağını üretip düzenlemek için kullanıldı.
- **İnsan girdisi:** Öğrenci önceki The Primer ürününü ve Stitch tasarımını sağladı, GitHub deposunun açılıp yayımlanmasını istedi ve 3 gönüllü bulabileceğini doğruladı.
- **İnsan incelemesi gerekli:** Model hedefi, özellikler, `0,55` ürün eşiği ve eval eşikleri bu geliştirme sırasında öneri olarak sabitlendi; öğrenci bunları anlayıp onaylamalı veya düzeltmeli, gerçek katılımcı oturumlarını toplamalı ve metrik/model kartını doğrulamalıdır.
- **Elle düzeltilen çıktılar:** Sentetik eğitim verisi üretmek yerine gerçek oturum kapısı eklendi; açık GitHub veri kümesi için açık rıza metni ve model kapalıyken güvenli statik akış eklendi. Cypress verisi `kaynak=sentetik` olarak işaretlenir ve eğitimden dışlanır.

Teslim eden öğrenci, kodu ve kavramları açıklayıp savunabilmelidir. Katılımcı verisi yalnızca bilgilendirilmiş onamla toplanır; sentetik Cypress kayıtları eğitim verisi olarak kullanılmaz.

## Not

Senaryo eğitim amaçlıdır ve hiçbir gerçek hasta verisi içermez.

## Kaynaklar

- Amershi vd., [Software Engineering for Machine Learning: A Case Study](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/03/amershi-icse-2019_Software_Engineering_for_Machine_Learning.pdf) (Microsoft Research, ICSE 2019).
- Shankar vd., [Operationalizing Machine Learning: An Interview Study](https://arxiv.org/abs/2209.09125) (2022).
- Mitchell vd., [Model Cards for Model Reporting](https://arxiv.org/abs/1810.03993) (2019).
- Breck vd., [The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/) (Google Research, 2017).
- Hugging Face Hub, [repo upload and revision guide](https://huggingface.co/docs/huggingface_hub/main/guides/upload).
- ONNX Runtime, [web inference and deployment options](https://onnxruntime.ai/docs/tutorials/web/build-web-app.html).
- GitHub, [custom workflows for Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
