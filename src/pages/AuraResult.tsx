import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Gelişmiş aura tipleri
const auraTypes = {
  creative: {
    title: 'Yaratıcı Aura',
    description: 'Sizin auranız yaratıcılık ve ilham ile parlıyor. Yenilikçi fikirleriniz ve dünyayı benzersiz perspektifinizle görme yeteneğiniz sizi özel kılıyor.',
    color: 'creative-gradient',
    gradient: 'linear-gradient(135deg, #FF61D2, #FE9090)',
    darkGradient: 'linear-gradient(135deg, #A13E95, #D75A5A)',
    particleColor: '#FF61D2',
    image: '/creative-aura.jpg',
    icon: '✨'
  },
  analytical: {
    title: 'Analitik Aura',
    description: 'Sizin auranız mantık ve düzen ile parlıyor. Detaylara olan dikkatiniz ve karmaşık problemleri çözme yeteneğiniz sizi farklı kılıyor.',
    color: 'analytical-gradient',
    gradient: 'linear-gradient(135deg, #5B8CFF, #36C5F0)',
    darkGradient: 'linear-gradient(135deg, #345C99, #1F7799)',
    particleColor: '#5B8CFF',
    image: '/analytical-aura.jpg',
    icon: '🔍'
  },
  empathetic: {
    title: 'Empatik Aura',
    description: 'Sizin auranız merhamet ve anlayış ile parlıyor. Başkalarının duygularını algılama ve onlarla bağlantı kurma yeteneğiniz sizi özel kılıyor.',
    color: 'empathetic-gradient',
    gradient: 'linear-gradient(135deg, #41D5A8, #30BFDD)',
    darkGradient: 'linear-gradient(135deg, #228A6B, #1F7995)',
    particleColor: '#41D5A8',
    image: '/empathetic-aura.jpg',
    icon: '💗'
  },
  energetic: {
    title: 'Enerjik Aura',
    description: 'Sizin auranız dinamizm ve canlılık ile parlıyor. Hayata karşı tutkunuz ve sürekli hareket halinde olma isteğiniz sizi farklı kılıyor.',
    color: 'energetic-gradient',
    gradient: 'linear-gradient(135deg, #FFB046, #FF7070)',
    darkGradient: 'linear-gradient(135deg, #D7812F, #D75050)',
    particleColor: '#FFB046',
    image: '/energetic-aura.jpg',
    icon: '⚡'
  }
};

// Yardımcı fonksiyon: Cevaplara göre aura tipini belirler
const determineAuraType = (answers: {[key: number]: string}) => {
  // Yanıtlardaki seçenek sayısını sayalım
  const aCount = Object.values(answers).filter(val => val === 'a').length;
  const bCount = Object.values(answers).filter(val => val === 'b').length;
  const cCount = Object.values(answers).filter(val => val === 'c').length;
  const dCount = Object.values(answers).filter(val => val === 'd').length;
  
  // En yüksek sayıya göre aura tipini belirleyelim
  const maxCount = Math.max(aCount, bCount, cCount, dCount);
  
  if (maxCount === aCount) return 'analytical';
  if (maxCount === bCount) return 'creative';
  if (maxCount === cCount) return 'empathetic';
  return 'energetic';
};

// Hikaye oluşturan yardımcı fonksiyon
const generateStory = (auraType: string, username: string = 'Seyyah') => {
  const stories = {
    creative: `${username}, sanat dünyasına adım attığında, fırçası adeta bir sihir değneği gibiydi. Renkler onun ellerinde canlanıyor, tuval üzerinde dans ediyordu. İlham perisi her zaman onun yanındaydı, çünkü ${username}'ın yaratıcı aurası, evrene ilham verici fikirler saçıyordu.`,
    analytical: `${username} karmaşık bir problemi çözdüğünde, zihnindeki parçalar kusursuz bir puzzle gibi bir araya gelirdi. Etrafındakiler onun analitik aurasından etkilenir, en karmaşık durumları bile netleştirme yeteneğine hayran kalırlardı.`,
    empathetic: `${username}'ın empatik aurası, girdiği her odayı sıcaklıkla doldururdu. İnsanlar ona dertlerini anlatmak için çekilirdi, çünkü onun anlayışlı kalbi ve dinleyen kulakları, en derin yaraları bile sarabilirdi.`,
    energetic: `${username} sabahın ilk ışıklarıyla uyanır, gün doğmadan koşusuna başlardı. Onun enerjik aurası, çevresindekilere de hayat verirdi. Zorluklardan asla yılmaz, her engeli aşmak için yeni bir fırsat olarak görürdü.`
  };
  
  return stories[auraType as keyof typeof stories] || stories.creative;
};

