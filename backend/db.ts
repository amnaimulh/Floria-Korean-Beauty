import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import {
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_IMAGES,
  SEED_PRODUCTS,
  SEED_REVIEWS,
} from './seedData.ts';

const dbDir = path.resolve(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'floria.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      whatsapp TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('customer', 'admin')) DEFAULT 'customer'
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      description TEXT NOT NULL,
      benefits TEXT NOT NULL DEFAULT '',
      ingredients TEXT NOT NULL DEFAULT '',
      skin_types TEXT NOT NULL DEFAULT '["All Skin Types"]',
      usage_instructions TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      original_price REAL,
      discount_percent INTEGER NOT NULL DEFAULT 0,
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
      is_active INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_bestseller INTEGER NOT NULL DEFAULT 0,
      is_new_arrival INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 1,
      rating REAL NOT NULL DEFAULT 5.0,
      review_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      whatsapp TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL,
      area TEXT NOT NULL,
      address TEXT NOT NULL,
      total_orders INTEGER NOT NULL DEFAULT 0,
      total_spent REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customer_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL DEFAULT 'Home',
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      district TEXT NOT NULL,
      area TEXT NOT NULL,
      address TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shipping_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      area_keywords TEXT NOT NULL DEFAULT '',
      charge REAL NOT NULL CHECK (charge >= 0),
      free_threshold REAL,
      estimated_days TEXT NOT NULL DEFAULT '2-4 business days',
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
      discount_value REAL NOT NULL CHECK (discount_value > 0),
      min_purchase REAL NOT NULL DEFAULT 0,
      max_uses INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      idempotency_key TEXT UNIQUE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL,
      area TEXT NOT NULL,
      address TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      internal_notes TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash on Delivery', 'WhatsApp Confirmation')),
      payment_status TEXT NOT NULL CHECK (payment_status IN ('Unpaid', 'Paid', 'Refunded')) DEFAULT 'Unpaid',
      order_status TEXT NOT NULL CHECK (order_status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')) DEFAULT 'Pending',
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      coupon_code TEXT,
      shipping_zone_id INTEGER REFERENCES shipping_zones(id) ON DELETE SET NULL,
      shipping_zone_name TEXT NOT NULL,
      shipping_charge REAL NOT NULL,
      total_amount REAL NOT NULL,
      stock_restored INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name TEXT NOT NULL,
      brand_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      image_url TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      line_total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupon_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      customer_phone TEXT NOT NULL,
      used_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      brand_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp_display TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      address TEXT NOT NULL,
      currency_code TEXT NOT NULL DEFAULT 'BDT',
      currency_symbol TEXT NOT NULL DEFAULT '৳',
      email TEXT NOT NULL,
      announcement_bar TEXT NOT NULL,
      announcement_bar_bn TEXT NOT NULL,
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      social_links TEXT NOT NULL,
      shipping_policy TEXT NOT NULL,
      return_policy TEXT NOT NULL,
      privacy_policy TEXT NOT NULL,
      terms_conditions TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS homepage_sections (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      config TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_email TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
  `);

  seedInitialData();
}

function seedInitialData(): void {
  const settingsCount = db.prepare('SELECT COUNT(*) AS count FROM store_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    db.prepare(`
      INSERT INTO store_settings (
        id, brand_name, tagline, phone, whatsapp_display, whatsapp_number, address,
        currency_code, currency_symbol, email, announcement_bar, announcement_bar_bn,
        seo_title, seo_description, social_links, shipping_policy, return_policy,
        privacy_policy, terms_conditions
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, 'BDT', '৳', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      'Floria Korean Beauty',
      'Curated Korean Skincare & Beauty Essentials',
      '01805-133476',
      '+880 1805-133476',
      '8801805133476',
      'Demra, Dhaka-1361, Bangladesh',
      'hello@floriakoreanbeauty.com',
      'Discover Your Perfect Korean Skincare Routine · Cash on Delivery Across Bangladesh',
      'আপনার ত্বকের জন্য সেরা কোরিয়ান স্কিনকেয়ার রুটিন খুঁজে নিন · সারা বাংলাদেশে ক্যাশ অন ডেলিভারি',
      'Floria Korean Beauty | Premium Korean Skincare in Bangladesh',
      'Discover Korean skincare and beauty essentials at Floria Korean Beauty. Explore cleansers, toners, serums, moisturizers, sunscreens, and more.',
      JSON.stringify({
        facebook: 'https://www.facebook.com/profile.php?id=61595783647973',
        linkedin: 'https://www.linkedin.com/in/floria-korean-beauty-888972450',
        twitter: 'https://x.com/floriabeauty',
        instagram: 'https://www.instagram.com/floriakoreanbeautyy',
        youtube: 'https://youtube.com/@floriakoreanbeauty',
        pinterest: 'https://pin.it/39LYJg837',
        tiktok: 'https://www.tiktok.com/@floriakoreanbeauty',
      }),
      'Inside Dhaka deliveries are typically completed within 1 to 3 business days (default sample charge ৳ 70). Outside Dhaka deliveries typically arrive within 3 to 5 business days (default sample charge ৳ 130). Cash on Delivery is available nationwide across Bangladesh.',
      'Unused and unopened items in original packaging may be requested for return or exchange within 7 days of delivery. Contact our customer support team on 01805-133476 or WhatsApp +880 1805-133476 with your order number.',
      'Floria Korean Beauty collects only the delivery, contact, and order details necessary to fulfill your order and provide customer support. We never sell or share your personal details with unauthorized third parties.',
      'All catalog prices in Bangladeshi Taka (৳) and stock figures are subject to availability. Orders placed via Cash on Delivery or WhatsApp Confirmation are verified prior to dispatch.'
    );
  }

  const homepageCount = db.prepare('SELECT COUNT(*) AS count FROM homepage_sections').get() as { count: number };
  if (homepageCount.count === 0) {
    db.prepare('INSERT INTO homepage_sections (id, config) VALUES (1, ?)').run(
      JSON.stringify({
        hero_title: 'Discover the Beauty of Korean Skincare',
        hero_title_bn: 'কোরিয়ান স্কিনকেয়ারের আসল সৌন্দর্য আবিষ্কার করুন',
        hero_subtitle:
          'Explore carefully curated Korean beauty essentials designed to complement your skincare journey and reveal your natural glow.',
        hero_subtitle_bn:
          'আপনার ত্বকের স্বাভাবিক উজ্জ্বলতা ফিরিয়ে আনতে যত্নসহকারে বাছাইকৃত কোরিয়ান স্কিনকেয়ার ও বিউটি এসেনশিয়ালস।',
        hero_image: SEED_IMAGES.hero,
        hero_primary_cta: 'SHOP NOW',
        hero_secondary_cta: 'EXPLORE COLLECTION',
        intro_title: 'Beauty Begins with the Right Skincare',
        intro_description:
          'Welcome to Floria Korean Beauty, your destination for discovering Korean skincare and beauty essentials. Explore thoughtfully selected products and find the routine that works for your skin.',
        editorial_title: 'Your Skin Deserves a Little More Love',
        editorial_subtitle:
          'Discover skincare essentials inspired by the innovation and thoughtful routines of Korean beauty.',
        editorial_image: SEED_IMAGES.editorial,
        editorial_cta: 'EXPLORE NOW',
        newsletter_title: 'A Little Beauty Inspiration in Your Inbox',
        newsletter_subtitle:
          'Receive curated Korean skincare routines, new arrival notes, and seasonal offers from Floria Korean Beauty.',
      })
    );
  }

  const zoneCount = db.prepare('SELECT COUNT(*) AS count FROM shipping_zones').get() as { count: number };
  if (zoneCount.count === 0) {
    const insertZone = db.prepare(
      'INSERT INTO shipping_zones (name, name_bn, area_keywords, charge, free_threshold, estimated_days, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)'
    );
    insertZone.run(
      'Inside Dhaka',
      'ঢাকার ভেতরে',
      'Dhaka,Demra,Savar,Keraniganj,Dhanmondi,Gulshan,Banani,Uttara,Mirpur',
      70,
      3000,
      '1-3 business days'
    );
    insertZone.run(
      'Outside Dhaka',
      'ঢাকার বাইরে',
      'Chattogram,Sylhet,Rajshahi,Khulna,Barishal,Rangpur,Mymensingh,Cumilla,Narayanganj,Gazipur,Bogura',
      130,
      4500,
      '3-5 business days'
    );
  }

  const couponCount = db.prepare('SELECT COUNT(*) AS count FROM coupons').get() as { count: number };
  if (couponCount.count === 0) {
    const insertCoupon = db.prepare(
      'INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_uses, is_active) VALUES (?, ?, ?, ?, ?, 1)'
    );
    insertCoupon.run('GLOW10', 'percentage', 10, 1000, 500);
    insertCoupon.run('FLORIA200', 'fixed', 200, 2000, 200);
  }

  const categoryCount = db.prepare('SELECT COUNT(*) AS count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const insertCat = db.prepare(
      'INSERT INTO categories (name, name_bn, slug, description, image_url, display_order, is_visible) VALUES (?, ?, ?, ?, ?, ?, 1)'
    );
    for (const c of SEED_CATEGORIES) {
      insertCat.run(c.name, c.name_bn, c.slug, c.description, c.image_url, c.display_order);
    }
  }

  const brandCount = db.prepare('SELECT COUNT(*) AS count FROM brands').get() as { count: number };
  if (brandCount.count === 0) {
    const insertBrand = db.prepare(
      'INSERT INTO brands (name, slug, logo_url, description) VALUES (?, ?, ?, ?)'
    );
    for (const b of SEED_BRANDS) {
      insertBrand.run(b.name, b.slug, '', b.description);
    }
  }

  const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    const getCat = db.prepare('SELECT id FROM categories WHERE slug = ?');
    const getBrand = db.prepare('SELECT id FROM brands WHERE name = ?');
    const insertProduct = db.prepare(`
      INSERT INTO products (
        name, slug, sku, brand_id, category_id, description, benefits, ingredients,
        skin_types, usage_instructions, image_url, price, original_price, discount_percent,
        stock_quantity, is_active, is_featured, is_bestseller, is_new_arrival, is_demo,
        rating, review_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 1, ?, ?)
    `);
    const insertGallery = db.prepare(
      'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)'
    );

    const tx = db.transaction(() => {
      for (const p of SEED_PRODUCTS) {
        const cat = getCat.get(p.category) as { id: number } | undefined;
        const brand = getBrand.get(p.brand) as { id: number } | undefined;
        if (!cat || !brand) continue;

        const res = insertProduct.run(
          p.name,
          p.slug,
          p.sku,
          brand.id,
          cat.id,
          p.description,
          p.benefits,
          p.ingredients,
          JSON.stringify(p.skin_types),
          p.usage_instructions,
          p.image_url,
          p.price,
          p.original_price,
          p.discount_percent,
          p.stock_quantity,
          p.is_featured ? 1 : 0,
          p.is_bestseller ? 1 : 0,
          p.is_new_arrival ? 1 : 0,
          p.rating,
          p.review_count
        );

        const productId = Number(res.lastInsertRowid);
        p.gallery_images.forEach((imgUrl, idx) => {
          insertGallery.run(productId, imgUrl, idx);
        });
      }
    });
    tx();
  }

  const reviewCount = db.prepare('SELECT COUNT(*) AS count FROM reviews').get() as { count: number };
  if (reviewCount.count === 0) {
    const getProd = db.prepare('SELECT id FROM products WHERE slug = ?');
    const insertReview = db.prepare(`
      INSERT INTO reviews (product_id, customer_name, rating, comment, status, is_demo, created_at)
      VALUES (?, ?, ?, ?, 'approved', 1, ?)
    `);
    for (const r of SEED_REVIEWS) {
      const prod = getProd.get(r.product_slug) as { id: number } | undefined;
      if (prod) {
        insertReview.run(prod.id, r.customer_name, r.rating, r.comment, r.created_at);
      }
    }
  }
}
