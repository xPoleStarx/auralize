import axios from 'axios';
import { AuraContentService, AuraServiceResponse, AnswerSummary } from '../types/auraTypes';
import { getAnswerSummary } from '../utils/answerAnalyzer';
import { getSystemPromptForAuraType, getInsightsPromptForAuraType, getCombinedPromptForAuraType } from './promptService';
import {
  getCachedData,
  setCachedData,
  createInputHash,
  withRetry,
  apiRequestQueue,
  maskApiKey
} from '../utils/apiRequestOptimizer';

// DeepSeek API için tip tanımlamaları
interface DeepSeekRequestBody {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface DeepSeekResponse {
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

// DeepSeek API'sına istek gönderecek servis sabitleri
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 saat (milisaniye cinsinden)

// Debug modunu açalım ki console.log'larla takip edebilelim
const DEBUG_MODE = true;

// Bellek içi önbellek nesnesi
const memoryCache: { [key: string]: string } = {};

// Önbellek anahtarı oluşturma fonksiyonu (daha belirleyici)
const createCacheKey = (operationType: string, auraType: string, answerPattern: string): string => {
  return `auralize_deepseek_${operationType}_${auraType}_${answerPattern}`;
};

// Önbellekteki verilerin süresi dolmuş mu kontrol et
const isCacheExpired = (timestamp: number, expiryTimeInMilliseconds: number): boolean => {
  const currentTime = Date.now();
  return currentTime - timestamp > expiryTimeInMilliseconds;
};

/**
 * DeepSeek servisi sınıfı
 * Bu servis, metin üretimi için DeepSeek API'sini kullanır
 */
export class DeepSeekService implements AuraContentService {
  // API anahtarı kontrolü
  private isApiAvailable(): boolean {
    return DEEPSEEK_API_KEY !== '';
  }

  // DeepSeek API için mesaj oluşturma fonksiyonu
  private prepareMessagesForDeepSeek(auraType: string, username: string, answers: { [key: number]: string }): any[] {
    // Cevapların detaylı analizini yap
    const answerSummary = getAnswerSummary(answers || {});
    
    // Aura tipine göre sistem talimatını hazırla
    const systemPrompt = getSystemPromptForAuraType(auraType, answerSummary.answerDetails);
    
    // Kullanıcı mesajı oluşturma
    const userMessage = `
Merhaba, ben ${username || 'bir kullanıcı'}. 
Aşağıdaki quiz cevaplarıma göre benim için bir ${auraType} Aura hikayesi yazar mısın?

Quiz Cevaplarım:
${answerSummary.answerDetails}

Cevaplarıma göre baskın özelliğim "${answerSummary.dominantTrait}", ikincil özelliğim "${answerSummary.secondaryTrait}".

Lütfen benim için türkçe olarak, içten, derin, anlamlı ve kişiselleştirilmiş bir aura hikayesi yaz. 
Hikaye ruhsal bir yolculuğu ifade etmeli ancak gerçekçi ve uygulanabilir içgörüler de sunmalı.
Hikaye en az 4-6 paragraf uzunluğunda, detaylı ve kapsamlı olmalı.
`;
    
    // Mesajları oluştur
    return [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];
  }

  // İçgörüler için mesaj hazırlama fonksiyonu
  private prepareInsightsMessagesForDeepSeek(auraType: string, username: string, answers: any, detailedAnswers?: any): any[] {
    // Cevapları özetle
    const answerSummary = getAnswerSummary(answers);
    
    // Detaylı cevapları kullanarak daha zengin bir sorgu oluştur
    let answerDetailsText = answerSummary.answerDetails;
    if (detailedAnswers && Array.isArray(detailedAnswers) && detailedAnswers.length > 0) {
      answerDetailsText = detailedAnswers.map((answer: any) => 
        `Soru: ${answer.question}\nCevap: ${answer.answerText}`
      ).join('\n\n');
    }
    
    // Aura tipine göre sistem talimatını hazırla
    const systemPrompt = getInsightsPromptForAuraType(auraType, answerDetailsText);
    
    return [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `Merhaba, ben ${username}. Test sonuçlarıma göre içgörüleri hazırlar mısın?`
      }
    ];
  }

  // Birleşik veri için mesaj hazırlama fonksiyonu
  private prepareCombinedMessagesForDeepSeek(auraType: string, username: string, answers: any): any[] {
    // Cevapları özetle
    const answerSummary = getAnswerSummary(answers);
    
    // Birleştirilmiş veri için prompt
    const combinedPrompt = getCombinedPromptForAuraType(auraType, answerSummary.answerDetails, username);
    
    return [
      {
        role: "system",
        content: combinedPrompt
      },
      {
        role: "user",
        content: `Merhaba, ben ${username}. Test sonuçlarıma göre aura hikayemi ve içgörülerimi tek seferde hazırlar mısın?`
      }
    ];
  }

