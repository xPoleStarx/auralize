## Görsel Üretimi

Auralize uygulaması, Creative Potential quiz sonuçları için LCM modeli ile kişiselleştirilmiş aura görselleri üretebilir. Bu özelliği kullanmak için:

1. [GetImg.ai](https://getimg.ai/tools/api#pricing) üzerinden bir API anahtarı alın
2. `.env` dosyasında `GETIMG_API_KEY` değişkenini API anahtarınızla güncelleyin
3. Uygulamayı yeniden başlatın

```
GETIMG_API_KEY=your_getimg_api_key_here
```

Görsel üretimi yalnızca "Creative Potential" quiz sonuçları için etkindir ve OpenAI API'dan alınan özel bir image prompt kullanılarak oluşturulur. Diğer quiz türleri için bu özellik etkin değildir. 