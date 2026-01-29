import React from 'react';
import { 
  FileText, 
  Sparkles, 
  Star, 
  TrendingUp, 
  BookOpen, 
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { ModelEssay } from '../types';

interface ModelEssayDisplayProps {
  originalText: string;
  modelEssay: ModelEssay;
  topic: string;
}

const ModelEssayDisplay: React.FC<ModelEssayDisplayProps> = ({
  originalText,
  modelEssay,
  topic
}) => {
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

      {/* Side by Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Essay */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <FileText size={18} className="text-slate-500" />
            <span className="font-bold text-slate-700">原文</span>
            <span className="ml-auto text-xs text-slate-400">{originalText.length} 字符</span>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {originalText}
            </p>
          </div>
        </div>

        {/* Model Essay */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-4 py-3 border-b border-indigo-200 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" />
            <span className="font-bold text-indigo-900">范文</span>
            <span className="ml-auto text-xs text-indigo-500">{modelEssay.text.length} 字符</span>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-medium">
              {modelEssay.text}
            </p>
          </div>
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
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <h4 className="font-black text-indigo-900">推荐词汇</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {modelEssay.vocabulary.map((word, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 bg-white text-indigo-700 rounded-full text-sm font-bold border border-indigo-200"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Structures Section */}
      {modelEssay.structures.length > 0 && (
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Lightbulb size={16} className="text-white" />
            </div>
            <h4 className="font-black text-purple-900">推荐句型</h4>
          </div>
          <div className="space-y-2">
            {modelEssay.structures.map((structure, idx) => (
              <div 
                key={idx}
                className="p-3 bg-white rounded-xl border border-purple-200 text-sm text-purple-800 font-medium"
              >
                {structure}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelEssayDisplay;
