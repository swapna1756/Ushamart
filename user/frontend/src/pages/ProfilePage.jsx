import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Edit2, LogOut, Package, Bell, Heart, HelpCircle,
  Loader2, Check, ShieldCheck, MapPin, Phone, Building2, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, profile, logout, updateProfileData } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    profile_image: '',
    mobile_number: '',
    default_address: '',
    pincode: '',
    city: '',
    state: ''
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile || user) {
      setForm({
        full_name: profile?.full_name || user?.displayName || '',
        profile_image: profile?.profile_image || user?.photoURL || '',
        mobile_number: profile?.mobile_number || '',
        default_address: profile?.default_address || '',
        pincode: profile?.pincode || '',
        city: profile?.city || '',
        state: profile?.state || ''
      });
    }
  }, [profile, user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-4xl">👤</div>
        <h2 className="text-lg font-black text-gray-800">Sign in to view profile</h2>
        <p className="text-sm text-gray-400 mt-1 mb-6">Manage orders, addresses and account settings</p>
        <button
          onClick={() => navigate('/login')}
          className="btn-press px-6 py-3 rounded-2xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#0B6F3A,#14a857)' }}
        >
          Login / Sign Up
        </button>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError('Full Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateProfileData(form);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const MENU = [
    { icon: Package, label: 'My Orders', action: () => navigate('/orders') },
    { icon: Heart, label: 'Wishlist', action: () => navigate('/wishlist') },
    { icon: Bell, label: 'Notifications', action: () => navigate('/notifications') },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
  ];

  const profileImage = profile?.profile_image || user?.photoURL;
  const fullName = profile?.full_name || user?.displayName || 'Valued Customer';
  const email = profile?.email || user?.email;
  const isVerified = user?.emailVerified || profile?.email_verified;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header Summary */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          {profileImage ? (
            <img
              src={profileImage}
              alt={fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-black text-primary flex-shrink-0">
              {(fullName || '?')[0].toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-gray-900 truncate">{fullName}</h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                <ShieldCheck size={12} /> Verified Account
              </span>
            </div>
          </div>

          <button
            onClick={() => { setEditing(v => !v); setError(''); }}
            className="btn-press w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"
            title="Edit Profile"
          >
            <Edit2 size={15} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Edit Form */}
        {editing && (
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Edit Profile & Address</h3>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Full Name *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Full Name"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Profile Image URL</label>
              <input
                type="url"
                value={form.profile_image}
                onChange={e => setForm(p => ({ ...p, profile_image: e.target.value }))}
                placeholder="https://example.com/avatar.jpg"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Mobile Number</label>
              <input
                type="tel"
                value={form.mobile_number}
                onChange={e => setForm(p => ({ ...p, mobile_number: e.target.value }))}
                placeholder="Mobile Number"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Saved Address</label>
              <textarea
                value={form.default_address}
                onChange={e => setForm(p => ({ ...p, default_address: e.target.value }))}
                placeholder="House No, Street, Landmark"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))}
                  placeholder="Pincode"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="City"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                  placeholder="State"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setEditing(false); setError(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-press flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {saving ? <Loader2 size={13} className="spin" /> : saved ? <Check size={13} /> : null}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Profile Details List */}
        {!editing && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Profile Details</span>
            </div>

            {[
              { icon: User, label: 'Full Name', value: fullName },
              { icon: Mail, label: 'Email Address', value: email },
              { icon: Phone, label: 'Mobile Number', value: profile?.mobile_number || 'Not provided' },
              { icon: ShieldCheck, label: 'Verification Status', value: isVerified ? 'Verified' : 'Unverified' },
              { icon: MapPin, label: 'Saved Address', value: profile?.default_address || 'Not set' },
              { icon: Building2, label: 'Pincode / City', value: (profile?.pincode || '—') + ' / ' + (profile?.city || '—') },
              { icon: Globe, label: 'State', value: profile?.state || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
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

        {/* Quick Menu */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {MENU.map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              className="btn-press w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-primary" />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-800">{label}</span>
              <span className="text-gray-300">›</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-press w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition"
        >
          <LogOut size={15} /> Sign Out
        </button>

        <p className="text-center text-[10px] text-gray-300 pb-2">
          UshaMart v1.0 · All rights reserved
        </p>
      </div>
    </div>
  );
}
