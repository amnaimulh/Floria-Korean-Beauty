import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { db } from './db.ts';
import {
  type AuthenticatedRequest,
  hashPassword,
  isSafeUrl,
  isValidBdPhone,
  normalizeBdPhone,
  optionalAuth,
  rateLimit,
  requireAdmin,
  requireAuth,
  resolveSafeUploadPath,
  signAuthToken,
  slugify,
  verifyPassword,
} from './security.ts';

export const apiRouter = express.Router();

const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function logAdminActivity(
  adminEmail: string,
  action: string,
  entityType: string,
  entityId: string | number,
  details: string
): void {
  db.prepare(
    'INSERT INTO admin_activity_logs (admin_email, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
  ).run(adminEmail, action, entityType, String(entityId), details);
}

interface RawProductRow {
  id: number;
  name: string;
  slug: string;
  sku: string;
  brand_id: number;
  brand_name: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  description: string;
  benefits: string;
  ingredients: string;
  skin_types: string;
  usage_instructions: string;
  image_url: string;
  price: number;
  original_price: number | null;
  discount_percent: number;
  stock_quantity: number;
  is_active: number;
  is_featured: number;
  is_bestseller: number;
  is_new_arrival: number;
  is_demo: number;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

function hydrateProduct(row: RawProductRow) {
  const gallery = db
    .prepare('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC')
    .all(row.id) as { image_url: string }[];
  let skinTypes: string[] = ['All Skin Types'];
  try {
    const parsed = JSON.parse(row.skin_types);
    if (Array.isArray(parsed)) skinTypes = parsed;
  } catch {
    skinTypes = ['All Skin Types'];
  }
  return {
    ...row,
    skin_types: skinTypes,
    gallery_images: gallery.length > 0 ? gallery.map((g) => g.image_url) : [row.image_url],
    is_active: Boolean(row.is_active),
    is_featured: Boolean(row.is_featured),
    is_bestseller: Boolean(row.is_bestseller),
    is_new_arrival: Boolean(row.is_new_arrival),
    is_demo: Boolean(row.is_demo),
  };
}

function getSettingsAndHomepage() {
  const settingsRow = db.prepare('SELECT * FROM store_settings WHERE id = 1').get() as Record<string, unknown>;
  const homepageRow = db.prepare('SELECT config FROM homepage_sections WHERE id = 1').get() as {
    config: string;
  };
  return {
    settings: {
      ...settingsRow,
      social_links: JSON.parse(String(settingsRow.social_links || '{}')),
    },
    homepage: JSON.parse(homepageRow.config || '{}'),
  };
}

// ============================================================
// PUBLIC STOREFRONT ROUTES
// ============================================================

apiRouter.get('/storefront/bootstrap', (_req, res) => {
  const { settings, homepage } = getSettingsAndHomepage();
  const categories = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
       FROM categories c WHERE c.is_visible = 1 ORDER BY c.display_order ASC, c.id ASC`
    )
    .all() as Record<string, unknown>[];
  const categoriesMapped = categories.map((c) => ({ ...c, is_visible: Boolean(c.is_visible) }));

  const brands = db
    .prepare(
      `SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.is_active = 1) AS product_count
       FROM brands b ORDER BY b.name ASC`
    )
    .all();

  const shippingZones = db
    .prepare('SELECT * FROM shipping_zones WHERE is_active = 1 ORDER BY id ASC')
    .all() as Record<string, unknown>[];
  const shippingZonesMapped = shippingZones.map((z) => ({ ...z, is_active: Boolean(z.is_active) }));

  const rawProducts = db
    .prepare(
      `SELECT p.*, b.name AS brand_name, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1
       ORDER BY p.is_featured DESC, p.id ASC`
    )
    .all() as RawProductRow[];

  const reviews = db
    .prepare(
      `SELECT r.id, r.product_id, p.name AS product_name, r.customer_name, r.rating, r.comment, r.status, r.is_demo, r.created_at
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       WHERE r.status = 'approved'
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 12`
    )
    .all() as Record<string, unknown>[];
  const reviewsMapped = reviews.map((r) => ({ ...r, is_demo: Boolean(r.is_demo) }));

  res.json({
    settings,
    homepage,
    categories: categoriesMapped,
    brands,
    shippingZones: shippingZonesMapped,
    products: rawProducts.map(hydrateProduct),
    reviews: reviewsMapped,
  });
});

apiRouter.get('/products', (req, res) => {
  const { category, brand, search, skinType, bestseller, newArrival, discounted, inStock, minPrice, maxPrice, sort } =
    req.query;

  const conditions: string[] = ['p.is_active = 1'];
  const params: (string | number)[] = [];

  if (typeof category === 'string' && category.trim()) {
    conditions.push('c.slug = ?');
    params.push(category.trim());
  }
  if (typeof brand === 'string' && brand.trim()) {
    conditions.push('b.slug = ?');
    params.push(brand.trim());
  }
  if (typeof search === 'string' && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    conditions.push('(LOWER(p.name) LIKE ? OR LOWER(b.name) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(p.ingredients) LIKE ?)');
    params.push(q, q, q, q);
  }
  if (typeof skinType === 'string' && skinType.trim() && skinType !== 'All') {
    conditions.push('p.skin_types LIKE ?');
    params.push(`%${skinType.trim()}%`);
  }
  if (bestseller === 'true') conditions.push('p.is_bestseller = 1');
  if (newArrival === 'true') conditions.push('p.is_new_arrival = 1');
  if (discounted === 'true') conditions.push('p.discount_percent > 0');
  if (inStock === 'true') conditions.push('p.stock_quantity > 0');
  if (typeof minPrice === 'string' && !Number.isNaN(Number(minPrice))) {
    conditions.push('p.price >= ?');
    params.push(Number(minPrice));
  }
  if (typeof maxPrice === 'string' && !Number.isNaN(Number(maxPrice))) {
    conditions.push('p.price <= ?');
    params.push(Number(maxPrice));
  }

  let orderBy = 'p.is_featured DESC, p.id ASC';
  switch (sort) {
    case 'newest':
      orderBy = 'p.created_at DESC, p.id DESC';
      break;
    case 'price_asc':
      orderBy = 'p.price ASC';
      break;
    case 'price_desc':
      orderBy = 'p.price DESC';
      break;
    case 'rating':
      orderBy = 'p.rating DESC, p.review_count DESC';
      break;
    case 'popular':
      orderBy = 'p.review_count DESC, p.is_bestseller DESC';
      break;
  }

  const rows = db
    .prepare(
      `SELECT p.*, b.name AS brand_name, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy}`
    )
    .all(...params) as RawProductRow[];

  res.json({ products: rows.map(hydrateProduct) });
});

apiRouter.get('/products/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  const row = db
    .prepare(
      `SELECT p.*, b.name AS brand_name, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       WHERE (p.slug = ? OR CAST(p.id AS TEXT) = ?) AND p.is_active = 1`
    )
    .get(slugOrId, slugOrId) as RawProductRow | undefined;

  if (!row) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const product = hydrateProduct(row);
  const reviews = (
    db
      .prepare(
        `SELECT id, product_id, customer_name, rating, comment, status, is_demo, created_at
         FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC, id DESC`
      )
      .all(row.id) as Record<string, unknown>[]
  ).map((r) => ({ ...r, is_demo: Boolean(r.is_demo) }));

  const related = (
    db
      .prepare(
        `SELECT p.*, b.name AS brand_name, c.name AS category_name, c.slug AS category_slug
         FROM products p
         JOIN brands b ON b.id = p.brand_id
         JOIN categories c ON c.id = p.category_id
         WHERE p.is_active = 1 AND p.id != ? AND (p.category_id = ? OR p.brand_id = ?)
         ORDER BY p.is_bestseller DESC LIMIT 4`
      )
      .all(row.id, row.category_id, row.brand_id) as RawProductRow[]
  ).map(hydrateProduct);

  res.json({ product, reviews, related });
});

apiRouter.post('/reviews', rateLimit('reviews', 10, 60_000), optionalAuth, (req: AuthenticatedRequest, res) => {
  const { product_id, customer_name, rating, comment } = req.body ?? {};
  const pid = Number(product_id);
  const score = Number(rating);
  if (!pid || !Number.isInteger(score) || score < 1 || score > 5) {
    res.status(400).json({ error: 'Please provide a valid rating between 1 and 5.' });
    return;
  }
  if (typeof customer_name !== 'string' || customer_name.trim().length < 2) {
    res.status(400).json({ error: 'Please enter your name.' });
    return;
  }
  if (typeof comment !== 'string' || comment.trim().length < 5) {
    res.status(400).json({ error: 'Please write a short review (at least 5 characters).' });
    return;
  }
  const product = db.prepare('SELECT id FROM products WHERE id = ? AND is_active = 1').get(pid);
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  db.prepare(
    `INSERT INTO reviews (product_id, user_id, customer_name, rating, comment, status, is_demo)
     VALUES (?, ?, ?, ?, ?, 'pending', 0)`
  ).run(pid, req.auth?.userId ?? null, customer_name.trim().slice(0, 80), score, comment.trim().slice(0, 800));

  res.status(201).json({
    message: 'Thank you! Your review has been submitted and is awaiting moderation.',
  });
});

apiRouter.post('/coupons/validate', (req, res) => {
  const { code, subtotal } = req.body ?? {};
  if (typeof code !== 'string' || !code.trim()) {
    res.status(400).json({ error: 'Please enter a coupon code.' });
    return;
  }
  const cleanCode = code.trim().toUpperCase();
  const coupon = db
    .prepare('SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1')
    .get(cleanCode) as
    | {
        id: number;
        code: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        min_purchase: number;
        max_uses: number | null;
        used_count: number;
        expires_at: string | null;
      }
    | undefined;

  if (!coupon) {
    res.status(404).json({ error: 'Coupon code is invalid or inactive.' });
    return;
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    res.status(400).json({ error: 'This coupon has expired.' });
    return;
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    res.status(400).json({ error: 'This coupon has reached its usage limit.' });
    return;
  }
  const numericSubtotal = Number(subtotal || 0);
  if (numericSubtotal < coupon.min_purchase) {
    res.status(400).json({
      error: `Minimum purchase of ৳ ${coupon.min_purchase.toLocaleString()} required for ${coupon.code}.`,
    });
    return;
  }

  const discountAmount =
    coupon.discount_type === 'percentage'
      ? Math.round((numericSubtotal * coupon.discount_value) / 100)
      : Math.min(numericSubtotal, coupon.discount_value);

  res.json({
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: discountAmount,
  });
});

apiRouter.post('/orders', rateLimit('orders', 15, 60_000), optionalAuth, (req: AuthenticatedRequest, res) => {
  const {
    customer_name,
    phone,
    whatsapp,
    email,
    district,
    area,
    address,
    notes,
    payment_method,
    shipping_zone_id,
    coupon_code,
    items,
    idempotency_key,
  } = req.body ?? {};

  if (typeof customer_name !== 'string' || customer_name.trim().length < 2) {
    res.status(400).json({ error: 'Please enter your full name.' });
    return;
  }
  if (typeof phone !== 'string' || !isValidBdPhone(phone)) {
    res.status(400).json({ error: 'Please enter a valid Bangladeshi mobile number (e.g. 01805-133476).' });
    return;
  }
  if (typeof district !== 'string' || !district.trim() || typeof area !== 'string' || !area.trim()) {
    res.status(400).json({ error: 'Please provide your delivery district and area / thana.' });
    return;
  }
  if (typeof address !== 'string' || address.trim().length < 5) {
    res.status(400).json({ error: 'Please provide your complete delivery address.' });
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Your shopping cart is empty.' });
    return;
  }
  const chosenPayment =
    payment_method === 'WhatsApp Confirmation' ? 'WhatsApp Confirmation' : 'Cash on Delivery';

  const cleanPhone = normalizeBdPhone(phone);
  const cleanWhatsapp =
    typeof whatsapp === 'string' && whatsapp.trim() ? normalizeBdPhone(whatsapp) : cleanPhone;

  // Idempotency / duplicate submission check
  if (typeof idempotency_key === 'string' && idempotency_key.trim()) {
    const existingOrder = db
      .prepare('SELECT * FROM orders WHERE idempotency_key = ?')
      .get(idempotency_key.trim()) as Record<string, unknown> | undefined;
    if (existingOrder) {
      const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(existingOrder.id);
      res.status(200).json({ order: { ...existingOrder, items: orderItems } });
      return;
    }
  }

  try {
    const createdOrder = db.transaction(() => {
      let subtotal = 0;
      const verifiedItems: Array<{
        product_id: number;
        product_name: string;
        brand_name: string;
        sku: string;
        image_url: string;
        unit_price: number;
        quantity: number;
        line_total: number;
      }> = [];

      for (const reqItem of items) {
        const pid = Number(reqItem?.product_id);
        const qty = Number(reqItem?.quantity);
        if (!Number.isInteger(pid) || !Number.isInteger(qty) || qty <= 0 || qty > 50) {
          throw new Error('INVALID_ITEM');
        }
        const product = db
          .prepare(
            `SELECT p.id, p.name, p.sku, p.image_url, p.price, p.stock_quantity, p.is_active, b.name AS brand_name
             FROM products p JOIN brands b ON b.id = p.brand_id WHERE p.id = ?`
          )
          .get(pid) as
          | {
              id: number;
              name: string;
              sku: string;
              image_url: string;
              price: number;
              stock_quantity: number;
              is_active: number;
              brand_name: string;
            }
          | undefined;

        if (!product || !product.is_active) {
          throw new Error(`UNAVAILABLE:${pid}`);
        }
        if (product.stock_quantity < qty) {
          throw new Error(`OUT_OF_STOCK:${product.name}:${product.stock_quantity}`);
        }

        const lineTotal = Math.round(product.price * qty);
        subtotal += lineTotal;
        verifiedItems.push({
          product_id: product.id,
          product_name: product.name,
          brand_name: product.brand_name,
          sku: product.sku,
          image_url: product.image_url,
          unit_price: product.price,
          quantity: qty,
          line_total: lineTotal,
        });
      }

      // Coupon recalculation on server
      let discountAmount = 0;
      let appliedCouponCode: string | null = null;
      let appliedCouponId: number | null = null;

      if (typeof coupon_code === 'string' && coupon_code.trim()) {
        const coupon = db
          .prepare('SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1')
          .get(coupon_code.trim().toUpperCase()) as
          | {
              id: number;
              code: string;
              discount_type: 'percentage' | 'fixed';
              discount_value: number;
              min_purchase: number;
              max_uses: number | null;
              used_count: number;
              expires_at: string | null;
            }
          | undefined;

        if (
          coupon &&
          (!coupon.expires_at || new Date(coupon.expires_at).getTime() >= Date.now()) &&
          (coupon.max_uses === null || coupon.used_count < coupon.max_uses) &&
          subtotal >= coupon.min_purchase
        ) {
          appliedCouponCode = coupon.code;
          appliedCouponId = coupon.id;
          discountAmount =
            coupon.discount_type === 'percentage'
              ? Math.round((subtotal * coupon.discount_value) / 100)
              : Math.min(subtotal, coupon.discount_value);
        }
      }

      // Shipping zone calculation on server
      let zone = db
        .prepare('SELECT * FROM shipping_zones WHERE id = ? AND is_active = 1')
        .get(Number(shipping_zone_id || 0)) as
        | { id: number; name: string; charge: number; free_threshold: number | null }
        | undefined;

      if (!zone) {
        const isDhaka = district.trim().toLowerCase() === 'dhaka';
        zone = (db
          .prepare('SELECT * FROM shipping_zones WHERE is_active = 1 AND LOWER(name) LIKE ? LIMIT 1')
          .get(isDhaka ? '%inside dhaka%' : '%outside dhaka%') ||
          db.prepare('SELECT * FROM shipping_zones WHERE is_active = 1 ORDER BY id ASC LIMIT 1').get()) as {
          id: number;
          name: string;
          charge: number;
          free_threshold: number | null;
        };
      }

      const netSubtotal = Math.max(0, subtotal - discountAmount);
      const shippingCharge =
        zone.free_threshold !== null && netSubtotal >= zone.free_threshold ? 0 : zone.charge;
      const totalAmount = netSubtotal + shippingCharge;

      // Upsert customer record
      const existingCustomer = db
        .prepare('SELECT id FROM customers WHERE phone = ?')
        .get(cleanPhone) as { id: number } | undefined;

      let customerId: number;
      if (existingCustomer) {
        customerId = existingCustomer.id;
        db.prepare(
          `UPDATE customers SET full_name = ?, whatsapp = ?, email = ?, district = ?, area = ?, address = ?,
           total_orders = total_orders + 1, total_spent = total_spent + ?, user_id = COALESCE(user_id, ?)
           WHERE id = ?`
        ).run(
          customer_name.trim(),
          cleanWhatsapp,
          typeof email === 'string' ? email.trim() : '',
          district.trim(),
          area.trim(),
          address.trim(),
          totalAmount,
          req.auth?.userId ?? null,
          customerId
        );
      } else {
        const custRes = db
          .prepare(
            `INSERT INTO customers (user_id, full_name, phone, whatsapp, email, district, area, address, total_orders, total_spent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
          )
          .run(
            req.auth?.userId ?? null,
            customer_name.trim(),
            cleanPhone,
            cleanWhatsapp,
            typeof email === 'string' ? email.trim() : '',
            district.trim(),
            area.trim(),
            address.trim(),
            totalAmount
          );
        customerId = Number(custRes.lastInsertRowid);
      }

      const countRow = db.prepare('SELECT COALESCE(MAX(id), 0) AS maxId FROM orders').get() as {
        maxId: number;
      };
      const nextNum = countRow.maxId + 1;
      const year = new Date().getFullYear();
      const orderNumber = `FLORIA-${year}-${String(nextNum).padStart(6, '0')}`;

      const orderRes = db
        .prepare(
          `INSERT INTO orders (
            order_number, idempotency_key, customer_id, user_id, customer_name, phone, whatsapp, email,
            district, area, address, notes, payment_method, payment_status, order_status,
            subtotal, discount_amount, coupon_code, shipping_zone_id, shipping_zone_name,
            shipping_charge, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid', 'Pending', ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          orderNumber,
          typeof idempotency_key === 'string' && idempotency_key.trim() ? idempotency_key.trim() : null,
          customerId,
          req.auth?.userId ?? null,
          customer_name.trim(),
          cleanPhone,
          cleanWhatsapp,
          typeof email === 'string' ? email.trim() : '',
          district.trim(),
          area.trim(),
          address.trim(),
          typeof notes === 'string' ? notes.trim().slice(0, 500) : '',
          chosenPayment,
          subtotal,
          discountAmount,
          appliedCouponCode,
          zone.id,
          zone.name,
          shippingCharge,
          totalAmount
        );

      const orderId = Number(orderRes.lastInsertRowid);
      const insertOrderItem = db.prepare(
        `INSERT INTO order_items (order_id, product_id, product_name, brand_name, sku, image_url, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const deductStock = db.prepare(
        `UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = datetime('now')
         WHERE id = ? AND stock_quantity >= ?`
      );

      for (const item of verifiedItems) {
        const stockUpdate = deductStock.run(item.quantity, item.product_id, item.quantity);
        if (stockUpdate.changes === 0) {
          throw new Error(`OUT_OF_STOCK:${item.product_name}:0`);
        }
        insertOrderItem.run(
          orderId,
          item.product_id,
          item.product_name,
          item.brand_name,
          item.sku,
          item.image_url,
          item.unit_price,
          item.quantity,
          item.line_total
        );
      }

      if (appliedCouponId) {
        db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(appliedCouponId);
        db.prepare(
          'INSERT INTO coupon_usage (coupon_id, order_id, customer_phone) VALUES (?, ?, ?)'
        ).run(appliedCouponId, orderId, cleanPhone);
      }

      const fullOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown>;
      return {
        ...fullOrder,
        stock_restored: Boolean(fullOrder.stock_restored),
        items: verifiedItems,
      };
    });

    res.status(201).json({ order: createdOrder });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Order failed';
    if (message.startsWith('OUT_OF_STOCK:')) {
      const [, name, avail] = message.split(':');
      res.status(409).json({
        error: `Insufficient stock for ${name}. Available: ${avail}.`,
      });
      return;
    }
    if (message.startsWith('UNAVAILABLE:')) {
      res.status(400).json({ error: 'One or more selected products are no longer available.' });
      return;
    }
    if (message === 'INVALID_ITEM') {
      res.status(400).json({ error: 'Invalid cart item quantity.' });
      return;
    }
    res.status(500).json({ error: 'Unable to submit order. Please try again.' });
  }
});

