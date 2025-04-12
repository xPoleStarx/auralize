// DeepSeek servisini devre dışı bırakıyoruz, yerine OpenAI servisi kullanılacak
// Bu dosya uyumluluk için tutulmuştur

// OpenAI için gerekli tip tanımlamaları
interface AnswerSummary {
  answerCounts: { a: number; b: number; c: number; d: number };
  answerPattern: string;
  answerDetails: string;
  dominantTrait: string;
  secondaryTrait: string;
}

// Cevapları analiz eden fonksiyon
export const getAnswerSummary = (answers: { [key: number]: string }): AnswerSummary => {
  // Cevapların sayılarını say
  const answerCounts = { a: 0, b: 0, c: 0, d: 0 };

  // Her cevabı değerlendir
  Object.values(answers).forEach(answer => {
    if (answer === 'a') answerCounts.a++;
    else if (answer === 'b') answerCounts.b++;
    else if (answer === 'c') answerCounts.c++;
    else if (answer === 'd') answerCounts.d++;
  });

  // En çok ve ikinci en çok verilen cevabı bul
  let dominant = 'a';
  let secondary = 'a';
  let maxCount = answerCounts.a;
  let secondMaxCount = -1;

  // En çok verilen cevabı bul
  for (const [answer, count] of Object.entries(answerCounts)) {
    if (count > maxCount) {
      secondary = dominant;
      secondMaxCount = maxCount;
      dominant = answer;
      maxCount = count;
    } else if (count > secondMaxCount && answer !== dominant) {
      secondary = answer;
      secondMaxCount = count;
    }
  }

  // Cevapların desenini oluştur (örn: "3a2b1c2d")
  const answerPattern = `${answerCounts.a}a${answerCounts.b}b${answerCounts.c}c${answerCounts.d}d`;

  // Dominant ve secondary özelliklere göre kişilik özelliklerini belirle
  let dominantTrait = '';
  let secondaryTrait = '';

  switch (dominant) {
    case 'a':
      dominantTrait = 'analitik';
      break;
    case 'b':
      dominantTrait = 'yaratıcı';
      break;
    case 'c':
      dominantTrait = 'empatik';
      break;
    case 'd':
      dominantTrait = 'enerjik';
      break;
  }

  switch (secondary) {
    case 'a':
      secondaryTrait = 'analitik';
      break;
    case 'b':
      secondaryTrait = 'yaratıcı';
      break;
    case 'c':
      secondaryTrait = 'empatik';
      break;
    case 'd':
      secondaryTrait = 'enerjik';
      break;
  }

  // Cevap detaylarını okunabilir metin olarak hazırla
  const answerDetails = Object.entries(answers)
    .map(([questionNumber, answer]) => {
      return `Soru ${questionNumber}: ${answer}`;
    })
    .join('\n');

  return {
    answerCounts,
    answerPattern,
    answerDetails,
    dominantTrait,
    secondaryTrait
  };
};

// Aura hikayesi oluşturma
export const getAuraStoryFromDeepSeek = async (auraType: string, username: string, answers: {[key: number]: string}): Promise<string> => {
  console.warn('DeepSeek servisi devre dışı. OpenAI kullanılıyor...');
  
  return "Hikayeniz oluşturuluyor... Lütfen bekleyin.";
};

// Aura içgörüleri oluşturma
export const getAuraInsightsFromLlama = async (
  auraType: string, 
  username: string, 
  answers: {[key: number]: string}, 
  detailedAnswers?: any
): Promise<{
  strengths: string;
  potential: string;
  thinkingStyle: string;
  auraTitle: string;
  source: string;
}> => {
  console.warn('LLaMA servisi devre dışı. OpenAI kullanılıyor...');
  
  return {
    strengths: "Güçlü yönleriniz yükleniyor...",
    potential: "Potansiyeliniz analiz ediliyor...",
    thinkingStyle: "Düşünme stiliniz belirleniyor...",
    auraTitle: `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aura`,
    source: 'default'
  };
};

// Dinamik aura tipi belirleme
export const determineDynamicAuraType = (answers: {[key: number]: string}): string => {
  const summary = getAnswerSummary(answers);
  return summary.dominantTrait;
};

// Sistem promptları için yardımcı fonksiyonlar
export const getSystemPromptForAuraType = (auraType: string, answerDetails: string): string => {
  return `Sen bir ${auraType} koçusun. Kullanıcı cevapları: ${answerDetails}`;
};

export const getInsightsPromptForAuraType = (auraType: string, answerDetails: string): string => {
  return `${auraType} için içgörüler oluştur. Kullanıcı cevapları: ${answerDetails}`;
};

// Birleştirilmiş aura verileri
export const getCombinedAuraDataFromLlama = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string }
): Promise<{
  story: string;
  strengths: string;
  potential: string;
  thinkingStyle: string;
  auraTitle: string;
  source: string;
}> => {
  console.warn('LLaMA servisi devre dışı. OpenAI kullanılıyor...');
  
  return {
    story: "Hikayeniz yükleniyor...",
    strengths: "Güçlü yönleriniz analiz ediliyor...",
    potential: "Potansiyeliniz değerlendiriliyor...", 
    thinkingStyle: "Düşünme stiliniz belirleniyor...",
    auraTitle: `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aura`,
    source: 'default'
  };
}; 