/**
 * Direct Data Import from shopee(4).sql → MongoDB
 * No MySQL needed — data is hardcoded from the SQL file.
 * Run: node seed/import_data.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8','8.8.4.4','1.1.1.1']);

const mongoose  = require('mongoose');
const slugify   = require('slugify');
const Product   = require('../models/Product');
const Accessory = require('../models/Accessory');
const Blog      = require('../models/Blog');
const Setting   = require('../models/Setting');
const Brand     = require('../models/Brand');
const Coupon    = require('../models/Coupon');

// ── RAW DATA FROM shopee(4).sql ───────────────────────────────────

const PRODUCTS = [
  { brand:'Samsung', name:'Samsung Galaxy S24 Ultra', price:1299, oldPrice:1419, image:'./assets/products/product_1777667268.jpg', image2:'./assets/products/product_1777669718_2.jpg', image3:'./assets/products/product_1777669718_3.jpg', description:'The ultimate Galaxy Ultra experience with a Titanium frame, built-in S Pen, and revolutionary Galaxy AI features.', ram:'12GB', storage:'256GB', display:'6.8" Dynamic LTPO AMOLED 2X, 120Hz, HDR10+', camera:'200MP + 50MP + 10MP + 12MP', battery:'5000mAh, 45W wired charging', processor:'Snapdragon 8 Gen 3 for Galaxy', os:'Android 14, One UI 6.1', stock:20, featured:true, onSale:true },
  { brand:'Samsung', name:'Samsung Galaxy S24 Ultra 1TB', price:1659, oldPrice:1779, image:'./assets/products/product_1777667591.jpg', image2:'./assets/products/product_1777672452_2.jpg', image3:'./assets/products/product_1777672452_3.jpg', description:'The highest tier available. Maximum storage for creators and professionals who need an entire workstation in their pocket.', ram:'12GB', storage:'1TB (1024GB)', display:'6.8" Dynamic LTPO AMOLED 2X, 120Hz, Corning Gorilla Armor', camera:'200MP + 50MP + 10MP + 12MP', battery:'5000mAh, 45W wired charging', processor:'Snapdragon 8 Gen 3 for Galaxy', os:'Android 14, One UI 6.1', stock:11, featured:true, onSale:true },
  { brand:'Samsung', name:'Samsung Galaxy S24 Ultra 512GB', price:1419, oldPrice:1539, image:'./assets/products/product_1777667858.jpg', image2:'./assets/products/product_1777672498_2.jpg', image3:'./assets/products/product_1777672498_3.jpg', description:'Power user edition with double the storage for high-resolution 8K videos and professional photography. Includes Galaxy AI.', ram:'12GB', storage:'512GB', display:'6.8" Dynamic LTPO AMOLED 2X, 120Hz, 2600 nits', camera:'200MP + 50MP + 10MP + 12MP', battery:'5000mAh, 45W wired charging', processor:'Snapdragon 8 Gen 3 for Galaxy', os:'Android 14, One UI 6.1', stock:133, featured:true, onSale:false },
  { brand:'Apple', name:'iPhone 16 Pro (128GB)', price:999, oldPrice:1099, image:'./assets/products/product_1777680638_item_image.jpg', image2:'./assets/products/product_1777680638_item_image2.jpg', image3:'./assets/products/product_1777680638_item_image3.jpg', description:'Features a 6.3-inch display and the powerful A18 Pro chip. Built with a Titanium frame and the new Camera Control button.', ram:'8GB LPDDR5X', storage:'128GB', display:'6.3" LTPO OLED, 120Hz ProMotion', camera:'48MP (Wide) + 48MP (Ultrawide) + 12MP (5x Telephoto)', battery:'3582mAh, MagSafe wireless charging', processor:'Apple A18 Pro', os:'iOS 18', stock:145, featured:true, onSale:true },
  { brand:'Tecno', name:'Tecno Camon 40 Pro 5G', price:230, oldPrice:280, image:'./assets/products/product_1777681270_item_image.jpg', image2:'./assets/products/product_1777681270_item_image2.jpg', image3:'./assets/products/product_1777681270_item_image3.jpg', description:'A stylish 5G smartphone featuring a 144Hz AMOLED curved display and a pro-grade 50MP Sony LYT-700C main camera with OIS.', ram:'8GB', storage:'256GB UFS 2.2', display:'6.78" FHD+ AMOLED, 144Hz', camera:'50MP (Main) + 8MP (Ultrawide) | 50MP Front', battery:'5200mAh, 45W Super Charge', processor:'MediaTek Dimensity 7300 Ultimate (4nm)', os:'Android 15, HIOS 15', stock:143, featured:true, onSale:true },
  { brand:'Samsung', name:'Samsung Galaxy A17 5G', price:277, oldPrice:299, image:'./assets/products/product_1777704701_item_image.jpg', image2:'./assets/products/product_1777704701_item_image2.jpg', image3:'./assets/products/product_1777704701_item_image3.jpg', description:'A sleek, slim 5G smartphone featuring a 6.7" Super AMOLED display and a triple camera system with OIS for clear night photos.', ram:'4GB', storage:'128GB', display:'6.7" Super AMOLED, 90Hz, FHD+', camera:'50MP (Main) + 5MP (Ultrawide) + 2MP (Macro)', battery:'5000mAh, 25W Fast Charging', processor:'Exynos 1330 Octa-Core', os:'Android 15, One UI 7.0', stock:43, featured:true, onSale:true },
  { brand:'Huawei', name:'Huawei Nova 12 Pro', price:549, oldPrice:610, image:'./assets/products/product_1777705398_item_image.jpg', image2:'./assets/products/product_1777705398_item_image2.jpg', image3:'./assets/products/product_1777705398_item_image3.jpg', description:'A stylish 5G flagship featuring a dual-punch hole 120Hz LTPO OLED display and professional-grade variable aperture photography.', ram:'12GB', storage:'256GB', display:'6.76" LTPO OLED, 120Hz', camera:'50MP Main (f/1.4-f/4.0) + 8MP Ultrawide | 60MP + 8MP Front', battery:'4600mAh, 100W SuperCharge', processor:'Kirin 9000S (7nm)', os:'HarmonyOS 4', stock:44, featured:true, onSale:true },
  { brand:'Xiaomi', name:'Redmi Note 15 Pro', price:380, oldPrice:420, image:'./assets/products/product_1778010734_item_image.jpg', image2:'./assets/products/product_1778010734_item_image2.jpg', image3:'./assets/products/product_1778010734_item_image3.jpg', description:'Mid-range smartphone with powerful performance, large AMOLED display, long battery life, and high-resolution camera.', ram:'8GB / 12GB', storage:'256GB / 512GB', display:'6.8" AMOLED, 120Hz', camera:'200MP + 8MP (Ultra-wide)', battery:'6500mAh, 45W fast charging', processor:'MediaTek Dimensity 7400 Ultra', os:'Android 15', stock:128, featured:true, onSale:true },
  { brand:'Huawei', name:'Huawei Nova 8', price:400, oldPrice:450, image:'./assets/products/product_1778011284_item_image.jpg', image2:'./assets/products/product_1778011284_item_image2.jpg', image3:'./assets/products/product_1778011284_item_image3.jpg', description:'Stylish mid-range smartphone with curved OLED display, fast charging, and strong camera performance.', ram:'8GB', storage:'128GB / 256GB', display:'6.57" OLED, 90Hz', camera:'64MP + 8MP + 2MP + 2MP', battery:'3800mAh, 66W fast charging', processor:'Kirin 820E', os:'Android (EMUI 12)', stock:84, featured:false, onSale:true },
  { brand:'Infinix', name:'Infinix Hot 111', price:140, oldPrice:170, image:'./assets/products/product_1778011782_item_image.jpg', image2:'./assets/products/product_1778011782_item_image2.jpg', image3:'./assets/products/product_1778011782_item_image3.jpg', description:'Affordable smartphone with large display, long-lasting battery, and decent performance for daily use and light gaming.', ram:'4GB', storage:'64GB / 128GB', display:'6.6" IPS LCD, FHD+', camera:'13MP + AI Lens', battery:'5200mAh', processor:'MediaTek Helio G70', os:'Android 11 (XOS 7.6)', stock:97, featured:true, onSale:true },
  { brand:'Nokia', name:'Nokia 6600', price:70, oldPrice:115, image:'./assets/products/product_1778012235_item_image.jpg', image2:'./assets/products/product_1778012235_item_image2.jpg', image3:'./assets/products/product_1778012235_item_image3.jpg', description:"Classic smartphone from Nokia with iconic design and durable build. A collector's device and vintage tech favorite.", ram:'6MB', storage:'MMC card support', display:'2.16" TFT, 176×208', camera:'0.3MP (VGA)', battery:'850–1020mAh', processor:'104 MHz', os:'Symbian OS 7 (Series 60)', stock:40, featured:false, onSale:false },
  { brand:'Vivo', name:'Vivo X300 Pro', price:750, oldPrice:820, image:'./assets/products/product_1778012544_item_image.jpg', image2:'./assets/products/product_1778012544_item_image2.jpg', image3:'./assets/products/product_1778012544_item_image3.jpg', description:'Premium flagship smartphone focused on professional photography, ultra-fast performance, and long battery life.', ram:'12GB / 16GB', storage:'256GB / 512GB / 1TB', display:'6.78" LTPO AMOLED, 120Hz', camera:'50MP (Main) + 200MP (Telephoto) + 50MP (Ultra-wide)', battery:'6510mAh, 90W fast charging + 40W wireless', processor:'MediaTek Dimensity 9500 (3nm)', os:'Android 16 (OriginOS)', stock:98, featured:false, onSale:false },
];

const ACCESSORIES = [
  { name:'TWS Wireless Buds with LED Display', category:'Earphones', price:29.99, oldPrice:45.00, image:'./assets/products/acc_1777672843.jpg', description:'Compact earbuds with high-fidelity sound. Features a digital LED power indicator. Ergonomic fit with smart touch controls.', stock:56, featured:true, onSale:true },
  { name:'20,000mAh Multi-Cable Power Bank', category:'Powerbanks', price:35.00, oldPrice:49.00, image:'./assets/products/acc_1777673412.jpg', description:'High-capacity portable charger with integrated cables. LED screen shows exact battery percentage. Slim design for fast, multi-device charging.', stock:140, featured:true, onSale:true },
  { name:'48W Dual-Port Fast Charger', category:'Chargers', price:18.00, oldPrice:25.00, image:'./assets/products/acc_1777673704.jpg', description:'High-speed wall adapter for efficient multi-device charging. 48W PD Power. Dual USB-C and USB-A ports. Compact travel-ready design.', stock:250, featured:true, onSale:true },
  { name:'Premium Silicone Matte Case for iPhone', category:'Cases', price:12.00, oldPrice:15.00, image:'./assets/products/acc_1778013451.jpg', description:'Durable soft-touch silicone case with microfiber lining. Raised edges for screen and camera protection. Sleek matte finish that resists fingerprints.', stock:190, featured:true, onSale:true },
  { name:'Character Series Graphic Phone Case', category:'Cases', price:13.00, oldPrice:14.00, image:'./assets/products/acc_1778013556.jpg', description:'High-quality protective cases featuring vibrant Sanrio, Minions, and fan-favorite character designs. Slim-fit with impact resistance.', stock:140, featured:true, onSale:false },
  { name:'Redragon H510 Zeus Wired Gaming Headset', category:'Earphones', price:42.00, oldPrice:59.00, image:'./assets/products/acc_1778013733.jpg', description:'Professional gaming headset with 7.1 Surround Sound, detachable noise-canceling microphone, premium memory foam ear pads and steel frame.', stock:120, featured:true, onSale:true },
  { name:'ZT Plus Hi-Fi Bass Wired Earphones', category:'Earphones', price:8.00, oldPrice:12.00, image:'./assets/products/acc_1778013894.png', description:'High-performance wired earphones with ergonomic in-ear design, gold-plated 3.5mm L-shape jack, and in-line microphone for hands-free calling.', stock:100, featured:true, onSale:true },
  { name:'Smartwatch', category:'Other', price:44.00, oldPrice:52.00, image:'./assets/products/acc_1778014197.jpg', description:'Versatile smartwatch with vibrant touch display, real-time heart rate monitoring, multiple sport modes, and long battery life. Water-resistant.', stock:48, featured:false, onSale:true },
  { name:'3-in-1 Universal Smartphone Lens Kit', category:'Other', price:12.00, oldPrice:18.00, image:'./assets/products/acc_1778014265.jpg', description:'Enhance mobile photography with clip-on Wide-Angle, Macro, and Fisheye lenses. Compatible with most single-lens smartphones.', stock:78, featured:true, onSale:true },
  { name:'Universal USB Fast Charging Wall Adapter', category:'Chargers', price:10.00, oldPrice:13.00, image:'./assets/products/acc_1778014463.jpg', description:'Reliable compact USB wall adapter for smartphones and tablets. Built-in safety protections. Available in various plug types.', stock:250, featured:true, onSale:false },
  { name:'20,000mAh High-Capacity Fast Charging Power Bank', category:'Powerbanks', price:25.00, oldPrice:35.00, image:'./assets/products/acc_1778014659.jpg', description:'High-capacity portable charger with multiple USB ports, integrated LED digital display, and advanced safety technology. Travel-friendly.', stock:180, featured:true, onSale:true },
];

const BLOGS = [
  { title:'Honor Magic6 Series: A New Standard for Flagship Performance', image:'assets/blog/blog_1777672007.jpg', content:'The smartphone landscape just got more exciting with the official arrival of the Honor Magic6 series.\n\nKey Highlights:\n\nNext-Gen Falcon Camera System: Capture professional-grade photos with enhanced AI motion sensing, perfect for high-speed action.\n\nIndustry-Leading Brightness: The LTPO display offers incredible peak brightness and 4320Hz PWM dimming to ensure eye comfort even during long sessions.\n\nSnapdragon 8 Gen 3 Power: Experience seamless multitasking and elite gaming performance powered by the latest flagship silicon.\n\nSilicon-Carbon Battery: Stay powered longer with innovative high-density battery tech that performs reliably even in cold temperatures.\n\nWhether you are a mobile photographer or a power user, the Honor Magic6 series offers a premium experience that is hard to beat.' },
  { title:'Motorola Razr+ (2024): The Ultimate Fusion of Style and Function', image:'assets/blog/blog_1777672328.jpg', content:"The foldable revolution is here, and the new Motorola Razr+ is leading the charge with a design that is as functional as it is beautiful.\n\nWhy the Razr+ Stands Out:\n\nMassive External Display: Use almost any app without even opening your phone thanks to the largest, most immersive cover screen in its class.\n\nIconic Flip Design: Enjoy the nostalgia of a compact flip phone combined with a stunning, seamless internal pOLED display when unfolded.\n\nFlex View Mode: Stand the phone up on its own to take high-quality selfies, make video calls, or watch content hands-free.\n\nAll-Day Performance: Packed with a high-performance processor and optimized battery life to keep you connected from morning to night." },
];

const BRANDS = ['Samsung','Apple','Huawei','Tecno','Infinix','Nokia','Oppo','Vivo','OnePlus','Xiaomi'];

const SETTINGS = {
  ad_banner_1:'assets/banner1-cr-500x150.jpg', ad_banner_2:'assets/banner2-cr-500x150.jpg',
  banner_1:'assets/banner_1_1778015762.png', banner_2:'assets/banner_2_1778015762.jpg',
  banner_3:'', banner_4:'assets/banner_4_1778015882.png',
  currency:'USD', delivery_areas:'Addis Ababa', delivery_fee:'0',
  delivery_note:'Same-day delivery within Addis Ababa for orders before 2 PM.',
  facebook:'isadagishop', free_delivery_above:'0', instagram:'isadagishop',
  maintenance_message:"We are currently performing maintenance. We'll be back shortly!",
  maintenance_mode:'0', meta_description:'Isa & Dagi Mobile Shop — Buy the latest smartphones and accessories in Addis Ababa, Ethiopia.',
  meta_keywords:'mobile shop, smartphones, Addis Ababa, Samsung, Apple, Redmi, Ethiopia',
  min_order_amount:'0', order_auto_confirm:'0', order_notify_email:'',
  shop_address:'Merkato, Samson Building, Addis Ababa',
  shop_email:'isamohammedabere@gmail.com', shop_logo:'assets/logo.svg',
  shop_name:'Isa & Dagi Mobile Shop', shop_phone:'+251 929 346 248',
  telegram:'techspiretube', tiktok:'isadagishop', twitter:'isadagishop',
  usd_to_birr:'150', youtube:'techspiretube',
};

const COUPONS = [
  { code:'ISACOUPON', type:'percent', value:5,  minOrder:1,  maxUses:100, usedCount:0, isActive:true },
  { code:'WELCOME1',  type:'percent', value:10, minOrder:18, maxUses:300, usedCount:0, expiresAt:'2026-12-31', isActive:true },
];

// ── MAIN ─────────────────────────────────────────────────────────
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  MongoDB connected\n');

  // Products
  let pc = 0;
  for (const p of PRODUCTS) {
    await Product.findOneAndUpdate({ name: p.name, brand: p.brand }, p, { upsert:true, new:true });
    pc++;
  }
  console.log(`✅  ${pc} products imported`);

  // Accessories
  let ac = 0;
  for (const a of ACCESSORIES) {
    await Accessory.findOneAndUpdate({ name: a.name }, a, { upsert:true, new:true });
    ac++;
  }
  console.log(`✅  ${ac} accessories imported`);

  // Blog
  let bc = 0;
  for (const b of BLOGS) {
    const slug = slugify(b.title, { lower:true, strict:true }) + '-' + Date.now();
    await Blog.findOneAndUpdate({ title: b.title }, { ...b, slug }, { upsert:true, new:true });
    bc++;
  }
  console.log(`✅  ${bc} blog posts imported`);

  // Brands
  let brc = 0;
  for (const name of BRANDS) {
    await Brand.findOneAndUpdate({ name }, { name }, { upsert:true, new:true });
    brc++;
  }
  console.log(`✅  ${brc} brands imported`);

  // Settings
  let sc = 0;
  for (const [key, value] of Object.entries(SETTINGS)) {
    await Setting.findOneAndUpdate({ key }, { key, value: String(value) }, { upsert:true });
    sc++;
  }
  console.log(`✅  ${sc} settings imported`);

  // Coupons
  let cc = 0;
  for (const c of COUPONS) {
    await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert:true, new:true });
    cc++;
  }
  console.log(`✅  ${cc} coupons imported`);

  console.log('\n🎉  All data from shopee(4).sql imported successfully!');
  console.log('    Open http://localhost:5173 to see your shop.\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error('❌  Import failed:', err.message); process.exit(1); });
