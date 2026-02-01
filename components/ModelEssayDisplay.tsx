import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, 
  Sparkles, 
  Star, 
  TrendingUp, 
  BookOpen, 
  Lightbulb,
  ArrowRight,
  Languages,
  Volume2,
  VolumeX,
  Loader2,
  X,
  ChevronRight
} from 'lucide-react';
import { ModelEssay, VocabularyItem, StructureItem } from '../types';

interface ModelEssayDisplayProps {
  originalText: string;
  modelEssay: ModelEssay;
  topic: string;
}

// 全局状态，用于跨函数通信
let globalUtterance: SpeechSynthesisUtterance | null = null;
let keepAliveTimer: NodeJS.Timeout | null = null;

const ModelEssayDisplay: React.FC<ModelEssayDisplayProps> = ({
  originalText,
  modelEssay,
  topic
}) => {
  const [showTranslation, setShowTranslation] = useState(true);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<StructureItem | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  
  // 使用 ref 保存播放状态，避免闭包问题
  const isSpeakingRef = useRef(false);
  const textQueueRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const isCancelledRef = useRef(false);
  const isProcessingRef = useRef(false);
  const englishVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // 同步 ref 和 state
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // 加载语音
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices();
      if (voices && voices.length > 0) {
        const enVoice = voices.find(v => v.lang === 'en-US') || 
                       voices.find(v => v.lang.startsWith('en'));
        if (enVoice) {
          englishVoiceRef.current = enVoice;
        }
        setVoicesReady(true);
      }
    };

    loadVoices();
    
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      console.log('ModelEssayDisplay unmounting, cleaning up speech...');
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      // 标记为已取消，防止回调执行
      isCancelledRef.current = true;
      isProcessingRef.current = false;
      if (keepAliveTimer) {
        clearTimeout(keepAliveTimer);
        keepAliveTimer = null;
      }
      // 取消当前播放，但保留全局引用以供检查
      window.speechSynthesis?.cancel();
      globalUtterance = null;
    };
  }, []);

  // 停止所有播放
  const stopAllSpeech = useCallback(() => {
    console.log('Stopping all speech');
    isCancelledRef.current = true;
    
    if (keepAliveTimer) {
      clearTimeout(keepAliveTimer);
      keepAliveTimer = null;
    }
    
    window.speechSynthesis?.cancel();
    globalUtterance = null;
    textQueueRef.current = [];
    currentIndexRef.current = 0;
    setIsSpeaking(false);
  }, []);

  // Keep Alive
  const startKeepAlive = useCallback(() => {
    if (keepAliveTimer) {
      clearTimeout(keepAliveTimer);
    }
    
    const keepAlive = () => {
      if (!isCancelledRef.current && window.speechSynthesis?.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
        keepAliveTimer = setTimeout(keepAlive, 8000);
      }
    };
    
    keepAliveTimer = setTimeout(keepAlive, 8000);
  }, []);

  // 播放单段
  const speakChunk = useCallback((text: string, onComplete: () => void) => {
    if (!window.speechSynthesis || isCancelledRef.current) {
      onComplete();
      return;
    }

    console.log('Speaking chunk:', text.substring(0, 30));

    globalUtterance = new SpeechSynthesisUtterance(text);
    globalUtterance.lang = 'en-US';
    globalUtterance.rate = 0.9;
    globalUtterance.pitch = 1;
    globalUtterance.volume = 1;

    if (englishVoiceRef.current) {
      globalUtterance.voice = englishVoiceRef.current;
    }

    globalUtterance.onstart = () => {
      if (!isCancelledRef.current) {
        console.log('Chunk started');
        setIsSpeaking(true);
        startKeepAlive();
      }
    };

    globalUtterance.onend = () => {
      console.log('Chunk ended');
      if (keepAliveTimer) {
        clearTimeout(keepAliveTimer);
        keepAliveTimer = null;
      }
      globalUtterance = null;
      if (!isCancelledRef.current) {
        onComplete();
      }
    };

    globalUtterance.onerror = (event) => {
      console.log('Chunk error:', event.error, 'cancelled:', isCancelledRef.current);
      if (keepAliveTimer) {
        clearTimeout(keepAliveTimer);
        keepAliveTimer = null;
      }
      globalUtterance = null;
      
      // 如果是用户主动取消（通过 stopAllSpeech），不视为错误
      if (event.error === 'canceled' && isCancelledRef.current) {
        console.log('Speech was cancelled by user');
        return;
      }
      
      // 如果是被中断，可能是 Chrome 的 bug，尝试重试一次
      if (event.error === 'interrupted') {
        console.log('Speech interrupted, retrying...');
        // 延迟重试，给浏览器一些时间
        setTimeout(() => {
          if (!isCancelledRef.current) {
            speakChunk(text, onComplete);
          }
        }, 200);
        return;
      }
      
      // 其他错误，继续完成
      onComplete();
    };

    // 先取消之前的，延迟执行
    window.speechSynthesis.cancel();
    
    setTimeout(() => {
      if (!isCancelledRef.current) {
        window.speechSynthesis.speak(globalUtterance!);
      }
    }, 50);
  }, [startKeepAlive]);

  // 开始播放
  const startSpeaking = useCallback((text: string) => {
    console.log('Starting to speak:', text.substring(0, 50));
    
    // 重置状态
    isCancelledRef.current = false;
    textQueueRef.current = [];
    currentIndexRef.current = 0;
    
    // 分段
    const chunks: string[] = [];
    const sentences = text.split(/([.!?。！？,，;；])/);
    let currentChunk = '';
    
    for (let i = 0; i < sentences.length; i++) {
      const part = sentences[i];
      if ((currentChunk + part).length > 100) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      currentChunk += part;
      
      if (/[.!?。！？,，;；]/.test(part) && currentChunk.length > 50) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    textQueueRef.current = chunks;
    console.log('Split into', chunks.length, 'chunks');

    // 递归播放
    const playNext = () => {
      if (isCancelledRef.current) {
        console.log('Playback cancelled');
        return;
      }
      
      if (currentIndexRef.current >= textQueueRef.current.length) {
        console.log('All chunks completed');
        setIsSpeaking(false);
        return;
      }

      const chunk = textQueueRef.current[currentIndexRef.current];
      currentIndexRef.current++;
      
      speakChunk(chunk, () => {
        if (!isCancelledRef.current && currentIndexRef.current < textQueueRef.current.length) {
          setTimeout(playNext, 100);
        } else if (!isCancelledRef.current) {
          setIsSpeaking(false);
        }
      });
    };

    playNext();
  }, [speakChunk]);

  // 处理朗读按钮点击
  const handleSpeak = useCallback((text: string) => {
    // 防止重复点击
    if (isProcessingRef.current) {
      console.log('Already processing speech, ignoring click');
      return;
    }

    if (isSpeakingRef.current) {
      // 正在播放，停止
      isProcessingRef.current = true;
      stopAllSpeech();
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100);
    } else {
      // 开始播放
      isProcessingRef.current = true;
      setIsSpeaking(true);
      // 延迟一下确保状态更新
      setTimeout(() => {
        startSpeaking(text);
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 100);
      }, 50);
    }
  }, [stopAllSpeech, startSpeaking]);

  const getPartOfSpeechColor = (pos: string): string => {
    const colors: Record<string, string> = {
      'n.': 'bg-blue-100 text-blue-700 border-blue-200',
      'v.': 'bg-green-100 text-green-700 border-green-200',
      'adj.': 'bg-purple-100 text-purple-700 border-purple-200',
      'adv.': 'bg-orange-100 text-orange-700 border-orange-200',
      'phr.': 'bg-pink-100 text-pink-700 border-pink-200',
      'prep.': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'conj.': 'bg-indigo-100 text-indigo-700 border-indigo-200'
    };
    return colors[pos] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Topic Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={18} className="text-indigo-200" />
          <span className="text-sm font-bold text-indigo-200">作文题目</span>
        </div>
        <h3 className="text-xl font-black">{topic}</h3>
      </div>

      {/* Original Essay */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <FileText size={18} className="text-slate-500" />
          <span className="font-bold text-slate-700">原文</span>
          <span className="ml-auto text-xs text-slate-400">{originalText.length} 字符</span>
        </div>
        <div className="p-4 max-h-[300px] overflow-y-auto">
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {originalText}
          </p>
        </div>
      </div>

      {/* Model Essay with Translation */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-3 sm:px-4 py-3 border-b border-indigo-200 flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Sparkles size={16} className="sm:size-[18px] text-indigo-600 shrink-0" />
          <span className="font-bold text-indigo-900 text-sm sm:text-base">范文</span>
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-white rounded-full text-[11px] sm:text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-200 whitespace-nowrap"
          >
            <Languages size={11} className="sm:size-3" />
            <span className="hidden sm:inline">{showTranslation ? '隐藏翻译' : '显示翻译'}</span>
            <span className="sm:hidden">{showTranslation ? '隐藏' : '翻译'}</span>
          </button>
          <button
            onClick={() => handleSpeak(modelEssay.text)}
            disabled={!voicesReady}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold text-white transition-colors whitespace-nowrap ${
              isSpeaking 
                ? 'bg-rose-500 hover:bg-rose-600' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } disabled:bg-slate-400`}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={11} className="sm:size-3" />
                <span className="hidden sm:inline">停止朗读</span>
                <span className="sm:hidden">停止</span>
              </>
            ) : (
              <>
                <Volume2 size={11} className="sm:size-3" />
                <span className="hidden sm:inline">{voicesReady ? '朗读全文' : '加载中'}</span>
                <span className="sm:hidden">{voicesReady ? '朗读' : '加载'}</span>
              </>
            )}
          </button>
          <span className="ml-auto text-[10px] sm:text-xs text-indigo-500 whitespace-nowrap">{modelEssay.text.length} 字符</span>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="bg-indigo-50/50 rounded-xl p-4">
            <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-medium">
              {modelEssay.text}
            </p>
          </div>
          
          {showTranslation && modelEssay.translation && (
            <div className="border-t border-indigo-100 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Languages size={14} className="text-indigo-400" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">中文翻译</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                {modelEssay.translation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Highlights Section */}
      {modelEssay.highlights.length > 0 && (
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Star size={16} className="text-white" />
            </div>
            <h4 className="font-black text-emerald-900">范文亮点</h4>
          </div>
          <ul className="space-y-2">
            {modelEssay.highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-emerald-800">
                <span className="text-emerald-500 mt-1">•</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements Section */}
      {modelEssay.improvements.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h4 className="font-black text-amber-900">改进点</h4>
          </div>
          <ul className="space-y-2">
            {modelEssay.improvements.map((improvement, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                <ArrowRight size={14} className="text-amber-500 mt-1 shrink-0" />
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Vocabulary Section */}
      {modelEssay.vocabulary.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-black text-slate-900">核心词汇</h4>
                <p className="text-xs text-slate-500">点击卡片查看详细释义</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelEssay.vocabulary.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedWord(item)}
                  className="group text-left bg-slate-50 hover:bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.word}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded border ${getPartOfSpeechColor(item.partOfSpeech)}`}>
                        {item.partOfSpeech}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400" />
                  </div>
                  <p className="text-sm text-slate-600">{item.translation}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Structures Section */}
      {modelEssay.structures.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                <Lightbulb size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-black text-slate-900">重点句型</h4>
                <p className="text-xs text-slate-500">点击卡片查看翻译和使用说明</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {modelEssay.structures.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedStructure(item)}
                className="group w-full text-left bg-slate-50 hover:bg-white rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                    {item.structure}
                  </p>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-purple-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Word Detail Modal */}
      {selectedWord && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedWord(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen size={24} className="text-white" />
                <div>
                  <h3 className="text-2xl font-black text-white">{selectedWord.word}</h3>
                  <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded bg-white/20 text-white`}>
                    {selectedWord.partOfSpeech}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedWord(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">中文释义</h4>
                <p className="text-lg text-slate-800 font-medium">{selectedWord.translation}</p>
              </div>
              
              {selectedWord.context && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">使用语境</h4>
                  <p className="text-sm text-slate-600 italic">"{selectedWord.context}"</p>
                </div>
              )}
              
              <button
                onClick={() => handleSpeak(selectedWord.word)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${
                  isSpeaking 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX size={18} />
                    停止朗读
                  </>
                ) : (
                  <>
                    <Volume2 size={18} />
                    朗读发音
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structure Detail Modal */}
      {selectedStructure && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStructure(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lightbulb size={24} className="text-white" />
                <h3 className="text-xl font-black text-white">重点句型</h3>
              </div>
              <button 
                onClick={() => setSelectedStructure(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">英文句型</h4>
                <p className="text-lg text-slate-800 font-bold">{selectedStructure.structure}</p>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">中文翻译</h4>
                <p className="text-base text-slate-700">{selectedStructure.translation}</p>
              </div>
              
              {selectedStructure.usage && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">使用场景</h4>
                  <p className="text-sm text-slate-600">{selectedStructure.usage}</p>
                </div>
              )}
              
              <button
                onClick={() => handleSpeak(selectedStructure.structure)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${
                  isSpeaking 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX size={18} />
                    停止朗读
                  </>
                ) : (
                  <>
                    <Volume2 size={18} />
                    朗读句型
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelEssayDisplay;
