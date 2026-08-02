import React, { useState, useMemo } from 'react';
import {
  ClipboardList, Search, Eye, X, ChevronDown, Package,
  Truck, CheckCircle, XCircle, Clock, RefreshCw, Filter,
  MapPin, Phone, User, CreditCard, ShoppingBag, Calendar,
  ArrowUpDown, AlertCircle, ChevronRight
} from 'lucide-react';
import { db } from '../../db/mockFirebase';
import { getProductImage } from '../UserApp';

// ─── Status colour map ────────────────────────────────────────────────────────
const STATUS_META = {
  'Pending':          { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: Clock      },
  'Placed':           { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: Clock      },
  'Confirmed':        { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: CheckCircle },
  'Packed':           { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', icon: Package    },
  'Out for Delivery': { color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', icon: Truck       },
  'Delivered':        { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle },
  'Cancelled':        { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: XCircle    },
};
const STATUS_PIPELINE = ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];

function StatusBadge({ status, size = 'sm' }) {
  const m   = STATUS_META[status] || STATUS_META['Pending'];
  const Icon = m.icon;
  const pad  = size === 'sm' ? '2px 8px' : '4px 12px';
  const fs   = size === 'sm' ? '10px' : '12px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: pad, borderRadius: '20px', fontSize: fs, fontWeight: '700',
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
    }}>
      <Icon size={size === 'sm' ? 10 : 13} strokeWidth={2.5} />
      {status}
    </span>
  );
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
    ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onStatusChange, addToast }) {
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status);

  const handleUpdate = async () => {
    if (selectedStatus === order.status) return;
    setUpdating(true);
    try {
      await db.collection('orders').update(order.id, {
        status: selectedStatus,
        updatedAt: Date.now(),
      });
      onStatusChange(order.id, selectedStatus);
      addToast(`Order ${order.orderNumber || order.id} updated to "${selectedStatus}"`, 'success');
      onClose();
    } catch (e) {
      console.error('[OrderManagement] status update failed:', e);
      addToast('Failed to update order status: ' + e.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const items   = order.items || [];
  const summary = order.summary || {};
  const address = order.address || {};
  const meta    = STATUS_META[order.status] || STATUS_META['Placed'];

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={onClose}
    >
      <div
        style={{ background:'#fff', borderRadius:'24px', width:'100%', maxWidth:'640px', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.22)', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <p style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Order Details</p>
            <h2 style={{ fontSize:'16px', fontWeight:'900', color:'#111', margin:'2px 0 0', letterSpacing:'-0.01em' }}>
              {order.orderNumber || `#${order.id?.slice(-8)?.toUpperCase()}`}
            </h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <StatusBadge status={order.status} size="md" />
            <button onClick={onClose} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#f3f4f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={14} style={{ color:'#6b7280' }} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          {/* Order Info Row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' }}>
            <InfoBox icon={Calendar} label="Order Date" value={formatDate(order.createdAt)} />
            <InfoBox icon={CreditCard} label="Payment Method" value={order.paymentMethod || 'COD'} />
          </div>

          {/* Customer Section */}
          <Section title="Customer" icon={User}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              <InfoBox icon={User}   label="Name"    value={address.name   || order.customerName || '—'} />
              <InfoBox icon={Phone}  label="Phone"   value={address.phone  || order.customerPhone || '—'} />
              <InfoBox icon={MapPin} label="Pincode" value={order.pincode  || '—'} />
              <InfoBox icon={MapPin} label="Address" value={address.addressText || '—'} />
            </div>
          </Section>

          {/* Items Section */}
          <Section title={`Items (${items.length})`} icon={ShoppingBag}>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px', background:'#f9fafb', borderRadius:'12px', border:'1px solid #e5e7eb' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'10px', overflow:'hidden', border:'1px solid #e5e7eb', flexShrink:0, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <img src={item.image || getProductImage(item.name, [])} alt={item.name}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e => { e.target.src = '/logo.png'; }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'12px', fontWeight:'700', color:'#111', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
                    <p style={{ fontSize:'11px', color:'#6b7280', margin:'2px 0 0' }}>Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <span style={{ fontSize:'13px', fontWeight:'800', color:'#059669', flexShrink:0 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Payment Summary */}
          <Section title="Payment" icon={CreditCard}>
            <div style={{ background:'#f9fafb', borderRadius:'12px', padding:'14px 16px', border:'1px solid #e5e7eb' }}>
              <SummaryRow label="Subtotal"        value={`₹${summary.itemTotal     ?? '—'}`} />
              <SummaryRow label="Delivery Fee"    value={summary.deliveryFee === 0 ? 'Free' : `₹${summary.deliveryFee ?? '—'}`} valueColor={summary.deliveryFee === 0 ? '#059669' : undefined} />
              {(summary.savings > 0) && <SummaryRow label="Savings"    value={`-₹${summary.savings}`} valueColor="#059669" />}
              {(summary.couponDiscount > 0) && <SummaryRow label="Coupon Discount" value={`-₹${summary.couponDiscount}`} valueColor="#059669" />}
              <div style={{ height:'1px', background:'#e5e7eb', margin:'8px 0' }} />
              <SummaryRow label="Grand Total" value={`₹${summary.grandTotal ?? '—'}`} bold />
              <SummaryRow label="Payment Status" value="Pending" />
            </div>
          </Section>

          {/* Status Updater */}
          <Section title="Update Status" icon={RefreshCw}>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {[...STATUS_PIPELINE, 'Cancelled'].map(s => {
                  const isSelected = selectedStatus === s;
                  const m = STATUS_META[s] || STATUS_META['Placed'];
                  return (
                    <button key={s} onClick={() => setSelectedStatus(s)}
                      style={{
                        padding:'6px 14px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', cursor:'pointer',
                        border: `1.5px solid ${isSelected ? m.color : '#e5e7eb'}`,
                        background: isSelected ? m.bg : '#fff',
                        color: isSelected ? m.color : '#6b7280',
                        transition:'all 0.15s',
                      }}>
                      {s}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleUpdate}
                disabled={updating || selectedStatus === order.status}
                style={{
                  padding:'11px 20px', borderRadius:'12px', fontSize:'13px', fontWeight:'700',
                  border:'none', cursor: (updating || selectedStatus === order.status) ? 'default' : 'pointer',
                  background: (updating || selectedStatus === order.status) ? '#e5e7eb' : 'linear-gradient(135deg, #0B6F3A, #14a857)',
                  color: (updating || selectedStatus === order.status) ? '#9ca3af' : '#fff',
                  transition:'all 0.15s',
                  boxShadow: (updating || selectedStatus === order.status) ? 'none' : '0 4px 12px rgba(11,111,58,0.3)',
                }}>
                {updating ? 'Saving…' : selectedStatus === order.status ? 'No Change' : `Save → ${selectedStatus}`}
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  return (
    <div style={{ marginBottom:'18px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
        <Icon size={13} style={{ color:'#0B6F3A' }} />
        <p style={{ fontSize:'11px', fontWeight:'800', color:'#374151', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'10px 12px', border:'1px solid #e5e7eb' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'3px' }}>
        <Icon size={11} style={{ color:'#9ca3af' }} />
        <span style={{ fontSize:'9px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
      </div>
      <p style={{ fontSize:'12px', fontWeight:'600', color:'#111', margin:0, wordBreak:'break-word', lineHeight:1.4 }}>{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, bold, valueColor }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'3px 0' }}>
      <span style={{ fontSize:'12px', fontWeight: bold ? '700' : '500', color: bold ? '#111' : '#6b7280' }}>{label}</span>
      <span style={{ fontSize: bold ? '14px' : '12px', fontWeight: bold ? '800' : '600', color: valueColor || (bold ? '#059669' : '#374151') }}>{value}</span>
    </div>
  );
}

// ─── Main OrderManagement Page ────────────────────────────────────────────────
export default function OrderManagement({ orders, addToast }) {
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sortDir,       setSortDir]       = useState('desc'); // newest first

  // Local copy so status changes reflect immediately
  const [localOrders, setLocalOrders] = useState(orders);
  React.useEffect(() => { setLocalOrders(orders); }, [orders]);

  const handleStatusChange = (id, status) => {
    setLocalOrders(prev => prev.map(o => o.id === id ? { ...o, status, updatedAt: Date.now() } : o));
    // Also update the open modal order
    if (selectedOrder?.id === id) {
      setSelectedOrder(prev => ({ ...prev, status, updatedAt: Date.now() }));
    }
  };

  // Filter + sort
  const visible = useMemo(() => {
    let list = [...localOrders];
    if (filterStatus !== 'all') list = list.filter(o => o.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.address?.name  || o.customerName  || '').toLowerCase().includes(q) ||
        (o.address?.phone || o.customerPhone || '').toLowerCase().includes(q) ||
        (o.id || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => sortDir === 'desc'
      ? (b.createdAt || 0) - (a.createdAt || 0)
      : (a.createdAt || 0) - (b.createdAt || 0)
    );
    return list;
  }, [localOrders, filterStatus, search, sortDir]);

  // Stats
  const stats = useMemo(() => ({
    total:       localOrders.length,
    placed:      localOrders.filter(o => o.status === 'Placed').length,
    inProgress:  localOrders.filter(o => ['Confirmed','Packed','Out for Delivery'].includes(o.status)).length,
    delivered:   localOrders.filter(o => o.status === 'Delivered').length,
    cancelled:   localOrders.filter(o => o.status === 'Cancelled').length,
    revenue:     localOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (o.summary?.grandTotal || 0), 0),
  }), [localOrders]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f8f9fa' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink:0, padding:'20px 24px 16px', background:'#fff', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontSize:'20px', fontWeight:'900', color:'#111', margin:0, letterSpacing:'-0.02em' }}>Order Management</h1>
            <p style={{ fontSize:'12px', color:'#9ca3af', margin:'2px 0 0' }}>
              {localOrders.length} total orders · {stats.inProgress} in progress
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'11px', fontWeight:'700', color:'#059669', background:'#ecfdf5', padding:'4px 12px', borderRadius:'20px', border:'1px solid #a7f3d0' }}>
              ₹{stats.revenue.toLocaleString('en-IN')} Revenue
            </span>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

        {/* ── Stats Row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'20px' }}>
          {[
            { label:'Total Orders',  value: stats.total,      color:'#2563EB', bg:'#EFF6FF' },
            { label:'New / Placed',  value: stats.placed,     color:'#7C3AED', bg:'#F5F3FF' },
            { label:'In Progress',   value: stats.inProgress, color:'#B45309', bg:'#FFFBEB' },
            { label:'Delivered',     value: stats.delivered,  color:'#059669', bg:'#ECFDF5' },
          ].map(card => (
            <div key={card.label} style={{ background:'#fff', borderRadius:'16px', padding:'14px 16px', border:'1px solid #e5e7eb', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize:'22px', fontWeight:'900', color:card.color, margin:0, lineHeight:1 }}>{card.value}</p>
              <p style={{ fontSize:'10px', fontWeight:'700', color:'#9ca3af', margin:'4px 0 0', textTransform:'uppercase', letterSpacing:'0.06em' }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* ── Search + Filter ── */}
        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e5e7eb', padding:'14px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
            <Search size={14} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by order #, customer name or phone…"
              style={{ width:'100%', padding:'9px 12px 9px 36px', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'13px', color:'#111', outline:'none', background:'#f9fafb', boxSizing:'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#0B6F3A'; e.target.style.background = '#fff'; }}
              onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
            />
          </div>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            {['all', ...STATUS_PIPELINE, 'Cancelled'].map(s => {
              const isActive = filterStatus === s;
              const m = STATUS_META[s];
              return (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{
                    padding:'6px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', cursor:'pointer',
                    border:`1.5px solid ${isActive ? (m?.color || '#0B6F3A') : '#e5e7eb'}`,
                    background: isActive ? (m?.bg || '#E7F5ED') : '#fff',
                    color: isActive ? (m?.color || '#0B6F3A') : '#6b7280',
                    transition:'all 0.15s',
                  }}>
                  {s === 'all' ? 'All Orders' : s}
                  {s !== 'all' && <span style={{ marginLeft:'4px', opacity:0.7 }}>({localOrders.filter(o => o.status === s).length})</span>}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            style={{ padding:'7px 12px', borderRadius:'10px', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:'700', color:'#6b7280' }}>
            <ArrowUpDown size={13} />
            {sortDir === 'desc' ? 'Newest' : 'Oldest'}
          </button>
        </div>

        {/* ── Orders List ── */}
        {visible.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:'20px', border:'2px dashed #e5e7eb', padding:'60px 24px', textAlign:'center' }}>
            <ClipboardList size={40} style={{ color:'#d1d5db', margin:'0 auto 12px' }} />
            <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#6b7280', margin:'0 0 6px' }}>
              {localOrders.length === 0 ? 'No orders yet' : 'No orders match your filter'}
            </h3>
            <p style={{ fontSize:'12px', color:'#9ca3af', margin:0 }}>
              {localOrders.length === 0
                ? 'Customer orders will appear here once they place an order.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {visible.map(order => {
              const m = STATUS_META[order.status] || STATUS_META['Placed'];
              const items   = order.items   || [];
              const summary = order.summary || {};
              const address = order.address || {};
              const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);

              return (
                <div key={order.id}
                  style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e5e7eb', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', boxShadow:'0 1px 6px rgba(0,0,0,0.04)', cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Status dot */}
                  <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:m.bg, border:`1px solid ${m.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <m.icon size={18} style={{ color:m.color }} strokeWidth={2} />
                  </div>

                  {/* Order info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'13px', fontWeight:'800', color:'#111' }}>
                        {order.orderNumber || `#${(order.id || '').slice(-8).toUpperCase()}`}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p style={{ fontSize:'12px', color:'#6b7280', margin:'3px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {address.name || order.customerName || 'Customer'} · {address.phone || order.customerPhone || ''}
                    </p>
                    <p style={{ fontSize:'11px', color:'#9ca3af', margin:'2px 0 0' }}>
                      {totalQty} item{totalQty !== 1 ? 's' : ''} · {order.paymentMethod || 'COD'} · {formatDateShort(order.createdAt)}
                    </p>
                  </div>

                  {/* Item thumbnails */}
                  <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                    {items.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ width:'34px', height:'34px', borderRadius:'8px', overflow:'hidden', border:'1px solid #e5e7eb', background:'#f9fafb' }}>
                        <img src={item.image || getProductImage(item.name, [])} alt={item.name}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={e => { e.target.src = '/logo.png'; }} />
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'#f3f4f6', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', color:'#6b7280' }}>
                        +{items.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Total + arrow */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontSize:'15px', fontWeight:'800', color:'#059669', margin:0 }}>₹{summary.grandTotal || '—'}</p>
                    <p style={{ fontSize:'10px', color:'#9ca3af', margin:'2px 0 0' }}>{order.pincode || ''}</p>
                  </div>
                  <ChevronRight size={16} style={{ color:'#d1d5db', flexShrink:0 }} />
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          addToast={addToast}
        />
      )}
    </div>
  );
}
