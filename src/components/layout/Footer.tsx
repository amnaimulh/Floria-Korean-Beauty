import React from 'react';
import { MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OFFICIAL_BUSINESS_CONFIG } from '../../config/business';
import { useApp } from '../../context/AppContext';
import { buildWhatsAppLink, getDefaultWhatsAppMessage } from '../../utils/format';
import { BrandLogo } from '../common/BrandLogo';
import { SocialIcons } from '../common/SocialIcons';

export const Footer: React.FC = () => {
  const { storefront, t } = useApp();
  const settings = storefront?.settings;

  const phone = settings?.phone || OFFICIAL_BUSINESS_CONFIG.phone;
  const whatsappDisplay = settings?.whatsapp_display || OFFICIAL_BUSINESS_CONFIG.whatsappDisplay;
  const whatsappNumber = settings?.whatsapp_number || OFFICIAL_BUSINESS_CONFIG.whatsappNumber;
  const address = settings?.address || OFFICIAL_BUSINESS_CONFIG.address;
  const socialLinks = settings?.social_links || OFFICIAL_BUSINESS_CONFIG.socialLinks;

  return (
    <footer className="bg-[#FAF8F5] border-t border-[#EAE6E3] text-[#242424]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1: Brand Logo & Short Intro */}
          <div className="space-y-4">
            <BrandLogo to="/" />
            <p className="text-sm text-[#777777] leading-relaxed max-w-xs">
              Curated Korean skincare and beauty essentials thoughtfully selected for everyday rituals across Bangladesh.
            </p>
            <div className="pt-2">
              <SocialIcons links={socialLinks} size="sm" />
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-[#242424] mb-4">
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-2.5 text-sm text-[#777777]">
              <li>
                <Link to="/" className="hover:text-[#242424] transition-colors">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#242424] transition-colors">
                  {t.nav.shopAll}
                </Link>
              </li>
              <li>
                <Link to="/bestsellers" className="hover:text-[#242424] transition-colors">
                  {t.nav.bestsellers}
                </Link>
              </li>
              <li>
                <Link to="/new-arrivals" className="hover:text-[#242424] transition-colors">
                  {t.nav.newArrivals}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#242424] transition-colors">
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#242424] transition-colors">
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Support */}
          <div>
            <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-[#242424] mb-4">
              {t.footer.support}
            </h3>
            <ul className="space-y-2.5 text-sm text-[#777777]">
              <li>
                <Link to="/shipping-policy" className="hover:text-[#242424] transition-colors">
                  {t.footer.shippingPolicy}
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="hover:text-[#242424] transition-colors">
                  {t.footer.returnPolicy}
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#242424] transition-colors">
                  {t.footer.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#242424] transition-colors">
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[#242424] transition-colors">
                  Store Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Official Contact Information */}
          <div>
            <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-[#242424] mb-4">
              {t.footer.contactInfo}
            </h3>
            <ul className="space-y-3 text-sm text-[#777777]">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#D5A7A8] mt-0.5 shrink-0" />
                <a href={`tel:${phone.replace(/-/g, '')}`} className="hover:text-[#242424] tabular-nums">
                  {phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#D5A7A8] mt-0.5 shrink-0" />
                <a
                  href={buildWhatsAppLink(getDefaultWhatsAppMessage(), whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#242424] tabular-nums"
                >
                  {whatsappDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D5A7A8] mt-0.5 shrink-0" />
                <span>{address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#EAE6E3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777777]">
          <p>{OFFICIAL_BUSINESS_CONFIG.copyright}</p>
          <p>Currency: Bangladeshi Taka (BDT / ৳) · Cash on Delivery Available</p>
        </div>
      </div>
    </footer>
  );
};
