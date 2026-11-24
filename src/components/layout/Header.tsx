import React, { useState } from 'react';
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatBDT } from '../../utils/format';
import { BrandLogo } from '../common/BrandLogo';
import { SafeImage } from '../common/SafeImage';

export const Header: React.FC = () => {
  const {
    lang,
    setLang,
    t,
    storefront,
    cartCount,
    wishlistIds,
    setCartDrawerOpen,
    searchOverlayOpen,
    setSearchOverlayOpen,
    customerUser,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [skincareOpen, setSkincareOpen] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const announcementText =
    lang === 'bn'
      ? storefront?.settings.announcement_bar_bn ||
        'আপনার ত্বকের জন্য সেরা কোরিয়ান স্কিনকেয়ার রুটিন খুঁজে নিন'
      : storefront?.settings.announcement_bar ||
        'Discover Your Perfect Korean Skincare Routine';

  const categories = storefront?.categories || [];
  const allProducts = storefront?.products || [];

  const suggestions =
    searchTerm.trim().length >= 2
      ? allProducts
          .filter((p) => {
            const q = searchTerm.trim().toLowerCase();
            return (
              p.name.toLowerCase().includes(q) ||
              p.brand_name.toLowerCase().includes(q) ||
              p.category_name.toLowerCase().includes(q)
            );
          })
          .slice(0, 5)
      : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearchOverlayOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#EAE6E3]">
      {/* Slim Editable Announcement Bar (<= 32px) */}
      {announcementVisible && (
        <div className="bg-[#FAF8F5] border-b border-[#EAE6E3] px-4 h-8 flex items-center justify-center relative text-[11px] sm:text-xs text-[#242424] tracking-wide">
          <p className="truncate max-w-[85%] text-center">{announcementText}</p>
          <button
            type="button"
            onClick={() => setAnnouncementVisible(false)}
            aria-label="Dismiss announcement"
            className="absolute right-3 text-[#777777] hover:text-[#242424] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Left: Mobile Menu Button + Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden w-10 h-10 -ml-2 flex items-center justify-center text-[#242424]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BrandLogo to="/" />
        </div>

        {/* Center: Clean Single-Line Editorial Navigation Links */}
        <nav
          aria-label="Main navigation"
          className="hidden lg:flex items-center gap-6 text-[13px] tracking-wide text-[#242424]"
        >
          <Link
            to="/"
            className="hover:text-[#777777] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {t.nav.home}
          </Link>
          <Link
            to="/shop"
            className="hover:text-[#777777] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {t.nav.shopAll}
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setSkincareOpen(true)}
            onMouseLeave={() => setSkincareOpen(false)}
          >
            <button
              type="button"
              onClick={() => setSkincareOpen((v) => !v)}
              aria-expanded={skincareOpen}
              className="inline-flex items-center gap-1 hover:text-[#777777] transition-colors whitespace-nowrap shrink-0 py-1"
            >
              <span>{t.nav.skincare}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {skincareOpen && (
              <div className="absolute left-0 top-full pt-2 w-60 z-50">
                <div className="bg-white border border-[#EAE6E3] shadow-sm py-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setSkincareOpen(false)}
                      className="block px-4 py-2 text-xs text-[#242424] hover:bg-[#FAF8F5] transition-colors"
                    >
                      {lang === 'bn' ? cat.name_bn : cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/bestsellers"
            className="hover:text-[#777777] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {t.nav.bestsellers}
          </Link>
          <Link
            to="/new-arrivals"
            className="hover:text-[#777777] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {t.nav.newArrivals}
          </Link>
          <Link
            to="/about"
            className="hover:text-[#777777] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {t.nav.about}
          </Link>
          <Link
            to="/contact"
            className="hover:text-[#777777] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {t.nav.contact}
          </Link>
        </nav>

        {/* Right: Utility Icons + Language Switcher */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            aria-label="Toggle language between English and Bangla"
            className="px-2.5 py-1.5 text-xs border border-[#EAE6E3] text-[#242424] hover:bg-[#FAF8F5] transition-colors whitespace-nowrap shrink-0"
          >
            {lang === 'en' ? 'বাংলা' : 'EN'}
          </button>

          <button
            type="button"
            onClick={() => setSearchOverlayOpen(true)}
            aria-label="Search products"
            className="w-10 h-10 flex items-center justify-center text-[#242424] hover:text-[#777777]"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <Link
            to={customerUser ? '/account' : '/login'}
            aria-label={t.nav.account}
            className="hidden sm:flex w-10 h-10 items-center justify-center text-[#242424] hover:text-[#777777]"
          >
            <User className="w-[18px] h-[18px]" />
          </Link>

          <Link
            to="/wishlist"
            aria-label={t.nav.wishlist}
            className="relative w-10 h-10 flex items-center justify-center text-[#242424] hover:text-[#777777]"
          >
            <Heart className="w-[18px] h-[18px]" />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1.5 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-[#D5A7A8] text-white text-[10px] font-medium tabular-nums">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            aria-label={t.nav.cart}
            className="relative w-10 h-10 flex items-center justify-center text-[#242424] hover:text-[#777777]"
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-[#242424] text-white text-[10px] font-medium tabular-nums">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOverlayOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search Floria Korean Beauty"
          className="fixed inset-0 z-50 bg-black/35"
          onClick={() => setSearchOverlayOpen(false)}
        >
          <div
            className="bg-white border-b border-[#EAE6E3] px-4 sm:px-8 py-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-[#242424] pb-2">
                <Search className="w-5 h-5 text-[#777777] shrink-0" />
                <input
                  type="search"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.shop.searchPlaceholder}
                  className="flex-1 bg-transparent text-base text-[#242424] placeholder:text-[#777777] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#242424] text-white text-xs tracking-wider uppercase"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOverlayOpen(false)}
                  aria-label="Close search"
                  className="p-2 text-[#777777] hover:text-[#242424]"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>

              {suggestions.length > 0 && (
                <div className="mt-4 divide-y divide-[#EAE6E3]">
                  {suggestions.map((p) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.slug}`}
                      onClick={() => setSearchOverlayOpen(false)}
                      className="flex items-center justify-between py-2.5 hover:bg-[#FAF8F5] px-2 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 bg-[#FAF8F5] border border-[#EAE6E3] shrink-0 overflow-hidden">
                          <SafeImage src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wider text-[#777777]">{p.brand_name}</p>
                          <p className="text-sm text-[#242424] truncate">{p.name}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-[#242424] tabular-nums ml-4 shrink-0">
                        {formatBDT(p.price)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-50 flex bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-80 max-w-[85vw] bg-white h-full flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="px-5 py-4 border-b border-[#EAE6E3] flex items-center justify-between">
                <BrandLogo to="/" compact />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close mobile menu"
                  className="w-10 h-10 flex items-center justify-center text-[#242424]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-1">
                {[
                  { to: '/', label: t.nav.home },
                  { to: '/shop', label: t.nav.shopAll },
                  { to: '/bestsellers', label: t.nav.bestsellers },
                  { to: '/new-arrivals', label: t.nav.newArrivals },
                  { to: '/about', label: t.nav.about },
                  { to: '/contact', label: t.nav.contact },
                  { to: '/wishlist', label: t.nav.wishlist },
                  { to: customerUser ? '/account' : '/login', label: t.nav.account },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 text-sm text-[#242424] border-b border-[#EAE6E3]/60"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="pt-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#777777] mb-2">
                    {t.nav.skincare}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-2 text-sm text-[#777777] hover:text-[#242424]"
                      >
                        {lang === 'bn' ? cat.name_bn : cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#EAE6E3] bg-[#FAF8F5] flex items-center justify-between">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs uppercase tracking-wider text-[#777777] hover:text-[#242424]"
              >
                {t.nav.admin}
              </Link>
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                className="px-3 py-1.5 text-xs border border-[#EAE6E3] bg-white text-[#242424]"
              >
                {lang === 'en' ? 'বাংলা' : 'English'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
