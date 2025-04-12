/**
 * Tarihi formatlar - 10 Nisan 2023 gibi
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Metni kısaltır ve sonuna "..." ekler
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Kelime sayısını döndürür
 */
export const wordCount = (text: string): number => {
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Okuma süresini hesaplar (ortalama okuma hızı: 200 kelime/dakika)
 */
export const readingTime = (text: string): string => {
  const words = wordCount(text);
  const minutes = Math.ceil(words / 200);
  return `${minutes} dakika`;
}; 