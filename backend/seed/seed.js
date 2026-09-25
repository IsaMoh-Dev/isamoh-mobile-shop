/**
 * Seed Script — Isa & Dagi Mobile Shop
 * ─────────────────────────────────────────────────────────────────────────────
 * Populates MongoDB with initial data that matches the original MySQL database.
 * Run once after setting up your .env:
 *
 *   node seed/seed.js
 *
 * Safe to re-run — uses upserts so it won't duplicate data.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');

const User    = require('../models/User');
const Brand   = require('../models/Brand');
const Setting = require('../models/Setting');
const Blog    = require('../models/Blog');
const Coupon  = require('../models/Coupon');
const slugify = require('slugify');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI not set in .env');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // ── Superadmin ─────────────────────────────────────────────────────────────
  const adminExists = await User.findOne({ email: 'admin@mobileshop.com' });
  if (!adminExists) {
    await User.create({
      firstName: 'Isa',
      lastName:  'Admin',
      email:     'admin@mobileshop.com',
      password:  'admin123',   // will be hashed by pre-save hook
      role:      'superadmin',
    });
    console.log('✅  Superadmin created  (email: admin@mobileshop.com  password: admin123)');
    console.log('⚠   Change the password immediately after first login!');
  } else {
    console.log('ℹ   Superadmin already exists — skipped');
  }

  // ── Brands ─────────────────────────────────────────────────────────────────
  const brands = ['Samsung','Apple','Redmi','Huawei','Tecno','Infinix','Nokia','Oppo','Vivo','OnePlus'];
  for (const name of brands) {
    await Brand.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
  }
  console.log(`✅  ${brands.length} brands seeded`);

  // ── Default Settings ───────────────────────────────────────────────────────
  const defaultSettings = [
    ['currency',            'USD'],
    ['usd_to_birr',         '57'],
    ['shop_name',           'Isa & Dagi Mobile Shop'],
    ['shop_phone',          '+251 929 346 248'],
    ['shop_email',          'isamohammedabere@gmail.com'],
    ['shop_address',        'Merkato, Samson Building, Addis Ababa'],
    ['shop_logo',           'assets/logo.svg'],
    ['telegram',            'isadagishop'],
    ['facebook',            'isadagishop'],
    ['instagram',           'isadagishop'],
    ['youtube',             'isadagishop'],
    ['tiktok',              ''],
    ['twitter',             ''],
    ['meta_description',    'Isa & Dagi Mobile Shop — Buy the latest smartphones and accessories in Addis Ababa, Ethiopia.'],
    ['meta_keywords',       'mobile shop, smartphones, Addis Ababa, Samsung, Apple, Redmi, Ethiopia'],
    ['delivery_fee',        '0'],
    ['free_delivery_above', '0'],
    ['delivery_areas',      'Addis Ababa'],
    ['delivery_note',       'Same-day delivery within Addis Ababa for orders before 2 PM.'],
    ['min_order_amount',    '0'],
    ['order_notify_email',  ''],
    ['order_auto_confirm',  '0'],
    ['maintenance_mode',    '0'],
    ['maintenance_message', "We're performing maintenance. We'll be back shortly!"],
    ['banner_1',            'assets/Banner1.png'],
    ['banner_2',            'assets/my_banner.png'],
    ['banner_3',            'assets/my_banner2.png'],
    ['banner_4',            'assets/my_banner3.png'],
    ['ad_banner_1',         'assets/banner1-cr-500x150.jpg'],
    ['ad_banner_2',         'assets/banner2-cr-500x150.jpg'],
  ];

  for (const [key, value] of defaultSettings) {
    await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true });
  }
  console.log(`✅  ${defaultSettings.length} settings seeded`);

  // ── Sample Blog Posts ──────────────────────────────────────────────────────
  const samplePosts = [
    {
      title:   'Top 5 Budget Smartphones in 2026',
      image:   'assets/blog/blog1.jpg',
      content: 'Looking for a great phone under $200? We review the top 5 budget smartphones available right now in Addis Ababa, including the Redmi 13C, Tecno Spark 20, and more.',
    },
    {
      title:   'Samsung vs Apple: Which is Right for You?',
      image:   'assets/blog/blog2.jpg',
      content: 'The age-old debate: Samsung or Apple? We break down the pros and cons of each brand to help you make the right choice for your needs and budget.',
    },
    {
      title:   'How to Protect Your Smartphone Screen',
      image:   'assets/blog/blog3.jpg',
      content: 'Screen repairs are expensive. Here are 5 simple tips to protect your phone screen and keep it looking brand new for longer.',
    },
  ];

  for (const post of samplePosts) {
    const slug = slugify(post.title, { lower: true, strict: true }) + '-' + Date.now();
    await Blog.findOneAndUpdate({ title: post.title }, { ...post, slug }, { upsert: true });
  }
  console.log(`✅  ${samplePosts.length} blog posts seeded`);

  // ── Sample Coupons ─────────────────────────────────────────────────────────
  const coupons = [
    { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 0,   maxUses: 100, isActive: true },
    { code: 'SAVE20',    type: 'fixed',   value: 20, minOrder: 100, maxUses: 50,  isActive: true },
    { code: 'BIRR100',   type: 'fixed',   value: 5,  minOrder: 50,  maxUses: 200, isActive: true },
  ];

  for (const c of coupons) {
    await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true });
  }
  console.log(`✅  ${coupons.length} coupons seeded`);

  console.log('\n🎉  Seed complete! Your MongoDB database is ready.');
  console.log('📌  Next step: Go to http://localhost:5173/admin and log in with admin@mobileshop.com / admin123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
