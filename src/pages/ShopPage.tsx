import React, { useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SKIN_TYPES } from '../config/business';
import { useApp } from '../context/AppContext';
import { formatBDT } from '../utils/format';
import { SEOHead } from '../components/common/SEOHead';
import { ProductCard } from '../components/products/ProductCard';

interface ShopPageProps {
  mode?: 'all' | 'category' | 'bestsellers' | 'new-arrivals' | 'search';
}

export const ShopPage: React.FC<ShopPageProps> = ({ mode = 'all' }) => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { storefront, loadingStorefront, lang, t } = useApp();

  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    mode === 'category' && slug ? slug : 'all'
  );
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedSkinType, setSelectedSkinType] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(3500);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(mode === 'bestsellers');
  const [newArrivalOnly, setNewArrivalOnly] = useState(mode === 'new-arrivals');
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL category param if user navigates between categories
  React.useEffect(() => {
    if (mode === 'category' && slug) {
      setSelectedCategory(slug);
    } else if (mode === 'all') {
      setSelectedCategory('all');
    }
    setBestsellerOnly(mode === 'bestsellers');
    setNewArrivalOnly(mode === 'new-arrivals');
  }, [mode, slug]);

  React.useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  const categories = storefront?.categories || [];
  const brands = storefront?.brands || [];
  const products = storefront?.products || [];

  const activeCategoryObj = categories.find((c) => c.slug === selectedCategory);

  const pageTitle = useMemo(() => {
    if (mode === 'bestsellers') return t.nav.bestsellers;
    if (mode === 'new-arrivals') return t.nav.newArrivals;
    if (mode === 'search') return `Search${searchQuery ? `: "${searchQuery}"` : ''}`;
    if (activeCategoryObj) return lang === 'bn' ? activeCategoryObj.name_bn : activeCategoryObj.name;
    return t.shop.title;
  }, [mode, activeCategoryObj, lang, searchQuery, t]);

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      if (selectedCategory !== 'all' && p.category_slug !== selectedCategory) return false;
      if (selectedBrand !== 'all' && p.brand_name !== selectedBrand) return false;
      if (selectedSkinType !== 'All' && !p.skin_types.includes(selectedSkinType)) return false;
      if (p.price > maxPrice) return false;
      if (inStockOnly && p.stock_quantity <= 0) return false;
      if (bestsellerOnly && !p.is_bestseller) return false;
      if (newArrivalOnly && !p.is_new_arrival) return false;
      if (discountOnly && p.discount_percent <= 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${p.name} ${p.brand_name} ${p.category_name} ${p.ingredients} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => b.id - a.id);
        break;
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating || b.review_count - a.review_count);
        break;
      case 'popular':
        sorted.sort((a, b) => b.review_count - a.review_count);
        break;
      default:
        sorted.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.id - b.id);
    }
    return sorted;
  }, [
    products,
    selectedCategory,
    selectedBrand,
    selectedSkinType,
    maxPrice,
    inStockOnly,
    bestsellerOnly,
    newArrivalOnly,
    discountOnly,
    searchQuery,
    sortBy,
  ]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedSkinType('All');
    setMaxPrice(3500);
    setInStockOnly(false);
    setBestsellerOnly(false);
    setNewArrivalOnly(false);
    setDiscountOnly(false);
    setSortBy('featured');
    if (searchParams.has('q')) setSearchParams({});
  };

  const FilterPanel = (
    <div className="space-y-7 text-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE6E3]">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#242424] flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          {t.shop.filters}
        </span>
        <button
          type="button"
          onClick={resetAllFilters}
          className="text-xs text-[#777777] hover:text-[#242424] underline"
        >
          {t.shop.clearFilters}
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="text-xs uppercase tracking-[0.14em] text-[#242424] font-medium mb-3">
          {t.shop.category}
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`block w-full text-left py-1 text-xs transition-colors ${
              selectedCategory === 'all' ? 'font-semibold text-[#242424]' : 'text-[#777777] hover:text-[#242424]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`block w-full text-left py-1 text-xs transition-colors ${
                selectedCategory === cat.slug
                  ? 'font-semibold text-[#242424]'
                  : 'text-[#777777] hover:text-[#242424]'
              }`}
            >
              {lang === 'bn' ? cat.name_bn : cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div>
        <label htmlFor="brand-filter" className="block text-xs uppercase tracking-[0.14em] text-[#242424] font-medium mb-2">
          {t.shop.brand}
        </label>
        <select
          id="brand-filter"
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-[#EAE6E3] text-xs text-[#242424] focus:outline-none focus:border-[#242424]"
        >
          <option value="all">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Skin Type Filter */}
      <div>
        <label htmlFor="skintype-filter" className="block text-xs uppercase tracking-[0.14em] text-[#242424] font-medium mb-2">
          {t.shop.skinType}
        </label>
        <select
          id="skintype-filter"
          value={selectedSkinType}
          onChange={(e) => setSelectedSkinType(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-[#EAE6E3] text-xs text-[#242424] focus:outline-none focus:border-[#242424]"
        >
          <option value="All">All Skin Types</option>
          {SKIN_TYPES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Price Filter */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="uppercase tracking-[0.14em] text-[#242424] font-medium">
            {t.shop.priceRange}
          </span>
          <span className="tabular-nums font-medium text-[#242424]">{formatBDT(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={450}
          max={3500}
          step={50}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#242424]"
        />
      </div>

      {/* Attribute Toggles */}
      <div className="space-y-2.5 pt-2 border-t border-[#EAE6E3]">
        <label className="flex items-center gap-2.5 text-xs text-[#242424] cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-[#242424]"
          />
          <span>{t.shop.inStockOnly}</span>
        </label>
        <label className="flex items-center gap-2.5 text-xs text-[#242424] cursor-pointer">
          <input
            type="checkbox"
            checked={bestsellerOnly}
            onChange={(e) => setBestsellerOnly(e.target.checked)}
            className="accent-[#242424]"
          />
          <span>{t.shop.bestsellersOnly}</span>
        </label>
        <label className="flex items-center gap-2.5 text-xs text-[#242424] cursor-pointer">
          <input
            type="checkbox"
            checked={newArrivalOnly}
            onChange={(e) => setNewArrivalOnly(e.target.checked)}
            className="accent-[#242424]"
          />
          <span>{t.shop.newArrivalsOnly}</span>
        </label>
        <label className="flex items-center gap-2.5 text-xs text-[#242424] cursor-pointer">
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={(e) => setDiscountOnly(e.target.checked)}
            className="accent-[#242424]"
          />
          <span>{t.shop.discountedOnly}</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      <SEOHead
        title={`${pageTitle} | Floria Korean Beauty`}
        description="Browse curated Korean cleansers, toners, serums, moisturizers, and sunscreens at Floria Korean Beauty Bangladesh."
      />

      <div className="bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#777777]">
            Floria Korean Beauty Catalog
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
            {pageTitle}
          </h1>
          {activeCategoryObj && (
            <p className="mt-2 text-sm text-[#777777] max-w-2xl">{activeCategoryObj.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search + Sort Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#EAE6E3]">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.shop.searchPlaceholder}
                aria-label="Search products"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm text-[#242424] placeholder:text-[#777777] focus:outline-none focus:border-[#242424]"
              />
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 border border-[#EAE6E3] bg-white text-xs uppercase tracking-wider text-[#242424]"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{t.shop.filters}</span>
            </button>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4">
            <span className="text-xs text-[#777777] tabular-nums">
              {t.shop.showing} {filteredProducts.length} {t.shop.productsCount}
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={t.shop.sortBy}
              className="px-3 py-2 bg-white border border-[#EAE6E3] text-xs text-[#242424] focus:outline-none focus:border-[#242424]"
            >
              <option value="featured">{t.shop.sortFeatured}</option>
              <option value="newest">{t.shop.sortNewest}</option>
              <option value="price_asc">{t.shop.sortPriceAsc}</option>
              <option value="price_desc">{t.shop.sortPriceDesc}</option>
              <option value="rating">{t.shop.sortRating}</option>
              <option value="popular">{t.shop.sortPopular}</option>
            </select>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">{FilterPanel}</aside>

          {/* Product Grid */}
          <div className="lg:col-span-9">
            {loadingStorefront ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-[#FAF8F5] border border-[#EAE6E3] animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 px-6 text-center bg-[#FAF8F5] border border-[#EAE6E3] space-y-4">
                <p className="text-sm text-[#777777]">{t.shop.noResults}</p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 bg-[#242424] text-white text-xs uppercase tracking-widest"
                >
                  {t.shop.clearFilters}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 flex justify-end lg:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div
            className="w-80 max-w-[85vw] bg-white h-full p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-serif text-xl font-medium text-[#242424]">
                {t.shop.filters}
              </span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="p-1 text-[#777777]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {FilterPanel}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-8 w-full py-3 bg-[#242424] text-white text-xs tracking-widest uppercase"
            >
              Show {filteredProducts.length} Results
            </button>
          </div>
        </div>
      )}
    </>
  );
};
