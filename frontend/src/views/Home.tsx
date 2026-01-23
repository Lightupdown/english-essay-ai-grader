import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { processEssay, getHistory } from '../services/essay';
import { getProfile, logout } from '../services/auth';
import { Essay } from '../types';
import Header from '../components/Header';

const Home: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Essay[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadHistory();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await getProfile();
      setUser(userData);
    } catch (error) {
      navigate('/login');
    }
  };

  const loadHistory = async () => {
    try {
      const essays = await getHistory();
      setHistory(essays);
    } catch (error) {
      console.error('加载历史失败:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请选择图片');
      return;
    }

    setLoading(true);

    try {
      // 转换为 Base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      });

      // 调用后端处理
      const result = await processEssay(base64);
      
      // 跳转到结果页
      navigate(`/result/${result.essayId}`);
    } catch (error: any) {
      alert(error.response?.data?.error || '处理失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null; // 正在检查认证状态
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto p-6">
        {/* 上传区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">上传作文图片</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer text-indigo-600 hover:text-indigo-800"
            >
              <div className="text-4xl mb-2">📷</div>
              <div>点击选择图片或拖拽到此处</div>
              <div className="text-sm text-gray-500 mt-2">
                支持 JPG, PNG 格式，最大 5MB
              </div>
            </label>
          </div>

          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="预览"
                className="max-h-64 mx-auto rounded-lg"
              />
              <button
                onClick={handleUpload}
                disabled={loading}
                className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? '处理中...' : '开始分析'}
              </button>
            </div>
          )}
        </div>

        {/* 历史记录 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">历史记录</h2>
          
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无历史记录</p>
          ) : (
            <div className="space-y-3">
              {history.map((essay) => (
                <div
                  key={essay._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/result/${essay._id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">得分: {essay.score}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(essay.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="text-indigo-600">查看详情 →</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
