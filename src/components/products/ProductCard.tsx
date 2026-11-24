import React from 'react';
import { Eye, Heart, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Product } from '../../types';
import { formatBDT } from '../../utils/format';
import { SafeImage } from '../common/SafeImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, toggleWishlist, isWishlisted, setQuickViewProduct, t } = useApp();
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock_quantity <= 0;

  return (
    <article className="group flex flex-col bg-white border border-[#EAE6E3] transition-transform duration-200 hover:-translate-y-0.5">
      {/* Neutral imagery surface (65%+ of card) */}
      <div className="relative aspect-[4/3] bg-[#FAF8F5] overflow-hidden border-b border-[#EAE6E3]">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <SafeImage
            src={product.image_url}
            alt={`${product.brand_name} ${product.name}`}
            fallbackTitle={product.brand_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        {/* Subtle functional affordances top-right */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`w-9 h-9 flex items-center justify-center bg-white/95 border border-[#EAE6E3] transition-colors ${
              wishlisted ? 'text-[#242424]' : 'text-[#777777] hover:text-[#242424]'
            }`}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-[#D5A7A8] text-[#D5A7A8]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setQuickViewProduct(product)}
            aria-label={`Quick view ${product.name}`}
            className="w-9 h-9 flex items-center justify-center bg-white/95 border border-[#EAE6E3] text-[#777777] hover:text-[#242424] transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Body with strict clean unboxed metadata */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em] text-[#777777]">
            <span className="truncate">{product.brand_name}</span>
            <span className="shrink-0 tabular-nums">
              {outOfStock
                ? t.product.outOfStock
                : product.discount_percent > 0
                ? `${product.discount_percent}% ${t.product.off}`
                : product.category_name}
            </span>
          </div>

          <Link
            to={`/product/${product.slug}`}
            className="mt-1.5 block text-[15px] font-medium text-[#242424] leading-snug line-clamp-2 hover:text-[#777777] transition-colors"
          >
            {product.name}
          </Link>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#777777]">
            <Star className="w-3.5 h-3.5 fill-[#D5A7A8] text-[#D5A7A8]" aria-hidden="true" />
            <span className="tabular-nums font-medium text-[#242424]">{product.rating.toFixed(1)}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">({product.review_count})</span>
            {!outOfStock && product.stock_quantity <= 5 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#777777]">{t.product.lowStock}</span>
              </>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-[#EAE6E3] flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-[15px] font-semibold text-[#242424] tabular-nums whitespace-nowrap">
              {formatBDT(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-[#777777] line-through tabular-nums whitespace-nowrap">
                {formatBDT(product.original_price)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => addToCart(product, 1, true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium tracking-wider uppercase whitespace-nowrap shrink-0 bg-[#242424] text-white hover:bg-[#3a3a3a] disabled:bg-[#EAE6E3] disabled:text-[#777777] disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{outOfStock ? t.product.outOfStock : t.product.addToCart}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
