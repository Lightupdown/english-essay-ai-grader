
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  AlertCircle, 
  ChevronRight, 
  Info, 
  Lightbulb, 
  Zap, 
  CheckCircle2, 
  ImageIcon, 
  Trophy,
  ArrowRight,
  Target,
  Maximize2,
  Bookmark,
  Sparkles,
  ArrowLeft,
  Share2,
  Layers,
  Activity,
  Award,
  Terminal,
  BookOpen,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Wand2,
  ScanEye,
  Sparkle,
  BrainCircuit
} from 'lucide-react';
import Header from '../components/Header';
import { EssayRecord, FeedbackItem, FeedbackType, Essay, AnalyzeResult } from '../types';
import * as storage from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { getEssayById as getEssayByIdApi } from '../services/essay';

const SkeletonLoader = () => (
  <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
    <div className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-12 justify-between shrink-0">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="space-y-3">
          <div className="w-80 h-6 bg-slate-100 rounded-lg animate-pulse" />
          <div className="w-48 h-3 bg-slate-50 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="w-36 h-12 bg-slate-100 rounded-2xl animate-pulse" />
    </div>
    <div className="flex-1 container-1080p px-12 py-10 flex flex-col gap-10 min-h-0">
      <div className="grid grid-cols-4 gap-10 shrink-0">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm animate-pulse" />
        ))}
      </div>
      <div className="flex-1 grid grid-cols-12 gap-10 min-h-0">
        <div className="col-span-3 bg-white rounded-[3.5rem] animate-pulse border border-slate-100 shadow-sm" />
        <div className="col-span-6 bg-white rounded-[3.5rem] animate-pulse border border-slate-100 shadow-lg" />
        <div className="col-span-3 flex flex-col gap-10">
          <div className="flex-1 bg-white rounded-[3.5rem] animate-pulse border border-slate-100 shadow-sm" />
          <div className="h-64 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3.5rem] animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

