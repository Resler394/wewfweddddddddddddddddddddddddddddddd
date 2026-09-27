import {
  LoyaltyAccount,
  LoyaltyCustomer,
  LoyaltyReward,
  LoyaltyTransaction,
  LoyaltyConfig,
  CustomerProfile,
} from '../types/loyalty';
import {
  PastOrder,
  CartItem,
  OrderCompletedEventPayload,
  AdminOrdersDashboardMetrics,
} from '../types/coffee';

const API_BASE = '/api/loyalty';
const ORDERS_API_BASE = '/api/orders';
const CUSTOMER_API_BASE = '/api/customer';

// Session Token Storage Keys
const CUSTOMER_TOKEN_KEY = 'venty_auth_customer_token';
const STAFF_TOKEN_KEY = 'venty_auth_staff_token';
const ADMIN_TOKEN_KEY = 'venty_auth_admin_token';
const DEVICE_ID_KEY = 'venty_auth_device_id';

export const getClientDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  let devId = localStorage.getItem(DEVICE_ID_KEY);
  if (!devId) {
    devId = `dev_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
    localStorage.setItem(DEVICE_ID_KEY, devId);
  }
  return devId;
};

const OPAQUE_SESSION_TOKEN_PATTERN = /^vty_sess_[0-9a-f]{48}$/;

// In-memory store for Staff/Admin session tokens so management tokens/credentials never touch localStorage
const memoryManagementSessionTokens: {
  ADMIN: string | null;
  STAFF: string | null;
} = {
  ADMIN: null,
  STAFF: null,
};

export const getSessionToken = (role: 'CUSTOMER' | 'STAFF' | 'ADMIN'): string | null => {
  if (typeof window === 'undefined') return null;
  if (role === 'ADMIN') {
    if (memoryManagementSessionTokens.ADMIN) return memoryManagementSessionTokens.ADMIN;
    const stored = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    return stored && OPAQUE_SESSION_TOKEN_PATTERN.test(stored) ? stored : null;
  }
  if (role === 'STAFF') {
    if (memoryManagementSessionTokens.STAFF) return memoryManagementSessionTokens.STAFF;
    const stored = sessionStorage.getItem(STAFF_TOKEN_KEY);
    return stored && OPAQUE_SESSION_TOKEN_PATTERN.test(stored) ? stored : null;
  }
  const customerToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);
  return customerToken && OPAQUE_SESSION_TOKEN_PATTERN.test(customerToken) ? customerToken : null;
};

export const setSessionToken = (role: 'CUSTOMER' | 'STAFF' | 'ADMIN', token: string): void => {
  if (typeof window === 'undefined') return;
  // Never store anything other than a server-issued opaque session token
  if (!token || !OPAQUE_SESSION_TOKEN_PATTERN.test(token)) return;
  if (role === 'ADMIN') {
    memoryManagementSessionTokens.ADMIN = token;
    memoryManagementSessionTokens.STAFF = null;
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    sessionStorage.removeItem(STAFF_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(STAFF_TOKEN_KEY);
  } else if (role === 'STAFF') {
    memoryManagementSessionTokens.STAFF = token;
    memoryManagementSessionTokens.ADMIN = null;
    sessionStorage.setItem(STAFF_TOKEN_KEY, token);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(STAFF_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } else {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  }
};

export const clearSessionToken = (role: 'CUSTOMER' | 'STAFF' | 'ADMIN'): void => {
  if (typeof window === 'undefined') return;
  if (role === 'ADMIN') {
    memoryManagementSessionTokens.ADMIN = null;
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } else if (role === 'STAFF') {
    memoryManagementSessionTokens.STAFF = null;
    sessionStorage.removeItem(STAFF_TOKEN_KEY);
    localStorage.removeItem(STAFF_TOKEN_KEY);
  } else {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  }
};

// Helper for fetch calls with signed Bearer authorization header
const apiFetch = async <T>(
  url: string,
  options: RequestInit = {},
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN' = 'CUSTOMER',
): Promise<T> => {
  const token = getSessionToken(role);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-venty-device-id': getClientDeviceId(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorBody.message || `API error ${res.status}`);
  }
  return res.json();
};

/**
 * =========================================================================
 * 1. AUTHENTICATION SERVICES (CUSTOMER, STAFF, ADMIN)
 * =========================================================================
 */
export const loginCustomerOnBackend = async (
  phone: string,
  password?: string,
): Promise<{
  authenticated?: boolean;
  verified?: boolean;
  token?: string;
  role?: string;
  account?: LoyaltyAccount;
  profile?: CustomerProfile;
  orders?: PastOrder[];
  transactions?: LoyaltyTransaction[];
  message: string;
}> => {
  const data = await apiFetch<{
    authenticated?: boolean;
    verified?: boolean;
    token?: string;
    role?: string;
    account?: LoyaltyAccount;
    profile?: CustomerProfile;
    orders?: PastOrder[];
    transactions?: LoyaltyTransaction[];
    message: string;
  }>(
    `${API_BASE}/auth/login`,
    {
      method: 'POST',
      body: JSON.stringify({
        role: 'CUSTOMER',
        phone,
        password,
      }),
    },
    'CUSTOMER',
  );
  if (data.token) {
    setSessionToken('CUSTOMER', data.token);
  }
  return data;
};

export const logoutFromBackend = async (
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN' = 'CUSTOMER',
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await apiFetch<{ success: boolean; message: string }>(
      `${API_BASE}/auth/logout`,
      { method: 'POST' },
      role,
    );
    clearSessionToken(role);
    if (role === 'ADMIN' || role === 'STAFF') {
      clearSessionToken('ADMIN');
      clearSessionToken('STAFF');
    }
    return res;
  } catch {
    clearSessionToken(role);
    if (role === 'ADMIN' || role === 'STAFF') {
      clearSessionToken('ADMIN');
      clearSessionToken('STAFF');
    }
    return { success: true, message: 'Logged out locally.' };
  }
};

export const authenticateStaffOnBackend = async (
  passcode: string,
  staffId?: string,
): Promise<{ token: string; role: 'STAFF'; staffId: string; staffName: string; message: string }> => {
  const data = await apiFetch<{
    token: string;
    role: 'STAFF';
    staffId: string;
    staffName: string;
    message: string;
  }>(
    '/api/management/auth/staff',
    {
      method: 'POST',
      body: JSON.stringify({
        role: 'STAFF',
        staffPin: passcode,
        ...(staffId ? { adminOrStaffId: staffId } : {}),
      }),
    },
    'STAFF',
  );
  if (data.token && data.role === 'STAFF') {
    clearSessionToken('ADMIN');
    setSessionToken('STAFF', data.token);
  }
  return data;
};

export const authenticateAdminOnBackend = async (
  adminSecret: string,
): Promise<{ token: string; role: 'ADMIN'; adminId: string; message: string }> => {
  const data = await apiFetch<{
    token: string;
    role: 'ADMIN';
    adminId: string;
    message: string;
  }>(
    '/api/management/auth/admin',
    {
      method: 'POST',
      body: JSON.stringify({ role: 'ADMIN', adminSecret }),
    },
    'ADMIN',
  );
  if (data.token && data.role === 'ADMIN') {
    clearSessionToken('STAFF');
    setSessionToken('ADMIN', data.token);
  }
  return data;
};

export const authenticateStaffPin = authenticateStaffOnBackend;
export const authenticateAdminSession = authenticateAdminOnBackend;

/**
 * =========================================================================
 * 1B. CUSTOMER PROFILE & ORDER MANAGEMENT ENDPOINTS
 * =========================================================================
 */
export const fetchCustomerProfileFromBackend = async (
  customerId?: string,
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN' = 'CUSTOMER',
): Promise<{
  profile: CustomerProfile;
  account: LoyaltyAccount;
  stats: { totalOrders: number; completedOrders: number; totalSpent: number };
} | null> => {
  try {
    const query = new URLSearchParams();
    if (customerId) query.set('customerId', customerId);
    return await apiFetch(
      `${CUSTOMER_API_BASE}/profile${query.toString() ? `?${query.toString()}` : ''}`,
      {},
      role,
    );
  } catch {
    return null;
  }
};

export const updateCustomerProfileOnBackend = async (params: {
  customerId?: string;
  name?: string;
  phone?: string;
  email?: string;
  favouriteDrink?: string;
}): Promise<{
  success: boolean;
  profile: CustomerProfile;
  account: LoyaltyAccount;
  message: string;
}> => {
  return apiFetch(
    `${CUSTOMER_API_BASE}/profile`,
    {
      method: 'PUT',
      body: JSON.stringify(params),
    },
    'CUSTOMER',
  );
};

export const createOrderOnBackend = async (orderPayload: {
  orderId?: string;
  id?: string;
  idempotencyKey?: string;
  items: CartItem[];
  customerName: string;
  customerPhone?: string;
  pickupTime: string;
  notes?: string;
}): Promise<{
  created: boolean;
  duplicatePrevented?: boolean;
  order: PastOrder;
  loyaltyResult?: any;
}> => {
  return apiFetch(
    ORDERS_API_BASE,
    {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    },
    'CUSTOMER',
  );
};

export const fetchOrderByIdFromBackend = async (
  orderId: string,
): Promise<{
  order: PastOrder;
  timezone: string;
}> => {
  return apiFetch(
    `${ORDERS_API_BASE}/${encodeURIComponent(orderId)}`,
    {},
    'CUSTOMER',
  );
};

export const fetchMyOrdersFromBackend = async (): Promise<{
  orders: PastOrder[];
  timezone: string;
}> => {
  return apiFetch(`${ORDERS_API_BASE}/my-orders`, {}, 'CUSTOMER');
};

export const fetchOrdersDashboardFromBackend = async (
  params: {
    period?: string;
    status?: string;
    search?: string;
    customerId?: string;
  } = {},
  role: 'STAFF' | 'ADMIN' = 'ADMIN',
): Promise<{
  orders: PastOrder[];
  metrics: AdminOrdersDashboardMetrics;
  period: string;
  timezone: string;
  algiersTodayKey: string;
  algiersTodayLabel: string;
}> => {
  const query = new URLSearchParams();
  if (params.period) query.set('period', params.period);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.customerId) query.set('customerId', params.customerId);
  const activeRole = getSessionToken('ADMIN') ? 'ADMIN' : getSessionToken('STAFF') ? 'STAFF' : role;
  return apiFetch(`${ORDERS_API_BASE}?${query.toString()}`, {}, activeRole);
};

export const updateOrderStatusOnBackend = async (
  orderId: string,
  status: string,
  reasonOrRole?: string,
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN' = 'CUSTOMER',
): Promise<{
  success: boolean;
  order: PastOrder;
  loyaltyResult?: any;
  account?: LoyaltyAccount;
}> => {
  const isThirdArgRole =
    reasonOrRole === 'ADMIN' || reasonOrRole === 'STAFF' || reasonOrRole === 'CUSTOMER';
  const explicitRole = isThirdArgRole
    ? (reasonOrRole as 'CUSTOMER' | 'STAFF' | 'ADMIN')
    : role;
  const reason = isThirdArgRole ? undefined : reasonOrRole;

  const effectiveRole =
    explicitRole !== 'CUSTOMER'
      ? explicitRole
      : getSessionToken('ADMIN')
      ? 'ADMIN'
      : getSessionToken('STAFF')
      ? 'STAFF'
      : 'CUSTOMER';

  return apiFetch(
    `${ORDERS_API_BASE}/${encodeURIComponent(orderId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    },
    effectiveRole,
  );
};

