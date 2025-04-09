import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
// DeepSeek ve LLaMA servislerini import ediyoruz
import { getAuraStoryFromDeepSeek, getAuraInsightsFromLlama, determineDynamicAuraType } from '../services/deepseekService';
import { saveAuraStory } from '../services/auraDataService';

// Yaratıcı Potansiyel quiz soruları
const creativeQuizQuestions = [
  // Adım 1: İlham Haritası (Yaratıcı Eğilimleri Anlama)
  {
    id: 1,
    question: "Aşağıdaki resimlerden hangisi seni şu an en çok çekiyor?",
    options: [
      { id: 'a', value: 'Sakin bir okyanus manzarası', image: 'src/pages/images/ocean.jpg' },
      { id: 'b', value: 'Renkli, kaotik bir soyut resim', image: 'abstract.jpg' },
      { id: 'c', value: 'Karanlık bir orman silueti', image: 'forest.jpg' },
      { id: 'd', value: 'Minimalist bir geometrik desen', image: 'geometric.jpg' }
    ]
  },
  {
    id: 2,
    question: "Sana şu an en yakın gelen kelimeyi seç:",
    options: [
      { id: 'a', value: 'Huzur' },
      { id: 'b', value: 'Tutku' },
      { id: 'c', value: 'Gizem' },
      { id: 'd', value: 'Enerji' }
    ]
  },
  {
    id: 3,
    question: "Bir hikayenin ilk cümlesini seçseydin hangisi olurdu?",
    options: [
      { id: 'a', value: 'Güneş ufukta yavaşça batarken, her şey sessizliğe büründü.' },
      { id: 'b', value: 'Şehrin ışıkları yanıp sönerken, kalabalık bir ritimle dans ediyordu.' },
      { id: 'c', value: 'Tozlu bir yolun sonunda, eski bir kapı gizlice açıldı.' },
      { id: 'd', value: 'Gökyüzü aniden patladı, renkler her yere saçıldı.' }
    ]
  },
  {
    id: 4,
    question: "Kendini bir doğa unsuruyla tanımlasan hangisi olurdun?",
    options: [
      { id: 'a', value: 'Durgun bir göl' },
      { id: 'b', value: 'Fırtınalı bir rüzgar' },
      { id: 'c', value: 'Yanan bir ateş' },
      { id: 'd', value: 'Derin bir mağara' }
    ]
  },
  // Adım 2: Aura Paleti (Duygusal ve Estetik Derinlik)
  {
    id: 5,
    question: "Sana şu an en çok hitap eden rengi seç:",
    options: [
      { id: 'a', value: 'Derin mavi', color: '#1E3A8A' },
      { id: 'b', value: 'Canlı kırmızı', color: '#DC2626' },
      { id: 'c', value: 'Yumuşak yeşil', color: '#10B981' },
      { id: 'd', value: 'Mat siyah', color: '#1F2937' }
    ]
  },
  {
    id: 6,
    question: "Bugünkü ruh halini en iyi hangi emoji ifade eder?",
    options: [
      { id: 'a', value: '😊 Mutlu', emoji: '😊' },
      { id: 'b', value: '🌩️ Fırtınalı', emoji: '🌩️' },
      { id: 'c', value: '✨ Heyecanlı', emoji: '✨' },
      { id: 'd', value: '🤔 Düşünceli', emoji: '🤔' }
    ]
  },
  {
    id: 7,
    question: "Şu an bir melodi duysan, hangi tarzda olmasını isterdin?",
    options: [
      { id: 'a', value: 'Sakin piyano notaları' },
      { id: 'b', value: 'Hızlı elektronik ritimler' },
      { id: 'c', value: 'Derin ve gizemli koro sesleri' },
      { id: 'd', value: 'Neşeli akustik gitar' }
    ]
  },
  {
    id: 8,
    question: "Bir yüzeye dokunsan, nasıl hissetmesini isterdin?",
    options: [
      { id: 'a', value: 'Pürüzsüz ve serin (mermer gibi)' },
      { id: 'b', value: 'Yumuşak ve sıcak (kadife gibi)' },
      { id: 'c', value: 'Kaba ve doğal (taş gibi)' },
      { id: 'd', value: 'Parlak ve kaygan (cam gibi)' }
    ]
  },
  // Adım 3: Serbest Yaratım (Kişisel İfade)
  {
    id: 9,
    question: "Sana en çok ilham veren duygu hangisi?",
    options: [
      { id: 'a', value: 'Sevgi ve mutluluk' },
      { id: 'b', value: 'Merak ve keşif' },
      { id: 'c', value: 'Hüzün ve düşünce' },
      { id: 'd', value: 'Coşku ve heyecan' }
    ]
  },
  {
    id: 10,
    question: "Basit bir çizim yapabilsen, ne çizerdin?",
    options: [
      { id: 'a', value: 'Bir daire', shape: 'circle' },
      { id: 'b', value: 'Dalgalı bir çizgi', shape: 'wave', image: 'wave-line.jpg' },
      { id: 'c', value: 'Keskin bir üçgen', shape: 'triangle' },
      { id: 'd', value: 'Rastgele bir karalama', shape: 'random', image: 'random-sketch.jpg' }
    ]
  },
  {
    id: 11,
    question: "Gözlerini kapattığında kendini hangi mekanda hayal ediyorsun?",
    options: [
      { id: 'a', value: 'Uçsuz bucaksız bir sahil' },
      { id: 'b', value: 'Sıcak ve samimi bir ev' },
      { id: 'c', value: 'Gizemli bir orman' },
      { id: 'd', value: 'Kozmik bir uzay boşluğu' }
    ]
  },
  {
    id: 12,
    question: "Bir ses duysan, ne olmasını isterdin?",
    options: [
      { id: 'a', value: 'Dalga sesleri' },
      { id: 'b', value: 'Kuş cıvıltıları' },
      { id: 'c', value: 'Uzak bir fırtına' },
      { id: 'd', value: 'Hafif bir çan sesi' }
    ]
  },
  // Adım 4: Derinlemesine Keşif (Kişilik ve Yaratıcı Potansiyel)
  {
    id: 13,
    question: "Kendini hangi zaman diliminde hayal ediyorsun?",
    options: [
      { id: 'a', value: 'Geçmişte (eski bir çağda)' },
      { id: 'b', value: 'Şu anda' },
      { id: 'c', value: 'Gelecekte (fütüristik bir dünyada)' },
      { id: 'd', value: 'Zamansız bir boyutta' }
    ]
  },
  {
    id: 14,
    question: "Bir hikayede olsan, kim olurdun?",
    options: [
      { id: 'a', value: 'Bilge bir rehber' },
      { id: 'b', value: 'Cesur bir kaşif' },
      { id: 'c', value: 'Gizemli bir yabancı' },
      { id: 'd', value: 'Neşeli bir sanatçı' }
    ]
  },
  {
    id: 15,
    question: "Bir sanat eseri sende hangi duyguyu uyandırsın isterdin?",
    options: [
      { id: 'a', value: 'Huzur' },
      { id: 'b', value: 'Heyecan' },
      { id: 'c', value: 'Merak' },
      { id: 'd', value: 'Nostalji' }
    ]
  },
  {
    id: 16,
    question: "Yaratıcı sürecin nasıl ilerlesin isterdin?",
    options: [
      { id: 'a', value: 'Yavaş ve düşünceli' },
      { id: 'b', value: 'Hızlı ve spontane' },
      { id: 'c', value: 'Dengeli ve ritmik' },
      { id: 'd', value: 'Düzensiz ve kaotik' }
    ]
  },
  // Adım 5: Evrilen Aura (Uzun Vadeli Gelişim)
  {
    id: 17,
    question: "Auranın zamanla nasıl evrilmesini isterdin?",
    options: [
      { id: 'a', value: 'Daha sakin ve derin' },
      { id: 'b', value: 'Daha canlı ve cesur' },
      { id: 'c', value: 'Daha gizemli ve karmaşık' },
      { id: 'd', value: 'Daha sade ve net' }
    ]
  },
  {
    id: 18,
    question: "Sana en çok ne ilham verir?",
    options: [
      { id: 'a', value: 'Doğa' },
      { id: 'b', value: 'Teknoloji' },
      { id: 'c', value: 'İnsan ilişkileri' },
      { id: 'd', value: 'Hayaller ve rüyalar' }
    ]
  },
  {
    id: 19,
    question: "Yaratıcı eserini başkalarıyla paylaşır mıydın?",
    options: [
      { id: 'a', value: 'Evet, herkesle' },
      { id: 'b', value: 'Sadece yakın arkadaşlarımla' },
      { id: 'c', value: 'Hayır, kendime saklarım' },
      { id: 'd', value: 'Belki, duruma göre' }
    ]
  },
  {
    id: 20,
    question: "Auran için son bir kelime veya sembol seçmen gerekse, hangisi olurdu?",
    options: [
      { id: 'a', value: 'Sonsuzluk ∞' },
      { id: 'b', value: 'Işık ✨' },
      { id: 'c', value: 'Denge ☯' },
      { id: 'd', value: 'Özgürlük 🕊️' }
    ]
  }
];

