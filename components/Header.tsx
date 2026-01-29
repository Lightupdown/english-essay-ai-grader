import React, { useState } from 'react';
import { ArrowLeft, Share2, Sparkles, MessageSquare, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FeedbackModal from './FeedbackModal';

interface HeaderProps {
  title?: string;
  subTitle?: string;
  showBack?: boolean;
  onExport?: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title = "AI 英语名师批改系统", 
  subTitle, 
  showBack = false,
  onExport,
}) => {
  const navigate = useNavigate();
  const { remainingAttempts, dailyLimit } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // 临时：重置试用次数（测试用）
  const resetAttempts = () => {
    localStorage.removeItem('daily_attempts');
    localStorage.removeItem('last_attempt_date');
    window.location.reload();
  };

  return (
    <>
      <nav className="sticky top-0 z-40 glass-panel border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 backdrop-blur-sm bg-white/80">
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
                {!showBack && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded uppercase">测试版</span>}
              </h1>
              {subTitle && <p className="text-xs text-gray-500 font-medium mt-0.5">{subTitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            {/* 剩余次数显示 */}
            <div className="hidden md:flex items-center gap-4">
              <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100 flex items-center gap-2">
                <span>今日剩余: {remainingAttempts}/{dailyLimit} 次</span>
              </div>
              
                {/* 反馈按钮 */}
              <button
                onClick={() => setFeedbackOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all font-bold text-sm"
              >
                <MessageSquare size={18} />
                <span>意见反馈</span>
              </button>

              {/* 重置次数按钮（测试用） */}
              <button
                onClick={resetAttempts}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-bold text-xs"
              >
                <span>重置次数</span>
              </button>
            </div>
            
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
        <div className="md:hidden fixed inset-0 z-30 bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
            <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100 mb-4">
              今日剩余: {remainingAttempts}/{dailyLimit} 次
            </div>
            
            <button
              onClick={() => {
                setFeedbackOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold"
            >
              <MessageSquare size={18} />
              <span>意见反馈</span>
            </button>

            {/* 重置次数按钮（测试用） */}
            <button
              onClick={() => { resetAttempts(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
            >
              <span>重置次数</span>
            </button>
            
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

      {/* 反馈弹窗 */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
};

export default Header;
