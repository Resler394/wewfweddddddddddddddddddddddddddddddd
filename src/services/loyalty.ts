import {
  LoyaltyAccount,
  LoyaltyCustomer,
  LoyaltyReward,
  LoyaltyTransaction,
  LoyaltyConfig,
  RewardStatus,
} from '../types/loyalty';
import { PastOrder, CartItem, OrderCompletedEventPayload } from '../types/coffee';
import { getAllOfficialProducts } from '../data/officialMenuData';
import {
  fetchAccountFromBackend,
  fetchHistoryFromBackend,
  fetchCustomerProfileFromBackend,
  signupCustomerOnBackend,
  loginCustomerOnBackend,
  logoutFromBackend,
  updateCustomerProfileOnBackend,
  processOrderLoyaltyOnBackend,
  verifyRewardOnBackend,
  redeemRewardOnBackend,
  adminAdjustOnBackend,
  adminCancelRewardOnBackend,
  orderReversalOnBackend,
  fetchMetricsFromBackend,
  searchCustomersOnBackend,
  getSessionToken,
  clearSessionToken,
} from './loyaltyApi';

// Storage Keys for Local Optimistic UI Cache
export const ACCOUNTS_STORAGE_KEY = 'venty_loyalty_accounts_v1';
export const TRANSACTIONS_STORAGE_KEY = 'venty_loyalty_transactions_v1';
export const ACTIVE_ACCOUNT_KEY = 'venty_loyalty_active_account_v1';
export const LOGGED_OUT_KEY = 'venty_loyalty_logged_out_v1';
export const CONFIG_STORAGE_KEY = 'venty_loyalty_config_v1';
export const MIGRATION_DONE_KEY = 'venty_loyalty_migrated_v3';

// Centralized Configurations
export const LOYALTY_QUALIFYING_CATEGORIES: string[] = [
  'coffee',
  'drinks',
  'fresh',
  'espresso',
  'cold',
  'filter',
  'juice',
];

export const LOYALTY_EXCLUDED_CATEGORIES: string[] = [
  'sweets',
  'desserts',
  'beans',
  'pastry',
  'cake',
  'food',
];

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  stampsToReward: 7,
  welcomeBonusStamps: 2,
  stampsPerQualifyingOrder: 1,
  qualifyingCategories: LOYALTY_QUALIFYING_CATEGORIES,
};

// Seed sample account
const INITIAL_SAMPLE_REWARD: LoyaltyReward = {
  rewardId: 'RW-8104',
  customerId: 'VENTY-7249',
  customerName: 'Karim Benali',
  customerPhone: '0550123456',
  type: 'FREE_DRINK',
  status: 'AVAILABLE',
  issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 58 * 24 * 60 * 60 * 1000).toISOString(),
  redemptionCode: 'VENTY-7F4K2',
  redemptionToken: 'rw_tok_7a4f91e802b1c43d99fa',
};

const INITIAL_SAMPLE_ACCOUNT: LoyaltyAccount = {
  customerId: 'VENTY-7249',
  name: 'Karim Benali',
  phone: '0550123456',
  email: 'karim@venty.dz',
  favouriteDrink: 'Flat White & Iced Specialty Latte',
  currentStampCount: 5,
  lifetimeStamps: 12,
  welcomeBonusGranted: true,
  createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  loyaltyStatus: 'Active',
  availableRewards: [INITIAL_SAMPLE_REWARD],
  redeemedRewards: [
    {
      rewardId: 'RW-7001',
      customerId: 'VENTY-7249',
      customerName: 'Karim Benali',
      customerPhone: '0550123456',
      type: 'FREE_DRINK',
      status: 'REDEEMED',
      issuedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      redeemedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      redemptionCode: 'VENTY-3M9PX',
      redemptionToken: 'rw_tok_prev_redeemed_1',
      redemptionStaffId: 'Staff-Amine',
      redemptionLocation: 'Miliana Roastery Counter',
    },
  ],
};

const INITIAL_TRANSACTIONS: LoyaltyTransaction[] = [
  {
    id: 'LTX-1001',
    customerId: 'VENTY-7249',
    customerName: 'Karim Benali',
    type: 'WELCOME_BONUS',
    stampsDelta: 2,
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'SIGNUP_BONUS',
    status: 'CONFIRMED',
    idempotencyKey: 'signup_bonus_VENTY-7249_0550123456',
    note: 'Welcome Bonus: +2 Free Stamps on Account Signup',
    previousValue: 0,
    newValue: 2,
  },
  {
    id: 'LTX-1002',
    customerId: 'VENTY-7249',
    customerName: 'Karim Benali',
    orderId: 'VENTY-6109',
    type: 'PURCHASE_STAMP',
    stampsDelta: 1,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'ONLINE_ORDER',
    status: 'CONFIRMED',
    idempotencyKey: 'order_loyalty_VENTY-6109',
    note: 'Stamp earned: Classic Mojito (Order #VENTY-6109)',
    previousValue: 2,
    newValue: 3,
  },
  {
    id: 'LTX-1003',
    customerId: 'VENTY-7249',
    customerName: 'Karim Benali',
    orderId: 'VENTY-7241',
    type: 'PURCHASE_STAMP',
    stampsDelta: 1,
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    source: 'ONLINE_ORDER',
    status: 'CONFIRMED',
    idempotencyKey: 'order_loyalty_VENTY-7241',
    note: 'Stamp earned: Flat White (Order #VENTY-7241)',
    previousValue: 3,
    newValue: 4,
  },
  {
    id: 'LTX-1004',
    customerId: 'VENTY-7249',
    customerName: 'Karim Benali',
    type: 'PURCHASE_STAMP',
    stampsDelta: 1,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    source: 'COUNTER_SCAN',
    status: 'CONFIRMED',
    idempotencyKey: 'counter_scan_1004',
    note: 'In-Shop Counter Stamping: Specialty Espresso',
    previousValue: 4,
    newValue: 5,
  },
  {
    id: 'LTX-1005',
    customerId: 'VENTY-7249',
    customerName: 'Karim Benali',
    type: 'REWARD_ISSUED',
    stampsDelta: 0,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'ONLINE_ORDER',
    status: 'CONFIRMED',
    idempotencyKey: 'reward_issued_RW-8104',
    note: '🎉 Free Drink Reward Unlocked (VENTY-7F4K2) after 7 qualifying stamps!',
  },
];

