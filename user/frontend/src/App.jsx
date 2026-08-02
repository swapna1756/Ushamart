import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import HomePage        from './pages/HomePage';
import CategoriesPage  from './pages/CategoriesPage';
import ProductDetail   from './pages/ProductDetail';
import CartPage        from './pages/CartPage';
import CheckoutPage    from './pages/CheckoutPage';
import OrdersPage      from './pages/OrdersPage';
import OrderTracking   from './pages/OrderTracking';
import SearchPage      from './pages/SearchPage';
import WishlistPage    from './pages/WishlistPage';
import ProfilePage     from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage       from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="/home"           element={<HomePage />} />
            <Route path="/categories"     element={<CategoriesPage />} />
            <Route path="/search"         element={<SearchPage />} />
            <Route path="/product/:id"    element={<ProductDetail />} />
            <Route path="/cart"           element={<CartPage />} />
            <Route path="/checkout"       element={<CheckoutPage />} />
            <Route path="/orders"         element={<OrdersPage />} />
            <Route path="/orders/:id"     element={<OrderTracking />} />
            <Route path="/wishlist"       element={<WishlistPage />} />
            <Route path="/profile"        element={<ProfilePage />} />
            <Route path="/notifications"  element={<NotificationsPage />} />
            <Route path="*"              element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
