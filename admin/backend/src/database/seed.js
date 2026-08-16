/**
 * seed.js — Populates the local JSON database with initial data.
 * Run: node src/database/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const now = Date.now();

async function seed() {
  console.log('🌱  Seeding UshaMart database…\n');

  // ── Users (admin + sample customers) ─────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL    || 'naidumay123@gmail.com';
  const adminPass  = process.env.ADMIN_PASSWORD || 'Rajubhai@1';
  const adminHash  = await bcrypt.hash(adminPass, 10);
  db.replaceAll('users', [
    {
      id: 'adm_001',
      name: 'Super Admin',
      email: adminEmail,
      password: adminHash,
      phone: '9000000000',
      role: 'super_admin',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_001',
      name: 'Alok Kumar',
      email: 'alok@gmail.com',
      phone: '9876543210',
      role: 'customer',
      status: 'active',
      addressText: 'Flat 405, Green Glen Layout, Bangalore - 560103',
      pincode: '560001',
      totalOrders: 3,
      totalSpent: 1245.50,
      registeredAt: now - 86400000 * 30,
      lastLogin: now - 3600000,
      createdAt: now - 86400000 * 30,
      updatedAt: now,
    },
    {
      id: 'usr_002',
      name: 'Preeti Sharma',
      email: 'preeti@yahoo.com',
      phone: '9988776655',
      role: 'customer',
      status: 'active',
      addressText: 'A-21, Saket, New Delhi - 110017',
      pincode: '110001',
      totalOrders: 1,
      totalSpent: 280.00,
      registeredAt: now - 86400000 * 15,
      lastLogin: now - 86400000 * 2,
      createdAt: now - 86400000 * 15,
      updatedAt: now,
    },
  ]);
  console.log('✅  Users seeded (1 admin, 2 customers)');

  // ── Pincodes ──────────────────────────────────────────────────────────────
  db.replaceAll('pincodes', [
    { id: '530001', code: '530001', areaName: 'Visakhapatnam', city: 'Vizag', state: 'Andhra Pradesh', charges: 0,    deliveryTime: 'Same Day Delivery', enabled: true, createdAt: now, updatedAt: now },
    { id: '560001', code: '560001', areaName: 'Koramangala',   city: 'Bangalore', state: 'Karnataka', charges: 0,    deliveryTime: 'Same Day Delivery', enabled: true, createdAt: now, updatedAt: now },
    { id: '560002', code: '560002', areaName: 'Whitefield',    city: 'Bangalore', state: 'Karnataka', charges: 30,   deliveryTime: '1-2 Days Delivery', enabled: true, createdAt: now, updatedAt: now },
    { id: '110001', code: '110001', areaName: 'Connaught Place',city: 'New Delhi', state: 'Delhi',    charges: 49,   deliveryTime: '2-3 Days Delivery', enabled: true, createdAt: now, updatedAt: now },
    { id: '400001', code: '400001', areaName: 'Fort',           city: 'Mumbai',    state: 'Maharashtra', charges: 29, deliveryTime: '1-2 Days Delivery', enabled: true, createdAt: now, updatedAt: now },
  ]);
  console.log('✅  Pincodes seeded (5 serviceable areas)');

  // ── Categories ────────────────────────────────────────────────────────────
  const categories = [
    { id: 'cat_dairy',     name: 'Dairy & Beverages',      emojiIcon: '🥛', icon: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&q=80', section: 'Grocery & Kitchen',   status: 'published', displayOrder: 1 },
    { id: 'cat_fruits',    name: 'Fruits',                  emojiIcon: '🍎', icon: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=150&q=80', section: 'Grocery & Kitchen',   status: 'published', displayOrder: 2 },
    { id: 'cat_vegetables',name: 'Vegetables',              emojiIcon: '🥦', icon: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=150&q=80', section: 'Grocery & Kitchen',   status: 'published', displayOrder: 3 },
    { id: 'cat_grocery',   name: 'Grocery & Staples',       emojiIcon: '🌾', icon: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80',    section: 'Grocery & Kitchen',   status: 'published', displayOrder: 4 },
    { id: 'cat_snacks',    name: 'Snacks',                  emojiIcon: '🍪', icon: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&q=80', section: 'Food & Beverages',    status: 'published', displayOrder: 5 },
    { id: 'cat_beverages', name: 'Beverages',               emojiIcon: '🥤', icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&q=80', section: 'Food & Beverages',    status: 'published', displayOrder: 6 },
    { id: 'cat_bakery',    name: 'Bakery',                  emojiIcon: '🍞', icon: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=150&q=80', section: 'Food & Beverages',    status: 'published', displayOrder: 7 },
    { id: 'cat_personal',  name: 'Personal Care',           emojiIcon: '🧴', icon: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&q=80',    section: 'Personal Care',       status: 'published', displayOrder: 8 },
    { id: 'cat_kitchen',   name: 'Home & Kitchen',          emojiIcon: '🏠', icon: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150&q=80',    section: 'Grocery & Kitchen',   status: 'published', displayOrder: 9 },
    { id: 'cat_household', name: 'Household Essentials',    emojiIcon: '🧹', icon: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&q=80', section: 'Household',           status: 'published', displayOrder: 10 },
  ].map(c => ({ ...c, createdAt: now, updatedAt: now }));
  db.replaceAll('categories', categories);
  console.log(`✅  Categories seeded (${categories.length} categories)`);

  // ── Products ──────────────────────────────────────────────────────────────
  const allPincodes = ['530001','560001','560002','110001','400001'];
  const products = [
    { id: 'prod_milk',      name: 'Amul Full Cream Milk',        brand: 'Amul',       category: 'cat_dairy',     unit: '500ml', price: 52,  mrp: 60,  stock: 80,  status: 'published', description: 'Fresh full cream cow milk. Rich in calcium and protein.', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80'], featured: true,  bestSeller: true,  newArrival: false, trending: false, todayOffer: false, sku: 'UM-DAIRY-001' },
    { id: 'prod_curd',      name: 'Mother Dairy Curd',            brand: 'Mother Dairy',category: 'cat_dairy',    unit: '400g',  price: 45,  mrp: 50,  stock: 60,  status: 'published', description: 'Fresh set curd made from pure milk.', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80'], featured: false, bestSeller: true,  newArrival: false, trending: false, todayOffer: false, sku: 'UM-DAIRY-002' },
    { id: 'prod_apple',     name: 'Red Apples',                   brand: 'Farm Fresh', category: 'cat_fruits',    unit: '1kg',   price: 149, mrp: 180, stock: 35,  status: 'published', description: 'Sweet and crispy imported red apples.', images: ['https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=300&q=80'], featured: true,  bestSeller: false, newArrival: false, trending: true,  todayOffer: true,  sku: 'UM-FRUIT-001' },
    { id: 'prod_banana',    name: 'Banana',                       brand: 'Fresh Farms',category: 'cat_fruits',    unit: '12 pcs',price: 40,  mrp: 50,  stock: 100, status: 'published', description: 'Ripe and sweet bananas, rich in potassium.', images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80'], featured: false, bestSeller: true,  newArrival: false, trending: false, todayOffer: false, sku: 'UM-FRUIT-002' },
    { id: 'prod_potato',    name: 'Potato',                       brand: 'Fresh Farms',category: 'cat_vegetables',unit: '1kg',   price: 39,  mrp: 45,  stock: 45,  status: 'published', description: 'Fresh organic hybrid potato, handpicked daily.', images: ['https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=300&q=80'], featured: false, bestSeller: true,  newArrival: false, trending: false, todayOffer: false, sku: 'UM-VEG-001' },
    { id: 'prod_tomato',    name: 'Tomato',                       brand: 'Fresh Farms',category: 'cat_vegetables',unit: '500g',  price: 25,  mrp: 30,  stock: 55,  status: 'published', description: 'Farm-fresh ripe tomatoes, perfect for cooking.', images: ['https://images.unsplash.com/photo-1561136594-7f68413baa99?w=300&q=80'], featured: false, bestSeller: false, newArrival: true,  trending: false, todayOffer: false, sku: 'UM-VEG-002' },
    { id: 'prod_atta',      name: 'Aashirvaad Atta',              brand: 'Aashirvaad', category: 'cat_grocery',   unit: '5kg',   price: 265, mrp: 295, stock: 40,  status: 'published', description: '100% whole wheat chakki atta for soft rotis.', images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80'], featured: true,  bestSeller: true,  newArrival: false, trending: false, todayOffer: false, sku: 'UM-GRO-001' },
    { id: 'prod_rice',      name: 'India Gate Basmati Rice',      brand: 'India Gate', category: 'cat_grocery',   unit: '1kg',   price: 120, mrp: 140, stock: 60,  status: 'published', description: 'Long grain premium basmati rice with rich aroma.', images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80'], featured: false, bestSeller: true,  newArrival: false, trending: false, todayOffer: true,  sku: 'UM-GRO-002' },
    { id: 'prod_chips',     name: 'Lays Classic Salted',           brand: 'Lays',       category: 'cat_snacks',    unit: '50g',   price: 18,  mrp: 20,  stock: 150, status: 'published', description: 'Crispy potato chips with classic salted flavour.', images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80'], featured: false, bestSeller: true,  newArrival: false, trending: true,  todayOffer: false, sku: 'UM-SNACK-001' },
    { id: 'prod_coke',      name: 'Coca-Cola Can',                 brand: 'Coca-Cola',  category: 'cat_beverages', unit: '330ml', price: 30,  mrp: 40,  stock: 150, status: 'published', description: 'Chilled refreshing carbonated soft drink.', images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80'], featured: false, bestSeller: false, newArrival: false, trending: true,  todayOffer: true,  sku: 'UM-BEV-001' },
    { id: 'prod_bread',     name: 'Harvest Gold Wheat Bread',      brand: 'Harvest',    category: 'cat_bakery',    unit: '400g',  price: 38,  mrp: 45,  stock: 20,  status: 'published', description: 'Fresh fiber-rich whole wheat sliced bread.', images: ['https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=300&q=80'], featured: false, bestSeller: false, newArrival: true,  trending: false, todayOffer: false, sku: 'UM-BAK-001' },
    { id: 'prod_shampoo',   name: 'Head & Shoulders Shampoo',      brand: 'Head & Shoulders', category: 'cat_personal', unit: '340ml', price: 185, mrp: 220, stock: 30, status: 'published', description: 'Anti-dandruff shampoo for clean and healthy hair.', images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80'], featured: false, bestSeller: false, newArrival: false, trending: false, todayOffer: false, sku: 'UM-PC-001' },
    { id: 'prod_detergent', name: 'Ariel Power Gel',               brand: 'Ariel',      category: 'cat_household', unit: '1L',    price: 240, mrp: 280, stock: 45,  status: 'published', description: 'Concentrated liquid laundry detergent for tough stains.', images: ['https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80'], featured: false, bestSeller: false, newArrival: false, trending: false, todayOffer: false, sku: 'UM-HH-001' },
    { id: 'prod_juice',     name: 'Tropicana Orange Juice',         brand: 'Tropicana',  category: 'cat_beverages', unit: '1L',    price: 85,  mrp: 99,  stock: 50,  status: 'published', description: '100% pure orange juice with no added sugar.', images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80'], featured: true,  bestSeller: false, newArrival: true,  trending: false, todayOffer: false, sku: 'UM-BEV-002' },
  ].map(p => ({
    ...p,
    discountPercent: p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
    pincodesAvailable: allPincodes,
    availabilityStatus: 'published',
    gst: '5',
    lowStockAlert: 10,
    deliveryTime: '1-2 Days',
    cod: true,
    variantList: [],
    subcategory: '',
    barcode: '',
    expiryDate: '',
    specifications: '',
    createdAt: now,
    updatedAt: now,
  }));
  db.replaceAll('products', products);
  console.log(`✅  Products seeded (${products.length} products)`);

  // ── Coupons ───────────────────────────────────────────────────────────────
  db.replaceAll('coupons', [
    { id: 'c1', code: 'WELCOME20', type: 'percentage',    value: 20, minSpend: 100, description: '20% off on orders above ₹100', status: 'published', createdAt: now, updatedAt: now },
    { id: 'c2', code: 'USHA100',   type: 'flat',          value: 100, minSpend: 500, description: 'Flat ₹100 off on orders above ₹500', status: 'published', createdAt: now, updatedAt: now },
    { id: 'c3', code: 'FREESHIP',  type: 'free_delivery', value: 0,  minSpend: 200, description: 'Free delivery on orders above ₹200', status: 'published', createdAt: now, updatedAt: now },
  ]);
  console.log('✅  Coupons seeded (3 coupons)');

  // ── Notifications ─────────────────────────────────────────────────────────
  db.replaceAll('notifications', [
    { id: 'n1', title: 'Grand Launch Offer!',       content: 'Get 20% off on your first order. Use coupon WELCOME20.', type: 'promotional', sentTime: now - 3600000 * 24, status: 'published', createdAt: now, updatedAt: now },
    { id: 'n2', title: 'Super Fast Delivery Active',content: 'Delivering fresh items directly to you same day!',       type: 'promotional', sentTime: now - 3600000 * 12, status: 'published', createdAt: now, updatedAt: now },
  ]);
  console.log('✅  Notifications seeded (2 notifications)');

  // ── Orders (sample) ───────────────────────────────────────────────────────
  db.replaceAll('orders', [
    {
      id: 'ord_001', orderNumber: 'UM-2024-0001',
      userId: 'usr_001', userName: 'Alok Kumar', userPhone: '9876543210',
      addressText: 'Flat 405, Green Glen Layout, Bangalore - 560103', pincode: '560001',
      items: [
        { productId: 'prod_milk', name: 'Amul Full Cream Milk', quantity: 2, price: 52, mrp: 60, unit: '500ml' },
        { productId: 'prod_apple', name: 'Red Apples', quantity: 1, price: 149, mrp: 180, unit: '1kg' },
      ],
      subtotal: 253, deliveryCharges: 0, discountAmount: 0, totalAmount: 253,
      status: 'Delivered', paymentMethod: 'COD', deliverySlot: 'Tomorrow, 7 AM - 10 AM',
      createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 4,
    },
  ]);
  console.log('✅  Orders seeded (1 sample order)');

  // ── Banners ───────────────────────────────────────────────────────────────
  db.replaceAll('banners', [
    { id: 'b1', title: 'Fresh Picks Today', subtitle: 'Farm-fresh produce delivered to your door.', badgeText: 'TODAY ONLY', buttonText: 'Shop Fresh', bgColor: '#dcfce7', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80', active: true, displayOrder: 1, createdAt: now, updatedAt: now },
    { id: 'b2', title: 'Healthy Snack Week',subtitle: 'Good choices. Better everyday moments.',       badgeText: 'UP TO 30% OFF', buttonText: 'SHOP NOW', bgColor: '#ede9fe', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', active: true, displayOrder: 2, createdAt: now, updatedAt: now },
  ]);
  console.log('✅  Banners seeded (2 banners)');

  // ── Special offers ────────────────────────────────────────────────────────
  db.replaceAll('special_offers', [
    { id: 'offer_001', title: 'Fresh Picks Today', subtitle: 'Farm-fresh produce at your door.', badgeText: 'EXPRESS DELIVERY', buttonText: 'ORDER NOW →', bgColor: '#dcfce7', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80', offerType: 'category', linkedCatId: 'cat_fruits', status: 'active', active: true, displayOrder: 1, startDate: '', endDate: '', createdAt: now, updatedAt: now },
  ]);
  console.log('✅  Special offers seeded (1 offer)');

  // ── Empty collections ────────────────────────────────────────────────────
  db.replaceAll('support_tickets', []);
  db.replaceAll('ratings', []);
  db.replaceAll('product_reviews', []);
  db.replaceAll('sessions', []);

  console.log('\n🎉  Seed complete! Run "npm run dev" to start the API server.\n');
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
