import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface AuraArt {
  id: string;
  title: string;
  image: string;
  type: string;
  username: string;
  likes: number;
  createdAt: Date;
}

// Örnek galeri öğeleri
const dummyAuraArts: AuraArt[] = [
  {
    id: '1',
    title: 'Yaratıcı Harmoni',
    image: 'https://via.placeholder.com/400x400/FF5E5B/FFFFFF?text=Yaratıcı+Aura',
    type: 'creative',
    username: 'sanatçı123',
    likes: 245,
    createdAt: new Date('2024-03-15')
  },
  {
    id: '2',
    title: 'Analitik Düşünce',
    image: 'https://via.placeholder.com/400x400/5B8FF9/FFFFFF?text=Analitik+Aura',
    type: 'analytical',
    username: 'düşünür42',
    likes: 187,
    createdAt: new Date('2024-03-18')
  },
  {
    id: '3',
    title: 'Ruhun Merhameti',
    image: 'https://via.placeholder.com/400x400/41D5A8/FFFFFF?text=Empatik+Aura',
    type: 'empathetic',
    username: 'iyiliksever',
    likes: 322,
    createdAt: new Date('2024-03-10')
  },
  {
    id: '4',
    title: 'Sonsuz Enerji',
    image: 'https://via.placeholder.com/400x400/FFB046/FFFFFF?text=Enerjik+Aura',
    type: 'energetic',
    username: 'hareketli78',
    likes: 198,
    createdAt: new Date('2024-03-20')
  },
  {
    id: '5',
    title: 'Düşünce Bulutu',
    image: 'https://via.placeholder.com/400x400/8F43EE/FFFFFF?text=Yaratıcı+Aura',
    type: 'creative',
    username: 'hayal_gücü',
    likes: 276,
    createdAt: new Date('2024-03-12')
  },
  {
    id: '6',
    title: 'Mantık Diyarı',
    image: 'https://via.placeholder.com/400x400/4285F4/FFFFFF?text=Analitik+Aura',
    type: 'analytical',
    username: 'akıl_yürütme',
    likes: 154,
    createdAt: new Date('2024-03-22')
  }
];

const Gallery: React.FC = () => {
  const [auraArts, setAuraArts] = useState<AuraArt[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState(false);
  
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
    
    // API'den veri çekme simülasyonu
    setTimeout(() => {
      setAuraArts(dummyAuraArts);
      setLoading(false);
    }, 1000);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const filteredArts = filter === 'all'
    ? auraArts
    : auraArts.filter(art => art.type === filter);
    
  const handleLike = (id: string) => {
    setAuraArts(prev => 
      prev.map(art => 
        art.id === id 
          ? { ...art, likes: art.likes + 1 } 
          : art
      )
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
          
          <div className="gallery-filters">
            <button 
              onClick={() => setFilter('all')}
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            >
              Tümü
            </button>
            <button 
              onClick={() => setFilter('creative')}
              className={`filter-btn ${filter === 'creative' ? 'active' : ''}`}
            >
              Yaratıcı
            </button>
            <button 
              onClick={() => setFilter('analytical')}
              className={`filter-btn ${filter === 'analytical' ? 'active' : ''}`}
            >
              Analitik
            </button>
            <button 
              onClick={() => setFilter('empathetic')}
              className={`filter-btn ${filter === 'empathetic' ? 'active' : ''}`}
            >
              Empatik
            </button>
            <button 
              onClick={() => setFilter('energetic')}
              className={`filter-btn ${filter === 'energetic' ? 'active' : ''}`}
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
            <div className="gallery-grid">
              {filteredArts.map(art => (
                <div key={art.id} className="gallery-item hover-lift">
                  <div className="gallery-item-image-container">
                    <img src={art.image} alt={art.title} className="gallery-item-image" />
                    <div className={`gallery-item-type ${art.type}`}>
                      {art.type.charAt(0).toUpperCase() + art.type.slice(1)}
                    </div>
                  </div>
                  <div className="gallery-item-content">
                    <h3 className="gallery-item-title">{art.title}</h3>
                    <div className="gallery-item-meta">
                      <span className="gallery-item-username">@{art.username}</span>
                      <span className="gallery-item-date">{art.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="gallery-item-actions">
                      <button 
                        onClick={() => handleLike(art.id)} 
                        className="like-button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>{art.likes}</span>
                      </button>
                      <button className="share-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3"></circle>
                          <circle cx="6" cy="12" r="3"></circle>
                          <circle cx="18" cy="19" r="3"></circle>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && filteredArts.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3 className="no-results-title">Sonuç Bulunamadı</h3>
              <p className="no-results-text">Bu filtre için sonuç bulunamadı. Lütfen başka bir filtre deneyin.</p>
            </div>
          )}
          
          <div className="gallery-cta">
            <Link to="/quiz" className="btn btn-primary">
              Kendi Auranı Oluştur
            </Link>
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

export default Gallery; 