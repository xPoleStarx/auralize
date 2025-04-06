import axios from 'axios';

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

// Hikaye önbelleği için tip
interface StoryCacheItem {
  story: string;
  timestamp: number;
  auraType: string;
}

// Cevaplanmış soruları özetleme fonksiyonu
interface AnswerSummary {
  answerCounts: { a: number; b: number; c: number; d: number };
  answerPattern: string;
  keyAnswers: string;
}

const getAnswerSummary = (answers: { [key: number]: string }): AnswerSummary => {
  // Her şık için sayıları hesapla
  const aCount = Object.values(answers).filter(val => val === 'a').length;
  const bCount = Object.values(answers).filter(val => val === 'b').length;
  const cCount = Object.values(answers).filter(val => val === 'c').length;
  const dCount = Object.values(answers).filter(val => val === 'd').length;
  
  // Önemli sorular (1, 5, 10, 15, 20 gibi dönüm noktası soruları)
  const keyQuestions = [1, 5, 10, 15, 20];
  const keyAnswers = keyQuestions
    .filter(q => answers[q])
    .map(q => `Soru ${q}: ${answers[q]}`)
    .join(', ');
  
  // Cevap eğilimini gösteren özet
  return {
    answerCounts: { a: aCount, b: bCount, c: cCount, d: dCount },
    answerPattern: `A${aCount}B${bCount}C${cCount}D${dCount}`,
    keyAnswers
  };
};

// DeepSeek API'sına istek gönderecek servis
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY || '';
const CACHE_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 1 hafta (milisaniye)

// Önbellek anahtarı oluşturma fonksiyonu
const createCacheKey = (auraType: string, answerPattern: string): string => {
  return `auralize_story_cache_${auraType}_${answerPattern}`;
};

// Llama API'sine istek gönderecek servis
const LLAMA_API_URL = 'http://localhost:11434/api/chat';

// Aura tipleri ve varsayılan açıklamaları
export const auraTypes = {
  'mor': {
    name: 'Mor',
    description: 'Mor aura enerjin, ruhsal bir yolculuğa çıktığını gösteriyor. Mor enerji, yüksek bilinci, maneviyatı ve içgörüyü temsil eder. Bu aura, dünya ile ruhsal dünya arasında bir köprü kurabilme yeteneğine sahip olduğunu gösterir. Yaratıcı ve sezgisel yeteneklerin oldukça güçlü. Hayalperest yapın ve estetik zevkin, sanatsal ifade biçimlerine olan ilgini artırıyor.'
  },
  'mavi': {
    name: 'Mavi',
    description: 'Mavi aura enerjin, derin bir iç huzur ve ifade yeteneğine sahip olduğunu gösteriyor. Mavi enerji, iletişim, kendini ifade etme ve iç huzuru temsil eder. Dürüstlük ve güvenilirlik senin en önemli değerlerin arasında. Duygularını ifade etmekte ustasın ve çevrene ilham veriyorsun. Analitik düşünce yapın, problem çözmede sana büyük avantaj sağlıyor.'
  },
  'yeşil': {
    name: 'Yeşil',
    description: 'Yeşil aura enerjin, iyileştirici ve dengeleyici bir güce sahip olduğunu gösteriyor. Yeşil enerji, büyüme, iyileşme ve dengeyi temsil eder. Doğa ile güçlü bir bağın var ve bu bağ sana dinginlik veriyor. Empati yeteneğin oldukça gelişmiş durumda. Şefkat ve anlayış, senin en belirgin özelliklerinden. Sosyal ilişkilerde denge kurmada ve çatışmaları çözmede oldukça yeteneklisin.'
  },
  'sarı': {
    name: 'Sarı',
    description: 'Sarı aura enerjin, zihinsel parlaklık ve özgüven dolu bir kişiliğe sahip olduğunu gösteriyor. Sarı enerji, zeka, neşe ve yaratıcılığı temsil eder. Analitik düşünce yapın ve problem çözme yeteneğin seni öne çıkarıyor. Merak duygun ve öğrenme açlığın, sürekli yeni bilgiler edinmeni sağlıyor. İyimser bakış açın, çevrendeki insanlara da olumlu enerji veriyor.'
  },
  'turuncu': {
    name: 'Turuncu',
    description: 'Turuncu aura enerjin, yaşam dolu ve yaratıcı bir ruha sahip olduğunu gösteriyor. Turuncu enerji, tutku, yaratıcılık ve canlılığı temsil eder. Hayata karşı enerjik ve maceracı bir yaklaşımın var. Risk almaktan çekinmiyor ve yeni deneyimlere açık bir yapıya sahipsin. Sosyal yanın oldukça gelişmiş durumda. Çevrende her zaman eğlence ve neşe ortamı yaratıyorsun.'
  },
  'kırmızı': {
    name: 'Kırmızı',
    description: 'Kırmızı aura enerjin, güçlü bir yaşam enerjisi ve tutkuya sahip olduğunu gösteriyor. Kırmızı enerji, güç, hayatta kalma ve tutkuyu temsil eder. Kararlı ve cesaretli yapın, zorluklarla yüzleşmekten kaçınmadığını gösteriyor. Liderlik özelliklerin ve inisiyatif alma yeteneğin oldukça gelişmiş. Hedeflerine ulaşma konusunda gösterdiğin kararlılık, hayatta başarılı olmanı sağlıyor.'
  }
};

