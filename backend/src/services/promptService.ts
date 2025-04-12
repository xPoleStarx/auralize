// Farklı aura tipleri için promptları sağlayan servis
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Dosya okuma için promisify fonksiyonu
const readFile = promisify(fs.readFile);

// Prompt cache - performansı artırmak için
const promptCache: { [key: string]: any } = {};

/**
 * Belirli bir quiz tipi için prompt JSON dosyasını yükler
 */
async function loadPromptFile(quizType: string): Promise<any> {
  // Önbellekte kontrol et
  const cacheKey = `prompt_${quizType}`;
  if (promptCache[cacheKey]) {
    return promptCache[cacheKey];
  }
  
  try {
    // Frontend'deki prompt dosyalarını kullan
    const promptFilePath = path.join(process.cwd(), '..', 'frontend', 'src', 'data', 'prompts', `${quizType}Prompts.json`);
    console.log(`[PROMPT-SERVICE] Prompt dosyası yükleniyor: ${promptFilePath}`);
    
    const data = await readFile(promptFilePath, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Önbelleğe kaydet
    promptCache[cacheKey] = parsedData;
    return parsedData;
  } catch (error) {
    console.error(`Prompt dosyası yüklenirken hata: ${quizType}`, error);
    // Dosya bulunamazsa veya okunamazsa boş bir obje döndür
    return {};
  }
}

/**
 * Quiz tipinin geçerli olup olmadığını kontrol eder
 */
function getValidQuizType(auraType: string): string {
  // Türkçe tipleri İngilizce karşılıklarına dönüştür
  const typeMap: Record<string, string> = {
    'yaratıcı': 'creative',
    'ruhsal': 'mood',
    'kişisel': 'personal',
    'kariyer': 'career'
  };
  
  // Eğer tip haritada varsa İngilizce karşılığını kullan, yoksa olduğu gibi kullan
  const normalizedType = typeMap[auraType] || auraType;
  
  // Sadece bilinen quiz tiplerini kabul et
  const validTypes = ['creative', 'mood', 'personal', 'career'];
  return validTypes.includes(normalizedType) ? normalizedType : 'creative';
}

/**
 * Belirli bir aura tipi için sistem talimatı hazırlar
 */
export async function getSystemPromptForAuraType(auraType: string, answerDetails: string): Promise<string> {
  const quizType = getValidQuizType(auraType);
  try {
    const promptData = await loadPromptFile(quizType);
    
    if (promptData && promptData.systemPrompt) {
      // JSON'daki prompt'u kullan ve cevap detaylarını ekle
      return promptData.systemPrompt.replace('{answerDetails}', answerDetails);
    }
  } catch (error) {
    console.error(`Sistem prompt yüklenirken hata: ${quizType}`, error);
  }
  
  // Fallback: Dosyadan yüklenemezse varsayılan prompt'u kullan
      return `Sen Auralize adlı platformun içerik uzmanısın. Kullanıcının verdiği yanıtlara göre
kişiselleştirilmiş bir hikaye oluşturacaksın.

Kullanıcının cevapları:

${answerDetails}

Bu yanıtlara dayanarak, kullanıcı için kişiselleştirilmiş, detaylı ve içgörü dolu bir hikaye hazırla.`;
}

/**
 * İçgörüler için sistem talimatı hazırlar
 */
export async function getInsightsPromptForAuraType(auraType: string, answerDetails: string): Promise<string> {
  const quizType = getValidQuizType(auraType);
  try {
    const promptData = await loadPromptFile(quizType);
    
    if (promptData && promptData.insightsPrompt) {
      // JSON'daki prompt'u kullan ve cevap detaylarını ekle
      return promptData.insightsPrompt.replace('{answerDetails}', answerDetails);
    }
  } catch (error) {
    console.error(`İçgörü prompt yüklenirken hata: ${quizType}`, error);
  }
  
  // Fallback: Dosyadan yüklenemezse varsayılan prompt'u kullan
      return `Sen Auralize adlı platformun içgörü uzmanısın. Kullanıcının verdiği yanıtlara göre
kişiselleştirilmiş içgörüler üreteceksin.

Kullanıcının cevapları:

${answerDetails}

Bu yanıtlara dayanarak, kullanıcı hakkında dört spesifik içgörü üret:
1. GÜÇLÜ YÖNLERİ: Kullanıcının en güçlü yanları. (1 paragraf)
2. POTANSİYELİ: Kullanıcının keşfedebileceği potansiyel alanlar. (1 paragraf)
3. DÜŞÜNME STİLİ: Kullanıcının düşünme ve problem çözme yaklaşımı. (1 paragraf)
4. AURA BAŞLIĞI: Kullanıcıyı en iyi tanımlayan 3-5 kelimelik özgün bir başlık.

Yanıtın JSON formatında olmalı.`;
}

/**
 * Birleştirilmiş içerik için sistem talimatı hazırlar
 */
export async function getCombinedPromptForAuraType(auraType: string, answerDetails: string, username: string): Promise<string> {
  const quizType = getValidQuizType(auraType);
  try {
    const promptData = await loadPromptFile(quizType);
    
    if (promptData && promptData.combinedPrompt) {
      // JSON'daki prompt'u kullan ve cevap detaylarını ekle
      let prompt = promptData.combinedPrompt.replace('{answerDetails}', answerDetails);
      // Kullanıcı adını da ekle
      prompt = prompt.replace('{username}', username || 'Kullanıcı');
      
      // Düşünme tarzının mutlaka doldurulması için ek bir uyarı ekleyelim
      prompt += "\n\nÇOK ÖNEMLİ: Düşünme Stili (thinkingStyle) bölümünü KESİNLİKLE doldurunuz. Bu bölüm olmadan yanıtınız tamamlanmış sayılmaz. Bu bölüm '#### Düşünme Stili' başlığı altında, kişinin düşünce yapısını ve problem çözme yaklaşımını detaylı olarak açıklamalıdır. En az bir paragraf (3-4 cümle) uzunluğunda olmalıdır.";
      
      return prompt;
    }
  } catch (error) {
    console.error(`Birleştirilmiş prompt yüklenirken hata: ${quizType}`, error);
  }
  
  // Fallback: Dosyadan yüklenemezse varsayılan prompt'u kullan
      return `Sen Auralize adlı platformun içerik uzmanısın. Kullanıcının verdiği yanıtlara göre
kişiselleştirilmiş bir hikaye ve içgörüler oluşturacaksın.

Kullanıcının cevapları:

${answerDetails}

Bu yanıtlara dayanarak, ${username || 'Kullanıcı'} için aşağıdaki bilgileri JSON formatında hazırla:
1. HİKAYE: Kullanıcının aurasını analiz eden kişiselleştirilmiş bir öykü.
2. GÜÇLÜ YÖNLERİ: Kullanıcının en güçlü yanları
3. POTANSİYELİ: Kullanıcının keşfedebileceği potansiyel alanlar
4. DÜŞÜNME STİLİ: Kullanıcının düşünme ve problem çözme yaklaşımı (bu bölümü MUTLAKA doldur)
5. AURA BAŞLIĞI: Kullanıcıyı en iyi tanımlayan özgün bir başlık

Yanıtını JSON formatında ver.`;
} 