
import React from 'react';

interface ScoreCardProps {
  label: string;
  value: number | string;
  type?: 'score' | 'count';
  scoreValue?: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ label, value, type = 'score', scoreValue }) => {
  const isScore = type === 'score' && typeof scoreValue === 'number';
  
  const getStatusConfig = (val: number) => {
    if (val >= 85) return { 
      text: 'text-emerald-600', 
      bg: 'bg-emerald-500', 
      ring: 'ring-emerald-100', 
      labelBg: 'bg-emerald-50',
      glow: '' 
    };
    if (val >= 60) return { 
      text: 'text-amber-600', 
      bg: 'bg-amber-500', 
      ring: 'ring-amber-100', 
      labelBg: 'bg-amber-50',
      glow: ''
    };
    // 低于 60 分：红色警告状态
    return { 
      text: 'text-rose-600', 
      bg: 'bg-rose-500', 
      ring: 'ring-rose-100', 
      labelBg: 'bg-rose-50',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.2)] ring-2 ring-rose-100 animate-[pulse_3s_infinite]' 
    };
  };

  const config = isScore ? getStatusConfig(scoreValue) : { 
    text: 'text-indigo-600', 
    bg: 'bg-indigo-600', 
    ring: 'ring-indigo-100', 
    labelBg: 'bg-indigo-50',
    glow: ''
  };

  return (
    <div className={`relative overflow-hidden p-8 rounded-[2.5rem] bg-white border border-slate-100 transition-all duration-500 ease-out
      hover:shadow-[0_30px_60px_-15px_rgba(79,70,229,0.15)] hover:-translate-y-2 group cursor-default
      ${config.glow} shadow-xl shadow-slate-100/50`}>
      
      <div className="relative z-10 flex flex-col gap-2">
        <span className={`w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${config.labelBg} ${config.text}`}>
          {label}
        </span>
        <div className="flex items-baseline gap-1 mt-3">
          <span className={`text-6xl font-black tracking-tighter transition-colors duration-500 ${config.text}`}>
            {value}
          </span>
          {isScore && <span className="text-xl font-black text-slate-200 ml-1">/100</span>}
        </div>
      </div>
      
      {/* 装饰性背景 */}
      <div className={`absolute top-0 right-0 w-40 h-40 -mr-20 -mt-20 rounded-full opacity-[0.03] group-hover:scale-150 group-hover:opacity-[0.06] transition-all duration-1000 ${config.bg}`} />
      <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-[0.02] group-hover:translate-x-10 transition-transform duration-1000 ${config.bg}`} />

      {/* 底部装饰性进度条 */}
      {isScore && (
        <div className="absolute bottom-0 left-0 h-2.5 bg-slate-50 w-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-[2s] cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_15px_rgba(0,0,0,0.1)] ${config.bg}`} 
            style={{ width: `${scoreValue}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ScoreCard;
