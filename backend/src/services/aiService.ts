import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from '../utils/logger';
import { AuraContentService, AuraServiceResponse, AnswerSummary } from '../types/auraTypes';
import { getAnswerSummary } from '../utils/answerAnalyzer';
import { deepseekService } from './deepseekService';
import { getCombinedAuraDataFromOpenAI } from './openaiService';

// Prompts ve aura tiplerini içe aktar
const readFile = promisify(fs.readFile);

// Veri dizini
const DATA_DIR = path.join(process.cwd(), 'src', 'data');

// Prompt verilerini yükle
const loadPromptData = async (): Promise<any> => {
  try {
    const promptsPath = path.join(DATA_DIR, 'prompts.json');
    const data = await readFile(promptsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Prompt verileri yüklenirken hata:', error);
    throw new Error('Prompt verileri yüklenemedi');
  }
};

// Aura tipini dinamik olarak belirleyen fonksiyon
export const determineDynamicAuraType = (answers: { [key: number]: string }): string => {
  // getAnswerSummary fonksiyonunu kullanarak aura tipini belirle
  const summary = getAnswerSummary(answers);
  return summary.dominantTrait;
};

// OpenAI API için sabitleri tanımla
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

// Prompt hazırlama fonksiyonu
const preparePrompt = async (auraType: string, answerDetails: string, promptType: string): Promise<string> => {
  try {
    const promptData = await loadPromptData();
    let promptTemplate = promptData[auraType][promptType];
    
    // Cevap detaylarını prompt şablonuna yerleştir
    return promptTemplate.replace('{answerDetails}', answerDetails);
  } catch (error) {
    logger.error('Prompt hazırlanırken hata:', error);
    throw new Error('Prompt hazırlanamadı');
  }
};

// API URL ve modelleri
const AI_API_URL = 'https://api.openai.com/v1/chat/completions';
const AI_MODEL = 'gpt-4o-mini-2024-07-18';

// Node.js ortamında localStorage yerine kullanılacak önbellek objesi
const memoryCache: Record<string, string> = {};

// Önbellek için sabitleri tanımla
const CACHE_ENABLED = true;
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 saat

/**
 * Kullanılacak AI servisini belirler
 * 
 * @param preferredService Tercih edilen servis ('openai', 'deepseek')
 * @returns Uygun olan AI servisi
 */
export const getAIService = (preferredService: string = 'openai'): string => {
  // Eğer DeepSeek tercih edilmiş ve kullanılabilirse
  if (preferredService === 'deepseek' && process.env.USE_DEEPSEEK === 'true' && process.env.DEEPSEEK_API_KEY) {
    logger.info('DeepSeek servisi kullanılıyor');
    return 'deepseek';
  }
  
  // OpenAI API anahtarı kontrolü
  if (process.env.OPENAI_API_KEY) {
    logger.info('OpenAI servisi kullanılıyor');
    return 'openai';
  }
  
  // Hiçbir servis yoksa uyarı ver ve varsayılan verileri kullan
  logger.warn('Kullanılabilir AI servisi bulunamadı, varsayılan veriler kullanılacak');
  return 'default';
};

/**
 * Birleşik aura verilerini elde etmek için AI servislerini kullanır
 * 
 * @param auraType Aura tipi
 * @param username Kullanıcı adı
 * @param answers Quiz cevapları
 * @param preferredService Tercih edilen servis
 * @returns Aura hikayesi ve içgörüleri
 */
export const getCombinedAuraData = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string },
  preferredService: string = 'openai'
): Promise<AuraServiceResponse> => {
  logger.info(`getCombinedAuraData fonksiyonu çağrıldı. Aura tipi: ${auraType}, Kullanıcı: ${username}`);
  
  // Quiz tipine göre doğru servisi belirle
  const serviceName = getAIService(preferredService);
  
  try {
    // Önbellek için anahtar oluştur
    const answerSummary = getAnswerSummary(answers);
    const cacheKey = `auralize_${serviceName}_combined_${auraType}_${answerSummary.answerPattern}`;
    
    // Önbellekte kontrol et
    if (CACHE_ENABLED) {
      const cachedData = memoryCache[cacheKey];
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const timestamp = parsed.timestamp || 0;
          
          // Süresi dolmamış ise önbellekten döndür
          if (Date.now() - timestamp < CACHE_EXPIRY_TIME) {
            logger.info(`Aura verisi önbellekten alındı: ${cacheKey}`);
            return {...parsed.data, source: serviceName as 'openai' | 'deepseek' | 'default'};
          } else {
            logger.info(`Önbellekteki veri süresi dolmuş, yeni istek gönderiliyor: ${cacheKey}`);
          }
        } catch (error) {
          logger.error(`Önbellek verisi ayrıştırma hatası: ${error}`);
        }
      }
    }
    
    // Uygun servisi kullanarak veriyi elde et
    let result: AuraServiceResponse;
    
    switch (serviceName) {
      case 'deepseek':
        result = await deepseekService.getCombinedAuraData(auraType, username, answers);
        break;
      case 'openai':
        result = await getCombinedAuraDataFromOpenAI(auraType, username, answers);
        break;
      default:
        // Varsayılan veriler
        result = {
          story: "",
          strengths: "",
          potential: "",
          thinkingStyle: "",
          auraTitle: "",
          source: 'default'
        };
    }
    
    // Önbelleğe kaydet
    if (CACHE_ENABLED && result.source !== 'default') {
      memoryCache[cacheKey] = JSON.stringify({
        data: result,
        timestamp: Date.now()
      });
      logger.info(`Aura verisi önbelleğe kaydedildi: ${cacheKey}`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Aura verileri alınırken hata oluştu: ${error}`);
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

// Tek bir API çağrısı ile aura hikayesi alma fonksiyonu
export const getAuraStory = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string }
): Promise<string> => {
  try {
    // Tüm aura verilerini alıp sadece hikaye kısmını döndür
    const data = await getCombinedAuraData(auraType, username, answers);
    return data.story;
  } catch (error) {
    logger.error(`Aura hikayesi alınırken hata oluştu: ${error}`);
    return "Aura hikayeniz şu anda oluşturulamıyor. Lütfen daha sonra tekrar deneyin.";
  }
};

// Tek bir API çağrısı ile aura içgörüleri alma fonksiyonu
export const getAuraInsights = async (
  auraType: string,
  username: string,
  answers: { [key: number]: string }
): Promise<{
  strengths: string,
  potential: string,
  thinkingStyle: string,
  auraTitle: string,
  source: 'openai' | 'deepseek' | 'default' | 'llama'
}> => {
  try {
    // Tüm aura verilerini alıp sadece içgörüler kısmını döndür
    const data = await getCombinedAuraData(auraType, username, answers);
    return {
      strengths: data.strengths,
      potential: data.potential,
      thinkingStyle: data.thinkingStyle,
      auraTitle: data.auraTitle,
      source: data.source
    };
  } catch (error) {
    logger.error(`Aura içgörüleri alınırken hata oluştu: ${error}`);
    return {
      strengths: "İçgörüler şu anda oluşturulamıyor.",
      potential: "İçgörüler şu anda oluşturulamıyor.",
      thinkingStyle: "İçgörüler şu anda oluşturulamıyor.",
      auraTitle: `${auraType.charAt(0).toUpperCase() + auraType.slice(1)} Aurası`,
      source: 'default'
    };
  }
};

// OpenAI API'ye doğrudan istek gönderme (yedek olarak)
export const getAIResponse = async (
  auraType: string, 
  username: string, 
  answers: { [key: number]: string },
  promptType: string
): Promise<string> => {
  try {
    // API anahtarını kontrol et
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API anahtarı bulunamadı. Lütfen .env dosyasında OPENAI_API_KEY değişkenini ayarlayın.');
    }
    
    // Cevapların özetini al
    const answerSummary = getAnswerSummary(answers);
    
    // İstenen prompt tipine göre işlem yap
    // Yeni implementasyonda doğrudan getCombinedAuraData kullanılmalı
    // Bu fonksiyon sadece yedek/alternatif olarak bırakılmıştır
    logger.warn('getAIResponse fonksiyonu kullanılıyor. Bu fonksiyon yerine getCombinedAuraData tercih edilmelidir.');
    
    const combinedData = await getCombinedAuraData(auraType, username, answers);
    
    if (promptType === 'story') {
      return combinedData.story;
    } else {
      return `GÜÇLÜ YÖNLER: ${combinedData.strengths}\n\n` +
             `POTANSİYEL: ${combinedData.potential}\n\n` +
             `DÜŞÜNME STİLİ: ${combinedData.thinkingStyle}\n\n` +
             `BAŞLIK: ${combinedData.auraTitle}`;
    }
  } catch (error) {
    logger.error(`AI yanıtı alınırken hata oluştu: ${error}`);
    return "AI yanıtı şu anda oluşturulamıyor. Lütfen daha sonra tekrar deneyin.";
  }
}; 