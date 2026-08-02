import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUnverifiedErr, setIsUnverifiedErr] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const { login, resendVerificationEmailForUnverified } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsUnverifiedErr(false);
    setResendMessage('');

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/email-not-verified') {
        setIsUnverifiedErr(true);
        setError('Your email address is not verified yet. Please check your inbox and verify your email before logging in.');
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid email address or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please reset your password or try again later.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in your Firebase project. Please enable Email/Password provider in Firebase Console > Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Failed to log in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !password) {
      setResendMessage('Please enter your email and password above to resend the verification link.');
      return;
    }
    setResendLoading(true);
    setResendMessage('');
    try {
      await resendVerificationEmailForUnverified(email.trim(), password);
      setResendMessage('Verification email resent successfully! Please check your inbox.');
    } catch (err) {
      console.error(err);
      setResendMessage('Failed to resend verification link. Please verify your email and password.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            border: '2.5px solid #0B6F3A',
            background: '#fff',
            padding: '6px',
            boxShadow: '0 6px 24px rgba(11,111,58,0.22)',
            overflow: 'hidden',
            marginBottom: '12px'
          }}>
            <img src="/logo.png" alt="UshaMart" className="w-full h-full object-contain block" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">UshaMart</h1>
          <p className="text-sm text-gray-500 mt-1">Fresh groceries delivered to you</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-7">
          <h2 className="text-lg font-black text-gray-900 mb-1">Welcome Back</h2>
          <p className="text-xs text-gray-400 mb-6">Log in with your registered email and password</p>

          {error && (
            <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-xs font-medium ${
              isUnverifiedErr ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span>{error}</span>
                {isUnverifiedErr && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-900 bg-yellow-200 hover:bg-yellow-300 px-3 py-1 rounded-lg transition"
                    >
                      {resendLoading ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />}
                      Resend Verification Email
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {resendMessage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-semibold">
              {resendMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition">
                <Mail size={18} className="text-gray-400 mr-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-sm focus:outline-none font-medium"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition">
                <Lock size={18} className="text-gray-400 mr-2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full text-sm focus:outline-none font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition ml-2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-press w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg,#0B6F3A,#14a857)',
                boxShadow: '0 4px 14px rgba(11,111,58,0.35)'
              }}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400">New to UshaMart?</span>
            <Link
              to="/signup"
              className="w-full text-center py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              Create Account
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-4">
          By continuing, you agree to UshaMart's Terms of Service
        </p>
      </div>
    </div>
  );
}
