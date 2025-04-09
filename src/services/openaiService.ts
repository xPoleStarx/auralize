// OpenAI API ile iletişim kuracak servis
import axios from 'axios';
import { createHash } from 'crypto';



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

// OpenAI'nin gpt-4o-mini modeli için sabitleri tanımla
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini-2024-07-18';
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 saat (milisaniye cinsinden)

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

// deepseekService.ts'den aktarılan yardımcı fonksiyonlar
// Bu fonksiyonları doğrudan OpenAI servisinde kullanabilmek için dahil ediyoruz
import { 
  getAnswerSummary, 
  auraTypes, 
  determineDynamicAuraType, 
  getSystemPromptForAuraType,
  getInsightsPromptForAuraType,
  getCombinedPromptForAuraType as getDeepseekPromptForAuraType
} from './deepseekService';

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
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API anahtarı bulunamadı. Lütfen .env dosyasında REACT_APP_OPENAI_API_KEY değişkenini ayarlayın.');
  }
  
  try {
    // Cevapları özetle
    const summary = getAnswerSummary(answers);
    
    // Önbellek için anahtar oluştur
    const cacheKey = createCacheKey(auraType, summary.answerPattern);
    
    // Önbellekte bu hikayeyi daha önce oluşturup oluşturmadığımızı kontrol et
    const cachedStory = localStorage.getItem(cacheKey);
    const cachedData = cachedStory ? JSON.parse(cachedStory) : null;
    
    // Eğer önbellekte varsa ve süresi geçmediyse, önbellekten al
    if (cachedData && 
        cachedData.timestamp && 
        (Date.now() - cachedData.timestamp < CACHE_EXPIRY_TIME) &&
        cachedData.auraType === auraType) {
      console.log('[OPENAI] Hikaye önbellekten alındı:', cacheKey);
      return cachedData.story;
    }
    
    // OpenAI istek gövdesi 
    const messages = prepareMessagesForOpenAI(auraType, username, answers);
    
    console.log('');
    console.log('==== OPENAI API İSTEĞİ GÖNDERİLİYOR ====');
    console.log('[OPENAI] API URL:', OPENAI_API_URL);
    console.log('[OPENAI] Model:', OPENAI_MODEL);
    console.log('[OPENAI] İstek Gövdesi Hazır');
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
    console.log('[OPENAI] Yanıt alındı');
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
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    
    return storyContent;
  } catch (error: any) {
    console.error('[OPENAI] Hikaye alınırken hata oluştu:', error);
    
    // Eğer API'den hata gelirse detayları logla
    if (error.response) {
      console.error('[OPENAI] API hata detayları:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    throw new Error('OpenAI API\'den hikaye alınamadı: ' + error.message);
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
  // Check cache first
  const cacheKey = `aura_${auraType}_${createHash(JSON.stringify(answers) + username)}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log("Returning cached aura data");
    return cachedData;
  }

  try {
    const baseSchema = {
      type: "object",
      properties: {
        auraStory: {
          type: "string",
          description: "Kullanıcının aura enerji hikayesi, 300-400 kelime arası, akıcı ve ilham verici bir Türkçe ile.",
        },
        strengths: {
          type: "array",
          description: "Kullanıcının güçlü yönleri, 3-4 madde olarak, detaylı açıklamalarla.",
          items: {
            type: "string",
          },
        },
        potentialAreas: {
          type: "array",
          description: "Kullanıcının geliştirilebilir potansiyel alanları, 2-3 madde olarak, detaylı açıklamalarla.",
          items: {
            type: "string",
          },
        },
        thinkingStyle: {
          type: "string",
          description: "Kullanıcının düşünme tarzı analizi, detaylı ve spesifik.",
        },
        auraTitle: {
          type: "string",
          description: "Kullanıcının aura enerjisini özetleyen çarpıcı bir başlık.",
        },
      },
      required: ["auraStory", "strengths", "potentialAreas", "thinkingStyle", "auraTitle"],
    };

    let responseFormat: any = { ...baseSchema };

    // Add type-specific schema properties
    switch (auraType) {
      case 'mood':
        responseFormat.properties = {
          ...responseFormat.properties,
          moodState: {
            type: "string",
            description: "Kullanıcının mevcut ruh hali durumu ve duygusal dengesi hakkında detaylı bir analiz.",
          },
          moodSuggestions: {
            type: "array",
            description: "Kullanıcının ruh halini dengelemesi için 4-5 pratik öneri.",
            items: {
              type: "string",
            },
          },
        };
        responseFormat.required = [...responseFormat.required, "moodState", "moodSuggestions"];
        break;
      
      case 'personal':
        responseFormat.properties = {
          ...responseFormat.properties,
          developmentAreas: {
            type: "array",
            description: "Kullanıcının çalışması gereken 3-4 temel kişisel gelişim alanı.",
            items: {
              type: "string",
            },
          },
          developmentPlan: {
            type: "object",
            description: "Kullanıcı için 30-60-90 günlük bir kişisel gelişim planı.",
            properties: {
              thirtyDays: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              sixtyDays: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ninetyDays: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
          },
        };
        responseFormat.required = [...responseFormat.required, "developmentAreas", "developmentPlan"];
        break;
      
      case 'career':
        responseFormat.properties = {
          ...responseFormat.properties,
          careerSuggestions: {
            type: "array",
            description: "Kullanıcı için 4-5 potansiyel kariyer yolu veya rol önerisi.",
            items: {
              type: "string",
            },
          },
          skillsToImprove: {
            type: "array",
            description: "Kullanıcının kariyerinde ilerlemesi için geliştirmesi gereken 3-4 temel beceri.",
            items: {
              type: "string",
            },
          },
        };
        responseFormat.required = [...responseFormat.required, "careerSuggestions", "skillsToImprove"];
        break;
      
      // Creative type uses the base schema without modifications
    }

    console.log(`Getting ${auraType} aura data from OpenAI for user: ${username}`);
    const prompt = getCombinedAuraPrompt(answers, auraType);
    
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
        response_format: { type: "json_object", schema: responseFormat },
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 180000 // 3 dakika
      }
    );

    if (!response.data.choices[0].message.content) {
      throw new Error("OpenAI API returned an empty response");
    }

    try {
      const data = JSON.parse(response.data.choices[0].message.content);
      const formattedData = {
        story: data.auraStory,
        strengths: Array.isArray(data.strengths) ? data.strengths.join(", ") : data.strengths,
        potential: Array.isArray(data.potentialAreas) ? data.potentialAreas.join(", ") : data.potentialAreas,
        thinkingStyle: data.thinkingStyle,
        auraTitle: data.auraTitle,
        source: 'openai' as const
      };
      await setCachedData(cacheKey, formattedData);
      return formattedData;
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
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
  } catch (error) {
    console.error("Error getting aura data from OpenAI:", error);
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
};

const getCombinedAuraPrompt = (quizData: any, auraType: string) => {
  const basePrompt = `Aşağıdaki kişilik testi yanıtlarına dayanarak, kişinin aurasını analiz et.
  
Yanıtlar:
${JSON.stringify(quizData, null, 2)}

Kullanıcının cevaplarına dayanarak bir aura analizi hazırla. Analizde şunlar olmalı:
1. Kişinin aura enerjisini betimleyen etkileyici bir hikaye (auraStory)
2. Kişinin öne çıkan 3-5 güçlü yönü (strengths)
3. Potansiyel gelişim alanları (potentialAreas)
4. Kişinin düşünce tarzını betimleyen kısa bir paragraf (thinkingStyle)
5. Aurayı özetleyen çarpıcı bir başlık (auraTitle)

Analiz profesyonel, içgörü dolu ve kişiselleştirilmiş olmalı.`;

  let typeSpecificPrompt = '';
  
  switch (auraType) {
    case 'mood':
      typeSpecificPrompt = `
Ek olarak, kişinin mevcut duygusal durumunu (moodState) analiz et ve 
ruh halini iyileştirmek için 4-5 pratik öneri (moodSuggestions) sun.
Duygusal durumu analizinde kişinin genel duygusal dengesini, stres seviyesini ve iç dünyasını yansıt.`;
      break;
    
    case 'personal':
      typeSpecificPrompt = `
Ek olarak, kişisel gelişim için spesifik 3-4 gelişim alanı (developmentAreas) belirle ve
bir kişisel gelişim planı (developmentPlan) hazırla. Bu plan 30, 60 ve 90 günlük adımlar içermeli ve 
her dönem için 2-3 somut eylem önerisi sunmalı.`;
      break;
    
    case 'career':
      typeSpecificPrompt = `
Ek olarak, kişinin karakter ve becerilerine uygun 5 potansiyel kariyer önerisi (careerSuggestions) sun ve
profesyonel gelişim için geliştirilebilecek 4-5 beceri (skillsToImprove) belirle. Öneriler kişinin cevaplarına uygun,
gerçekçi ve çeşitli olmalı.`;
      break;
    
    case 'creative':
      typeSpecificPrompt = `
Analizi yaratıcı potansiyele odakla. Aura hikayesi (auraStory) kişinin yaratıcı süreçlerdeki yaklaşımını, 
güçlü yönleri (strengths) sanatsal ve yenilikçi becerilerini, gelişim alanları (potentialAreas) ise 
yaratıcı ifade potansiyelini geliştirmeye yönelik olmalı.`;
      break;
  }
  
  return basePrompt + typeSpecificPrompt;
}; 