// Aura tipine göre sistem talimatını hazırla
const getSystemPromptForAuraType = (auraType: string): string => {
  const basePrompt = `
Sen bir ruhsal rehber ve aura uzmanısın. Kullanıcının quiz cevaplarına dayanarak onun için 
kişiselleştirilmiş bir ${auraType} aura hikayesi oluşturacaksın.

${auraType} aura şu özellikleri içerir:
${auraTypes[auraType as keyof typeof auraTypes]?.description || 'Bu aura tipi hakkında özel bilgi yok.'}

Kullanıcının cevaplarına dayanarak, onun benzersiz kişiliğini yansıtan, içgörü dolu ve ilham verici bir aura hikayesi oluştur.
Hikaye şu bileşenleri içermeli:
1. Kullanıcının kişiliğine dair içgörüler
2. Ruhsal yolculuğuna dair sembolik bir anlatım
3. Güçlü yanları ve gelişim fırsatları
4. İçten, derin ve anlamlı bir ton

Hikaye akıcı, şiirsel ve kişiye özel olmalı. 8-12 paragraf arasında ve Türkçe dilinde olmalıdır.
`;

  return basePrompt;
};

// Llama API'sine istek gönderme fonksiyonu
export const getAuraStoryFromLlama = async (
  auraType: string,
  username: string,
  answers: any
): Promise<string> => {
  console.log('[LLAMA] getAuraStoryFromLlama çağrıldı', { auraType, username });
  
  try {
    // Llama istek gövdesi
    const messages = prepareMessagesForLlama(auraType, username, answers);
    
    // Llama istekleri için özelliştirilmiş temel URL
    const LLAMA_URL = 'http://localhost:11434/api/chat';
    
    console.log('');
    console.log('==== LLAMA API İSTEĞİ GÖNDERİLİYOR ====');
    console.log('[LLAMA] API URL:', LLAMA_URL);
    console.log('[LLAMA] Model:', 'llama3.1:latest');
    console.log('[LLAMA] İstek Gövdesi Hazır');
    console.log('====================================');
    console.log('');
    
    // Llama API'sine istek gönder - fetch yerine axios kullan
    try {
      console.log('[LLAMA] HTTP POST isteği başlatılıyor...');
      
      const response = await axios.post(
        LLAMA_URL,
        {
          model: 'llama3.1:latest',
          messages: messages,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('');
      console.log('==== LLAMA API YANITI ALINDI ====');
      console.log('[LLAMA] Yanıt durumu:', response.status);
      console.log('[LLAMA] Yanıt içeriği başarıyla alındı');
      console.log('====================================');
      console.log('');
      
      // Llama'dan yanıt olarak metin içeriğini çıkart
      let storyContent = '';
      
      if (response.data && response.data.message && response.data.message.content) {
        storyContent = response.data.message.content;
        console.log('[LLAMA] Yanıt içeriği (ilk 100 karakter):', storyContent.substring(0, 100) + '...');
      } else if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        // Alternatif API yanıt formatı
        storyContent = response.data.choices[0].message.content;
        console.log('[LLAMA] Alternatif yanıt formatı kullanıldı');
      } else if (response.data && response.data.content) {
        // Daha basit API yanıt formatı
        storyContent = response.data.content;
        console.log('[LLAMA] Basit yanıt formatı kullanıldı');
      } else {
        console.error('[LLAMA] Bilinmeyen API yanıt formatı:', response.data);
        return `__default__${auraTypes[auraType as keyof typeof auraTypes]?.description || 'Varsayılan aura hikayesi.'}`;
      }
      
      // Llama yanıtını işaretle ve döndür
      return `__llama__${storyContent.trim()}`;
    } catch (requestError: any) {
      console.error('');
      console.error('==== LLAMA API HATASI ====');
      console.error('[LLAMA] API isteği sırasında hata oluştu:', requestError.message);
      if (requestError.response) {
        console.error('[LLAMA] Hata yanıtı:', {
          status: requestError.response.status,
          data: requestError.response.data
        });
      } else if (requestError.request) {
        console.error('[LLAMA] Yanıt alınamadı. Ollama servisi çalışıyor mu?');
        console.error('[LLAMA] Ollama servisi terminalden "ollama serve" komutu ile başlatılmalıdır');
      }
      console.error('==========================');
      console.error('');
      throw requestError; // Dış try/catch'e ilet
    }
  } catch (error: any) {
    console.error('');
    console.error('==== LLAMA GENEL HATA ====');
    console.error('[LLAMA] Genel hata oluştu:', error);
    console.error('=========================');
    console.error('');
    
    // Hata durumunda varsayılan hikayeyi dön
    console.log('[LLAMA] Varsayılan hikayeye dönülüyor');
    return `__default__${auraTypes[auraType as keyof typeof auraTypes]?.description || 'Varsayılan aura hikayesi.'}`;
  }
};

// Llama API için mesaj formatını hazırla
const prepareMessagesForLlama = (auraType: string, username: string, answers: any): any[] => {
  console.log('[LLAMA_PREP] Llama için mesajlar hazırlanıyor');
  
  // Quiz cevaplarını metin formatına dönüştür
  const answersText = Object.entries(answers || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  console.log('[LLAMA_PREP] Quiz cevapları formatlandı:', 
    Object.keys(answers || {}).length, 'cevap bulundu');

  // Aura tipine göre sistem talimatını hazırla
  const systemPrompt = getSystemPromptForAuraType(auraType);
  console.log('[LLAMA_PREP] Sistem promptu hazırlandı, uzunluk:', systemPrompt.length, 'karakter');
  
  // Kullanıcı mesajı oluşturma
  const userMessage = `
Merhaba, ben ${username || 'bir kullanıcı'}. 
Aşağıdaki quiz cevaplarıma göre benim için bir ${auraType} Aura hikayesi yazar mısın?

Quiz Cevaplarım:
${answersText}

Lütfen benim için türkçe olarak, içten, derin, anlamlı ve kişiselleştirilmiş bir aura hikayesi yaz. 
Hikaye ruhsal bir yolculuğu ifade etmeli.
Hikayeler 8-12 paragraf arası olmalı ve kişiselleştirilmiş olmalı.
`;

  console.log('[LLAMA_PREP] Kullanıcı mesajı hazırlandı, uzunluk:', userMessage.length, 'karakter');
  
  // Llama'nın beklediği formatta mesajları döndür
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];
  
  console.log('[LLAMA_PREP] Mesajlar formatlandı ve hazır');
  console.log(`[LLAMA_PREP] Toplam mesaj sayısı: ${messages.length}`);
  
  return messages;
};

// Ana hikaye alma fonksiyonunu güncelle
export const getAuraStoryFromDeepSeek = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string }
): Promise<string> => {
  try {
    console.log(`[AURA_SERVICE] Hikaye isteniyor - Kullanıcı: ${username}, Aura: ${auraType}`);
    console.log(`[AURA_SERVICE] Cevaplar:`, JSON.stringify(answers));
    
    // Cevaplar geçerli mi kontrol et
    if (!answers || Object.keys(answers).length === 0) {
      console.error('[AURA_SERVICE] Geçersiz cevaplar, varsayılan hikayeye dönülüyor');
      return `__default__${generateDefaultStory(auraType, username, {})}`;
    }
    
    // Önbellek kontrolü
    const answerSummary = getAnswerSummary(answers);
    const cacheKey = createCacheKey(auraType, answerSummary.answerPattern);
    console.log(`[AURA_SERVICE] Önbellek anahtarı: ${cacheKey}`);
    
    let generatedStory: string;
    let source: 'api' | 'cache' | 'llama' | 'default' = 'api';

    // Önbellek kontrolü
    const cachedStoryJSON = localStorage.getItem(cacheKey);
    if (cachedStoryJSON) {
      try {
        const cachedItem: StoryCacheItem = JSON.parse(cachedStoryJSON);
        const now = Date.now();
        
        if (now - cachedItem.timestamp < CACHE_EXPIRY_TIME && cachedItem.auraType === auraType) {
          console.log('[AURA_SERVICE] Hikaye önbellekten alındı');
          const personalizedStory = cachedItem.story.replace(/\[USERNAME\]/g, username);
          return `__cached__${personalizedStory}`;
        } else {
          console.log('[AURA_SERVICE] Önbellek süresi dolmuş, yeni hikaye isteniyor');
        }
      } catch (e) {
        console.error('[AURA_SERVICE] Önbellek okuma hatası:', e);
        localStorage.removeItem(cacheKey);
      }
    } else {
      console.log('[AURA_SERVICE] Önbellekte hikaye bulunamadı');
    }

    // DeepSeek API anahtarı varsa DeepSeek'i kullan, yoksa Llama'yı kullan
    if (DEEPSEEK_API_KEY) {
      console.log('[DEEPSEEK] API isteği gönderiliyor');
      console.time('deepseek_request_time');
      
      const prompt = `Sen bir aura analiz uzmanısın. Aşağıdaki bilgilere dayanarak kişiselleştirilmiş bir aura hikayesi oluşturacaksın.
        
        Kullanıcı: ${username}
        Aura tipi: ${auraType}
        
        Cevap eğilimi: 
        A şıkkı: ${answerSummary.answerCounts.a} kez
        B şıkkı: ${answerSummary.answerCounts.b} kez
        C şıkkı: ${answerSummary.answerCounts.c} kez
        D şıkkı: ${answerSummary.answerCounts.d} kez
        
        Önemli sorulara verilen cevaplar: ${answerSummary.keyAnswers}
        
        Lütfen kullanıcının ${auraType} aurasını tanımlayan ilham verici ve şiirsel bir kısa hikaye yaz.
        Hikaye üçüncü şahıs anlatımıyla olmalı, kullanıcının ismini içermeli ve 3 paragrafı geçmemeli.
        Son kısımda kullanıcının güçlü yönlerini ve gelişim alanlarını kısaca belirt.`;
      
      console.log('[DEEPSEEK] Prompt:', prompt);
      
      const response = await axios.post<DeepSeekResponse>(
        DEEPSEEK_API_URL,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 600
        } as DeepSeekRequestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          }
        }
      );
      
      console.timeEnd('deepseek_request_time');
      console.log('[DEEPSEEK] API yanıtı alındı:', response.data);
      generatedStory = response.data.choices[0]?.message.content || '';
    } else {
      console.log('');
      console.log('************************************************************');
      console.log('[AURA_SERVICE] DeepSeek API anahtarı bulunamadı, Llama kullanılıyor...');
      console.log(`[AURA_SERVICE] Ollama API isteği gönderilecek: http://localhost:11434/api/chat`);
      console.log('************************************************************');
      console.log('');
      
      generatedStory = await getAuraStoryFromLlama(auraType, username, answers);
      
      // Cevabın kaynağını belirle
      if (generatedStory.startsWith('__llama__')) {
        source = 'llama';
        generatedStory = generatedStory.replace('__llama__', '');
        console.log('[AURA_SERVICE] Llama yanıtı alındı:', generatedStory.substring(0, 100) + '...');
      } else if (generatedStory.startsWith('__default__')) {
        source = 'default';
        generatedStory = generatedStory.replace('__default__', '');
        console.log('[AURA_SERVICE] Varsayılan hikaye kullanılıyor');
      }
    }
    
    // Hikayeyi önbelleğe alma (varsayılan hikaye değilse)
    if (generatedStory && source !== 'default') {
      console.log('[AURA_SERVICE] Hikaye önbelleğe kaydediliyor');
      const genericStory = generatedStory.replace(new RegExp(username, 'g'), '[USERNAME]');
      const cacheItem: StoryCacheItem = {
        story: genericStory,
        timestamp: Date.now(),
        auraType
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    }
    
    // Kaynağı işaretle ve hikayeyi döndür
    console.log(`[AURA_SERVICE] Hikaye tamamlandı, kaynak: ${source}`);
    if (source === 'llama') {
      return `__llama__${generatedStory.trim()}`;
    } else if (source === 'default') {
      return `__default__${generatedStory.trim()}`;
    }
    return generatedStory.trim();
  } catch (error) {
    console.error('[AURA_SERVICE] API çağrısı başarısız:', error);
    // Hata durumunda varsayılan hikayeyi quiz yanıtlarını da kullanarak oluştur
    return `__default__${generateDefaultStory(auraType, username, answers)}`;
  }
};

