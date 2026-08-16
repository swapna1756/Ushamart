import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandName from '../components/BrandName';

export default function ForgotPasswordPage() {
 const [email, setEmail] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState(false);

 const { resetPassword } = useAuth();
 const navigate = useNavigate();

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');
 setSuccess(false);

 if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
 setError('Please enter a valid email address.');
 return;
 }

 setLoading(true);
 try {
 await resetPassword(email.trim());
 setSuccess(true);
 } catch (err) {
 console.error('Password reset error:', err);
 if (err.code === 'auth/user-not-found') {
 setError('No account found with this email address.');
 } else if (err.code === 'auth/invalid-email') {
 setError('Invalid email address format.');
 } else {
 setError(err.message || 'Failed to send password reset email. Please try again.');
 }
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-green-50 flex items-center justify-center p-4">
 <div className="w-full max-w-md">
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
 <BrandName size="xl" as="h1" className="block" />
 <p className="text-sm text-muted mt-1">Reset your account password</p>
 </div>

 <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-7">
 {!success ? (
 <>
 <div className="flex items-center gap-2 mb-2">
 <button
 onClick={() => navigate('/login')}
 className="p-1 hover:bg-gray-100 rounded-lg transition"
 >
 <ArrowLeft size={18} className="text-gray-600" />
 </button>
 <h2 className="text-page-title text-gray-900">Forgot Password</h2>
 </div>
 <p className="text-xs text-muted mb-6">
 Enter your registered email address and we'll send you a password reset link.
 </p>

 {error && (
 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-600 font-medium">
 <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
 <span>{error}</span>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
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

 <button
 type="submit"
 disabled={loading}
 className="btn-press w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-xl text-sm font-medium text-white transition disabled:opacity-50"
 style={{
 background: 'linear-gradient(135deg,#0B6F3A,#14a857)',
 boxShadow: '0 4px 14px rgba(11,111,58,0.35)'
 }}
 >
 {loading ? <Loader2 size={16} className="spin" /> : null}
 {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
 </button>
 </form>

 <div className="mt-6 text-center text-xs text-gray-500">
 Remembered your password?{' '}
 <Link to="/login" className="font-medium text-primary hover:underline">
 Back to Sign In
 </Link>
 </div>
 </>
 ) : (
 <div className="text-center py-2 space-y-4">
 <div className="w-16 h-16 bg-green-100 text-primary rounded-full flex items-center justify-center mx-auto">
 <CheckCircle2 size={36} />
 </div>
 <h2 className="text-lg font-semibold text-gray-900">Email Sent!</h2>
 <p className="text-xs text-gray-600 leading-relaxed">
 We have sent a password reset link to <span className="font-medium text-gray-800">{email}</span>.
 Follow the instructions in the email to reset your password.
 </p>

 <div className="pt-2">
 <button
 onClick={() => navigate('/login')}
 className="btn-press w-full py-3 rounded-xl text-xs font-medium text-white bg-primary"
 >
 Back to Login
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