  // DeepSeek API'sine istek gönderme fonksiyonu
  private async callDeepSeekApi(messages: any[], maxTokens: number = 1500): Promise<string> {
    if (!this.isApiAvailable()) {
      console.warn('[DEEPSEEK] API anahtarı bulunamadı');
      throw new Error('DeepSeek API anahtarı bulunamadı');
    }
    
    try {
      if (DEBUG_MODE) {
        console.log('[DEEPSEEK] API isteği gönderiliyor...');
        console.log('[DEEPSEEK] API URL:', DEEPSEEK_API_URL);
        console.log('[DEEPSEEK] Model:', DEEPSEEK_MODEL);
        console.log('[DEEPSEEK] API Key (ilk 5 karakter):', DEEPSEEK_API_KEY.substring(0, 5));
        console.log('[DEEPSEEK] İstek Gövdesi Hazır');
      }
      
      const response = await axios.post<DeepSeekResponse>(
        DEEPSEEK_API_URL,
        {
          model: DEEPSEEK_MODEL,
          messages: messages,
          temperature: 0.7,
          max_tokens: maxTokens,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          timeout: 120000 // 2 dakika
        }
      );
      
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('API yanıtı boş veya geçersiz');
      }
      
      if (DEBUG_MODE) {
        console.log('[DEEPSEEK] API yanıtı alındı, uzunluk:', content.length);
      }
      
      return content;
    } catch (error: any) {
      console.error('[DEEPSEEK] API çağrısı başarısız:', error);
      if (error.response) {
        console.error('[DEEPSEEK] API hata detayları:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  }

  /**
   * DeepSeek API'sini kullanarak aura hikayesi oluşturur
   */
  async getAuraStory(auraType: string, username: string, answers: { [key: number]: string }): Promise<string> {
    console.log('[DEEPSEEK] getAuraStory çağrıldı', { auraType, username });
    
    try {
      // API kontrolü
      if (!this.isApiAvailable()) {
        return "DeepSeek API anahtarı bulunamadı. Lütfen .env dosyasında DEEPSEEK_API_KEY değişkenini ayarlayın.";
      }
      
      // Cevaplardan özet çıkar
      const answerSummary = getAnswerSummary(answers);
      
      // Cache için anahtar oluştur
      const cacheKey = createCacheKey('story', auraType, answerSummary.answerPattern);
      
      // Önbellekte bu aurayı daha önce oluşturup oluşturmadığımızı kontrol et
      const cachedData = memoryCache[cacheKey];
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (!isCacheExpired(parsedData.timestamp, CACHE_EXPIRY_TIME)) {
            console.log('[DEEPSEEK] Hikaye önbellekten alındı:', cacheKey);
            return parsedData.story;
          } else {
            console.log('[DEEPSEEK] Önbellekteki veri süresi dolmuş, yeni istek gönderiliyor');
          }
        } catch (error) {
          console.error('[DEEPSEEK] Önbellek verisi ayrıştırma hatası:', error);
        }
      }
      
      // DeepSeek mesajlarını hazırla
      const messages = this.prepareMessagesForDeepSeek(auraType, username, answers);
      
      // DeepSeek API'sine istek gönder
      const storyContent = await this.callDeepSeekApi(messages, 2000);
      
      // Hikayeyi önbelleğe kaydet
      memoryCache[cacheKey] = JSON.stringify({
        story: storyContent,
        timestamp: Date.now()
      });
      
      console.log('[DEEPSEEK] Hikaye başarıyla oluşturuldu ve önbelleğe kaydedildi');
      
      return storyContent;
    } catch (error) {
      console.error('[DEEPSEEK] Hikaye oluşturma hatası:', error);
      return "DeepSeek API hatası oluştu. Lütfen daha sonra tekrar deneyin.";
    }
  }

  /**
   * DeepSeek API'sini kullanarak aura içgörüleri oluşturur
   */
  async getAuraInsights(
    auraType: string, 
    username: string, 
    answers: { [key: number]: string },
    detailedAnswers?: any
  ): Promise<{
    strengths: string,
    potential: string,
    thinkingStyle: string,
    auraTitle: string,
    source: string
  }> {
    console.log('[DEEPSEEK] getAuraInsights çağrıldı', { auraType, username });
    
    try {
      // API kontrolü
      if (!this.isApiAvailable()) {
        console.log('[DEEPSEEK] API anahtarı bulunamadı, varsayılan içgörüler kullanılıyor.');
        return {
          strengths: "Analitik düşünme, detaylara dikkat",
          potential: "Yaratıcı problem çözme, farklı bakış açıları geliştirme",
          thinkingStyle: "Sistematik ve analitik düşünme", 
          auraTitle: `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`,
          source: 'default'
        };
      }
      
      // Önbellek için anahtar oluştur
      const answerSummary = getAnswerSummary(answers);
      const cacheKey = createCacheKey('insights', auraType, answerSummary.answerPattern);
      
      // Önbellekte bu içgörüleri daha önce oluşturup oluşturmadığımızı kontrol et
      const cachedData = memoryCache[cacheKey];
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (!isCacheExpired(parsedData.timestamp, CACHE_EXPIRY_TIME)) {
            console.log('[DEEPSEEK] İçgörüler önbellekten alındı:', cacheKey);
            return { ...parsedData.data, source: 'deepseek' };
          } else {
            console.log('[DEEPSEEK] Önbellekteki veri süresi dolmuş, yeni istek gönderiliyor');
          }
        } catch (error) {
          console.error('[DEEPSEEK] Önbellek verisi ayrıştırma hatası:', error);
        }
      }
      
      // İçgörü mesajlarını hazırla
      const messages = this.prepareInsightsMessagesForDeepSeek(auraType, username, answers, detailedAnswers);
      
      // DeepSeek API'sine istek gönder
      const insightsText = await this.callDeepSeekApi(messages, 800);
      
      // Yanıttan içgörüleri çıkar
      const strengthsMatch = insightsText.match(/GÜÇLÜ YÖNLER\s*:([\s\S]*?)(?=POTANSİYEL|$)/i);
      const potentialMatch = insightsText.match(/POTANSİYEL\s*:([\s\S]*?)(?=DÜŞÜNME STİLİ|$)/i);
      const thinkingMatch = insightsText.match(/DÜŞÜNME STİLİ\s*:([\s\S]*?)(?=BAŞLIK|$)/i);
      const titleMatch = insightsText.match(/BAŞLIK\s*:([\s\S]*?)(?=$)/i);
      
      const insights = {
        strengths: strengthsMatch ? strengthsMatch[1].trim() : "Analitik düşünme, detaylara dikkat",
        potential: potentialMatch ? potentialMatch[1].trim() : "Yaratıcı problem çözme, farklı bakış açıları geliştirme",
        thinkingStyle: thinkingMatch ? thinkingMatch[1].trim() : "Sistematik ve analitik düşünme",
        auraTitle: titleMatch ? titleMatch[1].trim() : `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`,
        source: 'deepseek' as const
      };
      
      // Önbelleğe kaydet
      memoryCache[cacheKey] = JSON.stringify({
        data: insights,
        timestamp: Date.now()
      });
      
      console.log('[DEEPSEEK] İçgörüler başarıyla oluşturuldu ve önbelleğe kaydedildi');
      
      return insights;
    } catch (error) {
      console.error('[DEEPSEEK] İçgörü oluşturma hatası:', error);
      
      // Hata durumunda varsayılan bir içgörü döndür
      return {
        strengths: "Analitik düşünme, detaylara dikkat",
        potential: "Yaratıcı problem çözme, farklı bakış açıları geliştirme",
        thinkingStyle: "Sistematik ve analitik düşünme", 
        auraTitle: `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`,
        source: 'default'
      };
    }
  }

