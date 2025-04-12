import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from '../utils/logger';

// Dosya sistemine erişim için promisify edilmiş fonksiyonlar
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const exists = promisify(fs.exists);

// Aura verilerini temsil eden tip tanımlamaları
export interface AuraStory {
  id: string;
  userId: string;
  username: string;
  auraType: string;
  title: string;
  createdAt: Date;
  story: string;
  strengths: string;
  potential: string;
  thinkingStyle: string;
  auraTitle: string;
  isShared: boolean;
  timestamp?: number;
  answers?: { [key: number]: string };
}

interface AuraData {
  auraType: string;
  story: string;
  strengths: string;
  potential: string;
  thinkingStyle: string;
  auraTitle: string;
  answers: { [key: number]: string };
}

interface AuraResult {
  id: string;
  auraType: string;
  auraTitle: string;
  story: string;
  strengths: string;
  potential: string;
  thinkingStyle: string;
  timestamp: number;
  answers: { [key: number]: string };
}

// Temel dosya yolu
const DATA_DIR = path.join(process.cwd(), 'data');
const AURAS_DIR = path.join(DATA_DIR, 'auras');

// Dizinlerin varlığını kontrol et ve yoksa oluştur
const ensureDirectories = async (): Promise<void> => {
  try {
    if (!(await exists(DATA_DIR))) {
      await mkdir(DATA_DIR, { recursive: true });
    }
    
    if (!(await exists(AURAS_DIR))) {
      await mkdir(AURAS_DIR, { recursive: true });
    }
  } catch (error) {
    logger.error('Dizin oluşturma hatası:', error);
    throw new Error('Veri dizinleri oluşturulamadı');
  }
};

