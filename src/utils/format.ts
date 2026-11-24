import { OFFICIAL_BUSINESS_CONFIG } from '../config/business';
import type { CartItem, Order, Product } from '../types';

export function formatBDT(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  return `${OFFICIAL_BUSINESS_CONFIG.currencySymbol} ${rounded.toLocaleString('en-IN')}`;
}

export function isValidBdPhoneClient(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+?88)?01[3-9]\d{8}$/.test(cleaned);
}

export function buildWhatsAppLink(message: string, phoneNumber?: string): string {
  const target = (phoneNumber || OFFICIAL_BUSINESS_CONFIG.whatsappNumber).replace(/\D/g, '');
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}

export function getDefaultWhatsAppMessage(): string {
  return 'Hello Floria Korean Beauty, I would like to know more about your Korean skincare products.';
}

export function getProductWhatsAppMessage(product: Product): string {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/product/${product.slug}` : '';
  return [
    'Hello Floria Korean Beauty, I would like to ask about this product:',
    `Product: ${product.name}`,
    `Brand: ${product.brand_name}`,
    `Price: ${formatBDT(product.price)}`,
    url ? `Link: ${url}` : '',
    '',
    'Please let me know more details and availability.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function getCartWhatsAppMessage(params: {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingCharge: number | null;
  total: number;
  customer?: {
    name?: string;
    phone?: string;
    district?: string;
    area?: string;
    address?: string;
  };
}): string {
  const lines: string[] = [
    'Floria Korean Beauty — Order Inquiry',
    '--------------------------------',
    ...params.items.map(
      (item, idx) =>
        `${idx + 1}. ${item.product.name} x${item.quantity} (${formatBDT(item.product.price)} each = ${formatBDT(
          item.product.price * item.quantity
        )})`
    ),
    '--------------------------------',
    `Subtotal: ${formatBDT(params.subtotal)}`,
  ];
  if (params.discount > 0) {
    lines.push(`Discount: -${formatBDT(params.discount)}`);
  }
  lines.push(
    `Delivery Charge: ${params.shippingCharge !== null ? formatBDT(params.shippingCharge) : 'To be confirmed'}`
  );
  lines.push(`Estimated Total: ${formatBDT(params.total)}`);

  if (params.customer && (params.customer.name || params.customer.phone || params.customer.address)) {
    lines.push('', 'Customer Details:');
    if (params.customer.name) lines.push(`Name: ${params.customer.name}`);
    if (params.customer.phone) lines.push(`Phone: ${params.customer.phone}`);
    if (params.customer.district || params.customer.area) {
      lines.push(`Location: ${[params.customer.area, params.customer.district].filter(Boolean).join(', ')}`);
    }
    if (params.customer.address) lines.push(`Address: ${params.customer.address}`);
  }
  return lines.join('\n');
}

export function getOrderWhatsAppConfirmationMessage(order: Order): string {
  const lines = [
    `Hello Floria Korean Beauty, I have placed an order:`,
    `Order ID: ${order.order_number}`,
    `Name: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    `Delivery: ${order.address}, ${order.area}, ${order.district}`,
    `Payment: ${order.payment_method}`,
    '',
    'Items:',
    ...(order.items || []).map(
      (item) => `- ${item.product_name} x${item.quantity} (${formatBDT(item.line_total)})`
    ),
    '',
    `Total Payable: ${formatBDT(order.total_amount)}`,
  ];
  return lines.join('\n');
}