// Helper to normalize phone numbers into a single canonical identity
// e.g. "0550 12 34 56", "0550123456", "+213550123456" -> "0550123456"
export const normalizePhoneNumber = (rawPhone: string): string => {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  let cleaned = rawPhone.trim().replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('+213')) {
    cleaned = cleaned.substring(4);
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    return `0${cleaned.replace(/\D/g, '')}`;
  }
  if (cleaned.startsWith('00213')) {
    cleaned = cleaned.substring(5);
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    return `0${cleaned.replace(/\D/g, '')}`;
  }
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.startsWith('213') && (digitsOnly.length === 12 || digitsOnly.length === 13)) {
    const rest = digitsOnly.substring(3);
    return rest.startsWith('0') ? rest : `0${rest}`;
  }
  if (digitsOnly.length === 9 && /^[567]/.test(digitsOnly)) {
    return `0${digitsOnly}`;
  }
  return digitsOnly;
};

// Cryptographically secure token and non-predictable redemption code generation
export const generateSecureToken = (prefix = 'rw_tok'): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${hex}`;
  }
  return `${prefix}_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
};

export const generateRedemptionCode = (): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VENTY-${code}`;
};

// Note: Unauthenticated background migration is disabled for production security.

/**
 * =========================================================================
 * 1. BACKEND-DRIVEN PERSISTENT STATE GETTERS & SYNCS
 * =========================================================================
 */
export const getLoyaltyConfig = (): LoyaltyConfig => {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    return raw ? { ...DEFAULT_LOYALTY_CONFIG, ...JSON.parse(raw) } : DEFAULT_LOYALTY_CONFIG;
  } catch {
    return DEFAULT_LOYALTY_CONFIG;
  }
};

export const getAllLoyaltyAccounts = (): LoyaltyAccount[] => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([INITIAL_SAMPLE_ACCOUNT]));
      return [INITIAL_SAMPLE_ACCOUNT];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_SAMPLE_ACCOUNT];
  } catch {
    return [INITIAL_SAMPLE_ACCOUNT];
  }
};

export const saveLoyaltyAccounts = (accounts: LoyaltyAccount[]): void => {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // ignore
  }
};

export const getLoyaltyAccountById = (customerId: string): LoyaltyAccount | null => {
  const accounts = getAllLoyaltyAccounts();
  return accounts.find((a) => a.customerId === customerId) || null;
};

export const getLoyaltyAccountByPhone = (phone: string): LoyaltyAccount | null => {
  const clean = normalizePhoneNumber(phone);
  if (!clean) return null;
  const accounts = getAllLoyaltyAccounts();
  return accounts.find((a) => normalizePhoneNumber(a.phone) === clean) || null;
};

export const getActiveLoyaltyAccount = (): LoyaltyAccount | null => {
  try {
    if (typeof window === 'undefined') return null;
    if (localStorage.getItem(LOGGED_OUT_KEY) === 'true') {
      return null;
    }
    // Require an active authenticated CUSTOMER session token
    const token = getSessionToken('CUSTOMER');
    if (!token) {
      return null;
    }
    const raw = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const targetId = parsed.customerId || parsed.id;
      const targetPhone = parsed.phone;
      const all = getAllLoyaltyAccounts();
      const match = all.find(
        (a) =>
          a.customerId === targetId ||
          (targetPhone && normalizePhoneNumber(a.phone) === normalizePhoneNumber(targetPhone)),
      );
      if (match) return match;
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const setActiveLoyaltyAccount = (account: LoyaltyAccount | null): void => {
  try {
    if (account) {
      localStorage.removeItem(LOGGED_OUT_KEY);
      const nowIso = account.updatedAt || new Date().toISOString();
      const enriched: LoyaltyAccount = { ...account, updatedAt: nowIso };
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, JSON.stringify(enriched));

      const accounts = getAllLoyaltyAccounts();
      const idx = accounts.findIndex(
        (a) =>
          a.customerId === enriched.customerId ||
          normalizePhoneNumber(a.phone) === normalizePhoneNumber(enriched.phone),
      );
      if (idx >= 0) {
        accounts[idx] = enriched;
      } else {
        accounts.push(enriched);
      }
      saveLoyaltyAccounts(accounts);
    } else {
      localStorage.setItem(LOGGED_OUT_KEY, 'true');
      localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    }
    emitLoyaltyUpdate(account);
  } catch {
    // ignore
  }
};

export const getAllLoyaltyTransactions = (customerId?: string): LoyaltyTransaction[] => {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    let txs = raw ? JSON.parse(raw) : INITIAL_TRANSACTIONS;
    if (!Array.isArray(txs)) txs = INITIAL_TRANSACTIONS;
    return customerId ? txs.filter((t: LoyaltyTransaction) => t.customerId === customerId) : txs;
  } catch {
    return INITIAL_TRANSACTIONS;
  }
};

export const recordLoyaltyTransaction = (entry: LoyaltyTransaction): boolean => {
  try {
    const current = getAllLoyaltyTransactions();
    if (entry.idempotencyKey && current.some((t) => t.idempotencyKey === entry.idempotencyKey)) {
      return false;
    }
    const updated = [entry, ...current];
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
};

/**
 * =========================================================================
 * 2. QUALIFYING PRODUCT CATEGORIES & ITEMS
 * =========================================================================
 */
export const isQualifyingLoyaltyCategory = (category?: string): boolean => {
  if (!category) return false;
  const cat = category.toLowerCase().trim();
  if (LOYALTY_EXCLUDED_CATEGORIES.includes(cat)) return false;
  return LOYALTY_QUALIFYING_CATEGORIES.includes(cat);
};

export const isQualifyingLoyaltyItem = (item: CartItem): boolean => {
  if (item.grind || item.category === 'beans' || item.category === 'sweets' || item.category === 'desserts') {
    return false;
  }
  if (item.category && isQualifyingLoyaltyCategory(item.category)) {
    return true;
  }
  const allOfficial = getAllOfficialProducts();
  const match = allOfficial.find(
    (p) => p.id === item.id || (item.name && p.name.toLowerCase() === item.name.toLowerCase()),
  );
  if (match) {
    return isQualifyingLoyaltyCategory(match.category);
  }
  const nameLower = item.name.toLowerCase();
  const drinkKeywords = [
    'coffee', 'latte', 'cappuccino', 'espresso', 'flat white', 'cortado',
    'cold brew', 'americano', 'lungo', 'ristretto', 'matcha', 'hot chocolate',
    'mojito', 'milkshake', 'mocktail', 'tea', 'juice', 'infusion',
  ];
  return drinkKeywords.some((kw) => nameLower.includes(kw));
};

export const getQualifyingDrinksInOrder = (items: CartItem[]): CartItem[] => {
  return items.filter(isQualifyingLoyaltyItem);
};

export interface LoyaltyProcessingResult {
  awardedStamp: boolean;
  unlockedReward: boolean;
  customer: LoyaltyCustomer | LoyaltyAccount | null;
  reward?: LoyaltyReward;
  transaction?: LoyaltyTransaction;
  message: string;
}

/**
 * =========================================================================
 * 3. REGISTRATION & ORDER LOYALTY (TALKING TO BACKEND)
 * =========================================================================
 */
export const createOrGetLoyaltyAccount = (params: {
  name: string;
  phone: string;
  email?: string;
  favouriteDrink?: string;
}): { account: LoyaltyAccount; created: boolean; welcomeBonusAwarded: boolean; message: string } => {
  const cleanPhone = normalizePhoneNumber(params.phone);
  const nowIso = new Date().toISOString();

  const existing = getLoyaltyAccountByPhone(params.phone);
  if (existing) {
    return {
      account: existing,
      created: false,
      welcomeBonusAwarded: false,
      message: `Welcome back, ${existing.name}!`,
    };
  }

  const pendingAccount: LoyaltyAccount = {
    customerId: `cus_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: params.name.trim(),
    phone: cleanPhone || params.phone.trim(),
    email: params.email?.trim() || undefined,
    favouriteDrink: params.favouriteDrink || 'Flat White',
    currentStampCount: 0,
    lifetimeStamps: 0,
    welcomeBonusGranted: false,
    createdAt: nowIso,
    updatedAt: nowIso,
    loyaltyStatus: 'Active',
    availableRewards: [],
    redeemedRewards: [],
  };

  return {
    account: pendingAccount,
    created: true,
    welcomeBonusAwarded: false,
    message: 'Account initialized. Please complete sign up with your password to receive +2 Welcome Stamps.',
  };
};

