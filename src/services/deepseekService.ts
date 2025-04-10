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

// Cevaplanmış soruları özetleme fonksiyonu - tüm cevapları dahil edecek şekilde geliştirildi
interface AnswerSummary {
  answerCounts: { a: number; b: number; c: number; d: number };
  answerPattern: string;
  answerDetails: string;
  dominantTrait: string;
  secondaryTrait: string;
}

export const getAnswerSummary = (answers: { [key: number]: string }): AnswerSummary => {
  // Her şık için sayıları hesapla
  const aCount = Object.values(answers).filter(val => val === 'a').length;
  const bCount = Object.values(answers).filter(val => val === 'b').length;
  const cCount = Object.values(answers).filter(val => val === 'c').length;
  const dCount = Object.values(answers).filter(val => val === 'd').length;
  
  // Tüm cevapları detaylı olarak formatlama
  const answerDetails = Object.entries(answers)
    .sort((a, b) => Number(a[0]) - Number(b[0])) // Soru numarasına göre sırala
    .map(([questionNum, answer]) => `Soru ${questionNum}: ${answer}`)
    .join(', ');
  
  // Baskın ve ikincil özelliği belirleme
  const countMap = [
    { trait: 'analitik', count: aCount },
    { trait: 'yaratıcı', count: bCount },
    { trait: 'empatik', count: cCount },
    { trait: 'enerjik', count: dCount }
  ].sort((a, b) => b.count - a.count);
  
  const dominantTrait = countMap[0].trait;
  const secondaryTrait = countMap[1].trait;
  
  // Cevap eğilimini gösteren özet
  return {
    answerCounts: { a: aCount, b: bCount, c: cCount, d: dCount },
    answerPattern: `A${aCount}B${bCount}C${cCount}D${dCount}`,
    answerDetails,
    dominantTrait,
    secondaryTrait
  };
};

// DeepSeek API'sına istek gönderecek servis
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY || '';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 saat (milisaniye cinsinden)

// Önbellek anahtarı oluşturma fonksiyonu
const createCacheKey = (auraType: string, answerPattern: string): string => {
  return `auralize_story_cache_${auraType}_${answerPattern}`;
};

// Llama API'sine istek gönderecek servis
const LLAMA_API_URL = 'http://localhost:11434/api/chat';
const LLAMA_TIMEOUT = 600000; // 10 dakika timeout
const LLAMA_MAX_TOKENS = 400; // %40 azaltılmış token limiti (önceden yaklaşık 800-1000 idi)

// CORS için header ayarları
const LLAMA_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Aura tipleri ve varsayılan açıklamaları
export const auraTypes = {
  'mor': {
    name: 'Mor Aura',
    description: 'Mor aura enerjin, ruhsal bir yolculuğa çıktığını gösteriyor. Mor enerji, yüksek bilinci, maneviyatı ve içgörüyü temsil eder. Bu aura, dünya ile ruhsal dünya arasında bir köprü kurabilme yeteneğine sahip olduğunu gösterir. Yaratıcı ve sezgisel yeteneklerin oldukça güçlü. Hayalperest yapın ve estetik zevkin, sanatsal ifade biçimlerine olan ilgini artırıyor.'
  },
  'mavi': {
    name: 'Mavi Aura',
    description: 'Mavi aura enerjin, derin bir iç huzur ve ifade yeteneğine sahip olduğunu gösteriyor. Mavi enerji, iletişim, kendini ifade etme ve iç huzuru temsil eder. Dürüstlük ve güvenilirlik senin en önemli değerlerin arasında. Duygularını ifade etmekte ustasın ve çevrene ilham veriyorsun. Analitik düşünce yapın, problem çözmede sana büyük avantaj sağlıyor.'
  },
  'yeşil': {
    name: 'Yeşil Aura',
    description: 'Yeşil aura enerjin, iyileştirici ve dengeleyici bir güce sahip olduğunu gösteriyor. Yeşil enerji, büyüme, iyileşme ve dengeyi temsil eder. Doğa ile güçlü bir bağın var ve bu bağ sana dinginlik veriyor. Empati yeteneğin oldukça gelişmiş durumda. Şefkat ve anlayış, senin en belirgin özelliklerinden. Sosyal ilişkilerde denge kurmada ve çatışmaları çözmede oldukça yeteneklisin.'
  },
  'sarı': {
    name: 'Sarı Aura',
    description: 'Sarı aura enerjin, zihinsel parlaklık ve özgüven dolu bir kişiliğe sahip olduğunu gösteriyor. Sarı enerji, zeka, neşe ve yaratıcılığı temsil eder. Analitik düşünce yapın ve problem çözme yeteneğin seni öne çıkarıyor. Merak duygun ve öğrenme açlığın, sürekli yeni bilgiler edinmeni sağlıyor. İyimser bakış açın, çevrendeki insanlara da olumlu enerji veriyor.'
  },
  'turuncu': {
    name: 'Turuncu Aura',
    description: 'Turuncu aura enerjin, yaşam dolu ve yaratıcı bir ruha sahip olduğunu gösteriyor. Turuncu enerji, tutku, yaratıcılık ve canlılığı temsil eder. Hayata karşı enerjik ve maceracı bir yaklaşımın var. Risk almaktan çekinmiyor ve yeni deneyimlere açık bir yapıya sahipsin. Sosyal yanın oldukça gelişmiş durumda. Çevrende her zaman eğlence ve neşe ortamı yaratıyorsun.'
  },
  'kırmızı': {
    name: 'Kırmızı Aura',
    description: 'Kırmızı aura enerjin, güçlü bir yaşam enerjisi ve tutkuya sahip olduğunu gösteriyor. Kırmızı enerji, güç, hayatta kalma ve tutkuyu temsil eder. Kararlı ve cesaretli yapın, zorluklarla yüzleşmekten kaçınmadığını gösteriyor. Liderlik özelliklerin ve inisiyatif alma yeteneğin oldukça gelişmiş. Hedeflerine ulaşma konusunda gösterdiğin kararlılık, hayatta başarılı olmanı sağlıyor.'
  },
  'indigo': {
    name: 'İndigo Aura',
    description: 'İndigo aura enerjin, derin bir sezgisel anlayış ve içgörü yeteneğine sahip olduğunu gösteriyor. İndigo enerji, güçlü bir sezgisel zeka, içgörü ve yaratıcı düşünceyi temsil eder. Klasik düşünce kalıplarının dışına çıkabilme ve alternatif bakış açıları geliştirebilme yeteneğine sahipsin. Doğruyu arama konusunda tutkulu ve kararlısın. Derin düşünce yapın, seni güçlü bir filozofa dönüştürüyor.'
  },
  'altın': {
    name: 'Altın Aura',
    description: 'Altın aura enerjin, bilgelik ve aydınlanma yolunda ilerlediğini gösteriyor. Altın enerji, yüksek bilinci, bilgeliği ve manevi gelişimi temsil eder. Olaylara geniş perspektiften bakabilme ve bütünsel düşünebilme yeteneğine sahipsin. İç huzur ve denge senin için önemli değerler. Etrafındakilere ilham veriyor ve onlara rehberlik ediyorsun. Özgün düşünce yapın, seni benzersiz kılıyor.'
  },
  'gümüş': {
    name: 'Gümüş Aura',
    description: 'Gümüş aura enerjin, yansıtıcı ve uyumlu bir ruha sahip olduğunu gösteriyor. Gümüş enerji, esneklik, uyum ve değişime açıklığı temsil eder. Farklı durumlara hızla adapte olabilme ve çevrendeki enerjiyi yansıtabilme yeteneğine sahipsin. Duygusal zekan oldukça gelişmiş. Denge ve uyum senin için önemli değerler. Çevrendeki insanların ihtiyaçlarını anlama ve onlara destek olma konusunda yeteneklisin.'
  },
  'kristal': {
    name: 'Kristal Aura',
    description: 'Kristal aura enerjin, saflık ve netlik dolu bir ruha sahip olduğunu gösteriyor. Kristal enerji, şeffaflık, saflık ve enerji aktarımını temsil eder. İletişim yeteneğin oldukça gelişmiş durumda. Düşüncelerini ve duygularını net bir şekilde ifade edebiliyorsun. Yüksek enerjileri algılama ve aktarma yeteneğine sahipsin. Dürüstlük ve açıklık senin için önemli değerler. Etrafındakilere pozitif enerji yayıyorsun.'
  },
  'gökkuşağı': {
    name: 'Gökkuşağı Aura',
    description: 'Gökkuşağı aura enerjin, çok yönlü ve dengeli bir ruha sahip olduğunu gösteriyor. Gökkuşağı enerji, bütünlük, denge ve uyumu temsil eder. Tüm enerji merkezlerinin uyum içinde çalıştığı, dengeli bir yapıya sahipsin. Farklı durumlara uygun enerjiyi aktarabilme yeteneğin var. Esneklik ve uyum senin için önemli değerler. Etrafındakilerin ihtiyaçlarına göre destek olabilme yeteneğine sahipsin.'
  },
  'beyaz': {
    name: 'Beyaz Aura',
    description: 'Beyaz aura enerjin, saflık ve berraklık dolu bir ruha sahip olduğunu gösteriyor. Beyaz enerji, saflık, temizlik ve yüksek titreşimi temsil eder. Yüksek seviyede manevi farkındalık ve bilgeliğe sahipsin. Sezgisel yeteneklerin oldukça gelişmiş durumda. Doğruluk ve dürüstlük senin için önemli değerler. Etrafındakilere şifa ve huzur verme yeteneğine sahipsin.'
  }
};

