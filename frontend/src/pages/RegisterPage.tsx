import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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

  const validateConfirmPassword = (confirm: string) => {
    if (!confirm) {
      setConfirmPasswordError('请确认密码');
      return false;
    }
    if (confirm !== password) {
      setConfirmPasswordError('两次输入的密码不一致');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const validateName = (name: string) => {
    if (!name) {
      setNameError('请输入昵称');
      return false;
    }
    if (name.length < 2) {
      setNameError('昵称长度至少为2个字符');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword);
    const isNameValid = validateName(name);

    if (!isEmailValid || !isPasswordValid || !isConfirmValid || !isNameValid) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.register({ email, password, name });
      if (response.success && response.data?.token) {
        login(response.data.token);
        navigate('/');
      } else {
        setError(response.message || '注册失败，请检查输入信息');
      }
    } catch (err: any) {
      if (err.message === '登录已过期，请重新登录') {
        setError(err.message);
      } else {
        setError('注册失败，请检查网络连接或稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8]">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">CampusHub 注册</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="昵称"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) validateName(e.target.value);
              }}
              onBlur={() => validateName(name)}
              className={`w-full px-4 py-2 border rounded-lg ${nameError ? 'border-red-500' : ''}`}
              required
            />
            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
          </div>
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
          <div>
            <input
              type="password"
              placeholder="确认密码"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) validateConfirmPassword(e.target.value);
              }}
              onBlur={() => validateConfirmPassword(confirmPassword)}
              className={`w-full px-4 py-2 border rounded-lg ${confirmPasswordError ? 'border-red-500' : ''}`}
              required
            />
            {confirmPasswordError && <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F59E0B] text-white py-2 rounded-lg hover:bg-amber-500 transition-colors disabled:bg-gray-400"
          >
            {loading ? '注册中...' : '注册'}
          </button>
          <p className="text-center text-sm text-gray-600">
            已有账号？<Link to="/login" className="text-[#2D6A9F] hover:underline">立即登录</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
