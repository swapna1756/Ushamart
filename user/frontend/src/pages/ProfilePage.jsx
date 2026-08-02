import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Edit2, LogOut, Package, Bell, Heart, HelpCircle, Loader2, Check } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ name: user?.name||'', email: user?.email||'', addressText: user?.addressText||'', pincode: user?.pincode||'' });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-4xl">👤</div>
        <h2 className="text-lg font-black text-gray-800">Sign in to view profile</h2>
        <p className="text-sm text-gray-400 mt-1 mb-6">Manage orders, addresses and more</p>
        <button onClick={() => navigate('/login')}
          className="btn-press px-6 py-3 rounded-2xl text-sm font-bold text-white"
          style={{ background:'linear-gradient(135deg,#0B6F3A,#14a857)' }}>
          Login / Sign Up
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      await authApi.update(user.id, form);
      updateUser(form);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const MENU = [
    { icon:Package,    label:'My Orders',      action: () => navigate('/orders') },
    { icon:Heart,      label:'Wishlist',        action: () => navigate('/wishlist') },
    { icon:Bell,       label:'Notifications',   action: () => navigate('/notifications') },
    { icon:HelpCircle, label:'Help & Support',  action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-black text-primary flex-shrink-0">
            {(user.name || user.phone || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-gray-900 truncate">{user.name || 'Complete your profile'}</p>
            <p className="text-xs text-gray-500 mt-0.5">+91 {user.phone}</p>
            {user.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
          </div>
          <button onClick={() => { setEditing(v => !v); setError(''); }}
            className="btn-press w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Edit2 size={15} className="text-gray-600" />
          </button>
        </div>

        {/* Incomplete nudge */}
        {!user.name && (
          <div className="max-w-2xl mx-auto mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-xs font-black text-yellow-800">Profile incomplete</p>
              <p className="text-[10px] text-yellow-600">Add your name and address to order</p>
            </div>
            <button onClick={() => setEditing(true)} className="btn-press text-[10px] font-black bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-lg">
              Complete
            </button>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-20 space-y-4">
        {/* Edit Form */}
        {editing && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3 animate-fadeIn">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Edit Profile</h3>
            {[
              ['Full Name *', 'name', 'text', 'Your full name'],
              ['Email',       'email', 'email', 'email@example.com'],
              ['Address',     'addressText', 'text', 'Your delivery address'],
              ['Pincode',     'pincode', 'text', '6-digit pincode'],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            ))}
            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setEditing(false); setError(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="btn-press flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
                {saving ? <Loader2 size={13} className="spin" /> : saved ? <Check size={13} /> : null}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Profile details */}
        {!editing && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {[
              { icon:Phone, label:'Mobile', value: '+91 ' + user.phone },
              { icon:Mail,  label:'Email',  value: user.email || 'Not set' },
              { icon:MapPin,label:'Address',value: user.addressText || 'Not set' },
              { icon:MapPin,label:'Pincode',value: user.pincode || 'Not set' },
            ].map(({ icon:Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick menu */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {MENU.map(({ icon:Icon, label, action }) => (
            <button key={label} onClick={action}
              className="btn-press w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition text-left">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-primary" />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-800">{label}</span>
              <span className="text-gray-300">›</span>
            </button>
          ))}
        </div>

        {/* Sign out */}
        <button onClick={() => { logout(); navigate('/login'); }}
          className="btn-press w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition">
          <LogOut size={15} /> Sign Out
        </button>

        <p className="text-center text-[10px] text-gray-300 pb-2">UshaMart v1.0 · All rights reserved</p>
      </div>
    </div>
  );
}