apiRouter.get('/orders/lookup/:orderNumber', (req, res) => {
  const { orderNumber } = req.params;
  const phone = typeof req.query.phone === 'string' ? normalizeBdPhone(req.query.phone) : '';
  const order = db
    .prepare('SELECT * FROM orders WHERE order_number = ?')
    .get(orderNumber.trim().toUpperCase()) as Record<string, unknown> | undefined;

  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  if (phone && order.phone !== phone) {
    res.status(403).json({ error: 'Phone number does not match this order.' });
    return;
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  // Omit internal admin notes from public order lookup
  const { internal_notes: _hidden, ...publicOrder } = order;
  res.json({ order: { ...publicOrder, items } });
});

apiRouter.post('/newsletter', rateLimit('newsletter', 10, 60_000), (req, res) => {
  const { email } = req.body ?? {};
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  const cleanEmail = email.trim().toLowerCase();
  const existing = db
    .prepare('SELECT id FROM newsletter_subscribers WHERE email = ?')
    .get(cleanEmail);
  if (existing) {
    res.status(200).json({
      duplicate: true,
      message: 'You are already subscribed to Floria Korean Beauty updates.',
    });
    return;
  }
  db.prepare('INSERT INTO newsletter_subscribers (email) VALUES (?)').run(cleanEmail);
  res.status(201).json({
    duplicate: false,
    message: 'Welcome to Floria! Thank you for subscribing.',
  });
});

apiRouter.post('/contact', rateLimit('contact', 10, 60_000), (req, res) => {
  const { name, email, phone, subject, message } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'Please enter your name.' });
    return;
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (typeof subject !== 'string' || subject.trim().length < 2) {
    res.status(400).json({ error: 'Please enter a subject.' });
    return;
  }
  if (typeof message !== 'string' || message.trim().length < 5) {
    res.status(400).json({ error: 'Please write your message.' });
    return;
  }

  db.prepare(
    'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)'
  ).run(
    name.trim().slice(0, 100),
    email.trim().toLowerCase().slice(0, 120),
    typeof phone === 'string' ? phone.trim().slice(0, 30) : '',
    subject.trim().slice(0, 160),
    message.trim().slice(0, 2000)
  );
  res.status(201).json({ message: 'Thank you for reaching out. Our team will respond shortly.' });
});

