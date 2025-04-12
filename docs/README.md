# 🌟 Auralize: Yaratıcı Auranızı Yapay Zekâ ile Keşfedin 🌟

*[English](docs/README_EN.md) ∙ [Türkçe](README.md) ∙ [中文](docs/README_ZH.md) ∙ [Français](docs/README_FR.md) ∙ [Русский](docs/README_RU.md) ∙ [Español](docs/README_ES.md) ∙ [Italiano](docs/README_IT.md) ∙ [日本語](docs/README_JP.md) ∙ [한국어](docs/README_KR.md) ∙ [العربية](docs/README_AR.md) ∙ [Português](docs/README_PT.md)*

![Auralize Logo](frontend/public/auralize_logo.jpg)

**Auralize** 🎨, kullanıcıların yaratıcı "auralarını" keşfetmelerine ve geliştirmelerine olanak tanıyan, yapay zekâ destekli, interaktif bir web platformudur. Görsel quiz'ler 🎥, kişisel tercihler 🌈 ve serbest girdiler aracılığıyla yapay zekâ destekli **sanat eserleri** 🖼️, **hikâyeler** 📖 ve **sesler** 🎶 üreterek herkesin içindeki yaratıcılığı ortaya çıkarmayı hedefler. Lenovo'nun *"Senin auran sınırsız"* kampanyasına paralel olarak geliştirilen bu proje, kullanıcıların yaratıcı potansiyelini yapay zekâ ile görselleştirir ve topluluk odaklı bir deneyim sunar! 🚀

---

## 🎯 Amaç ve Hedefler

Auralize, yalnızca tek seferlik bir sanat eseri üreten bir uygulamadan ibaret değildir. Kullanıcıların yaratıcı yolculuklarını keşfedebilecekleri, zamanla gelişen ve kişiselleştirilmiş bir deneyim sunan bir platform olmayı amaçlar. Her ziyarette yeni bir şeyler keşfetme imkânı sağlayarak kullanıcıların yaratıcılıklarını farklı şekillerde ifade etmelerine olanak tanır ve düzenli olarak geri dönmelerini teşvik eder. Temel amaçlar şunlardır:

1. **Kişisel Keşif**: Kullanıcıların yaratıcı eğilimlerini ve düşünce tarzlarını keşfetmelerini sağlamak.
2. **Yapay Zekâ Destekli İçgörüler**: Quiz cevaplarını analiz ederek kullanıcılara güçlü yönleri, potansiyelleri ve düşünme stilleri hakkında derinlemesine içgörüler sunmak.
3. **Görsel ve Hikâye Deneyimi**: Kullanıcının aurasını görsel kristaller ve kişiselleştirilmiş hikâyelerle temsil etmek.
4. **Topluluk ve Paylaşım**: Kullanıcıların aura sonuçlarını paylaşabilecekleri ve başkalarının sonuçlarını görebilecekleri bir topluluk alanı oluşturmak.

---

## ✨ Temel Özellikler

1. **🎮 Dinamik ve Etkileşimli Giriş Arayüzü**  
   - Çok adımlı, oyunlaştırılmış bir *"Yaratıcı Keşif Yolculuğu"*.  
   - Görsel quiz'ler 🖼️, renk paletleri 🎨 ve serbest girdilerle ruh halleri ve yaratıcı eğilimler analiz edilir.  
   - Kullanıcıların kişiliklerini ve yaratıcı eğilimlerini ölçen interaktif bir quiz deneyimi.

2. **🌟 Zengin ve Evrilen Çıktılar**  
   - Yapay zekâ tarafından üretilen sanat eserleri 🎨, hikâyeler/şiirler 📜 ve ses klipleri 🎵.  
   - Kullanıcılar eserlerini zamanla *"evrimleştirebilir"* (örneğin, stil değiştirme veya detay ekleme).  
   - Kullanıcının aura tipine göre özelleştirilmiş kristal animasyonları ve görsel efektler.

3. **📊 Kişisel Aura Profili**  
   - Geçmiş eserler ve tercihler için bir *"Yaratıcı Günlük"*.  
   - *"Aura Evrimi"* grafiği ile yaratıcı eğilimlerin zaman içindeki değişimini takip etme.  
   - Kullanıcının güçlü yönlerini, potansiyelini ve düşünme tarzını anlatan detaylı içgörü kartları.

