import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  Coffee,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Gift,
  BookOpen,
  RefreshCw,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { VentyLogo, useOfficialLogo } from './VentyLogo';
import { LoyaltyCustomer } from '../types/loyalty';
import { PastOrder } from '../types/coffee';
import {
  getActiveCustomer,
  getLoyaltyConfig,
  isQualifyingLoyaltyItem,
} from '../services/loyalty';
import heroCafeBg from '../assets/images/hero_cafe_interior_1790335444287.jpg';

export type LoyaltyNotificationVariant =
  | 'guest-welcome'
  | 'guest-post-order'
  | 'member-order-status';

export interface ArtisanalBrewingTip {
  id: string;
  method: string;
  title: string;
  tip: string;
}

const FALLBACK_BREWING_TIPS: ArtisanalBrewingTip[] = [
  {
    id: 'v60-bloom',
    method: 'V60 Pour-Over',
    title: 'The 35-Second Bloom',
    tip: 'Saturate freshly ground coffee with twice its weight in 93°C water for 35 seconds to release trapped CO₂ and unlock natural sweetness.',
  },
  {
    id: 'espresso-swirl',
    method: 'Single-Origin Espresso',
    title: 'Swirl the Crema Before Sipping',
    tip: 'Espresso separates by density in the demitasse. A gentle swirl blends the aromatic golden crema with the syrupy bottom layer.',
  },
  {
    id: 'japanese-iced',
    method: 'Iced Filter',
    title: 'Flash-Chilled over 40% Ice',
    tip: 'Brewing hot pour-over directly onto 40% ice weight with a slightly finer grind locks in delicate jasmine and bergamot aromatics.',
  },
  {
    id: 'grind-freshness',
    method: 'Burr Grinding',
    title: 'The 90-Second Grind Window',
    tip: 'Over 60% of volatile coffee aromas escape within 15 minutes of grinding. Grind right before water contact for maximum cup clarity.',
  },
  {
    id: 'roast-resting',
    method: 'Roast Conditioning',
    title: 'Peak Flavour 7–14 Days Off-Roast',
    tip: 'Artisanal roasts reach peak balance 7 to 14 days after roasting, once excess roasting gas subsides into round caramelised sweetness.',
  },
  {
    id: 'water-minerals',
    method: 'Water Chemistry',
    title: 'Magnesium & Silky Acidity',
    tip: 'Coffee is 98.5% water. Balanced magnesium ions bind to fruit and cocoa notes while gentle alkalinity keeps the finish silky.',
  },
];

interface LoyaltyNotificationCardProps {
  /** Whether the user currently has items in the cart (so we position above FloatingCartIndicator) */
  hasCartItems: boolean;
  /** Whether the LoyaltyModal is currently open (hide notification while authenticating/viewing card) */
  isLoyaltyModalOpen: boolean;
  /** Opens the existing secure phone + password authentication flow or Stamp Card modal */
  onOpenLoyaltyAuth: (mode: 'signup' | 'login' | 'card') => void;
}

const POST_ORDER_DISMISSED_KEY = 'venty_loyalty_post_order_dismissed_v1';
const MEMBER_STATUS_DISMISSED_KEY = 'venty_loyalty_member_status_dismissed_v1';
const IDLE_DELAY_MS = 2600;
const TIP_ROTATION_INTERVAL_MS = 7200;

const safelyGetSessionItem = (key: string): string | null => {
  try {
    return typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

const safelySetSessionItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
  } catch {
    // ignore storage quota/privacy errors
  }
};

const safelyRemoveSessionItem = (key: string): void => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
};

