import React, { useState } from 'react';
import { Check, Star, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import type { CustomerRecord, Order, Review } from '../../types';
import { formatBDT } from '../../utils/format';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  created_at: string;
}

interface AdminCustomersReviewsTabProps {
  customers: CustomerRecord[];
  reviews: Review[];
  messages: ContactMessage[];
  onRefresh: () => Promise<void>;
}

export const AdminCustomersReviewsTab: React.FC<AdminCustomersReviewsTabProps> = ({
  customers,
  reviews,
  messages,
  onRefresh,
}) => {
  const { adminToken, refreshStorefront, notify } = useApp();
  const [subTab, setSubTab] = useState<'customers' | 'reviews' | 'messages'>('customers');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  const viewCustomerOrders = async (c: CustomerRecord) => {
    setSelectedCustomer(c);
    try {
      const res = await apiRequest<{ orders: Order[] }>(
        `/api/admin/customers/${c.id}/orders`,
        {},
        adminToken
      );
      setCustomerOrders(res.orders);
    } catch {
      setCustomerOrders([]);
    }
  };

  const handleModerateReview = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await apiRequest(
        `/api/admin/reviews/${id}`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
        adminToken
      );
      notify(`Review marked ${status}.`, 'success');
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update review.', 'error');
    }
  };

  const handleDeleteReview = async (id: number) => {
    try {
      await apiRequest(`/api/admin/reviews/${id}`, { method: 'DELETE' }, adminToken);
      notify('Review deleted.', 'info');
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to delete review.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-[#EAE6E3] pb-3">
        {(
          [
            { key: 'customers', label: `Customers (${customers.length})` },
            { key: 'reviews', label: `Reviews (${reviews.length})` },
            { key: 'messages', label: `Inbox Messages (${messages.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key)}
            className={`px-4 py-2 text-xs uppercase tracking-wider border ${
              subTab === tab.key
                ? 'bg-[#242424] text-white border-[#242424]'
                : 'bg-white text-[#242424] border-[#EAE6E3]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'customers' && (
        <div className="bg-white border border-[#EAE6E3] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6E3] text-[#777777] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Orders</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-right">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6E3]">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#777777]">
                    No customer records yet.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#242424]">{c.full_name}</p>
                      <p className="text-[#777777]">{c.email || 'Guest'}</p>
                    </td>
                    <td className="py-3 px-4 tabular-nums">{c.phone}</td>
                    <td className="py-3 px-4 text-[#777777]">
                      {c.area}, {c.district}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{c.total_orders}</td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">
                      {formatBDT(c.total_spent)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => viewCustomerOrders(c)}
                        className="underline text-[#242424]"
                      >
                        View Orders
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'reviews' && (
        <div className="bg-white border border-[#EAE6E3] divide-y divide-[#EAE6E3]">
          {reviews.map((r) => (
            <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#242424]">{r.customer_name}</span>
                  <span className="text-[#777777]">·</span>
                  <span className="text-[#777777]">{r.product_name}</span>
                  <span className="text-[#777777]">·</span>
                  <span className="uppercase font-medium text-[#242424]">{r.status}</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[#D5A7A8] text-[#D5A7A8]" />
                  ))}
                </div>
                <p className="text-[#777777]">{r.comment}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleModerateReview(r.id, 'approved')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#EAE6E3] hover:bg-[#FAF8F5]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModerateReview(r.id, 'rejected')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#EAE6E3] hover:bg-[#FAF8F5]"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteReview(r.id)}
                  className="p-1.5 text-[#777777] hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'messages' && (
        <div className="bg-white border border-[#EAE6E3] divide-y divide-[#EAE6E3]">
          {messages.length === 0 ? (
            <p className="p-8 text-center text-xs text-[#777777]">No contact messages received yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="p-5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium text-[#242424]">
                    {m.name} ({m.email}) {m.phone ? `· ${m.phone}` : ''}
                  </span>
                  <span className="text-[#777777] tabular-nums">{m.created_at.slice(0, 16)}</span>
                </div>
                <p className="font-medium text-[#242424]">{m.subject}</p>
                <p className="text-[#777777]">{m.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6E3] w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-[#EAE6E3] pb-3">
              <h3 className="font-serif text-xl text-[#242424]">
                Orders by {selectedCustomer.full_name}
              </h3>
              <button type="button" onClick={() => setSelectedCustomer(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-[#EAE6E3] max-h-80 overflow-y-auto">
              {customerOrders.map((o) => (
                <div key={o.id} className="py-3 flex justify-between">
                  <div>
                    <p className="font-mono font-medium">{o.order_number}</p>
                    <p className="text-[#777777]">
                      {o.created_at.slice(0, 10)} · {o.order_status}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums">{formatBDT(o.total_amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
