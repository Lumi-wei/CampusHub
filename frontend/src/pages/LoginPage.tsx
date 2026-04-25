import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('请输入邮箱');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('请输入有效的邮箱地址');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('请输入密码');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('密码长度至少为6个字符');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.login({ email, password });
      if (response.success && response.data?.token) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        login(response.data.token);
        navigate('/');
      } else {
        setError(response.message || '登录失败，请检查邮箱和密码');
      }
    } catch (err: any) {
      if (err.message === '登录已过期，请重新登录') {
        setError(err.message);
      } else {
        setError('登录失败，请检查网络连接或稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8]">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">CampusHub 登录</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={() => validateEmail(email)}
              className={`w-full px-4 py-2 border rounded-lg ${emailError ? 'border-red-500' : ''}`}
              required
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              onBlur={() => validatePassword(password)}
              className={`w-full px-4 py-2 border rounded-lg ${passwordError ? 'border-red-500' : ''}`}
              required
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#2D6A9F] focus:ring-[#2D6A9F]"
              />
              <span className="text-sm text-gray-600">记住我</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2D6A9F] text-white py-2 rounded-lg hover:bg-[#245a8a] transition-colors disabled:bg-gray-400"
          >
            {loading ? '登录中...' : '登录'}
          </button>
          <p className="text-center text-sm text-gray-600">
            还没有账号？<Link to="/register" className="text-[#2D6A9F] hover:underline">立即注册</Link>
          </p>
        </form>
      </div>
    </div>
  );
}