// Ruh Hali Analizi quiz soruları
export const moodQuizQuestions = [
  {
    id: 1,
    question: "Bugün kendini nasıl hissediyorsun?",
    options: [
      { id: 'a', value: 'Enerjik ve canlı', emoji: '⚡' },
      { id: 'b', value: 'Sakin ve huzurlu', emoji: '😌' },
      { id: 'c', value: 'Yorgun ve tükenmiş', emoji: '😩' },
      { id: 'd', value: 'Kaygılı ve gergin', emoji: '😟' }
    ]
  },
  {
    id: 2,
    question: "Şu an için önceliklerin neler?",
    options: [
      { id: 'a', value: 'Sosyalleşmek ve eğlenmek' },
      { id: 'b', value: 'Dinlenmek ve rahatlamak' },
      { id: 'c', value: 'Üretken olmak ve çalışmak' },
      { id: 'd', value: 'Düşünmek ve plan yapmak' }
    ]
  },
  {
    id: 3,
    question: "Bugünkü ruh halini en iyi hangi renk yansıtır?",
    options: [
      { id: 'a', value: 'Parlak Sarı', color: '#FCD34D' },
      { id: 'b', value: 'Sakin Mavi', color: '#60A5FA' },
      { id: 'c', value: 'Pastel Yeşil', color: '#A7F3D0' },
      { id: 'd', value: 'Koyu Mor', color: '#7C3AED' }
    ]
  },
  {
    id: 4,
    question: "Şu anki ruh halini bir hava durumu olarak tanımlasan ne olurdu?",
    options: [
      { id: 'a', value: 'Güneşli ve açık' },
      { id: 'b', value: 'Bulutlu ama sakin' },
      { id: 'c', value: 'Yağmurlu ve kapalı' },
      { id: 'd', value: 'Fırtınalı ve değişken' }
    ]
  },
  {
    id: 5,
    question: "Şu an canın ne yapmak istiyor?",
    options: [
      { id: 'a', value: 'Arkadaşlarla vakit geçirmek' },
      { id: 'b', value: 'Kitap okumak veya film izlemek' },
      { id: 'c', value: 'Doğada yürüyüş yapmak' },
      { id: 'd', value: 'Yaratıcı bir şeyler yapmak' }
    ]
  },
  {
    id: 6,
    question: "Son birkaç günü düşündüğünde, duygusal durumun nasıl değişti?",
    options: [
      { id: 'a', value: 'Daha iyiye gidiyor', emoji: '📈' },
      { id: 'b', value: 'Nispeten sabit kaldı', emoji: '➡️' },
      { id: 'c', value: 'İnişli çıkışlı oldu', emoji: '🔄' },
      { id: 'd', value: 'Daha kötüye gidiyor', emoji: '📉' }
    ]
  },
  {
    id: 7,
    question: "Şu anda hangi müzik türünü dinlemek sana iyi gelir?",
    options: [
      { id: 'a', value: 'Hareketli ve enerjik müzik' },
      { id: 'b', value: 'Akustik ve sakin melodiler' },
      { id: 'c', value: 'Duygusal ve melankolik şarkılar' },
      { id: 'd', value: 'Elektronik ve ritmik parçalar' }
    ]
  },
  {
    id: 8,
    question: "Kendini en çok nerede rahat hissediyorsun?",
    options: [
      { id: 'a', value: 'Doğada, açık havada' },
      { id: 'b', value: 'Evde, kendi alanımda' },
      { id: 'c', value: 'Sevdiklerimle herhangi bir yerde' },
      { id: 'd', value: 'Kalabalık ve enerjik ortamlarda' }
    ]
  },
  {
    id: 9,
    question: "Şu anda hangi duygu sende baskın?",
    options: [
      { id: 'a', value: 'Merak ve heyecan', emoji: '🤩' },
      { id: 'b', value: 'Huzur ve memnuniyet', emoji: '😊' },
      { id: 'c', value: 'Endişe ve gerginlik', emoji: '😰' },
      { id: 'd', value: 'Melankoli ve düşüncelilik', emoji: '🤔' }
    ]
  },
  {
    id: 10,
    question: "Uyku düzenin son zamanlarda nasıl?",
    options: [
      { id: 'a', value: 'Düzenli ve dinlendirici' },
      { id: 'b', value: 'Bazen iyi, bazen kötü' },
      { id: 'c', value: 'Yetersiz ve düzensiz' },
      { id: 'd', value: 'Aşırı uyuma veya uykusuzluk' }
    ]
  },
  {
    id: 11,
    question: "Bir film seçecek olsan, hangisini tercih ederdin?",
    options: [
      { id: 'a', value: 'Komedi veya aksiyon' },
      { id: 'b', value: 'Dram veya biyografi' },
      { id: 'c', value: 'Bilim kurgu veya fantastik' },
      { id: 'd', value: 'Belgesel veya eğitici içerik' }
    ]
  },
  {
    id: 12,
    question: "Son zamanlarda seni en çok ne motive ediyor?",
    options: [
      { id: 'a', value: 'Kişisel hedeflerim' },
      { id: 'b', value: 'Sevdiklerim ve ilişkilerim' },
      { id: 'c', value: 'Yeni şeyler öğrenmek' },
      { id: 'd', value: 'Hiçbir şey motive edemiyor' }
    ]
  },
  {
    id: 13,
    question: "İnsanlarla iletişimin bu aralar nasıl?",
    options: [
      { id: 'a', value: 'Aktif ve sıcak' },
      { id: 'b', value: 'Seçici ve sınırlı' },
      { id: 'c', value: 'Mesafeli ve çekingen' },
      { id: 'd', value: 'Değişken ve duruma bağlı' }
    ]
  },
  {
    id: 14,
    question: "Bugünü tek bir kelimeyle tanımlaman gerekse ne derdin?",
    options: [
      { id: 'a', value: 'Umut dolu' },
      { id: 'b', value: 'Sakin' },
      { id: 'c', value: 'Zorlayıcı' },
      { id: 'd', value: 'Sıradan' }
    ]
  },
  {
    id: 15,
    question: "Şu anda hayatında en çok neye ihtiyaç duyuyorsun?",
    options: [
      { id: 'a', value: 'Dinlenme ve rahatlama' },
      { id: 'b', value: 'Eğlence ve heyecan' },
      { id: 'c', value: 'Anlam ve amaç' },
      { id: 'd', value: 'Sevgi ve bağlantı' }
    ]
  }
];

