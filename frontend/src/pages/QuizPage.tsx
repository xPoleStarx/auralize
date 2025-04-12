import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
// DeepSeek ve LLaMA servisleri yerine OpenAI servisini import ediyoruz
import { getCombinedAuraDataFromOpenAI, determineDynamicAuraType } from '../services/openaiService';
import { saveAuraStory } from '../services/auraDataService';

// Quiz verileri için JSON dosyalarını import ediyoruz
import creativeQuizData from '../data/quizzes/creativeQuiz.json';
import moodQuizData from '../data/quizzes/moodQuiz.json';
import personalQuizData from '../data/quizzes/personalQuiz.json';
import careerQuizData from '../data/quizzes/careerQuiz.json';

// Parçacık arka plan efekti bileşeni
const ParticleBackground = () => {
  return (
    <div className="particle-container">
      {[...Array(15)].map((_, index) => (
        <div 
          key={index}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 20 + 5}px`,
            height: `${Math.random() * 20 + 5}px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 10 + 10}s`
          }}
        />
      ))}
    </div>
  );
};

const Quiz: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResultButton, setShowResultButton] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL'den quiz tipini al
  const searchParams = new URLSearchParams(location.search);
  const quizPath = location.pathname;
  const quizType = quizPath.includes('/quiz/') 
    ? quizPath.split('/quiz/')[1] 
    : (searchParams.get('type') || 'creative'); // Varsayılan olarak yaratıcı quiz

  console.log("Quiz tipi:", quizType); // Hata ayıklama için log

  // Quiz tipine göre soruları belirle
  const getQuizQuestions = () => {
    switch(quizType) {
      case 'mood':
        return moodQuizData;
      case 'personal':
        return personalQuizData;
      case 'career':
        return careerQuizData;
      case 'creative':
      default:
        return creativeQuizData;
    }
  };

  const quizQuestions = getQuizQuestions();
  
  // Quiz tipine göre başlık belirle
  const getQuizTitle = () => {
    switch(quizType) {
      case 'mood':
        return "Ruh Hali Analizi";
      case 'personal':
        return "Kişisel Gelişim";
      case 'career':
        return "Kariyer Yönlendirmesi";
      case 'creative':
      default:
        return "Yaratıcı Potansiyel";
    }
  };

  // Quiz tipine göre sonuç butonu metnini belirle
  const getResultButtonText = () => {
    switch(quizType) {
      case 'mood':
        return "Ruh Halini Gör";
      case 'personal':
        return "Gelişim Alanlarını Gör";
      case 'career':
        return "Kariyer Yolunu Gör";
      case 'creative':
      default:
        return "Auranı Gör";
    }
  };

  // Scroll ve overflow durumlarını yönetmeye yönelik etki
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    // Sayfanın scroll edilmesini engelle
    document.body.style.overflow = 'hidden';

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = ''; // Bileşen kaldırıldığında eski haline getir
    };
  }, []);

  const handleAnswerSelect = (questionId: number, optionId: string) => {
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);
    
    if (currentQuestion < quizQuestions.length - 1) {
      setAnimateOut(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setAnimateOut(false);
      }, 500);
    } else {
      setShowResultButton(true);
    }
  };

  const goToResults = async () => {
    setIsProcessing(true);
    
    try {
      // Önce kullanıcı kimliğini alalım
      const userId = localStorage.getItem('auralize_user_id') || 'user_' + Math.random().toString(36).substr(2, 9);
      if (!localStorage.getItem('auralize_user_id')) {
        localStorage.setItem('auralize_user_id', userId);
      }

      // Kullanıcı adını alalım
      const username = localStorage.getItem('auralize_username') || 'Kullanıcı';

      // Quiz tipine göre aura tipini belirle
      const determinedType = quizType === 'creative' ? determineDynamicAuraType(answers) : quizType;

      console.log("Quiz verileri hazırlanıyor:", { userId, username, answers, determinedType });

      // Varsayılan hikaye ve içgörüler oluştur - böylece API yanıt vermese bile kullanıcı sonuç görebilir
      try {
        // Önce varsayılan verileri kaydet, sonra API yanıtları gelirse güncellenecek
        const defaultText = `${username}'ın ${determinedType} aurası analiz ediliyor...`;
        const defaultTitle = `${determinedType.charAt(0).toUpperCase() + determinedType.slice(1)} Aurası`;
        
        // API'ye istekler başlamadan önce temel bilgileri kaydet
        const auraData = {
          auraType: determinedType,
          story: defaultText,
          strengths: "Analiz ediliyor...",
          potential: "Analiz ediliyor...",
          thinkingStyle: "Analiz ediliyor...",
          auraTitle: defaultTitle,
          answers: answers
        };
        
        // Aura verilerini kaydet - aynı zamanda önbelleğe de koy
        await saveAuraStory(userId, auraData);
        console.log("Varsayılan aura verileri kaydedildi");
        
        // Önbelleğe aynı bilgileri ekle - böylece sonuç sayfası hemen gösterebilir
        const cacheKey = `auralize_user_${userId}_latest`;
        localStorage.setItem(cacheKey, JSON.stringify({
          id: Date.now().toString(),
          auraType: determinedType,
          story: defaultText,
          strengths: "Analiz ediliyor...",
          potential: "Analiz ediliyor...",
          thinkingStyle: "Analiz ediliyor...",
          auraTitle: defaultTitle,
          answers: answers,
          userId: userId,
          username: username
        }));
        
        // Routing durumunu önbelleğe kaydet - sonuç sayfasının doğru veriyi alabilmesi için
        localStorage.setItem('auralize_last_quiz_type', determinedType);
        localStorage.setItem('auralize_last_quiz_answers', JSON.stringify(answers));
        
      } catch (saveError) {
        console.error("Aura verileri kaydedilemedi:", saveError);
      }

      // Geçiş state'i yapılandır
      const navigationState = {
        answers: answers,
        quizType: determinedType,
        userId: userId,
        username: username,
        timestamp: Date.now()
      };

      // Hemen sonuç sayfasına yönlendir - arka planda API istekleri devam edecek
      setIsProcessing(false);
        
      // Quiz tipine göre uygun sonuç sayfasına yönlendir
      switch(quizType) {
        case 'mood':
          navigate('/results/mood', { state: navigationState, replace: true });
          break;
        case 'personal':
          navigate('/results/personal', { state: navigationState, replace: true });
          break;
        case 'career':
          navigate('/results/career', { state: navigationState, replace: true });
          break;
        case 'creative':
        default:
          navigate('/results/creative', { state: navigationState, replace: true });
          break;
      }
      
    } catch (error) {
      console.error("Sonuç hazırlama işlemi sırasında hata:", error);
      setIsProcessing(false);
      
      // Hata olsa bile sonuç sayfasına yönlendir
      switch(quizType) {
        case 'mood':
          navigate('/results/mood', { state: { answers, quizType, error: true }, replace: true });
          break;
        case 'personal':
          navigate('/results/personal', { state: { answers, quizType, error: true }, replace: true });
          break;
        case 'career':
          navigate('/results/career', { state: { answers, quizType, error: true }, replace: true });
          break;
        case 'creative':
        default:
          navigate('/results/creative', { state: { answers, quizType, error: true }, replace: true });
          break;
      }
    }
  };

  const renderShapeOption = (option: any) => {
    switch(option.shape) {
      case 'circle':
        return <div className="shape-option circle"></div>;
      case 'square':
        return <div className="shape-option square"></div>;
      case 'triangle':
        return <div className="shape-option triangle"></div>;
      case 'spiral':
        return <div className="shape-option spiral"></div>;
      case 'wave':
        return (
          <div className="shape-option wave">
            <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M0,15 Q15,0 30,15 Q45,30 60,15 Q75,0 90,15 Q105,30 120,15" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                className="wave-line-animation"
              />
            </svg>
          </div>
        );
      case 'random':
        return (
          <div className="shape-option random">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M20,50 Q40,20 50,40 T70,30 Q80,60 60,80 T30,70 Q20,90 40,90 T60,50" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                strokeLinecap="round"
                className="random-sketch-animation"
              />
            </svg>
          </div>
        );
      default:
        return <div className="shape-option circle"></div>;
    }
  };

  const renderOption = (option: any) => {
    if (option.color) {
      return <div className="color-option" style={{ backgroundColor: option.color }}></div>;
    } else if (option.shape) {
      return renderShapeOption(option);
    } else if (option.emoji) {
      return <div className="emoji-option">{option.emoji}</div>;
    } else if (option.image) {
      return <div className="image-option" style={{ backgroundImage: `url(/images/${option.image})` }}></div>;
    } else {
      return null;
    }
  };

  const currentQ = quizQuestions[currentQuestion];

  // Animasyon varyantları
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="page-wrapper quiz-page">
      <div className="quiz-background">
        <div className="quiz-orb quiz-orb1"></div>
        <div className="quiz-orb quiz-orb2"></div>
        <ParticleBackground />
      </div>
      
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="flex justify-between items-center">
            <Link to="/" className="gradient-text text-2xl font-bold">
              Auralize
              <span className="logo-particle">✨</span>
            </Link>
            <div className="quiz-info">
              <span className="quiz-type">{getQuizTitle()}</span>
              <span className="quiz-progress-text">{currentQuestion + 1} / {quizQuestions.length}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content flex items-center justify-center no-scroll">
        <div className="container" style={{ marginTop: '-80px' }}>
          <motion.div 
            className={`quiz-card quiz-card-fixed ${animateOut ? 'fade-out' : 'fade-in'}`}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <div className="quiz-progress-bar">
              <motion.div 
                className="quiz-progress-fill"
                initial={{ width: `${((currentQuestion) / quizQuestions.length) * 100}%` }}
                animate={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>

            <motion.h2 
              className="quiz-question"
              key={currentQuestion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {currentQ.question}
            </motion.h2>
            
            <div className="quiz-grid">
              {currentQ.options && currentQ.options.map((option, index) => (
                <motion.button
                  key={option.id}
                  className={`quiz-option ${answers[currentQ.id] === option.id ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(currentQ.id, option.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  {renderOption(option)}
                  <span className="quiz-option-label">{option.value}</span>
                </motion.button>
              ))}
            </div>

            {showResultButton && (
              <motion.div 
                className="quiz-action"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <button 
                  onClick={goToResults}
                  className="btn btn-primary"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Hazırlanıyor..." : getResultButtonText()}
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Quiz; 