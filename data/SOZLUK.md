# Veri sözlüğü — oturumlar.csv

Bir satır bir karar ekranını temsil eder. `session_id` aynı oynayışın en çok üç kararını bağlar; rastgele oluşturulur. Eğitim hedefi `riskli_secim`, oyuncunun tıkladığı seçeneğin uygulamada önceden güvenli (0) veya riskli (1) olarak tanımlanmış olmasıdır. Hedef, taban örneğindeki “ipucuya ihtiyaç var mı?” öz bildirimi yerine gerçek oyun davranışından gelir.

| Sütun | Tür / birim | Anlam |
|---|---|---|
| `session_id` | Rastgele metin | Tek oyun oturumunu bağlamak için tarayıcıda üretilen rastgele kimlik; kişiyle eşleştirme anahtarı yoktur. |
| `decision_id` | `architecture`, `testing`, `privacy` | Karar sahnesinin sabit teknik adı. Model girdisi değildir. |
| `seviye_deneyimli` | 0/1 | 1 deneyimli, 0 başlangıç seviyesi. |
| `karar_suresi_sn` | Saniye, 0–600 | Sahne açılışından seçim yapılana kadar geçen süre; onda bir saniyeye yuvarlanır. |
| `onceki_riskli_secim_sayisi` | Tamsayı, 0–2 | Bu oturumda önceki sahnelerde seçilen riskli seçeneklerin sayısı. |
| `onceki_ipucu_sayisi` | Tamsayı, 0–2 | Bu oturumda önceki sahnelerde açılan ipucu sayısı. |
| `sahne_no` | Tamsayı, 1–3 | Oyun içindeki karar sırası. |
| `riskli_secim` | 0/1 | Seçilen seçeneğin senaryoya göre riskli olması (1) veya güvenli olması (0). Oyun seçeneğinin önceden tanımlı etiketidir ve eğitim hedefidir. |
| `kaynak` | `gercek` / `sentetik` | Veri kaynağı. Katılımcı açık rıza verdiğinde uygulama `gercek` yazar; bu repodaki gerçek eğitim verisi sadece gerçek katılımcı oturumlarından birleştirilmelidir. |

## Gizlilik ve toplama

Veri toplama modu `?collect=1` ile açılır. Rıza kutusu işaretlenmeden kayıt yapılmaz. Katılımcı adı, e-posta, cihaz kimliği, IP adresi, konum, serbest metin veya hasta verisi istenmez. Kayıtlar sunucuya gönderilmez; aynı tarayıcının yerel depolamasında tutulur ve final ekranındaki CSV düğmesiyle kullanıcı tarafından dışa aktarılır. Rıza geri çekilirse finaldeki silme düğmesi bu tarayıcıdaki tüm anonim satırları temizler; CSV daha önce dışa aktarıldıysa o dosya da silinmelidir.

Başlangıçta CSV yalnız başlıktan oluşur; içine sentetik veya uydurulmuş gerçek kayıt eklenmemiştir. Veri toplama modunda model çıkarımı kapalıdır; böylece modelin ürettiği ipucu seçimi etkilemeden gözlenen seçimler etiketlenir.
