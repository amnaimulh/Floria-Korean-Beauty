import React from 'react';
import { useApp } from '../context/AppContext';
import { SEOHead } from '../components/common/SEOHead';

interface PolicyPageProps {
  type: 'shipping' | 'return' | 'privacy' | 'terms';
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ type }) => {
  const { storefront } = useApp();
  const s = storefront?.settings;

  const config = {
    shipping: {
      title: 'Shipping Policy',
      body:
        s?.shipping_policy ||
        'Inside Dhaka deliveries are typically completed within 1 to 3 business days. Outside Dhaka deliveries typically arrive within 3 to 5 business days. Cash on Delivery is available across Bangladesh.',
    },
    return: {
      title: 'Return & Refund Policy',
      body:
        s?.return_policy ||
        'Unused and unopened products in original packaging may be requested for return or exchange within 7 days of delivery by contacting 01805-133476 or WhatsApp +880 1805-133476.',
    },
    privacy: {
      title: 'Privacy Policy',
      body:
        s?.privacy_policy ||
        'Floria Korean Beauty collects only the delivery, contact, and order details necessary to fulfill your skincare orders and provide customer support.',
    },
    terms: {
      title: 'Terms & Conditions',
      body:
        s?.terms_conditions ||
        'All prices in Bangladeshi Taka (৳) and stock availability are subject to confirmation. Orders placed via Cash on Delivery or WhatsApp Confirmation are verified prior to dispatch.',
    },
  }[type];

  return (
    <>
      <SEOHead title={`${config.title} | Floria Korean Beauty`} />
      <div className="bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#777777]">
            Floria Korean Beauty Policies
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
            {config.title}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-6 text-sm text-[#777777] leading-relaxed">
        <p className="text-base text-[#242424] leading-relaxed whitespace-pre-line">{config.body}</p>
        {type === 'shipping' && storefront?.shippingZones && (
          <div className="border border-[#EAE6E3] bg-[#FAF8F5] p-6 mt-6">
            <h2 className="font-serif text-xl text-[#242424] mb-4">Current Delivery Zones</h2>
            <div className="divide-y divide-[#EAE6E3]">
              {storefront.shippingZones.map((z) => (
                <div key={z.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[#242424]">{z.name}</p>
                    <p className="text-xs text-[#777777]">{z.estimated_days}</p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-medium text-[#242424]">৳ {z.charge}</p>
                    {z.free_threshold && (
                      <p className="text-xs text-[#777777]">Free over ৳ {z.free_threshold}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
