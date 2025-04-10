import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// OpenAI servisini import ediyorum
import { getAuraStoryFromOpenAI, getAuraInsightsFromOpenAI, determineDynamicAuraType, auraTypes, getCombinedAuraDataFromOpenAI } from '../services/openaiService';
import { saveAuraStory } from '../services/auraDataService';

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

// Aura türüne göre gradient renk oluşturan yardımcı fonksiyonlar
const getGradientForAuraType = (auraType: string): string => {
  const gradients = {
    creative: 'linear-gradient(135deg, #FF61D2, #FE9090)',
    analytical: 'linear-gradient(135deg, #4158D0, #C850C0)',
    empathetic: 'linear-gradient(135deg, #43C6AC, #F8FFAE)',
    visionary: 'linear-gradient(135deg, #0093E9, #80D0C7)',
    leadership: 'linear-gradient(135deg, #8A2387, #F27121)',
    balanced: 'linear-gradient(135deg, #00B4DB, #0083B0)',
    passionate: 'linear-gradient(135deg, #FF416C, #FF4B2B)',
    serene: 'linear-gradient(135deg, #16A085, #F4D03F)',
    energetic: 'linear-gradient(135deg, #FF0099, #493240)',
    mindful: 'linear-gradient(135deg, #1FA2FF, #12D8FA, #A6FFCB)',
    career: 'linear-gradient(135deg, #4158D0, #C850C0)',
    mood: 'linear-gradient(135deg, #43C6AC, #F8FFAE)',
    personal: 'linear-gradient(135deg, #0093E9, #80D0C7)'
  };
  
  return gradients[auraType as keyof typeof gradients] || 'linear-gradient(135deg, #FF61D2, #FE9090)';
};

const getDarkGradientForAuraType = (auraType: string): string => {
  const darkGradients = {
    creative: 'linear-gradient(135deg, #A13E95, #D75A5A)',
    analytical: 'linear-gradient(135deg, #2A3A80, #7D3D7A)',
    empathetic: 'linear-gradient(135deg, #2E7A6F, #9FA86C)',
    visionary: 'linear-gradient(135deg, #005E94, #518D86)',
    leadership: 'linear-gradient(135deg, #591756, #994716)',
    balanced: 'linear-gradient(135deg, #00718A, #005571)',
    passionate: 'linear-gradient(135deg, #A32A46, #A3301D)',
    serene: 'linear-gradient(135deg, #0F6B58, #A4912D)',
    energetic: 'linear-gradient(135deg, #A00062, #2F2029)',
    mindful: 'linear-gradient(135deg, #156CA2, #0C91A5, #6EAA86)',
    career: 'linear-gradient(135deg, #293D8C, #862E82)',
    mood: 'linear-gradient(135deg, #2B7F6E, #A5AB4A)',
    personal: 'linear-gradient(135deg, #00608F, #518D86)'
  };
  
  return darkGradients[auraType as keyof typeof darkGradients] || 'linear-gradient(135deg, #A13E95, #D75A5A)';
};

const getParticleColorForAuraType = (auraType: string): string => {
  const particleColors = {
    creative: '#FF61D2',
    analytical: '#4158D0',
    empathetic: '#43C6AC',
    visionary: '#0093E9',
    leadership: '#8A2387',
    balanced: '#00B4DB',
    passionate: '#FF416C',
    serene: '#16A085',
    energetic: '#FF0099',
    mindful: '#1FA2FF',
    career: '#4158D0',
    mood: '#43C6AC',
    personal: '#0093E9'
  };
  
  return particleColors[auraType as keyof typeof particleColors] || '#FF61D2';
};

