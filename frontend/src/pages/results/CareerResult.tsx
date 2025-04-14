import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from 'framer-motion';
// OpenAI servisini import ediyoruz, DeepSeek ve LLaMA yerine
import { getCombinedAuraDataFromOpenAI } from '../../services/openaiService';
import { saveAuraStory } from '../../services/auraDataService';
// JSON dosyasından kariyer quiz verilerini doğrudan alıyoruz
import careerQuizData from '../../data/quizzes/careerQuiz.json';

// Debug modu
const DEBUG_MODE = true;

// Quiz sorusu ve Quiz cevap seçeneği tipleri
interface QuizOption {
  id: string;
  value: string;
  [key: string]: any; // Diğer olası alanlar için
}

interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

// Quiz cevabı için tip tanımlaması
interface DetailedAnswer {
  questionId: number;
  question: string;
  answerId: string;
  answerText: string;
}

// Yükleme animasyonu bileşeni
const LoadingAnimation = ({ text, color }: { text: string, color?: string }) => (
  <div className="loading-crystal">
    <div 
      className="loading-crystal-spinner" 
      style={{ 
        background: color || 'linear-gradient(135deg, #FF61D2, #FE9090)'
      }}
    ></div>
    <div className="loading-crystal-text">
      {text}<span className="loading-crystal-dots"></span>
    </div>
  </div>
);

// İçgörü yükleme bileşeni - daha özel animasyonlu versiyon
const InsightLoadingSkeleton = ({ icon, title, color }: { icon: string, title: string, color?: string }) => (
  <div className="insight-loading-skeleton">
    <div className="insight-loading-icon-container">
      <div 
        className="insight-loading-icon-placeholder" 
        style={{ background: color || 'linear-gradient(135deg, #FF61D2, #FE9090)' }}
      >
        <span className="insight-loading-icon">{icon}</span>
      </div>
    </div>
    <h3 className="insight-loading-title">{title}</h3>
    <div className="insight-loading-content-placeholder">
      <div className="insight-loading-crystal-container">
        <div className="insight-loading-crystal"></div>
      </div>
      <p className="insight-loading-text">İçgörüler yükleniyor<span className="insight-loading-dots"></span></p>
    </div>
  </div>
);

// Ana kariyer renkleri
const careerGradients = {
  main: 'linear-gradient(135deg, #4158D0, #C850C0)',
  dark: 'linear-gradient(135deg, #293D8C, #862E82)',
  light: '#4158D0'
};

// Markdown formatındaki metni HTML'e çeviren fonksiyon
const parseMarkdown = (text: string) => {
  if (!text) return '';
  
  // Bold metinleri işle (**text** -> <strong>text</strong>)
  const boldParsed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // İtalik metinleri işle (*text* -> <em>text</em>)
  const italicParsed = boldParsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Paragrafları işle (satır sonları -> <br />)
  return italicParsed.replace(/\n/g, '<br />');
};

// İçgörülerin ön izlemesini gösteren yardımcı fonksiyon
const getInsightPreview = (text: string, maxLength: number = 100) => {
  if (!text) return '';
  // Markdown işaretlerini temizle
  const plainText = text.replace(/\*\*(.*?)\*\*/g, '$1');
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...' 
    : plainText;
};

