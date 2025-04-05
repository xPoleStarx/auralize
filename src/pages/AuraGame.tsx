import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Aura tipleri ve renkleri
const auraTypes = {
  creative: {
    title: 'Yaratıcı Aura',
    description: 'Hızlı ve renkli kristalleri yakalayın!',
    color: 'creative-gradient',
    gradient: 'linear-gradient(135deg, #FF61D2, #FE9090)',
    darkGradient: 'linear-gradient(135deg, #A13E95, #D75A5A)',
    particleColor: '#FF61D2',
    crystalColors: ['#FF61D2', '#FE9090', '#FFB2D3'],
    icon: '✨',
    gameGoal: 'İlham kristallerini yakalayarak yaratıcı auranızı güçlendirin.'
  },
  analytical: {
    title: 'Analitik Aura',
    description: 'Düzenli hareket eden kristalleri yakalayın!',
    color: 'analytical-gradient',
    gradient: 'linear-gradient(135deg, #5B8CFF, #36C5F0)',
    darkGradient: 'linear-gradient(135deg, #345C99, #1F7799)',
    particleColor: '#5B8CFF',
    crystalColors: ['#5B8CFF', '#36C5F0', '#A0C4FF'],
    icon: '🔍',
    gameGoal: 'Mantık kristallerini toplayarak analitik auranızı güçlendirin.'
  },
  empathetic: {
    title: 'Empatik Aura',
    description: 'Yavaşça süzülen kristalleri hissedin!',
    color: 'empathetic-gradient',
    gradient: 'linear-gradient(135deg, #41D5A8, #30BFDD)',
    darkGradient: 'linear-gradient(135deg, #228A6B, #1F7995)',
    particleColor: '#41D5A8',
    crystalColors: ['#41D5A8', '#30BFDD', '#8CEFCD'],
    icon: '💗',
    gameGoal: 'Kalp kristallerini toplayarak empatik auranızı güçlendirin.'
  },
  energetic: {
    title: 'Enerjik Aura',
    description: 'Hızlı hareket eden parlak kristalleri yakalayın!',
    color: 'energetic-gradient',
    gradient: 'linear-gradient(135deg, #FFB046, #FF7070)',
    darkGradient: 'linear-gradient(135deg, #D7812F, #D75050)',
    particleColor: '#FFB046',
    crystalColors: ['#FFB046', '#FF7070', '#FFD08A'],
    icon: '⚡',
    gameGoal: 'Enerji kristallerini toplayarak dinamik auranızı güçlendirin.'
  }
};

// Kristal bileşeni
interface CrystalProps {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  id: number;
  onClick: (id: number) => void;
  collected: boolean;
}

const Crystal: React.FC<CrystalProps> = ({ x, y, size, color, id, onClick, collected }) => {
  return (
    <motion.div
      className={`crystal ${collected ? 'collected' : ''}`}
      initial={{ x, y, opacity: 1, scale: 0 }}
      animate={{ 
        x, 
        y, 
        opacity: collected ? 0 : 1, 
        scale: collected ? 1.5 : 1,
        rotate: collected ? 180 : 0 
      }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 10,
        opacity: { duration: 0.3 } 
      }}
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        borderRadius: '20%',
        filter: `brightness(1.2) drop-shadow(0 0 8px ${color}80)`,
        cursor: 'pointer',
        pointerEvents: collected ? 'none' : 'auto',
        zIndex: 10
      }}
      onClick={() => onClick(id)}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
    >
      <div 
        className="crystal-inner" 
        style={{
          position: 'absolute',
          top: '15%',
          left: '15%',
          width: '30%',
          height: '30%',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '50%'
        }}
      />
    </motion.div>
  );
};

