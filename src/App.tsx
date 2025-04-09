import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import AuraResult from './pages/AuraResult';
import MoodResult from './pages/MoodResult';
import PersonalResult from './pages/PersonalResult';
import CareerResult from './pages/CareerResult';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import AuraGame from './pages/AuraGame';
import QuizSelection from './pages/QuizSelection';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <div className="app-background"></div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz-selection" element={<QuizSelection />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/aura-result" element={<AuraResult />} />
          <Route path="/mood-result" element={<MoodResult />} />
          <Route path="/personal-result" element={<PersonalResult />} />
          <Route path="/career-result" element={<CareerResult />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/aura-game" element={<AuraGame />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
