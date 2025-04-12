import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import * as fileSystemService from '../services/fileSystemService';
import { 
  saveAuraStory, 
  getAuraStory, 
  getUserAuras, 
  getAuraById, 
  shareAuraToGallery,
  getGalleryAuras 
} from '../services/auraDataService';
import { 
  determineDynamicAuraType, 
  getCombinedAuraData,
  getAIResponse
} from '../services/aiService';
import * as openaiService from '../services/openaiService';

// Aura hikayesi ve içgörüleri oluşturan fonksiyon
export const generateAura = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quizType, quizResponses, additionalInfo } = req.body;
    
    // Girdi doğrulama
    if (!quizType || !quizResponses || !Array.isArray(quizResponses)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Geçersiz istek formatı',
          code: 'INVALID_REQUEST_FORMAT'
        }
      });
    }
    
    // quizResponses'ı uygun formata dönüştür
    const answers: { [key: number]: string } = {};
    quizResponses.forEach((response: any, index: number) => {
      answers[index + 1] = response.answer;
    });
    
    // Aura tipini belirle
    const auraType = await determineDynamicAuraType(answers);
    
    // AI servisi ile aura oluştur
    const auraData = await getCombinedAuraData(auraType, 'Kullanıcı', answers);
    
    // Aura verisini kaydet
    const auraId = await saveAuraStory(additionalInfo?.userId || 'anonim', {
      auraType,
      answers,
      ...auraData
    });
    
    return res.json({
      success: true,
      data: {
        id: auraId,
        auraType,
        ...auraData
      }
    });
  } catch (error) {
    logger.error('Aura oluşturma hatası:', error);
    next(error);
  }
};

// Kullanıcının aura geçmişini getiren fonksiyon
export const getAuraHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcının aura geçmişini oku
    const auraHistory = await getUserAuras(userId);
    
    return res.json({
      success: true,
      data: auraHistory
    });
  } catch (error) {
    logger.error('Aura geçmişi getirme hatası:', error);
    next(error);
  }
};

// Galeri için aura sonuçlarını getiren fonksiyon
export const getAuraGallery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Galeri verilerini getir
    const galleryItems = await getGalleryAuras();
    
    return res.json({
      success: true,
      data: {
        items: galleryItems,
        total: galleryItems.length,
        page: 1,
        limit: galleryItems.length,
        totalPages: 1
      }
    });
  } catch (error) {
    logger.error('Galeri verileri getirme hatası:', error);
    next(error);
  }
};