4. **🌐 Topluluk ve Sosyal Etkileşim**  
   - Kullanıcıların eserlerini paylaşabilecekleri bir galeri.  
   - Yorum 💬, beğeni ❤️ ve haftalık temalarla sosyal bir boyut.  
   - Kullanıcıların kendi auralarını paylaşabildiği ve başkalarının auralarını keşfedebildiği bir topluluk alanı.

5. **🏆 Oyunlaştırma ve Ödüller**  
   - Rozetler 🥇, puan sistemi 🎯 ve lider tabloları 📋 ile motivasyon.  
   - Haftalık yarışmalar ve etkileşim ödülleri 🎁.  
   - Kullanıcının aurasını interaktif bir oyun deneyimiyle keşfetmesini sağlayan *Aura Oyunu*.

6. **🌟 Aura Tipleri**  
   - Yaratıcı, Analitik, Empatik ve Enerjik gibi farklı aura tipleri ve bunların detaylı açıklamaları.

---

## 📖 Sistem Mimarisi ve Genel Bakış

Auralize, kullanıcıların yaratıcı "auralarını" keşfetmelerine olanak tanıyan, yapay zekâ destekli bir web platformudur. Sistem, kullanıcıların kişilik testleri aracılığıyla kendi auralarını keşfetmesini ve bu aurayı görsel, hikâye ve içgörülerle deneyimlemesini sağlar.

### 🏗️ Mimari Yapı

Auralize, modern ve modüler bir mimari kullanılarak geliştirilmiştir:

1. **Frontend Katmanı**: React ve TypeScript ile oluşturulmuş, kullanıcı arayüzünden ve etkileşimlerden sorumlu katman.
2. **Backend Katmanı**: Node.js ve Express ile geliştirilmiş, yapay zekâ servisleriyle iletişim kuran ve veri işleme süreçlerini yöneten katman.
3. **AI Servisleri Katmanı**: OpenAI ve DeepSeek gibi yapay zekâ servisleriyle entegrasyonu sağlayan ara katman.
4. **Veri Saklama Katmanı**: Kullanıcı verilerini ve oluşturulan aura sonuçlarını saklayan katman (yerel dosya sistemi ve önbellek mekanizması).

---

## 💻 Teknik Detaylar ve Kod Kalitesi

### 🧩 Modüler ve Esnek Yapı

Auralize, son derece modüler bir yapı üzerine inşa edilmiştir. Bu yaklaşım, şu avantajları sağlar:

1. **Soyutlama Katmanları**: Frontend ve backend arasında net bir ayrım bulunur. Frontend, backend API'lerini kullanarak veri alışverişi yapar; backend ise farklı yapay zekâ servislerini soyutlayarak tek bir arayüz sunar.

2. **Servis Soyutlaması**: `aiService.ts` modülü, hangi yapay zekâ servisinin kullanılacağını dinamik olarak belirler ve gerekli servis sınıfını çağırır. Bu sayede:
   - OpenAI ve DeepSeek gibi farklı yapay zekâ sağlayıcıları arasında sorunsuz geçiş yapılabilir.
   - Yeni bir yapay zekâ servisi eklenmesi minimum değişiklikle gerçekleştirilebilir.
   - Test ve geliştirme süreçlerinde mock servisler kolayca entegre edilebilir.

   ```typescript
   export const getCombinedAuraData = async (
     auraType: string,
     username: string,
     answers: { [key: number]: string },
     preferredService: string = 'openai'
   ): Promise<AuraServiceResponse> => {
     const serviceName = getAIService(preferredService);
     switch (serviceName) {
       case 'deepseek':
         return await deepseekService.getCombinedAuraData(auraType, username, answers);
       case 'openai':
         return await getCombinedAuraDataFromOpenAI(auraType, username, answers);
       default:
         // Varsayılan yanıt
     }
   };
   ```

3. **Önbellek Mekanizması**: Sistemde akıllı bir önbellek mekanizması kullanılır. Aynı sorgu parametreleriyle daha önce yapılmış API çağrıları önbellekte saklanır ve belirli bir süre içinde tekrar istenirse API çağrısı yerine önbellekten yanıt döndürülür. Bu yaklaşım:
   - API maliyetlerini önemli ölçüde azaltır.
   - Yanıt sürelerini hızlandırır.
   - Servis kesintilerinde bile çalışmaya devam edilmesini sağlar.

