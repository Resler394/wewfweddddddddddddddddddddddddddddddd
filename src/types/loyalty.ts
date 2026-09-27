export type StampSlotState = 'OPEN' | 'STAMPED' | 'REWARD READY' | 'REDEEMED';

export type RewardStatus = 'AVAILABLE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

export interface LoyaltyReward {
  rewardId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  type: 'FREE_DRINK';
  status: RewardStatus;
  issuedAt: string;
  expiresAt?: string;
  redeemedAt?: string;
  redemptionCode: string;
  redemptionToken: string;
  redemptionStaffId?: string;
  redemptionLocation?: string;
  redeemedOrderId?: string;
}

export type LoyaltyTransactionType =
  | 'WELCOME_BONUS'
  | 'PURCHASE_STAMP'
  | 'REWARD_ISSUED'
  | 'REWARD_REDEEMED'
  | 'ADMIN_ADJUSTMENT'
  | 'REVERSAL';

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  customerName?: string;
  orderId?: string;
  type: LoyaltyTransactionType;
  stampsDelta: number;
  timestamp: string;
  source: 'ONLINE_ORDER' | 'SIGNUP_BONUS' | 'COUNTER_SCAN' | 'ADMIN_CONSOLE' | 'SYSTEM';
  status: 'CONFIRMED' | 'REVERSED';
  idempotencyKey: string;
  note: string;
  adminReason?: string;
  adminId?: string;
  previousValue?: number;
  newValue?: number;
}

export interface CustomerProfile {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  favouriteDrink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyAccount extends CustomerProfile {
  currentStampCount: number; // 0 to 7
  lifetimeStamps: number;
  welcomeBonusGranted: boolean;
  loyaltyStatus?: 'Active' | 'Gold' | 'VIP' | 'Pending Verification';
  availableRewards?: LoyaltyReward[];
  redeemedRewards?: LoyaltyReward[];
}

export type LoyaltyCustomer = LoyaltyAccount & {
  id: string;
  availableRewards: LoyaltyReward[];
  redeemedRewards: LoyaltyReward[];
  loyaltyStatus: 'Active' | 'Gold' | 'VIP' | 'Pending Verification';
};

export interface LoyaltyConfig {
  stampsToReward: number; // 7
  welcomeBonusStamps: number; // 2
  stampsPerQualifyingOrder: number; // 1
  qualifyingCategories: string[]; // ['coffee', 'drinks', 'fresh', 'espresso', 'cold', 'filter', 'juice']
}