/**
 * =========================================================================
 * 2. PROTECTED REST API ENDPOINTS
 * =========================================================================
 */

// 1. Fetch Account
export const fetchAccountFromBackend = async (
  customerId?: string,
  phone?: string,
): Promise<LoyaltyAccount | null> => {
  try {
    const query = new URLSearchParams();
    if (customerId) query.set('customerId', customerId);
    if (phone) query.set('phone', phone);
    const data = await apiFetch<{ account: LoyaltyAccount }>(
      `${API_BASE}/account?${query.toString()}`,
    );
    return data.account;
  } catch (err) {
    console.warn('[Loyalty API] Failed to fetch account from backend:', err);
    return null;
  }
};

// 2. Fetch Transactions History
export const fetchHistoryFromBackend = async (
  customerId?: string,
): Promise<LoyaltyTransaction[]> => {
  try {
    const query = new URLSearchParams();
    if (customerId) query.set('customerId', customerId);
    const data = await apiFetch<{ transactions: LoyaltyTransaction[] }>(
      `${API_BASE}/history?${query.toString()}`,
    );
    return data.transactions || [];
  } catch (err) {
    console.warn('[Loyalty API] Failed to fetch transactions from backend:', err);
    return [];
  }
};

// 3. Signup / Register
export const signupCustomerOnBackend = async (params: {
  name: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  email?: string;
  favouriteDrink?: string;
}): Promise<{
  authenticated?: boolean;
  verified?: boolean;
  account: LoyaltyAccount;
  profile?: CustomerProfile;
  orders?: PastOrder[];
  transactions?: LoyaltyTransaction[];
  token?: string;
  created: boolean;
  welcomeBonusAwarded: boolean;
  message: string;
}> => {
  const res = await apiFetch<{
    authenticated?: boolean;
    verified?: boolean;
    account: LoyaltyAccount;
    profile?: CustomerProfile;
    orders?: PastOrder[];
    transactions?: LoyaltyTransaction[];
    token?: string;
    created: boolean;
    welcomeBonusAwarded: boolean;
    message: string;
  }>(
    `${API_BASE}/signup`,
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
  );
  if (res.token) {
    setSessionToken('CUSTOMER', res.token);
  }
  return res;
};

