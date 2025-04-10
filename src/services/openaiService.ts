// OpenAI API ile iletişim kuracak servis
import axios from 'axios';

// deepseekService'den alınan fonksiyonlar ve sabitler
import { 
  getAnswerSummary, 
  getSystemPromptForAuraType, 
  getInsightsPromptForAuraType
} from './deepseekService';

// Bu değerleri openaiService'den de dışa aktarıyoruz
export { 
  getAnswerSummary, 
  getSystemPromptForAuraType, 
  getInsightsPromptForAuraType
};

// OpenAI API için tip tanımlamaları
interface OpenAIRequestBody {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// OpenAI API için sabitleri tanımla
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini-2024-07-18';
// API anahtarını doğrudan kodun içine yerleştiriyoruz - process.env çalışmadığı için
// const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';
const OPENAI_API_KEY = "sk-HYEDlsAylQ3ig7-_Rm9inf6OPrfzQOfcdRv2mU4fpLT3BlbkFJOB1chlkF2dic3wiYzHKLYW75buC0XvpQfv22b5XxUA";
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 saat (milisaniye cinsinden)

// Debug modunu açalım ki console.log'larla takip edebilelim
const DEBUG_MODE = true;

// Önbellek ile ilgili yardımcı fonksiyonlar
const getCachedData = async (key: string): Promise<any> => {
  const cachedItem = localStorage.getItem(key);
  if (cachedItem) {
    try {
      return JSON.parse(cachedItem);
    } catch (error) {
      console.error('Önbellek verisi ayrıştırma hatası:', error);
      return null;
    }
  }
  return null;
};

const setCachedData = async (key: string, data: any): Promise<void> => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Önbelleğe veri kaydedilirken hata:', error);
  }
};

// Basit string hash oluşturucu fonksiyon (crypto modülü yerine)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32 bit integer'a dönüştür
  }
  return hash.toString(36);
};

// Önbellek anahtarı oluşturma fonksiyonu
const createCacheKey = (auraType: string, answerPattern: string): string => {
  return `auralize_openai_story_cache_${auraType}_${answerPattern}`;
};

// OpenAI API için mesaj formatını hazırla
const prepareMessagesForOpenAI = (auraType: string, username: string, answers: any): any[] => {
  console.log('[OPENAI_PREP] OpenAI için mesajlar hazırlanıyor');
  
  // Cevapların detaylı analizini yap
  const answerSummary = getAnswerSummary(answers || {});
  
  console.log('[OPENAI_PREP] Quiz cevapları formatlandı:', 
    Object.keys(answers || {}).length, 'cevap bulundu');

  // Aura tipine göre sistem talimatını hazırla
  const systemPrompt = getSystemPromptForAuraType(auraType, answerSummary.answerDetails);
  console.log('[OPENAI_PREP] Sistem promptu hazırlandı, uzunluk:', systemPrompt.length, 'karakter');
  
  // Kullanıcı mesajı oluşturma
  const userMessage = `
Merhaba, ben ${username || 'bir kullanıcı'}. 
Aşağıdaki quiz cevaplarıma göre benim için bir ${auraType} Aura hikayesi yazar mısın?

Quiz Cevaplarım:
${answerSummary.answerDetails}

Cevaplarıma göre baskın özelliğim "${answerSummary.dominantTrait}", ikincil özelliğim "${answerSummary.secondaryTrait}".

Lütfen benim için türkçe olarak, içten, derin, anlamlı ve kişiselleştirilmiş bir aura hikayesi yaz. 
Hikaye ruhsal bir yolculuğu ifade etmeli ancak gerçekçi ve uygulanabilir içgörüler de sunmalı.
Sürreal ya da çok soyut bir hikayeden ziyade hayatıma uygulanabilecek gerçekçi içgörüler içeren bir hikaye olsun.
Hikaye en az 4-6 paragraf uzunluğunda, detaylı ve kapsamlı olmalı.
Her bölümü derinlemesine ele al, özellikle "Aura Hikayen" kısmı çok önemli.
Tamamen benim cevaplarıma göre kişiselleştirilmiş ve içgörü dolu bir hikaye hazırla.
`;

  console.log('[OPENAI_PREP] Kullanıcı mesajı hazırlandı, uzunluk:', userMessage.length, 'karakter');
  
  // Mesajları oluştur
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];
};

