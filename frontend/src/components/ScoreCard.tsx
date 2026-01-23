import React from 'react';
import { Feedback } from '../types';

interface ScoreCardProps {
  feedback: Feedback;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ feedback }) => {
  const categories = [
    { key: 'grammar', label: '语法', maxScore: 20 },
    { key: 'vocabulary', label: '词汇', maxScore: 20 },
    { key: 'coherence', label: '连贯性', maxScore: 20 },
    { key: 'content', label: '内容', maxScore: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* 各项评分 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => {
          const categoryData = feedback[category.key as keyof Omit<Feedback, 'commentary'>];
          return (
            <div key={category.key} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{category.label}</span>
                <span className="text-indigo-600 font-bold">
                  {categoryData.score}/{category.maxScore}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(categoryData.score / category.maxScore) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{categoryData.feedback}</p>
            </div>
          );
        })}
      </div>

      {/* 整体评价 */}
      <div className="border rounded-lg p-4 bg-indigo-50">
        <h3 className="font-bold text-indigo-800 mb-2">整体评价</h3>
        <p className="text-gray-700">{feedback.commentary}</p>
      </div>
    </div>
  );
};

export default ScoreCard;
