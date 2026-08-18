import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronRight, ShoppingCart, Package } from 'lucide-react';
import { ordersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/asset';

const STATUS_COLORS = {
  PLACED: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  CONFIRMED: { label: 'Confirmed', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  PACKED: { label: 'Packed', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  SHIPPED: { label: 'Shipped', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
  DELIVERED: { label: 'Delivered', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  CANCELLED: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  Pending: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  Confirmed: { label: 'Confirmed', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  Packed: { label: 'Packed', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  'Out for Delivery': { label: 'Out for Delivery', color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
  Delivered: { label: 'Delivered', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  Cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

import { formatINR } from '../utils/currency';

function money(n) {
  return formatINR(n);
}

function fmtDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' • ' + new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    setError('');
    ordersApi.getAll()
      .then(r => setOrders(r.data || []))
      .catch(err => {
        console.error('[OrdersPage] fetch error:', err.message);
        setError(err.message || 'Unable to load orders. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-sm w-full space-y-4">
        <ClipboardList size={40} className="text-red-300 mx-auto" />
        <h2 className="text-sm font-semibold text-gray-800">Could not load orders</h2>
        <p className="text-xs text-gray-500">{error}</p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => navigate('/home')}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Go Home
          </button>
          <button
            onClick={load}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition shadow-md shadow-primary/20"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">My Orders</h1>
        {orders.length > 0 && <p className="text-xs text-gray-500 mt-0.5">{orders.length} order(s) placed</p>}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <ClipboardList size={52} className="text-gray-200 mb-4" />
            <h2 className="text-base font-semibold text-gray-700">No orders yet</h2>
            <p className="text-sm text-gray-400 mt-1 mb-6">Your orders will appear here after you shop</p>
            <button onClick={() => navigate('/home')}
              className="btn-press flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-primary shadow-md shadow-primary/20 hover:bg-primary/90 transition">
              <ShoppingCart size={16}/> Start Shopping
            </button>
          </div>
        ) : orders.map(order => {
          const rawStatus = order.orderStatus || order.status || 'PLACED';
          const m = STATUS_COLORS[rawStatus] || STATUS_COLORS.Pending;
          const displayLabel = m.label || rawStatus;
          const items = order.items || [];
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
              {/* Status Header Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <p className="text-xs font-bold text-gray-900 font-mono">
                    {order.orderNumber || '#' + order.id?.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{fmtDate(order.createdAt)}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full border shadow-2xs"
                  style={{ color: m.color, background: m.bg, borderColor: m.border }}>
                  {displayLabel}
                </span>
              </div>

              {/* Items preview */}
              <div className="px-4 py-3 space-y-2.5">
                {items.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                      {item.image ? (
                        <img src={resolveImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain"
                          onError={e => e.target.src = '/logo.png'} />
                      ) : (
                        <Package size={20} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.variantInfo || item.unit || ''} • Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{money((item.unitPrice || item.price || 0) * item.quantity)}</span>
                  </div>
                ))}
                {items.length > 2 && (
                  <p className="text-xs text-gray-500 text-center font-medium pt-1">
                    +{items.length - 2} more item(s)
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gray-50/40 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Payment: {order.paymentMethod || 'COD'}</p>
                  <p className="text-sm font-bold text-primary">{money(order.totalAmount)}</p>
                </div>
                <button onClick={() => navigate(`/orders/${order.id}`)}
                  className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary shadow-sm hover:bg-primary/90 transition">
                  Track Order <ChevronRight size={14}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
