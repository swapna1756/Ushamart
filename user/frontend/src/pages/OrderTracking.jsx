import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Package, Truck, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { ordersApi } from '../services/api';
import { resolveImageUrl } from '../utils/asset';
import { formatINR } from '../utils/currency';

const PIPELINE = [
  { status: 'CONFIRMED', icon: Clock, label: 'Order Confirmed', desc: 'Store confirmed your order' },
  { status: 'PACKED', icon: Package, label: 'Packed', desc: 'Items packed and ready to ship' },
  { status: 'OUT_FOR_DELIVERY', icon: Truck, label: 'Out for Delivery', desc: 'On the way to you' },
  { status: 'DELIVERED', icon: CheckCircle, label: 'Delivered', desc: 'Order delivered successfully' },
];

const STATUS_IDX = {
  PLACED: 0, Pending: 0, Placed: 0,
  CONFIRMED: 0, Confirmed: 0,
  PACKED: 1, Packed: 1,
  SHIPPED: 2, Shipped: 2,
  OUT_FOR_DELIVERY: 2, 'Out for Delivery': 2,
  DELIVERED: 3, Delivered: 3
};

function money(n) {
  return formatINR(n);
}

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ordersApi.getById(id)
      .then(r => setOrder(r.data))
      .catch((err) => {
        console.error('Order tracking fetch error:', err.message);
        setOrder(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-primary spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center max-w-sm w-full space-y-4">
          <p className="text-sm font-semibold text-gray-700">Order not found</p>
          <button onClick={() => navigate('/orders')} className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const displayStatus = order.orderStatus || order.status || 'PLACED';
  const currentStep = STATUS_IDX[displayStatus] ?? 0;
  const isCancelled = displayStatus === 'CANCELLED' || displayStatus === 'Cancelled';

  function fmtDate(ts) {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // Get static status icon (NOT animated)
  const getStatusIcon = () => {
    if (isCancelled) return <XCircle size={32} className="text-red-500" />;
    if (displayStatus === 'DELIVERED' || displayStatus === 'Delivered') {
      return <CheckCircle size={32} className="text-green-500" />;
    }
    if (displayStatus === 'PACKED' || displayStatus === 'Packed') {
      return <Package size={32} className="text-primary" />;
    }
    if (displayStatus === 'SHIPPED' || displayStatus === 'Shipped' || displayStatus === 'OUT_FOR_DELIVERY' || displayStatus === 'Out for Delivery') {
      return <Truck size={32} className="text-primary" />;
    }
    return <Clock size={32} className="text-primary" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="btn-press w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700" aria-label="Back to orders">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-sm font-bold text-gray-900">Order Tracking & Details</h1>
          <p className="text-xs text-gray-500 font-mono">{order.orderNumber || '#' + order.id?.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Status card */}
        <div className={`rounded-2xl p-5 shadow-sm border ${isCancelled ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400">Current Status</p>
              <p className={`text-base font-bold mt-0.5 ${isCancelled ? 'text-red-600' : 'text-primary'}`}>{displayStatus}</p>
            </div>
            {getStatusIcon()}
          </div>

          {/* Timeline */}
          {!isCancelled && (
            <div className="relative py-2">
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />
              <div className="absolute left-4 top-4 w-0.5 bg-primary transition-all duration-700"
                style={{ height: currentStep >= 0 ? `${Math.min(100, (currentStep / (PIPELINE.length - 1)) * 100)}%` : '0%' }} />
              <div className="space-y-5 relative">
                {PIPELINE.map((step, idx) => {
                  const done = currentStep > idx;
                  const current = currentStep === idx;
                  const Icon = step.icon;
                  return (
                    <div key={step.status} className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-medium text-xs z-10 transition-all flex-shrink-0 ${
                        done ? 'bg-primary border-primary text-white' :
                        current ? 'bg-white border-primary text-primary shadow scale-110' :
                        'bg-white border-gray-200 text-gray-400'}`}>
                        {done ? <Check size={14} strokeWidth={3}/> : <Icon size={13}/>}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-xs font-semibold ${current ? 'text-primary' : done ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Order Details</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Order Date', fmtDate(order.createdAt)],
              ['Payment Method', order.paymentMethod || 'COD'],
              ['Payment Status', order.paymentStatus || 'PENDING'],
              ['Pincode', order.pincode || '-'],
              ['Delivery Slot', order.deliverySlot || 'Anytime']
            ].map(([l, v]) => (
              <div key={l} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{l}</p>
                <p className="font-semibold text-gray-800">{v}</p>
              </div>
            ))}
          </div>
          {order.addressText && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Delivery Address</p>
              <p className="font-semibold text-gray-800">{order.customerName || order.userName} • {order.customerPhone || order.userPhone}</p>
              <p className="text-gray-600 mt-0.5 leading-relaxed">{order.addressText}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
            Items ({(order.items || []).length})
          </h3>
          <div className="space-y-2.5">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                  {item.image ? (
                    <img src={resolveImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain" onError={e => e.target.src = '/logo.png'} />
                  ) : (
                    <Package size={20} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.variantInfo || item.unit || ''} • Qty: {item.quantity} x {money(item.unitPrice || item.price)}</p>
                </div>
                <span className="text-xs font-bold text-primary flex-shrink-0">{money((item.unitPrice || item.price || 0) * (item.quantity || 1))}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Price Breakdown</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-semibold text-gray-800">{money(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Delivery Charge</span>
              {(order.deliveryCharges || 0) === 0 ? <span className="font-bold text-green-600">FREE</span> : <span className="font-semibold text-gray-800">{money(order.deliveryCharges)}</span>}
            </div>
            {(order.discountAmount || 0) > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Discount</span><span>-{money(order.discountAmount)}</span></div>}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-sm text-gray-900"><span>Total</span><span className="text-primary">{money(order.totalAmount)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}