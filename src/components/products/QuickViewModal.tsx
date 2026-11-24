import React, { useEffect, useState } from 'react';
import { Heart, Minus, Plus, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatBDT } from '../../utils/format';
import { SafeImage } from '../common/SafeImage';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, toggleWishlist, isWishlisted, t } = useApp();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
  }, [quickViewProduct]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickViewProduct(null);
    };
    if (quickViewProduct) window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quickViewProduct, setQuickViewProduct]);

  if (!quickViewProduct) return null;

  const p = quickViewProduct;
  const outOfStock = p.stock_quantity <= 0;
  const wishlisted = isWishlisted(p.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={p.name}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[1px]"
      onClick={() => setQuickViewProduct(null)}
    >
      <div
        className="relative w-full max-w-3xl bg-white border border-[#EAE6E3] grid grid-cols-1 md:grid-cols-2 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setQuickViewProduct(null)}
          aria-label="Close quick view"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-white border border-[#EAE6E3] text-[#242424] hover:bg-[#FAF8F5]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-[#FAF8F5] aspect-[4/3] md:aspect-auto md:h-full border-b md:border-b-0 md:border-r border-[#EAE6E3]">
          <SafeImage
            src={p.image_url}
            alt={p.name}
            fallbackTitle={p.brand_name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#777777]">
              {p.brand_name} · {p.category_name}
            </p>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-medium text-[#242424] leading-tight">
              {p.name}
            </h2>

            <div className="mt-3 flex items-center gap-2 text-xs text-[#777777]">
              <Star className="w-3.5 h-3.5 fill-[#D5A7A8] text-[#D5A7A8]" />
              <span className="font-medium text-[#242424] tabular-nums">{p.rating.toFixed(1)}</span>
              <span>·</span>
              <span className="tabular-nums">{p.review_count} reviews</span>
              <span>·</span>
              <span>
                {outOfStock ? t.product.outOfStock : `${t.product.inStock} (${p.stock_quantity})`}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-xl font-semibold text-[#242424] tabular-nums">
                {formatBDT(p.price)}
              </span>
              {p.original_price && p.original_price > p.price && (
                <>
                  <span className="text-sm text-[#777777] line-through tabular-nums">
                    {formatBDT(p.original_price)}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-[#242424]">
                    {p.discount_percent}% {t.product.off}
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 text-sm text-[#777777] leading-relaxed">{p.description}</p>

            {p.skin_types.length > 0 && (
              <p className="mt-3 text-xs text-[#777777]">
                <span className="text-[#242424] font-medium">{t.product.skinType}:</span>{' '}
                {p.skin_types.join(' · ')}
              </p>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-[#EAE6E3]">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-[#EAE6E3] bg-[#FAF8F5]">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-10 h-10 flex items-center justify-center text-[#242424] hover:bg-white"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm tabular-nums font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(Math.max(1, p.stock_quantity), q + 1))}
                  aria-label="Increase quantity"
                  className="w-10 h-10 flex items-center justify-center text-[#242424] hover:bg-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  addToCart(p, qty, true);
                  setQuickViewProduct(null);
                }}
                className="flex-1 py-3 px-5 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#3a3a3a] disabled:bg-[#EAE6E3] disabled:text-[#777777] transition-colors"
              >
                {outOfStock ? t.product.outOfStock : t.product.addToCart}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(p)}
                aria-label="Toggle wishlist"
                className="w-10 h-10 flex items-center justify-center border border-[#EAE6E3] hover:border-[#D5A7A8]"
              >
                <Heart
                  className={`w-4 h-4 ${wishlisted ? 'fill-[#D5A7A8] text-[#D5A7A8]' : 'text-[#242424]'}`}
                />
              </button>
            </div>

            <Link
              to={`/product/${p.slug}`}
              onClick={() => setQuickViewProduct(null)}
              className="block text-center py-2.5 text-xs tracking-widest uppercase text-[#242424] border border-[#EAE6E3] hover:bg-[#FAF8F5] transition-colors"
            >
              View Full Product Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