// Kişisel Gelişim quiz soruları
export const personalQuizQuestions = [
  {
    id: 1,
    question: "Hayatında geliştirmek istediğin en önemli alan hangisi?",
    options: [
      { id: 'a', value: 'Sosyal ilişkiler' },
      { id: 'b', value: 'Kariyer ve iş hayatı' },
      { id: 'c', value: 'Kişisel hobiler ve beceriler' },
      { id: 'd', value: 'Sağlık ve fiziksel kondisyon' }
    ]
  },
  {
    id: 2,
    question: "Zorluklarla karşılaştığında genellikle nasıl tepki verirsin?",
    options: [
      { id: 'a', value: 'Çözüm odaklı düşünürüm' },
      { id: 'b', value: 'Başkalarından yardım isterim' },
      { id: 'c', value: 'Durup düşünür, sonra harekete geçerim' },
      { id: 'd', value: 'Duygusal tepki veririm, sonra toparlanırım' }
    ]
  },
  {
    id: 3,
    question: "Kendinde geliştirmek istediğin en önemli özellik nedir?",
    options: [
      { id: 'a', value: 'Sabır ve tahammül' },
      { id: 'b', value: 'Özgüven ve kendini ifade etme' },
      { id: 'c', value: 'Disiplin ve düzen' },
      { id: 'd', value: 'Yaratıcılık ve esneklik' }
    ]
  },
  {
    id: 4,
    question: "Yeni bir şey öğrenirken en çok hangi yöntemi tercih edersin?",
    options: [
      { id: 'a', value: 'Okuyarak ve araştırarak' },
      { id: 'b', value: 'İzleyerek ve gözlemleyerek' },
      { id: 'c', value: 'Uygulayarak ve deneyimleyerek' },
      { id: 'd', value: 'Başkalarıyla tartışarak' }
    ]
  },
  {
    id: 5,
    question: "Hayatında değiştirmek istediğin bir alışkanlık seçmen gerekse, hangisi olurdu?",
    options: [
      { id: 'a', value: 'Erteleme davranışı' },
      { id: 'b', value: 'Düzensiz uyku düzeni' },
      { id: 'c', value: 'Fazla sosyal medya kullanımı' },
      { id: 'd', value: 'Sağlıksız beslenme' }
    ]
  },
  {
    id: 6,
    question: "Başarılı olduğunda bu başarıyı genellikle neye bağlarsın?",
    options: [
      { id: 'a', value: 'Çaba ve disipline' },
      { id: 'b', value: 'Doğal yetenek ve zekaya' },
      { id: 'c', value: 'Şans ve doğru zamanlama' },
      { id: 'd', value: 'Destek ve iyi yönlendirme' }
    ]
  },
  {
    id: 7,
    question: "Kendini en çok hangi konuda geliştirmek istiyorsun?",
    options: [
      { id: 'a', value: 'Duygusal zeka ve empati' },
      { id: 'b', value: 'Pratik beceriler ve teknik bilgi' },
      { id: 'c', value: 'Liderlik ve ikna kabiliyeti' },
      { id: 'd', value: 'Yaratıcılık ve sanatsal ifade' }
    ]
  },
  {
    id: 8,
    question: "Kişisel gelişim için ne kadar zaman ayırıyorsun?",
    options: [
      { id: 'a', value: 'Her gün düzenli olarak' },
      { id: 'b', value: 'Haftalık belirli saatler' },
      { id: 'c', value: 'Fırsat buldukça' },
      { id: 'd', value: 'Şu an yeterince vakit ayıramıyorum' }
    ]
  },
  {
    id: 9,
    question: "Senin için ideal bir mentor nasıl biri olurdu?",
    options: [
      { id: 'a', value: 'Bilge ve tecrübeli' },
      { id: 'b', value: 'İlham verici ve motive edici' },
      { id: 'c', value: 'Sistematik ve analitik' },
      { id: 'd', value: 'Destekleyici ve anlayışlı' }
    ]
  },
  {
    id: 10,
    question: "Hayatında en çok neyi başarmak istiyorsun?",
    options: [
      { id: 'a', value: 'Finansal bağımsızlık' },
      { id: 'b', value: 'Anlamlı ilişkiler' },
      { id: 'c', value: 'Profesyonel başarı' },
      { id: 'd', value: 'İç huzur ve tatmin' }
    ]
  },
  {
    id: 11,
    question: "Geri bildirim almaya karşı tutumun nasıl?",
    options: [
      { id: 'a', value: 'Aktif olarak ararım ve değerlendiririm' },
      { id: 'b', value: 'Açığım ama savunmaya geçebilirim' },
      { id: 'c', value: 'Sadece güvendiğim kişilerden alırım' },
      { id: 'd', value: 'Eleştiriye karşı hassasım' }
    ]
  },
  {
    id: 12,
    question: "Stresle başa çıkmak için genellikle ne yaparsın?",
    options: [
      { id: 'a', value: 'Egzersiz veya yoga' },
      { id: 'b', value: 'Meditasyon veya nefes teknikleri' },
      { id: 'c', value: 'Hobiler veya yaratıcı aktiviteler' },
      { id: 'd', value: 'Sevdiklerimle zaman geçirmek' }
    ]
  },
  {
    id: 13,
    question: "Hayatını planlarken genellikle hangi zaman dilimini düşünürsün?",
    options: [
      { id: 'a', value: 'Kısa vadeli günlük hedefler' },
      { id: 'b', value: 'Orta vadeli 1-5 yıllık planlar' },
      { id: 'c', value: 'Uzun vadeli hayat planları' },
      { id: 'd', value: 'Anı yaşarım, çok plan yapmam' }
    ]
  },
  {
    id: 14,
    question: "Yeni fikirlere karşı tutumun nasıl?",
    options: [
      { id: 'a', value: 'Hemen entegre etmeye çalışırım' },
      { id: 'b', value: 'Önce araştırır sonra değerlendiririm' },
      { id: 'c', value: 'Şüpheyle yaklaşırım' },
      { id: 'd', value: 'Kanıtlanmış fikirleri tercih ederim' }
    ]
  },
  {
    id: 15,
    question: "Hayatında denge kurmakta en çok zorlandığın alan hangisi?",
    options: [
      { id: 'a', value: 'İş-özel hayat dengesi' },
      { id: 'b', value: 'Kişisel bakım ve sağlık' },
      { id: 'c', value: 'İlişkiler ve bağlantılar' },
      { id: 'd', value: 'Maddi konular ve harcamalar' }
    ]
  }
];

