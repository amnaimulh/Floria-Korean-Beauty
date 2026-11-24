import React, { useEffect, useState } from 'react';
import { LogOut, MapPin, Package, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BD_DISTRICTS } from '../config/business';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import type { Order } from '../types';
import { formatBDT } from '../utils/format';
import { SEOHead } from '../components/common/SEOHead';

interface SavedAddress {
  id: number;
  label: string;
  full_name: string;
  phone: string;
  district: string;
  area: string;
  address: string;
  is_default: number;
}

export const CustomerAccountPage: React.FC = () => {
  const { customerUser, customerToken, setCustomerSession, notify } = useApp();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const [label, setLabel] = useState('Home');
  const [addrName, setAddrName] = useState(customerUser?.full_name || '');
  const [addrPhone, setAddrPhone] = useState(customerUser?.phone || '');
  const [addrDistrict, setAddrDistrict] = useState('Dhaka');
  const [addrArea, setAddrArea] = useState('');
  const [addrText, setAddrText] = useState('');

  useEffect(() => {
    if (!customerToken) {
      navigate('/login');
      return;
    }
    Promise.all([
      apiRequest<{ orders: Order[] }>('/api/customer/orders', {}, customerToken),
      apiRequest<{ addresses: SavedAddress[] }>('/api/customer/addresses', {}, customerToken),
    ])
      .then(([oRes, aRes]) => {
        setOrders(oRes.orders);
        setAddresses(aRes.addresses);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerToken, navigate]);

  if (!customerUser) return null;

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(
        '/api/customer/addresses',
        {
          method: 'POST',
          body: JSON.stringify({
            label,
            full_name: addrName,
            phone: addrPhone,
            district: addrDistrict,
            area: addrArea,
            address: addrText,
            is_default: addresses.length === 0,
          }),
        },
        customerToken
      );
      const aRes = await apiRequest<{ addresses: SavedAddress[] }>(
        '/api/customer/addresses',
        {},
        customerToken
      );
      setAddresses(aRes.addresses);
      setAddrArea('');
      setAddrText('');
      notify('Delivery address saved.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to save address.', 'error');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    await apiRequest(`/api/customer/addresses/${id}`, { method: 'DELETE' }, customerToken);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    notify('Address removed.', 'info');
  };

  return (
    <>
      <SEOHead title="My Account | Floria Korean Beauty" />
      <div className="bg-[#FAF8F5] border-b border-[#EAE6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#777777]">Customer Portal</p>
            <h1 className="mt-1 font-serif text-3xl font-medium text-[#242424]">
              Welcome, {customerUser.full_name}
            </h1>
            <p className="text-xs text-[#777777] mt-1">
              {customerUser.email} {customerUser.phone ? `· ${customerUser.phone}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCustomerSession(null, null);
              navigate('/');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#EAE6E3] bg-white text-xs uppercase tracking-wider text-[#242424] hover:border-[#242424]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Order History */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-medium text-[#242424] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D5A7A8]" />
              <span>Order History ({orders.length})</span>
            </h2>
            <Link to="/wishlist" className="text-xs uppercase tracking-wider underline text-[#242424]">
              View Wishlist
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-[#777777]">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="p-8 bg-[#FAF8F5] border border-[#EAE6E3] text-center space-y-3">
              <p className="text-sm text-[#777777]">You haven’t placed any orders yet.</p>
              <Link
                to="/shop"
                className="inline-block px-5 py-2.5 bg-[#242424] text-white text-xs uppercase tracking-widest"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-[#EAE6E3] bg-white p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EAE6E3]">
                    <div>
                      <p className="font-mono text-sm font-medium text-[#242424]">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-[#777777] tabular-nums">
                        {order.created_at.slice(0, 10)} · {order.payment_method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatBDT(order.total_amount)}</p>
                      <p className="text-xs text-[#777777]">
                        {order.order_status} · {order.payment_status}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-[#777777] space-y-1">
                    {(order.items || []).map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span>
                          {it.product_name} × {it.quantity}
                        </span>
                        <span className="tabular-nums">{formatBDT(it.line_total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Addresses */}
        <div className="lg:col-span-5 space-y-5">
          <h2 className="font-serif text-2xl font-medium text-[#242424] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#D5A7A8]" />
            <span>Saved Addresses</span>
          </h2>

          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-4 bg-[#FAF8F5] border border-[#EAE6E3] flex justify-between items-start gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-[#242424] uppercase tracking-wider">
                    {addr.label}
                  </p>
                  <p className="text-[#242424] mt-1">
                    {addr.full_name} · {addr.phone}
                  </p>
                  <p className="text-[#777777] mt-0.5">
                    {addr.address}, {addr.area}, {addr.district}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAddress(addr.id)}
                  aria-label="Delete address"
                  className="text-[#777777] hover:text-[#242424]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddAddress} className="border border-[#EAE6E3] bg-white p-5 space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#242424]">
              Add Delivery Address
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Label (Home/Office)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-xs"
              />
              <input
                type="text"
                required
                placeholder="Recipient Name"
                value={addrName}
                onChange={(e) => setAddrName(e.target.value)}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-xs"
              />
              <input
                type="tel"
                required
                placeholder="01XXXXXXXXX"
                value={addrPhone}
                onChange={(e) => setAddrPhone(e.target.value)}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-xs"
              />
              <select
                value={addrDistrict}
                onChange={(e) => setAddrDistrict(e.target.value)}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-xs"
              >
                {BD_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              required
              placeholder="Area / Thana"
              value={addrArea}
              onChange={(e) => setAddrArea(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-xs"
            />
            <input
              type="text"
              required
              placeholder="Full Street / House / Flat Address"
              value={addrText}
              onChange={(e) => setAddrText(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#242424] text-white text-xs tracking-widest uppercase"
            >
              Save Address
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
