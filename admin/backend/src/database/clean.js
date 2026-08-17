/**
 * clean.js — Resets all collections/tables to clean production states (everything at zero/empty).
 * Keeps only the Super Admin credentials.
 * Run: node src/database/clean.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('./db');

async function clean() {
  console.log('🧹 Preparing UshaMart for clean production state...');

  try {
    // 1. Reset collections to empty arrays
    const collections = [
      'products',
      'categories',
      'orders',
      'coupons',
      'notifications',
      'banners',
      'special_offers',
      'ratings',
      'product_reviews',
      'support_tickets',
      'sessions',
      'user_addresses',
      'product_variants',
      'pincodes'
    ];

    for (const coll of collections) {
      console.log(`Clearing ${coll}...`);
      await db.replaceAll(coll, []);
    }

    // 2. Clear users but keep the Super Admin
    console.log('Clearing users, keeping super_admin...');
    const allUsers = await db.getAll('users');
    const adminOnly = allUsers.filter(u => u.role === 'super_admin');
    
    // If no super_admin exists in database, seed a default one
    if (adminOnly.length === 0) {
      const bcrypt = require('bcryptjs');
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPass = process.env.ADMIN_PASSWORD;
      if (!adminEmail || !adminPass) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured before creating an admin user.');
      const adminHash = await bcrypt.hash(adminPass, 10);
      adminOnly.push({
        id: 'adm_001',
        name: 'Super Admin',
        email: adminEmail,
        password: adminHash,
        phone: '9000000000',
        role: 'super_admin',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    await db.replaceAll('users', adminOnly);

    console.log('\n🎉 UshaMart successfully reset to clean production state!');
    console.log('   All dashboard statistics are now zero.');
    console.log('   Client can log in using naidumay123@gmail.com / Rajubhai@1');
  } catch (err) {
    console.error('❌ Failed to clean database:', err);
    process.exit(1);
  }
}

clean();
