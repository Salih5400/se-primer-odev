# Veri sözlüğü — oturumlar.csv

Bir satır bir karar ekranını temsil eder. `session_id` aynı oynayışın en çok üç kararını bağlar; rastgele oluşturulur. Eğitim hedefi `ipucu_ihtiyaci` oyuncunun o karar öncesinde ipucuna ihtiyaç duyup duymadığına dair kendi yanıtıdır.

| Sütun | Tür / birim | Anlam |
|---|---|---|
| `session_id` | Rastgele metin | Tek oyun oturumunu bağlamak için tarayıcıda üretilen rastgele kimlik; kişiyle eşleştirme anahtarı yoktur. |
| `decision_id` | `architecture`, `testing`, `privacy` | Karar sahnesinin sabit teknik adı. Model girdisi değildir. |
| `seviye_deneyimli` | 0/1 | 1 deneyimli, 0 başlangıç seviyesi. |
| `karar_suresi_sn` | Saniye, 0–600 | Sahne açılışından seçim yapılana kadar geçen süre; onda bir saniyeye yuvarlanır. |
| `onceki_yanlis_sayisi` | Tamsayı, 0–2 | Bu oturumda önceki sahnelerde seçilen riskli seçeneklerin sayısı. |
| `onceki_ipucu_sayisi` | Tamsayı, 0–2 | Bu oturumda önceki sahnelerde açılan ipucu sayısı. |
| `sahne_no` | Tamsayı, 1–3 | Oyun içindeki karar sırası. |
| `ipucu_ihtiyaci` | 0/1 | Oyuncunun karar verdikten sonra verdiği yanıt: ipucuna ihtiyaç duydu (1) / duymadı (0). Eğitim hedefidir. |
| `kaynak` | `gercek` / `sentetik` | Veri kaynağı. Katılımcı açık rıza verdiğinde uygulama `gercek` yazar; bu repodaki gerçek eğitim verisi sadece gerçek katılımcı oturumlarından birleştirilmelidir. |

## Gizlilik ve toplama

Veri toplama modu `?collect=1` ile açılır. Rıza kutusu işaretlenmeden kayıt yapılmaz. Katılımcı adı, e-posta, cihaz kimliği, IP adresi, konum, serbest metin veya hasta verisi istenmez. Kayıtlar sunucuya gönderilmez; aynı tarayıcının yerel depolamasında tutulur ve final ekranındaki CSV düğmesiyle kullanıcı tarafından dışa aktarılır. Rıza geri çekilirse finaldeki silme düğmesi bu tarayıcıdaki tüm anonim satırları temizler; CSV daha önce dışa aktarıldıysa o dosya da silinmelidir.

Başlangıçta CSV yalnız başlıktan oluşur; içine sentetik veya uydurulmuş gerçek kayıt eklenmemiştir.