  /**
   * DeepSeek API'sini kullanarak birleştirilmiş aura verileri oluşturur (hikaye ve içgörüler)
   */
  async getCombinedAuraData(
    auraType: string,
    username: string,
    answers: { [key: number]: string }
  ): Promise<AuraServiceResponse> {
    console.log('[DEEPSEEK] getCombinedAuraData çağrıldı', { auraType, username });
    
    try {
      // API kontrolü
      if (!this.isApiAvailable()) {
        console.log('[DEEPSEEK] API anahtarı bulunamadı, varsayılan veriler kullanılıyor.');
        return {
          story: "DeepSeek API anahtarı bulunamadı. Lütfen .env dosyasında DEEPSEEK_API_KEY değişkenini ayarlayın.",
          strengths: "Analitik düşünme, detaylara dikkat",
          potential: "Yaratıcı problem çözme, farklı bakış açıları geliştirme",
          thinkingStyle: "Sistematik ve analitik düşünme",
          auraTitle: `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`,
          source: 'default'
        };
      }
      
      // Önbellek için anahtar oluştur
      const answerSummary = getAnswerSummary(answers);
      const cacheKey = createCacheKey('combined', auraType, answerSummary.answerPattern);
      
      // Önbellekte bu veriyi daha önce oluşturup oluşturmadığımızı kontrol et
      const cachedData = memoryCache[cacheKey];
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (!isCacheExpired(parsedData.timestamp, CACHE_EXPIRY_TIME)) {
            console.log('[DEEPSEEK] Birleştirilmiş veri önbellekten alındı:', cacheKey);
            return { ...parsedData.data, source: 'deepseek' };
          } else {
            console.log('[DEEPSEEK] Önbellekteki veri süresi dolmuş, yeni istek gönderiliyor');
          }
        } catch (error) {
          console.error('[DEEPSEEK] Önbellek verisi ayrıştırma hatası:', error);
        }
      }
      
