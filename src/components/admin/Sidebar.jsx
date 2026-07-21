import React from 'react';
import {
  LayoutDashboard, Users, ShoppingCart, Grid3X3, Package,
  Warehouse, MapPin, Tag, BarChart3, Settings, LogOut, ChevronRight
} from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'categories', label: 'Categories', icon: Grid3X3 },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'pincodes', label: 'Pincode Management', icon: MapPin },
  { id: 'discounts', label: 'Discounts', icon: Tag },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeTab, setActiveTab, user, onSignOut, badges = {} }) {
  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0 shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
          <img src="/logo.png" alt="UshaMart" className="w-6 h-6 object-contain" />
        </div>
        <div>
          <h1 className="text-sm font-black text-gray-900 leading-none">UshaMart</h1>
          <span className="text-[10px] text-primary font-bold">Admin Console</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const badge = badges[id];
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
              <span className="flex-1 text-left">{label}</span>
              {badge > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                  {badge}
                </span>
              )}
              {isActive && <ChevronRight size={12} className="text-white/70" />}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs flex-shrink-0">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-gray-400 truncate capitalize">{user?.role?.replace('_', ' ') || 'Admin'}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
