# The Primer v2 — Yayın, dağıtım ve geri alma planı

## Yayın kaydı

- **Sürüm:** v2.0 (hazırlık; henüz model yayımlanmadı)
- **Değişiklik:** taban örneğindeki öz-bildirilen ipucu ihtiyacının yerine, gözlenen seçimden `riskli_secim` tahmini ekleniyor. Olasılık `>= 0,55` ise sahneye özel koruyucu ipucu gösterilir ve deneyimli moddaki sayaç duraklar.
- **Hugging Face model deposu / commit:** gerçek verili eğitim ve onam kontrolü tamamlanınca eklenecek. Tüketici `main` dalını değil `public/model/release.json` içinde kaydedilen 40 karakterlik commit’e sabitlenmiş `resolve/<commit>/...` URL’lerini kullanır.
- **Geri alma hedefi:** önceki çalışan Primer sürümü (model kapalı) `4cd01a1485fd21d501888bfd59e97e1135a08c53`; yeni model için ilk iyi Hugging Face commit’i yayın sonrasında bu dosyaya yazılacak.

## Dağıtım mimarisi ödünleşim matrisi

| Seçenek | Ağ ve gecikme | Veri cihazdan çıkar mı? | Modelin gizliliği / tersine mühendislik | Karar |
|---|---|---|---|---|
| **Tarayıcı: GitHub Pages + `onnxruntime-web` (seçilen)** | İlk model indirmesinde ağ gerekir; indirme önbelleğe alındıktan sonra tahmin cihazda ve düşük gecikmeyle çalışır. Bağlantı/model yükü yoksa statik Primer devam eder. | Tahmin için özellikler ve ONNX modeli cihazda kalır. Katılımcı ancak açık rıza ile yerel anonim kayıt üretir; CSV’yi kendisi dışa aktarır. | ONNX ve özellikler herkese açıktır, indirilebilir ve incelenebilir; model sırrı korunmaz. | Var olan web uygulamasıyla ücretsiz ve hızlı entegrasyon; mahremiyet ve demo kolaylığı için en uygun seçim. |
| **Cihaz içi mobil: React Native / Expo + `onnxruntime-react-native`** | Model uygulama paketinde olduğunda çevrimdışı ve düşük gecikmeli; ilk kurulum paketi büyür ve mağaza/cihaz test yükü eklenir. | Tahmin girdileri cihazda kalabilir. Günlükleme/analitik eklenirse ayrıca onam ve aktarım tasarımı gerekir. | Paket çıkarılabildiğinden ONNX yine gizli değildir. | Çevrimdışı kullanım iyi, ancak bu ödevin mevcut web ürününe göre fazladan platform işi var. |
| **Sunucu: Rails/FastAPI API** | Her tahminde ağ isteği ve sunucu gecikmesi gerekir; çevrimdışı çalışmaz. | Beş özellik sunucuya gider; TLS, saklama politikası ve erişim denetimi gerekir. | Dosya indirilmediği için model görece daha az görünür; uç nokta sorguları/REA ile tahmin davranışı yine incelenebilir. | Model saklama isteği mahremiyet ve ücretsiz barındırma hedefinden daha önemliyse seçilebilir; bu sürümde seçilmedi. |

## Güvenli devreye alma

1. **Gölge (shadow):** Yeni commit’i eğitim/eval kapısı geçtikten sonra pilotta tahmin ettir, fakat oyun kararını değiştirtme. Onamlı oturumda tahmin ile seçilen güvenli/riskli seçenek etiketini yalnız cihazda eşleştir; dışa aktarılan değerlendirmenin amacı ve açık GitHub yayını onam ekranında belirtilir. Özellik/etiket verisi sunucuya sessizce gönderilmez. Balanced accuracy, riskli seçim sınıfı recall’ı, hata oranı ve indirme/tahmin gecikmesi incelenir.
2. **Kanarya (%5):** Statik Pages otomatik trafik bölmez; ilk kanarya sürümünü ayrı, açıkça etiketlenmiş önizleme bağlantısıyla yalnız davetli pilotun yaklaşık %5’ine göster. Gerçek kullanıcı sayısı küçük olduğundan yüzdeyi kesin istatistik gibi sunma; oturum adedini ve belirsizliği raporla. Bir yüksek öncelikli regresyon, sözleşme/parite hatası, eval eşiği kaybı veya açık gizlilik sorunu rollout’u durdurur.
3. **Aşamalı geçiş (%25 → %50 → %100):** Kanarya kabul ölçütlerini geçerse yeni grupları sürüm bağlantısıyla sırayla davet et. Her aşamada Cypress'in 15 testi, beş Python/tarayıcı parite girdisi, model yükleme hatası ve güvenli-final akışı yeniden doğrulanır. Metrik veya hata oranı kötüleşirse sonraki aşamaya geçilmez. GitHub Pages trafiği otomatik ölçülüp bölünmediği için grup oranları operasyonel davet planıdır; ölçülmemiş trafik yüzdesi iddia edilmez.

## Rollback

Uygulama model yükleme, sözleşme, CORS veya çıkarım hatasında model etkisini kapatıp önceki statik ipucu/sayaç akışına döner. Acil durumda `public/model/release.json` içindeki `enabled` değerini `false` yapıp hata nedenini yaz; değişikliği GitHub Pages’e dağıt. Model davranışındaki sorunlarda manifesti önceki tam Hugging Face commit URL’lerine döndür ve v2.0 için tutulan iyi commit SHA’yı koru. Sonra Cypress ve parite testlerini tekrar çalıştır; kök neden ve etkilenen commit bu dosyanın yayın kaydına eklenmeden yeniden rollout başlatma.
