import React, { useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import { buildWhatsAppLink, formatBDT, getCartWhatsAppMessage } from '../utils/format';
import { SafeImage } from '../components/common/SafeImage';
import { SEOHead } from '../components/common/SEOHead';

export const CartPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    updateCartQty,
    removeFromCart,
    storefront,
    notify,
    t,
  } = useApp();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_amount: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const zones = storefront?.shippingZones || [];
  const defaultZone = zones.find((z) => z.name.toLowerCase().includes('inside')) || zones[0];
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const netSubtotal = Math.max(0, cartSubtotal - discountAmount);
  const estimatedShipping = defaultZone
    ? defaultZone.free_threshold !== null && netSubtotal >= defaultZone.free_threshold
      ? 0
      : defaultZone.charge
    : 70;
  const totalPayable = netSubtotal + estimatedShipping;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await apiRequest<{ code: string; discount_amount: number }>(
        '/api/coupons/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code: couponInput.trim(), subtotal: cartSubtotal }),
        }
      );
      setAppliedCoupon(res);
      notify(`Coupon ${res.code} applied (-${formatBDT(res.discount_amount)}).`, 'success');
    } catch (err) {
      setAppliedCoupon(null);
      notify(err instanceof Error ? err.message : 'Invalid coupon code.', 'error');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const waHref = buildWhatsAppLink(
    getCartWhatsAppMessage({
      items: cart,
      subtotal: cartSubtotal,
      discount: discountAmount,
      shippingCharge: estimatedShipping,
      total: totalPayable,
    }),
    storefront?.settings.whatsapp_number
  );

  return (
    <>
      <SEOHead title={`${t.cart.title} | Floria Korean Beauty`} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#242424] mb-8">
          {t.cart.title}
        </h1>

        {cart.length === 0 ? (
          <div className="py-20 text-center bg-[#FAF8F5] border border-[#EAE6E3] space-y-4">
            <ShoppingBag className="w-10 h-10 text-[#D5A7A8] mx-auto" />
            <p className="text-sm text-[#777777]">{t.cart.empty}</p>
            <Link
              to="/shop"
              className="inline-block px-7 py-3 bg-[#242424] text-white text-xs tracking-widest uppercase"
            >
              {t.cart.continueShopping}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Cart Items Table */}
            <div className="lg:col-span-8 border border-[#EAE6E3] divide-y divide-[#EAE6E3]">
              <div className="hidden sm:grid grid-cols-12 px-5 py-3 bg-[#FAF8F5] text-xs uppercase tracking-wider text-[#777777]">
                <span className="col-span-6">Product</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-2 text-center">Quantity</span>
                <span className="col-span-2 text-right">Subtotal</span>
              </div>

              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
                >
                  <div className="sm:col-span-6 flex items-center gap-4">
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="w-20 h-20 bg-[#FAF8F5] border border-[#EAE6E3] shrink-0 overflow-hidden"
                    >
                      <SafeImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-[#777777]">
                        {item.product.brand_name}
                      </p>
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="text-sm font-medium text-[#242424] hover:underline block"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#777777] hover:text-[#242424]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.cart.remove}</span>
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2 sm:text-right text-sm text-[#242424] tabular-nums">
                    <span className="sm:hidden text-[#777777] mr-2">Price:</span>
                    {formatBDT(item.product.price)}
                  </div>

                  <div className="sm:col-span-2 flex sm:justify-center">
                    <div className="inline-flex items-center border border-[#EAE6E3] bg-[#FAF8F5]">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-8 h-8 flex items-center justify-center hover:bg-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-8 h-8 flex items-center justify-center hover:bg-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2 sm:text-right text-sm font-semibold text-[#242424] tabular-nums">
                    <span className="sm:hidden text-[#777777] font-normal mr-2">Subtotal:</span>
                    {formatBDT(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <aside className="lg:col-span-4 bg-[#FAF8F5] border border-[#EAE6E3] p-6 space-y-5 h-fit">
              <h2 className="font-serif text-2xl font-medium text-[#242424]">Order Summary</h2>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder={t.cart.couponPlaceholder}
                  className="flex-1 px-3 py-2 bg-white border border-[#EAE6E3] text-xs focus:outline-none focus:border-[#242424]"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon}
                  className="px-4 py-2 bg-[#242424] text-white text-xs uppercase tracking-wider"
                >
                  {t.cart.applyCoupon}
                </button>
              </form>

              <div className="space-y-3 text-sm pt-2 border-t border-[#EAE6E3]">
                <div className="flex justify-between">
                  <span className="text-[#777777]">{t.cart.subtotal}</span>
                  <span className="tabular-nums font-medium">{formatBDT(cartSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#242424]">
                    <span>
                      {t.cart.discount} ({appliedCoupon?.code})
                    </span>
                    <span className="tabular-nums">-{formatBDT(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#777777]">{t.cart.delivery} (Inside Dhaka)</span>
                  <span className="tabular-nums">
                    {estimatedShipping === 0 ? 'Free' : formatBDT(estimatedShipping)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#EAE6E3] text-base font-semibold text-[#242424]">
                  <span>{t.cart.total}</span>
                  <span className="tabular-nums">{formatBDT(totalPayable)}</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      appliedCoupon
                        ? `/checkout?coupon=${encodeURIComponent(appliedCoupon.code)}`
                        : '/checkout'
                    )
                  }
                  className="w-full py-3.5 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#3a3a3a]"
                >
                  {t.cart.proceedCheckout}
                </button>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 border border-[#EAE6E3] bg-white text-xs tracking-widest uppercase text-[#242424] hover:border-[#D5A7A8]"
                >
                  {t.cart.orderWhatsApp}
                </a>
                <Link
                  to="/shop"
                  className="block w-full text-center py-2 text-xs text-[#777777] hover:text-[#242424] underline"
                >
                  {t.cart.continueShopping}
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
};