// Modal bileşeni - İçgörüler için - HTML içeriği gösterme desteğiyle güncellendi
const InsightModal = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  icon, 
  explanation,
  color
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  content: string; 
  icon: string;
  explanation: string;
  color?: string;
}) => (
  <>
    {isOpen && (
      <div className="insight-modal-overlay" onClick={onClose}>
        <div 
          className="insight-modal-content" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="insight-modal-header" style={{ background: color || careerGradients.main }}>
            <div className="insight-modal-icon">{icon}</div>
            <h2 className="insight-modal-title">{title}</h2>
            <button className="insight-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="insight-modal-body">
            <div 
              className="insight-modal-text"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            ></div>
            {explanation && (
              <div className="insight-modal-explanation">
                <h3>Bu ne anlama geliyor?</h3>
                <p>{explanation}</p>
              </div>
            )}
          </div>
          <div className="insight-modal-footer">
            <button className="insight-modal-button" onClick={onClose}>
              Kapat
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);

// Kariyer Analizi Sonuç Sayfası
const CareerResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAnalysisStarted, setIsAnalysisStarted] = useState(false);
  const [careerStory, setCareerStory] = useState<string>('');
  const [careerStrengths, setCareerStrengths] = useState<string>('');
  const [careerPotential, setCareerPotential] = useState<string>('');
  const [careerThinking, setCareerThinking] = useState<string>('');
  const [careerTitle, setCareerTitle] = useState<string>('');
  const [auraId, setAuraId] = useState<string | null>(null);
  const [showShareButton, setShowShareButton] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isStoryLoading, setIsStoryLoading] = useState(true);
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  // Hikaye için kısaltma ve genişletme fonksiyonu
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const toggleStoryExpansion = () => {
    setIsStoryExpanded(!isStoryExpanded);
  };

  // Hikayeyi kısaltma fonksiyonu (ilk 250 karakter)
  const getShortStory = (story: string) => {
    if (!story) return "";
    return story.length > 250 ? story.substring(0, 250) + "..." : story;
  };
  
  // Kart açıklama içeriği getirme fonksiyonu
  const getDetailedExplanation = (cardId: string): string => {
    switch(cardId) {
      case 'strengths':
        return "Profesyonel güçlü yönleriniz, iş hayatınızda ve kariyerinizde öne çıkan yeteneklerinizi ve becerilerinizi gösterir. Bu alanlar, mesleki başarınızı destekleyen temel özelliklerinizdir.";
      case 'potential':
        return "Kariyer potansiyeliniz, geliştirebileceğiniz ve gelecekte kariyerinizde ilerlemenize yardımcı olacak özellikleri ve fırsatları gösterir. Bu alanlara odaklanarak mesleki gelişiminizi hızlandırabilirsiniz.";
      case 'thinking':
        return "Çalışma stiliniz, işlerinizi nasıl organize ettiğinizi, zorluklarla nasıl başa çıktığınızı ve takım içinde nasıl çalıştığınızı gösterir. Bu stil, profesyonel ortamlardaki davranışlarınızı şekillendirir.";
      default:
        return "";
    }
  };
  
  // Kartları açıp kapatmak için
  const toggleCardExpansion = (cardId: string) => {
    if (expandedCard === cardId) {
      setExpandedCard(null);
    } else {
      setExpandedCard(cardId);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Yükleme animasyonu
  useEffect(() => {
    const loadingInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(loadingInterval);
          setLoading(false);
          return 100;
        }
        return prev + 1;
      });
    }, 25);
    
    return () => clearInterval(loadingInterval);
  }, []);

  // Konum durum verilerini al
  useEffect(() => {
    const state = location.state as { answers: { [key: number]: string }; quizType: string } | null;
    
    if (!state || !state.answers) {
      // Eğer cevaplar yoksa ana sayfaya yönlendir
      navigate('/');
      return;
    }

    const quizType = 'career'; // Bu sayfada sabit olarak 'career' kullanılacak

    // Kullanıcı adını localStorage'dan al veya varsayılan
    const username = localStorage.getItem('auralize_username') || 'Seyyah';
    const userId = localStorage.getItem('auralize_user_id') || Date.now().toString();

    if (DEBUG_MODE) console.log("Quiz verileri hazırlanıyor:", { userId, username, answers: state.answers, determinedType: quizType });

    const generateCareerAnalysis = async () => {
      setIsAnalysisStarted(true);
      
      try {
        // Quiz cevaplarını daha detaylı bir formata dönüştür
        const detailedAnswers = Object.entries(state.answers).map(([questionId, answerId]) => {
          // careerQuizData dizisinden ilgili soruyu bul
          const question = careerQuizData.find((q: any) => q.id === parseInt(questionId));
          if (!question) return null;
          
          // Sorunun cevap seçeneklerinden kullanıcının seçtiğini bul
          const selectedOption = question.options.find((opt: any) => opt.id === answerId);
          if (!selectedOption) return null;
          
          return {
            questionId: parseInt(questionId),
            question: question.question,
            answerId: answerId,
            answerText: selectedOption.value
          };
        }).filter(Boolean); // null değerleri filtrele
        
        if (DEBUG_MODE) console.log("Detaylı kariyer analiz cevapları:", detailedAnswers);
        
        // Maksimum bekleme süresi (milisaniye)
        const MAX_WAIT_TIME = 180000; // 3 dakika
        const startTime = Date.now();
        
        // Tek istekle tüm verileri alma
        if (DEBUG_MODE) console.log("[DEBUG] Birleştirilmiş veri isteniyor");
        
        // Promise.race kullanarak istek veya zaman aşımından hangisi önce gelirse onu işle
        const resultPromise = Promise.race([
          getCombinedAuraDataFromOpenAI(quizType, username, state.answers),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`İstek zaman aşımına uğradı (${MAX_WAIT_TIME / 1000} saniye)`));
            }, MAX_WAIT_TIME);
          })
        ]);
        
        if (DEBUG_MODE) console.log("[DEBUG] Birleştirilmiş veri isteği yapılıyor...", new Date().toLocaleTimeString());
        
        const combinedData = await resultPromise;
        
        if (DEBUG_MODE) console.log("[DEBUG] Birleştirilmiş veri yanıtı alındı:", combinedData?.source, new Date().toLocaleTimeString());
        
        // Eksik veri kontrolü - tüm alanlar boş ise hata fırlat
        if (!combinedData.story && !combinedData.strengths && !combinedData.potential && !combinedData.thinkingStyle) {
          if (DEBUG_MODE) console.error("[DEBUG] API yanıtı eksik veya boş geldi!");
          throw new Error("API yanıtı eksik veya boş geldi.");
        }
        
        if (DEBUG_MODE) console.log("[DEBUG] İşlem süresi:", ((Date.now() - startTime) / 1000).toFixed(2), "saniye");
        
        // Aura hikayesini ayarla
        setCareerStory(combinedData.story);
        
        // İçgörüleri ayarla
        setCareerStrengths(combinedData.strengths);
        setCareerPotential(combinedData.potential);
        setCareerThinking(combinedData.thinkingStyle);
        setCareerTitle(combinedData.auraTitle || "Kariyer Analizi");
        
        // Yükleme durumlarını güncelle
        setIsStoryLoading(false);
        setIsInsightsLoading(false);
        setIsApiReady(true);
        
        // Analiz verilerini kaydet
        try {
          const savedAuraId = await saveAuraStory(userId, {
            auraType: quizType,
            story: combinedData.story || "Hikaye yüklenemedi",
            strengths: combinedData.strengths || "Güçlü yönler yüklenemedi",
            potential: combinedData.potential || "Potansiyel yüklenemedi",
            thinkingStyle: combinedData.thinkingStyle || "Düşünme stili yüklenemedi",
            auraTitle: combinedData.auraTitle || "Kariyer Analizi",
            answers: state.answers
          });
          
          if (savedAuraId) {
            setAuraId(savedAuraId);
            setShowShareButton(true);
            console.log("Varsayılan aura verileri kaydedildi");
          }
        } catch (err) {
          console.error("Aura kaydedilirken hata:", err);
        }
        
        // İlerlemeyi tamamla
        setLoadingProgress(100);
        
      } catch (error) {
        console.error("Analiz oluşturulurken hata:", error);
        
        // Hata durumunda bilgi mesajları
        setCareerStory("Kariyer analiziniz oluşturulurken bir sorun yaşandı. Lütfen daha sonra tekrar deneyin.");
        setCareerStrengths("Profesyonel güçlü yönleriniz şu anda görüntülenemiyor.");
        setCareerPotential("Kariyer potansiyeliniz şu anda görüntülenemiyor.");
        setCareerThinking("Çalışma stiliniz şu anda görüntülenemiyor.");
        setCareerTitle("Kariyer Analizi");
        
        // Yükleme durumlarını açık tutarak kristal yükleme animasyonunun görünmesini sağla
        // setIsStoryLoading(false);
        // setIsInsightsLoading(false);
        setIsApiReady(false);
        
        // İlerlemeyi tamamla
        setLoadingProgress(100);
      }
    };

    // Analizi başlat
    generateCareerAnalysis();

    // Temizleme fonksiyonu
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [navigate, location.state]);

  // Analizi paylaşma fonksiyonu
  const handleShareAnalysis = async () => {
    if (!auraId) return;

    setIsSharing(true);
    // Burada paylaşım işlemleri yapılabilir
    setTimeout(() => {
      navigate('/gallery', { state: { shared: true, auraId } });
    }, 1500);
  };

  // Animasyon varyantları
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + (i * 0.1),
        duration: 0.5,
        ease: "easeOut"
      }
    }),
  };

  // Pulse animasyonu
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.7, 0.9, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Modal açma/kapama fonksiyonu
  const openInsightModal = (insightId: string) => {
    setSelectedInsight(insightId);
  };

  const closeInsightModal = () => {
    setSelectedInsight(null);
  };

  // Tam ekran yükleme ekranı
  if (loading) {
    return (
      <div className="loading-screen" style={{ background: '#fafafa' }}>
        <div className="aura-crystal-container">
          <div className="aura-crystal">
            <div className="crystal-face face1"></div>
            <div className="crystal-face face2"></div>
            <div className="crystal-face face3"></div>
            <div className="crystal-face face4"></div>
            <div className="crystal-shadow"></div>
          </div>
        </div>
        <div className="loading-progress">
          <div className="loading-bar">
            <div 
              className="loading-fill" 
              style={{ 
                width: `${loadingProgress}%`,
                background: `${careerGradients.main}`
              }}
            ></div>
          </div>
          <p className="loading-percentage">{loadingProgress}%</p>
        </div>
        <p className="loader-text">Kariyer Analiziniz Oluşturuluyor</p>
        <p className="loader-subtext">Yapay zeka profesyonel potansiyelinizi analiz ediyor</p>
      </div>
    );
  }

  return (
    <div className="career-result-container">
      <style>{`
        /* Ana yükleme animasyonu */
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #fafafa;
          z-index: 1000;
        }
        
        /* Yükleme animasyonu container'ı için stil */
        .aura-loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 180px;
          width: 100%;
        }
        
        /* Kristal yükleme animasyonu için stiller */
        .loading-crystal {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .loading-crystal-spinner {
          width: 60px;
          height: 60px;
          border-radius: 30%;
          position: relative;
          animation: crystal-spin 2s infinite linear;
        }
        
        .loading-crystal-spinner::before,
        .loading-crystal-spinner::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 30%;
          background: inherit;
          opacity: 0.7;
        }
        
        .loading-crystal-spinner::after {
          filter: blur(5px);
          animation: crystal-pulse 1.5s infinite alternate;
        }
        
        .loading-crystal-text {
          font-size: 1rem;
          color: #666;
          display: flex;
          gap: 0.2rem;
        }
        
        .loading-crystal-dots {
          position: relative;
          min-width: 16px;
        }
        
        .loading-crystal-dots::after {
          content: '...';
          position: absolute;
          animation: dots-animation 1.5s infinite;
          width: 1.5em;
        }
        
        @keyframes crystal-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes crystal-pulse {
          from { transform: scale(1); opacity: 0.7; }
          to { transform: scale(1.3); opacity: 0.3; }
        }
        
        @keyframes dots-animation {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }
        
        /* İçgörü yükleme iskeleti stillerini geliştir */
        .insight-loading-skeleton {
          padding: 1.5rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .insight-loading-icon-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .insight-loading-icon-placeholder {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .insight-loading-icon-placeholder::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: inherit;
          opacity: 0.7;
          z-index: 1;
        }
        
        .insight-loading-icon-placeholder::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          right: -50%;
          bottom: -50%;
          background: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: rotate(45deg);
          animation: insight-icon-shine 2s infinite;
          z-index: 2;
        }
        
        .insight-loading-icon {
          position: relative;
          z-index: 3;
          color: white;
          font-size: 1.2rem;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        @keyframes insight-icon-shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        
        .insight-loading-title {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          color: #333;
          text-align: center;
        }
        
        .insight-loading-content-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          min-height: 100px;
        }
        
        .insight-loading-crystal-container {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .insight-loading-crystal {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #4158D0, #C850C0);
          border-radius: 20%;
          position: relative;
          animation: crystal-rotate-3d 3s infinite linear;
          transform-style: preserve-3d;
          box-shadow: 0 5px 15px rgba(65, 88, 208, 0.3);
        }
        
        .insight-loading-crystal::before,
        .insight-loading-crystal::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: inherit;
          border-radius: 20%;
          opacity: 0.6;
        }
        
        .insight-loading-crystal::before {
          transform: rotateX(60deg);
        }
        
        .insight-loading-crystal::after {
          transform: rotateY(60deg);
        }
        
        @keyframes crystal-rotate-3d {
          0% { transform: rotate(0deg) rotateX(30deg) rotateY(0deg); }
          100% { transform: rotate(360deg) rotateX(30deg) rotateY(360deg); }
        }
        
        .insight-loading-text {
          font-size: 0.9rem;
          color: #666;
          display: flex;
          gap: 0.2rem;
        }
        
        .insight-loading-dots {
          position: relative;
          width: 2em;
          display: inline-block;
        }
        
        .insight-loading-dots::after {
          content: '...';
          position: absolute;
          animation: insight-dots 1.5s infinite steps(4);
          overflow: hidden;
          white-space: nowrap;
        }
        
        @keyframes insight-dots {
          0% { content: ''; width: 0; }
          100% { content: '...'; width: 3em; }
        }
        
        .loading-progress {
          width: 200px;
          margin: 20px 0;
        }
        
        .loading-bar {
          height: 6px;
          background: #eee;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .loading-fill {
          height: 100%;
          background: ${careerGradients.main};
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .loading-percentage {
          text-align: center;
          margin-top: 8px;
          font-size: 14px;
          color: #666;
        }
        
        .loader-text {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }
        
        .loader-subtext {
          font-size: 16px;
          color: #777;
        }
        
        /* Hikaye kartı */
        .story-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .story-card.expanded {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
        }
        
        .story-content {
          position: relative;
        }
        
        .story-gradient-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(transparent, white);
          pointer-events: none;
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        
        .story-card.expanded .story-gradient-overlay {
          opacity: 0;
        }
        
        .story-toggle-btn {
          background: ${careerGradients.main};
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 1rem auto 0;
          transition: all 0.2s ease;
        }
        
        .story-toggle-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .story-toggle-btn .icon {
          margin-left: 6px;
          font-size: 18px;
        }
        
        /* İçgörü kartları için yeni stil */
        .career-insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 2rem;
        }

        .career-insight-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.8);
          min-height: 200px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .career-insight-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.1);
        }
        
        .career-insight-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .career-insight-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 1rem;
        }
        
        .career-insight-content {
          color: #555;
          font-size: 0.95rem;
          line-height: 1.6;
          flex-grow: 1;
          height: 150px;
          overflow: hidden;
          position: relative;
        }
        
        .insight-content-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.9));
          pointer-events: none;
        }
        
        .insight-card-expand-hint {
          text-align: center;
          margin-top: 0.5rem;
          color: ${careerGradients.light};
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        /* Modal Stilleri */
        .insight-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(3px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .insight-modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
          animation: modal-slide-in 0.3s ease-out;
        }
        
        @keyframes modal-slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .insight-modal-header {
          display: flex;
          align-items: center;
          padding: 1.5rem;
          background: ${careerGradients.main};
          border-radius: 16px 16px 0 0;
          color: white;
          position: relative;
        }
        
        .insight-modal-icon {
          font-size: 1.8rem;
          margin-right: 1rem;
          background: rgba(255, 255, 255, 0.2);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .insight-modal-title {
          font-size: 1.4rem;
          margin: 0;
          flex-grow: 1;
        }
        
        .insight-modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .insight-modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }
        
        .insight-modal-body {
          padding: 1.5rem;
        }
        
        .insight-modal-text {
          margin: 0 0 1.5rem 0;
          line-height: 1.6;
          font-size: 1.1rem;
          white-space: pre-line;
        }
        
        .insight-modal-explanation {
          background: rgba(0, 0, 0, 0.03);
          padding: 1.2rem;
          border-radius: 12px;
          margin-top: 1.5rem;
          border-left: 4px solid ${careerGradients.light};
        }
        
        .insight-modal-explanation h3 {
          margin-top: 0;
          font-size: 1.1rem;
          opacity: 0.8;
        }
        
        .insight-modal-footer {
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .insight-modal-button {
          background: ${careerGradients.main};
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 30px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .insight-modal-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        /* Hikaye kartı stilinde değişiklik */
        .story-card {
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
          background: white;
          margin-bottom: 2rem;
        }
        
        .story-text p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        /* Modal içindeki HTML içeriği için stiller */
        .insight-modal-text strong {
          font-weight: 600;
        }
        
        .insight-modal-text em {
          font-style: italic;
        }
      `}</style>
      
      {/* Header */}
      <header className={`header career-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="flex justify-between items-center">
            <Link to="/" className="gradient-text text-2xl font-bold">
              Auralize
              <span className="logo-particle">✨</span>
            </Link>
            <nav>
              <ul className="flex space-x-6">
                <li><Link to="/gallery" className="nav-link">Galeri</Link></li>
                <li><Link to="/profile" className="nav-link">Profilim</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="main-content career-result-content">
        <div className="container">
          <h1 className="career-result-title">{careerTitle || 'Kariyer Analizi'}</h1>
          
          {/* Hikaye Bölümü - Artık tam gösterim */}
          <section className="career-section">
            <div className="career-section-header">
              <h2 className="career-section-title">
                <span className="career-section-icon">💼</span> Kariyer Yol Haritanız
              </h2>
            </div>
            
            <div className="story-card">
              {isStoryLoading ? (
                <div className="aura-loading-container">
                  <LoadingAnimation text="Kariyer analiziniz hazırlanıyor" color={careerGradients.main} />
                </div>
              ) : (
                <div className="story-content">
                  <div className="story-text">
                    {careerStory.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* İçgörüler Bölümü - Modal İle */}
          <section className="career-section">
            <div className="career-section-header">
              <h2 className="career-section-title">
                <span className="career-section-icon">💡</span> Profesyonel İçgörüleriniz
              </h2>
            </div>
            
            <div className="career-insights-grid">
              <div 
                className="career-insight-card"
                onClick={() => !isInsightsLoading && openInsightModal('strengths')}
              >
                {isInsightsLoading ? (
                  <InsightLoadingSkeleton 
                    icon="🌟" 
                    title="Profesyonel Güçlü Yönleriniz" 
                    color={careerGradients.main}
                  />
                ) : (
                  <>
                    <div className="career-insight-icon" style={{ background: careerGradients.main }}>🌟</div>
                    <h3 className="career-insight-title">Profesyonel Güçlü Yönleriniz</h3>
                    <div className="career-insight-content">
                      {getInsightPreview(careerStrengths)}
                      <div className="insight-content-gradient"></div>
                    </div>
                    <div className="insight-card-expand-hint">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6"></path>
                        <path d="M10 14 21 3"></path>
                      </svg>
                      Daha Fazla Göster
                    </div>
                  </>
                )}
              </div>
              
              <div 
                className="career-insight-card"
                onClick={() => !isInsightsLoading && openInsightModal('potential')}
              >
                {isInsightsLoading ? (
                  <InsightLoadingSkeleton 
                    icon="🚀" 
                    title="Kariyer Potansiyeliniz" 
                    color={careerGradients.main}
                  />
                ) : (
                  <>
                    <div className="career-insight-icon" style={{ background: careerGradients.main }}>🚀</div>
                    <h3 className="career-insight-title">Kariyer Potansiyeliniz</h3>
                    <div className="career-insight-content">
                      {getInsightPreview(careerPotential)}
                      <div className="insight-content-gradient"></div>
                    </div>
                    <div className="insight-card-expand-hint">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6"></path>
                        <path d="M10 14 21 3"></path>
                      </svg>
                      Daha Fazla Göster
                    </div>
                  </>
                )}
              </div>
              
              <div 
                className="career-insight-card"
                onClick={() => !isInsightsLoading && openInsightModal('thinking')}
              >
                {isInsightsLoading ? (
                  <InsightLoadingSkeleton 
                    icon="🧠" 
                    title="Çalışma ve Liderlik Stiliniz" 
                    color={careerGradients.main}
                  />
                ) : (
                  <>
                    <div className="career-insight-icon" style={{ background: careerGradients.main }}>🧠</div>
                    <h3 className="career-insight-title">Çalışma ve Liderlik Stiliniz</h3>
                    <div className="career-insight-content">
                      {getInsightPreview(careerThinking)}
                      <div className="insight-content-gradient"></div>
                    </div>
                    <div className="insight-card-expand-hint">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6"></path>
                        <path d="M10 14 21 3"></path>
                      </svg>
                      Daha Fazla Göster
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
          
          {/* Aksiyon Butonları */}
          <div className="career-actions">
            <Link to="/" className="btn btn-primary">
              Ana Sayfaya Dön
            </Link>
            <Link to="/quiz?type=career" className="btn btn-glass">
              <span className="btn-icon">🔄</span>
              Testi Tekrarla
            </Link>
            {showShareButton && (
              <button 
                className={`btn ${isSharing ? 'btn-success' : 'btn-share'}`}
                onClick={handleShareAnalysis}
                disabled={isSharing}
              >
                <span className="btn-icon">
                  {isSharing ? '✓' : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                  )}
                </span>
                {isSharing ? 'Paylaşıldı' : 'Galeriye Paylaş'}
              </button>
            )}
          </div>
        </div>
      </main>
      
      {/* İçgörü Modalleri */}
      <InsightModal
        isOpen={selectedInsight === 'strengths'}
        onClose={closeInsightModal}
        title="Profesyonel Güçlü Yönleriniz"
        content={careerStrengths}
        icon="🌟"
        explanation={getDetailedExplanation('strengths')}
        color={careerGradients.main}
      />
      
      <InsightModal
        isOpen={selectedInsight === 'potential'}
        onClose={closeInsightModal}
        title="Kariyer Potansiyeliniz"
        content={careerPotential}
        icon="🚀"
        explanation={getDetailedExplanation('potential')}
        color={careerGradients.main}
      />
      
      <InsightModal
        isOpen={selectedInsight === 'thinking'}
        onClose={closeInsightModal}
        title="Çalışma ve Liderlik Stiliniz"
        content={careerThinking}
        icon="🧠"
        explanation={getDetailedExplanation('thinking')}
        color={careerGradients.main}
      />
      
      <footer className="py-6 px-4 gradient-footer" style={{ background: careerGradients.dark }}>
        <div className="container">
          <div className="text-center text-white">
            <p>
              &copy; {new Date().getFullYear()} Auralize - Kariyerinizi Keşfedin
              <span className="ml-2">✨</span>
            </p>
            <div className="footer-links">
              <a href="/about" className="footer-link">Hakkımızda</a>
              <a href="/privacy" className="footer-link">Gizlilik</a>
              <a href="/contact" className="footer-link">İletişim</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CareerResult; 