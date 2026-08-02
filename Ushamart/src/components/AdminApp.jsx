import React, { useState, useEffect } from 'react';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { db, auth } from '../db/mockFirebase';
import { Sidebar } from './admin/Sidebar';
import { Dashboard } from './admin/Dashboard';
import ProductManagement from './admin/ProductManagement';
import UserManagement from './admin/UserManagement';
import PincodeManagement from './admin/PincodeManagement';
import CategoryManagement from './admin/CategoryManagement';
import OrderManagement from './admin/OrderManagement';
import SpecialOffersManagement from './admin/SpecialOffersManagement';
import { Toast, useToast } from './admin/Toast';
import { PlaceholderPage } from './admin/PlaceholderPage';

// ─── Admin Login Screen ───────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await auth.signInAdmin(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: '#ffffff',
                border: '2.5px solid #0B6F3A',
                padding: '5px',
                boxShadow: '0 4px 16px rgba(11,111,58,0.22)',
                overflow: 'hidden',
              }}
            >
              <img src="/logo.png" alt="UshaMart" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            </div>
            <h1 className="text-xl font-black text-gray-900">UshaMart Admin</h1>
            <p className="text-xs text-gray-400 mt-1">Sign in to manage your store</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@ushamart.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-red-600">
                ⚠️ {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition shadow-md shadow-primary/20 flex items-center justify-center gap-2 text-sm mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-4">UshaMart Admin Console · Protected Access</p>
      </div>
    </div>
  );
}

