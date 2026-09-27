import React, { useState } from 'react';
import {
  Users,
  Award,
  Gift,
  Search,
  SlidersHorizontal,
  RotateCcw,
  QrCode,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import { formatAlgiersDate, formatAlgiersDateTime } from '../../utils/algiersTime';

// ============================================================================
// SECTION 12: CUSTOMERS MANAGEMENT VIEW (ADMIN ONLY)
// ============================================================================
export const CustomersManagementView: React.FC<{
  customers: any[];
  onSearch: (q: string, statusFilter?: string) => void;
  onUpdateCustomer: (
    customerId: string,
    updates: {
      loyaltyStatus?: 'Active' | 'Gold' | 'VIP';
      accountStatus?: 'Active' | 'Suspended';
    },
  ) => Promise<void>;
}> = ({ customers, onSearch, onUpdateCustomer }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<'orders' | 'loyalty' | 'rewards'>('orders');
  const [busyId, setBusyId] = useState<string | null>(null);

  const selectedCustomer = selectedCustomerId
    ? customers.find((c) => c.customerId === selectedCustomerId) || null
    : null;

  const filteredCustomers = customers.filter((c) => {
    if (statusFilter === 'ALL') return true;
    const accSt = (c.accountStatus || 'Active').toUpperCase();
    const loySt = (c.loyaltyStatus || 'Active').toUpperCase();
    return accSt === statusFilter || loySt === statusFilter;
  });

  // Detailed Customer Profile View
  if (selectedCustomer) {
    const orders = selectedCustomer.orders || [];
    const transactions = selectedCustomer.transactions || [];
    const rewards =
      selectedCustomer.allRewards || [
        ...(selectedCustomer.availableRewards || []),
        ...(selectedCustomer.redeemedRewards || []),
      ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedCustomerId(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#ded7c8] hover:border-[#351016] text-xs font-semibold text-[#351016] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Customers</span>
          </button>
          <span className="text-xs font-mono text-[#7a6b61]">
            Sanitized Profile · Zero Authentication Secrets Exposed
          </span>
        </div>

        {/* CUSTOMER PROFILE & LOYALTY SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Customer Profile Card */}
          <div className="lg:col-span-2 bg-white border border-[#ded7c8] rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#eee9de] pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#c9833a] font-bold block">
                  CUSTOMER PROFILE · {selectedCustomer.customerId}
                </span>
                <h3 className="font-serif font-bold text-2xl text-[#221a14] mt-1">
                  {selectedCustomer.name}
                </h3>
                <p className="font-mono text-xs text-[#59493f] mt-1">
                  Phone: <strong>{selectedCustomer.phone}</strong>
                  {selectedCustomer.email ? ` · Email: ${selectedCustomer.email}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedCustomer.accountStatus === 'Suspended'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-[#2e7d32]/15 text-[#2e7d32]'
                  }`}
                >
                  {selectedCustomer.accountStatus || 'Active'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#c9833a]/20 text-[#6b3a1f]">
                  {selectedCustomer.loyaltyStatus || 'Active'} Tier
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#faf6ef] border border-[#ded7c8]">
                <span className="text-[#7a6b61] block">Registration Date</span>
                <strong className="font-mono text-sm text-[#221a14] mt-0.5 block">
                  {selectedCustomer.createdAt
                    ? formatAlgiersDate(selectedCustomer.createdAt)
                    : '—'}
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#faf6ef] border border-[#ded7c8]">
                <span className="text-[#7a6b61] block">Account Status</span>
                <strong className="font-mono text-sm text-[#221a14] mt-0.5 block">
                  {selectedCustomer.accountStatus || 'Active'}
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#faf6ef] border border-[#ded7c8]">
                <span className="text-[#7a6b61] block">Total Orders</span>
                <strong className="font-mono text-sm text-[#221a14] mt-0.5 block">
                  {selectedCustomer.totalOrders || 0} orders
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#faf6ef] border border-[#ded7c8]">
                <span className="text-[#7a6b61] block">Total Spent</span>
                <strong className="font-mono text-sm text-[#351016] mt-0.5 block">
                  {(selectedCustomer.totalSpent || 0).toLocaleString()} DA
                </strong>
              </div>
            </div>

            {/* Admin Controls for Tier & Account Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#eee9de]">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#59493f] mb-1.5">
                  Loyalty Tier
                </label>
                <select
                  disabled={busyId === selectedCustomer.customerId}
                  value={selectedCustomer.loyaltyStatus || 'Active'}
                  onChange={async (e) => {
                    setBusyId(selectedCustomer.customerId);
                    try {
                      await onUpdateCustomer(selectedCustomer.customerId, {
                        loyaltyStatus: e.target.value as 'Active' | 'Gold' | 'VIP',
                      });
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#faf6ef] border border-[#ded7c8] rounded-xl text-xs font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Gold">Gold</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#59493f] mb-1.5">
                  Account Status
                </label>
                <select
                  disabled={busyId === selectedCustomer.customerId}
                  value={selectedCustomer.accountStatus || 'Active'}
                  onChange={async (e) => {
                    setBusyId(selectedCustomer.customerId);
                    try {
                      await onUpdateCustomer(selectedCustomer.customerId, {
                        accountStatus: e.target.value as 'Active' | 'Suspended',
                      });
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#faf6ef] border border-[#ded7c8] rounded-xl text-xs font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* LOYALTY Summary Box */}
          <div className="bg-[#221a14] text-[#faf6ef] border border-[#c9833a]/40 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#e8b878] block">
                LOYALTY STATUS
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#d8cfc2]">Current Stamps</span>
                <span className="font-serif font-bold text-3xl text-[#e8b878]">
                  {selectedCustomer.currentStampCount} / 7
                </span>
              </div>
              {/* 7-Stamp Visual Bar */}
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const filled = idx < (selectedCustomer.currentStampCount || 0);
                  return (
                    <div
                      key={idx}
                      className={`h-2.5 rounded-full ${
                        filled ? 'bg-[#c9833a]' : 'bg-white/10'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#d8cfc2]/80">Lifetime Stamps</span>
                <strong className="font-mono text-sm text-[#faf6ef]">
                  {selectedCustomer.lifetimeStamps || 0}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#d8cfc2]/80">Available Rewards</span>
                <strong className="font-mono text-sm text-[#81c784]">
                  {(selectedCustomer.availableRewards || []).length} Free Drink(s)
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#d8cfc2]/80">Welcome Bonus (+2)</span>
                <strong className="font-mono text-xs text-[#e8b878]">
                  {selectedCustomer.welcomeBonusGranted ? 'Granted' : 'Standard'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ORDERS / LOYALTY HISTORY / REWARDS TABS */}
        <div className="bg-white border border-[#ded7c8] rounded-2xl overflow-hidden">
          <div className="border-b border-[#ded7c8] bg-[#faf6ef] px-5 py-3 flex flex-wrap items-center gap-2">
            {[
              { id: 'orders', label: `ORDERS (${orders.length})` },
              { id: 'loyalty', label: `LOYALTY HISTORY (${transactions.length})` },
              { id: 'rewards', label: `REWARDS (${rewards.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setProfileTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  profileTab === t.id
                    ? 'bg-[#351016] text-[#faf6ef]'
                    : 'bg-white border border-[#ded7c8] text-[#59493f] hover:bg-[#eee9de]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {profileTab === 'orders' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#ded7c8] uppercase tracking-wider text-[#7a6b61]">
                      <th className="py-3 px-3">Order</th>
                      <th className="py-3 px-3">Items</th>
                      <th className="py-3 px-3">Total</th>
                      <th className="py-3 px-3">Date & Time (Algiers)</th>
                      <th className="py-3 px-3">Loyalty</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee9de]">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#8a7b70]">
                          No order history recorded for this customer yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord: any) => (
                        <tr key={ord.orderId || ord.id} className="hover:bg-[#faf6ef]/60">
                          <td className="py-3 px-3 font-mono font-bold text-[#351016]">
                            #{ord.orderId || ord.id}
                          </td>
                          <td className="py-3 px-3 text-[#221a14]">
                            {(ord.orderItems || ord.items || [])
                              .map((i: any) => `${i.name} ×${i.quantity}`)
                              .join(', ')}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#221a14]">
                            {(ord.totalAmount || 0).toLocaleString()} DA
                          </td>
                          <td className="py-3 px-3 font-mono text-[#6b5a4e]">
                            {ord.algiersDateTime || formatAlgiersDateTime(ord.createdAt)}
                          </td>
                          <td className="py-3 px-3 font-mono">
                            {ord.loyaltyStampAwarded ? (
                              <span className="text-[#2e7d32] font-bold">✓ +1 Stamp</span>
                            ) : (
                              <span className="text-[#8a7b70]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#351016]">
                            {ord.status}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {profileTab === 'loyalty' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#ded7c8] uppercase tracking-wider text-[#7a6b61]">
                      <th className="py-3 px-3">Tx ID</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Stamps Delta</th>
                      <th className="py-3 px-3">Order / Reference</th>
                      <th className="py-3 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee9de]">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#8a7b70]">
                          No loyalty transactions recorded for this customer.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-[#faf6ef]/60">
                          <td className="py-3 px-3 font-mono font-bold text-[#351016]">{tx.id}</td>
                          <td className="py-3 px-3 font-mono font-semibold">{tx.type}</td>
                          <td
                            className={`py-3 px-3 font-mono font-bold ${
                              tx.stampsDelta > 0
                                ? 'text-[#2e7d32]'
                                : tx.stampsDelta < 0
                                ? 'text-[#c62828]'
                                : 'text-[#6b5a4e]'
                            }`}
                          >
                            {tx.stampsDelta > 0 ? `+${tx.stampsDelta}` : tx.stampsDelta}
                          </td>
                          <td className="py-3 px-3 text-[#4a3b32]">
                            {tx.orderId ? `#${tx.orderId} · ` : ''}
                            {tx.note}
                          </td>
                          <td className="py-3 px-3 font-mono text-[#6b5a4e]">
                            {tx.timestamp ? formatAlgiersDateTime(tx.timestamp) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {profileTab === 'rewards' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#ded7c8] uppercase tracking-wider text-[#7a6b61]">
                      <th className="py-3 px-3">Reward ID</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Redemption Code</th>
                      <th className="py-3 px-3">Issued Date</th>
                      <th className="py-3 px-3">Expiration / Redeemed</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee9de]">
                    {rewards.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#8a7b70]">
                          No rewards issued to this customer yet.
                        </td>
                      </tr>
                    ) : (
                      rewards.map((rw: any) => (
                        <tr key={rw.rewardId} className="hover:bg-[#faf6ef]/60">
                          <td className="py-3 px-3 font-mono font-bold text-[#351016]">
                            {rw.rewardId}
                          </td>
                          <td className="py-3 px-3 font-mono">{rw.type || 'FREE_DRINK'}</td>
                          <td className="py-3 px-3 font-mono font-bold text-[#6b3a1f]">
                            {rw.redemptionCode}
                          </td>
                          <td className="py-3 px-3 font-mono text-[#6b5a4e]">
                            {rw.issuedAt ? formatAlgiersDateTime(rw.issuedAt) : '—'}
                          </td>
                          <td className="py-3 px-3 font-mono text-[#6b5a4e]">
                            {rw.redeemedAt
                              ? `Redeemed ${formatAlgiersDateTime(rw.redeemedAt)}`
                              : rw.expiresAt
                              ? `Expires ${formatAlgiersDate(rw.expiresAt)}`
                              : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded font-mono font-bold ${
                                rw.status === 'AVAILABLE'
                                  ? 'bg-[#2e7d32]/15 text-[#2e7d32]'
                                  : rw.status === 'REDEEMED'
                                  ? 'bg-[#c9833a]/20 text-[#6b3a1f]'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {rw.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Customers Directory Table View
  return (
    <div className="space-y-5">
      {/* Toolbar: [ Search customer... ] [ Filter ▼ ] */}
      <div className="bg-white border border-[#ded7c8] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8a7b70] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearch(e.target.value, statusFilter);
            }}
            placeholder="Search customer by name, phone, or ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#faf6ef] border border-[#ded7c8] rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#faf6ef] border border-[#ded7c8] rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-[#7a6b61]" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                onSearch(search, e.target.value);
              }}
              aria-label="Filter customers"
              className="bg-transparent text-xs font-semibold text-[#221a14] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Customers ({customers.length})</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="SUSPENDED">Suspended Accounts</option>
              <option value="GOLD">Gold Tier</option>
              <option value="VIP">VIP Tier</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-[#ded7c8] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#faf6ef] border-b border-[#ded7c8] text-[11px] uppercase tracking-wider text-[#7a6b61]">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Orders</th>
                <th className="py-3.5 px-4">Total Spent</th>
                <th className="py-3.5 px-4">Loyalty</th>
                <th className="py-3.5 px-4">Rewards</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9de]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-[#8a7b70]">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.customerId}
                    onClick={() => {
                      setSelectedCustomerId(c.customerId);
                      setProfileTab('orders');
                    }}
                    className="cursor-pointer hover:bg-[#faf6ef]/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-[#221a14]">{c.name}</div>
                      <div className="font-mono text-[11px] text-[#8a7b70]">{c.customerId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#351016]">{c.phone}</td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#221a14]">
                      {c.totalOrders || 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#351016]">
                      {(c.totalSpent || 0).toLocaleString()} DA
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-xs text-[#351016]">
                        {c.currentStampCount} / 7
                      </span>
                      <span className="block text-[10px] text-[#7a6b61]">
                        {c.lifetimeStamps} lifetime
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="text-[#2e7d32] font-bold">
                        {(c.availableRewards || []).length} avail
                      </span>{' '}
                      · {(c.redeemedRewards || []).length} used
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#6b5a4e]">
                      {c.createdAt ? formatAlgiersDate(c.createdAt) : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded ${
                          c.accountStatus === 'Suspended'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-[#2e7d32]/15 text-[#2e7d32]'
                        }`}
                      >
                        {c.accountStatus || 'Active'}
                      </span>
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

// ============================================================================
// SECTION 13: LOYALTY MANAGEMENT VIEW (ADMIN ONLY)
// Tabs: Overview | Accounts | Transactions | Adjustments
// ============================================================================
export const LoyaltyManagementView: React.FC<{
  loyaltyData: any;
  onAdminAdjust: (customerId: string, stampsDelta: number, reason: string) => Promise<void>;
  onOrderReversal: (orderId: string, reason: string) => Promise<void>;
}> = ({ loyaltyData, onAdminAdjust, onOrderReversal }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'accounts' | 'transactions' | 'adjustments'
  >('overview');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [delta, setDelta] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [reversalOrderId, setReversalOrderId] = useState<string>('');
  const [reversalReason, setReversalReason] = useState<string>('Order cancelled / refunded');
  const [ledgerFilter, setLedgerFilter] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accounts = loyaltyData?.accounts || [];
  const transactions = loyaltyData?.transactions || [];
  const summary = loyaltyData?.summary || {};

  const stampsIssuedCount =
    summary.stampsIssuedTotal ??
    summary.lifetimeStampsTotal ??
    transactions
      .filter((t: any) => t.stampsDelta > 0 && t.status !== 'REVERSED')
      .reduce((s: number, t: any) => s + t.stampsDelta, 0);

  const rewardsIssuedCount =
    summary.rewardsIssuedCount ??
    transactions.filter((t: any) => t.type === 'REWARD_ISSUED').length;

  const rewardsRedeemedCount =
    summary.rewardsRedeemedCount ??
    transactions.filter((t: any) => t.type === 'REWARD_REDEEMED').length;

  const filteredTx =
    ledgerFilter === 'ALL'
      ? transactions
      : transactions.filter((t: any) => t.type === ledgerFilter);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedCustomerId || accounts[0]?.customerId;
    if (!targetId || !reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdminAdjust(targetId, delta, reason.trim());
      setReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReversalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalOrderId.trim()) return;
    setIsSubmitting(true);
    try {
      await onOrderReversal(reversalOrderId.trim(), reversalReason.trim());
      setReversalOrderId('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Loyalty Sub-Navigation Tabs: Overview | Accounts | Transactions | Adjustments */}
      <div className="bg-white border border-[#ded7c8] rounded-2xl p-2 flex flex-wrap items-center gap-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'accounts', label: `Accounts (${accounts.length})` },
          { id: 'transactions', label: `Transactions (${transactions.length})` },
          { id: 'adjustments', label: 'Adjustments' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#351016] text-[#faf6ef] shadow-xs'
                : 'text-[#59493f] hover:bg-[#faf6ef]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5 Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-[#ded7c8] p-4 rounded-2xl">
          <span className="text-[11px] uppercase tracking-wider text-[#7a6b61] font-semibold">
            Total Loyalty Members
          </span>
          <p className="font-serif font-bold text-2xl text-[#221a14] mt-1">
            {summary.totalMembers ?? accounts.length}
          </p>
          <span className="text-[11px] text-[#2e7d32]">+2 welcome stamps rule</span>
        </div>

        <div className="bg-white border border-[#ded7c8] p-4 rounded-2xl">
          <span className="text-[11px] uppercase tracking-wider text-[#7a6b61] font-semibold">
            Active Members
          </span>
          <p className="font-serif font-bold text-2xl text-[#351016] mt-1">
            {summary.activeMembers ?? accounts.length}
          </p>
          <span className="text-[11px] text-[#6b5a4e]">With active stamps/rewards</span>
        </div>

        <div className="bg-white border border-[#ded7c8] p-4 rounded-2xl">
          <span className="text-[11px] uppercase tracking-wider text-[#7a6b61] font-semibold">
            Stamps Issued
          </span>
          <p className="font-serif font-bold text-2xl text-[#c9833a] mt-1">
            {stampsIssuedCount}
          </p>
          <span className="text-[11px] text-[#6b5a4e]">
            {summary.activeStampsInCirculation ?? 0} currently on cards
          </span>
        </div>

        <div className="bg-white border border-[#ded7c8] p-4 rounded-2xl">
          <span className="text-[11px] uppercase tracking-wider text-[#7a6b61] font-semibold">
            Rewards Issued
          </span>
          <p className="font-serif font-bold text-2xl text-[#2e7d32] mt-1">
            {rewardsIssuedCount}
          </p>
          <span className="text-[11px] text-[#6b5a4e]">Unlocked at 7 stamps</span>
        </div>

        <div className="bg-white border border-[#ded7c8] p-4 rounded-2xl">
          <span className="text-[11px] uppercase tracking-wider text-[#7a6b61] font-semibold">
            Rewards Redeemed
          </span>
          <p className="font-serif font-bold text-2xl text-[#351016] mt-1">
            {rewardsRedeemedCount}
          </p>
          <span className="text-[11px] text-[#6b5a4e]">Verified at counter</span>
        </div>
      </div>

      {/* TAB 1: OVERVIEW (Recent Loyalty Activity + Rules Summary) */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="bg-[#221a14] text-[#faf6ef] border border-[#c9833a]/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#e8b878] block">
                Server-Authoritative Loyalty Engine
              </span>
              <h4 className="font-serif font-bold text-lg">
                +2 Welcome Bonus · +1 Qualifying Completed Order · 7 Stamps = 1 Free Drink
              </h4>
              <p className="text-xs text-[#d8cfc2]/80">
                All stamp calculations, idempotency checks, and reward issuances are enforced strictly on the backend.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('adjustments')}
              className="px-4 py-2.5 rounded-xl bg-[#c9833a] text-[#18090c] text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
            >
              Open Adjustments
            </button>
          </div>

          <div className="bg-white border border-[#ded7c8] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#ded7c8] flex items-center justify-between">
              <h4 className="font-serif font-bold text-lg text-[#221a14]">
                Recent Loyalty Activity
              </h4>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-semibold text-[#351016] hover:text-[#c9833a] underline cursor-pointer"
              >
                View All Transactions →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#faf6ef] border-b border-[#ded7c8] uppercase tracking-wider text-[#7a6b61]">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Order / Reference</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee9de]">
                  {transactions.slice(0, 15).map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-[#faf6ef]/60">
                      <td className="py-3 px-4">
                        <span className="font-serif font-bold text-sm text-[#221a14]">
                          {tx.customerName || tx.customerId}
                        </span>
                        <span className="block font-mono text-[10px] text-[#8a7b70]">
                          {tx.customerId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#351016]">{tx.type}</span>
                        {tx.stampsDelta !== 0 && (
                          <span
                            className={`ml-2 font-mono font-bold ${
                              tx.stampsDelta > 0 ? 'text-[#2e7d32]' : 'text-[#c62828]'
                            }`}
                          >
                            ({tx.stampsDelta > 0 ? `+${tx.stampsDelta}` : tx.stampsDelta})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#4a3b32]">
                        {tx.orderId ? `#${tx.orderId} — ` : ''}
                        {tx.note}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#6b5a4e]">
                        {tx.timestamp ? formatAlgiersDateTime(tx.timestamp) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="bg-white border border-[#ded7c8] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#faf6ef] border-b border-[#ded7c8] text-[11px] uppercase tracking-wider text-[#7a6b61]">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Current Stamps</th>
                  <th className="py-3.5 px-4">Lifetime Stamps</th>
                  <th className="py-3.5 px-4">Welcome Bonus</th>
                  <th className="py-3.5 px-4">Available Rewards</th>
                  <th className="py-3.5 px-4">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9de]">
                {accounts.map((acc: any) => (
                  <tr key={acc.customerId} className="hover:bg-[#faf6ef]/60">
                    <td className="py-3 px-4">
                      <div className="font-serif font-bold text-[#221a14]">{acc.name}</div>
                      <div className="font-mono text-xs text-[#8a7b70]">{acc.customerId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#351016]">{acc.phone}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#351016]">
                      {acc.currentStampCount} / 7
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#59493f]">
                      {acc.lifetimeStamps}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {acc.welcomeBonusGranted ? (
                        <span className="text-[#2e7d32] font-semibold">+2 Granted</span>
                      ) : (
                        <span className="text-[#8a7b70]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-[#2e7d32]">
                      {(acc.availableRewards || []).length}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-[#c9833a]">
                      {acc.loyaltyStatus || 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-[#ded7c8] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-serif font-bold text-lg text-[#221a14]">
                Immutable Loyalty Transactions Ledger
              </h4>
              <p className="text-xs text-[#7a6b61]">
                Filter by transaction type across all customer loyalty events.
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                'ALL',
                'WELCOME_BONUS',
                'PURCHASE_STAMP',
                'REWARD_ISSUED',
                'REWARD_REDEEMED',
                'ADMIN_ADJUSTMENT',
                'REVERSAL',
              ].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLedgerFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold cursor-pointer ${
                    ledgerFilter === type
                      ? 'bg-[#351016] text-[#faf6ef]'
                      : 'bg-[#faf6ef] border border-[#ded7c8] text-[#59493f]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#faf6ef] border-b border-[#ded7c8] uppercase tracking-wider text-[#7a6b61]">
                <tr>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Delta</th>
                  <th className="py-3 px-3">Order / Reference</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9de]">
                {filteredTx.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-[#faf6ef]/60">
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-[#221a14]">
                        {tx.customerName || tx.customerId}
                      </span>
                      <span className="block font-mono text-[10px] text-[#8a7b70]">
                        {tx.customerId}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#351016]">
                      {tx.type}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-mono font-bold ${
                        tx.stampsDelta > 0
                          ? 'text-[#2e7d32]'
                          : tx.stampsDelta < 0
                          ? 'text-[#c62828]'
                          : 'text-[#6b5a4e]'
                      }`}
                    >
                      {tx.stampsDelta > 0 ? `+${tx.stampsDelta}` : tx.stampsDelta}
                    </td>
                    <td className="py-2.5 px-3 text-[#4a3b32]">
                      {tx.orderId ? `#${tx.orderId} · ` : ''}
                      {tx.note}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#7a6b61]">
                      {tx.timestamp ? formatAlgiersDateTime(tx.timestamp) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ADJUSTMENTS */}
      {activeTab === 'adjustments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <form
            onSubmit={handleAdjustSubmit}
            className="bg-white border border-[#ded7c8] rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#c9833a]" />
              <h4 className="font-serif font-bold text-lg text-[#221a14]">
                Auditable Admin Stamp Adjustment
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#221a14] mb-1">
                  Customer Account *
                </label>
                <select
                  value={selectedCustomerId || accounts[0]?.customerId || ''}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#faf6ef] border border-[#ded7c8] rounded-xl text-xs font-semibold"
                >
                  {accounts.map((acc: any) => (
                    <option key={acc.customerId} value={acc.customerId}>
                      {acc.name} ({acc.phone}) — {acc.currentStampCount}/7 stamps
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#221a14] mb-1">
                  Stamp Delta (+ / -) *
                </label>
                <input
                  type="number"
                  min={-7}
                  max={7}
                  required
                  value={delta}
                  onChange={(e) => setDelta(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#faf6ef] border border-[#ded7c8] rounded-xl text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#221a14] mb-1">
                Audit Reason *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Courtesy stamp for counter order #VENTY-1042"
                className="w-full px-3.5 py-2.5 bg-[#faf6ef] border border-[#ded7c8] rounded-xl text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#351016] hover:bg-[#c9833a] text-[#faf6ef] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Applying...' : 'Apply Server-Authoritative Adjustment'}
            </button>
          </form>

          <form
            onSubmit={handleReversalSubmit}
            className="bg-white border border-[#ded7c8] rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#c62828]" />
              <h4 className="font-serif font-bold text-lg text-[#221a14]">
                Order Stamp Reversal (Refund / Cancelled Order)
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#221a14] mb-1">
                  Order ID *
                </label>
                <input
                  type="text"
                  required
                  value={reversalOrderId}
                  onChange={(e) => setReversalOrderId(e.target.value)}
                  placeholder="e.g. VENTY-7241"
                  className="w-full px-3.5 py-2.5 bg-[#faf6ef] border border-[#ded7c8] rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#221a14] mb-1">
                  Reversal Reason
                </label>
                <input
                  type="text"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#faf6ef] border border-[#ded7c8] rounded-xl text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-[#7a6b61]">
              Reverses any loyalty stamp awarded by the specified order and appends an immutable `REVERSAL` transaction to the customer ledger.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#c62828] hover:bg-red-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Reverse Order Stamp
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SECTION 14: REWARDS MANAGEMENT VIEW (STAFF & ADMIN)
// Tabs: Available | Redeemed | Expired | Cancelled
// ============================================================================
export const RewardsManagementView: React.FC<{
  rewardsData: any;
  isAdmin: boolean;
  onVerifyReward: (query: string) => Promise<any>;
  onRedeemReward: (codeOrId: string) => Promise<void>;
  onCancelReward: (rewardId: string, reason: string) => Promise<void>;
}> = ({ rewardsData, isAdmin, onVerifyReward, onRedeemReward, onCancelReward }) => {
  const [statusFilter, setStatusFilter] = useState<
    'AVAILABLE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED'
  >('AVAILABLE');
  const [verifyInput, setVerifyInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const rewards = rewardsData?.rewards || [];
  const counts = rewardsData?.counts || {
    available: 0,
    redeemed: 0,
    expired: 0,
    cancelled: 0,
  };

  const filtered = rewards.filter((r: any) => r.status === statusFilter);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;
    setIsBusy(true);
    try {
      const res = await onVerifyReward(verifyInput.trim());
      setVerificationResult(res);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Counter Reward Verification & Redemption Bar */}
      <div className="bg-[#221a14] text-[#faf6ef] border border-[#c9833a]/40 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#e8b878] block">
              Counter POS Verification
            </span>
            <h3 className="font-serif font-bold text-xl">
              Verify & Redeem Free Coffee Reward
            </h3>
          </div>
        </div>

        <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
            placeholder="Enter reward code (e.g. VENTY-7F4K2), Reward ID, or QR token..."
            className="flex-1 px-4 py-3 rounded-xl bg-[#14070a] border border-[#c9833a]/40 text-sm font-mono text-[#faf6ef] placeholder:text-[#d8cfc2]/40 focus:outline-none focus:border-[#e8b878]"
          />
          <button
            type="submit"
            disabled={isBusy}
            className="bg-[#c9833a] hover:bg-[#dfb06c] text-[#18090c] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
          >
            {isBusy ? 'Verifying...' : 'Verify Reward'}
          </button>
        </form>

        {verificationResult && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              verificationResult.valid
                ? 'bg-[#2e7d32]/20 border-[#4caf50]/50 text-[#e8f5e9]'
                : 'bg-red-950/60 border-red-400/40 text-red-200'
            }`}
          >
            <div className="space-y-1 text-xs">
              <p className="font-bold text-sm">{verificationResult.message}</p>
              {verificationResult.reward && (
                <p className="font-mono">
                  Reward ID: <strong>{verificationResult.reward.rewardId}</strong> · Code:{' '}
                  <strong>{verificationResult.reward.redemptionCode}</strong> · Customer:{' '}
                  <strong>{verificationResult.customer?.name}</strong> (
                  {verificationResult.customer?.phone}) · Status:{' '}
                  <strong>{verificationResult.status}</strong>
                </p>
              )}
            </div>

            {verificationResult.valid && verificationResult.reward && (
              <button
                type="button"
                disabled={isBusy}
                onClick={async () => {
                  setIsBusy(true);
                  try {
                    await onRedeemReward(verificationResult.reward.redemptionCode);
                    setVerificationResult(null);
                    setVerifyInput('');
                  } finally {
                    setIsBusy(false);
                  }
                }}
                className="bg-[#4caf50] hover:bg-[#43a047] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
              >
                Confirm Redemption Now
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4 Required Tabs: Available | Redeemed | Expired | Cancelled */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'AVAILABLE', label: 'Available', count: counts.available },
          { key: 'REDEEMED', label: 'Redeemed', count: counts.redeemed },
          { key: 'EXPIRED', label: 'Expired', count: counts.expired },
          { key: 'CANCELLED', label: 'Cancelled', count: counts.cancelled },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key as any)}
            className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-[#351016] text-[#faf6ef] border-[#351016]'
                : 'bg-white text-[#221a14] border-[#ded7c8] hover:bg-[#faf6ef]'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider opacity-75 block font-semibold">
              {tab.label}
            </span>
            <span className="font-serif font-bold text-2xl mt-0.5 block">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Rewards Table */}
      <div className="bg-white border border-[#ded7c8] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#faf6ef] border-b border-[#ded7c8] text-[11px] uppercase tracking-wider text-[#7a6b61]">
                <th className="py-3.5 px-4">Reward Type</th>
                <th className="py-3.5 px-4">Reward ID / Code</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Issued Date</th>
                <th className="py-3.5 px-4">Expiration Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9de]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[#8a7b70]">
                    No rewards in "{statusFilter}" status.
                  </td>
                </tr>
              ) : (
                filtered.map((rw: any) => (
                  <tr key={rw.rewardId} className="hover:bg-[#faf6ef]/60">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#59493f]">
                      {rw.type || 'FREE_DRINK'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-xs text-[#351016]">
                        {rw.rewardId}
                      </div>
                      <div className="font-mono text-xs text-[#c9833a] font-semibold">
                        Code: {rw.redemptionCode}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-[#221a14]">{rw.customerName}</div>
                      <div className="font-mono text-xs text-[#6b5a4e]">
                        {rw.customerPhone} · {rw.customerId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-[#6b5a4e]">
                      {rw.issuedAt ? formatAlgiersDateTime(rw.issuedAt) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-[#6b5a4e]">
                      {rw.expiresAt
                        ? formatAlgiersDate(rw.expiresAt)
                        : rw.redeemedAt
                        ? `Redeemed ${formatAlgiersDateTime(rw.redeemedAt)}`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                          rw.status === 'AVAILABLE'
                            ? 'bg-[#2e7d32]/15 text-[#2e7d32]'
                            : rw.status === 'REDEEMED'
                            ? 'bg-[#c9833a]/20 text-[#6b3a1f]'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {rw.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {rw.status === 'AVAILABLE' && (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onRedeemReward(rw.redemptionCode)}
                            className="px-3 py-1.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Redeem
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                onCancelReward(rw.rewardId, 'Cancelled via Admin Rewards Console')
                              }
                              className="px-2.5 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
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
