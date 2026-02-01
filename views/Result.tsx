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
  GitCompare,
  History,
  LayoutGrid,
  MessageSquare,
  FileText as FileTextIcon
} from 'lucide-react';
import Header from '../components/Header';
import ComparisonModal from '../components/ComparisonModal';
import { EssayRecord, FeedbackItem, FeedbackType, AnalyzeResult, GradeLevel, GRADE_CONFIGS, ComparisonConfig } from '../types';
import * as storage from '../utils/storage';
import { generateModelEssay } from '../services/comparison';
import * as comparisonStorage from '../utils/comparisonStorage';
import { exportEssayReport } from '../utils/essayExport';

const typeOrder = { error: 0, improvement: 1, highlight: 2 };

type TabType = 'overview' | 'feedback' | 'original';

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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isCommentaryExpanded, setIsCommentaryExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    if (!id) {
      setIsLoading(false);
      return;
    }

    const loadData = () => {
      const localData = storage.getEssay(id);
      if (localData) {
        setRecord(localData);
        return localData;
      }
      return null;
    };

    // 初始加载
    const data = loadData();
    setIsLoading(false);

    // 如果状态是 pending，启动轮询
    let intervalId: NodeJS.Timeout | null = null;
    if (data?.status === 'pending') {
      intervalId = setInterval(() => {
        const updatedData = loadData();
        // 如果分析完成，停止轮询
        if (updatedData?.status === 'analyzed') {
          if (intervalId) clearInterval(intervalId);
        }
      }, 2000); // 每2秒检查一次
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
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
      <div className="flex-1 flex flex-col min-h-screen bg-[#fcfdfe]">
        <Header title="OCR识别完成" showBack onExport={() => {}} />
        <div className="flex-1 flex flex-col container-1080p px-4 md:px-12 py-4 md:py-10 gap-4 md:gap-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 size={16} className="md:size-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-black text-slate-900">OCR 识别完成</h3>
                  <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest mt-0.5">可阅读文本</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl md:rounded-[3rem] shadow-lg md:shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-4 md:p-8 max-h-[50vh] md:max-h-[60vh] overflow-y-auto">
                  <p className="text-sm md:text-xl leading-relaxed md:leading-loose font-medium text-slate-700 whitespace-pre-wrap break-words">
                    {record.rawText}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Sparkles size={16} className="md:size-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-black text-slate-900">AI 深度分析</h3>
                  <p className="text-[10px] md:text-xs font-bold text-indigo-400 uppercase tracking-widest mt-0.5">进行中...</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl md:rounded-[3rem] shadow-lg md:shadow-xl border border-slate-100 p-6 md:p-12">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-4 md:mb-8">
                  <div className="w-14 h-14 md:w-24 md:h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={32} className="md:size-12 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 mb-2 md:mb-4">AI 正在分析...</h3>
                <p className="text-slate-500 text-sm md:text-lg font-medium text-center mb-4 md:mb-8">
                  我们的 AI 导师正在深度分析您的作文，<br className="hidden md:block"/>包括语法检查、词汇评分和改进建议
                </p>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-6 h-6 md:w-8 md:h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-xs md:text-sm font-bold text-indigo-600">请稍候，大约需要 15-30 秒</span>
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

  // Mobile Tab Navigation Component
  const MobileTabNav = () => (
    <div className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex">
        {[
          { id: 'overview', label: '总览', icon: LayoutGrid },
          { id: 'feedback', label: `反馈(${sortedFeedbacks.length})`, icon: MessageSquare },
          { id: 'original', label: '原文', icon: FileTextIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-2 text-xs font-bold transition-all ${
                isActive 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Score Cards Component
  const ScoreCards = () => (
    <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4">
      <div className="relative bg-white/90 backdrop-blur-sm p-2 md:p-6 rounded-xl md:rounded-2xl border-l-3 md:border-l-[12px] border-indigo-600 flex flex-col items-center justify-center shadow-lg md:shadow-xl">
        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5 md:mb-2">总分</p>
        <h4 className={`text-xl md:text-5xl font-black bg-gradient-to-r ${getScoreColor(result.totalScore)} bg-clip-text text-transparent`}>
          {result.totalScore}
        </h4>
        <span className="text-[10px] md:text-sm font-bold text-slate-300">/100</span>
      </div>

      <div className="relative bg-white p-2 md:p-6 rounded-xl md:rounded-2xl flex flex-col items-center justify-center shadow-md md:shadow-lg">
        <div className="flex items-center gap-0.5 md:gap-2 mb-0.5 md:mb-2">
          <BookOpen size={10} className="md:size-4 text-indigo-500" />
          <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase">语法</p>
        </div>
        <h4 className="text-lg md:text-4xl font-black text-slate-900">{result.grammarScore}</h4>
        <span className="text-[10px] md:text-sm font-bold text-slate-300">/100</span>
      </div>

      <div className="relative bg-white p-2 md:p-6 rounded-xl md:rounded-2xl flex flex-col items-center justify-center shadow-md md:shadow-lg">
        <div className="flex items-center gap-0.5 md:gap-2 mb-0.5 md:mb-2">
          <FileText size={10} className="md:size-4 text-amber-500" />
          <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase">词汇</p>
        </div>
        <h4 className="text-lg md:text-4xl font-black text-slate-900">{result.vocabScore}</h4>
        <span className="text-[10px] md:text-sm font-bold text-slate-300">/100</span>
      </div>
    </div>
  );

  // Expert Commentary Component
  const ExpertCommentary = () => (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl md:rounded-2xl p-3 md:p-6 relative overflow-hidden shadow-lg md:shadow-xl">
      <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 opacity-20">
        <Sparkles size={40} className="md:size-20 text-indigo-400 animate-spin-slow" style={{ animationDuration: '20s' }} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Award size={14} className="md:size-5 text-indigo-200" />
            <h4 className="text-xs md:text-base font-black text-white">专家点睛</h4>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate('/comparison-history')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-bold transition-colors"
            >
              <History size={12} />
              范文历史
            </button>
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-bold transition-colors"
            >
              <GitCompare size={12} />
              同题对比
            </button>
          </div>
        </div>
        <div className={`transition-all duration-300 ${isCommentaryExpanded ? '' : 'max-h-16 overflow-hidden'}`}>
          <p className="text-indigo-100/90 text-xs md:text-sm font-medium leading-relaxed">
            {result.commentary || '这篇作文展现了不错的写作能力，建议在词汇丰富度和句式多样性上进一步提升。'}
          </p>
        </div>
        <button
          onClick={() => setIsCommentaryExpanded(!isCommentaryExpanded)}
          className="md:hidden mt-2 text-xs font-bold text-indigo-200 flex items-center gap-1"
        >
          {isCommentaryExpanded ? (
            <>
              <ChevronUp size={12} />
              收起
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              展开
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Original Text Component
  const OriginalTextSection = () => (
    <div className="bg-white rounded-xl md:rounded-[3rem] shadow-lg md:shadow-xl border-2 border-indigo-100 flex flex-col overflow-hidden">
      <div className="px-3 md:px-6 py-2.5 md:py-4 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-indigo-50">
        <h3 className="text-base md:text-3xl font-black text-indigo-900 text-center">作文原文</h3>
      </div>
      <div className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[60vh] md:max-h-none">
        <p className="text-sm md:text-2xl leading-relaxed md:leading-loose font-medium md:font-bold text-slate-800 whitespace-pre-wrap break-words">
          {result.rawText}
        </p>
      </div>
    </div>
  );

  // Feedback List Component
  const FeedbackList = () => (
    <div className="bg-white/80 backdrop-blur-md rounded-xl md:rounded-[3.5rem] shadow-xl md:shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
      <div className="px-3 md:px-6 py-2.5 md:py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-md">
            <Activity size={14} className="md:size-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-black text-slate-900">反馈列表</h3>
            <p className="text-[10px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Feedback Items ({sortedFeedbacks.length})</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 md:max-h-[70vh]">
        {sortedFeedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 md:py-12">
            <CheckCircle2 size={48} className="md:size-16 text-emerald-500 mb-3 md:mb-4" />
            <h3 className="text-lg md:text-2xl font-black text-slate-900 mb-2">完美！</h3>
            <p className="text-slate-500 text-xs md:text-base font-medium">未发现任何问题，您的作文表现优异！</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 md:gap-4">
            {sortedFeedbacks.map((feedback, idx) => {
              const config = getTypeConfig(feedback.type);
              const isExpanded = expandedFeedback === feedback.segment;
              const Icon = config.icon;

              return (
                <div
                  key={idx}
                  className={`rounded-xl md:rounded-2xl shadow-md md:shadow-lg transition-all duration-300 overflow-hidden
                    ${config.bg} ${config.border} border-2
                    ${isExpanded ? 'shadow-lg md:shadow-xl' : 'hover:shadow-md md:hover:shadow-lg hover:-translate-y-0.5 md:hover:-translate-y-1'}`}
                >
                  <div
                    className="p-2.5 md:p-5 cursor-pointer"
                    onClick={() => toggleExpand(feedback.segment)}
                  >
                    <div className="flex items-start gap-2.5 md:gap-4">
                      <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl ${config.text} ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon size={14} className="md:size-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                          <span className={`text-[11px] md:text-sm font-black uppercase tracking-wider ${config.text}`}>
                            {config.label}
                          </span>
                          {feedback.category && (
                            <span className="text-[9px] md:text-xs font-bold text-slate-500 bg-white/50 px-1.5 md:px-2 py-0.5 rounded-full">
                              {feedback.category}
                            </span>
                          )}
                        </div>
                        
                        <div className="bg-white/60 rounded-lg md:rounded-2xl p-2 md:p-4 mb-1.5 md:mb-3">
                          <p className="text-xs md:text-lg font-bold text-slate-800 leading-relaxed break-words">
                            {feedback.segment}
                          </p>
                        </div>

                        {!isExpanded && (
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] md:text-sm font-medium text-slate-600 line-clamp-2 flex-1">
                              {feedback.explanation}
                            </p>
                            <div className={`ml-2 shrink-0 ${config.text}`}>
                              <ChevronDown size={14} className="md:size-5" />
                            </div>
                          </div>
                        )}

                        {isExpanded && (
                          <div className={`ml-2 shrink-0 ${config.text}`}>
                            <ChevronUp size={14} className="md:size-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-2.5 md:px-5 pb-2.5 md:pb-5 pt-0 border-t border-white/30">
                      <div className="flex items-center gap-1 md:gap-2 mb-1.5 md:mb-3 mt-2.5 md:mt-4">
                        <BrainCircuit size={12} className="md:size-5 text-emerald-500" />
                        <p className="text-[10px] md:text-sm font-black text-emerald-600 uppercase tracking-wider">深度解析</p>
                      </div>
                      <div className="bg-white/60 rounded-lg md:rounded-2xl p-2 md:p-5 mb-2 md:mb-4">
                        <p className="text-xs md:text-lg font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {feedback.explanation}
                        </p>
                      </div>

                      {feedback.suggestion && (
                        <>
                          <div className="flex items-center gap-1 md:gap-2 mb-1.5 md:mb-3">
                            <Sparkles size={12} className="md:size-5 text-amber-500" />
                            <p className="text-[10px] md:text-sm font-black text-amber-600 uppercase tracking-wider">优化建议</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg md:rounded-2xl p-2 md:p-5 border border-amber-200">
                            <p className="text-xs md:text-lg font-bold text-amber-900 leading-relaxed whitespace-pre-wrap">
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
  );

  // Mobile Overview Content
  const MobileOverview = () => (
    <div className="flex flex-col gap-3 p-3">
      {gradeConfig && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
          <span className="text-lg">📚</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-indigo-700">{gradeConfig.label}</span>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                {gradeConfig.description}
              </span>
            </div>
            <p className="text-[10px] text-indigo-500 font-medium mt-0.5">
              评分标准：{gradeConfig.criteria}
            </p>
          </div>
        </div>
      )}

      <ScoreCards />
      <ExpertCommentary />
      
      {/* Mobile Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <button
          onClick={() => navigate('/comparison-history')}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-bold shadow-sm"
        >
          <History size={14} />
          范文历史
        </button>
        <button
          onClick={() => setIsComparisonModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          <GitCompare size={14} />
          同题对比
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col">
      <Header 
        title="名师 AI 深度批阅报告" 
        showBack 
        onExport={() => {
          if (record && record.result) {
            exportEssayReport(record, result);
          }
        }} 
      />



      {/* Desktop Layout */}
      <div className="hidden md:block flex-1 overflow-hidden">
        <div className="h-full container-1080p px-12 py-10 flex flex-col gap-8">
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

          <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
            <div className="col-span-5 flex flex-col gap-6 overflow-hidden">
              <ScoreCards />
              <ExpertCommentary />
              <OriginalTextSection />
            </div>
            <div className="col-span-7">
              <FeedbackList />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Fixed tab navigation with scrollable content */}
      <div className="md:hidden flex-1 flex flex-col relative">
        {/* Mobile Tab Navigation - Sticky at top */}
        <div className="sticky top-0 bg-white border-b border-slate-200 z-40 shadow-sm">
          <div className="flex">
            {[
              { id: 'overview', label: '总览', icon: LayoutGrid },
              { id: 'feedback', label: `反馈(${sortedFeedbacks.length})`, icon: MessageSquare },
              { id: 'original', label: '原文', icon: FileTextIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive 
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && <MobileOverview />}
          {activeTab === 'feedback' && (
            <div className="p-3 pb-20">
              <FeedbackList />
            </div>
          )}
          {activeTab === 'original' && (
            <div className="p-3 pb-20">
              <OriginalTextSection />
            </div>
          )}
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