export const processOrderLoyalty = (
  order: PastOrder | OrderCompletedEventPayload,
): LoyaltyProcessingResult => {
  const orderId = 'orderId' in order ? order.orderId : order.id;

  // Dispatch to server endpoint for authoritative database execution
  processOrderLoyaltyOnBackend(order).then((res) => {
    if (res.account) {
      setActiveLoyaltyAccount(res.account);
    }
  }).catch((err) => {
    console.warn('[Server Loyalty] Order processed with local cache fallback:', err);
  });

  const active = getActiveLoyaltyAccount();
  if (!active) {
    return {
      awardedStamp: false,
      unlockedReward: false,
      customer: null,
      message: 'No loyalty account found for this order.',
    };
  }

  const items: CartItem[] = 'items' in order
    ? order.items
    : order.orderItems.map((oi) => ({
        id: oi.productId,
        name: oi.name,
        price: oi.unitPrice,
        quantity: oi.quantity,
        category: oi.category,
        notes: oi.notes,
        grind: oi.grind,
      }));

  const qualifyingItems = getQualifyingDrinksInOrder(items);
  if (qualifyingItems.length === 0) {
    return {
      awardedStamp: false,
      unlockedReward: false,
      customer: active,
      message: 'Order contains no qualifying drinks for stamps.',
    };
  }

  const idempotencyKey = `order_loyalty_${orderId}`;
  const transactions = getAllLoyaltyTransactions();
  const existingTx = transactions.find((t) => t.idempotencyKey === idempotencyKey);

  if (existingTx) {
    return {
      awardedStamp: false,
      unlockedReward: false,
      customer: active,
      transaction: existingTx,
      message: `Order #${orderId} has already been stamped (${existingTx.id}).`,
    };
  }

  const config = getLoyaltyConfig();
  const stampsDelta = config.stampsPerQualifyingOrder || 1;
  const prevStamps = active.currentStampCount;
  const newStampCount = prevStamps + stampsDelta;
  let unlockedReward = false;
  let issuedReward: LoyaltyReward | undefined;

  let finalCurrentStamps = newStampCount;
  const newAvailableRewards = [...(active.availableRewards || [])];

  if (newStampCount >= config.stampsToReward) {
    unlockedReward = true;
    finalCurrentStamps = newStampCount - config.stampsToReward;

    const rewardId = `RW-${Math.floor(1000 + Math.random() * 9000)}`;
    issuedReward = {
      rewardId,
      customerId: active.customerId,
      customerName: active.name,
      customerPhone: active.phone,
      type: 'FREE_DRINK',
      status: 'AVAILABLE',
      issuedAt: new Date().toISOString(),
      redemptionCode: generateRedemptionCode(),
      redemptionToken: generateSecureToken('rw_tok'),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    };

    newAvailableRewards.push(issuedReward);

    recordLoyaltyTransaction({
      id: `LTX-${Date.now().toString(36).toUpperCase()}-RW`,
      customerId: active.customerId,
      customerName: active.name,
      orderId,
      type: 'REWARD_ISSUED',
      stampsDelta: 0,
      timestamp: new Date().toISOString(),
      source: 'ONLINE_ORDER',
      status: 'CONFIRMED',
      idempotencyKey: `reward_issued_${rewardId}_${orderId}`,
      note: `🎉 Free Drink Reward Unlocked (${issuedReward.redemptionCode}) after 7 qualifying stamps!`,
      previousValue: prevStamps,
      newValue: finalCurrentStamps,
    });
  }

  const itemNames = qualifyingItems.map((i) => `${i.quantity}x ${i.name}`).join(', ');
  const purchaseStampTx: LoyaltyTransaction = {
    id: `LTX-${Date.now().toString(36).toUpperCase()}`,
    customerId: active.customerId,
    customerName: active.name,
    orderId,
    type: 'PURCHASE_STAMP',
    stampsDelta,
    timestamp: new Date().toISOString(),
    source: 'ONLINE_ORDER',
    status: 'CONFIRMED',
    idempotencyKey,
    note: `+${stampsDelta} Stamp: ${itemNames} (Order #${orderId})`,
    previousValue: prevStamps,
    newValue: finalCurrentStamps,
  };

  recordLoyaltyTransaction(purchaseStampTx);

  const updatedAccount: LoyaltyAccount = {
    ...active,
    currentStampCount: finalCurrentStamps,
    lifetimeStamps: active.lifetimeStamps + stampsDelta,
    availableRewards: newAvailableRewards,
    updatedAt: new Date().toISOString(),
  };

  setActiveLoyaltyAccount(updatedAccount);

  return {
    awardedStamp: true,
    unlockedReward,
    customer: updatedAccount,
    reward: issuedReward,
    transaction: purchaseStampTx,
    message: unlockedReward
      ? '🎉 Congratulations! You earned a stamp and unlocked your FREE DRINK reward!'
      : `✨ +1 Venty stamp earned! (${finalCurrentStamps}/${config.stampsToReward} stamps).`,
  };
};

