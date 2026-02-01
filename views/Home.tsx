
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  Wand2, 
  Trash2, 
  ChevronRight, 
  X, 
  ChevronLeft,
  Search,
  History,
  FileText,
  Sparkles,
  Calendar,
  Award,
  Plus,
  AlertCircle,
  Check,
  Pencil
} from 'lucide-react';
import Header from '../components/Header';
import { EssayRecord, GradeLevel } from '../types';
import * as storage from '../utils/storage';
import { compressImage } from '../utils/imageCompression';
import { useAuth } from '../contexts/AuthContext';


const ITEMS_PER_PAGE = 8;

const Home: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [localHistory, setLocalHistory] = useState<EssayRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { canAnalyze, remainingAttempts, dailyLimit, recordAttempt } = useAuth();

  // 加载本地历史记录
  useEffect(() => {
    setLocalHistory(storage.getEssays());
  }, []);

  // 只使用本地历史记录（移除了登录功能）
  const history = localHistory;

  const filteredHistory = useMemo(() => {
    return history.filter(item => 
      item.imageName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [history, searchQuery]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) return alert('请上传有效的图片文件');
    
    // 清除之前的选择，允许重新上传
    setSelectedFile(null);
    setPreviewUrl(null);
    
    // 使用 setTimeout 确保状态更新后再设置新文件
    setTimeout(async () => {
      setSelectedFile(file);
      // 压缩图片后存储，减少 localStorage 占用
      try {
        const compressedUrl = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 600,
          quality: 0.7,
          type: 'image/jpeg'
        });
        setPreviewUrl(compressedUrl);
      } catch (error) {
        console.error('图片压缩失败:', error);
        // 如果压缩失败，使用原始方式
        setPreviewUrl(URL.createObjectURL(file));
      }
    }, 0);
  };

  const startAnalysis = async () => {
    if (!selectedFile || !previewUrl) return;
    if (!selectedGrade) {
      alert('请先选择英语水平！');
      return;
    }
    
    // 检查是否还有分析次数
    if (!canAnalyze) {
      alert(`今日分析次数已用完（${dailyLimit}次/天），请明天再来！`);
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((res) => {
        reader.onload = () => res(reader.result as string);
      });
      reader.readAsDataURL(selectedFile);
      const base64 = await base64Promise;
      
      const id = Date.now().toString();
      
      // 分析流程：直接调用AI路由，存储在本地
        // Step 1: OCR识别
        const ocrResponse = await fetch('/api/ai/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        
        if (!ocrResponse.ok) {
          const errorData = await ocrResponse.json();
          throw new Error(errorData.error || 'OCR识别失败');
        }
        
        const ocrResult = await ocrResponse.json();
        const rawText = ocrResult.text;
        
        // Step 2: 保存OCR结果，状态为 pending（等待AI分析）
        const newRecord: EssayRecord = {
          id,
          imageName: selectedFile.name,
          imagePreviewUrl: previewUrl,
          createdAt: Date.now(),
          status: 'pending',
          rawText,
          isTrial: true
        };
        storage.saveEssay(newRecord);
        setLocalHistory(storage.getEssays());
        
        // 记录分析次数
        recordAttempt();
        
        // Step 3: 立即跳转到结果页（显示OCR内容）
        navigate(`/result/${id}`);
        
        // Step 4: 后台进行AI分析（不影响用户阅读OCR内容）
        fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: rawText, essayId: id, gradeLevel: selectedGrade })
        })
          .then(res => res.json())
          .then(result => {
            // 分析完成后更新状态
            storage.updateEssay(id, {
              status: 'analyzed',
              result: {
                ...result,
                gradeLevel: selectedGrade
              }
            });
            setLocalHistory(storage.getEssays());
          })
          .catch(error => {
            console.error('AI分析失败:', error);
            // 分析失败也标记为 analyzed，但显示错误信息
            storage.updateEssay(id, {
              status: 'analyzed',
              result: {
                essayId: id,
                gradeLevel: selectedGrade,
                totalScore: 0,
                grammarScore: 0,
                vocabScore: 0,
                feedbacks: [],
                rawText,
                commentary: '分析失败，请重试'
              }
            });
            setLocalHistory(storage.getEssays());
          });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '分析遇到了问题，请检查网络后重试';
      alert(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条批改记录吗？')) {
      storage.deleteEssay(id);
      // 更新本地历史记录
      setLocalHistory(storage.getEssays());
      if (paginatedHistory.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    }
  };

  const handleStartEdit = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
    // 聚焦输入框
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  const handleSaveTitle = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const trimmedTitle = editingTitle.trim();
    if (trimmedTitle && trimmedTitle !== localHistory.find(h => h.id === id)?.imageName) {
      storage.updateEssay(id, { imageName: trimmedTitle });
      setLocalHistory(storage.getEssays());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingTitle('');
  };

  const handleTitleKeyDown = (id: string, e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSaveTitle(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingTitle('');
    }
  };

  return (
    <div className="flex-1 bg-[#f8fafc] min-h-screen">
      <Header title="AI 英语名师批改系统" subTitle="测试版 - 仅供本校师生试用" />
      
      <main className="container-1080p px-4 md:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-12">
          
          {/* 左侧上传区 */}
          <div className="xl:col-span-4 flex flex-col gap-4 md:gap-6">
            <div className="p-6 md:p-10 glass-card rounded-3xl md:rounded-[3rem] relative overflow-hidden group border border-white shadow-2xl">
              <div className="absolute top-0 right-0 p-4 md:p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <Sparkles size={120} className="text-indigo-600" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Plus size={20} className="md:size-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">上传新作文</h2>
                </div>
                <p className="text-slate-500 text-xs md:text-sm mb-4 md:mb-6 font-medium leading-relaxed">Hi～我是你的 AI 英语小助手！随时为你批改作文，帮你找出语法问题，让你的英语写作越来越棒 ✨</p>

                {/* 年级选择器 */}
                <div className="mb-4 md:mb-6">
                  <label className="block text-xs md:text-sm font-bold text-slate-700 mb-2 md:mb-3">
                    选择英语水平
                  </label>
                  <select
                    value={selectedGrade || ''}
                    onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-3 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white font-medium"
                    required
                  >
                    <option value="">请选择...</option>
                    <option value="primary">小学英语 - 基础语法、简单词汇</option>
                    <option value="junior">初中英语 - 复合句、段落结构</option>
                    <option value="senior">高中英语 - 复杂句型、高级词汇</option>
                    <option value="cet4">大学四级 - 段落连贯、学术词汇</option>
                    <option value="cet6">大学六级 - 复杂论证、批判思维</option>
                    <option value="postgraduate">研究生英语 - 学术写作、专业表达</option>
                    <option value="other">其他水平 - 自定义水平</option>
                  </select>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 flex flex-col items-center justify-center text-center transition-all min-h-[260px] md:min-h-[420px] relative overflow-hidden bg-white/50 cursor-pointer
                    ${dragActive ? 'border-indigo-500 bg-indigo-50/80 scale-[0.98]' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); if(e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]); }}
                  onClick={() => !previewUrl && fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files && e.target.files[0]) { handleFileChange(e.target.files[0]); e.target.value = ''; } }} className="hidden" accept="image/*" onClick={(e) => e.stopPropagation()} />
                   
                  {!previewUrl ? (
                    <div className="pointer-events-none group/upload">
                      <div className="w-20 h-20 md:w-28 md:h-28 ai-gradient-bg rounded-2xl md:rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-6 md:mb-10 shadow-2xl shadow-indigo-100 group-hover/upload:scale-110 group-hover/upload:rotate-3 transition-all duration-500">
                        <UploadCloud size={36} className="md:size-12" />
                      </div>
                      <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">点击或拖拽原图</p>
                      <p className="text-slate-400 text-xs mt-2 md:mt-4 font-bold uppercase tracking-widest bg-slate-100 px-3 py-1 md:px-4 md:py-1.5 rounded-full inline-block">支持: JPG, PNG, WEBP</p>
                    </div>
                  ) : (
                    <div className="w-full animate-in fade-in zoom-in-95 duration-500">
                      <div className="relative mx-auto w-full max-w-[200px] md:max-w-[280px] mb-8 md:mb-12 group/img">
                        <div className="absolute -inset-3 md:-inset-4 bg-indigo-600/10 rounded-2xl md:rounded-[3rem] blur-xl md:blur-2xl opacity-0 group-hover/img:opacity-100 transition-opacity" />
                        <img src={previewUrl} className="relative rounded-xl md:rounded-[2rem] shadow-2xl border-3 md:border-4 border-white aspect-[3/4] object-cover ring-1 ring-slate-100 transition-transform duration-500 group-hover/img:scale-[1.02]" />
                        <button 
                          onClick={() => { setPreviewUrl(null); setSelectedFile(null); }} 
                          className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all shadow-2xl z-20 hover:rotate-90"
                        >
                          <X size={18} className="md:size-6" />
                        </button>
                      </div>
                      <button
                        disabled={isAnalyzing}
                        onClick={startAnalysis}
                        className="w-full py-4 md:py-6 ai-gradient-bg text-white rounded-xl md:rounded-[1.5rem] font-black text-lg md:text-xl flex items-center justify-center gap-2 md:gap-4 shadow-2xl shadow-indigo-100 hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50 disabled:scale-100"
                      >
                        {isAnalyzing ? (
                          <div className="flex items-center gap-2 md:gap-4">
                            <div className="w-5 h-5 md:w-6 md:h-6 border-3 md:border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>智能阅卷中...</span>
                          </div>
                        ) : (
                          <><Wand2 size={22} className="md:size-7"/> 立即开始批改</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧历史记录库 - 现代卡片流 */}
          <div className="xl:col-span-8 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8 mb-6 md:mb-10 px-2 md:px-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 text-indigo-600">
                    <History size={24} className="md:size-8" />
                  </div>
                  <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">批改记录库</h3>
                </div>
                <p className="text-slate-400 text-sm md:text-base font-medium ml-1">共存储了 {history.length} 篇作文的专家级诊断报告</p>
              </div>
              <div className="relative group w-full md:w-auto">
                <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors md:size-5" size={18} />
                <input 
                  type="text" 
                  placeholder="快速查找批改报告..." 
                  className="pl-10 md:pl-14 pr-4 md:pr-8 py-3 md:py-5 bg-white border border-slate-100 rounded-xl md:rounded-[1.5rem] text-sm md:text-base font-bold focus:ring-3 md:focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all w-full md:w-[420px] shadow-sm outline-none placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {paginatedHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center glass-card rounded-2xl md:rounded-[4rem] border-dashed border-2 border-slate-100 py-12 md:py-24">
                <div className="p-8 md:p-12 bg-slate-50 rounded-2xl md:rounded-full mb-6 md:mb-10 group-hover:bg-indigo-50 transition-colors">
                  <FileText size={60} className="md:size-24 text-slate-100" />
                </div>
                <h4 className="text-xl md:text-2xl font-black text-slate-400 mb-2 md:mb-3">历史记录为空</h4>
                <p className="text-slate-300 max-w-sm text-center font-medium text-sm md:text-base px-4">请在左侧上传学生作文，系统将自动保存每一步批改细节。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 content-start">
                {paginatedHistory.map((record, index) => (
                  <div 
                    key={record.id}
                    onClick={() => navigate(`/result/${record.id}`)}
                    className="group bg-white p-4 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-50 hover:border-indigo-100 transition-all cursor-pointer flex items-center gap-3 md:gap-8 shadow-sm hover:shadow-[0_32px_64px_rgba(79,70,229,0.12)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* 背景装饰 */}
                    <div className="absolute top-0 right-0 w-24 h-24 md:w-48 md:h-48 bg-indigo-50/40 rounded-full -mr-12 -mt-12 md:-mr-24 md:-mt-24 opacity-0 group-hover:opacity-100 transition-all duration-700 scale-0 group-hover:scale-100" />
                    
                    {/* 封面图 */}
                    <div className="relative z-10 w-16 h-20 md:w-28 md:h-36 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 border-2 border-slate-100 shadow-sm group-hover:scale-110 group-hover:rotate-2 transition-all duration-500">
                      <img src={record.imagePreviewUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </div>
                    
                    {/* 内容详情 */}
                    <div className="relative z-10 flex-1 min-w-0 py-1 md:py-2">
                      <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-4">
                        <div className="p-1 md:p-1.5 bg-indigo-50 rounded-lg text-indigo-600 flex-shrink-0 mt-0.5">
                          <FileText size={14} className="md:size-4" />
                        </div>
                        {editingId === record.id ? (
                          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <input
                                ref={titleInputRef}
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => handleTitleKeyDown(record.id, e)}
                                className="flex-1 px-2 py-1 text-sm md:text-base font-bold text-slate-800 bg-white border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                maxLength={100}
                              />
                              <button
                                onClick={(e) => handleSaveTitle(record.id, e)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="保存"
                              >
                                <Check size={16} className="md:size-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                title="取消"
                              >
                                <X size={16} className="md:size-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 min-w-0 flex items-start gap-2 group/title">
                             <h4 
                               className="font-black text-slate-800 text-sm md:text-xl line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug cursor-pointer"
                               title={record.imageName}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleStartEdit(record.id, record.imageName, e);
                               }}
                             >
                               {record.imageName}
                             </h4>
                            <button
                              onClick={(e) => handleStartEdit(record.id, record.imageName, e)}
                              className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover/title:opacity-100 flex-shrink-0"
                              title="修改标题"
                            >
                              <Pencil size={14} className="md:size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                       
                      <div className="flex flex-col gap-2 md:gap-4">
                        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm font-bold text-slate-400">
                          <Calendar size={12} className="md:size-4 text-slate-300 flex-shrink-0" />
                          <span className="whitespace-nowrap">{new Date(record.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                         
                        {record.result && (
                          <div className="flex items-center gap-2 md:gap-4">
                             <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs md:text-sm font-black shadow-sm ring-1 ring-emerald-100 whitespace-nowrap">
                               <Award size={12} className="md:size-4 flex-shrink-0" />
                               <span className="whitespace-nowrap">{record.result.totalScore}分</span>
                             </div>
                            <div className="text-[8px] md:text-[10px] text-slate-300 font-bold uppercase tracking-widest bg-slate-50 px-2 py-0.5 md:px-3 md:py-1 rounded-md">
                              #{record.id.slice(-4)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 操作区 */}
                    <div className="relative z-10 flex flex-col items-center justify-between h-full min-h-[80px] md:min-h-[140px]">
                      <button 
                        onClick={(e) => handleDelete(record.id, e)}
                        className="p-2 md:p-3.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl md:rounded-2xl transition-all scale-90 group-hover:scale-110 hover:shadow-sm"
                        title="永久删除"
                      >
                        <Trash2 size={16} className="md:size-6" />
                      </button>
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-2xl group-hover:shadow-indigo-300 group-hover:rotate-45 group-hover:rounded-[1.2rem] md:group-hover:rounded-[1.5rem]">
                        <ChevronRight size={18} className="md:size-8 group-hover:-rotate-45 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 高级分页组件 */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 pt-6 md:pt-12 mt-auto border-t border-slate-100">
                <div className="text-xs md:text-sm font-black text-slate-400 flex items-center gap-2 md:gap-3">
                  <span className="w-6 md:w-8 h-[2px] bg-slate-100" />
                  第 {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} / 共 {filteredHistory.length} 份档案
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                    className="w-10 h-10 md:w-14 md:h-14 bg-white border border-slate-100 rounded-xl md:rounded-2xl disabled:opacity-20 hover:bg-indigo-600 hover:text-white transition-all shadow-md text-slate-500 hover:border-indigo-600 group/btn"
                  >
                    <ChevronLeft size={16} className="mx-auto md:size-6 group-hover/btn:-translate-x-1 transition-transform" />
                  </button>
                  <div className="flex items-center gap-1.5 md:gap-2.5 bg-white p-1 md:p-2 rounded-xl md:rounded-[1.8rem] border border-slate-100 shadow-inner">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (totalPages > 6 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                        if (Math.abs(pageNum - currentPage) === 2) return <span key={i} className="px-1 text-slate-200 font-bold">...</span>;
                        return null;
                      }
                      return (
                        <button 
                          key={i} 
                          onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                          className={`min-w-[40px] h-10 md:min-w-[56px] md:h-14 rounded-lg md:rounded-[1.2rem] font-black text-sm md:text-base transition-all duration-500
                            ${currentPage === pageNum 
                              ? 'ai-gradient-bg text-white shadow-2xl shadow-indigo-200 scale-110' 
                              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                    className="w-10 h-10 md:w-14 md:h-14 bg-white border border-slate-100 rounded-xl md:rounded-2xl disabled:opacity-20 hover:bg-indigo-600 hover:text-white transition-all shadow-md text-slate-500 hover:border-indigo-600 group/btn"
                  >
                    <ChevronRight size={16} className="mx-auto md:size-6 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
