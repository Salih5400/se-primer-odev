# The Primer v2 — model değerlendirme kapısı

**Durum:** Kapı başarısız; model yayımlanmadı  
**Veri:** `data/oturumlar.csv`  
**Değerlendirme tarihi:** 2026-11-06

## Veri özeti

- 25 farklı anonim gerçek oturum, toplam 75 karar satırı.
- Her oturum `architecture`, `testing` ve `privacy` kararlarının üçünü de içeriyor.
- Etiket dağılımı: güvenli seçim (`0`) 52; riskli seçim (`1`) 23.
- Veri kümesi SHA-256: `480a2ecb0fa6dd7d944df4d541336b9564a3b092d4826208729fc0ff6a424fbc`.
- Bu dosya katılımcı adını, e-postasını, IP adresini, cihaz kimliğini veya serbest metni içermez. Toplama ekranındaki onam, anonim dışa aktarılan verinin açık depoda yayımlanacağını belirtir.

## Önceden belirlenen değerlendirme

`spec.md`'de veri toplanmadan önce belirlenen özellikler, hedef, `0.55` olasılık eşiği ve kabul sınırları değiştirilmeden uygulandı. Standartlaştırma ve dengeli sınıf ağırlıklı lojistik regresyon, 5-fold `GroupKFold` içinde oturum kimliğine göre ayrıldı; aynı oturumun satırları eğitim ve doğrulama kümelerine karışmadı.

| Ölçüt | Sonuç | Gereken | Durum |
|---|---:|---:|---|
| Balanced accuracy | 0.556 | ≥ 0.65 | Başarısız |
| Riskli seçim recall | 0.478 | ≥ 0.70 | Başarısız |

Karışıklık matrisi (satırlar gerçek sınıf `0, 1`; sütunlar tahmin `0, 1`):

```text
[[33, 19],
 [12, 11]]
```

## Karar

Kabul kapısı geçilmediği için `model/` veya ONNX artefaktı üretilmedi, Hugging Face'e model yüklenmedi ve uygulamanın `public/model/release.json` manifesti kapalı kaldı. `train.py` bu durumu otomatik uygular. Eşiği sonradan düşürmek ya da başarısız sonucu model olarak yayımlamak yerine, daha çeşitli ve yeni bilgilendirilmiş onamla toplanmış gerçek oturumlar gerekir. Bu veriyle modelin kişiler hakkında genellenebilir davranış tahmini yaptığı iddia edilemez.

## Yeniden üretme

Depo kökünde Python ortamı kurulduktan sonra:

```powershell
& '.\.venv\Scripts\python.exe' train.py
```

Beklenen sonuç, iki metrik eşiğinin de karşılanmadığını bildiren başarısız kapı mesajıdır. Başarısız çalıştırma `model/` klasörü oluşturmaz.