// 4. Process Completed Order
export const processOrderLoyaltyOnBackend = async (
  order: PastOrder | OrderCompletedEventPayload,
): Promise<{
  awardedStamp: boolean;
  unlockedReward: boolean;
  duplicatePrevented?: boolean;
  account: LoyaltyAccount;
  reward?: LoyaltyReward;
  transaction?: LoyaltyTransaction;
  message: string;
}> => {
  const orderId = 'orderId' in order ? order.orderId : order.id;
  const items = 'items' in order ? order.items : order.orderItems;

  return apiFetch(`${API_BASE}/order-completed`, {
    method: 'POST',
    body: JSON.stringify({
      orderId,
      customerId: order.customerId,
      customerPhone: order.customerPhone,
      items,
    }),
  });
};

// 5. Verify Reward for Staff (Protected with STAFF session token)
export const verifyRewardOnBackend = async (
  query: string,
): Promise<{
  valid: boolean;
  reward: LoyaltyReward | null;
  customer: { customerId: string; name: string; phone: string } | null;
  status: string;
  isExpired: boolean;
  message: string;
}> => {
  return apiFetch(
    `${API_BASE}/verify-reward`,
    {
      method: 'POST',
      body: JSON.stringify({ query }),
    },
    'STAFF',
  );
};

// 6. Redeem Reward Atomically (Protected with STAFF session token)
export const redeemRewardOnBackend = async (params: {
  rewardId?: string;
  redemptionCode?: string;
  redemptionToken?: string;
  location?: string;
  orderId?: string;
}): Promise<{
  success: boolean;
  message: string;
  reward?: LoyaltyReward;
  account?: LoyaltyAccount;
}> => {
  return apiFetch(
    `${API_BASE}/redeem`,
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    'STAFF',
  );
};

// 7. Admin Balance Adjustment (Protected with ADMIN session token)
export const adminAdjustOnBackend = async (params: {
  customerId: string;
  stampsDelta: number;
  reason: string;
  adminId?: string;
}): Promise<{
  success: boolean;
  message: string;
  account?: LoyaltyAccount;
}> => {
  return apiFetch(
    `${API_BASE}/admin/adjust`,
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    'ADMIN',
  );
};

// 8. Admin Cancel Reward (Protected with ADMIN session token)
export const adminCancelRewardOnBackend = async (
  rewardId: string,
  reason?: string,
): Promise<{ success: boolean; message: string; account?: LoyaltyAccount }> => {
  return apiFetch(
    `${API_BASE}/admin/cancel-reward`,
    {
      method: 'POST',
      body: JSON.stringify({ rewardId, reason }),
    },
    'ADMIN',
  );
};