const Result: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<EssayRecord | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [hoveredFeedback, setHoveredFeedback] = useState<FeedbackItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const textContainerRef = useRef<HTMLDivElement>(null);
  const { user, isTrial } = useAuth();

  // 转换服务器 Essay 到本地 EssayRecord
  const transformServerEssay = useCallback((essay: Essay): EssayRecord => {
    const feedback = essay.feedback;
    const result: AnalyzeResult = {
      essayId: essay._id,
      totalScore: essay.score,
      grammarScore: typeof feedback === 'object' && feedback !== null ? feedback.grammarScore : essay.score,
      vocabScore: typeof feedback === 'object' && feedback !== null ? feedback.vocabScore : essay.score,
      feedbacks: typeof feedback === 'object' && feedback !== null ? feedback.feedbacks || [] : [],
      rawText: typeof feedback === 'object' && feedback !== null ? feedback.rawText || essay.extractedText : essay.extractedText,
      commentary: typeof feedback === 'object' && feedback !== null ? feedback.commentary || '' : '',
    };
    return {
      id: essay._id,
      imageName: '上传的作文',
      imagePreviewUrl: essay.imageBase64 || '',
      createdAt: new Date(essay.createdAt).getTime(),
      status: 'analyzed' as const,
      result,
      rawText: essay.extractedText,
      isTrial: false,
    };
  }, []);

  const getTypeConfig = (type: FeedbackType) => {
    switch (type) {
      case 'error': return { 
        bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', highlight: 'bg-rose-100', label: '语法错误', icon: AlertCircle, progressColor: 'bg-rose-500'
      };
      case 'improvement': return { 
        bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', highlight: 'bg-amber-100', label: '地道改进', icon: Lightbulb, progressColor: 'bg-amber-500'
      };
      case 'highlight': return { 
        bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', highlight: 'bg-emerald-100', label: '精彩亮点', icon: Trophy, progressColor: 'bg-emerald-500'
      };
    }
  };

  // 辅助函数：智能格式化文本（合并过短的行，保持段落结构）
  const formatText = (rawText: string): string => {
    const lines = rawText.split('\n');
    const result: string[] = [];
    let i = 0;
    
    while (i < lines.length) {
      let line = lines[i].trim();
      let nextLine = lines[i + 1]?.trim();
      
      // 规则1: 如果当前行很短（< 12字符），尝试与下一行合并
      if (line.length > 0 && line.length < 12 && nextLine && nextLine.length > 10) {
        while (line.length < 30 && nextLine && nextLine.length > 5) {
          line = line + ' ' + nextLine;
          i++;
          nextLine = lines[i + 1]?.trim();
        }
        result.push(line);
        i++;
      }
      // 规则2: 如果当前行较短，与下一行用空格合并
      else if (line.length > 0 && line.length < 25 && nextLine && nextLine.length > 10) {
        const merged = line + ' ' + nextLine;
        if (merged.length < 80) {
          result.push(merged);
          i += 2;
        } else {
          result.push(line);
          i++;
        }
      }
      // 规则3: 空行保留作为段落分隔
      else if (line.length === 0 && result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      // 规则4: 普通行直接保留
      else if (line.length > 0) {
        result.push(line);
        i++;
      } else {
        i++;
      }
    }
    
    // 移除连续的空行
    const filtered = result.filter((l, idx) => {
      if (l === '' && idx > 0 && result[idx - 1] === '') {
        return false;
      }
      return true;
    });
    
    return filtered.join('\n');
  };

  const matchedFeedbacks = useMemo(() => {
    const rawText = record?.rawText || record?.result?.rawText || '';
    const feedbacks = record?.result?.feedbacks || [];
    const text = formatText(rawText);
    
    if (import.meta.env.DEV) {
      console.log('\n========== Result.tsx 匹配调试 ==========');
      console.log('原始文本长度:', rawText.length);
      console.log('格式化后文本长度:', text.length);
      console.log('格式化后文本前100字符:', text.substring(0, 100));
      console.log('feedbacks数量:', feedbacks.length);
      console.log('===================================\n');
    }
    
    if (!text || !feedbacks || feedbacks.length === 0) {
      return [];
    }
    
    const deduplicatedFeedbacks = feedbacks.filter((item, idx) => {
      return !feedbacks.some((other, otherIdx) => 
        otherIdx < idx && 
        other.segment === item.segment &&
        other.type === item.type
      );
    });
    
    // 辅助函数：将去除换行符后的位置映射回原始文本位置
    const mapPositionBack = (text: string, targetPos: number): number => {
      let cleanIdx = 0;
      for (let i = 0; i < text.length; i++) {
        if (text[i] !== '\n') {
          cleanIdx++;
          if (cleanIdx === targetPos) {
            return i;
          }
        }
      }
      return -1;
    };

    // 辅助函数：检查是否包含换行符
    const hasNewline = (str: string): boolean => str.includes('\n');

    // 辅助函数：移除换行符
    const removeNewlines = (str: string): string => str.replace(/\n/g, '');

    const findPosition = (segment: string, text: string, startPos: number = 0): number => {
      // 第1层: 精确匹配（保留所有字符，包括换行符）
      let pos = text.indexOf(segment, startPos);
      if (pos !== -1) return pos;

      // 第2层: 忽略大小写的精确匹配
      const lowerText = text.toLowerCase();
      const lowerSegment = segment.toLowerCase();
      pos = lowerText.indexOf(lowerSegment, startPos);
      if (pos !== -1) return pos;

      // 第3层: 如果segment或text包含换行符，尝试去除换行符后匹配
      if (hasNewline(segment) || hasNewline(text)) {
        const textNoNewlines = removeNewlines(text);
        const segmentNoNewlines = removeNewlines(segment);
        
        // 在无换行文本中搜索
        const posNoNewlines = textNoNewlines.indexOf(segmentNoNewlines, 
          removeNewlines(text.substring(0, startPos)).length);
        
        if (posNoNewlines !== -1) {
          // 将位置映射回原始文本
          const mappedPos = mapPositionBack(text, posNoNewlines);
          if (mappedPos !== -1) return mappedPos;
        }
        
        // 如果精确匹配失败，尝试忽略大小写的无换行匹配
        const lowerPosNoNewlines = textNoNewlines.toLowerCase().indexOf(segmentNoNewlines.toLowerCase(),
          removeNewlines(text.substring(0, startPos)).length);
        
        if (lowerPosNoNewlines !== -1) {
          const mappedPos = mapPositionBack(text, lowerPosNoNewlines);
          if (mappedPos !== -1) return mappedPos;
        }
      }

      // 第4层: 清理标点符号和多余空格后的匹配（保留换行符位置）
      const cleanSegment = segment.replace(/[.,;:!?()'"'"']/g, '').replace(/\s+/g, ' ');
      const cleanText = text.substring(startPos).replace(/[.,;:!?()'"'"']/g, '').replace(/\s+/g, ' ');
      const cleanMatch = cleanText.indexOf(cleanSegment);
      
      if (cleanMatch !== -1) {
        let cleanIdx = 0;
        let originalIdx = startPos;
        
        for (let i = startPos; i < text.length && cleanIdx < cleanMatch; i++) {
          const char = text[i];
          if (!/[.,;:!?()'"'"']/.test(char) && char !== '\n') {
            cleanIdx++;
          }
          if (cleanIdx === cleanMatch) {
            return originalIdx;
          }
          if (!/[.,;:!?()'"'"']/.test(char)) {
            originalIdx = i;
          }
        }
      }

      // 第5层: 关键词模糊匹配（基于清理后的关键词）
      const words = cleanSegment.split(' ').filter(w => w.length > 2);
      if (words.length >= 1) {
        for (let i = startPos; i < text.length; i++) {
          const window = text.substring(i, i + cleanSegment.length + 10);
          let matchedCount = 0;
          
          for (const word of words) {
            if (window.toLowerCase().includes(word.toLowerCase())) {
              matchedCount++;
            }
          }
          
          if (matchedCount >= Math.ceil(words.length * 0.9)) {
            return i;
          }
        }
      }

      return -1;
    };
    
    const processFeedbacks = deduplicatedFeedbacks.map((item, idx) => {
      // 始终从0开始搜索，不使用currentIdx限制
      const position = findPosition(item.segment, text, 0);
      
      return {
        ...item,
        position,
        originalIndex: idx
      };
    });
    
    if (import.meta.env.DEV) {
      console.log(`\n========== 匹配过程 ==========`);
      console.log(`格式化前文本长度: ${rawText.length}`);
      console.log(`格式化后文本长度: ${text.length}`);
      console.log(`格式化后文本前100字符: ${text.substring(0, 100)}...`);
      console.log(`总反馈数: ${feedbacks.length} (去重后: ${deduplicatedFeedbacks.length})`);
      
      processFeedbacks.forEach((item, idx) => {
        const { segment, position } = item;
        const contextStart = Math.max(0, position - 30);
        const contextEnd = position !== -1 ? Math.min(text.length, position + segment.length + 30) : 0;
        const context = position !== -1 ? text.substring(contextStart, contextEnd) : 'N/A';
        
        console.log(`\n[${idx + 1}] ${item.type.toUpperCase()}`);
        console.log(`    Segment: "${segment}"`);
        console.log(`    包含换行符: ${segment.includes('\\n') ? '是' : '否'}`);
        console.log(`    位置: ${position}`);
        console.log(`    上下文: "...${context.replace(/\\n/g, '↩')}..."`);
        
        if (position === -1) {
          console.log(`    ⚠️ 匹配失败 - 该反馈将不在原文中高亮显示`);
        } else {
          const actualSegment = text.substring(position, position + segment.length);
          const similarity = actualSegment === segment ? '100%' : `${Math.floor((actualSegment.length / segment.length) * 100)}%`;
          console.log(`    匹配度: ${similarity}`);
        }
      });
      
      console.log(`\n===================================\n`);
    }

    const matched = processFeedbacks.filter(item => item.position !== -1).sort((a, b) => a.position - b.position);

    if (import.meta.env.DEV) {
      const unmatchedCount = processFeedbacks.filter(item => item.position === -1).length;
      console.log(`\n========== 匹配结果 ==========`);
      console.log(`总共 ${feedbacks.length} 个反馈项`);
      console.log(`成功匹配: ${matched.length} 个`);
      console.log(`未匹配: ${unmatchedCount} 个`);
      console.log(`\n排序后的反馈（按文本位置）:`);
      matched.forEach((item, idx) => {
        console.log(`  [${idx + 1}] 位置 ${item.position}: "${item.segment.substring(0, 40)}..."`);
      });
      console.log(`\n将选中的第一条反馈: "${matched[0]?.segment?.substring(0, 50)}..." (位置: ${matched[0]?.position})`);
      console.log(`===================================\n`);
    }

    return matched;
   }, [record?.rawText, record?.result?.feedbacks]);

  useEffect(() => {
    if (matchedFeedbacks.length > 0 && !selectedFeedback) {
      setSelectedFeedback(matchedFeedbacks[0]);
    }
  }, [matchedFeedbacks, selectedFeedback]);

  const SelectedIcon = ({ size, className }: { size?: number; className?: string }) => {
    if (!selectedFeedback) return null;
    const Icon = getTypeConfig(selectedFeedback.type).icon;
    return <Icon size={size} className={className} />;
  };

  useEffect(() => {
    setIsLoading(true);
    if (!id) {
      setIsLoading(false);
      return;
    }

    // 尝试从本地存储加载（试用文章）
    const localData = storage.getEssay(id);
    if (localData) {
      setRecord(localData);
      setIsLoading(false);
      
      // 如果状态是 pending，轮询等待分析完成
      if (localData.status === 'pending') {
        const pollTimer = setInterval(() => {
          const updated = storage.getEssay(id);
          if (updated && updated.status === 'analyzed') {
            setRecord(updated);
            clearInterval(pollTimer);
          }
        }, 1000);
        return () => clearInterval(pollTimer);
      }
      return;
    }

    // 本地未找到，尝试从服务器加载（已登录用户）
    if (user) {
      const loadServerEssay = async () => {
        try {
          const serverEssay = await getEssayByIdApi(id);
          const transformed = transformServerEssay(serverEssay);
          setRecord(transformed);
        } catch (error) {
          console.error('加载服务器作文失败:', error);
          // 服务器加载失败，显示错误（在下方处理）
        } finally {
          setIsLoading(false);
        }
      };
      loadServerEssay();
    } else {
      // 既不是本地文章，用户也未登录，显示错误
      setIsLoading(false);
    }
  }, [id, user, transformServerEssay]);

  if (isLoading) return <SkeletonLoader />;

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-36 h-36 bg-white rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex items-center justify-center mb-10 text-rose-500">
          <AlertCircle size={72} className="animate-bounce" />
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

  // 状态1: pending - OCR完成，等待AI分析（可阅读OCR内容）
  if (record.status === 'pending' && record.rawText) {
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfdfe]">
        <Header title="OCR识别完成" showBack onExport={() => {}} />
        <div className="flex-1 flex flex-col container-1080p px-12 py-10 gap-10 min-h-0 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* 左侧 - OCR文本内容（可阅读） */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">OCR 识别完成</h3>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-0.5">可阅读文本</p>
                  </div>
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
            
            {/* 右侧 - AI分析加载状态 */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg animate-pulse">
                    <Wand2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">AI 深度分析</h3>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-0.5">进行中...</p>
                  </div>
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
                
                {/* 提示：可以先阅读OCR内容 */}
                <p className="text-xs text-slate-400 mt-8">
                  💡 提示：您可以先阅读左侧的OCR识别内容
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 状态2: analyzing - 旧的加载状态（保留兼容性）
  if (record.status === 'analyzing') {
    const rawText = record.rawText || '';
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfdfe]">
        <Header title="AI 分析进行中" showBack onExport={() => {}} />
        <div className="flex-1 flex flex-col container-1080p px-12 py-10 gap-10 min-h-0 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">OCR 识别结果</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Digital Text</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600">识别完成</span>
                </div>
              </div>
              
               <div className="flex-1 bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
                 <div className="p-8 overflow-y-auto h-full">
                   <p className="text-xl leading-loose font-medium text-slate-700 whitespace-pre-wrap break-words">{rawText}</p>
                 </div>
               </div>
            </div>
             
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg animate-pulse">
                    <Wand2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">AI 深度分析</h3>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Analyzing</p>
                  </div>
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

  // 状态3: analyzed - 分析完成
  if (!result || !result.rawText) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-36 h-36 bg-white rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex items-center justify-center mb-10 text-amber-500">
          <AlertCircle size={72} className="animate-pulse" />
        </div>
        <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">数据解析不完整</h2>
        <p className="text-slate-400 mb-6 max-w-lg font-medium text-lg">批改结果可能包含不完整的数据。API返回的原始文本为空。</p>
        {import.meta.env.DEV && (
          <div className="mb-8 p-6 bg-slate-100 rounded-2xl max-w-2xl text-left">
            <p className="text-sm font-bold text-slate-600 mb-2">调试信息:</p>
            <pre className="text-xs text-slate-500 overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
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

  if (!result.rawText) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-36 h-36 bg-white rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex items-center justify-center mb-10 text-amber-500">
          <AlertCircle size={72} className="animate-pulse" />
        </div>
        <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">数据解析不完整</h2>
        <p className="text-slate-400 mb-6 max-w-lg font-medium text-lg">批改结果可能包含不完整的数据。API返回的原始文本为空。</p>
        {import.meta.env.DEV && (
          <div className="mb-8 p-6 bg-slate-100 rounded-2xl max-w-2xl text-left">
            <p className="text-sm font-bold text-slate-600 mb-2">调试信息:</p>
            <pre className="text-xs text-slate-500 overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfdfe]">
      <Header title="名师 AI 深度批阅报告" showBack onExport={() => alert('PDF 报告生成中...')} />

      <div className="flex-1 flex flex-col container-1080p px-4 md:px-12 py-4 md:py-10 gap-4 md:gap-10 min-h-0 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
        
        {/* 顶部核心指标区 - Row 1: grid-cols-4 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8 shrink-0">
          
          {/* 综合诊断分数卡 */}
          <div className="relative bg-white/90 backdrop-blur-sm p-4 md:p-10 rounded-2xl md:rounded-[3.5rem] border-l-4 md:border-l-[20px] border-indigo-600 flex items-center justify-between shadow-2xl shadow-indigo-100/50 overflow-hidden group hover:scale-[1.02] transition-all duration-500">
            <div className="relative z-10">
              <p className="text-[8px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 md:mb-3">OVERALL SCORE</p>
              <div className="flex items-baseline gap-1 md:gap-2">
                <h4 className={`text-3xl md:text-7xl font-black bg-gradient-to-r ${getScoreColor(result.totalScore)} bg-clip-text text-transparent tracking-tighter leading-none`}>
                  {result.totalScore}
                </h4>
                <span className="text-sm md:text-xl font-black text-slate-200">/100</span>
              </div>
              <div className="mt-1 md:mt-3 inline-block px-2 md:px-4 py-1 md:py-1.5 bg-slate-100 rounded-full">
                <span className="text-xs md:text-sm font-bold text-slate-600">{scoreGrade(result.totalScore)}</span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 md:w-24 md:h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl md:rounded-[2.5rem] flex items-center justify-center text-white shadow-lg group-hover:rotate-[12deg] group-hover:scale-110 transition-all duration-700">
                <Activity size={24} className="md:size-12" />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 md:w-40 md:h-40 bg-gradient-to-br from-indigo-600/10 to-indigo-600/5 rounded-full -mr-10 -mt-10 md:-mr-20 md:-mt-20 group-hover:scale-150 transition-transform duration-1000 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-16 h-16 md:w-32 md:h-32 bg-indigo-600/5 rounded-full -ml-8 -mb-8 md:-ml-16 md:-mb-16 group-hover:scale-120 transition-transform duration-1000 pointer-events-none" />
          </div>

          {/* 语法评分卡 */}
          <div className={`relative bg-white rounded-2xl md:rounded-[3rem] p-4 md:p-8 flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer
            ${result.grammarScore < 60 ? 'animate-pulse ring-2 md:ring-4 ring-rose-500/30' : 'hover:-translate-y-[6px] md:hover:-translate-y-[12px] hover:shadow-indigo-200/50'}`}
          >
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white">
                  <BookOpen size={16} className="md:size-5" />
                </div>
                <span className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest">GRAMMAR</span>
              </div>
              <div className="flex items-baseline gap-1 md:gap-2 mb-1 md:mb-2">
                <span className="text-2xl md:text-5xl font-black text-slate-900">{result.grammarScore}</span>
                <span className="text-sm md:text-lg font-bold text-slate-300">/100</span>
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-500">语法精密度</p>
            </div>
            <div className="mt-2 md:mt-4">
              <div className="h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getScoreColor(result.grammarScore)} transition-all duration-1000 rounded-full`}
                  style={{ width: `${result.grammarScore}%` }}
                />
              </div>
            </div>
            {result.grammarScore < 60 && (
              <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-rose-500 rounded-full animate-ping pointer-events-none" />
            )}
          </div>

          {/* 词汇评分卡 */}
          <div className={`relative bg-white rounded-2xl md:rounded-[3rem] p-4 md:p-8 flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer
            ${result.vocabScore < 60 ? 'animate-pulse ring-2 md:ring-4 ring-rose-500/30' : 'hover:-translate-y-[6px] md:hover:-translate-y-[12px] hover:shadow-indigo-200/50'}`}
          >
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg md:rounded-xl flex items-center justify-center text-white">
                  <FileText size={16} className="md:size-5" />
                </div>
                <span className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest">VOCABULARY</span>
              </div>
              <div className="flex items-baseline gap-1 md:gap-2 mb-1 md:mb-2">
                <span className="text-2xl md:text-5xl font-black text-slate-900">{result.vocabScore}</span>
                <span className="text-sm md:text-lg font-bold text-slate-300">/100</span>
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-500">词汇高级感</p>
            </div>
            <div className="mt-2 md:mt-4">
              <div className="h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getScoreColor(result.vocabScore)} transition-all duration-1000 rounded-full`}
                  style={{ width: `${result.vocabScore}%` }}
                />
              </div>
            </div>
            {result.vocabScore < 60 && (
              <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-rose-500 rounded-full animate-ping pointer-events-none" />
            )}
          </div>

          {/* 专家点睛卡片 */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl md:rounded-[3.5rem] p-4 md:p-8 relative overflow-hidden shadow-2xl flex flex-col">
            <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32">
              <Sparkles size={64} className="md:size-32 text-indigo-400/20 animate-spin-slow" style={{ animationDuration: '20s' }} />
            </div>
            <div className="absolute bottom-0 left-0 w-12 h-12 md:w-24 md:h-24">
              <Sparkles size={48} className="md:size-24 text-indigo-400/15 animate-spin-slow" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
            </div>
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-3">
                <Award size={16} className="md:size-5 text-indigo-200" />
                <h4 className="text-sm md:text-base font-black text-white">专家点睛</h4>
              </div>
              <div className="flex-1">
                <p className="text-indigo-100/90 text-xs md:text-sm font-medium leading-relaxed">
                  {result.commentary || (
                    result.totalScore >= 85 
                      ? '这篇作文展现了出色的语言功底，结构清晰，用词精准。继续保持这种高水平写作能力！'
                      : result.totalScore >= 70
                      ? '整体表现良好，建议在词汇丰富度和句式多样性上进一步提升。'
                      : '需要在语法准确性和词汇积累上多加练习，建议多读英文原版材料。'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 中间数字化交互主区 - Row 2: 12列网格 3:6:3 */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 min-h-0">
          
          {/* 左侧 - 原稿预览窗 (Col 3) */}
          <div className="md:col-span-3 bg-white rounded-2xl md:rounded-[3.5rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden group">
            <div className="px-4 md:px-8 py-3 md:py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-md">
                  <ImageIcon size={16} className="md:size-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-black text-slate-900">原稿预览</h3>
                  <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Original Document</p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-3 md:p-6 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={record.imagePreviewUrl} 
                  alt="Original essay"
                  className="max-w-full max-h-full object-contain rounded-xl md:rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] border-4 md:border-[8px] border-white"
                />
              </div>
            </div>
          </div>

          {/* 中间 - 数字化解析流 (Col 6) */}
          <div className="md:col-span-6 bg-white/80 backdrop-blur-md rounded-2xl md:rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            <div className="px-4 md:px-10 py-3 md:py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-md">
                    <Terminal size={16} className="md:size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-lg font-black text-slate-900">数字化解析流</h3>
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Digital Analysis Flow</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="text-[8px] md:text-xs font-bold text-slate-400">点击查看详情</span>
                  <ChevronRight size={12} className="md:size-4 text-slate-400" />
                </div>
              </div>
            </div>
               <div ref={textContainerRef} className="flex-1 overflow-y-auto px-4 md:px-10 py-4 md:py-8 bg-gradient-to-b from-white to-slate-50/30">
                 <div className="text-lg md:text-2xl leading-relaxed md:leading-loose font-medium whitespace-pre-wrap">
                   {(() => {
                     const rawText = record?.rawText || record?.result?.rawText || '';
                     const text = formatText(rawText);
                     const feedbacks = record?.result?.feedbacks || [];
                     
                     if (!text || text.trim().length === 0) {
                       return <div className="text-slate-400 text-sm md:text-lg font-medium text-center py-8 md:py-12">暂无数字化文本</div>;
                     }

                     if (!feedbacks || feedbacks.length === 0) {
                       return <div className="text-slate-800 text-lg md:text-xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">{text}</div>;
                     }

                     if (matchedFeedbacks.length === 0) {
                       return <div className="text-slate-800 text-lg md:text-xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">{text}</div>;
                     }

                     let parts: React.ReactNode[] = [];
                     let currentIdx = 0;

                     matchedFeedbacks.forEach((item, idx) => {
                       const { position, segment } = item;
                       
                       if (position < currentIdx) {
                         return;
                      }
                      
                      parts.push(
                        <span 
                          key={`t-${idx}`} 
                          className="text-slate-400 font-medium animate-in fade-in slide-in-from-bottom-6 duration-700"
                          style={{ animationDelay: `${idx * 100}ms` }}
                        >
                          {text.substring(currentIdx, position)}
                        </span>
                      );
                      
                      const config = getTypeConfig(item.type);
                      const isSelected = selectedFeedback?.segment === item.segment;
                      const isHovered = hoveredFeedback?.segment === item.segment;
                      
                      parts.push(
                        <span 
                          key={`f-${idx}`}
                          onMouseEnter={() => setHoveredFeedback(item)}
                          onMouseLeave={() => setHoveredFeedback(null)}
                          onClick={() => setSelectedFeedback(item)}
                          className={`relative inline-block px-2 md:px-4 py-1 md:py-2 mx-1 md:mx-2 border-b-4 md:border-b-[8px] cursor-pointer transition-all duration-200 rounded-lg md:rounded-[1.2rem] font-black text-base md:text-xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 whitespace-pre-wrap
                            ${config.bg} ${config.text} ${config.border}
                            ${isSelected 
                              ? 'scale-105 z-20 translate-y-[-2px] shadow-lg ring-2 md:ring-4 ring-indigo-500/20 border-2 border-indigo-500' 
                              : 'opacity-90 hover:opacity-100 hover:translate-y-[-1px] hover:scale-102 hover:shadow-md'
                            }
                            ${isHovered && !isSelected ? 'shadow-lg scale-105' : ''}`}
                          style={{ animationDelay: `${200 + idx * 100}ms` }}
                        >
                          {text.substring(position, position + segment.length)}
                          {isSelected && (
                            <Sparkles 
                              className="absolute -top-3 -right-3 md:-top-5 md:-right-5 text-indigo-500 animate-pulse" 
                              size={18} className="md:size-7"
                            />
                          )}
                        </span>
                      );
                      currentIdx = position + segment.length;
                    });

                    parts.push(
                      <span 
                        key="end" 
                        className="text-slate-400 font-medium animate-in fade-in slide-in-from-bottom-6 duration-700"
                        style={{ animationDelay: `${200 + matchedFeedbacks.length * 100}ms` }}
                      >
                        {text.substring(currentIdx)}
                      </span>
                    );

                    return parts;
                  })()}
                </div>
              </div>
           </div>

            {/* 右侧 - 详情解析面板 + 专家点睛 (Col 3) */}
            <div className="md:col-span-3 flex flex-col gap-3 md:gap-6">
              
              {/* 详情解析面板 - 感知式面板 */}
             {selectedFeedback && (
               <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-[3.5rem] p-4 md:p-8 shadow-xl border-2 border-slate-200 flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
                 <div className="flex items-center justify-between mb-3 md:mb-6">
                   <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] ${getTypeConfig(selectedFeedback.type).bg} shadow-lg flex items-center justify-center ring-2 md:ring-4 ring-white`}>
                     <SelectedIcon size={20} className="md:size-8 ${getTypeConfig(selectedFeedback.type).text}" />
                   </div>
                   <span className={`px-3 md:px-6 py-1.5 md:py-2.5 rounded-full text-xs md:text-sm font-black uppercase tracking-wider ${getTypeConfig(selectedFeedback.type).bg} ${getTypeConfig(selectedFeedback.type).text} shadow-sm`}>
                     {getTypeConfig(selectedFeedback.type).label}
                   </span>
                 </div>
                 
                 {/* 检测片段 */}
                 <div className="mb-3 md:mb-6">
                   <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3">
                     <ScanEye size={14} className="md:size-5 text-indigo-500" />
                     <p className="text-xs md:text-sm font-black text-indigo-600 uppercase tracking-wider">检测片段</p>
                   </div>
                   <div className={`p-3 md:p-6 rounded-xl md:rounded-[1.5rem] ${getTypeConfig(selectedFeedback.type).highlight} border-2 border-current shadow-inner`}>
                     <p className="font-black text-sm md:text-lg leading-relaxed text-slate-800">{selectedFeedback.segment}</p>
                   </div>
                 </div>
                 
                 {selectedFeedback.suggestion && (
                   <div className="mb-3 md:mb-6">
                     <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3">
                       <Sparkle size={14} className="md:size-5 text-amber-500" />
                       <p className="text-xs md:text-sm font-black text-amber-600 uppercase tracking-wider">优化建议</p>
                     </div>
                     <div className="p-3 md:p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl md:rounded-[1.5rem] border-2 border-amber-200 shadow-sm">
                       <p className="text-amber-900 leading-relaxed font-bold text-xs md:text-base">{selectedFeedback.suggestion}</p>
                     </div>
                   </div>
                 )}
                 
                 {/* 深度解析 - 支持 Markdown */}
                 <div className="flex-1 flex flex-col min-h-0">
                   <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3">
                     <BrainCircuit size={14} className="md:size-5 text-emerald-500" />
                     <p className="text-xs md:text-sm font-black text-emerald-600 uppercase tracking-wider">深度解析</p>
                   </div>
                   <div className="flex-1 p-3 md:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl md:rounded-[1.5rem] border-2 border-emerald-200 shadow-sm overflow-y-auto">
                     <div className="prose prose-emerald prose-sm max-w-none">
                       <ReactMarkdown
                         components={{
                           p: ({ children }) => <p className="mb-2 md:mb-3 text-slate-700 leading-relaxed text-xs md:text-base">{children}</p>,
                           strong: ({ children }) => <strong className="font-bold text-emerald-800">{children}</strong>,
                           em: ({ children }) => <em className="italic text-emerald-700">{children}</em>,
                           ul: ({ children }) => <ul className="list-disc list-inside mb-2 md:mb-3 text-slate-700 space-y-1 text-xs md:text-base">{children}</ul>,
                           ol: ({ children }) => <ol className="list-decimal list-inside mb-2 md:mb-3 text-slate-700 space-y-1 text-xs md:text-base">{children}</ol>,
                           li: ({ children }) => <li className="text-slate-700 text-xs md:text-base">{children}</li>,
                           br: () => <br className="my-0.5 md:my-1" />,
                         }}
                       >
                         {selectedFeedback.explanation}
                       </ReactMarkdown>
                     </div>
                   </div>
                 </div>
               </div>
             )}
            </div>
         </div>
       </div>
    </div>
  );
};

export default Result;
