import React from 'react';
import { CartDrawer } from '../cart/CartDrawer';
import { FloatingWhatsApp } from '../common/FloatingWhatsApp';
import { ToastContainer } from '../common/ToastContainer';
import { QuickViewModal } from '../products/QuickViewModal';
import { Footer } from './Footer';
import { Header } from './Header';

export const StoreLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#242424]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <QuickViewModal />
      <FloatingWhatsApp />
      <ToastContainer />
    </div>
  );
};
