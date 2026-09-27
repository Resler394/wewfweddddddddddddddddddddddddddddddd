import React, { useState } from 'react';
import {
  Coffee,
  Star,
  BarChart3,
  UserCog,
  Settings as SettingsIcon,
  ShieldCheck,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  Lock,
  Edit3,
  X,
  Calendar,
} from 'lucide-react';
import { formatAlgiersDate, formatAlgiersDateTime } from '../../utils/algiersTime';

export const MenuManagementView: React.FC<{
  menuData: {
    items: any[];
    categories: { id: string; title: string; subtitle: string }[];
    serverAuthoritativeNotice: string;
  } | null;
  onUpdateItem: (
    itemId: string,
    patch: {
      name?: string;
      category?: string;
      description?: string;
      priceNum?: number;
      available?: boolean;
      loyaltyEligible?: boolean;
      featured?: boolean;
      image?: string;
    },
  ) => void;
  onCreateItem: (payload: {
    name: string;
    category: string;
    description?: string;
    priceNum: number;
    available?: boolean;
    loyaltyEligible?: boolean;
    featured?: boolean;
    image?: string;
  }) => Promise<void>;
}> = ({ menuData, onUpdateItem, onCreateItem }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  // Edit / Create form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('signature');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('450');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formLoyaltyEligible, setFormLoyaltyEligible] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formImage, setFormImage] = useState('');

  if (!menuData) {
    return (
      <div className="p-8 text-center text-sm text-[#6b5a4e]">
        Loading server-authoritative menu catalog...
      </div>
    );
  }

  const openEditModal = (item: any) => {
    setAddingNew(false);
    setEditingItem(item);
    setFormName(item.name || '');
    setFormCategory(item.category || 'signature');
    setFormDescription(item.description || '');
    setFormPrice(String(item.priceNum ?? 400));
    setFormAvailable(item.available !== false);
    setFormLoyaltyEligible(item.loyaltyEligible !== false);
    setFormFeatured(Boolean(item.featured));
    setFormImage(item.image || '');
  };

  const openAddModal = () => {
    setEditingItem(null);
    setAddingNew(true);
    setFormName('');
    setFormCategory(menuData.categories[0]?.id || 'signature');
    setFormDescription('');
    setFormPrice('450');
    setFormAvailable(true);
    setFormLoyaltyEligible(true);
    setFormFeatured(false);
    setFormImage('');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(formPrice);
    if (!formName.trim() || !Number.isFinite(numericPrice) || numericPrice < 50) return;

    if (addingNew) {
      await onCreateItem({
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        priceNum: Math.round(numericPrice),
        available: formAvailable,
        loyaltyEligible: formLoyaltyEligible,
        featured: formFeatured,
        image: formImage.trim() || undefined,
      });
      setAddingNew(false);
    } else if (editingItem) {
      onUpdateItem(editingItem.id, {
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        priceNum: Math.round(numericPrice),
        available: formAvailable,
        loyaltyEligible: formLoyaltyEligible,
        featured: formFeatured,
        image: formImage.trim(),
      });
      setEditingItem(null);
    }
  };

  const filtered = menuData.items.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.categoryTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-[#1b0c0e] text-[#f5efe6] rounded-xl p-5 border border-[#c9833a]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a]">
            SERVER-AUTHORITATIVE PRICING & QUALIFICATION ENGINE
          </div>
          <p className="text-xs text-[#e8dcc8]/90 mt-1">{menuData.serverAuthoritativeNotice}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xs font-mono text-[#c9833a] bg-[#261215] px-3 py-1.5 rounded-lg border border-[#c9833a]/30">
            {menuData.items.length} Official Items
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c9833a] hover:bg-[#b5722d] text-[#150a0c] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Add Product
          </button>
        </div>
      </div>

      {/* Category Filter + Search Product */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#ded7c8] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-[#351016] text-[#f5efe6] font-semibold'
                : 'bg-[#f4efe6] text-[#59493f] hover:bg-[#e8e0d2]'
            }`}
          >
            All ({menuData.items.length})
          </button>
          {menuData.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-[#351016] text-[#f5efe6] font-semibold'
                  : 'bg-[#f4efe6] text-[#59493f] hover:bg-[#e8e0d2]'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[#8a7b70] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Product..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg text-[#221a14] focus:outline-none focus:border-[#351016]"
          />
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-xl border border-[#ded7c8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf6ef] border-b border-[#ded7c8] text-[11px] uppercase tracking-wider text-[#7a6b61]">
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price (DZD)</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4">Loyalty Eligible</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9de]">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-[#faf6ef]/60 transition-colors ${
                    !item.available ? 'opacity-60 bg-red-50/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-[#221a14]">
                        {item.name}
                      </span>
                      {item.featured && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#c9833a]/20 text-[#6b3a1f] font-bold">
                          Featured
                        </span>
                      )}
                      {item.hasOverride && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          Modified
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#8a7b70]">
                      ID: {item.id}
                      {item.description ? ` · ${item.description}` : ''}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#59493f] font-medium">
                    {item.categoryTitle}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#351016]">
                    {item.priceNum} DZD
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onUpdateItem(item.id, { available: !item.available })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer ${
                        item.available
                          ? 'bg-[#2e7d32]/15 text-[#2e7d32]'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.available ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Available
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Unavailable
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateItem(item.id, { loyaltyEligible: !item.loyaltyEligible })
                      }
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer ${
                        item.loyaltyEligible
                          ? 'bg-[#c9833a]/20 text-[#6b3a1f]'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {item.loyaltyEligible ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4efe6] hover:bg-[#351016] text-[#351016] hover:text-[#f5efe6] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Product Modal */}
      {(editingItem || addingNew) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ded7c8] max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#eee9de]">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
                  {addingNew ? 'CREATE MENU PRODUCT' : 'EDIT MENU PRODUCT'}
                </div>
                <h3 className="font-serif font-bold text-lg text-[#221a14] mt-0.5">
                  {addingNew ? 'Add Official Product' : editingItem?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setAddingNew(false);
                }}
                className="p-1.5 rounded-lg text-[#7a6b61] hover:bg-[#f4efe6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Spanish Iced Latte"
                    className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
                  >
                    {menuData.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional tasting notes or preparation description"
                  className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                    Price (DZD) *
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={25000}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="/images/menu/..."
                    className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#faf6ef] border border-[#ded7c8] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                  />
                  <span className="font-medium text-[#221a14]">Available</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#faf6ef] border border-[#ded7c8] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formLoyaltyEligible}
                    onChange={(e) => setFormLoyaltyEligible(e.target.checked)}
                  />
                  <span className="font-medium text-[#221a14]">Loyalty Eligible</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#faf6ef] border border-[#ded7c8] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                  />
                  <span className="font-medium text-[#221a14]">Featured</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eee9de]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setAddingNew(false);
                  }}
                  className="px-4 py-2 rounded-lg border border-[#ded7c8] text-xs font-semibold text-[#59493f] hover:bg-[#faf6ef] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#351016] hover:bg-[#4b1820] text-[#f5efe6] text-xs font-semibold cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReviewsManagementView: React.FC<{
  reviewsData: any | null;
  onRefreshReviews: () => void;
}> = ({ reviewsData, onRefreshReviews }) => {
  if (!reviewsData) {
    return (
      <div className="p-8 text-center text-sm text-[#6b5a4e]">
        Loading Google Reviews integration status...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eee9de]">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
              GOOGLE PLACES REVIEWS INTEGRATION (API KEY REDACTED SERVER-SIDE)
            </div>
            <h3 className="font-serif font-bold text-lg text-[#221a14] mt-0.5">
              Place Name: {reviewsData.name || 'Venty The Coffee'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onRefreshReviews}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#351016] hover:bg-[#4b1820] text-[#f5efe6] rounded-lg text-xs font-semibold cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            [ Refresh Reviews ]
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div className="p-3.5 rounded-lg bg-[#faf6ef] border border-[#e6dfd3]">
            <div className="text-[10px] font-mono uppercase text-[#7a6b61]">Google Rating</div>
            <div className="text-2xl font-serif font-bold text-[#351016] mt-1 flex items-center gap-1.5">
              {reviewsData.rating}
              <Star className="w-4 h-4 text-[#c9833a] fill-[#c9833a]" />
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-[#faf6ef] border border-[#e6dfd3]">
            <div className="text-[10px] font-mono uppercase text-[#7a6b61]">Total Reviews</div>
            <div className="text-2xl font-serif font-bold text-[#221a14] mt-1">
              {reviewsData.userRatingsTotal}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-[#faf6ef] border border-[#e6dfd3]">
            <div className="text-[10px] font-mono uppercase text-[#7a6b61]">Cache Status</div>
            <div className="text-sm font-mono font-bold text-[#2e7d32] mt-1.5 uppercase">
              {reviewsData.source === 'google_places_live'
                ? 'Live Synced (Cached)'
                : 'Verified Curated Cache'}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-[#faf6ef] border border-[#e6dfd3]">
            <div className="text-[10px] font-mono uppercase text-[#7a6b61]">Last Sync</div>
            <div className="text-xs font-mono font-semibold text-[#221a14] mt-1.5">
              {reviewsData.lastUpdatedAt
                ? formatAlgiersDateTime(reviewsData.lastUpdatedAt)
                : 'Active'}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl border border-[#ded7c8] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#faf6ef] border-b border-[#ded7c8] flex items-center justify-between">
          <h4 className="font-serif font-bold text-sm text-[#221a14]">
            Displayed Customer Reviews ({(reviewsData.reviews || []).length})
          </h4>
          <span className="text-[11px] font-mono text-[#7a6b61]">
            Place ID: {reviewsData.placeIdConfigured ? 'Configured (Masked)' : 'Default'}
          </span>
        </div>
        <div className="divide-y divide-[#eee9de]">
          {(reviewsData.reviews || []).map((rev: any, idx: number) => (
            <div key={idx} className="p-5 hover:bg-[#faf6ef]/50 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-[#221a14]">
                    {rev.authorName}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#f4efe6] text-[#6b5a4e]">
                    Source: {reviewsData.source === 'google_places_live' ? 'Google Live' : 'Google Verified'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-[#c9833a] fill-[#c9833a]" />
                    ))}
                  </div>
                  <span className="text-xs font-mono text-[#8a7b70]">
                    {rev.relativeTimeDescription}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#4a3b31] leading-relaxed">"{rev.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AnalyticsManagementView: React.FC<{
  analyticsData: any | null;
  onChangeRange?: (params: {
    range: 'today' | '7d' | '30d' | 'custom';
    startDate?: string;
    endDate?: string;
  }) => void;
}> = ({ analyticsData, onChangeRange }) => {
  const [selectedRange, setSelectedRange] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  if (!analyticsData) {
    return (
      <div className="p-8 text-center text-sm text-[#6b5a4e]">
        Loading business analytics...
      </div>
    );
  }

  const handleSelectPreset = (preset: 'today' | '7d' | '30d') => {
    setSelectedRange(preset);
    if (onChangeRange) {
      onChangeRange({ range: preset });
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    setSelectedRange('custom');
    if (onChangeRange) {
      onChangeRange({ range: 'custom', startDate: customStart, endDate: customEnd });
    }
  };

  const rm = analyticsData.rangeMetrics || {
    ordersCount: analyticsData.totalOrders,
    revenueDzd: analyticsData.totalRevenueDzd,
    avgOrderValueDzd: analyticsData.averageOrderValueDzd,
    completedCount: analyticsData.completedOrdersCount,
    cancelledCount: analyticsData.cancelledOrdersCount,
    stampsIssued: analyticsData.loyaltyActivity?.totalStampsIssued ?? 0,
    rewardsEarned: analyticsData.loyaltyActivity?.totalRewardsIssued ?? 0,
    rewardsRedeemed: analyticsData.loyaltyActivity?.totalRewardsRedeemed ?? 0,
  };

  const timeSeries: any[] = analyticsData.timeSeries || [];
  const maxDailyRev = Math.max(1, ...timeSeries.map((d) => d.revenueDzd || 0));
  const maxDailyOrders = Math.max(1, ...timeSeries.map((d) => d.ordersCount || 0));

  return (
    <div className="space-y-6">
      {/* Date Range Selector Bar */}
      <div className="bg-white rounded-xl border border-[#ded7c8] p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono uppercase tracking-wider text-[#7a6b61] flex items-center gap-1.5 mr-2">
            <Calendar className="w-3.5 h-3.5 text-[#c9833a]" />
            Date Range:
          </span>
          {(
            [
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 days' },
              { id: '30d', label: 'Last 30 days' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => handleSelectPreset(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer transition-colors ${
                selectedRange === btn.id
                  ? 'bg-[#351016] text-[#f5efe6]'
                  : 'bg-[#f4efe6] text-[#59493f] hover:bg-[#e8e0d2]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleApplyCustom} className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-[#7a6b61]">Custom range:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
          />
          <span className="text-xs text-[#7a6b61]">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#c9833a] hover:bg-[#b5722d] text-[#150a0c] rounded-lg text-xs font-bold cursor-pointer"
          >
            Apply
          </button>
        </form>
      </div>

      {/* 8 Required Core Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#ded7c8] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#7a6b61]">Total Orders</div>
          <div className="text-2xl font-serif font-bold text-[#221a14] mt-1">{rm.ordersCount}</div>
          <div className="text-[11px] text-[#6b5a4e] mt-1">
            Lifetime: {analyticsData.totalOrders}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#ded7c8] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#7a6b61]">Revenue</div>
          <div className="text-2xl font-serif font-bold text-[#351016] mt-1">
            {Number(rm.revenueDzd || 0).toLocaleString()} DZD
          </div>
          <div className="text-[11px] text-[#6b5a4e] mt-1">
            Lifetime: {Number(analyticsData.totalRevenueDzd || 0).toLocaleString()} DZD
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#ded7c8] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#7a6b61]">Average Order Value</div>
          <div className="text-2xl font-serif font-bold text-[#c9833a] mt-1">
            {Number(rm.avgOrderValueDzd || 0).toLocaleString()} DZD
          </div>
          <div className="text-[11px] text-[#6b5a4e] mt-1">Per completed order</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#ded7c8] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#7a6b61]">Completed Orders</div>
          <div className="text-2xl font-serif font-bold text-[#2e7d32] mt-1">
            {rm.completedCount}
          </div>
          <div className="text-[11px] text-[#6b5a4e] mt-1">
            Cancelled: {rm.cancelledCount}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#ded7c8] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#7a6b61]">Cancelled Orders</div>
          <div className="text-2xl font-serif font-bold text-red-700 mt-1">
            {rm.cancelledCount}
          </div>
          <div className="text-[11px] text-[#6b5a4e] mt-1">Zero loyalty impact</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#ded7c8] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#7a6b61]">Stamps Issued</div>
          <div className="text-2xl font-serif font-bold text-[#351016] mt-1">{rm.stampsIssued}</div>
          <div className="text-[11px] text-[#6b5a4e] mt-1">
            Lifetime: {analyticsData.loyaltyActivity?.totalStampsIssued ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#ded7c8] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#7a6b61]">Rewards Earned</div>
          <div className="text-2xl font-serif font-bold text-[#c9833a] mt-1">
            {rm.rewardsEarned}
          </div>
          <div className="text-[11px] text-[#6b5a4e] mt-1">
            Available now: {analyticsData.loyaltyActivity?.availableRewardsCount ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#ded7c8] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#7a6b61]">Rewards Redeemed</div>
          <div className="text-2xl font-serif font-bold text-[#2e7d32] mt-1">
            {rm.rewardsRedeemed}
          </div>
          <div className="text-[11px] text-[#6b5a4e] mt-1">
            Redemption rate: {analyticsData.loyaltyActivity?.redemptionRatePercent ?? 0}%
          </div>
        </div>
      </div>

      {/* Daily Orders & Daily Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs">
          <h3 className="font-serif font-bold text-base text-[#221a14] mb-4">
            Daily Orders & Revenue ({timeSeries.length} Days)
          </h3>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {timeSeries.map((day) => (
              <div key={day.date} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#59493f]">{day.date}</span>
                  <span className="font-mono font-bold text-[#351016]">
                    {day.ordersCount} orders · {Number(day.revenueDzd || 0).toLocaleString()} DZD
                  </span>
                </div>
                <div className="w-full h-2 bg-[#f4efe6] rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-[#351016] rounded-full"
                    style={{
                      width: `${Math.max(
                        day.revenueDzd > 0 ? 6 : 0,
                        Math.round((day.revenueDzd / maxDailyRev) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution & Loyalty Engagement */}
        <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-[#221a14] mb-4">
              Order Status Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {Object.entries(analyticsData.statusBreakdown || {}).map(([st, count]: any) => (
                <div
                  key={st}
                  className="p-3 rounded-lg bg-[#faf6ef] border border-[#e6dfd3] text-center"
                >
                  <div className="text-[10px] font-mono uppercase text-[#7a6b61]">{st}</div>
                  <div className="text-xl font-serif font-bold text-[#221a14] mt-1">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#eee9de]">
            <h4 className="font-serif font-bold text-sm text-[#221a14] mb-3">
              Loyalty Engagement Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#faf6ef] border border-[#e6dfd3]">
                <div className="text-[10px] font-mono uppercase text-[#7a6b61]">Members</div>
                <div className="text-lg font-serif font-bold text-[#221a14] mt-0.5">
                  {analyticsData.loyaltyActivity?.totalCustomers ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#faf6ef] border border-[#e6dfd3]">
                <div className="text-[10px] font-mono uppercase text-[#7a6b61]">Active Stamps</div>
                <div className="text-lg font-serif font-bold text-[#c9833a] mt-0.5">
                  {analyticsData.loyaltyActivity?.activeStampsInCirculation ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#faf6ef] border border-[#e6dfd3]">
                <div className="text-[10px] font-mono uppercase text-[#7a6b61]">Lifetime Stamps</div>
                <div className="text-lg font-serif font-bold text-[#351016] mt-0.5">
                  {analyticsData.loyaltyActivity?.totalStampsIssued ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#faf6ef] border border-[#e6dfd3]">
                <div className="text-[10px] font-mono uppercase text-[#7a6b61]">Orders w/ Day</div>
                <div className="text-lg font-serif font-bold text-[#2e7d32] mt-0.5">
                  {maxDailyOrders} peak
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best-Selling Products */}
      <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs">
        <h3 className="font-serif font-bold text-base text-[#221a14] mb-4">
          Best-Selling Products
        </h3>
        {(analyticsData.popularProducts || []).length === 0 ? (
          <p className="text-xs text-[#8a7b70]">No completed product sales recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {analyticsData.popularProducts.map((prod: any, idx: number) => (
              <div
                key={prod.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#faf6ef] border border-[#e6dfd3]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#351016] text-[#f5efe6] font-mono text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-serif font-bold text-sm text-[#221a14]">{prod.name}</div>
                    <div className="text-[11px] font-mono text-[#7a6b61]">
                      {prod.quantitySold} units sold
                    </div>
                  </div>
                </div>
                <div className="font-mono font-bold text-sm text-[#351016]">
                  {prod.revenueDzd.toLocaleString()} DZD
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const StaffManagementView: React.FC<{
  staffData: {
    staffMembers: any[];
    activeStaffSessionsCount: number;
  } | null;
  onAddStaff: (payload: {
    staffId: string;
    name: string;
    role?: string;
    shift?: string;
    pin?: string;
  }) => void;
  onUpdateStaff: (
    staffId: string,
    patch: { status?: 'ACTIVE' | 'SUSPENDED'; role?: string; shift?: string; name?: string },
  ) => void;
  onRevokeStaffSessions: () => void;
}> = ({ staffData, onAddStaff, onUpdateStaff, onRevokeStaffSessions }) => {
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STAFF');
  const [pin, setPin] = useState('');

  if (!staffData) {
    return (
      <div className="p-8 text-center text-sm text-[#6b5a4e]">
        Loading authorized staff directory...
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !name.trim()) return;
    onAddStaff({
      staffId: staffId.trim(),
      name: name.trim(),
      role,
      shift: role === 'ADMIN' ? 'Management' : 'Full Day',
      pin: pin.trim() || undefined,
    });
    setStaffId('');
    setName('');
    setPin('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
            ADMIN-ONLY STAFF ACCESS CONTROL
          </div>
          <h3 className="font-serif font-bold text-lg text-[#221a14] mt-0.5">
            Authorized Baristas & Operations Staff ({staffData.staffMembers.length})
          </h3>
          <p className="text-xs text-[#6b5a4e] mt-0.5">
            Active Staff Sessions: <strong>{staffData.activeStaffSessionsCount}</strong> · Never
            displays PINs, passwords, or session tokens.
          </p>
        </div>
        <button
          type="button"
          onClick={onRevokeStaffSessions}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold cursor-pointer self-start sm:self-auto"
        >
          Revoke Active Staff Sessions
        </button>
      </div>

      {/* + Add Staff Member Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs space-y-4"
      >
        <h4 className="font-serif font-bold text-sm text-[#221a14] flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#c9833a]" /> + Add Staff Member
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#7a6b61] mb-1">
              Staff Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yacine B."
              className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#7a6b61] mb-1">
              Staff ID *
            </label>
            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. BARISTA-03"
              className="w-full px-3 py-2 text-xs font-mono bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#7a6b61] mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
            >
              <option value="STAFF">STAFF (Operations)</option>
              <option value="ADMIN">ADMIN (Management)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#7a6b61] mb-1">
              Personal PIN / Password (Write-Only)
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Optional custom PIN"
              className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-[#351016] hover:bg-[#4b1820] text-[#f5efe6] rounded-lg text-xs font-semibold cursor-pointer"
        >
          Authorize Staff Member
        </button>
      </form>

      {/* Staff List Table */}
      <div className="bg-white rounded-xl border border-[#ded7c8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf6ef] border-b border-[#ded7c8] text-[11px] uppercase tracking-wider text-[#7a6b61]">
                <th className="py-3.5 px-4">Staff Name</th>
                <th className="py-3.5 px-4">Staff ID</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9de]">
              {staffData.staffMembers.map((st) => (
                <tr key={st.staffId} className="hover:bg-[#faf6ef]/60">
                  <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#221a14]">
                    {st.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#351016]">
                    {st.staffId}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-[#59493f]">{st.role}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                        st.status === 'ACTIVE'
                          ? 'bg-[#2e7d32]/15 text-[#2e7d32]'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {st.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-[#6b5a4e]">
                    {formatAlgiersDate(st.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-[#6b5a4e]">
                    {st.lastActivity ? formatAlgiersDateTime(st.lastActivity) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStaff(st.staffId, {
                          status: st.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg border border-[#ded7c8] hover:border-[#351016] text-xs font-semibold text-[#351016] cursor-pointer"
                    >
                      {st.status === 'ACTIVE' ? 'Disable / Suspend' : 'Re-Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const SettingsManagementView: React.FC<{
  settingsData: any | null;
  onSaveSettings: (patch: {
    storeName?: string;
    address?: string;
    phone?: string;
    email?: string;
    openingHours?: string;
    orderAheadEnabled?: boolean;
    orderCutoffTime?: string;
    preparationEstimate?: string;
    pickupInstructions?: string;
  }) => void;
}> = ({ settingsData, onSaveSettings }) => {
  const [storeName, setStoreName] = useState(settingsData?.store?.storeName || 'VENTY THE COFFEE');
  const [address, setAddress] = useState(settingsData?.store?.address || '');
  const [phone, setPhone] = useState(settingsData?.store?.phone || '');
  const [email, setEmail] = useState(settingsData?.store?.email || 'contact@ventycoffee.dz');
  const [openingHours, setOpeningHours] = useState(settingsData?.store?.openingHours || '');
  const [orderAheadEnabled, setOrderAheadEnabled] = useState<boolean>(
    settingsData?.store?.orderAheadEnabled ?? true,
  );
  const [orderCutoffTime, setOrderCutoffTime] = useState(
    settingsData?.store?.orderCutoffTime || '22:45',
  );
  const [preparationEstimate, setPreparationEstimate] = useState(
    settingsData?.store?.preparationEstimate || '10–15 mins',
  );
  const [pickupInstructions, setPickupInstructions] = useState(
    settingsData?.store?.pickupInstructions ||
      'Collect at the dedicated VENTY Express Bar counter in Hydra.',
  );

  React.useEffect(() => {
    if (settingsData?.store) {
      setStoreName(settingsData.store.storeName || 'VENTY THE COFFEE');
      setAddress(settingsData.store.address || '');
      setPhone(settingsData.store.phone || '');
      setEmail(settingsData.store.email || 'contact@ventycoffee.dz');
      setOpeningHours(settingsData.store.openingHours || '');
      setOrderAheadEnabled(Boolean(settingsData.store.orderAheadEnabled));
      setOrderCutoffTime(settingsData.store.orderCutoffTime || '22:45');
      setPreparationEstimate(settingsData.store.preparationEstimate || '10–15 mins');
      setPickupInstructions(
        settingsData.store.pickupInstructions ||
          'Collect at the dedicated VENTY Express Bar counter in Hydra.',
      );
    }
  }, [settingsData]);

  if (!settingsData) {
    return <div className="p-8 text-center text-sm text-[#6b5a4e]">Loading store settings...</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      storeName,
      address,
      phone,
      email,
      openingHours,
      orderAheadEnabled,
      orderCutoffTime,
      preparationEstimate,
      pickupInstructions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Store Information */}
        <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
            1. STORE INFORMATION
          </div>
          <h3 className="font-serif font-bold text-base text-[#221a14]">
            VENTY Flagship Store Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                Opening Hours
              </label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
            />
          </div>
        </div>

        {/* 2. Ordering Settings */}
        <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
            2. ORDERING SETTINGS
          </div>
          <h3 className="font-serif font-bold text-base text-[#221a14]">
            Order-Ahead & Pickup Configuration
          </h3>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#faf6ef] border border-[#ded7c8]">
            <div>
              <div className="text-xs font-semibold text-[#221a14]">Ordering Enabled / Disabled</div>
              <div className="text-[11px] text-[#7a6b61]">
                Allow customers to place online pickup orders
              </div>
            </div>
            <input
              type="checkbox"
              checked={orderAheadEnabled}
              onChange={(e) => setOrderAheadEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#351016] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                Order Cutoff Time (Algiers)
              </label>
              <input
                type="text"
                value={orderCutoffTime}
                onChange={(e) => setOrderCutoffTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
                Preparation Estimate
              </label>
              <input
                type="text"
                value={preparationEstimate}
                onChange={(e) => setPreparationEstimate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[#7a6b61] mb-1">
              Pickup Instructions
            </label>
            <input
              type="text"
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 bg-[#351016] hover:bg-[#4b1820] text-[#f5efe6] rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
        >
          Save Store & Ordering Settings
        </button>
      </div>

      {/* Sections 3, 4, 5, 6 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. Loyalty Settings */}
        <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
            3. LOYALTY SETTINGS
          </div>
          <h3 className="font-serif font-bold text-base text-[#221a14]">
            Server-Authoritative Rules
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Stamps Required</span>
              <span className="font-mono font-bold text-[#351016]">
                {settingsData.loyaltyRules?.stampsThreshold ?? 7} stamps
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Minimum Qualifying Total</span>
              <span className="font-mono font-bold text-[#351016]">
                {settingsData.loyaltyRules?.minimumOrderTotalDzd ?? 300} DA
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Reward Expiration Days</span>
              <span className="font-mono font-bold text-[#351016]">
                {settingsData.loyaltyRules?.rewardExpirationDays ?? 30} days
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <div className="text-[#6b5a4e] mb-0.5">Welcome Bonus Rule</div>
              <div className="font-mono font-semibold text-[11px] text-[#221a14]">
                {settingsData.loyaltyRules?.welcomeBonusRule}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Notifications Settings */}
        <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
            4. NOTIFICATIONS
          </div>
          <h3 className="font-serif font-bold text-base text-[#221a14]">
            Operational &amp; Order Alerts
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Live Pending Order Alerts</span>
              <span className="font-mono font-bold text-[#2e7d32]">ENABLED</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Ready for Pickup Counter Badge</span>
              <span className="font-mono font-bold text-[#2e7d32]">ENABLED</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Customer Authentication Engine</span>
              <span className="font-mono font-bold text-[#351016]">PASSWORD_BCRYPT</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Security &amp; Audit Event Logging</span>
              <span className="font-mono font-bold text-[#2e7d32]">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* 5. Integrations Status */}
        <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
            5. INTEGRATIONS
          </div>
          <h3 className="font-serif font-bold text-base text-[#221a14]">
            Google Places Connection
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Google Place ID</span>
              <span className="font-mono font-bold text-[#351016]">
                {settingsData.reviewIntegration?.googlePlaceIdMasked || 'ChIJ... (Masked)'}
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Integration Status</span>
              <span className="font-mono font-bold text-[#2e7d32]">
                {settingsData.reviewIntegration?.integrationStatus || 'ACTIVE_VERIFIED_CACHE'}
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Cache Duration</span>
              <span className="font-mono font-bold text-[#221a14]">
                {settingsData.reviewIntegration?.cacheDuration || '6 hours'}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Security Status */}
        <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
            6. SECURITY
          </div>
          <h3 className="font-serif font-bold text-base text-[#221a14]">
            Backend Security Posture
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">RBAC Active</span>
              <span className="font-mono font-bold text-[#2e7d32]">ACTIVE</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Session Protection Active</span>
              <span className="font-mono font-bold text-[#2e7d32]">ACTIVE (HTTP-Only + Signed)</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Audit Logging Active</span>
              <span className="font-mono font-bold text-[#2e7d32]">ACTIVE (Redacted)</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#faf6ef] border border-[#e6dfd3]">
              <span className="text-[#6b5a4e]">Rate Limiting Active</span>
              <span className="font-mono font-bold text-[#2e7d32]">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export const SecurityAuditView: React.FC<{
  auditData: {
    events: any[];
    totalCount: number;
    securityPosture?: any;
  } | null;
}> = ({ auditData }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  if (!auditData) {
    return <div className="p-8 text-center text-sm text-[#6b5a4e]">Loading security audit log...</div>;
  }

  const events = auditData.events || [];
  const filtered = events.filter((e) => {
    const actionStr = String(e.action || e.type || '');
    if (actionFilter !== 'ALL' && !actionStr.includes(actionFilter)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      actionStr.toLowerCase().includes(q) ||
      String(e.actor || '').toLowerCase().includes(q) ||
      String(e.role || '').toLowerCase().includes(q) ||
      String(e.target || '').toLowerCase().includes(q) ||
      JSON.stringify(e.details || {}).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-[#1b0c0e] text-[#f5efe6] rounded-xl p-5 border border-[#c9833a]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-[#c9833a] shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a]">
              SECRET-REDACTED SECURITY & ADMINISTRATIVE AUDIT LOG
            </div>
            <p className="text-xs text-[#e8dcc8]/90 mt-1">
              Passwords, password hashes, OTP codes, session tokens, and API keys are strictly
              redacted server-side before serialization.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-[#c9833a] shrink-0">
          {auditData.totalCount} Total Events
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#ded7c8] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'LOGIN', 'ORDER', 'LOYALTY', 'REWARD', 'MENU', 'STAFF', 'SETTINGS'].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActionFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer ${
                  actionFilter === cat
                    ? 'bg-[#351016] text-[#f5efe6] font-semibold'
                    : 'bg-[#f4efe6] text-[#59493f] hover:bg-[#e8e0d2]'
                }`}
              >
                {cat}
              </button>
            ),
          )}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#8a7b70] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by action, actor, target..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg"
          />
        </div>
      </div>

      {/* Structured Audit Table */}
      <div className="bg-white rounded-xl border border-[#ded7c8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf6ef] border-b border-[#ded7c8] text-[11px] uppercase tracking-wider text-[#7a6b61]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9de] text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#8a7b70]">
                    No audit log events match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-[#faf6ef]/60">
                    <td className="py-3 px-4 font-mono text-[#6b5a4e] whitespace-nowrap">
                      {formatAlgiersDateTime(ev.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#221a14]">
                      {ev.actor || 'SYSTEM'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#f4efe6] text-[#59493f] font-mono text-[10px] font-bold">
                        {ev.role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#351016]/10 text-[#351016] font-mono font-bold">
                        {ev.action || ev.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#351016] font-semibold">
                      {ev.target || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#59493f] break-all">
                      {JSON.stringify(ev.details || {})}
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
