// Bu script auralize uygulamasında paylaşılmış auraları temizler
console.log('Auralize - Galeri Temizleme Aracı');

// LocalStorage'dan paylaşılmış auraları silme
localStorage.removeItem('auralize_shared_auras');
console.log('Tüm paylaşılmış auralar başarıyla silindi!');

// Geçerli auraları görüntüle (artık boş olmalı)
const currentAuras = localStorage.getItem('auralize_shared_auras');
console.log('Mevcut auralar:', currentAuras);

// Sayfayı yenileme önerisi
console.log('Değişikliklerin etkili olması için sayfayı yenileyin.'); 