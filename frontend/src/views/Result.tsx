import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEssayById } from '../services/essay';
import { Essay } from '../types';
import Header from '../components/Header';
import ScoreCard from '../components/ScoreCard';

const Result: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEssay();
  }, [id]);

  const loadEssay = async () => {
    if (!id) return;

    try {
      const data = await getEssayById(id);
      setEssay(data);
    } catch (error) {
      console.error('加载作文失败:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  if (!essay) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">作文评分结果</h1>
            <button
              onClick={() => navigate('/')}
              className="text-indigo-600 hover:text-indigo-800"
            >
              ← 返回首页
            </button>
          </div>

          {/* 总分 */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-indigo-600">{essay.score}</div>
            <div className="text-gray-500 mt-2">分 / 100分</div>
          </div>

          {/* 各项评分 */}
          <ScoreCard feedback={essay.feedback} />

          {/* 原文 */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-3">提取的原文</h3>
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
              {essay.extractedText}
            </div>
          </div>

          {/* 图片预览 */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-3">原图</h3>
            <img
              src={essay.imageBase64}
              alt="作文原图"
              className="max-h-96 mx-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