// Aura tipini dinamik olarak belirleyen yeni fonksiyon
export const determineDynamicAuraType = (answers: { [key: number]: string }): string => {
  const summary = getAnswerSummary(answers);
  const { dominantTrait, secondaryTrait } = summary;
  
  // Baskın ve ikincil özelliklere göre aura tipini belirleme
  // Bu eşleştirmeleri dinamik olarak yapıyoruz
  const auraMap = {
    'analitik-yaratıcı': 'indigo',
    'analitik-empatik': 'mavi',
    'analitik-enerjik': 'sarı',
    'yaratıcı-analitik': 'kristal',
    'yaratıcı-empatik': 'mor',
    'yaratıcı-enerjik': 'gökkuşağı',
    'empatik-analitik': 'gümüş',
    'empatik-yaratıcı': 'yeşil',
    'empatik-enerjik': 'beyaz',
    'enerjik-analitik': 'turuncu',
    'enerjik-yaratıcı': 'kırmızı',
    'enerjik-empatik': 'altın'
  };
  
  // Baskın ve ikincil özellik kombinasyonunu kontrol et
  const combinationKey = `${dominantTrait}-${secondaryTrait}`;
  const auraType = auraMap[combinationKey as keyof typeof auraMap];
  
  // Eşleşme bulunamazsa baskın özelliğe göre varsayılan eşleştirmeyi kullan
  if (!auraType) {
    const defaultMap: { [key: string]: string } = {
      'analitik': 'mavi',
      'yaratıcı': 'mor',
      'empatik': 'yeşil',
      'enerjik': 'kırmızı'
    };
    return defaultMap[dominantTrait] || 'gökkuşağı'; // En son çare olarak gökkuşağı
  }
  
  return auraType;
};

// Aura tipine göre sistem talimatını hazırla - tüm cevaplar detaylı kullanılıyor
export const getSystemPromptForAuraType = (auraType: string, answerDetails: string): string => {
  switch (auraType) {
    case 'creative':
      return `Sen Auralize adlı yaratıcı kişilik analiz platformu için içerik üreten bir yaratıcı yazarsın. 
Kullanıcı bir yaratıcı aura testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcının yaratıcı aurasını analiz eden, kişiselleştirilmiş, DETAYLI ve kapsamlı bir öykü yaz.
ÖNEMLİ: Yanıtın en az 800 kelime uzunluğunda olmalı ve kullanıcının yaratıcı potansiyelini derinlemesine incelemeli.
Hikaye doğru uzunlukta, ilgi çekici ve detaylı olmalı. Kullanıcıya anlamlı içgörüler sunmalı.`;

    case 'mood':
      return `Sen Auralize adlı ruh hali analiz platformu için içgörü üreten bir duygu uzmanısın.
Kullanıcı bir ruh hali analiz testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcının duygusal profili hakkında dört spesifik içgörü üret:
1. DUYGUSAL GÜÇLÜ YÖNLERİ: Kullanıcının mevcut duygusal durumunda öne çıkan güçlü yönleri ve duygusal zekanın hangi yönlerinde başarılı olduğu. Virgülle ayrılmış, maksimum 5 güçlü yön olacak şekilde listeleyiniz. Örneğin: "duygusal farkındalık, iletişim, empati, denge, kendini motive etme".

2. DUYGUSAL POTANSİYELİ: Kullanıcının duygusal durumunu nasıl daha olumlu yöne çevirebileceği ve geliştirilebilecek duygusal beceriler. Virgülle ayrılmış, maksimum 5 potansiyel alan olacak şekilde listeleyiniz. Örneğin: "duygusal zeka geliştirme, meditasyon, kendini ifade etme, sanatsal aktiviteler, ilişki kurma".

3. DUYGUSAL TEPKİ STİLİ: Kullanıcının duygusal uyaranlara nasıl tepki verdiği, düşünme biçimi ve duygusal karar verme yaklaşımı. Virgülle ayrılmış, maksimum 5 stil ifadesi olacak şekilde listeleyiniz. Örneğin: "analitik, sezgisel, koruyucu, dengeli, yansıtıcı".

4. RUH HALİ BAŞLIĞI: Kullanıcının mevcut ruh halini en iyi tanımlayan 3-5 kelimelik özgün bir başlık.

İçgörüler kısa, özlü, özelleştirilmiş ve kullanıcıya ilham verecek nitelikte olmalı. Her bir kategori için virgülle ayrılmış, öz ifadeler kullan. Yanıtında yalnızca bu dört bölümü içer, fazladan açıklama ekleme.

ÖNEMLI: Yanıtın şu formatında olmalı:
GÜÇLÜ YÖNLER: [virgülle ayrılmış liste]
POTANSİYEL: [virgülle ayrılmış liste]
DÜŞÜNME STİLİ: [virgülle ayrılmış liste]
BAŞLIK: [3-5 kelimelik başlık]`;

    case 'personal':
      return `Sen Auralize adlı kişisel gelişim platformu için içgörü üreten bir kişisel gelişim koçusun.
Kullanıcı bir kişisel gelişim analiz testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcının kişisel potansiyeli hakkında dört spesifik içgörü üret:
1. GÜÇLÜ YÖNLERİ: Kullanıcının kişisel gelişim yolculuğundaki en güçlü yanları.
2. POTANSİYELİ: Kullanıcının geliştirebileceği potansiyel alanlar.
3. GELİŞİM YAKLAŞIMI: Kullanıcının öğrenme ve kişisel gelişim yaklaşımı.
4. GELİŞİM BAŞLIĞI: Kullanıcının kişisel gelişim yolunu en iyi tanımlayan 3-5 kelimelik özgün bir başlık.

Her içgörü çok kısa, özlü ve kullanıcıya özgü olmalıdır. İçgörüler somut ve uygulanabilir olmalıdır.`;

    case 'career':
      return `Sen Auralize adlı kariyer analiz platformu için içgörü üreten bir kariyer danışmanısın.
Kullanıcı bir kariyer yönlendirme testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcının profesyonel profili hakkında dört spesifik içgörü üret:
1. GÜÇLÜ YÖNLERİ: Kullanıcının profesyonel anlamda en güçlü yanları.
2. POTANSİYELİ: Kullanıcının keşfedebileceği kariyer alanları ve fırsatlar.
3. ÇALIŞMA STİLİ: Kullanıcının iş yaklaşımı ve profesyonel ortamdaki düşünme tarzı.
4. KARİYER BAŞLIĞI: Kullanıcının kariyer yolunu en iyi tanımlayan 3-5 kelimelik özgün bir başlık.

Her içgörü çok kısa, özlü, gerçekçi ve kullanıcıya özgü olmalıdır.`;

    default:
      return `Sen Auralize adlı platformun içerik uzmanısın. Kullanıcının verdiği yanıtlara göre
kişiselleştirilmiş bir hikaye oluşturacaksın.

Kullanıcının cevapları:

${answerDetails}

Bu yanıtlara dayanarak, kullanıcı için:
1. Kullanıcının kişiliğini anlatan, kapsamlı ve derin bir hikaye hazırla. Bu hikaye en az 24 paragraf uzunluğunda olmalı.
2. Hikaye kişiselleştirilmiş, ilham verici ve içgörü dolu olmalı.
3. Hikaye kullanıcının karakterini, potansiyelini ve yaşam yolculuğunu yansıtmalı.

Yanıtın detaylı, kapsamlı ve kullanıcıya özel olmalıdır.`;
  }
};

