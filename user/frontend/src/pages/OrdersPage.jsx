import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronRight, ShoppingCart } from 'lucide-react';
import { ordersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  Pending:           { color:'#D97706', bg:'#FFFBEB', border:'#FDE68A' },
  Confirmed:         { color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE' },
  Packed:            { color:'#B45309', bg:'#FFFBEB', border:'#FDE68A' },
  'Out for Delivery':{ color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC' },
  Delivered:         { color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
  Cancelled:         { color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' },
};

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) +
    ' · ' + new Date(ts).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    ordersApi.getAll()
      .then(r => setOrders(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-lg font-black text-gray-900">My Orders</h1>
        {orders.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{orders.length} orders · newest first</p>}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-20 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList size={52} className="text-gray-200 mb-4" />
            <h2 className="text-base font-black text-gray-700">No orders yet</h2>
            <p className="text-sm text-gray-400 mt-1 mb-6">Your orders will appear here after you shop</p>
            <button onClick={() => navigate('/home')}
              className="btn-press flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background:'linear-gradient(135deg,#0B6F3A,#14a857)' }}>
              <ShoppingCart size={15}/> Start Shopping
            </button>
          </div>
        ) : orders.map(order => {
          const m = STATUS_COLORS[order.status] || STATUS_COLORS.Pending;
          const items = order.items || [];
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden"
              style={{ border:`1.5px solid ${m.border}` }}>
              {/* Status strip */}
              <div className="flex items-center justify-between px-4 py-2.5"
                style={{ background:m.bg, borderBottom:`1px solid ${m.border}` }}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider" style={{ color:m.color }}>
                    {order.orderNumber || '#' + order.id?.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{fmtDate(order.createdAt)}</p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                  style={{ color:m.color, background:'#fff', border:`1.5px solid ${m.color}` }}>
                  ● {order.status}
                </span>
              </div>

              {/* Items preview */}
              <div className="px-4 py-3 space-y-2">
                {items.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"
                            onError={e => e.target.src = '/logo.png'} />
                        : <span className="text-lg">🛒</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{item.unit && item.unit + ' · '}Qty: {item.quantity} × ₹{item.price}</p>
                    </div>
                    <span className="text-xs font-black text-green-600">₹{((item.price||0)*(item.quantity||0)).toFixed(0)}</span>
                  </div>
                ))}
                {items.length > 2 && (
                  <p className="text-[10px] text-gray-400 text-center font-semibold">
                    +{items.length - 2} more item{items.length - 2 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-bold">{order.paymentMethod || 'COD'}</p>
                  <p className="text-sm font-black text-gray-900">₹{order.totalAmount || 0}</p>
                </div>
                <button onClick={() => navigate(`/orders/${order.id}`)}
                  className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background:`linear-gradient(135deg,${m.color},${m.color}dd)` }}>
                  Track Order <ChevronRight size={13}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
