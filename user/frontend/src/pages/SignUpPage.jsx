import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle2, RefreshCw, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const { signUp, resendVerificationEmailForUnverified } = useAuth();
  const navigate = useNavigate();

  // Password Policy Rules Validator
  const validatePassword = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter (A-Z).';
    if (!/[a-z]/.test(pass)) return 'Password must contain at least one lowercase letter (a-z).';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number (0-9).';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 'Password must contain at least one special character (!@#$%^&* etc.).';
    return null;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Confirm Password must match Password.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      setSuccessState(true);
    } catch (err) {
      console.error('Sign Up Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists. Please log in.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please ensure it satisfies all security criteria.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in your Firebase project. Please enable Email/Password provider in Firebase Console > Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !password) {
      setResendMessage('Please fill in your email and password above to resend verification link.');
      return;
    }
    setResendLoading(true);
    setResendMessage('');
    setError('');
    try {
      await resendVerificationEmailForUnverified(email.trim(), password);
      setResendMessage('Verification email resent successfully! Please check your inbox.');
    } catch (err) {
      console.error(err);
      setError('Failed to resend verification email. Please check your credentials.');
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
          <p className="text-sm text-gray-500 mt-1">Create your account to start shopping</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-7">
          {!successState ? (
            <>
              <h2 className="text-lg font-black text-gray-900 mb-1">Create Account</h2>
              <p className="text-xs text-gray-400 mb-6">Fill in your information to register</p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-600 font-medium">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition">
                    <User size={18} className="text-gray-400 mr-2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full text-sm focus:outline-none font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition">
                    <Mail size={18} className="text-gray-400 mr-2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full text-sm focus:outline-none font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition">
                    <Lock size={18} className="text-gray-400 mr-2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 upper, 1 lower, 1 num, 1 special"
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
                  <p className="text-[10px] text-gray-400 mt-1">
                    Must be 8+ chars with uppercase, lowercase, number & special character.
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password *</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition">
                    <Lock size={18} className="text-gray-400 mr-2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full text-sm focus:outline-none font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600 transition ml-2"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  {loading ? 'Creating Account…' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-primary hover:underline">
                  Log In
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-2 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-primary rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl font-black text-gray-900">Registration Successful</h2>
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-semibold leading-relaxed">
                Your account has been created successfully. Please verify your email before logging in.
              </div>
              <p className="text-xs text-gray-500">
                We sent a verification link to <span className="font-bold text-gray-800">{email}</span>.
              </p>

              {resendMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-medium">
                  {resendMessage}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="w-full py-3 rounded-xl text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  {resendLoading ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
                  Resend Verification Email
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="btn-press w-full py-3.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover transition flex items-center justify-center gap-2"
                >
                  Proceed to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
