import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface UserProfile {
  username: string;
  userId: string;
  joinDate: Date;
}

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

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userAuras, setUserAuras] = useState<AuraArt[]>([]);
  const [likedAuras, setLikedAuras] = useState<AuraArt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Kullanıcı bilgilerini al
    const getUserProfile = () => {
      const userId = localStorage.getItem('auralize_user_id');
      const username = localStorage.getItem('auralize_username');
      
      if (!userId) {
        setLoading(false);
        return;
      }
      
      // Kullanıcı kayıt tarihini belirle (ilk ziyaret)
      let joinDate = new Date();
      const firstVisitDate = localStorage.getItem('auralize_first_visit');
      
      if (firstVisitDate) {
        joinDate = new Date(firstVisitDate);
      } else {
        localStorage.setItem('auralize_first_visit', joinDate.toISOString());
      }
      
      setProfile({
        userId,
        username: username || 'Anonim Kullanıcı',
        joinDate
      });
      
      // Kullanıcının paylaştığı ve beğendiği auraları bul
      try {
        const aurasString = localStorage.getItem('auralize_shared_auras');
        if (aurasString) {
          const allAuras = JSON.parse(aurasString).map((aura: any) => ({
            ...aura,
            createdAt: new Date(aura.createdAt)
          }));
          
          // Kullanıcının kendi auraları
          const ownAuras = allAuras.filter((aura: AuraArt) => aura.userId === userId);
          setUserAuras(ownAuras);
          
          // Kullanıcının beğendiği diğerlerinin auraları
          const liked = allAuras.filter((aura: AuraArt) => 
            aura.userId !== userId && aura.likedBy.includes(userId)
          );
          setLikedAuras(liked);
        }
      } catch (error) {
        console.error("Aura verileri alınırken hata oluştu:", error);
      }
      
      setLoading(false);
    };
    
    getUserProfile();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Kullanıcı adını değiştirme işlevi
  const handleChangeUsername = () => {
    const newUsername = prompt("Yeni kullanıcı adınızı girin:");
    if (newUsername && newUsername.trim() !== '') {
      localStorage.setItem('auralize_username', newUsername);
      
      if (profile) {
        setProfile({
          ...profile,
          username: newUsername
        });
      }
      
      // Aura paylaşımlarında kullanıcı adını güncelle
      try {
        const aurasString = localStorage.getItem('auralize_shared_auras');
        if (aurasString && profile) {
          const allAuras = JSON.parse(aurasString);
          
          const updatedAuras = allAuras.map((aura: AuraArt) => {
            if (aura.userId === profile.userId) {
              return {
                ...aura,
                username: newUsername
              };
            }
            return aura;
          });
          
          localStorage.setItem('auralize_shared_auras', JSON.stringify(updatedAuras));
        }
      } catch (error) {
        console.error("Kullanıcı adı güncellenirken hata oluştu:", error);
      }
    }
  };
  
  // Aura kart bileşeni
  const AuraCard = ({ aura }: { aura: AuraArt }) => {
    const auraColors = {
      creative: {
        light: '#FF61D2',
        dark: '#FE9090',
        gradient: 'linear-gradient(135deg, #FF61D2, #FE9090)',
        altGradient: 'linear-gradient(to right, #FF61D2 0%, #FE9090 100%)'
      },
      analytical: {
        light: '#5B8CFF',
        dark: '#36C5F0',
        gradient: 'linear-gradient(135deg, #5B8CFF, #36C5F0)',
        altGradient: 'linear-gradient(to right, #5B8CFF 0%, #36C5F0 100%)'
      },
      empathetic: {
        light: '#41D5A8',
        dark: '#30BFDD',
        gradient: 'linear-gradient(135deg, #41D5A8, #30BFDD)',
        altGradient: 'linear-gradient(to right, #41D5A8 0%, #30BFDD 100%)'
      },
      energetic: {
        light: '#FFB046',
        dark: '#FF7070',
        gradient: 'linear-gradient(135deg, #FFB046, #FF7070)',
        altGradient: 'linear-gradient(to right, #FFB046 0%, #FF7070 100%)'
      }
    };

    const colors = auraColors[aura.auraType as keyof typeof auraColors];

    return (
      <motion.div 
        className="modern-aura-card"
        whileHover={{ 
          y: -8, 
          boxShadow: `0 15px 30px rgba(0, 0, 0, 0.08), 0 5px 15px ${colors.light}33` 
        }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.03)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="card-header" style={{
          background: colors.gradient,
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div className="aura-glow" style={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            filter: 'blur(20px)',
            top: '-40px',
            left: '-40px'
          }}></div>
          
          <div className="aura-glow" style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(15px)',
            bottom: '-20px',
            right: '20px'
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span className="aura-type-badge" style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(4px)',
              padding: '4px 12px',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white',
              textTransform: 'capitalize'
            }}>
              {aura.auraType}
            </span>
          </div>
          
          <div style={{ 
            width: '50px', 
            height: '50px', 
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2
          }}>
            <span style={{ fontSize: '24px' }}>
              {aura.auraType === 'creative' && '✨'}
              {aura.auraType === 'analytical' && '🔍'}
              {aura.auraType === 'empathetic' && '💗'}
              {aura.auraType === 'energetic' && '⚡'}
            </span>
          </div>
        </div>
        
        <div className="card-body" style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}>
          <h3 style={{
            margin: '0 0 10px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#333',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {aura.title}
          </h3>
          
          {aura.username && (
            <div className="aura-user" style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px',
              fontSize: '14px',
              color: '#666'
            }}>
              <div style={{
                width: '22px',
                height: '22px',
                background: colors.gradient,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: '600',
                marginRight: '8px'
              }}>
                {aura.username.charAt(0).toUpperCase()}
              </div>
              <span>@{aura.username}</span>
            </div>
          )}
          
          <div className="aura-meta" style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '15px',
            borderTop: '1px solid #f5f5f5'
          }}>
            <div className="aura-date" style={{
              fontSize: '13px',
              color: '#999',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {new Date(aura.createdAt).toLocaleDateString()}
            </div>
            
            {aura.likes > 0 && (
              <div className="aura-likes" style={{
                color: colors.light,
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                {aura.likes}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">
          <div className="loader-circle"></div>
        </div>
        <p className="loader-text">Profiliniz Yükleniyor...</p>
      </div>
    );
  }
  
  return (
    <div className="page-wrapper" style={{ background: '#f9fafc' }}>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="flex justify-between items-center">
            <Link to="/" className="gradient-text text-2xl font-bold">Auralize</Link>
            <nav>
              <ul className="flex space-x-6">
                <li><Link to="/" className="nav-link">Ana Sayfa</Link></li>
                <li><Link to="/gallery" className="nav-link">Galeri</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="main-content" style={{
        padding: '40px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="profile-title section-title" 
          style={{
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '40px',
            textAlign: 'center',
            background: 'linear-gradient(to right, #7C4DFF, #536DFE)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          Profiliniz
        </motion.h1>
        
        {!profile ? (
          <div className="no-profile" style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                ease: [0, 0.71, 0.2, 1.01]
              }}
            >
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 20px' }}>
                <path opacity="0.4" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#7C4DFF"/>
                <path d="M12 6.94995V13.95" stroke="#7C4DFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12.0049 17H12.0139" stroke="#7C4DFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{
                fontSize: '18px',
                color: '#555',
                marginBottom: '30px'
              }}>
                Henüz bir profil oluşturulmamış. Aura testi yaparak profilinizi oluşturabilirsiniz.
              </p>
              <Link to="/quiz" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '12px',
                background: 'linear-gradient(to right, #7C4DFF, #536DFE)',
                color: 'white',
                fontWeight: '600',
                fontSize: '16px',
                textDecoration: 'none',
                boxShadow: '0 10px 20px rgba(124, 77, 255, 0.2)',
                transition: 'all 0.2s'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
                Aura Testine Başla
              </Link>
            </motion.div>
          </div>
        ) : (
          <div className="profile-layout" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 350px) 1fr',
            gap: '30px'
          }}>
            {/* Profil kartı */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="profile-sidebar"
            >
              <div className="profile-card" style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)',
                marginBottom: '20px'
              }}>
                {/* Profil başlık bölümü */}
                <div className="profile-card-header" style={{
                  background: 'linear-gradient(135deg, #7C4DFF, #536DFE)',
                  padding: '30px 20px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Animasyonlu pulsing parlaklık efektleri */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut" 
                    }}
                    style={{
                      position: 'absolute',
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      filter: 'blur(40px)',
                      top: '-50px',
                      right: '-50px'
                    }}
                  />
                  
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0.7, 0.5]
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 4,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                    style={{
                      position: 'absolute',
                      width: '180px',
                      height: '180px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      filter: 'blur(30px)',
                      bottom: '-70px',
                      left: '-30px'
                    }}
                  />
                  
                  <div className="profile-avatar-container" style={{
                    width: '100px',
                    height: '100px',
                    margin: '0 auto 16px',
                    position: 'relative'
                  }}>
                    <motion.div 
                      animate={{ 
                        rotate: 360
                      }} 
                      transition={{ 
                        repeat: Infinity,
                        duration: 20,
                        ease: "linear"
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        borderTopColor: 'rgba(255, 255, 255, 0.8)',
                        borderRightColor: 'rgba(255, 255, 255, 0.5)'
                      }}
                    />
                    
                    <div className="profile-avatar" style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 'calc(100% - 16px)',
                      height: 'calc(100% - 16px)',
                      background: 'linear-gradient(135deg, #9D6FFF, #536DFE)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '36px',
                      fontWeight: '700',
                      boxShadow: '0 5px 15px rgba(124, 77, 255, 0.3)'
                    }}>
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <h2 className="profile-username" style={{
                    margin: '0 0 5px 0',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '22px',
                    position: 'relative'
                  }}>
                    @{profile.username}
                  </h2>
                  
                  <p className="profile-joined" style={{
                    margin: 0,
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    position: 'relative'
                  }}>
                    Üyelik: {profile.joinDate.toLocaleDateString()}
                  </p>
                </div>
                
                <div className="profile-card-body" style={{
                  padding: '20px'
                }}>
                  <button 
                    className="btn-change-username"
                    onClick={handleChangeUsername}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px',
                      background: 'white',
                      border: '1px solid #eee',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#666',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: '20px'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Kullanıcı Adını Değiştir
                  </button>
                  
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#555',
                    margin: '0 0 15px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    İstatistikler
                  </h3>
                  
                  <div className="profile-stats-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px'
                  }}>
                    <div className="profile-stat-card" style={{
                      background: 'linear-gradient(135deg, #FF61D2, #FE9090)',
                      borderRadius: '12px',
                      padding: '15px',
                      textAlign: 'center',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to right, rgba(255, 255, 255, 0.1), transparent)',
                        transform: 'rotate(35deg) translateY(-50%)'
                      }}></div>
                      
                      <div style={{
                        position: 'relative',
                        zIndex: 2
                      }}>
                        <div style={{
                          fontSize: '32px',
                          fontWeight: '700',
                          marginBottom: '5px'
                        }}>
                          {userAuras.length}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          opacity: 0.9
                        }}>
                          Oluşturulan Aura
                        </div>
                      </div>
                    </div>
                    
                    <div className="profile-stat-card" style={{
                      background: 'linear-gradient(135deg, #5B8CFF, #36C5F0)',
                      borderRadius: '12px',
                      padding: '15px',
                      textAlign: 'center',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to right, rgba(255, 255, 255, 0.1), transparent)',
                        transform: 'rotate(35deg) translateY(-50%)'
                      }}></div>
                      
                      <div style={{
                        position: 'relative',
                        zIndex: 2
                      }}>
                        <div style={{
                          fontSize: '32px',
                          fontWeight: '700',
                          marginBottom: '5px'
                        }}>
                          {likedAuras.length}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          opacity: 0.9
                        }}>
                          Beğenilen Aura
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="profile-actions" style={{
                    marginTop: '20px'
                  }}>
                    <Link to="/quiz" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '14px',
                      width: '100%',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #7C4DFF, #536DFE)',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      boxShadow: '0 5px 15px rgba(124, 77, 255, 0.2)',
                      transition: 'all 0.2s'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                      </svg>
                      Yeni Aura Oluştur
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Ana içerik */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="profile-main-content"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '30px'
              }}
            >
              {/* Kullanıcının Auraları */}
              <div className="user-auras-section" style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="section-header" style={{
                  padding: '20px 25px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #FF61D2, #FE9090)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                    </svg>
                  </div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Auranız
                  </h2>
                </div>
                
                <div style={{ padding: '25px' }}>
                  {userAuras.length === 0 ? (
                    <div className="empty-section" style={{
                      padding: '40px 20px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 20px',
                        borderRadius: '50%',
                        background: '#f9f9f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                      </div>
                      <p style={{
                        fontSize: '16px',
                        color: '#888',
                        marginBottom: '25px'
                      }}>
                        Henüz bir aura oluşturmadınız.
                      </p>
                      <Link to="/quiz" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #FF61D2, #FE9090)',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        boxShadow: '0 5px 15px rgba(255, 97, 210, 0.2)'
                      }}>
                        Aura Testi Yap
                      </Link>
                    </div>
                  ) : (
                    <div className="aura-cards" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '20px'
                    }}>
                      {userAuras.map(aura => (
                        <AuraCard key={aura.id} aura={aura} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Beğenilen Auralar */}
              <div className="liked-auras-section" style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="section-header" style={{
                  padding: '20px 25px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #5B8CFF, #36C5F0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Beğendiğiniz Auralar
                  </h2>
                </div>
                
                <div style={{ padding: '25px' }}>
                  {likedAuras.length === 0 ? (
                    <div className="empty-section" style={{
                      padding: '40px 20px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 20px',
                        borderRadius: '50%',
                        background: '#f9f9f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </div>
                      <p style={{
                        fontSize: '16px',
                        color: '#888',
                        marginBottom: '25px'
                      }}>
                        Henüz beğendiğiniz bir aura yok.
                      </p>
                      <Link to="/gallery" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #5B8CFF, #36C5F0)',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        boxShadow: '0 5px 15px rgba(91, 140, 255, 0.2)'
                      }}>
                        Galeriyi Keşfet
                      </Link>
                    </div>
                  ) : (
                    <div className="aura-cards" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '20px'
                    }}>
                      {likedAuras.map(aura => (
                        <AuraCard key={aura.id} aura={aura} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
      
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

export default Profile; 