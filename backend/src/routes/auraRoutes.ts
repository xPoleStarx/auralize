import express from 'express';
import * as auraController from '../controllers/auraController';

const router = express.Router();

// Aura hikayesi ve içgörülerini oluşturma
router.post('/generate', auraController.generateAura);

// Kullanıcının aura geçmişini getirme
router.get('/history/:userId', auraController.getAuraHistory);

// Galeri için aura sonuçlarını getirme
router.get('/gallery', auraController.getAuraGallery);

// Yeni OpenAI istek rotaları
// Aura hikayesi endpoint'i
router.post('/story', auraController.getAuraStoryEndpoint);

// Aura içgörüleri endpoint'i
router.post('/insights', auraController.getAuraInsightsEndpoint);

// Birleştirilmiş aura verisi endpoint'i
router.post('/combined', auraController.getCombinedAuraDataEndpoint);

export default router; 