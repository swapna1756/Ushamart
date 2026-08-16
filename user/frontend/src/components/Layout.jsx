import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Grid, Search, ShoppingBag, User, Bell, Heart, MapPin, ChevronDown, Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { notificationsApi } from '../services/api';
import LocationSelectorModal from './LocationSelectorModal';
import BrandName from './BrandName';

const MOBILE_NAV = [
  { to: '/home',        icon: Home,      label: 'Home' },
  { to: '/categories',  icon: Grid,      label: 'Categories' },
  { to: '/search',      icon: Search,    label: 'Search' },
  { to: '/cart',        icon: ShoppingBag, label: 'Cart',         badgeKey: 'cart' },
  { to: '/profile',     icon: User,      label: 'Account' },
];

const DESKTOP_NAV = [
  { to: '/home',        icon: Home,      label: 'Home' },
  { to: '/categories',  icon: Grid,      label: 'Categories' },
  { to: '/search',      icon: Search,    label: 'Search' },
  { to: '/wishlist',    icon: Heart,     label: 'Wishlist',       badgeKey: 'wishlist' },
  { to: '/cart',        icon: ShoppingBag, label: 'Cart',         badgeKey: 'cart' },
  { to: '/orders',      icon: Package,   label: 'Orders' },
  { to: '/notifications', icon: Bell,   label: 'Notifications',  badgeKey: 'notifications' },
  { to: '/profile',     icon: User,      label: 'Account' },
];

const READ_KEY = 'ushamart_read_notifs';
function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export default function Layout() {
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('ushamart_selected_location');
      return saved ? JSON.parse(saved) : {
        fullAddress: 'Visakhapatnam Fort, Visakhapatnam, AP - 530001',
        pincode: '530001',
        area: 'Visakhapatnam Fort',
        city: 'Visakhapatnam',
        state: 'Andhra Pradesh',
        latitude: 17.6868,
        longitude: 83.2185,
      };
    } catch {
      return null;
    }
  });

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    localStorage.setItem('ushamart_selected_location', JSON.stringify(loc));
  };

  useEffect(() => {
    const update = () => {
      notificationsApi
        .getAll()
        .then((r) => {
          const list = Array.isArray(r) ? r : r?.data || [];
          const readIds = getReadIds();
          const unread = list.filter((n) => !readIds.has(n.id)).length;
          setUnreadCount(unread);
        })
        .catch(() => setUnreadCount(0));
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  const isCartPage = location.pathname === '/cart';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* ── Top App Bar ─────────────────────────────────────────────────── */}
      {!isCartPage && (
        <header className="sticky top-0 z-30 bg-gradient-to-r from-primary via-primary-dark to-green-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">

          {/* Delivery location button */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1.5 rounded-lg transition min-w-0 flex-1 sm:flex-initial"
          >
            <MapPin size={15} className="text-yellow-300 flex-shrink-0" />
            <div className="text-left min-w-0">
              <span className="text-xs font-medium text-white/80 block leading-none">Deliver to</span>
              <span className="text-xs font-semibold truncate block text-white">
                {selectedLocation?.city || 'Visakhapatnam'} - {selectedLocation?.pincode || '530001'}
              </span>
            </div>
            <ChevronDown size={13} className="text-white/60 flex-shrink-0 ml-0.5" />
          </button>

          {/* Icon actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button onClick={() => navigate('/search')} className="p-2 rounded-full hover:bg-white/10 transition" title="Search">
              <Search size={17} />
            </button>

            <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-full hover:bg-white/10 transition" title="Notifications">
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-secondary text-white text-[10px] font-medium flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button onClick={() => navigate('/cart')} className="relative p-2 rounded-full hover:bg-white/10 transition" title="Cart">
              <ShoppingBag size={17} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-secondary text-white text-[10px] font-medium flex items-center justify-center leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      )}

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 pb-20 lg:pb-0 min-w-0">
        <Outlet />
      </main>

      {/* Location modal */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={selectedLocation}
        onSelectLocation={handleSelectLocation}
      />

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5 min-h-16 items-center px-1">
          {MOBILE_NAV.map(({ to, icon: Icon, label, badgeKey }) => {
            const badgeValue = badgeKey === 'cart' ? itemCount : badgeKey === 'wishlist' ? wishCount : 0;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 text-center transition ${
                    isActive ? 'text-primary' : 'text-gray-600 hover:text-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
                      {badgeValue > 0 && (
                        <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-secondary text-white text-[10px] font-medium flex items-center justify-center leading-none shadow-sm">
                          {badgeValue > 9 ? '9+' : badgeValue}
                        </span>
                      )}
                    </div>
                    <span className="text-xs leading-tight mt-0.5 truncate max-w-full px-0.5 font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <nav className="hidden lg:flex fixed left-0 top-12 bottom-0 w-56 bg-white border-r border-gray-200 flex-col shadow-sm z-30">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            border: '2px solid #0B6F3A', background: '#fff', padding: '3px',
            overflow: 'hidden', flexShrink: 0,
          }}>
            <img src="/logo.png" alt="UshaMart" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
          <div>
            <BrandName size="sm" className="block" />
            <p className="text-xs text-muted mt-0.5">Fresh Groceries</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {DESKTOP_NAV.map(({ to, icon: Icon, label, badgeKey }) => {
            const badgeValue =
              badgeKey === 'cart' ? itemCount
              : badgeKey === 'wishlist' ? wishCount
              : badgeKey === 'notifications' ? unreadCount
              : 0;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${
                    isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} className={isActive ? 'text-white' : 'text-gray-500'} />
                    <span className="flex-1 font-medium">{label}</span>
                    {badgeValue > 0 && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-secondary text-white'
                      }`}>
                        {badgeValue > 9 ? '9+' : badgeValue}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <style>{`@media (min-width: 1024px) { main { margin-left: 224px; } }`}</style>
    </div>
  );
}