// 9. Order Stamp Reversal (Protected with ADMIN session token)
export const orderReversalOnBackend = async (
  orderId: string,
  reason?: string,
): Promise<{ success: boolean; message: string; account?: LoyaltyAccount }> => {
  return apiFetch(
    `${API_BASE}/order-reversal`,
    {
      method: 'POST',
      body: JSON.stringify({ orderId, reason }),
    },
    'ADMIN',
  );
};

// 10. Admin Metrics (Protected with ADMIN session token)
export const fetchMetricsFromBackend = async () => {
  return apiFetch<{
    totalMembers: number;
    activeMembers: number;
    activeStampsInCirculation: number;
    totalStampsIssued: number;
    rewardsIssued: number;
    rewardsRedeemed: number;
    totalRewardsIssued: number;
    totalRewardsRedeemed: number;
  }>(`${API_BASE}/admin/metrics`, {}, 'ADMIN');
};

// 11. Admin Customer Directory Search (Protected with ADMIN session token)
export const searchCustomersOnBackend = async (
  query = '',
): Promise<{ customers: LoyaltyAccount[] }> => {
  return apiFetch<{ customers: LoyaltyAccount[] }>(
    `${API_BASE}/admin/customers?query=${encodeURIComponent(query)}`,
    {},
    'ADMIN',
  );
};

// 12. Client Migration of Legacy Data
export const migrateClientDataToBackend = async (
  accounts: any[],
  transactions: any[],
): Promise<{ success: boolean; importedAccounts: number; importedTransactions: number; message: string }> => {
  return apiFetch(`${API_BASE}/migrate`, {
    method: 'POST',
    body: JSON.stringify({ accounts, transactions }),
  });
};

/**
 * =========================================================================
 * 3. VENTY MANAGEMENT & STAFF OPERATIONS BACK-OFFICE API
 *    Protected by Server-Side RBAC (STAFF / ADMIN)
 * =========================================================================
 */
const MANAGEMENT_API_BASE = '/api/management';

const resolveManagementRole = (preferred: 'STAFF' | 'ADMIN' = 'ADMIN'): 'STAFF' | 'ADMIN' => {
  if (preferred === 'ADMIN' && getSessionToken('ADMIN')) return 'ADMIN';
  if (preferred === 'STAFF' && getSessionToken('STAFF')) return 'STAFF';
  if (getSessionToken('ADMIN')) return 'ADMIN';
  if (getSessionToken('STAFF')) return 'STAFF';
  return preferred;
};

export const getStaffSessionToken = (): string | null => getSessionToken('STAFF');
export const getAdminSessionToken = (): string | null => getSessionToken('ADMIN');
export const clearStaffSessionToken = (): void => clearSessionToken('STAFF');
export const clearAdminSessionToken = (): void => clearSessionToken('ADMIN');
export const logoutSessionOnBackend = logoutFromBackend;

export const fetchOrdersFromBackend = async (params?: {
  role?: 'STAFF' | 'ADMIN';
  status?: string;
  search?: string;
}): Promise<any[]> => {
  const effectiveRole = resolveManagementRole(params?.role);
  const res = await apiFetch<{ orders: any[] }>(
    `${API_BASE}/orders`,
    {},
    effectiveRole,
  );
  return (res.orders || []).map((o: any) => ({
    ...o,
    totalDzd: o.totalDzd ?? o.totalAmount ?? 0,
    qualifiesForStamp: o.qualifiesForStamp ?? o.qualifiesForLoyalty ?? false,
    stampAwarded: o.stampAwarded ?? o.loyaltyStampAwarded ?? false,
  }));
};

const normalizeReviewsResponse = (raw: any) => {
  const reviews = (raw?.reviews || []).map((r: any) => ({
    ...r,
    authorName: r.authorName || 'Google Reviewer',
    rating: r.rating || 5,
    text: r.text || '',
    relativeTimeDescription:
      r.relativeTimeDescription || r.relativePublishTimeDescription || 'Recently',
  }));
  return {
    ...raw,
    name: raw?.displayName || raw?.name || 'VENTY THE COFFEE',
    rating: typeof raw?.rating === 'number' ? raw.rating : 4.4,
    userRatingsTotal:
      typeof raw?.userRatingCount === 'number'
        ? raw.userRatingCount
        : typeof raw?.userRatingsTotal === 'number'
        ? raw.userRatingsTotal
        : reviews.length || 10,
    source: raw?.cached === false ? 'google_places_live' : 'google_verified_cache',
    lastUpdatedAt: raw?.lastFetched || raw?.lastUpdatedAt || new Date().toISOString(),
    placeIdConfigured: Boolean(raw?.placeId),
    reviews,
  };
};

export const fetchManagementReviewsFromBackend = async (): Promise<any> => {
  try {
    const raw = await apiFetch<any>('/api/google-reviews', {}, 'ADMIN');
    return normalizeReviewsResponse(raw);
  } catch {
    return normalizeReviewsResponse({
      displayName: 'VENTY THE COFFEE',
      rating: 4.4,
      userRatingCount: 10,
      placeId: 'ChIJA4-eLwCThRIROYpgW448oDM',
      reviews: [],
    });
  }
};

export const refreshManagementReviewsOnBackend = async (): Promise<any> => {
  await apiFetch(
    `${MANAGEMENT_API_BASE}/reviews/refresh`,
    { method: 'POST' },
    'ADMIN',
  );
  return fetchManagementReviewsFromBackend();
};

export const updateManagementCustomerStatusOnBackend = async (
  customerIdOrPhone: string,
  status: string,
  _reason?: string,
): Promise<any> => {
  const normalizedStatus: 'Active' | 'Suspended' =
    status.toUpperCase() === 'SUSPENDED' ? 'Suspended' : 'Active';
  return updateManagementCustomerOnBackend(customerIdOrPhone, {
    accountStatus: normalizedStatus,
  });
};