// ============================================================
// CUSTOMER AUTH & ACCOUNT ROUTES
// ============================================================

apiRouter.post('/auth/register', rateLimit('auth', 15, 60_000), (req, res) => {
  const { full_name, email, phone, password } = req.body ?? {};
  if (typeof full_name !== 'string' || full_name.trim().length < 2) {
    res.status(400).json({ error: 'Please enter your full name.' });
    return;
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }
  const cleanEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }
  const cleanPhone = typeof phone === 'string' && isValidBdPhone(phone) ? normalizeBdPhone(phone) : '';

  const created = db.transaction(() => {
    const userRes = db
      .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
      .run(cleanEmail, hashPassword(password));
    const userId = Number(userRes.lastInsertRowid);
    db.prepare('INSERT INTO profiles (user_id, full_name, phone) VALUES (?, ?, ?)').run(
      userId,
      full_name.trim(),
      cleanPhone
    );
    db.prepare("INSERT INTO user_roles (user_id, role) VALUES (?, 'customer')").run(userId);
    return userId;
  })();

  const token = signAuthToken({ userId: created, email: cleanEmail, role: 'customer' }, 48);
  res.status(201).json({
    token,
    user: { id: created, email: cleanEmail, full_name: full_name.trim(), phone: cleanPhone, role: 'customer' },
  });
});