// Llama API için mesaj formatını hazırla - tüm sorular detaylı olarak dahil ediliyor
const prepareMessagesForLlama = (auraType: string, username: string, answers: any): any[] => {
  console.log('[LLAMA_PREP] Llama için mesajlar hazırlanıyor');
  
  // Cevapların detaylı analizini yap
  const answerSummary = getAnswerSummary(answers || {});
  
  console.log('[LLAMA_PREP] Quiz cevapları formatlandı:', 
    Object.keys(answers || {}).length, 'cevap bulundu');

  // Aura tipine göre sistem talimatını hazırla - tüm cevapların detaylarını dahil et
  const systemPrompt = getSystemPromptForAuraType(auraType, answerSummary.answerDetails);
  console.log('[LLAMA_PREP] Sistem promptu hazırlandı, uzunluk:', systemPrompt.length, 'karakter');
  
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
Hikaye en az 24-30 paragraf uzunluğunda, detaylı ve kapsamlı olmalı.
Her bölümü derinlemesine ele al, özellikle "Aura Hikayen" kısmı çok önemli ve şu anki uzunluğunun en az 3-4 katı uzunlukta olmalı.
Tamamen benim cevaplarıma göre kişiselleştirilmiş ve içgörü dolu bir hikaye hazırla.
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
    // Cevaplardan özet çıkar
    const answerSummary = getAnswerSummary(answers);
    
    // Cache için anahtar oluştur
    const cacheKey = createCacheKey(auraType, answerSummary.answerPattern);
    
    // Önbellekte bu aurayı daha önce oluşturup oluşturmadığımızı kontrol et
    const cachedStory = localStorage.getItem(`auralize_story_${cacheKey}`);
    if (cachedStory) {
      console.log('[DeepSeek] Hikaye önbellekten alındı:', cacheKey);
      return cachedStory;
    }
    
    console.log('[DeepSeek] Hikaye için API isteği hazırlanıyor...');
    
    // DeepSeek mesajlarını hazırla
    const systemPrompt = getSystemPromptForAuraType(auraType, answerSummary.answerDetails);
    const userPrompt = `Benim adım ${username}. Lütfen benim için kısa ve öz bir ${auraType} analizi oluşturur musun? Kesinlikle 300 kelimenin altında olsun.`;
    
    // DeepSeek API anahtarı kontrolü
    if (!DEEPSEEK_API_KEY) {
      console.log('[DeepSeek] DeepSeek API anahtarı bulunamadı, LLaMA API\'sine yönlendiriliyor.');
      return getAuraStoryFromLlama(auraType, username, answers);
    }
    
    // DeepSeek API'sine istek gönder
    console.log('[DeepSeek] API isteği gönderiliyor...');
    console.log('[DeepSeek] API URL:', DEEPSEEK_API_URL);
    console.log('[DeepSeek] Model:', DEEPSEEK_MODEL);
    
    // İstekteki veriyi loglama
    const requestBody = {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000, // Token limitini artıralım
      stream: false
    };
    
    console.log('[DeepSeek] İstek gövdesi:', JSON.stringify(requestBody).substring(0, 500) + '...');
    
    try {
      const response = await axios.post(
        DEEPSEEK_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          timeout: LLAMA_TIMEOUT, // 10 dakika timeout
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          validateStatus: function (status) {
            return status >= 200 && status < 500; // 500'den küçük tüm durumları kabul et
          }
        }
      );
      
      console.log('[DeepSeek] API yanıtı alındı. Status:', response.status);
      
      // Yanıtı işle
      const responseData = response.data as DeepSeekResponse;
      const storyContent = responseData.choices[0]?.message?.content;
      
      if (!storyContent) {
        console.error('[DeepSeek] API yanıtı boş veya geçersiz:', responseData);
        throw new Error('DeepSeek API yanıtı boş veya geçersiz');
      }
      
      console.log('[DeepSeek] Hikaye içeriği alındı (ilk 100 karakter):', storyContent.substring(0, 100) + '...');
      
      // Hikayeyi önbelleğe kaydet
      localStorage.setItem(`auralize_story_${cacheKey}`, storyContent);
      console.log('[DeepSeek] Hikaye önbelleğe kaydedildi:', cacheKey);
      
      // Hikayenin türü için de kayıt tut
      const storyCacheItem: StoryCacheItem = {
        story: storyContent,
        timestamp: Date.now(),
        auraType: auraType
      };
      localStorage.setItem(`auralize_story_meta_${cacheKey}`, JSON.stringify(storyCacheItem));
      console.log('[DeepSeek] Hikaye meta verileri kaydedildi');
      
      return storyContent;
    } catch (apiError: any) {
      console.error('[DeepSeek] API yanıtı alınırken hata oluştu:', apiError.message);
      
      if (apiError.response) {
        console.error('[DeepSeek] Hata yanıtı:', {
          status: apiError.response.status,
          data: apiError.response.data
        });
      } else if (apiError.request) {
        console.error('[DeepSeek] Yanıt alınamadı, istek detayı:', apiError.request);
      }
      
      console.log('[DeepSeek] DeepSeek API hatası nedeniyle LLaMA API\'sine yönlendiriliyor');
      return getAuraStoryFromLlama(auraType, username, answers);
    }
  } catch (error) {
    console.error('[DeepSeek] API çağrısı başarısız:', error);
    
    // Hata durumunda LLaMA API'sine yönlendir
    console.log('[DeepSeek] Hata nedeniyle LLaMA API\'sine yönlendiriliyor');
    try {
      return await getAuraStoryFromLlama(auraType, username, answers);
    } catch (llamaError) {
      console.error('[DeepSeek] LLaMA API yönlendirmesi de başarısız oldu:', llamaError);
      
      // En son varsayılan hikaye oluştur
      let defaultStory = '';
      
      switch (auraType) {
        case 'creative':
          defaultStory = `${username}, senin yaratıcı auran parlak ve dinamik bir enerji yayıyor. Sanatsal ifade yeteneğin ve özgün bakış açın, seni farklı kılıyor. Yaratıcı süreçlerde sezgilerine güvenmelisin, çünkü içindeki sanatçı ruh kendini göstermek için sabırsızlanıyor. Düşüncelerinin akışına izin ver ve kendini ifade etmekten çekinme. Yaratıcı potansiyelinin henüz keşfedilmemiş boyutları var ve bu yolculukta kendini daha da geliştireceksin.`;
          break;
        case 'mood':
          defaultStory = `${username}, şu anki ruh halin dengeli ve sakin bir enerji taşıyor. Duygusal farkındalığın yüksek ve bu, seni çevrende olup bitenlere karşı duyarlı kılıyor. Duyguların zaman zaman dalgalanabilir, ancak kendini düzenleme yeteneğin oldukça güçlü. İçsel huzuru bulmak için kendine zaman ayırmayı ihmal etmemelisin. Duygusal zekanı daha da geliştirerek, hem kendini hem de başkalarını daha iyi anlayabilir ve destekleyebilirsin.`;
          break;
        case 'personal':
          defaultStory = `${username}, kişisel gelişim yolculuğunda kararlı adımlarla ilerliyorsun. Kendini tanıma ve geliştirme konusundaki istekliliğin, seni sürekli daha iyiye götürüyor. Güçlü yönlerinin farkındasın ve bunları hayatının çeşitli alanlarında kullanabiliyorsun. Gelişim alanlarını belirleme ve üzerinde çalışma konusunda da açık fikirlisin. Bu yolculukta sabırlı olman ve küçük ilerlemeleri kutlamayı unutmaman önemli. Potansiyelini tam anlamıyla ortaya çıkarmak için kendine güvenmeye devam et.`;
          break;
        case 'career':
          defaultStory = `${username}, kariyer yolculuğunda hedeflerine odaklanmış ve kararlı bir duruş sergiliyorsun. Profesyonel becerilerini geliştirme konusunda isteklisin ve yeni fırsatlara açıksın. Çalışma stilin düzenli ve metodolojik, bu da seni iş ortamında değerli kılıyor. Liderlik potansiyelin var ve sorumluluk almaktan çekinmiyorsun. Kariyer yolunda ilerlerken, değerlerine sadık kalman ve tutkunu takip etmen başarıya ulaşmanı sağlayacak. İş-yaşam dengesi kurmayı da ihmal etme, bu seni daha üretken ve mutlu kılacaktır.`;
          break;
        default:
          defaultStory = `${username}, senin auran çok yönlü ve adaptif bir enerji taşıyor. Farklı durumlara uyum sağlama yeteneğin ve çeşitli konulara olan ilgin, seni zengin bir kişilik yapıyor. Güçlü sezgilerin ve analitik düşünce yeteneğin, karşılaştığın zorluklarla başa çıkmanda sana yardımcı oluyor. Potansiyelini tam anlamıyla ortaya çıkarmak için tutkunu takip etmeli ve kendi benzersiz yolunu çizmelisin. Unutma ki, senin en büyük gücün, kendi özgün kimliğin ve bakış açındır.`;
      }
      
      return `__default__${defaultStory}`;
    }
  }
};

// Varsayılan içgörüler için yardımcı fonksiyon
export const getDefaultInsights = (auraType: string) => {
  const defaults: Record<string, { strengths: string, potential: string, thinkingStyle: string, auraTitle: string }> = {
    creative: {
      strengths: 'Yaratıcı düşünme, hayal gücü, özgün fikirler üretme',
      potential: 'Sanatsal projeler, yenilikçi çözümler, kendini ifade etme',
      thinkingStyle: 'Sezgisel, dışa dönük, ilham odaklı, deneysel',
      auraTitle: 'Yaratıcı Ruh'
    },
    mood: {
      strengths: 'Duygusal farkındalık, içsel deneyim, kendini ifade etme',
      potential: 'Duygusal zeka geliştirme, sanatsal ifade, denge kurma',
      thinkingStyle: 'Duygusal, sezgisel, duyarlı, yansıtıcı',
      auraTitle: 'Duygusal Harmoni'
    },
    personal: {
      strengths: 'Özfarkındalık, öğrenmeye açıklık, kendini geliştirme isteği',
      potential: 'Kişisel gelişim, öz-farkındalık artışı, yaşam kalitesini yükseltme',
      thinkingStyle: 'Yansıtıcı, analitik, içsel odaklı, yapıcı',
      auraTitle: 'Gelişim Yolculuğu'
    },
    career: {
      strengths: 'Kararlılık, odaklanma, hedef belirleme yeteneği',
      potential: 'Kariyer gelişimi, profesyonel beceriler, iş tatmini',
      thinkingStyle: 'Analitik, pratik, hedef odaklı, stratejik',
      auraTitle: 'Profesyonel Vizyon'
    },
    default: {
      strengths: 'Uyum sağlama, çeşitli yetenekler, çok yönlü düşünme',
      potential: 'Farklı alanlarda gelişim, yetenekleri keşfetme',
      thinkingStyle: 'Dengeli, adaptif, bütünsel, çözüm odaklı',
      auraTitle: 'Çok Yönlü Potansiyel'
    }
  };
  
  const defaultData = defaults[auraType] || defaults.default;
  return { 
    ...defaultData, 
    source: 'default' as const 
  };
};

