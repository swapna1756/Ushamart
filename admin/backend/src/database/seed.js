/**
 * seed.js — Populates Supabase (or local JSON) with initial data.
 *
 * Run with:  node src/database/seed.js
 * Or:        npm run seed
 *
 * Requirements:
 *   • SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env
 *   • ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env
 *
 * Behavior:
 *   • Each collection is cleared then reseeded (idempotent).
 *   • Admin user is created with bcrypt-hashed password.
 *   • All data goes through db.js adapter, so snake_case conversion is automatic.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const db     = require('./db');
const { isConfigured, configurationError } = require('./supabase');

async function seed() {
  console.log('\n🌱  UshaMart seed starting…');

  if (!isConfigured) {
    console.error('\n❌  Supabase is not configured:', configurationError);
    console.error('    Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file,');
    console.error('    OR set USE_LOCAL_DB=true for local JSON-file mode.\n');
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass  = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPass) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding.');
  }

  console.log(`   Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`   Admin email: ${adminEmail}\n`);

  const now = Date.now();

  // ── Users ──────────────────────────────────────────────────────────────────
  // Single super-admin account. Password is hashed from ADMIN_PASSWORD env var.
  // Set ADMIN_PASSWORD=Rajubhai@1 in your Render environment variables.
  const adminHash = await bcrypt.hash(adminPass, 10);
  await db.replaceAll('users', [
    {
      id:        'adm_001',
      name:      'Admin',
      email:     adminEmail,   // naidumay123@gmail.com  (set via ADMIN_EMAIL env var)
      password:  adminHash,    // bcrypt hash of ADMIN_PASSWORD — never stored in plain text
      phone:     '',
      role:      'super_admin',
      status:    'active',
      createdAt: now,
      updatedAt: now,
    },
  ]);
  console.log('✅  Admin user seeded');
  console.log(`   Email: ${adminEmail}`);

  // ── Pincodes ───────────────────────────────────────────────────────────────
  await db.replaceAll('pincodes', [
    { id: '530001', code: '530001', areaName: 'Visakhapatnam City',   city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', charges: 0,  deliveryTime: 'Same Day Delivery', enabled: true,  createdAt: now, updatedAt: now },
    { id: '560001', code: '560001', areaName: 'Koramangala',          city: 'Bangalore',     district: 'Bangalore Urban', state: 'Karnataka',    charges: 0,  deliveryTime: 'Same Day Delivery', enabled: true,  createdAt: now, updatedAt: now },
    { id: '560002', code: '560002', areaName: 'Whitefield',           city: 'Bangalore',     district: 'Bangalore Urban', state: 'Karnataka',    charges: 30, deliveryTime: '1-2 Days',          enabled: true,  createdAt: now, updatedAt: now },
    { id: '110001', code: '110001', areaName: 'Connaught Place',      city: 'New Delhi',     district: 'Central Delhi',  state: 'Delhi',         charges: 49, deliveryTime: '2-3 Days',          enabled: true,  createdAt: now, updatedAt: now },
    { id: '400001', code: '400001', areaName: 'Fort',                 city: 'Mumbai',        district: 'Mumbai City',    state: 'Maharashtra',   charges: 29, deliveryTime: '1-2 Days',          enabled: true,  createdAt: now, updatedAt: now },
  ]);
  console.log('✅  Pincodes seeded (5 serviceable areas)');

  // ── Categories ─────────────────────────────────────────────────────────────
  const categories = [
    { id: 'cat_dairy',      name: 'Dairy & Eggs',          emojiIcon: '🥛', icon: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&q=80', section: 'Grocery & Kitchen', status: 'published', displayOrder: 1  },
    { id: 'cat_fruits',     name: 'Fruits',                emojiIcon: '🍎', icon: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=150&q=80', section: 'Grocery & Kitchen', status: 'published', displayOrder: 2  },
    { id: 'cat_vegetables', name: 'Vegetables',            emojiIcon: '🥦', icon: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=150&q=80', section: 'Grocery & Kitchen', status: 'published', displayOrder: 3  },
    { id: 'cat_grocery',    name: 'Grocery & Staples',     emojiIcon: '🌾', icon: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80',    section: 'Grocery & Kitchen', status: 'published', displayOrder: 4  },
    { id: 'cat_snacks',     name: 'Snacks & Namkeen',      emojiIcon: '🍪', icon: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&q=80', section: 'Food & Beverages',  status: 'published', displayOrder: 5  },
    { id: 'cat_beverages',  name: 'Beverages',             emojiIcon: '🥤', icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&q=80', section: 'Food & Beverages',  status: 'published', displayOrder: 6  },
    { id: 'cat_bakery',     name: 'Bakery & Breads',       emojiIcon: '🍞', icon: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=150&q=80', section: 'Food & Beverages',  status: 'published', displayOrder: 7  },
    { id: 'cat_personal',   name: 'Personal Care',         emojiIcon: '🧴', icon: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&q=80',    section: 'Personal Care',     status: 'published', displayOrder: 8  },
    { id: 'cat_kitchen',    name: 'Home & Kitchen',        emojiIcon: '🏠', icon: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150&q=80',    section: 'Grocery & Kitchen', status: 'published', displayOrder: 9  },
    { id: 'cat_household',  name: 'Household Essentials',  emojiIcon: '🧹', icon: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&q=80', section: 'Household',         status: 'published', displayOrder: 10 },
  ].map(c => ({ ...c, featured: false, createdAt: now, updatedAt: now }));

  await db.replaceAll('categories', categories);
  console.log(`✅  Categories seeded (${categories.length})`);

  // ── Products ───────────────────────────────────────────────────────────────
  const allPins = ['530001','560001','560002','110001','400001'];
  const baseProduct = (overrides) => ({
    variantList: [], subcategory: '', barcode: '', expiryDate: '',
    specifications: '', gst: '5', lowStockAlert: 10,
    deliveryTime: '1-2 Days', cod: true, trending: false,
    featured: false, bestSeller: false, newArrival: false, todayOffer: false,
    availabilityStatus: 'published', pincodesAvailable: allPins,
    createdAt: now, updatedAt: now,
    ...overrides,
    discountPercent: overrides.mrp > overrides.price
      ? Math.round(((overrides.mrp - overrides.price) / overrides.mrp) * 100)
      : 0,
  });

  const products = [
    baseProduct({ id: 'prod_milk',      name: 'Amul Full Cream Milk',       brand: 'Amul',       category: 'cat_dairy',      unit: '500ml', price: 52,  mrp: 60,  stock: 80,  status: 'published', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80'], featured: true, bestSeller: true, sku: 'UM-D001', description: 'Fresh full cream cow milk, rich in calcium.' }),
    baseProduct({ id: 'prod_curd',      name: 'Mother Dairy Curd',          brand: 'Mother Dairy',category: 'cat_dairy',      unit: '400g',  price: 45,  mrp: 50,  stock: 60,  status: 'published', images: ['https://images.unsplash.com/photo-1571942676516-bcab84649e44?w=300&q=80'], bestSeller: true, sku: 'UM-D002', description: 'Fresh set curd made from pure milk.' }),
    baseProduct({ id: 'prod_apple',     name: 'Red Apples',                 brand: 'Farm Fresh', category: 'cat_fruits',     unit: '1kg',   price: 149, mrp: 180, stock: 35,  status: 'published', images: ['https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=300&q=80'], featured: true, trending: true, todayOffer: true, sku: 'UM-F001', description: 'Sweet and crispy imported red apples.' }),
    baseProduct({ id: 'prod_banana',    name: 'Banana',                     brand: 'Fresh Farms',category: 'cat_fruits',     unit: '12 pcs',price: 40,  mrp: 50,  stock: 100, status: 'published', images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80'], bestSeller: true, sku: 'UM-F002', description: 'Ripe and sweet bananas, rich in potassium.' }),
    baseProduct({ id: 'prod_potato',    name: 'Potato',                     brand: 'Fresh Farms',category: 'cat_vegetables', unit: '1kg',   price: 39,  mrp: 45,  stock: 45,  status: 'published', images: ['https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=300&q=80'], bestSeller: true, sku: 'UM-V001', description: 'Fresh organic hybrid potato, handpicked daily.' }),
    baseProduct({ id: 'prod_tomato',    name: 'Tomato',                     brand: 'Fresh Farms',category: 'cat_vegetables', unit: '500g',  price: 25,  mrp: 30,  stock: 55,  status: 'published', images: ['https://images.unsplash.com/photo-1561136594-7f68413baa99?w=300&q=80'], newArrival: true, sku: 'UM-V002', description: 'Farm-fresh ripe tomatoes, perfect for cooking.' }),
    baseProduct({ id: 'prod_atta',      name: 'Aashirvaad Atta 5kg',       brand: 'Aashirvaad', category: 'cat_grocery',    unit: '5kg',   price: 265, mrp: 295, stock: 40,  status: 'published', images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80'], featured: true, bestSeller: true, sku: 'UM-G001', description: '100% whole wheat chakki atta for soft rotis.' }),
    baseProduct({ id: 'prod_rice',      name: 'India Gate Basmati Rice',    brand: 'India Gate', category: 'cat_grocery',    unit: '1kg',   price: 120, mrp: 140, stock: 60,  status: 'published', images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80'], bestSeller: true, todayOffer: true, sku: 'UM-G002', description: 'Long grain premium basmati rice with rich aroma.' }),
    baseProduct({ id: 'prod_chips',     name: 'Lays Classic Salted',        brand: 'Lays',       category: 'cat_snacks',     unit: '50g',   price: 18,  mrp: 20,  stock: 150, status: 'published', images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80'], bestSeller: true, trending: true, sku: 'UM-S001', description: 'Crispy potato chips with classic salted flavour.' }),
    baseProduct({ id: 'prod_coke',      name: 'Coca-Cola Can',              brand: 'Coca-Cola',  category: 'cat_beverages',  unit: '330ml', price: 30,  mrp: 40,  stock: 150, status: 'published', images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80'], trending: true, todayOffer: true, sku: 'UM-B001', description: 'Chilled refreshing carbonated soft drink.' }),
    baseProduct({ id: 'prod_juice',     name: 'Tropicana Orange Juice',     brand: 'Tropicana',  category: 'cat_beverages',  unit: '1L',    price: 85,  mrp: 99,  stock: 50,  status: 'published', images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80'], featured: true, newArrival: true, sku: 'UM-B002', description: '100% pure orange juice with no added sugar.' }),
    baseProduct({ id: 'prod_bread',     name: 'Harvest Gold Wheat Bread',   brand: 'Harvest',    category: 'cat_bakery',     unit: '400g',  price: 38,  mrp: 45,  stock: 20,  status: 'published', images: ['https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=300&q=80'], newArrival: true, sku: 'UM-BK001', description: 'Fresh fiber-rich whole wheat sliced bread.' }),
    baseProduct({ id: 'prod_shampoo',   name: 'Head & Shoulders Anti-Dandruff', brand: 'Head & Shoulders', category: 'cat_personal', unit: '340ml', price: 185, mrp: 220, stock: 30, status: 'published', images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80'], sku: 'UM-PC001', description: 'Anti-dandruff shampoo for clean and healthy hair.' }),
    baseProduct({ id: 'prod_detergent', name: 'Ariel Power Gel Detergent',  brand: 'Ariel',      category: 'cat_household',  unit: '1L',    price: 240, mrp: 280, stock: 45,  status: 'published', images: ['https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80'], sku: 'UM-HH001', description: 'Concentrated liquid laundry detergent for tough stains.' }),
  ];

  await db.replaceAll('products', products);
  console.log(`✅  Products seeded (${products.length})`);

  // ── Coupons ────────────────────────────────────────────────────────────────
  await db.replaceAll('coupons', [
    { id: 'c1', code: 'WELCOME20', type: 'percentage',    value: 20,  minSpend: 100, description: '20% off on orders above ₹100',         status: 'published', createdAt: now, updatedAt: now },
    { id: 'c2', code: 'USHA100',   type: 'flat',          value: 100, minSpend: 500, description: 'Flat ₹100 off on orders above ₹500',   status: 'published', createdAt: now, updatedAt: now },
    { id: 'c3', code: 'FREESHIP',  type: 'free_delivery', value: 0,   minSpend: 200, description: 'Free delivery on orders above ₹200',   status: 'published', createdAt: now, updatedAt: now },
  ]);
  console.log('✅  Coupons seeded (3)');

  // ── Notifications ──────────────────────────────────────────────────────────
  await db.replaceAll('notifications', [
    { id: 'n1', title: 'Grand Launch Offer!',        content: 'Get 20% off on your first order. Use coupon WELCOME20.', type: 'promotional', sentTime: now - 3600000 * 24, status: 'published', createdAt: now, updatedAt: now },
    { id: 'n2', title: 'Same Day Delivery Active!',  content: 'Delivering fresh items directly to you same day!',       type: 'promotional', sentTime: now - 3600000 * 12, status: 'published', createdAt: now, updatedAt: now },
  ]);
  console.log('✅  Notifications seeded (2)');

  // ── Banners ────────────────────────────────────────────────────────────────
  await db.replaceAll('banners', [
    { id: 'b1', title: 'Fresh Picks Today',   subtitle: 'Farm-fresh produce delivered to your door.',  badgeText: 'TODAY ONLY',   buttonText: 'Shop Fresh', bgColor: '#dcfce7', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80', active: true, displayOrder: 1, createdAt: now, updatedAt: now },
    { id: 'b2', title: 'Healthy Snack Week',  subtitle: 'Good choices. Better everyday moments.',       badgeText: 'UP TO 30% OFF', buttonText: 'Shop Now',   bgColor: '#ede9fe', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&q=80', active: true, displayOrder: 2, createdAt: now, updatedAt: now },
  ]);
  console.log('✅  Banners seeded (2)');

  // ── Special Offers ─────────────────────────────────────────────────────────
  await db.replaceAll('special_offers', [
    { id: 'offer_001', title: 'Fresh Fruits & Veggies', subtitle: 'Farm-fresh produce at your door.', badgeText: 'EXPRESS DELIVERY', buttonText: 'ORDER NOW →', bgColor: '#dcfce7', imageUrl: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&q=80', offerType: 'category', linkedCatId: 'cat_fruits',    status: 'active', active: true, displayOrder: 1, startDate: '', endDate: '', createdAt: now, updatedAt: now },
    { id: 'offer_002', title: 'Grocery Essentials',     subtitle: 'Save big on daily staples.',        badgeText: 'SAVE UP TO 20%',  buttonText: 'SHOP NOW →',  bgColor: '#fef9c3', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80', offerType: 'category', linkedCatId: 'cat_grocery',  status: 'active', active: true, displayOrder: 2, startDate: '', endDate: '', createdAt: now, updatedAt: now },
  ]);
  console.log('✅  Special offers seeded (2)');

  // ── Empty collections ──────────────────────────────────────────────────────
  // Only wipe if tables exist and are empty-like
  try { await db.replaceAll('support_tickets', []); } catch { /* ignore */ }
  try { await db.replaceAll('ratings', []); }         catch { /* ignore */ }
  try { await db.replaceAll('product_reviews', []); } catch { /* ignore */ }
  try { await db.replaceAll('sessions', []); }        catch { /* ignore */ }

  console.log('\n🎉  Seed complete!\n');
  console.log('   Admin login:');
  console.log(`     Email:    ${adminEmail}`);
  console.log('     Password: (as set in ADMIN_PASSWORD on Render)\n');
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
