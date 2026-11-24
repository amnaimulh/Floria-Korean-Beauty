export type Language = 'en' | 'bn';

export interface SocialLinks {
  facebook: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  youtube: string;
  pinterest: string;
  tiktok: string;
}

export interface StoreSettings {
  id: number;
  brand_name: string;
  tagline: string;
  phone: string;
  whatsapp_display: string;
  whatsapp_number: string;
  address: string;
  currency_code: string;
  currency_symbol: string;
  email: string;
  announcement_bar: string;
  announcement_bar_bn: string;
  seo_title: string;
  seo_description: string;
  social_links: SocialLinks;
  shipping_policy: string;
  return_policy: string;
  privacy_policy: string;
  terms_conditions: string;
  updated_at?: string;
}

export interface HomepageSettings {
  hero_title: string;
  hero_title_bn: string;
  hero_subtitle: string;
  hero_subtitle_bn: string;
  hero_image: string;
  hero_primary_cta: string;
  hero_secondary_cta: string;
  intro_title: string;
  intro_description: string;
  editorial_title: string;
  editorial_subtitle: string;
  editorial_image: string;
  editorial_cta: string;
  newsletter_title: string;
  newsletter_subtitle: string;
}

export interface Category {
  id: number;
  name: string;
  name_bn: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  is_visible: boolean;
  product_count?: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  description: string;
  product_count?: number;
}

export interface Product {
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
  skin_types: string[];
  usage_instructions: string;
  image_url: string;
  gallery_images: string[];
  price: number;
  original_price: number | null;
  discount_percent: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_demo: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: number;
  product_id: number;
  product_name?: string;
  customer_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  is_demo: boolean;
  created_at: string;
}

export interface ShippingZone {
  id: number;
  name: string;
  name_bn: string;
  area_keywords: string;
  charge: number;
  free_threshold: number | null;
  estimated_days: string;
  is_active: boolean;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus = 'Unpaid' | 'Paid' | 'Refunded';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  brand_name: string;
  sku: string;
  image_url: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number | null;
  customer_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  district: string;
  area: string;
  address: string;
  notes: string;
  internal_notes: string;
  payment_method: 'Cash on Delivery' | 'WhatsApp Confirmation';
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  coupon_code: string | null;
  shipping_zone_id: number | null;
  shipping_zone_name: string;
  shipping_charge: number;
  total_amount: number;
  stock_restored: boolean;
  created_at: string;
  items?: OrderItem[];
}

export interface CustomerRecord {
  id: number;
  user_id: number | null;
  full_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  district: string;
  area: string;
  address: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export interface UserSession {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: 'customer' | 'admin';
}

export interface AdminActivityLog {
  id: number;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}
