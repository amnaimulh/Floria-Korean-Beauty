import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SEOHead } from '../components/common/SEOHead';
import { ProductCard } from '../components/products/ProductCard';

export const WishlistPage: React.FC = () => {
  const { wishlistIds, storefront, t } = useApp();
  const savedProducts = (storefront?.products || []).filter((p) => wishlistIds.includes(p.id));

  return (
    <>
      <SEOHead title={`${t.nav.wishlist} | Floria Korean Beauty`} />
      <div className="bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
            {t.nav.wishlist} ({savedProducts.length})
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {savedProducts.length === 0 ? (
          <div className="py-20 text-center bg-[#FAF8F5] border border-[#EAE6E3] space-y-4">
            <Heart className="w-9 h-9 text-[#D5A7A8] mx-auto" />
            <p className="text-sm text-[#777777]">Your wishlist is currently empty.</p>
            <Link
              to="/shop"
              className="inline-block px-7 py-3 bg-[#242424] text-white text-xs tracking-widest uppercase"
            >
              Explore Skincare
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {savedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