// Kariyer Yönlendirmesi quiz soruları
export const careerQuizQuestions = [
  {
    id: 1,
    question: "Çalışırken seni en çok ne motive eder?",
    options: [
      { id: 'a', value: 'Yaratıcı özgürlük' },
      { id: 'b', value: 'Finansal güvence' },
      { id: 'c', value: 'Topluma katkı sağlamak' },
      { id: 'd', value: 'Tanınma ve başarı hissi' }
    ]
  },
  {
    id: 2,
    question: "Hangi çalışma ortamında kendini daha iyi hissedersin?",
    options: [
      { id: 'a', value: 'Canlı ve sosyal bir ofis' },
      { id: 'b', value: 'Sakin ve düzenli bir çalışma alanı' },
      { id: 'c', value: 'Esnek ve uzaktan çalışma' },
      { id: 'd', value: 'Dinamik ve değişken bir ortam' }
    ]
  },
  {
    id: 3,
    question: "Takım çalışması mı, bireysel çalışma mı tercih edersin?",
    options: [
      { id: 'a', value: 'Kesinlikle takım çalışması' },
      { id: 'b', value: 'Çoğunlukla takım, bazen bireysel' },
      { id: 'c', value: 'Çoğunlukla bireysel, bazen takım' },
      { id: 'd', value: 'Kesinlikle bireysel çalışma' }
    ]
  },
  {
    id: 4,
    question: "Bir işte seni en çok ne tatmin eder?",
    options: [
      { id: 'a', value: 'Yaratıcı işler ortaya koymak' },
      { id: 'b', value: 'İnsanlara yardım etmek' },
      { id: 'c', value: 'Problemleri çözmek' },
      { id: 'd', value: 'Liderlik etmek ve yönetmek' }
    ]
  },
  {
    id: 5,
    question: "Meslek seçiminde senin için en önemli faktör nedir?",
    options: [
      { id: 'a', value: 'Yüksek gelir' },
      { id: 'b', value: 'İş-yaşam dengesi' },
      { id: 'c', value: 'Tutku ve ilgi alanlarınla uyum' },
      { id: 'd', value: 'Kariyer gelişimi ve ilerleme imkanı' }
    ]
  },
  {
    id: 6,
    question: "Eleştiriye nasıl yaklaşırsın?",
    options: [
      { id: 'a', value: 'Yapıcı bulur ve değerlendiririm' },
      { id: 'b', value: 'Savunmacı olabilirim' },
      { id: 'c', value: 'Analiz eder ve gerekliyse uygularım' },
      { id: 'd', value: 'Kaynağına göre değerlendiririm' }
    ]
  },
  {
    id: 7,
    question: "Kariyer hedeflerini nasıl belirlersin?",
    options: [
      { id: 'a', value: 'Uzun vadeli planlar yaparım' },
      { id: 'b', value: 'Fırsatlara göre değerlendiririm' },
      { id: 'c', value: 'Tutkularımı takip ederim' },
      { id: 'd', value: 'Deneyimlerime göre şekillendiririm' }
    ]
  },
  {
    id: 8,
    question: "İş hayatında önceliğin nedir?",
    options: [
      { id: 'a', value: 'Uzmanlık kazanmak' },
      { id: 'b', value: 'İyi bir network oluşturmak' },
      { id: 'c', value: 'Farklı beceriler geliştirmek' },
      { id: 'd', value: 'Yenilikçi projelerde yer almak' }
    ]
  },
  {
    id: 9,
    question: "Çalışma tempon nasıldır?",
    options: [
      { id: 'a', value: 'Sistematik ve düzenli' },
      { id: 'b', value: 'Son dakikada yoğunlaşırım' },
      { id: 'c', value: 'Esnek ve duruma göre değişken' },
      { id: 'd', value: 'Yoğun çalışma ve mola döngüleri' }
    ]
  },
  {
    id: 10,
    question: "Risk alma konusunda tutumun nedir?",
    options: [
      { id: 'a', value: 'Hesaplanmış riskler alırım' },
      { id: 'b', value: 'Genellikle güvenli yolu tercih ederim' },
      { id: 'c', value: 'Heyecan verici fırsatları kovalırım' },
      { id: 'd', value: 'Risk almadan önce çok düşünürüm' }
    ]
  },
  {
    id: 11,
    question: "Kariyer başarısını nasıl ölçersin?",
    options: [
      { id: 'a', value: 'Maddi kazanç' },
      { id: 'b', value: 'İç huzur ve tatmin' },
      { id: 'c', value: 'Tanınma ve prestij' },
      { id: 'd', value: 'Etki ve kalıcı iz bırakma' }
    ]
  },
  {
    id: 12,
    question: "Hangi tür işlerde en iyi performansı gösterirsin?",
    options: [
      { id: 'a', value: 'Yaratıcılık gerektiren işler' },
      { id: 'b', value: 'Analitik düşünme gerektiren işler' },
      { id: 'c', value: 'İnsanlarla iletişim gerektiren işler' },
      { id: 'd', value: 'Pratik ve somut işler' }
    ]
  },
  {
    id: 13,
    question: "İş yerinde değişime yaklaşımın nasıldır?",
    options: [
      { id: 'a', value: 'Değişimi kolayca benimserim' },
      { id: 'b', value: 'Değişime direnirim' },
      { id: 'c', value: 'Belli bir adaptasyon süreci gerekir' },
      { id: 'd', value: 'Değişimi kendim başlatmayı severim' }
    ]
  },
  {
    id: 14,
    question: "Kendini geliştirmek için neler yapıyorsun?",
    options: [
      { id: 'a', value: 'Düzenli eğitim ve kurslar' },
      { id: 'b', value: 'Mentorluk ve koçluk' },
      { id: 'c', value: 'Kendi kendine öğrenme' },
      { id: 'd', value: 'İş deneyimi yoluyla öğrenme' }
    ]
  },
  {
    id: 15,
    question: "İdeal kariyerin nasıl görünüyor?",
    options: [
      { id: 'a', value: 'Sürekli yenilik ve değişim' },
      { id: 'b', value: 'İstikrar ve güvenlik' },
      { id: 'c', value: 'Özgürlük ve esneklik' },
      { id: 'd', value: 'Etki ve anlam' }
    ]
  }
];

