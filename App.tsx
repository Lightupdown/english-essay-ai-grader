import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './views/Home';
import Result from './views/Result';
import Login from './views/Login';
import Register from './views/Register';
import { AuthProvider } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const location = useLocation();

  // 不需要显示页脚的路由
  const hideFooter = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result/:id" element={<Result />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {!hideFooter && (
        <footer className="py-4 md:py-6 text-center text-gray-500 text-xs md:text-sm border-t bg-white mt-auto px-4">
          <p>© {new Date().getFullYear()} 英语作文AI批改助手 - 让批改更高效</p>
        </footer>
      )}
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