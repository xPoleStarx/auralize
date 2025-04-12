import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import QuizSelection from './pages/QuizSelection';
import QuizPage from './pages/QuizPage';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import AuraGame from './pages/AuraGame';

// Result pages
import CareerResult from './pages/results/CareerResult';
import MoodResult from './pages/results/MoodResult';
import PersonalResult from './pages/results/PersonalResult';
import CreativeResult from './pages/results/CreativeResult';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/quiz-selection" element={<QuizSelection />} />
      <Route path="/quiz/:quizType" element={<QuizPage />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/profile" element={<Profile />} />
      
      {/* Result routes */}
      <Route path="/results/career" element={<CareerResult />} />
      <Route path="/results/mood" element={<MoodResult />} />
      <Route path="/results/personal" element={<PersonalResult />} />
      <Route path="/results/creative" element={<CreativeResult />} />
      <Route path="/aura-result" element={<CreativeResult />} />
      
      {/* Aura Game route */}
      <Route path="/aura-game" element={<AuraGame />} />
    </Routes>
  );
};

export default AppRoutes; 