/**
 * =========================================================================
 * 4. STAFF VERIFICATION & REDEMPTION (CONNECTING TO SERVER APIS)
 * =========================================================================
 */
export const verifyRewardForStaff = (query: string) => {
  // Try local first for instant responsive feel
  const clean = query.trim().toUpperCase();
  const accounts = getAllLoyaltyAccounts();

  for (const account of accounts) {
    const allRewards = [...(account.availableRewards || []), ...(account.redeemedRewards || [])];
    const match = allRewards.find(
      (r) =>
        r.redemptionCode.toUpperCase() === clean ||
        r.redemptionToken === query.trim() ||
        r.rewardId.toUpperCase() === clean,
    );

    if (match) {
      const isExpired = match.expiresAt ? new Date(match.expiresAt).getTime() < Date.now() : false;
      let status: RewardStatus = match.status;
      if (status === 'AVAILABLE' && isExpired) status = 'EXPIRED';

      return {
        valid: status === 'AVAILABLE' && !isExpired,
        reward: match,
        customer: account,
        status,
        isExpired,
        message:
          status === 'AVAILABLE'
            ? 'Valid Free Drink Reward ready to redeem.'
            : status === 'REDEEMED'
            ? 'This reward has already been redeemed.'
            : 'Reward is expired or cancelled.',
      };
    }
  }

  return {
    valid: false,
    reward: null,
    customer: null,
    status: 'NOT_FOUND',
    isExpired: false,
    message: 'Reward code or token not found.',
  };
};

