import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, MessageCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BD_DISTRICTS } from '../config/business';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import type { Order } from '../types';
import { formatBDT, isValidBdPhoneClient } from '../utils/format';
import { SafeImage } from '../components/common/SafeImage';
import { SEOHead } from '../components/common/SEOHead';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    clearCart,
    storefront,
    customerUser,
    customerToken,
    notify,
    t,
  } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const zones = storefront?.shippingZones || [];

  const [fullName, setFullName] = useState(customerUser?.full_name || '');
  const [phone, setPhone] = useState(customerUser?.phone || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState(customerUser?.email || '');
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'WhatsApp Confirmation'>(
    'Cash on Delivery'
  );
  const [selectedZoneId, setSelectedZoneId] = useState<number>(0);

  const [couponCode, setCouponCode] = useState(searchParams.get('coupon') || '');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_amount: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(
    () => `floria_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );

  // Auto-select shipping zone matching district
  useEffect(() => {
    if (zones.length === 0) return;
    const isDhaka = district.toLowerCase() === 'dhaka';
    const match =
      zones.find((z) =>
        isDhaka ? z.name.toLowerCase().includes('inside') : z.name.toLowerCase().includes('outside')
      ) || zones[0];
    if (match) setSelectedZoneId(match.id);
  }, [district, zones]);

  // Pre-validate coupon if passed via URL
  useEffect(() => {
    const initial = searchParams.get('coupon');
    if (initial && cartSubtotal > 0) {
      apiRequest<{ code: string; discount_amount: number }>('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: initial, subtotal: cartSubtotal }),
      })
        .then((res) => setAppliedCoupon(res))
        .catch(() => setAppliedCoupon(null));
    }
  }, [searchParams, cartSubtotal]);

  const activeZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) || zones[0],
    [zones, selectedZoneId]
  );

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const netSubtotal = Math.max(0, cartSubtotal - discountAmount);
  const shippingCharge = activeZone
    ? activeZone.free_threshold !== null && netSubtotal >= activeZone.free_threshold
      ? 0
      : activeZone.charge
    : 70;
  const totalAmount = netSubtotal + shippingCharge;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await apiRequest<{ code: string; discount_amount: number }>(
        '/api/coupons/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code: couponCode.trim(), subtotal: cartSubtotal }),
        }
      );
      setAppliedCoupon(res);
      notify(`Coupon ${res.code} applied.`, 'success');
    } catch (err) {
      setAppliedCoupon(null);
      notify(err instanceof Error ? err.message : 'Invalid coupon.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      notify('Your cart is empty.', 'error');
      return;
    }
    if (!isValidBdPhoneClient(phone)) {
      notify('Please enter a valid Bangladeshi mobile number (e.g. 01805-133476).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{ order: Order }>(
        '/api/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            customer_name: fullName,
            phone,
            whatsapp: whatsapp || phone,
            email,
            district,
            area,
            address,
            notes,
            payment_method: paymentMethod,
            shipping_zone_id: activeZone?.id,
            coupon_code: appliedCoupon?.code || null,
            idempotency_key: idempotencyKey,
            items: cart.map((c) => ({
              product_id: c.product.id,
              quantity: c.quantity,
            })),
          }),
        },
        customerToken
      );

      clearCart();
      notify(`Order ${res.order.order_number} placed successfully.`, 'success');
      navigate(`/order-confirmation/${res.order.order_number}`, {
        state: { order: res.order },
      });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Order submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl text-[#242424]">{t.checkout.title}</h1>
        <p className="text-sm text-[#777777]">{t.cart.empty}</p>
        <Link
          to="/shop"
          className="inline-block px-7 py-3 bg-[#242424] text-white text-xs tracking-widest uppercase"
        >
          {t.cart.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead title={`${t.checkout.title} | Floria Korean Beauty`} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
            {t.checkout.title}
          </h1>
          {!customerUser && (
            <p className="text-xs text-[#777777]">
              Guest checkout enabled ·{' '}
              <Link to="/login" className="underline text-[#242424]">
                Sign in
              </Link>{' '}
              for faster checkout
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Customer & Delivery Details */}
          <div className="lg:col-span-7 space-y-8">
            <div className="border border-[#EAE6E3] bg-white p-6 sm:p-8 space-y-5">
              <h2 className="font-serif text-2xl font-medium text-[#242424]">
                {t.checkout.customerInfo}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1.5">
                    {t.checkout.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tasnim Rahman"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1.5">
                    {t.checkout.phone} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm tabular-nums focus:outline-none focus:border-[#242424]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1.5">
                    {t.checkout.whatsapp}
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Same as mobile if blank"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm tabular-nums focus:outline-none focus:border-[#242424]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1.5">
                    {t.checkout.district} *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                  >
                    {BD_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1.5">
                    {t.checkout.area} *
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Demra, Dhanmondi, Uttara"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1.5">
                    {t.checkout.address} *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Road / Flat details"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1.5">
                    {t.checkout.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1.5">
                    {t.checkout.deliveryZone}
                  </label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({formatBDT(z.charge)}) · {z.estimated_days}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1.5">
                    {t.checkout.notes}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Preferred delivery time or gift note"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border border-[#EAE6E3] bg-white p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-2xl font-medium text-[#242424]">
                {t.checkout.paymentMethod}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`p-4 border cursor-pointer flex items-start gap-3 transition-colors ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-[#242424] bg-[#FAF8F5]'
                      : 'border-[#EAE6E3] bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'Cash on Delivery'}
                    onChange={() => setPaymentMethod('Cash on Delivery')}
                    className="mt-1 accent-[#242424]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#242424] flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-[#D5A7A8]" />
                      <span>{t.checkout.cod}</span>
                    </p>
                    <p className="text-xs text-[#777777] mt-1">{t.checkout.codDesc}</p>
                  </div>
                </label>

                <label
                  className={`p-4 border cursor-pointer flex items-start gap-3 transition-colors ${
                    paymentMethod === 'WhatsApp Confirmation'
                      ? 'border-[#242424] bg-[#FAF8F5]'
                      : 'border-[#EAE6E3] bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'WhatsApp Confirmation'}
                    onChange={() => setPaymentMethod('WhatsApp Confirmation')}
                    className="mt-1 accent-[#242424]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#242424] flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-[#D5A7A8]" />
                      <span>{t.checkout.waConfirm}</span>
                    </p>
                    <p className="text-xs text-[#777777] mt-1">{t.checkout.waConfirmDesc}</p>
                  </div>
                </label>
              </div>
              <p className="text-xs text-[#777777]">{t.checkout.whatsappNotice}</p>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <aside className="lg:col-span-5 bg-[#FAF8F5] border border-[#EAE6E3] p-6 sm:p-8 space-y-5 h-fit">
            <h2 className="font-serif text-2xl font-medium text-[#242424]">
              {t.checkout.orderSummary}
            </h2>

            <div className="divide-y divide-[#EAE6E3] max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-white border border-[#EAE6E3] shrink-0 overflow-hidden">
                      <SafeImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#242424] truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-[#777777] tabular-nums">
                        Qty: {item.quantity} × {formatBDT(item.product.price)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[#242424] tabular-nums shrink-0">
                    {formatBDT(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#EAE6E3]">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={t.cart.couponPlaceholder}
                className="flex-1 px-3 py-2 bg-white border border-[#EAE6E3] text-xs focus:outline-none focus:border-[#242424]"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-[#242424] text-white text-xs uppercase tracking-wider"
              >
                {t.cart.applyCoupon}
              </button>
            </div>

            <div className="space-y-2.5 text-sm pt-2 border-t border-[#EAE6E3]">
              <div className="flex justify-between">
                <span className="text-[#777777]">{t.cart.subtotal}</span>
                <span className="tabular-nums">{formatBDT(cartSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#242424]">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="tabular-nums">-{formatBDT(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#777777]">
                  Delivery ({activeZone?.name || 'Standard'})
                </span>
                <span className="tabular-nums">
                  {shippingCharge === 0 ? 'Free' : formatBDT(shippingCharge)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#EAE6E3] text-base font-semibold text-[#242424]">
                <span>{t.cart.total}</span>
                <span className="tabular-nums">{formatBDT(totalAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#242424] text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#3a3a3a] disabled:opacity-60 transition-colors"
            >
              {submitting ? t.checkout.placingOrder : t.checkout.placeOrder}
            </button>
          </aside>
        </form>
      </div>
    </>
  );
};
