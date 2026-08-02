import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { dashboardApi } from '../services/api';

function KPI({ title, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900 leading-none mt-1">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}

function fmtCurrency(v) {
  return '₹' + Number(v || 0).toLocaleString('en-IN');
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_COLORS = {
  Pending:          'bg-blue-100 text-blue-700',
  Confirmed:        'bg-indigo-100 text-indigo-700',
  Packed:           'bg-yellow-100 text-yellow-800',
  'Out for Delivery':'bg-cyan-100 text-cyan-800',
  Delivered:        'bg-green-100 text-green-700',
  Cancelled:        'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const [data,    setData]    = useState(null);
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
  const byStatus = data?.ordersByStatus || {};

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white flex-shrink-0">
        <h1 className="text-lg font-black text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI title="Total Products"    value={k.totalProducts   || 0} sub={`${k.publishedProducts || 0} published`}      icon={Package}     color="bg-blue-50 text-blue-500" />
          <KPI title="Pending Orders"    value={k.pendingOrders   || 0} sub="Awaiting fulfillment"                         icon={ShoppingCart} color="bg-yellow-50 text-yellow-500" />
          <KPI title="Total Customers"   value={k.totalCustomers  || 0} sub={`${k.newCustomersToday || 0} new today`}      icon={Users}       color="bg-purple-50 text-purple-500" />
          <KPI title="Today's Revenue"   value={fmtCurrency(k.todayRevenue)} sub={`Total: ${fmtCurrency(k.totalRevenue)}`} icon={DollarSign}  color="bg-green-50 text-green-600" />
        </div>

        {/* Alert Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs font-black text-red-700">{inv.outOfStock || 0} Out of Stock</p>
              <p className="text-[10px] text-red-400">Needs immediate restock</p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs font-black text-yellow-700">{inv.lowStock || 0} Low Stock</p>
              <p className="text-[10px] text-yellow-500">Stock below threshold</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs font-black text-green-700">{k.publishedProducts || 0} Active Products</p>
              <p className="text-[10px] text-green-500">Live in user app</p>
            </div>
          </div>
        </div>

        {/* Order Pipeline */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-4">Order Pipeline</h3>
          <div className="flex gap-3 flex-wrap">
            {['Pending','Confirmed','Packed','Out for Delivery','Delivered','Cancelled'].map(s => (
              <div key={s} className="flex-1 min-w-[80px] bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-lg font-black text-gray-800">{byStatus[s] || 0}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Recent Orders</h3>
            <span className="text-[10px] text-gray-400">{k.totalOrders || 0} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Order #','Customer','Items','Amount','Status','Date'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.length === 0
                  ? <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-xs">No orders yet</td></tr>
                  : recent.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-gray-500 text-[10px]">{o.orderNumber || '#' + o.id?.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700">{o.userName || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{(o.items || []).length} items</td>
                      <td className="px-4 py-3 font-bold text-gray-800">{fmtCurrency(o.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-500'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-[10px]">{fmtDate(o.createdAt)}</td>
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
