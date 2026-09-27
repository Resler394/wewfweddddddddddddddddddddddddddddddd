import {
  CartItem,
  OrderCompletedEventItem,
  OrderCompletedEventPayload,
  OrderStatus,
  PastOrder,
} from '../types/coffee';
import { getAllOfficialProducts } from '../data/officialMenuData';
import { COFFEE_BEANS, FULL_MENU_ITEMS } from '../data/coffeeData';
import {
  getActiveCustomer,
  getAllCustomers,
  processOrderLoyalty,
  setActiveLoyaltyAccount,
  ensureCustomerBackendSession,
  LOYALTY_QUALIFYING_CATEGORIES,
  isQualifyingLoyaltyCategory,
  isQualifyingLoyaltyItem,
} from '../services/loyalty';
import {
  createOrderOnBackend,
  fetchOrderByIdFromBackend,
  fetchMyOrdersFromBackend,
  updateOrderStatusOnBackend,
} from '../services/loyaltyApi';
import {
  formatAlgiersDate,
  formatAlgiersTime,
  formatAlgiersDateTime,
  getAlgiersDateKey,
} from './algiersTime';

const STORAGE_KEY = 'venty_past_orders_v1';
const COMPLETED_EVENTS_KEY = 'venty_order_completed_events_v1';

// In-memory mutex to prevent synchronous race conditions / double-clicks
const inFlightCompletions = new Set<string>();

// Subscribers for external/loyalty hooks listening to onOrderCompleted
type OrderCompletedListener = (payload: OrderCompletedEventPayload) => void;
const orderCompletedListeners = new Set<OrderCompletedListener>();

// Active background timers by orderId so page interactions don't orphan or duplicate transitions
const orderTimers = new Map<string, number[]>();

/**
 * Resolves a product's canonical category from the Venty catalogs
 * (`officialMenuData.ts` and `coffeeData.ts`).
 */
export const resolveProductCategory = (item: {
  id: string;
  name?: string;
  category?: string;
  grind?: string;
}): string => {
  if (item.category) {
    return item.category;
  }

  const allOfficial = getAllOfficialProducts();
  const officialMatch = allOfficial.find(
    (p) =>
      p.id === item.id ||
      (item.name && p.name.toLowerCase() === item.name.toLowerCase()),
  );
  if (officialMatch) {
    return officialMatch.category;
  }

  const featuredMatch = FULL_MENU_ITEMS.find(
    (p) =>
      p.id === item.id ||
      (item.name && p.name.toLowerCase() === item.name.toLowerCase()),
  );
  if (featuredMatch) {
    return featuredMatch.category;
  }

  const beanMatch = COFFEE_BEANS.find(
    (b) => item.id === b.id || item.id.startsWith(`${b.id}-`),
  );
  if (beanMatch || item.grind) {
    return 'beans';
  }

  return 'coffee';
};

/**
 * Normalizes CartItem[] so every item carries its resolved `category`.
 */
export const normalizeOrderItems = (items: CartItem[]): CartItem[] => {
  return items.map((item) => ({
    ...item,
    category: resolveProductCategory(item),
  }));
};

const SAMPLE_ORDERS: PastOrder[] = [
  {
    id: 'VENTY-7241',
    items: [
      {
        id: 'latte-flat-white',
        name: 'Flat White',
        price: 250,
        quantity: 1,
        category: 'coffee',
      },
      {
        id: 'dessert-banque-burnt-cheesecake',
        name: 'Banque Burnt Cheesecake',
        price: 400,
        quantity: 1,
        category: 'desserts',
      },
    ],
    totalAmount: 650,
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(), // 42 mins ago
    completedAt: new Date(Date.now() - 27 * 60 * 1000).toISOString(),
    customerId: 'VENTY-7249',
    customerName: 'Karim',
    customerPhone: '0550123456',
    pickupTime: '15 mins',
    status: 'Ready',
    loyaltyProcessed: true,
    loyaltyEventId: 'order_completed_evt_VENTY-7241',
  },
  {
    id: 'VENTY-6109',
    items: [
      {
        id: 'mojito-classic',
        name: 'Classic Mojito',
        price: 350,
        quantity: 2,
        category: 'drinks',
      },
      {
        id: 'waffle-chocolate',
        name: 'Chocolate Waffles',
        price: 350,
        quantity: 1,
        category: 'sweets',
      },
    ],
    totalAmount: 1050,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
    completedAt: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
    customerId: 'VENTY-7249',
    customerName: 'Karim',
    customerPhone: '0550123456',
    pickupTime: '30 mins',
    status: 'Completed',
    loyaltyProcessed: true,
    loyaltyEventId: 'order_completed_evt_VENTY-6109',
  },
];

