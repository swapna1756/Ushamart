import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ordersApi } from '../services/api';

const PIPELINE = [
  { status:'Confirmed',        icon:Clock,        label:'Order Confirmed',     desc:'Your order has been received' },
  { status:'Packed',           icon:Package,      label:'Packed',              desc:'Items packed and ready to ship' },
  { status:'Out for Delivery', icon:Truck,        label:'Out for Delivery',    desc:'On the way to you' },
  { status:'Delivered',        icon:CheckCircle,  label:'Delivered',           desc:'Order delivered successfully' },
];

const STATUS_IDX = { Confirmed:0, Packed:1, 'Out for Delivery':2, Delivered:3 };

export default function OrderTracking() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getById(id)
      .then(r => setOrder(r.data))
      .catch(() => navigate('/orders', { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
    </div>
  );
  if (!order) return null;

  const currentStep = STATUS_IDX[order.status] ?? (order.status === 'Pending' ? -1 : 3);
  const isCancelled = order.status === 'Cancelled';

  function fmtDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="btn-press w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-sm font-black text-gray-900">Order Tracking</h1>
          <p className="text-[10px] text-gray-400">{order.orderNumber || '#' + order.id?.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-20 space-y-5">
        {/* Status card */}
        <div className={`rounded-2xl p-5 shadow-sm border ${isCancelled ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Status</p>
              <p className={`text-lg font-black mt-0.5 ${isCancelled ? 'text-red-600' : 'text-gray-900'}`}>{order.status}</p>
            </div>
            {isCancelled
              ? <XCircle size={32} className="text-red-400" />
              : order.status === 'Delivered'
              ? <CheckCircle size={32} className="text-green-500" />
              : <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
            }
          </div>

          {/* Timeline */}
          {!isCancelled && (
            <div className="relative py-2">
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />
              <div className="absolute left-4 top-4 w-0.5 bg-primary transition-all duration-700"
                style={{ height: currentStep >= 0 ? `${Math.min(100, ((currentStep) / 3) * 100)}%` : '0%' }} />
              <div className="space-y-5 relative">
                {PIPELINE.map((step, idx) => {
                  const done    = currentStep > idx;
                  const current = currentStep === idx;
                  const Icon    = step.icon;
                  return (
                    <div key={step.status} className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs z-10 transition-all flex-shrink-0 ${
                        done    ? 'bg-primary border-primary text-white' :
                        current ? 'bg-white border-primary text-primary shadow scale-110' :
                        'bg-white border-gray-200 text-gray-400'}`}>
                        {done ? <Check size={14} strokeWidth={3}/> : <Icon size={13}/>}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-xs font-black ${current ? 'text-primary' : done ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{step.desc}</p>
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
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Order Details</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[['Order Date', fmtDate(order.createdAt)], ['Payment', order.paymentMethod||'COD'],
              ['Delivery Slot', order.deliverySlot||'—'], ['Pincode', order.pincode||'—']].map(([l,v])=>(
              <div key={l} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">{l}</p>
                <p className="font-semibold text-gray-800">{v}</p>
              </div>
            ))}
          </div>
          {order.addressText && (
            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-xs">
              <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Delivery Address</p>
              <p className="text-gray-700">{order.addressText}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-3">
            Items ({(order.items||[]).length})
          </h3>
          <div className="space-y-2.5">
            {(order.items||[]).map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={e=>e.target.src='/logo.png'}/> : <span>🛒</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400">{item.unit&&item.unit+' · '}Qty: {item.quantity} × ₹{item.price}</p>
                </div>
                <span className="text-xs font-black text-green-600 flex-shrink-0">₹{((item.price||0)*(item.quantity||0)).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-3">Payment Summary</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{order.subtotal||0}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery</span>
              {(order.deliveryCharges||0)===0 ? <span className="font-bold text-green-600">FREE</span> : <span className="font-semibold">₹{order.deliveryCharges}</span>}
            </div>
            {(order.discountAmount||0) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-bold">−₹{order.discountAmount}</span></div>}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-sm"><span>Total</span><span className="text-primary">₹{order.totalAmount||0}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