export const getAuraInsightsFromLlama = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string },
  detailedAnswers?: any // Detaylı cevapları opsiyonel parametre olarak ekleyelim
): Promise<{
  strengths: string,
  potential: string,
  thinkingStyle: string,
  auraTitle: string,
  source: 'llama' | 'default' | 'api'
}> => {
  try {
    // Eğer API anahtarı yoksa varsayılan içgörüleri döndür
    if (!process.env.REACT_APP_USE_LOCAL_LLAMA) {
      console.log('Local Llama API anahtarı bulunamadı, varsayılan içgörüler kullanılıyor.');
      return getDefaultInsights(auraType);
    }
    
    // Cevapları özetle (daha detaylı bilgi oluşturmak için)
    const summary = getAnswerSummary(answers);
    
    // Önbellek için anahtar oluştur
    const cacheKey = createCacheKey(auraType, summary.answerPattern);
    
    // Önbellekte bu içgörüleri daha önce oluşturup oluşturmadığımızı kontrol et
    const cachedInsights = localStorage.getItem(`auralize_insights_${cacheKey}`);
    if (cachedInsights) {
      console.log('[LLAMA] İçgörüler önbellekten alındı:', cacheKey);
      const parsed = JSON.parse(cachedInsights);
      return { ...parsed, source: 'llama' as const };
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
    
    console.log('[LLAMA] İçgörü isteği gönderiliyor...');
    
    try {
      // Fetch API ile deneyerek CORS sorununu aşmaya çalışalım
      try {
        console.log('[LLAMA] Fetch API ile içgörü isteniyor...');
        const fetchResponse = await fetch(LLAMA_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'mode': 'no-cors'
          },
          body: JSON.stringify({
            model: 'llama3.1:latest',
            messages: messages,
            temperature: 0.4,
            max_tokens: 4000, // İki içeriği de alabilmek için daha yüksek token limiti
            stream: false
          })
        });
        
        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json();
          console.log('[LLAMA] Fetch API içgörü yanıtı alındı');
          
          if (fetchData.message && fetchData.message.content) {
            const insightsText = fetchData.message.content;
            
            // Yanıttan içgörüleri çıkar
            const strengthsMatch = insightsText.match(/(?:GÜÇLÜ YÖNLERİ|GÜÇLÜ YÖNLER|DUYGUSAL GÜÇLÜ YÖNLERİ):\s*([\s\S]*?)(?=\d\.|POTANSİYELİ:|POTANSİYEL:|DUYGUSAL POTANSİYELİ:|$)/i);
            const potentialMatch = insightsText.match(/(?:POTANSİYELİ|POTANSİYEL|DUYGUSAL POTANSİYELİ):\s*([\s\S]*?)(?=\d\.|DÜŞÜNME STİLİ:|ÇALIŞMA STİLİ:|DUYGUSAL TEPKİ STİLİ:|$)/i);
            const thinkingStyleMatch = insightsText.match(/(?:DÜŞÜNME STİLİ|ÇALIŞMA STİLİ|DUYGUSAL TEPKİ STİLİ):\s*([\s\S]*?)(?=\d\.|AURA BAŞLIĞI:|RUH HALİ BAŞLIĞI:|GELİŞİM BAŞLIĞI:|KARİYER BAŞLIĞI:|BAŞLIK:|$)/i);
            const auraTitleMatch = insightsText.match(/(?:AURA BAŞLIĞI|RUH HALİ BAŞLIĞI|GELİŞİM BAŞLIĞI|KARİYER BAŞLIĞI|BAŞLIK):\s*([\s\S]*?)(?=\d\.|$)/i);
            
            const insightsData = {
              strengths: strengthsMatch ? strengthsMatch[1].trim() : getDefaultInsights(auraType).strengths,
              potential: potentialMatch ? potentialMatch[1].trim() : getDefaultInsights(auraType).potential,
              thinkingStyle: thinkingStyleMatch ? thinkingStyleMatch[1].trim() : getDefaultInsights(auraType).thinkingStyle,
              auraTitle: auraTitleMatch ? auraTitleMatch[1].trim() : `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
            };
            
            // Önbelleğe kaydet
            localStorage.setItem(`auralize_insights_${cacheKey}`, JSON.stringify(insightsData));
            
            return { ...insightsData, source: 'llama' as const };
          }
        }
      } catch (fetchError: any) {
        console.log('[LLAMA] Fetch API içgörü hatası:', fetchError?.message || 'Bilinmeyen hata');
      }
      
      // XMLHttpRequest kullanarak direkt istek gönderelim
      const llamaResponse = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', LLAMA_API_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = LLAMA_TIMEOUT;
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (parseError) {
              reject(new Error('API yanıtı JSON olarak ayrıştırılamadı: ' + parseError));
            }
          } else {
            reject(new Error('API isteği başarısız: ' + xhr.status + ' ' + xhr.statusText));
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Ağ hatası oluştu'));
        };
        
        xhr.ontimeout = function() {
          reject(new Error('İstek zaman aşımına uğradı'));
        };
        
        const requestData = JSON.stringify({
          model: 'llama3.1:latest',
          messages: messages,
          temperature: 0.5,
          max_tokens: 4000, // Token limitini artıralım
          stream: false
        });
        
        xhr.send(requestData);
      });
      
      console.log('[LLAMA] İçgörü yanıtı alındı');
      
      // Yanıtı işle
      let insightsText = '';
      if (llamaResponse && llamaResponse.message && llamaResponse.message.content) {
        insightsText = llamaResponse.message.content;
      } else if (llamaResponse && llamaResponse.choices && llamaResponse.choices.length > 0) {
        insightsText = llamaResponse.choices[0].message.content;
      } else {
        throw new Error('LLaMA API yanıtı beklenmeyen formatta');
      }
      
      // Yanıttan içgörüleri çıkar
      const strengthsMatch = insightsText.match(/(?:GÜÇLÜ YÖNLERİ|GÜÇLÜ YÖNLER|DUYGUSAL GÜÇLÜ YÖNLERİ):\s*([\s\S]*?)(?=\d\.|POTANSİYELİ:|POTANSİYEL:|DUYGUSAL POTANSİYELİ:|$)/i);
      const potentialMatch = insightsText.match(/(?:POTANSİYELİ|POTANSİYEL|DUYGUSAL POTANSİYELİ):\s*([\s\S]*?)(?=\d\.|DÜŞÜNME STİLİ:|ÇALIŞMA STİLİ:|DUYGUSAL TEPKİ STİLİ:|$)/i);
      const thinkingStyleMatch = insightsText.match(/(?:DÜŞÜNME STİLİ|ÇALIŞMA STİLİ|DUYGUSAL TEPKİ STİLİ):\s*([\s\S]*?)(?=[\s\n]*AURA BAŞLIĞI:|RUH HALİ BAŞLIĞI:|GELİŞİM BAŞLIĞI:|KARİYER BAŞLIĞI:|BAŞLIK:|🤖|$)/i);
      const auraTitleMatch = insightsText.match(/(?:AURA BAŞLIĞI|RUH HALİ BAŞLIĞI|GELİŞİM BAŞLIĞI|KARİYER BAŞLIĞI|BAŞLIK):[\s\n]*([\s\S]*?)(?=[\s\n]|$)/i);
      
      const insightsData = {
        strengths: strengthsMatch ? strengthsMatch[1].trim() : getDefaultInsights(auraType).strengths,
        potential: potentialMatch ? potentialMatch[1].trim() : getDefaultInsights(auraType).potential,
        thinkingStyle: thinkingStyleMatch ? thinkingStyleMatch[1].trim() : getDefaultInsights(auraType).thinkingStyle,
        auraTitle: auraTitleMatch ? auraTitleMatch[1].trim().replace(/^["'"']|["'"']$/g, '') : `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
      };
      
      // Önbelleğe kaydet
      localStorage.setItem(`auralize_insights_${cacheKey}`, JSON.stringify(insightsData));
      
      return { ...insightsData, source: 'llama' as const };
    } catch (requestError) {
      console.error('[LLAMA] İçgörü isteği sırasında hata oluştu:', requestError);
      
      // Axios ile alternatif deneme
      try {
        console.log('[LLAMA] XMLHttpRequest başarısız, axios ile içgörü isteniyor...');
        const response = await axios.post(
          LLAMA_API_URL,
          {
            model: 'llama3.1:latest',
            messages: messages,
            temperature: 0.5, // Daha düşük sıcaklık değeri (daha kesin yanıtlar)
            max_tokens: 4000, // Token limitini artıralım
            stream: false
          },
          {
            headers: LLAMA_HEADERS,
            timeout: LLAMA_TIMEOUT,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
          }
        );
        
        // Yanıtı işle
        if (response.data && response.data.choices && response.data.choices.length > 0) {
          const insightsText = response.data.choices[0].message.content;
          console.log('[LLAMA] Axios ile içgörü yanıtı alındı');
          
          // Yanıttan içgörüleri çıkar
          const strengthsMatch = insightsText.match(/(?:GÜÇLÜ YÖNLERİ|GÜÇLÜ YÖNLER|DUYGUSAL GÜÇLÜ YÖNLERİ):\s*([\s\S]*?)(?=\d\.|POTANSİYELİ:|POTANSİYEL:|DUYGUSAL POTANSİYELİ:|$)/i);
          const potentialMatch = insightsText.match(/(?:POTANSİYELİ|POTANSİYEL|DUYGUSAL POTANSİYELİ):\s*([\s\S]*?)(?=\d\.|DÜŞÜNME STİLİ:|ÇALIŞMA STİLİ:|DUYGUSAL TEPKİ STİLİ:|$)/i);
          const thinkingStyleMatch = insightsText.match(/(?:DÜŞÜNME STİLİ|ÇALIŞMA STİLİ|DUYGUSAL TEPKİ STİLİ):\s*([\s\S]*?)(?=[\s\n]*AURA BAŞLIĞI:|RUH HALİ BAŞLIĞI:|GELİŞİM BAŞLIĞI:|KARİYER BAŞLIĞI:|BAŞLIK:|🤖|$)/i);
          const auraTitleMatch = insightsText.match(/(?:AURA BAŞLIĞI|RUH HALİ BAŞLIĞI|GELİŞİM BAŞLIĞI|KARİYER BAŞLIĞI|BAŞLIK):[\s\n]*([\s\S]*?)(?=[\s\n]|$)/i);
          
          const insightsData = {
            strengths: strengthsMatch ? strengthsMatch[1].trim() : getDefaultInsights(auraType).strengths,
            potential: potentialMatch ? potentialMatch[1].trim() : getDefaultInsights(auraType).potential,
            thinkingStyle: thinkingStyleMatch ? thinkingStyleMatch[1].trim() : getDefaultInsights(auraType).thinkingStyle,
            auraTitle: auraTitleMatch ? auraTitleMatch[1].trim().replace(/^["'"']|["'"']$/g, '') : `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
          };
          
          // Önbelleğe kaydet
          localStorage.setItem(`auralize_insights_${cacheKey}`, JSON.stringify(insightsData));
          
          return { ...insightsData, source: 'llama' as const };
        }
      } catch (axiosError) {
        console.error('[LLAMA] Axios ile de içgörü isteği başarısız oldu:', axiosError);
      }
      
      // Hata durumunda varsayılan içgörüleri döndür
      console.log('[LLAMA] Varsayılan içgörülere dönülüyor');
      return getDefaultInsights(auraType);
    }
  } catch (error) {
    console.error('[AURA_SERVICE] API çağrısı başarısız:', error);
    // Hata durumunda varsayılan içgörüleri döndür
    return getDefaultInsights(auraType);
  }
};

// Insights için system prompt
export const getInsightsPromptForAuraType = (auraType: string, answerDetails: string): string => {
  switch (auraType) {
    case 'creative':
      return `Sen Auralize adlı yaratıcı kişilik analiz platformu için içgörü üreten bir uzmansın.
Kullanıcı bir yaratıcı aura testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcının yaratıcı profili hakkında dört spesifik içgörü üret:
1. GÜÇLÜ YÖNLERİ: Kullanıcının yaratıcı süreçteki en güçlü yanları. (1-2 cümle)
2. POTANSİYELİ: Kullanıcının keşfedebileceği yaratıcı potansiyel alanları. (1-2 cümle)
3. DÜŞÜNME STİLİ: Kullanıcının yaratıcı düşünme ve problem çözme yaklaşımı. (1-2 cümle)
4. AURA BAŞLIĞI: Kullanıcının yaratıcı aurasını en iyi tanımlayan 3-5 kelimelik özgün bir başlık.

Her içgörü çok kısa, özlü ve kullanıcıya özgü olmalıdır. Yanıtında yalnızca bu dört bölümü içer,
başka açıklama ekleme.`;

    case 'mood':
      return `Sen Auralize adlı ruh hali analiz platformu için içgörü üreten bir duygu uzmanısın.
Kullanıcı bir ruh hali testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcının duygusal profili hakkında dört spesifik içgörü üret:
1. DUYGUSAL GÜÇLÜ YÖNLERİ: Kullanıcının mevcut duygusal durumunda öne çıkan güçlü yönleri ve duygusal zekanın hangi yönlerinde başarılı olduğu. Virgülle ayrılmış, maksimum 5 güçlü yön olacak şekilde listeleyiniz. Örneğin: "duygusal farkındalık, iletişim, empati, denge, kendini motive etme".

2. DUYGUSAL POTANSİYELİ: Kullanıcının duygusal durumunu nasıl daha olumlu yöne çevirebileceği ve geliştirilebilecek duygusal beceriler. Virgülle ayrılmış, maksimum 5 potansiyel alan olacak şekilde listeleyiniz. Örneğin: "duygusal zeka geliştirme, meditasyon, kendini ifade etme, sanatsal aktiviteler, ilişki kurma".

3. DUYGUSAL TEPKİ STİLİ: Kullanıcının duygusal uyaranlara nasıl tepki verdiği, düşünme biçimi ve duygusal karar verme yaklaşımı. Virgülle ayrılmış, maksimum 5 stil ifadesi olacak şekilde listeleyiniz. Örneğin: "analitik, sezgisel, koruyucu, dengeli, yansıtıcı".

4. RUH HALİ BAŞLIĞI: Kullanıcının mevcut ruh halini en iyi tanımlayan 3-5 kelimelik özgün bir başlık.

İçgörüler kısa, özlü, özelleştirilmiş ve kullanıcıya ilham verecek nitelikte olmalı. Her bir kategori için virgülle ayrılmış, öz ifadeler kullan. Yanıtında yalnızca bu dört bölümü içer, fazladan açıklama ekleme.

ÖNEMLI: Yanıtın şu formatında olmalı:
GÜÇLÜ YÖNLER: [virgülle ayrılmış liste]
POTANSİYEL: [virgülle ayrılmış liste]
DÜŞÜNME STİLİ: [virgülle ayrılmış liste]
BAŞLIK: [3-5 kelimelik başlık]`;

    case 'personal':
      return `Sen Auralize adlı kişisel gelişim platformu için içgörü üreten bir kişisel gelişim koçusun.
Kullanıcı bir kişisel gelişim testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcının kişisel gelişim profili hakkında dört spesifik içgörü üret:
1. GÜÇLÜ YÖNLERİ: Kullanıcının kişisel gelişim yolculuğundaki en güçlü yanları. (1-2 cümle)
2. POTANSİYELİ: Kullanıcının geliştirebileceği potansiyel alanlar. (1-2 cümle)
3. DÜŞÜNME STİLİ: Kullanıcının öğrenme ve kişisel gelişim yaklaşımı. (1-2 cümle)
4. GELİŞİM BAŞLIĞI: Kullanıcının kişisel gelişim yolunu en iyi tanımlayan 3-5 kelimelik özgün bir başlık.

Her içgörü çok kısa, özlü ve kullanıcıya özgü olmalıdır. Yanıtında yalnızca bu dört bölümü içer,
başka açıklama ekleme.`;

    case 'career':
      return `Sen Auralize adlı kariyer analiz platformu için içgörü üreten bir kariyer danışmanısın.
Kullanıcı bir kariyer yönlendirme testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcının kariyer profili hakkında dört spesifik içgörü üret:
1. GÜÇLÜ YÖNLERİ: Kullanıcının profesyonel anlamda en güçlü yanları. (1-2 cümle)
2. POTANSİYELİ: Kullanıcının keşfedebileceği kariyer alanları ve fırsatlar. (1-2 cümle)
3. ÇALIŞMA STİLİ: Kullanıcının iş yaklaşımı ve profesyonel ortamdaki düşünme tarzı. (1-2 cümle)
4. KARİYER BAŞLIĞI: Kullanıcının kariyer yolunu en iyi tanımlayan 3-5 kelimelik özgün bir başlık.

Her içgörü çok kısa, özlü ve kullanıcıya özgü olmalıdır. Yanıtında yalnızca bu dört bölümü içer,
başka açıklama ekleme.`;

    default:
      return `Sen Auralize adlı platformun içgörü uzmanısın. Kullanıcının verdiği yanıtlara göre
kişiselleştirilmiş içgörüler üreteceksin.

Kullanıcının cevapları:

${answerDetails}

Bu yanıtlara dayanarak, kullanıcı hakkında dört spesifik içgörü üret:
1. GÜÇLÜ YÖNLERİ: Kullanıcının en güçlü yanları. (1 paragraf)
2. POTANSİYELİ: Kullanıcının keşfedebileceği potansiyel alanlar. (1 paragraf)
3. DÜŞÜNME STİLİ: Kullanıcının düşünme ve problem çözme yaklaşımı. (1 paragraf)
4. AURA BAŞLIĞI: Kullanıcıyı en iyi tanımlayan 3-5 kelimelik özgün bir başlık.

Her içgörü net, özlü ve kullanıcıya özgü olmalıdır. Yanıtında yalnızca bu dört bölümü içer,
başka açıklama ekleme.`;
  }
};

// Llama API'sine istek gönderme fonksiyonu
const getAuraStoryFromLlama = async (
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
    
    // XMLHttpRequest kullanarak direkt istek gönderelim (CORS sorunu için)
    try {
      console.log('[LLAMA] HTTP POST isteği başlatılıyor...');
      
      // Fetch API kullanarak basit POST isteği yapalım (CORS sorununu aşmak için)
      try {
        console.log('[LLAMA] Fetch API ile POST isteği deneniyor...');
        const fetchResponse = await fetch(LLAMA_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'mode': 'no-cors'
          },
          body: JSON.stringify({
            model: 'llama3.1:latest',
            messages: messages,
            temperature: 0.4,
            max_tokens: 4000, // Token limitini artıralım
            stream: false
          })
        });
        
        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json();
          console.log('[LLAMA] Fetch API yanıtı alındı:', fetchData);
          
          // İçeriği kontrol et ve döndür
          if (fetchData.message && fetchData.message.content) {
            return fetchData.message.content.trim();
          }
        } else {
          console.log('[LLAMA] Fetch API başarısız, diğer yöntemler deneniyor. Status:', fetchResponse.status);
        }
      } catch (fetchError: any) {
        console.log('[LLAMA] Fetch API hatası:', fetchError?.message || 'Bilinmeyen hata');
      }
      
      // XMLHttpRequest ile dene
      const llamaResponse = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', LLAMA_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = LLAMA_TIMEOUT;
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (parseError) {
              reject(new Error('API yanıtı JSON olarak ayrıştırılamadı: ' + parseError));
            }
          } else {
            reject(new Error('API isteği başarısız: ' + xhr.status + ' ' + xhr.statusText));
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Ağ hatası oluştu'));
        };
        
        xhr.ontimeout = function() {
          reject(new Error('İstek zaman aşımına uğradı'));
        };
        
        const requestData = JSON.stringify({
          model: 'llama3.1:latest',
          messages: messages,
          temperature: 0.5,
          max_tokens: 4000, // Token limitini artıralım
          stream: false
        });
        
        xhr.send(requestData);
      });
      
      console.log('');
      console.log('==== LLAMA API YANITI ALINDI ====');
      console.log('[LLAMA] Yanıt alındı:', llamaResponse);
      console.log('====================================');
      console.log('');
      
      // Llama'dan yanıt olarak metin içeriğini çıkart
      let storyContent = '';
      
      if (llamaResponse && llamaResponse.message && llamaResponse.message.content) {
        storyContent = llamaResponse.message.content;
        console.log('[LLAMA] Yanıt içeriği (ilk 100 karakter):', storyContent.substring(0, 100) + '...');
      } else if (llamaResponse && llamaResponse.choices && llamaResponse.choices[0] && llamaResponse.choices[0].message) {
        // Alternatif API yanıt formatı
        storyContent = llamaResponse.choices[0].message.content;
        console.log('[LLAMA] Alternatif yanıt formatı kullanıldı');
      } else if (llamaResponse && llamaResponse.content) {
        // Daha basit API yanıt formatı
        storyContent = llamaResponse.content;
        console.log('[LLAMA] Basit yanıt formatı kullanıldı');
      } else {
        console.error('[LLAMA] Bilinmeyen API yanıt formatı:', llamaResponse);
        throw new Error('Bilinmeyen API yanıt formatı');
      }
      
      // Eğer storyContent boşsa veya çok kısaysa hata fırlat
      if (!storyContent || storyContent.length < 10) {
        console.error('[LLAMA] Geçersiz hikaye içeriği:', storyContent);
        throw new Error('Geçersiz hikaye içeriği');
      }
      
      // Llama yanıtını işaretle ve döndür
      return storyContent.trim();
    } catch (requestError: any) {
      console.error('');
      console.error('==== LLAMA API HATASI ====');
      console.error('[LLAMA] API isteği sırasında hata oluştu:', requestError.message);
      
      // Timeout hatası özel olarak ele alınıyor
      if (requestError.code === 'ECONNABORTED' || requestError.message.includes('zaman aşımı')) {
        console.error('[LLAMA] İstek zaman aşımına uğradı (timeout). Süre artırılabilir veya model parametreleri optimize edilebilir.');
      } else if (requestError.response) {
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
      
      // Axios ile de bir dene
      try {
        console.log('[LLAMA] XMLHttpRequest başarısız, axios ile deneniyor...');
        const axiosResponse = await axios.post(
          LLAMA_URL,
          {
            model: 'llama3.1:latest',
            messages: messages,
            temperature: 0.5,
            max_tokens: 4000, // Token limitini artıralım
            stream: false
          },
          {
            headers: LLAMA_HEADERS,
            timeout: LLAMA_TIMEOUT,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
          }
        );
        
        if (axiosResponse.data && axiosResponse.data.message && axiosResponse.data.message.content) {
          const axiosContent = axiosResponse.data.message.content;
          console.log('[LLAMA] Axios ile yanıt alındı:', axiosContent.substring(0, 100) + '...');
          return axiosContent.trim();
        }
      } catch (axiosError) {
        console.error('[LLAMA] Axios ile de başarısız:', axiosError);
      }
      
      // Hata detayını günlüğe kaydet ve varsayılan hikayeye dön
      return `__default__${auraTypes[auraType as keyof typeof auraTypes]?.description || 'Varsayılan aura hikayesi.'}`;
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

// Kısa özet hikaye oluşturma (hızlı yükleme için)
const getQuickAuraSummary = async (
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
        model: DEEPSEEK_MODEL,
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
          headers: LLAMA_HEADERS,
          timeout: LLAMA_TIMEOUT,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
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
      
      // Timeout hatası özel olarak ele alınıyor
      if (requestError.code === 'ECONNABORTED') {
        console.error('[LLAMA_SUMMARY] İstek zaman aşımına uğradı (timeout). Varsayılan özete dönülüyor.');
      } else if (requestError.response) {
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
      
      // Varsayılan özete dön
      return getQuickDefaultSummary(auraType, username);
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
    : { answerCounts: { a: 0, b: 0, c: 0, d: 0 }, answerPattern: '', answerDetails: '', dominantTrait: '', secondaryTrait: '' };
  
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

// Hem aura hikayesi hem de içgörüleri tek bir istekte almak için birleştirilmiş fonksiyon
export const getCombinedAuraDataFromLlama = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string }
): Promise<{
  story: string,
  strengths: string,
  potential: string,
  thinkingStyle: string,
  auraTitle: string,
  source: 'llama' | 'default' | 'api'
}> => {
  try {
    console.log('[LLAMA] İstek başlatılıyor...', new Date().toLocaleTimeString());
    
    // Cevapları özetle (daha detaylı bilgi oluşturmak için)
    const summary = getAnswerSummary(answers);
    
    // Önbellek için anahtar oluştur
    const cacheKey = createCacheKey(auraType, summary.answerPattern);
    
    // Önbellekte bu içeriği daha önce oluşturup oluşturmadığımızı kontrol et
    const cachedCombinedData = localStorage.getItem(`auralize_combined_${cacheKey}`);
    if (cachedCombinedData) {
      console.log('[LLAMA] Birleştirilmiş veri önbellekten alındı:', cacheKey);
      const parsed = JSON.parse(cachedCombinedData);
      return { ...parsed, source: 'llama' as const };
    }
    
    // Birleştirilmiş veri için sistem prompt oluştur
    const combinedPrompt = getCombinedPromptForAuraType(auraType, summary.answerDetails, username);
    
    const messages = [
      {
        role: "system",
        content: combinedPrompt
      },
      {
        role: "user",
        content: `Merhaba, ben ${username}. Test sonuçlarıma göre aura hikayemi ve içgörülerimi tek seferde hazırlar mısın?`
      }
    ];
    
    console.log('[LLAMA] Birleştirilmiş içerik isteği gönderiliyor...');
    
    // Zaman aşımı kontrolü için manuel zaman aşımı ayarı
    const REQUEST_TIMEOUT = 180000; // 3 dakika
    
    // API isteği için Promise oluştur
    const fetchPromise = new Promise<any>(async (resolve, reject) => {
      // Zaman aşımı kontrolü için
      const timeoutId = setTimeout(() => {
        console.log('[LLAMA] İstek zaman aşımına uğradı! API yanıt vermedi.');
        reject(new Error('API isteği zaman aşımına uğradı'));
      }, REQUEST_TIMEOUT);
      
      try {
        // Fetch API ile istek gönder
        const fetchResponse = await fetch(LLAMA_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama3.1:latest',
            messages: messages,
            temperature: 0.4,
            max_tokens: 4000, // İki içeriği de alabilmek için daha yüksek token limiti
            stream: false
          })
        });
        
        // Zaman aşımı kontrolünü temizle
        clearTimeout(timeoutId);
        
        console.log('[LLAMA] API yanıtı durumu:', fetchResponse.status);
        console.log('[LLAMA] API yanıtı zamanı:', new Date().toLocaleTimeString());
        
        if (fetchResponse.ok) {
          try {
            const fetchData = await fetchResponse.json();
            console.log('[LLAMA] Birleştirilmiş içerik yanıtı alındı');
            resolve(fetchData);
          } catch (parseError) {
            console.error('[LLAMA] API yanıtı ayrıştırılamadı:', parseError);
            reject(parseError);
          }
        } else {
          console.error('[LLAMA] API isteği başarısız:', fetchResponse.status, fetchResponse.statusText);
          reject(new Error(`API isteği başarısız: ${fetchResponse.status} ${fetchResponse.statusText}`));
        }
      } catch (fetchError: any) {
        // Zaman aşımı kontrolünü temizle
        clearTimeout(timeoutId);
        
        console.error('[LLAMA] Fetch API hatası:', fetchError?.message || 'Bilinmeyen hata');
        reject(fetchError);
      }
    });
    
    // API yanıtını bekle - zaman aşımı durumu ele alınacak
    const fetchData = await fetchPromise;
    
    if (fetchData.message && fetchData.message.content) {
      const combinedText = fetchData.message.content;
      console.log('[LLAMA] Metin yanıtı alındı:', combinedText.substring(0, 100) + '...');
      
      // JSON formatında yanıt bekliyoruz, bunu parse etmeye çalışalım
      try {
        // İlk olarak yanıtın doğrudan JSON olarak parse edilebilir olup olmadığını kontrol et
        const parsedData = JSON.parse(combinedText);
        console.log('[LLAMA] Yanıt başarıyla JSON olarak ayrıştırıldı');
        
        // JSON formatı başarıyla parse edildi, veriyi kullan
        const combinedData = {
          story: parsedData.story || "",
          strengths: parsedData.strengths || "",
          potential: parsedData.potential || "", 
          thinkingStyle: parsedData.thinkingStyle || "",
          auraTitle: parsedData.auraTitle || `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
        };
        
        // Önbelleğe kaydet
        localStorage.setItem(`auralize_combined_${cacheKey}`, JSON.stringify(combinedData));
        console.log('[LLAMA] Veri önbelleğe kaydedildi');
        
        return { ...combinedData, source: 'llama' as const };
      } catch (jsonError) {
        console.log('[LLAMA] JSON parse hatası, manuel ayıklama denenecek:', jsonError);
        
        // JSON parse edilemedi, regex ile içerikleri ayıklamayı dene
        // Hikaye bölümünü ayıkla - önce başlıklı format için dene
        let storyMatch = combinedText.match(/HİKAYE:[\s\n]*([\s\S]*?)(?=[\s\n]*GÜÇLÜ YÖNLERİ:|$)/i);
        
        // Eğer başlıklı format bulunamadıysa, metindeki ilk bölümü hikaye olarak al
        if (!storyMatch) {
          console.log('[LLAMA] Başlıksız hikaye formatı algılandı, ilk paragraflar bulunuyor');
          
          // "📖Aura Hikayen" veya "Aura Hikayen" formatı için özel kontrol
          const auraStoryMatch = combinedText.match(/(?:📖)?Aura Hikayen.*?[\r\n]+([\s\S]*?)(?=(?:🎨|💡|🌟|GÜÇLÜ YÖNLERİ:|Aura Görselin|Aura İçgörülerin|Güçlü Yönlerin))/i);
          
          if (auraStoryMatch && auraStoryMatch[1].trim().length > 20) {
            storyMatch = auraStoryMatch;
            console.log('[LLAMA] Aura Hikayen başlığı altında içerik bulundu, uzunluk:', auraStoryMatch[1].trim().length);
          } else {
            // Eğer başlık bulunamadıysa veya içerik çok kısaysa, ilk paragrafları hikaye olarak al
            const paragraphs = combinedText.split(/\n\n+/).filter((p: string) => p.trim().length > 30);
            if (paragraphs.length > 0) {
              // İlk bölümü hikaye olarak al (içgörüler başlayana kadar)
              const storyPart = paragraphs
                .slice(0, Math.min(5, paragraphs.length))
                .join('\n\n');
              
              // Eğer içerikte emoji varsa, bu emoji'ye kadar olan kısmı al
              const emojiIndex = storyPart.search(/(?:🎨|💡|🌟)/);
              const cleanStoryPart = emojiIndex > 30 ? storyPart.substring(0, emojiIndex).trim() : storyPart;
              
              storyMatch = { 1: cleanStoryPart };
              console.log('[LLAMA] İlk paragraflar hikaye olarak alındı, uzunluk:', cleanStoryPart.length);
            }
          }
        }
        
        // "Aura Görselin" satırını temizle (eğer hikaye içinde kalmışsa)
        if (storyMatch && storyMatch[1]) {
          let storyText = storyMatch[1];
          
          // "Aura Görselin" satırını ve sonrasını temizle
          const auraGorselinIndex = storyText.search(/(?:🎨\s*Aura Görselin|Aura Görselin|Stable Diffusion)/i);
          if (auraGorselinIndex > -1) {
            storyText = storyText.substring(0, auraGorselinIndex).trim();
          }
          
          storyMatch[1] = storyText;
        }
        
        // Ham metinde daha geniş bir parçayı ayıklamak için alternatif yaklaşım uygula
        if (!storyMatch || storyMatch[1].trim().length < 100) {
          console.log('[LLAMA] Mevcut hikaye çok kısa, daha büyük bir bölüm ayrıştırılıyor');
          
          // Tüm metni al ve içgörüler bölümüne kadar olan kısmı hikaye olarak kabul et
          const fullTextAuroraStoryMatch = combinedText.match(/([\s\S]*?)(?=(?:💡\s*Aura İçgörülerin|🌟\s*Güçlü Yönlerin|GÜÇLÜ YÖNLERİ:))/);
          if (fullTextAuroraStoryMatch && fullTextAuroraStoryMatch[1].trim().length > 150) {
            let fullStory = fullTextAuroraStoryMatch[1].trim();
            
            // "Aura Görselin" satırını ve sonrasını temizle
            const auraGorselinIndex = fullStory.search(/(?:🎨\s*Aura Görselin|Aura Görselin|Stable Diffusion)/i);
            if (auraGorselinIndex > -1) {
              fullStory = fullStory.substring(0, auraGorselinIndex).trim();
            }
            
            storyMatch = { 1: fullStory };
            console.log('[LLAMA] Daha büyük bir hikaye bölümü ayıklandı, uzunluk:', fullStory.length);
          }
        }
        
        // Hikayeyi temizle
        const story = storyMatch ? 
          storyMatch[1]
            .trim()
            .replace(/^\*\*|\*\*$/g, '') // Başta ve sonda ** işaretlerini temizle
            .replace(/^["'"']|["'"']$/g, '') // Başta ve sonda tırnak işaretlerini temizle
            .replace(/Auralize tarafından oluşturuldu.*$/im, '') // Oluşturuldu metinlerini temizle
            .replace(/Bu içerikler sizin için hazırlanmıştır.*$/i, '') // Kapanış cümlesini temizle
            .replace(/\*\*GÜÇLÜ YÖNLERİ:.*$/i, '') // Sonraki başlıkları temizle
            .replace(/📖\s*Aura Hikayen/i, '') // Başlığı temizle
            .trim()
          : "";
        
        console.log('[LLAMA] Son hikaye uzunluğu:', story.length, 'karakter');
        
        // İçgörüleri farklı şekillerde ayıklamayı dene
        let strengthsMatch = combinedText.match(/GÜÇLÜ YÖNLERİ:[\s\n]*([\s\S]*?)(?=[\s\n]*POTANSİYELİ:|🚀|$)/i);
        let potentialMatch = combinedText.match(/POTANSİYELİ:[\s\n]*([\s\S]*?)(?=[\s\n]*DÜŞÜNME STİLİ:|ÇALIŞMA STİLİ:|🧠|$)/i);
        let thinkingStyleMatch = combinedText.match(/(?:DÜŞÜNME STİLİ|ÇALIŞMA STİLİ):[\s\n]*([\s\S]*?)(?=[\s\n]*AURA BAŞLIĞI:|RUH HALİ BAŞLIĞI:|GELİŞİM BAŞLIĞI:|KARİYER BAŞLIĞI:|🤖|$)/i);
        let auraTitleMatch = combinedText.match(/(?:AURA BAŞLIĞI|RUH HALİ BAŞLIĞI|GELİŞİM BAŞLIĞI|KARİYER BAŞLIĞI):[\s\n]*([\s\S]*?)(?=[\s\n]|$)/i);
        
        // Emoji formatında içgörüleri ayıkla
        if (!strengthsMatch) {
          strengthsMatch = combinedText.match(/🌟[\s\n]*Güçlü Yönlerin[\s\n]*([\s\S]*?)(?=[\s\n]*🚀|$)/i);
        }
        
        if (!potentialMatch) {
          potentialMatch = combinedText.match(/🚀[\s\n]*Potansiyelin[\s\n]*([\s\S]*?)(?=[\s\n]*🧠|$)/i);
        }
        
        if (!thinkingStyleMatch) {
          thinkingStyleMatch = combinedText.match(/🧠[\s\n]*Düşünme Tarzın[\s\n]*([\s\S]*?)(?=[\s\n]*🤖|$)/i);
        }
        
        console.log('[LLAMA] Güçlü yönler bulundu:', !!strengthsMatch);
        console.log('[LLAMA] Potansiyel bulundu:', !!potentialMatch);
        console.log('[LLAMA] Düşünme stili bulundu:', !!thinkingStyleMatch);
        console.log('[LLAMA] Aura başlığı bulundu:', !!auraTitleMatch);
        
        // İçgörülerin temizlenmesi için yardımcı fonksiyon
        const cleanInsight = (text: string | undefined): string => {
          if (!text) return "";
          return text
            .trim()
            .replace(/^\*\*|\*\*$/g, '') // Başta ve sonda ** işaretlerini temizle
            .replace(/^["'"']|["'"']$/g, '') // Başta ve sonda tırnak işaretlerini temizle
            .replace(/\*\*POTANSİYELİ:.*$/i, '') // Sonraki başlıkları temizle
            .replace(/\*\*DÜŞÜNME STİLİ:.*$/i, '') // Sonraki başlıkları temizle
            .replace(/\*\*AURA BAŞLIĞI:.*$/i, '') // Sonraki başlıkları temizle
            .replace(/Bu içerikler sizin için hazırlanmıştır.*$/i, '') // Kapanış cümlesini temizle
            .replace(/Umarım değer vermişsinizdir.*$/i, '') // Kapanış cümlesini temizle
        };
        
        const combinedData = {
          story: story,
          strengths: strengthsMatch ? cleanInsight(strengthsMatch[1]) : "",
          potential: potentialMatch ? cleanInsight(potentialMatch[1]) : "",
          thinkingStyle: thinkingStyleMatch ? cleanInsight(thinkingStyleMatch[1]) : "",
          auraTitle: auraTitleMatch ? auraTitleMatch[1].trim().replace(/^["'"']|["'"']$/g, '') : `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
        };
        
        // Alternatif ayrıştırma için daha sıkı regex kalıpları
        if (!strengthsMatch && combinedText.includes("GÜÇLÜ YÖNLERİ")) {
          // İçeriğin tamamını parçalara ayır
          const parts = combinedText.split(/\*\*|GÜÇLÜ YÖNLERİ:|POTANSİYELİ:|DÜŞÜNME STİLİ:|AURA BAŞLIĞI:/i);
          console.log('[LLAMA] Alternatif ayrıştırma denenecek, bölümler:', parts.length);
          
          // Temizlenmiş parçaları al
          const cleanParts = parts.map((p: string) => p.trim()).filter((p: string) => p.length > 0);
          
          if (cleanParts.length >= 4) {
            console.log('[LLAMA] Alternatif ayrıştırma başarılı');
            const combinedData = {
              story: story || cleanParts[0] || "",
              strengths: cleanParts.length > 1 ? cleanParts[1] : "",
              potential: cleanParts.length > 2 ? cleanParts[2] : "",
              thinkingStyle: cleanParts.length > 3 ? cleanParts[3] : "",
              auraTitle: cleanParts.length > 4 ? cleanParts[4] : `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`
            };
            
            // Önbelleğe kaydet
            localStorage.setItem(`auralize_combined_${cacheKey}`, JSON.stringify(combinedData));
            console.log('[LLAMA] Alternatif ayrıştırılmış veri önbelleğe kaydedildi');
            
            return { ...combinedData, source: 'llama' as const };
          }
        }
        
        // Veri önbelleğe kaydedildi
        localStorage.setItem(`auralize_combined_${cacheKey}`, JSON.stringify(combinedData));
        console.log('[LLAMA] Veri önbelleğe kaydedildi (manuel ayrıştırma)');
        
        return { ...combinedData, source: 'llama' as const };
      }
    } else {
      console.error('[LLAMA] API yanıtında içerik bulunamadı');
      throw new Error('API yanıtında içerik bulunamadı');
    }
    
  } catch (error) {
    console.error('[AURA_SERVICE] Birleştirilmiş veri API çağrısı başarısız:', error);
    // Hata durumunda varsayılan içerikleri döndür - içeriği boş bırak
    return {
      story: "",
      strengths: "",
      potential: "",
      thinkingStyle: "",
      auraTitle: "",
      source: 'default' as const
    };
  }
};

