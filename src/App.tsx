import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import AuraResult from './pages/AuraResult';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <div className="app-background"></div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/aura-result" element={<AuraResult />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