// Kısa özet hikaye oluşturma (hızlı yükleme için)
export const getQuickAuraSummary = async (
  auraType: string,
  username: string
): Promise<string> => {
  try {
    console.log(`[QUICK_SUMMARY] Hızlı özet isteniyor - Kullanıcı: ${username}, Aura: ${auraType}`);
    
    if (!DEEPSEEK_API_KEY) {
      console.log('[QUICK_SUMMARY] DeepSeek API anahtarı yok, Llama ile hızlı özet oluşturuluyor');
      return getQuickLlamaSummary(auraType, username);
    }
    
    console.log('[QUICK_SUMMARY] DeepSeek API isteği gönderiliyor');
    console.time('quick_summary_time');
    
    // Çok kısa, hızlı bir özet için minimalist prompt
    const quickPrompt = `
      Sen bir aura analiz uzmanısın. ${username} isimli kullanıcının ${auraType} aura tipine sahip olduğunu biliyorsun.
      Lütfen bu kişi için bu aura tipiyle ilgili bir cümlelik kısa bir açıklama yaz.
    `;
    
    console.log('[QUICK_SUMMARY] Prompt:', quickPrompt);
    
    const response = await axios.post<DeepSeekResponse>(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: quickPrompt }],
        temperature: 0.5,
        max_tokens: 100 // Çok kısa özet için düşük token limiti
      } as DeepSeekRequestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );
    
    console.timeEnd('quick_summary_time');
    console.log('[QUICK_SUMMARY] DeepSeek yanıtı:', response.data.choices[0]?.message.content);
    
    return response.data.choices[0]?.message.content || getQuickDefaultSummary(auraType, username);
  } catch (error) {
    console.error('[QUICK_SUMMARY] Hızlı özet alınamadı:', error);
    return getQuickDefaultSummary(auraType, username);
  }
};