// Birleştirilmiş içerik için prompt
export const getCombinedPromptForAuraType = (auraType: string, answerDetails: string, username: string): string => {
  switch (auraType) {
    case 'creative':
      return `Sen Auralize adlı yaratıcı kişilik analiz platformu için içerik üreten bir uzmansın.
Kullanıcı bir yaratıcı aura testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcı için aşağıdaki bilgileri JSON formatında hazırla:
1. HİKAYE: Kullanıcının yaratıcı aurasını analiz eden kişiselleştirilmiş, DERİN ve KAPSAMLI bir öykü. Hikaye en az 800-1000 kelime uzunluğunda olmalı, zengin metaforlar, anlamlı içgörüler ve kullanıcının kişiliğine dair detaylı analizler içermeli. Hikaye, kullanıcıya ilham vermeli ve yaratıcı potansiyelini ortaya çıkarmasına yardımcı olmalı.
2. GÜÇLÜ YÖNLERİ: Kullanıcının yaratıcı süreçteki en güçlü yanları (1-2 cümle)
3. POTANSİYELİ: Kullanıcının keşfedebileceği yaratıcı potansiyel alanları (1-2 cümle)
4. DÜŞÜNME STİLİ: Kullanıcının yaratıcı düşünme ve problem çözme yaklaşımı (1-2 cümle)
5. AURA BAŞLIĞI: Kullanıcının yaratıcı aurasını en iyi tanımlayan 3-5 kelimelik özgün bir başlık

Yanıtını şu JSON formatında ver:
{
  "story": "Hikaye metni burada olacak (uzun ve kapsamlı)...",
  "strengths": "Güçlü yönler burada olacak...",
  "potential": "Potansiyel burada olacak...",
  "thinkingStyle": "Düşünme stili burada olacak...",
  "auraTitle": "Aura başlığı burada olacak..."
}

Eğer JSON formatında yanıt veremezsen, aşağıdaki formatta yanıt ver:

AURA HİKAYEN:
(Uzun, detaylı ve kapsamlı hikaye metni - en az 800-1000 kelime)

GÜÇLÜ YÖNLERİ:
(Güçlü yönler)

POTANSİYELİ:
(Potansiyel)

DÜŞÜNME STİLİ:
(Düşünme stili)

AURA BAŞLIĞI:
(Aura başlığı)

Hikaye kısmının uzun ve detaylı olması en önemli önceliktir - kullanıcının kişiliğini derinlemesine anlatan, en az 800-1000 kelimelik, ilham verici bir metin olmalıdır. Tüm içerikler ${username} için özel olarak kişiselleştirilmelidir.`;

    case 'mood':
      return `Sen Auralize adlı ruh hali analiz platformu için içerik üreten bir uzmansın.
Kullanıcı bir ruh hali testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcı için aşağıdaki bilgileri JSON formatında hazırla:
1. HİKAYE: Kullanıcının duygusal aurasını analiz eden kişiselleştirilmiş, DERİN ve KAPSAMLI bir öykü. Hikaye en az 800-1000 kelime uzunluğunda olmalı, kullanıcının duygusal yapısını, içinde bulunduğu ruh halini ve duygusal potansiyelini derinlemesine analiz etmeli.
2. GÜÇLÜ YÖNLERİ: Kullanıcının duygusal zekasının en güçlü yanları (1-2 cümle)
3. POTANSİYELİ: Kullanıcının duygusal olarak gelişebileceği alanlar (1-2 cümle)
4. DÜŞÜNME STİLİ: Kullanıcının duygusal yaklaşımı ve karar verme tarzı (1-2 cümle)
5. AURA BAŞLIĞI: Kullanıcının duygusal aurasını en iyi tanımlayan 3-5 kelimelik özgün bir başlık

Yanıtını şu JSON formatında ver:
{
  "story": "Hikaye metni burada olacak (uzun ve kapsamlı)...",
  "strengths": "Güçlü yönler burada olacak...",
  "potential": "Potansiyel burada olacak...",
  "thinkingStyle": "Düşünme stili burada olacak...",
  "auraTitle": "Aura başlığı burada olacak..."
}

Eğer JSON formatında yanıt veremezsen, aşağıdaki formatta yanıt ver:

AURA HİKAYEN:
(Uzun, detaylı ve kapsamlı hikaye metni - en az 800-1000 kelime)

GÜÇLÜ YÖNLERİ:
(Güçlü yönler)

POTANSİYELİ:
(Potansiyel)

DÜŞÜNME STİLİ:
(Düşünme stili)

AURA BAŞLIĞI:
(Aura başlığı)

Hikaye kısmının uzun ve detaylı olması en önemli önceliktir - kullanıcının duygusal yapısını derinlemesine anlatan, en az 800-1000 kelimelik, anlamlı bir metin olmalıdır. Tüm içerikler ${username} için özel olarak kişiselleştirilmelidir.`;

    case 'personal':
      return `Sen Auralize adlı kişisel gelişim platformu için içgörü üreten bir kişisel gelişim koçusun.
Kullanıcı bir kişisel gelişim testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcı için aşağıdaki bilgileri JSON formatında hazırla:
1. HİKAYE: Kullanıcının kişisel gelişim yolculuğunu analiz eden kişiselleştirilmiş, DERİN ve KAPSAMLI bir öykü. Hikaye en az 800-1000 kelime uzunluğunda olmalı, kullanıcının kişisel gelişim potansiyelini, güçlü yönlerini ve gelişim alanlarını detaylı bir şekilde ele almalı.
2. GÜÇLÜ YÖNLERİ: Kullanıcının kişisel gelişim sürecindeki en güçlü yanları (1-2 cümle)
3. POTANSİYELİ: Kullanıcının geliştirebileceği potansiyel alanlar (1-2 cümle)
4. DÜŞÜNME STİLİ: Kullanıcının öğrenme ve kişisel gelişim yaklaşımı. (1-2 cümle)
5. AURA BAŞLIĞI: Kullanıcının gelişim aurasını en iyi tanımlayan 3-5 kelimelik özgün bir başlık

Yanıtını şu JSON formatında ver:
{
  "story": "Hikaye metni burada olacak (uzun ve kapsamlı)...",
  "strengths": "Güçlü yönler burada olacak...",
  "potential": "Potansiyel burada olacak...",
  "thinkingStyle": "Düşünme stili burada olacak...",
  "auraTitle": "Aura başlığı burada olacak..."
}

Eğer JSON formatında yanıt veremezsen, aşağıdaki formatta yanıt ver:

AURA HİKAYEN:
(Uzun, detaylı ve kapsamlı hikaye metni - en az 800-1000 kelime)

GÜÇLÜ YÖNLERİ:
(Güçlü yönler)

POTANSİYELİ:
(Potansiyel)

DÜŞÜNME STİLİ:
(Düşünme stili)

AURA BAŞLIĞI:
(Aura başlığı)

Hikaye kısmının uzun ve detaylı olması en önemli önceliktir - kullanıcının kişisel gelişim potansiyelini derinlemesine anlatan, en az 800-1000 kelimelik, ilham verici bir metin olmalıdır. Tüm içerikler ${username} için özel olarak kişiselleştirilmelidir.`;

    case 'career':
      return `Sen Auralize adlı kariyer analiz platformu için içgörü üreten bir kariyer danışmanısın.
Kullanıcı bir kariyer yönlendirme testi tamamladı ve aşağıdaki cevapları verdi:

${answerDetails}

Bu cevaplara dayanarak, kullanıcı için aşağıdaki bilgileri JSON formatında hazırla:
1. HİKAYE: Kullanıcının kariyer aurasını analiz eden kişiselleştirilmiş, DERİN ve KAPSAMLI bir öykü. Hikaye en az 800-1000 kelime uzunluğunda olmalı, kullanıcının kariyer potansiyelini, profesyonel güçlü yönlerini ve gelişim alanlarını detaylı bir şekilde ele almalı.
2. GÜÇLÜ YÖNLERİ: Kullanıcının profesyonel ortamdaki en güçlü yanları (1-2 cümle)
3. POTANSİYELİ: Kullanıcının keşfedebileceği kariyer alanları ve potansiyelleri (1-2 cümle)
4. DÜŞÜNME STİLİ: Kullanıcının iş ortamındaki düşünme ve problem çözme yaklaşımı (1-2 cümle)
5. AURA BAŞLIĞI: Kullanıcının kariyer aurasını en iyi tanımlayan 3-5 kelimelik özgün bir başlık

Yanıtını şu JSON formatında ver:
{
  "story": "Hikaye metni burada olacak (uzun ve kapsamlı)...",
  "strengths": "Güçlü yönler burada olacak...",
  "potential": "Potansiyel burada olacak...",
  "thinkingStyle": "Düşünme stili burada olacak...",
  "auraTitle": "Aura başlığı burada olacak..."
}

Eğer JSON formatında yanıt veremezsen, aşağıdaki formatta yanıt ver:

AURA HİKAYEN:
(Uzun, detaylı ve kapsamlı hikaye metni - en az 800-1000 kelime)

GÜÇLÜ YÖNLERİ:
(Güçlü yönler)

POTANSİYELİ:
(Potansiyel)

DÜŞÜNME STİLİ:
(Düşünme stili)

AURA BAŞLIĞI:
(Aura başlığı)

Hikaye kısmının uzun ve detaylı olması en önemli önceliktir - kullanıcının kariyer potansiyelini derinlemesine anlatan, en az 800-1000 kelimelik, ilham verici bir metin olmalıdır. Tüm içerikler ${username} için özel olarak kişiselleştirilmelidir.`;

    default:
      return `Sen Auralize adlı platformun içerik uzmanısın. Kullanıcının verdiği yanıtlara göre
kişiselleştirilmiş bir hikaye ve içgörüler oluşturacaksın.

Kullanıcının cevapları:

${answerDetails}

Bu yanıtlara dayanarak, kullanıcı için aşağıdaki bilgileri hazırla:
1. HİKAYE: Kullanıcının kişiliğini ve potansiyelini anlatan, kapsamlı ve derin bir hikaye. Bu hikaye en az 800-1000 kelime uzunluğunda olmalı.
2. GÜÇLÜ YÖNLERİ: Kullanıcının en güçlü yanları (1-2 cümle)
3. POTANSİYELİ: Kullanıcının keşfedebileceği potansiyel alanlar (1-2 cümle)
4. DÜŞÜNME STİLİ: Kullanıcının düşünme ve problem çözme yaklaşımı (1-2 cümle)
5. AURA BAŞLIĞI: Kullanıcıyı en iyi tanımlayan 3-5 kelimelik özgün bir başlık

Yanıtını aşağıdaki formatta ver:

AURA HİKAYEN:
(Uzun, detaylı ve kapsamlı hikaye metni - en az 800-1000 kelime)

GÜÇLÜ YÖNLERİ:
(Güçlü yönler)

POTANSİYELİ:
(Potansiyel)

DÜŞÜNME STİLİ:
(Düşünme stili)

AURA BAŞLIĞI:
(Aura başlığı)

Hikaye kısmının uzun ve detaylı olması en önemli önceliktir. Tüm içerikler ${username} için özel olarak kişiselleştirilmelidir.`;
  }
};