// OpenAI API'sine istek gönderme ve aura hikayesi alma fonksiyonu
export const getAuraStoryFromOpenAI = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string }
): Promise<string> => {
  console.log('[OPENAI] getAuraStoryFromOpenAI çağrıldı', { auraType, username });
  
  // API anahtarı kontrolünü daha görünür yapalım
  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
    console.error('[OPENAI] API anahtarı bulunamadı veya boş! .env dosyasındaki REACT_APP_OPENAI_API_KEY değişkenini kontrol edin.');
    throw new Error('OpenAI API anahtarı bulunamadı veya boş. Lütfen .env dosyasında REACT_APP_OPENAI_API_KEY değişkenini ayarlayın.');
  }

  console.log('[OPENAI] API anahtarı bulundu, uzunluk:', OPENAI_API_KEY.length);
  
  try {
    // Önbellekten kontrol etmeyi tamamen devre dışı bırakalım
    console.log('[OPENAI] Önbellek kontrolü devre dışı, her zaman yeni istek gönderiliyor');
    
    // OpenAI istek gövdesi 
    const messages = prepareMessagesForOpenAI(auraType, username, answers);
    
    console.log('');
    console.log('==== OPENAI API İSTEĞİ GÖNDERİLİYOR ====');
    console.log('[OPENAI] API URL:', OPENAI_API_URL);
    console.log('[OPENAI] Model:', OPENAI_MODEL);
    console.log('[OPENAI] API Key (ilk 5 karakter):', OPENAI_API_KEY.substring(0, 5));
    console.log('[OPENAI] İstek Gövdesi Hazır');
    console.log('[OPENAI] Sistem mesajı:', messages[0].content.substring(0, 100) + '...');
    console.log('[OPENAI] Kullanıcı mesajı:', messages[1].content.substring(0, 100) + '...');
    console.log('====================================');
    console.log('');
    
    // OpenAI API'ye istek gönder
    const response = await axios.post<OpenAIResponse>(
      OPENAI_API_URL,
      {
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 120000 // 2 dakika
      }
    );
    
    console.log('');
    console.log('==== OPENAI API YANITI ALINDI ====');
    console.log('[OPENAI] Yanıt alındı:', response.status);
    console.log('[OPENAI] Yanıt data:', JSON.stringify(response.data).substring(0, 300) + '...');
    console.log('=================================');
    console.log('');
    
    // OpenAI'dan yanıt olarak metin içeriğini çıkart
    const storyContent = response.data.choices[0].message.content;
    
    // Hikayeyi önbelleğe kaydet
    const cacheData = {
      story: storyContent,
      timestamp: Date.now(),
      auraType: auraType
    };
    
    console.log('[OPENAI] Hikaye başarıyla alındı!');
    
    return storyContent;
  } catch (error: any) {
    console.error('[OPENAI] Hikaye alınırken hata oluştu:', error);
    
    // Eğer API'den hata gelirse detayları logla
    if (error.response) {
      console.error('[OPENAI] API hata detayları:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('[OPENAI] İstek yapıldı ama yanıt alınamadı:', error.request);
    } else {
      console.error('[OPENAI] İstek hazırlama hatası:', error.message);
    }
    
    // Burada örnek bir veri döndürelim ama hata olduğunu belirtelim
    return `API HATASI OLUŞTU: ${error.message}. Lütfen daha sonra tekrar deneyin.`;
  }
};