4. **Temiz Kod Prensipleri**: Kod tabanı, "spagetti kod"dan arındırılmış ve SOLID prensiplerine uygun şekilde tasarlanmıştır:
   - **Tek Sorumluluk Prensibi (SRP)**: Her modül ve sınıf yalnızca tek bir sorumluluk taşır.
   - **Açık/Kapalı Prensibi (OCP)**: Yeni özellikler mevcut kodu değiştirmeden eklenebilir.
   - **Bağımlılık Tersine Çevirme Prensibi (DIP)**: Yüksek seviyeli modüller, düşük seviyeli modüllere bağımlı değildir.

---

### 🔄 OpenAI ve DeepSeek Servisleri Arasında Geçiş

Sistem, farklı yapay zekâ servisleri arasında sorunsuz geçiş yapabilecek şekilde tasarlanmıştır:

1. **Ortak Arayüz**: Tüm yapay zekâ servisleri aynı metot imzalarını kullanır; böylece hangi servis kullanılırsa kullanılsın aynı sonuç formatı elde edilir.

2. **Yapılandırma Tabanlı Geçiş**: Servis seçimi, `.env` dosyasındaki yapılandırma veya kullanıcı tercihi üzerinden dinamik olarak yapılır:

   ```typescript
   const getAIService = (preferredService: string): string => {
     const configuredService = process.env.DEFAULT_AI_SERVICE || 'openai';
     if (preferredService === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
       return 'deepseek';
     } else if (preferredService === 'openai' && process.env.OPENAI_API_KEY) {
       return 'openai';
     }
     return configuredService;
   };
   ```

3. **Hata İşleme ve Yedekleme**: Bir servis başarısız olduğunda sistem otomatik olarak yedek servise geçer:

   ```typescript
   try {
     return await primaryService.getCombinedAuraData(params);
   } catch (error) {
     logger.warn(`${preferredService} servisi başarısız oldu, yedek servise geçiliyor`);
     return await backupService.getCombinedAuraData(params);
   }
   ```

4. **Esnek İstek Formatları**: Farklı yapay zekâ servisleri, farklı istek formatları bekleyebilir. Sistem, her servis için uygun istek formatını otomatik olarak oluşturur:

   ```typescript
   const formatOpenAIRequest = (params) => ({
     model: OPENAI_MODEL,
     messages: [
       { role: "system", content: systemPrompt },
       { role: "user", content: userMessage }
     ],
     temperature: 0.7
   });

   const formatDeepSeekRequest = (params) => ({
     model: DEEPSEEK_MODEL,
     prompt: combinedPrompt,
     temperature: 0.8
   });
   ```

---

### 🔄 Yükleme Durumları ve Kullanıcı Deneyimi

Auralize, kullanıcı deneyimini optimize etmek için gelişmiş yükleme durumu yönetimi sunar:

1. **Kristal Yükleme Animasyonu**: Yapay zekâ servisi yanıt üretirken kullanıcıya varsayılan bir hikâye veya hata mesajı göstermek yerine estetik bir kristal yükleme animasyonu gösterilir.
2. **Kademeli İçerik Yükleme**: Büyük içerikler parça parça yüklenir, böylece kullanıcılar hemen bir şeyler görebilir.
3. **İşlem Durumu Göstergeleri**: Yapay zekânın ilerleme durumu, kullanıcıya bir ilerleme çubuğu ile gösterilir.

---

## 🛠️ Kullanılan Teknolojiler

- **Frontend**: React, TypeScript, Framer Motion (animasyonlar için)
- **Backend**: Node.js, Express
- **Yapay Zekâ Servisleri**:
  - **Görüntü Üretimi**: *Stable Diffusion* ile benzersiz sanat eserleri.
  - **Metin Üretimi**: *GPT tabanlı modeller* (OpenAI GPT) ve DeepSeek ile kişiselleştirilmiş hikâyeler ve şiirler.
  - **Ses Üretimi (Opsiyonel)**: *AudioLDM* ile aura temalı melodiler.
- **Veri Saklama**: Yerel dosya sistemi, önbellek mekanizması
- **Stil ve Tasarım**: CSS, kişiselleştirilmiş animasyonlar

---

## 📊 Performans ve Ölçeklenebilirlik

Auralize, yüksek performans ve ölçeklenebilirlik sunacak şekilde tasarlanmıştır:

