import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth';
import { Sparkles, Mail, Lock, UserPlus, ArrowRight, User, Shield } from 'lucide-react';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要6位字符');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 p-3 md:p-4">
      <div className="absolute top-0 left-0 w-full h-48 md:h-96 bg-gradient-to-r from-emerald-600/10 to-indigo-600/10 rounded-b-3xl md:rounded-b-[5rem]" />
      
      <div className="relative w-full max-w-md">
        {/* 装饰性元素 */}
        <div className="absolute -top-16 -right-16 w-40 h-40 md:w-64 md:h-64 bg-emerald-600/10 rounded-full blur-2xl md:blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 md:w-64 md:h-64 bg-indigo-600/10 rounded-full blur-2xl md:blur-3xl" />
        
        {/* 主卡片 */}
        <div className="relative glass-card rounded-2xl md:rounded-[3rem] border border-white/50 shadow-2xl overflow-hidden backdrop-blur-sm bg-white/90">
          <div className="p-6 md:p-10">
            {/* 标题区域 */}
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="w-12 h-12 md:w-16 md:h-16 ai-gradient-bg rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                <UserPlus size={24} className="md:size-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">创建新账户</h1>
                <p className="text-slate-500 text-xs md:text-sm font-medium">加入我们，开启智能化英语学习体验</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-rose-50 text-rose-600 rounded-xl md:rounded-2xl border border-rose-100 text-xs md:text-sm font-medium flex items-center gap-2 md:gap-3 animate-in fade-in zoom-in-95">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-rose-100 rounded-lg md:rounded-xl flex items-center justify-center">
                  <Shield size={14} className="md:size-4 text-rose-600" />
                </div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* 邮箱输入 */}
              <div className="group">
                <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1 md:mb-2 pl-1">邮箱地址</label>
                <div className="relative">
                  <Mail className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} className="md:size-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 md:pl-14 pr-3 md:pr-5 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl focus:ring-3 md:focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none placeholder:text-slate-300 font-medium shadow-sm text-sm md:text-base"
                    placeholder="请输入您的邮箱"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 姓名输入（可选） */}
              <div className="group">
                <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1 md:mb-2 pl-1">
                  姓名 <span className="text-slate-400 font-normal">（可选）</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} className="md:size-5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 md:pl-14 pr-3 md:pr-5 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl focus:ring-3 md:focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none placeholder:text-slate-300 font-medium shadow-sm text-sm md:text-base"
                    placeholder="请输入您的姓名"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 密码输入 */}
              <div className="group">
                <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1 md:mb-2 pl-1">密码（至少6位）</label>
                <div className="relative">
                  <Lock className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} className="md:size-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 md:pl-14 pr-3 md:pr-5 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl focus:ring-3 md:focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none placeholder:text-slate-300 font-medium shadow-sm text-sm md:text-base"
                    placeholder="请输入至少6位密码"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 确认密码 */}
              <div className="group">
                <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1 md:mb-2 pl-1">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} className="md:size-5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 md:pl-14 pr-3 md:pr-5 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl focus:ring-3 md:focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none placeholder:text-slate-300 font-medium shadow-sm text-sm md:text-base"
                    placeholder="请再次输入密码"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 注册按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 md:py-4 ai-gradient-bg text-white rounded-xl md:rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {loading ? (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 border-3 md:border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>注册中...</span>
                  </div>
                ) : (
                  <>
                    <UserPlus size={18} className="md:size-6" />
                    <span>创建账户</span>
                    <ArrowRight size={18} className="md:size-6 ml-auto" />
                  </>
                )}
              </button>
            </form>

            {/* 登录链接 */}
            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-100">
              <p className="text-center text-slate-500 font-medium text-xs md:text-sm">
                已有账户？{' '}
                <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors inline-flex items-center gap-1 group">
                  立即登录
                  <ArrowRight size={12} className="md:size-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>

            {/* 安全提示 */}
            <div className="mt-6 md:mt-8 p-3 md:p-4 bg-emerald-50/50 rounded-xl md:rounded-2xl border border-emerald-100">
              <div className="flex items-start gap-2 md:gap-3">
                <Shield size={16} className="md:size-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs md:text-sm font-bold text-emerald-800">账户安全提示</p>
                  <ul className="text-[10px] md:text-xs text-emerald-600 mt-1 md:mt-2 space-y-0.5 md:space-y-1">
                    <li>• 使用强密码，包含字母、数字和特殊字符</li>
                    <li>• 不要与其他网站使用相同的密码</li>
                    <li>• 定期更换密码以保障账户安全</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* 底部装饰 */}
          <div className="h-1.5 md:h-2 bg-gradient-to-r from-emerald-500 via-indigo-600 to-amber-500" />
        </div>

        {/* 品牌信息 */}
        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} 英语作文AI批改助手 · 专业智能化英语学习平台
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;