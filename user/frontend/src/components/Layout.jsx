import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Grid, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

const NAV = [
  { to: '/home',       icon: Home,       label: 'Home' },
  { to: '/categories', icon: Grid,       label: 'Categories' },
  { to: '/search',     icon: Search,     label: 'Search' },
  { to: '/cart',       icon: ShoppingBag,label: 'Cart' },
  { to: '/profile',    icon: User,       label: 'Account' },
];

export default function Layout() {
  const { itemCount } = useCart();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Page content — grows to fill space, leaves room for bottom nav */}
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav — visible on mobile/tablet; hidden on large screens */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-5 h-14">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-center transition ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`
              }>
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                    {to === '/cart' && itemCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-secondary text-white text-[8px] font-black flex items-center justify-center">
                        {itemCount > 9 ? '9+' : itemCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-semibold leading-none">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop sidebar nav — hidden on mobile */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-gray-100 flex-col shadow-sm z-30">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-shrink-0"
            style={{ width:'44px', height:'44px', borderRadius:'12px', border:'2px solid #0B6F3A',
              background:'#fff', padding:'4px', boxShadow:'0 2px 8px rgba(11,111,58,0.18)', overflow:'hidden' }}>
            <img src="/logo.png" alt="UshaMart"
              style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 leading-none">
              Usha<span className="text-primary">Mart</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Fresh Groceries</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${isActive ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-white' : 'text-gray-400'} />
                  <span className="flex-1">{label}</span>
                  {to === '/cart' && itemCount > 0 && (
                    <span className="text-[9px] font-black bg-secondary text-white px-1.5 py-0.5 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop: push content right of sidebar */}
      <style>{`@media (min-width: 768px) { main { margin-left: 224px; } }`}</style>
    </div>
  );
}