1. **Önbellek Kullanımı**: Tekrarlanan sorguları azaltmak için akıllı önbellek mekanizması.
2. **Zaman Aşımı Yönetimi**: Uzun süren yapay zekâ istekleri için akıllı zaman aşımı ve geri dönüş mekanizmaları.
3. **Kademeli Yükleme**: Büyük içeriklerin kademeli olarak yüklenmesi.

---

## 🤝 Kampanyaya Katkı

Auralize, Lenovo'nun *"Senin auran sınırsız"* kampanyasını destekleyerek yaratıcılığı teşvik etmeyi ve geniş kitlelere ulaşmayı hedefler. Sosyal medya paylaşım özellikleri ve topluluk galerisi ile kampanyanın viral yayılımını artırırken, **Lenovo Yoga Aura Edition**'ın yapay zekâ gücünü vurgular.

---

## ⚙️ Kurulum

### 📋 Gereksinimler

- **Node.js** (v16 veya üstü)
- **Python** (v3.8 veya üstü)
- Stable Diffusion, Llama, GPT ve AudioLDM modelleri için API erişimi veya yerel kurulum

### 🚀 Adımlar

1. Depoyu klonlayın ve bağımlılıkları yükleyin:

   ```bash
   git clone https://github.com/xPoleStarx/auralize.git
   cd auralize
   npm install
   pip install -r requirements.txt
   npm start
   ```

2. Tarayıcınızda `http://localhost:3000` adresine giderek uygulamayı açın.
3. Quiz'i tamamlayın ve yapay zekânın cevaplarınıza göre oluşturduğu aura hikâyenizi görün!

---

## 🔧 Yapay Zekâ API Entegrasyonları

### OpenAI API Entegrasyonu (Aktif Olarak Kullanılıyor)

Auralize projesi, şu anda aktif olarak OpenAI API'sini kullanmaktadır. OpenAI API ile entegrasyon için aşağıdaki adımları izleyin:

