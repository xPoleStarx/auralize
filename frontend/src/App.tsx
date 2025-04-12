import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import './styles/global.css';
import './styles/variables.css';
import Settings from './components/Settings';
import { FiSettings } from 'react-icons/fi';

const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Header onOpenSettings={() => setIsSettingsOpen(true)} />
        <main className="main-content">
          <AppRoutes />
        </main>
        <Footer />
        <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </BrowserRouter>
  );
};

export default App;