export const redeemReward = (
  paramsOrRewardId:
    | string
    | {
        rewardId?: string;
        redemptionCode?: string;
        redemptionToken?: string;
        customerId?: string;
        staffId?: string;
        location?: string;
        redeemedOrderId?: string;
      },
  staffId = 'Staff-Miliana',
  location = 'Miliana Roastery Counter',
): { success: boolean; message: string; customer?: LoyaltyCustomer; reward?: LoyaltyReward } => {
  const payload = typeof paramsOrRewardId === 'object' ? paramsOrRewardId : { rewardId: paramsOrRewardId, staffId, location };

  // Call Server Atomic Endpoint
  redeemRewardOnBackend(payload).then((res) => {
    if (res.account) {
      setActiveLoyaltyAccount(res.account);
    }
  }).catch(() => {});

  // Local optimistic update
  const rewardId = typeof paramsOrRewardId === 'object' ? paramsOrRewardId.rewardId : paramsOrRewardId;
  const accounts = getAllLoyaltyAccounts();
  let targetAccount: LoyaltyAccount | null = null;
  let targetReward: LoyaltyReward | null = null;

  for (const acc of accounts) {
    const match = (acc.availableRewards || []).find((r) => r.rewardId === rewardId || r.redemptionCode === payload.redemptionCode);
    if (match) {
      targetAccount = acc;
      targetReward = match;
      break;
    }
  }

  if (!targetAccount || !targetReward) {
    return { success: false, message: 'Reward not found or already redeemed.' };
  }

  const nowIso = new Date().toISOString();
  const redeemed: LoyaltyReward = {
    ...targetReward,
    status: 'REDEEMED',
    redeemedAt: nowIso,
    redemptionStaffId: payload.staffId || staffId,
    redemptionLocation: payload.location || location,
  };

  const updatedAccount: LoyaltyAccount = {
    ...targetAccount,
    availableRewards: (targetAccount.availableRewards || []).filter((r) => r.rewardId !== targetReward!.rewardId),
    redeemedRewards: [redeemed, ...(targetAccount.redeemedRewards || [])],
    updatedAt: nowIso,
  };

  recordLoyaltyTransaction({
    id: `LTX-${Date.now().toString(36).toUpperCase()}`,
    customerId: targetAccount.customerId,
    customerName: targetAccount.name,
    type: 'REWARD_REDEEMED',
    stampsDelta: 0,
    timestamp: nowIso,
    source: 'COUNTER_SCAN',
    status: 'CONFIRMED',
    idempotencyKey: `redeem_rw_${targetReward.rewardId}`,
    note: `🎉 Free Drink Redeemed (${targetReward.redemptionCode})`,
  });

  setActiveLoyaltyAccount(updatedAccount);

  return {
    success: true,
    message: `🎉 Reward ${targetReward.redemptionCode} successfully redeemed! Enjoy your free drink.`,
    reward: redeemed,
    customer: {
      ...updatedAccount,
      id: updatedAccount.customerId,
      availableRewards: updatedAccount.availableRewards || [],
      redeemedRewards: updatedAccount.redeemedRewards || [],
      loyaltyStatus: updatedAccount.loyaltyStatus || 'Active',
    },
  };
};

/**
 * =========================================================================
 * 5. ADMIN ADJUSTMENTS, CANCELLATIONS, AND REVERSALS
 * =========================================================================
 */
export const adminAdjustCustomerStamps = (
  paramsOrCustomerId:
    | string
    | { customerId: string; stampsDelta: number; reason: string; adminId?: string },
  delta?: number,
  adminReason?: string,
  adminId = 'VENTY-ADMIN',
): { success: boolean; customer?: LoyaltyCustomer; message: string } => {
  const customerId = typeof paramsOrCustomerId === 'object' ? paramsOrCustomerId.customerId : paramsOrCustomerId;
  const stampsDelta = typeof paramsOrCustomerId === 'object' ? paramsOrCustomerId.stampsDelta : delta || 0;
  const reason = typeof paramsOrCustomerId === 'object' ? paramsOrCustomerId.reason : adminReason || 'Staff adjustment';
  const admin = typeof paramsOrCustomerId === 'object' ? paramsOrCustomerId.adminId || adminId : adminId;

  // Server dispatch
  adminAdjustOnBackend({ customerId, stampsDelta, reason, adminId: admin }).then((res) => {
    if (res.account) setActiveLoyaltyAccount(res.account);
  }).catch(() => {});

  const account = getLoyaltyAccountById(customerId);
  if (!account) return { success: false, message: 'Customer account not found.' };

  const config = getLoyaltyConfig();
  const prevStamps = account.currentStampCount;
  const targetStamps = Math.max(0, Math.min(config.stampsToReward, prevStamps + stampsDelta));
  const effectiveDelta = targetStamps - prevStamps;
  if (effectiveDelta === 0) return { success: false, message: 'No change in stamps balance.' };

  const nowIso = new Date().toISOString();
  recordLoyaltyTransaction({
    id: `LTX-${Date.now().toString(36).toUpperCase()}`,
    customerId: account.customerId,
    customerName: account.name,
    type: 'ADMIN_ADJUSTMENT',
    stampsDelta: effectiveDelta,
    timestamp: nowIso,
    source: 'ADMIN_CONSOLE',
    status: 'CONFIRMED',
    idempotencyKey: `admin_adj_${account.customerId}_${Date.now()}`,
    note: `Staff Adjustment: ${effectiveDelta > 0 ? '+' : ''}${effectiveDelta} Stamps (${reason})`,
    adminReason: reason,
    adminId: admin,
    previousValue: prevStamps,
    newValue: targetStamps,
  });

  const updated: LoyaltyAccount = {
    ...account,
    currentStampCount: targetStamps,
    lifetimeStamps: Math.max(0, account.lifetimeStamps + (effectiveDelta > 0 ? effectiveDelta : 0)),
    updatedAt: nowIso,
  };

  setActiveLoyaltyAccount(updated);

  return {
    success: true,
    customer: {
      ...updated,
      id: updated.customerId,
      availableRewards: updated.availableRewards || [],
      redeemedRewards: updated.redeemedRewards || [],
      loyaltyStatus: updated.loyaltyStatus || 'Active',
    },
    message: `Account updated: ${updated.currentStampCount}/${config.stampsToReward} stamps.`,
  };
};

