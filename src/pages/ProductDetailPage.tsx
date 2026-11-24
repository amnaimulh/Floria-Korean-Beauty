import React, { useEffect, useState } from 'react';
import {
  Check,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import type { Product, Review } from '../types';
import {
  buildWhatsAppLink,
  formatBDT,
  getProductWhatsAppMessage,
} from '../utils/format';
import { SafeImage } from '../components/common/SafeImage';
import { SEOHead } from '../components/common/SEOHead';
import { ProductCard } from '../components/products/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isWishlisted, storefront, notify, t } = useApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'usage' | 'shipping'>(
    'description'
  );

  // Review submission state
  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setQty(1);
    apiRequest<{ product: Product; reviews: Review[]; related: Product[] }>(`/api/products/${slug}`)
      .then((data) => {
        if (!active) return;
        setProduct(data.product);
        setReviews(data.reviews);
        setRelated(data.related);
        setActiveImage(data.product.gallery_images[0] || data.product.image_url);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Product not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmittingReview(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          customer_name: revName,
          rating: revRating,
          comment: revComment,
        }),
      });
      notify(res.message, 'success');
      setRevName('');
      setRevComment('');
      setRevRating(5);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-[4/3] bg-[#FAF8F5] border border-[#EAE6E3] animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-40 bg-[#FAF8F5] animate-pulse" />
            <div className="h-12 w-3/4 bg-[#FAF8F5] animate-pulse" />
            <div className="h-28 w-full bg-[#FAF8F5] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="font-serif text-3xl text-[#242424]">Product Not Found</h1>
        <p className="text-sm text-[#777777]">{error || 'This item may have been removed.'}</p>
        <Link
          to="/shop"
          className="inline-block px-6 py-3 bg-[#242424] text-white text-xs tracking-widest uppercase"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock_quantity <= 0;
  const wishlisted = isWishlisted(product.id);
  const waHref = buildWhatsAppLink(
    getProductWhatsAppMessage(product),
    storefront?.settings.whatsapp_number
  );

  // Frequently bought together (next 2 available products from storefront)
  const frequentlyBought = (storefront?.products || [])
    .filter((p) => p.id !== product.id && p.stock_quantity > 0)
    .slice(0, 2);

  return (
    <>
      <SEOHead
        title={`${product.name} | ${product.brand_name} | Floria Korean Beauty`}
        description={product.description}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          brand: { '@type': 'Brand', name: product.brand_name },
          sku: product.sku,
          description: product.description,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'BDT',
            price: product.price,
            availability: outOfStock
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
          },
        }}
      />

      {/* Breadcrumbs */}
      <div className="bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#777777] flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-[#242424]">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#242424]">
            Shop
          </Link>
          <span>/</span>
          <Link to={`/category/${product.category_slug}`} className="hover:text-[#242424]">
            {product.category_name}
          </Link>
          <span>/</span>
          <span className="text-[#242424] truncate">{product.name}</span>
        </div>
      </div>

      {/* Contiguous Product Purchase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Gallery Left */}
          <div className="lg:col-span-6 space-y-3 lg:sticky lg:top-24">
            <div className="aspect-[4/3] bg-[#FAF8F5] border border-[#EAE6E3] overflow-hidden">
              <SafeImage
                src={activeImage || product.image_url}
                alt={product.name}
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>

            {product.gallery_images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.gallery_images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`aspect-[4/3] bg-[#FAF8F5] border overflow-hidden ${
                      activeImage === img ? 'border-[#242424]' : 'border-[#EAE6E3]'
                    }`}
                  >
                    <SafeImage src={img} alt={`${product.name} view ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contiguous Purchase Module Right */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#777777]">
                {product.brand_name} · {product.category_name} · SKU {product.sku}
              </p>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#242424] leading-tight">
                {product.name}
              </h1>

              <div className="mt-3 flex items-center gap-3 text-xs text-[#777777]">
                <span className="inline-flex items-center gap-1 text-[#242424] font-medium">
                  <Star className="w-3.5 h-3.5 fill-[#D5A7A8] text-[#D5A7A8]" />
                  <span className="tabular-nums">{product.rating.toFixed(1)}</span>
                </span>
                <span>·</span>
                <span className="tabular-nums">{product.review_count} reviews</span>
                <span>·</span>
                <span className={outOfStock ? 'text-rose-700 font-medium' : 'text-[#242424]'}>
                  {outOfStock
                    ? t.product.outOfStock
                    : `${t.product.inStock} (${product.stock_quantity} available)`}
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-[#242424] tabular-nums">
                  {formatBDT(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <>
                    <span className="text-base text-[#777777] line-through tabular-nums">
                      {formatBDT(product.original_price)}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-[#242424]">
                      Save {product.discount_percent}%
                    </span>
                  </>
                )}
              </div>
              {product.is_demo && (
                <p className="mt-1 text-[11px] text-[#777777]">
                  Sample catalog listing with illustrative BDT pricing and stock.
                </p>
              )}
            </div>

            <p className="text-sm text-[#777777] leading-relaxed">{product.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-[#EAE6E3] text-xs">
              <div>
                <p className="uppercase tracking-wider text-[#777777] mb-1">{t.product.skinType}</p>
                <p className="text-[#242424] font-medium">{product.skin_types.join(', ')}</p>
              </div>
              <div>
                <p className="uppercase tracking-wider text-[#777777] mb-1">{t.product.benefits}</p>
                <p className="text-[#242424]">{product.benefits}</p>
              </div>
            </div>

            {/* Quantity & Primary Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-[#EAE6E3] bg-[#FAF8F5]">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-11 h-11 flex items-center justify-center hover:bg-white"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-11 text-center text-sm font-medium tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQty((q) => Math.min(Math.max(1, product.stock_quantity), q + 1))
                    }
                    aria-label="Increase quantity"
                    className="w-11 h-11 flex items-center justify-center hover:bg-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={() => addToCart(product, qty, true)}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-2 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#3a3a3a] disabled:bg-[#EAE6E3] disabled:text-[#777777] transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{outOfStock ? t.product.outOfStock : t.product.addToCart}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label="Toggle wishlist"
                  className="w-11 h-11 flex items-center justify-center border border-[#EAE6E3] hover:border-[#D5A7A8]"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      wishlisted ? 'fill-[#D5A7A8] text-[#D5A7A8]' : 'text-[#242424]'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={() => {
                    addToCart(product, qty, false);
                    navigate('/checkout');
                  }}
                  className="h-11 border border-[#242424] text-[#242424] text-xs tracking-widest uppercase font-medium hover:bg-[#FAF8F5] disabled:opacity-50"
                >
                  {t.product.buyNow}
                </button>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 inline-flex items-center justify-center gap-2 border border-[#EAE6E3] bg-[#FAF8F5] text-[#242424] text-xs tracking-wider uppercase font-medium hover:border-[#D5A7A8]"
                >
                  <MessageCircle className="w-4 h-4 text-[#D5A7A8]" />
                  <span>{t.product.askWhatsApp}</span>
                </a>
              </div>
            </div>

            {/* Product Details Tabs */}
            <div className="pt-4">
              <div className="flex border-b border-[#EAE6E3] gap-5 overflow-x-auto">
                {(
                  [
                    { key: 'description', label: t.product.description },
                    { key: 'ingredients', label: t.product.ingredients },
                    { key: 'usage', label: t.product.usage },
                    { key: 'shipping', label: t.product.shippingInfo },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-3 text-xs uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-[#242424] text-[#242424] font-medium'
                        : 'border-transparent text-[#777777] hover:text-[#242424]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="pt-4 text-sm text-[#777777] leading-relaxed">
                {activeTab === 'description' && <p>{product.description}</p>}
                {activeTab === 'ingredients' && <p>{product.ingredients}</p>}
                {activeTab === 'usage' && <p>{product.usage_instructions}</p>}
                {activeTab === 'shipping' && (
                  <div className="space-y-2">
                    <p>{storefront?.settings.shipping_policy}</p>
                    <p className="text-xs">{storefront?.settings.return_policy}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Bought Together */}
      {frequentlyBought.length > 0 && (
        <section className="bg-[#FAF8F5] border-y border-[#EAE6E3] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#242424]">
                  {t.product.freqBought}
                </h2>
                <p className="text-xs text-[#777777] mt-1">
                  Pair with complementary Korean skincare essentials.
                </p>
              </div>
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  addToCart(product, 1, false);
                  frequentlyBought.forEach((p) => addToCart(p, 1, false));
                  notify('Added all 3 routine essentials to your bag.', 'success');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#242424] text-white text-xs tracking-widest uppercase whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  Add Bundle ({formatBDT(product.price + frequentlyBought.reduce((s, p) => s + p.price, 0))})
                </span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[product, ...frequentlyBought].map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.slug}`}
                  className="bg-white border border-[#EAE6E3] p-4 flex items-center gap-4 hover:border-[#D5A7A8]"
                >
                  <div className="w-16 h-16 bg-[#FAF8F5] border border-[#EAE6E3] shrink-0 overflow-hidden">
                    <SafeImage src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-[#777777]">{item.brand_name}</p>
                    <p className="text-sm font-medium text-[#242424] truncate">{item.name}</p>
                    <p className="text-xs font-semibold text-[#242424] tabular-nums mt-1">
                      {formatBDT(item.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customer Reviews + Review Submission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-b border-[#EAE6E3]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-serif text-3xl font-medium text-[#242424]">
              {t.product.reviews} ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-[#777777]">
                No approved reviews yet for this product. Be the first to share your experience.
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-5 bg-[#FAF8F5] border border-[#EAE6E3]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#242424]">{r.customer_name}</span>
                      <span className="text-xs text-[#777777] tabular-nums">
                        {r.created_at.slice(0, 10)}
                        {r.is_demo ? ' · Sample' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < r.rating ? 'fill-[#D5A7A8] text-[#D5A7A8]' : 'text-[#EAE6E3]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-2.5 text-sm text-[#777777] leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <form onSubmit={handleReviewSubmit} className="p-6 bg-[#FAF8F5] border border-[#EAE6E3] space-y-4">
              <h3 className="font-serif text-2xl font-medium text-[#242424]">Write a Review</h3>
              <p className="text-xs text-[#777777]">
                Submitted reviews appear on the storefront after administrator moderation.
              </p>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Rating
                </label>
                <select
                  value={revRating}
                  onChange={(e) => setRevRating(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Stars
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Review
                </label>
                <textarea
                  rows={3}
                  required
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#3a3a3a] disabled:opacity-60"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="font-serif text-3xl font-medium text-[#242424] mb-8">{t.product.related}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
};
