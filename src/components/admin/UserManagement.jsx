import React, { useState, useMemo } from 'react';
import {
  Search, Filter, ArrowUpDown, Eye, ShieldOff, ShieldCheck,
  X, Phone, Mail, MapPin, ShoppingBag, Calendar, Clock,
  ChevronLeft, ChevronRight, User, Package, CheckCircle,
  AlertTriangle, Ban, Users
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:   'bg-green-50 text-green-700 border-green-200',
    blocked:  'bg-red-50 text-red-600 border-red-200',
    inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const icons = {
    active:   <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />,
    blocked:  <Ban size={9} />,
    inactive: <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${map[status] || map.inactive}`}>
      {icons[status]} {status || 'unknown'}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600',
    'bg-orange-100 text-orange-600', 'bg-teal-100 text-teal-600', 'bg-pink-100 text-pink-600'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sz = size === 'lg' ? 'w-12 h-12 text-sm' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center font-black flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────
function UserDetailDrawer({ user, orders, onClose, onToggleBlock, addToast }) {
  const [activeSection, setActiveSection] = useState('overview');
  if (!user) return null;

  const userOrders = orders.filter(o => o.address?.phone === user.phone)
    .sort((a, b) => b.createdAt - a.createdAt);
  const totalSpent = userOrders.reduce((s, o) => s + (o.summary?.grandTotal || 0), 0);

  const STATUS_COLORS = {
    Placed: 'bg-blue-100 text-blue-700', Confirmed: 'bg-indigo-100 text-indigo-700',
    Packed: 'bg-yellow-100 text-yellow-700', Shipped: 'bg-orange-100 text-orange-700',
    Delivered: 'bg-green-100 text-green-700',
  };

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md flex flex-col h-full shadow-2xl animate-slide-in-right overflow-hidden">

        {/* Drawer Header */}
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-black text-gray-900">User Details</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="bg-gradient-to-br from-primary/5 to-green-50 px-5 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-gray-900 truncate">{user.name || 'Unknown'}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {user.id || user.uid || '—'}</p>
              <div className="mt-1.5"><StatusBadge status={user.status} /></div>
            </div>
            <button
              onClick={() => onToggleBlock(user)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                user.status === 'blocked'
                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              }`}
            >
              {user.status === 'blocked' ? <><ShieldCheck size={13} /> Unblock</> : <><ShieldOff size={13} /> Block</>}
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Orders', value: userOrders.length },
              { label: 'Spent', value: `₹${totalSpent.toFixed(0)}` },
              { label: 'Last Login', value: timeAgo(user.lastLogin) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl p-2.5 text-center border border-white/80">
                <p className="text-sm font-black text-gray-900">{value}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section Tabs */}
        <div className="border-b border-gray-100 flex flex-shrink-0">
          {[{ id: 'overview', label: 'Overview' }, { id: 'orders', label: `Orders (${userOrders.length})` }].map(t => (
            <button key={t.id} onClick={() => setActiveSection(t.id)}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${activeSection === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeSection === 'overview' && (
            <div className="space-y-4">
              {[
                { icon: Phone, label: 'Mobile Number', value: user.phone || '—' },
                { icon: Mail, label: 'Email Address', value: user.email || '—' },
                { icon: MapPin, label: 'Delivery Address', value: user.addressText || '—' },
                { icon: MapPin, label: 'Pincode', value: user.pincode || '—' },
                { icon: Calendar, label: 'Registration Date', value: fmtDate(user.registeredAt || user.createdAt) },
                { icon: Clock, label: 'Last Login', value: fmtDateTime(user.lastLogin) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5 break-words">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'orders' && (
            <div className="space-y-3">
              {userOrders.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400">No orders yet</p>
                </div>
              ) : userOrders.map(order => (
                <div key={order.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-mono text-gray-500">#{order.id?.slice(-8).toUpperCase()}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-500'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">{order.items?.length || 0} items</p>
                    <p className="text-sm font-black text-gray-900">₹{order.summary?.grandTotal?.toFixed(0) || 0}</p>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">{fmtDateTime(order.createdAt)}</p>
                  {/* Items preview */}
                  {order.items?.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 mt-2 bg-white rounded-xl p-2 border border-gray-100">
                      <Package size={12} className="text-gray-300 flex-shrink-0" />
                      <p className="text-[10px] text-gray-600 truncate flex-1">{item.name}</p>
                      <p className="text-[10px] font-bold text-gray-700">x{item.quantity}</p>
                    </div>
                  ))}
                  {order.items?.length > 2 && (
                    <p className="text-[9px] text-gray-400 mt-1.5 text-right">+{order.items.length - 2} more items</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main UserManagement Page ─────────────────────────────────────────────────
export default function UserManagement({ usersList, orders, onToggleBlock, addToast }) {
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortKey, setSortKey]           = useState('lastLogin');
  const [sortDir, setSortDir]           = useState('desc');
  const [page, setPage]                 = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmBlock, setConfirmBlock] = useState(null);
  const PER_PAGE = 10;

  // Compute order stats per user phone
  const orderStatsByPhone = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const phone = o.address?.phone;
      if (!phone) return;
      if (!map[phone]) map[phone] = { count: 0, spent: 0 };
      map[phone].count += 1;
      map[phone].spent += o.summary?.grandTotal || 0;
    });
    return map;
  }, [orders]);

  // Enrich users with live order stats
  const enriched = useMemo(() => usersList.map(u => ({
    ...u,
    _orders: orderStatsByPhone[u.phone]?.count ?? u.totalOrders ?? 0,
    _spent:  orderStatsByPhone[u.phone]?.spent  ?? u.totalSpent  ?? 0,
  })), [usersList, orderStatsByPhone]);

  // Filter
  const filtered = useMemo(() => enriched.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name?.toLowerCase().includes(q)
      || u.phone?.includes(q)
      || u.email?.toLowerCase().includes(q)
      || u.pincode?.includes(q)
      || (u.id || u.uid || '').toLowerCase().includes(q);
    const matchS = filterStatus === 'all' || u.status === filterStatus;
    return matchQ && matchS;
  }).sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (sortKey === '_orders') { av = a._orders; bv = b._orders; }
    if (sortKey === '_spent')  { av = a._spent;  bv = b._spent;  }
    if (typeof av === 'string') av = av?.toLowerCase();
    if (typeof bv === 'string') bv = bv?.toLowerCase();
    if (av == null) av = 0; if (bv == null) bv = 0;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  }), [enriched, search, filterStatus, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }) => (
    <ArrowUpDown size={10} className={sortKey === k ? 'text-primary' : 'text-gray-300'} />
  );

  const handleBlockConfirm = () => {
    onToggleBlock(confirmBlock);
    addToast(
      `User ${confirmBlock.status === 'blocked' ? 'unblocked' : 'blocked'} successfully`,
      confirmBlock.status === 'blocked' ? 'success' : 'warning'
    );
    if (selectedUser?.phone === confirmBlock.phone) {
      setSelectedUser(prev => ({ ...prev, status: prev.status === 'blocked' ? 'active' : 'blocked' }));
    }
    setConfirmBlock(null);
  };

  // Summary stats
  const totalActive  = usersList.filter(u => u.status === 'active').length;
  const totalBlocked = usersList.filter(u => u.status === 'blocked').length;
  const newToday     = usersList.filter(u => new Date(u.registeredAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-lg font-black text-gray-900">User Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">{usersList.length} registered users · real-time sync</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-700">Live Sync</span>
          </div>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 flex-shrink-0">
        {[
          { label: 'Total Users',    value: usersList.length, icon: Users,        color: 'bg-blue-50 text-blue-500' },
          { label: 'Active',         value: totalActive,      icon: CheckCircle,  color: 'bg-green-50 text-green-500' },
          { label: 'Blocked',        value: totalBlocked,     icon: Ban,          color: 'bg-red-50 text-red-500' },
          { label: 'New Today',      value: newToday,         icon: User,         color: 'bg-purple-50 text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3.5 bg-white border-b border-gray-100 flex-shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, email, pincode..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none bg-white text-gray-700 font-medium">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase w-8">#</th>
                <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase cursor-pointer hover:text-gray-600" onClick={() => toggleSort('name')}>
                  <span className="flex items-center gap-1">User <SortIcon k="name" /></span>
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase cursor-pointer hover:text-gray-600" onClick={() => toggleSort('phone')}>
                  <span className="flex items-center gap-1">Mobile <SortIcon k="phone" /></span>
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Email</th>
                <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Address / Pincode</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase cursor-pointer hover:text-gray-600" onClick={() => toggleSort('_orders')}>
                  <span className="flex items-center justify-center gap-1">Orders <SortIcon k="_orders" /></span>
                </th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase cursor-pointer hover:text-gray-600" onClick={() => toggleSort('registeredAt')}>
                  <span className="flex items-center justify-center gap-1">Registered <SortIcon k="registeredAt" /></span>
                </th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase cursor-pointer hover:text-gray-600" onClick={() => toggleSort('lastLogin')}>
                  <span className="flex items-center justify-center gap-1">Last Login <SortIcon k="lastLogin" /></span>
                </th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase">Status</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-xs font-semibold">No users found</p>
                </td></tr>
              ) : paginated.map((u, idx) => (
                <tr key={u.id || u.uid} className="hover:bg-gray-50/60 transition group">
                  <td className="px-4 py-3 text-gray-400 text-[10px]">{(page - 1) * PER_PAGE + idx + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} />
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 truncate max-w-[120px]">{u.name || 'Unknown'}</p>
                        <p className="text-[9px] text-gray-400 font-mono mt-0.5 truncate">{u.id || u.uid || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-mono text-gray-700">{u.phone || '—'}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-500 max-w-[140px]">
                    <span className="truncate block">{u.email || <span className="text-gray-300">—</span>}</span>
                  </td>
                  <td className="px-3 py-3 max-w-[160px]">
                    <p className="text-gray-600 truncate text-[10px]">{u.addressText || '—'}</p>
                    {u.pincode && (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">{u.pincode}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-bold text-gray-700">{u._orders}</span>
                    {u._spent > 0 && <p className="text-[9px] text-gray-400">₹{u._spent.toFixed(0)}</p>}
                  </td>
                  <td className="px-3 py-3 text-center text-[10px] text-gray-500">{fmtDate(u.registeredAt || u.createdAt)}</td>
                  <td className="px-3 py-3 text-center">
                    <p className="text-[10px] text-gray-600">{timeAgo(u.lastLogin)}</p>
                    <p className="text-[9px] text-gray-400">{fmtDate(u.lastLogin)}</p>
                  </td>
                  <td className="px-3 py-3 text-center"><StatusBadge status={u.status} /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => setSelectedUser(u)} title="View Details"
                        className="w-7 h-7 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-gray-400 transition">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => setConfirmBlock(u)} title={u.status === 'blocked' ? 'Unblock' : 'Block'}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                          u.status === 'blocked'
                            ? 'hover:bg-green-50 hover:text-green-600 text-gray-400'
                            : 'hover:bg-red-50 hover:text-red-600 text-gray-400'
                        }`}>
                        {u.status === 'blocked' ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>{filtered.length} users · Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 transition">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg border text-xs font-bold transition ${p === page ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 transition">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Drawer */}
      {selectedUser && (
        <UserDetailDrawer
          user={selectedUser}
          orders={orders}
          onClose={() => setSelectedUser(null)}
          onToggleBlock={(u) => setConfirmBlock(u)}
          addToast={addToast}
        />
      )}

      {/* Block / Unblock Confirm */}
      <ConfirmDialog
        isOpen={!!confirmBlock}
        title={confirmBlock?.status === 'blocked' ? 'Unblock User' : 'Block User'}
        message={
          confirmBlock?.status === 'blocked'
            ? `This will restore access for ${confirmBlock?.name || 'this user'}.`
            : `${confirmBlock?.name || 'This user'} will be blocked and unable to log in.`
        }
        onConfirm={handleBlockConfirm}
        onCancel={() => setConfirmBlock(null)}
        confirmLabel={confirmBlock?.status === 'blocked' ? 'Unblock' : 'Block'}
        confirmClass={confirmBlock?.status === 'blocked' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
      />
    </div>
  );
}
