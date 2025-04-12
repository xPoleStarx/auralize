import { saveAuraToFile, readAuraFromFile, listUserAuraFiles } from './fileSystemService';
import { v4 as uuidv4 } from 'uuid';

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

// Aura verilerini kaydetme
export const saveAuraStory = async (userId: string, auraData: AuraData): Promise<string> => {
  try {
    // Benzersiz ID oluştur
    const auraId = uuidv4();
    
    // LocalStorage'dan mevcut auraları getir veya yeni bir dizi oluştur
    const auraStorageKey = `auralize_user_auras_${userId}`;
    const existingAurasJson = localStorage.getItem(auraStorageKey);
    const existingAuras: AuraResult[] = existingAurasJson ? JSON.parse(existingAurasJson) : [];
    
    // Yeni aurayı ekle
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
    
    existingAuras.push(newAura);
    
    // LocalStorage'a kaydet
    localStorage.setItem(auraStorageKey, JSON.stringify(existingAuras));
    
    // En son kaydedilen aurayı da kaydet (önbellek için)
    const latestKey = `auralize_user_${userId}_latest`;
    localStorage.setItem(latestKey, JSON.stringify(newAura));
    
    return auraId;
  } catch (error) {
    console.error('Aura kaydedilirken hata oluştu:', error);
    throw new Error('Aura kaydedilemedi');
  }
};

// Aura verisini getirme
export const getAuraStory = async (userId: string, auraId: string): Promise<AuraStory | null> => {
  try {
    // Önce dosyadan okumayı dene
    const auraData = await readAuraFromFile(userId, auraId);
    
    if (auraData) {
      // Tarih nesnesini tekrar oluştur ve auraType kontrolü
      return {
        ...auraData,
        createdAt: new Date(auraData.createdAt),
        auraType: auraData.auraType || 'creative', // Eğer auraType undefined ise varsayılan değer ata
        isShared: auraData.isShared || false,
        title: auraData.title || auraData.auraTitle || 'Aura'
      };
    }
    
    // Dosyada bulunamazsa localStorage'dan kontrol et
    const localData = localStorage.getItem(`auralize_aura_${auraId}`);
    if (localData) {
      const parsedData = JSON.parse(localData);
      return {
        ...parsedData,
        createdAt: new Date(parsedData.createdAt),
        auraType: parsedData.auraType || 'creative' // Eğer auraType undefined ise varsayılan değer ata
      };
    }
    
    // Bulunamadı
    return null;
  } catch (error) {
    console.error('[AuraDataService] Aura alınırken hata:', error);
    return null;
  }
};

// Kullanıcının tüm auralarını getirme
export const getUserAuras = async (userId: string): Promise<AuraResult[]> => {
  try {
    const auraStorageKey = `auralize_user_auras_${userId}`;
    const aurasJson = localStorage.getItem(auraStorageKey);
    
    if (!aurasJson) {
      return [];
    }
    
    const auras: AuraResult[] = JSON.parse(aurasJson);
    // Tarihe göre sırala (en yeniden en eskiye)
    return auras.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Kullanıcı auraları getirilirken hata:', error);
    return [];
  }
};

// ID'ye göre bir aura getirme
export const getAuraById = async (userId: string, auraId: string): Promise<AuraResult | null> => {
  try {
    const allAuras = await getUserAuras(userId);
    const aura = allAuras.find(a => a.id === auraId);
    return aura || null;
  } catch (error) {
    console.error('Aura getirilirken hata:', error);
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
      console.error('[AuraDataService] Paylaşılacak aura bulunamadı');
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
    
    // Mevcut galeri paylaşımlarını al
    const existingShares = JSON.parse(localStorage.getItem('auralize_shared_auras') || '[]');
    
    // Yeni paylaşımı ekle
    existingShares.push(galleryData);
    
    // Güncellenmiş paylaşımları kaydet
    localStorage.setItem('auralize_shared_auras', JSON.stringify(existingShares));
    
    // Aurayı paylaşıldı olarak işaretle
    auraData.isShared = true;
    await saveAuraToFile(userId, auraId, {...auraData, auraType: auraType}); // Kontrol edilmiş auraType ile kaydet
    
    // localStorage'daki versiyonu da güncelle
    localStorage.setItem(`auralize_aura_${auraId}`, JSON.stringify({...auraData, auraType: auraType}));
    
    // LLaMA hikayesini ve içgörüleri de ayrı dosyalarda sakla
    localStorage.setItem(`auralize_story_${auraId}`, auraData.story);
    localStorage.setItem(`auralize_strengths_${auraId}`, auraData.strengths);
    localStorage.setItem(`auralize_potential_${auraId}`, auraData.potential);
    localStorage.setItem(`auralize_thinking_${auraId}`, auraData.thinkingStyle);
    
    // Paylaşım durumunu işaretle
    localStorage.setItem(`auralize_shared_${userId}_${auraId}`, 'true');
    
    return true;
  } catch (error) {
    console.error('[AuraDataService] Aura paylaşılırken hata:', error);
    return false;
  }
};

// Aura verilerini içe aktarma (localStorage'dan dosya sistemine)
export const importAuraFromLocalStorage = async (): Promise<number> => {
  try {
    let importCount = 0;
    const userId = localStorage.getItem('auralize_user_id');
    
    if (!userId) {
      console.error('[AuraDataService] Kullanıcı ID bulunamadı, içe aktarma yapılamıyor');
      return 0;
    }
    
    // localStorage'daki tüm aura verilerini tara
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key?.startsWith('auralize_aura_')) {
        const auraId = key.replace('auralize_aura_', '');
        const auraDataString = localStorage.getItem(key);
        
        if (auraDataString) {
          const auraData = JSON.parse(auraDataString);
          
          // Eğer bu aura bu kullanıcıya aitse, dosya sistemine kaydet
          if (auraData.userId === userId) {
            await saveAuraToFile(userId, auraId, auraData);
            importCount++;
          }
        }
      }
    }
    
    console.log(`[AuraDataService] ${importCount} aura içe aktarıldı`);
    return importCount;
  } catch (error) {
    console.error('[AuraDataService] Auralar içe aktarılırken hata:', error);
    return 0;
  }
}; 