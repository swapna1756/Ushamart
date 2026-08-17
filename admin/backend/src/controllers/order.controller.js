const db = require('../database/db');
const { validateAddressPayload, normalizeAddress, addressText } = require('./address.controller');

const STATUSES = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const LEGACY_STATUS = {
  Pending: 'PLACED',
  Confirmed: 'CONFIRMED',
  Packed: 'PACKED',
  Shipped: 'SHIPPED',
  'Out for Delivery': 'OUT_FOR_DELIVERY',
  Delivered: 'DELIVERED',
  Cancelled: 'CANCELLED',
};
const NEXT_STATUS = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

function normalizeStatus(status) {
  return LEGACY_STATUS[status] || status || 'PLACED';
}

function statusEvent(status, by) {
  return { status, by: by || 'system', at: Date.now() };
}

function publicOrder(order) {
  const status = normalizeStatus(order.orderStatus || order.status);
  return {
    ...order,
    orderStatus: status,
    status,
    paymentMethod: order.paymentMethod || 'COD',
    paymentStatus: order.paymentStatus || 'PENDING',
  };
}

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
    if (status && status !== 'all') orders = orders.filter(o => normalizeStatus(o.orderStatus || o.status) === normalizeStatus(status));
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
    res.json({ success: true, data: orders.map(publicOrder), total: orders.length });
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
    res.json({ success: true, data: publicOrder(order) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createOrder(req, res) {
  try {
    const uid  = req.user?.id;
    const users = await db.getAll('users');
    const user = uid ? users.find(u => u.id === uid) : null;
    if (!uid || !user) return res.status(401).json({ success: false, message: 'Please login before placing an order.' });

    const idempotencyKey = String(req.headers['x-idempotency-key'] || req.body.idempotencyKey || '').trim();
    if (idempotencyKey) {
      const existing = (await db.getAll('orders')).find(o => o.userId === uid && o.idempotencyKey === idempotencyKey);
      if (existing) return res.status(200).json({ success: true, data: publicOrder(existing), message: 'Order already placed.' });
    }

    const requested = Array.isArray(req.body.items) ? req.body.items : [];
    if (requested.length < 1) return res.status(400).json({ success: false, message: 'Select at least one product.' });

    const addressId = String(req.body.addressId || '').trim();
    if (!addressId) return res.status(400).json({ success: false, message: 'Please select a valid delivery address.' });
    const storedAddress = await db.getById('user_addresses', addressId);
    if (!storedAddress || storedAddress.userId !== uid) {
      return res.status(400).json({ success: false, message: 'Please select a valid delivery address.' });
    }
    const addressPayload = normalizeAddress(storedAddress, uid);
    const addressError = await validateAddressPayload(addressPayload);
    if (addressError) return res.status(400).json({ success: false, message: addressError });

    const deliverySlot = String(req.body.deliverySlot || '').trim();
    if (!deliverySlot) return res.status(400).json({ success: false, message: 'Please select a delivery slot.' });
    if (req.body.paymentMethod && req.body.paymentMethod !== 'COD') {
      return res.status(400).json({ success: false, message: 'Only Cash on Delivery is currently available.' });
    }

    const pin = (await db.getAll('pincodes')).find(p => String(p.code || p.id) === addressPayload.pincode && p.enabled !== false);
    if (!pin) return res.status(400).json({ success: false, message: 'Delivery is currently unavailable at this pincode.' });
    const products = await db.getAll('products');
    const items = [];
    let subtotal = 0;
    let discountAmount = 0;

    for (const raw of requested) {
      const productId = raw.productId || raw.id;
      const qty = Math.max(1, Number(raw.quantity || raw.qty) || 0);
      const prod = products.find(p => p.id === productId);
      if (!prod || prod.status !== 'published') {
        return res.status(400).json({ success: false, message: 'One product in your order is no longer available.' });
      }
      if ((Number(prod.stock) || 0) < qty) {
        return res.status(409).json({ success: false, message: 'Sorry, this product is currently out of stock.' });
      }
      const variantInfo = String(raw.variantInfo || '').trim();
      const variant = Array.isArray(prod.variantList)
        ? prod.variantList.find(v => v.unit === variantInfo)
        : null;
      const unitPrice = Number(variant?.price ?? prod.price) || 0;
      const mrp = Number(variant?.mrp ?? prod.mrp ?? unitPrice) || unitPrice;
      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;
      discountAmount += Math.max(0, (mrp - unitPrice) * qty);
      items.push({
        productId: prod.id,
        productName: prod.name,
        name: prod.name,
        brand: prod.brand || '',
        productImage: prod.images?.[0] || '',
        image: prod.images?.[0] || '',
        variantInfo: variantInfo || prod.unit || prod.variants || '',
        unit: variant?.unit || prod.unit || '',
        quantity: qty,
        unitPrice,
        price: unitPrice,
        mrp,
        discount: Math.max(0, (mrp - unitPrice) * qty),
        total: itemTotal,
      });
    }

    const deliveryCharges = Number(pin?.charges) || (subtotal >= 299 ? 0 : 40);
    const totalAmount = subtotal + deliveryCharges;
    const allOrders = await db.getAll('orders');
    const year = new Date().getFullYear();
    const seq  = String(allOrders.length + 1).padStart(4, '0');
    const id   = 'ord_' + Date.now().toString(36);
    const order = {
      id, orderNumber: `UM-${year}-${seq}`,
      userId:        uid || '',
      userName:      addressPayload.fullName || user?.name || '',
      userPhone:     addressPayload.mobileNumber || user?.phone || '',
      userEmail:     user?.email || req.body.address?.email || '',
      customerName:  addressPayload.fullName || user?.name || '',
      customerPhone: addressPayload.mobileNumber || user?.phone || '',
      addressId,
      address:       addressPayload,
      addressText:   addressText(addressPayload),
      pincode:       addressPayload.pincode,
      items,
      subtotal,
      deliveryCharges,
      discountAmount,
      totalAmount,
      couponCode:    req.body.couponCode   || null,
      status:        'PLACED',
      orderStatus:   'PLACED',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      deliverySlot,
      statusHistory: [statusEvent('PLACED', uid)],
      idempotencyKey,
      createdAt:     Date.now(), updatedAt: Date.now(),
    };
    if (uid) {
      try {
        const users = await db.getAll('users');
        const userExists = users.some(u => u.id === uid);
        if (!userExists) {
          const userDoc = {
            id: uid,
            phone: req.user?.phone || addressPayload.mobileNumber || '',
            name: req.user?.name || addressPayload.fullName || 'Customer',
            email: req.user?.email || user?.email || '',
            role: 'customer',
            status: 'active',
            totalOrders: 0,
            totalSpent: 0,
            addressText: '',
            pincode: '',
            registeredAt: Date.now(),
            lastLogin: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          await db.insert('users', userDoc);
        }
      } catch (err) {
        console.warn('[order.controller] Ensure user exists error:', err.message);
      }
    }

    const savedOrder = await db.insert('orders', order);
    const stockAdjustments = [];
    try {
      await db.insertMany('order_items', items.map((item, index) => ({
        id: `oi_${id}_${index + 1}`,
        orderId: id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        variantInfo: item.variantInfo,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        mrp: item.mrp,
        subtotal: item.total,
      })));

      for (const item of items) {
        const prod = await db.getById('products', item.productId);
        if (prod) {
          const previousStock = Number(prod.stock) || 0;
          await db.update('products', prod.id, { stock: Math.max(0, previousStock - item.quantity) });
          stockAdjustments.push({ id: prod.id, stock: previousStock });
        }
      }
    } catch (writeError) {
      // The FK cascade also removes any partially inserted order_items.  Never
      // report success when the complete order could not be persisted.
      await Promise.allSettled(stockAdjustments.map(change => db.update('products', change.id, { stock: change.stock })));
      await db.delete('orders', id).catch(() => {});
      throw writeError;
    }
    res.status(201).json({ success: true, data: publicOrder(savedOrder), message: 'Order placed successfully.' });
  } catch (err) {
    const message = /schema cache|column .* does not exist|table .* does not exist/i.test(err.message)
      ? 'Checkout is temporarily unavailable while the order database is being updated. Please try again shortly.'
      : (err.message || 'Unable to place your order right now. Please try again.');
    res.status(500).json({ success: false, message });
  }
}

async function updateStatus(req, res) {
  try {
    const rawStatus = req.body.status;
    const status = normalizeStatus(rawStatus);
    if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    const order = await db.getById('orders', req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const updated = await db.update('orders', req.params.id, {
      status,
      orderStatus: status,
      statusHistory: [...history, statusEvent(status, req.user?.id || 'admin')],
      paymentStatus: (status === 'DELIVERED') && order.paymentMethod === 'COD' ? 'PAID' : (order.paymentStatus || 'PENDING'),
    });
    res.json({ success: true, data: publicOrder(updated), message: `Order status updated to ${status}.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getOrders, getOrder, createOrder, updateStatus };
