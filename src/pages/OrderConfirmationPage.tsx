import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import type { Order } from '../types';
import {
  buildWhatsAppLink,
  formatBDT,
  getOrderWhatsAppConfirmationMessage,
} from '../utils/format';
import { SEOHead } from '../components/common/SEOHead';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const { storefront, refreshStorefront } = useApp();
  const stateOrder = (location.state as { order?: Order } | null)?.order || null;

  const [order, setOrder] = useState<Order | null>(stateOrder);
  const [loading, setLoading] = useState(!stateOrder);

  useEffect(() => {
    refreshStorefront();
  }, [refreshStorefront]);

  useEffect(() => {
    if (!stateOrder && orderNumber) {
      apiRequest<{ order: Order }>(`/api/orders/lookup/${encodeURIComponent(orderNumber)}`)
        .then((res) => setOrder(res.order))
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    }
  }, [orderNumber, stateOrder]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center text-sm text-[#777777]">
        Loading order receipt...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="font-serif text-3xl text-[#242424]">Order Not Found</h1>
        <Link
          to="/shop"
          className="inline-block px-6 py-3 bg-[#242424] text-white text-xs uppercase tracking-widest"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const waHref = buildWhatsAppLink(
    getOrderWhatsAppConfirmationMessage(order),
    storefront?.settings.whatsapp_number
  );

  return (
    <>
      <SEOHead title={`Order ${order.order_number} | Floria Korean Beauty`} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-[#FAF8F5] border border-[#EAE6E3] p-8 sm:p-10 space-y-6">
          <div className="flex items-start gap-4 border-b border-[#EAE6E3] pb-6">
            <CheckCircle2 className="w-8 h-8 text-[#D5A7A8] shrink-0 mt-1" />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#777777]">
                Thank You for Your Order
              </p>
              <h1 className="mt-1 font-serif text-3xl font-medium text-[#242424]">
                Order {order.order_number}
              </h1>
              <p className="mt-2 text-sm text-[#777777]">
                Your order has been saved securely. Our Dhaka team will confirm delivery shortly.
              </p>
            </div>
          </div>

          {/* Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#777777] mb-1">
                Customer Details
              </p>
              <p className="font-medium text-[#242424]">{order.customer_name}</p>
              <p className="text-[#777777] tabular-nums">{order.phone}</p>
              <p className="text-[#777777] mt-1">
                {order.address}, {order.area}, {order.district}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#777777] mb-1">
                Order & Payment
              </p>
              <p className="text-[#242424]">
                Status: <span className="font-medium">{order.order_status}</span>
              </p>
              <p className="text-[#242424]">
                Payment: <span className="font-medium">{order.payment_method}</span> ({order.payment_status})
              </p>
              <p className="text-[#777777]">Zone: {order.shipping_zone_name}</p>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-[#EAE6E3] pt-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-[#777777]">Ordered Items</p>
            <div className="divide-y divide-[#EAE6E3] bg-white border border-[#EAE6E3] px-4">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between text-sm">
                  <span>
                    {item.product_name}{' '}
                    <span className="text-[#777777] tabular-nums">× {item.quantity}</span>
                  </span>
                  <span className="font-medium tabular-nums">{formatBDT(item.line_total)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-sm pt-3">
              <div className="flex justify-between text-[#777777]">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatBDT(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-[#242424]">
                  <span>Discount</span>
                  <span className="tabular-nums">-{formatBDT(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#777777]">
                <span>Delivery Charge</span>
                <span className="tabular-nums">
                  {order.shipping_charge === 0 ? 'Free' : formatBDT(order.shipping_charge)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#EAE6E3] text-base font-semibold text-[#242424]">
                <span>Total Payable</span>
                <span className="tabular-nums">{formatBDT(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Confirmation Action */}
          <div className="pt-4 border-t border-[#EAE6E3] space-y-3">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium inline-flex items-center justify-center gap-2 hover:bg-[#3a3a3a]"
            >
              <MessageCircle className="w-4 h-4 text-[#D5A7A8]" />
              <span>Send Order Details on WhatsApp</span>
            </a>
            <p className="text-xs text-[#777777] text-center">
              Note: Opening WhatsApp drafts your message automatically. Please tap Send inside WhatsApp to share your confirmation with our team.
            </p>
            <div className="text-center pt-2">
              <Link to="/shop" className="text-xs uppercase tracking-wider underline text-[#242424]">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