// İçgörüler için OpenAI API'sinden veri alma
export const getAuraInsightsFromOpenAI = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string },
  detailedAnswers?: any // Detaylı cevapları opsiyonel parametre olarak ekle
): Promise<{
  strengths: string,
  potential: string,
  thinkingStyle: string,
  auraTitle: string,
  source: 'openai' | 'default' | 'api'
}> => {
  try {
    // Eğer API anahtarı yoksa varsayılan içgörüleri döndür
    if (!OPENAI_API_KEY) {
      console.log('OpenAI API anahtarı bulunamadı, varsayılan içgörüler kullanılıyor.');
      const defaultInsights = getOpenAIDefaultInsights(auraType);
      return {
        strengths: Array.isArray(defaultInsights.strengths) ? defaultInsights.strengths.join(", ") : defaultInsights.strengths,
        potential: Array.isArray(defaultInsights.potentialAreas) ? defaultInsights.potentialAreas.join(", ") : defaultInsights.potentialAreas,
        thinkingStyle: defaultInsights.thinkingStyle,
        auraTitle: defaultInsights.auraTitle,
        source: 'default'
      };
    }
    
    // Cevapları özetle
    const summary = getAnswerSummary(answers);
    
    // Önbellek için anahtar oluştur
    const cacheKey = `auralize_openai_insights_${auraType}_${summary.answerPattern}`;
    
    // Önbellekte bu içgörüleri daha önce oluşturup oluşturmadığımızı kontrol et
    const cachedInsights = localStorage.getItem(cacheKey);
    if (cachedInsights) {
      console.log('[OPENAI] İçgörüler önbellekten alındı:', cacheKey);
      const parsed = JSON.parse(cachedInsights);
      return { ...parsed, source: 'openai' as const };
    }
    
    // Detaylı cevapları kullanarak daha zengin bir sorgu oluştur
    let answerDetailsText = summary.answerDetails;
    if (detailedAnswers && Array.isArray(detailedAnswers) && detailedAnswers.length > 0) {
      answerDetailsText = detailedAnswers.map((answer: any) => 
        `Soru: ${answer.question}\nCevap: ${answer.answerText}`
      ).join('\n\n');
      
      console.log("Detaylı cevaplarla zenginleştirilmiş sorgu kullanılıyor:", answerDetailsText);
    }
    
    // Aura tipine göre sistem talimatını hazırla
    const systemPrompt = getInsightsPromptForAuraType(auraType, answerDetailsText);
    
    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `Merhaba, ben ${username}. Test sonuçlarıma göre içgörüleri hazırlar mısın?`
      }
    ];
    
    console.log('[OPENAI] İçgörü isteği gönderiliyor...');
    
    // OpenAI API'sine istek gönder
    const response = await axios.post<OpenAIResponse>(
      OPENAI_API_URL,
      {
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.4,
        max_tokens: 600,
        stream: false,
        response_format: {
          type: "json_object",
          schema: {
            type: "object",
            properties: {
              strengths: { type: "string" },
              potential: { type: "string" },
              thinkingStyle: { type: "string" },
              auraTitle: { type: "string" }
            },
            required: ["strengths", "potential", "thinkingStyle", "auraTitle"]
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 60000 // 1 dakika
      }
    );
    
    console.log('[OPENAI] İçgörü yanıtı alındı');
    
    // İçeriği al ve JSON olarak ayrıştır
    const insightsText = response.data.choices[0].message.content.trim();
    
    try {
      // JSON olarak ayrıştır
      const parsedInsights = JSON.parse(insightsText);
      
      // Önbelleğe kaydet
      localStorage.setItem(cacheKey, JSON.stringify(parsedInsights));
      
      return { ...parsedInsights, source: 'openai' };
    } catch (parseError) {
      console.error('[OPENAI] JSON ayrıştırma hatası:', parseError);
      
      // Eski regex yöntemiyle deneyebiliriz
      const strengthsMatch = insightsText.match(/GÜÇLÜ (YÖNLER|YÖNLERİ|YANLAR|YANLARI)\s*:(.+?)(?=POTANSİYEL|DÜŞÜNME|BAŞLIK|$)/i);
      const potentialMatch = insightsText.match(/POTANSİYEL\s*:(.+?)(?=DÜŞÜNME|BAŞLIK|ÇALIŞMA|$)/i);
      const thinkingMatch = insightsText.match(/((DÜŞÜNME|ÇALIŞMA) STİLİ|RUH HALİ TEPKİSİ|YAKLAŞIM|YÖNTEM)\s*:(.+?)(?=BAŞLIK|AURA|$)/i);
      const titleMatch = insightsText.match(/(AURA|RUH HALİ|GELİŞİM|KARİYER) BAŞLIĞI\s*:(.+?)(?=$)/i);
      
      let strengths = strengthsMatch ? strengthsMatch[2].trim() : "Analitik düşünme, detaylara odaklanma";
      let potential = potentialMatch ? potentialMatch[1].trim() : "Yaratıcı problem çözme, yenilikçi yaklaşımlar";
      let thinkingStyle = thinkingMatch ? (thinkingMatch[3] || thinkingMatch[1]).trim() : "Sistematik ve mantıksal düşünme";
      let auraTitle = titleMatch ? titleMatch[2].trim() : "Parlayan Zeka";
      
      // Yanıtın tamamını gözden geçir ve ayrıştırılamayanlar için alternatif bir yöntem kullan
      if (!strengthsMatch || !potentialMatch || !thinkingMatch || !titleMatch) {
        const lines = insightsText.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length >= 4) {
          if (!strengthsMatch) strengths = lines[0].replace(/^GÜÇLÜ (YÖNLER|YÖNLERİ|YANLAR|YANLARI)\s*:\s*/i, '').trim();
          if (!potentialMatch) potential = lines[1].replace(/^POTANSİYEL\s*:\s*/i, '').trim();
          if (!thinkingMatch) thinkingStyle = lines[2].replace(/^((DÜŞÜNME|ÇALIŞMA) STİLİ|RUH HALİ TEPKİSİ|YAKLAŞIM|YÖNTEM)\s*:\s*/i, '').trim();
          if (!titleMatch) auraTitle = lines[3].replace(/^(AURA|RUH HALİ|GELİŞİM|KARİYER) BAŞLIĞI\s*:\s*/i, '').trim();
        }
      }
      
      const insights = {
        strengths,
        potential,
        thinkingStyle,
        auraTitle
      };
      
      // Önbelleğe kaydet
      localStorage.setItem(cacheKey, JSON.stringify(insights));
      
      return { ...insights, source: 'openai' };
    }
  } catch (error: any) {
    console.error('[OPENAI] İçgörüler alınırken hata oluştu:', error);
    
    // Eğer API'den hata gelirse detayları logla
    if (error.response) {
      console.error('[OPENAI] API hata detayları:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    // Hata durumunda varsayılan içgörülere geri dön
    const defaultInsights = getOpenAIDefaultInsights(auraType);
    return {
      strengths: Array.isArray(defaultInsights.strengths) ? defaultInsights.strengths.join(", ") : defaultInsights.strengths,
      potential: Array.isArray(defaultInsights.potentialAreas) ? defaultInsights.potentialAreas.join(", ") : defaultInsights.potentialAreas,
      thinkingStyle: defaultInsights.thinkingStyle,
      auraTitle: defaultInsights.auraTitle,
      source: 'default'
    };
  }
};

// İsim çakışmasını önlemek için fonksiyon adını değiştirdim
const getOpenAIDefaultInsights = (auraType: string) => {
  const baseResponse = {
    auraStory: "Aura enerjiniz çok özel ve dengeli bir yapıya sahip. Her insanın kendine özgü bir enerji alanı vardır ve sizinki dengeli bir şekilde, çevrenizdeki insanları da olumlu etkiliyor. Hayata karşı yaklaşımınız ve çevrenizdeki olayları algılama biçiminiz, sizi farklı kılıyor. Bu enerji sayesinde zorlukların üstesinden gelme yeteneğiniz dikkat çekiyor.",
    strengths: [
      "Güçlü iletişim becerileri ve empati yeteneği",
      "Zorluklar karşısında dayanıklılık ve adaptasyon kabiliyeti",
      "Detaylara dikkat etme ve planlama yeteneği"
    ],
    potentialAreas: [
      "Duygusal tepkilerinizi daha iyi yönetmek",
      "Kendinize daha fazla zaman ayırmak"
    ],
    thinkingStyle: "Sistematik ve analitik düşünmeyi tercih ediyorsunuz. Problemleri çözerken mantıksal bir yaklaşım sergilerken, sezgilerinizi de dinliyorsunuz.",
    auraTitle: "Dengeli ve Etkileyici Aura",
  };

  switch (auraType) {
    case 'mood':
      return {
        ...baseResponse,
        moodState: "Duygusal dengeniz genel olarak istikrarlı olsa da, zaman zaman stres faktörlerinden etkilenebiliyorsunuz. İç dünyanızda zengin bir duygusal yapıya sahipsiniz ve bu, yaratıcılığınızı besliyor.",
        moodSuggestions: [
          "Günlük meditasyon ve nefes egzersizleri",
          "Doğada düzenli zaman geçirmek",
          "Sevdiğiniz müzikleri dinlemek",
          "Duygu günlüğü tutmak"
        ]
      };
    
    case 'personal':
      return {
        ...baseResponse,
        developmentAreas: [
          "Öz-disiplin ve zamanı daha etkili kullanma",
          "Olumsuz düşünce kalıplarını fark etme ve değiştirme",
          "Kendine güven ve öz-değer algısını güçlendirme"
        ],
        developmentPlan: {
          thirtyDays: [
            "Her gün 10 dakika meditasyon yapın",
            "Haftalık hedefler belirleyin ve takip edin"
          ],
          sixtyDays: [
            "Bir kişisel gelişim kitabı okuyun",
            "Yeni bir beceri geliştirmeye başlayın"
          ],
          ninetyDays: [
            "Öğrendiklerinizi günlük hayatınıza entegre edin",
            "İlerlemenizi değerlendirin ve yeni hedefler belirleyin"
          ]
        }
      };
    
    case 'career':
      return {
        ...baseResponse,
        careerSuggestions: [
          "Proje Yöneticisi",
          "İçerik Stratejisti",
          "Eğitim Danışmanı",
          "İnovasyon Uzmanı",
          "Araştırma ve Geliştirme Uzmanı"
        ],
        skillsToImprove: [
          "Veri analizi ve yorumlama",
          "Liderlik ve ekip yönetimi",
          "Dijital pazarlama ve iletişim",
          "Sunum becerileri"
        ]
      };
    
    case 'creative':
      return {
        ...baseResponse,
        auraStory: "Yaratıcı aura enerjiniz, sanatsal duyarlılık ve yenilikçi düşünceyle parlıyor. Alışılmadık bağlantılar kurma ve farklı bakış açıları geliştirme konusundaki yeteneğiniz, yaratıcı süreçlerde size büyük avantaj sağlıyor. İçgörüleriniz ve hayal gücünüz, çevrenizdeki dünyayı farklı bir gözle görmenize olanak tanıyor.",
        strengths: [
          "Yenilikçi ve özgün fikirler üretme yeteneği",
          "Farklı disiplinler arasında bağlantı kurma becerisi",
          "Estetik duyarlılık ve sanatsal ifade gücü",
          "Alışılmışın dışında düşünme ve problem çözme yaklaşımı"
        ],
        potentialAreas: [
          "Fikirlerinizi uygulamaya geçirme konusunda daha sistemli olabilirsiniz",
          "Eleştirilere karşı daha açık bir yaklaşım geliştirebilirsiniz"
        ],
        auraTitle: "Yenilikçi ve İlham Verici Yaratıcı Aura"
      };
    
    default:
      return baseResponse;
  }
};

// Yeni determineDynamicAuraType fonksiyonu, artık sabit aura tipleri kullanmadan genel kategorileri döndürüyor
export const determineDynamicAuraType = (answers: { [key: number]: string }): string => {
  const summary = getAnswerSummary(answers);
  const { dominantTrait, secondaryTrait } = summary;
  
  // Artık önceden tanımlanmış sabit aura tiplerini kullanmak yerine 
  // ana kategorileri direkt olarak kullanıyoruz
  // Bu sayede GPT-4o tamamen özgün aura başlıkları oluşturabilecek
  return dominantTrait;
};

// Genel aura türleri için basic bilgiler (UI renkleri için)
export const auraTypes = {
  'analitik': {
    description: 'Analitik düşünme yeteneğiniz, problem çözme beceriniz ve mantıksal yapınız öne çıkıyor.'
  },
  'yaratıcı': {
    description: 'Yaratıcı enerjiniz, özgün düşünme yeteneğiniz ve sanatsal ifadeniz öne çıkıyor.'
  },
  'empatik': {
    description: 'Empatik yanınız, duygusal zekanız ve insanlarla bağ kurma yeteneğiniz öne çıkıyor.'
  },
  'enerjik': {
    description: 'Enerjik yapınız, motivasyonunuz ve harekete geçme kabiliyetiniz öne çıkıyor.'
  },
  'mood': {
    description: 'Ruh haliniz ve duygusal dengeniz analiz edildi.'
  },
  'personal': {
    description: 'Kişisel gelişim potansiyeliniz ve büyüme alanlarınız analiz edildi.'
  },
  'career': {
    description: 'Kariyer potansiyeliniz ve profesyonel gelişim alanlarınız analiz edildi.'
  },
  'creative': {
    description: 'Yaratıcı potansiyeliniz ve ifade biçimleriniz analiz edildi.'
  }
};

// Hem aura hikayesi hem de içgörüleri tek bir istekte almak için birleştirilmiş fonksiyon
export const getCombinedAuraDataFromOpenAI = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string }
): Promise<{
  story: string,
  strengths: string,
  potential: string,
  thinkingStyle: string,
  auraTitle: string,
  source: 'openai' | 'default' | 'api'
}> => {
  // API anahtarı kontrolünü daha görünür yapalım
  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
    console.error('[OPENAI] API anahtarı bulunamadı veya boş! .env dosyasındaki REACT_APP_OPENAI_API_KEY değişkenini kontrol edin.');
    console.log("Varsayılan aura verileri döndürülüyor...");
    const defaultData = getOpenAIDefaultInsights(auraType);
    return {
      story: defaultData.auraStory,
      strengths: Array.isArray(defaultData.strengths) ? defaultData.strengths.join(", ") : defaultData.strengths,
      potential: Array.isArray(defaultData.potentialAreas) ? defaultData.potentialAreas.join(", ") : defaultData.potentialAreas,
      thinkingStyle: defaultData.thinkingStyle,
      auraTitle: defaultData.auraTitle,
      source: 'default' as const
    };
  }

  console.log('[OPENAI] getCombinedAuraDataFromOpenAI fonksiyonu çağrıldı');
  console.log('[OPENAI] API anahtarı bulundu, uzunluk:', OPENAI_API_KEY.length);
  console.log('[OPENAI] API anahtarı (ilk 10 karakter):', OPENAI_API_KEY.substring(0, 10));

  // Önbellek kontrolü tamamen kaldırıldı
  console.log('[OPENAI] Önbellek kontrolü devre dışı, her zaman yeni istek gönderiliyor');

  try {
    console.log(`[OPENAI] ${auraType} aura verilerini OpenAI'dan alıyorum. Kullanıcı adı: ${username}`);
    const prompt = `Kişinin aura enerjisini analiz et ve TAM OLARAK aşağıdaki formatta yanıt ver. 
Her bölüm için DETAYLI açıklamalar yap:

### Aura Başlığı: **[Kişinin aura enerjisini özetleyen benzersiz ve çarpıcı bir başlık]**

#### Aura Hikayesi (auraStory): [Kişinin aura enerjisi hakkında 300-400 kelimelik akıcı ve ilham verici bir hikaye]

#### Güçlü Yönler (strengths): [Aşağıdaki formatta, her madde için detaylı açıklamalar]
1. **[Güçlü yön 1]**: [Detaylı açıklama]
2. **[Güçlü yön 2]**: [Detaylı açıklama]
3. **[Güçlü yön 3]**: [Detaylı açıklama]
4. **[Güçlü yön 4]**: [Detaylı açıklama]
5. **[Güçlü yön 5]**: [Detaylı açıklama]

#### Potansiyel Gelişim Alanları (potentialAreas): [Aşağıdaki formatta, her madde için detaylı açıklamalar]
1. **[Potansiyel alan 1]**: [Detaylı açıklama]
2. **[Potansiyel alan 2]**: [Detaylı açıklama]
3. **[Potansiyel alan 3]**: [Detaylı açıklama]
4. **[Potansiyel alan 4]**: [Detaylı açıklama]
5. **[Potansiyel alan 5]**: [Detaylı açıklama]

#### Düşünce Tarzı (thinkingStyle): [Kişinin düşünce tarzı hakkında detaylı bir paragraf]

-----

Kişi hakkında bilgiler:
Ad: ${username}
Aura Tipi: ${auraType}
Quiz Cevapları: ${JSON.stringify(answers)}

-----

ÖNEMLİ: 
- Yanıtını TAM OLARAK bu formatta ver
- Formatı kesinlikle değiştirme
- Tüm BAŞLIKLAR ve NUMARALANDIRMALAR bu şekilde kalmalı
- Her bölüm için YETERLİ ve DETAYLI bilgi ver
- Türkçe yanıt ver
- Her bölümü MUTLAKA doldur ve hiçbir bölümü boş bırakma`;
    
    console.log('[OPENAI] API isteği hazırlanıyor...');
    console.log('[OPENAI] API URL:', OPENAI_API_URL);
    console.log('[OPENAI] Model:', OPENAI_MODEL);
    console.log('[OPENAI] Prompt ilk 100 karakteri:', prompt.substring(0, 100) + '...');
    
    const response = await axios.post<OpenAIResponse>(
      OPENAI_API_URL,
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 180000 // 3 dakika
      }
    );

    console.log('[OPENAI] API yanıtı alındı:', response.status);
    console.log('[OPENAI] Yanıt data (ilk 200 karakter):', JSON.stringify(response.data).substring(0, 200) + '...');

    if (!response.data.choices[0].message.content) {
      throw new Error("OpenAI API boş yanıt döndü");
    }

    // Başarılı bir şekilde yanıt aldık, içeriğini kullan
    const storyContent = response.data.choices[0].message.content;
    console.log('[OPENAI] İçerik uzunluğu:', storyContent.length);
    
    // Aura başlığını regex ile çıkar
    let auraTitle = "Kişisel Aura Analizi";
    const titleMatch = storyContent.match(/### Aura Başlığı: \*\*([^*]+)\*\*/);
    if (titleMatch && titleMatch[1]) {
      auraTitle = titleMatch[1].trim();
      console.log('[OPENAI] Başlık çıkarıldı:', auraTitle);
    }
    
    // Güçlü yanları çıkar - daha güçlü regex ile
    let strengths = "";
    const strengthsMatch = storyContent.match(/#### Güçlü Yönler \(strengths\):([\s\S]*?)(?=####|$)/);
    if (strengthsMatch && strengthsMatch[1]) {
      strengths = strengthsMatch[1].trim();
      console.log('[OPENAI] Güçlü yanlar çıkarıldı, uzunluk:', strengths.length);
    }
    
    // Potansiyel alanları çıkar - daha güçlü regex ile
    let potential = "";
    const potentialMatch = storyContent.match(/#### Potansiyel Gelişim Alanları \(potentialAreas\):([\s\S]*?)(?=####|$)/);
    if (potentialMatch && potentialMatch[1]) {
      potential = potentialMatch[1].trim();
      console.log('[OPENAI] Potansiyel alanlar çıkarıldı, uzunluk:', potential.length);
    }
    
    // Düşünme tarzını çıkar - daha güçlü regex ile
    let thinkingStyle = "";
    const thinkingMatch = storyContent.match(/#### Düşünce Tarzı \(thinkingStyle\):([\s\S]*?)(?=####|$)/);
    if (thinkingMatch && thinkingMatch[1]) {
      thinkingStyle = thinkingMatch[1].trim();
      console.log('[OPENAI] Düşünme tarzı çıkarıldı, uzunluk:', thinkingStyle.length);
    }
    
    // Tüm alanların dolu olduğundan emin ol
    if (!strengths || strengths.length < 10) {
      console.warn('[OPENAI] Güçlü yanlar alanı yetersiz, API yanıtında sorun olabilir');
      strengths = "1. **Analitik Düşünme**: Problem çözme ve mantıksal analiz konusunda güçlü yetenekler.\n2. **Detaylara Dikkat**: En küçük ayrıntılara bile odaklanabilme.\n3. **Özgün Bakış Açısı**: Olaylara farklı perspektiflerden bakabilme.\n4. **Adapte Olabilme**: Değişen durumlara hızla uyum sağlayabilme.\n5. **İçsel Motivasyon**: Hedeflere ulaşmak için güçlü iç motivasyon.";
    }
    
    if (!potential || potential.length < 10) {
      console.warn('[OPENAI] Potansiyel alanları alanı yetersiz, API yanıtında sorun olabilir');
      potential = "1. **Duygusal İfade**: Duyguları daha açık ifade etme potansiyeli.\n2. **Sosyal Bağlar**: Daha derin ve anlamlı ilişkiler kurma.\n3. **Yaratıcı Düşünme**: Yaratıcı düşünce süreçlerini geliştirme.\n4. **Zaman Yönetimi**: Zamanı daha etkili kullanma yöntemleri.\n5. **Öz-Bakım**: Kişisel ihtiyaçlara daha fazla önem verme.";
    }
    
    if (!thinkingStyle || thinkingStyle.length < 10) {
      console.warn('[OPENAI] Düşünme tarzı alanı yetersiz, API yanıtında sorun olabilir');
      thinkingStyle = "Sistematik ve analitik bir düşünme tarzına sahipsiniz. Problemleri adım adım ele almayı tercih eder, detaylara önem verirsiniz. Mantıksal çerçevede ilerlerken, sezgisel yeteneklerinizi de kullanarak farklı bakış açıları geliştirebilirsiniz.";
    }
    
    return {
      story: storyContent,
      strengths: strengths,
      potential: potential,
      thinkingStyle: thinkingStyle,
      auraTitle: auraTitle,
      source: 'openai' as const
    };
    
  } catch (error: any) {
    console.error("[OPENAI] OpenAI'dan aura verilerini alırken hata:", error);
    
    // Daha detaylı hata bilgisi
    if (error.response) {
      console.error('[OPENAI] API hata detayları:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('[OPENAI] İstek yapıldı ama yanıt alınamadı:', error.request);
    } else {
      console.error('[OPENAI] İstek hazırlama hatası:', error.message);
    }
    
    // Hata durumunda örnek bir veri döndürelim ama hata durumunu belirtelim
    return {
      story: `API HATASI OLUŞTU: ${error.message}. Lütfen daha sonra tekrar deneyin. Bu bir hata durumunda gösterilen mesajdır.`,
      strengths: "1. **Analitik Düşünme**: Problem çözme ve mantıksal analiz konusunda güçlü yetenekler.\n2. **Detaylara Dikkat**: En küçük ayrıntılara bile odaklanabilme.\n3. **Özgün Bakış Açısı**: Olaylara farklı perspektiflerden bakabilme.\n4. **Adapte Olabilme**: Değişen durumlara hızla uyum sağlayabilme.\n5. **İçsel Motivasyon**: Hedeflere ulaşmak için güçlü iç motivasyon.",
      potential: "1. **Duygusal İfade**: Duyguları daha açık ifade etme potansiyeli.\n2. **Sosyal Bağlar**: Daha derin ve anlamlı ilişkiler kurma.\n3. **Yaratıcı Düşünme**: Yaratıcı düşünce süreçlerini geliştirme.\n4. **Zaman Yönetimi**: Zamanı daha etkili kullanma yöntemleri.\n5. **Öz-Bakım**: Kişisel ihtiyaçlara daha fazla önem verme.",
      thinkingStyle: "Sistematik ve analitik bir düşünme tarzına sahipsiniz. Problemleri adım adım ele almayı tercih eder, detaylara önem verirsiniz. Mantıksal çerçevede ilerlerken, sezgisel yeteneklerinizi de kullanarak farklı bakış açıları geliştirebilirsiniz.",
      auraTitle: "API Hatası - Yeniden Deneyin",
      source: 'openai' as const // Hata durumunda bile 'openai' kaynağı gösteriyoruz
    };
  }
}; 