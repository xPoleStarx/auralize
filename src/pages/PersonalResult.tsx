import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuraStoryFromDeepSeek, getAuraInsightsFromLlama } from '../services/deepseekService';
import { saveAuraStory } from '../services/auraDataService';
import { personalQuizQuestions } from '../pages/Quiz'; // Kişisel Gelişim sorularını import et

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

// Ana kişisel gelişim renkleri
const personalGradients = {
  main: 'linear-gradient(135deg, #00B4DB, #0083B0)',
  dark: 'linear-gradient(135deg, #00627A, #005673)',
  light: '#00B4DB'
};

// Kişisel Gelişim Analizi Sonuç Sayfası
const PersonalResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isAnalysisStarted, setIsAnalysisStarted] = useState(false);
  const [personalStory, setPersonalStory] = useState<string>('');
  const [personalStrengths, setPersonalStrengths] = useState<string>('');
  const [personalPotential, setPersonalPotential] = useState<string>('');
  const [personalThinking, setPersonalThinking] = useState<string>('');
  const [personalTitle, setPersonalTitle] = useState<string>('');
  const [auraId, setAuraId] = useState<string | null>(null);
  const [showShareButton, setShowShareButton] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isStoryLoading, setIsStoryLoading] = useState(true);
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    const quizType = 'personal'; // Bu sayfada sabit olarak 'personal' kullanılacak

    // Kullanıcı adını localStorage'dan al veya varsayılan
    const username = localStorage.getItem('auralize_username') || 'Seyyah';

    // Timeout kontrolü için
    let isTimedOut = false;
    let maxTimeout = 600000; // 10 dakika timeout

    const generatePersonalAnalysis = async () => {
      setIsAnalysisStarted(true);
      timerRef.current = setTimeout(() => {
        if (isStoryLoading || isInsightsLoading) {
          isTimedOut = true;
          console.warn("Kişisel gelişim analizi zaman aşımına uğradı");
          setPersonalStory("Kişisel gelişim analiziniz için sunucu yanıt vermedi. Bu genellikle geçici bir sorundur. Lütfen daha sonra tekrar deneyin.");
          setPersonalStrengths("Zaman aşımı nedeniyle kişisel güçlü yönleriniz yüklenemedi.");
          setPersonalPotential("Zaman aşımı nedeniyle gelişim potansiyeliniz yüklenemedi.");
          setPersonalThinking("Zaman aşımı nedeniyle öğrenme ve gelişim stiliniz yüklenemedi.");
          setPersonalTitle("Kişisel Gelişim Analizi (Oluşturulamadı)");
          setIsStoryLoading(false);
          setIsInsightsLoading(false);
          setIsLoading(false);
        }
      }, maxTimeout);
      
      try {
        // Quiz cevaplarını daha detaylı bir formata dönüştür
        const detailedAnswers = Object.entries(state.answers).map(([questionId, answerId]) => {
          // PersonalQuizQuestions dizisinden ilgili soruyu bul
          const question = personalQuizQuestions.find((q: QuizQuestion) => q.id === parseInt(questionId));
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
        
        console.log("Detaylı kişisel analiz cevapları:", detailedAnswers);
        
        // İçgörüleri ve hikayeyi paralel olarak yükleyelim
        const storyPromise = getAuraStoryFromDeepSeek(quizType, username, state.answers);
        // @ts-ignore - detailedAnswers parametresini ekstra olarak geçiyoruz, servisi güncelleyeceğiz
        const insightsPromise = getAuraInsightsFromLlama(quizType, username, state.answers, detailedAnswers);

        // İçgörüleri elde et
        insightsPromise.then((insights) => {
          if (isTimedOut) return;
          
          setPersonalStrengths(insights.strengths);
          setPersonalPotential(insights.potential);
          setPersonalThinking(insights.thinkingStyle);
          setPersonalTitle(insights.auraTitle);
          setIsInsightsLoading(false);

          // İlerleme çubuğunu güncelle
          setLoadingProgress(prev => Math.min(prev + 5, 95));
        }).catch((error) => {
          console.error("İçgörüler alınırken hata:", error);
          setPersonalStrengths("Kişisel güçlü yönleriniz şu anda görüntülenemiyor.");
          setPersonalPotential("Gelişim potansiyeliniz şu anda görüntülenemiyor.");
          setPersonalThinking("Öğrenme ve gelişim stiliniz şu anda görüntülenemiyor.");
          setPersonalTitle("Kişisel Gelişim Analizi");
          setIsInsightsLoading(false);
        });

        // Hikayeyi elde et
        storyPromise.then((story) => {
          if (isTimedOut) return;
          
          setPersonalStory(story);
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
                setPersonalStory("Sunucuyla iletişim kurarken bir ağ hatası oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.");
              } else {
                setPersonalStory("Kişisel gelişim analiziniz oluşturulurken teknik bir sorun yaşandı. Lütfen daha sonra tekrar deneyin.");
              }
            } else {
              setPersonalStory("Kişisel gelişim analiziniz oluşturulurken bir sorun yaşandı. Lütfen daha sonra tekrar deneyin.");
            }
          } else {
            setPersonalStory("Kişisel gelişim analiziniz oluşturulurken bir sorun yaşandı. Lütfen daha sonra tekrar deneyin.");
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
                story: personalStory || "Hikaye yüklenemedi",
                strengths: personalStrengths || "Güçlü yönler yüklenemedi",
                potential: personalPotential || "Potansiyel yüklenemedi",
                thinkingStyle: personalThinking || "Düşünme stili yüklenemedi",
                auraTitle: personalTitle || "Kişisel Gelişim Analizi",
                answers: state.answers
              });
              
              setAuraId(savedAuraId);
              setShowShareButton(true);
            } catch (saveError) {
              console.error("Analiz kaydedilirken hata:", saveError);
            }
            
            setIsLoading(false);
            setLoadingProgress(100);
          }
        });
      } catch (error) {
        console.error("Kişisel gelişim analizi oluşturulurken hata:", error);
        
        setPersonalStory("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        setPersonalStrengths("Kişisel güçlü yönleriniz şu anda görüntülenemiyor.");
        setPersonalPotential("Gelişim potansiyeliniz şu anda görüntülenemiyor.");
        setPersonalThinking("Öğrenme ve gelişim stiliniz şu anda görüntülenemiyor.");
        setPersonalTitle("Kişisel Gelişim Analizi");
        
        setIsStoryLoading(false);
        setIsInsightsLoading(false);
        setIsLoading(false);
        setLoadingProgress(100);
      }
    };

    // İlk yükleme hemen başlasın
    generatePersonalAnalysis();
    
    // Cleanup fonksiyonu
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [location, navigate]);

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
  const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.7, 0.9, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <div className="personal-result-container">
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
          background: ${personalGradients.main};
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
          background: ${personalGradients.main};
          border-radius: 20%;
          position: relative;
          animation: crystal-rotate-3d 3s infinite linear;
          transform-style: preserve-3d;
          box-shadow: 0 5px 15px rgba(0, 180, 219, 0.3);
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
        
        .personal-section {
          margin-bottom: 2rem;
        }
        
        .personal-section-header {
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .personal-section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }
        
        .personal-insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .personal-insight-card {
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
        }
        
        .personal-result-title {
          background: ${personalGradients.main};
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-size: 2.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 1rem;
        }
      `}</style>
      
      {/* Header */}
      <header className={`header personal-header ${scrolled ? 'scrolled' : ''}`}>
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
      
      <main className="main-content personal-result-content">
        <div className="container">
          <h1 className="personal-result-title">{personalTitle || 'Kişisel Gelişim Analizi'}</h1>
          
          {/* Hikaye Bölümü */}
          <section className="personal-section">
            <div className="personal-section-header">
              <h2 className="personal-section-title">
                <span className="personal-section-icon">📚</span> Kişisel Gelişim Yolculuğunuz
              </h2>
            </div>
            
            <div className="personal-story-box glass-card">
              {isStoryLoading ? (
                <div className="aura-loading-container">
                  <LoadingAnimation text="Kişisel gelişim analiziniz hazırlanıyor" color={personalGradients.main} />
                </div>
              ) : (
                <div className="personal-story-content animate__animated animate__fadeIn">
                  <div className="personal-story-text">
                    {personalStory.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* İçgörüler Bölümü */}
          <section className="personal-section">
            <div className="personal-section-header">
              <h2 className="personal-section-title">
                <span className="personal-section-icon">💡</span> Kişisel Gelişim İçgörüleriniz
              </h2>
            </div>
            
            <div className="personal-insights-grid">
              <div className="personal-insight-card">
                {isInsightsLoading ? (
                  <InsightLoadingSkeleton 
                    icon="🌟" 
                    title="Kişisel Güçlü Yönleriniz" 
                    color={personalGradients.main}
                  />
                ) : (
                  <>
                    <div className="personal-insight-icon" style={{ background: personalGradients.main }}>🌟</div>
                    <h3 className="personal-insight-title">Kişisel Güçlü Yönleriniz</h3>
                    <p className="personal-insight-text">
                      {personalStrengths || "Kişisel güçlü yönleriniz yüklenirken bir hata oluştu."}
                    </p>
                  </>
                )}
              </div>
              
              <div className="personal-insight-card">
                {isInsightsLoading ? (
                  <InsightLoadingSkeleton 
                    icon="🚀" 
                    title="Gelişim Potansiyeliniz" 
                    color={personalGradients.main}
                  />
                ) : (
                  <>
                    <div className="personal-insight-icon" style={{ background: personalGradients.main }}>🚀</div>
                    <h3 className="personal-insight-title">Gelişim Potansiyeliniz</h3>
                    <p className="personal-insight-text">
                      {personalPotential || "Gelişim potansiyeliniz yüklenirken bir hata oluştu."}
                    </p>
                  </>
                )}
              </div>
              
              <div className="personal-insight-card">
                {isInsightsLoading ? (
                  <InsightLoadingSkeleton 
                    icon="🧠" 
                    title="Öğrenme ve Gelişim Stiliniz" 
                    color={personalGradients.main}
                  />
                ) : (
                  <>
                    <div className="personal-insight-icon" style={{ background: personalGradients.main }}>🧠</div>
                    <h3 className="personal-insight-title">Öğrenme ve Gelişim Stiliniz</h3>
                    <p className="personal-insight-text">
                      {personalThinking || "Öğrenme ve gelişim stiliniz yüklenirken bir hata oluştu."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
          
          {/* Aksiyon Butonları */}
          <div className="personal-actions">
            <Link to="/" className="btn btn-primary">
              Ana Sayfaya Dön
            </Link>
            <Link to="/quiz?type=personal" className="btn btn-glass">
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
      
      <footer className="py-6 px-4 gradient-footer" style={{ background: personalGradients.dark }}>
        <div className="container">
          <div className="text-center text-white">
            <p>
              &copy; {new Date().getFullYear()} Auralize - Potansiyelinizi Keşfedin
              <span className="ml-2">✨</span>
            </p>
            <div className="footer-links">
              <a href="#" className="footer-link">Hakkımızda</a>
              <a href="#" className="footer-link">Gizlilik</a>
              <a href="#" className="footer-link">İletişim</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PersonalResult; 