// Aura parçacık efekti bileşeni
const AuraParticles = ({ color }: { color: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const particles: any[] = [];
    const particleCount = 50;
    
    // Parçacıkları oluştur
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        color: color,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
    
    // Animasyon fonksiyonu
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        // Parçacık hareketini güncelle
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Opacity dalgalanması
        particle.opacity += Math.random() * 0.01 - 0.005;
        if (particle.opacity < 0.1) particle.opacity = 0.1;
        if (particle.opacity > 0.7) particle.opacity = 0.7;
        
        // Ekran sınırlarına gelince yön değiştir
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [color]);
  
  return <canvas ref={canvasRef} className="aura-particles"></canvas>;
};

// Benzersiz kullanıcı ID'si oluşturmak için yardımcı fonksiyon
const generateUserId = () => {
  const storedUserId = localStorage.getItem('auralize_user_id');
  if (storedUserId) {
    return storedUserId;
  }
  
  const newUserId = 'user_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('auralize_user_id', newUserId);
  return newUserId;
};

// Kullanıcı adını kontrol eden veya oluşturan yardımcı fonksiyon
const getUserName = () => {
  const storedUserName = localStorage.getItem('auralize_username');
  if (storedUserName) {
    return storedUserName;
  }
  
  // Rastgele isimler
  const adjectives = ['Parlak', 'Gizemli', 'Huzurlu', 'Yaratıcı', 'Cesur', 'Enerjik', 'Neşeli', 'Tutkulu'];
  const nouns = ['Ruh', 'Yıldız', 'Işık', 'Okyanus', 'Dalga', 'Gökyüzü', 'Kaşif', 'Sanatçı'];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  
  const username = `${randomAdjective}${randomNoun}${randomNumber}`;
  return username;
};

const AuraResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [auraType, setAuraType] = useState<string>('');
  const [auraData, setAuraData] = useState<any>(null);
  const [auraStory, setAuraStory] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [userId, setUserId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false);
  const [showUsernameModal, setShowUsernameModal] = useState<boolean>(false);
  const [customUsername, setCustomUsername] = useState<string>('');
  
  // Quiz cevaplarını alıyoruz
  const answers = location.state?.answers || {};
  
  useEffect(() => {
    // Kullanıcı kimliği oluştur veya al
    const currentUserId = generateUserId();
    setUserId(currentUserId);
    
    // Kullanıcı adı al veya oluştur
    const currentUsername = getUserName();
    setUsername(currentUsername);
    setCustomUsername(currentUsername);
    
    // Paylaşım durumunu kontrol et
    const shareStatus = localStorage.getItem(`auralize_shared_${currentUserId}_${Date.now()}`);
    if (shareStatus) {
      setIsShared(true);
    }
    
    // Scroll olayını dinleyen etki
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Yükleme animasyonu
    const loadingInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(loadingInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    // Gerçek projede burası API çağrısı yapacak
    // Şimdilik simülasyon yapıyoruz
    setTimeout(() => {
      const determinedType = determineAuraType(answers);
      setAuraType(determinedType);
      setAuraData(auraTypes[determinedType as keyof typeof auraTypes]);
      setAuraStory(generateStory(determinedType));
      clearInterval(loadingInterval);
      setLoadingProgress(100);
      
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }, 2000); // API çağrısını simüle ediyoruz
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(loadingInterval);
    };
  }, [answers]);
  
  // Aura paylaşım işlevi
  const shareAura = () => {
    // Her zaman kullanıcı adı modalını göster
    setShowUsernameModal(true);
  };
  
  // Kullanıcı adı değiştirme işlevi
  const handleUsernameChange = () => {
    if (customUsername.trim() !== '') {
      setUsername(customUsername);
      localStorage.setItem('auralize_username', customUsername);
      setShowUsernameModal(false);
      
      // Paylaşım verilerini hazırla
      const shareData = {
        id: `aura_${Date.now()}`,
        userId: userId,
        username: customUsername,
        auraType: auraType,
        title: `${customUsername}'ın ${auraData.title}`,
        createdAt: new Date(),
        likes: 0,
        likedBy: []
      };
      
      // Mevcut paylaşımları al
      const existingShares = JSON.parse(localStorage.getItem('auralize_shared_auras') || '[]');
      
      // Yeni paylaşımı ekle
      existingShares.push(shareData);
      
      // Güncellenmiş paylaşımları kaydet
      localStorage.setItem('auralize_shared_auras', JSON.stringify(existingShares));
      
      // Paylaşım durumunu işaretle
      localStorage.setItem(`auralize_shared_${userId}_${Date.now()}`, 'true');
      setIsShared(true);
      
      // Galeri sayfasına yönlendir
      navigate('/gallery');
    }
  };
  
  if (loading) {
    return (
      <div className="loading-screen" style={{ background: '#fafafa' }}>
        <div className="loader">
          <div className="loader-circle"></div>
        </div>
        <div className="loading-progress">
          <div className="loading-bar">
            <div 
              className="loading-fill" 
              style={{ 
                width: `${loadingProgress}%`,
                background: 'linear-gradient(90deg, #FF61D2, #7000FF)'
              }}
            ></div>
          </div>
          <p className="loading-percentage">{loadingProgress}%</p>
        </div>
        <p className="loader-text">Auranız Oluşturuluyor...</p>
        <p className="loader-subtext">Yapay zeka kişiliğinizi analiz ediyor</p>
      </div>
    );
  }
  
  return (
    <div className="page-wrapper">
      <div className="aura-background" style={{ background: auraData?.darkGradient || 'linear-gradient(135deg, #333, #111)' }}></div>
      
      <header className={`header aura-header ${scrolled ? 'scrolled' : ''}`}>
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

      <main className="main-content aura-result-content">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="aura-result-intro text-center"
          >
            <h1 className="aura-main-title text-shadow">Auran Hazır!</h1>
            <p className="aura-subtitle text-shadow">İçindeki aurayı ortaya çıkardık. İşte senin benzersiz aura profili.</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`aura-result-card`}
            style={{ 
              background: '#ffffff', 
              boxShadow: `0 15px 35px ${auraData?.particleColor}33`,
              border: `1px solid ${auraData?.particleColor}22`
            }}
          >
            <div className="aura-particles-container">
              <AuraParticles color={auraData?.particleColor} />
            </div>
            
            <motion.div 
              className="aura-result-header"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="aura-badge" style={{ background: auraData?.gradient }}>
                <span className="aura-badge-icon">{auraData?.icon}</span>
                <span>{auraData?.title}</span>
              </div>
              <h2 className="aura-result-title" style={{ 
                background: auraData?.gradient,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent' 
              }}>
                {auraData?.title}
              </h2>
              <p className="aura-result-description">{auraData?.description}</p>
            </motion.div>
            
            <motion.div 
              className="aura-story-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="aura-section-header">
                <h2 className="aura-section-title">
                  <span className="aura-section-icon">📖</span>
                  Aura Hikayen
                </h2>
              </div>
              <div className="aura-story-box glass-card">
                <p className="aura-story-text">{auraStory}</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="aura-visual-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <div className="aura-section-header">
                <h2 className="aura-section-title">
                  <span className="aura-section-icon">🎨</span>
                  Aura Görselin
                </h2>
              </div>
              <div className="aura-visual-container">
                <div 
                  className="aura-visual-placeholder glass-card"
                  style={{ 
                    background: `${auraData?.gradient}22`, 
                    border: `1px solid ${auraData?.particleColor}33` 
                  }}
                >
                  <div className="aura-visual-inner">
                    <div 
                      className="aura-visual animate-pulse"
                      style={{ background: auraData?.gradient }}
                    ></div>
                    <div 
                      className="aura-visual-glow"
                      style={{ 
                        boxShadow: `0 0 80px 10px ${auraData?.particleColor}88` 
                      }}
                    ></div>
                  </div>
                  <div className="aura-visual-info">
                    <p className="aura-visual-text">Senin Aura Görselin</p>
                    <p className="aura-visual-caption">Stable Diffusion ile oluşturuldu</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="aura-insights-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <div className="aura-section-header">
                <h2 className="aura-section-title">
                  <span className="aura-section-icon">💡</span>
                  Aura İçgörülerin
                </h2>
              </div>
              <div className="aura-insights-container">
                <div className="aura-insights-grid">
                  <div className="aura-insight-card glass-card">
                    <div className="aura-insight-icon" style={{ background: auraData?.gradient }}>🌟</div>
                    <h3 className="aura-insight-title">Güçlü Yönlerin</h3>
                    <p className="aura-insight-text">
                      {auraType === 'creative' && 'Yenilikçi düşünme, bağlantılar kurma, sezgisel anlayış'}
                      {auraType === 'analytical' && 'Detaylara dikkat, mantıksal düşünme, problem çözme'}
                      {auraType === 'empathetic' && 'Duygusal zeka, dinleme, insanları anlama'}
                      {auraType === 'energetic' && 'İnitiasif alma, tutkulu çalışma, enerji yayma'}
                    </p>
                  </div>
                  
                  <div className="aura-insight-card glass-card">
                    <div className="aura-insight-icon" style={{ background: auraData?.gradient }}>🚀</div>
                    <h3 className="aura-insight-title">Potansiyelin</h3>
                    <p className="aura-insight-text">
                      {auraType === 'creative' && 'Benzersiz sanat eserleri, orijinal fikirler, yenilikçi çözümler üretme'}
                      {auraType === 'analytical' && 'Karmaşık sistemleri anlama, etkili stratejiler geliştirme, verimli çözümler bulma'}
                      {auraType === 'empathetic' && 'Güçlü ilişkiler kurma, insanları motive etme, duygusal destek sağlama'}
                      {auraType === 'energetic' && 'Zorlu projeleri tamamlama, ekipleri harekete geçirme, hızlı sonuçlar elde etme'}
                    </p>
                  </div>
                  
                  <div className="aura-insight-card glass-card">
                    <div className="aura-insight-icon" style={{ background: auraData?.gradient }}>🧠</div>
                    <h3 className="aura-insight-title">Düşünme Tarzın</h3>
                    <p className="aura-insight-text">
                      {auraType === 'creative' && 'Yanal düşünme, bağlantılar kurma, sınırların dışına çıkma'}
                      {auraType === 'analytical' && 'Sistematik, yapısal, mantıksal ve detaylı düşünme'}
                      {auraType === 'empathetic' && 'Duygusal, sezgisel, ilişkisel ve anlamsal düşünme'}
                      {auraType === 'energetic' && 'Pratik, sonuç odaklı, hızlı ve aksiyon bazlı düşünme'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="aura-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              <Link to="/" className="btn btn-primary">
                Ana Sayfaya Dön
              </Link>
              <Link to="/gallery" className="btn btn-glass">
                <span className="btn-icon">🖼️</span>
                Galeriyi Keşfet
              </Link>
              <Link to="/quiz" className="btn btn-glass">
                <span className="btn-icon">🔄</span>
                Testi Tekrarla
              </Link>
              <button 
                className={`btn ${isShared ? 'btn-success' : 'btn-share'}`}
                onClick={shareAura}
                disabled={isShared}
              >
                <span className="btn-icon">
                  {isShared ? '✓' : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                  )}
                </span>
                {isShared ? 'Paylaşıldı' : 'Galeriye Paylaş'}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </main>
      
      {/* Kullanıcı adı değiştirme modalı */}
      {showUsernameModal && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.6)', 
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowUsernameModal(false)}
        >
          <motion.div 
            className="share-modal"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: 'white', 
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              width: '90%',
              maxWidth: '450px',
              overflow: 'hidden',
              border: `1px solid ${auraData?.particleColor}44`
            }}
          >
            <div className="share-modal-header" style={{ 
              background: auraData?.gradient,
              padding: '20px 24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0,
                borderRadius: '50%',
                filter: 'blur(30px)',
                transform: 'translate(-30%, -30%)',
                background: auraData?.gradient,
                opacity: 0.8
              }}></div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ 
                  margin: 0, 
                  color: 'white', 
                  fontSize: '24px',
                  fontWeight: 600
                }}>Auranı Paylaş</h3>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  margin: '8px 0 0 0',
                  fontSize: '14px' 
                }}>
                  Auranı galeriye ekle ve toplulukla paylaş
                </p>
              </div>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="username" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#555'
                  }}
                >
                  Kullanıcı Adı
                </label>
                <input
                  id="username"
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = auraData?.particleColor || '#5B8CFF'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="description" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#555'
                  }}
                >
                  Aura Açıklaması (İsteğe Bağlı)
                </label>
                <textarea
                  id="description"
                  placeholder="Auranız hakkında kısa bir açıklama ekleyin"
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    minHeight: '80px',
                    resize: 'vertical',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#555'
                  }}
                >
                  Etiketler
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '100px',
                    fontSize: '13px',
                    background: `${auraData?.particleColor}22`,
                    color: auraData?.particleColor,
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}>
                    #{auraType}
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '100px',
                    fontSize: '13px',
                    background: '#f0f0f0',
                    color: '#666',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}>
                    #auralize
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ 
              padding: '16px 24px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowUsernameModal(false)}
                style={{ 
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                İptal
              </button>
              <button
                onClick={handleUsernameChange}
                style={{ 
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: auraData?.gradient,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                Paylaş
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      <motion.footer 
        className="py-6 px-4 gradient-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.6 }}
        style={{ background: auraData?.darkGradient || 'linear-gradient(135deg, #333, #111)' }}
      >
        <div className="container">
          <div className="text-center text-white">
            <p>
              &copy; {new Date().getFullYear()} Auralize - Yaratıcı Auranızı Keşfedin
              <span className="ml-2">✨</span>
            </p>
            <div className="footer-links">
              <a href="#" className="footer-link">Hakkımızda</a>
              <a href="#" className="footer-link">Gizlilik</a>
              <a href="#" className="footer-link">İletişim</a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default AuraResult; 