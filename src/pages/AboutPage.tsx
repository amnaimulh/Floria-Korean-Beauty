import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SafeImage } from '../components/common/SafeImage';
import { SEOHead } from '../components/common/SEOHead';

export const AboutPage: React.FC = () => {
  const { storefront } = useApp();
  const homepage = storefront?.homepage;

  return (
    <>
      <SEOHead
        title="About Us | Floria Korean Beauty"
        description="Learn about Floria Korean Beauty, our Korean skincare curation philosophy, and customer-first service in Dhaka, Bangladesh."
      />

      <section className="bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#777777]">
              Our Story · Demra, Dhaka
            </p>
            <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-medium text-[#242424] leading-tight">
              Thoughtful Korean Skincare for Everyday Rituals
            </h1>
            <p className="mt-5 text-base text-[#777777] leading-relaxed">
              Floria Korean Beauty was created to make building a calm, effective Korean skincare
              routine effortless for customers across Bangladesh. From gentle low-pH cleansers to
              lightweight daily sunscreens, every product in our catalog is organized by skin type
              and daily routine step.
            </p>
            <div className="mt-7">
              <Link
                to="/shop"
                className="inline-block px-7 py-3.5 bg-[#242424] text-white text-xs tracking-[0.18em] uppercase font-medium"
              >
                Explore Catalog
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[300px] border-t lg:border-t-0 lg:border-l border-[#EAE6E3]">
            <SafeImage
              src={
                homepage?.editorial_image ||
                '/src/assets/images/editorial_floria_glow_1795534767638.jpg'
              }
              alt="Floria Korean Beauty editorial skincare arrangement"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border-t border-[#EAE6E3] pt-5">
            <h2 className="font-serif text-2xl font-medium text-[#242424]">01. Simplicity First</h2>
            <p className="mt-2 text-sm text-[#777777] leading-relaxed">
              We focus on clear ingredient guidance, transparent usage instructions, and calm
              routines tailored to your skin type.
            </p>
          </div>
          <div className="border-t border-[#EAE6E3] pt-5">
            <h2 className="font-serif text-2xl font-medium text-[#242424]">02. Cash on Delivery</h2>
            <p className="mt-2 text-sm text-[#777777] leading-relaxed">
              Shop comfortably with nationwide Cash on Delivery across Dhaka and all districts of
              Bangladesh.
            </p>
          </div>
          <div className="border-t border-[#EAE6E3] pt-5">
            <h2 className="font-serif text-2xl font-medium text-[#242424]">03. Direct Support</h2>
            <p className="mt-2 text-sm text-[#777777] leading-relaxed">
              Have a question about layering serums or tracking an order? Message our team directly
              on WhatsApp or by phone.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};
