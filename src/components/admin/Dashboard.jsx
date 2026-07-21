import React from 'react';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

function KPICard({ title, value, desc, icon: Icon, color, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start justify-between">
      <div className="space-y-1.5">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-[10px] text-gray-400">{desc}</p>
        {trend && <p className="text-[10px] font-bold text-green-600 flex items-center gap-0.5"><TrendingUp size={10} /> {trend}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}

const STATUS_ORDER = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
const STATUS_COLORS = {
  Placed: 'bg-blue-500', Confirmed: 'bg-indigo-500', Packed: 'bg-yellow-500',
  Shipped: 'bg-orange-500', Delivered: 'bg-green-500'
};

export function Dashboard({ products, orders, usersList, categories }) {
  const pendingOrders = orders.filter(o => o.status !== 'Delivered').length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const todayRevenue = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + (o.summary?.grandTotal || 0), 0);
  const totalRevenue = orders.reduce((s, o) => s + (o.summary?.grandTotal || 0), 0);

  const recentOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-5 border-b border-gray-100 bg-white flex-shrink-0">
        <h2 className="text-lg font-black text-gray-900">Dashboard Overview</h2>
        <p className="text-xs text-gray-400 mt-0.5">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard title="Total Products" value={products.length} desc={`${products.filter(p=>p.status==='published').length} published`} icon={Package} color="bg-blue-50 text-blue-500" />
          <KPICard title="Pending Orders" value={pendingOrders} desc="Awaiting fulfillment" icon={ShoppingCart} color="bg-yellow-50 text-yellow-500" />
          <KPICard title="Total Customers" value={usersList.length} desc="Registered users" icon={Users} color="bg-purple-50 text-purple-500" />
          <KPICard title="Today's Revenue" value={`₹${todayRevenue.toFixed(0)}`} desc={`Total: ₹${totalRevenue.toFixed(0)}`} icon={DollarSign} color="bg-green-50 text-green-600" trend="+12% vs yesterday" />
        </div>

        {/* Alerts row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0"><AlertTriangle size={18} className="text-red-500" /></div>
            <div><p className="text-xs font-black text-red-700">{outOfStock} Out of Stock</p><p className="text-[10px] text-red-400">Needs immediate restock</p></div>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0"><AlertTriangle size={18} className="text-yellow-500" /></div>
            <div><p className="text-xs font-black text-yellow-700">{lowStock} Low Stock</p><p className="text-[10px] text-yellow-500">Stock below 10 units</p></div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0"><CheckCircle size={18} className="text-green-500" /></div>
            <div><p className="text-xs font-black text-green-700">{products.filter(p=>p.status==='published').length} Active Products</p><p className="text-[10px] text-green-500">Live in customer app</p></div>
          </div>
        </div>

        {/* Order pipeline */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-4">Order Pipeline</h3>
          <div className="flex gap-3">
            {STATUS_ORDER.map(status => {
              const count = orders.filter(o => o.status === status).length;
              return (
                <div key={status} className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${STATUS_COLORS[status]}`} />
                  <p className="text-lg font-black text-gray-800">{count}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{status}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Recent Orders</h3>
            <span className="text-[10px] text-gray-400">{orders.length} total</span>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {['Order ID','Customer','Items','Amount','Status','Date'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.length === 0
                ? <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-xs">No orders yet</td></tr>
                : recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-gray-500 text-[10px]">#{o.id?.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{o.address?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{o.items?.length || 0} items</td>
                    <td className="px-4 py-3 font-bold text-gray-800">₹{o.summary?.grandTotal?.toFixed(0) || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${STATUS_COLORS[o.status]} text-white`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-[10px]">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
