import React, { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import type { Coupon, ShippingZone } from '../../types';
import { formatBDT } from '../../utils/format';

interface AdminMarketingShippingTabProps {
  coupons: Coupon[];
  zones: ShippingZone[];
  onRefresh: () => Promise<void>;
}

export const AdminMarketingShippingTab: React.FC<AdminMarketingShippingTabProps> = ({
  coupons,
  zones,
  onRefresh,
}) => {
  const { adminToken, refreshStorefront, notify } = useApp();

  const [couponForm, setCouponForm] = useState({
    id: 0,
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_purchase: 1000,
    max_uses: '',
    expires_at: '',
    is_active: true,
  });

  const [zoneForm, setZoneForm] = useState({
    id: 0,
    name: '',
    name_bn: '',
    area_keywords: '',
    charge: 70,
    free_threshold: '',
    estimated_days: '1-3 business days',
    is_active: true,
  });

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...couponForm,
        max_uses: couponForm.max_uses ? Number(couponForm.max_uses) : null,
        expires_at: couponForm.expires_at || null,
      };
      if (couponForm.id) {
        await apiRequest(
          `/api/admin/coupons/${couponForm.id}`,
          { method: 'PUT', body: JSON.stringify(payload) },
          adminToken
        );
        notify('Coupon updated.', 'success');
      } else {
        await apiRequest(
          '/api/admin/coupons',
          { method: 'POST', body: JSON.stringify(payload) },
          adminToken
        );
        notify('Coupon created.', 'success');
      }
      setCouponForm({
        id: 0,
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase: 1000,
        max_uses: '',
        expires_at: '',
        is_active: true,
      });
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to save coupon.', 'error');
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    await apiRequest(`/api/admin/coupons/${id}`, { method: 'DELETE' }, adminToken);
    notify('Coupon deleted.', 'info');
    await onRefresh();
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...zoneForm,
        free_threshold: zoneForm.free_threshold ? Number(zoneForm.free_threshold) : null,
      };
      if (zoneForm.id) {
        await apiRequest(
          `/api/admin/shipping-zones/${zoneForm.id}`,
          { method: 'PUT', body: JSON.stringify(payload) },
          adminToken
        );
        notify('Shipping zone updated and synced to checkout.', 'success');
      } else {
        await apiRequest(
          '/api/admin/shipping-zones',
          { method: 'POST', body: JSON.stringify(payload) },
          adminToken
        );
        notify('Shipping zone added.', 'success');
      }
      setZoneForm({
        id: 0,
        name: '',
        name_bn: '',
        area_keywords: '',
        charge: 70,
        free_threshold: '',
        estimated_days: '1-3 business days',
        is_active: true,
      });
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to save shipping zone.', 'error');
    }
  };

  const handleDeleteZone = async (id: number) => {
    await apiRequest(`/api/admin/shipping-zones/${id}`, { method: 'DELETE' }, adminToken);
    notify('Shipping zone removed.', 'info');
    await Promise.all([onRefresh(), refreshStorefront()]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Coupons */}
      <div className="space-y-6">
        <div className="bg-white border border-[#EAE6E3] p-6">
          <h2 className="font-serif text-2xl font-medium text-[#242424] mb-4">
            {couponForm.id ? 'Edit Coupon' : 'Create Coupon'}
          </h2>
          <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Code (e.g. GLOW10)"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] font-mono uppercase"
              />
              <select
                value={couponForm.discount_type}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    discount_type: e.target.value as 'percentage' | 'fixed',
                  })
                }
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (৳)</option>
              </select>
              <input
                type="number"
                required
                min={1}
                placeholder="Discount Value"
                value={couponForm.discount_value}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })
                }
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] tabular-nums"
              />
              <input
                type="number"
                min={0}
                placeholder="Min Purchase (৳)"
                value={couponForm.min_purchase}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, min_purchase: Number(e.target.value) })
                }
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] tabular-nums"
              />
              <input
                type="number"
                min={1}
                placeholder="Max Uses (Optional)"
                value={couponForm.max_uses}
                onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] tabular-nums"
              />
              <input
                type="date"
                value={couponForm.expires_at}
                onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={couponForm.is_active}
                  onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                  className="accent-[#242424]"
                />
                <span>Active</span>
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-2 bg-[#242424] text-white uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{couponForm.id ? 'Update' : 'Save Coupon'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-[#EAE6E3] divide-y divide-[#EAE6E3]">
          {coupons.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between text-xs">
              <div>
                <p className="font-mono font-semibold text-[#242424]">{c.code}</p>
                <p className="text-[#777777]">
                  {c.discount_type === 'percentage'
                    ? `${c.discount_value}% off`
                    : `${formatBDT(c.discount_value)} off`}{' '}
                  · Min {formatBDT(c.min_purchase)} · Used {c.used_count}
                  {c.max_uses ? `/${c.max_uses}` : ''} · {c.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setCouponForm({
                      id: c.id,
                      code: c.code,
                      discount_type: c.discount_type,
                      discount_value: c.discount_value,
                      min_purchase: c.min_purchase,
                      max_uses: c.max_uses ? String(c.max_uses) : '',
                      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
                      is_active: c.is_active,
                    })
                  }
                  className="p-1.5 hover:bg-[#FAF8F5]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCoupon(c.id)}
                  className="p-1.5 text-[#777777] hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Zones */}
      <div className="space-y-6">
        <div className="bg-white border border-[#EAE6E3] p-6">
          <h2 className="font-serif text-2xl font-medium text-[#242424] mb-4">
            {zoneForm.id ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
          </h2>
          <form onSubmit={handleSaveZone} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Zone Name (e.g. Inside Dhaka)"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
              <input
                type="text"
                placeholder="Bangla Name"
                value={zoneForm.name_bn}
                onChange={(e) => setZoneForm({ ...zoneForm, name_bn: e.target.value })}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
              <input
                type="number"
                required
                min={0}
                placeholder="Delivery Fee (৳)"
                value={zoneForm.charge}
                onChange={(e) => setZoneForm({ ...zoneForm, charge: Number(e.target.value) })}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] tabular-nums"
              />
              <input
                type="number"
                min={0}
                placeholder="Free Delivery Over (৳ Optional)"
                value={zoneForm.free_threshold}
                onChange={(e) => setZoneForm({ ...zoneForm, free_threshold: e.target.value })}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] tabular-nums"
              />
            </div>
            <input
              type="text"
              placeholder="Estimated delivery window (e.g. 1-3 business days)"
              value={zoneForm.estimated_days}
              onChange={(e) => setZoneForm({ ...zoneForm, estimated_days: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
            />
            <input
              type="text"
              placeholder="Areas covered (comma-separated)"
              value={zoneForm.area_keywords}
              onChange={(e) => setZoneForm({ ...zoneForm, area_keywords: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
            />
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={zoneForm.is_active}
                  onChange={(e) => setZoneForm({ ...zoneForm, is_active: e.target.checked })}
                  className="accent-[#242424]"
                />
                <span>Active at Checkout</span>
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-2 bg-[#242424] text-white uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{zoneForm.id ? 'Update Zone' : 'Add Zone'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-[#EAE6E3] divide-y divide-[#EAE6E3]">
          {zones.map((z) => (
            <div key={z.id} className="p-4 flex items-center justify-between text-xs">
              <div>
                <p className="font-medium text-[#242424]">
                  {z.name} <span className="text-[#777777]">({z.name_bn})</span>
                </p>
                <p className="text-[#777777] tabular-nums">
                  Charge: {formatBDT(z.charge)} ·{' '}
                  {z.free_threshold ? `Free over ${formatBDT(z.free_threshold)}` : 'Standard rate'} ·{' '}
                  {z.estimated_days}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setZoneForm({
                      id: z.id,
                      name: z.name,
                      name_bn: z.name_bn,
                      area_keywords: z.area_keywords,
                      charge: z.charge,
                      free_threshold: z.free_threshold ? String(z.free_threshold) : '',
                      estimated_days: z.estimated_days,
                      is_active: z.is_active,
                    })
                  }
                  className="p-1.5 hover:bg-[#FAF8F5]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteZone(z.id)}
                  className="p-1.5 text-[#777777] hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
