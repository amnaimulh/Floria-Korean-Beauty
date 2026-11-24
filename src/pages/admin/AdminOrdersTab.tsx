import React, { useState } from 'react';
import { Eye, MessageCircle, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import type { Order, OrderStatus, PaymentStatus } from '../../types';
import { buildWhatsAppLink, formatBDT } from '../../utils/format';

interface AdminOrdersTabProps {
  orders: Order[];
  onRefresh: () => Promise<void>;
}

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const PAYMENT_STATUSES: PaymentStatus[] = ['Unpaid', 'Paid', 'Refunded'];

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({ orders, onRefresh }) => {
  const { adminToken, refreshStorefront, notify } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [internalNotes, setInternalNotes] = useState('');

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'All' && o.order_status !== statusFilter) return false;
    if (paymentFilter !== 'All' && o.payment_method !== paymentFilter) return false;
    if (dateFilter && !o.created_at.startsWith(dateFilter)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateOrder = async (
    orderId: number,
    patch: { order_status?: OrderStatus; payment_status?: PaymentStatus; internal_notes?: string }
  ) => {
    try {
      await apiRequest(
        `/api/admin/orders/${orderId}`,
        { method: 'PATCH', body: JSON.stringify(patch) },
        adminToken
      );
      notify(
        patch.order_status === 'Cancelled'
          ? 'Order cancelled and inventory restored.'
          : 'Order updated successfully.',
        'success'
      );
      await Promise.all([onRefresh(), refreshStorefront()]);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, ...patch } : null));
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update order.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order ID, customer, phone..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE6E3] text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-[#EAE6E3] text-xs"
        >
          <option value="All">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-[#EAE6E3] text-xs"
        >
          <option value="All">All Payment Methods</option>
          <option value="Cash on Delivery">Cash on Delivery</option>
          <option value="WhatsApp Confirmation">WhatsApp Confirmation</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-[#EAE6E3] text-xs"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#EAE6E3] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF8F5] border-b border-[#EAE6E3] text-[#777777] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Order Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE6E3]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#777777]">
                  No orders match the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="hover:bg-[#FAF8F5]">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">
                    {o.order_number}
                  </td>
                  <td className="py-3 px-4">{o.customer_name}</td>
                  <td className="py-3 px-4 tabular-nums">{o.phone}</td>
                  <td className="py-3 px-4 tabular-nums text-[#777777]">
                    {o.created_at.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium tabular-nums">
                    {formatBDT(o.total_amount)}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={o.payment_status}
                      onChange={(e) =>
                        handleUpdateOrder(o.id, {
                          payment_status: e.target.value as PaymentStatus,
                        })
                      }
                      className="px-2 py-1 bg-white border border-[#EAE6E3] text-xs"
                    >
                      {PAYMENT_STATUSES.map((ps) => (
                        <option key={ps} value={ps}>
                          {ps}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={o.order_status}
                      onChange={(e) =>
                        handleUpdateOrder(o.id, {
                          order_status: e.target.value as OrderStatus,
                        })
                      }
                      className="px-2 py-1 bg-white border border-[#EAE6E3] text-xs"
                    >
                      {ORDER_STATUSES.map((os) => (
                        <option key={os} value={os}>
                          {os}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(o);
                        setInternalNotes(o.internal_notes || '');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-[#EAE6E3] hover:bg-[#FAF8F5]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6E3] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE6E3]">
              <div>
                <p className="uppercase tracking-wider text-[#777777]">Order Record</p>
                <h2 className="font-mono text-xl font-medium text-[#242424]">
                  {selectedOrder.order_number}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-[#777777] hover:text-[#242424]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F5] border border-[#EAE6E3] p-4">
              <div>
                <p className="uppercase tracking-wider text-[#777777] mb-1">Customer</p>
                <p className="font-medium text-[#242424]">{selectedOrder.customer_name}</p>
                <p className="tabular-nums">{selectedOrder.phone}</p>
                <p className="mt-1 text-[#777777]">
                  {selectedOrder.address}, {selectedOrder.area}, {selectedOrder.district}
                </p>
              </div>
              <div>
                <p className="uppercase tracking-wider text-[#777777] mb-1">Summary</p>
                <p>Method: {selectedOrder.payment_method}</p>
                <p>Zone: {selectedOrder.shipping_zone_name}</p>
                <p className="font-semibold text-sm text-[#242424] mt-1 tabular-nums">
                  Total: {formatBDT(selectedOrder.total_amount)}
                </p>
                {selectedOrder.notes && (
                  <p className="mt-1 text-[#777777]">Note: {selectedOrder.notes}</p>
                )}
              </div>
            </div>

            <div className="border border-[#EAE6E3] divide-y divide-[#EAE6E3]">
              {(selectedOrder.items || []).map((item) => (
                <div key={item.id} className="p-3 flex justify-between">
                  <span>
                    {item.product_name} ({item.sku}) × {item.quantity}
                  </span>
                  <span className="font-medium tabular-nums">{formatBDT(item.line_total)}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="block uppercase tracking-wider text-[#242424] mb-1">
                Internal Admin Notes
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Courier tracking ID or verification note..."
                  className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateOrder(selectedOrder.id, { internal_notes: internalNotes })}
                  className="px-4 py-2 bg-[#242424] text-white uppercase tracking-wider"
                >
                  Save Note
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE6E3]">
              <a
                href={buildWhatsAppLink(
                  `Hello ${selectedOrder.customer_name}, regarding your Floria Korean Beauty order ${selectedOrder.order_number} (Total: ${formatBDT(
                    selectedOrder.total_amount
                  )}).`,
                  `88${selectedOrder.whatsapp || selectedOrder.phone}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#EAE6E3] bg-[#FAF8F5] text-[#242424] uppercase tracking-wider"
              >
                <MessageCircle className="w-4 h-4 text-[#D5A7A8]" />
                <span>Message Customer on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 bg-[#242424] text-white uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
