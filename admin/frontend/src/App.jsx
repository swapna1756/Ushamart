import React from 'react';
import { Routes, Route, Navigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { Bell, MoreHorizontal } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Sidebar, { NAV } from './components/Sidebar';
import BrandName from './components/BrandName';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import OrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import PincodesPage from './pages/PincodesPage';
import InventoryPage from './pages/InventoryPage';
import SpecialOffersPage from './pages/SpecialOffersPage';
import BannersPage from './pages/BannersPage';
import CouponsPage from './pages/CouponsPage';
import NotificationsPage from './pages/NotificationsPage';
import LocationManagementPage from './pages/LocationManagementPage';
import PlaceholderPage from './pages/PlaceholderPage';
import CategoryEditPage from './pages/CategoryEditPage';
import ProductEditPage from './pages/ProductEditPage';
import CategoryAddPage from './pages/CategoryAddPage';
import ProductAddPage from './pages/ProductAddPage';

// ── Layout wrapper (Sidebar + content) ───────────────────────────────────────
const primaryMobileNav = ['/dashboard', '/products', '/orders', '/inventory'];

function getPageTitle(pathname) {
 const match = NAV.find(item => pathname === item.to || pathname.startsWith(item.to + '/'));
 return match?.label || 'Admin';
}

function MobileHeader({ user }) {
 const location = useLocation();
 return (
 <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl border-2 border-primary bg-white p-1 overflow-hidden flex-shrink-0">
 <img src="/logo.png" alt="UshaMart" className="w-full h-full object-contain" />
 </div>
 <div className="min-w-0 flex-1">
 <BrandName size="xs" className="block" />
 <h1 className="text-page-title text-gray-900 truncate mt-1">{getPageTitle(location.pathname)}</h1>
 </div>
 <button className="w-10 h-10 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center bg-white" aria-label="Notifications">
 <Bell size={18} />
 </button>
 <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0" title={user?.name || 'Admin'}>
 {(user?.name || 'A')[0].toUpperCase()}
 </div>
 </header>
 );
}

function MobileBottomNav() {
 const [moreOpen, setMoreOpen] = React.useState(false);
 const main = NAV.filter(item => primaryMobileNav.includes(item.to));
 const more = NAV.filter(item => !primaryMobileNav.includes(item.to));
 return (
 <>
 {moreOpen && (
 <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/35" onClick={() => setMoreOpen(false)}>
 <div className="absolute left-3 right-3 bottom-[calc(74px+env(safe-area-inset-bottom))] bg-white rounded-2xl border border-gray-100 shadow-2xl p-3" onClick={e => e.stopPropagation()}>
 <div className="grid grid-cols-2 gap-2">
 {more.map(({ to, label, icon: Icon }) => (
 <NavLink key={to} to={to} onClick={() => setMoreOpen(false)}
 className={({ isActive }) => `flex items-center gap-2 min-h-11 rounded-xl px-3 text-xs font-medium ${isActive ? 'bg-primary text-white' : 'bg-gray-50 text-gray-700'}`}>
 <Icon size={16} />
 <span className="truncate">{label}</span>
 </NavLink>
 ))}
 </div>
 </div>
 </div>
 )}
 <nav className="lg:hidden fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-gray-200 px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
 <div className="grid grid-cols-5 gap-1">
 {main.map(({ to, label, icon: Icon }) => (
 <NavLink key={to} to={to}
 className={({ isActive }) => `min-h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-medium ${isActive ? 'text-primary bg-primary/10' : 'text-gray-600'}`}>
 <Icon size={19} />
 <span>{label}</span>
 </NavLink>
 ))}
 <button type="button" onClick={() => setMoreOpen(v => !v)}
 className={`min-h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-medium ${moreOpen ? 'text-primary bg-primary/10' : 'text-gray-600'}`}>
 <MoreHorizontal size={19} />
 <span>More</span>
 </button>
 </div>
 </nav>
 </>
 );
}

function AdminLayout() {
 const { user, loading } = useAuth();

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-50">
 <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
 </div>
 );
 }

 if (!user) return <Navigate to="/login" replace />;

 return (
 <div className="flex h-screen overflow-hidden bg-gray-50">
 <Sidebar />
 <main className="flex-1 min-w-0 overflow-hidden flex flex-col pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0">
 <MobileHeader user={user} />
 <Outlet />
 </main>
 <MobileBottomNav />
 </div>
 );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
 return (
 <AuthProvider>
 <ToastProvider>
 <Routes>
 <Route path="/login" element={<LoginPage />} />

 <Route element={<AdminLayout />}>
 <Route index element={<Navigate to="/dashboard" replace />} />
 <Route path="/dashboard" element={<DashboardPage />} />
 <Route path="/products" element={<ProductsPage />} />
 <Route path="/products/add" element={<ProductAddPage />} />
 <Route path="/products/edit/:id" element={<ProductEditPage />} />
 <Route path="/categories" element={<CategoriesPage />} />
 <Route path="/categories/add" element={<CategoryAddPage />} />
 <Route path="/categories/edit/:id" element={<CategoryEditPage />} />
 <Route path="/orders" element={<OrdersPage />} />
 <Route path="/users" element={<UsersPage />} />
 <Route path="/inventory" element={<InventoryPage />} />
 <Route path="/special-offers" element={<SpecialOffersPage />} />
 <Route path="/banners font" element={<BannersPage />} />
 <Route path="/banners" element={<BannersPage />} />
 <Route path="/location-management" element={<LocationManagementPage />} />
 <Route path="/pincodes" element={<PincodesPage />} />
 <Route path="/coupons" element={<CouponsPage />} />
 <Route path="/notifications" element={<NotificationsPage />} />
 <Route path="/reports" element={<PlaceholderPage title="Reports & Analytics" desc="Sales reports and revenue trends will appear here." />} />
 <Route path="/settings" element={<PlaceholderPage title="Settings" desc="Store settings and preferences." />} />
 <Route path="*" element={<Navigate to="/dashboard" replace />} />
 </Route>
 </Routes>
 </ToastProvider>
 </AuthProvider>
 );
}
