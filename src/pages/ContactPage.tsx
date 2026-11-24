import React, { useState } from 'react';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { OFFICIAL_BUSINESS_CONFIG } from '../config/business';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import { buildWhatsAppLink, getDefaultWhatsAppMessage } from '../utils/format';
import { SEOHead } from '../components/common/SEOHead';
import { SocialIcons } from '../components/common/SocialIcons';

export const ContactPage: React.FC = () => {
  const { storefront, notify } = useApp();
  const settings = storefront?.settings;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const phoneVal = settings?.phone || OFFICIAL_BUSINESS_CONFIG.phone;
  const whatsappDisplay = settings?.whatsapp_display || OFFICIAL_BUSINESS_CONFIG.whatsappDisplay;
  const whatsappNum = settings?.whatsapp_number || OFFICIAL_BUSINESS_CONFIG.whatsappNumber;
  const addressVal = settings?.address || OFFICIAL_BUSINESS_CONFIG.address;
  const emailVal = settings?.email || OFFICIAL_BUSINESS_CONFIG.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      notify(res.message, 'success');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to send message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Contact Us | Floria Korean Beauty"
        description="Contact Floria Korean Beauty in Demra, Dhaka-1361, Bangladesh by phone, WhatsApp, or contact form."
      />

      <div className="bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#777777]">Customer Care</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#242424]">
            Contact Floria Korean Beauty
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <p className="text-sm text-[#777777] leading-relaxed">
            Whether you need help choosing a cleanser, checking delivery timelines, or confirming an
            order, our Dhaka support desk is ready to assist.
          </p>

          <div className="border border-[#EAE6E3] bg-[#FAF8F5] p-6 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#D5A7A8] mt-1 shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wider text-[#777777]">Phone</p>
                <a href={`tel:${phoneVal.replace(/-/g, '')}`} className="font-medium text-[#242424] tabular-nums">
                  {phoneVal}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageCircle className="w-4 h-4 text-[#D5A7A8] mt-1 shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wider text-[#777777]">WhatsApp</p>
                <a
                  href={buildWhatsAppLink(getDefaultWhatsAppMessage(), whatsappNum)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#242424] tabular-nums hover:underline"
                >
                  {whatsappDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#D5A7A8] mt-1 shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wider text-[#777777]">Email</p>
                <span className="font-medium text-[#242424]">{emailVal}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#D5A7A8] mt-1 shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wider text-[#777777]">Address</p>
                <span className="font-medium text-[#242424]">{addressVal}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#777777] mb-3">
              Official Social Media
            </p>
            <SocialIcons links={settings?.social_links} />
          </div>
        </div>

        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="border border-[#EAE6E3] bg-white p-6 sm:p-8 space-y-4">
            <h2 className="font-serif text-2xl font-medium text-[#242424]">Send Us a Message</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                Message *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3.5 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#3a3a3a] disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