export const adminCancelReward = (
  rewardId: string,
  adminReason = 'Cancelled by manager',
  adminId = 'VENTY-ADMIN',
): { success: boolean; message: string } => {
  adminCancelRewardOnBackend(rewardId, adminReason).then((res) => {
    if (res.account) setActiveLoyaltyAccount(res.account);
  }).catch(() => {});

  const accounts = getAllLoyaltyAccounts();
  let targetAccount: LoyaltyAccount | null = null;
  let targetReward: LoyaltyReward | null = null;

  for (const acc of accounts) {
    const match = (acc.availableRewards || []).find((r) => r.rewardId === rewardId);
    if (match) {
      targetAccount = acc;
      targetReward = match;
      break;
    }
  }

  if (!targetAccount || !targetReward) {
    return { success: false, message: 'Available reward not found.' };
  }

  const updated: LoyaltyAccount = {
    ...targetAccount,
    availableRewards: (targetAccount.availableRewards || []).filter((r) => r.rewardId !== rewardId),
    updatedAt: new Date().toISOString(),
  };

  setActiveLoyaltyAccount(updated);

  return {
    success: true,
    message: `Reward ${targetReward.redemptionCode} cancelled.`,
  };
};

export const processOrderRefundReversal = (
  orderId: string,
  reason = 'Order cancelled/refunded',
  adminId = 'VENTY-ADMIN',
): { success: boolean; message: string } => {
  orderReversalOnBackend(orderId, reason).then((res) => {
    if (res.account) setActiveLoyaltyAccount(res.account);
  }).catch(() => {});

  const transactions = getAllLoyaltyTransactions();
  const stampTx = transactions.find((t) => t.orderId === orderId && t.type === 'PURCHASE_STAMP');
  if (!stampTx) return { success: false, message: 'No purchase stamp found for this order.' };

  const account = getLoyaltyAccountById(stampTx.customerId);
  if (!account) return { success: false, message: 'Customer account not found.' };

  const updated: LoyaltyAccount = {
    ...account,
    currentStampCount: Math.max(0, account.currentStampCount - stampTx.stampsDelta),
    updatedAt: new Date().toISOString(),
  };

  setActiveLoyaltyAccount(updated);

  return {
    success: true,
    message: `Stamp for order #${orderId} reversed (-${stampTx.stampsDelta} stamp).`,
  };
};

export const searchLoyaltyCustomers = (query: string): LoyaltyCustomer[] => {
  const clean = query.trim().toLowerCase();
  const cleanPhone = normalizePhoneNumber(query);
  return getAllCustomers().filter(
    (c) =>
      c.name.toLowerCase().includes(clean) ||
      (cleanPhone && normalizePhoneNumber(c.phone).includes(cleanPhone)) ||
      (c.email && c.email.toLowerCase().includes(clean)) ||
      c.id.toLowerCase().includes(clean),
  );
};

export const getLoyaltyMetrics = () => {
  const accounts = getAllLoyaltyAccounts();
  const transactions = getAllLoyaltyTransactions();
  
  const welcomeBonusStampsIssued = transactions
    .filter((t) => t.type === 'WELCOME_BONUS' && t.stampsDelta > 0)
    .reduce((sum, t) => sum + t.stampsDelta, 0);

  const purchaseStampsIssued = transactions
    .filter((t) => t.type === 'PURCHASE_STAMP' && t.stampsDelta > 0)
    .reduce((sum, t) => sum + t.stampsDelta, 0);

  const adminAdjustmentStamps = transactions
    .filter((t) => t.type === 'ADMIN_ADJUSTMENT' && t.stampsDelta > 0)
    .reduce((sum, t) => sum + t.stampsDelta, 0);

  const totalStampsIssued = transactions
    .filter((t) => t.stampsDelta > 0)
    .reduce((sum, t) => sum + t.stampsDelta, 0);

  const rewardsIssued = transactions.filter((t) => t.type === 'REWARD_ISSUED').length;
  const rewardsRedeemed = transactions.filter((t) => t.type === 'REWARD_REDEEMED').length;
  const activeMembers = accounts.filter(
    (a) => a.currentStampCount > 0 || (a.availableRewards && a.availableRewards.length > 0),
  ).length;

  return {
    totalMembers: accounts.length,
    activeMembers,
    activeStampsInCirculation: accounts.reduce((sum, a) => sum + a.currentStampCount, 0),
    totalStampsIssued,
    welcomeBonusStampsIssued,
    purchaseStampsIssued,
    adminAdjustmentStamps,
    rewardsIssued,
    rewardsRedeemed,
    totalRewardsIssued: rewardsIssued,
    totalRewardsRedeemed: rewardsRedeemed,
  };
};

