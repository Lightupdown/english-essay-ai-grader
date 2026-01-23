
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './views/Home';
import Result from './views/Result';
import { EssayRecord } from './types';
import * as storage from './utils/storage';

const App: React.FC = () => {
  const [history, setHistory] = useState<EssayRecord[]>([]);

  useEffect(() => {
    setHistory(storage.getEssays());
  }, []);

  const refreshHistory = () => {
    setHistory(storage.getEssays());
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          <Route path="/" element={<Home history={history} onRefresh={refreshHistory} />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <footer className="py-6 text-center text-gray-500 text-sm border-t bg-white mt-auto">
          <p>© {new Date().getFullYear()} 英语作文AI批改助手 - 让批改更高效</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
