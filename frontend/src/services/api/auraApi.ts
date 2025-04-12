import axios from 'axios';

// API temel URL'si - Gerçek API tamamlandığında güncellenebilir
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface AuraRequest {
  quizType: string;
  quizResponses: {
    question: string;
    answer: string;
  }[];
  additionalInfo?: {
    userName?: string;
    preferences?: string[];
  };
}

export interface AuraResponse {
  id: string;
  title: string;
  description: string;
  story: string;
  insights: string[];
  imageUrl?: string;
}

// Aura hikayesi ve içgörülerini oluşturmak için API çağrısı
export const generateAura = async (data: AuraRequest): Promise<AuraResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/aura/generate`, data);
    return response.data;
  } catch (error) {
    console.error('Aura oluşturulurken hata oluştu:', error);
    throw error;
  }
};

// Geçmiş aura sonuçlarını almak için API çağrısı
export const getAuraHistory = async (userId: string): Promise<AuraResponse[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/aura/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Aura geçmişi alınırken hata oluştu:', error);
    return [];
  }
}; 