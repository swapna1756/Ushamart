import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      addToast(err.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl border-2 border-primary flex items-center justify-center overflow-hidden bg-white shadow-md mb-4"
              style={{ padding: '4px' }}>
              <img src="/logo.png" alt="UshaMart" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-black text-gray-900">UshaMart Admin</h1>
            <p className="text-xs text-gray-400 mt-1">Sign in to manage your store</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@ushamart.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm mt-2">
              {loading ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[10px] text-gray-400 mt-6">
            Use your registered admin email and password
          </p>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-4">UshaMart Admin Console · Protected Access</p>
      </div>
    </div>
  );
}
