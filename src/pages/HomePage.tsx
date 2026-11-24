import React, { useState } from 'react';
import {
  ArrowRight,
  Banknote,
  HeartHandshake,
  MessageCircle,
  PackageCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { OFFICIAL_BUSINESS_CONFIG } from '../config/business';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import { SafeImage } from '../components/common/SafeImage';
import { SEOHead } from '../components/common/SEOHead';
import { SocialIcons } from '../components/common/SocialIcons';
import { ProductCard } from '../components/products/ProductCard';

export const HomePage: React.FC = () => {
  const { storefront, loadingStorefront, lang, t, notify } = useApp();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNews, setSubmittingNews] = useState(false);

  const homepage = storefront?.homepage;
  const settings = storefront?.settings;
  const categories = storefront?.categories || [];
  const products = storefront?.products || [];
  const reviews = storefront?.reviews || [];

  const bestsellers = products.filter((p) => p.is_bestseller).slice(0, 8);
  const newArrivals = products.filter((p) => p.is_new_arrival).slice(0, 4);

  const routineSteps = [
    {
      num: '01.',
      title: 'Cleanse',
      desc: 'Remove impurities and sunscreen gently to prepare your skin.',
      slug: 'cleansers',
      product: products.find((p) => p.category_slug === 'cleansers'),
    },
    {
      num: '02.',
      title: 'Tone',
      desc: 'Refresh, soothe, and restore comfortable hydration balance.',
      slug: 'toners',
      product: products.find((p) => p.category_slug === 'toners'),
    },
    {
      num: '03.',
      title: 'Treat',
      desc: 'Choose targeted essences, serums, or calming ampoules.',
      slug: 'serums-ampoules',
      product: products.find((p) => p.category_slug === 'serums-ampoules'),
    },
    {
      num: '04.',
      title: 'Moisturize',
      desc: 'Support your skin barrier and lock in lasting softness.',
      slug: 'moisturizers',
      product: products.find((p) => p.category_slug === 'moisturizers'),
    },
    {
      num: '05.',
      title: 'Protect',
      desc: 'Complete your daytime routine with breathable daily sunscreen.',
      slug: 'sunscreens',
      product: products.find((p) => p.category_slug === 'sunscreens'),
    },
  ];

  const trustFeatures = [
    {
      icon: Sparkles,
      title: 'Carefully Curated K-Beauty',
      desc: 'Thoughtfully selected Korean skincare formulas suited for humid and tropical routines.',
    },
    {
      icon: PackageCheck,
      title: 'Convenient Ordering',
      desc: 'Browse by skin type, save your favorites, or order directly as a guest in seconds.',
    },
    {
      icon: Truck,
      title: 'Bangladesh-Wide Delivery',
      desc: 'Reliable home delivery inside Dhaka and nationwide across all districts.',
    },
    {
      icon: Banknote,
      title: 'Cash on Delivery',
      desc: 'Pay comfortably in cash upon receiving your parcel at your doorstep.',
    },
    {
      icon: HeartHandshake,
      title: 'Customer Support',
      desc: 'Dedicated guidance for routine building, order updates, and parcel tracking.',
    },
    {
      icon: MessageCircle,
      title: 'Easy WhatsApp Communication',
      desc: 'Reach our Demra, Dhaka team quickly on +880 1805-133476 anytime.',
    },
  ];

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmittingNews(true);
    try {
      const res = await apiRequest<{ duplicate: boolean; message: string }>('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: newsletterEmail }),
      });
      notify(res.message, res.duplicate ? 'info' : 'success');
      if (!res.duplicate) setNewsletterEmail('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to subscribe right now.', 'error');
    } finally {
      setSubmittingNews(false);
    }
  };

  return (
    <>
      <SEOHead
        title={settings?.seo_title || 'Floria Korean Beauty | Premium Korean Skincare in Bangladesh'}
        description={
          settings?.seo_description ||
          'Discover Korean skincare and beauty essentials at Floria Korean Beauty.'
        }
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: settings?.brand_name || OFFICIAL_BUSINESS_CONFIG.brandName,
          telephone: settings?.phone || OFFICIAL_BUSINESS_CONFIG.phone,
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Demra',
            addressLocality: 'Dhaka',
            postalCode: '1361',
            addressCountry: 'BD',
          },
          sameAs: Object.values(settings?.social_links || OFFICIAL_BUSINESS_CONFIG.socialLinks),
        }}
      />

      {/* SECTION 1: HERO BANNER */}
      <section className="bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 lg:py-24 flex flex-col justify-center">
            <p className="text-xs tracking-[0.2em] uppercase text-[#777777]">
              Floria Korean Beauty · Dhaka, Bangladesh
            </p>
            <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-[3.4rem] font-medium text-[#242424] leading-[1.1] tracking-tight">
              {lang === 'bn'
                ? homepage?.hero_title_bn || 'কোরিয়ান স্কিনকেয়ারের আসল সৌন্দর্য আবিষ্কার করুন'
                : homepage?.hero_title || 'Discover the Beauty of Korean Skincare'}
            </h1>
            <p className="mt-5 text-base text-[#777777] leading-relaxed max-w-lg">
              {lang === 'bn'
                ? homepage?.hero_subtitle_bn ||
                  'আপনার ত্বকের স্বাভাবিক উজ্জ্বলতা ফিরিয়ে আনতে যত্নসহকারে বাছাইকৃত কোরিয়ান স্কিনকেয়ার ও বিউটি এসেনশিয়ালস।'
                : homepage?.hero_subtitle ||
                  'Explore carefully curated Korean beauty essentials designed to complement your skincare journey and reveal your natural glow.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/shop"
                className="px-7 py-3.5 bg-[#242424] text-white text-xs tracking-[0.18em] uppercase font-medium hover:bg-[#3a3a3a] transition-colors whitespace-nowrap"
              >
                {lang === 'bn' ? t.hero.shopNow : homepage?.hero_primary_cta || 'SHOP NOW'}
              </Link>
              <Link
                to="/bestsellers"
                className="px-7 py-3.5 bg-white border border-[#EAE6E3] text-[#242424] text-xs tracking-[0.18em] uppercase font-medium hover:border-[#242424] transition-colors whitespace-nowrap"
              >
                {lang === 'bn'
                  ? t.hero.exploreCollection
                  : homepage?.hero_secondary_cta || 'EXPLORE COLLECTION'}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[300px] sm:min-h-[420px] lg:min-h-[520px] border-t lg:border-t-0 lg:border-l border-[#EAE6E3] overflow-hidden">
            <SafeImage
              src={homepage?.hero_image || '/src/assets/images/hero_floria_campaign_1795534767841.jpg'}
              alt="Floria Korean Beauty serum, barrier cream, and daily sunscreen collection"
              loading="eager"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: BRAND INTRODUCTION */}
      <section className="py-16 sm:py-20 border-b border-[#EAE6E3] bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#777777]">
            Our Philosophy
          </p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
            {lang === 'bn'
              ? t.sections.introTitle
              : homepage?.intro_title || 'Beauty Begins with the Right Skincare'}
          </h2>
          <p className="mt-4 text-base text-[#777777] leading-relaxed">
            {homepage?.intro_description ||
              'Welcome to Floria Korean Beauty, your destination for discovering Korean skincare and beauty essentials. Explore thoughtfully selected products and find the routine that works for your skin.'}
          </p>
        </div>
      </section>

      {/* SECTION 3: SHOP BY CATEGORY */}
      <section className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
                {t.sections.shopByCategory}
              </h2>
              <p className="mt-2 text-sm text-[#777777]">{t.sections.shopByCategorySub}</p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#242424] hover:text-[#777777] whitespace-nowrap"
            >
              <span>{t.sections.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group bg-white border border-[#EAE6E3] flex flex-col overflow-hidden hover:border-[#D5A7A8] transition-colors"
              >
                <div className="aspect-[4/3] bg-[#FAF8F5] overflow-hidden border-b border-[#EAE6E3]">
                  <SafeImage
                    src={cat.image_url}
                    alt={cat.name}
                    fallbackTitle={cat.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif text-2xl font-medium text-[#242424]">
                        {lang === 'bn' ? cat.name_bn : cat.name}
                      </h3>
                      {typeof cat.product_count === 'number' && (
                        <span className="text-xs text-[#777777] tabular-nums">
                          {cat.product_count} items
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-[#777777] line-clamp-2">{cat.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#242424] pt-2">
                    <span>{t.sections.shopCategory}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: BESTSELLERS */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
                {t.sections.bestsellersTitle}
              </h2>
              <p className="mt-2 text-sm text-[#777777]">
                {t.sections.bestsellersSub} · {t.sections.demoCatalogNote}
              </p>
            </div>
            <Link
              to="/bestsellers"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#242424] hover:text-[#777777] whitespace-nowrap"
            >
              <span>{t.sections.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingStorefront ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-80 bg-[#FAF8F5] border border-[#EAE6E3] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: NEW ARRIVALS */}
      <section className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
                {t.sections.newArrivalsTitle}
              </h2>
              <p className="mt-2 text-sm text-[#777777]">{t.sections.newArrivalsSub}</p>
            </div>
            <Link
              to="/new-arrivals"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#242424] hover:text-[#777777] whitespace-nowrap"
            >
              <span>{t.sections.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: EDITORIAL BEAUTY BANNER */}
      <section className="bg-[#F4E8E8]/55 border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[380px] border-b lg:border-b-0 lg:border-r border-[#EAE6E3] overflow-hidden">
            <SafeImage
              src={
                homepage?.editorial_image ||
                '/src/assets/images/editorial_floria_glow_1795534767638.jpg'
              }
              alt="Korean skincare editorial still life"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          </div>
          <div className="lg:col-span-6 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 flex flex-col justify-center">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#777777]">
              Editorial Ritual
            </p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-medium text-[#242424] leading-tight">
              {homepage?.editorial_title || 'Your Skin Deserves a Little More Love'}
            </h2>
            <p className="mt-4 text-base text-[#777777] leading-relaxed max-w-md">
              {homepage?.editorial_subtitle ||
                'Discover skincare essentials inspired by the innovation and thoughtful routines of Korean beauty.'}
            </p>
            <div className="mt-7">
              <Link
                to="/shop"
                className="inline-block px-7 py-3.5 bg-[#242424] text-white text-xs tracking-[0.18em] uppercase font-medium hover:bg-[#3a3a3a] transition-colors"
              >
                {homepage?.editorial_cta || t.sections.exploreNow}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: 5-STEP KOREAN SKINCARE ROUTINE */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
              {t.sections.routineTitle}
            </h2>
            <p className="mt-2 text-sm text-[#777777]">{t.sections.routineSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {routineSteps.map((step) => (
              <div
                key={step.slug}
                className="border border-[#EAE6E3] bg-[#FAF8F5] flex flex-col justify-between p-5"
              >
                <div>
                  <span className="font-mono text-xs text-[#777777]">{step.num}</span>
                  <h3 className="mt-1 font-serif text-2xl font-medium text-[#242424] uppercase tracking-wide">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#777777] leading-relaxed">{step.desc}</p>
                </div>

                {step.product && (
                  <Link
                    to={`/product/${step.product.slug}`}
                    className="mt-5 pt-4 border-t border-[#EAE6E3] flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 bg-white border border-[#EAE6E3] shrink-0 overflow-hidden">
                      <SafeImage
                        src={step.product.image_url}
                        alt={step.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[#777777]">
                        {step.product.brand_name}
                      </p>
                      <p className="text-xs font-medium text-[#242424] truncate group-hover:underline">
                        {step.product.name}
                      </p>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: WHY CHOOSE FLORIA */}
      <section className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
              {t.sections.whyTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trustFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="bg-white border border-[#EAE6E3] p-6">
                  <Icon className="w-5 h-5 text-[#D5A7A8]" strokeWidth={1.5} />
                  <h3 className="mt-4 text-base font-medium text-[#242424]">{feat.title}</h3>
                  <p className="mt-1.5 text-sm text-[#777777] leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 9: CUSTOMER REVIEWS */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
                {t.sections.reviewsTitle}
              </h2>
              <p className="mt-2 text-xs text-[#777777]">{t.sections.reviewsNotice}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.slice(0, 4).map((rev) => (
              <div key={rev.id} className="bg-[#FAF8F5] border border-[#EAE6E3] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${
                          idx < rev.rating
                            ? 'fill-[#D5A7A8] text-[#D5A7A8]'
                            : 'text-[#EAE6E3]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#242424] leading-relaxed">“{rev.comment}”</p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#EAE6E3] text-xs text-[#777777] space-y-1">
                  <p className="font-medium text-[#242424]">{rev.customer_name}</p>
                  <p className="truncate">{rev.product_name}</p>
                  <p className="tabular-nums">
                    {rev.created_at.slice(0, 10)}
                    {rev.is_demo ? ' · Demo Review' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10 & 11: SOCIAL MEDIA & NEWSLETTER */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Social Media */}
          <div className="border border-[#EAE6E3] bg-[#FAF8F5] p-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#777777]">Community</p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-[#242424]">
              {t.sections.socialTitle}
            </h2>
            <p className="mt-2 text-sm text-[#777777]">
              Follow Floria Korean Beauty across our official channels for skincare routines and new arrivals.
            </p>
            <div className="mt-6">
              <SocialIcons links={settings?.social_links} />
            </div>
          </div>

          {/* Newsletter */}
          <div className="border border-[#EAE6E3] bg-[#FAF8F5] p-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#777777]">Newsletter</p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-[#242424]">
              {homepage?.newsletter_title || t.sections.newsletterTitle}
            </h2>
            <p className="mt-2 text-sm text-[#777777]">
              {homepage?.newsletter_subtitle ||
                'Receive curated Korean skincare routines, new arrival notes, and seasonal offers.'}
            </p>
            <form onSubmit={handleNewsletter} className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={t.footer.emailPlaceholder}
                aria-label="Email address for newsletter"
                className="flex-1 px-4 py-3 bg-white border border-[#EAE6E3] text-sm text-[#242424] placeholder:text-[#777777] focus:outline-none focus:border-[#242424]"
              />
              <button
                type="submit"
                disabled={submittingNews}
                className="px-6 py-3 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#3a3a3a] disabled:opacity-60 whitespace-nowrap"
              >
                {submittingNews ? 'Saving...' : t.footer.subscribe}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};
