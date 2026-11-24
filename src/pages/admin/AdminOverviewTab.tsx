import React from 'react';
import type { AdminActivityLog, Order } from '../../types';
import { formatBDT } from '../../utils/format';

export interface DashboardData {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    totalCustomers: number;
  };
  recentOrders: Order[];
  recentActivities: AdminActivityLog[];
  revenueByStatus: Array<{ status: string; count: number; revenue: number }>;
}

interface AdminOverviewTabProps {
  data: DashboardData | null;
  onNavigateTab: (tab: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ data, onNavigateTab }) => {
  if (!data) {
    return <p className="text-sm text-[#777777]">Loading dashboard overview...</p>;
  }

  const { stats, recentOrders, recentActivities, revenueByStatus } = data;
  const maxStatusCount = Math.max(1, ...revenueByStatus.map((r) => r.count));

  const kpis = [
    { label: 'Total Revenue', value: formatBDT(stats.totalRevenue), sub: 'Excl. cancelled' },
    { label: 'Total Orders', value: String(stats.totalOrders), sub: `${stats.pendingOrders} pending` },
    { label: 'Active Products', value: `${stats.activeProducts} / ${stats.totalProducts}`, sub: `${stats.outOfStockProducts} out of stock` },
    { label: 'Total Customers', value: String(stats.totalCustomers), sub: 'Saved profiles' },
  ];

  const statusCounts = [
    { label: 'Pending', count: stats.pendingOrders },
    { label: 'Confirmed', count: stats.confirmedOrders },
    { label: 'Processing', count: stats.processingOrders },
    { label: 'Shipped', count: stats.shippedOrders },
    { label: 'Delivered', count: stats.deliveredOrders },
    { label: 'Cancelled', count: stats.cancelledOrders },
  ];

  return (
    <div className="space-y-8">
      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-[#EAE6E3] p-5">
            <p className="text-xs uppercase tracking-wider text-[#777777]">{k.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#242424] tabular-nums">{k.value}</p>
            <p className="mt-1 text-xs text-[#777777]">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Order Pipeline Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statusCounts.map((s) => (
          <div key={s.label} className="bg-[#FAF8F5] border border-[#EAE6E3] p-4">
            <p className="text-xs text-[#777777]">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-[#242424] tabular-nums">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Chart + Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#EAE6E3] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl font-medium text-[#242424]">Orders by Status</h2>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs uppercase tracking-wider text-[#242424] underline"
            >
              Manage Orders
            </button>
          </div>

          {revenueByStatus.length === 0 ? (
            <p className="text-sm text-[#777777] py-10 text-center">
              No orders placed yet. Orders submitted at checkout will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {revenueByStatus.map((row) => (
                <div key={row.status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#242424]">{row.status}</span>
                    <span className="text-[#777777] tabular-nums">
                      {row.count} orders · {formatBDT(row.revenue)}
                    </span>
                  </div>
                  <div className="h-2 bg-[#FAF8F5] border border-[#EAE6E3] overflow-hidden">
                    <div
                      className="h-full bg-[#242424]"
                      style={{ width: `${Math.round((row.count / maxStatusCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-[#EAE6E3] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-medium text-[#242424]">Recent Activity</h2>
            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className="text-xs uppercase tracking-wider text-[#777777] underline"
            >
              All Logs
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <p className="text-xs text-[#777777]">No administrative actions logged yet.</p>
          ) : (
            <div className="divide-y divide-[#EAE6E3] max-h-64 overflow-y-auto">
              {recentActivities.map((log) => (
                <div key={log.id} className="py-2.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-[#242424]">{log.action}</span>
                    <span className="text-[#777777] tabular-nums shrink-0">
                      {log.created_at.slice(0, 16)}
                    </span>
                  </div>
                  <p className="text-[#777777] truncate mt-0.5">{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-[#EAE6E3] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAE6E3] flex items-center justify-between">
          <h2 className="font-serif text-xl font-medium text-[#242424]">Recent Orders</h2>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="text-xs uppercase tracking-wider underline text-[#242424]"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6E3] text-[#777777] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6E3]">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#777777]">
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4 font-mono font-medium text-[#242424]">
                      {o.order_number}
                    </td>
                    <td className="py-3 px-4">{o.customer_name}</td>
                    <td className="py-3 px-4 tabular-nums text-[#777777]">{o.phone}</td>
                    <td className="py-3 px-4">{o.order_status}</td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">
                      {formatBDT(o.total_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
