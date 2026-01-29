import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  XCircle,
  CheckCircle2,
  ImageIcon,
  ArrowLeft,
  FileText,
  Award,
  Sparkles,
  Star,
  BookOpen,
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  GitCompare
} from 'lucide-react';
import Header from '../components/Header';
import ComparisonModal from '../components/ComparisonModal';
import { EssayRecord, FeedbackItem, FeedbackType, AnalyzeResult, GradeLevel, GRADE_CONFIGS, ComparisonConfig } from '../types';
import * as storage from '../utils/storage';
import { generateModelEssay } from '../services/comparison';
import * as comparisonStorage from '../utils/comparisonStorage';

const typeOrder = { error: 0, improvement: 1, highlight: 2 };

const getTypeConfig = (type: FeedbackType) => {
  switch (type) {
    case 'error': return {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200',
      icon: XCircle,
      label: '语法错误'
    };
    case 'improvement': return {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      icon: TrendingUp,
      label: '改进建议'
    };
    case 'highlight': return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      icon: Star,
      label: '精彩亮点'
    };
  }
};

const Result: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<EssayRecord | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    if (!id) {
      setIsLoading(false);
      return;
    }

    const localData = storage.getEssay(id);
    if (localData) {
      setRecord(localData);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [id]);

  const sortedFeedbacks = useMemo(() => {
    const feedbacks = record?.result?.feedbacks || [];
    return [...feedbacks].sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
  }, [record?.result?.feedbacks]);

  const toggleExpand = (segment: string) => {
    setExpandedFeedback(prev => prev === segment ? null : segment);
  };

  const handleComparisonSubmit = async (config: ComparisonConfig) => {
    if (!record || !id) return;
    
    setIsGeneratingModel(true);
    try {
      const result = await generateModelEssay({
        ...config,
        essayId: id
      });
      
      // Save to IndexedDB
      const comparisonRecord = {
        id: result.comparisonId,
        essayId: id,
        config: result.config,
        modelEssay: result.modelEssay,
        createdAt: Date.now()
      };
      await comparisonStorage.saveComparison(comparisonRecord);
      
      // Navigate to comparison page
      navigate(`/comparison/${result.comparisonId}`);
    } catch (error) {
      console.error('生成范文失败:', error);
      alert('生成范文失败，请稍后重试');
    } finally {
      setIsGeneratingModel(false);
      setIsComparisonModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-36 h-36 bg-white rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex items-center justify-center mb-10 text-rose-500">
          <XCircle size={72} className="animate-bounce" />
        </div>
        <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">报告解析已中断</h2>
        <p className="text-slate-400 mb-14 max-w-md font-medium text-lg">系统未能检索到此批改序列。可能是由于记录已归档或分析由于网络波动未完全入库。</p>
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-4 px-12 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all text-xl"
        >
          <ArrowLeft size={28} className="group-hover:-translate-x-2 transition-transform" />
          <span>返回控制台</span>
        </button>
      </div>
    );
  }

  const { result } = record;

  if (record.status === 'pending' && record.rawText) {
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfdfe]">
        <Header title="OCR识别完成" showBack onExport={() => {}} />
        <div className="flex-1 flex flex-col container-1080p px-12 py-10 gap-10 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">OCR 识别完成</h3>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-0.5">可阅读文本</p>
                </div>
              </div>
              <div className="flex-1 bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 overflow-y-auto h-full">
                  <p className="text-xl leading-loose font-medium text-slate-700 whitespace-pre-wrap break-words">
                    {record.rawText}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">AI 深度分析</h3>
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-0.5">进行中...</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-xl border border-slate-100 p-12">
                <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-8">
                  <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={48} className="animate-pulse" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">AI 正在分析...</h3>
                <p className="text-slate-500 text-lg font-medium text-center mb-8">
                  我们的 AI 导师正在深度分析您的作文，<br/>包括语法检查、词汇评分和改进建议
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm font-bold text-indigo-600">请稍候，大约需要 15-30 秒</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result || !result.rawText) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-36 h-36 bg-white rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex items-center justify-center mb-10 text-amber-500">
          <XCircle size={72} className="animate-pulse" />
        </div>
        <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">数据解析不完整</h2>
        <p className="text-slate-400 mb-6 max-w-lg font-medium text-lg">批改结果可能包含不完整的数据。</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all text-lg"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
            <span>返回控制台</span>
          </button>
        </div>
      </div>
    );
  }

  const scoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C';
    return 'D';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-emerald-600';
    if (score >= 75) return 'from-indigo-500 to-indigo-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-rose-500 to-rose-600';
  };

  const gradeConfig = record.gradeLevel ? GRADE_CONFIGS[record.gradeLevel] : null;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfdfe]">
      <Header title="名师 AI 深度批阅报告" showBack onExport={() => alert('PDF 报告生成中...')} />

      <div className="flex-1 flex flex-col container-1080p px-4 md:px-12 py-4 md:py-10 gap-4 md:gap-10 min-h-0">
        
        {gradeConfig && (
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-2xl border border-indigo-100">
            <span className="text-2xl">📚</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-indigo-700">{gradeConfig.label}</span>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {gradeConfig.description}
                </span>
              </div>
              <p className="text-xs text-indigo-500 font-medium mt-0.5">
                评分标准：{gradeConfig.criteria}
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 min-h-0">
          
          <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6 overflow-hidden">
            
            <div className="grid grid-cols-3 gap-3 md:gap-4 shrink-0">
              <div className="relative bg-white/90 backdrop-blur-sm p-3 md:p-6 rounded-2xl border-l-4 md:border-l-[12px] border-indigo-600 flex flex-col items-center justify-center shadow-xl">
                <p className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1 md:mb-2">总分</p>
                <h4 className={`text-2xl md:text-5xl font-black bg-gradient-to-r ${getScoreColor(result.totalScore)} bg-clip-text text-transparent`}>
                  {result.totalScore}
                </h4>
                <span className="text-xs md:text-sm font-bold text-slate-300">/100</span>
              </div>

              <div className="relative bg-white p-3 md:p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                  <BookOpen size={12} className="md:size-4 text-indigo-500" />
                  <p className="text-[8px] md:text-xs font-black text-slate-400 uppercase">语法</p>
                </div>
                <h4 className="text-xl md:text-4xl font-black text-slate-900">{result.grammarScore}</h4>
                <span className="text-xs md:text-sm font-bold text-slate-300">/100</span>
              </div>

              <div className="relative bg-white p-3 md:p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                  <FileText size={12} className="md:size-4 text-amber-500" />
                  <p className="text-[8px] md:text-xs font-black text-slate-400 uppercase">词汇</p>
                </div>
                <h4 className="text-xl md:text-4xl font-black text-slate-900">{result.vocabScore}</h4>
                <span className="text-xs md:text-sm font-bold text-slate-300">/100</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-4 md:p-6 relative overflow-hidden shadow-xl shrink-0">
              <div className="absolute top-0 right-0 w-12 h-12 md:w-20 md:h-20">
                <Sparkles size={48} className="md:size-20 text-indigo-400/20 animate-spin-slow" style={{ animationDuration: '20s' }} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Award size={14} className="md:size-5 text-indigo-200" />
                    <h4 className="text-xs md:text-base font-black text-white">专家点睛</h4>
                  </div>
                  <button
                    onClick={() => setIsComparisonModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-bold transition-colors"
                  >
                    <GitCompare size={14} />
                    同题对比
                  </button>
                </div>
                <p className="text-indigo-100/90 text-xs md:text-sm font-medium leading-relaxed">
                  {result.commentary || '这篇作文展现了不错的写作能力，建议在词汇丰富度和句式多样性上进一步提升。'}
                </p>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl md:rounded-[3rem] shadow-xl border-2 border-indigo-100 flex flex-col overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-indigo-50">
                <h3 className="text-xl md:text-3xl font-black text-indigo-900 text-center">作文原文</h3>
              </div>
              <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                <p className="text-lg md:text-2xl leading-loose font-bold text-slate-800 whitespace-pre-wrap break-words">
                  {result.rawText}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white/80 backdrop-blur-md rounded-2xl md:rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-md">
                  <Activity size={16} className="md:size-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-black text-slate-900">反馈列表</h3>
                  <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Feedback Items ({sortedFeedbacks.length})</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {sortedFeedbacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">完美！</h3>
                  <p className="text-slate-500 text-sm md:text-base font-medium">未发现任何问题，您的作文表现优异！</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 md:gap-4">
                  {sortedFeedbacks.map((feedback, idx) => {
                    const config = getTypeConfig(feedback.type);
                    const isExpanded = expandedFeedback === feedback.segment;
                    const Icon = config.icon;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl shadow-lg transition-all duration-300 overflow-hidden
                          ${config.bg} ${config.border} border-2
                          ${isExpanded ? 'shadow-xl' : 'hover:shadow-md hover:-translate-y-1'}`}
                      >
                        <div
                          className="p-3 md:p-5 cursor-pointer"
                          onClick={() => toggleExpand(feedback.segment)}
                        >
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${config.text} ${config.bg} flex items-center justify-center shrink-0`}>
                              <Icon size={16} className="md:size-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 md:mb-2">
                                <span className={`text-xs md:text-sm font-black uppercase tracking-wider ${config.text}`}>
                                  {config.label}
                                </span>
                                {feedback.category && (
                                  <span className="text-[10px] md:text-xs font-bold text-slate-500 bg-white/50 px-2 py-0.5 rounded-full">
                                    {feedback.category}
                                  </span>
                                )}
                              </div>
                              
                              <div className="bg-white/60 rounded-xl md:rounded-2xl p-2 md:p-4 mb-2 md:mb-3">
                                <p className="text-sm md:text-lg font-black text-slate-800 leading-relaxed break-words">
                                  {feedback.segment}
                                </p>
                              </div>

                              {!isExpanded && (
                                <div className="flex items-center justify-between">
                                  <p className="text-xs md:text-sm font-medium text-slate-600 line-clamp-2">
                                    {feedback.explanation}
                                  </p>
                                  <div className={`ml-2 shrink-0 ${config.text}`}>
                                    <ChevronDown size={16} className="md:size-5" />
                                  </div>
                                </div>
                              )}

                              {isExpanded && (
                                <div className={`ml-2 shrink-0 ${config.text}`}>
                                  <ChevronUp size={16} className="md:size-5" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-3 md:px-5 pb-3 md:pb-5 pt-0 border-t border-white/30">
                            <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3 mt-3 md:mt-4">
                              <BrainCircuit size={14} className="md:size-5 text-emerald-500" />
                              <p className="text-xs md:text-sm font-black text-emerald-600 uppercase tracking-wider">深度解析</p>
                            </div>
                            <div className="bg-white/60 rounded-xl md:rounded-2xl p-3 md:p-5 mb-3 md:mb-4">
                              <p className="text-sm md:text-lg font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {feedback.explanation}
                              </p>
                            </div>

                            {feedback.suggestion && (
                              <>
                                <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3">
                                  <Sparkles size={14} className="md:size-5 text-amber-500" />
                                  <p className="text-xs md:text-sm font-black text-amber-600 uppercase tracking-wider">优化建议</p>
                                </div>
                                <div className="bg-amber-50 rounded-xl md:rounded-2xl p-3 md:p-5 border border-amber-200">
                                  <p className="text-sm md:text-lg font-bold text-amber-900 leading-relaxed whitespace-pre-wrap">
                                    {feedback.suggestion}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {record && (
        <ComparisonModal
          isOpen={isComparisonModalOpen}
          initialTopic=""
          originalText={record.result?.rawText || record.rawText || ''}
          gradeLevel={record.gradeLevel || 'other'}
          essayId={record.id}
          onSubmit={handleComparisonSubmit}
          onClose={() => setIsComparisonModalOpen(false)}
          isLoading={isGeneratingModel}
        />
      )}
    </div>
  );
};

export default Result;
