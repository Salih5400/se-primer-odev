# The Primer v2 — model değerlendirme kapısı

**Durum:** Kapı başarısız; model yayımlanmadı  
**Veri:** `data/oturumlar.csv`  
**Değerlendirme tarihi:** 2026-11-06

## Veri özeti

- Öğrencinin bildirdiğine göre 7 arkadaş katılımcıdan toplanan 66 anonim gerçek oturum, toplam 198 karar satırı. Katılımcı sayısı CSV'de tutulmadığı için bu sayı kullanıcı beyanıdır. Yeni dosyalarla daha önce yayımlanan oturumlar karşılaştırıldı; aynı `(session_id, decision_id)` kayıtları tekilleştirildi.
- Her oturum `architecture`, `testing` ve `privacy` kararlarının üçünü de içeriyor.
- Etiket dağılımı: güvenli seçim (`0`) 112; riskli seçim (`1`) 86.
- Veri kümesi SHA-256: `60553a64d9fc4033edc8a25f513de973616f8bbcf5ae62c22ee7e61fbbcae458`.
- Bu dosya katılımcı adını, e-postasını, IP adresini, cihaz kimliğini veya serbest metni içermez. Toplama ekranındaki onam, anonim dışa aktarılan verinin açık depoda yayımlanacağını belirtir.
- Şema kişi kimliği toplamadığı için bölmeler `session_id` bazındadır; aynı kişinin birden fazla oturumunun farklı katlara düşmesi engellenemez.

## Önceden belirlenen değerlendirme

`spec.md`'de veri toplanmadan önce belirlenen özellikler, hedef, `0.55` olasılık eşiği ve kabul sınırları değiştirilmeden uygulandı. Standartlaştırma ve dengeli sınıf ağırlıklı lojistik regresyon, 5-fold `GroupKFold` içinde oturum kimliğine göre ayrıldı; aynı oturumun satırları eğitim ve doğrulama kümelerine karışmadı.

| Ölçüt | Sonuç | Gereken | Durum |
|---|---:|---:|---|
| Balanced accuracy | 0.525 | ≥ 0.65 | Başarısız |
| Riskli seçim recall | 0.256 | ≥ 0.70 | Başarısız |

Karışıklık matrisi (satırlar gerçek sınıf `0, 1`; sütunlar tahmin `0, 1`):

```text
[[89, 23],
 [64, 22]]
```

## Karar

Kabul kapısı geçilmediği için `model/` veya ONNX artefaktı üretilmedi, Hugging Face'e model yüklenmedi ve uygulamanın `public/model/release.json` manifesti kapalı kaldı. `train.py` bu durumu otomatik uygular. Eşiği sonradan düşürmek ya da başarısız sonucu model olarak yayımlamak yerine, daha çeşitli ve yeni bilgilendirilmiş onamla toplanmış gerçek oturumlar gerekir. Oturum kimliği kişi kimliği olmadığından bu değerlendirme bağımsız katılımcılar arasında genellemeyi ölçtüğünü göstermez.

## Yeniden üretme

Depo kökünde Python ortamı kurulduktan sonra:

```powershell
& '.\.venv\Scripts\python.exe' train.py
```

Beklenen sonuç, iki metrik eşiğinin de karşılanmadığını bildiren başarısız kapı mesajıdır. Başarısız çalıştırma `model/` klasörü oluşturmaz.
