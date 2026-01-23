
import React from 'react';
import { ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  subTitle?: string;
  showBack?: boolean;
  onExport?: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title = "English AI Tutor", 
  subTitle, 
  showBack = false,
  onExport,
}) => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-gray-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          {showBack ? (
            <button 
              onClick={() => navigate(-1)}
              className="p-2.5 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-200"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          ) : (
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <Sparkles size={20} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              {title}
              {!showBack && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded uppercase">Pro</span>}
            </h1>
            {subTitle && <p className="text-xs text-gray-500 font-medium mt-0.5">{subTitle}</p>}
          </div>
        </div>
        
        {onExport && (
          <button 
            onClick={onExport}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 text-sm"
          >
            <Share2 size={16} />
            <span>导出报告</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Header;