const getIconForAuraType = (auraType: string): string => {
  const icons = {
    creative: '✨',
    analytical: '🔍',
    empathetic: '💗',
    visionary: '👁️',
    leadership: '👑',
    balanced: '☯️',
    passionate: '🔥',
    serene: '🌊',
    energetic: '⚡',
    mindful: '🧠',
    career: '💼',
    mood: '😊',
    personal: '🌟'
  };
  
  return icons[auraType as keyof typeof icons] || '✨';
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

const AuraResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [auraType, setAuraType] = useState<string>('creative');
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
  const [isStoryLoading, setIsStoryLoading] = useState(true);
  const [isFullStoryLoading, setIsFullStoryLoading] = useState(false);
  const [hasQuickSummary, setHasQuickSummary] = useState(false);
  const [apiCacheStat, setApiCacheStat] = useState<'cache' | 'api' | 'default' | null>(null);
  // İçgörüler için yeni state değişkenleri
  const [insights, setInsights] = useState<{
    strengths: string;
    potential: string;
    thinkingStyle: string;
    auraTitle: string;
    source: 'openai' | 'default' | null;
  }>({
    strengths: '',
    potential: '',
    thinkingStyle: '',
    auraTitle: '',
    source: null
  });
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);
  const [auraTitle, setAuraTitle] = useState<string>('');
  const [isApiReady, setIsApiReady] = useState(false);
  
  // Quiz cevaplarını alıyoruz
  const locationState = location.state as any;
  const quizAnswers = locationState?.answers || {};
  
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
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 25);
    
    // Aura tipini belirle
    let determinedType = locationState?.quizType || 'creative';
    if (determinedType === 'creative') {
      determinedType = determineDynamicAuraType(quizAnswers);
    }
    
    setAuraType(determinedType);
    
    // Aura veri bilgilerini hazırla
    setAuraData({
      title: `${determinedType.charAt(0).toUpperCase() + determinedType.slice(1)} Aurası`,
      description: auraTypes[determinedType as keyof typeof auraTypes]?.description || 'Senin auran özel ve benzersiz bir enerji taşıyor.',
      gradient: getGradientForAuraType(determinedType),
      darkGradient: getDarkGradientForAuraType(determinedType),
      particleColor: getParticleColorForAuraType(determinedType),
      icon: getIconForAuraType(determinedType)
    });
    
    // Önbellekten en son kaydedilen aura verilerini kontrol et
    const cacheKey = `auralize_user_${currentUserId}_latest`;
    const cachedAuraData = localStorage.getItem(cacheKey);
    
    if (cachedAuraData) {
      try {
        const parsedData = JSON.parse(cachedAuraData);
        
        // Önbellekten alınan veriyi göster
        if (parsedData.story) {
          setAuraStory(parsedData.story);
          setHasQuickSummary(true);
          
          // İçgörüleri de güncelleyelim
          setInsights({
            strengths: parsedData.strengths || "Analiz ediliyor...",
            potential: parsedData.potential || "Analiz ediliyor...",
            thinkingStyle: parsedData.thinkingStyle || "Analiz ediliyor...",
            auraTitle: parsedData.auraTitle || `${determinedType.charAt(0).toUpperCase() + determinedType.slice(1)} Aurası`,
            source: 'openai'
          });
          
          // Aura başlığını güncelle
          if (parsedData.auraTitle) {
            setAuraTitle(parsedData.auraTitle);
          }
          
          console.log("Önbellekten aura verileri yüklendi");
        }
      } catch (cacheError) {
        console.error("Önbellek verileri ayrıştırılamadı:", cacheError);
      }
    }
    
    // Birleştirilmiş aura verileri yükleme fonksiyonu
    const loadCombinedAuraData = async () => {
      setIsStoryLoading(true);
      setIsInsightsLoading(true);
      setIsApiReady(false);
      
      if (DEBUG_MODE) console.log("[DEBUG] Birleştirilmiş aura verileri yükleme başladı:", new Date().toLocaleTimeString());
      if (DEBUG_MODE) console.log("[DEBUG] Quiz cevapları:", JSON.stringify(quizAnswers));
      
      // Quiz cevapları geçerli mi kontrol et
      if (!quizAnswers || Object.keys(quizAnswers).length === 0) {
        console.error("[DEBUG] Quiz cevapları boş veya geçersiz!");
        setAuraStory("Quiz cevaplarınız alınamadı. Lütfen tekrar deneyin.");
        setApiCacheStat('default');
        setIsStoryLoading(false);
        setIsInsightsLoading(false);
        setIsApiReady(false); // Paylaşım butonu devre dışı kalsın
        return;
      }

      // Maksimum deneme sayısı ve mevcut deneme sayacı
      const MAX_RETRIES = 2;
      let retryCount = 0;
      let success = false;

      // Veri alınana kadar deneme yapılan döngü
      while (retryCount <= MAX_RETRIES && !success) {
        try {
          if (retryCount > 0) {
            if (DEBUG_MODE) console.log(`[DEBUG] API isteği yeniden deneniyor (${retryCount}/${MAX_RETRIES})...`);
          }

          // Maksimum bekleme süresi (milisaniye)
          const MAX_WAIT_TIME = 180000; // 3 dakika
          const startTime = Date.now();
          
          // Tek istekle tüm verileri alma
          if (DEBUG_MODE) console.log("[DEBUG] Birleştirilmiş veri isteniyor");
          
          // Promise.race kullanarak istek veya zaman aşımından hangisi önce gelirse onu işle
          const resultPromise = Promise.race([
            getCombinedAuraDataFromOpenAI(determinedType, currentUsername, quizAnswers),
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
          
          // Verileri kontrol et - Eğer "default" kaynağıysa (yani varsayılan değerler kullanıldıysa) tekrar dene
          if (combinedData.source === 'default' && retryCount < MAX_RETRIES) {
            if (DEBUG_MODE) console.log("[DEBUG] Varsayılan değerler alındı, tekrar denenecek.");
            retryCount++;
            continue;
          }
          
          // Aura hikayesini ayarla
          setAuraStory(combinedData.story);
          setHasQuickSummary(true);
          
          // İçgörüleri ayarla
          setInsights({
            strengths: combinedData.strengths,
            potential: combinedData.potential,
            thinkingStyle: combinedData.thinkingStyle,
            auraTitle: combinedData.auraTitle,
            source: combinedData.source === 'openai' ? 'openai' : 'default'
          });
          
          // Aura başlığını güncelle
          if (combinedData.auraTitle) {
            setAuraTitle(combinedData.auraTitle);
          }
          
          // Veri kaynağını belirle
          setApiCacheStat(combinedData.source === 'openai' ? 'api' : (combinedData.source === 'api' ? 'api' : 'default'));
          
          // Güncellenmiş verileri kaydet
          if (currentUserId) {
            try {
              const updatedAuraData = {
                auraType: determinedType,
                story: combinedData.story,
                strengths: combinedData.strengths,
                potential: combinedData.potential,
                thinkingStyle: combinedData.thinkingStyle,
                auraTitle: combinedData.auraTitle,
                answers: quizAnswers
              };
              
              await saveAuraStory(currentUserId, updatedAuraData);
              if (DEBUG_MODE) console.log("[DEBUG] Güncel aura verileri kaydedildi");
            } catch (saveError) {
              console.error("Güncel aura verileri kaydedilirken hata:", saveError);
            }
          }
          
          // Başarı durumunu güncelle
          success = true;
          
          // En son, tüm yükleme durumlarını kapat
          setIsStoryLoading(false);
          setIsFullStoryLoading(false);
          setIsInsightsLoading(false);
          setIsApiReady(true);
          
          if (DEBUG_MODE) console.log("[DEBUG] Aura verileri UI'a yüklendi.", new Date().toLocaleTimeString());
          
        } catch (error) {
          console.error("Birleştirilmiş aura verileri alınırken hata oluştu:", error);
          if (DEBUG_MODE) console.log("[DEBUG] Birleştirilmiş veriler yüklenirken hata:", error);
          
          // Son deneme başarısız olursa
          if (retryCount >= MAX_RETRIES) {
            // Hata mesajı göster
            setAuraStory("Verileriniz yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin. (Zaman aşımı)");
            setApiCacheStat('default');
            setIsApiReady(false); // Paylaşım butonu devre dışı kalsın
            
            // Tüm yükleme durumlarını sonlandır, böylece yükleme animasyonu kaybolacak
            setIsStoryLoading(false);
            setIsFullStoryLoading(false);
            setIsInsightsLoading(false);
            break;
          }
          
          // Hata sonrası bir sonraki denemeye geç
          retryCount++;
        }
      }
    };
    
    // Birleştirilmiş veri yükleme işlemini başlat
    loadCombinedAuraData();
    
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
  }, [locationState]);
  
  // API yanıtlarını kontrol eden useEffect artık gerekli değil
  
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
                background: 'linear-gradient(90deg, #FF61D2, #7000FF)'
              }}
            ></div>
          </div>
          <p className="loading-percentage">{loadingProgress}%</p>
        </div>
        <p className="loader-text">Auranız Oluşturuluyor</p>
        <p className="loader-subtext">Yapay zeka kişiliğinizi analiz ediyor</p>
      </div>
    );
  }
  
  return (
    <div className="aura-result-container">
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
          background: linear-gradient(135deg, #FF61D2, #FE9090);
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
          background: linear-gradient(135deg, #FF61D2, #FE9090);
          border-radius: 20%;
          position: relative;
          animation: crystal-rotate-3d 3s infinite linear;
          transform-style: preserve-3d;
          box-shadow: 0 5px 15px rgba(255, 97, 210, 0.3);
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
                </div>
                <div className="aura-story-box glass-card">
                  {isStoryLoading ? (
                    <div className="aura-loading-container">
                      <LoadingAnimation text="Aura hikayen hazırlanıyor" color={auraData?.gradient} />
                    </div>
                  ) : (
                    <div className="aura-story-content animate__animated animate__fadeIn">
                      <div className="cache-indicator">
                        {apiCacheStat === 'cache' && <span className="cache-badge">Önbellekten alındı</span>}
                        {apiCacheStat === 'api' && <span className="llama-badge">Auralize AI tarafından oluşturuldu</span>}
                        {apiCacheStat === 'default' && <span className="default-badge">Varsayılan hikaye</span>}
                      </div>
                      
                      <div className="aura-story-text">
                        {/* Hikaye içeriğini parçalara ayır ve düzenli şekilde göster */}
                        {(() => {
                          // API'den gelen içeriği parçalara ayırma
                          let storyParts = {
                            title: "",
                            story: "",
                            strengths: "",
                            potential: "",
                            thinking: ""
                          };
                          
                          // API yanıtını bölümlere ayır
                          if (auraStory.includes("#### Aura Hikayesi") || 
                              auraStory.includes("#### Güçlü Yönler") || 
                              auraStory.includes("#### Potansiyel Gelişim Alanları") ||
                              auraStory.includes("#### Düşünce Tarzı")) {
                            
                            // Başlığı çıkar
                            const titleMatch = auraStory.match(/### Aura Başlığı: \*\*(.*?)\*\*/);
                            if (titleMatch && titleMatch[1]) {
                              storyParts.title = titleMatch[1];
                            }
                            
                            // Hikaye kısmını çıkar
                            const storyMatch = auraStory.match(/#### Aura Hikayesi.*?\: ([\s\S]*?)(?=####|$)/);
                            if (storyMatch && storyMatch[1]) {
                              storyParts.story = storyMatch[1].trim();
                            }
                            
                            // Güçlü yönleri çıkar, API cevabından ayrı gösterme
                            if (!insights.strengths) {
                              const strengthsMatch = auraStory.match(/#### Güçlü Yönler.*?\: ([\s\S]*?)(?=####|$)/);
                              if (strengthsMatch && strengthsMatch[1] && !insights.strengths) {
                                storyParts.strengths = strengthsMatch[1].trim();
                              }
                            }
                            
                            // Potansiyel alanları çıkar, API cevabından ayrı gösterme
                            if (!insights.potential) {
                              const potentialMatch = auraStory.match(/#### Potansiyel Gelişim Alanları.*?\: ([\s\S]*?)(?=####|$)/);
                              if (potentialMatch && potentialMatch[1] && !insights.potential) {
                                storyParts.potential = potentialMatch[1].trim();
                              }
                            }
                            
                            // Düşünme tarzını çıkar, API cevabından ayrı gösterme
                            if (!insights.thinkingStyle) {
                              const thinkingMatch = auraStory.match(/#### Düşünce Tarzı.*?\: ([\s\S]*?)(?=####|$)/);
                              if (thinkingMatch && thinkingMatch[1] && !insights.thinkingStyle) {
                                storyParts.thinking = thinkingMatch[1].trim();
                              }
                            }
                            
                            // Sadece hikaye kısmını göster, diğerleri kendi bölümlerinde gösterilecek
                            return (
                              <>
                                {storyParts.title && (
                                  <h3 className="aura-story-title" style={{ 
                                    marginBottom: '1.5rem', 
                                    background: auraData?.gradient,
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent', 
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    fontSize: '1.5rem'
                                  }}>
                                    {storyParts.title}
                                  </h3>
                                )}
                                
                                {storyParts.story && (
                                  <div style={{ marginBottom: '1rem' }}>
                                    {storyParts.story.split('\n\n').map((paragraph, index) => (
                                      <p key={index} style={{ marginBottom: '1rem', lineHeight: '1.6' }}>{paragraph}</p>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                            
                          } else {
                            // Parçalara ayrılmamış düz hikaye - eskisi gibi göster
                            return auraStory.split('\n\n').map((paragraph, index) => (
                              <p key={index}>{paragraph}</p>
                            ));
                          }
                        })()}
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
                </div>
                <div className="aura-insights-container">
                  <div className="aura-insights-grid">
                    <div className="aura-insight-card glass-card">
                      {isInsightsLoading ? (
                        <div className="insight-loading-container">
                          <LoadingAnimation text="Güçlü yönlerin analiz ediliyor" color={auraData?.gradient} />
                        </div>
                      ) : (
                        <>
                          <div className="aura-insight-icon insight-icon-container" style={{ background: auraData?.gradient }}>🌟</div>
                          <h3 className="aura-insight-title">Güçlü Yönlerin</h3>
                          <div 
                            className="aura-insight-text insight-content"
                            style={{
                              height: '150px', 
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                          >
                            <div 
                              className="insight-content-gradient" 
                              style={{ 
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '50px',
                                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))',
                                pointerEvents: 'none'
                              }}
                            />
                            {(() => {
                              if (auraStory.includes("#### Güçlü Yönler")) {
                                const strengthsMatch = auraStory.match(/#### Güçlü Yönler.*?\: ([\s\S]*?)(?=####|$)/);
                                if (strengthsMatch && strengthsMatch[1] && !insights.strengths) {
                                  return strengthsMatch[1].trim();
                                }
                              }
                              
                              // Güçlü yönler metnini formatla - yıldızlı kısımları düzelt
                              const formattedStrengths = insights.strengths?.replace(/\*\*/g, '')  // ** işaretlerini kaldır
                                .replace(/(\d+\.)\s+([^:]+):/g, '$1 <strong>$2</strong>:') // Numaraları ve başlıkları kalın yap
                                .split('\n').map((line, idx) => <p key={idx} dangerouslySetInnerHTML={{ __html: line }} />);
                                
                              return formattedStrengths;
                            })()}
                          </div>
                          <button 
                            onClick={(e) => {
                              const target = e.currentTarget.previousSibling as HTMLElement;
                              const gradient = target.querySelector('.insight-content-gradient') as HTMLElement;
                              
                              if (target.style.height === '150px' || !target.style.height) {
                                target.style.height = 'auto';
                                if (gradient) gradient.style.display = 'none';
                                e.currentTarget.textContent = 'Daha Az Göster';
                              } else {
                                target.style.height = '150px';
                                if (gradient) gradient.style.display = 'block';
                                e.currentTarget.textContent = 'Daha Fazla Göster';
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: auraData?.particleColor,
                              cursor: 'pointer',
                              marginTop: '0.5rem',
                              fontWeight: 500,
                              fontSize: '14px'
                            }}
                          >
                            Daha Fazla Göster
                          </button>
                        </>
                      )}
                    </div>
                    
                    <div className="aura-insight-card glass-card">
                      {isInsightsLoading ? (
                        <div className="insight-loading-container">
                          <LoadingAnimation text="Potansiyelin analiz ediliyor" color={auraData?.gradient} />
                        </div>
                      ) : (
                        <>
                          <div className="aura-insight-icon insight-icon-container" style={{ background: auraData?.gradient }}>🚀</div>
                          <h3 className="aura-insight-title">Potansiyelin</h3>
                          <div 
                            className="aura-insight-text insight-content"
                            style={{
                              height: '150px', 
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                          >
                            <div 
                              className="insight-content-gradient" 
                              style={{ 
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '50px',
                                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))',
                                pointerEvents: 'none'
                              }}
                            />
                            {(() => {
                              if (auraStory.includes("#### Potansiyel Gelişim Alanları")) {
                                const potentialMatch = auraStory.match(/#### Potansiyel Gelişim Alanları.*?\: ([\s\S]*?)(?=####|$)/);
                                if (potentialMatch && potentialMatch[1] && !insights.potential) {
                                  return potentialMatch[1].trim();
                                }
                              }
                              
                              // Potansiyel metinini formatla - yıldızlı kısımları düzelt
                              const formattedPotential = insights.potential?.replace(/\*\*/g, '')  // ** işaretlerini kaldır
                                .replace(/(\d+\.)\s+([^:]+):/g, '$1 <strong>$2</strong>:') // Numaraları ve başlıkları kalın yap
                                .split('\n').map((line, idx) => <p key={idx} dangerouslySetInnerHTML={{ __html: line }} />);
                                
                              return formattedPotential;
                            })()}
                          </div>
                          <button 
                            onClick={(e) => {
                              const target = e.currentTarget.previousSibling as HTMLElement;
                              const gradient = target.querySelector('.insight-content-gradient') as HTMLElement;
                              
                              if (target.style.height === '150px' || !target.style.height) {
                                target.style.height = 'auto';
                                if (gradient) gradient.style.display = 'none';
                                e.currentTarget.textContent = 'Daha Az Göster';
                              } else {
                                target.style.height = '150px';
                                if (gradient) gradient.style.display = 'block';
                                e.currentTarget.textContent = 'Daha Fazla Göster';
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: auraData?.particleColor,
                              cursor: 'pointer',
                              marginTop: '0.5rem',
                              fontWeight: 500,
                              fontSize: '14px'
                            }}
                          >
                            Daha Fazla Göster
                          </button>
                        </>
                      )}
                    </div>
                    
                    <div className="aura-insight-card glass-card">
                      {isInsightsLoading ? (
                        <div className="insight-loading-container">
                          <LoadingAnimation text="Düşünme tarzın analiz ediliyor" color={auraData?.gradient} />
                        </div>
                      ) : (
                        <>
                          <div className="aura-insight-icon insight-icon-container" style={{ background: auraData?.gradient }}>🧠</div>
                          <h3 className="aura-insight-title">Düşünme Tarzın</h3>
                          <div 
                            className="aura-insight-text insight-content"
                            style={{
                              height: '150px', 
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                          >
                            <div 
                              className="insight-content-gradient" 
                              style={{ 
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '50px',
                                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))',
                                pointerEvents: 'none'
                              }}
                            />
                            {(() => {
                              if (auraStory.includes("#### Düşünce Tarzı")) {
                                const thinkingMatch = auraStory.match(/#### Düşünce Tarzı.*?\: ([\s\S]*?)(?=####|$)/);
                                if (thinkingMatch && thinkingMatch[1] && !insights.thinkingStyle) {
                                  return thinkingMatch[1].trim();
                                }
                              }
                              
                              // Düşünme tarzı metinini formatla - paragraflar halinde
                              const formattedThinking = insights.thinkingStyle?.split('\n\n').map((paragraph, idx) => 
                                <p key={idx}>{paragraph}</p>
                              );
                                
                              return formattedThinking;
                            })()}
                          </div>
                          <button 
                            onClick={(e) => {
                              const target = e.currentTarget.previousSibling as HTMLElement;
                              const gradient = target.querySelector('.insight-content-gradient') as HTMLElement;
                              
                              if (target.style.height === '150px' || !target.style.height) {
                                target.style.height = 'auto';
                                if (gradient) gradient.style.display = 'none';
                                e.currentTarget.textContent = 'Daha Az Göster';
                              } else {
                                target.style.height = '150px';
                                if (gradient) gradient.style.display = 'block';
                                e.currentTarget.textContent = 'Daha Fazla Göster';
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: auraData?.particleColor,
                              cursor: 'pointer',
                              marginTop: '0.5rem',
                              fontWeight: 500,
                              fontSize: '14px'
                            }}
                          >
                            Daha Fazla Göster
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {!isInsightsLoading && insights.source === 'openai' && (
                    <div className="cache-indicator" style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <div className="llama-badge" style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        background: `${auraData?.particleColor}22`,
                        color: auraData?.particleColor,
                        fontSize: '14px',
                        fontWeight: 500,
                        boxShadow: `0 2px 8px ${auraData?.particleColor}33`
                      }}>
                        <span className="llama-icon">🤖</span>
                        <span>OpenAI GPT-4o tarafından oluşturuldu</span>
                      </div>
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
                  className={`btn ${isShared ? 'btn-success' : 'btn-share'} ${!isApiReady ? 'btn-disabled' : ''}`}
                  onClick={() => setShowUsernameModal(true)}
                  disabled={isShared || !isApiReady}
                  style={!isApiReady ? { 
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    background: '#ccc',
                    boxShadow: 'none'
                  } : {}}
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
                  {isShared ? 'Paylaşıldı' : isApiReady ? 'Galeriye Paylaş' : 'Analiz tamamlanıyor...'}
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