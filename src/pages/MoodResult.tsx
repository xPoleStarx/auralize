import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from 'framer-motion';
import { getAuraStoryFromDeepSeek, getAuraInsightsFromLlama } from '../services/deepseekService';
import { saveAuraStory } from '../services/auraDataService';
import { moodQuizQuestions } from '../pages/Quiz'; // Ruh Hali sorularını import et

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

// Ana durum (mood) renkleri
const moodGradients = {
  main: 'linear-gradient(135deg, #43C6AC, #F8FFAE)',
  dark: 'linear-gradient(135deg, #2B7F6E, #A5AB4A)',
  light: '#43C6AC'
};

// Duygu Durum Analizi Sonuç Sayfası
const MoodResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingProgress, setLoadingProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAnalysisStarted, setIsAnalysisStarted] = useState(false);
  const [moodStory, setMoodStory] = useState<string>('');
  const [moodStrengths, setMoodStrengths] = useState<string>('');
  const [moodPotential, setMoodPotential] = useState<string>('');
  const [moodThinking, setMoodThinking] = useState<string>('');
  const [moodTitle, setMoodTitle] = useState<string>('');
  const [auraId, setAuraId] = useState<string | null>(null);
  const [showShareButton, setShowShareButton] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isStoryLoading, setIsStoryLoading] = useState(true);
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
    // Doğrudan sayfaya yönlendirildiğinde animasyonu 100'e çıkarma
    // loadingInterval kaldırıldı, doğrudan sayfa üzerinde yükleme gösterilecek
    setLoadingProgress(100);
  }, []);

  // Konum durum verilerini al
  useEffect(() => {
    const state = location.state as { answers: { [key: number]: string }; quizType: string } | null;
    
    if (!state || !state.answers) {
      // Eğer cevaplar yoksa ana sayfaya yönlendir
      navigate('/');
      return;
    }

    const quizType = 'mood'; // Bu sayfada sabit olarak 'mood' kullanılacak

    // Kullanıcı adını localStorage'dan al veya varsayılan
    const username = localStorage.getItem('auralize_username') || 'Seyyah';

    // Timeout kontrolü için
    let isTimedOut = false;
    let maxTimeout = 300000; // 5 dakika timeout

    const generateMoodAnalysis = async () => {
      setIsAnalysisStarted(true);
      timerRef.current = setTimeout(() => {
        if (isStoryLoading || isInsightsLoading) {
          isTimedOut = true;
          console.warn("Duygu durum analizi zaman aşımına uğradı");
          setMoodStory("Duygu durum analiziniz için sunucu yanıt vermedi. Bu genellikle geçici bir sorundur. Lütfen daha sonra tekrar deneyin.");
          setMoodStrengths("Zaman aşımı nedeniyle duygusal güçlü yönleriniz yüklenemedi.");
          setMoodPotential("Zaman aşımı nedeniyle duygusal potansiyeliniz yüklenemedi.");
          setMoodThinking("Zaman aşımı nedeniyle duygusal tepki stiliniz yüklenemedi.");
          setMoodTitle("Duygu Durum Analizi (Oluşturulamadı)");
          setIsStoryLoading(false);
          setIsInsightsLoading(false);
          setIsLoading(false);
        }
      }, maxTimeout);
      
      try {
        // Quiz cevaplarını daha detaylı bir formata dönüştür
        const detailedAnswers = Object.entries(state.answers).map(([questionId, answerId]) => {
          // MoodQuizQuestions dizisinden ilgili soruyu bul
          const question = moodQuizQuestions.find((q: QuizQuestion) => q.id === parseInt(questionId));
          if (!question) return null;
          
          // Sorunun cevap seçeneklerinden kullanıcının seçtiğini bul
          const selectedOption = question.options.find((opt: QuizOption) => opt.id === answerId);
          if (!selectedOption) return null;
          
          return {
            questionId: parseInt(questionId),
            question: question.question,
            answerId: answerId,
            answerText: selectedOption.value
          };
        }).filter(Boolean) as DetailedAnswer[]; // null değerleri filtrele ve tip ataması yap
        
        console.log("Detaylı ruh hali analiz cevapları:", detailedAnswers);
        
        // İçgörüleri ve hikayeyi paralel olarak yükleyelim
        const storyPromise = getAuraStoryFromDeepSeek(quizType, username, state.answers);
        // @ts-ignore - detailedAnswers parametresini ekstra olarak geçiyoruz, servisi güncelleyeceğiz
        const insightsPromise = getAuraInsightsFromLlama(quizType, username, state.answers, detailedAnswers);

        // İçgörüleri elde et
        insightsPromise.then((insights) => {
          if (isTimedOut) return;
          
          setMoodStrengths(insights.strengths);
          setMoodPotential(insights.potential);
          setMoodThinking(insights.thinkingStyle);
          setMoodTitle(insights.auraTitle);
          setIsInsightsLoading(false);

          // İlerleme çubuğunu güncelle
          setLoadingProgress(prev => Math.min(prev + 5, 95));
        }).catch((error) => {
          console.error("İçgörüler alınırken hata:", error);
          setMoodStrengths("Duygusal güçlü yönleriniz şu anda görüntülenemiyor.");
          setMoodPotential("Duygusal potansiyeliniz şu anda görüntülenemiyor.");
          setMoodThinking("Duygusal tepki stiliniz şu anda görüntülenemiyor.");
          setMoodTitle("Duygu Durum Analizi");
          setIsInsightsLoading(false);
        });

        // Hikayeyi elde et
        storyPromise.then((story) => {
          if (isTimedOut) return;
          
          // "__llama__" ön ekini kontrol et ve kaldır
          const cleanedStory = story.replace(/^__llama__/, '');
          setMoodStory(cleanedStory);
          setIsStoryLoading(false);

          // İlerleme çubuğunu güncelle
          setLoadingProgress(prev => Math.min(prev + 5, 95));
        }).catch((error) => {
          console.error("Hikaye alınırken hata:", error);
          
          // Network hatası mı kontrol et
          if (error instanceof Error) {
            if ('message' in error && typeof error.message === 'string') {
              if (error.message.includes('network') || error.message.includes('Network') || 
                  error.message.includes('timeout') || error.message.includes('Timeout')) {
                setMoodStory("Sunucuyla iletişim kurarken bir ağ hatası oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.");
              } else {
                setMoodStory("Duygu durum analiziniz oluşturulurken teknik bir sorun yaşandı. Lütfen daha sonra tekrar deneyin.");
              }
            } else {
              setMoodStory("Duygu durum analiziniz oluşturulurken bir sorun yaşandı. Lütfen daha sonra tekrar deneyin.");
            }
          } else {
            setMoodStory("Duygu durum analiziniz oluşturulurken bir sorun yaşandı. Lütfen daha sonra tekrar deneyin.");
          }
          
          setIsStoryLoading(false);
        });

        // Her iki işlem tamamlandığında veya hata verdiğinde
        Promise.allSettled([storyPromise, insightsPromise]).then(async (results) => {
          if (isTimedOut) return;

          // Her iki işlemden biri başarılı olduysa analizin tamamlandığını işaretle
          if (results[0].status === 'fulfilled' || results[1].status === 'fulfilled') {
            // Analiz verilerini kaydet
            const userId = localStorage.getItem('auralize_user_id') || Date.now().toString();
            localStorage.setItem('auralize_user_id', userId);

            try {
              const savedAuraId = await saveAuraStory(userId, {
                auraType: quizType,
                story: moodStory || "Hikaye yüklenemedi",
                strengths: moodStrengths || "Güçlü yönler yüklenemedi",
                potential: moodPotential || "Potansiyel yüklenemedi",
                thinkingStyle: moodThinking || "Düşünme stili yüklenemedi",
                auraTitle: moodTitle || "Duygu Durum Analizi",
                answers: state.answers
              });
              
              setAuraId(savedAuraId);
              setShowShareButton(true);
            } catch (saveError) {
              console.error("Analiz kaydedilirken hata:", saveError);
            }
            
            clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
            setIsLoading(false);
            setLoadingProgress(100);
          }
        });
      } catch (error) {
        console.error("Duygu analizi oluşturulurken hata:", error);
        
        setMoodStory("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        setMoodStrengths("Duygusal güçlü yönleriniz şu anda görüntülenemiyor.");
        setMoodPotential("Duygusal potansiyeliniz şu anda görüntülenemiyor.");
        setMoodThinking("Duygusal tepki stiliniz şu anda görüntülenemiyor.");
        setMoodTitle("Duygu Durum Analizi");
        
        clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
        setIsStoryLoading(false);
        setIsInsightsLoading(false);
        setIsLoading(false);
        setLoadingProgress(100);
      }
    };

    // İlk yükleme hemen başlasın
    generateMoodAnalysis();
    
    // Cleanup fonksiyonu
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [location, navigate, moodStory, moodStrengths, moodPotential, moodThinking, moodTitle, isStoryLoading, isInsightsLoading]);

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

  // Kart genişletme/daraltma fonksiyonu
  const toggleCardExpansion = (cardId: string) => {
    if (expandedCard === cardId) {
      setExpandedCard(null);
    } else {
      setExpandedCard(cardId);
    }
  };

  // Detaylı açıklamalar için yardımcı fonksiyon - gerçek açıklamaları buraya ekleyin
  const getDetailedExplanation = (cardId: string): string => {
    switch (cardId) {
      case 'strengths':
        return `Duygusal güçlü yönleriniz, sizin en benzersiz duygusal niteliklerinizi temsil eder. Bu güçlü yönler, zorlukları aşmanıza ve duygusal olarak zengin bir yaşam sürmenize yardımcı olur. Her biri kişiliğinizin temel taşlarını oluşturur ve duygusal dengenizi bulmanızda size rehberlik eder.`;
      case 'potential':
        return `Duygusal potansiyeliniz, henüz tam olarak keşfedilmemiş veya geliştirilmemiş duygusal yetkinliklerinizi gösterir. Bu alanlar, gelişim fırsatlarınızı temsil eder ve üzerinde çalışıldığında duygusal zekanızı güçlendirebilir, ilişkilerinizi iyileştirebilir ve genel mutluluğunuzu artırabilir.`;
      case 'thinking':
        return `Duygusal tepki stiliniz, duyguları nasıl işlediğinizi ve onlara nasıl tepki verdiğinizi gösterir. Bu bilişsel süreçler, duyguları tanımlama, anlama ve düzenleme biçiminizi şekillendirir. Tepki stilinizi anlamak, duygusal durumlarla daha etkili bir şekilde başa çıkmanıza yardımcı olabilir.`;
      default:
        return '';
    }
  };

  return (
    <div className="mood-result-container">
      <style>{`
        /* Ana yükleme animasyonu */
        .aura-crystal-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 2rem;
          perspective: 800px;
        }
        
        .aura-crystal {
          width: 80px;
          height: 80px;
          position: relative;
          transform-style: preserve-3d;
          animation: crystal-rotate 4s infinite linear;
          transform: rotateX(20deg) rotateY(20deg);
        }
        
        .crystal-face {
          position: absolute;
          width: 100%;
          height: 100%;
          background: ${moodGradients.main};
          opacity: 0.7;
          border-radius: 15%;
        }
        
        .face1 { transform: rotateY(0deg) translateZ(40px); }
        .face2 { transform: rotateY(90deg) translateZ(40px); }
        .face3 { transform: rotateY(180deg) translateZ(40px); }
        .face4 { transform: rotateY(270deg) translateZ(40px); }
        
        .crystal-shadow {
          position: absolute;
          width: 100%;
          height: 20px;
          background: rgba(0,0,0,0.2);
          bottom: -40px;
          border-radius: 50%;
          filter: blur(10px);
          animation: shadow-pulse 2s infinite alternate;
        }
        
        @keyframes crystal-rotate {
          from { transform: rotateX(20deg) rotateY(0deg); }
          to { transform: rotateX(20deg) rotateY(360deg); }
        }
        
        @keyframes shadow-pulse {
          from { transform: scale(0.8); opacity: 0.2; }
          to { transform: scale(1); opacity: 0.4; }
        }
        
        /* İçgörü yükleme bileşenleri */
        .loading-crystal {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8rem;
          padding: 1rem;
        }
        
        .loading-crystal-spinner {
          width: 40px;
          height: 40px;
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
          font-size: 0.9rem;
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
        
        /* İçgörü yükleme iskeleti - geliştirilmiş versiyon */
        .insight-loading-skeleton {
          padding: 1.5rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          height: 100%;
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
          background: linear-gradient(135deg, #43C6AC, #F8FFAE);
          border-radius: 20%;
          position: relative;
          animation: crystal-rotate-3d 3s infinite linear;
          transform-style: preserve-3d;
          box-shadow: 0 5px 15px rgba(67, 198, 172, 0.3);
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
          align-items: center;
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
        
        .mood-section {
          margin-bottom: 2rem;
        }
        
        .mood-section-header {
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .mood-section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }
        
        .mood-insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .mood-insight-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.8);
          min-height: 200px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .mood-insight-card.expanded {
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.12);
        }
        
        .mood-insight-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .mood-insight-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }
        
        .mood-insight-text {
          color: #555;
          line-height: 1.6;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .mood-insight-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .mood-insight-bullet {
          color: ${moodGradients.light};
          font-size: 1.2rem;
          line-height: 1.4;
        }
        
        .mood-result-title {
          background: ${moodGradients.main};
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-size: 2.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .mood-insight-error {
          color: #e74c3c;
          font-style: italic;
        }
        
        .mood-insight-explanation {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px dashed rgba(0, 0, 0, 0.1);
          font-size: 0.95rem;
          color: #555;
          line-height: 1.6;
          overflow: hidden;
        }
        
        .mood-insight-close {
          margin-top: 1rem;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
        }
        
        .mood-insight-close:hover {
          background: rgba(255, 255, 255, 0.9);
        }
      `}</style>
      
      {/* Header */}
      <header className={`header mood-header ${scrolled ? 'scrolled' : ''}`}>
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
      
      <main className="main-content mood-result-content">
        <div className="container">
          <h1 className="mood-result-title">{moodTitle || 'Duygu Durum Analizi'}</h1>
          
          {/* Hikaye Bölümü */}
          <section className="mood-section">
            <div className="mood-section-header">
              <h2 className="mood-section-title">
                <span className="mood-section-icon">📝</span> Duygu Durum Hikayeniz
              </h2>
            </div>
            
            <div className="mood-story-box glass-card">
              {isStoryLoading ? (
                <div className="aura-loading-container">
                  <LoadingAnimation text="Duygu hikayeniz hazırlanıyor" color={moodGradients.main} />
                </div>
              ) : (
                <div className="mood-story-content animate__animated animate__fadeIn">
                  <div className="mood-story-text">
                    {moodStory.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* İçgörüler Bölümü */}
          <section className="mood-section">
            <div className="mood-section-header">
              <h2 className="mood-section-title">
                <span className="mood-section-icon">💡</span> Duygusal İçgörüleriniz
              </h2>
            </div>
            
            <div className="mood-insights-grid">
              <motion.div 
                className={`mood-insight-card ${expandedCard === 'strengths' ? 'expanded' : ''}`} 
                onClick={() => !isInsightsLoading && toggleCardExpansion('strengths')}
                whileHover={{ scale: isInsightsLoading ? 1 : 1.02 }}
                transition={{ duration: 0.2 }}
              >
                {isInsightsLoading ? (
                  <InsightLoadingSkeleton 
                    icon="🌟" 
                    title="Duygusal Güçlü Yönleriniz" 
                    color={moodGradients.main}
                  />
                ) : (
                  <>
                    <div className="mood-insight-icon" style={{ background: moodGradients.main }}>🌟</div>
                    <h3 className="mood-insight-title">Duygusal Güçlü Yönleriniz</h3>
                    <div className="mood-insight-text">
                      {moodStrengths && moodStrengths.trim() !== '' ? 
                        moodStrengths.split(',').map((strength, index) => (
                          <motion.div 
                            key={index}
                            className="mood-insight-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.5 }}
                          >
                            <span className="mood-insight-bullet">•</span>
                            <span>{strength.trim()}</span>
                          </motion.div>
                        )) : 
                        <p className="mood-insight-error">Duygusal güçlü yönleriniz yüklenirken bir hata oluştu.</p>
                      }
                    </div>
                    
                    {/* Genişletilmiş açıklama */}
                    {expandedCard === 'strengths' && (
                      <motion.div 
                        className="mood-insight-explanation"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>{getDetailedExplanation('strengths')}</p>
                        <button className="mood-insight-close" onClick={(e) => { e.stopPropagation(); setExpandedCard(null); }}>
                          <span>Kapat</span>
                        </button>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
              
              <motion.div 
                className={`mood-insight-card ${expandedCard === 'potential' ? 'expanded' : ''}`} 
                onClick={() => !isInsightsLoading && toggleCardExpansion('potential')}
                whileHover={{ scale: isInsightsLoading ? 1 : 1.02 }}
                transition={{ duration: 0.2 }}
              >
                {isInsightsLoading ? (
                  <InsightLoadingSkeleton 
                    icon="🚀" 
                    title="Duygusal Potansiyeliniz" 
                    color={moodGradients.main}
                  />
                ) : (
                  <>
                    <div className="mood-insight-icon" style={{ background: moodGradients.main }}>🚀</div>
                    <h3 className="mood-insight-title">Duygusal Potansiyeliniz</h3>
                    <div className="mood-insight-text">
                      {moodPotential && moodPotential.trim() !== '' ? 
                        moodPotential.split(',').map((potential, index) => (
                          <motion.div 
                            key={index}
                            className="mood-insight-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.5 }}
                          >
                            <span className="mood-insight-bullet">•</span>
                            <span>{potential.trim()}</span>
                          </motion.div>
                        )) : 
                        <p className="mood-insight-error">Duygusal potansiyeliniz yüklenirken bir hata oluştu.</p>
                      }
                    </div>
                    
                    {/* Genişletilmiş açıklama */}
                    {expandedCard === 'potential' && (
                      <motion.div 
                        className="mood-insight-explanation"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>{getDetailedExplanation('potential')}</p>
                        <button className="mood-insight-close" onClick={(e) => { e.stopPropagation(); setExpandedCard(null); }}>
                          <span>Kapat</span>
                        </button>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
              
              <motion.div 
                className={`mood-insight-card ${expandedCard === 'thinking' ? 'expanded' : ''}`} 
                onClick={() => !isInsightsLoading && toggleCardExpansion('thinking')}
                whileHover={{ scale: isInsightsLoading ? 1 : 1.02 }}
                transition={{ duration: 0.2 }}
              >
                {isInsightsLoading ? (
                  <InsightLoadingSkeleton 
                    icon="🧠" 
                    title="Duygusal Tepki Stiliniz" 
                    color={moodGradients.main}
                  />
                ) : (
                  <>
                    <div className="mood-insight-icon" style={{ background: moodGradients.main }}>🧠</div>
                    <h3 className="mood-insight-title">Duygusal Tepki Stiliniz</h3>
                    <div className="mood-insight-text">
                      {moodThinking && moodThinking.trim() !== '' ? 
                        moodThinking.split(',').map((style, index) => (
                          <motion.div 
                            key={index}
                            className="mood-insight-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.5 }}
                          >
                            <span className="mood-insight-bullet">•</span>
                            <span>{style.trim()}</span>
                          </motion.div>
                        )) : 
                        <p className="mood-insight-error">Duygusal tepki stiliniz yüklenirken bir hata oluştu.</p>
                      }
                    </div>
                    
                    {/* Genişletilmiş açıklama */}
                    {expandedCard === 'thinking' && (
                      <motion.div 
                        className="mood-insight-explanation"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>{getDetailedExplanation('thinking')}</p>
                        <button className="mood-insight-close" onClick={(e) => { e.stopPropagation(); setExpandedCard(null); }}>
                          <span>Kapat</span>
                        </button>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </section>
          
          {/* Aksiyon Butonları */}
          <div className="mood-actions">
            <Link to="/" className="btn btn-primary">
              Ana Sayfaya Dön
            </Link>
            <Link to="/quiz?type=mood" className="btn btn-glass">
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
      
      <footer className="py-6 px-4 gradient-footer" style={{ background: moodGradients.dark }}>
        <div className="container">
          <div className="text-center text-white">
            <p>
              &copy; {new Date().getFullYear()} Auralize - Duygularınızı Keşfedin
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

export default MoodResult; 