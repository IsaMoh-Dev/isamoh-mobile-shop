/**
 * Migration Script — MySQL → MongoDB
 * ─────────────────────────────────────────────────────────
 * Reads your existing PHP MySQL database (shopee) and imports
 * all products, accessories, blog posts, and settings into MongoDB.
 *
 * Requirements:
 *   npm install mysql2   (run this once in the backend folder)
 *
 * Usage:
 *   node seed/migrate_from_mysql.js
 * ─────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const mysql    = require('mysql2/promise');

const Product   = require('../models/Product');
const Accessory = require('../models/Accessory');
const Blog      = require('../models/Blog');
const Setting   = require('../models/Setting');
const Brand     = require('../models/Brand');
const Coupon    = require('../models/Coupon');
const slugify   = require('slugify');

// ── MySQL config — matches your XAMPP setup ──────────────
const MYSQL_CONFIG = {
  host:     'localhost',
  user:     'root',
  password: '',
  database: 'shopee',
  port:     3306,
};

async function migrate() {
  console.log('\n🔄  Starting MySQL → MongoDB migration...\n');

  // Connect MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  MongoDB connected');

  // Connect MySQL
  let mysql_conn;
  try {
    mysql_conn = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅  MySQL connected\n');
  } catch (e) {
    console.error('❌  MySQL connection failed:', e.message);
    console.log('💡  Make sure XAMPP MySQL is running on port 3306');
    process.exit(1);
  }

  // ── Products ──────────────────────────────────────────
  console.log('📦  Migrating products...');
  const [products] = await mysql_conn.execute('SELECT * FROM product');
  let prodCount = 0;

  for (const p of products) {
    try {
      await Product.findOneAndUpdate(
        { name: p.item_name, brand: p.item_brand },
        {
          brand:       p.item_brand,
          name:        p.item_name,
          price:       parseFloat(p.item_price)    || 0,
          oldPrice:    parseFloat(p.item_old_price) || null,
          image:       p.item_image || 'assets/products/1.png',
          image2:      p.item_image2 || null,
          image3:      p.item_image3 || null,
          description: p.item_description || '',
          ram:         p.item_ram        || '',
          storage:     p.item_storage    || '',
          display:     p.item_display    || '',
          camera:      p.item_camera     || '',
          battery:     p.item_battery    || '',
          processor:   p.item_processor  || '',
          os:          p.item_os         || '',
          stock:       parseInt(p.item_stock) || 0,
          category:    p.item_category   || 'smartphone',
          featured:    p.item_featured   === 1,
          onSale:      p.item_onsale     === 1,
        },
        { upsert: true, new: true }
      );
      prodCount++;
    } catch (e) {
      console.warn(`  ⚠  Skipped product "${p.item_name}": ${e.message}`);
    }
  }
  console.log(`  ✅  ${prodCount} products migrated`);

  // ── Accessories ───────────────────────────────────────
  console.log('🎧  Migrating accessories...');
  let accCount = 0;
  try {
    const [accs] = await mysql_conn.execute('SELECT * FROM accessories');
    for (const a of accs) {
      try {
        await Accessory.findOneAndUpdate(
          { name: a.acc_name },
          {
            name:        a.acc_name,
            category:    a.acc_category   || 'Cases',
            price:       parseFloat(a.acc_price)     || 0,
            oldPrice:    parseFloat(a.acc_old_price)  || null,
            image:       a.acc_image || 'assets/products/1.png',
            description: a.acc_description || '',
            stock:       parseInt(a.acc_stock) || 0,
            featured:    a.acc_featured === 1,
            onSale:      a.acc_onsale   === 1,
          },
          { upsert: true, new: true }
        );
        accCount++;
      } catch (e) {
        console.warn(`  ⚠  Skipped accessory "${a.acc_name}": ${e.message}`);
      }
    }
  } catch (e) {
    console.warn('  ⚠  No accessories table found, skipping');
  }
  console.log(`  ✅  ${accCount} accessories migrated`);

  // ── Blog Posts ────────────────────────────────────────
  console.log('📝  Migrating blog posts...');
  let blogCount = 0;
  try {
    const [posts] = await mysql_conn.execute('SELECT * FROM blog');
    for (const b of posts) {
      try {
        const slug = slugify(b.title, { lower: true, strict: true }) + '-' + Date.now();
        await Blog.findOneAndUpdate(
          { title: b.title },
          {
            title:   b.title,
            image:   b.image || 'assets/blog/blog1.jpg',
            content: b.content,
            slug,
          },
          { upsert: true, new: true }
        );
        blogCount++;
      } catch (e) {
        console.warn(`  ⚠  Skipped blog "${b.title}": ${e.message}`);
      }
    }
  } catch (e) {
    console.warn('  ⚠  No blog table found, skipping');
  }
  console.log(`  ✅  ${blogCount} blog posts migrated`);

  // ── Settings ──────────────────────────────────────────
  console.log('⚙️   Migrating settings...');
  let settingCount = 0;
  try {
    const [settings] = await mysql_conn.execute('SELECT * FROM settings');
    for (const s of settings) {
      try {
        await Setting.findOneAndUpdate(
          { key: s.setting_key },
          { key: s.setting_key, value: s.setting_value || '' },
          { upsert: true }
        );
        settingCount++;
      } catch (e) {}
    }
  } catch (e) {
    console.warn('  ⚠  No settings table found, skipping');
  }
  console.log(`  ✅  ${settingCount} settings migrated`);

  // ── Brands ────────────────────────────────────────────
  console.log('🏷️   Migrating brands...');
  let brandCount = 0;
  try {
    const [brands] = await mysql_conn.execute('SELECT * FROM brand');
    for (const b of brands) {
      try {
        await Brand.findOneAndUpdate(
          { name: b.brand_name },
          { name: b.brand_name, logo: b.brand_logo || null },
          { upsert: true }
        );
        brandCount++;
      } catch (e) {}
    }
  } catch (e) {
    console.warn('  ⚠  No brand table found, skipping');
  }
  console.log(`  ✅  ${brandCount} brands migrated`);

  // ── Coupons ───────────────────────────────────────────
  console.log('🎟️   Migrating coupons...');
  let couponCount = 0;
  try {
    const [coupons] = await mysql_conn.execute('SELECT * FROM coupons');
    for (const c of coupons) {
      try {
        await Coupon.findOneAndUpdate(
          { code: c.code },
          {
            code:      c.code,
            type:      c.type      || 'percent',
            value:     parseFloat(c.value)     || 10,
            minOrder:  parseFloat(c.min_order) || 0,
            maxUses:   parseInt(c.max_uses)    || 100,
            usedCount: parseInt(c.used_count)  || 0,
            expiresAt: c.expires_at || null,
            isActive:  c.is_active === 1,
          },
          { upsert: true }
        );
        couponCount++;
      } catch (e) {}
    }
  } catch (e) {
    console.warn('  ⚠  No coupons table found, skipping');
  }
  console.log(`  ✅  ${couponCount} coupons migrated`);

  await mysql_conn.end();
  await mongoose.disconnect();

  console.log('\n🎉  Migration complete!');
  console.log(`    Products:    ${prodCount}`);
  console.log(`    Accessories: ${accCount}`);
  console.log(`    Blog Posts:  ${blogCount}`);
  console.log(`    Settings:    ${settingCount}`);
  console.log(`    Brands:      ${brandCount}`);
  console.log(`    Coupons:     ${couponCount}`);
  console.log('\n✅  All your PHP data is now in MongoDB!\n');

  process.exit(0);
}

migrate().catch(err => {
  console.error('❌  Migration failed:', err.message);
  process.exit(1);
});
