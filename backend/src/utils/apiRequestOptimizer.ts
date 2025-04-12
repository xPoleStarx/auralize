/**
 * apiRequestOptimizer.ts
 * API isteklerini optimize etmek ve gereksiz çağrıları engellemek için yardımcı fonksiyonlar
 */

// Node.js ortamında çalışmak için hafıza-içi önbellek (localStorage yerine)
const memoryCache: Record<string, string> = {};

// API istekleri için önbellek mekanizması
interface CacheItem<T> {
  data: T;
  timestamp: number;
  hash: string;
}

// Cache anahtarı oluşturma fonksiyonu
export const createCacheKey = (service: string, operationType: string, auraType: string, answerPattern: string): string => {
  return `auralize_${service}_${operationType}_${auraType}_${answerPattern}`;
};

// Önbellekteki verilerin süresi dolmuş mu kontrol et
export const isCacheExpired = (timestamp: number, expiryTime: number): boolean => {
  return (Date.now() - timestamp) > expiryTime;
};

// Verileri önbellekten alma - localStorage yerine hafıza-içi önbellek kullanıyor
export const getCachedData = <T>(key: string): CacheItem<T> | null => {
  try {
    const cachedData = memoryCache[key];
    if (!cachedData) return null;
    
    return JSON.parse(cachedData) as CacheItem<T>;
  } catch (error) {
    console.error('Önbellek verisi okuma hatası:', error);
    return null;
  }
};

// Verileri önbelleğe kaydetme - localStorage yerine hafıza-içi önbellek kullanıyor
export const setCachedData = <T>(key: string, data: T, hash: string): void => {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      hash
    };
    
    memoryCache[key] = JSON.stringify(cacheItem);
  } catch (error) {
    console.error('Önbelleğe veri yazma hatası:', error);
  }
};

// Girdi verilerinden bir hash oluşturma (önbellek için)
export const createInputHash = (data: any): string => {
  // Basit string hash oluşturucu fonksiyon
  const stringToHash = typeof data === 'string' 
    ? data 
    : JSON.stringify(data);
  
  let hash = 0;
  for (let i = 0; i < stringToHash.length; i++) {
    const char = stringToHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32 bit integer'a dönüştür
  }
  
  return hash.toString(16);
};

// Rate limiting için hafıza-içi kayıt
const rateLimitRecords: Record<string, number> = {};

// Gereksiz API isteklerini önlemek için hızlı kontrol 
// (Aynı parametre seti ile son x saniye içinde istek yapılmış mı?)
export const isRateLimited = (service: string, key: string, cooldownMs: number = 2000): boolean => {
  const lastRequestKey = `last_request_${service}_${key}`;
  const lastRequestTime = rateLimitRecords[lastRequestKey];
  
  if (lastRequestTime) {
    if ((Date.now() - lastRequestTime) < cooldownMs) {
      return true;
    }
  }
  
  // Son istek zamanını güncelle
  rateLimitRecords[lastRequestKey] = Date.now();
  return false;
};

// API isteklerini sıraya alarak yönetebilen kuyruk sınıfı
export class ApiRequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private concurrentLimit: number;
  private activeRequests = 0;
  
  constructor(concurrentLimit: number = 1) {
    this.concurrentLimit = concurrentLimit;
  }
  
  // Kuyruğa istek ekle
  public enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      
      this.processQueue();
    });
  }
  
  // Kuyruktaki istekleri işle
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || this.activeRequests >= this.concurrentLimit) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.queue.length > 0 && this.activeRequests < this.concurrentLimit) {
      const request = this.queue.shift();
      if (request) {
        this.activeRequests++;
        
        try {
          await request();
        } catch (error) {
          console.error('Kuyruk işleme hatası:', error);
        } finally {
          this.activeRequests--;
        }
      }
    }
    
    this.isProcessing = false;
    
    // Eğer hala kuyrukta istek varsa ve aktif istek limiti dolmadıysa işlemeye devam et
    if (this.queue.length > 0 && this.activeRequests < this.concurrentLimit) {
      this.processQueue();
    }
  }
  
  // Kuyruktaki istek sayısını döndür
  public getQueueLength(): number {
    return this.queue.length;
  }
  
  // Tüm bekleyen istekleri temizle
  public clearQueue(): void {
    this.queue = [];
  }
}

// API istekleri için kuyruk örneği
export const apiRequestQueue = new ApiRequestQueue(2);

// Fonksiyon çağrı denemelerine limit koyma (tekrar deneme limiti)
export const withRetry = async <T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`İstek başarısız (${attempt + 1}/${maxRetries} deneme):`, error);
      
      // Son deneme değilse bekle
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
};

// API Key güvenliği için yardımcı fonksiyon - API anahtarını maskeleme
export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) return '***';
  
  const firstThree = apiKey.substring(0, 3);
  const lastThree = apiKey.substring(apiKey.length - 3);
  return `${firstThree}...${lastThree}`;
}; 