// Llama ile hızlı özet oluşturma fonksiyonu
const getQuickLlamaSummary = async (
  auraType: string,
  username: string
): Promise<string> => {
  console.log(`[LLAMA_SUMMARY] Llama ile hızlı özet isteniyor - Kullanıcı: ${username}, Aura: ${auraType}`);
  
  try {
    console.time('llama_summary_time');
    
    const quickPrompt = `
      Sen bir aura analiz uzmanısın. ${username} isimli kullanıcının ${auraType} aura tipine sahip olduğunu biliyorsun.
      Lütfen bu kişi için bu aura tipiyle ilgili bir cümlelik kısa bir açıklama yaz.
    `;
    
    console.log('');
    console.log('==== LLAMA ÖZET İSTEĞİ GÖNDERİLİYOR ====');
    console.log('[LLAMA_SUMMARY] Prompt:', quickPrompt);
    console.log('[LLAMA_SUMMARY] API URL:', LLAMA_API_URL);
    console.log('========================================');
    console.log('');
    
    try {
      console.log('[LLAMA_SUMMARY] Özet isteği başlatılıyor...');
      
      const response = await axios.post(
        LLAMA_API_URL,
        {
          model: 'llama3.1:latest',
          messages: [
            {
              role: 'user',
              content: quickPrompt
            }
          ],
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.timeEnd('llama_summary_time');
      console.log('');
      console.log('==== LLAMA ÖZET YANITI ALINDI ====');
      console.log('[LLAMA_SUMMARY] Yanıt durumu:', response.status);
      console.log('==================================');
      console.log('');
      
      let summaryContent = '';
      if (response.data && response.data.message && response.data.message.content) {
        summaryContent = response.data.message.content;
        console.log('[LLAMA_SUMMARY] Yanıt içeriği:', summaryContent);
      } else {
        console.warn('[LLAMA_SUMMARY] Yanıt beklenen formatta değil:', response.data);
        // Olası alternatif formatları kontrol et
        if (response.data && response.data.content) {
          summaryContent = response.data.content;
          console.log('[LLAMA_SUMMARY] Alternatif içerik formatı kullanıldı');
        } else if (typeof response.data === 'string') {
          summaryContent = response.data;
          console.log('[LLAMA_SUMMARY] String içerik formatı kullanıldı');
        } else if (response.data && response.data.response) {
          summaryContent = response.data.response;
          console.log('[LLAMA_SUMMARY] Response içerik formatı kullanıldı');
        } else {
          console.error('[LLAMA_SUMMARY] İçerik bulunamadı, varsayılan özete dönülüyor');
          return getQuickDefaultSummary(auraType, username);
        }
      }
      
      return summaryContent.trim() || getQuickDefaultSummary(auraType, username);
    } catch (requestError: any) {
      console.error('');
      console.error('==== LLAMA ÖZET HATASI ====');
      console.error('[LLAMA_SUMMARY] API isteği sırasında hata oluştu:', requestError.message);
      if (requestError.response) {
        console.error('[LLAMA_SUMMARY] Hata yanıtı:', {
          status: requestError.response.status,
          data: requestError.response.data
        });
      } else if (requestError.request) {
        console.error('[LLAMA_SUMMARY] Yanıt alınamadı. Ollama servisi çalışıyor mu?');
        console.error('[LLAMA_SUMMARY] Ollama servisi terminalden "ollama serve" komutu ile başlatılmalıdır');
      }
      console.error('===========================');
      console.error('');
      throw requestError; // Dış try/catch'e ilet
    }
  } catch (error) {
    console.error('');
    console.error('==== LLAMA ÖZET GENEL HATA ====');
    console.error('[LLAMA_SUMMARY] Hızlı özet alınamadı:', error);
    console.error('===============================');
    console.error('');
    
    console.log('[LLAMA_SUMMARY] Varsayılan özete dönülüyor');
    return getQuickDefaultSummary(auraType, username);
  }
};

// Hızlı özet için varsayılan cümleler
const getQuickDefaultSummary = (auraType: string, username: string): string => {
  const summaries = {
    creative: `${username}'ın yaratıcı aurası, ilham dolu ve yenilikçi bir ruh halini yansıtıyor.`,
    analytical: `${username}'ın analitik aurası, keskin zekasını ve problem çözme yeteneğini gösteriyor.`,
    empathetic: `${username}'ın empatik aurası, duygusal zekasını ve insanları anlama yeteneğini yansıtıyor.`,
    energetic: `${username}'ın enerjik aurası, yaşam dolu ve dinamik karakterini ortaya koyuyor.`
  };
  
  return summaries[auraType as keyof typeof summaries] || summaries.creative;
};

// Varsayılan hikaye oluşturan yardımcı fonksiyon
const generateDefaultStory = (auraType: string, username: string = 'Seyyah', answers: { [key: number]: string } = {}) => {
  console.log('[DEFAULT_STORY] Varsayılan hikaye oluşturuluyor:', auraType);
  
  // Eğer cevaplar varsa, onları kullanarak daha kişiselleştirilmiş bir hikaye oluştur
  const answerSummary = answers && Object.keys(answers).length > 0 
    ? getAnswerSummary(answers) 
    : { answerCounts: { a: 0, b: 0, c: 0, d: 0 }, answerPattern: '', keyAnswers: '' };
  
  const mostCommonAnswer = 
    answerSummary.answerCounts.a >= answerSummary.answerCounts.b && 
    answerSummary.answerCounts.a >= answerSummary.answerCounts.c && 
    answerSummary.answerCounts.a >= answerSummary.answerCounts.d
      ? 'a'
      : answerSummary.answerCounts.b >= answerSummary.answerCounts.c && 
        answerSummary.answerCounts.b >= answerSummary.answerCounts.d
        ? 'b'
        : answerSummary.answerCounts.c >= answerSummary.answerCounts.d
          ? 'c'
          : 'd';
  
  console.log('[DEFAULT_STORY] En çok seçilen cevap:', mostCommonAnswer);
  console.log('[DEFAULT_STORY] Cevap dağılımı:', answerSummary.answerCounts);
  
  // Cevaplar ve aura tipine göre farklı hikaye başlangıçları oluştur
  const storyIntros = {
    creative: {
      a: `${username}, sakin bir ormanda yürürken etrafındaki her detayda bir ilham buluyordu.`,
      b: `${username}'ın fikirleri, renkli fırça darbeleri gibi zihnine doluyor, yaratıcı aurasını besliyordu.`,
      c: `${username} için yaratıcılık, akşam karanlığında beliren yıldızlar gibiydi - parlak ve sınırsız.`,
      d: `${username}, enerjik adımlarla stüdyosuna girer girmez, yaratıcı aurası odayı aydınlatmaya başlıyordu.`
    },
    analytical: {
      a: `${username}'ın düzenli ve sistematik zihni, karmaşık problemleri adeta bir puzzle çözer gibi ele alıyordu.`,
      b: `${username}, analitik aurasıyla, karmaşık veri setlerinde bile hızlıca önemli modelleri fark edebiliyordu.`,
      c: `${username} için analiz etmek, şiir yazmak kadar doğaldı; rakamlar ve veriler onun için bir hikaye anlatıyordu.`,
      d: `${username}'ın analitik aurası, dinamik ve çözüm odaklı yaklaşımıyla herkesin dikkatini çekiyordu.`
    },
    empathetic: {
      a: `${username}, bir odaya girdiğinde, sanki herkesin duygularını hissedebiliyordu; empatik aurası adeta görünmez bir ağ gibiydi.`,
      b: `${username}'ın empatik aurası, insanların ona içlerini dökmek için güvendikleri sıcak bir ışık yayıyordu.`,
      c: `${username}, başkalarının söylenmemiş duygularını, sessiz bir odada duyulan fısıltılar gibi algılayabiliyordu.`,
      d: `${username}, enerjik ve canlı kişiliğinin altında, başkalarının ihtiyaçlarını anında fark eden derin bir empatiye sahipti.`
    },
    energetic: {
      a: `${username}, sakin görünüşünün altında, ihtiyaç anında ortaya çıkan inanılmaz bir enerji barındırıyordu.`,
      b: `${username}'ın enerjik aurası, girdiği her ortamı canlandırıyor, etrafındaki herkese ilham veriyordu.`,
      c: `${username} için enerji, derin bir kuyudan çıkan su gibiydi; hiç tükenmez, sürekli akar ve etrafına hayat verirdi.`,
      d: `${username}, sabahın ilk ışıklarıyla uyanır, güneş batana kadar dinamizmi ve coşkusuyla çevresindekileri şaşırtırdı.`
    }
  };
  
  // Cevaplar ve aura tipine göre farklı hikaye sonları oluştur
  const storyEndings = {
    creative: {
      a: `${username}'ın en güçlü yönü, detaylara olan dikkati ve sabırlı yaklaşımıydı. Gelişim alanı ise, bazen fazla mükemmeliyetçi olup spontane fırsatları kaçırabilmesiydi.`,
      b: `${username}'ın parlak fikirleri ve yenilikçi bakış açısı en büyük gücüydü. Ancak bazen çok fazla fikir arasında odaklanmakta zorlanabiliyordu.`,
      c: `${username}'ın zengin iç dünyası ve derin düşünme yeteneği, ona benzersiz perspektifler sunuyordu. Geliştirebileceği alan ise, bu fikirleri daha fazla insanla paylaşmak olabilirdi.`,
      d: `${username}'ın enerji dolu yaklaşımı ve hızlı düşünme yeteneği, yaratıcı süreçlerde büyük avantaj sağlıyordu. Bazen bu hız, detayları gözden kaçırmasına neden olabiliyordu.`
    },
    analytical: {
      a: `${username}'ın titiz analiz yeteneği ve sabırlı yaklaşımı, en karmaşık problemleri bile çözebilmesini sağlıyordu. Duygusal faktörleri hesaba katmak, geliştirebileceği bir alan olabilirdi.`,
      b: `${username}'ın hızlı düşünme ve bağlantılar kurma yeteneği, analitik süreçlerde büyük avantaj sağlıyordu. Bazen çok hızlı sonuçlara varmak yerine daha fazla veri toplamayı öğrenmesi gerekebilirdi.`,
      c: `${username}'ın derin düşünme ve sistematik yaklaşımı, karmaşık problemleri çözmede eşsizdi. Fikirlerini başkalarıyla daha açık paylaşmak, geliştirebileceği bir yön olabilirdi.`,
      d: `${username}'ın dinamik düşünme yeteneği ve enerji dolu yaklaşımı, analitik süreçlere canlılık katıyordu. Sabır gerektiren durumlar, üzerinde çalışabileceği alanlar arasındaydı.`
    },
    empathetic: {
      a: `${username}'ın sakin ve dinleyen tavrı, insanların kendilerini güvende hissetmelerini sağlıyordu. Kendi duygusal sınırlarını korumak, geliştirebileceği bir alan olabilirdi.`,
      b: `${username}'ın sıcak ve kucaklayıcı tavrı, insanları kendine çekiyordu. Bazen başkalarının sorunlarını çözmek için fazla çaba harcayıp kendini ihmal edebiliyordu.`,
      c: `${username}'ın derin anlayışı ve sezgisel yaklaşımı, insanların gerçek duygularını anlamasını sağlıyordu. Bu yeteneklerini daha geniş topluluklarda kullanmak üzerine çalışabilirdi.`,
      d: `${username}'ın enerjik ve pozitif yaklaşımı, etrafındakilere moral veriyordu. Bazen başkalarının daha sakin veya negatif duygularına alan açmakta zorlanabiliyordu.`
    },
    energetic: {
      a: `${username}'ın sakin gücü ve dayanıklılığı, uzun soluklu projelerde büyük avantaj sağlıyordu. Bazen enerjisini daha görünür şekilde ifade etmesi gerekebilirdi.`,
      b: `${username}'ın canlı enerjisi ve tutkusu, etrafındaki herkesi harekete geçirebiliyordu. Dinlenmeye ve yavaşlamaya zaman ayırmak, geliştirebileceği bir alan olabilirdi.`,
      c: `${username}'ın derin ve gizemli enerjisi, insanları kendine çeken bir mıknatıs gibiydi. Bu enerjiyi daha planlı ve yapılandırılmış şekilde kullanmak, geliştirebileceği bir yön olabilirdi.`,
      d: `${username}'ın patlamaya hazır enerjisi ve spontane yaklaşımı, her ortamı canlandırıyordu. Bazen bu enerjiyi daha odaklı kullanmayı öğrenmesi gerekebilirdi.`
    }
  };
  
  // Seçilen aura tipi ve en çok seçilen cevaba göre hikaye oluştur
  const intro = storyIntros[auraType as keyof typeof storyIntros]?.[mostCommonAnswer as keyof typeof storyIntros.creative] || 
    `${username}, kendine özgü bir ${auraType} aurası taşıyordu.`;
  
  // Aura tipine göre orta paragraf
  const middleParts: {[key: string]: string} = {
    creative: `Renkler onun ellerinde canlanıyor, fikirler zihninde çiçekler gibi açıyordu. ${username}'ın yaratıcı aurasının etkisiyle, sıradan nesneler bile sanat eserine dönüşebiliyordu.`,
    analytical: `Karmaşık bilgileri düzenlerken, zihnindeki parçalar kusursuz bir puzzle gibi bir araya geliyordu. ${username}'ın analitik aurası, problemlerin çözümünde parlak bir ışık gibiydi.`,
    empathetic: `İnsanlarla kurduğu her bağda, kelimelerden çok duyguların dilini konuşuyordu. ${username}'ın empatik aurası, yaralı kalplere şifa, yalnız ruhlara arkadaşlık sunuyordu.`,
    energetic: `Her sabah güneşle birlikte uyanıp, geceye kadar durmadan ilerliyordu. ${username}'ın enerjik aurası, tükenmeyen bir güç kaynağı gibiydi, etrafındaki herkese ilham veriyordu.`
  };
  
  const middle = middleParts[auraType] || `${username}'ın ${auraType} aurası, benzersiz bir güç kaynağıydı.`;
  
  // En çok seçilen cevaba göre hikaye sonu
  const ending = storyEndings[auraType as keyof typeof storyEndings]?.[mostCommonAnswer as keyof typeof storyEndings.creative] || 
    `${username}'ın benzersiz yetenekleri, onu özel kılıyordu.`;
  
  // Üç paragraftan oluşan hikayeyi oluştur
  return `${intro} ${middle} ${ending}`;
}; 