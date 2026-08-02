import React, { useState, useEffect } from 'react';
import UserApp from './components/UserApp';
import AdminApp from './components/AdminApp';
import { auth } from './db/mockFirebase';
import { Tablet, Smartphone, Laptop, Sparkles, Layers } from 'lucide-react';

export default function App() {
  // Layout Options: 'split' (side-by-side), 'user' (only phone), 'admin' (only admin desktop)
  const [layoutMode, setLayoutMode] = useState('split');

  // Separate auth state handlers for UserApp and AdminApp
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ushamart_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only restore if it's a real customer session (never a hardcoded default)
        if (parsed && parsed.role === 'customer' && parsed.phone) return parsed;
      }
    } catch { }
    // No stored session — start as guest (null)
    return null;
  });
  const [adminUser, setAdminUser] = useState(null);

  // Time display simulation for phone status bar
  const [phoneTime, setPhoneTime] = useState('09:41 AM');

  useEffect(() => {
    // Update active time for the phone status bar
    const updateTime = () => {
      const date = new Date();
      let hrs = date.getHours();
      const mins = String(date.getMinutes()).padStart(2, '0');
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;
      setPhoneTime(`${hrs}:${mins} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial auth user session
  useEffect(() => {
    const handleAuthChange = () => {
      const activeUser = auth.getCurrentUser();
      if (activeUser) {
        if (activeUser.role === 'customer') {
          setCustomerUser(activeUser);
        } else if (activeUser.role === 'super_admin' || activeUser.role === 'store_manager') {
          setAdminUser(activeUser);
        }
      } else {
        // clear sessions
        setCustomerUser(null);
        setAdminUser(null);
      }
    };

    handleAuthChange();
    window.addEventListener('ushamart_auth_change', handleAuthChange);
    return () => window.removeEventListener('ushamart_auth_change', handleAuthChange);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans overflow-x-hidden selection:bg-teal-500 selection:text-white">

      {/* Workspace Switcher Header */}
      <header className="bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0 z-30 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Layers size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 leading-none">
              UshaMart <span className="text-emerald-400 font-bold">Workspace</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Shared Local Sandbox Prototypes</span>
          </div>
        </div>

        {/* View Layout Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex gap-1 shadow-inner">
          {[
            { id: 'split', label: 'Dual View', icon: Tablet },
            { id: 'user', label: 'User Mobile', icon: Smartphone },
            { id: 'admin', label: 'Admin Desk', icon: Laptop }
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = layoutMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setLayoutMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition active-scale ${isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
              >
                <Icon size={14} className={isActive ? 'text-emerald-400' : ''} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-right text-[10px] text-slate-400 font-semibold select-none hidden md:block">
          Database: <span className="text-emerald-400">LocalStorage Simulation</span>
        </div>
      </header>

      {/* Workspace Display Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL: User App (wrapped in CSS Phone frame) */}
        {(layoutMode === 'split' || layoutMode === 'user') && (
          <div className={`flex-1 flex items-center justify-center p-6 bg-slate-900 border-r border-slate-800/60 overflow-y-auto no-scrollbar transition-all duration-300 ${layoutMode === 'user' ? 'w-full' : 'max-w-[480px] xl:max-w-[500px]'
            }`}>

            {/* STUNNING IPHONE 15 PRO EMULATOR SHELL */}
            <div className="w-[360px] h-[720px] rounded-[52px] bg-black p-3.5 shadow-2xl relative border-4 border-slate-700 ring-[12px] ring-slate-800 flex flex-col overflow-hidden transform scale-95 md:scale-100 transition duration-300">

              {/* Dynamic Island */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-28 h-7 bg-black rounded-2xl z-50 flex items-center justify-center border border-white/5 shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/10 ml-2"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-950 border border-white/10 ml-auto mr-3"></div>
              </div>

              {/* Status Bar */}
              <div className="h-8 bg-primary text-white flex items-center justify-between px-6 z-40 relative text-[10px] font-black select-none tracking-wide">
                <span>{phoneTime}</span>
                <div className="flex items-center gap-1.5">
                  {/* Network Signal Bars */}
                  <div className="flex gap-0.5 items-end">
                    <span className="w-0.5 h-1 bg-white rounded-full"></span>
                    <span className="w-0.5 h-1.5 bg-white rounded-full"></span>
                    <span className="w-0.5 h-2 bg-white rounded-full"></span>
                    <span className="w-0.5 h-2.5 bg-white rounded-full"></span>
                  </div>
                  {/* Wifi Icon Mock */}
                  <span className="text-[9px]">📶</span>
                  {/* Battery percentage */}
                  <div className="flex items-center border border-white/60 rounded px-0.5 py-px gap-0.5 scale-90">
                    <span className="w-3.5 h-1.5 bg-white rounded-sm"></span>
                  </div>
                </div>
              </div>

              {/* Phone screen context wrapper */}
              <div className="flex-1 bg-bg-light rounded-[36px] overflow-hidden relative border border-black shadow-inner">
                <UserApp user={customerUser} setUser={setCustomerUser} />
              </div>

              {/* Home Indicator Bar */}
              <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-50"></div>
            </div>

          </div>
        )}

        {/* RIGHT PANEL: Admin App Dashboard */}
        {(layoutMode === 'split' || layoutMode === 'admin') && (
          <div className="flex-1 flex bg-slate-950 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 opacity-90 z-0"></div>
            <div className="flex-1 flex flex-col z-10 relative overflow-hidden">
              <AdminApp user={adminUser} setUser={setAdminUser} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
