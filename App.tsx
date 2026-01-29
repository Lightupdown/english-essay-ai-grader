import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './views/Home';
import Result from './views/Result';
import Comparison from './views/Comparison';
import { AuthProvider } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result/:id" element={<Result />} />
        <Route path="/comparison/:id" element={<Comparison />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <footer className="py-4 md:py-6 text-center text-gray-500 text-xs md:text-sm border-t bg-white mt-auto px-4">
        <p>© {new Date().getFullYear()} 英语作文AI批改助手 - 让批改更高效</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;