export const adjustCustomerLoyaltyOnBackend = async (payload: {
  customerId?: string;
  phone?: string;
  stampsDelta?: number;
  delta?: number;
  action?: string;
  reason?: string;
  orderId?: string;
}): Promise<any> => {
  if (payload.action === 'ORDER_REVERSAL' && payload.orderId) {
    return orderReversalOnBackend(
      payload.orderId,
      payload.reason || 'Order cancelled / refunded',
    );
  }
  const cid = payload.customerId || payload.phone || '';
  const delta = Number(payload.stampsDelta ?? payload.delta ?? 1);
  return adminAdjustOnBackend({
    customerId: cid,
    stampsDelta: delta,
    reason: payload.reason || 'Admin loyalty adjustment',
  });
};

export const verifyRewardCodeOnBackend = async (code: string): Promise<any> => {
  return verifyRewardOnBackend(code);
};

export const cancelManagementRewardOnBackend = async (
  rewardId: string,
  reason = 'Cancelled by manager',
): Promise<any> => {
  return adminCancelRewardOnBackend(rewardId, reason);
};

export const loginManagementPortalOnBackend = async (params: {
  adminOrStaffId: string;
  password: string;
  role?: 'ADMIN' | 'STAFF';
}): Promise<{
  token: string;
  role: 'ADMIN' | 'STAFF';
  adminId?: string;
  staffId?: string;
  staffName?: string;
  message: string;
}> => {
  const data = await apiFetch<{
    token: string;
    role: 'ADMIN' | 'STAFF';
    adminId?: string;
    staffId?: string;
    staffName?: string;
    message: string;
  }>(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (data.token && (data.role === 'ADMIN' || data.role === 'STAFF')) {
    if (data.role === 'ADMIN') {
      clearSessionToken('STAFF');
    } else {
      clearSessionToken('ADMIN');
    }
    setSessionToken(data.role, data.token);
  }
  return data;
};

export const verifyManagementSessionOnBackend = async (
  role?: 'STAFF' | 'ADMIN',
): Promise<{
  authenticated: boolean;
  role: 'STAFF' | 'ADMIN';
  staffId: string | null;
  staffName: string | null;
  adminId: string | null;
  expiresAt: number | null;
}> => {
  const effectiveRole = resolveManagementRole(role);
  return apiFetch(`${MANAGEMENT_API_BASE}/session`, {}, effectiveRole);
};

export const fetchManagementOverviewFromBackend = async (
  role?: 'STAFF' | 'ADMIN',
): Promise<any> => {
  const effectiveRole = resolveManagementRole(role);
  const raw = await apiFetch<any>(`${MANAGEMENT_API_BASE}/overview`, {}, effectiveRole);
  const todayOrders = raw.todayOrders ?? raw.todaysOrdersCount ?? 0;
  const yesterdayOrders = raw.yesterdayOrders ?? 0;
  const todayRevenue = raw.todayRevenue ?? raw.todaysRevenueDzd ?? 0;
  const yesterdayRevenue = raw.yesterdayRevenue ?? 0;
  const pendingOrders = raw.pendingOrders ?? raw.pendingOrdersCount ?? 0;
  const confirmedOrders = raw.confirmedOrders ?? 0;
  const preparingOrders = raw.preparingOrders ?? raw.preparingOrdersCount ?? 0;
  const readyOrders = raw.readyOrders ?? raw.readyOrdersCount ?? 0;
  const completedOrders = raw.completedOrders ?? raw.completedOrdersCount ?? 0;
  const cancelledOrders = raw.cancelledOrders ?? raw.cancelledOrdersCount ?? 0;
  const loyaltyStampsIssuedToday = raw.loyaltyStampsIssuedToday ?? 0;
  const loyaltyStampsIssuedTotal =
    raw.loyaltyStampsIssuedTotal ?? raw.totalStampsIssuedLifetime ?? 0;
  const rewardsRedeemedToday = raw.rewardsRedeemedToday ?? 0;
  const rewardsAvailableTotal = raw.rewardsAvailableTotal ?? raw.availableRewardsCount ?? 0;

  return {
    ...raw,
    todayOrders,
    todaysOrdersCount: todayOrders,
    yesterdayOrders,
    ordersComparisonDiff: todayOrders - yesterdayOrders,
    todayRevenue,
    todaysRevenueDzd: todayRevenue,
    yesterdayRevenue,
    revenueComparisonDiffDzd: todayRevenue - yesterdayRevenue,
    pendingOrders,
    pendingOrdersCount: pendingOrders,
    confirmedOrders,
    preparingOrders,
    preparingOrdersCount: preparingOrders + confirmedOrders,
    activeOrdersCount: pendingOrders + confirmedOrders + preparingOrders,
    readyOrders,
    readyOrdersCount: readyOrders,
    completedOrders,
    completedOrdersCount: completedOrders,
    cancelledOrders,
    cancelledOrdersCount: cancelledOrders,
    loyaltyStampsIssuedToday,
    loyaltyStampsIssuedTotal,
    totalStampsIssuedLifetime: loyaltyStampsIssuedTotal,
    rewardsRedeemedToday,
    rewardsAvailableTotal,
    availableRewardsCount: rewardsAvailableTotal,
  };
};

export const fetchManagementCustomersFromBackend = async (
  search = '',
  status = 'ALL',
): Promise<{
  customers: Array<
    LoyaltyAccount & {
      accountStatus: 'Active' | 'Suspended';
      totalOrders: number;
      completedOrdersCount: number;
      totalSpent: number;
      orders: PastOrder[];
      transactions?: LoyaltyTransaction[];
      allRewards?: any[];
    }
  >;
  totalCount: number;
}> => {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (status && status !== 'ALL') query.set('status', status);
  return apiFetch(`${MANAGEMENT_API_BASE}/customers?${query.toString()}`, {}, 'ADMIN');
};

export const updateManagementCustomerOnBackend = async (
  customerId: string,
  updates: {
    name?: string;
    email?: string;
    favouriteDrink?: string;
    loyaltyStatus?: 'Active' | 'Gold' | 'VIP';
    accountStatus?: 'Active' | 'Suspended';
  },
): Promise<{
  success: boolean;
  customer: LoyaltyAccount & { accountStatus: 'Active' | 'Suspended' };
  message: string;
}> => {
  return apiFetch(
    `${MANAGEMENT_API_BASE}/customers/${encodeURIComponent(customerId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    'ADMIN',
  );
};

export const fetchManagementLoyaltyFromBackend = async (): Promise<{
  config: LoyaltyConfig;
  accounts: Array<LoyaltyAccount & { accountStatus: 'Active' | 'Suspended' }>;
  transactions: LoyaltyTransaction[];
  welcomeBonuses: LoyaltyTransaction[];
  adminAdjustments: LoyaltyTransaction[];
  redemptions: LoyaltyTransaction[];
  summary: {
    totalMembers: number;
    activeMembers: number;
    activeStampsInCirculation: number;
    lifetimeStampsTotal: number;
    stampsIssuedTotal?: number;
    rewardsIssuedCount?: number;
    rewardsRedeemedCount?: number;
    welcomeBonusesGrantedCount: number;
    totalTransactionsCount: number;
    adminAdjustmentsCount: number;
  };
}> => {
  return apiFetch(`${MANAGEMENT_API_BASE}/loyalty`, {}, 'ADMIN');
};

export const fetchManagementRewardsFromBackend = async (
  role?: 'STAFF' | 'ADMIN',
): Promise<{
  rewards: Array<{
    rewardId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    type: string;
    status: 'AVAILABLE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
    issuedAt: string;
    expiresAt?: string;
    redeemedAt?: string;
    redemptionCode: string;
    redemptionStaffId?: string;
    redemptionLocation?: string;
  }>;
  counts: {
    available: number;
    redeemed: number;
    expired: number;
    cancelled: number;
    total: number;
  };
}> => {
  const effectiveRole = resolveManagementRole(role);
  return apiFetch(`${MANAGEMENT_API_BASE}/rewards`, {}, effectiveRole);
};

const MENU_CATEGORY_LABELS: Record<string, { title: string; subtitle: string }> = {
  coffee: { title: 'Coffee & Espresso', subtitle: 'Specialty Espresso & Milk Classics' },
  drinks: { title: 'Cold Drinks & Mocktails', subtitle: 'Mojitos, Milkshakes & Refreshers' },
  fresh: { title: 'Fresh Juices & Teas', subtitle: 'Pressed Juices & Artisanal Infusions' },
  sweets: { title: 'Sweets & Waffles', subtitle: 'Crêpes, Waffles & Bakery' },
  desserts: { title: 'Signature Desserts', subtitle: 'Cheesecakes & Artisanal Patisserie' },
  espresso: { title: 'Specialty Espresso', subtitle: 'Single Origin & House Espresso' },
  cold: { title: 'Iced Coffee', subtitle: 'Cold Brew & Iced Lattes' },
  filter: { title: 'Pour-Over Filter', subtitle: 'Hand-Brewed V60' },
  juice: { title: 'Pressed Juices', subtitle: '100% Natural Fruit Blends' },
  beans: { title: 'Whole Bean Retail', subtitle: '250g Specialty Coffee Bags' },
};

export const fetchManagementMenuFromBackend = async (
  role?: 'STAFF' | 'ADMIN',
): Promise<any> => {
  const effectiveRole = resolveManagementRole(role);
  const raw = await apiFetch<any>(`${MANAGEMENT_API_BASE}/menu`, {}, effectiveRole);
  const rawItems: any[] = raw.items || [];
  const catIds = Array.from(new Set(rawItems.map((i) => String(i.category || 'coffee').toLowerCase())));
  const categories = catIds.map((id) => ({
    id,
    title: MENU_CATEGORY_LABELS[id]?.title || id.toUpperCase(),
    subtitle: MENU_CATEGORY_LABELS[id]?.subtitle || 'Official Menu Category',
  }));

  const items = rawItems.map((it) => {
    const catId = String(it.category || 'coffee').toLowerCase();
    return {
      ...it,
      category: catId,
      categoryTitle: MENU_CATEGORY_LABELS[catId]?.title || catId.toUpperCase(),
      priceNum: it.unitPrice ?? it.priceNum ?? 300,
      unitPrice: it.unitPrice ?? it.priceNum ?? 300,
      loyaltyEligible: Boolean(it.qualifiesForLoyalty ?? it.loyaltyEligible ?? true),
      qualifiesForLoyalty: Boolean(it.qualifiesForLoyalty ?? it.loyaltyEligible ?? true),
      hasOverride: Boolean(it.updatedAt),
    };
  });

  return {
    ...raw,
    items,
    categories,
    serverAuthoritativeNotice:
      'All product prices and loyalty qualification flags are enforced server-side during order checkout and stamp calculation.',
  };
};

export const createManagementMenuItemOnBackend = async (payload: {
  name: string;
  unitPrice?: number;
  priceNum?: number;
  category: string;
  description?: string;
  image?: string;
  available?: boolean;
  qualifiesForLoyalty?: boolean;
  loyaltyEligible?: boolean;
  featured?: boolean;
}): Promise<{
  success: boolean;
  item: any;
  message: string;
}> => {
  const unitPrice = Math.round(Number(payload.unitPrice ?? payload.priceNum ?? 350));
  const qualifiesForLoyalty = payload.qualifiesForLoyalty ?? payload.loyaltyEligible ?? true;
  return apiFetch(
    `${MANAGEMENT_API_BASE}/menu`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        unitPrice,
        qualifiesForLoyalty,
      }),
    },
    'ADMIN',
  );
};

export const updateManagementMenuItemOnBackend = async (
  itemId: string,
  updates: {
    name?: string;
    unitPrice?: number;
    priceNum?: number;
    category?: string;
    description?: string;
    image?: string;
    available?: boolean;
    qualifiesForLoyalty?: boolean;
    loyaltyEligible?: boolean;
    featured?: boolean;
  },
): Promise<{
  success: boolean;
  item: any;
  message: string;
}> => {
  const bodyPayload: Record<string, any> = { ...updates };
  if (updates.unitPrice !== undefined || updates.priceNum !== undefined) {
    bodyPayload.unitPrice = Math.round(Number(updates.unitPrice ?? updates.priceNum));
  }
  if (updates.qualifiesForLoyalty !== undefined || updates.loyaltyEligible !== undefined) {
    bodyPayload.qualifiesForLoyalty = Boolean(
      updates.qualifiesForLoyalty ?? updates.loyaltyEligible,
    );
  }
  return apiFetch(
    `${MANAGEMENT_API_BASE}/menu/${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(bodyPayload),
    },
    'ADMIN',
  );
};

export const refreshGoogleReviewsCacheOnBackend = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  return apiFetch(
    `${MANAGEMENT_API_BASE}/reviews/refresh`,
    { method: 'POST' },
    'ADMIN',
  );
};

