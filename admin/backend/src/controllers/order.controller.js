const db = require('../database/db');

async function getOrders(req, res) {
  try {
    const isAdmin = req.user && ['super_admin','store_manager'].includes(req.user.role);
    let orders = await db.getAll('orders');
    if (!isAdmin) {
      const uid   = req.user?.id;
      const users = await db.getAll('users');
      const phone = (users.find(u => u.id === uid) || {}).phone || '';
      orders = orders.filter(o => o.userId === uid || o.userPhone === phone);
    }
    const { status, search } = req.query;
    if (status && status !== 'all') orders = orders.filter(o => o.status === status);
    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(o =>
        (o.orderNumber||'').toLowerCase().includes(q) ||
        (o.userName||'').toLowerCase().includes(q) ||
        (o.userPhone||'').toLowerCase().includes(q) ||
        (o.id||'').toLowerCase().includes(q)
      );
    }
    orders.sort((a, b) => (b.createdAt||0) - (a.createdAt||0));
    res.json({ success: true, data: orders, total: orders.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getOrder(req, res) {
  try {
    const order = await db.getById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const isAdmin = req.user && ['super_admin','store_manager'].includes(req.user.role);
    if (!isAdmin) {
      const uid   = req.user?.id;
      const users = await db.getAll('users');
      const phone = (users.find(u => u.id === uid) || {}).phone || '';
      if (order.userId !== uid && order.userPhone !== phone)
        return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createOrder(req, res) {
  try {
    const uid  = req.user?.id;
    const users = await db.getAll('users');
    const user = uid ? users.find(u => u.id === uid) : null;
    const allOrders = await db.getAll('orders');
    const year = new Date().getFullYear();
    const seq  = String(allOrders.length + 1).padStart(4, '0');
    const id   = 'ord_' + Date.now().toString(36);
    const order = {
      id, orderNumber: `UM-${year}-${seq}`,
      userId:        uid || '',
      userName:      user?.name    || req.body.address?.name    || '',
      userPhone:     user?.phone   || req.body.address?.phone   || '',
      userEmail:     user?.email   || req.body.address?.email   || '',
      addressText:   req.body.address?.addressText || '',
      pincode:       req.body.pincode  || '',
      items:         req.body.items    || [],
      subtotal:      Number(req.body.summary?.itemTotal)      || 0,
      deliveryCharges:Number(req.body.summary?.deliveryFee)   || 0,
      discountAmount: Number(req.body.summary?.couponDiscount) || 0,
      totalAmount:   Number(req.body.summary?.grandTotal)     || 0,
      couponCode:    req.body.couponCode   || null,
      status:        'Pending',
      paymentMethod: req.body.paymentMethod || 'COD',
      paymentStatus: 'Pending',
      deliverySlot:  req.body.deliverySlot  || '',
      createdAt:     Date.now(), updatedAt: Date.now(),
    };
    await db.insert('orders', order);
    // Deduct stock
    for (const item of order.items || []) {
      const prod = await db.getById('products', item.productId);
      if (prod) await db.update('products', prod.id, { stock: Math.max(0, prod.stock - item.quantity) });
    }
    res.status(201).json({ success: true, data: order, message: 'Order placed successfully.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const valid = ['Pending','Confirmed','Packed','Out for Delivery','Delivered','Cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    const order = await db.getById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const updated = await db.update('orders', req.params.id, { status });
    res.json({ success: true, data: updated, message: `Order status updated to ${status}.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getOrders, getOrder, createOrder, updateStatus };