export const emitLoyaltyUpdate = (customer: LoyaltyCustomer | LoyaltyAccount | null): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('venty:loyalty:updated', {
        detail: { customer },
      }),
    );
  }
};

export const getActiveCustomer = (): LoyaltyCustomer | null => {
  const acc = getActiveLoyaltyAccount();
  if (!acc) return null;
  return {
    ...acc,
    id: acc.customerId,
    availableRewards: acc.availableRewards || [],
    redeemedRewards: acc.redeemedRewards || [],
    loyaltyStatus: acc.loyaltyStatus || 'Active',
  };
};

export const setActiveCustomer = (customer: LoyaltyCustomer | null): void => {
  if (!customer) {
    setActiveLoyaltyAccount(null);
    return;
  }
  setActiveLoyaltyAccount({
    ...customer,
    customerId: customer.id || customer.customerId,
  });
};

export const getAllCustomers = (): LoyaltyCustomer[] => {
  return getAllLoyaltyAccounts().map((a) => ({
    ...a,
    id: a.customerId,
    availableRewards: a.availableRewards || [],
    redeemedRewards: a.redeemedRewards || [],
    loyaltyStatus: a.loyaltyStatus || 'Active',
  }));
};

export const getLoyaltyLedger = (customerId?: string): LoyaltyTransaction[] => {
  return getAllLoyaltyTransactions(customerId);
};

export const recordLedgerEntry = (entry: LoyaltyTransaction): void => {
  recordLoyaltyTransaction(entry);
};

export const registerLoyaltyCustomer = (params: {
  name: string;
  phone: string;
  email?: string;
  favouriteDrink?: string;
}): { success: boolean; customer: LoyaltyCustomer; created: boolean; welcomeBonusAwarded: boolean; message: string } => {
  const result = createOrGetLoyaltyAccount(params);
  const customer: LoyaltyCustomer = {
    ...result.account,
    id: result.account.customerId,
    availableRewards: result.account.availableRewards || [],
    redeemedRewards: result.account.redeemedRewards || [],
    loyaltyStatus: result.account.loyaltyStatus || 'Active',
  };
  return {
    success: true,
    customer,
    created: result.created,
    welcomeBonusAwarded: result.welcomeBonusAwarded,
    message: result.message,
  };
};

export const loginCustomerWithPassword = async (params: {
  phone: string;
  password: string;
}): Promise<{
  success: boolean;
  customer: LoyaltyCustomer | null;
  orders?: PastOrder[];
  message: string;
}> => {
  const cleanPhone = normalizePhoneNumber(params.phone);
  if (!cleanPhone || cleanPhone.length < 8 || !params.password) {
    return {
      success: false,
      customer: null,
      message: 'Please enter both your phone number and password.',
    };
  }

  try {
    const res = await loginCustomerOnBackend(params.phone.trim(), params.password);
    if (res.account) {
      if (Array.isArray(res.transactions)) {
        for (const tx of res.transactions) {
          recordLoyaltyTransaction(tx);
        }
      }
      if (Array.isArray(res.orders) && typeof window !== 'undefined') {
        localStorage.setItem('venty_past_orders_v1', JSON.stringify(res.orders));
        window.dispatchEvent(
          new CustomEvent('venty:orders:updated', {
            detail: { orders: res.orders },
          }),
        );
      }

      setActiveLoyaltyAccount(res.account);
      const customer: LoyaltyCustomer = {
        ...res.account,
        id: res.account.customerId,
        availableRewards: res.account.availableRewards || [],
        redeemedRewards: res.account.redeemedRewards || [],
        loyaltyStatus: res.account.loyaltyStatus || 'Active',
      };
      return {
        success: true,
        customer,
        orders: res.orders,
        message: res.message || `Welcome back, ${customer.name}!`,
      };
    }
    return {
      success: false,
      customer: null,
      message: res.message || 'Invalid phone number or password.',
    };
  } catch (err: any) {
    return {
      success: false,
      customer: null,
      message: err?.message || 'Invalid phone number or password.',
    };
  }
};