apiRouter.post('/auth/login', rateLimit('auth', 20, 60_000), (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  const cleanEmail = email.trim().toLowerCase();
  const user = db
    .prepare(
      `SELECT u.id, u.email, u.password_hash, p.full_name, p.phone, ur.role
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.email = ?`
    )
    .get(cleanEmail) as
    | { id: number; email: string; password_hash: string; full_name: string; phone: string; role: 'customer' | 'admin' }
    | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = signAuthToken({ userId: user.id, email: user.email, role: user.role }, 48);
  res.json({
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone, role: user.role },
  });
});

apiRouter.post('/auth/reset-password', rateLimit('auth', 10, 60_000), (req, res) => {
  const { email, phone, new_password } = req.body ?? {};
  if (typeof email !== 'string' || typeof phone !== 'string' || typeof new_password !== 'string') {
    res.status(400).json({ error: 'Email, registered phone number, and new password are required.' });
    return;
  }
  if (new_password.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters.' });
    return;
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = normalizeBdPhone(phone);
  const user = db
    .prepare(
      `SELECT u.id, p.phone, ur.role FROM users u
       JOIN profiles p ON p.user_id = u.id
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.email = ? AND ur.role = 'customer'`
    )
    .get(cleanEmail) as { id: number; phone: string; role: string } | undefined;

  if (!user || !user.phone || user.phone !== cleanPhone) {
    res.status(400).json({ error: 'Email and phone number did not match a customer account.' });
    return;
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(new_password), user.id);
  res.json({ message: 'Your password has been updated. You may now sign in.' });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db
    .prepare(
      `SELECT u.id, u.email, p.full_name, p.phone, ur.role
       FROM users u JOIN profiles p ON p.user_id = u.id JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.id = ?`
    )
    .get(req.auth!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ user });
});

apiRouter.get('/customer/orders', requireAuth, (req: AuthenticatedRequest, res) => {
  const profile = db.prepare('SELECT phone FROM profiles WHERE user_id = ?').get(req.auth!.userId) as
    | { phone: string }
    | undefined;
  const orders = db
    .prepare(
      `SELECT * FROM orders WHERE user_id = ? OR (phone != '' AND phone = ?) ORDER BY created_at DESC`
    )
    .all(req.auth!.userId, profile?.phone || '') as Record<string, unknown>[];

  const hydrated = orders.map((o) => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
  }));
  res.json({ orders: hydrated });
});

apiRouter.get('/customer/addresses', requireAuth, (req: AuthenticatedRequest, res) => {
  const addresses = db
    .prepare('SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC')
    .all(req.auth!.userId);
  res.json({ addresses });
});

