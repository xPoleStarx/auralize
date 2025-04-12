// fileSystemService.ts - Sunucu tarafı dosya işlemleri
// Bu servis, verilerin sunucu tarafında dosya sistemine kaydedilmesi ve erişilmesi için kullanılır
// React uygulaması için özelleştirilmiştir, gerçek bir backend API'si kurulduğunda değiştirilebilir

// Node.js ortamında çalışmak için hafıza-içi önbellek (localStorage yerine)
const memoryStorage: Record<string, string> = {};
const usernames: string[] = [];

// Windows ve web platformlarında sorunsuz çalışması için path işlemleri
const normalizePath = (path: string): string => {
  // URL formatına dönüştür
  return path.replace(/\\/g, '/');
};

// Kullanıcı klasörü oluşturma (veya kontrolü)
export const createUserFolder = async (userId: string): Promise<boolean> => {
  try {
    // Üretim ortamında burası bir backend API'ye istek gönderecek
    // Şimdilik simüle edilmiş olarak başarılı döndürelim
    console.log(`[FileSystem] '${userId}' kullanıcısı için klasör oluşturuldu`);
    return true;
  } catch (error) {
    console.error('[FileSystem] Kullanıcı klasörü oluşturulurken hata:', error);
    return false;
  }
};

// Aura verilerini dosyaya kaydetme
export const saveAuraToFile = async (
  userId: string, 
  auraId: string, 
  data: any
): Promise<boolean> => {
  try {
    // Veriyi serileştir (JSON formatına çevir)
    const serializedData = JSON.stringify(data, null, 2);
    
    // Gerçek bir backend API'sinde bu veri dosyaya yazılacak
    // Şimdilik hafıza-içi depolamaya kaydedelim
    const storageKey = `auralize_file_${userId}_${auraId}`;
    memoryStorage[storageKey] = serializedData;
    
    console.log(`[FileSystem] Aura verisi '${userId}/${auraId}' dosyasına kaydedildi`);
    return true;
  } catch (error) {
    console.error('[FileSystem] Aura verisi kaydedilirken hata:', error);
    return false;
  }
};

// Aura verilerini dosyadan okuma
export const readAuraFromFile = async (
  userId: string, 
  auraId: string
): Promise<any | null> => {
  try {
    // Gerçek bir backend API'sinde bu veri dosyadan okunacak 
    // Şimdilik hafıza-içi depolamadan okuyalım
    const storageKey = `auralize_file_${userId}_${auraId}`;
    const serializedData = memoryStorage[storageKey];
    
    if (!serializedData) {
      console.log(`[FileSystem] '${userId}/${auraId}' dosyası bulunamadı`);
      return null;
    }
    
    // JSON verisini parse et
    const data = JSON.parse(serializedData);
    console.log(`[FileSystem] '${userId}/${auraId}' dosyası okundu`);
    
    return data;
  } catch (error) {
    console.error('[FileSystem] Aura verisi okunurken hata:', error);
    return null;
  }
};

// Kullanıcının tüm aura dosyalarını listele
export const listUserAuraFiles = async (userId: string): Promise<string[]> => {
  try {
    // Gerçek bir backend API'sinde kullanıcının klasöründeki tüm dosyalar listelenecek
    // Şimdilik hafıza-içi depolamadaki tüm anahtarları kontrol edip filtreleyerek simüle edelim
    const auraIds: string[] = [];
    const prefix = `auralize_file_${userId}_`;
    
    Object.keys(memoryStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        // "auralize_file_userId_auraId" formatından auraId'yi çıkar
        const auraId = key.split(prefix)[1];
        auraIds.push(auraId);
      }
    });
    
    console.log(`[FileSystem] '${userId}' kullanıcısının ${auraIds.length} aura dosyası listelendi`);
    return auraIds;
  } catch (error) {
    console.error('[FileSystem] Kullanıcının aura dosyaları listelenirken hata:', error);
    return [];
  }
};

// Kullanıcı adlarını kontrol etme - benzersiz olmasını sağlama
// Gerçekte bu işlem bir veritabanında yapılacaktır
export const isUsernameTaken = async (username: string): Promise<boolean> => {
  try {
    return usernames.includes(username.toLowerCase());
  } catch (error) {
    console.error('[FileSystem] Kullanıcı adı kontrolü sırasında hata:', error);
    return false;
  }
};

// Kullanıcı adını rezerve etme (kaydetme)
export const reserveUsername = async (username: string): Promise<boolean> => {
  try {
    if (await isUsernameTaken(username)) {
      return false;
    }
    
    // Yeni kullanıcı adını kaydet
    usernames.push(username.toLowerCase());
    
    console.log(`[FileSystem] '${username}' kullanıcı adı rezerve edildi`);
    return true;
  } catch (error) {
    console.error('[FileSystem] Kullanıcı adı rezerve edilirken hata:', error);
    return false;
  }
}; 