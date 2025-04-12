// Backend ile iletişim kuracak basit servis
import axios from 'axios';

// Backend API URL'i
const BACKEND_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Aura türlerini tanımla
export const auraTypes = ['yaratıcı', 'ruhsal', 'kişisel', 'kariyer'];

// Quiz cevaplarını analiz edip dominant aura tipini belirleyen fonksiyon
export const determineDynamicAuraType = (answers: { [key: number]: string }): string => {
  // Cevapların sayılarını say
  const answerCounts = { a: 0, b: 0, c: 0, d: 0 };

  // Her cevabı değerlendir
  Object.values(answers).forEach(answer => {
    if (answer === 'a') answerCounts.a++;
    else if (answer === 'b') answerCounts.b++;
    else if (answer === 'c') answerCounts.c++;
    else if (answer === 'd') answerCounts.d++;
  });

  // En çok verilen cevabı bul
  let dominant = 'a';
  let maxCount = answerCounts.a;

  for (const [answer, count] of Object.entries(answerCounts)) {
    if (count > maxCount) {
      dominant = answer;
      maxCount = count;
    }
  }

  // Dominant cevaba göre aura tipini belirle
  switch (dominant) {
    case 'a': return 'analitik';
    case 'b': return 'yaratıcı';
    case 'c': return 'empatik';
    case 'd': return 'enerjik';
    default: return 'yaratıcı';
  }
};

// Hikaye alma fonksiyonu - backend API'sine istek
export const getAuraStoryFromOpenAI = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string }
): Promise<string> => {
  try {
    console.log(`[Frontend] ${auraType} tipi için hikaye isteniyor`);
    
    // Backend API'sine istek gönder
    const response = await axios.post(
      `${BACKEND_API_URL}/aura/story`,
      {
        auraType,
        username,
        answers
      }
    );
    
    // Cevabı döndür
    return response.data.story;
  } catch (error) {
    console.error('Backend API hatası (hikaye):', error);
    return "Aura hikayeniz şu anda oluşturulamıyor. Lütfen daha sonra tekrar deneyin.";
  }
};

// İçgörüler alma fonksiyonu - backend API'sine istek
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
  source: 'openai' | 'default'
}> => {
  try {
    console.log(`[Frontend] ${auraType} tipi için içgörüler isteniyor`);
    
    // Backend API'sine istek gönder
    const response = await axios.post(
      `${BACKEND_API_URL}/aura/insights`,
      {
        auraType,
        username,
        answers,
        detailedAnswers
      }
    );
    
    return {
      ...response.data,
      source: response.data.source || 'openai'
    };
  } catch (error) {
    console.error('Backend API hatası (içgörüler):', error);
    
    // Hata durumunda varsayılan değerler döndür
    return {
      strengths: "Güçlü yönleriniz şu anda yüklenemiyor.",
      potential: "Potansiyeliniz şu anda yüklenemiyor.",
      thinkingStyle: "Düşünme stiliniz şu anda yüklenemiyor.",
      auraTitle: `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aura`,
      source: 'default'
    };
  }
};

// Birleştirilmiş aura verisi alma fonksiyonu - backend API'sine istek
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
  source: 'openai' | 'default'
}> => {
  try {
    console.log(`[Frontend] ${auraType} tipi için birleştirilmiş veri isteniyor`);
    
    // Backend API'sine istek gönder
    const response = await axios.post(
      `${BACKEND_API_URL}/aura/combined`,
      {
        auraType,
        username,
        answers
      }
    );
    
    console.log(`[Frontend] Backend'den yanıt alındı: ${response.data.source}`);
    
    return {
      ...response.data,
      source: response.data.source || 'openai'
    };
  } catch (error) {
    console.error('Backend API hatası (birleştirilmiş):', error);
    
    // Hata durumunda boş değerler döndür, böylece yükleme durumu devam eder
    return {
      story: "",
      strengths: "",
      potential: "",
      thinkingStyle: "",
      auraTitle: "",
      source: 'default'
    };
  }
}; 