const INITIAL_COMPLETED_EVENTS: Record<string, OrderCompletedEventPayload> = {
  'VENTY-7241': {
    idempotencyKey: 'order_completed_evt_VENTY-7241',
    orderId: 'VENTY-7241',
    customerId: 'VENTY-7249',
    customerName: 'Karim',
    customerPhone: '0550123456',
    orderStatus: 'Completed',
    orderItems: [
      {
        productId: 'latte-flat-white',
        name: 'Flat White',
        category: 'coffee',
        quantity: 1,
        unitPrice: 250,
        lineTotal: 250,
      },
      {
        productId: 'dessert-banque-burnt-cheesecake',
        name: 'Banque Burnt Cheesecake',
        category: 'desserts',
        quantity: 1,
        unitPrice: 400,
        lineTotal: 400,
      },
    ],
    productIds: ['latte-flat-white', 'dessert-banque-burnt-cheesecake'],
    productCategories: ['coffee', 'desserts'],
    quantities: {
      'latte-flat-white': 1,
      'dessert-banque-burnt-cheesecake': 1,
    },
    totalQuantity: 2,
    totalAmount: 650,
    completedAt: new Date(Date.now() - 27 * 60 * 1000).toISOString(),
  },
  'VENTY-6109': {
    idempotencyKey: 'order_completed_evt_VENTY-6109',
    orderId: 'VENTY-6109',
    customerId: 'VENTY-7249',
    customerName: 'Karim',
    customerPhone: '0550123456',
    orderStatus: 'Completed',
    orderItems: [
      {
        productId: 'mojito-classic',
        name: 'Classic Mojito',
        category: 'drinks',
        quantity: 2,
        unitPrice: 350,
        lineTotal: 700,
      },
      {
        productId: 'waffle-chocolate',
        name: 'Chocolate Waffles',
        category: 'sweets',
        quantity: 1,
        unitPrice: 350,
        lineTotal: 350,
      },
    ],
    productIds: ['mojito-classic', 'waffle-chocolate'],
    productCategories: ['drinks', 'sweets'],
    quantities: {
      'mojito-classic': 2,
      'waffle-chocolate': 1,
    },
    totalQuantity: 3,
    totalAmount: 1050,
    completedAt: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
  },
};

export const getCompletedOrderEvents = (): Record<
  string,
  OrderCompletedEventPayload
