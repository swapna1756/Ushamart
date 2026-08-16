import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { dashboardApi } from '../services/api';
import { formatINR } from '../utils/currency';

function KPI({ title, value, sub, icon: Icon, color }) {
 return (
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between">
 <div>
 <p className="text-xs text-gray-500 mb-1">{title}</p>
 <p className="text-2xl font-semibold text-gray-900 leading-none">{value}</p>
 {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
 </div>
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
 <Icon size={18} />
 </div>
 </div>
 );
}

function fmtCurrency(v) {
  return formatINR(v);
}

function fmtDate(ts) {
 if (!ts) return '...';
 return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_COLORS = {
 Pending: 'bg-blue-50 text-blue-700',
 Confirmed: 'bg-indigo-50 text-indigo-700',
 Packed: 'bg-yellow-50 text-yellow-700',
 'Out for Delivery':'bg-cyan-50 text-cyan-700',
 Delivered: 'bg-green-50 text-green-700',
 Cancelled: 'bg-red-50 text-red-700',
};

export default function DashboardPage() {
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 dashboardApi.get()
 .then(res => setData(res.data))
 .catch(console.error)
 .finally(() => setLoading(false));
 }, []);

 if (loading) {
 return (
 <div className="flex-1 flex items-center justify-center">
 <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
 </div>
 );
 }

 const k = data?.kpis || {};
 const inv = data?.inventory || {};
 const recent = data?.recentOrders || [];
 const byStatus= data?.ordersByStatus || {};

 return (
 <div className="flex flex-col h-full overflow-y-auto">
 {/* Header */}
 <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
 <h1 className="text-page-title text-gray-900">Dashboard</h1>
 <p className="text-xs text-muted mt-0.5">Welcome back. Here's what's happening today.</p>
 </div>

 <div className="p-6 space-y-6">
 {/* KPI Grid */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <KPI title="Total Products" value={k.totalProducts || 0} sub={`${k.publishedProducts || 0} published`} icon={Package} color="bg-blue-50 text-blue-500" />
 <KPI title="Pending Orders" value={k.pendingOrders || 0} sub="Awaiting fulfillment" icon={ShoppingCart} color="bg-yellow-50 text-yellow-500" />
 <KPI title="Total Customers" value={k.totalCustomers || 0} sub={`${k.newCustomersToday || 0} new today`} icon={Users} color="bg-purple-50 text-purple-500" />
 <KPI title="Today's Revenue" value={fmtCurrency(k.todayRevenue)} sub={`Total: ${fmtCurrency(k.totalRevenue)}`} icon={DollarSign} color="bg-green-50 text-green-600" />
 </div>

 {/* Alert row */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
 <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <AlertTriangle size={16} className="text-red-500" />
 </div>
 <div>
 <p className="text-sm font-medium text-red-700">{inv.outOfStock || 0} Out of Stock</p>
 <p className="text-xs text-red-400">Needs restock</p>
 </div>
 </div>
 <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-center gap-3">
 <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <AlertTriangle size={16} className="text-yellow-500" />
 </div>
 <div>
 <p className="text-sm font-medium text-yellow-700">{inv.lowStock || 0} Low Stock</p>
 <p className="text-xs text-yellow-500">Below threshold</p>
 </div>
 </div>
 <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
 <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <CheckCircle size={16} className="text-green-500" />
 </div>
 <div>
 <p className="text-sm font-medium text-green-700">{k.publishedProducts || 0} Active Products</p>
 <p className="text-xs text-green-500">Live in user app</p>
 </div>
 </div>
 </div>

 {/* Order pipeline */}
 <div className="bg-white rounded-xl border border-gray-200 p-5">
 <h2 className="text-sm font-medium text-gray-700 mb-4">Order Pipeline</h2>
 <div className="flex gap-3 flex-wrap">
 {['Pending','Confirmed','Packed','Out for Delivery','Delivered','Cancelled'].map(s => (
 <div key={s} className="flex-1 min-w-[80px] bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
 <p className="text-xl font-semibold text-gray-900">{byStatus[s] || 0}</p>
 <p className="text-xs text-muted mt-0.5">{s}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Recent orders */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
 <h2 className="text-sm font-medium text-gray-700">Recent Orders</h2>
 <span className="text-xs text-muted">{k.totalOrders || 0} total</span>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm min-w-[600px]">
 <thead>
 <tr className="bg-gray-50 border-b border-gray-100">
 {['Order #','Customer','Items','Amount','Status','Date'].map(h => (
 <th key={h} className="px-4 py-2.5 text-left text-xs text-gray-500 font-medium">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {recent.length === 0
 ? <tr><td colSpan={6} className="text-center py-8 text-muted text-sm">No orders yet</td></tr>
 : recent.map(o => (
 <tr key={o.id} className="hover:bg-gray-50/50">
 <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.orderNumber || '#' + o.id?.slice(-6).toUpperCase()}</td>
 <td className="px-4 py-3 font-medium text-gray-800 text-sm">{o.userName || '...'}</td>
 <td className="px-4 py-3 text-gray-500 text-sm">{(o.items || []).length} items</td>
 <td className="px-4 py-3 font-medium text-gray-800 text-sm">{fmtCurrency(o.totalAmount)}</td>
 <td className="px-4 py-3">
 <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-500'}`}>
 {o.status}
 </span>
 </td>
 <td className="px-4 py-3 text-muted text-xs">{fmtDate(o.createdAt)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 );
}
