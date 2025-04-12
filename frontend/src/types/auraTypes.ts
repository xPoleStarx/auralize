export interface AuraRequest {
  quizType: string;
  quizResponses: QuizResponse[];
  additionalInfo?: AdditionalInfo;
}

export interface QuizResponse {
  question: string;
  answer: string;
}

export interface AdditionalInfo {
  userName?: string;
  preferences?: string[];
}

export interface AuraResponse {
  id: string;
  title: string;
  description: string;
  story: string;
  insights: string[];
  imageUrl?: string;
  createdAt?: string;
  userId?: string;
}

export interface AuraGalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  quizType: string;
  createdAt: string;
} 