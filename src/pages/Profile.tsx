import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/Profile.css';

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

// Badge ve oyun istatistikleri için interface'ler
interface AuraBadge {
  id: string;
  type: string; // aura tipi
  level: string; // seviye
  name: string; // formatlanmış isim
  icon: string;
  gradient: string;
  date: Date;
}

interface GameStats {
  highScores: {[key: string]: number};
  totalGames: number;
  totalScore: number;
  lastPlayed: Date | null;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userAuras, setUserAuras] = useState<AuraArt[]>([]);
  const [likedAuras, setLikedAuras] = useState<AuraArt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState(false);
  const [userBadges, setUserBadges] = useState<AuraBadge[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    highScores: {},
    totalGames: 0,
    totalScore: 0,
    lastPlayed: null
  });
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  
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
    
    // Kullanıcı rozet ve oyun istatistiklerini yükle
    const loadGameStats = () => {
      // Rozetleri al
      const badgeIds = JSON.parse(localStorage.getItem('auralize_badges') || '[]');
      
      // Aura tiplerine göre renkler ve simgeleri tanımla
      const auraStyles = {
        creative: {
          gradient: 'linear-gradient(135deg, #FF61D2, #FE9090)',
          icon: '✨'
        },
        analytical: {
          gradient: 'linear-gradient(135deg, #5B8CFF, #36C5F0)',
          icon: '🔍'
        },
        empathetic: {
          gradient: 'linear-gradient(135deg, #41D5A8, #30BFDD)',
          icon: '💗'
        },
        energetic: {
          gradient: 'linear-gradient(135deg, #FFB046, #FF7070)',
          icon: '⚡'
        }
      };
      
      // Rozet seviyelerinin adları
      const levelNames = {
        novice: 'Başlangıç',
        adept: 'İleri Seviye',
        expert: 'Uzman',
        master: 'Usta'
      };
      
      // Aura tiplerinin adları
      const typeNames = {
        creative: 'Yaratıcı Aura',
        analytical: 'Analitik Aura',
        empathetic: 'Empatik Aura',
        energetic: 'Enerjik Aura'
      };
      
      // Rozetleri işle
      const processedBadges = badgeIds.map((badgeId: string) => {
        const [type, level] = badgeId.split('_');
        
        return {
          id: badgeId,
          type,
          level,
          name: `${typeNames[type as keyof typeof typeNames]} ${levelNames[level as keyof typeof levelNames]}`,
          icon: auraStyles[type as keyof typeof auraStyles]?.icon || '🏆',
          gradient: auraStyles[type as keyof typeof auraStyles]?.gradient || 'linear-gradient(135deg, #aaa, #666)',
          date: new Date() // Gerçek projede kaydetme tarihi kullanılabilir
        };
      });
      
      setUserBadges(processedBadges);
      
      // Oyun istatistiklerini al
      const highScores = {
        creative: parseInt(localStorage.getItem('auralize_game_highscore_creative') || '0'),
        analytical: parseInt(localStorage.getItem('auralize_game_highscore_analytical') || '0'),
        empathetic: parseInt(localStorage.getItem('auralize_game_highscore_empathetic') || '0'),
        energetic: parseInt(localStorage.getItem('auralize_game_highscore_energetic') || '0')
      };
      
      // Son oynanma tarihini al
      const lastPlayedStr = localStorage.getItem('auralize_game_last_played');
      
      // Toplam skor
      const totalScore = Object.values(highScores).reduce((sum, score) => sum + score, 0);
      
      // Oyun istatistiklerini ayarla
      setGameStats({
        highScores,
        totalGames: parseInt(localStorage.getItem('auralize_game_total_plays') || '0'),
        totalScore,
        lastPlayed: lastPlayedStr ? new Date(lastPlayedStr) : null
      });
    };
    
    getUserProfile();
    
    // Rozet ve oyun istatistiklerini yükle
    loadGameStats();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Kullanıcı adını değiştirme işlevi
  const handleChangeUsername = () => {
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
      
      setShowUsernameModal(false);
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
        className="aura-card"
        whileHover={{ 
          y: -8, 
          boxShadow: `0 15px 30px rgba(0, 0, 0, 0.08), 0 5px 15px ${colors.light}33` 
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="aura-card-header" style={{ background: colors.gradient }}>
          <div className="aura-type-badge">
            {aura.auraType}
          </div>
          <div className="aura-icon">
            <span>
              {aura.auraType === 'creative' && '✨'}
              {aura.auraType === 'analytical' && '🔍'}
              {aura.auraType === 'empathetic' && '💗'}
              {aura.auraType === 'energetic' && '⚡'}
            </span>
          </div>
        </div>
        
        <div className="aura-card-body">
          <h3 className="aura-title">{aura.title}</h3>
          
          {aura.username && (
            <div className="aura-user">
              <div className="aura-user-avatar" style={{ background: colors.gradient }}>
                {aura.username.charAt(0).toUpperCase()}
              </div>
              <span>@{aura.username}</span>
            </div>
          )}
          
          <div className="aura-meta">
            <div className="aura-date">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {new Date(aura.createdAt).toLocaleDateString()}
            </div>
            
            {aura.likes > 0 && (
              <div className="aura-likes" style={{ color: colors.light }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="profile-page">
      <header className={`profile-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="navbar-content">
            <Link to="/" className="navbar-logo">
              Auralize
              <span className="logo-particle">✨</span>
            </Link>
            <nav className="navbar-nav">
              <ul className="nav-list">
                <li><Link to="/gallery" className="nav-link">Galeri</Link></li>
                <li><Link to="/profile" className="nav-link active">Profilim</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="profile-content">
        <div className="container">
          <section className="profile-hero">
            <div className="profile-hero-content">
              <div className="profile-avatar">
                <div className="avatar-inner">
                  {profile?.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="profile-info">
                <div className="username-container">
                  <h1 className="profile-username">{profile?.username}</h1>
                  <button 
                    className="edit-username-button"
                    onClick={() => setShowUsernameModal(true)}
                    aria-label="Kullanıcı adını düzenle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </div>
                <div className="profile-metrics">
                  <div className="metric-item">
                    <span className="metric-value">{userAuras.length}</span>
                    <span className="metric-label">Aura</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-value">{userBadges.length}</span>
                    <span className="metric-label">Rozet</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-value">
                      {profile?.joinDate 
                        ? new Date(profile.joinDate).toLocaleDateString('tr-TR', { 
                            year: 'numeric', 
                            month: 'short'
                          })
                        : 'Bilinmiyor'}
                    </span>
                    <span className="metric-label">Katılım</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="auras-section">
            <div className="section-header">
              <h2 className="section-title">Auralarım</h2>
              <Link to="/quiz" className="action-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Yeni Aura Oluştur
              </Link>
            </div>

            {userAuras.length > 0 ? (
              <div className="auras-grid">
                {userAuras.map(aura => (
                  <AuraCard key={aura.id} aura={aura} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Henüz bir aura oluşturmadınız.</p>
                <Link to="/quiz" className="primary-button">
                  İlk Auranı Oluştur
                </Link>
              </div>
            )}
          </section>
          
          {/* Rozet ve Oyun İstatistikleri Bölümü */}
          <section className="achievements-section">
            <div className="section-header">
              <h2 className="section-title">Aura Oyun Başarıları</h2>
              <p className="section-subtitle">Aura kristallerini toplayarak kazandığın rozetler ve istatistikler</p>
            </div>

            {userBadges.length > 0 ? (
              <>
                <div className="badges-container">
                  <div className="container-header">
                    <h3>Kazanılan Rozetler</h3>
                    <span className="badge-counter">{userBadges.length}</span>
                  </div>
                  <div className="badges-grid">
                    {userBadges.map(badge => (
                      <motion.div
                        key={badge.id}
                        className="badge-item"
                        whileHover={{ scale: 1.05 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="badge-icon" style={{ background: badge.gradient }}>
                          <span>{badge.icon}</span>
                        </div>
                        <div className="badge-details">
                          <h4>{badge.name}</h4>
                          <p>
                            {badge.date.toLocaleDateString('tr-TR', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="game-stats">
                  <h3>Oyun İstatistikleri</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-header">Toplam Skor</div>
                      <div className="stat-value">{gameStats.totalScore}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-header">Toplam Oyun</div>
                      <div className="stat-value">{gameStats.totalGames}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-header">Son Oynanma</div>
                      <div className="stat-value">
                        {gameStats.lastPlayed 
                          ? gameStats.lastPlayed.toLocaleDateString('tr-TR') 
                          : 'Henüz oynanmadı'}
                      </div>
                    </div>
                  </div>

                  <div className="high-scores">
                    <h3>En Yüksek Skorlar</h3>
                    <div className="high-scores-grid">
                      {Object.entries(gameStats.highScores).map(([type, score]) => {
                        const auraStyles = {
                          creative: {
                            gradient: 'linear-gradient(135deg, #FF61D2, #FE9090)',
                            icon: '✨',
                            name: 'Yaratıcı Aura'
                          },
                          analytical: {
                            gradient: 'linear-gradient(135deg, #5B8CFF, #36C5F0)',
                            icon: '🔍',
                            name: 'Analitik Aura'
                          },
                          empathetic: {
                            gradient: 'linear-gradient(135deg, #41D5A8, #30BFDD)',
                            icon: '💗',
                            name: 'Empatik Aura'
                          },
                          energetic: {
                            gradient: 'linear-gradient(135deg, #FFB046, #FF7070)',
                            icon: '⚡',
                            name: 'Enerjik Aura'
                          }
                        };
                        
                        const auraStyle = auraStyles[type as keyof typeof auraStyles];
                        
                        return (
                          <div key={type} className="high-score-item">
                            <div 
                              className="high-score-icon"
                              style={{ background: auraStyle?.gradient }}
                            >
                              <span>{auraStyle?.icon}</span>
                            </div>
                            <div className="high-score-details">
                              <div className="high-score-type">{auraStyle?.name}</div>
                              <div className="high-score-number">{score}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>Henüz rozet kazanmadın</h3>
                <p>Aura kristallerini toplayarak rozetler kazanabilirsin!</p>
                <Link to="/aura-game" className="primary-button">
                  🎮 Oyunu Dene
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Auralize<span>✨</span></h3>
              <p>Yaratıcı Auranızı Keşfedin</p>
            </div>
            
            <div className="footer-links">
              <a href="#" className="footer-link">Hakkımızda</a>
              <a href="#" className="footer-link">Blog</a>
              <a href="#" className="footer-link">Gizlilik</a>
              <a href="#" className="footer-link">İletişim</a>
            </div>
          </div>
          
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} Auralize - Tüm Hakları Saklıdır.</p>
          </div>
        </div>
      </footer>

      {/* Kullanıcı adı değiştirme modalı */}
      {showUsernameModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Kullanıcı Adını Değiştir</h3>
              <button 
                className="modal-close"
                onClick={() => setShowUsernameModal(false)}
                aria-label="Kapat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Yeni kullanıcı adı"
                className="username-input"
              />
              
              <div className="modal-actions">
                <button 
                  className="secondary-button"
                  onClick={() => setShowUsernameModal(false)}
                >
                  İptal
                </button>
                <button 
                  className="primary-button"
                  onClick={handleChangeUsername}
                  disabled={newUsername.trim() === '' || newUsername === profile?.username}
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 