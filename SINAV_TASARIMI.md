# Sizinle Uyumlanan Sınav Tasarımı

**Biçim:** Kapalı kitap, bireysel, 50 dakika, 100 puan. Tek sayfalık senaryo ve 300 girdilik test eki verilir; öğrencinin ezber tanım yerine gerekçe, test tasarımı ve kanıt üretmesi ölçülür.

## Özgün klasik sınav sorusu

Bir üniversitenin randevu eğitim simülatörü v1’de her karar sahnesinde aynı isteğe bağlı ipucunu gösteriyor. v2, `seviye_deneyimli`, `karar_suresi_sn`, `onceki_riskli_secim_sayisi`, `onceki_ipucu_sayisi`, `sahne_no` girdilerinden `riskli_secim` olasılığını tahmin eden küçük bir sklearn modelini ONNX’e çeviriyor. Olasılık 0,55’i aşınca risk azaltıcı ipucu otomatik açılıyor ve deneyimli kullanıcı için sayaç duruyor. 15 gerçek oturumla eğitim yapılıyor; oturum bazlı 5-fold GroupKFold kullanılıyor. Python ONNX Oracle ve tarayıcı ONNX uygulaması aynı model sürümünü tüketiyor. Yeni model önce gölge modda ölçülecek, sonra küçük kanarya ve aşamalı dağıtımla açılacak.

1. **Test stratejisi (25 puan):** 300 sabit girdide Python Oracle ile tarayıcı çıktısını karşılaştıran bir diferansiyel test tasarlayın. Girdi/çıktı sözleşmesini, `1e-4` mutlak toleransını, başarısızlık raporunu ve neden yalnız “iki sonuç aynı” demenin yetersiz olduğunu belirtin.
2. **Doğrulama ve geçerleme (20 puan):** Bir doğrulama (verification) kanıtı ve bir geçerleme (validation) kanıtı verin. Her birinin hangi soruyu yanıtladığını açıklayın. Kullanıcıların gerçekten karar öncesi yardıma ihtiyaç duyup duymadığını ölçmek için uygun bir yöntem önerin.
3. **Karakterizasyon ve regresyon (20 puan):** v1’in sekiz karar yolunu ve güvenli/veri riski finalini karakterize eden testler yazın. Model v2’de devreye girince önceki davranışın bozulmadığını ve eşik üstü/altı davranış farkını nasıl sınayacağınızı belirtin.
4. **Eval ve veri (20 puan):** Aynı oturumdaki üç karar satırının rastgele train/test’e dağılmasının neden sızıntı oluşturabileceğini açıklayın. Balanced accuracy ve riskli seçim sınıfı recall’ını yorumlayın; sentetik Cypress kayıtlarının gerçek kullanıcı eval’i sayılamayacağını belirtin.
5. **Sürümleme ve güvenli dağıtım (15 puan):** ONNX, config ve model kartını tek commit’e sabitleyin. Gölge → %5 kanarya → %25/%50/%100 aşamalarını, izlenecek metriği, durdurma koşulunu ve önceki commit’e rollback adımını yazın.

## Beklenen kavramlar ve çeldiriciler

- **Beklenen:** Oracle aynı ONNX sürümünü kullanır; sınıf/özellik sırası doğrulanır; tolerans kayan nokta farkını kapsar; karakterizasyon testi bilinmeyen/mevcut davranışı kaydeder; regresyon testi değişiklik sonrası bu davranışı korur; verification spesifikasyona uygunluğu, validation gerçek kullanıcı ihtiyacını karşılamayı ölçer; oturum gruplama sızıntıyı önler; gölge mod kullanıcıya etkisizdir; model commit’i ve geri dönüş sürümü nettir.
- **Çeldiriciler:** Tam bit düzeyinde eşitlik istemek; yalnız accuracy raporlamak; satır bazlı rastgele bölme; sentetik test verisini gerçek oturum diye sunmak; gölge modu kullanıcıya gösterilen rollout sanmak; yalnız `main` URL’sine bağlanmak; model hata verince oyunu durdurmak.

**Puanlama ilkesi:** Doğru kavramı senaryoya bağlayan gerekçeye puan verilir. Sadece tanım yazmak, ölçülebilir test veya hata koşulu göstermemek tam puan getirmez.
