import React, { useState } from 'react';
import { ArrowLeft, Share2, Sparkles, User, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title?: string;
  subTitle?: string;
  showBack?: boolean;
  onExport?: () => void;
  className?: string;
  showAuth?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title = "AI 英语名师批改系统", 
  subTitle, 
  showBack = false,
  onExport,
  showAuth = true,
}) => {
  const navigate = useNavigate();
  const { user, logout, isTrial, trialCount, trialLimit } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 glass-panel border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            {showBack ? (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-200"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
            ) : (
              <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <Sparkles size={18} className="text-white" />
              </div>
            )}
            <div className="hidden md:block">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                {title}
                {!showBack && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded uppercase">Pro</span>}
              </h1>
              {subTitle && <p className="text-xs text-gray-500 font-medium mt-0.5">{subTitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            {showAuth && (
              <>
                {user ? (
                  <div className="hidden md:flex items-center gap-4">
                    {isTrial && (
                      <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100 flex items-center gap-2">
                        <span>试用剩余: {trialLimit - trialCount} 次</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                        <User size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{user.name || user.email}</span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="退出登录"
                      >
                        <LogOut size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-4">
                    {isTrial && (
                      <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100 flex items-center gap-2">
                        <span>试用模式: {trialCount}/{trialLimit} 次</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Link
                        to="/login"
                        className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold text-sm"
                      >
                        <LogIn size={18} />
                        <span>登录</span>
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 font-bold text-sm"
                      >
                        <UserPlus size={18} />
                        <span>注册</span>
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {onExport && (
              <button 
                onClick={onExport}
                className="hidden md:flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 text-sm"
              >
                <Share2 size={16} />
                <span>导出报告</span>
              </button>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              {mobileMenuOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
            {user ? (
              <>
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                    <User size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{user.name || user.email}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
                
                {isTrial && (
                  <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100">
                    试用剩余: {trialLimit - trialCount} 次
                  </div>
                )}
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all"
                >
                  <LogOut size={18} />
                  <span>退出登录</span>
                </button>
              </>
            ) : (
              <>
                {isTrial && (
                  <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100 mb-4">
                    试用模式: {trialCount}/{trialLimit} 次
                  </div>
                )}
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold transition-all"
                >
                  <LogIn size={18} />
                  <span>登录</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold"
                >
                  <UserPlus size={18} />
                  <span>注册</span>
                </Link>
              </>
            )}
            
            {onExport && (
              <button 
                onClick={() => { onExport(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                <Share2 size={18} />
                <span>导出报告</span>
              </button>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="mt-8 px-6 py-3 text-slate-500 hover:text-slate-700 font-bold"
            >
              关闭菜单
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;