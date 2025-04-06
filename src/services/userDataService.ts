import fs from 'fs';
import path from 'path';

// Kullanıcı verileri için tip tanımlamaları
export interface UserAuraData {
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
  likes: number;
  likedBy: string[];
  description: string;
  hashtags: string[];
}

export interface UserData {
  userId: string;
  username: string;
  joinDate: Date;
  auras: UserAuraData[];
}

// Kullanıcı verileri için kök dizin - public/users altında saklanacak
const USER_DATA_ROOT = path.join(process.cwd(), 'public', 'users');
const USERS_DATA_FILE = path.join(USER_DATA_ROOT, 'users.json');

// Dosya sistemi işlevleri için yardımcı fonksiyonlar
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Kullanıcılar dosyasını oluştur veya al
const getUsersDataFile = (): { [username: string]: string } => {
  ensureDirectoryExists(USER_DATA_ROOT);
  
  if (!fs.existsSync(USERS_DATA_FILE)) {
    fs.writeFileSync(USERS_DATA_FILE, JSON.stringify({}));
    return {};
  }
  
  try {
    const data = fs.readFileSync(USERS_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Kullanıcılar dosyası okunamadı:', error);
    return {};
  }
};

// Kullanıcılar dosyasını güncelle
const updateUsersDataFile = (data: { [username: string]: string }): void => {
  try {
    fs.writeFileSync(USERS_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Kullanıcılar dosyası güncellenemedi:', error);
  }
};

// Kullanıcı adı kontrolü - eşsiz olmasını garantilemek için
export const isUsernameAvailable = (username: string): boolean => {
  const usersData = getUsersDataFile();
  return !Object.keys(usersData).includes(username.toLowerCase());
};

// Kullanıcı kaydı oluşturma
export const registerUsername = (username: string, userId: string): boolean => {
  if (!isUsernameAvailable(username)) {
    return false;
  }
  
  try {
    const usersData = getUsersDataFile();
    usersData[username.toLowerCase()] = userId;
    updateUsersDataFile(usersData);
    
    // Kullanıcı dizinini oluştur
    const userDir = path.join(USER_DATA_ROOT, userId);
    ensureDirectoryExists(userDir);
    
    return true;
  } catch (error) {
    console.error('Kullanıcı kaydı sırasında hata:', error);
    return false;
  }
};

// Kullanıcı verilerini kaydetme
export const saveUserAura = (auraData: UserAuraData): boolean => {
  try {
    const userDir = path.join(USER_DATA_ROOT, auraData.userId);
    ensureDirectoryExists(userDir);
    
    // Aura verilerini dosyaya kaydet
    const auraFilePath = path.join(userDir, `${auraData.id}.json`);
    fs.writeFileSync(auraFilePath, JSON.stringify(auraData, null, 2));
    
    return true;
  } catch (error) {
    console.error('Aura verisi kaydedilirken hata:', error);
    return false;
  }
};

// Kullanıcının tüm auralarını getirme
export const getUserAuras = (userId: string): UserAuraData[] => {
  try {
    const userDir = path.join(USER_DATA_ROOT, userId);
    
    if (!fs.existsSync(userDir)) {
      return [];
    }
    
    const auraFiles = fs.readdirSync(userDir).filter(file => file.endsWith('.json'));
    
    const auras: UserAuraData[] = [];
    for (const file of auraFiles) {
      const filePath = path.join(userDir, file);
      const fileData = fs.readFileSync(filePath, 'utf8');
      const auraData = JSON.parse(fileData) as UserAuraData;
      
      // Date nesnelerini dönüştürme
      auraData.createdAt = new Date(auraData.createdAt);
      
      auras.push(auraData);
    }
    
    // En yeni tarihli auralar üstte olacak şekilde sıralama
    return auras.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Kullanıcı auraları alınırken hata:', error);
    return [];
  }
};

// Tüm paylaşılan auraları getirme
export const getAllSharedAuras = (): UserAuraData[] => {
  try {
    // Kullanıcılar dizinini al
    const usersData = getUsersDataFile();
    const userIds = Object.values(usersData);
    
    let allAuras: UserAuraData[] = [];
    
    // Her kullanıcının auralarını al
    for (const userId of userIds) {
      const userAuras = getUserAuras(userId);
      allAuras = [...allAuras, ...userAuras];
    }
    
    // En yeni tarihli auralar üstte olacak şekilde sıralama
    return allAuras.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Tüm auraları alırken hata:', error);
    return [];
  }
};

// Kullanıcı adını güncelleme
export const updateUsername = (userId: string, newUsername: string): boolean => {
  try {
    // Mevcut kullanıcı adını bul
    const usersData = getUsersDataFile();
    const oldUsername = Object.keys(usersData).find(key => usersData[key] === userId);
    
    if (!oldUsername) {
      return false;
    }
    
    // Yeni kullanıcı adı başka biri tarafından kullanılıyor mu?
    if (Object.keys(usersData).includes(newUsername.toLowerCase()) && usersData[newUsername.toLowerCase()] !== userId) {
      return false;
    }
    
    // Eski kullanıcı adını sil
    delete usersData[oldUsername];
    
    // Yeni kullanıcı adını ekle
    usersData[newUsername.toLowerCase()] = userId;
    
    // Dosyayı güncelle
    updateUsersDataFile(usersData);
    
    // Kullanıcının tüm auralarını güncelle
    const userAuras = getUserAuras(userId);
    for (const aura of userAuras) {
      aura.username = newUsername;
      saveUserAura(aura);
    }
    
    return true;
  } catch (error) {
    console.error('Kullanıcı adı güncellenirken hata:', error);
    return false;
  }
};

// Bir aurayı beğenme
export const likeAura = (auraId: string, userId: string): boolean => {
  try {
    // Tüm kullanıcıları al
    const usersData = getUsersDataFile();
    const userIds = Object.values(usersData);
    
    // Aurayı bul
    for (const ownerId of userIds) {
      const userDir = path.join(USER_DATA_ROOT, ownerId);
      
      if (!fs.existsSync(userDir)) {
        continue;
      }
      
      const auraFilePath = path.join(userDir, `${auraId}.json`);
      
      if (fs.existsSync(auraFilePath)) {
        const fileData = fs.readFileSync(auraFilePath, 'utf8');
        const auraData = JSON.parse(fileData) as UserAuraData;
        
        // Kullanıcı daha önce beğendi mi?
        if (auraData.likedBy.includes(userId)) {
          return false;
        }
        
        // Beğeni ekle
        auraData.likes += 1;
        auraData.likedBy.push(userId);
        
        // Güncelle
        fs.writeFileSync(auraFilePath, JSON.stringify(auraData, null, 2));
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Aura beğenilirken hata:', error);
    return false;
  }
};

// Web uygulaması için localStorage tümleştirmesi
export const syncFromLocalStorage = (): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    // Kullanıcı bilgilerini al
    const userId = localStorage.getItem('auralize_user_id');
    const username = localStorage.getItem('auralize_username');
    
    if (!userId || !username) {
      return;
    }
    
    // Kullanıcı kaydını kontrol et, yoksa oluştur
    const usersData = getUsersDataFile();
    if (!Object.values(usersData).includes(userId)) {
      registerUsername(username, userId);
    }
    
    // Paylaşılan auraları senkronize et
    const sharedAurasString = localStorage.getItem('auralize_shared_auras');
    if (sharedAurasString) {
      const sharedAuras = JSON.parse(sharedAurasString);
      
      for (const aura of sharedAuras) {
        if (aura.userId === userId) {
          // Tarih dönüşümü
          aura.createdAt = new Date(aura.createdAt);
          
          // Aura verilerini diske kaydet
          saveUserAura({
            id: aura.id,
            userId: aura.userId,
            username: username,
            auraType: aura.auraType,
            title: aura.title,
            createdAt: aura.createdAt,
            story: localStorage.getItem(`auralize_story_${aura.id}`) || '',
            strengths: localStorage.getItem(`auralize_strengths_${aura.id}`) || '',
            potential: localStorage.getItem(`auralize_potential_${aura.id}`) || '',
            thinkingStyle: localStorage.getItem(`auralize_thinking_${aura.id}`) || '',
            likes: aura.likes || 0,
            likedBy: aura.likedBy || [],
            description: aura.description || '',
            hashtags: aura.hashtags || []
          });
        }
      }
    }
  } catch (error) {
    console.error('LocalStorage senkronizasyonu sırasında hata:', error);
  }
};

// Browser dışı ortamlarda çalıştığında hata vermemesi için şartlı export
const isServer = typeof window === 'undefined';
if (!isServer) {
  // Sayfa yüklendiğinde localStorage senkronizasyonunu başlat
  setTimeout(syncFromLocalStorage, 1000);
} 