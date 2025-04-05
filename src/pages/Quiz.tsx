import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Quiz sorularını tanımlıyoruz
const quizQuestions = [
  // Adım 1: İlham Haritası (Yaratıcı Eğilimleri Anlama)
  {
    id: 1,
    question: "Aşağıdaki resimlerden hangisi seni şu an en çok çekiyor?",
    options: [
      { id: 'a', value: 'Sakin bir okyanus manzarası', image: 'ocean.jpg' },
      { id: 'b', value: 'Renkli, kaotik bir soyut resim', image: 'abstract.jpg' },
      { id: 'c', value: 'Karanlık bir orman silueti', image: 'forest.jpg' },
      { id: 'd', value: 'Minimalist bir geometrik desen', image: 'geometric.jpg' }
    ]
  },
  {
    id: 2,
    question: "Sana şu an en yakın gelen kelimeyi seç:",
    options: [
      { id: 'a', value: 'Huzur' },
      { id: 'b', value: 'Tutku' },
      { id: 'c', value: 'Gizem' },
      { id: 'd', value: 'Enerji' }
    ]
  },
  {
    id: 3,
    question: "Bir hikayenin ilk cümlesini seçseydin hangisi olurdu?",
    options: [
      { id: 'a', value: 'Güneş ufukta yavaşça batarken, her şey sessizliğe büründü.' },
      { id: 'b', value: 'Şehrin ışıkları yanıp sönerken, kalabalık bir ritimle dans ediyordu.' },
      { id: 'c', value: 'Tozlu bir yolun sonunda, eski bir kapı gizlice açıldı.' },
      { id: 'd', value: 'Gökyüzü aniden patladı, renkler her yere saçıldı.' }
    ]
  },
  {
    id: 4,
    question: "Kendini bir doğa unsuruyla tanımlasan hangisi olurdun?",
    options: [
      { id: 'a', value: 'Durgun bir göl' },
      { id: 'b', value: 'Fırtınalı bir rüzgar' },
      { id: 'c', value: 'Yanan bir ateş' },
      { id: 'd', value: 'Derin bir mağara' }
    ]
  },
  // Adım 2: Aura Paleti (Duygusal ve Estetik Derinlik)
  {
    id: 5,
    question: "Sana şu an en çok hitap eden rengi seç:",
    options: [
      { id: 'a', value: 'Derin mavi', color: '#1E3A8A' },
      { id: 'b', value: 'Canlı kırmızı', color: '#DC2626' },
      { id: 'c', value: 'Yumuşak yeşil', color: '#10B981' },
      { id: 'd', value: 'Mat siyah', color: '#1F2937' }
    ]
  },
  {
    id: 6,
    question: "Bugünkü ruh halini en iyi hangi emoji ifade eder?",
    options: [
      { id: 'a', value: '😊 Mutlu', emoji: '😊' },
      { id: 'b', value: '🌩️ Fırtınalı', emoji: '🌩️' },
      { id: 'c', value: '✨ Heyecanlı', emoji: '✨' },
      { id: 'd', value: '🤔 Düşünceli', emoji: '🤔' }
    ]
  },
  {
    id: 7,
    question: "Şu an bir melodi duysan, hangi tarzda olmasını isterdin?",
    options: [
      { id: 'a', value: 'Sakin piyano notaları' },
      { id: 'b', value: 'Hızlı elektronik ritimler' },
      { id: 'c', value: 'Derin ve gizemli koro sesleri' },
      { id: 'd', value: 'Neşeli akustik gitar' }
    ]
  },
  {
    id: 8,
    question: "Bir yüzeye dokunsan, nasıl hissetmesini isterdin?",
    options: [
      { id: 'a', value: 'Pürüzsüz ve serin (mermer gibi)' },
      { id: 'b', value: 'Yumuşak ve sıcak (kadife gibi)' },
      { id: 'c', value: 'Kaba ve doğal (taş gibi)' },
      { id: 'd', value: 'Parlak ve kaygan (cam gibi)' }
    ]
  },
  // Adım 3: Serbest Yaratım (Kişisel İfade)
  {
    id: 9,
    question: "Sana ilham veren bir kelime veya kısa bir cümle yaz:",
    isTextField: true
  },
  {
    id: 10,
    question: "Basit bir çizim yapabilsen, ne çizerdin?",
    options: [
      { id: 'a', value: 'Bir daire', shape: 'circle' },
      { id: 'b', value: 'Dalgalı bir çizgi', shape: 'wave' },
      { id: 'c', value: 'Keskin bir üçgen', shape: 'triangle' },
      { id: 'd', value: 'Rastgele bir karalama', shape: 'random' }
    ]
  },
  {
    id: 11,
    question: "Bir an için gözlerini kapat ve kendini bir yerde hayal et. Nasıldı?",
    isTextField: true
  },
  {
    id: 12,
    question: "Bir ses duysan, ne olmasını isterdin?",
    options: [
      { id: 'a', value: 'Dalga sesleri' },
      { id: 'b', value: 'Kuş cıvıltıları' },
      { id: 'c', value: 'Uzak bir fırtına' },
      { id: 'd', value: 'Hafif bir çan sesi' }
    ]
  },
  // Adım 4: Derinlemesine Keşif (Kişilik ve Yaratıcı Potansiyel)
  {
    id: 13,
    question: "Kendini hangi zaman diliminde hayal ediyorsun?",
    options: [
      { id: 'a', value: 'Geçmişte (eski bir çağda)' },
      { id: 'b', value: 'Şu anda' },
      { id: 'c', value: 'Gelecekte (fütüristik bir dünyada)' },
      { id: 'd', value: 'Zamansız bir boyutta' }
    ]
  },
  {
    id: 14,
    question: "Bir hikayede olsan, kim olurdun?",
    options: [
      { id: 'a', value: 'Bilge bir rehber' },
      { id: 'b', value: 'Cesur bir kaşif' },
      { id: 'c', value: 'Gizemli bir yabancı' },
      { id: 'd', value: 'Neşeli bir sanatçı' }
    ]
  },
  {
    id: 15,
    question: "Bir sanat eseri sende hangi duyguyu uyandırsın isterdin?",
    options: [
      { id: 'a', value: 'Huzur' },
      { id: 'b', value: 'Heyecan' },
      { id: 'c', value: 'Merak' },
      { id: 'd', value: 'Nostalji' }
    ]
  },
  {
    id: 16,
    question: "Yaratıcı sürecin nasıl ilerlesin isterdin?",
    options: [
      { id: 'a', value: 'Yavaş ve düşünceli' },
      { id: 'b', value: 'Hızlı ve spontane' },
      { id: 'c', value: 'Dengeli ve ritmik' },
      { id: 'd', value: 'Düzensiz ve kaotik' }
    ]
  },
  // Adım 5: Evrilen Aura (Uzun Vadeli Gelişim)
  {
    id: 17,
    question: "Auranın zamanla nasıl evrilmesini isterdin?",
    options: [
      { id: 'a', value: 'Daha sakin ve derin' },
      { id: 'b', value: 'Daha canlı ve cesur' },
      { id: 'c', value: 'Daha gizemli ve karmaşık' },
      { id: 'd', value: 'Daha sade ve net' }
    ]
  },
  {
    id: 18,
    question: "Sana en çok ne ilham verir?",
    options: [
      { id: 'a', value: 'Doğa' },
      { id: 'b', value: 'Teknoloji' },
      { id: 'c', value: 'İnsan ilişkileri' },
      { id: 'd', value: 'Hayaller ve rüyalar' }
    ]
  },
  {
    id: 19,
    question: "Yaratıcı eserini başkalarıyla paylaşır mıydın?",
    options: [
      { id: 'a', value: 'Evet, herkesle' },
      { id: 'b', value: 'Sadece yakın arkadaşlarımla' },
      { id: 'c', value: 'Hayır, kendime saklarım' },
      { id: 'd', value: 'Belki, duruma göre' }
    ]
  },
  {
    id: 20,
    question: "Auran için son bir kelime veya sembol eklemek istesen, ne olurdu?",
    isTextField: true
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
  const [textAnswers, setTextAnswers] = useState<{ [key: number]: string }>({});
  const [showResultButton, setShowResultButton] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [textInput, setTextInput] = useState('');
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
        setTextInput('');
      }, 500);
    } else {
      setShowResultButton(true);
    }
  };

  const handleTextSubmit = (questionId: number) => {
    if (textInput.trim() === '') return;
    
    const newTextAnswers = { ...textAnswers, [questionId]: textInput };
    setTextAnswers(newTextAnswers);
    
    if (currentQuestion < quizQuestions.length - 1) {
      setAnimateOut(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setAnimateOut(false);
        setTextInput('');
      }, 500);
    } else {
      setShowResultButton(true);
    }
  };

  const goToResults = () => {
    // Tüm cevapları birleştir
    const allAnswers = {
      multipleChoice: answers,
      textAnswers: textAnswers
    };
    // Aura result sayfasına yönlendir
    navigate('/aura-result', { state: { answers: allAnswers } });
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
        return <div className="shape-option wave"></div>;
      case 'random':
        return <div className="shape-option random"></div>;
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
            
            {currentQ.isTextField ? (
              <motion.div 
                className="text-input-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="quiz-text-input"
                  placeholder="Düşüncelerini buraya yaz..."
                  rows={4}
                />
                <button 
                  onClick={() => handleTextSubmit(currentQ.id)}
                  className="btn btn-primary mt-4"
                  disabled={textInput.trim() === ''}
                >
                  Devam Et
                </button>
              </motion.div>
            ) : (
              <div className="quiz-options">
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
            )}

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