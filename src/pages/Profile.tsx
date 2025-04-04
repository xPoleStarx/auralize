import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface UserProfile {
  username: string;
  auraType: string;
  joinDate: Date;
  createdArts: number;
  badges: {
    id: string;
    name: string;
    icon: string;
    description: string;
  }[];
  recentActivities: {
    id: string;
    action: string;
    date: Date;
  }[];
}

// Örnek kullanıcı profili
const dummyProfile: UserProfile = {
  username: 'AuraSever42',
  auraType: 'creative',
  joinDate: new Date('2024-02-15'),
  createdArts: 7,
  badges: [
    {
      id: 'badge1',
      name: 'İlk Aura',
      icon: '🎨',
      description: 'İlk auranızı oluşturdunuz!'
    },
    {
      id: 'badge2',
      name: 'Galeri Keşfi',
      icon: '🔍',
      description: 'Galeriyi keşfettiniz!'
    },
    {
      id: 'badge3',
      name: 'Beğeni Uzmanı',
      icon: '❤️',
      description: '10 aura çalışmasını beğendiniz!'
    }
  ],
  recentActivities: [
    {
      id: 'act1',
      action: 'Analitik aura oluşturuldu',
      date: new Date('2024-03-25')
    },
    {
      id: 'act2',
      action: '"Düşünce Bulutu" çalışmasını beğendiniz',
      date: new Date('2024-03-24')
    },
    {
      id: 'act3',
      action: 'Yaratıcı aura oluşturuldu',
      date: new Date('2024-03-22')
    },
    {
      id: 'act4',
      action: 'Empatik aura oluşturuldu',
      date: new Date('2024-03-18')
    }
  ]
};

// Aura Evolution zaman çizelgesi
const auraEvolution = [
  {
    id: 'ev1',
    date: new Date('2024-02-20'),
    type: 'creative',
    image: 'https://via.placeholder.com/100x100/8F43EE/FFFFFF?text=V1'
  },
  {
    id: 'ev2',
    date: new Date('2024-02-28'),
    type: 'creative',
    image: 'https://via.placeholder.com/100x100/9B59B6/FFFFFF?text=V2'
  },
  {
    id: 'ev3',
    date: new Date('2024-03-10'),
    type: 'empathetic',
    image: 'https://via.placeholder.com/100x100/41D5A8/FFFFFF?text=V3'
  },
  {
    id: 'ev4',
    date: new Date('2024-03-18'),
    type: 'analytical',
    image: 'https://via.placeholder.com/100x100/5B8FF9/FFFFFF?text=V4'
  },
  {
    id: 'ev5',
    date: new Date('2024-03-25'),
    type: 'creative',
    image: 'https://via.placeholder.com/100x100/A64BF4/FFFFFF?text=V5'
  }
];

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [evolution, setEvolution] = useState<any[]>([]);
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
    
    // API'den veri çekme simülasyonu
    setTimeout(() => {
      setProfile(dummyProfile);
      setEvolution(auraEvolution);
      setLoading(false);
    }, 800);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
    <div className="page-wrapper">
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
      
      <main className="main-content">
        <div className="container">
          <h1 className="profile-title section-title gradient-text">Profil Sayfanız</h1>
          
          <div className="profile-layout">
            {/* Profil kartı */}
            <div className="profile-card card">
              <div className="profile-card-header">
                <div className="profile-avatar">
                  {profile?.username.charAt(0).toUpperCase()}
                </div>
                <h2 className="profile-username">{profile?.username}</h2>
                <p className="profile-joined">Üyelik: {profile?.joinDate.toLocaleDateString()}</p>
                <div className="profile-aura-badge">
                  <span className="capitalize">{profile?.auraType} Aura</span>
                </div>
              </div>
              
              <div className="profile-stats">
                <h3 className="profile-section-title">İstatistikler</h3>
                <div className="profile-stats-grid">
                  <div className="profile-stat-card">
                    <span className="profile-stat-value">{profile?.createdArts}</span>
                    <span className="profile-stat-label">Oluşturulan Aura</span>
                  </div>
                  <div className="profile-stat-card">
                    <span className="profile-stat-value">{profile?.badges.length}</span>
                    <span className="profile-stat-label">Rozet</span>
                  </div>
                </div>
              </div>
              
              <div className="profile-badges">
                <h3 className="profile-section-title">Rozetler</h3>
                <div className="profile-badges-grid">
                  {profile?.badges.map(badge => (
                    <div key={badge.id} className="profile-badge-card" title={badge.description}>
                      <span className="profile-badge-icon">{badge.icon}</span>
                      <span className="profile-badge-name">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Ana içerik */}
            <div className="profile-main-content">
              {/* Aura Evolution */}
              <div className="aura-evolution card">
                <h2 className="aura-evolution-title">Aura Evriminiz</h2>
                
                <div className="aura-timeline">
                  <div className="aura-timeline-line"></div>
                  
                  {evolution.map((ev, index) => (
                    <div key={ev.id} className="aura-timeline-item">
                      <div className="aura-timeline-point">
                        <img 
                          src={ev.image} 
                          alt={`Evolution ${index + 1}`} 
                          className="aura-timeline-image" 
                        />
                      </div>
                      <div className="aura-timeline-content">
                        <h3 className="aura-timeline-title">{`Aura v${index + 1}`}</h3>
                        <p className="aura-timeline-date">
                          {ev.date.toLocaleDateString()} • <span className="capitalize">{ev.type} Aura</span>
                        </p>
                        {index < evolution.length - 1 && (
                          <p className="aura-timeline-evolution">
                            {
                              ev.type !== evolution[index + 1].type 
                                ? `${ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}'den ${evolution[index + 1].type.charAt(0).toUpperCase() + evolution[index + 1].type.slice(1)}'e dönüşüm` 
                                : 'Auranız gelişiyor'
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="aura-evolution-cta">
                  <Link to="/quiz" className="btn btn-primary">
                    Yeni Aura Oluştur
                  </Link>
                </div>
              </div>
              
              {/* Aktiviteler */}
              <div className="activities card">
                <h2 className="activities-title">Son Aktiviteler</h2>
                
                <div className="activities-list">
                  {profile?.recentActivities.map(activity => (
                    <div key={activity.id} className="activity-item">
                      <p className="activity-text">{activity.action}</p>
                      <span className="activity-date">{activity.date.toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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