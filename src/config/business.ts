import type { SocialLinks } from '../types';

export const OFFICIAL_BUSINESS_CONFIG = {
  brandName: 'Floria Korean Beauty',
  shortName: 'FLORIA',
  subName: 'KOREAN BEAUTY',
  category: 'Korean Skincare & Beauty Products',
  market: 'Bangladesh',
  phone: '01805-133476',
  whatsappDisplay: '+880 1805-133476',
  whatsappNumber: '8801805133476',
  whatsappBaseUrl: 'https://wa.me/8801805133476',
  address: 'Demra, Dhaka-1361, Bangladesh',
  email: 'hello@floriakoreanbeauty.com',
  currencyCode: 'BDT',
  currencySymbol: '৳',
  copyright: '© 2026 Floria Korean Beauty. All Rights Reserved.',
  socialLinks: {
    facebook: 'https://www.facebook.com/profile.php?id=61595783647973',
    linkedin: 'https://www.linkedin.com/in/floria-korean-beauty-888972450',
    twitter: 'https://x.com/floriabeauty',
    instagram: 'https://www.instagram.com/floriakoreanbeautyy',
    youtube: 'https://youtube.com/@floriakoreanbeauty',
    pinterest: 'https://pin.it/39LYJg837',
    tiktok: 'https://www.tiktok.com/@floriakoreanbeauty',
  } satisfies SocialLinks,
} as const;

export const BD_DISTRICTS = [
  'Dhaka',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Narayanganj',
  'Gazipur',
  'Cumilla',
  'Bogura',
  'Cox\'s Bazar',
  'Jashore',
  'Savar',
  'Tongi',
  'Other District',
];

export const SKIN_TYPES = [
  'All Skin Types',
  'Dry',
  'Oily',
  'Combination',
  'Sensitive',
  'Acne-Prone',
];
