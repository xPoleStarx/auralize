import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="app-header">
      <button 
        onClick={onOpenSettings}
        className="settings-button"
        aria-label="Ayarlar"
      >
        <span role="img" aria-hidden="true">⚙️</span>
      </button>
    </header>
  );
};

export default Header; 