import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, History } from 'lucide-react';
import Header from '../components/Header';
import ModelEssayDisplay from '../components/ModelEssayDisplay';
import ComparisonModal from '../components/ComparisonModal';
import ExportButton from '../components/ExportButton';
import { ComparisonRecord, EssayRecord } from '../types';
import * as comparisonStorage from '../utils/comparisonStorage';
import * as essayStorage from '../utils/storage';
import { generateModelEssay } from '../services/comparison';

const Comparison: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState<ComparisonRecord | null>(null);
  const [essayRecord, setEssayRecord] = useState<EssayRecord | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComparison();
  }, [id]);

  const loadComparison = async () => {
    if (!id) {
      setError('无效的对比ID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Try to get from IndexedDB first
      const localData = await comparisonStorage.getComparison(id);
      if (localData) {
        setComparison(localData);
        
        // 同时加载原始作文记录
        if (localData.essayId) {
          const essay = essayStorage.getEssay(localData.essayId);
          setEssayRecord(essay);
        }
        
        setIsLoading(false);
        return;
      }

      setError('未找到对比记录');
    } catch (err) {
      console.error('加载对比记录失败:', err);
      setError('加载对比记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (config: ComparisonRecord['config']) => {
    if (!comparison) return;

    setIsRegenerating(true);
    try {
      const result = await generateModelEssay({
        ...config,
        essayId: comparison.essayId
      });

      // Save new comparison
      const newComparison: ComparisonRecord = {
        id: result.comparisonId,
        essayId: comparison.essayId,
        config: result.config,
        modelEssay: result.modelEssay,
        createdAt: Date.now()
      };

      await comparisonStorage.saveComparison(newComparison);
      
      // Navigate to new comparison
      navigate(`/comparison/${result.comparisonId}`, { replace: true });
      setComparison(newComparison);
    } catch (err) {
      console.error('重新生成失败:', err);
      alert('重新生成失败，请稍后重试');
    } finally {
      setIsRegenerating(false);
      setIsModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">加载对比记录... </p>
        </div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl"> ❌ </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{error || '记录不存在'} </h2>
          <p className="text-slate-500 mb-6">无法找到该对比记录 </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        title="同题作文对比" 
        showBack 
      />

      <div className="container-1080p px-3 sm:px-4 md:px-8 py-4 sm:py-6">
        {/* Config Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">生成模式 </span>
                <span className="px-2 sm:px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                  {comparison.config.mode === 'polish' ? '润色改进' : '完全重写'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">难度 </span>
                <span className="px-2 sm:px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                  {comparison.config.difficulty === 'same' ? '保持水平' : 
                   comparison.config.difficulty === 'higher' ? '提高一档' : '降低一档'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">风格 </span>
                <span className="px-2 sm:px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                  {comparison.config.style === 'academic' ? '学术' : 
                   comparison.config.style === 'narrative' ? '叙事' : '议论'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => navigate('/comparison-history')}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors whitespace-nowrap text-xs sm:text-sm"
              >
                <History size={14} className="sm:size-4" />
                <span className="hidden sm:inline">历史记录</span>
                <span className="sm:hidden">历史</span>
              </button>
              
              {comparison && (
                <ExportButton 
                  data={{ comparison, essayRecord }}
                  variant="primary"
                  size="sm"
                />
              )}
              
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap text-xs sm:text-sm"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin sm:size-4" />
                    生成中
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} className="sm:size-4" />
                    <span className="hidden sm:inline">重新生成</span>
                    <span className="sm:hidden">重做</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Model Essay Display */}
        <ModelEssayDisplay
          originalText={comparison.config.originalText}
          modelEssay={comparison.modelEssay}
          topic={comparison.config.topic}
        />
      </div>

      {/* Regenerate Modal */}
      <ComparisonModal
        isOpen={isModalOpen}
        initialTopic={comparison.config.topic}
        originalText={comparison.config.originalText}
        gradeLevel={comparison.config.gradeLevel}
        essayId={comparison.essayId}
        onSubmit={handleRegenerate}
        onClose={() => setIsModalOpen(false)}
        isLoading={isRegenerating}
      />
    </div>
  );
};

export default Comparison;
