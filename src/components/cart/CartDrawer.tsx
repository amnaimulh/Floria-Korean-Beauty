import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  buildWhatsAppLink,
  formatBDT,
  getCartWhatsAppMessage,
} from '../../utils/format';
import { SafeImage } from '../common/SafeImage';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartCount,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQty,
    removeFromCart,
    storefront,
    t,
  } = useApp();
  const navigate = useNavigate();

  if (!cartDrawerOpen) return null;

  const insideDhaka = storefront?.shippingZones.find((z) =>
    z.name.toLowerCase().includes('inside')
  );
  const defaultDelivery = insideDhaka ? insideDhaka.charge : 70;

  const waHref = buildWhatsAppLink(
    getCartWhatsAppMessage({
      items: cart,
      subtotal: cartSubtotal,
      discount: 0,
      shippingCharge: null,
      total: cartSubtotal,
    }),
    storefront?.settings.whatsapp_number
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.cart.title}
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={() => setCartDrawerOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white h-full flex flex-col border-l border-[#EAE6E3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#EAE6E3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-[#242424]" />
            <h2 className="font-serif text-xl font-medium text-[#242424]">
              {t.cart.title} ({cartCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Close shopping bag"
            className="w-9 h-9 flex items-center justify-center text-[#777777] hover:text-[#242424]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <ShoppingBag className="w-10 h-10 text-[#D5A7A8] mx-auto" />
              <p className="text-sm text-[#777777]">{t.cart.empty}</p>
              <Link
                to="/shop"
                onClick={() => setCartDrawerOpen(false)}
                className="inline-block px-6 py-2.5 bg-[#242424] text-white text-xs tracking-widest uppercase"
              >
                {t.cart.continueShopping}
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-4 pb-5 border-b border-[#EAE6E3] last:border-b-0"
              >
                <Link
                  to={`/product/${item.product.slug}`}
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-20 h-20 bg-[#FAF8F5] border border-[#EAE6E3] shrink-0 overflow-hidden"
                >
                  <SafeImage
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#777777]">
                        {item.product.brand_name}
                      </p>
                      <Link
                        to={`/product/${item.product.slug}`}
                        onClick={() => setCartDrawerOpen(false)}
                        className="text-sm font-medium text-[#242424] line-clamp-1 hover:underline"
                      >
                        {item.product.name}
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label={`Remove ${item.product.name}`}
                      className="text-[#777777] hover:text-[#242424] p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#EAE6E3] bg-[#FAF8F5]">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-7 h-7 flex items-center justify-center hover:bg-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-7 h-7 flex items-center justify-center hover:bg-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-sm font-semibold text-[#242424] tabular-nums">
                      {formatBDT(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-[#EAE6E3] bg-[#FAF8F5] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#777777]">{t.cart.subtotal}</span>
              <span className="font-semibold text-[#242424] tabular-nums">
                {formatBDT(cartSubtotal)}
              </span>
            </div>
            <p className="text-xs text-[#777777]">
              Delivery from {formatBDT(defaultDelivery)} (Inside Dhaka) · Cash on Delivery available.
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/checkout');
                }}
                className="w-full py-3 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#3a3a3a] transition-colors"
              >
                {t.cart.proceedCheckout}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/cart"
                  onClick={() => setCartDrawerOpen(false)}
                  className="text-center py-2.5 border border-[#EAE6E3] bg-white text-xs tracking-wider uppercase text-[#242424] hover:bg-[#FAF8F5]"
                >
                  View Bag
                </Link>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center py-2.5 border border-[#EAE6E3] bg-white text-xs tracking-wider uppercase text-[#242424] hover:bg-[#F4E8E8]/50"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