export const fetchManagementAnalyticsFromBackend = async (params?: {
  range?: string;
  startDate?: string;
  endDate?: string;
}): Promise<any> => {
  const query = new URLSearchParams();
  if (params?.range) query.set('range', params.range);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const raw = await apiFetch<any>(`${MANAGEMENT_API_BASE}/analytics${qs}`, {}, 'ADMIN');

  const ordersCount = raw?.orders?.total ?? 0;
  const revenueDzd = raw?.revenue?.total ?? 0;
  const avgOrderValueDzd = raw?.revenue?.averageOrderValue ?? 0;
  const completedCount = raw?.orders?.completed ?? 0;
  const cancelledCount = raw?.orders?.cancelled ?? 0;
  const stampsIssued =
    (raw?.loyalty?.purchaseStampsTotal ?? 0) + (raw?.loyalty?.welcomeBonusStamps ?? 0);
  const rewardsEarned = raw?.loyalty?.rewardsIssuedCount ?? 0;
  const rewardsRedeemed = raw?.loyalty?.rewardsRedeemedCount ?? 0;

  return {
    ...raw,
    totalOrders: ordersCount,
    totalRevenueDzd: revenueDzd,
    averageOrderValueDzd: avgOrderValueDzd,
    completedOrdersCount: completedCount,
    cancelledOrdersCount: cancelledCount,
    rangeMetrics: {
      ordersCount,
      revenueDzd,
      avgOrderValueDzd,
      completedCount,
      cancelledCount,
      stampsIssued,
      rewardsEarned,
      rewardsRedeemed,
    },
    timeSeries: (raw?.dailySeries || []).map((d: any) => ({
      date: d.dateKey || d.label,
      ordersCount: d.orders ?? 0,
      revenueDzd: d.revenue ?? 0,
    })),
    statusBreakdown: raw?.statusDistribution || {},
    loyaltyActivity: {
      totalCustomers: raw?.loyalty?.totalMembers ?? 0,
      activeStampsInCirculation: raw?.loyalty?.activeStamps ?? 0,
      totalStampsIssued: raw?.loyalty?.lifetimeStamps ?? stampsIssued,
      totalRewardsIssued: rewardsEarned,
      totalRewardsRedeemed: rewardsRedeemed,
      availableRewardsCount: Math.max(0, rewardsEarned - rewardsRedeemed),
      redemptionRatePercent: raw?.loyalty?.redemptionRate ?? 0,
    },
    popularProducts: (raw?.popularProducts || []).map((p: any) => ({
      ...p,
      revenueDzd: p.revenueDzd ?? p.revenue ?? 0,
    })),
  };
};

