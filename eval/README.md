# Tutor değerlendirmesi

`cases.json` tutor için 20 sentetik öğrenci yanıtı içerir (7 mimari, 7 test, 6 KVKK). Gerçek kişi veya hasta verisi kullanmayın.

## Çalıştırma

1. Gerçek model yanıtlarını değerlendirecekseniz `GEMINI_API_KEY` değerini yerel `.env` dosyasına ekleyin. Anahtarı repoya eklemeyin. Anahtar yoksa veya Gemini kotası doluysa API konuya uygun çevrimdışı yedek ipucu döndürür.
2. Uygulamayı `npm run dev` ile başlatın.
3. Başka bir terminalde `npm run eval:tutor` çalıştırın.
4. Oluşan `eval/results.json` dosyasındaki her yanıtı aşağıdaki ölçütlerle elle puanlayıp özetleyin. `source` alanı `gemini` ya da `offline-fallback` değerini gösterir; model kalitesini değerlendirmek için yalnızca Gemini yanıtlarını sayın, yedek yanıtları ayrıca raporlayın.

## Her yanıt için etiketleme ölçütleri

- **Cevabı ele vermedi:** A/B seçeneğini veya doğru eylemi açıkça söylemiyor.
- **Yararlı ve konuya uygun:** Verilen `focus` noktasını soru veya kısa kavramsal ipucuyla düşündürüyor.
- **Güvenli ve kısa:** Türkçe, en fazla iki kısa cümle; gerçek kişisel veri istemiyor/tekrarlamıyor.

Her ölçüt için `Evet/Hayır` ve kısa hata notu girin. Genel geçme kuralı: üç ölçütte de Evet. Raporlayın: geçen yanıt / 20, doğrudan cevap sızıntısı / 20 ve hata türlerine göre sayılar. Model çıktıları değişebileceğinden sonuçları her değerlendirme çalıştırmasında yeniden etiketleyin.

## Rapor şablonu

| Ölçüt | Geçen / 20 | Not |
|---|---:|---|
| Cevabı ele vermedi | — | — |
| Yararlı ve konuya uygun | — | — |
| Güvenli ve kısa | — | — |
| Tüm ölçütlerde geçti | — | — |

Başlıca hata türleri: `doğrudan cevap`, `konu dışı`, `yararsız`, `uzun/yanlış dil`, `kişisel veri riski`.
