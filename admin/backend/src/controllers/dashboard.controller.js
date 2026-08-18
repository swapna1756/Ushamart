/**
 * dashboard.controller.js
 * GET /api/dashboard — admin summary KPIs
 */
const db = require('../database/db');

async function getDashboard(req, res) {
  try {
    const [products, orders, users, categories] = await Promise.all([
      db.getAll('products'),
      db.getAll('orders'),
      db.getAll('users'),
      db.getAll('categories'),
    ]);

    const todayStart  = new Date().setHours(0, 0, 0, 0);
    const customers   = users.filter(u => u.role === 'customer');

    const activeOrders  = orders.filter(o => {
      const s = (o.orderStatus || o.status || '').toUpperCase();
      return s !== 'CANCELLED' && s !== 'DELIVERED';
    });

    const totalRevenue  = orders
      .filter(o => {
        const s = (o.orderStatus || o.status || '').toUpperCase();
        return s !== 'CANCELLED';
      })
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const todayRevenue  = orders
      .filter(o => {
        const s = (o.orderStatus || o.status || '').toUpperCase();
        return s !== 'CANCELLED' && (o.createdAt || 0) >= todayStart;
      })
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const outOfStock   = products.filter(p => (Number(p.stock) || 0) === 0).length;
    const lowStock     = products.filter(p => {
      const s = Number(p.stock) || 0;
      return s > 0 && s <= (Number(p.lowStockAlert) || 10);
    }).length;

    const pendingOrders = orders.filter(o => {
      const s = (o.orderStatus || o.status || '').toUpperCase();
      return !['DELIVERED', 'CANCELLED'].includes(s);
    }).length;

    const newToday = customers.filter(u =>
      (u.registeredAt || u.createdAt || 0) >= todayStart
    ).length;

    // Count by normalized status
    const statusCount = {};
    for (const o of orders) {
      const s = (o.orderStatus || o.status || 'PLACED').toUpperCase();
      statusCount[s] = (statusCount[s] || 0) + 1;
    }

    const recentOrders = [...orders]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 8);

    res.json({
      success: true,
      data: {
        kpis: {
          totalProducts:       products.length,
          publishedProducts:   products.filter(p => p.status === 'published').length,
          totalOrders:         orders.length,
          pendingOrders,
          totalCustomers:      customers.length,
          newCustomersToday:   newToday,
          totalRevenue:        parseFloat(totalRevenue.toFixed(2)),
          todayRevenue:        parseFloat(todayRevenue.toFixed(2)),
          totalCategories:     categories.length,
        },
        inventory:      { outOfStock, lowStock },
        ordersByStatus: statusCount,
        recentOrders,
      },
    });
  } catch (err) {
    console.error('[dashboard]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getDashboard };
