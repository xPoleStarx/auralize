import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// DeepSeek servisini import ediyorum
import { getAuraStoryFromDeepSeek, getAuraInsightsFromLlama, determineDynamicAuraType, auraTypes } from '../services/deepseekService';

// Debug modu
const DEBUG_MODE = true;

// Yardımcı fonksiyon: Cevaplara göre aura tipini belirler
const determineAuraType = (answers: {[key: number]: string}) => {
  // Yeni dinamik aura tipi belirleme fonksiyonunu kullan
  return determineDynamicAuraType(answers);
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

// Hızlı özet fonksiyonu - servisten erişim olmadığı için local tanımlama
const getQuickAuraSummary = async (auraType: string, username: string): Promise<string> => {
  // Basit bir özet döndür
  return `${username}'ın ${auraType} aurası analiz ediliyor...`;
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
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [gameStats, setGameStats] = useState<{highScore: number, badges: string[]}>({ highScore: 0, badges: [] });
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [isFullStoryLoading, setIsFullStoryLoading] = useState(false);
  const [hasQuickSummary, setHasQuickSummary] = useState(false);
  const [apiCacheStat, setApiCacheStat] = useState<'cache' | 'api' | 'llama' | 'default' | null>(null);
  // İçgörüler için yeni state değişkenleri
  const [insights, setInsights] = useState<{
    strengths: string;
    potential: string;
    thinkingStyle: string;
    auraTitle: string;
    source: 'llama' | 'default' | null;
  }>({
    strengths: '',
    potential: '',
    thinkingStyle: '',
    auraTitle: '',
    source: null
  });
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [auraTitle, setAuraTitle] = useState<string>('');
  
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
    
    // Aura tipini belirle
    const determinedType = determineAuraType(answers);
    setAuraType(determinedType);
    
    // Dinamik aura başlığı için varsayılan değer
    const defaultTitle = `${determinedType.charAt(0).toUpperCase() + determinedType.slice(1)} Aurası`;
    setAuraTitle(defaultTitle);
    
    // Mevcut aura tiplerinden uygun veriyi seç veya varsayılan değerleri kullan
    const auraTypeData = auraTypes[determinedType as keyof typeof auraTypes];
    if (auraTypeData) {
      setAuraData({
        title: auraTypeData.name || defaultTitle,
        description: auraTypeData.description,
        // Varsayılan bir gradient renkler seti
        gradient: 'linear-gradient(135deg, #FF61D2, #FE9090)',
        darkGradient: 'linear-gradient(135deg, #A13E95, #D75A5A)',
        particleColor: '#FF61D2',
        icon: '✨'
      });
    } else {
      // Varsayılan değerler
      setAuraData({
        title: defaultTitle,
        description: 'Senin auran özel ve benzersiz bir enerji taşıyor.',
        gradient: 'linear-gradient(135deg, #FF61D2, #FE9090)',
        darkGradient: 'linear-gradient(135deg, #A13E95, #D75A5A)',
        particleColor: '#FF61D2',
        icon: '✨'
      });
    }
    
    // Aşamalı hikaye yükleme stratejisi
    const loadStoryInStages = async () => {
      setIsStoryLoading(true);
      
      if (DEBUG_MODE) console.log("[DEBUG] Hikaye yükleme başladı");
      if (DEBUG_MODE) console.log("[DEBUG] Quiz cevapları:", JSON.stringify(answers));
      
      // Quiz cevapları geçerli mi kontrol et
      if (!answers || Object.keys(answers).length === 0) {
        console.error("[DEBUG] Quiz cevapları boş veya geçersiz!");
        setAuraStory("Quiz cevaplarınız alınamadı. Lütfen tekrar deneyin.");
        setApiCacheStat('default');
        setIsStoryLoading(false);
        return;
      }
      
      try {
        // 1. Aşama: Hızlı bir özet yükle
        if (DEBUG_MODE) console.log("[DEBUG] Hızlı özet isteniyor");
        const quickSummary = await getQuickAuraSummary(determinedType, currentUsername);
        if (quickSummary) {
          setAuraStory(quickSummary);
          setHasQuickSummary(true);
          if (DEBUG_MODE) console.log("[DEBUG] Hızlı özet alındı:", quickSummary);
        }
        
        // 2. Aşama: İçgörüleri yükle
        setIsInsightsLoading(true);
        try {
          if (DEBUG_MODE) console.log("[DEBUG] İçgörüler isteniyor");
          const insightsData = await getAuraInsightsFromLlama(determinedType, currentUsername, answers);
          if (DEBUG_MODE) console.log("[DEBUG] İçgörüler alındı:", insightsData);
          setInsights(insightsData);
          
          // Dinamik aura başlığını güncelle
          if (insightsData.auraTitle) {
            setAuraTitle(insightsData.auraTitle);
          }
        } catch (insightsError) {
          console.error("İçgörüler alınırken hata oluştu:", insightsError);
          if (DEBUG_MODE) console.log("[DEBUG] İçgörüler yüklenirken hata:", insightsError);
          // Varsayılan içgörüleri kullan
          setInsights({
            strengths: '',
            potential: '',
            thinkingStyle: '',
            auraTitle: `${determinedType.charAt(0).toUpperCase() + determinedType.slice(1)} Aurası`,
            source: 'default'
          });
        } finally {
          // İçgörüler yükleme durumunu kapat (animasyonlu görünmesi için kısa gecikme)
          setTimeout(() => {
            setIsInsightsLoading(false);
          }, 1000);
        }
        
        // 3. Aşama: Tam hikaye yükle
        setIsFullStoryLoading(true);
        
        // DeepSeek API'dan tam hikaye alma işlemine başlamadan önce küçük bir bekleme
        // Bu, kullanıcının en azından hızlı özeti görmesini sağlar
        setTimeout(async () => {
          try {
            if (DEBUG_MODE) console.log("[DEBUG] Tam hikaye isteniyor, cevaplar:", JSON.stringify(answers));
            const fullStory = await getAuraStoryFromDeepSeek(determinedType, currentUsername, answers);
            if (DEBUG_MODE) console.log("[DEBUG] Tam hikaye alındı:", fullStory);
            
            // Hikaye kaynağını belirleyelim: API, Önbellek, Llama veya Varsayılan
            let cacheIndicator: 'cache' | 'api' | 'llama' | 'default' = 'api';
            let cleanStory = fullStory;
            
            if (fullStory.includes('__cached__')) {
              cacheIndicator = 'cache';
              cleanStory = fullStory.replace('__cached__', '').trim();
              if (DEBUG_MODE) console.log("[DEBUG] Hikaye önbellekten alındı");
            } else if (fullStory.includes('__llama__')) {
              cacheIndicator = 'llama';
              cleanStory = fullStory.replace('__llama__', '').trim();
              if (DEBUG_MODE) console.log("[DEBUG] Hikaye Auralize tarafından oluşturuldu");
            } else if (fullStory.includes('__default__')) {
              cacheIndicator = 'default';
              cleanStory = fullStory.replace('__default__', '').trim();
              if (DEBUG_MODE) console.log("[DEBUG] Hikaye varsayılan olarak oluşturuldu");
            } else {
              if (DEBUG_MODE) console.log("[DEBUG] Hikaye DeepSeek AI tarafından oluşturuldu");
            }
            
            setApiCacheStat(cacheIndicator);
            setAuraStory(cleanStory);
            
          } catch (err) {
            console.error("Tam aura hikayesi alınırken hata oluştu:", err);
            if (DEBUG_MODE) console.log("[DEBUG] Tam hikaye yüklenirken hata:", err);
            // Hata durumunda hızlı özet zaten gösteriliyor, kullanıcı deneyimini bozmamak için sessizce devam et
            setApiCacheStat('default');
          } finally {
            setIsFullStoryLoading(false);
            setIsStoryLoading(false);
          }
        }, 1000);
        
      } catch (error) {
        console.error("Hızlı özet alınırken hata oluştu:", error);
        if (DEBUG_MODE) console.log("[DEBUG] Hızlı özet alınırken hata:", error);
        
        // Hızlı özet alınamazsa doğrudan tam hikayeyi yükleme dene
        try {
          if (DEBUG_MODE) console.log("[DEBUG] Direkt tam hikaye yükleniyor");
          const story = await getAuraStoryFromDeepSeek(determinedType, currentUsername, answers);
          
          if (story.includes('__llama__')) {
            setApiCacheStat('llama');
            setAuraStory(story.replace('__llama__', '').trim());
            if (DEBUG_MODE) console.log("[DEBUG] Direkt yüklenen hikaye Llama'dan geldi");
          } else if (story.includes('__cached__')) {
            setApiCacheStat('cache');
            setAuraStory(story.replace('__cached__', '').trim());
            if (DEBUG_MODE) console.log("[DEBUG] Direkt yüklenen hikaye önbellekten geldi");
          } else if (story.includes('__default__')) {
            setApiCacheStat('default');
            setAuraStory(story.replace('__default__', '').trim());
            if (DEBUG_MODE) console.log("[DEBUG] Direkt yüklenen hikaye varsayılan olarak oluşturuldu");
          } else {
            setApiCacheStat('api');
            setAuraStory(story);
            if (DEBUG_MODE) console.log("[DEBUG] Direkt yüklenen hikaye API'den geldi");
          }
          
        } catch (err) {
          console.error("Aura hikayesi alınırken hata oluştu:", err);
          if (DEBUG_MODE) console.log("[DEBUG] Hikaye yüklemede tüm yöntemler başarısız:", err);
          // Hata durumunda varsayılan hikaye göster
          setAuraStory(auraTypes[determinedType as keyof typeof auraTypes].description);
          setApiCacheStat('default');
        }
        
        setIsFullStoryLoading(false);
        setIsStoryLoading(false);
      }
    };
    
    // Hikaye yükleme işlemini başlat
    loadStoryInStages();
    
    // Oyun istatistiklerini al (varsayılan değerler)
    setGameStats({
      highScore: Number(localStorage.getItem(`auralize_game_score_${currentUserId}`) || '0'),
      badges: JSON.parse(localStorage.getItem(`auralize_badges_${currentUserId}`) || '[]')
    });
    
    // 2.5 saniye sonra yükleme ekranını kaldır
    setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => {
      clearInterval(loadingInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [answers]);
  
  // Hashtag işleme 
  const handleHashtagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setHashtagInput(inputValue);
    
    // Eğer son karakter boşluksa ve giriş boş değilse
    if (inputValue.endsWith(' ') && inputValue.trim() !== '') {
      // Son boşluğu kaldır ve hashtag olarak ekle
      const newTag = inputValue.trim();
      
      // Hashtag zaten ekli değilse ve 5'ten az hashtag varsa ekle
      if (!hashtags.includes(newTag) && hashtags.length < 5) {
        setHashtags([...hashtags, newTag]);
      } else if (hashtags.length >= 5) {
        // Maksimum sınıra ulaşıldığında en eski hashtag'i kaldır
        const updatedTags = [...hashtags.slice(1), newTag];
        setHashtags(updatedTags);
      }
      
      // Input alanını temizle
      setHashtagInput('');
    }
  };
  
  // Hashtag kaldırma
  const removeHashtag = (tagToRemove: string) => {
    const updatedTags = hashtags.filter(tag => tag !== tagToRemove);
    setHashtags(updatedTags);
  };
  
  // Kullanıcı adı değiştirme işlevi
  const handleUsernameChange = (username: string) => {
    if (!username || username.trim() === '') {
      alert('Lütfen geçerli bir kullanıcı adı girin.');
      return;
    }
    
    // Kullanıcı adını kaydet
    setUsername(username);
    localStorage.setItem('auralize_username', username);
    setShowUsernameModal(false);
    
    // Paylaşım için veri hazırla
    const shareData = {
      id: crypto.randomUUID(),
      title: auraTitle, 
      userId: userId,
      username: username,
      auraType: auraType || 'creative',
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
      hashtags: [auraType || 'creative', "auralize", "enerji"],
      description: auraData?.description || ""
    };
    
    // Mevcut paylaşımları al
    const existingShares = JSON.parse(localStorage.getItem('auralize_shared_auras') || '[]');
    
    // Yeni paylaşımı ekle
    const updatedShares = [...existingShares, shareData];
    
    // LocalStorage'a kaydet
    localStorage.setItem('auralize_shared_auras', JSON.stringify(updatedShares));
    
    // LLaMA tarafından oluşturulan hikaye ve içgörüleri özel bir key ile kaydet
    if (insights) {
      // Hikayeyi kaydet
      if (auraStory) {
        localStorage.setItem(`auralize_story_${shareData.id}`, auraStory);
      }
      
      // Güçlü yanları kaydet
      if (insights.strengths) {
        localStorage.setItem(`auralize_strengths_${shareData.id}`, JSON.stringify(insights.strengths));
      }
      
      // Potansiyeli kaydet
      if (insights.potential) {
        localStorage.setItem(`auralize_potential_${shareData.id}`, JSON.stringify(insights.potential));
      }
      
      // Düşünme tarzını kaydet
      if (insights.thinkingStyle) {
        localStorage.setItem(`auralize_thinking_${shareData.id}`, JSON.stringify(insights.thinkingStyle));
      }
    }
    
    // Paylaşım durumunu işaretle
    setIsShared(true);
    localStorage.setItem('auralize_last_shared', 'true');
    
    // Galeri sayfasına yönlendir
    navigate('/gallery');
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
    <div className="aura-result-container">
      <style>{`
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .loading-spinner-crystal {
          width: 50px;
          height: 50px;
          position: relative;
          animation: crystal-rotate 2s infinite linear;
        }

        .loading-spinner-crystal::before,
        .loading-spinner-crystal::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 15%;
          background: linear-gradient(45deg, #FF61D2, #FE9090);
          opacity: 0.7;
        }

        .loading-spinner-crystal::after {
          animation: crystal-pulse 1s infinite alternate;
        }

        @keyframes crystal-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes crystal-pulse {
          from { transform: scale(1); opacity: 0.7; }
          to { transform: scale(1.2); opacity: 0.3; }
        }

        .loading-text-animated {
          font-size: 1.1rem;
          color: #4a4a4a;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .loading-dots {
          display: inline-block;
          animation: dots 1.4s infinite;
          width: 1.5em;
          text-align: left;
        }

        @keyframes dots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }

        .aura-crystal-spinner {
          width: 60px;
          height: 60px;
          position: relative;
          transform-style: preserve-3d;
          animation: crystal-3d-spin 3s infinite linear;
        }

        .crystal-face {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, #FF61D2, #FE9090);
          opacity: 0.7;
          border-radius: 15%;
        }

        .crystal-face:nth-child(1) { transform: rotateY(0deg) translateZ(30px); }
        .crystal-face:nth-child(2) { transform: rotateY(90deg) translateZ(30px); }
        .crystal-face:nth-child(3) { transform: rotateY(180deg) translateZ(30px); }
        .crystal-face:nth-child(4) { transform: rotateY(270deg) translateZ(30px); }

        @keyframes crystal-3d-spin {
          from { transform: rotateY(0deg) rotateX(45deg); }
          to { transform: rotateY(360deg) rotateX(45deg); }
        }

        .aura-loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
        }

        .cache-indicator {
          margin-top: 1rem;
          text-align: right;
        }

        .cache-badge, .llama-badge, .default-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.9rem;
          background: linear-gradient(45deg, #FF61D2, #FE9090);
          color: white;
          box-shadow: 0 2px 10px rgba(254, 144, 144, 0.3);
        }

        .aura-story-content {
          opacity: 0;
          animation: fadeIn 1s forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .insights-pulse-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80px;
        }
        
        .insights-pulse {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(45deg, #FF61D2, #FE9090);
          animation: insight-pulse 1.5s infinite;
        }
        
        @keyframes insight-pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        
        .insights-loading-text {
          margin-top: 0.8rem;
          font-size: 0.9rem;
          color: #666;
        }
        
        .insight-content {
          animation: fadeInUp 0.6s forwards;
          opacity: 0;
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .insight-icon-container {
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
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
              <h1 
                className="aura-main-title" 
                style={{ 
                  background: auraData?.gradient || 'linear-gradient(135deg, #FF61D2, #7000FF)', 
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 700
                }}
              >
                {auraTitle || auraData?.title || 'Aura Analizin'}
              </h1>
              <p 
                className="aura-subtitle" 
                style={{ 
                  background: auraData?.gradient || 'linear-gradient(135deg, #FF61D2, #7000FF)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 500
                }}
              >
                İçindeki aurayı ortaya çıkardık. İşte senin benzersiz aura profili.
              </p>
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
                className={`aura-story-section ${isStoryLoading ? 'loading' : 'loaded'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="aura-section-header">
                  <h2 className="aura-section-title">
                    <span className="aura-section-icon">📖</span>
                    Aura Hikayen
                  </h2>
                  {isStoryLoading && !hasQuickSummary && (
                    <div className="loading-indicator">
                      <div className="loading-spinner-crystal"></div>
                      <p className="loading-text-animated">Auran analiz ediliyor<span className="loading-dots">...</span></p>
                    </div>
                  )}
                  
                  {hasQuickSummary && isFullStoryLoading && (
                    <div className="loading-indicator">
                      <div className="loading-spinner-crystal"></div>
                      {apiCacheStat === 'llama' ? (
                        <p className="loading-text-animated">Auralize hikayeni oluşturuyor<span className="loading-dots">...</span></p>
                      ) : apiCacheStat === 'default' ? (
                        <p className="loading-text-animated">Varsayılan hikaye yükleniyor<span className="loading-dots">...</span></p>
                      ) : (
                        <p className="loading-text-animated">Detaylı aura hikayen hazırlanıyor<span className="loading-dots">...</span></p>
                      )}
                    </div>
                  )}
                </div>
                <div className="aura-story-box glass-card">
                  {isStoryLoading && !hasQuickSummary ? (
                    <div className="aura-loading-container">
                      <div className="aura-crystal-spinner">
                        <div className="crystal-face"></div>
                        <div className="crystal-face"></div>
                        <div className="crystal-face"></div>
                        <div className="crystal-face"></div>
                      </div>
                      <p className="aura-loading-text loading-text-animated">
                        {isFullStoryLoading 
                          ? "Auralize hikayeni oluşturuyor" 
                          : "Aura hikayen hazırlanıyor"}
                        <span className="loading-dots">...</span>
                      </p>
                    </div>
                  ) : (
                    <div className="aura-story-content animate__animated animate__fadeIn">
                      <div className="cache-indicator">
                        {apiCacheStat === 'cache' && <span className="cache-badge">Önbellekten alındı</span>}
                        {apiCacheStat === 'llama' && <span className="llama-badge">Auralize tarafından oluşturuldu</span>}
                        {apiCacheStat === 'default' && <span className="default-badge">Varsayılan hikaye</span>}
                      </div>
                      
                      <div className="aura-story-text">
                        {auraStory.split('\n\n').map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}
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
                  {isInsightsLoading && (
                    <div className="loading-indicator">
                      <div className="loading-spinner-crystal" style={{ 
                        background: auraData?.gradient || 'linear-gradient(45deg, #FF61D2, #FE9090)'
                      }}></div>
                      <p className="loading-text-animated">
                        İçgörülerin oluşturuluyor
                        <span className="loading-dots">...</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="aura-insights-container">
                  <div className="aura-insights-grid">
                    <div className="aura-insight-card glass-card">
                      <div className="aura-insight-icon insight-icon-container" style={{ background: auraData?.gradient }}>🌟</div>
                      <h3 className="aura-insight-title">Güçlü Yönlerin</h3>
                      {isInsightsLoading ? (
                        <div className="insights-pulse-container">
                          <div className="insights-pulse" style={{ background: auraData?.gradient }}></div>
                          <p className="insights-loading-text">Güçlü yönlerin analiz ediliyor<span className="loading-dots">...</span></p>
                        </div>
                      ) : (
                        <p className="aura-insight-text insight-content">
                          {insights.strengths || 
                           (auraType === 'creative' && 'Yenilikçi düşünme, bağlantılar kurma, sezgisel anlayış') ||
                           (auraType === 'analytical' && 'Detaylara dikkat, mantıksal düşünme, problem çözme') ||
                           (auraType === 'empathetic' && 'Duygusal zeka, dinleme, insanları anlama') ||
                           (auraType === 'energetic' && 'İnitiasif alma, tutkulu çalışma, enerji yayma')
                          }
                        </p>
                      )}
                    </div>
                    
                    <div className="aura-insight-card glass-card">
                      <div className="aura-insight-icon insight-icon-container" style={{ background: auraData?.gradient }}>🚀</div>
                      <h3 className="aura-insight-title">Potansiyelin</h3>
                      {isInsightsLoading ? (
                        <div className="insights-pulse-container">
                          <div className="insights-pulse" style={{ background: auraData?.gradient }}></div>
                          <p className="insights-loading-text">Potansiyelin keşfediliyor<span className="loading-dots">...</span></p>
                        </div>
                      ) : (
                        <p className="aura-insight-text insight-content">
                          {insights.potential || 
                           (auraType === 'creative' && 'Benzersiz sanat eserleri, orijinal fikirler, yenilikçi çözümler üretme') ||
                           (auraType === 'analytical' && 'Karmaşık sistemleri anlama, etkili stratejiler geliştirme, verimli çözümler bulma') ||
                           (auraType === 'empathetic' && 'Güçlü ilişkiler kurma, insanları motive etme, duygusal destek sağlama') ||
                           (auraType === 'energetic' && 'Zorlu projeleri tamamlama, ekipleri harekete geçirme, hızlı sonuçlar elde etme')
                          }
                        </p>
                      )}
                    </div>
                    
                    <div className="aura-insight-card glass-card">
                      <div className="aura-insight-icon insight-icon-container" style={{ background: auraData?.gradient }}>🧠</div>
                      <h3 className="aura-insight-title">Düşünme Tarzın</h3>
                      {isInsightsLoading ? (
                        <div className="insights-pulse-container">
                          <div className="insights-pulse" style={{ background: auraData?.gradient }}></div>
                          <p className="insights-loading-text">Düşünme tarzın belirleniyor<span className="loading-dots">...</span></p>
                        </div>
                      ) : (
                        <p className="aura-insight-text insight-content">
                          {insights.thinkingStyle || 
                           (auraType === 'creative' && 'Yanal düşünme, bağlantılar kurma, sınırların dışına çıkma') ||
                           (auraType === 'analytical' && 'Sistematik, yapısal, mantıksal ve detaylı düşünme') ||
                           (auraType === 'empathetic' && 'Duygusal, sezgisel, ilişkisel ve anlamsal düşünme') ||
                           (auraType === 'energetic' && 'Pratik, sonuç odaklı, hızlı ve aksiyon bazlı düşünme')
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {insights.source === 'llama' && (
                    <div className="cache-indicator" style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <span className="llama-badge">Kişiselleştirilmiş içgörüler</span>
                    </div>
                  )}
                  {insights.source === 'default' && (
                    <div className="cache-indicator" style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <span className="default-badge">Varsayılan içgörüler</span>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Aura Oyun Bölümü */}
              <motion.div 
                className="aura-game-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
              >
                <div className="aura-section-header">
                  <h2 className="aura-section-title">
                    <span className="aura-section-icon">🎮</span>
                    Aura Gücünü Test Et
                  </h2>
                </div>
                <div className="aura-game-container">
                  <div className="aura-game-card glass-card">
                    <div className="aura-game-icon" style={{ background: auraData?.gradient }}>
                      <span>{auraData?.icon}</span>
                    </div>
                    <div className="aura-game-info">
                      <h3 className="aura-game-title">Aura Kristalleri</h3>
                      <p className="aura-game-description">
                        Auranın gücünü test etmek için özel olarak tasarlanmış mini oyunu dene! 
                        {auraType === 'creative' && ' Yaratıcı auranı kullanarak ilham kristallerini topla.'}
                        {auraType === 'analytical' && ' Analitik auranı kullanarak mantık kristallerini topla.'}
                        {auraType === 'empathetic' && ' Empatik auranı kullanarak kalp kristallerini topla.'}
                        {auraType === 'energetic' && ' Enerjik auranı kullanarak güç kristallerini topla.'}
                      </p>
                      
                      {gameStats.highScore > 0 && (
                        <div className="aura-game-stats">
                          <div className="aura-game-stat">
                            <span className="aura-game-stat-label">En Yüksek Skor</span>
                            <span className="aura-game-stat-value">{gameStats.highScore}</span>
                          </div>
                          
                          {gameStats.badges.length > 0 && (
                            <div className="aura-game-badges">
                              <span className="aura-game-badge-label">Rozetler</span>
                              <div className="aura-game-badge-list">
                                {gameStats.badges.map((badge, index) => {
                                  const [_, level] = badge.split('_');
                                  const badgeLabels: {[key: string]: string} = {
                                    novice: 'Başlangıç',
                                    adept: 'İleri',
                                    expert: 'Uzman',
                                    master: 'Usta'
                                  };
                                  return (
                                    <div 
                                      key={index} 
                                      className="aura-game-badge"
                                      style={{ background: auraData?.gradient }}
                                    >
                                      <span className="aura-game-badge-icon">{auraData?.icon}</span>
                                      <span className="aura-game-badge-name">{badgeLabels[level] || level}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <Link 
                        to="/aura-game" 
                        className="btn btn-game"
                        style={{ 
                          background: auraData?.gradient,
                          boxShadow: `0 4px 15px ${auraData?.particleColor}40` 
                        }}
                      >
                        <span className="btn-icon">🎮</span>
                        Hemen Oyna
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="aura-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.6 }}
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
                  onClick={() => setShowUsernameModal(true)}
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                    onFocus={(e) => e.target.style.borderColor = auraData?.particleColor || '#5B8CFF'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
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
                    Etiketler (Maksimum 5)
                  </label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '10px'
                  }}>
                    {/* Otomatik eklenen aura tipi etiketi */}
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '100px',
                      fontSize: '13px',
                      background: `${auraData?.particleColor}22`,
                      color: auraData?.particleColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontWeight: '500'
                    }}>
                      #{auraType}
                    </div>
                    
                    {/* Auralize etiketi */}
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
                    
                    {/* Kullanıcının eklediği etiketler */}
                    {hashtags.map((tag, index) => (
                      <div 
                        key={index}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '100px',
                          fontSize: '13px',
                          background: `${auraData?.particleColor}15`,
                          color: '#555',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        #{tag}
                        <button
                          onClick={() => removeHashtag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#999',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%'
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Yeni etiket giriş alanı */}
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text"
                      value={hashtagInput}
                      onChange={handleHashtagInputChange}
                      placeholder="Etiketleri boşlukla ayırarak ekleyin"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingLeft: '24px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = auraData?.particleColor || '#5B8CFF'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#aaa',
                      fontSize: '14px'
                    }}>
                      #
                    </span>
                  </div>
                  <p style={{ 
                    margin: '8px 0 0 0',
                    fontSize: '12px',
                    color: '#999',
                    fontStyle: 'italic'
                  }}>
                    {5 - hashtags.length} etiket daha ekleyebilirsiniz
                  </p>
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
                  onClick={() => handleUsernameChange(customUsername)}
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
    </div>
  );
};

export default AuraResult; 