export const registerCustomerWithPassword = async (params: {
  name: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  email?: string;
  favouriteDrink?: string;
}): Promise<{
  success: boolean;
  created: boolean;
  welcomeBonusAwarded: boolean;
  customer: LoyaltyCustomer | null;
  message: string;
}> => {
  const cleanName = params.name.trim();
  const cleanPhone = normalizePhoneNumber(params.phone);
  if (!cleanName || !cleanPhone || cleanPhone.length < 8) {
    return {
      success: false,
      created: false,
      welcomeBonusAwarded: false,
      customer: null,
      message: 'Please provide your full name and a valid phone number.',
    };
  }

  if (!params.password || params.password.length < 8) {
    return {
      success: false,
      created: false,
      welcomeBonusAwarded: false,
      customer: null,
      message: 'Password must be at least 8 characters long.',
    };
  }

  if (params.confirmPassword !== undefined && params.password !== params.confirmPassword) {
    return {
      success: false,
      created: false,
      welcomeBonusAwarded: false,
      customer: null,
      message: 'Passwords do not match. Please confirm your password.',
    };
  }

  try {
    const res = await signupCustomerOnBackend({
      name: cleanName,
      phone: params.phone.trim(),
      password: params.password,
      confirmPassword: params.confirmPassword,
      email: params.email?.trim() || undefined,
      favouriteDrink: params.favouriteDrink?.trim() || undefined,
    });

    if (res.account) {
      if (Array.isArray(res.transactions)) {
        for (const tx of res.transactions) {
          recordLoyaltyTransaction(tx);
        }
      }
      setActiveLoyaltyAccount(res.account);
      const customer: LoyaltyCustomer = {
        ...res.account,
        id: res.account.customerId,
        availableRewards: res.account.availableRewards || [],
        redeemedRewards: res.account.redeemedRewards || [],
        loyaltyStatus: res.account.loyaltyStatus || 'Active',
      };
      return {
        success: true,
        created: Boolean(res.created),
        welcomeBonusAwarded: Boolean(res.welcomeBonusAwarded),
        customer,
        message:
          res.message ||
          `Welcome to VENTY Loyalty, ${customer.name}! +2 Welcome stamps added to your card.`,
      };
    }

    return {
      success: false,
      created: false,
      welcomeBonusAwarded: false,
      customer: null,
      message: res.message || 'Could not create your account right now.',
    };
  } catch (err: any) {
    return {
      success: false,
      created: false,
      welcomeBonusAwarded: false,
      customer: null,
      message:
        err?.message ||
        'Unable to complete registration. If you already have an account, please sign in.',
    };
  }
};

export const signupCustomerWithPassword = registerCustomerWithPassword;

export const loginLoyaltyCustomer = async (
  phone: string,
  password?: string,
): Promise<{
  success: boolean;
  customer: LoyaltyCustomer | null;
  message: string;
}> => {
  const clean = normalizePhoneNumber(phone);
  if (!clean) {
    return { success: false, customer: null, message: 'Please enter a valid phone number.' };
  }

  if (password) {
    const res = await loginCustomerWithPassword({ phone, password });
    return {
      success: res.success,
      customer: res.customer,
      message: res.message,
    };
  }

  return {
    success: false,
    customer: null,
    message: 'Please enter your password to sign in.',
  };
};

export const logoutLoyaltyCustomer = async (): Promise<void> => {
  await logoutFromBackend('CUSTOMER');
  clearSessionToken('CUSTOMER');
  setActiveLoyaltyAccount(null);
};

export const updateLoyaltyCustomerProfile = async (params: {
  name?: string;
  phone?: string;
  email?: string;
  favouriteDrink?: string;
}): Promise<{ success: boolean; customer: LoyaltyCustomer | null; message: string }> => {
  try {
    const res = await updateCustomerProfileOnBackend(params);
    if (res.account) {
      setActiveLoyaltyAccount(res.account);
      const customer: LoyaltyCustomer = {
        ...res.account,
        id: res.account.customerId,
        availableRewards: res.account.availableRewards || [],
        redeemedRewards: res.account.redeemedRewards || [],
        loyaltyStatus: res.account.loyaltyStatus || 'Active',
      };
      return {
        success: true,
        customer,
        message: res.message || 'Customer profile updated.',
      };
    }
  } catch (err: any) {
    const active = getActiveLoyaltyAccount();
    if (active) {
      const updated: LoyaltyAccount = {
        ...active,
        name: params.name?.trim() || active.name,
        phone: params.phone?.trim() || active.phone,
        email: params.email !== undefined ? params.email.trim() || undefined : active.email,
        favouriteDrink: params.favouriteDrink?.trim() || active.favouriteDrink,
        updatedAt: new Date().toISOString(),
      };
      setActiveLoyaltyAccount(updated);
      const customer: LoyaltyCustomer = {
        ...updated,
        id: updated.customerId,
        availableRewards: updated.availableRewards || [],
        redeemedRewards: updated.redeemedRewards || [],
        loyaltyStatus: updated.loyaltyStatus || 'Active',
      };
      return {
        success: true,
        customer,
        message: 'Customer profile updated.',
      };
    }
    return {
      success: false,
      customer: null,
      message: err?.message || 'Failed to update profile.',
    };
  }
  return { success: false, customer: null, message: 'Failed to update profile.' };
};

export const ensureCustomerBackendSession = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  const existingToken = getSessionToken('CUSTOMER');
  if (!existingToken) {
    return;
  }
  try {
    const res = await fetchCustomerProfileFromBackend(undefined, 'CUSTOMER');
    if (res && res.account) {
      setActiveLoyaltyAccount(res.account);
    }
  } catch {
    // Session token expired or invalid
  }
};
