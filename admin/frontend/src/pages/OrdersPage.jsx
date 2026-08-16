import React, { useState, useEffect } from 'react';
import { Search, X, Package, MapPin, Phone, User, CreditCard } from 'lucide-react';
import { ordersApi } from '../services/api';
import { useToast } from '../components/Toast';
import { formatINR } from '../utils/currency';

const STATUS_META = {
 PLACED: { color:'#D97706', bg:'#FFFBEB', border:'#FDE68A' },
 CONFIRMED: { color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE' },
 PACKED: { color:'#B45309', bg:'#FFFBEB', border:'#FDE68A' },
 SHIPPED: { color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE' },
 OUT_FOR_DELIVERY:{ color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC' },
 DELIVERED: { color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
 CANCELLED: { color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' },
 Pending: { color:'#D97706', bg:'#FFFBEB', border:'#FDE68A' },
 Confirmed: { color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE' },
 Packed: { color:'#B45309', bg:'#FFFBEB', border:'#FDE68A' },
 'Out for Delivery':{ color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC' },
 Delivered: { color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
 Cancelled: { color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' },
};

const STATUS_LABELS = {
 PLACED: 'Pending',
 CONFIRMED: 'Confirmed',
 PACKED: 'Packed',
 SHIPPED: 'Shipped',
 OUT_FOR_DELIVERY: 'Out for delivery',
 DELIVERED: 'Delivered',
 CANCELLED: 'Cancelled',
 all: 'All orders',
};

function statusLabel(status) {
 return STATUS_LABELS[status] || status;
}

function fmtDate(ts) {
 if (!ts) return '—';
 return new Date(ts).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

function OrderModal({ order, onClose, onStatusChange }) {
 const { addToast } = useToast();
 const displayStatus = order.orderStatus || order.status || 'PLACED';
 const [sel, setSel] = useState(displayStatus);
 const [saving, setSaving] = useState(false);
 const m = STATUS_META[displayStatus] || STATUS_META.Pending;

 const save = async () => {
 if (sel === displayStatus) return;
 setSaving(true);
 try {
 await ordersApi.updateStatus(order.id, sel);
 onStatusChange(order.id, sel);
 addToast(`Order updated to "${sel}"`, 'success');
 onClose();
 } catch (e) { addToast(e.message, 'error'); }
 finally { setSaving(false); }
 };

 return (
 <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" style={{background:'rgba(15,23,42,0.55)',backdropFilter:'blur(5px)'}} onClick={onClose}>
 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-pop" onClick={e=>e.stopPropagation()}>
 <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
 <div>
 <p className="text-xs text-label font-medium">Order details</p>
 <h2 className="text-sm font-semibold text-gray-900">{order.orderNumber||'#'+order.id?.slice(-8).toUpperCase()}</h2>
 </div>
 <div className="flex items-center gap-2 min-w-0">
 <span className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap" style={{color:m.color,background:m.bg,border:`1px solid ${m.border}`}}>{statusLabel(displayStatus)}</span>
 <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X size={14}/></button>
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
 {/* Customer */}
 <div className="grid grid-cols-2 gap-3">
 {[{icon:User,label:'Customer',val:order.userName||'—'},{icon:Phone,label:'Phone',val:order.userPhone||'—'},
 {icon:MapPin,label:'Pincode',val:order.pincode||'—'},{icon:CreditCard,label:'Payment',val:order.paymentMethod||'COD'}].map(({icon:Icon,label,val})=>(
 <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
 <div className="flex items-center gap-1.5 mb-1"><Icon size={12} className="text-gray-500"/><span className="text-xs text-label">{label}</span></div>
 <p className="text-xs font-medium text-gray-900 break-words">{val}</p>
 </div>
 ))}
 </div>
 {/* Address */}
 {order.addressText && <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
 <p className="text-xs text-label font-medium mb-1">Delivery address</p>
 <p className="text-xs text-gray-800">{order.addressText}</p>
 </div>}
 {/* Items */}
 <div>
 <p className="text-xs font-medium text-gray-600 mb-2">Items ({(order.items||[]).length})</p>
 <div className="space-y-2">
 {(order.items||[]).map((item,i)=>(
 <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
 <div className="flex-1 min-w-0">
 <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
 <p className="text-xs text-muted">{item.unit&&item.unit+' · '}Qty: {item.quantity} × {formatINR(item.price)}</p>
 </div>
 <span className="text-xs font-semibold text-green-600">{formatINR((item.price||0)*(item.quantity||0))}</span>
 </div>
 ))}
 </div>
 </div>
 {/* Summary */}
 <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
 {[['Subtotal',formatINR(order.subtotal||0)],['Delivery',order.deliveryCharges===0?'Free':formatINR(order.deliveryCharges)],['Discount',order.discountAmount>0?`-${formatINR(order.discountAmount)}`:null],['Total',formatINR(order.totalAmount||0)]].filter(([,v])=>v!==null).map(([l,v])=>(
 <div key={l} className={`flex justify-between text-xs ${l==='Total'?'font-semibold pt-1 border-t border-gray-200 text-gray-900':'font-medium text-label'}`}>
 <span>{l}</span><span className={l==='Total'?'text-primary':''}>{v}</span>
 </div>
 ))}
 </div>
 {/* Status Update */}
 <div>
 <p className="text-xs font-medium text-gray-600 mb-2">Update Status</p>
 <div className="flex flex-wrap gap-2 mb-3 max-w-full">
 {['PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].map(s=>{
 const sm=STATUS_META[s]||STATUS_META.Pending;
 return <button key={s} onClick={()=>setSel(s)} type="button" aria-pressed={sel===s}
 className="px-2.5 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap"
 style={{border:`1.5px solid ${sel===s?sm.color:'#e5e7eb'}`,background:sel===s?sm.bg:'#fff',color:sel===s?sm.color:'#475569'}}>{statusLabel(s)}</button>;
 })}
 </div>
 <button onClick={save} disabled={saving||sel===displayStatus}
 className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition disabled:opacity-40">
 {saving?'Saving...':sel===displayStatus?'No change':`Save → ${statusLabel(sel)}`}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

export default function OrdersPage() {
 const { addToast } = useToast();
 const [orders, setOrders] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [filter, setFilter] = useState('all');
 const [selected,setSelected]= useState(null);

 const load = () => ordersApi.getAll({status:'all'}).then(r=>setOrders(r.data||[])).catch(e=>addToast(e.message,'error')).finally(()=>setLoading(false));
 useEffect(()=>{load();},[]);

 const visible = orders.filter(o => {
 const q=search.toLowerCase();
 const mq=!q||(o.orderNumber||'').toLowerCase().includes(q)||(o.userName||'').toLowerCase().includes(q)||(o.userPhone||'').includes(q);
 const mf=filter==='all'||(o.orderStatus || o.status)===filter;
 return mq&&mf;
 });

 const handleStatusChange = (id, status) => setOrders(prev=>prev.map(o=>o.id===id?{...o,status,orderStatus:status}:o));

 if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

 return (
 <div className="flex flex-col h-full">
 <div className="flex items-center justify-between px-4 sm:px-4 sm:px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
 <div><h1 className="text-page-title text-gray-900">Orders</h1>
 <p className="text-xs text-muted mt-0.5">{orders.length} total · {orders.filter(o=>(o.orderStatus||o.status)!=='DELIVERED'&&(o.orderStatus||o.status)!=='CANCELLED').length} active</p></div>
 </div>
 <div className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white border-b border-gray-100 flex-wrap flex-shrink-0">
 <div className="relative flex-1 min-w-[180px]">
 <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by order #, name, phone…" className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"/>
 </div>
 <div className="flex gap-1.5 flex-wrap">
 {['all','PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].map(s=>{
 const m=STATUS_META[s]||{};
 return <button key={s} onClick={()=>setFilter(s)} type="button"
 className="px-2.5 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap"
 style={{border:`1.5px solid ${filter===s?(m.color||'#0B6F3A'):'#e5e7eb'}`,background:filter===s?(m.bg||'#E7F5ED'):'#fff',color:filter===s?(m.color||'#0B6F3A'):'#475569'}}>
 {statusLabel(s)} ({s==='all'?orders.length:orders.filter(o=>(o.orderStatus||o.status)===s).length})
 </button>;
 })}
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-4 sm:p-6">
 {visible.length===0 ? <div className="text-center py-16 text-muted text-sm font-medium">No orders found</div> : (
 <div className="space-y-3">
 {visible.map(order=>{
 const displayStatus = order.orderStatus || order.status || 'PLACED';
 const m=STATUS_META[displayStatus]||STATUS_META.Pending;
 return (
 <div key={order.id} onClick={()=>setSelected(order)} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-px transition-all">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:m.bg,border:`1px solid ${m.border}`}}>
 <Package size={18} style={{color:m.color}}/>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-gray-900">{order.orderNumber||'#'+order.id?.slice(-8).toUpperCase()}</span>
 <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{color:m.color,background:m.bg,border:`1px solid ${m.border}`}}>{statusLabel(displayStatus)}</span>
 </div>
 <p className="text-xs text-muted mt-0.5">{order.userName||'—'} · {order.userPhone||'—'}</p>
 <p className="text-xs text-muted">{(order.items||[]).length} items · {order.paymentMethod||'COD'} · {fmtDate(order.createdAt)}</p>
 </div>
 <div className="text-right flex-shrink-0">
 <p className="text-sm font-semibold text-green-700">{formatINR(order.totalAmount||0)}</p>
 <p className="text-xs text-muted mt-0.5">{order.pincode||'—'}</p>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 {selected&&<OrderModal order={selected} onClose={()=>setSelected(null)} onStatusChange={handleStatusChange}/>}
 </div>
 );
}