apiRouter.post('/customer/addresses', requireAuth, (req: AuthenticatedRequest, res) => {
  const { label, full_name, phone, district, area, address, is_default } = req.body ?? {};
  if (!full_name || !phone || !district || !area || !address) {
    res.status(400).json({ error: 'All address fields are required.' });
    return;
  }
  if (!isValidBdPhone(String(phone))) {
    res.status(400).json({ error: 'Invalid Bangladeshi phone number.' });
    return;
  }
  const id = db.transaction(() => {
    if (is_default) {
      db.prepare('UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?').run(req.auth!.userId);
    }
    const result = db
      .prepare(
        `INSERT INTO customer_addresses (user_id, label, full_name, phone, district, area, address, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.auth!.userId,
        String(label || 'Home').slice(0, 40),
        String(full_name).trim(),
        normalizeBdPhone(String(phone)),
        String(district).trim(),
        String(area).trim(),
        String(address).trim(),
        is_default ? 1 : 0
      );
    return Number(result.lastInsertRowid);
  })();
  res.status(201).json({ id });
});

apiRouter.delete('/customer/addresses/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare('DELETE FROM customer_addresses WHERE id = ? AND user_id = ?').run(
    Number(req.params.id),
    req.auth!.userId
  );
  res.json({ ok: true });
});

// ============================================================
// ADMIN AUTHENTICATION & FIRST-RUN SETUP
// ============================================================

apiRouter.get('/admin/auth/status', (_req, res) => {
  const envPasscodeSet = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
  const adminCount = db
    .prepare("SELECT COUNT(*) AS count FROM user_roles WHERE role = 'admin'")
    .get() as { count: number };

  res.json({
    setupRequired: !envPasscodeSet && adminCount.count === 0,
    envOverrideActive: envPasscodeSet,
  });
});

apiRouter.post('/admin/auth/setup', rateLimit('admin-auth', 10, 60_000), (req, res) => {
  const envPasscodeSet = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
  if (envPasscodeSet) {
    res.status(403).json({ error: 'Administrator credentials are managed by environment secrets.' });
    return;
  }

  const { full_name, email, password } = req.body ?? {};
  if (typeof full_name !== 'string' || full_name.trim().length < 2) {
    res.status(400).json({ error: 'Please enter administrator full name.' });
    return;
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Please enter a valid administrator email.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Administrator password must be at least 8 characters.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const adminId = db.transaction(() => {
      const adminCount = db
        .prepare("SELECT COUNT(*) AS count FROM user_roles WHERE role = 'admin'")
        .get() as { count: number };
      if (adminCount.count > 0) {
        throw new Error('ALREADY_CLAIMED');
      }
      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
      if (existingEmail) {
        throw new Error('EMAIL_EXISTS');
      }
      const resUser = db
        .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
        .run(cleanEmail, hashPassword(password));
      const userId = Number(resUser.lastInsertRowid);
      db.prepare('INSERT INTO profiles (user_id, full_name) VALUES (?, ?)').run(userId, full_name.trim());
      db.prepare("INSERT INTO user_roles (user_id, role) VALUES (?, 'admin')").run(userId);
      logAdminActivity(cleanEmail, 'ADMIN_SETUP', 'admin', userId, 'Initial administrator account claimed');
      return userId;
    })();

    const token = signAuthToken({ userId: adminId, email: cleanEmail, role: 'admin' }, 12);
    res.status(201).json({
      token,
      user: { id: adminId, email: cleanEmail, full_name: full_name.trim(), phone: '', role: 'admin' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'ALREADY_CLAIMED') {
      res.status(409).json({ error: 'Administrator setup has already been completed. Please sign in.' });
      return;
    }
    if (msg === 'EMAIL_EXISTS') {
      res.status(409).json({ error: 'That email is already registered.' });
      return;
    }
    res.status(500).json({ error: 'Unable to complete administrator setup.' });
  }
});

apiRouter.post('/admin/auth/login', rateLimit('admin-auth', 15, 60_000), (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  const cleanEmail = email.trim().toLowerCase();

  // Optional environment passcode override
  const envPass = process.env.ADMIN_PASSCODE?.trim();
  const envEmail = (process.env.ADMIN_EMAIL || 'admin@floriakoreanbeauty.com').trim().toLowerCase();
  if (envPass && cleanEmail === envEmail && password === envPass) {
    let adminUser = db
      .prepare("SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id WHERE u.email = ? AND ur.role = 'admin'")
      .get(cleanEmail) as { id: number } | undefined;
    if (!adminUser) {
      const uid = db.transaction(() => {
        const resU = db
          .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
          .run(cleanEmail, hashPassword(envPass));
        const newId = Number(resU.lastInsertRowid);
        db.prepare("INSERT INTO profiles (user_id, full_name) VALUES (?, 'Store Administrator')").run(newId);
        db.prepare("INSERT INTO user_roles (user_id, role) VALUES (?, 'admin')").run(newId);
        return newId;
      })();
      adminUser = { id: uid };
    }
    const token = signAuthToken({ userId: adminUser.id, email: cleanEmail, role: 'admin' }, 12);
    res.json({
      token,
      user: { id: adminUser.id, email: cleanEmail, full_name: 'Store Administrator', phone: '', role: 'admin' },
    });
    return;
  }

  const user = db
    .prepare(
      `SELECT u.id, u.email, u.password_hash, p.full_name, p.phone, ur.role
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.email = ? AND ur.role = 'admin'`
    )
    .get(cleanEmail) as
    | { id: number; email: string; password_hash: string; full_name: string; phone: string; role: 'admin' }
    | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  const token = signAuthToken({ userId: user.id, email: user.email, role: 'admin' }, 12);
  res.json({
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone, role: 'admin' },
  });
});

// ============================================================
// PROTECTED ADMIN MANAGEMENT ROUTES
// ============================================================

apiRouter.use('/admin', requireAdmin);

apiRouter.get('/admin/dashboard', (_req, res) => {
  const orderStats = db
    .prepare(
      `SELECT
        COUNT(*) AS totalOrders,
        SUM(CASE WHEN order_status = 'Pending' THEN 1 ELSE 0 END) AS pendingOrders,
        SUM(CASE WHEN order_status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmedOrders,
        SUM(CASE WHEN order_status = 'Processing' THEN 1 ELSE 0 END) AS processingOrders,
        SUM(CASE WHEN order_status = 'Shipped' THEN 1 ELSE 0 END) AS shippedOrders,
        SUM(CASE WHEN order_status = 'Delivered' THEN 1 ELSE 0 END) AS deliveredOrders,
        SUM(CASE WHEN order_status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelledOrders,
        COALESCE(SUM(CASE WHEN order_status != 'Cancelled' THEN total_amount ELSE 0 END), 0) AS totalRevenue
       FROM orders`
    )
    .get() as Record<string, number>;

  const productStats = db
    .prepare(
      `SELECT
        COUNT(*) AS totalProducts,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS activeProducts,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) AS outOfStockProducts
       FROM products`
    )
    .get() as Record<string, number>;

  const customerCount = (
    db.prepare('SELECT COUNT(*) AS totalCustomers FROM customers').get() as { totalCustomers: number }
  ).totalCustomers;

  const recentOrders = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 8')
    .all();

  const recentActivities = db
    .prepare('SELECT * FROM admin_activity_logs ORDER BY created_at DESC, id DESC LIMIT 12')
    .all();

  const revenueByStatus = db
    .prepare(
      `SELECT order_status AS status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders GROUP BY order_status`
    )
    .all();

  res.json({
    stats: {
      totalOrders: orderStats.totalOrders || 0,
      pendingOrders: orderStats.pendingOrders || 0,
      confirmedOrders: orderStats.confirmedOrders || 0,
      processingOrders: orderStats.processingOrders || 0,
      shippedOrders: orderStats.shippedOrders || 0,
      deliveredOrders: orderStats.deliveredOrders || 0,
      cancelledOrders: orderStats.cancelledOrders || 0,
      totalRevenue: orderStats.totalRevenue || 0,
      totalProducts: productStats.totalProducts || 0,
      activeProducts: productStats.activeProducts || 0,
      outOfStockProducts: productStats.outOfStockProducts || 0,
      totalCustomers: customerCount || 0,
    },
    recentOrders,
    recentActivities,
    revenueByStatus,
  });
});

// Safe image upload (base64 data URL -> confined inside public/uploads)
apiRouter.post('/admin/upload', (req: AuthenticatedRequest, res) => {
  const { filename, dataUrl } = req.body ?? {};
  if (typeof filename !== 'string' || typeof dataUrl !== 'string') {
    res.status(400).json({ error: 'Filename and image data are required.' });
    return;
  }
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    res.status(400).json({ error: 'Only PNG, JPG, and WebP images are permitted.' });
    return;
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 1_500_000) {
    res.status(400).json({ error: 'Image size must not exceed 1.5 MB.' });
    return;
  }
  const safeBase = slugify(path.basename(filename, path.extname(filename))) || 'upload';
  const finalName = `${safeBase}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const targetPath = resolveSafeUploadPath(uploadsDir, finalName);
  if (!targetPath) {
    res.status(400).json({ error: 'Invalid upload destination.' });
    return;
  }
  fs.writeFileSync(targetPath, buffer);
  const publicUrl = `/uploads/${finalName}`;
  logAdminActivity(req.auth!.email, 'IMAGE_UPLOADED', 'media', finalName, `Uploaded ${publicUrl}`);
  res.status(201).json({ url: publicUrl });
});

// Admin Products CRUD
apiRouter.get('/admin/products', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, b.name AS brand_name, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       ORDER BY p.id DESC`
    )
    .all() as RawProductRow[];
  res.json({ products: rows.map(hydrateProduct) });
});

apiRouter.post('/admin/products', (req: AuthenticatedRequest, res) => {
  const body = req.body ?? {};
  if (!body.name || !body.brand_id || !body.category_id || Number(body.price) < 0) {
    res.status(400).json({ error: 'Product name, brand, category, and valid price are required.' });
    return;
  }
  const imageUrl = String(body.image_url || '').trim();
  if (imageUrl && !isSafeUrl(imageUrl)) {
    res.status(400).json({ error: 'Invalid image URL protocol.' });
    return;
  }
  const baseSlug = slugify(String(body.slug || body.name));
  const uniqueSlug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
  const sku = String(body.sku || `FLR-${Date.now().toString().slice(-6)}`).trim().toUpperCase();
  const price = Number(body.price);
  const originalPrice = body.original_price ? Number(body.original_price) : null;
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : Number(body.discount_percent || 0);

  try {
    const productId = db.transaction(() => {
      const result = db
        .prepare(
          `INSERT INTO products (
            name, slug, sku, brand_id, category_id, description, benefits, ingredients,
            skin_types, usage_instructions, image_url, price, original_price, discount_percent,
            stock_quantity, is_active, is_featured, is_bestseller, is_new_arrival, is_demo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
        )
        .run(
          String(body.name).trim(),
          uniqueSlug,
          sku,
          Number(body.brand_id),
          Number(body.category_id),
          String(body.description || '').trim(),
          String(body.benefits || '').trim(),
          String(body.ingredients || '').trim(),
          JSON.stringify(Array.isArray(body.skin_types) ? body.skin_types : ['All Skin Types']),
          String(body.usage_instructions || '').trim(),
          imageUrl || '/src/assets/images/prod_serum_amber_bottle.jpg',
          price,
          originalPrice,
          discountPercent,
          Math.max(0, Number(body.stock_quantity || 0)),
          body.is_active === false ? 0 : 1,
          body.is_featured ? 1 : 0,
          body.is_bestseller ? 1 : 0,
          body.is_new_arrival ? 1 : 0
        );
      const pid = Number(result.lastInsertRowid);
      const gallery = Array.isArray(body.gallery_images) ? body.gallery_images : [imageUrl];
      gallery.filter((u: unknown) => typeof u === 'string' && u.trim() && isSafeUrl(u)).forEach((u: string, i: number) => {
        db.prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)').run(
          pid,
          u.trim(),
          i
        );
      });
      logAdminActivity(req.auth!.email, 'PRODUCT_CREATED', 'product', pid, `Created ${body.name}`);
      return pid;
    })();
    res.status(201).json({ id: productId });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to create product.' });
  }
});