export const LoyaltyNotificationCard: React.FC<LoyaltyNotificationCardProps> = ({
  hasCartItems,
  isLoyaltyModalOpen,
  onOpenLoyaltyAuth,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { logoSrc } = useOfficialLogo();
  const config = getLoyaltyConfig();

  // Track whether the visitor has chosen "Continue as Guest" or transitioned to auth in the current session
  const dismissedWelcomeInVisitRef = useRef<boolean>(false);

  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(() =>
    getActiveCustomer(),
  );

  // Show the full-screen welcome modal immediately on every new website session when unauthenticated
  const [activeVariant, setActiveVariant] =
    useState<LoyaltyNotificationVariant | null>(() => {
      const initialCustomer = getActiveCustomer();
      return initialCustomer ? null : 'guest-welcome';
    });

  const [recentOrder, setRecentOrder] = useState<PastOrder | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // Idle state & fetched rotating Artisanal Brewing Tips ("Did you know?")
  const [isCardIdle, setIsCardIdle] = useState<boolean>(false);
  const [brewingTips, setBrewingTips] = useState<ArtisanalBrewingTip[]>(FALLBACK_BREWING_TIPS);
  const [isFetchingTips, setIsFetchingTips] = useState<boolean>(false);
  const [hasFetchedTips, setHasFetchedTips] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(() =>
    Math.floor(Math.random() * FALLBACK_BREWING_TIPS.length),
  );
  const [isTipPaused, setIsTipPaused] = useState<boolean>(false);

  const dismissedPostOrderIdRef = useRef<string | null>(
    safelyGetSessionItem(POST_ORDER_DISMISSED_KEY),
  );
  const dismissedMemberOrderIdRef = useRef<string | null>(
    safelyGetSessionItem(MEMBER_STATUS_DISMISSED_KEY),
  );
  const pendingGuestOrderRef = useRef<PastOrder | null>(null);
  const autoHideTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const welcomeModalRef = useRef<HTMLDivElement | null>(null);
  const primarySignInBtnRef = useRef<HTMLButtonElement | null>(null);

  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const scheduleMemberStatusAutoHide = useCallback(() => {
    clearAutoHideTimer();
    autoHideTimerRef.current = window.setTimeout(() => {
      setActiveVariant((prev) => (prev === 'member-order-status' ? null : prev));
    }, 15000);
  }, [clearAutoHideTimer]);

  // 1. Ensure every new website session for an unauthenticated visitor shows the full-screen welcome modal,
  // while never interrupting an already authenticated customer.
  useEffect(() => {
    const currentCustomer = getActiveCustomer();
    setCustomer(currentCustomer);

    if (currentCustomer) {
      setActiveVariant((prev) =>
        prev === 'guest-welcome' || prev === 'guest-post-order' ? null : prev,
      );
      return;
    }

    if (!dismissedWelcomeInVisitRef.current) {
      setActiveVariant((current) => current ?? 'guest-welcome');
    }
  }, []);

  // 2. Listen for authentication changes, logout, order creations, and order completions
  useEffect(() => {
    const handleLoyaltySync = () => {
      const updated = getActiveCustomer();
      setCustomer((prevCustomer) => {
        // After logout, clear session flags so the welcome modal appears on the next new session
        if (prevCustomer && !updated) {
          safelyRemoveSessionItem(POST_ORDER_DISMISSED_KEY);
          safelyRemoveSessionItem(MEMBER_STATUS_DISMISSED_KEY);
        }
        return updated;
      });

      if (updated) {
        // Never show guest welcome/login modal once authenticated
        dismissedWelcomeInVisitRef.current = true;
        setActiveVariant((prev) => {
          if (prev === 'guest-welcome' || prev === 'guest-post-order') {
            return null;
          }
          return prev;
        });

        // If the guest had placed an order right before authenticating, show subtle connected status
        if (pendingGuestOrderRef.current) {
          const linkedOrder = pendingGuestOrderRef.current;
          pendingGuestOrderRef.current = null;
          setRecentOrder(linkedOrder);
          setStatusNote(
            'Order connected to your VENTY Loyalty Card — your stamp will be added when the order is completed.',
          );
          setActiveVariant('member-order-status');
          scheduleMemberStatusAutoHide();
        }
      }
    };

    const handleOrdersUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<{ order?: PastOrder; orders?: PastOrder[] }>;
      const updatedOrder = customEvt.detail?.order;
      if (!updatedOrder) return;

      const orderId = updatedOrder.orderId || updatedOrder.id;
      const statusUpper = String(updatedOrder.status || 'PENDING').toUpperCase();
      const currentCustomer = getActiveCustomer();
      setCustomer(currentCustomer);

      if (statusUpper === 'CANCELLED') return;

      if (!currentCustomer) {
        if (dismissedPostOrderIdRef.current === orderId) return;
        pendingGuestOrderRef.current = updatedOrder;
        setRecentOrder(updatedOrder);
        clearAutoHideTimer();
        setActiveVariant('guest-post-order');
      } else {
        if (dismissedMemberOrderIdRef.current === orderId) return;
        setRecentOrder(updatedOrder);

        const hasQualifying =
          updatedOrder.qualifiesForLoyalty !== undefined
            ? updatedOrder.qualifiesForLoyalty
            : (updatedOrder.items || []).some(isQualifyingLoyaltyItem);

        if (statusUpper === 'COMPLETED' && updatedOrder.loyaltyStampAwarded) {
          setStatusNote(
            `Order #${orderId} completed — +1 stamp has been added to your VENTY Loyalty Card (${currentCustomer.currentStampCount}/${config.stampsToReward} stamps).`,
          );
        } else if (hasQualifying) {
          setStatusNote(
            'Order connected to your VENTY Loyalty Card — your stamp will be added when the order is completed.',
          );
        } else {
          setStatusNote(
            'Order connected to your VENTY Loyalty Card — qualifying drinks earn +1 stamp when the order is completed.',
          );
        }

        setActiveVariant('member-order-status');
        scheduleMemberStatusAutoHide();
      }
    };

    const handleOrderCompleted = (e: Event) => {
      const customEvt = e as CustomEvent<{
        event?: { orderId?: string };
        loyaltyResult?: { awardedStamp?: boolean; unlockedReward?: boolean; message?: string };
      }>;
      const currentCustomer = getActiveCustomer();
      setCustomer(currentCustomer);
      if (!currentCustomer) return;

      const orderId = customEvt.detail?.event?.orderId;
      const awarded = customEvt.detail?.loyaltyResult?.awardedStamp;
      const unlocked = customEvt.detail?.loyaltyResult?.unlockedReward;

      if (awarded) {
        setStatusNote(
          unlocked
            ? `Order${orderId ? ` #${orderId}` : ''} completed — +1 stamp added and your Free Venty Drink reward is unlocked!`
            : `Order${orderId ? ` #${orderId}` : ''} completed — +1 stamp has been added to your VENTY Loyalty Card (${currentCustomer.currentStampCount}/${config.stampsToReward} stamps).`,
        );
        setActiveVariant('member-order-status');
        scheduleMemberStatusAutoHide();
      }
    };

    window.addEventListener('venty:loyalty:updated', handleLoyaltySync);
    window.addEventListener('venty-loyalty-updated', handleLoyaltySync);
    window.addEventListener('venty:orders:updated', handleOrdersUpdated);
    window.addEventListener('venty:order:completed', handleOrderCompleted);

    return () => {
      window.removeEventListener('venty:loyalty:updated', handleLoyaltySync);
      window.removeEventListener('venty-loyalty-updated', handleLoyaltySync);
      window.removeEventListener('venty:orders:updated', handleOrdersUpdated);
      window.removeEventListener('venty:order:completed', handleOrderCompleted);
    };
  }, [config.stampsToReward, clearAutoHideTimer, scheduleMemberStatusAutoHide]);

  // Never show guest welcome or post-order login prompt if customer is already authenticated
  const effectiveVariant =
    customer && (activeVariant === 'guest-welcome' || activeVariant === 'guest-post-order')
      ? null
      : activeVariant;

  const shouldShow = Boolean(effectiveVariant) && !isLoyaltyModalOpen;
  const isFullScreenWelcome = shouldShow && effectiveVariant === 'guest-welcome';

  // 3. Lock background scrolling, set background inert, and trap keyboard focus while Full-Screen Welcome Modal is open
  useEffect(() => {
    if (!isFullScreenWelcome) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      return;
    }

    const enforceScrollLock = () => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    };

    enforceScrollLock();
    // Re-assert scroll lock after IntroLogoAnimation finishes its 2s splash cleanup
    const resyncTimer1 = window.setTimeout(enforceScrollLock, 500);
    const resyncTimer2 = window.setTimeout(enforceScrollLock, 2150);
    const resyncTimer3 = window.setTimeout(enforceScrollLock, 2900);

    // Focus the primary SIGN IN button for keyboard accessibility once intro finishes
    const focusTimer = window.setTimeout(
      () => {
        primarySignInBtnRef.current?.focus({ preventScroll: true });
      },
      prefersReducedMotion ? 550 : 2150,
    );

    // Mark background landmarks inert so keyboard/screen-reader cannot interact with background while open
    const bgElements = Array.from(
      document.querySelectorAll('body > #root > div > nav, body > #root > div > main, body > #root > div > footer'),
    );
    bgElements.forEach((el) => {
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('inert', '');
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismissedWelcomeInVisitRef.current = true;
        setActiveVariant(null);
        return;
      }

      if (e.key === 'Tab' && welcomeModalRef.current) {
        const focusable = Array.from(
          welcomeModalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !welcomeModalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !welcomeModalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(resyncTimer1);
      window.clearTimeout(resyncTimer2);
      window.clearTimeout(resyncTimer3);
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      bgElements.forEach((el) => {
        el.removeAttribute('aria-hidden');
        el.removeAttribute('inert');
      });
    };
  }, [isFullScreenWelcome, prefersReducedMotion]);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    const waitMs = prefersReducedMotion ? 1200 : IDLE_DELAY_MS;
    idleTimerRef.current = window.setTimeout(() => {
      setIsCardIdle(true);
    }, waitMs);
  }, [clearIdleTimer, prefersReducedMotion]);

  // Reset idle state whenever the card opens, closes, or switches notification context
  useEffect(() => {
    if (!shouldShow) {
      setIsCardIdle(false);
      clearIdleTimer();
      return;
    }

    setIsCardIdle(false);
    startIdleTimer();

    return () => clearIdleTimer();
  }, [shouldShow, effectiveVariant, statusNote, recentOrder?.orderId, startIdleTimer, clearIdleTimer]);

  // Fetch artisanal coffee brewing tips from the backend when the card enters idle state
  useEffect(() => {
    if (!isCardIdle || hasFetchedTips) return;

    let cancelled = false;
    setIsFetchingTips(true);

    fetch('/api/loyalty/brewing-tips', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.tips) && data.tips.length > 0) {
          setBrewingTips(data.tips);
        }
        setHasFetchedTips(true);
      })
      .catch(() => {
        if (!cancelled) {
          setHasFetchedTips(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetchingTips(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isCardIdle, hasFetchedTips]);

  // Automatically rotate short artisanal brewing tips while the card is in an idle state
  useEffect(() => {
    if (!isCardIdle || !shouldShow || isTipPaused || prefersReducedMotion || brewingTips.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % brewingTips.length);
    }, TIP_ROTATION_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isCardIdle, shouldShow, isTipPaused, prefersReducedMotion, brewingTips.length]);

  useEffect(() => {
    return () => {
      clearAutoHideTimer();
      clearIdleTimer();
    };
  }, [clearAutoHideTimer, clearIdleTimer]);

  const handleActiveZoneActivity = () => {
    if (!isCardIdle) {
      startIdleTimer();
    }
  };

  const handleCardMouseEnter = () => {
    clearAutoHideTimer();
    if (!isCardIdle) {
      startIdleTimer();
    }
  };

  const handleCardMouseLeave = () => {
    if (effectiveVariant === 'member-order-status') {
      scheduleMemberStatusAutoHide();
    }
    if (!isCardIdle && shouldShow) {
      startIdleTimer();
    }
  };

  const handleCycleBrewingTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTipIndex((prev) => (prev + 1) % brewingTips.length);
  };

  // Continue as Guest / Dismiss for the current session
  const handleContinueAsGuest = () => {
    clearAutoHideTimer();
    clearIdleTimer();
    setIsCardIdle(false);
    if (activeVariant === 'guest-welcome') {
      dismissedWelcomeInVisitRef.current = true;
    } else if (activeVariant === 'guest-post-order') {
      const orderId = recentOrder?.orderId || recentOrder?.id || 'dismissed';
      dismissedPostOrderIdRef.current = orderId;
      safelySetSessionItem(POST_ORDER_DISMISSED_KEY, orderId);
      dismissedWelcomeInVisitRef.current = true;
    } else if (activeVariant === 'member-order-status') {
      const orderId = recentOrder?.orderId || recentOrder?.id || 'welcome-member';
      dismissedMemberOrderIdRef.current = orderId;
      safelySetSessionItem(MEMBER_STATUS_DISMISSED_KEY, orderId);
    }
    setActiveVariant(null);
  };

  // PRIMARY CTA: [ SIGN IN ] -> opens existing secure phone + password authentication flow
  const handleSignInAction = () => {
    clearAutoHideTimer();
    clearIdleTimer();
    dismissedWelcomeInVisitRef.current = true;
    if (activeVariant === 'guest-welcome') {
      setActiveVariant(null);
    }
    onOpenLoyaltyAuth('login');
  };

  // SECONDARY CTA: [ CREATE ACCOUNT ] -> opens existing secure phone + password signup flow
  const handleCreateAccountAction = () => {
    clearAutoHideTimer();
    clearIdleTimer();
    dismissedWelcomeInVisitRef.current = true;
    if (activeVariant === 'guest-welcome') {
      setActiveVariant(null);
    }
    onOpenLoyaltyAuth('signup');
  };

  const handleViewMemberCardAction = () => {
    clearAutoHideTimer();
    clearIdleTimer();
    setActiveVariant(null);
    onOpenLoyaltyAuth('card');
  };

  const isPostOrderGuest = effectiveVariant === 'guest-post-order';
  const isMemberStatus = effectiveVariant === 'member-order-status';
  const orderDisplayId = recentOrder?.orderId || recentOrder?.id;
  const orderHasQualifyingDrinks = recentOrder
    ? recentOrder.qualifiesForLoyalty !== undefined
      ? recentOrder.qualifiesForLoyalty
      : (recentOrder.items || []).some(isQualifyingLoyaltyItem)
    : true;

  const activeTipIndex = tipIndex % Math.max(1, brewingTips.length);
  const currentTip = brewingTips[activeTipIndex] || FALLBACK_BREWING_TIPS[0];

  // Position cleanly above FloatingCartIndicator for non-fullscreen post-order/member cards
  const floatingPositionClasses = hasCartItems
    ? 'bottom-[86px] sm:bottom-24 left-0 right-0 px-3 sm:px-0 sm:left-auto sm:right-7'
    : 'bottom-0 sm:bottom-6 left-0 right-0 p-3 sm:p-0 sm:left-auto sm:right-7';

  const fullScreenBackdropVariants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      };

  const fullScreenStageVariants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { opacity: 0, y: 20, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 14, scale: 0.98 },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      };

  const floatingMotionProps = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, y: 22, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 16, scale: 0.97 },
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      };

  const renderDidYouKnowSection = (variantKey: string) => (
    <AnimatePresence initial={false}>
      {isCardIdle && currentTip && (
        <motion.div
          key={`${variantKey}-did-you-know`}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.28, ease: 'easeOut' }}
          onMouseEnter={() => setIsTipPaused(true)}
          onMouseLeave={() => setIsTipPaused(false)}
          onFocusCapture={() => setIsTipPaused(true)}
          onBlurCapture={() => setIsTipPaused(false)}
          className={
            variantKey === 'welcome'
              ? 'overflow-hidden pt-2 border-t border-white/10 text-left'
              : 'overflow-hidden border-t border-white/10 bg-black/25 text-left'
          }
        >
          <div
            className={
              variantKey === 'welcome'
                ? 'bg-black/25 rounded-xl px-4 py-3 space-y-1.5 border border-white/10'
                : 'px-4 sm:px-5 py-3 space-y-1.5'
            }
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <BookOpen className="w-3.5 h-3.5 text-[#c9833a] shrink-0" aria-hidden="true" />
                <span className="font-sans text-[10px] uppercase tracking-[0.15em] font-semibold text-[#f4d19b] truncate">
                  Did you know? · {currentTip.method}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] text-[#d8cbb8]/65 tabular-nums">
                  {activeTipIndex + 1}/{brewingTips.length}
                </span>
                <button
                  type="button"
                  onClick={handleCycleBrewingTip}
                  className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#d8cbb8]/85 hover:text-[#faf6ef] transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d19b]"
                  aria-label="Show next artisanal coffee brewing tip"
                  title="Next brewing tip"
                >
                  <RefreshCw
                    className={`w-2.5 h-2.5 ${isFetchingTips ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Next tip</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip.id || activeTipIndex}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: prefersReducedMotion ? 0.1 : 0.22 }}
                className="space-y-0.5"
              >
                <p className="font-serif font-semibold text-xs text-[#faf6ef]">
                  {currentTip.title}
                </p>
                <p className="font-sans text-[11px] text-[#d8cbb8] leading-relaxed">
                  {currentTip.tip}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <AnimatePresence mode="wait">
      {shouldShow && effectiveVariant === 'guest-welcome' ? (
        /* =====================================================================
           FULL-SCREEN VENTY THE COFFEE LOYALTY WELCOME MODAL (SESSION ENTRY)
           ===================================================================== */
        <motion.div
          key="venty-fullscreen-welcome-modal"
          ref={welcomeModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="venty-welcome-heading"
          aria-describedby="venty-welcome-description"
          {...fullScreenBackdropVariants}
          onPointerMove={handleActiveZoneActivity}
          onFocusCapture={handleActiveZoneActivity}
          className="fixed inset-0 z-[95] w-screen h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#160a0d]/95 backdrop-blur-xl text-[#faf6ef] flex flex-col justify-between select-none"
        >
          {/* Subtle Atmospheric Venty Café Background Layer */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
            <img
              src={heroCafeBg}
              alt=""
              className="w-full h-full object-cover object-center opacity-[0.14] scale-105 filter saturate-75"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#160a0d]/90 via-[#281015]/92 to-[#13080a]/98" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#c9833a]/[0.09] blur-[110px]" />
          </div>

          {/* Subtle Architectural Border Frame (Desktop & Tablet) */}
          <div
            className="pointer-events-none fixed inset-3 sm:inset-6 border border-[#c9833a]/20 rounded-2xl sm:rounded-3xl"
            aria-hidden="true"
          />

          {/* Top Bar: Location Kicker & Close (Continue as Guest) Button */}
          <div className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-10 pt-5 sm:pt-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c9833a]" aria-hidden="true" />
              <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-[#d8cbb8]/80 font-semibold">
                VENTY THE COFFEE · MILIANA
              </span>
            </div>

            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="p-2.5 text-[#d8cbb8]/80 hover:text-[#faf6ef] hover:bg-white/10 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d19b]"
              aria-label="Continue as guest and close loyalty welcome modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Welcome Stage */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-8">
            <motion.div
              {...fullScreenStageVariants}
              className="w-full max-w-lg mx-auto bg-gradient-to-b from-[#2b1117]/90 via-[#230e13]/95 to-[#1a0b0e]/95 border border-[#c9833a]/35 rounded-3xl p-6 sm:p-10 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.85)] text-center space-y-6 sm:space-y-7 relative overflow-hidden"
            >
              {/* Top Gold Hairline Accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6b3a1f] via-[#f4d19b] to-[#c9833a]"
                aria-hidden="true"
              />

              {/* Large Centered VENTY THE COFFEE Logo */}
              <div className="flex flex-col items-center space-y-3 pt-1">
                <div className="bg-[#faf6ef] px-6 py-3.5 rounded-2xl border border-[#f4d19b]/60 shadow-[0_12px_32px_rgba(0,0,0,0.35)] inline-flex items-center justify-center">
                  <img
                    src={logoSrc}
                    alt="VENTY THE COFFEE Official Logo"
                    className="h-14 sm:h-16 w-auto max-w-[180px] object-contain block"
                    draggable={false}
                  />
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c9833a]/15 border border-[#c9833a]/35">
                  <Coffee className="w-3.5 h-3.5 text-[#f4d19b]" aria-hidden="true" />
                  <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#f4d19b] font-semibold">
                    WELCOME TO VENTY
                  </span>
                </div>
              </div>

              {/* Main Heading & Subcopy */}
              <div className="space-y-2.5">
                <h1
                  id="venty-welcome-heading"
                  className="font-serif font-bold text-2xl sm:text-4xl text-[#faf6ef] tracking-tight leading-tight"
                >
                  Join VENTY Loyalty
                </h1>
                <p
                  id="venty-welcome-description"
                  className="font-sans text-sm sm:text-base text-[#e8dfd1]/90 max-w-md mx-auto leading-relaxed"
                >
                  Collect stamps with your qualifying orders and unlock free drinks.
                </p>
              </div>

              {/* Highlight Badge: +2 WELCOME STAMPS for new members */}
              <div className="bg-gradient-to-r from-[#351016]/90 via-[#42161d]/95 to-[#351016]/90 border border-[#c9833a]/50 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner">
                <div className="flex flex-col items-center justify-center space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 text-[#f4d19b]">
                    <Sparkles className="w-4 h-4 text-[#c9833a] shrink-0" aria-hidden="true" />
                    <span className="font-serif font-bold text-base sm:text-lg tracking-wide text-[#f4d19b] uppercase">
                      +{config.welcomeBonusStamps} WELCOME STAMPS FOR NEW MEMBERS
                    </span>
                    <Sparkles className="w-4 h-4 text-[#c9833a] shrink-0" aria-hidden="true" />
                  </div>
                </div>

                {/* 7-Stamp Digital Card Visual Preview */}
                <div className="pt-1 flex items-center justify-center gap-1.5 sm:gap-2" aria-hidden="true">
                  {Array.from({ length: config.stampsToReward }).map((_, idx) => {
                    const isWelcomeStamp = idx < config.welcomeBonusStamps;
                    const isRewardSlot = idx === config.stampsToReward - 1;
                    return (
                      <div
                        key={idx}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] font-mono font-bold transition-all ${
                          isWelcomeStamp
                            ? 'bg-gradient-to-br from-[#f4d19b] to-[#c9833a] text-[#1b0d09] shadow-[0_0_15px_rgba(201,131,58,0.45)] ring-2 ring-[#f4d19b]/50'
                            : isRewardSlot
                            ? 'bg-[#c9833a]/20 border border-[#f4d19b]/50 text-[#f4d19b]'
                            : 'bg-white/[0.06] border border-white/15 text-[#d8cbb8]/60'
                        }`}
                      >
                        {isWelcomeStamp ? '★' : isRewardSlot ? <Gift className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                    );
                  })}
                </div>

                <p className="font-sans text-[11px] text-[#d8cbb8]/80">
                  Collect {config.stampsToReward} stamps on specialty drinks · Your 8th drink is on the house
                </p>
              </div>

              {/* Action Buttons: [ SIGN IN ] · [ CREATE ACCOUNT ] · [ CONTINUE AS GUEST ] */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* PRIMARY CTA: [ SIGN IN ] */}
                  <button
                    ref={primarySignInBtnRef}
                    type="button"
                    onClick={handleSignInAction}
                    aria-label="Sign In to your VENTY Loyalty account with phone and password"
                    className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#c9833a] via-[#df9e59] to-[#c9833a] hover:brightness-110 text-[#1b0d09] px-6 py-3.5 rounded-xl font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.14em] transition-all cursor-pointer shadow-[0_10px_25px_-5px_rgba(201,131,58,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#faf6ef] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b0d09]"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    <span>SIGN IN</span>
                  </button>

                  {/* SECONDARY CTA: [ CREATE ACCOUNT ] */}
                  <button
                    type="button"
                    onClick={handleCreateAccountAction}
                    aria-label="Create a new VENTY Loyalty account and receive 2 welcome stamps"
                    className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.15] text-[#faf6ef] border border-[#f4d19b]/45 px-6 py-3.5 rounded-xl font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.14em] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d19b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b0d09]"
                  >
                    <UserPlus className="w-4 h-4 text-[#f4d19b]" aria-hidden="true" />
                    <span>CREATE ACCOUNT</span>
                  </button>
                </div>

                {/* TERTIARY ACTION: [ CONTINUE AS GUEST ] */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleContinueAsGuest}
                    aria-label="Continue as Guest to browse menu and order without signing in"
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 text-[#d8cbb8]/85 hover:text-[#faf6ef] hover:bg-white/[0.06] px-5 py-2.5 rounded-xl font-sans text-xs font-semibold uppercase tracking-[0.18em] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d19b]"
                  >
                    <span>CONTINUE AS GUEST</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#c9833a]" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Idle-Only "Did you know?" Rotating Artisanal Coffee Brewing Tip */}
              {renderDidYouKnowSection('welcome')}
            </motion.div>
          </div>

          {/* Bottom Hours & Authenticity Footer */}
          <div className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-10 pb-5 sm:pb-7 text-center">
            <p className="font-sans text-[11px] text-[#d8cbb8]/60 tracking-wide">
              Secure Phone + Password Authentication · Daily 17:00 – 01:00 · Miliana, Algeria
            </p>
          </div>
        </motion.div>
      ) : shouldShow ? (
        /* =====================================================================
           FLOATING POST-ORDER GUEST & AUTHENTICATED MEMBER LOYALTY CARD
           ===================================================================== */
        <motion.aside
          key={effectiveVariant}
          role="dialog"
          aria-modal="false"
          aria-label="VENTY Loyalty Notification Card"
          aria-live="polite"
          {...floatingMotionProps}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
          className={`fixed z-[55] pointer-events-none sm:w-[405px] md:w-[425px] max-w-full ${floatingPositionClasses}`}
        >
          <div
            className={`pointer-events-auto relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-colors ${
              isPostOrderGuest
                ? 'bg-gradient-to-br from-[#281015] via-[#351016] to-[#1b0d09] border-[#c9833a]/75 shadow-[0_24px_60px_-12px_rgba(20,6,9,0.75)]'
                : 'bg-gradient-to-br from-[#23120e] via-[#2d1418] to-[#1b0d09] border-[#c9833a]/45 shadow-[0_20px_50px_-12px_rgba(20,6,9,0.65)]'
            } text-[#faf6ef] backdrop-blur-md`}
          >
            {/* Top Gold/Cream Accent Bar */}
            <div
              className={`h-1 w-full ${
                isPostOrderGuest
                  ? 'bg-gradient-to-r from-[#c9833a] via-[#f4d19b] to-[#c9833a]'
                  : 'bg-gradient-to-r from-[#2e7d32] via-[#f4d19b] to-[#c9833a]'
              }`}
            />

            <div
              className="relative p-4 sm:p-5 space-y-3.5"
              onPointerMove={handleActiveZoneActivity}
              onFocusCapture={handleActiveZoneActivity}
            >
              {/* Header Row: VENTY Logo + ☕ VENTY LOYALTY + Close X */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="bg-[#faf6ef] px-2.5 py-1 rounded-xl border border-[#f4d19b]/40 shadow-2xs shrink-0">
                    <VentyLogo
                      className="h-6 w-auto max-w-[92px] shrink-0"
                      imgClassName="h-full w-auto max-h-6 max-w-[92px] object-contain block"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-6 h-6 rounded-full bg-[#c9833a]/20 border border-[#c9833a]/45 text-[#f4d19b] flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      {isMemberStatus ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#f4d19b]" />
                      ) : (
                        <Coffee className="w-3.5 h-3.5 text-[#f4d19b]" />
                      )}
                    </span>
                    <span className="font-sans text-[11px] uppercase tracking-[0.16em] text-[#f4d19b] font-semibold truncate">
                      ☕ VENTY LOYALTY
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinueAsGuest}
                  className="p-1.5 -mr-1 text-[#d8cbb8]/80 hover:text-[#faf6ef] hover:bg-white/10 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d19b]"
                  aria-label="Close loyalty notification card"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isMemberStatus && customer ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-serif font-bold text-base sm:text-lg text-[#faf6ef] leading-snug">
                      {recentOrder ? 'Connected to Your Venty Card' : 'Venty Loyalty Member'}
                    </h4>
                    <span className="font-mono text-[11px] font-bold text-[#f4d19b] bg-white/10 border border-[#c9833a]/35 px-2.5 py-0.5 rounded-full tabular-nums shrink-0">
                      {customer.currentStampCount}/{config.stampsToReward} Stamps
                    </span>
                  </div>

                  <p className="font-sans text-xs text-[#e8dfd1] leading-relaxed">
                    {statusNote ||
                      'Order connected to your VENTY Loyalty Card — your stamp will be added when the order is completed.'}
                  </p>

                  <div className="pt-1.5 flex items-center justify-between gap-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleViewMemberCardAction}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#f4d19b] hover:text-[#faf6ef] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d19b] rounded"
                    >
                      <Gift className="w-3.5 h-3.5 text-[#c9833a]" />
                      <span>View Stamp Card</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={handleContinueAsGuest}
                      className="text-xs text-[#d8cbb8]/80 hover:text-[#faf6ef] font-medium transition-colors cursor-pointer px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d19b]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                /* Stronger Post-Order Guest Loyalty Prompt */
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    {orderDisplayId && (
                      <span className="inline-block font-mono text-[10px] uppercase tracking-wider text-[#f4d19b] bg-[#c9833a]/20 border border-[#c9833a]/40 px-2 py-0.5 rounded-md">
                        Order #{orderDisplayId} Placed
                      </span>
                    )}
                    <h4 className="font-serif font-bold text-lg sm:text-xl text-[#faf6ef] leading-snug">
                      Connect Your Order to Venty Loyalty
                    </h4>
                    <p className="font-sans text-xs sm:text-[13px] text-[#e8dfd1] leading-relaxed">
                      Sign in or create an account so qualifying orders are connected to your{' '}
                      <strong className="text-[#f4d19b] font-semibold">VENTY Loyalty Card</strong>
                      {orderHasQualifyingDrinks
                        ? ' and earn your stamp once completed.'
                        : '.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSignInAction}
                      className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 bg-[#c9833a] hover:bg-[#df9e59] text-[#1b0d09] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d19b]"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>SIGN IN</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateAccountAction}
                      className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-[#faf6ef] border border-[#f4d19b]/40 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d19b]"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#f4d19b]" />
                      <span>CREATE ACCOUNT</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/10">
                    <span className="font-sans text-[11px] text-[#f4d19b] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#c9833a] shrink-0" />
                      <span>+{config.welcomeBonusStamps} WELCOME STAMPS for new members</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleContinueAsGuest}
                      className="w-full sm:w-auto text-center text-xs font-medium text-[#d8cbb8]/85 hover:text-[#faf6ef] py-1.5 sm:py-0.5 px-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d19b]"
                    >
                      Continue as Guest
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Idle-Only "Did you know?" Rotating Artisanal Coffee Brewing Tip Footer Tray */}
            {renderDidYouKnowSection('floating')}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
};
