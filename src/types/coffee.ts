export interface MenuItem {
  id: string;
  name: string;
  category: 'espresso' | 'filter' | 'juice' | 'sweets' | 'moments' | 'cold';
  price: number;
  formattedPrice: string;
  description: string;
  tastingNotes?: string[];
  dietary?: string[];
  image: string;
}

export interface CoffeeBean {
  id: string;
  name: string;
  origin: string;
  region: string;
  process: string;
  altitude: string;
  notes: string[];
  roastProfile: 'Light' | 'Medium-Light' | 'Filter Roast';
  price250g: number;
  formattedPrice?: string;
  description: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  rating: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  milk?: string;
  grind?: string;
  notes?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Completed'
  | 'Cancelled'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItemRecord extends CartItem {
  productId?: string;
  unitPrice?: number;
  lineTotal?: number;
}

export interface PastOrder {
  id: string;
  orderId?: string;
  items: CartItem[];
  orderItems?: OrderItemRecord[];
  totalAmount: number;
  createdAt: string;
  completedAt?: string | null;
  updatedAt?: string;
  cancelledAt?: string | null;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string;
  pickupTime: string;
  status: OrderStatus;
  notes?: string;
  qualifiesForLoyalty?: boolean;
  loyaltyProcessed?: boolean;
  loyaltyStampAwarded?: boolean;
  loyaltyStampsDelta?: number;
  loyaltyEventId?: string;
  loyaltyTransactionId?: string;
  loyaltyReversed?: boolean;
  algiersDate?: string;
  algiersTime?: string;
  algiersDateTime?: string;
  algiersDateKey?: string;
}

export interface AdminOrdersDashboardMetrics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  todaySales: number;
  todayQualifyingLoyaltyOrders: number;
  periodSales?: number;
  periodQualifyingLoyaltyOrders?: number;
  algiersTodayKey: string;
  algiersTodayLabel: string;
  timezone: string;
}

export interface OrderCompletedEventItem {
  productId: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
  grind?: string;
}

export interface OrderCompletedEventPayload {
  idempotencyKey: string;
  orderId: string;
  customerId: string | null;
  customerName: string;
  customerPhone?: string;
  orderStatus: OrderStatus;
  orderItems: OrderCompletedEventItem[];
  productIds: string[];
  productCategories: string[];
  quantities: Record<string, number>;
  totalQuantity: number;
  totalAmount: number;
  completedAt: string;
}