> => {
  try {
    const raw = localStorage.getItem(COMPLETED_EVENTS_KEY);
    if (!raw) {
      localStorage.setItem(
        COMPLETED_EVENTS_KEY,
        JSON.stringify(INITIAL_COMPLETED_EVENTS),
      );
      return { ...INITIAL_COMPLETED_EVENTS };
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? parsed
      : { ...INITIAL_COMPLETED_EVENTS };
  } catch {
    return { ...INITIAL_COMPLETED_EVENTS };
  }
};

const saveCompletedOrderEvent = (payload: OrderCompletedEventPayload): void => {
  try {
    const current = getCompletedOrderEvents();
    current[payload.orderId] = payload;
    localStorage.setItem(COMPLETED_EVENTS_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
};

const enrichClientOrder = (order: PastOrder): PastOrder => {
  const normalizedItems = normalizeOrderItems(order.items || order.orderItems || []);
  const orderId = order.orderId || order.id;
  const createdAt = order.createdAt || new Date().toISOString();
  const updatedAt = order.updatedAt || order.completedAt || createdAt;
  const qualifies =
    order.qualifiesForLoyalty !== undefined
      ? order.qualifiesForLoyalty
      : normalizedItems.some(isQualifyingLoyaltyItem);

  return {
    ...order,
    id: orderId,
    orderId,
    items: normalizedItems,
    orderItems: normalizedItems.map((i) => ({
      ...i,
      productId: i.id,
      unitPrice: i.price,
      lineTotal: i.price * i.quantity,
    })),
    createdAt,
    updatedAt,
    qualifiesForLoyalty: qualifies,
    loyaltyStampAwarded:
      order.loyaltyStampAwarded !== undefined
        ? order.loyaltyStampAwarded
        : Boolean(order.loyaltyProcessed && qualifies && order.status !== 'Cancelled' && order.status !== 'CANCELLED'),
    loyaltyStampsDelta:
      order.loyaltyStampsDelta !== undefined
        ? order.loyaltyStampsDelta
        : order.loyaltyProcessed && qualifies
        ? 1
        : 0,
    algiersDate: order.algiersDate || formatAlgiersDate(createdAt),
    algiersTime: order.algiersTime || formatAlgiersTime(createdAt),
    algiersDateTime: order.algiersDateTime || formatAlgiersDateTime(createdAt),
    algiersDateKey: order.algiersDateKey || getAlgiersDateKey(createdAt),
  };
};

export const getStoredOrders = (): PastOrder[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = SAMPLE_ORDERS.map(enrichClientOrder);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SAMPLE_ORDERS.map(enrichClientOrder);
    return parsed.map((order: PastOrder) => enrichClientOrder(order));
  } catch {
    return SAMPLE_ORDERS.map(enrichClientOrder);
  }
};

/**
 * Returns orders belonging to the currently authenticated customer (or all local orders if guest).
 */
export const getCustomerOrders = (customerId?: string | null): PastOrder[] => {
  const all = getStoredOrders();
  const active = getActiveCustomer();
  const targetCustomerId = customerId !== undefined ? customerId : active?.id || active?.customerId || null;

  if (!targetCustomerId) {
    return [];
  }

  return all
    .filter(
      (o) =>
        o.customerId === targetCustomerId ||
        (active?.phone &&
          o.customerPhone &&
          o.customerPhone.replace(/[\s\-()+.]/g, '') === active.phone.replace(/[\s\-()+.]/g, '')),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Synchronizes the authenticated customer's order history from the backend `/api/orders/my-orders`.
 */
export const syncCustomerOrdersFromBackend = async (): Promise<PastOrder[]> => {
  try {
    await ensureCustomerBackendSession();
    const res = await fetchMyOrdersFromBackend();
    if (res && Array.isArray(res.orders)) {
      const serverOrders = res.orders.map(enrichClientOrder);
      const localOrders = getStoredOrders();
      const serverIds = new Set(serverOrders.map((o) => o.id));
      const merged = [
        ...serverOrders,
        ...localOrders.filter((o) => !serverIds.has(o.id)),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('venty:orders:updated', {
            detail: { orders: merged },
          }),
        );
      }
      return serverOrders;
    }
  } catch {
    // Fallback to local customer orders if unauthenticated or offline
  }
  return getCustomerOrders();
};

/**
 * Resolves the customerId associated with an order using:
 * 1. Explicit `order.customerId`
 * 2. Phone number match in the customer database
 * 3. Currently active customer session
 */
export const resolveOrderCustomerId = (order: PastOrder): string | null => {
  if (order.customerId) {
    return order.customerId;
  }
  if (order.customerPhone) {
    const cleanPhone = order.customerPhone.trim().replace(/\s+/g, '');
    const matched = getAllCustomers().find(
      (c) => c.phone.replace(/\s+/g, '') === cleanPhone,
    );
    if (matched) {
      return matched.id;
    }
  }
  const active = getActiveCustomer();
  return active ? active.id : null;
};

/**
 * Builds the canonical `OrderCompletedEventPayload` from a `PastOrder`.
 */
export const buildOrderCompletedPayload = (
  order: PastOrder,
  completedAtTimestamp?: string,
): OrderCompletedEventPayload => {
  const completedAt =
    completedAtTimestamp || order.completedAt || new Date().toISOString();
  const normalizedItems = normalizeOrderItems(order.items);
  const customerId = resolveOrderCustomerId(order);

  const orderItems: OrderCompletedEventItem[] = normalizedItems.map((item) => {
    const category = resolveProductCategory(item);
    return {
      productId: item.id,
      name: item.name,
      category,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.price * item.quantity,
      notes: item.notes,
      grind: item.grind,
    };
  });

  const quantities: Record<string, number> = {};
  for (const item of orderItems) {
    quantities[item.productId] =
      (quantities[item.productId] || 0) + item.quantity;
  }

  const productIds = Array.from(new Set(orderItems.map((i) => i.productId)));
  const productCategories = Array.from(
    new Set(orderItems.map((i) => i.category)),
  );
  const totalQuantity = orderItems.reduce((sum, i) => sum + i.quantity, 0);

  return {
    idempotencyKey: `order_completed_evt_${order.id}`,
    orderId: order.id,
    customerId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    orderStatus: order.status === 'Completed' ? 'Completed' : order.status,
    orderItems,
    productIds,
    productCategories,
    quantities,
    totalQuantity,
    totalAmount: order.totalAmount,
    completedAt,
  };
};

/**
 * Subscribe to `onOrderCompleted` events cleanly.
 */
export const subscribeToOrderCompleted = (
  listener: OrderCompletedListener,
): (() => void) => {
  orderCompletedListeners.add(listener);
  return () => {
    orderCompletedListeners.delete(listener);
  };
};

/**
 * IDEMPOTENT ORDER COMPLETION HOOK: `onOrderCompleted(order)`
 *
 * Lifecycle flow:
 * MENU -> CART -> CHECKOUT -> ORDER CREATED -> ORDER CONFIRMED -> ORDER COMPLETED -> LOYALTY EVENT -> +1 STAMP
 *
 * Guarantees that the exact same order (`orderId`) will NEVER trigger a duplicate loyalty event,
 * even on page refresh, repeated API/webhook calls, double-clicks, or browser reconnects.
 */
export const onOrderCompleted = (
  orderOrId: PastOrder | string,
): {
  triggered: boolean;
  duplicatePrevented: boolean;
  event: OrderCompletedEventPayload | null;
  loyaltyResult: ReturnType<typeof processOrderLoyalty>;
} => {
  const orders = getStoredOrders();
  const targetOrder =
    typeof orderOrId === 'string'
      ? orders.find((o) => o.id === orderOrId)
      : orderOrId;

  if (!targetOrder) {
    return {
      triggered: false,
      duplicatePrevented: false,
      event: null,
      loyaltyResult: {
        awardedStamp: false,
        unlockedReward: false,
        customer: getActiveCustomer(),
        message: 'Order not found.',
      },
    };
  }

  const orderId = targetOrder.id;
  const completedEvents = getCompletedOrderEvents();

  // Idempotency Guard 1 & 2: Check in-memory lock and persistent completed-events registry
  if (
    inFlightCompletions.has(orderId) ||
    Boolean(completedEvents[orderId]) ||
    targetOrder.loyaltyProcessed === true
  ) {
    const existingEvent =
      completedEvents[orderId] || buildOrderCompletedPayload(targetOrder);
    return {
      triggered: false,
      duplicatePrevented: true,
      event: existingEvent,
      loyaltyResult: {
        awardedStamp: false,
        unlockedReward: false,
        customer: getActiveCustomer(),
        message: `Order #${orderId} completion event already processed (${existingEvent.idempotencyKey}).`,
      },
    };
  }

  // Acquire synchronous lock
  inFlightCompletions.add(orderId);

  try {
    const completedAt = targetOrder.completedAt || new Date().toISOString();
    const resolvedCustomerId = resolveOrderCustomerId(targetOrder);

    const enrichedOrder: PastOrder = {
      ...targetOrder,
      customerId: resolvedCustomerId || undefined,
      items: normalizeOrderItems(targetOrder.items),
      completedAt,
      loyaltyProcessed: true,
      loyaltyEventId: `order_completed_evt_${orderId}`,
    };

    const eventPayload = buildOrderCompletedPayload(enrichedOrder, completedAt);

    // Persist idempotency record first before invoking downstream side effects
    saveCompletedOrderEvent(eventPayload);

    // Update order record in storage
    const updatedOrders = orders.map((o) =>
      o.id === orderId ? enrichedOrder : o,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));

    // Trigger downstream Loyalty Engine (which also enforces its own ledger idempotency key)
    const loyaltyResult = processOrderLoyalty(enrichedOrder);

    // Notify any registered hook subscribers
    orderCompletedListeners.forEach((listener) => {
      try {
        listener(eventPayload);
      } catch {
        // isolate subscriber errors
      }
    });

    // Emit DOM CustomEvent for live UI reactivity across modals/components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('venty:order:completed', {
          detail: {
            event: eventPayload,
            loyaltyResult,
          },
        }),
      );
    }

    return {
      triggered: true,
      duplicatePrevented: false,
      event: eventPayload,
      loyaltyResult,
    };
  } finally {
    inFlightCompletions.delete(orderId);
  }
};

