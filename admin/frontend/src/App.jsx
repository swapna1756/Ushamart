import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';

import LoginPage          from './pages/LoginPage';
import DashboardPage      from './pages/DashboardPage';
import ProductsPage       from './pages/ProductsPage';
import CategoriesPage     from './pages/CategoriesPage';
import OrdersPage         from './pages/OrdersPage';
import UsersPage          from './pages/UsersPage';
import PincodesPage       from './pages/PincodesPage';
import InventoryPage      from './pages/InventoryPage';
import SpecialOffersPage  from './pages/SpecialOffersPage';
import BannersPage        from './pages/BannersPage';
import CouponsPage        from './pages/CouponsPage';
import NotificationsPage  from './pages/NotificationsPage';
import LocationManagementPage from './pages/LocationManagementPage';
import PlaceholderPage    from './pages/PlaceholderPage';

// ── Layout wrapper (Sidebar + content) ───────────────────────────────────────
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
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
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
            <Route index                  element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"      element={<DashboardPage />} />
            <Route path="/products"       element={<ProductsPage />} />
            <Route path="/categories"     element={<CategoriesPage />} />
            <Route path="/orders"         element={<OrdersPage />} />
            <Route path="/users"          element={<UsersPage />} />
            <Route path="/inventory"      element={<InventoryPage />} />
            <Route path="/special-offers" element={<SpecialOffersPage />} />
            <Route path="/banners font"   element={<BannersPage />} />
            <Route path="/banners"        element={<BannersPage />} />
            <Route path="/location-management" element={<LocationManagementPage />} />
            <Route path="/pincodes"       element={<PincodesPage />} />
            <Route path="/coupons"        element={<CouponsPage />} />
            <Route path="/notifications"  element={<NotificationsPage />} />
            <Route path="/reports"        element={<PlaceholderPage title="Reports & Analytics" desc="Sales reports and revenue trends will appear here." />} />
            <Route path="/settings"       element={<PlaceholderPage title="Settings" desc="Store settings and preferences." />} />
            <Route path="*"               element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
