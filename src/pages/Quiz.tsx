import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Quiz sorularını tanımlıyoruz
const quizQuestions = [
  {
    id: 1,
    question: "Hangi renk size en çok hitap ediyor?",
    options: [
      { id: 'a', value: 'Mavi', color: '#4A90E2' },
      { id: 'b', value: 'Yeşil', color: '#50C878' },
      { id: 'c', value: 'Kırmızı', color: '#E74C3C' },
      { id: 'd', value: 'Mor', color: '#9B59B6' }
    ]
  },
  {
    id: 2,
    question: "Aşağıdaki şekillerden hangisi size en çok çekici geliyor?",
    options: [
      { id: 'a', value: 'Daire', shape: 'circle' },
      { id: 'b', value: 'Kare', shape: 'square' },
      { id: 'c', value: 'Üçgen', shape: 'triangle' },
      { id: 'd', value: 'Spiral', shape: 'spiral' }
    ]
  },
  {
    id: 3,
    question: "Kendinizi nasıl tanımlarsınız?",
    options: [
      { id: 'a', value: 'Analitik' },
      { id: 'b', value: 'Yaratıcı' },
      { id: 'c', value: 'Duygusal' },
      { id: 'd', value: 'Pratik' }
    ]
  },
  {
    id: 4,
    question: "En sevdiğiniz müzik tarzı nedir?",
    options: [
      { id: 'a', value: 'Klasik' },
      { id: 'b', value: 'Pop/Rock' },
      { id: 'c', value: 'Elektronik' },
      { id: 'd', value: 'Jazz/Blues' }
    ]
  },
  {
    id: 5,
    question: "İdeal bir tatil günü nasıl olurdu?",
    options: [
      { id: 'a', value: 'Doğada yürüyüş' },
      { id: 'b', value: 'Müze/Sanat galerisi ziyareti' },
      { id: 'c', value: 'Plajda dinlenme' },
      { id: 'd', value: 'Şehir turu' }
    ]
  }
];

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
  const navigate = useNavigate();

  // Scroll olayını dinleyen etki
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

  const goToResults = () => {
    // Burada cevapları API'ye gönderip sonucu alabilirsiniz
    // Şimdilik direkt result sayfasına yönlendiriyoruz
    navigate('/aura-result', { state: { answers } });
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
      default:
        return <div className="shape-option circle"></div>;
    }
  };

  const renderOption = (option: any) => {
    if (option.color) {
      return <div className="color-option" style={{ backgroundColor: option.color }}></div>;
    } else if (option.shape) {
      return renderShapeOption(option);
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
    <div className="page-wrapper">
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
            <div className="quiz-progress">
              <span className="quiz-progress-text">{currentQuestion + 1} / {quizQuestions.length}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content flex items-center justify-center">
        <div className="container">
          <motion.div 
            className={`quiz-card ${animateOut ? 'fade-out' : 'fade-in'}`}
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
            
            <div className="quiz-options">
              {currentQ.options.map((option, index) => (
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
                >
                  Auranı Gör
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