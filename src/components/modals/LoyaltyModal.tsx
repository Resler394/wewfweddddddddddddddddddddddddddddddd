import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Coffee,
  Sparkles,
  Gift,
  CheckCircle2,
  QrCode,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Receipt,
  LogOut,
  Edit3,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { VentyLogo } from '../VentyLogo';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator';
import {
  LoyaltyCustomer,
  LoyaltyReward,
} from '../../types/loyalty';
import {
  getActiveCustomer,
  loginCustomerWithPassword,
  registerCustomerWithPassword,
  logoutLoyaltyCustomer,
  updateLoyaltyCustomerProfile,
  redeemReward,
  getLoyaltyLedger,
  getLoyaltyConfig,
} from '../../services/loyalty';
import {
  formatAlgiersDate,
  formatAlgiersDateTime,
  VENTY_TIMEZONE,
} from '../../utils/algiersTime';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrderAhead?: () => void;
  initialTab?: 'card' | 'signup';
  initialAuthMode?: 'signup' | 'login';
  onAuthSuccess?: (customer: LoyaltyCustomer) => void;
}

export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({
  isOpen,
  onClose,
  onOpenOrderAhead,
  initialTab,
  initialAuthMode,
  onAuthSuccess,
}) => {
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(() => getActiveCustomer());
  const [activeTab, setActiveTab] = useState<'card' | 'activity' | 'rewards' | 'signup'>('card');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [stampAnimationIndex, setStampAnimationIndex] = useState<number | null>(null);
  const [isProgressScaling, setIsProgressScaling] = useState(false);
  const progressScaleTimeoutRef = useRef<number | null>(null);
  const prevStampSnapshotRef = useRef<{
    customerId: string | null;
    stamps: number;
    lifetime: number;
  }>({
    customerId: customer?.id ?? null,
    stamps: customer?.currentStampCount ?? 0,
    lifetime: customer?.lifetimeStamps ?? 0,
  });

  const triggerProgressScale = useCallback(() => {
    if (progressScaleTimeoutRef.current) {
      window.clearTimeout(progressScaleTimeoutRef.current);
    }
    setIsProgressScaling(false);
    // Re-trigger CSS animation on next frame so consecutive stamps each animate cleanly
    window.requestAnimationFrame(() => {
      setIsProgressScaling(true);
      progressScaleTimeoutRef.current = window.setTimeout(() => {
        setIsProgressScaling(false);
      }, 720);
    });
  }, []);

  // Redemption flow state
  const [selectedRewardToRedeem, setSelectedRewardToRedeem] = useState<LoyaltyReward | null>(null);
  const [redemptionConfirmModal, setRedemptionConfirmModal] = useState(false);

  // Customer Signup / Login / Forgot Password / Profile form state
  const [authSubMode, setAuthSubMode] = useState<'signup' | 'login' | 'forgot-password' | 'profile'>('login');
  const [loginPhoneInput, setLoginPhoneInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [signupForm, setSignupForm] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    email: '',
    favouriteDrink: 'Iced Specialty Latte',
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    favouriteDrink: '',
  });
  // Secure Forgot Password state (short-lived single-use reset code)
  const [forgotPhoneInput, setForgotPhoneInput] = useState('');
  const [forgotResetStep, setForgotResetStep] = useState<'request' | 'confirm'>('request');
  const [forgotResetCode, setForgotResetCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotResetExpiresIn, setForgotResetExpiresIn] = useState(0);
  const [authShakeKey, setAuthShakeKey] = useState(0);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfoMessage, setAuthInfoMessage] = useState<string | null>(null);

  const prefersReducedMotion = useReducedMotion();

  const triggerAuthError = useCallback((message: string) => {
    setAuthError(message);
    setAuthShakeKey((prev) => prev + 1);
  }, []);

  // Countdown timer for single-use password reset code validity
  useEffect(() => {
    if (authSubMode !== 'forgot-password' || forgotResetStep !== 'confirm' || forgotResetExpiresIn <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setForgotResetExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [authSubMode, forgotResetStep, forgotResetExpiresIn]);

  const config = getLoyaltyConfig();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4200);
  };

  // Synchronize state when modal opens or loyalty events fire
  useEffect(() => {
    const handleUpdate = () => {
      const updated = getActiveCustomer();
      const prev = prevStampSnapshotRef.current;
      if (updated) {
        const isSameCustomer = prev.customerId === updated.id;
        const stampIncreased =
          isSameCustomer &&
          (updated.currentStampCount > prev.stamps || updated.lifetimeStamps > prev.lifetime);
        const isNewlyCreatedWithWelcomeBonus =
          !prev.customerId && updated.currentStampCount > 0;

        if (stampIncreased || isNewlyCreatedWithWelcomeBonus) {
          triggerProgressScale();
        }

        prevStampSnapshotRef.current = {
          customerId: updated.id,
          stamps: updated.currentStampCount,
          lifetime: updated.lifetimeStamps,
        };
      } else {
        prevStampSnapshotRef.current = {
          customerId: null,
          stamps: 0,
          lifetime: 0,
        };
      }

      setCustomer(updated);
      if (updated) {
        setProfileForm({
          name: updated.name || '',
          phone: updated.phone || '',
          email: updated.email || '',
          favouriteDrink: updated.favouriteDrink || 'Iced Specialty Latte',
        });
      }
    };

    const handleStampEarned = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      handleUpdate();
      triggerProgressScale();
      if (detail?.account) {
        setStampAnimationIndex(detail.account.currentStampCount);
        setTimeout(() => setStampAnimationIndex(null), 1600);
      }
      if (detail?.rewardsUnlocked > 0) {
        showToast('🎉 Congratulations! You unlocked a FREE Venty Drink!');
      } else {
        showToast('☕ +1 Loyalty Stamp Added to your Venty Card!');
      }
    };

    if (isOpen) {
      handleUpdate();
      const currentActive = getActiveCustomer();
      if (initialTab === 'signup' && !currentActive) {
        setActiveTab('signup');
        setAuthSubMode(initialAuthMode || 'login');
        setForgotResetStep('request');
        setShowLoginPassword(false);
        setShowSignupPassword(false);
        setShowSignupConfirmPassword(false);
        setShowForgotNewPassword(false);
        setShowForgotConfirmPassword(false);
        setAuthError(null);
        setAuthInfoMessage(null);
      } else if (initialTab === 'card') {
        setActiveTab('card');
      }
    }

    window.addEventListener('venty:loyalty:updated', handleUpdate);
    window.addEventListener('venty-loyalty-updated', handleUpdate);
    window.addEventListener('venty-stamp-earned', handleStampEarned);
    window.addEventListener('venty:orders:updated', handleUpdate);
    return () => {
      window.removeEventListener('venty:loyalty:updated', handleUpdate);
      window.removeEventListener('venty-loyalty-updated', handleUpdate);
      window.removeEventListener('venty-stamp-earned', handleStampEarned);
      window.removeEventListener('venty:orders:updated', handleUpdate);
    };
  }, [isOpen, initialTab, initialAuthMode]);

  if (!isOpen) return null;

  const currentStamps = customer ? customer.currentStampCount : 0;
  const remainingForReward = Math.max(0, config.stampsToReward - currentStamps);
  const availableRewardsCount = customer ? customer.availableRewards.length : 0;
  const progressPercent = Math.min(100, Math.round((currentStamps / config.stampsToReward) * 100));

  // Customer Self-Redemption Dialog
  const handleOpenCustomerRedemption = (reward: LoyaltyReward) => {
    setSelectedRewardToRedeem(reward);
    setRedemptionConfirmModal(true);
  };

  const handleExecuteCustomerRedeem = () => {
    if (!selectedRewardToRedeem) return;
    const res = redeemReward({
      rewardId: selectedRewardToRedeem.rewardId,
      staffId: 'CUSTOMER_COUNTER_CONFIRM',
    });
    if (res.success) {
      setCustomer(getActiveCustomer());
      setRedemptionConfirmModal(false);
      setSelectedRewardToRedeem(null);
      showToast('✅ Free Drink Reward Redeemed! Show confirmation to your barista.');
    } else {
      showToast(`⚠️ ${res.message}`);
    }
  };

  // Customer Create Account Flow (Full Name, Phone Number, Password, Confirm Password, Optional Email, Optional Favourite Drink)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfoMessage(null);
    if (!signupForm.name.trim() || !signupForm.phone.trim()) {
      triggerAuthError('Please enter your Full Name and Phone Number.');
      return;
    }
    if (!signupForm.password || signupForm.password.length < 8) {
      triggerAuthError('Password must be at least 8 characters long.');
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      triggerAuthError('Passwords do not match. Please confirm your password.');
      return;
    }

    setIsAuthBusy(true);
    try {
      const res = await registerCustomerWithPassword({
        name: signupForm.name.trim(),
        phone: signupForm.phone.trim(),
        password: signupForm.password,
        confirmPassword: signupForm.confirmPassword,
        email: signupForm.email.trim() || undefined,
        favouriteDrink: signupForm.favouriteDrink.trim() || undefined,
      });

      if (res.success && res.customer) {
        setCustomer(res.customer);
        setSignupForm({
          name: '',
          phone: '',
          password: '',
          confirmPassword: '',
          email: '',
          favouriteDrink: 'Iced Specialty Latte',
        });
        setAuthInfoMessage(null);
        setActiveTab('card');

        if (res.welcomeBonusAwarded) {
          setStampAnimationIndex(2);
          setTimeout(() => setStampAnimationIndex(null), 1800);
        }
        showToast(res.message);
        if (onAuthSuccess) {
          onAuthSuccess(res.customer);
        }
      } else {
        triggerAuthError(res.message || 'Unable to create your account right now.');
      }
    } finally {
      setIsAuthBusy(false);
    }
  };

  // Customer Login Flow (Phone Number + Password -> Server Authentication -> Customer Session)
  const handleCustomerLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfoMessage(null);
    if (!loginPhoneInput.trim() || !loginPasswordInput) {
      triggerAuthError('Please enter both your phone number and password.');
      return;
    }

    setIsAuthBusy(true);
    try {
      const res = await loginCustomerWithPassword({
        phone: loginPhoneInput.trim(),
        password: loginPasswordInput,
      });
      if (res.success && res.customer) {
        setCustomer(res.customer);
        setLoginPhoneInput('');
        setLoginPasswordInput('');
        setAuthInfoMessage(null);
        setActiveTab('card');
        showToast(res.message);
        if (onAuthSuccess) {
          onAuthSuccess(res.customer);
        }
      } else {
        triggerAuthError(res.message || 'Invalid phone number or password.');
      }
    } finally {
      setIsAuthBusy(false);
    }
  };

  // Forgot Password flow: in-store barista recovery guidance (no SMS dependency)
  const handleRequestPasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!forgotPhoneInput.trim()) {
      triggerAuthError('Please enter your phone number.');
      return;
    }
    setAuthInfoMessage(
      'To securely reset your password without SMS, our barista at VENTY THE COFFEE counter in Miliana can verify your phone number in person and help you regain access.'
    );
  };

  // Customer Profile Update Flow (Section 1)
  const handleCustomerProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      setAuthError('Name and phone number are required.');
      return;
    }

    const res = await updateLoyaltyCustomerProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
      favouriteDrink: profileForm.favouriteDrink.trim(),
    });

    if (res.success && res.customer) {
      setCustomer(res.customer);
      setActiveTab('card');
      showToast('✅ Customer profile saved.');
    } else {
      setAuthError(res.message);
    }
  };

  // Customer Logout Flow (Section 3)
  const handleCustomerLogout = async () => {
    await logoutLoyaltyCustomer();
    setCustomer(null);
    setAuthSubMode('login');
    setActiveTab('signup');
    showToast('Signed out of your Venty account.');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied "${text}" to clipboard`);
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#faf6ef] border border-[#ded7c8] rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#ded7c8] flex items-center justify-between bg-[#faf6ef]">
          <div className="flex items-center gap-3">
            <VentyLogo
              className="h-10 w-auto max-w-[140px]"
              imgClassName="h-full w-auto max-h-10 max-w-[140px] object-contain block"
            />
            <div>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8a7b70] font-semibold block">
                VENTY THE COFFEE · Miliana Rewards
              </span>
              <h3 className="font-serif font-bold text-2xl text-[#221a14] tracking-tight">
                Digital Stamp Card
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#7a6b61] hover:text-[#221a14] hover:bg-[#eee9de] rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#351016] text-[#faf6ee] py-2.5 px-4 text-xs font-sans flex items-center justify-between border-b border-[#522917] z-20 shadow-md"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#f4d19b]" />
                {toastMessage}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-[#ded7c8] bg-[#eee9de]/60 flex items-center gap-2 text-xs font-medium overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('card')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'card'
                ? 'bg-[#351016] text-[#faf6ef] shadow-2xs font-semibold'
                : 'text-[#59493f] hover:bg-[#faf6ef]'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Stamp Card ({currentStamps}/7)</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'rewards'
                ? 'bg-[#351016] text-[#faf6ef] shadow-2xs font-semibold'
                : 'text-[#59493f] hover:bg-[#faf6ef]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Rewards</span>
            {availableRewardsCount > 0 && (
              <span className="bg-[#c9833a] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                {availableRewardsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'bg-[#351016] text-[#faf6ef] shadow-2xs font-semibold'
                : 'text-[#59493f] hover:bg-[#faf6ef]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Activity Ledger</span>
          </button>

          {!customer ? (
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => {
                  setAuthSubMode('login');
                  setActiveTab('signup');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'signup' && authSubMode === 'login'
                    ? 'bg-[#351016] text-white'
                    : 'text-[#351016] hover:bg-[#351016]/10 border border-[#ded7c8]'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setAuthSubMode('signup');
                  setActiveTab('signup');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'signup' && authSubMode === 'signup'
                    ? 'bg-[#c9833a] text-white'
                    : 'text-[#c9833a] hover:bg-[#c9833a]/10 border border-[#c9833a]/30'
                }`}
              >
                Sign Up (+2 Free Stamps)
              </button>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => {
                  setProfileForm({
                    name: customer.name || '',
                    phone: customer.phone || '',
                    email: customer.email || '',
                    favouriteDrink: customer.favouriteDrink || 'Iced Specialty Latte',
                  });
                  setAuthSubMode('profile');
                  setActiveTab('signup');
                }}
                className="text-[11px] text-[#351016] hover:text-[#c9833a] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap bg-white/80 px-2.5 py-1 rounded-md border border-[#ded7c8]"
              >
                <Edit3 className="w-3 h-3" />
                Profile
              </button>
              <button
                onClick={handleCustomerLogout}
                className="text-[11px] text-[#8a7b70] hover:text-red-700 flex items-center gap-1 cursor-pointer whitespace-nowrap px-2 py-1"
              >
                <LogOut className="w-3 h-3" />
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* Persistent Visual Progress Bar: Stamps Needed Until Next Free Coffee Reward */}
        <div className="px-4 sm:px-6 py-3 bg-[#faf6ee] border-b border-[#ded7c8] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#351016] text-[#f4d19b] flex items-center justify-center shrink-0">
                  <Coffee className="w-3 h-3 text-[#c9833a]" />
                </span>
                <span className="font-sans text-[#221a14] font-medium">
                  {currentStamps >= config.stampsToReward || availableRewardsCount > 0 ? (
                    <strong className="text-[#2e7d32] font-semibold">
                      0 stamps needed — Your Free Coffee Reward is unlocked!
                    </strong>
                  ) : (
                    <>
                      <strong className="text-[#351016] font-bold">
                        {remainingForReward} more {remainingForReward === 1 ? 'stamp' : 'stamps'} needed
                      </strong>{' '}
                      until your next free coffee reward
                      {!customer && (
                        <span className="text-[#6b3a1f] font-semibold">
                          {' '}
                          (Join for +{config.welcomeBonusStamps} welcome stamps)
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span
                  className={`font-mono text-[11px] font-bold text-[#351016] bg-[#eee9de] border px-2.5 py-0.5 rounded-full tabular-nums transition-colors duration-300 ${
                    isProgressScaling
                      ? 'border-[#c9833a] bg-[#c9833a]/15 text-[#351016]'
                      : 'border-[#ded7c8]'
                  } ${isProgressScaling && !prefersReducedMotion ? 'venty-stamp-badge-scale' : ''}`}
                >
                  {currentStamps} / {config.stampsToReward} Stamps ({progressPercent}%)
                </span>
                {remainingForReward > 0 && (
                  <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-[#8a531e] bg-[#c9833a]/15 border border-[#c9833a]/35 px-2 py-0.5 rounded-full font-semibold tabular-nums">
                    {remainingForReward} Needed
                  </span>
                )}
              </div>
            </div>

            {/* Accessible Visual Progress Bar */}
            <div
              role="progressbar"
              aria-label="Stamps needed until next free coffee reward"
              aria-valuenow={currentStamps}
              aria-valuemin={0}
              aria-valuemax={config.stampsToReward}
              aria-valuetext={
                remainingForReward === 0
                  ? `${currentStamps} of ${config.stampsToReward} stamps collected. Free coffee reward unlocked.`
                  : `${currentStamps} of ${config.stampsToReward} stamps collected. ${remainingForReward} more stamps needed until next free coffee reward.`
              }
              className={`relative h-2.5 w-full bg-[#eee9de] rounded-full overflow-hidden border shadow-inner transition-colors duration-300 ${
                isProgressScaling ? 'border-[#c9833a]' : 'border-[#ded7c8]'
              } ${isProgressScaling && !prefersReducedMotion ? 'venty-progress-stamp-scale' : ''}`}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#351016] via-[#c9833a] to-[#df9e59]"
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    availableRewardsCount > 0 && currentStamps === 0 ? 100 : progressPercent
                  }%`,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.55, ease: 'easeOut' }
                }
              />
              {/* 7-Stamp Segment Tick Dividers */}
              <div
                className="pointer-events-none absolute inset-0 grid grid-cols-7"
                aria-hidden="true"
              >
                {Array.from({ length: config.stampsToReward }).map((_, idx) => (
                  <div
                    key={idx}
                    className={idx < config.stampsToReward - 1 ? 'border-r border-[#faf6ef]/70' : ''}
                  />
                ))}
              </div>
            </div>
          </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================
              TAB 1: DYNAMIC DIGITAL STAMP CARD WITH PROGRESS VISUAL
              ======================================================== */}
          {activeTab === 'card' && (
            <div className="space-y-6">
              {!customer && (
                <div className="bg-[#eee9de] border border-[#c9833a]/30 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="font-serif font-bold text-base text-[#221a14]">
                      You're viewing a guest card preview
                    </p>
                    <p className="font-sans text-xs text-[#59493f]">
                      Create your free Venty account in 15 seconds to receive{' '}
                      <strong className="text-[#351016]">2 free welcome stamps</strong> instantly, or log in with your phone!
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setAuthSubMode('login');
                        setActiveTab('signup');
                      }}
                      className="bg-white hover:bg-[#faf6ef] text-[#351016] border border-[#ded7c8] px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => {
                        setAuthSubMode('signup');
                        setActiveTab('signup');
                      }}
                      className="bg-[#351016] hover:bg-[#c9833a] text-[#faf6ef] px-5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer shadow-sm"
                    >
                      Join Venty Club (+2 Free Stamps) →
                    </button>
                  </div>
                </div>
              )}

              {/* 1. GAMIFIED PROGRESS VISUAL & CLEAR 'X OF 7' STAMP COUNTER */}
              <div className="bg-[#faf6ee] border border-[#ded5c3] p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
                {/* Header Row with 'X of 7' Counter & Stamps Needed Callout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#c9833a]" />
                      <span className="font-sans uppercase text-[11px] tracking-[0.16em] font-bold text-[#8a7a6f]">
                        Next Free Coffee Reward Progress
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-xl sm:text-2xl text-[#2d1217] tracking-tight">
                      {currentStamps >= config.stampsToReward || availableRewardsCount > 0
                        ? '🎉 7 of 7 Complete · Free Coffee Unlocked!'
                        : `${remainingForReward} ${remainingForReward === 1 ? 'Stamp' : 'Stamps'} Needed for Free Coffee`}
                    </h4>
                    <p className="font-sans text-xs text-[#59493f]">
                      {currentStamps >= config.stampsToReward || availableRewardsCount > 0 ? (
                        <span className="text-[#2e7d32] font-semibold">
                          Your 8th drink on the house is available to redeem at the counter.
                        </span>
                      ) : (
                        <>
                          You have collected <strong className="text-[#351016] font-semibold">{currentStamps} of {config.stampsToReward} stamps</strong>. Collect{' '}
                          <strong className="text-[#351016] font-semibold">
                            {remainingForReward} more {remainingForReward === 1 ? 'stamp' : 'stamps'}
                          </strong>{' '}
                          on qualifying drinks to unlock your next free coffee reward.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Prominent Stamp Counter Badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#ded7c8]">
                    <div
                      className={`inline-flex items-center gap-2 bg-[#351016] text-[#f4d19b] px-4 py-1.5 rounded-full shadow-xs border transition-colors duration-300 ${
                        isProgressScaling ? 'border-[#c9833a]' : 'border-[#522917]'
                      } ${isProgressScaling && !prefersReducedMotion ? 'venty-stamp-badge-scale' : ''}`}
                    >
                      <Coffee className="w-3.5 h-3.5 text-[#c9833a]" />
                      <span className="font-mono text-sm font-bold tracking-tight tabular-nums">
                        {currentStamps} / {config.stampsToReward} Stamps
                      </span>
                    </div>
                    <span className="font-sans text-[11px] font-semibold text-[#8a7b70] uppercase tracking-wider tabular-nums">
                      {remainingForReward === 0
                        ? 'Reward Unlocked'
                        : `${remainingForReward} ${remainingForReward === 1 ? 'stamp' : 'stamps'} remaining · ${progressPercent}%`}
                    </span>
                  </div>
                </div>

                {/* Dynamic Visual Progress Bar with Shimmer & Subtle CSS Scale on Stamp Added */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-sans text-[#6b3a1f]">
                    <span className="font-semibold">
                      Collected: {currentStamps} {currentStamps === 1 ? 'stamp' : 'stamps'}
                    </span>
                    <span className="font-semibold">
                      Needed until Free Coffee: {remainingForReward} {remainingForReward === 1 ? 'stamp' : 'stamps'}
                    </span>
                  </div>

                  <div
                    role="progressbar"
                    aria-label="Visual stamp progress towards next free coffee reward"
                    aria-valuenow={currentStamps}
                    aria-valuemin={0}
                    aria-valuemax={config.stampsToReward}
                    className={`relative h-4 w-full bg-[#eee9de] rounded-full overflow-hidden border shadow-inner p-0.5 transition-colors duration-300 ${
                      isProgressScaling ? 'border-[#c9833a]' : 'border-[#ded7c8]'
                    } ${isProgressScaling && !prefersReducedMotion ? 'venty-progress-stamp-scale' : ''}`}
                  >
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#8a531e] via-[#c9833a] to-[#f4d19b] relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { duration: 0.7, ease: 'easeOut' }
                      }
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>

                  {/* Segmented 7-Step Milestone Tracker */}
                  <div className="grid grid-cols-8 gap-1 pt-1 text-center">
                    {[1, 2, 3, 4, 5, 6, 7].map((step) => {
                      const isCompleted = currentStamps >= step;
                      const isCurrent = currentStamps === step;
                      return (
                        <div
                          key={step}
                          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-md border text-[10px] font-mono transition-all ${
                            isCompleted
                              ? 'bg-[#351016] text-[#f4d19b] border-[#351016] font-bold shadow-2xs'
                              : 'bg-white/60 text-[#8a7b70] border-[#ded7c8]'
                          } ${isCurrent ? 'ring-2 ring-[#c9833a]' : ''}`}
                        >
                          <span>{step}</span>
                          <span className="text-[8px] uppercase tracking-tighter">
                            {isCompleted ? '✓' : 'needed'}
                          </span>
                        </div>
                      );
                    })}

                    {/* 8th Reward Step */}
                    <div
                      className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-md border text-[10px] font-mono transition-all ${
                        currentStamps >= 7 || availableRewardsCount > 0
                          ? 'bg-[#c9833a] text-white border-[#c9833a] font-bold shadow-xs animate-pulse'
                          : 'bg-[#eee9de]/80 text-[#c9833a] border-dashed border-[#c9833a]/60'
                      }`}
                      title="8th Drink: Free Reward"
                    >
                      <Gift className="w-3 h-3" />
                      <span className="text-[8px] font-serif italic font-bold">
                        FREE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. THE TACTILE DIGITAL STAMP CARD (8-SLOT DESIGN) */}
              <div className="relative bg-[#faf6ef] border-2 border-[#351016]/30 p-6 sm:p-7 rounded-3xl shadow-[0_12px_36px_rgba(53,16,22,0.08)] overflow-hidden">
                <div className="absolute -right-8 -bottom-8 pointer-events-none opacity-[0.04]">
                  <Coffee className="w-56 h-56 text-[#351016]" />
                </div>

                {/* Card Header */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#ded7c8] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <VentyLogo
                      className="h-7 w-auto max-w-[120px]"
                      imgClassName="h-full w-auto max-h-7 max-w-[120px] object-contain block"
                    />
                    <div>
                      <span className="font-serif italic font-bold text-2xl tracking-tight text-[#351016]">
                        VENTY
                      </span>
                      <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[#8a7b70] ml-2">
                        The Coffee · Miliana
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block bg-[#eee9de] border border-[#ded7c8] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#351016] rounded-md font-semibold">
                      {customer ? customer.id : 'VENTY-GUEST'}
                    </span>
                    <p className="text-[11px] font-sans text-[#7a6b61] mt-0.5">
                      {customer ? customer.name : 'Venty Guest'}
                    </p>
                  </div>
                </div>

                {/* Card Sub-Banner with Clear X of 7 Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-5">
                  <div>
                    <p className="font-serif italic text-sm text-[#59493f]">
                      "Buy 7 drinks, the 8th is on the house."
                    </p>
                    <p className="text-[10px] font-sans text-[#8a7b70] mt-0.5">
                      {customer?.welcomeBonusGranted && currentStamps <= 2
                        ? '🎉 Welcome Bonus applied (+2 Stamps). 5 qualifying purchases unlock your 1st Free Drink.'
                        : 'Collect 7 stamps on qualifying drinks to unlock your next Free Drink reward.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                    <span className="bg-[#c9833a]/15 text-[#8a531e] border border-[#c9833a]/40 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {currentStamps} OF 7 STAMPED
                    </span>
                    <span className="text-[10px] font-sans text-[#8a7b70]">
                      Slot 8 = Free Drink
                    </span>
                  </div>
                </div>

                {/* 8 STAMP CELLS (2 rows of 4) */}
                <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const isStamped = currentStamps >= num;
                    const isJustAnimated = stampAnimationIndex === num;

                    return (
                      <div
                        key={num}
                        className={`relative aspect-square border-2 rounded-xl flex flex-col items-center justify-center p-2 transition-all duration-300 ${
                          isStamped
                            ? 'border-[#351016] bg-[#eee9de]/90 shadow-2xs'
                            : 'border-dashed border-[#ded7c8] bg-white/60 hover:bg-[#faf6ef]'
                        } ${isJustAnimated ? 'scale-110 ring-2 ring-[#c9833a]' : ''}`}
                      >
                        <span className="absolute top-1 left-1.5 text-[9px] font-mono text-[#8a7b70]">
                          0{num}
                        </span>

                        {isStamped ? (
                          <div
                            className="flex flex-col items-center text-[#351016] animate-in zoom-in-50 duration-200"
                            style={{
                              transform: `rotate(${((num * 7) % 18) - 9}deg)`,
                            }}
                          >
                            <VentyLogo
                              className="h-8 w-auto max-w-[48px]"
                              imgClassName="h-full w-auto max-h-8 max-w-[48px] object-contain block"
                            />
                            <span className="text-[8px] font-mono uppercase tracking-widest mt-1 text-[#351016] font-bold">
                              STAMPED
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center opacity-30 text-[#8a7b70]">
                            <Coffee className="w-5 h-5 stroke-[1.2]" />
                            <span className="text-[8px] font-sans uppercase tracking-widest mt-1">
                              Open
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 8th Slot: REWARD FREE DRINK (Position 8) */}
                  {(() => {
                    const hasAvailableReward = availableRewardsCount > 0;
                    const hasRedeemedReward = (customer?.redeemedRewards.length || 0) > 0;

                    let slotState: 'OPEN' | 'REWARD READY' | 'REDEEMED' = 'OPEN';
                    if (hasAvailableReward) slotState = 'REWARD READY';
                    else if (hasRedeemedReward && currentStamps === 0) slotState = 'REDEEMED';

                    return (
                      <div
                        className={`relative aspect-square border-2 rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all duration-300 ${
                          slotState === 'REWARD READY'
                            ? 'border-[#c9833a] bg-[#c9833a]/25 shadow-md ring-2 ring-[#c9833a]/50 animate-pulse'
                            : slotState === 'REDEEMED'
                            ? 'border-[#2e7d32] bg-[#2e7d32]/10'
                            : 'border-dashed border-[#c9833a]/60 bg-[#eee9de]/40'
                        }`}
                      >
                        <span className="absolute top-1 left-1.5 text-[9px] font-mono text-[#c9833a] font-bold">
                          08
                        </span>

                        {slotState === 'REWARD READY' ? (
                          <div className="flex flex-col items-center text-[#351016]">
                            <Gift className="w-6 h-6 text-[#c9833a] animate-bounce" />
                            <span className="text-[8.5px] font-serif italic font-bold text-[#351016] mt-1 leading-tight">
                              FREE DRINK!
                            </span>
                          </div>
                        ) : slotState === 'REDEEMED' ? (
                          <div className="flex flex-col items-center text-[#2e7d32]">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-[8px] font-sans font-bold uppercase tracking-wider mt-1">
                              Redeemed
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-[#c9833a]">
                            <Gift className="w-5 h-5 opacity-70" />
                            <span className="text-[8px] font-sans font-bold uppercase tracking-wider mt-1 text-[#351016]">
                              Free Drink
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Footer Progress Note & Instant Action */}
                <div className="pt-3 border-t border-[#ded7c8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {availableRewardsCount > 0 ? (
                      <p className="text-xs font-serif font-bold text-[#351016] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#c9833a]" />
                        You have {availableRewardsCount} unlocked free drink {availableRewardsCount === 1 ? 'reward' : 'rewards'} ready to claim!
                      </p>
                    ) : (
                      <p className="text-xs font-sans text-[#59493f]">
                        <strong className="text-[#351016]">{remainingForReward} more qualifying {remainingForReward === 1 ? 'drink' : 'drinks'}</strong> for your free espresso, iced latte, or juice.
                      </p>
                    )}
                    {customer && (customer.lifetimeStamps > 0 || customer.redeemedRewards.length > 0) && (
                      <p className="text-[11px] font-sans text-[#8a7b70] mt-0.5">
                        Lifetime earned stamps: <strong>{customer.lifetimeStamps}</strong> · Free drinks enjoyed: <strong>{customer.redeemedRewards.length}</strong>
                      </p>
                    )}
                  </div>

                  {availableRewardsCount > 0 && customer && (
                    <button
                      onClick={() => handleOpenCustomerRedemption(customer.availableRewards[0])}
                      className="bg-[#c9833a] hover:bg-[#b5732d] text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wide shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Redeem Free Drink →
                    </button>
                  )}
                </div>
              </div>

              {/* 3. IN-SHOP PRESENTATION & QUICK ACTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#eee9de] p-4 rounded-2xl border border-[#ded7c8] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-[#ded7c8] rounded-xl flex items-center justify-center text-[#351016] shadow-2xs">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-xs text-[#221a14]">
                        At the Venty Counter?
                      </p>
                      <p className="font-sans text-[11px] text-[#7a6b61]">
                        Quote: <strong className="text-[#351016]">{customer ? customer.phone : 'Your Phone'}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-[#ded7c8] text-[#351016]">
                    {customer ? customer.id : 'VENTY-MEMBER'}
                  </span>
                </div>

                <div className="bg-[#eee9de] p-4 rounded-2xl border border-[#ded7c8] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-[#ded7c8] rounded-xl flex items-center justify-center text-[#c9833a] shadow-2xs">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-xs text-[#221a14]">
                        Order Online
                      </p>
                      <p className="font-sans text-[11px] text-[#7a6b61]">
                        Earn stamps automatically
                      </p>
                    </div>
                  </div>

                  {onOpenOrderAhead && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenOrderAhead();
                      }}
                      className="bg-[#351016] hover:bg-[#c9833a] text-[#faf6ee] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Order Ahead →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: AVAILABLE & REDEEMED REWARDS LIST
              ======================================================== */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div className="border-b border-[#ded7c8] pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-xl text-[#221a14]">
                    Your Free Drink Rewards
                  </h4>
                  <p className="font-sans text-xs text-[#59493f] mt-0.5">
                    Unlocked automatically after every 7 qualifying coffee, tea, cooler, or juice purchases.
                  </p>
                </div>
                <span className="text-xs font-bold bg-[#c9833a]/20 text-[#8a531e] px-3 py-1 rounded-full border border-[#c9833a]/30">
                  {availableRewardsCount} Available
                </span>
              </div>

              <div className="space-y-3">
                <span className="font-sans text-[11px] uppercase tracking-wider font-semibold text-[#8a7b70] block">
                  Available to Claim
                </span>

                {!customer || customer.availableRewards.length === 0 ? (
                  <div className="bg-[#eee9de] p-8 text-center rounded-2xl border border-[#ded7c8] space-y-2">
                    <Gift className="w-8 h-8 text-[#8a7b70] mx-auto opacity-70" />
                    <p className="font-serif font-bold text-base text-[#221a14]">
                      No available rewards right now
                    </p>
                    <p className="font-sans text-xs text-[#59493f] max-w-sm mx-auto">
                      You are {remainingForReward} stamps away from unlocking your next free beverage at Venty!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customer.availableRewards.map((reward) => (
                      <div
                        key={reward.rewardId}
                        className="bg-white border-2 border-[#c9833a] p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 bg-[#c9833a]/15 text-[#c9833a] rounded-xl flex items-center justify-center shrink-0">
                            <Gift className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-serif font-bold text-base text-[#2d1217]">
                                1 Free Drink on the House
                              </h5>
                              <span className="bg-[#2e7d32]/15 text-[#2e7d32] border border-[#2e7d32]/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                                Ready
                              </span>
                            </div>
                            <p className="font-sans text-xs text-[#59493f] mt-0.5">
                              Valid for any hot brew, iced latte, mojito, or pure fruit juice.
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-[#8a7b70] font-mono mt-2">
                              <span>Code: <strong className="text-[#351016]">{reward.redemptionCode}</strong></span>
                              <span>·</span>
                              <span>Issued: {formatAlgiersDate(reward.issuedAt)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenCustomerRedemption(reward)}
                          className="bg-[#351016] hover:bg-[#c9833a] text-[#faf6ee] px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
                        >
                          Redeem Now →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {customer && customer.redeemedRewards.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#ded7c8]">
                  <span className="font-sans text-[11px] uppercase tracking-wider font-semibold text-[#8a7b70] block">
                    Redemption History ({customer.redeemedRewards.length})
                  </span>
                  <div className="divide-y divide-[#ded7c8] border border-[#ded7c8] bg-white rounded-2xl overflow-hidden">
                    {customer.redeemedRewards.map((r) => (
                      <div key={r.rewardId} className="p-4 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-[#2e7d32]" />
                          <div>
                            <span className="font-semibold text-[#221a14] block">
                              Free Drink Redeemed
                            </span>
                            <span className="text-[11px] text-[#7a6b61] font-mono">
                              Code {r.redemptionCode} · Verified by {r.redemptionStaffId || 'Staff'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#8a7b70] font-mono">
                          {r.redeemedAt ? formatAlgiersDate(r.redeemedAt) : 'Redeemed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 3: PERMANENT AUDIT ACTIVITY LEDGER
              ======================================================== */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="border-b border-[#ded7c8] pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-xl text-[#221a14]">
                    Loyalty Transaction Ledger
                  </h4>
                  <p className="font-sans text-xs text-[#59493f] mt-0.5">
                    Immutable history of earned stamps, bonuses, and redeemed rewards ({VENTY_TIMEZONE}).
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#ded7c8] border border-[#ded7c8] bg-white rounded-2xl overflow-hidden shadow-2xs">
                {getLoyaltyLedger(customer ? customer.id : undefined).map((tx) => (
                  <div key={tx.id} className="p-4 flex items-start justify-between gap-3 hover:bg-[#faf6ef]/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          tx.type === 'WELCOME_BONUS'
                            ? 'bg-[#c9833a]/20 text-[#c9833a]'
                            : tx.type === 'REWARD_ISSUED' || tx.type === 'REWARD_REDEEMED'
                            ? 'bg-[#2e7d32]/15 text-[#2e7d32]'
                            : tx.type === 'ADMIN_ADJUSTMENT'
                            ? 'bg-[#8a7b70]/20 text-[#351016]'
                            : 'bg-[#351016]/10 text-[#351016]'
                        }`}
                      >
                        {tx.type === 'REWARD_ISSUED' || tx.type === 'REWARD_REDEEMED' ? (
                          <Gift className="w-4 h-4" />
                        ) : tx.type === 'WELCOME_BONUS' ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <Coffee className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <p className="font-serif font-semibold text-xs sm:text-sm text-[#221a14]">
                          {tx.note}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#7a6b61]">
                          <span className="font-mono">{tx.id}</span>
                          <span>·</span>
                          <span>
                            {tx.source === 'ONLINE_ORDER'
                              ? 'Online Order'
                              : tx.source === 'SIGNUP_BONUS'
                              ? 'Welcome Bonus'
                              : tx.source === 'COUNTER_SCAN'
                              ? 'In-Shop Counter'
                              : 'Loyalty Counter'}
                          </span>
                          <span>·</span>
                          <span>{formatAlgiersDateTime(tx.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {tx.stampsDelta > 0 ? (
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#2e7d32]">
                          +{tx.stampsDelta} Stamps
                        </span>
                      ) : tx.stampsDelta < 0 ? (
                        <span className="font-mono font-bold text-xs sm:text-sm text-red-600">
                          {tx.stampsDelta} Stamps
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-[#8a7b70]">
                          Reward Event
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: CUSTOMER SIGNUP / LOGIN / PROFILE (SECTIONS 1, 2, 3)
              ======================================================== */}
          {activeTab === 'signup' && (
            <div className="max-w-lg mx-auto space-y-6 py-2">
              {/* Sub-mode switcher */}
              {!customer ? (
                <div className="flex items-center justify-center gap-2 bg-[#eee9de] p-1.5 rounded-xl border border-[#ded7c8]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthInfoMessage(null);
                      setAuthSubMode('login');
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      authSubMode === 'login'
                        ? 'bg-[#351016] text-[#faf6ef]'
                        : 'text-[#59493f] hover:text-[#221a14]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthInfoMessage(null);
                      setAuthSubMode('signup');
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      authSubMode === 'signup'
                        ? 'bg-[#351016] text-[#faf6ef]'
                        : 'text-[#59493f] hover:text-[#221a14]'
                    }`}
                  >
                    Create Account (+2 Stamps)
                  </button>
                </div>
              ) : null}

              {authError && authSubMode !== 'forgot-password' && (
                <motion.div
                  key={`auth-error-${authShakeKey}`}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: -4 }}
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                  }
                  transition={{ duration: 0.36, ease: 'easeInOut' }}
                  role="alert"
                  className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-sans flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{authError}</span>
                </motion.div>
              )}

              {authInfoMessage && !authError && authSubMode !== 'forgot-password' && (
                <div className="p-3.5 bg-[#2e7d32]/10 border border-[#2e7d32]/30 rounded-xl text-xs text-[#2e7d32] font-sans flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{authInfoMessage}</span>
                </div>
              )}

              {customer && authSubMode === 'profile' ? (
                /* CUSTOMER PROFILE VIEW & EDIT (SECTION 1) */
                <div className="space-y-5">
                  <div className="text-center space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 bg-[#351016]/10 text-[#351016] text-xs font-bold px-3 py-1 rounded-full">
                      Customer ID: {customer.customerId}
                    </span>
                    <h4 className="font-serif font-bold text-2xl text-[#221a14]">
                      Your Venty Customer Profile
                    </h4>
                    <p className="font-sans text-xs text-[#59493f]">
                      Member since {formatAlgiersDate(customer.createdAt)} · Last updated {formatAlgiersDateTime(customer.updatedAt)}
                    </p>
                  </div>

                  <form
                    onSubmit={handleCustomerProfileSave}
                    className="bg-white border border-[#ded7c8] p-6 rounded-2xl shadow-xs space-y-4"
                  >
                    <div>
                      <label className="block font-sans text-xs font-semibold text-[#221a14] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full bg-[#faf6ef] border border-[#ded7c8] px-4 py-2.5 rounded-xl text-sm text-[#221a14] focus:outline-none focus:border-[#351016]"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-semibold text-[#221a14] mb-1">
                        Phone Number (Algeria) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full bg-[#faf6ef] border border-[#ded7c8] px-4 py-2.5 rounded-xl text-sm font-mono text-[#221a14] focus:outline-none focus:border-[#351016]"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-semibold text-[#221a14] mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full bg-[#faf6ef] border border-[#ded7c8] px-4 py-2.5 rounded-xl text-sm text-[#221a14] focus:outline-none focus:border-[#351016]"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-semibold text-[#221a14] mb-1">
                        Favourite Venty Drink (Optional)
                      </label>
                      <select
                        value={profileForm.favouriteDrink}
                        onChange={(e) => setProfileForm({ ...profileForm, favouriteDrink: e.target.value })}
                        className="w-full bg-[#faf6ef] border border-[#ded7c8] px-4 py-2.5 rounded-xl text-sm text-[#221a14] focus:outline-none focus:border-[#351016]"
                      >
                        <option value="Iced Specialty Latte">Iced Specialty Latte</option>
                        <option value="Double Espresso">Double Espresso</option>
                        <option value="Venty Signature Mojito">Venty Signature Mojito</option>
                        <option value="Cappuccino">Cappuccino</option>
                        <option value="Fresh Fruit Juice">Fresh Fruit Juice</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCustomerLogout}
                        className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                      >
                        Log Out
                      </button>
                      <button
                        type="submit"
                        className="bg-[#351016] hover:bg-[#c9833a] text-[#faf6ef] px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Save Profile Changes
                      </button>
                    </div>
                  </form>
                </div>
              ) : authSubMode === 'forgot-password' ? (
                /* SECURE PASSWORD RECOVERY VIEW (DARK VENTY BRAND AESTHETIC, SINGLE-USE, NON-ENUMERATING) */
                <motion.div
                  key={`forgot-password-card-${authShakeKey}`}
                  animate={
                    authShakeKey > 0 && !prefersReducedMotion
                      ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.42, ease: 'easeInOut' }}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1e0a0e] via-[#260d12] to-[#140609] border border-[#c9833a]/35 p-6 sm:p-7 text-[#faf6ef] shadow-2xl space-y-5"
                >
                  {/* Subtle Dark VENTY Ambient Glow */}
                  <div
                    className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full opacity-20 blur-3xl"
                    style={{
                      background: 'radial-gradient(circle, #c9833a 0%, transparent 70%)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Header */}
                  <div className="relative z-10 text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c9833a]/15 border border-[#c9833a]/35 text-[#e8b878] text-[11px] font-sans font-bold uppercase tracking-[0.18em]">
                      <Lock className="w-3.5 h-3.5 text-[#c9833a]" />
                      <span>Account Assistance</span>
                    </div>

                    <h4 className="font-serif font-bold text-2xl sm:text-3xl text-[#faf6ef] tracking-tight">
                      Password Assistance
                    </h4>

                    <p className="font-sans text-xs text-[#d8cfc2]/80 max-w-md mx-auto leading-relaxed">
                      To keep your VENTY account safe, password recovery assistance is provided directly at our café in Miliana with our staff.
                    </p>
                  </div>

                  {/* Dark VENTY Feedback Banners (Non-enumerating info or error) */}
                  {authError && (
                    <div
                      role="alert"
                      className="relative z-10 p-3.5 rounded-xl bg-[#c62828]/20 border border-[#ef5350]/40 text-xs text-[#ffcdd2] font-sans flex items-center gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#ff8a80]" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authInfoMessage && !authError && (
                    <div
                      role="status"
                      className="relative z-10 p-3.5 rounded-xl bg-[#c9833a]/15 border border-[#c9833a]/40 text-xs text-[#f3e5ab] font-sans flex items-start gap-2.5"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0 text-[#e8b878] mt-0.5" />
                      <div className="space-y-1">
                        <p className="leading-relaxed">{authInfoMessage}</p>
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={handleRequestPasswordResetSubmit}
                    className="relative z-10 space-y-4 pt-1"
                  >
                    <div>
                      <label
                        htmlFor="venty-forgot-phone"
                        className="block font-sans text-xs font-semibold text-[#e8b878] mb-1.5"
                      >
                        Registered Phone Number *
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-[#c9833a]/80 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="venty-forgot-phone"
                          type="tel"
                          required
                          autoComplete="tel"
                          value={forgotPhoneInput}
                          onChange={(e) => setForgotPhoneInput(e.target.value)}
                          placeholder="e.g. 0550 12 34 56"
                          className="w-full bg-[#120507]/90 border border-[#c9833a]/35 pl-10 pr-4 py-3.5 rounded-xl text-sm font-mono text-[#faf6ef] placeholder:text-[#d8cfc2]/35 focus:outline-none focus:border-[#e8b878] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#faf6ef]/[0.05] border border-[#c9833a]/25 space-y-2 text-xs text-[#d8cfc2]/90 font-sans">
                      <div className="flex items-center gap-2 font-semibold text-[#e8b878]">
                        <Coffee className="w-4 h-4 text-[#c9833a]" />
                        <span>In-Store Barista Reset Support</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#d8cfc2]/75">
                        Our baristas can verify your phone number and assist you with your account directly at the counter in Miliana (Daily 17:00 – 1:00).
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthBusy}
                      className="w-full bg-gradient-to-r from-[#c9833a] to-[#dfb06c] hover:from-[#d69045] hover:to-[#e8b878] disabled:opacity-60 text-[#18090c] py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.16em] transition-all cursor-pointer shadow-lg"
                    >
                      {isAuthBusy ? 'PROCESSING...' : 'REQUEST IN-PERSON ASSISTANCE'}
                    </button>

                    <div className="flex items-center justify-between pt-3 border-t border-[#faf6ef]/10 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setAuthInfoMessage(null);
                          setAuthSubMode('login');
                        }}
                        className="text-[#e8b878] hover:text-[#faf6ef] font-semibold cursor-pointer transition-colors"
                      >
                        ← Back to Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setAuthInfoMessage(null);
                          setAuthSubMode('signup');
                        }}
                        className="text-[#d8cfc2]/80 hover:text-[#e8b878] hover:underline font-medium cursor-pointer transition-colors"
                      >
                        Create Account →
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : authSubMode === 'login' ? (
                /* CUSTOMER LOGIN FLOW: PHONE NUMBER + PASSWORD -> SERVER AUTH -> CUSTOMER SESSION */
                <motion.div
                  key={`login-card-${authShakeKey}`}
                  animate={
                    authShakeKey > 0 && !prefersReducedMotion
                      ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.42, ease: 'easeInOut' }}
                  className="space-y-5"
                >
                  <div className="text-center space-y-2">
                    <span className="inline-flex items-center gap-1.5 bg-[#351016]/10 text-[#351016] text-xs font-bold px-3 py-1 rounded-full">
                      Welcome Back to VENTY
                    </span>
                    <h4 className="font-serif font-bold text-2xl text-[#221a14]">
                      Sign In to Your Account
                    </h4>
                    <p className="font-sans text-xs text-[#59493f]">
                      Enter your phone number and password to access your VENTY Loyalty Card, rewards, and order history.
                    </p>
                  </div>

                  <form
                    onSubmit={handleCustomerLoginSubmit}
                    className={`bg-white border p-6 rounded-2xl shadow-xs space-y-4 transition-colors ${
                      authError ? 'border-red-300' : 'border-[#ded7c8]'
                    }`}
                  >
                    <div>
                      <label
                        htmlFor="venty-login-phone"
                        className="block font-sans text-xs font-semibold text-[#221a14] mb-1"
                      >
                        Phone Number *
                      </label>
                      <input
                        id="venty-login-phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={loginPhoneInput}
                        onChange={(e) => setLoginPhoneInput(e.target.value)}
                        placeholder="e.g. 0550 12 34 56"
                        className="w-full bg-[#faf6ef] border border-[#ded7c8] px-4 py-3 rounded-xl text-sm font-mono text-[#221a14] focus:outline-none focus:border-[#351016]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="venty-login-password"
                          className="block font-sans text-xs font-semibold text-[#221a14]"
                        >
                          Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotPhoneInput(loginPhoneInput.trim());
                            setForgotResetStep('request');
                            setAuthError(null);
                            setAuthInfoMessage(null);
                            setAuthSubMode('forgot-password');
                          }}
                          className="font-sans text-xs font-semibold text-[#c9833a] hover:text-[#351016] hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          id="venty-login-password"
                          type={showLoginPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={loginPasswordInput}
                          onChange={(e) => setLoginPasswordInput(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full bg-[#faf6ef] border border-[#ded7c8] pl-4 pr-11 py-3 rounded-xl text-sm text-[#221a14] focus:outline-none focus:border-[#351016]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                          aria-pressed={showLoginPassword}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#7a6b61] hover:text-[#351016] hover:bg-[#eee9de] transition-colors cursor-pointer"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthBusy}
                      className="w-full bg-[#351016] hover:bg-[#c9833a] disabled:opacity-60 text-[#faf6ef] py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.14em] transition-all cursor-pointer shadow-md"
                    >
                      {isAuthBusy ? 'SIGNING IN...' : 'SIGN IN'}
                    </button>

                    <div className="flex items-center justify-between pt-3 border-t border-[#eee9de] text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPhoneInput(loginPhoneInput.trim());
                          setForgotResetStep('request');
                          setAuthError(null);
                          setAuthInfoMessage(null);
                          setAuthSubMode('forgot-password');
                        }}
                        className="text-[#6b3a1f] hover:text-[#351016] hover:underline font-medium cursor-pointer"
                      >
                        Forgot Password?
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setAuthInfoMessage(null);
                          setAuthSubMode('signup');
                        }}
                        className="text-[#351016] hover:text-[#c9833a] font-bold cursor-pointer"
                      >
                        Create Account →
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* CUSTOMER CREATE ACCOUNT FLOW (FULL NAME, PHONE NUMBER, PASSWORD, CONFIRM PASSWORD, OPTIONAL EMAIL, OPTIONAL FAVOURITE DRINK) */
                <motion.div
                  key={`signup-card-${authShakeKey}`}
                  animate={
                    authShakeKey > 0 && !prefersReducedMotion
                      ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.42, ease: 'easeInOut' }}
                  className="space-y-5"
                >
                  <div className="text-center space-y-2">
                    <span className="inline-flex items-center gap-1.5 bg-[#c9833a]/20 text-[#8a531e] text-xs font-bold px-3 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5" />
                      +2 WELCOME STAMPS FOR NEW MEMBERS
                    </span>
                    <h4 className="font-serif font-bold text-2xl text-[#221a14]">
                      Create Your Venty Account
                    </h4>
                    <p className="font-sans text-xs text-[#59493f]">
                      New members receive <strong>+2 welcome stamps</strong> immediately upon creating their account.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSignupSubmit}
                    className={`bg-white border p-6 rounded-2xl shadow-xs space-y-4 transition-colors ${
                      authError ? 'border-red-300' : 'border-[#ded7c8]'
                    }`}
                  >
                    <div>
                      <label
                        htmlFor="venty-signup-name"
                        className="block font-sans text-xs font-semibold text-[#221a14] mb-1"
                      >
                        Full Name *
                      </label>
                      <input
                        id="venty-signup-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                        placeholder="e.g. Amine Benali"
                        className="w-full bg-[#faf6ef] border border-[#ded7c8] px-4 py-2.5 rounded-xl text-sm text-[#221a14] focus:outline-none focus:border-[#351016]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="venty-signup-phone"
                        className="block font-sans text-xs font-semibold text-[#221a14] mb-1"
                      >
                        Phone Number *
                      </label>
                      <input
                        id="venty-signup-phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={signupForm.phone}
                        onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                        placeholder="e.g. 0550 12 34 56"
                        className="w-full bg-[#faf6ef] border border-[#ded7c8] px-4 py-2.5 rounded-xl text-sm font-mono text-[#221a14] focus:outline-none focus:border-[#351016]"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="venty-signup-password"
                            className="block font-sans text-xs font-semibold text-[#221a14] mb-1"
                          >
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              id="venty-signup-password"
                              type={showSignupPassword ? 'text' : 'password'}
                              required
                              minLength={8}
                              autoComplete="new-password"
                              value={signupForm.password}
                              onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                              placeholder="Min. 8 characters"
                              className="w-full bg-[#faf6ef] border border-[#ded7c8] pl-4 pr-11 py-2.5 rounded-xl text-sm text-[#221a14] focus:outline-none focus:border-[#351016]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupPassword((prev) => !prev)}
                              aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                              aria-pressed={showSignupPassword}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#7a6b61] hover:text-[#351016] hover:bg-[#eee9de] transition-colors cursor-pointer"
                            >
                              {showSignupPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="venty-signup-confirm-password"
                            className="block font-sans text-xs font-semibold text-[#221a14] mb-1"
                          >
                            Confirm Password *
                          </label>
                          <div className="relative">
                            <input
                              id="venty-signup-confirm-password"
                              type={showSignupConfirmPassword ? 'text' : 'password'}
                              required
                              minLength={8}
                              autoComplete="new-password"
                              value={signupForm.confirmPassword}
                              onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                              placeholder="Confirm password"
                              className="w-full bg-[#faf6ef] border border-[#ded7c8] pl-4 pr-11 py-2.5 rounded-xl text-sm text-[#221a14] focus:outline-none focus:border-[#351016]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                              aria-label={showSignupConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                              aria-pressed={showSignupConfirmPassword}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#7a6b61] hover:text-[#351016] hover:bg-[#eee9de] transition-colors cursor-pointer"
                            >
                              {showSignupConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {signupForm.confirmPassword.length > 0 && (
                            <p
                              className={`mt-1 text-[11px] font-sans font-medium ${
                                signupForm.password === signupForm.confirmPassword
                                  ? 'text-[#2e7d32]'
                                  : 'text-[#c62828]'
                              }`}
                            >
                              {signupForm.password === signupForm.confirmPassword
                                ? '✓ Passwords match'
                                : 'Passwords do not match yet'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Real-time Password Strength Indicator (Weak / Fair / Strong) */}
                      <PasswordStrengthIndicator password={signupForm.password} />
                    </div>

                    <div>
                      <label
                        htmlFor="venty-signup-email"
                        className="block font-sans text-xs font-semibold text-[#221a14] mb-1"
                      >
                        Optional Email
                      </label>
                      <input
                        id="venty-signup-email"
                        type="email"
                        autoComplete="email"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full bg-[#faf6ef] border border-[#ded7c8] px-4 py-2.5 rounded-xl text-sm text-[#221a14] focus:outline-none focus:border-[#351016]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="venty-signup-drink"
                        className="block font-sans text-xs font-semibold text-[#221a14] mb-1"
                      >
                        Optional Favourite Drink
                      </label>
                      <select
                        id="venty-signup-drink"
                        value={signupForm.favouriteDrink}
                        onChange={(e) => setSignupForm({ ...signupForm, favouriteDrink: e.target.value })}
                        className="w-full bg-[#faf6ef] border border-[#ded7c8] px-4 py-2.5 rounded-xl text-sm text-[#221a14] focus:outline-none focus:border-[#351016]"
                      >
                        <option value="Iced Specialty Latte">Iced Specialty Latte</option>
                        <option value="Flat White">Flat White</option>
                        <option value="Double Espresso">Double Espresso</option>
                        <option value="Venty Signature Mojito">Venty Signature Mojito</option>
                        <option value="Cappuccino">Cappuccino</option>
                        <option value="Fresh Fruit Juice">Fresh Fruit Juice</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthBusy}
                      className="w-full bg-[#351016] hover:bg-[#c9833a] disabled:opacity-60 text-[#faf6ef] py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.14em] transition-all cursor-pointer shadow-md mt-2"
                    >
                      {isAuthBusy ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                    </button>

                    <div className="text-center pt-2 border-t border-[#eee9de] text-xs">
                      <span className="text-[#59493f]">Already have a VENTY account? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setAuthInfoMessage(null);
                          setAuthSubMode('login');
                        }}
                        className="text-[#351016] hover:text-[#c9833a] font-bold cursor-pointer"
                      >
                        Sign In →
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-[#ded7c8] bg-[#eee9de]/70 flex flex-wrap items-center justify-between gap-2 text-xs text-[#7a6b61]">
          <span>
            Rule: <strong>7 Qualifying Drinks = 1 Free Drink</strong> (New members get +2 Welcome Stamps once).
          </span>

          <button
            onClick={onClose}
            className="text-[#59493f] hover:text-[#221a14] font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* SECURE REWARD REDEMPTION MODAL DIALOG */}
      {redemptionConfirmModal && selectedRewardToRedeem && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setRedemptionConfirmModal(false)}
        >
          <div
            className="bg-[#faf6ef] border-2 border-[#c9833a] p-6 sm:p-7 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setRedemptionConfirmModal(false)}
              className="absolute top-4 right-4 text-[#8a7b70] hover:text-[#351016] p-1.5 rounded-full hover:bg-black/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 bg-[#c9833a]/20 text-[#c9833a] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Gift className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8a7b70] font-bold block">
                Miliana Counter Redemption
              </span>
              <h4 className="font-serif font-bold text-2xl text-[#2d1217]">
                FREE DRINK
              </h4>
              <p className="font-sans text-xs text-[#59493f]">
                Your reward is ready. Redeem this reward now?
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#ded7c8] shadow-inner inline-block relative group">
              <QRCodeSVG
                value={`VENTY_REWARD_TOKEN:${selectedRewardToRedeem.redemptionToken}`}
                size={160}
                bgColor="#ffffff"
                fgColor="#351016"
                level="Q"
                className="mx-auto"
              />
              <span className="text-[9px] font-mono text-[#8a7b70] block mt-1">
                Scan at Counter
              </span>
            </div>

            <div className="space-y-1.5">
              <div
                onClick={() => copyToClipboard(selectedRewardToRedeem.redemptionCode)}
                className="bg-[#eee9de] hover:bg-[#e4ddcf] border border-[#ded7c8] px-4 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                title="Click to copy redemption code"
              >
                <span className="font-mono text-base sm:text-lg font-bold text-[#351016] tracking-wider">
                  {selectedRewardToRedeem.redemptionCode}
                </span>
                <span className="text-[10px] font-sans font-semibold text-[#8a7b70] group-hover:text-[#351016]">
                  Copy 📋
                </span>
              </div>
              <p className="text-[11px] font-sans text-[#7a6b61]">
                Present this QR code or code to the barista at Venty Miliana.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleExecuteCustomerRedeem}
                className="w-full bg-[#351016] hover:bg-[#c9833a] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Redeem Reward Now
              </button>
              <button
                onClick={() => setRedemptionConfirmModal(false)}
                className="w-full text-xs text-[#8a7b70] hover:text-[#221a14] py-1.5 cursor-pointer"
              >
                Cancel / Keep for Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
