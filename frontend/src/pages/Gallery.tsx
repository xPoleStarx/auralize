import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface AuraArt {
  id: string;
  title: string;
  userId: string;
  username: string;
  auraType: string;
  createdAt: Date;
  likes: number;
  likedBy: string[];
  description?: string;
  hashtags?: string[];
}

const Gallery: React.FC = () => {
  const [auraArts, setAuraArts] = useState<AuraArt[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [showArtDetail, setShowArtDetail] = useState<string | null>(null);
  const [currentArt, setCurrentArt] = useState<AuraArt | null>(null);
  const [activeTab, setActiveTab] = useState<string>('description');
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [auraStory, setAuraStory] = useState<string>('');
  const [auraStrengths, setAuraStrengths] = useState<string>('');
  const [auraPotential, setAuraPotential] = useState<string>('');
  const [auraThinking, setAuraThinking] = useState<string>('');
  const [hasCustomStory, setHasCustomStory] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Aura tipine göre emoji döndüren yardımcı fonksiyon
  const renderAuraEmoji = (auraType?: string) => {
    switch(auraType) {
      case 'creative': return '✨';
      case 'analytical': return '🔍';
      case 'empathetic': return '💗';
      case 'energetic': return '⚡';
      case 'mor': return '🔮';
      case 'mavi': return '🌊';
      case 'yeşil': return '🌿';
      case 'sarı': return '☀️';
      case 'turuncu': return '🔥';
      case 'kırmızı': return '❤️';
      case 'indigo': return '🌌';
      case 'altın': return '✨';
      case 'gümüş': return '🌙';
      case 'kristal': return '💎';
      case 'gökkuşağı': return '🌈';
      case 'beyaz': return '☁️';
      default: return '✨'; // Varsayılan emoji
    }
  };
  
  useEffect(() => {
    // Scroll event listener
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // CSS değişkenlerini belirle - mevcut aura tipleri
    document.documentElement.style.setProperty('--color-creative-light', '#FF61D2');
    document.documentElement.style.setProperty('--color-creative-dark', '#FE9090');
    document.documentElement.style.setProperty('--color-creative-light-rgb', '255, 97, 210');
    document.documentElement.style.setProperty('--color-creative-dark-rgb', '254, 144, 144');
    
    document.documentElement.style.setProperty('--color-analytical-light', '#5B8CFF');
    document.documentElement.style.setProperty('--color-analytical-dark', '#36C5F0');
    document.documentElement.style.setProperty('--color-analytical-light-rgb', '91, 140, 255');
    document.documentElement.style.setProperty('--color-analytical-dark-rgb', '54, 197, 240');
    
    document.documentElement.style.setProperty('--color-empathetic-light', '#41D5A8');
    document.documentElement.style.setProperty('--color-empathetic-dark', '#30BFDD');
    document.documentElement.style.setProperty('--color-empathetic-light-rgb', '65, 213, 168');
    document.documentElement.style.setProperty('--color-empathetic-dark-rgb', '48, 191, 221');
    
    document.documentElement.style.setProperty('--color-energetic-light', '#FFB046');
    document.documentElement.style.setProperty('--color-energetic-dark', '#FF7070');
    document.documentElement.style.setProperty('--color-energetic-light-rgb', '255, 176, 70');
    document.documentElement.style.setProperty('--color-energetic-dark-rgb', '255, 112, 112');
    
    // Yeni aura tipleri için CSS değişkenleri
    document.documentElement.style.setProperty('--color-mor-light', '#9D4EDD');
    document.documentElement.style.setProperty('--color-mor-dark', '#7B2CBF');
    document.documentElement.style.setProperty('--color-mor-light-rgb', '157, 78, 221');
    document.documentElement.style.setProperty('--color-mor-dark-rgb', '123, 44, 191');
    
    document.documentElement.style.setProperty('--color-mavi-light', '#4361EE');
    document.documentElement.style.setProperty('--color-mavi-dark', '#3A0CA3');
    document.documentElement.style.setProperty('--color-mavi-light-rgb', '67, 97, 238');
    document.documentElement.style.setProperty('--color-mavi-dark-rgb', '58, 12, 163');
    
    document.documentElement.style.setProperty('--color-yeşil-light', '#2DC653');
    document.documentElement.style.setProperty('--color-yeşil-dark', '#148F77');
    document.documentElement.style.setProperty('--color-yeşil-light-rgb', '45, 198, 83');
    document.documentElement.style.setProperty('--color-yeşil-dark-rgb', '20, 143, 119');
    
    document.documentElement.style.setProperty('--color-sarı-light', '#FFDD00');
    document.documentElement.style.setProperty('--color-sarı-dark', '#FFA200');
    document.documentElement.style.setProperty('--color-sarı-light-rgb', '255, 221, 0');
    document.documentElement.style.setProperty('--color-sarı-dark-rgb', '255, 162, 0');
    
    document.documentElement.style.setProperty('--color-turuncu-light', '#FF9F1C');
    document.documentElement.style.setProperty('--color-turuncu-dark', '#E85D04');
    document.documentElement.style.setProperty('--color-turuncu-light-rgb', '255, 159, 28');
    document.documentElement.style.setProperty('--color-turuncu-dark-rgb', '232, 93, 4');
    
    document.documentElement.style.setProperty('--color-kırmızı-light', '#E63946');
    document.documentElement.style.setProperty('--color-kırmızı-dark', '#A31621');
    document.documentElement.style.setProperty('--color-kırmızı-light-rgb', '230, 57, 70');
    document.documentElement.style.setProperty('--color-kırmızı-dark-rgb', '163, 22, 33');
    
    document.documentElement.style.setProperty('--color-indigo-light', '#6610F2');
    document.documentElement.style.setProperty('--color-indigo-dark', '#4B0082');
    document.documentElement.style.setProperty('--color-indigo-light-rgb', '102, 16, 242');
    document.documentElement.style.setProperty('--color-indigo-dark-rgb', '75, 0, 130');
    
    document.documentElement.style.setProperty('--color-altın-light', '#FFD700');
    document.documentElement.style.setProperty('--color-altın-dark', '#DAA520');
    document.documentElement.style.setProperty('--color-altın-light-rgb', '255, 215, 0');
    document.documentElement.style.setProperty('--color-altın-dark-rgb', '218, 165, 32');
    
    document.documentElement.style.setProperty('--color-gümüş-light', '#C0C0C0');
    document.documentElement.style.setProperty('--color-gümüş-dark', '#A9A9A9');
    document.documentElement.style.setProperty('--color-gümüş-light-rgb', '192, 192, 192');
    document.documentElement.style.setProperty('--color-gümüş-dark-rgb', '169, 169, 169');
    
    document.documentElement.style.setProperty('--color-kristal-light', '#88BDBC');
    document.documentElement.style.setProperty('--color-kristal-dark', '#6FABB0');
    document.documentElement.style.setProperty('--color-kristal-light-rgb', '136, 189, 188');
    document.documentElement.style.setProperty('--color-kristal-dark-rgb', '111, 171, 176');
    
    document.documentElement.style.setProperty('--color-gökkuşağı-light', '#6A0572');
    document.documentElement.style.setProperty('--color-gökkuşağı-dark', '#AB83A1');
    document.documentElement.style.setProperty('--color-gökkuşağı-light-rgb', '106, 5, 114');
    document.documentElement.style.setProperty('--color-gökkuşağı-dark-rgb', '171, 131, 161');
    
    document.documentElement.style.setProperty('--color-beyaz-light', '#E0E0E0');
    document.documentElement.style.setProperty('--color-beyaz-dark', '#BDBDBD');
    document.documentElement.style.setProperty('--color-beyaz-light-rgb', '224, 224, 224');
    document.documentElement.style.setProperty('--color-beyaz-dark-rgb', '189, 189, 189');
    
    // Kullanıcı ID'sini al
    const currentUserId = localStorage.getItem('auralize_user_id') || '';
    setUserId(currentUserId);
    
    // Paylaşılan auraları localStorage'dan al
    const loadSharedAuras = () => {
      try {
        const sharedAurasString = localStorage.getItem('auralize_shared_auras');
        if (!sharedAurasString) {
          setAuraArts([]);
          setLoading(false);
          return;
        }
        
        const sharedAuras = JSON.parse(sharedAurasString);
        
        // Tarihleri düzelt (JSON.parse Date nesnelerini stringe çevirir)
        const formattedAuras = sharedAuras.map((aura: any) => ({
          ...aura,
          createdAt: new Date(aura.createdAt)
        }));
        
        // Tarihe göre sırala (en yeni en üstte)
        formattedAuras.sort((a: AuraArt, b: AuraArt) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setAuraArts(formattedAuras);
        setLoading(false);
      } catch (error) {
        console.error("Auralar yüklenirken hata oluştu:", error);
        setAuraArts([]);
        setLoading(false);
      }
    };
    
    loadSharedAuras();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const filteredArts = filter === 'all'
    ? auraArts
    : auraArts.filter(art => art.auraType === filter);
    
  const handleLike = (id: string) => {
    if (!userId) return;
    
    const updatedArts = auraArts.map(art => {
      if (art.id === id) {
        // Kullanıcı daha önce beğendiyse
        if (art.likedBy.includes(userId)) {
          return art; // Değişiklik yapma
        }
        
        // Beğeniyi ekle
        return {
          ...art,
          likes: art.likes + 1,
          likedBy: [...art.likedBy, userId]
        };
      }
      return art;
    });
    
    setAuraArts(updatedArts);
    
    // LocalStorage'ı güncelle
    localStorage.setItem('auralize_shared_auras', JSON.stringify(updatedArts));
  };
  
  const handleArtClick = (artId: string) => {
    const art = auraArts.find(a => a.id === artId);
    if (art) {
      setCurrentArt(art);
      setShowArtDetail(artId);
      
      // Aura için LLaMA hikayesini kontrol et ve yükle
      const story = localStorage.getItem(`auralize_story_${artId}`);
      if (story) {
        setAuraStory(story);
        setHasCustomStory(true);
      } else {
        setAuraStory('');
        setHasCustomStory(false);
      }
      
      // İçgörüleri yükle
      try {
        const strengths = localStorage.getItem(`auralize_strengths_${artId}`);
        const potential = localStorage.getItem(`auralize_potential_${artId}`);
        const thinking = localStorage.getItem(`auralize_thinking_${artId}`);
        
        if (strengths) setAuraStrengths(JSON.parse(strengths));
        else setAuraStrengths('');
        
        if (potential) setAuraPotential(JSON.parse(potential));
        else setAuraPotential('');
        
        if (thinking) setAuraThinking(JSON.parse(thinking));
        else setAuraThinking('');
      } catch (error) {
        console.error('İçgörüleri yüklerken hata:', error);
      }
    }
  };
  
  const closeDetail = () => {
    setShowArtDetail(null);
    setCurrentArt(null);
    // Aura detaylarını temizle
    setAuraStory('');
    setAuraStrengths('');
    setAuraPotential('');
    setAuraThinking('');
    setHasCustomStory(false);
  };
  
  // Galeriyi temizleme fonksiyonu
  const clearGallery = () => {
    localStorage.removeItem('auralize_shared_auras');
    setAuraArts([]);
    setShowConfirmDialog(false);
  };
  
  // Aura kartları için güncelleme
  const GalleryItem = ({ art, userId, onLike, onClick }: { 
    art: AuraArt; 
    userId: string; 
    onLike: (id: string) => void; 
    onClick: () => void;
  }) => {
    const auraColors = {
      creative: {
        light: '#FF61D2',
        dark: '#FE9090',
        gradient: 'linear-gradient(135deg, #FF61D2, #FE9090)',
        bgLight: '#FFF6FA',
        icon: '✨'
      },
      analytical: {
        light: '#5B8CFF',
        dark: '#36C5F0',
        gradient: 'linear-gradient(135deg, #5B8CFF, #36C5F0)',
        bgLight: '#F0F7FF',
        icon: '🔍'
      },
      empathetic: {
        light: '#41D5A8',
        dark: '#30BFDD',
        gradient: 'linear-gradient(135deg, #41D5A8, #30BFDD)',
        bgLight: '#F0FFF8',
        icon: '💗'
      },
      energetic: {
        light: '#FFB046',
        dark: '#FF7070',
        gradient: 'linear-gradient(135deg, #FFB046, #FF7070)',
        bgLight: '#FFF8F0',
        icon: '⚡'
      },
      // Yeni aura tipleri için renkler
      mor: {
        light: '#9D4EDD',
        dark: '#7B2CBF',
        gradient: 'linear-gradient(135deg, #9D4EDD, #7B2CBF)',
        bgLight: '#F8F0FF',
        icon: '🔮'
      },
      mavi: {
        light: '#4361EE',
        dark: '#3A0CA3',
        gradient: 'linear-gradient(135deg, #4361EE, #3A0CA3)',
        bgLight: '#F0F4FF',
        icon: '🌊'
      },
      yeşil: {
        light: '#2DC653',
        dark: '#148F77',
        gradient: 'linear-gradient(135deg, #2DC653, #148F77)',
        bgLight: '#F0FFF4',
        icon: '🌿'
      },
      sarı: {
        light: '#FFDD00',
        dark: '#FFA200',
        gradient: 'linear-gradient(135deg, #FFDD00, #FFA200)',
        bgLight: '#FFFEF0',
        icon: '☀️'
      },
      turuncu: {
        light: '#FF9F1C',
        dark: '#E85D04',
        gradient: 'linear-gradient(135deg, #FF9F1C, #E85D04)',
        bgLight: '#FFF6EC',
        icon: '🔥'
      },
      kırmızı: {
        light: '#E63946',
        dark: '#A31621',
        gradient: 'linear-gradient(135deg, #E63946, #A31621)',
        bgLight: '#FFF0F0',
        icon: '❤️'
      },
      indigo: {
        light: '#6610F2',
        dark: '#4B0082',
        gradient: 'linear-gradient(135deg, #6610F2, #4B0082)',
        bgLight: '#F0EBFF',
        icon: '🌌'
      },
      altın: {
        light: '#FFD700',
        dark: '#DAA520',
        gradient: 'linear-gradient(135deg, #FFD700, #DAA520)',
        bgLight: '#FFFBEB',
        icon: '✨'
      },
      gümüş: {
        light: '#C0C0C0',
        dark: '#A9A9A9',
        gradient: 'linear-gradient(135deg, #C0C0C0, #A9A9A9)',
        bgLight: '#F8F8F8',
        icon: '🌙'
      },
      kristal: {
        light: '#88BDBC',
        dark: '#6FABB0',
        gradient: 'linear-gradient(135deg, #88BDBC, #6FABB0)',
        bgLight: '#F0F8FA',
        icon: '💎'
      },
      gökkuşağı: {
        light: '#6A0572',
        dark: '#AB83A1',
        gradient: 'linear-gradient(135deg, #AB83A1, #6A0572)',
        bgLight: '#FFF0FC',
        icon: '🌈'
      },
      beyaz: {
        light: '#E0E0E0',
        dark: '#BDBDBD',
        gradient: 'linear-gradient(135deg, #E0E0E0, #BDBDBD)',
        bgLight: '#FFFFFF',
        icon: '☁️'
      }
    };

    // Varsayılan aura renkleri (undefined olma durumuna karşı)
    const defaultColors = {
      light: '#7C4DFF',
      dark: '#536DFE',
      gradient: 'linear-gradient(135deg, #7C4DFF, #536DFE)',
      bgLight: '#F0F5FF',
      icon: '✨'
    };
    
    // art.auraType'in auraColors içinde olup olmadığını kontrol et, yoksa varsayılan değeri kullan
    const colors = art.auraType && auraColors[art.auraType as keyof typeof auraColors] ? 
                  auraColors[art.auraType as keyof typeof auraColors] : 
                  defaultColors;

    return (
      <motion.div 
        className="gallery-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ 
          y: -8, 
          boxShadow: `0 15px 30px rgba(0, 0, 0, 0.1), 0 5px 15px ${colors.light}33` 
        }}
        transition={{ 
          duration: 0.3,
          boxShadow: { duration: 0.2 }
        }}
        onClick={onClick}
        style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)',
          cursor: 'pointer'
        }}
      >
        <div className="gallery-card-image" style={{
          height: '160px',
          background: colors.gradient,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            opacity: 0.9,
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            borderRadius: '50%',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
          }}>
            {colors.icon}
          </div>
          
          <div className="gallery-card-badge" style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '6px 12px',
            borderRadius: '100px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'capitalize'
          }}>
            {art.auraType}
          </div>
        </div>
        
        <div style={{ padding: '20px' }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#333'
          }}>
            {art.title}
          </h3>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            fontSize: '14px',
            color: '#666',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: colors.gradient,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '8px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {art.username.charAt(0).toUpperCase()}
            </div>
            <span style={{ flex: 1 }}>@{art.username}</span>
            <span style={{ fontSize: '12px', opacity: 0.7 }}>
              {new Date(art.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          {/* Açıklama bölümü (varsa) */}
          {art.description && (
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '12px',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {art.description}
            </div>
          )}
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px'
          }}>
            <div className="gallery-card-tags" style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '100px',
                background: `${colors.light}22`,
                color: colors.light,
                fontSize: '12px',
              }}>
                #{art.auraType}
              </span>
              
              {/* Diğer hashtag'ler (varsa) */}
              {art.hashtags && art.hashtags.slice(0, 2).map((tag, index) => {
                // Aura tipi zaten gösterildiği için tekrar gösterme
                if (tag === art.auraType) return null;
                
                return (
                  <span key={index} style={{
                    padding: '4px 8px',
                    borderRadius: '100px',
                    background: `${colors.light}15`,
                    color: colors.light,
                    fontSize: '12px',
                  }}>
                    #{tag}
                  </span>
                );
              })}
              
              {/* Daha fazla hashtag göstergesi */}
              {art.hashtags && art.hashtags.length > 3 && (
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '100px',
                  background: '#f0f0f0',
                  color: '#999',
                  fontSize: '12px',
                }}>
                  +{art.hashtags.length - 3}
                </span>
              )}
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLike(art.id);
              }}
              disabled={art.likedBy.includes(userId)}
              style={{
                background: art.likedBy.includes(userId) 
                  ? `${colors.light}33` 
                  : 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: art.likedBy.includes(userId) ? 'default' : 'pointer',
                color: art.likedBy.includes(userId) ? colors.light : '#666',
                transition: 'all 0.2s'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={art.likedBy.includes(userId) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span style={{ fontSize: '14px' }}>{art.likes}</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="page-wrapper">
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="flex justify-between items-center">
            <Link to="/" className="gradient-text text-2xl font-bold">Auralize</Link>
            <nav>
              <ul className="flex space-x-6">
                <li><Link to="/" className="nav-link">Ana Sayfa</Link></li>
                <li><Link to="/profile" className="nav-link">Profilim</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <div className="container">
          <div className="gallery-header">
            <h1 className="section-title gradient-text">Aura Galerisi</h1>
            <p className="gallery-subtitle">Topluluk tarafından oluşturulan auralara göz atın ve ilham alın</p>
            
            {/* Admin İşlemleri */}
            {userId && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '20px',
                marginBottom: '20px'
              }}>
                <button 
                  onClick={() => setShowConfirmDialog(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 80, 80, 0.1)',
                    color: '#ff5050',
                    border: '1px solid rgba(255, 80, 80, 0.3)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  Galeriyi Temizle
                </button>
              </div>
            )}
          </div>
          
          {/* Onay Dialogu */}
          {showConfirmDialog && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(5px)'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
              }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  color: '#333',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>Galeriyi Temizle</h3>
                
                <p style={{
                  margin: '0 0 24px 0',
                  color: '#666',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Tüm paylaşılmış auraları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}>
                  <button 
                    onClick={() => setShowConfirmDialog(false)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: '#f0f0f0',
                      color: '#666',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    İptal
                  </button>
                  
                  <button 
                    onClick={clearGallery}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: '#ff5050',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Evet, Temizle
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="gallery-filters" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '40px',
            justifyContent: 'center'
          }}>
            <button 
              onClick={() => setFilter('all')}
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'all' ? 'linear-gradient(135deg, #7C4DFF, #536DFE)' : '#f0f0f0',
                color: filter === 'all' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Tümü
            </button>
            <button 
              onClick={() => setFilter('creative')}
              className={`filter-btn ${filter === 'creative' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'creative' ? 'linear-gradient(135deg, #FF61D2, #FE9090)' : '#f0f0f0',
                color: filter === 'creative' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Yaratıcı
            </button>
            <button 
              onClick={() => setFilter('analytical')}
              className={`filter-btn ${filter === 'analytical' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'analytical' ? 'linear-gradient(135deg, #5B8CFF, #36C5F0)' : '#f0f0f0',
                color: filter === 'analytical' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Analitik
            </button>
            <button 
              onClick={() => setFilter('empathetic')}
              className={`filter-btn ${filter === 'empathetic' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'empathetic' ? 'linear-gradient(135deg, #41D5A8, #30BFDD)' : '#f0f0f0',
                color: filter === 'empathetic' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Empatik
            </button>
            <button 
              onClick={() => setFilter('energetic')}
              className={`filter-btn ${filter === 'energetic' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'energetic' ? 'linear-gradient(135deg, #FFB046, #FF7070)' : '#f0f0f0',
                color: filter === 'energetic' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Enerjik
            </button>
            
            {/* Yeni aura tipleri için filtreler */}
            <button 
              onClick={() => setFilter('mor')}
              className={`filter-btn ${filter === 'mor' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'mor' ? 'linear-gradient(135deg, #9D4EDD, #7B2CBF)' : '#f0f0f0',
                color: filter === 'mor' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Mor
            </button>
            <button 
              onClick={() => setFilter('mavi')}
              className={`filter-btn ${filter === 'mavi' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'mavi' ? 'linear-gradient(135deg, #4361EE, #3A0CA3)' : '#f0f0f0',
                color: filter === 'mavi' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Mavi
            </button>
            <button 
              onClick={() => setFilter('yeşil')}
              className={`filter-btn ${filter === 'yeşil' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'yeşil' ? 'linear-gradient(135deg, #2DC653, #148F77)' : '#f0f0f0',
                color: filter === 'yeşil' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Yeşil
            </button>
            <button 
              onClick={() => setFilter('sarı')}
              className={`filter-btn ${filter === 'sarı' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'sarı' ? 'linear-gradient(135deg, #FFDD00, #FFA200)' : '#f0f0f0',
                color: filter === 'sarı' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sarı
            </button>
            <button 
              onClick={() => setFilter('turuncu')}
              className={`filter-btn ${filter === 'turuncu' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'turuncu' ? 'linear-gradient(135deg, #FF9F1C, #E85D04)' : '#f0f0f0',
                color: filter === 'turuncu' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Turuncu
            </button>
            <button 
              onClick={() => setFilter('kırmızı')}
              className={`filter-btn ${filter === 'kırmızı' ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'kırmızı' ? 'linear-gradient(135deg, #E63946, #A31621)' : '#f0f0f0',
                color: filter === 'kırmızı' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Kırmızı
            </button>
          </div>
          
          {loading ? (
            <div className="gallery-loading">
              <div className="loader">
                <div className="loader-circle"></div>
              </div>
              <p className="loader-text">Auralar Yükleniyor...</p>
            </div>
          ) : (
            <div className="gallery-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '25px',
              marginBottom: '50px'
            }}>
              {filteredArts.map(art => (
                <GalleryItem
                  key={art.id}
                  art={art}
                  userId={userId}
                  onLike={handleLike}
                  onClick={() => handleArtClick(art.id)}
                />
              ))}
            </div>
          )}
          
          {!loading && filteredArts.length === 0 && (
            <div className="no-results" style={{
              textAlign: 'center',
              padding: '60px 20px',
              marginBottom: '40px'
            }}>
              <div className="no-results-icon" style={{
                fontSize: '48px',
                marginBottom: '20px',
                opacity: 0.5
              }}>🔍</div>
              <h3 className="no-results-title" style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '10px',
                color: '#444'
              }}>Sonuç Bulunamadı</h3>
              <p className="no-results-text" style={{
                fontSize: '16px',
                color: '#666',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                {filter === 'all' 
                  ? 'Henüz paylaşılan aura bulunamadı. İlk paylaşımı sen yapabilirsin!' 
                  : 'Bu filtre için sonuç bulunamadı. Lütfen başka bir filtre deneyin.'}
              </p>
            </div>
          )}
          
          <div className="gallery-cta" style={{
            textAlign: 'center',
            marginBottom: '60px'
          }}>
            <Link to="/quiz" className="btn btn-primary" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px 30px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C4DFF, #536DFE)',
              position: 'relative',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 10px 25px rgba(83, 109, 254, 0.3)',
              transition: 'all 0.2s',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              overflow: 'visible'
            }}>
              {/* Buton içeriğini içeren yarı saydam panel */}
              <div style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                zIndex: 1
              }}></div>
              
              {/* Emoji container */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                <span style={{ 
                  fontSize: '22px', 
                  lineHeight: 1,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}>✨</span>
              </div>
              
              {/* Text container */}
              <div style={{
                position: 'relative',
                zIndex: 2
              }}>
                <span style={{ 
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  whiteSpace: 'nowrap'
                }}>Kendi Auranı Oluştur</span>
              </div>
            </Link>
          </div>
        </div>
      </main>
      
      {/* Aura detay modalı */}
      {showArtDetail && currentArt && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={closeDetail}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <motion.div 
            className="aura-detail-modal"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              // Aura tipinin undefined olması durumunda varsayılan değer kullan
              background: currentArt && currentArt.auraType ? (
                currentArt.auraType === 'creative' ? '#FFF6FA' :
                currentArt.auraType === 'analytical' ? '#F0F7FF' :
                currentArt.auraType === 'empathetic' ? '#F0FFF8' :
                currentArt.auraType === 'energetic' ? '#FFF8F0' : '#FFFFFF'
              ) : '#FFFFFF',
              borderRadius: '24px',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '700px',
              height: '85vh', // Sabit yükseklik ver
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 20px 50px ${
                currentArt && currentArt.auraType ? (
                  currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.25)' :
                  currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.25)' :
                  currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.25)' :
                  currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.25)' : 'rgba(0, 0, 0, 0.2)'
                ) : 'rgba(0, 0, 0, 0.2)'
              }`,
              position: 'relative',
              border: `1px solid ${
                currentArt && currentArt.auraType ? (
                  currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.3)' :
                  currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.3)' :
                  currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.3)' :
                  currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.3)' : 'rgba(255, 255, 255, 0.2)'
                ) : 'rgba(255, 255, 255, 0.2)'
              }`
            }}
          >
            {/* Belirgin Kapatma butonu */}
            <button 
              onClick={closeDetail} 
              aria-label="Kapat"
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(255, 255, 255, 0.8)',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#333',
                fontSize: '20px',
                zIndex: 50,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="aura-detail-content" style={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden'
            }}>
              <div 
                className="aura-detail-header" 
                style={{ 
                  position: 'relative', 
                  background: `linear-gradient(135deg, var(--color-${currentArt?.auraType || 'creative'}-light), var(--color-${currentArt?.auraType || 'creative'}-dark))`,
                  padding: '40px 30px 60px',
                  color: 'white',
                  overflow: 'hidden',
                  flex: '0 0 auto'
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  left: '20%', 
                  bottom: '-80px', 
                  width: '300px', 
                  height: '300px', 
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  filter: 'blur(60px)',
                  zIndex: 1
                }}></div>
                
                <div style={{ 
                  position: 'absolute', 
                  right: '-5%', 
                  top: '-20px', 
                  width: '150px', 
                  height: '150px', 
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  filter: 'blur(40px)',
                  zIndex: 1
                }}></div>
                
                <div style={{ position: 'relative', zIndex: 5 }}>
                  <div 
                    className="aura-type-badge"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '8px 16px',
                      borderRadius: '100px',
                      background: 'rgba(255, 255, 255, 0.3)',
                      backdropFilter: 'blur(8px)',
                      marginBottom: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '8px',
                      zIndex: 10
                    }}>
                      <span style={{ 
                        fontSize: '16px', 
                        lineHeight: 1
                      }}>
                        {renderAuraEmoji(currentArt?.auraType)}
                      </span>
                    </div>
                    {(currentArt?.auraType || 'creative').charAt(0).toUpperCase() + (currentArt?.auraType || 'creative').slice(1)} Aura
                  </div>
                  
                  <h2 style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold',
                    margin: '0 0 8px 0',
                    maxWidth: '80%',
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    {currentArt.title}
                  </h2>
                  
                  <p style={{
                    fontSize: '16px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    margin: '0',
                    textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}>
                    <strong>@{currentArt.username}</strong> tarafından oluşturuldu
                  </p>
                </div>
                
                <div style={{
                  position: 'absolute',
                  bottom: '-35px',
                  right: '40px',
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                  zIndex: 20,
                  fontSize: '28px',
                  lineHeight: 1,
                  border: '2px solid rgba(255, 255, 255, 1)'
                }}>
                  {currentArt.auraType === 'creative' && '✨'}
                  {currentArt.auraType === 'analytical' && '🔍'}
                  {currentArt.auraType === 'empathetic' && '💗'}
                  {currentArt.auraType === 'energetic' && '⚡'}
                  {currentArt.auraType === 'mor' && '🔮'}
                  {currentArt.auraType === 'mavi' && '🌊'}
                  {currentArt.auraType === 'yeşil' && '🌿'}
                  {currentArt.auraType === 'sarı' && '☀️'}
                  {currentArt.auraType === 'turuncu' && '🔥'}
                  {currentArt.auraType === 'kırmızı' && '❤️'}
                  {currentArt.auraType === 'indigo' && '🌌'}
                  {currentArt.auraType === 'altın' && '✨'}
                  {currentArt.auraType === 'gümüş' && '🌙'}
                  {currentArt.auraType === 'kristal' && '💎'}
                  {currentArt.auraType === 'gökkuşağı' && '🌈'}
                  {currentArt.auraType === 'beyaz' && '☁️'}
                </div>
              </div>
              
              <div className="aura-detail-body" style={{ 
                padding: '40px 30px', 
                position: 'relative', 
                marginTop: '-20px',
                overflow: 'auto',
                flex: '1 1 auto',
                background: currentArt && currentArt.auraType ? (
                  currentArt.auraType === 'creative' ? '#FFF6FA' :
                  currentArt.auraType === 'analytical' ? '#F0F7FF' :
                  currentArt.auraType === 'empathetic' ? '#F0FFF8' :
                  currentArt.auraType === 'energetic' ? '#FFF8F0' : '#FFFFFF'
                ) : '#FFFFFF',
              }}>
                {/* Sekmeler */}
                <div className="aura-tabs" style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '30px',
                  borderBottom: `2px solid ${
                    currentArt && currentArt.auraType ? (
                      currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.2)' :
                      currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.2)' :
                      currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.2)' :
                      currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                    ) : 'rgba(0, 0, 0, 0.1)'
                  }`,
                  paddingBottom: '10px'
                }}>
                  <button
                    onClick={() => setActiveTab('description')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'description' 
                        ? `linear-gradient(135deg, var(--color-${currentArt?.auraType || 'creative'}-light), var(--color-${currentArt?.auraType || 'creative'}-dark))`
                        : 'transparent',
                      color: activeTab === 'description' ? 'white' : '#666',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      fontSize: '14px'
                    }}
                  >
                    Açıklama
                  </button>
                  <button
                    onClick={() => setActiveTab('story')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'story'
                        ? `linear-gradient(135deg, var(--color-${currentArt?.auraType || 'creative'}-light), var(--color-${currentArt?.auraType || 'creative'}-dark))`
                        : 'transparent',
                      color: activeTab === 'story' ? 'white' : '#666',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      fontSize: '14px'
                    }}
                  >
                    Aura Hikayesi
                  </button>
                  <button
                    onClick={() => setActiveTab('insights')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'insights'
                        ? `linear-gradient(135deg, var(--color-${currentArt?.auraType || 'creative'}-light), var(--color-${currentArt?.auraType || 'creative'}-dark))`
                        : 'transparent',
                      color: activeTab === 'insights' ? 'white' : '#666',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      fontSize: '14px'
                    }}
                  >
                    İç Görüler
                  </button>
                </div>

                {/* Sekme İçerikleri */}
                <div className="aura-tab-content">
                  {activeTab === 'description' && (
                    <div className="aura-detail-card" style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '16px',
                      boxShadow: `0 10px 30px ${
                        currentArt && currentArt.auraType ? (
                          currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.15)' :
                          currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.15)' :
                          currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.15)' :
                          currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.15)' : 'rgba(0, 0, 0, 0.1)'
                        ) : 'rgba(0, 0, 0, 0.1)'
                      }`,
                      padding: '30px',
                      marginBottom: '30px',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${
                        currentArt && currentArt.auraType ? (
                          currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.2)' :
                          currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.2)' :
                          currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.2)' :
                          currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                        ) : 'rgba(0, 0, 0, 0.1)'
                      }`
                    }}>
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          marginBottom: '10px', 
                          color: '#444',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>
                          <span style={{
                            color: `var(--color-${currentArt?.auraType || 'creative'}-dark)`,
                            fontWeight: '700'
                          }}>Aura Açıklaması</span>
                        </h4>
                        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
                          {currentArt?.description || "Bu auranın sahibi henüz bir açıklama eklememiş."}
                        </p>
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          marginBottom: '10px', 
                          color: '#444',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>
                          <span style={{
                            color: `var(--color-${currentArt?.auraType || 'creative'}-dark)`,
                            fontWeight: '700'
                          }}>Etiketler</span>
                        </h4>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {currentArt?.hashtags && currentArt.hashtags.map((tag, index) => (
                            <div key={index} style={{
                              background: `linear-gradient(135deg, var(--color-${currentArt?.auraType || 'creative'}-light)15, var(--color-${currentArt?.auraType || 'creative'}-dark)05)`,
                              padding: '8px 16px',
                              borderRadius: '100px',
                              fontSize: '14px',
                              color: '#444',
                              fontWeight: '500',
                              border: `1px solid var(--color-${currentArt?.auraType || 'creative'}-light)33`
                            }}>
                              #{tag}
                            </div>
                          ))}
                          {(!currentArt?.hashtags || currentArt.hashtags.length === 0) && (
                            <div style={{
                              padding: '8px 16px',
                              borderRadius: '100px',
                              fontSize: '14px',
                              color: '#999',
                              background: '#f0f0f0'
                            }}>
                              Etiket bulunamadı
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'story' && (
                    <div className="aura-detail-card" style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '16px',
                      boxShadow: `0 10px 30px ${
                        currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.15)' :
                        currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.15)' :
                        currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.15)' :
                        currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.15)' : 'rgba(0, 0, 0, 0.1)'
                      }`,
                      padding: '30px',
                      marginBottom: '30px',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${
                        currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.2)' :
                        currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.2)' :
                        currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.2)' :
                        currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                      }`,
                      overflowWrap: 'break-word',
                      maxHeight: 'none',
                      overflow: 'visible'
                    }}>
                      <h4 style={{ 
                        fontSize: '20px', 
                        fontWeight: '600', 
                        marginBottom: '20px', 
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{
                          fontSize: '24px',
                          lineHeight: 1
                        }}>
                          {renderAuraEmoji(currentArt.auraType)}
                        </span>
                        Aura Hikayesi
                        
                        {hasCustomStory && (
                          <span style={{
                            fontSize: '12px',
                            background: 'linear-gradient(135deg, #FF61D2, #7000FF)',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            marginLeft: '8px',
                            fontWeight: 'normal'
                          }}>
                            LLaMA Tarafından Oluşturuldu
                          </span>
                        )}
                      </h4>
                      
                      <div style={{
                        fontSize: '16px',
                        lineHeight: '1.8',
                        color: '#555',
                        marginBottom: '20px'
                      }}>
                        {hasCustomStory ? (
                          // LLaMA tarafından oluşturulan gerçek hikaye
                          <div>
                            {auraStory.split('\n\n').map((paragraph, index) => (
                              <p key={index} style={{ marginBottom: '16px' }}>{paragraph}</p>
                            ))}
                          </div>
                        ) : (
                          // Varsayılan hikayeler
                          <>
                            {currentArt.auraType === 'creative' && (
                              <p>
                                Bu yaratıcı aura, sanatsal ruhun ve yenilikçi düşüncenin bir yansımasıdır. 
                                Renkli ve dinamik bir enerji akışıyla, yaratıcılığın sınırlarını zorlayan 
                                bir ruh hali yansıtır. Her an yeni fikirler üretebilen, ilham verici ve 
                                özgün bir karaktere sahiptir.
                              </p>
                            )}
                            {currentArt.auraType === 'analytical' && (
                              <p>
                                Bu analitik aura, mantıksal düşüncenin ve sistematik yaklaşımın 
                                bir temsilidir. Düzenli ve organize bir enerji akışıyla, detaylara 
                                önem veren ve problem çözme yeteneği yüksek bir ruh hali yansıtır. 
                                Her durumu analiz edebilen, stratejik düşünen ve çözüm odaklı bir 
                                karaktere sahiptir.
                              </p>
                            )}
                            {/* Diğer tüm aura tipleri için benzer kontroller de burada yer alacak */}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'insights' && (
                    <div className="aura-detail-card" style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '16px',
                      boxShadow: `0 10px 30px ${
                        currentArt && currentArt.auraType ? (
                          currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.15)' :
                          currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.15)' :
                          currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.15)' :
                          currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.15)' : 'rgba(0, 0, 0, 0.1)'
                        ) : 'rgba(0, 0, 0, 0.1)'
                      }`,
                      padding: '30px',
                      marginBottom: '30px',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${
                        currentArt && currentArt.auraType ? (
                          currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.2)' :
                          currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.2)' :
                          currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.2)' :
                          currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                        ) : 'rgba(0, 0, 0, 0.1)'
                      }`
                    }}>
                      <h4 style={{ 
                        fontSize: '20px', 
                        fontWeight: '600', 
                        marginBottom: '30px', 
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{
                          fontSize: '24px',
                          lineHeight: 1
                        }}>
                          💡
                        </span>
                        Aura İçgörüleri
                        
                        {(auraStrengths || auraPotential || auraThinking) && (
                          <span style={{
                            fontSize: '12px',
                            background: 'linear-gradient(135deg, #FF61D2, #7000FF)',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            marginLeft: '8px',
                            fontWeight: 'normal'
                          }}>
                            LLaMA Tarafından Oluşturuldu
                          </span>
                        )}
                      </h4>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                      }}>
                        <div style={{
                          padding: '20px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.7)',
                          border: '1px solid rgba(0, 0, 0, 0.05)'
                        }}>
                          <h5 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: `var(--color-${currentArt?.auraType || 'creative'}-dark)`,
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '18px' }}>🌟</span>
                            Güçlü Yönler
                          </h5>
                          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#555' }}>
                            {auraStrengths ? (
                              auraStrengths
                            ) : (
                              currentArt?.auraType === 'creative' ? 
                              "Yenilikçi düşünme, bağlantılar kurma, sezgisel anlayış" :
                              currentArt?.auraType === 'analytical' ? 
                              "Detaylara dikkat, mantıksal düşünme, problem çözme" :
                              currentArt?.auraType === 'empathetic' ? 
                              "Duygusal zeka, dinleme, insanları anlama" :
                              currentArt?.auraType === 'energetic' ? 
                              "İnitiasif alma, tutkulu çalışma, enerji yayma" :
                              currentArt?.auraType === 'mor' ?
                              "Ruhsal farkındalık, yaratıcı vizyon, derin anlayış" :
                              currentArt?.auraType === 'mavi' ?
                              "Sakin iletişim, netlik, güvenilirlik" :
                              currentArt?.auraType === 'yeşil' ?
                              "Şifa, denge, doğayla bağlantı" :
                              currentArt?.auraType === 'sarı' ?
                              "Pozitif düşünce, iyimserlik, entelektüel merak" :
                              "Kendine özgü nitelikler, benzersiz yaklaşım, güçlü karakter"
                            )}
                          </p>
                        </div>

                        <div style={{
                          padding: '20px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.7)',
                          border: '1px solid rgba(0, 0, 0, 0.05)'
                        }}>
                          <h5 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: `var(--color-${currentArt?.auraType || 'creative'}-dark)`,
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '18px' }}>🚀</span>
                            Potansiyel
                          </h5>
                          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#555' }}>
                            {auraPotential ? (
                              auraPotential
                            ) : (
                              currentArt?.auraType === 'creative' ? 
                              "Benzersiz sanat eserleri, orijinal fikirler, yenilikçi çözümler üretme" :
                              currentArt?.auraType === 'analytical' ? 
                              "Karmaşık sistemleri anlama, etkili stratejiler geliştirme, verimli çözümler bulma" :
                              currentArt?.auraType === 'empathetic' ? 
                              "Güçlü ilişkiler kurma, insanları motive etme, duygusal destek sağlama" :
                              currentArt?.auraType === 'energetic' ? 
                              "Zorlu projeleri tamamlama, ekipleri harekete geçirme, hızlı sonuçlar elde etme" :
                              currentArt?.auraType === 'mor' ?
                              "Derin bilgeliğe erişim, manevi rehberlik, dönüştürücü deneyimler" :
                              currentArt?.auraType === 'mavi' ?
                              "Açık ve etkili iletişim, dürüst ilişkiler, güvenilirlik" :
                              currentArt?.auraType === 'yeşil' ?
                              "İyileştirici etki, harmonik ortamlar yaratma, doğayla uyum" :
                              currentArt?.auraType === 'sarı' ?
                              "Pozitif enerji yayma, bilgi paylaşımı, zihinsel netlik" :
                              "Kişisel büyüme, benzersiz yetenek geliştirme, çeşitli alanlarda başarı"
                            )}
                          </p>
                        </div>

                        <div style={{
                          padding: '20px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.7)',
                          border: '1px solid rgba(0, 0, 0, 0.05)'
                        }}>
                          <h5 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: `var(--color-${currentArt?.auraType || 'creative'}-dark)`,
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '18px' }}>🧠</span>
                            Düşünme Tarzı
                          </h5>
                          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#555' }}>
                            {auraThinking ? (
                              auraThinking
                            ) : (
                              currentArt?.auraType === 'creative' ? 
                              "Yanal düşünme, bağlantılar kurma, sınırların dışına çıkma" :
                              currentArt?.auraType === 'analytical' ? 
                              "Sistematik, yapısal, mantıksal ve detaylı düşünme" :
                              currentArt?.auraType === 'empathetic' ? 
                              "Duygusal, sezgisel, ilişkisel ve anlamsal düşünme" :
                              currentArt?.auraType === 'energetic' ? 
                              "Pratik, sonuç odaklı, hızlı ve aksiyon bazlı düşünme" :
                              currentArt?.auraType === 'mor' ?
                              "Sezgisel, ruhsal, içgörüsel, bütünsel düşünme" :
                              currentArt?.auraType === 'mavi' ?
                              "Berrak, akıcı, sistematik, analitik düşünme" :
                              currentArt?.auraType === 'yeşil' ?
                              "Uyumlu, dengeli, doğal, organik düşünme" :
                              currentArt?.auraType === 'sarı' ?
                              "Parlak, pozitif, hızlı, akıl yürütmeci düşünme" :
                              "Özgün, çok yönlü, yaratıcı ve adaptif düşünme"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      <footer className="py-6 px-4 gradient-bg">
        <div className="container">
          <div className="text-center text-white">
            <p>&copy; {new Date().getFullYear()} Auralize - Yaratıcı Auranızı Keşfedin</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Gallery; 