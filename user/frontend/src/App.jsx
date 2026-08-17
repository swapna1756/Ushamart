import React, { useCallback, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderTracking from './pages/OrderTracking';
import OrderSuccessPage from './pages/OrderSuccessPage';
import SearchPage from './pages/SearchPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SplashScreen from './components/SplashScreen';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }) {
 const { user, loading } = useAuth();

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-50">
 <Loader2 className="w-8 h-8 text-primary spin" />
 </div>
 );
 }

 // Only redirect if there is genuinely no user at all.
 // emailVerified check is intentionally disabled — the `if (false && ...)` guard
 // inside AuthContext already handles this; we must not duplicate it here.
 if (!user) {
 return <Navigate to="/login" replace />;
 }

 return children;
}

function PublicRoute({ children }) {
 const { user, loading } = useAuth();

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-50">
 <Loader2 className="w-8 h-8 text-primary spin" />
 </div>
 );
 }

 // If a user is logged in, send them to the app.
 // We do NOT gate on emailVerified here — that check is disabled in AuthContext.
 if (user) {
 return <Navigate to="/home" replace />;
 }

 return children;
}

function AppRoutes() {
 const [showSplash, setShowSplash] = useState(true);
 const { loading, bootstrapError, retryBootstrap } = useAuth();
 const finishSplash = useCallback(() => setShowSplash(false), []);

 if (showSplash) {
 return <SplashScreen onFinish={finishSplash} />;
 }

 if (bootstrapError) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-center">
 <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-7 space-y-4">
 <h1 className="text-lg font-bold text-gray-900">Unable to connect to UshaMart</h1>
 <p className="text-sm text-gray-500">{bootstrapError}</p>
 <button onClick={retryBootstrap} className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover">
 Retry
 </button>
 </div>
 </div>
 );
 }

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-50">
 <Loader2 className="w-8 h-8 text-primary spin" />
 </div>
 );
 }

 return (
 <Routes>
 {/* Public auth routes */}
 <Route
 path="/login"
 element={
 <PublicRoute>
 <LoginPage />
 </PublicRoute>
 }
 />
 <Route
 path="/signup"
 element={
 <PublicRoute>
 <SignUpPage />
 </PublicRoute>
 }
 />
 <Route
 path="/forgot-password"
 element={
 <PublicRoute>
 <ForgotPasswordPage />
 </PublicRoute>
 }
 />

 {/* Main Application Routes inside Layout */}
 <Route
 element={
 <ProtectedRoute>
 <Layout />
 </ProtectedRoute>
 }
 >
 <Route index element={<Navigate to="/home" replace />} />
 <Route path="/home" element={<HomePage />} />
 <Route path="/categories" element={<CategoriesPage />} />
 <Route path="/search" element={<SearchPage />} />
 <Route path="/product/:id" element={<ProductDetail />} />
 <Route path="/cart" element={<CartPage />} />
 <Route path="/checkout" element={<CheckoutPage />} />
 <Route path="/checkout/address" element={<CheckoutPage />} />
 <Route path="/checkout/payment" element={<CheckoutPage />} />
 <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
 <Route path="/orders" element={<OrdersPage />} />
 <Route path="/orders/:id" element={<OrderTracking />} />
 <Route path="/wishlist" element={<WishlistPage />} />
 <Route path="/profile" element={<ProfilePage />} />
 <Route path="/account" element={<Navigate to="/profile" replace />} />
 <Route path="/notifications" element={<NotificationsPage />} />
 <Route path="*" element={<Navigate to="/home" replace />} />
 </Route>
 </Routes>
 );
}

export default function App() {
 return (
 <AuthProvider>
 <CartProvider>
 <WishlistProvider>
 <ErrorBoundary>
 <AppRoutes />
 </ErrorBoundary>
 </WishlistProvider>
 </CartProvider>
 </AuthProvider>
 );
}