apiRouter.put('/admin/products/:id', (req: AuthenticatedRequest, res) => {
  const pid = Number(req.params.id);
  const body = req.body ?? {};
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(pid);
  if (!existing) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  const imageUrl = String(body.image_url || '').trim();
  if (imageUrl && !isSafeUrl(imageUrl)) {
    res.status(400).json({ error: 'Invalid image URL protocol.' });
    return;
  }
  const price = Number(body.price);
  const originalPrice = body.original_price ? Number(body.original_price) : null;
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : Number(body.discount_percent || 0);

  db.transaction(() => {
    db.prepare(
      `UPDATE products SET
        name = ?, sku = ?, brand_id = ?, category_id = ?, description = ?, benefits = ?,
        ingredients = ?, skin_types = ?, usage_instructions = ?, image_url = ?, price = ?,
        original_price = ?, discount_percent = ?, stock_quantity = ?, is_active = ?,
        is_featured = ?, is_bestseller = ?, is_new_arrival = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      String(body.name).trim(),
      String(body.sku).trim().toUpperCase(),
      Number(body.brand_id),
      Number(body.category_id),
      String(body.description || '').trim(),
      String(body.benefits || '').trim(),
      String(body.ingredients || '').trim(),
      JSON.stringify(Array.isArray(body.skin_types) ? body.skin_types : ['All Skin Types']),
      String(body.usage_instructions || '').trim(),
      imageUrl,
      price,
      originalPrice,
      discountPercent,
      Math.max(0, Number(body.stock_quantity || 0)),
      body.is_active ? 1 : 0,
      body.is_featured ? 1 : 0,
      body.is_bestseller ? 1 : 0,
      body.is_new_arrival ? 1 : 0,
      pid
    );

    if (Array.isArray(body.gallery_images)) {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(pid);
      body.gallery_images
        .filter((u: unknown) => typeof u === 'string' && u.trim() && isSafeUrl(u))
        .forEach((u: string, i: number) => {
          db.prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)').run(
            pid,
            u.trim(),
            i
          );
        });
    }

    logAdminActivity(req.auth!.email, 'PRODUCT_UPDATED', 'product', pid, `Updated ${body.name}`);
  })();
  res.json({ ok: true });
});

apiRouter.delete('/admin/products/:id', (req: AuthenticatedRequest, res) => {
  const pid = Number(req.params.id);
  const usedInOrders = db.prepare('SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?').get(pid) as {
    count: number;
  };
  if (usedInOrders.count > 0) {
    db.prepare("UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(pid);
    logAdminActivity(req.auth!.email, 'PRODUCT_ARCHIVED', 'product', pid, 'Deactivated product linked to order history');
    res.json({ ok: true, archived: true });
    return;
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(pid);
  logAdminActivity(req.auth!.email, 'PRODUCT_DELETED', 'product', pid, `Deleted product #${pid}`);
  res.json({ ok: true });
});

// Admin Categories CRUD
apiRouter.get('/admin/categories', (_req, res) => {
  const rows = (
    db
      .prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
         FROM categories c ORDER BY c.display_order ASC, c.id ASC`
      )
      .all() as Record<string, unknown>[]
  ).map((c) => ({ ...c, is_visible: Boolean(c.is_visible) }));
  res.json({ categories: rows });
});

apiRouter.post('/admin/categories', (req: AuthenticatedRequest, res) => {
  const { name, name_bn, description, image_url, display_order, is_visible } = req.body ?? {};
  if (!name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }
  const slug = slugify(String(name));
  const result = db
    .prepare(
      `INSERT INTO categories (name, name_bn, slug, description, image_url, display_order, is_visible)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(name).trim(),
      String(name_bn || name).trim(),
      slug,
      String(description || '').trim(),
      String(image_url || '/src/assets/images/editorial_floria_glow_1795534767638.jpg').trim(),
      Number(display_order || 10),
      is_visible === false ? 0 : 1
    );
  logAdminActivity(req.auth!.email, 'CATEGORY_CREATED', 'category', Number(result.lastInsertRowid), String(name));
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

apiRouter.put('/admin/categories/:id', (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { name, name_bn, description, image_url, display_order, is_visible } = req.body ?? {};
  db.prepare(
    `UPDATE categories SET name = ?, name_bn = ?, description = ?, image_url = ?, display_order = ?, is_visible = ? WHERE id = ?`
  ).run(
    String(name).trim(),
    String(name_bn || name).trim(),
    String(description || '').trim(),
    String(image_url || '').trim(),
    Number(display_order || 0),
    is_visible ? 1 : 0,
    id
  );
  logAdminActivity(req.auth!.email, 'CATEGORY_UPDATED', 'category', id, String(name));
  res.json({ ok: true });
});

apiRouter.delete('/admin/categories/:id', (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const count = (db.prepare('SELECT COUNT(*) AS count FROM products WHERE category_id = ?').get(id) as { count: number })
    .count;
  if (count > 0) {
    res.status(400).json({ error: 'Cannot delete a category that still has products assigned.' });
    return;
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  logAdminActivity(req.auth!.email, 'CATEGORY_DELETED', 'category', id, `Deleted category #${id}`);
  res.json({ ok: true });
});

// Admin Brands CRUD
apiRouter.get('/admin/brands', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) AS product_count
       FROM brands b ORDER BY b.name ASC`
    )
    .all();
  res.json({ brands: rows });
});

apiRouter.post('/admin/brands', (req: AuthenticatedRequest, res) => {
  const { name, logo_url, description } = req.body ?? {};
  if (!name) {
    res.status(400).json({ error: 'Brand name is required.' });
    return;
  }
  const result = db
    .prepare('INSERT INTO brands (name, slug, logo_url, description) VALUES (?, ?, ?, ?)')
    .run(String(name).trim(), slugify(String(name)), String(logo_url || ''), String(description || ''));
  logAdminActivity(req.auth!.email, 'BRAND_CREATED', 'brand', Number(result.lastInsertRowid), String(name));
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

apiRouter.put('/admin/brands/:id', (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { name, logo_url, description } = req.body ?? {};
  db.prepare('UPDATE brands SET name = ?, logo_url = ?, description = ? WHERE id = ?').run(
    String(name).trim(),
    String(logo_url || ''),
    String(description || ''),
    id
  );
  logAdminActivity(req.auth!.email, 'BRAND_UPDATED', 'brand', id, String(name));
  res.json({ ok: true });
});

apiRouter.delete('/admin/brands/:id', (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const count = (db.prepare('SELECT COUNT(*) AS count FROM products WHERE brand_id = ?').get(id) as { count: number })
    .count;
  if (count > 0) {
    res.status(400).json({ error: 'Cannot delete a brand that still has products assigned.' });
    return;
  }
  db.prepare('DELETE FROM brands WHERE id = ?').run(id);
  logAdminActivity(req.auth!.email, 'BRAND_DELETED', 'brand', id, `Deleted brand #${id}`);
  res.json({ ok: true });
});

// Admin Orders Management (with atomic stock restoration when cancelled)
apiRouter.get('/admin/orders', (req, res) => {
  const { status, search } = req.query;
  const conditions: string[] = ['1 = 1'];
  const params: string[] = [];
  if (typeof status === 'string' && status && status !== 'All') {
    conditions.push('order_status = ?');
    params.push(status);
  }
  if (typeof search === 'string' && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    conditions.push('(LOWER(order_number) LIKE ? OR LOWER(customer_name) LIKE ? OR phone LIKE ?)');
    params.push(q, q, q);
  }
  const orders = db
    .prepare(`SELECT * FROM orders WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC, id DESC`)
    .all(...params) as Record<string, unknown>[];

  const hydrated = orders.map((o) => ({
    ...o,
    stock_restored: Boolean(o.stock_restored),
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
  }));
  res.json({ orders: hydrated });
});

apiRouter.patch('/admin/orders/:id', (req: AuthenticatedRequest, res) => {
  const orderId = Number(req.params.id);
  const { order_status, payment_status, internal_notes } = req.body ?? {};
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | {
        id: number;
        order_number: string;
        order_status: string;
        payment_status: string;
        internal_notes: string;
        stock_restored: number;
      }
    | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const nextStatus = order_status || existing.order_status;
  const nextPayment = payment_status || existing.payment_status;
  const nextNotes = internal_notes !== undefined ? String(internal_notes) : existing.internal_notes;

  db.transaction(() => {
    // Restore stock safely ONCE if transitioning to Cancelled
    if (nextStatus === 'Cancelled' && existing.order_status !== 'Cancelled' && !existing.stock_restored) {
      const items = db
        .prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?')
        .all(orderId) as { product_id: number; quantity: number }[];
      const restoreStmt = db.prepare(
        "UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE id = ?"
      );
      for (const item of items) {
        restoreStmt.run(item.quantity, item.product_id);
      }
      db.prepare(
        `UPDATE orders SET order_status = ?, payment_status = ?, internal_notes = ?, stock_restored = 1, updated_at = datetime('now')
         WHERE id = ?`
      ).run(nextStatus, nextPayment, nextNotes, orderId);
      logAdminActivity(
        req.auth!.email,
        'ORDER_CANCELLED_STOCK_RESTORED',
        'order',
        existing.order_number,
        `Cancelled order ${existing.order_number} and restored stock`
      );
    } else {
      db.prepare(
        `UPDATE orders SET order_status = ?, payment_status = ?, internal_notes = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).run(nextStatus, nextPayment, nextNotes, orderId);
      logAdminActivity(
        req.auth!.email,
        'ORDER_UPDATED',
        'order',
        existing.order_number,
        `Status: ${nextStatus}, Payment: ${nextPayment}`
      );
    }
  })();

  res.json({ ok: true });
});

// Admin Customers
apiRouter.get('/admin/customers', (_req, res) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC, id DESC').all();
  res.json({ customers });
});

apiRouter.get('/admin/customers/:id/orders', (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC')
    .all(Number(req.params.id));
  res.json({ orders });
});

// Admin Reviews
apiRouter.get('/admin/reviews', (_req, res) => {
  const reviews = (
    db
      .prepare(
        `SELECT r.*, p.name AS product_name FROM reviews r
         JOIN products p ON p.id = r.product_id ORDER BY r.created_at DESC, r.id DESC`
      )
      .all() as Record<string, unknown>[]
  ).map((r) => ({ ...r, is_demo: Boolean(r.is_demo) }));
  res.json({ reviews });
});

apiRouter.patch('/admin/reviews/:id', (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid review status.' });
    return;
  }
  const review = db.prepare('SELECT product_id FROM reviews WHERE id = ?').get(id) as
    | { product_id: number }
    | undefined;
  if (!review) {
    res.status(404).json({ error: 'Review not found.' });
    return;
  }

  db.transaction(() => {
    db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, id);
    const agg = db
      .prepare(
        "SELECT COUNT(*) AS cnt, COALESCE(AVG(rating), 5.0) AS avgRating FROM reviews WHERE product_id = ? AND status = 'approved'"
      )
      .get(review.product_id) as { cnt: number; avgRating: number };
    if (agg.cnt > 0) {
      db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?').run(
        Math.round(agg.avgRating * 10) / 10,
        agg.cnt,
        review.product_id
      );
    }
    logAdminActivity(req.auth!.email, 'REVIEW_MODERATED', 'review', id, `Set review status to ${status}`);
  })();
  res.json({ ok: true });
});

apiRouter.delete('/admin/reviews/:id', (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  logAdminActivity(req.auth!.email, 'REVIEW_DELETED', 'review', id, `Deleted review #${id}`);
  res.json({ ok: true });
});

// Admin Coupons
apiRouter.get('/admin/coupons', (_req, res) => {
  const coupons = (
    db.prepare('SELECT * FROM coupons ORDER BY id DESC').all() as Record<string, unknown>[]
  ).map((c) => ({ ...c, is_active: Boolean(c.is_active) }));
  res.json({ coupons });
});

apiRouter.post('/admin/coupons', (req: AuthenticatedRequest, res) => {
  const { code, discount_type, discount_value, min_purchase, max_uses, expires_at, is_active } = req.body ?? {};
  if (!code || !discount_type || Number(discount_value) <= 0) {
    res.status(400).json({ error: 'Coupon code, type, and positive value are required.' });
    return;
  }
  const result = db
    .prepare(
      `INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_uses, expires_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(code).trim().toUpperCase(),
      discount_type === 'fixed' ? 'fixed' : 'percentage',
      Number(discount_value),
      Number(min_purchase || 0),
      max_uses ? Number(max_uses) : null,
      expires_at || null,
      is_active === false ? 0 : 1
    );
  logAdminActivity(req.auth!.email, 'COUPON_CREATED', 'coupon', Number(result.lastInsertRowid), String(code));
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

apiRouter.put('/admin/coupons/:id', (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { code, discount_type, discount_value, min_purchase, max_uses, expires_at, is_active } = req.body ?? {};
  db.prepare(
    `UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_purchase = ?, max_uses = ?, expires_at = ?, is_active = ? WHERE id = ?`
  ).run(
    String(code).trim().toUpperCase(),
    discount_type === 'fixed' ? 'fixed' : 'percentage',
    Number(discount_value),
    Number(min_purchase || 0),
    max_uses ? Number(max_uses) : null,
    expires_at || null,
    is_active ? 1 : 0,
    id
  );
  logAdminActivity(req.auth!.email, 'COUPON_UPDATED', 'coupon', id, String(code));
  res.json({ ok: true });
});

apiRouter.delete('/admin/coupons/:id', (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
  logAdminActivity(req.auth!.email, 'COUPON_DELETED', 'coupon', id, `Deleted coupon #${id}`);
  res.json({ ok: true });
});

// Admin Shipping Zones
apiRouter.get('/admin/shipping-zones', (_req, res) => {
  const zones = (
    db.prepare('SELECT * FROM shipping_zones ORDER BY id ASC').all() as Record<string, unknown>[]
  ).map((z) => ({ ...z, is_active: Boolean(z.is_active) }));
  res.json({ zones });
});

apiRouter.post('/admin/shipping-zones', (req: AuthenticatedRequest, res) => {
  const { name, name_bn, area_keywords, charge, free_threshold, estimated_days, is_active } = req.body ?? {};
  if (!name || Number(charge) < 0) {
    res.status(400).json({ error: 'Zone name and valid delivery charge are required.' });
    return;
  }
  const result = db
    .prepare(
      `INSERT INTO shipping_zones (name, name_bn, area_keywords, charge, free_threshold, estimated_days, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(name).trim(),
      String(name_bn || name).trim(),
      String(area_keywords || '').trim(),
      Number(charge),
      free_threshold ? Number(free_threshold) : null,
      String(estimated_days || '2-4 business days'),
      is_active === false ? 0 : 1
    );
  logAdminActivity(req.auth!.email, 'SHIPPING_CREATED', 'shipping', Number(result.lastInsertRowid), String(name));
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

apiRouter.put('/admin/shipping-zones/:id', (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { name, name_bn, area_keywords, charge, free_threshold, estimated_days, is_active } = req.body ?? {};
  db.prepare(
    `UPDATE shipping_zones SET name = ?, name_bn = ?, area_keywords = ?, charge = ?, free_threshold = ?, estimated_days = ?, is_active = ? WHERE id = ?`
  ).run(
    String(name).trim(),
    String(name_bn || name).trim(),
    String(area_keywords || '').trim(),
    Number(charge),
    free_threshold ? Number(free_threshold) : null,
    String(estimated_days || '2-4 business days'),
    is_active ? 1 : 0,
    id
  );
  logAdminActivity(req.auth!.email, 'SHIPPING_UPDATED', 'shipping', id, `${name}: ৳${charge}`);
  res.json({ ok: true });
});

apiRouter.delete('/admin/shipping-zones/:id', (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM shipping_zones WHERE id = ?').run(id);
  logAdminActivity(req.auth!.email, 'SHIPPING_DELETED', 'shipping', id, `Deleted zone #${id}`);
  res.json({ ok: true });
});

// Admin Homepage & Store Settings
apiRouter.put('/admin/homepage', (req: AuthenticatedRequest, res) => {
  const config = req.body ?? {};
  db.prepare("UPDATE homepage_sections SET config = ?, updated_at = datetime('now') WHERE id = 1").run(
    JSON.stringify(config)
  );
  logAdminActivity(req.auth!.email, 'HOMEPAGE_UPDATED', 'homepage', 1, 'Updated storefront homepage sections');
  res.json({ ok: true });
});

apiRouter.put('/admin/settings', (req: AuthenticatedRequest, res) => {
  const s = req.body ?? {};
  db.prepare(
    `UPDATE store_settings SET
      brand_name = ?, tagline = ?, phone = ?, whatsapp_display = ?, whatsapp_number = ?,
      address = ?, email = ?, announcement_bar = ?, announcement_bar_bn = ?,
      seo_title = ?, seo_description = ?, social_links = ?, shipping_policy = ?,
      return_policy = ?, privacy_policy = ?, terms_conditions = ?, updated_at = datetime('now')
     WHERE id = 1`
  ).run(
    String(s.brand_name || 'Floria Korean Beauty'),
    String(s.tagline || ''),
    String(s.phone || '01805-133476'),
    String(s.whatsapp_display || '+880 1805-133476'),
    String(s.whatsapp_number || '8801805133476'),
    String(s.address || 'Demra, Dhaka-1361, Bangladesh'),
    String(s.email || 'hello@floriakoreanbeauty.com'),
    String(s.announcement_bar || ''),
    String(s.announcement_bar_bn || ''),
    String(s.seo_title || ''),
    String(s.seo_description || ''),
    JSON.stringify(s.social_links || {}),
    String(s.shipping_policy || ''),
    String(s.return_policy || ''),
    String(s.privacy_policy || ''),
    String(s.terms_conditions || '')
  );
  logAdminActivity(req.auth!.email, 'SETTINGS_UPDATED', 'settings', 1, 'Updated store settings and policies');
  res.json({ ok: true });
});

// Admin Profile Password Change & Activity Logs & Contact Messages
apiRouter.put('/admin/profile', (req: AuthenticatedRequest, res) => {
  const { full_name, current_password, new_password } = req.body ?? {};
  const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.auth!.userId) as
    | { id: number; password_hash: string }
    | undefined;
  if (!user) {
    res.status(404).json({ error: 'Administrator account not found.' });
    return;
  }
  if (typeof full_name === 'string' && full_name.trim().length >= 2) {
    db.prepare('UPDATE profiles SET full_name = ?, updated_at = datetime(\'now\') WHERE user_id = ?').run(
      full_name.trim(),
      user.id
    );
  }
  if (new_password) {
    if (typeof new_password !== 'string' || new_password.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters.' });
      return;
    }
    if (!current_password || !verifyPassword(String(current_password), user.password_hash)) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(new_password), user.id);
  }
  logAdminActivity(req.auth!.email, 'ADMIN_PROFILE_UPDATED', 'admin', user.id, 'Updated admin profile');
  res.json({ ok: true });
});

apiRouter.get('/admin/activity-logs', (_req, res) => {
  const logs = db.prepare('SELECT * FROM admin_activity_logs ORDER BY created_at DESC, id DESC LIMIT 100').all();
  res.json({ logs });
});

apiRouter.get('/admin/messages', (_req, res) => {
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC, id DESC').all();
  res.json({ messages });
});

apiRouter.get('/admin/subscribers', (_req, res) => {
  const subscribers = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC').all();
  res.json({ subscribers });
});