1. [OpenAI](https://platform.openai.com/) platformuna kayıt olun ve bir API anahtarı alın.
2. `.env` dosyasını açın ve `OPENAI_API_KEY` değişkenine aldığınız API anahtarını ekleyin:

   ```
   OPENAI_API_KEY=size_verilen_api_anahtari
   ```

3. Uygulamayı başlatın:

   ```bash
   npm install   # Bağımlılıkları yükleyin
   npm start     # Uygulamayı başlatın
   ```

4. Tarayıcınızda `http://localhost:3000` adresine giderek uygulamayı açın.
5. Quiz'i tamamlayın ve OpenAI'nin cevaplarınıza göre oluşturduğu kişiselleştirilmiş aura hikâyenizi görün!

#### OpenAI API Nasıl Çalışır?

Quiz cevaplarınızı tamamladığınızda sistem şu adımları izler:

1. Cevaplarınız analiz edilerek bir aura tipi belirlenir (Yaratıcı, Analitik, Empatik veya Enerjik).
2. Cevaplarınız ve aura tipiniz OpenAI API'sine gönderilir.
3. OpenAI, bu bilgileri kullanarak size özel bir aura hikâyesi oluşturur.
4. Oluşturulan hikâye ekranınızda görüntülenir.

Bu entegrasyon sayesinde her kullanıcı için tamamen benzersiz ve kişiselleştirilmiş bir aura hikâyesi sunulur.

---

### DeepSeek API Entegrasyonu

Auralize projesini DeepSeek API ile entegre etmek için aşağıdaki adımları izleyin:

1. [DeepSeek](https://deepseek.ai/) platformuna kayıt olun ve bir API anahtarı alın.
2. `.env` dosyasını açın ve `REACT_APP_DEEPSEEK_API_KEY` değişkenine aldığınız API anahtarını ekleyin:

   ```
   REACT_APP_DEEPSEEK_API_KEY=size_verilen_api_anahtari
   ```

3. Uygulamayı başlatın:

   ```bash
   npm install   # Bağımlılıkları yükleyin
   npm start     # Uygulamayı başlatın
   ```

4. Tarayıcınızda `http://localhost:3000` adresine giderek uygulamayı açın.
5. Quiz'i tamamlayın ve DeepSeek'in cevaplarınıza göre oluşturduğu kişiselleştirilmiş aura hikâyenizi görün!

#### DeepSeek API Nasıl Çalışır?

Quiz cevaplarınızı tamamladığınızda sistem şu adımları izler:

1. Cevaplarınız analiz edilerek bir aura tipi belirlenir (Yaratıcı, Analitik, Empatik veya Enerjik).
2. Cevaplarınız ve aura tipiniz DeepSeek API'sine gönderilir.
3. DeepSeek AI, bu bilgileri kullanarak size özel bir aura hikâyesi oluşturur.
4. Oluşturulan hikâye ekranınızda görüntülenir.

Bu entegrasyon, kullanıcılar için benzersiz ve kişiselleştirilmiş bir aura hikâyesi sunar.

---

## 📂 Auralize Sistemi Dosya Ağacı

```
auralize/
│
├── frontend/
│   ├── public/
│   │   └── auralize_logo.jpg
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   └── [...görsel ve medya dosyaları...]
│   │   │
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── LoadingAnimation.tsx
│   │   │   │   ├── AuraParticles.tsx
│   │   │   │   ├── InsightLoadingSkeleton.tsx
│   │   │   │   └── [...diğer ortak bileşenler...]
│   │   │   │
│   │   │   ├── quiz/
│   │   │   │   └── [...quiz bileşenleri...]
│   │   │   │
│   │   │   └── gallery/
│   │   │       └── [...galeri bileşenleri...]
│   │   │
│   │   ├── data/
│   │   │   ├── quizQuestions.ts
│   │   │   └── auraTypes.ts
│   │   │
│   │   ├── hooks/
│   │   │   └── [...özel React hookları...]
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Quiz.tsx
│   │   │   ├── AuraGame.tsx
│   │   │   ├── Gallery.tsx
│   │   │   │
│   │   │   └── results/
│   │   │       ├── CreativeResult.tsx
│   │   │       ├── PersonalResult.tsx
│   │   │       ├── CareerResult.tsx
│   │   │       └── MoodResult.tsx
│   │   │
│   │   ├── services/
│   │   │   ├── openaiService.ts
│   │   │   ├── deepseekService.ts
│   │   │   ├── auraDataService.ts
│   │   │   │
│   │   │   └── local/
│   │   │       ├── auraDataService.ts
│   │   │       └── fileSystemService.ts
│   │   │
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── [...diğer stil dosyaları...]
│   │   │
│   │   ├── types/
│   │   │   └── [...TypeScript tip tanımlamaları...]
│   │   │
│   │   ├── utils/
│   │   │   ├── userIdentifier.ts
│   │   │   └── [...yardımcı fonksiyonlar...]
│   │   │
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── index.css
│   │   ├── routes.tsx
│   │   └── reportWebVitals.ts
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auraController.ts
│   │   │   └── galleryController.ts
│   │   │
│   │   ├── data/
│   │   │   └── prompts.json
│   │   │
│   │   ├── services/
│   │   │   ├── aiService.ts
│   │   │   ├── auraDataService.ts
│   │   │   ├── deepseekService.ts
│   │   │   ├── openaiService.ts
│   │   │   └── fileSystemService.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── auraRoutes.ts
│   │   │   └── galleryRoutes.ts
│   │   │
│   │   ├── types/
│   │   │   └── auraTypes.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── answerAnalyzer.ts
│   │   │   ├── cacheManager.ts
│   │   │   └── logger.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── .env
│   └── package.json
│
├── docs/
│   ├── README_EN.md
│   ├── README_ZH.md
│   ├── README_FR.md
│   ├── README_RU.md
│   ├── README_ES.md
│   ├── README_IT.md
│   ├── README_JP.md
│   ├── README_KR.md
│   ├── README_AR.md
│   └── README_PT.md
│
├── requirements.txt
└── README.md
```

---

Auralize, modern yazılım mimarisi prensipleri ve temiz kod yaklaşımıyla geliştirilmiş, kullanıcı deneyimini ön planda tutan, yapay zekâ destekli bir kişilik keşif platformudur. Modüler yapısı ve esnek servis entegrasyonu sayesinde kolayca genişletilebilir ve sürdürülebilir bir sistem sunar.

---

3. **Yapı ve Organizasyon**:
   - OpenAI ve DeepSeek API entegrasyonları, ayrı alt başlıklar altında "Yapay Zekâ API Entegrasyonları" bölümüne eklendi.
   - Metnin genel yapısı korunarak kullanıcı dostu bir düzen sağlandı.
