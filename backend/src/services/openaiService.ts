// OpenAI API ile iletişim kuracak servis
import axios, { AxiosResponse } from 'axios';

// promptService'den prompt oluşturma fonksiyonlarını import edelim
import { 
  getSystemPromptForAuraType, 
  getInsightsPromptForAuraType,
  getCombinedPromptForAuraType
} from './promptService';

// answerAnalyzer'dan analiz fonksiyonlarını import edelim
import { 
  getAnswerSummary,
  determineDynamicAuraType as getDynamicAuraType
} from '../utils/answerAnalyzer';

// AuraServiceResponse tipini içe aktar
import { AuraServiceResponse } from '../types/auraTypes';

// Önbellek yönetimi için yardımcı fonksiyonlar
import {
  createCacheKey,
  getCachedData,
  setCachedData,
  createInputHash,
  isCacheExpired,
  maskApiKey
} from '../utils/apiRequestOptimizer';

// Bu değerleri openaiService'den de dışa aktarıyoruz
export { 
  getAnswerSummary, 
  getDynamicAuraType as determineDynamicAuraType
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
// API anahtarını çevre değişkenlerinden alma
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 saat (milisaniye cinsinden)

// Debug modu
const DEBUG_MODE = true;

// Uygulama başlangıcında API anahtarı varlığını kontrol et
if (DEBUG_MODE) {
  console.log('[OPENAI] API anahtarı kontrolü:',
    OPENAI_API_KEY ? 'API anahtarı mevcut' : 'API anahtarı bulunamadı!');
  console.log('[OPENAI] API anahtarı (maskelenmiş):', 
    OPENAI_API_KEY ? `${OPENAI_API_KEY.substring(0, 10)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 5)}` : 'YOK');
}

// OpenAI API için mesaj formatını hazırla
const prepareMessagesForOpenAI = async (auraType: string, username: string, answers: any): Promise<any[]> => {
  console.log('[OPENAI_PREP] OpenAI için mesajlar hazırlanıyor');
  
  // Cevapların detaylı analizini yap
  const answerSummary = getAnswerSummary(answers || {});
  
  console.log('[OPENAI_PREP] Quiz cevapları formatlandı:', 
    Object.keys(answers || {}).length, 'cevap bulundu');

  // Aura tipine göre sistem talimatını JSON dosyasından al
  const systemPrompt = await getSystemPromptForAuraType(auraType, answerSummary.answerDetails);
  console.log('[OPENAI_PREP] Sistem promptu hazırlandı, uzunluk:', systemPrompt.length, 'karakter');
  
  // Kullanıcı mesajı oluşturma
  const userMessage = `
Merhaba, ben ${username || 'bir kullanıcı'}. 
Aşağıdaki quiz cevaplarıma göre benim için bir ${auraType} Aura analizi yapar mısın?

Quiz Cevaplarım:
${answerSummary.answerDetails}

Cevaplarıma göre baskın özelliğim "${answerSummary.dominantTrait}", ikincil özelliğim "${answerSummary.secondaryTrait}".
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
  
  // API anahtarı kontrolü
  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
    console.error('[OPENAI] API anahtarı bulunamadı veya boş! .env dosyasındaki OPENAI_API_KEY değişkenini kontrol edin.');
    throw new Error('OpenAI API anahtarı bulunamadı');
  }

  try {
    // Cevapların özetini al
    const summary = getAnswerSummary(answers);
    
    // Önbellek için anahtar oluştur
    const cacheKey = createCacheKey('openai', 'story', auraType, summary.answerPattern);
    
    // İstek için giriş verilerinden bir hash oluştur
    const inputData = {
      auraType,
      username,
      answerPattern: summary.answerPattern
    };
    const inputHash = createInputHash(inputData);
    
    // Önbellekte kontrol et ve süresi dolmamışsa kullan
    const cachedItem = getCachedData<{ story: string }>(cacheKey);
    if (cachedItem && !isCacheExpired(cachedItem.timestamp, CACHE_EXPIRY_TIME) && cachedItem.hash === inputHash) {
      console.log('[OPENAI] Hikaye önbellekten alındı:', cacheKey);
      return cachedItem.data.story;
    }
    
    // OpenAI istek gövdesi 
    const messages = await prepareMessagesForOpenAI(auraType, username, answers);
    
    if (DEBUG_MODE) {
      console.log('');
      console.log('==== OPENAI API İSTEĞİ GÖNDERİLİYOR ====');
      console.log('[OPENAI] API URL:', OPENAI_API_URL);
      console.log('[OPENAI] Model:', OPENAI_MODEL);
      console.log('[OPENAI] API Key (maskelenmiş):', maskApiKey(OPENAI_API_KEY));
      console.log('[OPENAI] İstek Gövdesi Hazır');
      console.log('[OPENAI] Sistem mesajı (ilk 100 karakter):', typeof messages[0].content === 'string' ? messages[0].content.substring(0, 100) + '...' : messages[0].content);
      console.log('[OPENAI] Kullanıcı mesajı:', messages[1].content.substring(0, 100) + '...');
      console.log('====================================');
      console.log('');
    }
    
    // API isteği gönder - yeniden deneme mekanizması olmadan direk istek
    const response = await axios.post<OpenAIResponse>(
          OPENAI_API_URL,
          {
            model: OPENAI_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 1500
          } as OpenAIRequestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
          }
        );
      
    const story = response.data.choices[0].message.content;
    
    // Önbelleğe kaydet
    setCachedData<{ story: string }>(cacheKey, { story }, inputHash);
    
    console.log('[OPENAI] Hikaye başarıyla oluşturuldu ve önbelleğe kaydedildi');
    
    return story;
  } catch (error) {
    console.error('[OPENAI] Hikaye oluşturma hatası:', error);
    throw error; // Hatayı yukarı ilet, varsayılan metin kullanmak yerine
  }
};

// İçgörüler için OpenAI API'sinden veri alma
export const getAuraInsightsFromOpenAI = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string },
  detailedAnswers?: any
): Promise<{
  strengths: string,
  potential: string,
  thinkingStyle: string,
  auraTitle: string,
  source: 'openai' | 'api'
}> => {
  try {
    // API anahtarı kontrolü
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      console.error('[OPENAI] API anahtarı bulunamadı veya boş! .env dosyasındaki OPENAI_API_KEY değişkenini kontrol edin.');
      throw new Error('OpenAI API anahtarı bulunamadı');
    }
    
    // Cevapları özetle
    const summary = getAnswerSummary(answers);
    
    // Önbellek için anahtar oluştur
    const cacheKey = createCacheKey('openai', 'insights', auraType, summary.answerPattern);
    
    // İstek için giriş verilerinden bir hash oluştur
    const inputData = {
      auraType,
      username,
      answerPattern: summary.answerPattern,
      detailedAnswers: detailedAnswers ? true : false
    };
    const inputHash = createInputHash(inputData);
    
    // Önbellekte kontrol et ve süresi dolmamışsa kullan
    const cachedItem = getCachedData<any>(cacheKey);
    if (cachedItem && !isCacheExpired(cachedItem.timestamp, CACHE_EXPIRY_TIME) && cachedItem.hash === inputHash) {
      console.log('[OPENAI] İçgörüler önbellekten alındı:', cacheKey);
      return { ...cachedItem.data, source: 'openai' as const };
    }
    
    // Detaylı cevapları kullanarak daha zengin bir sorgu oluştur
    let answerDetailsText = summary.answerDetails;
    if (detailedAnswers && Array.isArray(detailedAnswers) && detailedAnswers.length > 0) {
      answerDetailsText = detailedAnswers.map((answer: any) => 
        `Soru: ${answer.question}\nCevap: ${answer.answerText}`
      ).join('\n\n');
      
      console.log("Detaylı cevaplarla zenginleştirilmiş sorgu kullanılıyor:", answerDetailsText);
    }
    
    // İçgörüler için sistem talimatını hazırla - JSON dosyasından
    const systemPrompt = await getInsightsPromptForAuraType(auraType, answerDetailsText);
    
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
    
    // API isteği gönder - yeniden deneme ve kuyruk mekanizması olmadan direk istek
    const response = await axios.post<OpenAIResponse>(
          OPENAI_API_URL,
          {
            model: OPENAI_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 1500
          } as OpenAIRequestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
          }
        );
      
      const insightsText = response.data.choices[0].message.content.trim();
    let insights;
      
      try {
        // JSON olarak ayrıştır
      insights = JSON.parse(insightsText);
      } catch (parseError) {
        console.error('[OPENAI] JSON ayrıştırma hatası:', parseError);
        
      // Manuel ayrıştırma
        const strengthsMatch = insightsText.match(/GÜÇLÜ (YÖNLER|YÖNLERİ|YANLAR|YANLARI)\s*:(.+?)(?=POTANSİYEL|DÜŞÜNME|BAŞLIK|$)/i);
        const potentialMatch = insightsText.match(/POTANSİYEL\s*:(.+?)(?=DÜŞÜNME|BAŞLIK|ÇALIŞMA|$)/i);
        const thinkingMatch = insightsText.match(/((DÜŞÜNME|ÇALIŞMA) STİLİ|RUH HALİ TEPKİSİ|YAKLAŞIM|YÖNTEM)\s*:(.+?)(?=BAŞLIK|AURA|$)/i);
        const titleMatch = insightsText.match(/(AURA|RUH HALİ|GELİŞİM|KARİYER) BAŞLIĞI\s*:(.+?)(?=$)/i);
        
      insights = {
        strengths: strengthsMatch ? strengthsMatch[2].trim() : "",
        potential: potentialMatch ? potentialMatch[1].trim() : "",
        thinkingStyle: thinkingMatch ? (thinkingMatch[3] || thinkingMatch[1]).trim() : "",
        auraTitle: titleMatch ? titleMatch[2].trim() : `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
      };
    }
    
    // Önbelleğe kaydet
    setCachedData(cacheKey, insights, inputHash);
    
    return { ...insights, source: 'openai' };
  } catch (error: any) {
    console.error('[OPENAI] İçgörüler alınırken hata oluştu:', error);
    
    // Hata durumunda yukarı ilet
    throw error;
  }
};