      // Birleştirilmiş içerik için mesajları hazırla
      const messages = this.prepareCombinedMessagesForDeepSeek(auraType, username, answers);
      
      // DeepSeek API'sine istek gönder
      const responseText = await this.callDeepSeekApi(messages, 2500);
      
      let parsedData;
      
      try {
        // İlk olarak yanıtın JSON olarak ayrıştırılabilir olup olmadığını kontrol et
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
          console.log('[DEEPSEEK] Yanıt başarıyla JSON olarak ayrıştırıldı');
        } else {
          throw new Error('JSON formatında veri bulunamadı');
        }
      } catch (jsonError) {
        console.log('[DEEPSEEK] JSON ayrıştırma hatası, manuel ayrıştırma yapılıyor');
        
        // JSON ayrıştırmada hata olduysa manuel olarak ayıkla
        const storyMatch = responseText.match(/AURA HİKAYEN:[\s\n]*([\s\S]*?)(?=[\s\n]*GÜÇLÜ YÖNLERİ:|$)/i);
        const strengthsMatch = responseText.match(/GÜÇLÜ YÖNLERİ:[\s\n]*([\s\S]*?)(?=[\s\n]*POTANSİYELİ:|$)/i);
        const potentialMatch = responseText.match(/POTANSİYELİ:[\s\n]*([\s\S]*?)(?=[\s\n]*DÜŞÜNME STİLİ:|$)/i);
        const thinkingStyleMatch = responseText.match(/DÜŞÜNME STİLİ:[\s\n]*([\s\S]*?)(?=[\s\n]*AURA BAŞLIĞI:|$)/i);
        const auraTitleMatch = responseText.match(/AURA BAŞLIĞI:[\s\n]*([\s\S]*?)(?=[\s\n]|$)/i);
        
        parsedData = {
          story: storyMatch ? storyMatch[1].trim() : "",
          strengths: strengthsMatch ? strengthsMatch[1].trim() : "",
          potential: potentialMatch ? potentialMatch[1].trim() : "", 
          thinkingStyle: thinkingStyleMatch ? thinkingStyleMatch[1].trim() : "",
          auraTitle: auraTitleMatch ? auraTitleMatch[1].trim() : `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
        };
      }
      
      // Eksik alanları varsayılan değerlerle doldur
      const result = {
        story: parsedData.story || "DeepSeek API yanıtında hikaye alanı bulunamadı.",
        strengths: parsedData.strengths || "Analitik düşünme, detaylara dikkat",
        potential: parsedData.potential || "Yaratıcı problem çözme, farklı bakış açıları geliştirme",
        thinkingStyle: parsedData.thinkingStyle || "Sistematik ve analitik düşünme",
        auraTitle: parsedData.auraTitle || `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`,
        source: 'deepseek' as const
      };
      
      // Önbelleğe kaydet
      memoryCache[cacheKey] = JSON.stringify({
        data: result,
        timestamp: Date.now()
      });
      
      console.log('[DEEPSEEK] Birleştirilmiş veri başarıyla oluşturuldu ve önbelleğe kaydedildi');
      
      return result;
    } catch (error) {
      console.error('[DEEPSEEK] Birleştirilmiş veri oluşturma hatası:', error);
      
      // Hata durumunda varsayılan bir yanıt döndür
      return {
        story: "DeepSeek API hatası nedeniyle hikaye oluşturulamadı. Lütfen daha sonra tekrar deneyin.",
        strengths: "Analitik düşünme, detaylara dikkat",
        potential: "Yaratıcı problem çözme, farklı bakış açıları geliştirme",
        thinkingStyle: "Sistematik ve analitik düşünme",
        auraTitle: `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`,
        source: 'default'
      };
    }
  }
}

// DeepSeek servisi singleton örneği
export const deepseekService = new DeepSeekService();

// Bu fonksiyonları açıkça dışa aktaralım (openaiService için)
export { 
  getSystemPromptForAuraType, 
  getInsightsPromptForAuraType,
  getCombinedPromptForAuraType,
  getAnswerSummary
};