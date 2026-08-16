import React from 'react';
import { NavLink } from 'react-router-dom';
import {
 LayoutDashboard, Package, Grid3X3, ShoppingCart, Users,
 MapPin, Tag, Gift, Bell, BarChart3, Settings, LogOut,
 Warehouse, Megaphone, ChevronRight, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandName from './BrandName';

export const NAV = [
 { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
 { to: '/products', label: 'Products', icon: Package },
 { to: '/categories', label: 'Categories', icon: Grid3X3 },
 { to: '/orders', label: 'Orders', icon: ShoppingCart },
 { to: '/users', label: 'Users', icon: Users },
 { to: '/inventory', label: 'Inventory', icon: Warehouse },
 { to: '/special-offers', label: 'Special Offers', icon: Gift },
 { to: '/banners', label: 'Banners', icon: Megaphone },
 { to: '/location-management', label: 'Location Management', icon: Globe },
 { to: '/pincodes', label: 'Pincode Management', icon: MapPin },
 { to: '/coupons', label: 'Discounts', icon: Tag },
 { to: '/notifications', label: 'Notifications', icon: Bell },
 { to: '/reports', label: 'Reports', icon: BarChart3 },
 { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ badges = {} }) {
 const { user, logout } = useAuth();

 return (
 <aside className="hidden lg:flex w-60 bg-white border-r border-gray-200 flex-col h-full flex-shrink-0">
 {/* Logo */}
 <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
 <div style={{
 width: '40px', height: '40px', borderRadius: '10px', border: '2px solid #0B6F3A',
 background: '#fff', padding: '3px', overflow: 'hidden', flexShrink: 0,
 }}>
 <img src="/logo.png" alt="UshaMart"
 style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
 </div>
 <div>
 <BrandName size="sm" className="block" />
 <p className="text-xs text-muted mt-0.5">Admin Console</p>
 </div>
 </div>

 {/* Nav items */}
 <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
 {NAV.map(({ to, label, icon: Icon }) => {
 const badge = badges[label];
 return (
 <NavLink
 key={to}
 to={to}
 className={({ isActive }) =>
 `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${
 isActive
 ? 'bg-primary text-white'
 : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
 }`
 }
 >
 {({ isActive }) => (
 <>
 <Icon size={15} className={isActive ? 'text-white' : 'text-gray-500'} />
 <span className="flex-1 text-left font-medium">{label}</span>
 {badge > 0 && (
 <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
 isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
 }`}>
 {badge}
 </span>
 )}
 </>
 )}
 </NavLink>
 );
 })}
 </nav>

 {/* User footer */}
 <div className="p-3 border-t border-gray-100">
 <div className="flex items-center gap-2.5 mb-2.5">
 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
 {(user?.name || 'A')[0].toUpperCase()}
 </div>
 <div className="min-w-0">
 <p className="text-sm font-medium text-gray-800 truncate">{user?.name || 'Admin'}</p>
 <p className="text-xs text-muted truncate capitalize">{user?.role?.replace('_', ' ') || 'Admin'}</p>
 </div>
 </div>
 <button
 onClick={logout}
 className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
 >
 <LogOut size={13} /> Sign Out
 </button>
 </div>
 </aside>
 );
}
