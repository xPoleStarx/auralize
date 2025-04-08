# 🌟 Auralize: Yaratıcı Auranızı AI ile Keşfedin 🌟

*[English](docs/README_EN.md) ∙ [Türkçe](README.md) ∙ [中文](docs/README_ZH.md) ∙ [Français](docs/README_FR.md) ∙ [Русский](docs/README_RU.md) ∙ [Español](docs/README_ES.md) ∙ [Italiano](docs/README_IT.md) ∙ [日本語](docs/README_JP.md) ∙ [한국어](docs/README_KR.md) ∙ [العربية](docs/README_AR.md) ∙ [Português](docs/README_PT.md)*

![Auralize Logo](public/auralize_logo.jpg) <!-- ✨ Logo eklenecekse URL buraya gelecek ✨ -->

**Auralize** 🎨, kullanıcıların yaratıcı "auralarını" keşfetmelerine ve geliştirmelerine olanak tanıyan interaktif bir web platformudur. Görsel quiz'ler 🎥, kişisel tercihler 🌈 ve serbest girdilerle yapay zeka destekli **sanat eserleri** 🖼️, **hikayeler** 📖 ve **sesler** 🎶 üreterek herkesin içindeki yaratıcılığı ortaya çıkarmayı hedefliyoruz. Lenovo'nun *"Senin auran sınırsız"* kampanyasına paralel olarak, bu proje kullanıcıların yaratıcı potansiyelini AI ile görselleştiriyor ve topluluk odaklı bir deneyim sunuyor! 🚀

---

## 🎯 Hedef
Auralize, tek seferlik bir sanat eseri üreten bir uygulamadan çok daha fazlasıdır! 🌌 Kullanıcıların yaratıcı yolculuklarını keşfedebilecekleri, zamanla gelişen ve kişiselleştirilmiş bir deneyim sunan bir platform olmayı amaçlar. Her ziyarette **yeni bir şeyler keşfetmek** ✨ ve yaratıcılığı farklı şekillerde ifade etmek, kullanıcıları düzenli olarak geri dönmeye teşvik eder. 💡

---

## ✨ Temel Özellikler ✨
1. **🎮 Dinamik ve Etkileşimli Giriş Arayüzü**  
   - Çok adımlı, oyunlaştırılmış bir *"Yaratıcı Keşif Yolculuğu"*.  
   - Görsel quiz'ler 🖼️, renk paletleri 🎨 ve serbest girdilerle ruh halleri ve yaratıcı eğilimler analiz edilir.

2. **🌟 Zengin ve Evrilen Çıktılar**  
   - AI tarafından üretilen sanat eserleri 🎨, hikayeler/şiirler 📜 ve ses klipleri 🎵.  
   - Kullanıcılar eserlerini zamanla *"evrimleştirebilir"* (örneğin, stil değiştirme, detay ekleme) 🔄.

3. **📊 Kişisel Aura Profili**  
   - Geçmiş eserler ve tercihler için bir *"Yaratıcı Günlük"*.  
   - *"Aura Evrimi"* grafiği ile yaratıcı eğilimlerin zaman içindeki değişimi 📈.

4. **🌐 Topluluk ve Sosyal Etkileşim**  
   - Eserlerinizi paylaşabileceğiniz bir galeri 🖼️.  
   - Yorum 💬, beğeni ❤️ ve haftalık temalarla sosyal bir boyut.

5. **🏆 Oyunlaştırma ve Ödüller**  
   - Rozetler 🥇, puan sistemi 🎯 ve lider tabloları 📋 ile motivasyon.  
   - Haftalık yarışmalar ve etkileşim ödülleri 🎁.

---

## 🛠️ Kullanılan Yapay Zeka Teknolojileri
- **🖼️ Görüntü Üretimi:** *Stable Diffusion* ile benzersiz sanat eserleri.  
- **📝 Metin Üretimi:** *GPT tabanlı modeller* ile kişiselleştirilmiş hikayeler ve şiirler.  
- **🎶 Ses Üretimi (Opsiyonel):** *AudioLDM* ile aura temalı melodiler.  

Bu teknolojiler, kullanıcı girdilerini **zengin ve yaratıcı içeriklere** dönüştürmek için bir araya getirilmiştir! ⚙️

---

## 🤝 Kampanyaya Katkı
"Auralize", Lenovo'nun *"Senin auran sınırsız"* kampanyasını destekleyerek yaratıcılığı teşvik etmeyi ve geniş kitlelere ulaşmayı hedefler. Sosyal medya paylaşım özellikleri 📲 ve topluluk galerisi ile kampanyanın viral yayılımını artırırken, **Lenovo Yoga Aura Edition**'ın yapay zeka gücünü vurgular. 🌍

---

## ⚙️ Kurulum
### 📋 Gereksinimler
- **Node.js** (v16 veya üstü)  
- **Python** (v3.8 veya üstü)  
- Stable Diffusion, GPT ve AudioLDM modelleri için API erişimi veya yerel kurulum  

### 🚀 Adımlar
1. Depoyu klonlayın ve çalıştırın:
   ```bash
   git clone https://github.com/xPoleStarx/auralize.git
   cd auralize

   npm install
   pip install -r requirements.txt

   npm start

```

## DeepSeek API Entegrasyonu

Auralize projesini DeepSeek API ile entegre etmek için aşağıdaki adımları izleyin:

1. [DeepSeek](https://deepseek.ai/) platformuna kayıt olup bir API anahtarı alın.
2. `.env` dosyasını açıp `REACT_APP_DEEPSEEK_API_KEY` değişkenine aldığınız API anahtarını ekleyin:

```
REACT_APP_DEEPSEEK_API_KEY=size_verilen_api_anahtari
```

3. Uygulamayı başlatmak için:

```
npm install   # Bağımlılıkları yükleyin
npm start     # Uygulamayı başlatın
```

4. Tarayıcınızda http://localhost:3000 adresine giderek uygulamayı açın.
5. Quiz'i tamamlayın ve DeepSeek'in sizin cevaplarınıza göre özel olarak oluşturduğu aura hikayenizi görün!

### DeepSeek API Nasıl Çalışıyor?

Quiz cevaplarınızı tamamladığınızda, sistem şu adımları takip eder:

1. Cevaplarınız analiz edilerek bir aura tipi belirlenir (Yaratıcı, Analitik, Empatik veya Enerjik).
2. Cevaplarınız ve aura tipiniz DeepSeek API'sine gönderilir.
3. DeepSeek AI, bu bilgileri kullanarak size özel bir aura hikayesi oluşturur.
4. Oluşturulan hikaye ekranınızda görüntülenir.

Bu entegrasyon sayesinde, her kullanıcı için tamamen benzersiz ve kişiselleştirilmiş bir aura hikayesi sunulur!
