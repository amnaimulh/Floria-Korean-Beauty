import React, { useCallback, useEffect, useState } from 'react';
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import type {
  AdminActivityLog,
  Brand,
  Category,
  Coupon,
  CustomerRecord,
  Order,
  Product,
  Review,
  ShippingZone,
} from '../../types';
import { BrandLogo } from '../../components/common/BrandLogo';
import { SEOHead } from '../../components/common/SEOHead';
import { ToastContainer } from '../../components/common/ToastContainer';
import { AdminCategoriesBrandsTab } from './AdminCategoriesBrandsTab';
import { AdminCustomersReviewsTab } from './AdminCustomersReviewsTab';
import { AdminMarketingShippingTab } from './AdminMarketingShippingTab';
import { AdminOrdersTab } from './AdminOrdersTab';
import { AdminOverviewTab, type DashboardData } from './AdminOverviewTab';
import { AdminProductsTab } from './AdminProductsTab';
import { AdminSettingsTab } from './AdminSettingsTab';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'marketing'
  | 'settings';

export const AdminDashboardPage: React.FC = () => {
  const { adminToken, adminUser, setAdminSession, storefront, notify } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [messages, setMessages] = useState<
    Array<{
      id: number;
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
      created_at: string;
    }>
  >([]);

  const fetchAllAdminData = useCallback(async () => {
    if (!adminToken) return;
    try {
      const [dash, prod, cat, br, ord, cust, rev, coup, zon, lg, msg] = await Promise.all([
        apiRequest<DashboardData>('/api/admin/dashboard', {}, adminToken),
        apiRequest<{ products: Product[] }>('/api/admin/products', {}, adminToken),
        apiRequest<{ categories: Category[] }>('/api/admin/categories', {}, adminToken),
        apiRequest<{ brands: Brand[] }>('/api/admin/brands', {}, adminToken),
        apiRequest<{ orders: Order[] }>('/api/admin/orders', {}, adminToken),
        apiRequest<{ customers: CustomerRecord[] }>('/api/admin/customers', {}, adminToken),
        apiRequest<{ reviews: Review[] }>('/api/admin/reviews', {}, adminToken),
        apiRequest<{ coupons: Coupon[] }>('/api/admin/coupons', {}, adminToken),
        apiRequest<{ zones: ShippingZone[] }>('/api/admin/shipping-zones', {}, adminToken),
        apiRequest<{ logs: AdminActivityLog[] }>('/api/admin/activity-logs', {}, adminToken),
        apiRequest<{ messages: typeof messages }>('/api/admin/messages', {}, adminToken),
      ]);
      setDashboard(dash);
      setProducts(prod.products);
      setCategories(cat.categories);
      setBrands(br.brands);
      setOrders(ord.orders);
      setCustomers(cust.customers);
      setReviews(rev.reviews);
      setCoupons(coup.coupons);
      setZones(zon.zones);
      setLogs(lg.logs);
      setMessages(msg.messages);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Session expired. Please sign in again.', 'error');
      setAdminSession(null, null);
      navigate('/admin/login');
    }
  }, [adminToken, navigate, notify, setAdminSession]);

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchAllAdminData();
  }, [adminToken, navigate, fetchAllAdminData]);

  if (!adminToken || !adminUser) return null;

  const navItems: Array<{ key: AdminTab; label: string; icon: React.ElementType }> = [
    { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: ShoppingCart },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'categories', label: 'Categories & Brands', icon: FolderTree },
    { key: 'customers', label: 'Customers & Reviews', icon: Users },
    { key: 'marketing', label: 'Coupons & Shipping', icon: Tag },
    { key: 'settings', label: 'Homepage & Settings', icon: Settings },
  ];

  const activeLabel = navItems.find((n) => n.key === activeTab)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#242424] flex">
      <SEOHead title={`${activeLabel} · Admin | Floria Korean Beauty`} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-[#EAE6E3] flex-col justify-between">
        <div>
          <div className="px-6 py-5 border-b border-[#EAE6E3]">
            <BrandLogo to="/admin" compact />
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs tracking-wide transition-colors ${
                    isActive
                      ? 'bg-[#242424] text-white font-medium'
                      : 'text-[#777777] hover:bg-[#FAF8F5] hover:text-[#242424]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#EAE6E3] space-y-2 text-xs">
          <p className="text-[#777777] truncate">{adminUser.email}</p>
          <button
            type="button"
            onClick={() => {
              setAdminSession(null, null);
              navigate('/admin/login');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 border border-[#EAE6E3] text-[#242424] hover:bg-[#FAF8F5]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-64 bg-white h-full flex flex-col justify-between p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EAE6E3]">
                <BrandLogo to="/admin" compact />
                <button type="button" onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.key);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs ${
                        activeTab === item.key
                          ? 'bg-[#242424] text-white'
                          : 'text-[#777777] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <button
              type="button"
              onClick={() => {
                setAdminSession(null, null);
                navigate('/admin/login');
              }}
              className="flex items-center gap-2 px-3 py-2 border border-[#EAE6E3] text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-[#EAE6E3] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin navigation"
              className="lg:hidden p-2 -ml-2 text-[#242424]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs text-[#777777] truncate">
              <span>Floria Admin</span>
              <span className="mx-2">/</span>
              <span className="text-[#242424] font-medium">{activeLabel}</span>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#EAE6E3] bg-[#FAF8F5] text-xs text-[#242424] hover:border-[#242424] whitespace-nowrap shrink-0"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <AdminOverviewTab
              data={dashboard}
              onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
            />
          )}
          {activeTab === 'products' && (
            <AdminProductsTab
              products={products}
              categories={categories}
              brands={brands}
              onRefresh={fetchAllAdminData}
            />
          )}
          {activeTab === 'categories' && (
            <AdminCategoriesBrandsTab
              categories={categories}
              brands={brands}
              onRefresh={fetchAllAdminData}
            />
          )}
          {activeTab === 'orders' && (
            <AdminOrdersTab orders={orders} onRefresh={fetchAllAdminData} />
          )}
          {activeTab === 'customers' && (
            <AdminCustomersReviewsTab
              customers={customers}
              reviews={reviews}
              messages={messages}
              onRefresh={fetchAllAdminData}
            />
          )}
          {activeTab === 'marketing' && (
            <AdminMarketingShippingTab
              coupons={coupons}
              zones={zones}
              onRefresh={fetchAllAdminData}
            />
          )}
          {activeTab === 'settings' && storefront && (
            <AdminSettingsTab
              initialSettings={storefront.settings}
              initialHomepage={storefront.homepage}
              logs={logs}
              onRefresh={fetchAllAdminData}
            />
          )}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