// Parçacık arka plan efekti bileşeni
const ParticleBackground = () => {
  return (
    <div className="particle-container">
      {[...Array(15)].map((_, index) => (
        <div 
          key={index}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 20 + 5}px`,
            height: `${Math.random() * 20 + 5}px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 10 + 10}s`
          }}
        />
      ))}
    </div>
  );
};

const Quiz: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResultButton, setShowResultButton] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL'den quiz tipini al
  const searchParams = new URLSearchParams(location.search);
  const quizType = searchParams.get('type') || 'creative'; // Varsayılan olarak yaratıcı quiz

  // Quiz tipine göre soruları belirle
  const getQuizQuestions = () => {
    switch(quizType) {
      case 'mood':
        return moodQuizQuestions;
      case 'personal':
        return personalQuizQuestions;
      case 'career':
        return careerQuizQuestions;
      case 'creative':
      default:
        return creativeQuizQuestions;
    }
  };

  const quizQuestions = getQuizQuestions();
  
  // Quiz tipine göre başlık belirle
  const getQuizTitle = () => {
    switch(quizType) {
      case 'mood':
        return "Ruh Hali Analizi";
      case 'personal':
        return "Kişisel Gelişim";
      case 'career':
        return "Kariyer Yönlendirmesi";
      case 'creative':
      default:
        return "Yaratıcı Potansiyel";
    }
  };

  // Scroll olayını dinleyen etki
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnswerSelect = (questionId: number, optionId: string) => {
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);
    
    if (currentQuestion < quizQuestions.length - 1) {
      setAnimateOut(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setAnimateOut(false);
      }, 500);
    } else {
      setShowResultButton(true);
    }
  };

  const goToResults = async () => {
    setIsProcessing(true);
    
    try {
      // Önce kullanıcı kimliğini alalım
      const userId = localStorage.getItem('auralize_user_id') || 'user_' + Math.random().toString(36).substr(2, 9);
      if (!localStorage.getItem('auralize_user_id')) {
        localStorage.setItem('auralize_user_id', userId);
      }

      // Kullanıcı adını alalım
      const username = localStorage.getItem('auralize_username') || 'Kullanıcı';

      // Quiz tipine göre aura tipini belirle
      const determinedType = quizType === 'creative' ? determineDynamicAuraType(answers) : quizType;

      console.log("Quiz verileri hazırlanıyor:", { userId, username, answers, determinedType });

      // Varsayılan hikaye ve içgörüler oluştur - böylece API yanıt vermese bile kullanıcı sonuç görebilir
      try {
        // Önce varsayılan verileri kaydet, sonra API yanıtları gelirse güncellenecek
        const defaultText = `${username}'ın ${determinedType} aurası analiz ediliyor...`;
        const defaultTitle = `${determinedType.charAt(0).toUpperCase() + determinedType.slice(1)} Aurası`;
        
        // API'ye istekler başlamadan önce temel bilgileri kaydet
        const auraData = {
          auraType: determinedType,
          story: defaultText,
          strengths: "Analiz ediliyor...",
          potential: "Analiz ediliyor...",
          thinkingStyle: "Analiz ediliyor...",
          auraTitle: defaultTitle,
          answers: answers
        };
        
        // Aura verilerini kaydet - aynı zamanda önbelleğe de koy
        await saveAuraStory(userId, auraData);
        console.log("Varsayılan aura verileri kaydedildi");
        
        // Önbelleğe aynı bilgileri ekle - böylece sonuç sayfası hemen gösterebilir
        const cacheKey = `auralize_user_${userId}_latest`;
        localStorage.setItem(cacheKey, JSON.stringify({
          id: Date.now().toString(),
          auraType: determinedType,
          story: defaultText,
          strengths: "Analiz ediliyor...",
          potential: "Analiz ediliyor...",
          thinkingStyle: "Analiz ediliyor...",
          auraTitle: defaultTitle,
          answers: answers,
          userId: userId,
          username: username
        }));
        
      } catch (saveError) {
        console.error("Aura verileri kaydedilemedi:", saveError);
      }

      // Hemen sonuç sayfasına yönlendir - arka planda API istekleri devam edecek
      setIsProcessing(false);
        
      // Quiz tipine göre uygun sonuç sayfasına yönlendir
      switch(quizType) {
        case 'mood':
          navigate('/mood-result', { state: { answers, quizType } });
          break;
        case 'personal':
          navigate('/personal-result', { state: { answers, quizType } });
          break;
        case 'career':
          navigate('/career-result', { state: { answers, quizType } });
          break;
        case 'creative':
        default:
          navigate('/aura-result', { state: { answers, quizType } });
          break;
      }
      
      // Yönlendirme sonrasında bile arka planda işlemleri sürdür
      setTimeout(async () => {
        try {
          console.log("Arka planda LLaMA istekleri başlatılıyor...");
          
          // 1. İçgörüleri al
          try {
            console.log("İçgörüler isteniyor...");
            const insights = await getAuraInsightsFromLlama(determinedType, username, answers);
            console.log("İçgörüler alındı:", insights);
            
            // 2. Hikayeyi al
            console.log("Hikaye isteniyor...");
            const story = await getAuraStoryFromDeepSeek(determinedType, username, answers);
            console.log("Hikaye alındı (ilk 50 karakter):", story.substring(0, 50));
            
            // 3. Verileri güncelle
            const updatedData = {
              auraType: determinedType,
              story: story.replace('__cached__', '').replace('__llama__', '').replace('__default__', ''),
              strengths: insights.strengths,
              potential: insights.potential,
              thinkingStyle: insights.thinkingStyle,
              auraTitle: insights.auraTitle,
              answers: answers
            };
            
            // 4. Güncellenmiş verileri kaydet
            await saveAuraStory(userId, updatedData);
            console.log("Aura verileri tam içerikle güncellendi");
            
            // 5. Sonuç sayfasının verileri anında görebilmesi için önbelleği de güncelle
            const cacheKey = `auralize_user_${userId}_latest`;
            localStorage.setItem(cacheKey, JSON.stringify({
              id: Date.now().toString(),
              auraType: determinedType,
              story: updatedData.story,
              strengths: updatedData.strengths,
              potential: updatedData.potential,
              thinkingStyle: updatedData.thinkingStyle,
              auraTitle: updatedData.auraTitle,
              answers: answers,
              userId: userId,
              username: username
            }));
            
          } catch (error) {
            console.error("Arka planda API istekleri sırasında hata:", error);
          }
        } catch (bgError) {
          console.error("Arka plan işlemi sırasında hata:", bgError);
        }
      }, 500); // Yönlendirmeden hemen sonra çalışacak
      
    } catch (error) {
      console.error("Sonuç hazırlama işlemi sırasında hata:", error);
      setIsProcessing(false);
      
      // Hata olsa bile sonuç sayfasına yönlendir
      switch(quizType) {
        case 'mood':
          navigate('/mood-result', { state: { answers, quizType } });
          break;
        case 'personal':
          navigate('/personal-result', { state: { answers, quizType } });
          break;
        case 'career':
          navigate('/career-result', { state: { answers, quizType } });
          break;
        case 'creative':
        default:
          navigate('/aura-result', { state: { answers, quizType } });
          break;
      }
    }
  };

  const renderShapeOption = (option: any) => {
    switch(option.shape) {
      case 'circle':
        return <div className="shape-option circle"></div>;
      case 'square':
        return <div className="shape-option square"></div>;
      case 'triangle':
        return <div className="shape-option triangle"></div>;
      case 'spiral':
        return <div className="shape-option spiral"></div>;
      case 'wave':
        return (
          <div className="shape-option wave">
            <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M0,15 Q15,0 30,15 Q45,30 60,15 Q75,0 90,15 Q105,30 120,15" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                className="wave-line-animation"
              />
            </svg>
          </div>
        );
      case 'random':
        return (
          <div className="shape-option random">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M20,50 Q40,20 50,40 T70,30 Q80,60 60,80 T30,70 Q20,90 40,90 T60,50" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                strokeLinecap="round"
                className="random-sketch-animation"
              />
            </svg>
          </div>
        );
      default:
        return <div className="shape-option circle"></div>;
    }
  };

  const renderOption = (option: any) => {
    if (option.color) {
      return <div className="color-option" style={{ backgroundColor: option.color }}></div>;
    } else if (option.shape) {
      return renderShapeOption(option);
    } else if (option.emoji) {
      return <div className="emoji-option">{option.emoji}</div>;
    } else if (option.image) {
      return <div className="image-option" style={{ backgroundImage: `url(/images/${option.image})` }}></div>;
    } else {
      return null;
    }
  };

  const currentQ = quizQuestions[currentQuestion];

  // Animasyon varyantları
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="quiz-background">
        <div className="quiz-orb quiz-orb1"></div>
        <div className="quiz-orb quiz-orb2"></div>
        <ParticleBackground />
      </div>
      
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="flex justify-between items-center">
            <Link to="/" className="gradient-text text-2xl font-bold">
              Auralize
              <span className="logo-particle">✨</span>
            </Link>
            <div className="quiz-info">
              <span className="quiz-type">{getQuizTitle()}</span>
              <span className="quiz-progress-text">{currentQuestion + 1} / {quizQuestions.length}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content flex items-center justify-center">
        <div className="container">
          <motion.div 
            className={`quiz-card ${animateOut ? 'fade-out' : 'fade-in'}`}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <div className="quiz-progress-bar">
              <motion.div 
                className="quiz-progress-fill"
                initial={{ width: `${((currentQuestion) / quizQuestions.length) * 100}%` }}
                animate={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>

            <motion.h2 
              className="quiz-question"
              key={currentQuestion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {currentQ.question}
            </motion.h2>
            
            <div className="quiz-options">
              {currentQ.options && currentQ.options.map((option, index) => (
                <motion.button
                  key={option.id}
                  className={`quiz-option ${answers[currentQ.id] === option.id ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(currentQ.id, option.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  {renderOption(option)}
                  <span className="quiz-option-label">{option.value}</span>
                </motion.button>
              ))}
            </div>

            {showResultButton && (
              <motion.div 
                className="quiz-action"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <button 
                  onClick={goToResults}
                  className="btn btn-primary"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Hazırlanıyor..." : "Auranı Gör"}
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Quiz; 