// Tüm aura verilerini tek bir API çağrısıyla almak için optimizasyon
export const getCombinedAuraDataFromOpenAI = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string }
): Promise<AuraServiceResponse> => {
  // API anahtarı kontrolü
  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
    console.error('[OPENAI] API anahtarı bulunamadı veya boş! .env dosyasındaki OPENAI_API_KEY değişkenini kontrol edin.');
    throw new Error('OpenAI API anahtarı bulunamadı');
  }

  try {
    // Cevapların özetini al
    const summary = getAnswerSummary(answers);
    
    // Önbellek için anahtar oluştur
    const cacheKey = createCacheKey('openai', 'combined', auraType, summary.answerPattern);
    
    // İstek için giriş verilerinden bir hash oluştur
    const inputData = {
      auraType,
      username,
      answerPattern: summary.answerPattern
    };
    const inputHash = createInputHash(inputData);
    
    // Önbellekte kontrol et ve süresi dolmamışsa kullan
    const cachedItem = getCachedData<AuraServiceResponse>(cacheKey);
    if (cachedItem && !isCacheExpired(cachedItem.timestamp, CACHE_EXPIRY_TIME) && cachedItem.hash === inputHash) {
      console.log('[OPENAI] Birleştirilmiş veri önbellekten alındı:', cacheKey);
      return { ...cachedItem.data, source: 'openai' as const };
    }
    
    // Birleştirilmiş içerik için mesajları hazırla - JSON dosyasından
    const combinedPrompt = await getCombinedPromptForAuraType(auraType, summary.answerDetails, username);
    const userMessage = `
Merhaba, ben ${username || 'bir kullanıcı'}. 
Aşağıdaki quiz cevaplarıma göre benim için bir ${auraType} Aura analizi yapar mısın?

Quiz Cevaplarım:
${summary.answerDetails}

Cevaplarıma göre baskın özelliğim "${summary.dominantTrait}", ikincil özelliğim "${summary.secondaryTrait}".
Lütfen bir hikaye ve içgörüler oluştur.
`;
    
    const messages = [
      { role: "system", content: combinedPrompt },
      { role: "user", content: userMessage }
    ];
    
    if (DEBUG_MODE) {
      console.log('');
      console.log('==== OPENAI API BİRLEŞTİRİLMİŞ İSTEK GÖNDERİLİYOR ====');
      console.log('[OPENAI] Aura tipi:', auraType);
      console.log('[OPENAI] API Key (maskelenmiş):', maskApiKey(OPENAI_API_KEY));
      console.log('[OPENAI] Sistem mesajı (ilk 100 karakter):', typeof messages[0].content === 'string' ? messages[0].content.substring(0, 100) + '...' : messages[0].content);
      console.log('====================================');
      console.log('');
    }
    
    // API isteği gönder - direk istek
    const response = await axios.post<OpenAIResponse>(
          OPENAI_API_URL,
          {
            model: OPENAI_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 2500 // Daha büyük bir yanıt için
          } as OpenAIRequestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
          }
        );
    
    const responseText = response.data.choices[0].message.content;
      
    // Yanıtı tam olarak logla
    console.log('[OPENAI] Tam yanıt metni:\n', responseText);
    console.log('[OPENAI] Yanıt uzunluğu:', responseText.length, 'karakter');
    
    let parsedData;
    
    try {
      // İlk olarak yanıtın JSON olarak ayrıştırılabilir olup olmadığını kontrol et
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
        parsedData = JSON.parse(jsonMatch[0]);
        console.log('[OPENAI] Yanıt başarıyla JSON olarak ayrıştırıldı');
          // Burada başarılı bir şekilde JSON ayrıştırıldıysa, diğer işlemlere geçmeyin
        } catch (innerJsonError) {
          console.log('[OPENAI] JSON içeriği geçersiz, Markdown ayrıştırma deneniyor');
          // JSON ayrıştırma başarısız oldu, bu durumda Markdown ayrıştırmaya devam edin
          parsedData = null;
        }
      }
      
      // Eğer JSON ayrıştırma başarısız olduysa veya yanıt JSON formatında değilse
      if (!parsedData) {
        console.log('[OPENAI] JSON formatında veri bulunamadı, Markdown ayrıştırma yapılıyor');
        
        // Markdown formatını ayrıştıran daha gelişmiş fonksiyon
        function parseMarkdownSections(text: string) {
          // Önce bütün markdown bölümlerini bul
          const sections: Record<string, string> = {};
          
          // Başlık için - hem "### Aura Başlığı:" hem de "**Title**" formatını yakala
          const titleMatch = text.match(/###\s*Aura Başlığı:?\s*\*\*(.*?)\*\*/i);
          if (titleMatch) {
            sections.auraTitle = titleMatch[1].trim();
          }
          
          // Hikaye bölümünü bul ("#### Aura Hikayesi" ile başlayan ve sonraki başlığa kadar olan kısım)
          const storySection = text.match(/####\s*Aura Hikayesi.*?\n([\s\S]*?)(?=####|$)/i);
          if (storySection) {
            sections.story = storySection[1].trim();
          }
          
          // Güçlü Yönler bölümünü bul
          const strengthsSection = text.match(/####\s*Güçlü Yönler.*?\n([\s\S]*?)(?=####|$)/i);
          if (strengthsSection) {
            sections.strengths = strengthsSection[1].trim();
          }
          
          // Potansiyel Gelişim Alanları bölümünü bul
          const potentialSection = text.match(/####\s*Potansiyel Gelişim Alanları.*?\n([\s\S]*?)(?=####|$)/i);
          if (potentialSection) {
            sections.potential = potentialSection[1].trim();
          }
          
          // Düşünce Yaklaşımı / Düşünme Stili bölümünü bul
          const thinkingSection = text.match(/####\s*(Düşünce Yaklaşımı|Düşünme Stili|Düşünce Tarzı).*?\n([\s\S]*?)(?=####|$)/i);
          if (thinkingSection) {
            sections.thinkingStyle = thinkingSection[2].trim();
            console.log('[OPENAI] Düşünme stili bölümü başarıyla bulundu:', thinkingSection[2].substring(0, 50) + '...');
          }
          
          // Emoji içeren başlıkları da kontrol et (örn: 🧠 Düşünme Tarzın)
          if (!sections.thinkingStyle) {
            // Düşünme stili bölümü için daha spesifik ve kapsamlı ayrıştırma
            const emojiThinkingSection = text.match(/(?:🧠|🤔)\s*(?:Düşünme Tarzın|Düşünme Stilin|Yaklaşımın).*?(?:\n|\r\n)([\s\S]*?)(?=(?:🌟|💡|🚀|📖|🤖|$))/i);
            if (emojiThinkingSection && emojiThinkingSection[1]) {
              // "Daha Fazla Göster" gibi UI elemanlarını temizle
              let content = emojiThinkingSection[1].trim();
              content = content.replace(/Daha Fazla Göster/g, '').trim();
              content = content.replace(/\[Daha Fazla\]/g, '').trim();
              
              if (content) {
                sections.thinkingStyle = content;
                console.log('[OPENAI] Düşünme stili emoji başlıklı bölümden bulundu:', content.substring(0, 50) + '...');
              }
            }
          }
          
          // Eğer standart ifade Düşünme Stilini bulamadıysa ve son bölüm olabilir
          if (!sections.thinkingStyle) {
            // Dosyanın sonuna kadar olan metni kontrol et
            const lastSectionMatch = text.match(/(?:Düşünme Tarzın|Düşünme Stilin|Yaklaşımın).*?(?:\n|\r\n)([\s\S]*?)$/i);
            if (lastSectionMatch) {
              sections.thinkingStyle = lastSectionMatch[1].trim();
            }
          }
          
          // Hiçbir bölüm bulunamadıysa
          if (Object.keys(sections).length === 0) {
            console.log("[OPENAI] Markdown formatı ayrıştırılamadı, alternatif yöntem deneniyor");
            
            // Eski regex yöntemini de deneyelim
            const storyMatch = text.match(/(?:AURA HİKAYEN|HİKAYE|📖):[\s\n]*([\s\S]*?)(?=[\s\n]*GÜÇLÜ YÖNLERİ:|GÜÇLÜ YÖNLER:|GÜÇLÜ YÖN:|🌟|$)/i);
            const strengthsMatch = text.match(/(?:GÜÇLÜ YÖNLERİ|GÜÇLÜ YÖNLER|GÜÇLÜ YÖN|🌟):[\s\n]*([\s\S]*?)(?=[\s\n]*POTANSİYELİ:|POTANSİYEL:|🚀|$)/i);
            const potentialMatch = text.match(/(?:POTANSİYELİ|POTANSİYEL|🚀):[\s\n]*([\s\S]*?)(?=[\s\n]*DÜŞÜNME STİLİ:|DÜŞÜNCE STİLİ:|YAKLAŞIM:|🧠|🤔|$)/i);
            const thinkingStyleMatch = text.match(/(?:DÜŞÜNME STİLİ|DÜŞÜNCE STİLİ|YAKLAŞIM|DÜŞÜNME TARZIN|🧠|🤔):[\s\n]*([\s\S]*?)(?=[\s\n]*AURA BAŞLIĞI:|BAŞLIK:|$)/i);
            const auraTitleMatch = text.match(/(?:AURA BAŞLIĞI|BAŞLIK):[\s\n]*([\s\S]*?)(?=[\s\n]|$)/i);
            
            // Eğer düşünme stili bulunamadıysa ve son bölüm olabilir
            if (!thinkingStyleMatch) {
              const lastThinkingMatch = text.match(/(?:DÜŞÜNME STİLİ|DÜŞÜNCE STİLİ|YAKLAŞIM|DÜŞÜNME TARZIN|🧠|🤔):[\s\n]*([\s\S]*)$/i);
              if (lastThinkingMatch && lastThinkingMatch[1]) {
                let content = lastThinkingMatch[1].trim();
                content = content.replace(/Daha Fazla Göster/g, '').trim();
                content = content.replace(/\[Daha Fazla\]/g, '').trim();
                
                if (content) {
                  sections.thinkingStyle = content;
                  console.log('[OPENAI] Düşünme stili son bölüm olarak bulundu:', content.substring(0, 50) + '...');
                }
              }
            } else if (thinkingStyleMatch && thinkingStyleMatch[1]) {
              let content = thinkingStyleMatch[1].trim();
              content = content.replace(/Daha Fazla Göster/g, '').trim();
              content = content.replace(/\[Daha Fazla\]/g, '').trim();
              
              if (content) {
                sections.thinkingStyle = content;
                console.log('[OPENAI] Düşünme stili regex ile bulundu:', content.substring(0, 50) + '...');
              }
            }
            
            if (storyMatch) sections.story = storyMatch[1].trim();
            if (strengthsMatch) sections.strengths = strengthsMatch[1].trim();
            if (potentialMatch) sections.potential = potentialMatch[1].trim();
            if (auraTitleMatch) sections.auraTitle = auraTitleMatch[1].trim();
          }
          
          return sections;
        }
        
        // Yanıt metninin ilk ve son kısmını loglayalım (debug için)
        console.log("[OPENAI] Yanıt metni (ilk 100 karakter):", responseText.substring(0, 100));
        console.log("[OPENAI] Yanıt metni (son 100 karakter):", responseText.substring(Math.max(0, responseText.length - 100)));
        
        // Markdown ayrıştırma
        const parsedSections = parseMarkdownSections(responseText);
        
        // Debug amaçlı
        console.log("[OPENAI] Ayrıştırma sonuçları:", {
          hasTitleSection: !!parsedSections.auraTitle,
          hasStorySection: !!parsedSections.story,
          hasStrengthsSection: !!parsedSections.strengths,
          hasPotentialSection: !!parsedSections.potential,
          hasThinkingSection: !!parsedSections.thinkingStyle
        });
        
        // Hiçbir bölüm bulunamadıysa, tüm metni hikaye olarak kullan
        if (Object.keys(parsedSections).filter(key => !!parsedSections[key]).length === 0) {
          console.log("[OPENAI] Hiçbir ayrıştırma başarılı olmadı. Tüm metni hikaye olarak kullanıyorum.");
          
          parsedData = {
            story: responseText.trim(),
            strengths: "",
            potential: "",
            thinkingStyle: "",
            auraTitle: `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
          };
        } else {
          // Ayrıştırılmış bölümleri kullan
          parsedData = {
            story: parsedSections.story || "",
            strengths: parsedSections.strengths || "",
            potential: parsedSections.potential || "",
            thinkingStyle: parsedSections.thinkingStyle || "",
            auraTitle: parsedSections.auraTitle || `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
          };
        }
      }
    } catch (error) {
      console.error('[OPENAI] Yanıt analizi sırasında beklenmeyen hata:', error);
      
      // Hata durumunda varsayılan değerler kullan
      parsedData = {
        story: "Yanıt ayrıştırma hatası oluştu. Lütfen daha sonra tekrar deneyin.",
        strengths: "",
        potential: "",
        thinkingStyle: "",
        auraTitle: `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
      };
    }
    
    // Eksik alanları kontrol et
    const result = {
      story: parsedData.story || "",
      strengths: parsedData.strengths || "",
      potential: parsedData.potential || "",
      thinkingStyle: parsedData.thinkingStyle || "",
      auraTitle: parsedData.auraTitle || `${auraType}`,
      source: 'openai' as const
    };
    
    // Önbelleğe kaydet
    setCachedData(cacheKey, result, inputHash);
    
    console.log('[OPENAI] Birleştirilmiş veri başarıyla oluşturuldu ve önbelleğe kaydedildi');
    
    return result;
  } catch (error) {
    console.error('[OPENAI] Birleştirilmiş veri oluşturma hatası:', error);
    throw error; // Hatayı yukarı ilet
  }
}; 