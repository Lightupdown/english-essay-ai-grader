import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  X,
  Wand2,
  Loader2,
  GraduationCap,
  PenTool,
  MessageSquare
} from 'lucide-react';
import { 
  ComparisonConfig as ConfigType, 
  ComparisonMode, 
  DifficultyAdjustment, 
  WritingStyle,
  GradeLevel,
  GRADE_CONFIGS 
} from '../types';
import { predictTopic } from '../services/comparison';

interface ComparisonModalProps {
  isOpen: boolean;
  initialTopic: string;
  originalText: string;
  gradeLevel: GradeLevel;
  essayId: string;
  onSubmit: (config: ConfigType) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  initialTopic,
  originalText,
  gradeLevel,
  essayId,
  onSubmit,
  onClose,
  isLoading = false
}) => {
  const [topic, setTopic] = useState(initialTopic || '');
  const [mode, setMode] = useState<ComparisonMode>('polish');
  const [difficulty, setDifficulty] = useState<DifficultyAdjustment>('same');
  const [style, setStyle] = useState<WritingStyle>('academic');
  const [isPredicting, setIsPredicting] = useState(false);

  const gradeConfig = GRADE_CONFIGS[gradeLevel];

  useEffect(() => {
    if (isOpen) {
      setTopic(initialTopic || '');
    }
  }, [isOpen, initialTopic]);

  const handlePredictTopic = async () => {
    if (!originalText) return;
    
    setIsPredicting(true);
    try {
      const result = await predictTopic(originalText);
      setTopic(result.topic);
    } catch (error) {
      console.error('预测题目失败:', error);
      alert('预测题目失败，请手动输入');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      topic: topic.trim() || 'Unknown Topic',
      mode,
      difficulty,
      style,
      originalText,
      gradeLevel
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">同题作文对比</h2>
              <p className="text-xs text-slate-500 font-medium">生成范文，对比学习</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
            disabled={isLoading}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Topic Section */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              作文题目
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="输入或预测作文题目..."
                className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handlePredictTopic}
                disabled={isPredicting || !originalText || isLoading}
                className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                {isPredicting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    预测中
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    自动预测
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              提示：可以点击"自动预测"让AI根据作文内容推测题目，也可以手动输入
            </p>
          </div>

          {/* Mode Selection */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              生成模式
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('polish')}
                disabled={isLoading}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'polish'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <PenTool size={18} className={mode === 'polish' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className={`font-bold ${mode === 'polish' ? 'text-indigo-900' : 'text-slate-700'}`}>
                    润色改进
                  </span>
                </div>
                <p className={`text-xs ${mode === 'polish' ? 'text-indigo-600' : 'text-slate-500'}`}>
                  基于原文进行润色，保留核心内容
                </p>
              </button>

              <button
                onClick={() => setMode('rewrite')}
                disabled={isLoading}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'rewrite'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className={mode === 'rewrite' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className={`font-bold ${mode === 'rewrite' ? 'text-indigo-900' : 'text-slate-700'}`}>
                    完全重写
                  </span>
                </div>
                <p className={`text-xs ${mode === 'rewrite' ? 'text-indigo-600' : 'text-slate-500'}`}>
                  独立创作全新范文，不参考原文
                </p>
              </button>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              难度调节
              <span className="ml-2 text-xs font-normal text-slate-400">
                当前：{gradeConfig?.label}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setDifficulty('lower')}
                disabled={isLoading}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  difficulty === 'lower'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <TrendingDown size={20} className={`mx-auto mb-1 ${difficulty === 'lower' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className={`text-xs font-bold block ${difficulty === 'lower' ? 'text-emerald-900' : 'text-slate-700'}`}>
                  降低一档
                </span>
              </button>

              <button
                onClick={() => setDifficulty('same')}
                disabled={isLoading}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  difficulty === 'same'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <Minus size={20} className={`mx-auto mb-1 ${difficulty === 'same' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`text-xs font-bold block ${difficulty === 'same' ? 'text-indigo-900' : 'text-slate-700'}`}>
                  保持水平
                </span>
              </button>

              <button
                onClick={() => setDifficulty('higher')}
                disabled={isLoading}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  difficulty === 'higher'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                <TrendingUp size={20} className={`mx-auto mb-1 ${difficulty === 'higher' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className={`text-xs font-bold block ${difficulty === 'higher' ? 'text-amber-900' : 'text-slate-700'}`}>
                  提高一档
                </span>
              </button>
            </div>
          </div>

          {/* Style Selection */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              写作风格
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setStyle('academic')}
                disabled={isLoading}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  style === 'academic'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <GraduationCap size={20} className={`mx-auto mb-1 ${style === 'academic' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`text-xs font-bold block ${style === 'academic' ? 'text-indigo-900' : 'text-slate-700'}`}>
                  学术
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">正式、客观</span>
              </button>

              <button
                onClick={() => setStyle('narrative')}
                disabled={isLoading}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  style === 'narrative'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <MessageSquare size={20} className={`mx-auto mb-1 ${style === 'narrative' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`text-xs font-bold block ${style === 'narrative' ? 'text-indigo-900' : 'text-slate-700'}`}>
                  叙事
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">生动、情感丰富</span>
              </button>

              <button
                onClick={() => setStyle('argumentative')}
                disabled={isLoading}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  style === 'argumentative'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <BookOpen size={20} className={`mx-auto mb-1 ${style === 'argumentative' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`text-xs font-bold block ${style === 'argumentative' ? 'text-indigo-900' : 'text-slate-700'}`}>
                  议论
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">逻辑严密</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-slate-300 disabled:opacity-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !topic.trim()}
            className="flex-[2] px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                生成范文
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
