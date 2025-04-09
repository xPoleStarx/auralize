import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Particle efekti için komponent
const ParticleBackground = () => {
  return (
    <div className="particle-container">
      {[...Array(20)].map((_, index) => (
        <div 
          key={index}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 20 + 5}px`,
            height: `${Math.random() * 20 + 5}px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 10 + 10}s`
          }}
        />
      ))}
    </div>
  );
};

// Dalgalı SVG komponent
const WaveSvg = () => {
  return (
    <div className="wave-container">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="wave">
        <path
          fill="#ffffff"
          fillOpacity="0.9"
          d="M0,64L48,80C96,96,192,128,288,138.7C384,149,480,139,576,122.7C672,107,768,85,864,96C960,107,1056,149,1152,154.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </div>
  );
};

// Özellik kartı komponenti
const FeatureCard = ({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) => {
  return (
    <motion.div 
      className="feature-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay }}
      viewport={{ once: true }}
    >
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </motion.div>
  );
};

const Home: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  // Sayfa kaydırıldığında header'ın görünümünü değiştiren fonksiyon
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animasyon varyantları
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: "easeOut"
      }
    })
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="home-background">
        <div className="gradient-orb orb1"></div>
        <div className="gradient-orb orb2"></div>
        <ParticleBackground />
      </div>
      
      <header className={`header home-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="flex justify-between items-center">
            <h1 className="site-logo">
              <span className="gradient-text text-2xl font-bold">Auralize</span>
              <span className="logo-particle">✨</span>
            </h1>
            <nav>
              <ul className="flex space-x-6">
                <li><Link to="/gallery" className="nav-link">Galeri</Link></li>
                <li><Link to="/aura-game" className="nav-link">Aura Oyunu</Link></li>
                <li><Link to="/profile" className="nav-link">Profilim</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <div className="hero-content-wrapper">
            <motion.div 
              className="hero-content"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.h2 
                className="hero-title" 
                custom={0} 
                variants={fadeInUp}
              >
                <span className="gradient-hero-text">Yaratıcı Auranızı</span><br/>
                AI ile Keşfedin
              </motion.h2>
              
              <motion.p 
                className="hero-subtitle" 
                custom={1} 
                variants={fadeInUp}
              >
                Auralize ile kişiselleştirilmiş yaratıcı yolculuğunuza başlayın. Görsel quiz'ler, renk paletleri ve 
                serbest yaratım seçenekleriyle kendi auranızı keşfedin.
              </motion.p>
              
              <motion.div 
                custom={2} 
                variants={fadeInUp}
              >
                <Link to="/quiz-selection" className="btn btn-primary">
                  <span className="btn-text">Yolculuğa Başla</span>
                  <span className="btn-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </span>
                </Link>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="hero-image-container"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <div className="hero-image-wrapper">
                <div className="aura-image">
                  <div className="aura-glow"></div>
                  <div className="aura-circle"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        <WaveSvg />
      </section>

      <section className="section features-section">
        <div className="container">
          <motion.h3 
            className="section-title" 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="gradient-text">Neler Sunuyoruz?</span>
          </motion.h3>
          
          <div className="features-grid">
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              } 
              title="Kişiselleştirilmiş Quiz" 
              description="Benzersiz tercihlerinize göre özel olarak hazırlanmış görsel quiz'ler ile kişisel auranızı keşfedin."
              delay={0.1}
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              } 
              title="AI Aura Analizi" 
              description="Gelişmiş yapay zeka teknolojimiz ile cevaplarınızı analiz ederek yaratıcı auranızı belirleriz."
              delay={0.3}
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
              } 
              title="Yaratıcı Galeri" 
              description="Sizin gibi kullanıcıların oluşturduğu aura sanat eserlerinden oluşan galerimizi keşfedin."
              delay={0.5}
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              } 
              title="Aura Kristalleri Oyunu" 
              description="Auranızı eğlenceli bir oyunla test edin, kristalleri toplayarak rozetler kazanın ve skorunuzu yükseltin."
              delay={0.7}
            />
          </div>
        </div>
      </section>

      <section className="section tech-section">
        <div className="tech-bg">
          <div className="tech-orb tech-orb1"></div>
          <div className="tech-orb tech-orb2"></div>
        </div>
        
        <div className="container">
          <motion.div 
            className="tech-content"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="section-title gradient-text">Kullandığımız Teknolojiler</h3>
            
            <div className="tech-cards">
              <motion.div 
                className="tech-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="tech-card-icon">🎨</div>
                <h4 className="tech-card-title">Stable Diffusion</h4>
                <p className="tech-card-description">Benzersiz sanat eserleri oluşturmak için son teknoloji görüntü üretim modeli kullanıyoruz.</p>
              </motion.div>
              
              <motion.div 
                className="tech-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="tech-card-icon">📝</div>
                <h4 className="tech-card-title">GPT Modelleri</h4>
                <p className="tech-card-description">Kişiselleştirilmiş hikayeler için doğal dil işleme teknolojisinden faydalanıyoruz.</p>
              </motion.div>
              
              <motion.div 
                className="tech-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="tech-card-icon">🎵</div>
                <h4 className="tech-card-title">AudioLDM</h4>
                <p className="tech-card-description">Aura temalı melodiler oluşturmak için ses üretimi teknolojileri kullanıyoruz.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container">
          <motion.div 
            className="cta-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h3 className="cta-title">Kendi Auranızı Keşfetmeye Hazır mısınız?</h3>
            <p className="cta-text">Yapay zeka destekli platformumuz ile benzersiz yaratıcı potansiyelinizi ortaya çıkarın. Hemen şimdi quiz'imize katılın ve auranızı görselleştirin.</p>
            <div className="cta-buttons">
              <Link to="/quiz-selection" className="btn btn-primary cta-button">
                Quiz'e Başla
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
              <Link to="/aura-game" className="btn btn-secondary cta-button">
                Aura Oyununu Dene
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.5 9.5C18.9 9.5 20 8.4 20 7s-1.1-2.5-2.5-2.5C16.1 4.5 15 5.6 15 7s1.1 2.5 2.5 2.5z"/>
                  <path d="M6.5 9.5C5.1 9.5 4 8.4 4 7s1.1-2.5 2.5-2.5C7.9 4.5 9 5.6 9 7s-1.1 2.5-2.5 2.5z"/>
                  <path d="M3 19h4c1.1 0 2-.9 2-2v-3a2 2 0 0 0-2-2H3c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2Z"/>
                  <path d="M17 19h4c1.1 0 2-.9 2-2v-3a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2Z"/>
                  <path d="M15 13a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3z"/>
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="gradient-footer">
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
            
            <div className="footer-social">
              <a href="#" className="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </a>
              <a href="#" className="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="copyright">&copy; {new Date().getFullYear()} Auralize - Tüm Hakları Saklıdır.</p>
            <p className="lenovo-credit">Lenovo'nun "Senin auran sınırsız" kampanyası kapsamında geliştirilmiştir.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 