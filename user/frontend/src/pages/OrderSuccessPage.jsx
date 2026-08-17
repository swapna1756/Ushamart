import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Package, ShoppingBag, ArrowRight } from 'lucide-react';
import { ordersApi } from '../services/api';
import { formatINR } from '../utils/currency';
import { resolveImageUrl } from '../utils/asset';

function money(n) {
  return formatINR(n);
}

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(state?.order || null);

  useEffect(() => {
    if (!order) {
      ordersApi.getById(orderId)
        .then(r => setOrder(r.data))
        .catch(() => navigate('/orders', { replace: true }));
    }
  }, [orderId]);

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm font-medium text-gray-500">Loading order details...</div>;
  }

  const items = order.items || [];
  const currentStatus = order.orderStatus || order.status || 'Pending';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 pb-24">
      <div className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="text-center border-b border-gray-100 pb-6 space-y-2">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={40} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Order Placed Successfully!</h1>
          <p className="text-xs text-gray-500">Your order has been placed successfully.</p>
          <p className="text-xs text-gray-500">
            Order ID: <span className="font-bold text-gray-900 font-mono">{order.orderNumber || order.id}</span>
          </p>
          <div className="inline-block mt-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Status: {currentStatus}
            </span>
          </div>
        </div>

        {/* Product Items Summary */}
        <div className="space-y-3 border-b border-gray-100 pb-5">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Product Summary ({items.length})</p>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-center bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-xs">
              <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0 p-1 flex items-center justify-center">
                {item.image ? (
                  <img src={resolveImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain" onError={e => { e.currentTarget.src = '/logo.png'; }} />
                ) : (
                  <Package className="text-gray-300" size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{item.name}</p>
                <p className="text-gray-500 mt-0.5">{item.variantInfo || item.unit || 'Standard'} • Qty {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{money((item.unitPrice || item.price || 0) * (item.quantity || 1))}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Details Grid */}
        <div className="grid sm:grid-cols-2 gap-4 border-b border-gray-100 pb-5 text-xs">
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            <p className="font-bold text-gray-500 mb-1">Delivery Address</p>
            <p className="font-bold text-gray-900">{order.customerName || order.userName}</p>
            <p className="text-gray-600 mt-0.5 leading-relaxed">{order.addressText}</p>
            <p className="text-gray-500 mt-1">📞 {order.customerPhone || order.userPhone}</p>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-2.5">
            <div>
              <p className="font-bold text-gray-500">Payment</p>
              <p className="font-bold text-gray-950">Cash on Delivery</p>
            </div>
            <div>
              <p className="font-bold text-gray-500">Delivery</p>
              <p className="font-bold text-gray-950">{order.deliverySlot || 'Anytime'}</p>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="font-bold text-primary text-sm">{money(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate(`/orders/${order.id}`)}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition flex items-center justify-center gap-1.5 uppercase"
          >
            TRACK ORDER <ArrowRight size={15} />
          </button>

          <button
            onClick={() => navigate('/home')}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition flex items-center justify-center gap-1.5 uppercase"
          >
            <ShoppingBag size={15} /> CONTINUE SHOPPING
          </button>
        </div>
      </div>
    </div>
  );
}
