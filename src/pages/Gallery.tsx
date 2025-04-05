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
}

const Gallery: React.FC = () => {
  const [auraArts, setAuraArts] = useState<AuraArt[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [showArtDetail, setShowArtDetail] = useState<string | null>(null);
  const [currentArt, setCurrentArt] = useState<AuraArt | null>(null);
  const navigate = useNavigate();
  
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
    
    // CSS değişkenlerini belirle
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
    }
  };
  
  const closeDetail = () => {
    setShowArtDetail(null);
    setCurrentArt(null);
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
      }
    };

    const colors = auraColors[art.auraType as keyof typeof auraColors];

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
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px'
          }}>
            <div className="gallery-card-tags" style={{
              display: 'flex',
              gap: '6px'
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
          </div>
          
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
              background: currentArt.auraType === 'creative' ? '#FFF6FA' :
                        currentArt.auraType === 'analytical' ? '#F0F7FF' :
                        currentArt.auraType === 'empathetic' ? '#F0FFF8' :
                        currentArt.auraType === 'energetic' ? '#FFF8F0' : '#FFFFFF',
              borderRadius: '24px',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '85vh',
              boxShadow: `0 20px 50px ${
                currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.25)' :
                currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.25)' :
                currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.25)' :
                currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.25)' : 'rgba(0, 0, 0, 0.2)'
              }`,
              position: 'relative',
              border: `1px solid ${
                currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.3)' :
                currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.3)' :
                currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.3)' :
                currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.3)' : 'rgba(255, 255, 255, 0.2)'
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

            <div className="aura-detail-content" style={{ display: 'flex', flexDirection: 'column' }}>
              <div 
                className="aura-detail-header" 
                style={{ 
                  position: 'relative', 
                  background: `linear-gradient(135deg, var(--color-${currentArt.auraType}-light), var(--color-${currentArt.auraType}-dark))`,
                  padding: '40px 30px 60px',
                  color: 'white',
                  overflow: 'hidden'
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
                        {currentArt.auraType === 'creative' && '✨'}
                        {currentArt.auraType === 'analytical' && '🔍'}
                        {currentArt.auraType === 'empathetic' && '💗'}
                        {currentArt.auraType === 'energetic' && '⚡'}
                      </span>
                    </div>
                    {currentArt.auraType.charAt(0).toUpperCase() + currentArt.auraType.slice(1)} Aura
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
                </div>
              </div>
              
              <div className="aura-detail-body" style={{ 
                padding: '40px 30px', 
                position: 'relative', 
                marginTop: '-20px',
                overflow: 'auto',
                background: currentArt.auraType === 'creative' ? '#FFF6FA' :
                          currentArt.auraType === 'analytical' ? '#F0F7FF' :
                          currentArt.auraType === 'empathetic' ? '#F0FFF8' :
                          currentArt.auraType === 'energetic' ? '#FFF8F0' : '#FFFFFF',
              }}>
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
                  }`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, var(--color-${currentArt.auraType}-light), var(--color-${currentArt.auraType}-dark))`,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      boxShadow: `0 5px 15px rgba(0, 0, 0, 0.2)`
                    }}>
                      {currentArt.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div style={{ marginLeft: '15px' }}>
                      <h3 style={{ 
                        margin: '0 0 4px 0', 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        <span>@{currentArt.username}</span>
                      </h3>
                      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        {new Date(currentArt.createdAt).toLocaleDateString()} • 
                        {new Date(currentArt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div style={{ marginLeft: 'auto' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: `linear-gradient(135deg, var(--color-${currentArt.auraType}-light)33, var(--color-${currentArt.auraType}-dark)22)`,
                        padding: '8px 16px',
                        borderRadius: '100px',
                        color: `var(--color-${currentArt.auraType}-dark)`,
                        fontWeight: '500',
                        border: `1px solid var(--color-${currentArt.auraType}-light)33`
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {currentArt.likes} beğeni
                      </div>
                    </div>
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
                        color: `var(--color-${currentArt.auraType}-dark)`,
                        fontWeight: '700'
                      }}>Aura Açıklaması</span>
                    </h4>
                    <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
                      Bu aura <strong style={{ 
                        color: `var(--color-${currentArt.auraType}-dark)` 
                      }}>{currentArt.auraType.charAt(0).toUpperCase() + currentArt.auraType.slice(1)}</strong> özellikleri taşıyor.
                      {currentArt.auraType === 'creative' && ' Yaratıcılık ve ilham ile parlıyor. Yenilikçi fikirlerle dolu bir ruh hali yansıtıyor.'}
                      {currentArt.auraType === 'analytical' && ' Mantık ve düzen ile parlıyor. Detaylara dikkat eden, problem çözücü bir ruh hali yansıtıyor.'}
                      {currentArt.auraType === 'empathetic' && ' Merhamet ve anlayış ile parlıyor. Duygusal zekanın yüksek olduğu bir ruh hali yansıtıyor.'}
                      {currentArt.auraType === 'energetic' && ' Dinamizm ve canlılık ile parlıyor. Enerjik ve hareketli bir ruh hali yansıtıyor.'}
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
                        color: `var(--color-${currentArt.auraType}-dark)`,
                        fontWeight: '700'
                      }}>Özellikler</span>
                    </h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{
                        background: `linear-gradient(135deg, var(--color-${currentArt.auraType}-light)15, var(--color-${currentArt.auraType}-dark)05)`,
                        padding: '12px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#444',
                        fontWeight: '500',
                        border: `1px solid var(--color-${currentArt.auraType}-light)33`
                      }}>
                        <span style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          background: `linear-gradient(135deg, var(--color-${currentArt.auraType}-light), var(--color-${currentArt.auraType}-dark))`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          marginRight: '8px',
                          fontSize: '12px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          zIndex: 2
                        }}>
                          {currentArt.auraType === 'creative' && '🎨'}
                          {currentArt.auraType === 'analytical' && '🧠'}
                          {currentArt.auraType === 'empathetic' && '❤️'}
                          {currentArt.auraType === 'energetic' && '🔥'}
                        </span>
                        {currentArt.auraType === 'creative' && 'Yaratıcı düşünme'}
                        {currentArt.auraType === 'analytical' && 'Analitik düşünme'}
                        {currentArt.auraType === 'empathetic' && 'Duygusal zeka'}
                        {currentArt.auraType === 'energetic' && 'Yüksek enerji'}
                      </div>
                      
                      <div style={{
                        background: `linear-gradient(135deg, var(--color-${currentArt.auraType}-light)15, var(--color-${currentArt.auraType}-dark)05)`,
                        padding: '12px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#444',
                        fontWeight: '500',
                        border: `1px solid var(--color-${currentArt.auraType}-light)33`
                      }}>
                        <span style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          background: `linear-gradient(135deg, var(--color-${currentArt.auraType}-light), var(--color-${currentArt.auraType}-dark))`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          marginRight: '8px',
                          fontSize: '12px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          zIndex: 2
                        }}>
                          {currentArt.auraType === 'creative' && '✨'}
                          {currentArt.auraType === 'analytical' && '🔍'}
                          {currentArt.auraType === 'empathetic' && '🤝'}
                          {currentArt.auraType === 'energetic' && '⚡'}
                        </span>
                        {currentArt.auraType === 'creative' && 'İnovasyon'}
                        {currentArt.auraType === 'analytical' && 'Problem çözme'}
                        {currentArt.auraType === 'empathetic' && 'İletişim yeteneği'}
                        {currentArt.auraType === 'energetic' && 'Dinamizm'}
                      </div>
                      
                      <div style={{
                        background: `linear-gradient(135deg, var(--color-${currentArt.auraType}-light)15, var(--color-${currentArt.auraType}-dark)05)`,
                        padding: '12px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#444',
                        fontWeight: '500',
                        border: `1px solid var(--color-${currentArt.auraType}-light)33`
                      }}>
                        <span style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          background: `linear-gradient(135deg, var(--color-${currentArt.auraType}-light), var(--color-${currentArt.auraType}-dark))`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          marginRight: '8px',
                          fontSize: '12px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          zIndex: 2
                        }}>
                          {currentArt.auraType === 'creative' && '🌈'}
                          {currentArt.auraType === 'analytical' && '📊'}
                          {currentArt.auraType === 'empathetic' && '💗'}
                          {currentArt.auraType === 'energetic' && '🚀'}
                        </span>
                        {currentArt.auraType === 'creative' && 'Hayal gücü'}
                        {currentArt.auraType === 'analytical' && 'Detaylara önem'}
                        {currentArt.auraType === 'empathetic' && 'Empati yeteneği'}
                        {currentArt.auraType === 'energetic' && 'Hız ve çeviklik'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="aura-detail-actions" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '20px'
                }}>
                  <motion.button 
                    onClick={() => handleLike(currentArt.id)} 
                    className={`btn ${currentArt.likedBy.includes(userId) ? 'btn-liked' : 'btn-like'}`}
                    disabled={currentArt.likedBy.includes(userId)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      background: currentArt.likedBy.includes(userId) 
                        ? `var(--color-${currentArt.auraType}-light)22` 
                        : 'rgba(255, 255, 255, 0.8)',
                      color: currentArt.likedBy.includes(userId) 
                        ? `var(--color-${currentArt.auraType}-dark)` 
                        : '#555',
                      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)',
                      cursor: currentArt.likedBy.includes(userId) ? 'default' : 'pointer',
                      fontSize: '15px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      border: `1px solid ${
                        currentArt.likedBy.includes(userId) 
                          ? `var(--color-${currentArt.auraType}-light)33` 
                          : 'rgba(0, 0, 0, 0.1)'
                      }`
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={currentArt.likedBy.includes(userId) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>{currentArt.likedBy.includes(userId) ? 'Beğenildi' : 'Beğen'}</span>
                  </motion.button>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/quiz" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '14px 24px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, var(--color-${currentArt.auraType}-light), var(--color-${currentArt.auraType}-dark))`,
                      position: 'relative',
                      color: 'white',
                      textDecoration: 'none',
                      boxShadow: `0 8px 20px ${
                        currentArt.auraType === 'creative' ? 'rgba(254, 144, 144, 0.3)' :
                        currentArt.auraType === 'analytical' ? 'rgba(91, 140, 255, 0.3)' :
                        currentArt.auraType === 'empathetic' ? 'rgba(65, 213, 168, 0.3)' :
                        currentArt.auraType === 'energetic' ? 'rgba(255, 176, 70, 0.3)' : 'rgba(0, 0, 0, 0.2)'
                      }`,
                      fontSize: '15px',
                      fontWeight: '600',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      overflow: 'visible'
                    }}>
                      <span style={{ 
                        fontSize: '20px', 
                        lineHeight: 1
                      }}>✨</span>
                      <span>Kendi Auranı Oluştur</span>
                    </Link>
                  </motion.div>
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