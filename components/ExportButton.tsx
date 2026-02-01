import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, Code, Globe, Loader2, Check } from 'lucide-react';
import { exportReport, ExportFormat, ExportReportData } from '../utils/reportExport';

interface ExportButtonProps {
  data: ExportReportData;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface ExportOption {
  format: ExportFormat;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const exportOptions: ExportOption[] = [
  {
    format: 'pdf',
    label: 'PDF 文档',
    icon: <FileText size={18} />,
    description: '适合打印和分享'
  },
  {
    format: 'docx',
    label: 'Word 文档',
    icon: <FileSpreadsheet size={18} />,
    description: '可编辑的文档格式'
  },
  {
    format: 'html',
    label: 'HTML 网页',
    icon: <Globe size={18} />,
    description: '保留样式，浏览器打开'
  },
  {
    format: 'md',
    label: 'Markdown',
    icon: <Code size={18} />,
    description: '纯文本格式'
  }
];

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [successFormat, setSuccessFormat] = useState<ExportFormat | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理导出
  const handleExport = async (format: ExportFormat) => {
    if (isExporting) return;

    setIsExporting(true);
    setIsOpen(false);

    try {
      await exportReport(data, format);
      setSuccessFormat(format);
      
      // 2秒后清除成功状态
      setTimeout(() => {
        setSuccessFormat(null);
      }, 2000);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 按钮样式
  const getButtonStyles = () => {
    const baseStyles = 'flex items-center gap-2 font-medium transition-all duration-200 rounded-lg whitespace-nowrap';
    
    const variantStyles = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg',
      secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
      ghost: 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
    };

    const sizeStyles = {
      sm: 'px-2 sm:px-3 py-1.5 text-xs sm:text-sm',
      md: 'px-3 sm:px-4 py-2 text-xs sm:text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  };

  // 获取成功状态的提示文本
  const getSuccessLabel = () => {
    const option = exportOptions.find(opt => opt.format === successFormat);
    return option ? `${option.label}导出成功！` : '导出成功！';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 导出按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={getButtonStyles()}
      >
        {isExporting ? (
          <>
            <Loader2 size={size === 'lg' ? 20 : 16} className="animate-spin" />
            <span>导出中...</span>
          </>
        ) : successFormat ? (
          <>
            <Check size={size === 'lg' ? 20 : 16} className="text-emerald-400" />
            <span>{getSuccessLabel()}</span>
          </>
        ) : (
          <>
            <Download size={size === 'lg' ? 20 : 16} className="sm:size-4" />
            <span className="hidden sm:inline">导出报告</span>
            <span className="sm:hidden">导出</span>
          </>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 菜单头部 */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800">选择导出格式</p>
            <p className="text-xs text-slate-500 mt-0.5">支持多种格式，方便不同用途</p>
          </div>

          {/* 导出选项 */}
          <div className="p-2">
            {exportOptions.map((option) => (
              <button
                key={option.format}
                onClick={() => handleExport(option.format)}
                className="w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors hover:bg-slate-50 group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                    {option.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* 菜单底部 */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              报告将包含完整的同题对比内容
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