// Yeni bir aura oluştur
export const createAura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, username, answers, quizType } = req.body;
    
    if (!userId || !answers || !quizType) {
      res.status(400).json({ error: 'Kullanıcı ID, quiz tipi ve cevaplar gereklidir.' });
      return;
    }
    
    // Cevapların sayısını ve formatını kontrol et
    if (Object.keys(answers).length < 5) {
      res.status(400).json({ error: 'En az 5 soru cevaplandırılmalıdır.' });
      return;
    }
    
    // Aura tipini belirle
    const auraType = await determineDynamicAuraType(answers);
    logger.info(`Kullanıcı ${userId} için ${auraType} aura tipi belirlendi.`);
    
    // Aura verilerini oluştur
    const auraData = await getCombinedAuraData(auraType, username || 'Kullanıcı', answers);
    logger.info('Aura verileri oluşturuldu.');
    
    // Aura verisini kaydet
    const auraId = await saveAuraStory(userId, {
      auraType,
      answers,
      ...auraData
    });
    
    logger.info(`Aura ${auraId} başarıyla kaydedildi.`);
    
    // Başarılı yanıt döndür
    res.status(201).json({
      success: true,
      auraId,
      auraType,
      ...auraData
    });
  } catch (error) {
    logger.error('Aura oluşturulurken hata:', error);
    res.status(500).json({ 
      error: 'Aura oluşturulurken bir hata oluştu.',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Kullanıcıya ait tüm auraları getir
export const getUserAuraList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({ error: 'Kullanıcı ID gereklidir.' });
      return;
    }
    
    const auras = await getUserAuras(userId);
    logger.info(`Kullanıcı ${userId} için ${auras.length} aura bulundu.`);
    
    res.status(200).json({
      success: true,
      count: auras.length,
      auras
    });
  } catch (error) {
    logger.error('Aura listesi alınırken hata:', error);
    res.status(500).json({ 
      error: 'Aura listesi alınırken bir hata oluştu.',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Belirli bir aurayı getir
export const getAura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, auraId } = req.params;
    
    if (!userId || !auraId) {
      res.status(400).json({ error: 'Kullanıcı ID ve Aura ID gereklidir.' });
      return;
    }
    
    const aura = await getAuraStory(userId, auraId);
    
    if (!aura) {
      res.status(404).json({ error: 'Aura bulunamadı.' });
      return;
    }
    
    logger.info(`Aura ${auraId} başarıyla getirildi.`);
    
    res.status(200).json({
      success: true,
      aura
    });
  } catch (error) {
    logger.error('Aura alınırken hata:', error);
    res.status(500).json({ 
      error: 'Aura alınırken bir hata oluştu.',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Aurayı paylaşıma aç
export const shareAura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, auraId } = req.params;
    const { description, hashtags } = req.body;
    
    if (!userId || !auraId) {
      res.status(400).json({ error: 'Kullanıcı ID ve Aura ID gereklidir.' });
      return;
    }
    
    const success = await shareAuraToGallery(userId, auraId, description, hashtags);
    
    if (!success) {
      res.status(400).json({ error: 'Aura paylaşılamadı.' });
      return;
    }
    
    logger.info(`Aura ${auraId} galeriye paylaşıldı.`);
    
    res.status(200).json({
      success: true,
      message: 'Aura başarıyla galeriye paylaşıldı.'
    });
  } catch (error) {
    logger.error('Aura paylaşılırken hata:', error);
    res.status(500).json({ 
      error: 'Aura paylaşılırken bir hata oluştu.',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Galeri auralarını getir
export const getGallery = async (req: Request, res: Response): Promise<void> => {
  try {
    const auras = await getGalleryAuras();
    logger.info(`Galeriden ${auras.length} aura getirildi.`);
    
    res.status(200).json({
      success: true,
      count: auras.length,
      auras
    });
  } catch (error) {
    logger.error('Galeri auraları alınırken hata:', error);
    res.status(500).json({ 
      error: 'Galeri auraları alınırken bir hata oluştu.',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Aura hikayesi endpoint'i - sadece hikaye için
export const getAuraStoryEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auraType, username, answers } = req.body;
    
    logger.info(`[API] ${auraType} aura tipi için hikaye isteniyor`);
    
    if (!auraType || !answers) {
      res.status(400).json({ error: 'Aura tipi ve cevaplar gereklidir.' });
      return;
    }

    // AI servisi ile aura hikayesi oluştur
    const story = await openaiService.getAuraStoryFromOpenAI(auraType, username || 'Kullanıcı', answers);
    
    logger.info(`Hikaye başarıyla oluşturuldu (${story.length} karakter)`);
    
    // Başarılı yanıt döndür
    res.status(200).json({
      success: true,
      story,
      source: 'openai'
    });
  } catch (error) {
    logger.error('Aura hikayesi oluşturulurken hata:', error);
    res.status(500).json({ 
      error: 'Aura hikayesi oluşturulurken bir hata oluştu.',
      story: "Aura hikayeniz şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.",
      source: 'default'
    });
  }
};

// Aura içgörüleri endpoint'i - sadece içgörü için
export const getAuraInsightsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auraType, username, answers, detailedAnswers } = req.body;
    
    logger.info(`[API] ${auraType} aura tipi için içgörüler isteniyor`);
    
    if (!auraType || !answers) {
      res.status(400).json({ error: 'Aura tipi ve cevaplar gereklidir.' });
      return;
    }

    // AI servisi ile aura içgörüleri oluştur
    const insights = await openaiService.getAuraInsightsFromOpenAI(auraType, username || 'Kullanıcı', answers, detailedAnswers);
    
    logger.info('İçgörüler başarıyla oluşturuldu');
    
    // Başarılı yanıt döndür
    res.status(200).json({
      success: true,
      ...insights,
      source: 'openai'
    });
  } catch (error) {
    logger.error('Aura içgörüleri oluşturulurken hata:', error);
    res.status(500).json({
      error: 'Aura içgörüleri oluşturulurken bir hata oluştu.',
      strengths: "Güçlü yönleriniz şu anda yüklenemiyor.",
      potential: "Potansiyeliniz şu anda yüklenemiyor.",
      thinkingStyle: "Düşünme stiliniz şu anda yüklenemiyor.",
      auraTitle: "Aura Analizi",
      source: 'default'
    });
  }
};

// Aynı veri isteği için kilit mekanizması - duplicate request önleme
const requestLocks = new Map<string, boolean>();

// Birleştirilmiş aura verisi endpoint'i - hem hikaye hem de içgörü için
export const getCombinedAuraDataEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auraType, username, answers } = req.body;
    
    logger.info(`[API] ${auraType} aura tipi için birleştirilmiş veri isteniyor`);
    
    if (!auraType || !answers) {
      res.status(400).json({ error: 'Aura tipi ve cevaplar gereklidir.' });
      return;
    }
    
    // Aynı cevaplar için duplicate istekleri engelle
    const requestFingerprint = `${auraType}_${JSON.stringify(answers)}`;
    if (requestLocks.get(requestFingerprint)) {
      logger.warn(`[API] Duplicate istek engellendi: ${auraType}`);
      res.status(429).json({
        success: false,
        error: 'Bu istek zaten işleniyor. Lütfen biraz bekleyin.',
        source: 'default'
      });
      return;
    }
    
    // İsteği kilitle
    requestLocks.set(requestFingerprint, true);

    try {
      // Mevcut AI servislerini kullan
      const aiService = await import('../services/aiService');
      const combinedData = await aiService.getCombinedAuraData(auraType, username || 'Kullanıcı', answers);
      
      logger.info('Birleştirilmiş veriler başarıyla oluşturuldu');
      
      // İçerik kontrolü - tüm içerikler boş ise başarısız döndür
      if (!combinedData.story && !combinedData.strengths && !combinedData.potential && !combinedData.thinkingStyle) {
        logger.error('Birleştirilmiş aura verisi boş geldi! Eksik veya boş verilerle yapılan istek:', {
          auraType,
          username,
          answerCount: Object.keys(answers).length
        });
        
        res.status(500).json({
          success: false,
          error: 'Aura içeriği oluşturulamadı. İçerik boş.',
          story: "",
          strengths: "",
          potential: "",
          thinkingStyle: "",
          auraTitle: "",
          source: 'default'
        });
        return;
      }
      // Sadece düşünme stili bölümü eksikse özel bir log ekleyelim
      else if (!combinedData.thinkingStyle || combinedData.thinkingStyle.trim() === '') {
        logger.warn(`[API] UYARI: '${auraType}' tipi için düşünme stili bölümü boş veya eksik.`);
        
        // Prompt düzgün çalışıyor mu kontrol edilmeli
        const promptService = await import('../services/promptService');
        try {
          const prompt = await promptService.getCombinedPromptForAuraType(auraType, "test", username || 'Kullanıcı');
          logger.info(`[API] ${auraType} için prompt uzunluğu: ${prompt.length} karakter`);
          logger.info(`[API] Düşünme stili bölümü prompt içinde mevcut mu: ${prompt.includes('DÜŞÜNME STİLİ') || prompt.includes('düşünme stili')}`);
        } catch (promptError) {
          logger.error(`[API] Prompt kontrolü sırasında hata: ${promptError}`);
        }
      }
      
      // Başarılı yanıt döndür
      res.status(200).json({
        success: true,
        ...combinedData,
        source: 'openai'
      });
    } finally {
      // İstek tamamlandı, kilidi kaldır
      requestLocks.delete(requestFingerprint);
    }
  } catch (error) {
    logger.error('Birleştirilmiş aura verisi oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      error: 'Birleştirilmiş aura verisi oluşturulurken bir hata oluştu.',
      story: "Aura hikayeniz şu anda yüklenemiyor.",
      strengths: "Güçlü yönleriniz şu anda yüklenemiyor.",
      potential: "Potansiyeliniz şu anda yüklenemiyor.",
      thinkingStyle: "Düşünme stiliniz şu anda yüklenemiyor.",
      auraTitle: "Aura Analizi",
      source: 'default'
    });
  }
};