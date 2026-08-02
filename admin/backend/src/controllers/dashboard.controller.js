const db = require('../database/db');

async function getDashboard(req, res) {
  try {
    const [products, orders, users, categories] = await Promise.all([
      db.getAll('products'), db.getAll('orders'),
      db.getAll('users'), db.getAll('categories'),
    ]);
    const now        = Date.now();
    const todayStart = new Date().setHours(0,0,0,0);
    const customers  = users.filter(u => u.role === 'customer');
    const totalRevenue = orders.filter(o=>o.status!=='Cancelled').reduce((s,o)=>s+(o.totalAmount||0),0);
    const todayRevenue = orders.filter(o=>o.status!=='Cancelled'&&(o.createdAt||0)>=todayStart).reduce((s,o)=>s+(o.totalAmount||0),0);
    const outOfStock   = products.filter(p=>p.stock===0).length;
    const lowStock     = products.filter(p=>p.stock>0&&p.stock<=(p.lowStockAlert||10)).length;
    const pendingOrders= orders.filter(o=>!['Delivered','Cancelled'].includes(o.status)).length;
    const newToday     = customers.filter(u=>(u.registeredAt||u.createdAt||0)>=todayStart).length;
    const statusCount  = {};
    orders.forEach(o=>{ statusCount[o.status]=(statusCount[o.status]||0)+1; });
    const recentOrders = [...orders].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,8);
    res.json({
      success: true,
      data: {
        kpis: {
          totalProducts: products.length,
          publishedProducts: products.filter(p=>p.status==='published').length,
          totalOrders: orders.length, pendingOrders,
          totalCustomers: customers.length, newCustomersToday: newToday,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          todayRevenue:  parseFloat(todayRevenue.toFixed(2)),
          totalCategories: categories.length,
        },
        inventory: { outOfStock, lowStock },
        ordersByStatus: statusCount,
        recentOrders,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getDashboard };