// Parçacık arka plan efekti
const ParticleBackground = ({ color }: { color: string }) => {
  return (
    <div className="game-particle-container">
      {[...Array(15)].map((_, index) => (
        <div 
          key={index}
          className="game-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 15 + 3}px`,
            height: `${Math.random() * 15 + 3}px`,
            background: color,
            opacity: Math.random() * 0.5 + 0.1,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 10 + 10}s`
          }}
        />
      ))}
    </div>
  );
};

// Ana oyun bileşeni
const AuraGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userAuraType, setUserAuraType] = useState<string>('creative');
  const [auraData, setAuraData] = useState<any>(auraTypes.creative);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [crystals, setCrystals] = useState<any[]>([]);
  const [collectedCrystals, setCollectedCrystals] = useState<number[]>([]);
  const [highScore, setHighScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string>('normal');
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showReward, setShowReward] = useState<boolean>(false);
  const [earnedBadge, setEarnedBadge] = useState<string>('');
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Kullanıcının aura tipini local storage'dan veya state'den al
  useEffect(() => {
    const storedAuraType = localStorage.getItem('auralize_aura_type');
    if (storedAuraType && Object.keys(auraTypes).includes(storedAuraType)) {
      setUserAuraType(storedAuraType);
      setAuraData(auraTypes[storedAuraType as keyof typeof auraTypes]);
    } else if (location.state?.auraType && Object.keys(auraTypes).includes(location.state.auraType)) {
      setUserAuraType(location.state.auraType);
      setAuraData(auraTypes[location.state.auraType as keyof typeof auraTypes]);
    }

    // Yüksek skoru kontrol et
    const storedHighScore = localStorage.getItem(`auralize_game_highscore_${userAuraType}`);
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore));
    }

    // Scroll olayını dinle
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.state, userAuraType]);

  // Zorluğa göre oyun parametreleri
  const getDifficultyParams = () => {
    switch (difficulty) {
      case 'easy':
        return { crystalCount: 5, speed: 1, timeLimit: 90 };
      case 'hard':
        return { crystalCount: 15, speed: 2, timeLimit: 45 };
      default: // normal
        return { crystalCount: 10, speed: 1.5, timeLimit: 20 };
    }
  };

  // Oyunu başlat
  const startGame = () => {
    const { timeLimit } = getDifficultyParams();
    
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(timeLimit);
    setCollectedCrystals([]);
    setStreak(0);
    setMaxStreak(0);
    setShowTutorial(false);
    generateCrystals();
  };

  // Kristalleri oluştur
  const generateCrystals = () => {
    if (!gameAreaRef.current) return;
    
    const { crystalCount, speed } = getDifficultyParams();
    const { width, height } = gameAreaRef.current.getBoundingClientRect();
    
    const newCrystals = [];
    for (let i = 0; i < crystalCount; i++) {
      const size = Math.floor(Math.random() * 30) + 30; // 30-60px
      const x = Math.random() * (width - size);
      const y = Math.random() * (height - size);
      const colorIndex = Math.floor(Math.random() * auraData.crystalColors.length);
      const angle = Math.random() * 360;
      const crystalSpeed = (Math.random() * 1 + 0.5) * speed;
      
      newCrystals.push({
        id: i,
        x,
        y,
        size,
        color: auraData.crystalColors[colorIndex],
        speed: crystalSpeed,
        angle,
        lastUpdate: Date.now()
      });
    }
    
    setCrystals(newCrystals);
  };

  // Kristallerin hareketini güncelle
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused || !gameAreaRef.current) return;
    
    const { width, height } = gameAreaRef.current.getBoundingClientRect();
    
    const updateInterval = setInterval(() => {
      setCrystals(prevCrystals => {
        return prevCrystals.map(crystal => {
          if (collectedCrystals.includes(crystal.id)) return crystal;
          
          const now = Date.now();
          const delta = (now - crystal.lastUpdate) / 1000; // saniye cinsinden
          
          const radians = crystal.angle * Math.PI / 180;
          let newX = crystal.x + Math.cos(radians) * crystal.speed * 50 * delta;
          let newY = crystal.y + Math.sin(radians) * crystal.speed * 50 * delta;
          let newAngle = crystal.angle;
          
          // Sınırlara çarpma kontrolü
          if (newX <= 0 || newX >= width - crystal.size) {
            newAngle = 180 - newAngle;
            newX = newX <= 0 ? 0 : width - crystal.size;
          }
          
          if (newY <= 0 || newY >= height - crystal.size) {
            newAngle = 360 - newAngle;
            newY = newY <= 0 ? 0 : height - crystal.size;
          }
          
          return {
            ...crystal,
            x: newX,
            y: newY,
            angle: newAngle,
            lastUpdate: now
          };
        });
      });
    }, 1000 / 60); // 60fps
    
    return () => clearInterval(updateInterval);
  }, [gameStarted, gameOver, isPaused, collectedCrystals]);

  // Geri sayım
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, isPaused]);

  // Kristal toplandığında
  const collectCrystal = (id: number) => {
    if (collectedCrystals.includes(id)) return;
    
    setCollectedCrystals(prev => [...prev, id]);
    setScore(prev => prev + 10);
    setStreak(prev => prev + 1);
    setMaxStreak(prev => Math.max(prev, streak + 1));
    
    // Yeni kristal üret
    setTimeout(() => {
      replaceCrystal(id);
    }, 1000);
  };

  // Toplanan kristalin yerine yenisini üret
  const replaceCrystal = (id: number) => {
    if (!gameAreaRef.current || gameOver) return;
    
    const { width, height } = gameAreaRef.current.getBoundingClientRect();
    const { speed } = getDifficultyParams();
    
    setCrystals(prevCrystals => {
      return prevCrystals.map(crystal => {
        if (crystal.id !== id) return crystal;
        
        const size = Math.floor(Math.random() * 30) + 30;
        const x = Math.random() * (width - size);
        const y = Math.random() * (height - size);
        const colorIndex = Math.floor(Math.random() * auraData.crystalColors.length);
        const angle = Math.random() * 360;
        const crystalSpeed = (Math.random() * 1 + 0.5) * speed;
        
        return {
          ...crystal,
          x,
          y,
          size,
          color: auraData.crystalColors[colorIndex],
          speed: crystalSpeed,
          angle,
          lastUpdate: Date.now()
        };
      });
    });
    
    setCollectedCrystals(prev => prev.filter(crystalId => crystalId !== id));
  };

  // Oyun sonu
  const endGame = () => {
    setGameOver(true);
    
    // Yüksek skoru güncelle
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(`auralize_game_highscore_${userAuraType}`, score.toString());
    }
    
    // Ödülleri kontrol et
    checkRewards();
  };

  // Ödülleri kontrol et
  const checkRewards = () => {
    const existingBadges = JSON.parse(localStorage.getItem('auralize_badges') || '[]');
    let newBadge = '';
    
    // Rozet kriterleri
    if (score >= 300 && !existingBadges.includes(`${userAuraType}_master`)) {
      newBadge = `${userAuraType}_master`;
    } else if (score >= 200 && !existingBadges.includes(`${userAuraType}_expert`)) {
      newBadge = `${userAuraType}_expert`;
    } else if (score >= 100 && !existingBadges.includes(`${userAuraType}_adept`)) {
      newBadge = `${userAuraType}_adept`;
    } else if (!existingBadges.includes(`${userAuraType}_novice`)) {
      newBadge = `${userAuraType}_novice`;
    }
    
    if (newBadge) {
      existingBadges.push(newBadge);
      localStorage.setItem('auralize_badges', JSON.stringify(existingBadges));
      setEarnedBadge(newBadge);
      setShowReward(true);
    }
  };

  // Rozet ismini formatla
  const formatBadgeName = (badgeId: string) => {
    const [type, level] = badgeId.split('_');
    const typeTitle = auraTypes[type as keyof typeof auraTypes]?.title || type;
    
    const levels: { [key: string]: string } = {
      novice: 'Başlangıç',
      adept: 'İleri',
      expert: 'Uzman',
      master: 'Usta'
    };
    
    return `${typeTitle} ${levels[level] || level}`;
  };

  // Oyun durumu
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  return (
    <div className="page-wrapper">
      <div 
        className="game-background"
        style={{ 
          background: auraData?.darkGradient || 'linear-gradient(135deg, #333, #111)'
        }}
      >
        <ParticleBackground color={auraData?.particleColor} />
      </div>

      <header className={`header game-header ${scrolled ? 'scrolled' : ''}`}>
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

      <main className="game-main">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="game-title-section"
          >
            <h1 className="game-title">
              <span className="game-title-icon">{auraData?.icon}</span>
              Aura Kristalleri
            </h1>
            <p className="game-subtitle">
              {auraData?.gameGoal}
            </p>
          </motion.div>

          <div className="game-content">
            <div className="game-sidebar">
              <div className="game-info-card">
                <div className="game-info-header" style={{ background: auraData?.gradient }}>
                  <h3>Oyun Bilgileri</h3>
                </div>
                <div className="game-info-content">
                  <div className="game-stat">
                    <span className="game-stat-label">Puan</span>
                    <span className="game-stat-value">{score}</span>
                  </div>
                  
                  <div className="game-stat">
                    <span className="game-stat-label">Süre</span>
                    <span className="game-stat-value">{timeLeft}s</span>
                  </div>
                  
                  <div className="game-stat">
                    <span className="game-stat-label">Seri</span>
                    <span className="game-stat-value">{streak}</span>
                  </div>
                  
                  <div className="game-stat">
                    <span className="game-stat-label">En Yüksek Skor</span>
                    <span className="game-stat-value">{highScore}</span>
                  </div>
                </div>
              </div>

              <div className="game-controls">
                <div className="difficulty-selector">
                  <label htmlFor="difficulty">Zorluk:</label>
                  <select 
                    id="difficulty" 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    disabled={gameStarted && !gameOver}
                  >
                    <option value="easy">Kolay</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Zor</option>
                  </select>
                </div>
                
                {!gameStarted && !gameOver && (
                  <button 
                    className="btn btn-primary game-btn"
                    onClick={startGame}
                    style={{ background: auraData?.gradient }}
                  >
                    Oyunu Başlat
                  </button>
                )}
                
                {gameStarted && !gameOver && (
                  <button 
                    className="btn btn-secondary game-btn"
                    onClick={togglePause}
                    style={{ borderColor: auraData?.particleColor }}
                  >
                    {isPaused ? 'Devam Et' : 'Duraklat'}
                  </button>
                )}
                
                {gameOver && (
                  <button 
                    className="btn btn-primary game-btn"
                    onClick={startGame}
                    style={{ background: auraData?.gradient }}
                  >
                    Tekrar Oyna
                  </button>
                )}
                
                <Link to="/profile" className="btn btn-outline game-btn">
                  Profilim
                </Link>
              </div>
            </div>

            <div 
              className="game-area"
              ref={gameAreaRef}
              style={{ 
                cursor: gameStarted && !gameOver && !isPaused ? 'pointer' : 'default' 
              }}
            >
              {showTutorial && !gameStarted && (
                <div className="game-tutorial">
                  <div className="tutorial-content">
                    <h3 className="tutorial-title">Nasıl Oynanır?</h3>
                    <p className="tutorial-text">
                      Farklı renklerdeki aura kristallerini toplayarak puanınızı artırın. Her kristal 10 puan değerinde.
                    </p>
                    <div className="tutorial-steps">
                      <div className="tutorial-step">
                        <div className="tutorial-step-number">1</div>
                        <div className="tutorial-step-text">Kristalin üzerine tıklayın</div>
                      </div>
                      <div className="tutorial-step">
                        <div className="tutorial-step-number">2</div>
                        <div className="tutorial-step-text">Seri halinde kristaller toplamaya çalışın</div>
                      </div>
                      <div className="tutorial-step">
                        <div className="tutorial-step-number">3</div>
                        <div className="tutorial-step-text">Süre bitmeden önce mümkün olduğunca çok puan kazanın</div>
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary tutorial-btn"
                      onClick={startGame}
                      style={{ background: auraData?.gradient }}
                    >
                      Anladım, Başla!
                    </button>
                  </div>
                </div>
              )}
              
              {isPaused && (
                <div className="game-paused">
                  <div className="paused-content">
                    <h3 className="paused-title">Oyun Duraklatıldı</h3>
                    <button 
                      className="btn btn-primary tutorial-btn"
                      onClick={togglePause}
                      style={{ background: auraData?.gradient }}
                    >
                      Devam Et
                    </button>
                  </div>
                </div>
              )}
              
              {gameOver && (
                <div className="game-over">
                  <div className="game-over-content">
                    <h3 className="game-over-title">Oyun Bitti!</h3>
                    <p className="game-over-score">Toplam Puan: {score}</p>
                    <p className="game-over-text">
                      {score > highScore 
                        ? 'Tebrikler! Yeni bir rekor kırdınız!'
                        : `Yüksek Skorunuz: ${highScore}`
                      }
                    </p>
                    <p className="game-over-text">
                      En Uzun Seri: {maxStreak}
                    </p>
                    <button 
                      className="btn btn-primary game-over-btn"
                      onClick={startGame}
                      style={{ background: auraData?.gradient }}
                    >
                      Tekrar Oyna
                    </button>
                    <Link 
                      to="/profile" 
                      className="btn btn-outline game-over-btn"
                      style={{ borderColor: auraData?.particleColor, color: auraData?.particleColor }}
                    >
                      Profilimi Görüntüle
                    </Link>
                  </div>
                </div>
              )}
              
              {gameStarted && !isPaused && (
                <>
                  {crystals.map(crystal => (
                    <Crystal
                      key={crystal.id}
                      id={crystal.id}
                      x={crystal.x}
                      y={crystal.y}
                      size={crystal.size}
                      color={crystal.color}
                      speed={crystal.speed}
                      angle={crystal.angle}
                      onClick={collectCrystal}
                      collected={collectedCrystals.includes(crystal.id)}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Ödül modalı */}
      <AnimatePresence>
        {showReward && (
          <motion.div 
            className="reward-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReward(false)}
          >
            <motion.div 
              className="reward-modal"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="reward-header"
                style={{ background: auraData?.gradient }}
              >
                <h3>Yeni Rozet Kazandınız!</h3>
              </div>
              
              <div className="reward-content">
                <div 
                  className="reward-badge"
                  style={{ 
                    background: auraData?.gradient,
                    boxShadow: `0 0 30px ${auraData?.particleColor}80` 
                  }}
                >
                  <span className="reward-badge-icon">{auraData?.icon}</span>
                </div>
                
                <h4 className="reward-title">
                  {formatBadgeName(earnedBadge)}
                </h4>
                
                <p className="reward-description">
                  Aura Kristalleri oyununda gösterdiğiniz başarıdan dolayı bu rozeti kazandınız!
                </p>
                
                <button 
                  className="btn btn-primary reward-btn"
                  onClick={() => setShowReward(false)}
                  style={{ background: auraData?.gradient }}
                >
                  Harika!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="gradient-footer game-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <h3 className="text-white text-xl font-bold">Auralize<span className="text-yellow-300">✨</span></h3>
              <p className="footer-slogan">Yaratıcı Auranızı Keşfedin</p>
            </div>
            
            <div className="footer-links">
              <a href="#" className="footer-link">Hakkımızda</a>
              <a href="#" className="footer-link">Blog</a>
              <a href="#" className="footer-link">Gizlilik</a>
              <a href="#" className="footer-link">İletişim</a>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="copyright">&copy; {new Date().getFullYear()} Auralize - Tüm Hakları Saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuraGame; 