/**
 * Creates a confirmed order on the authoritative backend (`POST /api/orders`)
 * with server-generated `createdAt`, canonical price validation, session-derived `customerId`,
 * and duplicate-order idempotency protection.
 * Throws if the backend request fails so the checkout keeps the cart intact and allows safe retry.
 */
export const createConfirmedOrder = async (params: {
  orderId: string;
  idempotencyKey: string;
  items: CartItem[];
  customerName: string;
  customerPhone?: string;
  pickupTime: string;
  notes?: string;
}): Promise<PastOrder> => {
  await ensureCustomerBackendSession();
  const normalizedItems = normalizeOrderItems(params.items);

  const response = await createOrderOnBackend({
    orderId: params.orderId,
    id: params.orderId,
    idempotencyKey: params.idempotencyKey,
    items: normalizedItems,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    pickupTime: params.pickupTime,
    notes: params.notes,
  });

  if (!response || !response.order) {
    throw new Error('Unable to confirm order with server. Please try again.');
  }

  const authoritativeOrder = enrichClientOrder({
    ...response.order,
    status: response.order.status || 'PENDING',
  });

  const current = getStoredOrders();
  const updated = [
    authoritativeOrder,
    ...current.filter((o) => o.id !== authoritativeOrder.id && o.orderId !== authoritativeOrder.orderId),
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('venty:orders:updated', {
        detail: { order: authoritativeOrder, orders: updated },
      }),
    );
  }

  return authoritativeOrder;
};

