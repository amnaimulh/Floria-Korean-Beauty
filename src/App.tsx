import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StoreLayout } from './components/layout/StoreLayout';
import { AppProvider } from './context/AppContext';
import { AboutPage } from './pages/AboutPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ContactPage } from './pages/ContactPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { CustomerLoginPage, CustomerRegisterPage } from './pages/CustomerAuthPages';
import { HomePage } from './pages/HomePage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { PolicyPage } from './pages/PolicyPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShopPage } from './pages/ShopPage';
import { WishlistPage } from './pages/WishlistPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Protected Admin Routes (isolated from customer StoreLayout) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />

          {/* Customer Storefront Routes */}
          <Route
            path="/"
            element={
              <StoreLayout>
                <HomePage />
              </StoreLayout>
            }
          />
          <Route
            path="/shop"
            element={
              <StoreLayout>
                <ShopPage mode="all" />
              </StoreLayout>
            }
          />
          <Route
            path="/category/:slug"
            element={
              <StoreLayout>
                <ShopPage mode="category" />
              </StoreLayout>
            }
          />
          <Route
            path="/bestsellers"
            element={
              <StoreLayout>
                <ShopPage mode="bestsellers" />
              </StoreLayout>
            }
          />
          <Route
            path="/new-arrivals"
            element={
              <StoreLayout>
                <ShopPage mode="new-arrivals" />
              </StoreLayout>
            }
          />
          <Route
            path="/search"
            element={
              <StoreLayout>
                <ShopPage mode="search" />
              </StoreLayout>
            }
          />
          <Route
            path="/product/:slug"
            element={
              <StoreLayout>
                <ProductDetailPage />
              </StoreLayout>
            }
          />
          <Route
            path="/cart"
            element={
              <StoreLayout>
                <CartPage />
              </StoreLayout>
            }
          />
          <Route
            path="/checkout"
            element={
              <StoreLayout>
                <CheckoutPage />
              </StoreLayout>
            }
          />
          <Route
            path="/order-confirmation/:orderNumber"
            element={
              <StoreLayout>
                <OrderConfirmationPage />
              </StoreLayout>
            }
          />
          <Route
            path="/wishlist"
            element={
              <StoreLayout>
                <WishlistPage />
              </StoreLayout>
            }
          />
          <Route
            path="/about"
            element={
              <StoreLayout>
                <AboutPage />
              </StoreLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <StoreLayout>
                <ContactPage />
              </StoreLayout>
            }
          />
          <Route
            path="/login"
            element={
              <StoreLayout>
                <CustomerLoginPage />
              </StoreLayout>
            }
          />
          <Route
            path="/register"
            element={
              <StoreLayout>
                <CustomerRegisterPage />
              </StoreLayout>
            }
          />
          <Route
            path="/account"
            element={
              <StoreLayout>
                <CustomerAccountPage />
              </StoreLayout>
            }
          />
          <Route
            path="/orders"
            element={
              <StoreLayout>
                <CustomerAccountPage />
              </StoreLayout>
            }
          />
          <Route
            path="/shipping-policy"
            element={
              <StoreLayout>
                <PolicyPage type="shipping" />
              </StoreLayout>
            }
          />
          <Route
            path="/return-policy"
            element={
              <StoreLayout>
                <PolicyPage type="return" />
              </StoreLayout>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <StoreLayout>
                <PolicyPage type="privacy" />
              </StoreLayout>
            }
          />
          <Route
            path="/terms"
            element={
              <StoreLayout>
                <PolicyPage type="terms" />
              </StoreLayout>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