export const fetchManagementStaffFromBackend = async (): Promise<any> => {
  const raw = await apiFetch<any>(`${MANAGEMENT_API_BASE}/staff`, {}, 'ADMIN');
  return {
    ...raw,
    activeStaffSessionsCount: raw?.securityPosture?.activeStaffSessions ?? 0,
    staffMembers: (raw?.staffMembers || []).map((m: any) => ({
      ...m,
      status: String(m.status || 'Active').toUpperCase() === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
    })),
  };
};

export const addManagementStaffOnBackend = async (payload: {
  staffId?: string;
  name: string;
  role?: string;
  roleTitle?: string;
  shift?: string;
  pin?: string;
}): Promise<{
  success: boolean;
  staffMember: any;
  message: string;
}> => {
  const normalizedRole: 'ADMIN' | 'STAFF' =
    String(payload.role || 'STAFF').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STAFF';
  return apiFetch(
    `${MANAGEMENT_API_BASE}/staff`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        role: normalizedRole,
      }),
    },
    'ADMIN',
  );
};

export const updateManagementStaffOnBackend = async (
  staffId: string,
  updates: {
    name?: string;
    role?: string;
    roleTitle?: string;
    shift?: string;
    status?: string;
  },
): Promise<{
  success: boolean;
  staffMember: any;
  message: string;
}> => {
  const normalizedUpdates: Record<string, any> = { ...updates };
  if (updates.role) {
    normalizedUpdates.role =
      String(updates.role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STAFF';
  }
  if (updates.status) {
    normalizedUpdates.status =
      String(updates.status).toUpperCase() === 'SUSPENDED' ? 'Suspended' : 'Active';
  }
  return apiFetch(
    `${MANAGEMENT_API_BASE}/staff/${encodeURIComponent(staffId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(normalizedUpdates),
    },
    'ADMIN',
  );
};

export const revokeAllStaffSessionsOnBackend = async (): Promise<{
  success: boolean;
  revokedCount: number;
  message: string;
}> => {
  return apiFetch(
    `${MANAGEMENT_API_BASE}/staff/revoke-sessions`,
    { method: 'POST' },
    'ADMIN',
  );
};

export const revokeStaffSessionsOnBackend = revokeAllStaffSessionsOnBackend;

export const fetchManagementSettingsFromBackend = async (): Promise<any> => {
  const raw = await apiFetch<any>(`${MANAGEMENT_API_BASE}/settings`, {}, 'ADMIN');
  const st = raw?.storeSettings || {};
  const lc = raw?.loyaltyConfig || {};
  return {
    ...raw,
    store: {
      storeName: st.storeName || 'VENTY THE COFFEE',
      address: st.address || 'Soufay, RN14, Khemis Miliana 44003, Algeria',
      phone: st.phone || '+213 569 05 59 16',
      email: st.email || 'contact@ventycoffee.dz',
      openingHours: st.openingHours || 'Daily · 07:30 – 23:00',
      orderAheadEnabled: st.orderAcceptingEnabled ?? true,
      orderCutoffTime: st.orderCutoffTime || '22:45',
      preparationEstimate: `${st.defaultPrepMinutes || 15} mins`,
      pickupInstructions:
        st.pickupInstructions || 'Collect at the dedicated VENTY Express Bar counter.',
    },
    loyaltyRules: {
      stampsThreshold: lc.stampsToReward ?? 7,
      minimumOrderTotalDzd: 300,
      rewardExpirationDays: 60,
      welcomeBonusRule: `+${lc.welcomeBonusStamps ?? 2} Welcome Stamps (Awarded Once per Verified Phone)`,
    },
    reviewIntegration: {
      googlePlaceIdMasked: 'ChIJA4...8oDM (Masked)',
      integrationStatus: 'ACTIVE_VERIFIED_CACHE',
      cacheDuration: `${st.googleReviewsCacheMinutes || 15} mins`,
    },
  };
};

export const updateManagementSettingsOnBackend = async (payload: {
  loyaltyConfig?: Partial<LoyaltyConfig>;
  storeSettings?: Record<string, any>;
  storeName?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  orderAheadEnabled?: boolean;
  orderCutoffTime?: string;
  preparationEstimate?: string;
  pickupInstructions?: string;
}): Promise<any> => {
  const storeSettings = payload.storeSettings || {
    storeName: payload.storeName,
    address: payload.address,
    phone: payload.phone,
    email: payload.email,
    openingHours: payload.openingHours,
    orderAcceptingEnabled: payload.orderAheadEnabled,
    orderCutoffTime: payload.orderCutoffTime,
    pickupInstructions: payload.pickupInstructions,
  };
  const res = await apiFetch<any>(
    `${MANAGEMENT_API_BASE}/settings`,
    {
      method: 'PUT',
      body: JSON.stringify({
        loyaltyConfig: payload.loyaltyConfig,
        storeSettings,
      }),
    },
    'ADMIN',
  );
  const st = res?.storeSettings || storeSettings;
  return {
    ...res,
    store: {
      storeName: st.storeName || 'VENTY THE COFFEE',
      address: st.address || '',
      phone: st.phone || '',
      email: payload.email || 'contact@ventycoffee.dz',
      openingHours: st.openingHours || '',
      orderAheadEnabled: st.orderAcceptingEnabled ?? true,
      orderCutoffTime: payload.orderCutoffTime || '22:45',
      preparationEstimate: payload.preparationEstimate || `${st.defaultPrepMinutes || 15} mins`,
      pickupInstructions:
        payload.pickupInstructions || 'Collect at the dedicated VENTY Express Bar counter.',
    },
  };
};

export const fetchManagementAuditLogsFromBackend = async (params: {
  event?: string;
  search?: string;
  limit?: number;
} = {}): Promise<any> => {
  const query = new URLSearchParams();
  if (params.event) query.set('event', params.event);
  if (params.search) query.set('search', params.search);
  if (params.limit) query.set('limit', String(params.limit));
  const raw = await apiFetch<any>(
    `${MANAGEMENT_API_BASE}/audit-logs?${query.toString()}`,
    {},
    'ADMIN',
  );
  const logs: any[] = raw?.logs || [];
  const events = logs.map((l) => ({
    ...l,
    actor: l.actor || l.user || l.adminId || l.staffId || 'SYSTEM',
    role: l.role || 'SYSTEM',
    action: l.action || l.event || 'SYSTEM_EVENT',
    target: l.target || l.resource || l.reference || '—',
    details: l,
  }));
  return {
    ...raw,
    events,
    totalCount: raw?.totalCaptured ?? events.length,
  };
};
