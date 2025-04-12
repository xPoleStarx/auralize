// Aura tiplerini tanımlayan dosya
// Bu dosya, farklı AI servisleri arasında ortak tipleri tanımlar

// Aura servisi yanıt tipi
export interface AuraServiceResponse {
  story: string;
  strengths: string;
  potential: string;
  thinkingStyle: string;
  auraTitle: string;
  source: 'openai' | 'deepseek' | 'llama' | 'default';
  fromCache?: boolean;
}

// Quiz cevaplarını analiz sonucu
export interface AnswerSummary {
  answerCounts: { a: number; b: number; c: number; d: number };
  answerPattern: string;
  answerDetails: string;
  dominantTrait: string;
  secondaryTrait: string;
}

// Aura tipi belirlemede kullanılacak temel arayüz
export interface AuraTypeService {
  determineDynamicAuraType(answers: { [key: number]: string }): string;
}

// Aura içerik hizmeti arayüzü
export interface AuraContentService {
  getAuraStory(auraType: string, username: string, answers: { [key: number]: string }): Promise<string>;
  getAuraInsights(
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
  }>;
  getCombinedAuraData(
    auraType: string,
    username: string,
    answers: { [key: number]: string }
  ): Promise<AuraServiceResponse>;
} 