// Aura verilerini dosya sistemine kaydetme
export const saveAuraToFile = async (userId: string, auraId: string, auraData: any): Promise<void> => {
  try {
    await ensureDirectories();
    
    const userDir = path.join(AURAS_DIR, userId);
    if (!(await exists(userDir))) {
      await mkdir(userDir, { recursive: true });
    }
    
    const filePath = path.join(userDir, `${auraId}.json`);
    await writeFile(filePath, JSON.stringify(auraData, null, 2), 'utf8');
    
    logger.info(`Aura ${auraId} başarıyla kaydedildi.`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    logger.error(`Aura ${auraId} kaydedilirken hata:`, { error });
    throw new Error(`Aura kaydedilemedi: ${errorMessage}`);
  }
};

// Aura verilerini dosya sisteminden okuma
export const readAuraFromFile = async (userId: string, auraId: string): Promise<AuraStory | null> => {
  try {
    await ensureDirectories();
    
    const filePath = path.join(AURAS_DIR, userId, `${auraId}.json`);
    if (!(await exists(filePath))) {
      return null;
    }
    
    const data = await readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Aura ${auraId} okunurken hata:`, error);
    return null;
  }
};

// Kullanıcıya ait tüm aura dosyalarını listele
export const listUserAuraFiles = async (userId: string): Promise<string[]> => {
  try {
    await ensureDirectories();
    
    const userDir = path.join(AURAS_DIR, userId);
    if (!(await exists(userDir))) {
      return [];
    }
    
    const files = await readdir(userDir);
    return files.filter(file => file.endsWith('.json')).map(file => file.replace('.json', ''));
  } catch (error) {
    logger.error(`Kullanıcı ${userId} auraları listelenirken hata:`, error);
    return [];
  }
};

// Aura verilerini kaydetme
export const saveAuraStory = async (userId: string, auraData: AuraData): Promise<string> => {
  try {
    // Benzersiz ID oluştur
    const auraId = uuidv4();
    
    // Yeni aura verisi oluştur
    const newAura: AuraResult = {
      id: auraId,
      auraType: auraData.auraType,
      auraTitle: auraData.auraTitle,
      story: auraData.story,
      strengths: auraData.strengths,
      potential: auraData.potential,
      thinkingStyle: auraData.thinkingStyle,
      timestamp: Date.now(),
      answers: auraData.answers
    };
    
    // Dosya sistemine kaydet
    await saveAuraToFile(userId, auraId, newAura);
    
    return auraId;
  } catch (error) {
    logger.error('Aura kaydedilirken hata oluştu:', error);
    throw new Error('Aura kaydedilemedi');
  }
};

// Aura verisini getirme
export const getAuraStory = async (userId: string, auraId: string): Promise<AuraStory | null> => {
  try {
    // Dosyadan oku
    const auraData = await readAuraFromFile(userId, auraId);
    
    if (auraData) {
      // Tarih nesnesini tekrar oluştur ve auraType kontrolü
      return {
        ...auraData,
        createdAt: new Date(auraData.createdAt),
        auraType: auraData.auraType || 'creative' // Eğer auraType undefined ise varsayılan değer ata
      };
    }
    
    // Bulunamadı
    return null;
  } catch (error) {
    logger.error('[AuraDataService] Aura alınırken hata:', error);
    return null;
  }
};

// Kullanıcının tüm auralarını getirme
export const getUserAuras = async (userId: string): Promise<AuraResult[]> => {
  try {
    const auraIds = await listUserAuraFiles(userId);
    const auras: AuraResult[] = [];
    
    for (const auraId of auraIds) {
      const aura = await readAuraFromFile(userId, auraId);
      if (aura && aura.timestamp && aura.answers) {
        // AuraStory nesnesini AuraResult'a dönüştür
        auras.push({
          id: aura.id,
          auraType: aura.auraType,
          auraTitle: aura.auraTitle,
          story: aura.story,
          strengths: aura.strengths,
          potential: aura.potential,
          thinkingStyle: aura.thinkingStyle,
          timestamp: aura.timestamp,
          answers: aura.answers
        });
      }
    }
    
    // Tarihe göre sırala (en yeniden en eskiye)
    return auras.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    logger.error('Kullanıcı auraları getirilirken hata:', error);
    return [];
  }
};

// ID'ye göre bir aura getirme
export const getAuraById = async (userId: string, auraId: string): Promise<AuraResult | null> => {
  try {
    const aura = await readAuraFromFile(userId, auraId);
    if (!aura || !aura.timestamp || !aura.answers) {
      return null;
    }
    
    // AuraStory nesnesini AuraResult'a dönüştür
    return {
      id: aura.id,
      auraType: aura.auraType,
      auraTitle: aura.auraTitle,
      story: aura.story,
      strengths: aura.strengths,
      potential: aura.potential,
      thinkingStyle: aura.thinkingStyle,
      timestamp: aura.timestamp,
      answers: aura.answers
    };
  } catch (error) {
    logger.error('Aura getirilirken hata:', error);
    return null;
  }
};

// Aurayı paylaşım için galeriye ekleme
export const shareAuraToGallery = async (
  userId: string,
  auraId: string,
  description: string = '',
  hashtags: string[] = []
): Promise<boolean> => {
  try {
    // Aura verisini al
    const auraData = await getAuraStory(userId, auraId);
    
    if (!auraData) {
      logger.error('[AuraDataService] Paylaşılacak aura bulunamadı');
      return false;
    }
    
    // auraType kontrolü
    const auraType = auraData.auraType || 'creative'; // Eğer auraType undefined ise varsayılan değer ata
    
    // Aura tipini hashtag olarak ekle
    if (!hashtags.includes(auraType)) {
      hashtags.push(auraType);
    }
    
    // Galeriye eklemek için veriyi hazırla
    const galleryData = {
      id: auraId,
      userId: userId,
      username: auraData.username,
      auraType: auraType, // Kontrol edilmiş auraType kullan
      title: auraData.title,
      createdAt: auraData.createdAt,
      likes: 0,
      likedBy: [],
      description: description,
      hashtags: hashtags
    };
    
    // Galeri dizinini kontrol et ve oluştur
    const galleryDir = path.join(DATA_DIR, 'gallery');
    if (!(await exists(galleryDir))) {
      await mkdir(galleryDir, { recursive: true });
    }
    
    // Galeri dosyasını oku veya oluştur
    const galleryFilePath = path.join(galleryDir, 'shared_auras.json');
    let existingShares: any[] = [];
    
    if (await exists(galleryFilePath)) {
      const data = await readFile(galleryFilePath, 'utf8');
      existingShares = JSON.parse(data);
    }
    
    // Yeni paylaşımı ekle
    existingShares.push(galleryData);
    
    // Güncellenmiş paylaşımları kaydet
    await writeFile(galleryFilePath, JSON.stringify(existingShares, null, 2), 'utf8');
    
    // Aurayı paylaşıldı olarak işaretle
    auraData.isShared = true;
    await saveAuraToFile(userId, auraId, {...auraData, auraType: auraType}); // Kontrol edilmiş auraType ile kaydet
    
    return true;
  } catch (error) {
    logger.error('[AuraDataService] Aura paylaşılırken hata:', error);
    return false;
  }
};

// Galeriden auraları getir
export const getGalleryAuras = async (): Promise<any[]> => {
  try {
    const galleryFilePath = path.join(DATA_DIR, 'gallery', 'shared_auras.json');
    
    if (!(await exists(galleryFilePath))) {
      return [];
    }
    
    const data = await readFile(galleryFilePath, 'utf8');
    const auras = JSON.parse(data);
    
    // Tarihe göre sırala (en yeniden en eskiye)
    return auras.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    logger.error('Galeri auraları getirilirken hata:', error);
    return [];
  }
}; 