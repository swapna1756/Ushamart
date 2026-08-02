import React, { useState, useEffect } from 'react';
import { Search, ShieldOff, ShieldCheck, Eye, X, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { usersApi, ordersApi } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

function UserDrawer({ user, orders, onClose, onToggleBlock }) {
  if (!user) return null;
  const userOrders = orders.filter(o => o.userPhone === user.phone || o.userId === user.id)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const [tab, setTab] = useState('overview');
  const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white w-full max-w-sm flex flex-col h-full shadow-2xl animate-slideIn">
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-black text-gray-900">User Details</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={15}/></button>
        </div>
        {/* Profile card */}
        <div className="bg-gradient-to-br from-primary/5 to-green-50 px-5 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg flex-shrink-0">
              {(user.name||'?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-900 truncate">{user.name||'Unknown'}</p>
              <p className="text-[10px] text-gray-400 font-mono">{user.id||user.uid||'—'}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black ${user.status==='blocked'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>
                {user.status||'active'}
              </span>
            </div>
            <button onClick={()=>onToggleBlock(user)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition flex-shrink-0 ${user.status==='blocked'?'bg-green-50 text-green-700 border-green-200 hover:bg-green-100':'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
              {user.status==='blocked'?<><ShieldCheck size={12}/>Unblock</>:<><ShieldOff size={12}/>Block</>}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[['Orders',userOrders.length],['Spent',`₹${(user.totalSpent||0).toFixed(0)}`],['Pincode',user.pincode||'—']].map(([l,v])=>(
              <div key={l} className="bg-white rounded-xl p-2.5 text-center border border-white/80">
                <p className="text-sm font-black text-gray-900">{v}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-b border-gray-100 flex flex-shrink-0">
          {[{id:'overview',label:'Overview'},{id:'orders',label:`Orders (${userOrders.length})`}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${tab===t.id?'border-primary text-primary':'border-transparent text-gray-400 hover:text-gray-600'}`}>{t.label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {tab==='overview' ? (
            [{icon:Phone,label:'Phone',val:user.phone||'—'},{icon:Mail,label:'Email',val:user.email||'—'},{icon:MapPin,label:'Address',val:user.addressText||'—'},{icon:Calendar,label:'Registered',val:fmtDate(user.registeredAt||user.createdAt)}].map(({icon:Icon,label,val})=>(
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Icon size={13} className="text-gray-400"/></div>
                <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{label}</p><p className="text-xs font-semibold text-gray-800 mt-0.5 break-words">{val}</p></div>
              </div>
            ))
          ) : (
            userOrders.length===0 ? <p className="text-xs text-gray-400 text-center py-10">No orders yet</p> :
            userOrders.map(o=>(
              <div key={o.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-mono text-gray-500">#{o.orderNumber||o.id?.slice(-8).toUpperCase()}</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{o.status}</span>
                </div>
                <div className="flex justify-between"><p className="text-xs text-gray-600">{(o.items||[]).length} items</p><p className="text-sm font-black text-gray-900">₹{o.totalAmount||0}</p></div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { addToast } = useToast();
  const [users,   setUsers]   = useState([]);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [selected,setSelected]= useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(()=>{
    Promise.all([usersApi.getAll(), ordersApi.getAll()])
      .then(([u,o])=>{ setUsers(u.data||[]); setOrders(o.data||[]); })
      .catch(e=>addToast(e.message,'error'))
      .finally(()=>setLoading(false));
  },[]);

  const visible = users.filter(u=>{
    const q=search.toLowerCase();
    const mq=!q||(u.name||'').toLowerCase().includes(q)||(u.phone||'').includes(q)||(u.email||'').toLowerCase().includes(q);
    return mq && (filter==='all'||u.status===filter);
  });

  const handleToggleBlock = user => { setConfirm(user); if(selected?.id===user.id) setSelected(null); };
  const doBlock = async () => {
    try {
      await usersApi.toggleBlock(confirm.id);
      const next = confirm.status==='blocked'?'active':'blocked';
      setUsers(prev=>prev.map(u=>u.id===confirm.id?{...u,status:next}:u));
      addToast(`User ${next}`,'success');
    } catch(e){ addToast(e.message,'error'); }
    finally { setConfirm(null); }
  };

  const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—';

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
        <div><h1 className="text-lg font-black text-gray-900">Users</h1>
          <p className="text-xs text-gray-400 mt-0.5">{users.length} registered · {users.filter(u=>u.status==='blocked').length} blocked</p></div>
      </div>
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100 flex-wrap flex-shrink-0">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, phone, email…" className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"/>
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)} className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-medium text-gray-700">
          <option value="all">All Users</option><option value="active">Active</option><option value="blocked">Blocked</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{visible.length} results</span>
      </div>
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-xs min-w-[700px]">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {['#','User','Phone','Email','Pincode','Registered','Status','Actions'].map(h=>(
                <th key={h} className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {visible.length===0 ? <tr><td colSpan={8} className="text-center py-12 text-xs text-gray-400 font-semibold">No users found</td></tr> :
              visible.map((u,i)=>(
                <tr key={u.id||u.uid} className="hover:bg-gray-50/60 transition group">
                  <td className="px-3 py-3 text-gray-400 text-[10px]">{i+1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] flex-shrink-0">{(u.name||'?')[0].toUpperCase()}</div>
                      <p className="font-bold text-gray-800 truncate max-w-[100px]">{u.name||'Unknown'}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-gray-700">{u.phone||'—'}</td>
                  <td className="px-3 py-3 text-gray-500 max-w-[140px]"><span className="truncate block">{u.email||'—'}</span></td>
                  <td className="px-3 py-3"><span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{u.pincode||'—'}</span></td>
                  <td className="px-3 py-3 text-gray-400 text-[10px]">{fmtDate(u.registeredAt||u.createdAt)}</td>
                  <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${u.status==='blocked'?'bg-red-50 text-red-600 border-red-200':'bg-green-50 text-green-700 border-green-200'}`}><span className={`w-1.5 h-1.5 rounded-full ${u.status==='blocked'?'bg-red-500':'bg-green-500'}`}/>{u.status||'active'}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={()=>setSelected(u)} className="w-7 h-7 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-gray-400 flex items-center justify-center transition"><Eye size={12}/></button>
                      <button onClick={()=>handleToggleBlock(u)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${u.status==='blocked'?'hover:bg-green-50 hover:text-green-600 text-gray-400':'hover:bg-red-50 hover:text-red-600 text-gray-400'}`}>
                        {u.status==='blocked'?<ShieldCheck size={12}/>:<ShieldOff size={12}/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selected&&<UserDrawer user={selected} orders={orders} onClose={()=>setSelected(null)} onToggleBlock={handleToggleBlock}/>}
      <ConfirmDialog isOpen={!!confirm} title={confirm?.status==='blocked'?'Unblock User':'Block User'}
        message={confirm?.status==='blocked'?`Restore access for ${confirm?.name}?`:`Block ${confirm?.name}? They cannot log in.`}
        onConfirm={doBlock} onCancel={()=>setConfirm(null)}
        confirmLabel={confirm?.status==='blocked'?'Unblock':'Block'} danger={confirm?.status!=='blocked'}/>
    </div>
  );
}