// ─── Main AdminApp ────────────────────────────────────────────────────────────
export default function AdminApp({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toasts, addToast, removeToast } = useToast();

  const [products, setProducts]             = useState([]);
  const [categories, setCategories]         = useState([]);
  const [orders, setOrders]                 = useState([]);
  const [pincodes, setPincodes]             = useState([]);
  const [pincodeConfigs, setPincodeConfigs] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [usersList, setUsersList]           = useState([]);
  const [specialOffers, setSpecialOffers]   = useState([]);

  // Real-time subscriptions — always live, no draft gate
  useEffect(() => {
    // Clean up any leftover draft flags from old sessions
    localStorage.removeItem('ushamart_unsaved_changes');
    localStorage.removeItem('ushamart_draft_products');

    const subs = [
      db.collection('products').onSnapshot(setProducts),
      db.collection('categories').onSnapshot(setCategories),
      db.collection('orders').onSnapshot(setOrders),
      db.collection('pincodes').onSnapshot(setPincodes),
      db.collection('pincode_configs').onSnapshot(setPincodeConfigs),
      db.collection('support_tickets').onSnapshot(setSupportTickets),
      db.collection('users').onSnapshot(setUsersList),
      db.collection('special_offers').onSnapshot(setSpecialOffers),
    ];
    return () => subs.forEach(u => u());
  }, []);

  if (!user || (user.role !== 'super_admin' && user.role !== 'store_manager')) {
    return <AdminLogin onLogin={setUser} />;
  }

  // ── Helper: normalise & persist product to db ─────────────────────────────
  const persistProduct = async (prod) => {
    // Normalise all required fields so nothing is undefined in the database
    const normalised = {
      id:                  prod.id,
      name:                prod.name                || '',
      brand:               prod.brand               || '',
      description:         prod.description         || '',
      category:            prod.category            || '',
      subcategory:         prod.subcategory         || '',
      sku:                 prod.sku                 || '',
      barcode:             prod.barcode             || '',
      unit:                prod.unit                || '',
      variants:            prod.variants            || '',
      images:              Array.isArray(prod.images) ? prod.images : [],
      mrp:                 Number(prod.mrp)          || 0,
      price:               Number(prod.price)        || 0,
      discountPercent:     Number(prod.discountPercent) || 0,
      stock:               Number(prod.stock)        || 0,
      status:              prod.status              || 'draft',
      availabilityStatus:  prod.availabilityStatus  || prod.status || 'draft',
      pincodesAvailable:   Array.isArray(prod.pincodesAvailable) ? prod.pincodesAvailable : [],
      featured:            Boolean(prod.featured),
      bestSeller:          Boolean(prod.bestSeller),
      newArrival:          Boolean(prod.newArrival),
      trending:            Boolean(prod.trending),
      todayOffer:          Boolean(prod.todayOffer),
      expiryDate:          prod.expiryDate          || '',
      gst:                 prod.gst                 || '5',
      lowStockAlert:       Number(prod.lowStockAlert) || 10,
      deliveryTime:        prod.deliveryTime        || '1-2 Days',
      cod:                 prod.cod !== false,
      department:          prod.department          || '',
      locationId:          prod.locationId          || '',
      specifications:      prod.specifications      || '',
      variantList:         Array.isArray(prod.variantList) ? prod.variantList : [],
      createdAt:           prod.createdAt           || Date.now(),
      updatedAt:           Date.now(),
    };
    try {
      await db.collection('products').set(normalised.id, normalised);
    } catch (e) {
      console.warn('[ProductManagement] Firestore write failed, using local:', e.message);
    }
    return normalised;
  };

  // ── Product CRUD — permanently stored, single source of truth ────────────
  const handleSaveProduct = async (form, editingId) => {
    if (editingId) {
      // EDIT — preserve original createdAt
      const existing = products.find(p => p.id === editingId) || {};
      const updated  = { ...form, id: editingId, createdAt: existing.createdAt || Date.now() };
      // Optimistic UI update
      setProducts(prev => prev.map(p => p.id === editingId ? { ...updated, updatedAt: Date.now() } : p));
      // Persist permanently to database
      const saved = await persistProduct(updated);
      // Sync UI with normalised version
      setProducts(prev => prev.map(p => p.id === editingId ? saved : p));
    } else {
      // CREATE — generate permanent ID
      const id     = 'prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const newProd = { ...form, id, createdAt: Date.now() };
      // Optimistic UI update
      setProducts(prev => [...prev, { ...newProd, updatedAt: Date.now() }]);
      // Persist permanently to database
      const saved = await persistProduct(newProd);
      // Sync UI with normalised saved version
      setProducts(prev => prev.map(p => p.id === id ? saved : p));
    }
  };

  const handleDeleteProduct = async (id) => {
    // Optimistic remove from UI immediately
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await db.collection('products').delete(id);
    } catch (e) {
      console.warn('[ProductManagement] Delete failed:', e.message);
      // Re-fetch to restore correct state if delete failed
      const fresh = await db.collection('products').get();
      setProducts(fresh);
    }
  };

  const handleToggleProductStatus = async (prod) => {
    const next = prod.status === 'published' ? 'inactive' : 'published';
    const updated = { ...prod, status: next, availabilityStatus: next, updatedAt: Date.now() };
    setProducts(prev => prev.map(p => p.id === prod.id ? updated : p));
    await persistProduct(updated);
    addToast(`Product ${next === 'published' ? 'published ✓' : 'unpublished'}`, 'info');
  };

  // ── Update stock directly (from inventory or quick actions) ──────────────
  const handleUpdateStock = async (productId, newStock) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const updated = { ...prod, stock: Number(newStock), updatedAt: Date.now() };
    setProducts(prev => prev.map(p => p.id === productId ? updated : p));
    await persistProduct(updated);
    addToast('Stock updated', 'success');
  };

  // ── User Block / Unblock ─────────────────────────────────────────────────
  const handleToggleUserBlock = async (u) => {
    const nextStatus = u.status === 'blocked' ? 'active' : 'blocked';
    try {
      const userId = u.id || u.uid;
      if (userId) await db.collection('users').update(userId, { status: nextStatus });
      else        await db.collection('users').add({ ...u, status: nextStatus });
    } catch (e) {
      addToast('Failed to update user: ' + e.message, 'error');
    }
  };

  // ── Route renderer ────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard products={products} orders={orders} usersList={usersList} categories={categories} />;
      case 'products':
        return (
          <ProductManagement
            products={products}
            categories={categories}
            pincodes={pincodes}
            onSave={handleSaveProduct}
            onDelete={handleDeleteProduct}
            onToggleStatus={handleToggleProductStatus}
            onUpdateStock={handleUpdateStock}
            onNavigateToCategories={() => setActiveTab('categories')}
            addToast={addToast}
          />
        );
      case 'users':
        return (
          <UserManagement
            usersList={usersList}
            orders={orders}
            onToggleBlock={handleToggleUserBlock}
            addToast={addToast}
          />
        );
      case 'categories':
        return (
          <CategoryManagement
            categories={categories}
            products={products}
            addToast={addToast}
            onNavigateToProducts={() => setActiveTab('products')}
          />
        );
      case 'orders':
        return (
          <OrderManagement
            orders={orders}
            addToast={addToast}
          />
        );
      case 'inventory':  return <PlaceholderPage title="Inventory"            description="Monitor stock levels and set low-stock alerts." />;
      case 'special_offers':
        return (
          <SpecialOffersManagement
            specialOffers={specialOffers}
            categories={categories}
            products={products}
            addToast={addToast}
          />
        );
      case 'pincodes':
        return (
          <PincodeManagement
            pincodes={pincodes}
            pincodeConfigs={pincodeConfigs}
            addToast={addToast}
          />
        );
      case 'discounts':  return <PlaceholderPage title="Discounts & Coupons"  description="Create and manage promotional coupons." />;
      case 'reports':    return <PlaceholderPage title="Reports & Analytics"  description="View sales reports and revenue trends." />;
      case 'settings':   return <PlaceholderPage title="Settings"             description="Configure store settings and preferences." />;
      default:           return <PlaceholderPage title="Coming Soon" />;
    }
  };

  return (
    <div className="flex h-full bg-gray-50 font-sans overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        badges={{
          orders: orders.filter(o => o.status !== 'Delivered').length,
          users: usersList.filter(u => u.status === 'blocked').length,
        }}
        onSignOut={() => { auth.signOut(); setUser(null); }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