/**
 * Fetches the live status of a single order from the backend (`GET /api/orders/:orderId`),
 * updates local order state, and triggers `onOrderCompleted` ONLY when backend confirms `COMPLETED`.
 */
export const refreshOrderStatusFromBackend = async (orderId: string): Promise<PastOrder | null> => {
  try {
    await ensureCustomerBackendSession();
    const res = await fetchOrderByIdFromBackend(orderId);
    if (res && res.order) {
      const synced = enrichClientOrder(res.order);
      const current = getStoredOrders();
      const exists = current.some((o) => o.id === synced.id || o.orderId === synced.orderId);
      const updated = exists
        ? current.map((o) => (o.id === synced.id || o.orderId === synced.orderId ? synced : o))
        : [synced, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      if (String(synced.status).toUpperCase() === 'COMPLETED') {
        onOrderCompleted(synced);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('venty:orders:updated', {
            detail: { order: synced, orders: updated },
          }),
        );
      }
      return synced;
    }
  } catch {
    // Return local order if offline or unauthorized
  }
  return getStoredOrders().find((o) => o.id === orderId || o.orderId === orderId) || null;
};

export const saveOrder = (newOrder: PastOrder): PastOrder[] => {
  try {
    const current = getStoredOrders();
    const resolvedCustomerId = resolveOrderCustomerId(newOrder);
    const nowIso = new Date().toISOString();
    const normalizedOrder: PastOrder = enrichClientOrder({
      ...newOrder,
      orderId: newOrder.orderId || newOrder.id,
      customerId: resolvedCustomerId || undefined,
      items: normalizeOrderItems(newOrder.items),
      createdAt: newOrder.createdAt || nowIso,
      updatedAt: nowIso,
    });
    const updated = [
      normalizedOrder,
      ...current.filter((o) => o.id !== normalizedOrder.id),
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Persist order on authoritative backend with session-derived customerId and server timestamps
    ensureCustomerBackendSession()
      .then(() =>
        createOrderOnBackend({
          orderId: normalizedOrder.id,
          id: normalizedOrder.id,
          idempotencyKey: `order_create_${normalizedOrder.id}`,
          items: normalizedOrder.items,
          customerName: normalizedOrder.customerName,
          customerPhone: normalizedOrder.customerPhone,
          pickupTime: normalizedOrder.pickupTime,
          notes: normalizedOrder.notes,
        }),
      )
      .then((res) => {
        if (res?.order) {
          const enrichedServer = enrichClientOrder(res.order);
          const latest = getStoredOrders().map((o) =>
            o.id === enrichedServer.id ? enrichedServer : o,
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(latest));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('venty:orders:updated', {
                detail: { order: enrichedServer, orders: latest },
              }),
            );
          }
        }
      })
      .catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('venty:orders:updated', {
          detail: { order: normalizedOrder, orders: updated },
        }),
      );
    }

    return updated;
  } catch {
    return [newOrder];
  }
};

