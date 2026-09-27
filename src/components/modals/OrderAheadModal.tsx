import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  Coffee,
  Sparkles,
  History,
  Gift,
  UserCheck,
  UserPlus,
  LogIn,
  AlertCircle,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FULL_MENU_ITEMS } from '../../data/coffeeData';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator';
import { CartItem, OrderStatus, PastOrder } from '../../types/coffee';
import { LoyaltyCustomer } from '../../types/loyalty';
import {
  createConfirmedOrder,
  refreshOrderStatusFromBackend,
  getCustomerOrders,
  normalizeOrderItems,
} from '../../utils/orderStorage';
import {
  getActiveCustomer,
  loginCustomerWithPassword,
  registerCustomerWithPassword,
  isQualifyingLoyaltyItem as isQualifyingDrinkItem,
} from '../../services/loyalty';
import { formatAlgiersDate, formatAlgiersTime } from '../../utils/algiersTime';
import { OrderStatusTracker } from '../OrderStatusTracker';
import { VentyLogo } from '../VentyLogo';

interface OrderAheadModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOpenLoyalty?: () => void;
  onOpenHistory?: () => void;
}

export const OrderAheadModal: React.FC<OrderAheadModalProps> = ({
  isOpen,
  onClose,
  cart,
  setCart,
  onOpenLoyalty,
  onOpenHistory,
}) => {
  const [activeCustomer, setActiveCustomer] = useState<LoyaltyCustomer | null>(() =>
    getActiveCustomer(),
  );
  const [pickupTime, setPickupTime] = useState('15 mins');

  // Checkout Authentication State (when customer is not yet signed in)
  const [authChoice, setAuthChoice] = useState<'none' | 'signin' | 'signup' | 'guest'>('none');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [signInPhone, setSignInPhone] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpFavoriteDrink, setSignUpFavoriteDrink] = useState('');
  const [authFeedback, setAuthFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [authShakeKey, setAuthShakeKey] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const triggerCheckoutAuthError = (message: string) => {
    setAuthFeedback({ type: 'error', message });
    setAuthShakeKey((prev) => prev + 1);
  };

  // Order Confirmation & Submission State
  const [confirmedOrder, setConfirmedOrder] = useState<PastOrder | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Stable orderId & idempotencyKey per checkout attempt so retries/double-taps never duplicate
  const pendingOrderAttemptRef = useRef<{ orderId: string; idempotencyKey: string } | null>(null);

  // Synchronize authenticated customer state when modal opens or loyalty state updates
  useEffect(() => {
    const syncCustomer = () => {
      const current = getActiveCustomer();
      setActiveCustomer(current);
      if (current) {
        setAuthChoice('none');
      }
    };

    if (isOpen) {
      syncCustomer();
      setCheckoutError(null);
    }

    window.addEventListener('venty:loyalty:updated', syncCustomer);
    window.addEventListener('venty-loyalty-updated', syncCustomer);
    return () => {
      window.removeEventListener('venty:loyalty:updated', syncCustomer);
      window.removeEventListener('venty-loyalty-updated', syncCustomer);
    };
  }, [isOpen]);

  // Reset stable checkout attempt ID only when cart items actually change before confirmation
  const cartSignature = cart.map((i) => `${i.id}:${i.quantity}:${i.notes || ''}`).join('|');
  useEffect(() => {
    if (!confirmedOrder && !isSubmittingRef.current) {
      pendingOrderAttemptRef.current = null;
    }
  }, [cartSignature, confirmedOrder]);

  // Listen to storage-layer and backend order status updates for the confirmed order
  useEffect(() => {
    if (!confirmedOrder) return;
    const targetOrderId = confirmedOrder.orderId || confirmedOrder.id;

    const handleOrderUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ order?: PastOrder }>;
      const updated = customEvent.detail?.order;
      if (updated && (updated.id === targetOrderId || updated.orderId === targetOrderId)) {
        setConfirmedOrder(updated);
      }
    };

    // Poll backend order status every 5s while confirmation screen is open
    const interval = window.setInterval(() => {
      refreshOrderStatusFromBackend(targetOrderId).then((fresh) => {
        if (fresh) setConfirmedOrder(fresh);
      });
    }, 5000);

    window.addEventListener('venty:orders:updated', handleOrderUpdate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('venty:orders:updated', handleOrderUpdate);
    };
  }, [confirmedOrder]);

  if (!isOpen) return null;

  const updateQuantity = (id: string, delta: number) => {
    setCheckoutError(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const removeItem = (id: string) => {
    setCheckoutError(null);
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const addItemDirectly = (item: (typeof FULL_MENU_ITEMS)[0]) => {
    setCheckoutError(null);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          category: item.category,
        },
      ];
    });
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const hasQualifyingDrinksInCart = cart.some(isQualifyingDrinkItem);

  // Customer Sign In During Checkout (Phone Number + Password -> Server Authentication -> Customer Session)
  const handleCheckoutSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFeedback(null);
    if (!signInPhone.trim() || !signInPassword) {
      triggerCheckoutAuthError('Please enter both your phone number and password.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const res = await loginCustomerWithPassword({
        phone: signInPhone.trim(),
        password: signInPassword,
      });
      if (res.success && res.customer) {
        setActiveCustomer(res.customer);
        setAuthChoice('none');
        setSignInPhone('');
        setSignInPassword('');
        setAuthFeedback({
          type: 'success',
          message: `Signed in as ${res.customer.name} (${res.customer.currentStampCount}/7 stamps). Your cart is ready to confirm.`,
        });
      } else {
        triggerCheckoutAuthError(res.message || 'Invalid phone number or password.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // New Customer Signup During Checkout (+2 Welcome Stamps granted once upon registration)
  const handleCheckoutSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFeedback(null);
    if (!signUpName.trim() || !signUpPhone.trim()) {
      triggerCheckoutAuthError('Full Name and Phone Number are required to create your account.');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 8) {
      triggerCheckoutAuthError('Password must be at least 8 characters long.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      triggerCheckoutAuthError('Passwords do not match. Please confirm your password.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const res = await registerCustomerWithPassword({
        name: signUpName.trim(),
        phone: signUpPhone.trim(),
        password: signUpPassword,
        confirmPassword: signUpConfirmPassword,
        email: signUpEmail.trim() || undefined,
        favouriteDrink: signUpFavoriteDrink.trim() || undefined,
      });

      if (res.success && res.customer) {
        setActiveCustomer(res.customer);
        setAuthChoice('none');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
        setAuthFeedback({
          type: 'success',
          message: `Welcome, ${res.customer.name}! +2 Welcome Stamps added (${res.customer.currentStampCount}/7). Your cart is preserved below.`,
        });
      } else {
        triggerCheckoutAuthError(
          res.message || 'Could not complete registration. Please check your details.',
        );
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Explicit Order Confirmation (Sections 7, 8, 9, 10, 12, 16)
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || confirmedOrder || isSubmittingRef.current) return;

    const currentCustomer = getActiveCustomer() || activeCustomer;
    if (!currentCustomer && authChoice !== 'guest') {
      setCheckoutError('Please Sign In, Create Account, or choose Guest Order above to confirm your order.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setCheckoutError(null);

    // Ensure stable orderId & idempotencyKey for this checkout attempt (retry-safe & double-click-safe)
    if (!pendingOrderAttemptRef.current) {
      const generatedId = `VENTY-${Math.floor(1000 + Math.random() * 9000)}`;
      pendingOrderAttemptRef.current = {
        orderId: generatedId,
        idempotencyKey: `checkout_${generatedId}_${Date.now()}`,
      };
    }

    const { orderId: targetOrderId, idempotencyKey } = pendingOrderAttemptRef.current;

    try {
      const createdOrder = await createConfirmedOrder({
        orderId: targetOrderId,
        idempotencyKey,
        items: normalizeOrderItems([...cart]),
        customerName: currentCustomer ? currentCustomer.name : guestName.trim() || 'Valued Guest',
        customerPhone: currentCustomer ? currentCustomer.phone : guestPhone.trim() || undefined,
        pickupTime,
      });

      // Order succeeded on server: transition to Order Confirmed screen & clear cart
      setConfirmedOrder(createdOrder);
      setCart([]);
      pendingOrderAttemptRef.current = null;
    } catch (err: any) {
      // Section 16: Failed checkout preserves cart, does not award loyalty, shows clear error, allows retry
      setCheckoutError(
        err?.message ||
          'We could not confirm your order right now. Your cart has been preserved — please try again.',
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Section 17: Abandoned checkout (closing before confirmation creates no order and keeps cart)
  const handleCloseModal = () => {
    if (confirmedOrder) {
      setConfirmedOrder(null);
      setCheckoutError(null);
      setAuthFeedback(null);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
    onClose();
  };

  const handleViewMyOrder = () => {
    setConfirmedOrder(null);
    setCheckoutError(null);
    setAuthFeedback(null);
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    onClose();
    if (onOpenHistory) {
      onOpenHistory();
    }
  };

  const confirmedStatusUpper = confirmedOrder
    ? String(confirmedOrder.status || 'PENDING').toUpperCase()
    : 'PENDING';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleCloseModal}
    >
      <div
        className="relative w-full max-w-2xl bg-[#faf6ef] border border-[#ded7c8] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-[#221a14] rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#ded7c8] flex items-center justify-between bg-[#faf6ef] shrink-0">
          <div className="flex items-center gap-3">
            <VentyLogo
              className="h-9 w-auto max-w-[140px]"
              imgClassName="h-full w-auto max-h-9 max-w-[140px] object-contain block"
            />
            <div>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8a7b70] block">
                VENTY THE COFFEE · Miliana
              </span>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#221a14]">
                {confirmedOrder ? 'Order Confirmed' : 'Order Ahead / Checkout'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!confirmedOrder && onOpenHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#6b3a1f] hover:text-[#351016] border border-[#ded7c8] bg-[#f5efe3] hover:bg-[#ede4d4] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                title="View My Orders & Status History"
              >
                <History className="w-3.5 h-3.5 text-[#c9833a]" />
                <span className="hidden sm:inline">My Orders</span>
              </button>
            )}
            <button
              onClick={handleCloseModal}
              className="p-2 text-[#7a6b61] hover:text-[#221a14] hover:bg-[#eee9de] rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {confirmedOrder ? (
            /* ============================================================
               SECTION 12 & 13: CUSTOMER ORDER CONFIRMATION & TRACKING SCREEN
               ============================================================ */
            <div className="text-center py-4 space-y-5">
              <div className="w-14 h-14 bg-[#2e7d32]/10 text-[#2e7d32] flex items-center justify-center mx-auto rounded-full">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <span className="font-sans uppercase tracking-[0.18em] text-[11px] font-bold text-[#2e7d32] block">
                  ORDER CONFIRMED
                </span>
                <span className="inline-block font-mono text-xs font-bold text-[#351016] bg-[#eee9de] px-3.5 py-1 rounded-full border border-[#ded7c8]">
                  Order #{confirmedOrder.orderId || confirmedOrder.id}
                </span>
                <p className="font-sans text-xs text-[#7a6b61] pt-1">
                  {confirmedOrder.algiersDate || formatAlgiersDate(confirmedOrder.createdAt)} ·{' '}
                  {confirmedOrder.algiersTime || formatAlgiersTime(confirmedOrder.createdAt)} (Africa/Algiers)
                </p>
              </div>

              {/* Current Status Pill */}
              <div className="inline-flex items-center gap-2 bg-[#faf6ee] border border-[#ded7c8] px-4 py-1.5 rounded-full text-xs">
                <span className="text-[#7a6b61] font-sans">Current status:</span>
                <strong className="font-mono uppercase text-[#351016]">{confirmedStatusUpper}</strong>
              </div>

              {/* Section 14: Loyalty Stamp Banner — Shown ONLY when COMPLETED and stamp awarded */}
              {confirmedStatusUpper === 'COMPLETED' && confirmedOrder.loyaltyStampAwarded ? (
                <div className="bg-[#fcf8f2] border-2 border-[#2e7d32]/60 p-4 rounded-2xl max-w-md mx-auto text-left flex items-start gap-3 shadow-xs">
                  <div className="w-9 h-9 bg-[#2e7d32]/15 text-[#2e7d32] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-sans tracking-wider font-bold text-[#2e7d32] block">
                      +1 Loyalty Stamp
                    </span>
                    <p className="font-serif font-semibold text-sm text-[#2d1217]">
                      Your qualifying order is completed and +1 Loyalty Stamp has been added to your card!
                    </p>
                  </div>
                </div>
              ) : activeCustomer ? (
                <div className="bg-[#faf6ee] border border-[#c9833a]/40 px-4 py-3 rounded-xl max-w-md mx-auto text-xs text-[#381c10] flex items-center justify-center gap-2.5 text-left">
                  <Sparkles className="w-4 h-4 text-[#c9833a] shrink-0" />
                  <span>
                    Order connected to your <strong>VENTY Loyalty Card</strong> — your stamp will be added when the order is completed.
                  </span>
                </div>
              ) : (
                <div className="bg-[#faf6ee] border border-[#c9833a]/60 p-4 rounded-2xl max-w-md mx-auto text-left space-y-2.5 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <Coffee className="w-4 h-4 text-[#c9833a] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-serif font-bold text-sm text-[#221a14]">
                        Connect Qualifying Orders to Venty Loyalty
                      </p>
                      <p className="font-sans text-xs text-[#59493f] leading-relaxed">
                        Sign in or create a free Venty account so qualifying orders are connected to your{' '}
                        <strong>VENTY Loyalty Card</strong> (+2 welcome stamps on new verified accounts).
                      </p>
                    </div>
                  </div>
                  {onOpenLoyalty && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={onOpenLoyalty}
                        className="bg-[#351016] hover:bg-[#c9833a] text-[#faf6ef] px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Sign In / Join Venty Loyalty →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Real Backend Order Status Tracker (Section 13) */}
              <div className="max-w-md mx-auto text-left">
                <OrderStatusTracker
                  status={confirmedOrder.status}
                  pickupTime={confirmedOrder.pickupTime}
                  orderId={confirmedOrder.orderId || confirmedOrder.id}
                />
              </div>

              {/* Confirmed Order Receipt Summary (Section 12) */}
              <div className="bg-[#eee9de] p-5 max-w-md mx-auto text-left border border-[#ded7c8] space-y-2.5 font-mono text-xs rounded-xl">
                <div className="flex justify-between border-b border-[#ded7c8] pb-2 text-[#6b3a1f] font-sans font-bold">
                  <span>{confirmedOrder.customerName}</span>
                  <span>{confirmedOrder.customerPhone || ''}</span>
                </div>
                <div className="space-y-1.5 py-1">
                  {(confirmedOrder.items || []).map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex justify-between text-[#221a14] font-sans">
                      <span>
                        {item.name} × {item.quantity}
                        {item.notes ? ` (${item.notes})` : ''}
                      </span>
                      <span className="font-semibold">
                        {(item.price * item.quantity).toLocaleString()} DA
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#ded7c8] pt-2 flex justify-between font-bold text-[#221a14] text-sm font-sans">
                  <span>TOTAL</span>
                  <span>{confirmedOrder.totalAmount.toLocaleString()} DA</span>
                </div>
                <div className="pt-1 text-[11px] text-[#7a6b61] font-sans flex items-center justify-between">
                  <span>
                    Date: {confirmedOrder.algiersDate || formatAlgiersDate(confirmedOrder.createdAt)}
                  </span>
                  <span>
                    Time: {confirmedOrder.algiersTime || formatAlgiersTime(confirmedOrder.createdAt)}
                  </span>
                </div>
              </div>

              {/* Primary Action: [ View My Order ] (Section 12) */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {onOpenHistory && (
                  <button
                    type="button"
                    onClick={handleViewMyOrder}
                    className="bg-[#351016] hover:bg-[#c9833a] text-[#faf6ef] px-6 py-3 text-xs sm:text-sm font-semibold rounded-full transition-colors cursor-pointer shadow-sm inline-flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    <span>View My Order</span>
                  </button>
                )}

                {onOpenLoyalty && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      onOpenLoyalty();
                    }}
                    className="border border-[#c9833a] text-[#8a531e] px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-[#eee9de] rounded-full transition-colors cursor-pointer"
                  >
                    My Loyalty Card →
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="border border-[#ded7c8] text-[#59493f] px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-[#eee9de] rounded-full transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Recent Order Tracker for the Authenticated Customer (if any) */}
              {(() => {
                const customerActiveOrders = getCustomerOrders().filter((o) => {
                  const st = String(o.status || '').toUpperCase();
                  return st === 'PENDING' || st === 'CONFIRMED' || st === 'PREPARING' || st === 'READY';
                });
                if (customerActiveOrders.length === 0) return null;
                const latestActive = customerActiveOrders[0];

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-sans uppercase text-[10px] tracking-wider text-[#8a7a6f] font-semibold">
                        Active Order in Progress
                      </span>
                      {onOpenHistory && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenHistory();
                          }}
                          className="text-[11px] text-[#6b3a1f] hover:underline font-medium cursor-pointer"
                        >
                          View My Orders →
                        </button>
                      )}
                    </div>
                    <OrderStatusTracker
                      status={latestActive.status}
                      pickupTime={latestActive.pickupTime}
                      orderId={latestActive.orderId || latestActive.id}
                      compact
                    />
                  </div>
                );
              })()}

              {/* Loyalty Stamp Information Banner */}
              {onOpenLoyalty && (
                <div className="bg-[#eee9de] border border-[#c9833a]/40 p-3.5 flex items-center justify-between gap-3 text-xs rounded-xl">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-[#c9833a] shrink-0" />
                    <span className="text-[#381c10]">
                      {hasQualifyingDrinksInCart ? (
                        <>
                          Qualifying drinks in this order earn <strong>+1 Loyalty Stamp</strong> once completed.
                        </>
                      ) : (
                        <>
                          Add any coffee, cooler, or fresh juice to earn <strong>+1 Loyalty Stamp</strong> upon completion.
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLoyalty();
                    }}
                    className="underline text-[#6b3a1f] hover:text-[#381c10] font-semibold shrink-0 cursor-pointer"
                  >
                    Stamp Card →
                  </button>
                </div>
              )}

              {/* ============================================================
                  SECTION 3: CART ITEMS LIST (PRODUCT, QTY, UNIT PRICE, LINE TOTAL, SUBTOTAL, TOTAL)
                  ============================================================ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-sans uppercase text-[11px] font-semibold tracking-wider text-[#8a7b70]">
                    Your Order Tray ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
                  </h4>
                  {cart.length > 0 && (
                    <span className="font-mono text-xs font-semibold text-[#351016]">
                      Subtotal: {subtotal.toLocaleString()} DA
                    </span>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="bg-[#eee9de] p-8 text-center border border-[#ded7c8] rounded-xl space-y-3">
                    <Coffee className="w-8 h-8 text-[#8a7b70] mx-auto" />
                    <p className="font-sans text-sm text-[#59493f]">
                      Your order tray is empty. Select from our specialty coffee, juices, or sweets below!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#ded7c8] border border-[#ded7c8] bg-white rounded-xl overflow-hidden">
                    {cart.map((item) => {
                      const lineTotal = item.price * item.quantity;
                      return (
                        <div
                          key={`${item.id}-${item.notes || ''}`}
                          className="p-3.5 sm:p-4 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-serif font-medium text-base text-[#221a14] truncate">
                              {item.name}
                            </p>
                            {item.notes && (
                              <p className="text-[11px] text-[#614f44] truncate">{item.notes}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 text-xs font-sans mt-0.5">
                              <span className="text-[#7a6b61]">
                                {item.price.toLocaleString()} DA each
                              </span>
                              <span className="text-[#ded7c8]">·</span>
                              <span className="text-[#c9833a] font-semibold">
                                Line Total: {lineTotal.toLocaleString()} DA
                              </span>
                            </div>
                          </div>

                          {/* Quantity controls (+ / - / Remove) with large mobile touch targets */}
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center border border-[#ded7c8] text-[#59493f] hover:bg-[#eee9de] rounded-lg cursor-pointer"
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center border border-[#ded7c8] text-[#59493f] hover:bg-[#eee9de] rounded-lg cursor-pointer"
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="ml-1 text-[#8a7b70] hover:text-red-700 p-1.5 cursor-pointer"
                              title="Remove item"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Cart Subtotal & Total Footer */}
                    <div className="bg-[#faf6ef] px-4 py-3 flex items-center justify-between text-xs font-sans">
                      <span className="text-[#7a6b61] uppercase tracking-wider font-semibold">
                        Order Subtotal ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
                      </span>
                      <span className="font-mono font-bold text-sm text-[#221a14]">
                        {subtotal.toLocaleString()} DA
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Add Section */}
              <div className="pt-1">
                <h4 className="font-sans uppercase text-[11px] font-semibold tracking-wider text-[#8a7b70] mb-2.5">
                  Quick Add Favorites
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FULL_MENU_ITEMS.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItemDirectly(item)}
                      className="p-2.5 text-left border border-[#ded7c8] bg-[#faf6ef] hover:bg-[#eee9de] transition-colors rounded-lg flex flex-col justify-between cursor-pointer"
                    >
                      <span className="font-serif font-medium text-xs text-[#221a14] line-clamp-1">
                        {item.name}
                      </span>
                      <span className="font-sans text-[11px] font-semibold text-[#c9833a] mt-1">
                        +{item.price.toLocaleString()} DA
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ============================================================
                  SECTIONS 4, 5, 6, 7: CHECKOUT AUTHENTICATION & ORDER CONFIRMATION
                  ============================================================ */}
              {cart.length > 0 && (
                <div className="pt-4 border-t border-[#ded7c8] space-y-5">
                  {/* Auth Feedback Banner */}
                  {authFeedback && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs font-sans flex items-center gap-2.5 ${
                        authFeedback.type === 'success'
                          ? 'bg-[#2e7d32]/10 border-[#2e7d32]/30 text-[#2e7d32]'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      {authFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{authFeedback.message}</span>
                    </div>
                  )}

                  {!activeCustomer ? (
                    /* ========================================================
                       SECTION 4: IF NOT AUTHENTICATED -> CONTINUE AS CUSTOMER
                       [ Sign In ]   [ Create Account ]
                       ======================================================== */
                    <div className="bg-[#eee9de] border border-[#ded7c8] p-4 sm:p-5 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8a531e] font-bold block">
                            CONTINUE AS CUSTOMER
                          </span>
                          <h5 className="font-serif font-bold text-lg text-[#221a14]">
                            Sign in or create your account to confirm order
                          </h5>
                          <p className="font-sans text-xs text-[#59493f] mt-0.5">
                            Your current cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}) will be preserved. New accounts receive <strong>+2 Welcome Bonus Stamps</strong> once.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthFeedback(null);
                              setAuthChoice('signin');
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              authChoice === 'signin'
                                ? 'bg-[#351016] text-[#faf6ef] shadow-xs'
                                : 'bg-white text-[#351016] border border-[#ded7c8] hover:bg-[#faf6ef]'
                            }`}
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Sign In</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAuthFeedback(null);
                              setAuthChoice('signup');
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              authChoice === 'signup'
                                ? 'bg-[#c9833a] text-white shadow-xs'
                                : 'bg-[#351016] text-[#faf6ef] hover:bg-[#c9833a]'
                            }`}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Create Account</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAuthFeedback(null);
                              setAuthChoice('guest');
                            }}
                            className={`px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              authChoice === 'guest'
                                ? 'bg-[#59493f] text-[#faf6ef] shadow-xs'
                                : 'bg-transparent text-[#59493f] border border-[#ded7c8] hover:bg-white'
                            }`}
                          >
                            <span>Guest Order</span>
                          </button>
                        </div>
                      </div>

                      {/* SECTION 6: INLINE CUSTOMER SIGN IN (PHONE NUMBER + PASSWORD) */}
                      {authChoice === 'signin' && (
                        <motion.form
                          key={`checkout-signin-${authShakeKey}`}
                          animate={
                            authShakeKey > 0 && !prefersReducedMotion
                              ? { x: [0, -8, 8, -5, 5, -2, 2, 0] }
                              : { x: 0 }
                          }
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          onSubmit={handleCheckoutSignIn}
                          className={`bg-white border p-4 rounded-xl space-y-3 transition-colors ${
                            authFeedback?.type === 'error' ? 'border-red-300' : 'border-[#ded7c8]'
                          }`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-serif font-bold text-sm text-[#221a14]">
                              Sign In to VENTY Loyalty
                            </span>
                            <div className="flex items-center gap-3">
                              {onOpenLoyalty && (
                                <button
                                  type="button"
                                  onClick={onOpenLoyalty}
                                  className="text-[11px] text-[#6b3a1f] hover:underline font-medium cursor-pointer"
                                >
                                  Forgot Password?
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setAuthChoice('signup')}
                                className="text-[11px] text-[#c9833a] hover:underline font-medium cursor-pointer"
                              >
                                Create Account →
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block font-sans text-[11px] font-semibold text-[#59493f] mb-1">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                required
                                autoComplete="tel"
                                value={signInPhone}
                                onChange={(e) => setSignInPhone(e.target.value)}
                                placeholder="e.g. 0550 12 34 56"
                                className="w-full px-3.5 py-2.5 border border-[#ded7c8] bg-[#faf6ef] text-sm font-mono rounded-lg focus:outline-none focus:border-[#351016]"
                              />
                            </div>
                            <div>
                              <label className="block font-sans text-[11px] font-semibold text-[#59493f] mb-1">
                                Password *
                              </label>
                              <div className="relative">
                                <input
                                  type={showSignInPassword ? 'text' : 'password'}
                                  required
                                  autoComplete="current-password"
                                  value={signInPassword}
                                  onChange={(e) => setSignInPassword(e.target.value)}
                                  placeholder="Enter your password"
                                  className="w-full pl-3.5 pr-10 py-2.5 border border-[#ded7c8] bg-[#faf6ef] text-sm rounded-lg focus:outline-none focus:border-[#351016]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowSignInPassword((prev) => !prev)}
                                  aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                                  aria-pressed={showSignInPassword}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#7a6b61] hover:text-[#351016] hover:bg-[#eee9de] transition-colors cursor-pointer"
                                >
                                  {showSignInPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={isAuthenticating}
                              className="w-full sm:w-auto bg-[#351016] hover:bg-[#c9833a] text-[#faf6ef] px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {isAuthenticating ? 'Signing In...' : 'SIGN IN'}
                            </button>
                          </div>
                        </motion.form>
                      )}

                      {/* SECTION 5: INLINE CUSTOMER SIGNUP DURING CHECKOUT */}
                      {authChoice === 'signup' && (
                        <motion.form
                          key={`checkout-signup-${authShakeKey}`}
                          animate={
                            authShakeKey > 0 && !prefersReducedMotion
                              ? { x: [0, -8, 8, -5, 5, -2, 2, 0] }
                              : { x: 0 }
                          }
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          onSubmit={handleCheckoutSignUp}
                          className={`bg-white border p-4 rounded-xl space-y-3 transition-colors ${
                            authFeedback?.type === 'error' ? 'border-red-300' : 'border-[#ded7c8]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-sm text-[#221a14]">
                              Create Customer Account (+2 Welcome Stamps)
                            </span>
                            <button
                              type="button"
                              onClick={() => setAuthChoice('signin')}
                              className="text-[11px] text-[#6b3a1f] hover:underline font-medium cursor-pointer"
                            >
                              Already registered? Sign In →
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-sans text-[11px] font-semibold text-[#59493f] mb-1">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                required
                                autoComplete="name"
                                value={signUpName}
                                onChange={(e) => setSignUpName(e.target.value)}
                                placeholder="e.g. Karim Benali"
                                className="w-full px-3.5 py-2.5 border border-[#ded7c8] bg-[#faf6ef] text-sm rounded-lg focus:outline-none focus:border-[#351016]"
                              />
                            </div>
                            <div>
                              <label className="block font-sans text-[11px] font-semibold text-[#59493f] mb-1">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                required
                                autoComplete="tel"
                                value={signUpPhone}
                                onChange={(e) => setSignUpPhone(e.target.value)}
                                placeholder="e.g. 0550 12 34 56"
                                className="w-full px-3.5 py-2.5 border border-[#ded7c8] bg-[#faf6ef] text-sm font-mono rounded-lg focus:outline-none focus:border-[#351016]"
                              />
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-sans text-[11px] font-semibold text-[#59493f] mb-1">
                                  Password *
                                </label>
                                <div className="relative">
                                  <input
                                    type={showSignUpPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={signUpPassword}
                                    onChange={(e) => setSignUpPassword(e.target.value)}
                                    placeholder="Min. 8 characters"
                                    className="w-full pl-3.5 pr-10 py-2.5 border border-[#ded7c8] bg-[#faf6ef] text-sm rounded-lg focus:outline-none focus:border-[#351016]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowSignUpPassword((prev) => !prev)}
                                    aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                                    aria-pressed={showSignUpPassword}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#7a6b61] hover:text-[#351016] hover:bg-[#eee9de] transition-colors cursor-pointer"
                                  >
                                    {showSignUpPassword ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block font-sans text-[11px] font-semibold text-[#59493f] mb-1">
                                  Confirm Password *
                                </label>
                                <div className="relative">
                                  <input
                                    type={showSignUpConfirmPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={signUpConfirmPassword}
                                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    className="w-full pl-3.5 pr-10 py-2.5 border border-[#ded7c8] bg-[#faf6ef] text-sm rounded-lg focus:outline-none focus:border-[#351016]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowSignUpConfirmPassword((prev) => !prev)}
                                    aria-label={showSignUpConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                    aria-pressed={showSignUpConfirmPassword}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#7a6b61] hover:text-[#351016] hover:bg-[#eee9de] transition-colors cursor-pointer"
                                  >
                                    {showSignUpConfirmPassword ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Real-time Password Strength Indicator */}
                            <PasswordStrengthIndicator password={signUpPassword} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-sans text-[11px] font-semibold text-[#59493f] mb-1">
                                Email (Optional)
                              </label>
                              <input
                                type="email"
                                autoComplete="email"
                                value={signUpEmail}
                                onChange={(e) => setSignUpEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full px-3.5 py-2 border border-[#ded7c8] bg-[#faf6ef] text-sm rounded-lg focus:outline-none focus:border-[#351016]"
                              />
                            </div>
                            <div>
                              <label className="block font-sans text-[11px] font-semibold text-[#59493f] mb-1">
                                Favourite Drink (Optional)
                              </label>
                              <input
                                type="text"
                                value={signUpFavoriteDrink}
                                onChange={(e) => setSignUpFavoriteDrink(e.target.value)}
                                placeholder="e.g. Spanish Latte"
                                className="w-full px-3.5 py-2 border border-[#ded7c8] bg-[#faf6ef] text-sm rounded-lg focus:outline-none focus:border-[#351016]"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              disabled={isAuthenticating}
                              className="w-full sm:w-auto bg-[#351016] hover:bg-[#c9833a] text-[#faf6ef] px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              {isAuthenticating ? 'Creating Account...' : 'CREATE ACCOUNT'}
                            </button>
                          </div>
                        </motion.form>
                      )}

                      {/* GUEST CHECKOUT OPTION (ALLOWS GUEST ORDERS WITHOUT BLOCKING CHECKOUT) */}
                      {authChoice === 'guest' && (
                        <form
                          onSubmit={handleConfirmOrder}
                          className="bg-white border border-[#ded7c8] p-4 rounded-xl space-y-3.5"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-serif font-bold text-sm text-[#221a14]">
                              Continue as Guest (Pickup at Counter)
                            </span>
                            <button
                              type="button"
                              onClick={() => setAuthChoice('signup')}
                              className="text-[11px] text-[#c9833a] hover:underline font-medium cursor-pointer"
                            >
                              Want +2 Free Stamps? Create Account →
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-sans text-[11px] font-semibold text-[#59493f] mb-1">
                                Pickup Name (Optional)
                              </label>
                              <input
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="e.g. Valued Guest"
                                className="w-full px-3.5 py-2 border border-[#ded7c8] bg-[#faf6ef] text-sm rounded-lg focus:outline-none focus:border-[#351016]"
                              />
                            </div>
                            <div>
                              <label className="block font-sans text-[11px] font-semibold text-[#59493f] mb-1">
                                Ready for Pickup in
                              </label>
                              <div className="grid grid-cols-3 gap-1.5">
                                {['10 mins', '15 mins', '30 mins'].map((time) => (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => setPickupTime(time)}
                                    className={`py-2 text-xs font-medium border rounded-lg transition-colors cursor-pointer ${
                                      pickupTime === time
                                        ? 'bg-[#351016] text-[#faf6ef] border-[#351016]'
                                        : 'bg-[#faf6ef] text-[#59493f] border-[#ded7c8] hover:bg-[#eee9de]'
                                    }`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {checkoutError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{checkoutError}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3 pt-1">
                            <span className="font-serif font-bold text-base text-[#351016]">
                              Total: {subtotal.toLocaleString()} DA
                            </span>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="bg-[#351016] hover:bg-[#c9833a] disabled:opacity-60 text-[#faf6ef] px-6 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                            >
                              {isSubmitting ? 'Confirming Order...' : 'Confirm Order'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    /* ========================================================
                       SECTION 7: FINAL ORDER CONFIRMATION SUMMARY (AUTHENTICATED)
                       ======================================================== */
                    <form onSubmit={handleConfirmOrder} className="space-y-4">
                      {/* Pickup Time Selector */}
                      <div>
                        <label className="block font-sans text-xs font-medium text-[#59493f] mb-1.5">
                          Ready for Pickup at Counter in
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['10 mins', '15 mins', '30 mins'].map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setPickupTime(time)}
                              className={`py-2.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer ${
                                pickupTime === time
                                  ? 'bg-[#351016] text-[#faf6ef] border-[#351016]'
                                  : 'bg-white text-[#59493f] border-[#ded7c8] hover:bg-[#faf6ef]'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Final Order Confirmation Card (CUSTOMER / ORDER / TOTAL) */}
                      <div className="bg-[#eee9de] border border-[#ded7c8] p-4 sm:p-5 rounded-2xl space-y-3.5">
                        <div className="flex items-center justify-between border-b border-[#ded7c8] pb-2.5">
                          <div>
                            <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8a7b70] font-bold block">
                              CUSTOMER
                            </span>
                            <p className="font-serif font-bold text-base text-[#221a14]">
                              {activeCustomer.name}
                            </p>
                            <p className="font-mono text-xs text-[#59493f]">
                              {activeCustomer.phone}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 bg-white border border-[#ded7c8] px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold text-[#351016]">
                              <UserCheck className="w-3.5 h-3.5 text-[#2e7d32]" />
                              {activeCustomer.customerId || activeCustomer.id}
                            </span>
                            <span className="block text-[11px] font-sans text-[#7a6b61] mt-1">
                              Loyalty Balance: <strong>{activeCustomer.currentStampCount}/7 Stamps</strong>
                            </span>
                          </div>
                        </div>

                        {/* ORDER Items Summary */}
                        <div className="space-y-1.5">
                          <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8a7b70] font-bold block">
                            ORDER
                          </span>
                          {cart.map((item) => (
                            <div
                              key={`summary-${item.id}-${item.notes || ''}`}
                              className="flex items-center justify-between text-xs font-sans text-[#221a14]"
                            >
                              <span>
                                {item.name} × {item.quantity}
                                {item.notes ? ` (${item.notes})` : ''}
                              </span>
                              <span className="font-mono font-semibold">
                                {(item.price * item.quantity).toLocaleString()} DA
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* TOTAL */}
                        <div className="border-t border-[#ded7c8] pt-2.5 flex items-center justify-between">
                          <span className="font-sans text-xs uppercase tracking-wider font-bold text-[#351016]">
                            TOTAL
                          </span>
                          <span className="font-serif font-bold text-xl text-[#351016]">
                            {subtotal.toLocaleString()} DA
                          </span>
                        </div>
                      </div>

                      {/* Section 16: Checkout Error Alert with Safe Retry */}
                      {checkoutError && (
                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{checkoutError}</span>
                          </div>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700 text-white font-semibold shrink-0 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retry
                          </button>
                        </div>
                      )}

                      {/* Confirm Order Action Bar */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="font-sans text-xs text-[#8a7b70] block">
                            Pay at Counter on Pickup · Ready in {pickupTime}
                          </span>
                          <span className="font-serif font-bold text-xl text-[#351016]">
                            {subtotal.toLocaleString()} DA
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-[#351016] hover:bg-[#c9833a] disabled:opacity-60 text-[#faf6ef] px-7 py-3.5 text-xs sm:text-sm font-semibold tracking-wide transition-colors rounded-full cursor-pointer shadow-sm"
                        >
                          {isSubmitting ? 'Confirming Order...' : 'Confirm Order'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
