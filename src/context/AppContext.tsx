import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { OFFICIAL_BUSINESS_CONFIG } from '../config/business';
import { getTranslations } from '../i18n/translations';
import { apiRequest } from '../services/api';
import type {
  Brand,
  CartItem,
  Category,
  HomepageSettings,
  Language,
  Product,
  Review,
  ShippingZone,
  StoreSettings,
  UserSession,
} from '../types';

interface StorefrontData {
  settings: StoreSettings;
  homepage: HomepageSettings;
  categories: Category[];
  brands: Brand[];
  shippingZones: ShippingZone[];
  products: Product[];
  reviews: Review[];
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AppContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: ReturnType<typeof getTranslations>;
  storefront: StorefrontData | null;
  loadingStorefront: boolean;
  storefrontError: string | null;
  refreshStorefront: () => Promise<void>;

  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, openDrawer?: boolean) => void;
  updateCartQty: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;

  wishlistIds: number[];
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: number) => boolean;

  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  searchOverlayOpen: boolean;
  setSearchOverlayOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (p: Product | null) => void;

  customerUser: UserSession | null;
  customerToken: string | null;
  setCustomerSession: (user: UserSession | null, token: string | null) => void;

  adminUser: UserSession | null;
  adminToken: string | null;
  setAdminSession: (user: UserSession | null, token: string | null) => void;

  notify: (text: string, type?: 'success' | 'error' | 'info') => void;
  toasts: ToastMessage[];
  dismissToast: (id: number) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'floria_cart_v1';
const WISHLIST_STORAGE_KEY = 'floria_wishlist_v1';
const LANG_STORAGE_KEY = 'floria_lang_v1';

export const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
  brand_name: OFFICIAL_BUSINESS_CONFIG.brandName,
  tagline: 'Curated Korean Skincare & Beauty Essentials',
  phone: OFFICIAL_BUSINESS_CONFIG.phone,
  whatsapp_display: OFFICIAL_BUSINESS_CONFIG.whatsappDisplay,
  whatsapp_number: OFFICIAL_BUSINESS_CONFIG.whatsappNumber,
  address: OFFICIAL_BUSINESS_CONFIG.address,
  currency_code: OFFICIAL_BUSINESS_CONFIG.currencyCode,
  currency_symbol: OFFICIAL_BUSINESS_CONFIG.currencySymbol,
  email: OFFICIAL_BUSINESS_CONFIG.email,
  announcement_bar: 'Discover Your Perfect Korean Skincare Routine · Cash on Delivery Across Bangladesh',
  announcement_bar_bn:
    'আপনার ত্বকের জন্য সেরা কোরিয়ান স্কিনকেয়ার রুটিন খুঁজে নিন · সারা বাংলাদেশে ক্যাশ অন ডেলিভারি',
  seo_title: 'Floria Korean Beauty | Premium Korean Skincare in Bangladesh',
  seo_description:
    'Discover Korean skincare and beauty essentials at Floria Korean Beauty. Explore cleansers, toners, serums, moisturizers, sunscreens, and more.',
  social_links: OFFICIAL_BUSINESS_CONFIG.socialLinks,
  shipping_policy: '',
  return_policy: '',
  privacy_policy: '',
  terms_conditions: '',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'bn' ? 'bn' : 'en';
    } catch {
      return 'en';
    }
  });

  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [loadingStorefront, setLoadingStorefront] = useState(true);
  const [storefrontError, setStorefrontError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Auth tokens live strictly in React memory (never localStorage/sessionStorage)
  const [customerUser, setCustomerUser] = useState<UserSession | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<UserSession | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4000);
    },
    []
  );

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const refreshStorefront = useCallback(async () => {
    try {
      setStorefrontError(null);
      const data = await apiRequest<StorefrontData>('/api/storefront/bootstrap');
      setStorefront(data);
      // Sync cart items with latest catalog prices & stock
      setCart((prev) =>
        prev
          .map((item) => {
            const latest = data.products.find((p) => p.id === item.product.id);
            if (!latest || latest.stock_quantity <= 0) return null;
            return {
              product: latest,
              quantity: Math.min(item.quantity, latest.stock_quantity),
            };
          })
          .filter((x): x is CartItem => Boolean(x))
      );
    } catch (err) {
      setStorefrontError(err instanceof Error ? err.message : 'Unable to load storefront catalog.');
    } finally {
      setLoadingStorefront(false);
    }
  }, []);

  useEffect(() => {
    refreshStorefront();
  }, [refreshStorefront]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  const addToCart = useCallback(
    (product: Product, quantity = 1, openDrawer = true) => {
      if (product.stock_quantity <= 0) {
        notify(`${product.name} is currently out of stock.`, 'error');
        return;
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        const currentQty = existing ? existing.quantity : 0;
        const targetQty = Math.min(product.stock_quantity, currentQty + Math.max(1, quantity));
        if (currentQty + quantity > product.stock_quantity) {
          notify(`Maximum available stock (${product.stock_quantity}) reached for ${product.name}.`, 'info');
        } else {
          notify(`Added ${product.name} to your bag.`, 'success');
        }
        if (existing) {
          return prev.map((i) => (i.product.id === product.id ? { product, quantity: targetQty } : i));
        }
        return [...prev, { product, quantity: targetQty }];
      });
      if (openDrawer) setCartDrawerOpen(true);
    },
    [notify]
  );

  const updateCartQty = useCallback(
    (productId: number, quantity: number) => {
      if (quantity <= 0) {
        setCart((prev) => prev.filter((i) => i.product.id !== productId));
        return;
      }
      setCart((prev) =>
        prev.map((item) => {
          if (item.product.id !== productId) return item;
          const clamped = Math.min(item.product.stock_quantity, Math.max(1, quantity));
          if (quantity > item.product.stock_quantity) {
            notify(`Only ${item.product.stock_quantity} left in stock.`, 'info');
          }
          return { ...item, quantity: clamped };
        })
      );
    },
    [notify]
  );

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    (product: Product) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(product.id);
        notify(
          exists ? `Removed ${product.name} from wishlist.` : `Saved ${product.name} to wishlist.`,
          'info'
        );
        return exists ? prev.filter((id) => id !== product.id) : [...prev, product.id];
      });
    },
    [notify]
  );

  const isWishlisted = useCallback((productId: number) => wishlistIds.includes(productId), [wishlistIds]);

  const setCustomerSession = useCallback((user: UserSession | null, token: string | null) => {
    setCustomerUser(user);
    setCustomerToken(token);
  }, []);

  const setAdminSession = useCallback((user: UserSession | null, token: string | null) => {
    setAdminUser(user);
    setAdminToken(token);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t: getTranslations(lang),
        storefront,
        loadingStorefront,
        storefrontError,
        refreshStorefront,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        wishlistIds,
        toggleWishlist,
        isWishlisted,
        cartDrawerOpen,
        setCartDrawerOpen,
        searchOverlayOpen,
        setSearchOverlayOpen,
        quickViewProduct,
        setQuickViewProduct,
        customerUser,
        customerToken,
        setCustomerSession,
        adminUser,
        adminToken,
        setAdminSession,
        notify,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