export const updateOrderStatus = (
  id: string,
  status: OrderStatus,
  reason?: string,
): PastOrder[] => {
  try {
    const current = getStoredOrders();
    const upperStatus = String(status).toUpperCase();
    // Strictly award loyalty stamp ONLY when the order reaches COMPLETED (never on PENDING, CONFIRMED, or READY)
    const isCompleting = status === 'Completed' || upperStatus === 'COMPLETED';
    const isCancelling = status === 'Cancelled' || upperStatus === 'CANCELLED';
    const nowIso = new Date().toISOString();

    let targetUpdatedOrder: PastOrder | undefined;

    const updated = current.map((order) => {
      if (order.id === id || order.orderId === id) {
        targetUpdatedOrder = enrichClientOrder({
          ...order,
          status,
          updatedAt: nowIso,
          completedAt: isCompleting
            ? order.completedAt || nowIso
            : order.completedAt,
          cancelledAt: isCancelling ? nowIso : order.cancelledAt,
          loyaltyStampAwarded: isCancelling ? false : order.loyaltyStampAwarded,
          loyaltyReversed: isCancelling && order.loyaltyStampAwarded ? true : order.loyaltyReversed,
        });
        return targetUpdatedOrder;
      }
      return order;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Synchronize status transition with backend
    updateOrderStatusOnBackend(id, status, reason)
      .then((res) => {
        if (res?.account) {
          setActiveLoyaltyAccount(res.account);
        }
        if (res?.order) {
          const syncedOrder = enrichClientOrder(res.order);
          const refreshed = getStoredOrders().map((o) =>
            o.id === id || o.orderId === id ? syncedOrder : o,
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('venty:orders:updated', {
                detail: { order: syncedOrder, orders: refreshed },
              }),
            );
          }
        }
      })
      .catch(() => {});

    // When an order reaches COMPLETED, ensure `onOrderCompleted` -> `processOrderLoyalty` fires idempotently
    if (isCompleting && targetUpdatedOrder) {
      onOrderCompleted(targetUpdatedOrder);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('venty:orders:updated', {
          detail: { order: targetUpdatedOrder, orders: updated },
        }),
      );
    }

    return updated;
  } catch {
    return [];
  }
};
