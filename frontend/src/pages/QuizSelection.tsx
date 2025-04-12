import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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

// Quiz seçenekleri
const quizOptions = [
  {
    id: 'creative',
    title: 'Yaratıcı Potansiyel',
    description: 'Sanatsal yeteneklerinizi keşfetmenize yardımcı olur, yaratıcılık yönlerinizi ortaya çıkarır.',
    emoji: '🎨',
    color: 'from-purple-500 to-pink-500',
    path: '/quiz/creative'
  },
  {
    id: 'mood',
    title: 'Ruh Hali Analizi',
    description: 'Günlük ruh halinize göre öneriler sunar, duygusal spektrumunuzu analiz eder.',
    emoji: '🌈',
    color: 'from-blue-500 to-teal-400',
    path: '/quiz/mood'
  },
  {
    id: 'personal',
    title: 'Kişisel Gelişim',
    description: 'Odaklanmanız gereken gelişim alanlarını belirler, potansiyelinizi ortaya çıkarır.',
    emoji: '🌱',
    color: 'from-green-500 to-emerald-400',
    path: '/quiz/personal'
  },
  {
    id: 'career',
    title: 'Kariyer Yönlendirmesi',
    description: 'Meslek seçiminde rehberlik eder, kariyer yolunuzu belirlemenize yardımcı olur.',
    emoji: '🚀',
    color: 'from-orange-500 to-amber-500',
    path: '/quiz/career'
  }
];

const QuizSelection: React.FC = () => {
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

  // Seçilen quiz'e yönlendirme
  const handleQuizSelect = (quizPath: string) => {
    console.log(`Quiz seçildi. Yönlendirme: ${quizPath}`);
    
    try {
      // Backende log kaydetme - Production ortamında bu aktifleştirilecek
      fetch('/api/log/quiz-selected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizPath,
          timestamp: new Date().toISOString(),
          userId: localStorage.getItem('userId') || 'anonim',
        }),
      }).catch(err => console.warn('Log kaydı başarısız:', err));
      
      // Yönlendirme işlemi 
      navigate(quizPath);
    } catch (error) {
      console.error('Quiz yönlendirme hatası:', error);
      // Hata olsa bile kullanıcıyı yönlendir
      navigate(quizPath);
    }
  };

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

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container" style={{ marginTop: '-30px' }}>
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Auranızı Keşfedin</span>
            </h1>
            <p className="text-xl text-gray-100 max-w-2xl mx-auto opacity-90">
              Kendinizi daha iyi tanımak için aşağıdaki quiz türlerinden birini seçin. 
              Her biri farklı bir bakış açısı sunar.
            </p>
          </motion.div>

          <motion.div 
            className="quiz-options-grid"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {quizOptions.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                className={`quiz-option-card bg-gradient-to-br ${quiz.color}`}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                onClick={() => handleQuizSelect(quiz.path)}
              >
                <div className="quiz-option-emoji">{quiz.emoji}</div>
                <h3 className="quiz-option-title">{quiz.title}</h3>
                <p className="quiz-option-description">{quiz.description}</p>
                <button className="quiz-option-button">
                  Quiz'e Başla
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default QuizSelection; 