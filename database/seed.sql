-- Floria Korean Beauty - Demonstration Seed Data (PostgreSQL / Supabase)
-- Note: All catalog prices and stock quantities are demonstration defaults.

INSERT INTO store_settings (
  id, brand_name, tagline, phone, whatsapp_display, whatsapp_number, address,
  currency_code, currency_symbol, email, announcement_bar, announcement_bar_bn,
  seo_title, seo_description, social_links, shipping_policy, return_policy,
  privacy_policy, terms_conditions
) VALUES (
  1,
  'Floria Korean Beauty',
  'Minimalist Korean Skincare Essentials in Bangladesh',
  '01805-133476',
  '+880 1805-133476',
  '8801805133476',
  'Demra, Dhaka-1361, Bangladesh',
  'BDT',
  '৳',
  'hello@floriakoreanbeauty.com',
  'Discover Your Perfect Korean Skincare Routine · Cash on Delivery Across Bangladesh',
  'আপনার ত্বকের জন্য সেরা কোরিয়ান স্কিনকেয়ার রুটিন খুঁজে নিন · সারা বাংলাদেশে ক্যাশ অন ডেলিভারি',
  'Floria Korean Beauty | Premium Korean Skincare in Bangladesh',
  'Discover Korean skincare and beauty essentials at Floria Korean Beauty. Explore cleansers, toners, serums, moisturizers, sunscreens, and more.',
  '{"facebook":"https://www.facebook.com/profile.php?id=61595783647973","linkedin":"https://www.linkedin.com/in/floria-korean-beauty-888972450","twitter":"https://x.com/floriabeauty","instagram":"https://www.instagram.com/floriakoreanbeautyy","youtube":"https://youtube.com/@floriakoreanbeauty","pinterest":"https://pin.it/39LYJg837","tiktok":"https://www.tiktok.com/@floriakoreanbeauty"}'::jsonb,
  'Inside Dhaka deliveries arrive within 1-3 business days (৳ 70 default). Outside Dhaka deliveries arrive within 3-5 business days (৳ 130 default). Cash on Delivery is available across Bangladesh.',
  'Unused, unopened products in original packaging may be requested for return or exchange within 7 days of delivery by contacting 01805-133476 or WhatsApp +880 1805-133476.',
  'Floria Korean Beauty collects only the delivery and contact information required to process your skincare orders and customer inquiries securely.',
  'All catalog pricing in BDT (৳) is subject to availability. Orders are confirmed via phone or WhatsApp prior to dispatch.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO shipping_zones (name, name_bn, area_keywords, charge, free_threshold, estimated_days, is_active) VALUES
('Inside Dhaka', 'ঢাকার ভেতরে', 'Dhaka,Demra,Gulshan,Banani,Dhanmondi,Uttara,Mirpur,Motijheel,Mohammadpur,Bashundhara,Badda,Rampura', 70, 3000, '1-3 business days', TRUE),
('Outside Dhaka', 'ঢাকার বাইরে', 'Chattogram,Sylhet,Rajshahi,Khulna,Barishal,Rangpur,Mymensingh,Cumilla,Narayanganj,Gazipur,Bogura', 130, 4500, '3-5 business days', TRUE);

INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_uses, is_active) VALUES
('GLOW10', 'percentage', 10, 1000, 500, TRUE),
('FLORIA200', 'fixed', 200, 2000, 200, TRUE)
ON CONFLICT (code) DO NOTHING;
