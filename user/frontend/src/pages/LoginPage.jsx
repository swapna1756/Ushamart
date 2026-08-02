import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 800);
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length < 4) { setError('Enter the 4-digit OTP.'); return; }
    setLoading(true);
    try {
      const res = await login(phone);
      if (res.isNewUser) navigate('/profile', { replace: true });
      else navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div style={{ width:'88px', height:'88px', borderRadius:'20px', border:'2.5px solid #0B6F3A',
            background:'#fff', padding:'6px', boxShadow:'0 6px 24px rgba(11,111,58,0.22)',
            overflow:'hidden', marginBottom:'14px' }}>
            <img src="/logo.png" alt="UshaMart"
              style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">UshaMart</h1>
          <p className="text-sm text-gray-500 mt-1">Fresh groceries delivered to you</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">
                {step === 1 ? 'Enter Mobile Number' : 'Verify OTP'}
              </h2>
              <p className="text-xs text-gray-400">
                {step === 1 ? 'We\'ll send you a verification code' : `Sent to +91 ${phone}`}
              </p>
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-primary transition">
                <span className="px-3 text-sm font-bold text-gray-500 border-r-2 border-gray-200 py-3 bg-gray-50">+91</span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                  placeholder="10-digit mobile number" maxLength={10}
                  className="flex-1 px-3 py-3 text-sm focus:outline-none font-semibold" autoFocus />
              </div>
              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
              <button type="submit" disabled={loading || phone.length !== 10}
                className="btn-press w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#0B6F3A,#14a857)', boxShadow: '0 4px 14px rgba(11,111,58,0.35)' }}>
                {loading ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}
                {loading ? 'Sending OTP…' : 'Get OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="space-y-4">
              <input type="text" inputMode="numeric" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,4))}
                placeholder="Enter 4-digit OTP" maxLength={4} autoFocus
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-black tracking-widest focus:outline-none focus:border-primary transition" />
              <p className="text-[10px] text-gray-400 text-center">Hint: any 4-digit code (e.g. 1234) in dev</p>
              {error && <p className="text-xs text-red-500 font-semibold text-center">{error}</p>}
              <button type="submit" disabled={loading || otp.length < 4}
                className="btn-press w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#0B6F3A,#14a857)', boxShadow: '0 4px 14px rgba(11,111,58,0.35)' }}>
                {loading ? <Loader2 size={16} className="spin" /> : null}
                {loading ? 'Verifying…' : 'Verify & Login'}
              </button>
              <button type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition py-1">
                ← Change number
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-4">By continuing, you agree to UshaMart's Terms of Service</p>
      </div>
    </div>
  );
}
