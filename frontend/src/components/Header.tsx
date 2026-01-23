import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user?: User;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-indigo-600">
              📝 英语作文 AI 评分
            </h1>
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                欢迎, {user.name || user.email}
              </span>
              <button
                onClick={onLogout}
                className="text-red-600 hover:text-red-800"
              >
                退出
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <a href="/login" className="text-indigo-600 hover:text-indigo-800">
                登录
              </a>
              <a
                href="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                注册
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
