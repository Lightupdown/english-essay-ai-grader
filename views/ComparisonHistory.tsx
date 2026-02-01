import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  History, 
  Trash2, 
  Eye, 
  Calendar, 
  BookOpen,
  GraduationCap,
  Sparkles,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';
import { ComparisonRecord, GradeLevel, GRADE_CONFIGS, WritingStyle, EssayRecord } from '../types';
import * as comparisonStorage from '../utils/comparisonStorage';
import * as essayStorage from '../utils/storage';
import Header from '../components/Header';
import ExportButton from '../components/ExportButton';

interface HistoryItemProps {
  record: ComparisonRecord;
  essayRecord?: EssayRecord;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ record, essayRecord, onDelete, onView }) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStyleLabel = (style: WritingStyle) => {
    const labels: Record<WritingStyle, string> = {
      academic: '学术风格',
      narrative: '叙事风格',
      argumentative: '议论风格'
    };
    return labels[style] || style;
  };

  const getStyleColor = (style: WritingStyle) => {
    const colors: Record<WritingStyle, string> = {
      academic: 'bg-blue-100 text-blue-700',
      narrative: 'bg-green-100 text-green-700',
      argumentative: 'bg-purple-100 text-purple-700'
    };
    return colors[style] || 'bg-gray-100 text-gray-700';
  };

  const previewText = record.modelEssay.text.slice(0, 100) + (record.modelEssay.text.length > 100 ? '...' : '');

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-visible hover:shadow-lg transition-shadow relative">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 truncate pr-4" title={record.config.topic}>
              {record.config.topic}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <Clock size={12} />
            <span>{formatDate(record.createdAt)}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
            <GraduationCap size={12} />
            {GRADE_CONFIGS[record.config.gradeLevel]?.label || record.config.gradeLevel}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStyleColor(record.config.style)}`}>
            <Sparkles size={12} />
            {getStyleLabel(record.config.style)}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
            <BookOpen size={12} />
            {record.config.mode === 'polish' ? '润色模式' : '重写模式'}
          </span>
        </div>

        {/* Preview */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <FileText size={12} />
            <span>范文预览</span>
          </div>
          <p className="text-sm text-slate-600 line-clamp-2">
            {previewText}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(record.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
          >
            <Eye size={16} />
            查看详情
          </button>
          
          <ExportButton
            data={{ comparison: record, essayRecord }}
            variant="secondary"
            size="sm"
            className="flex-shrink-0"
          />
          
          <button
            onClick={() => onDelete(record.id)}
            className="flex items-center justify-center w-11 h-11 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
            title="删除记录"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ComparisonHistory: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ComparisonRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const allRecords = await comparisonStorage.getAllComparisons();
      // 按时间倒序排列
      const sorted = allRecords.sort((a, b) => b.createdAt - a.createdAt);
      setRecords(sorted);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        await comparisonStorage.deleteComparison(id);
        setRecords(records.filter(r => r.id !== id));
        setDeleteConfirm(null);
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      }
    } else {
      setDeleteConfirm(id);
      // 3秒后自动取消确认状态
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleView = (id: string) => {
    navigate(`/comparison/${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          返回首页
        </button>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 md:p-8 text-white mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <History size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black mb-1">范文历史记录</h1>
              <p className="text-indigo-200 text-sm md:text-base">
                共 {records.length} 条生成记录
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">暂无历史记录</h3>
            <p className="text-slate-500 mb-6">您还没有生成过范文，快去试试吧！</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              <Sparkles size={18} />
              开始批改作文
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {records.map(record => (
              <HistoryItem
                key={record.id}
                record={record}
                essayRecord={record.essayId ? essayStorage.getEssay(record.essayId) : undefined}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Toast */}
        {deleteConfirm && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-rose-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-fade-in-up">
            <AlertCircle size={18} />
            <span className="font-medium">再次点击确认删除</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default ComparisonHistory;
