import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Grid3X3, ShoppingCart, Users,
  MapPin, Tag, Gift, Bell, BarChart3, Settings, LogOut,
  Warehouse, Megaphone, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard',      label: 'Dashboard',         icon: LayoutDashboard },
  { to: '/products',       label: 'Products',           icon: Package },
  { to: '/categories',     label: 'Categories',         icon: Grid3X3 },
  { to: '/orders',         label: 'Orders',             icon: ShoppingCart },
  { to: '/users',          label: 'Users',              icon: Users },
  { to: '/inventory',      label: 'Inventory',          icon: Warehouse },
  { to: '/special-offers', label: 'Special Offers',     icon: Gift },
  { to: '/banners',        label: 'Banners',            icon: Megaphone },
  { to: '/pincodes',       label: 'Pincode Management', icon: MapPin },
  { to: '/coupons',        label: 'Discounts',          icon: Tag },
  { to: '/notifications',  label: 'Notifications',      icon: Bell },
  { to: '/reports',        label: 'Reports',            icon: BarChart3 },
  { to: '/settings',       label: 'Settings',           icon: Settings },
];

export default function Sidebar({ badges = {} }) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0 shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-3">
        <div style={{ width:'44px', height:'44px', borderRadius:'12px', border:'2px solid #0B6F3A',
          background:'#fff', padding:'3px', boxShadow:'0 2px 8px rgba(11,111,58,0.18)',
          overflow:'hidden', flexShrink:0 }}>
          <img src="/logo.png" alt="UshaMart"
            style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
        </div>
        <div>
          <p className="text-sm font-black text-gray-900 leading-none">UshaMart</p>
          <p className="text-[10px] text-primary font-semibold mt-0.5">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const badge = badges[label];
          return (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={15} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                  <span className="flex-1 text-left">{label}</span>
                  {badge > 0 && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                      {badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={12} className="text-white/70" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs flex-shrink-0">
            {(user?.name || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-gray-400 truncate capitalize">{user?.role?.replace('_', ' ') || 'Admin'}</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition">
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
