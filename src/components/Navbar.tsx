import React, { useState, useEffect, useRef } from 'react';
import {
  Menu as MenuIcon,
  X,
  History,
  ShoppingBag,
  User,
  UserCheck,
  Award,
  Gift,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useOfficialLogo } from './VentyLogo';
import { getActiveCustomer, setActiveCustomer } from '../services/loyalty';
import { clearSessionToken, logoutFromBackend } from '../services/loyaltyApi';
import { LoyaltyCustomer } from '../types/loyalty';

interface NavbarProps {
  onOpenMenu: () => void;
  onOpenOrder: () => void;
  onOpenLoyalty: () => void;
  onOpenCustomerAuth?: (mode: 'login' | 'signup' | 'card') => void;
  onOpenHistory?: () => void;
  onOpenScanMenu?: () => void;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMenu,
  onOpenOrder,
  onOpenLoyalty,
  onOpenCustomerAuth,
  onOpenHistory,
  cartCount,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [activeCustomer, setActiveCustomerState] = useState<LoyaltyCustomer | null>(() =>
    getActiveCustomer(),
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logoSrc } = useOfficialLogo();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      setActiveCustomerState(getActiveCustomer());
    };
    syncAuthState();
    window.addEventListener('venty:loyalty:updated', syncAuthState);
    window.addEventListener('venty-loyalty-updated', syncAuthState);
    window.addEventListener('venty-stamp-earned', syncAuthState);
    window.addEventListener('venty:orders:updated', syncAuthState);
    return () => {
      window.removeEventListener('venty:loyalty:updated', syncAuthState);
      window.removeEventListener('venty-loyalty-updated', syncAuthState);
      window.removeEventListener('venty-stamp-earned', syncAuthState);
      window.removeEventListener('venty:orders:updated', syncAuthState);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    setAccountDropdownOpen(false);
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenCustomerCard = () => {
    setMobileMenuOpen(false);
    setAccountDropdownOpen(false);
    if (onOpenCustomerAuth) {
      onOpenCustomerAuth('card');
    } else {
      onOpenLoyalty();
    }
  };

  const handleOpenSignIn = () => {
    setMobileMenuOpen(false);
    setAccountDropdownOpen(false);
    if (onOpenCustomerAuth) {
      onOpenCustomerAuth('login');
    } else {
      onOpenLoyalty();
    }
  };

  const handleCustomerLogout = async () => {
    setAccountDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      await logoutFromBackend('CUSTOMER');
    } catch {
      // ignore network failure
    }
    clearSessionToken('CUSTOMER');
    setActiveCustomer(null);
    setActiveCustomerState(null);
  };

  const customerFirstName = activeCustomer?.name
    ? activeCustomer.name.trim().split(/\s+/)[0]
    : '';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#faf6ef]/95 backdrop-blur-md border-b border-[#ded7c8]/70 shadow-[0_4px_20px_-10px_rgba(43,29,22,0.08)]'
          : 'bg-[#faf6ef]/95 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
        {/* Brand Zone: Official VENTY THE COFFEE Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('top');
          }}
          className="flex items-center gap-2.5 group transition-opacity hover:opacity-95 shrink-0"
        >
          <div className="relative h-10 md:h-11 w-auto max-w-[150px] flex items-center justify-center shrink-0 transition-all duration-300 ease-out group-hover:scale-105">
            <img
              src={logoSrc}
              alt="VENTY THE COFFEE Official Logo"
              className="h-full w-auto max-h-10 md:max-h-11 max-w-[150px] object-contain block"
            />
          </div>

          <div className="flex flex-col">
            <span className="font-serif italic font-bold text-xl sm:text-2xl tracking-tight text-[#381c10] leading-none">
              VENTY
            </span>
            <span className="font-sans uppercase text-[8.5px] tracking-[0.22em] text-[#8a7b70] font-semibold mt-0.5">
              The Coffee · Miliana
            </span>
          </div>
        </a>

        {/* Desktop Primary Navigation: Home · Menu · About · Loyalty · Contact */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[#4a3b32]"
        >
          <button
            type="button"
            onClick={() => scrollTo('top')}
            className="hover:text-[#6b3a1f] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#c9833a] hover:after:w-full after:transition-all after:duration-200 cursor-pointer"
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => scrollTo('menu')}
            className="hover:text-[#6b3a1f] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#c9833a] hover:after:w-full after:transition-all after:duration-200 cursor-pointer"
          >
            Menu
          </button>

          <button
            type="button"
            onClick={() => scrollTo('about')}
            className="hover:text-[#6b3a1f] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#c9833a] hover:after:w-full after:transition-all after:duration-200 cursor-pointer"
          >
            About
          </button>

          <button
            type="button"
            onClick={onOpenLoyalty}
            className="hover:text-[#6b3a1f] transition-colors relative py-1 flex items-center gap-1.5 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#c9833a] hover:after:w-full after:transition-all after:duration-200 cursor-pointer group"
          >
            <Award className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>Loyalty</span>
            {activeCustomer && (
              <span className="text-[10px] font-mono font-bold text-[#6b3a1f]">
                · {activeCustomer.currentStampCount}/7
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => scrollTo('find-us')}
            className="hover:text-[#6b3a1f] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#c9833a] hover:after:w-full after:transition-all after:duration-200 cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* Action Zone: Cart + Customer Account / Sign In + Mobile Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Cart Button (Desktop & Mobile Quick Access) */}
          <button
            type="button"
            onClick={onOpenOrder}
            aria-label={`Open Cart (${cartCount} items)`}
            className="group inline-flex items-center gap-2 bg-[#351016] hover:bg-[#532c17] text-[#faf6ef] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer rounded-lg"
          >
            <ShoppingBag className="w-4 h-4 text-[#c9833a] shrink-0" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-[#c9833a] text-[#18090c] text-[11px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {/* Customer Account / Sign In (With Authenticated Profile/Orders/Loyalty/Rewards/Logout Dropdown) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                if (activeCustomer) {
                  setAccountDropdownOpen((prev) => !prev);
                } else {
                  handleOpenSignIn();
                }
              }}
              aria-label={
                activeCustomer
                  ? `Customer Account: ${activeCustomer.name}`
                  : 'Sign In to Customer Account'
              }
              aria-expanded={activeCustomer ? accountDropdownOpen : undefined}
              className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border transition-all duration-200 active:scale-[0.98] cursor-pointer rounded-lg ${
                activeCustomer
                  ? 'border-[#c9833a]/50 bg-[#f4ede0] hover:bg-[#ebdcc8] text-[#351016]'
                  : 'border-[#6b3a1f]/40 bg-transparent hover:bg-[#6b3a1f]/10 text-[#351016]'
              }`}
            >
              {activeCustomer ? (
                <>
                  <UserCheck className="w-4 h-4 text-[#2e7d32] shrink-0" />
                  <span className="hidden sm:inline font-semibold truncate max-w-[110px]">
                    {customerFirstName || 'Account'}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#6b3a1f] bg-[#c9833a]/20 px-1.5 py-0.5 rounded tabular-nums">
                    {activeCustomer.currentStampCount}/7
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6b3a1f] hidden sm:inline" />
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-[#6b3a1f] shrink-0" />
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Authenticated Customer Dropdown Menu */}
            {activeCustomer && accountDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-[#faf6ef] border border-[#ded7c8] rounded-2xl shadow-xl py-2 z-50 text-xs text-[#221a14]">
                <div className="px-4 py-2.5 border-b border-[#ded7c8]/70">
                  <p className="font-serif font-bold text-sm text-[#351016] truncate">
                    {activeCustomer.name}
                  </p>
                  <p className="font-mono text-[11px] text-[#7a6b61] truncate">
                    {activeCustomer.phone} · {activeCustomer.currentStampCount}/7 Stamps
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleOpenCustomerCard}
                    className="w-full px-4 py-2 text-left hover:bg-[#f4ede0] flex items-center gap-2.5 font-medium cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#c9833a]" />
                    <span>Profile</span>
                  </button>

                  {onOpenHistory && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        onOpenHistory();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#f4ede0] flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-[#c9833a]" />
                      <span>Orders</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenCustomerCard}
                    className="w-full px-4 py-2 text-left hover:bg-[#f4ede0] flex items-center justify-between font-medium cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Award className="w-3.5 h-3.5 text-[#c9833a]" />
                      <span>Loyalty</span>
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#6b3a1f]">
                      {activeCustomer.currentStampCount}/7
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCustomerCard}
                    className="w-full px-4 py-2 text-left hover:bg-[#f4ede0] flex items-center justify-between font-medium cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Gift className="w-3.5 h-3.5 text-[#2e7d32]" />
                      <span>Rewards</span>
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#2e7d32]">
                      {(activeCustomer.availableRewards || []).length} avail
                    </span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[#ded7c8]/70">
                  <button
                    type="button"
                    onClick={handleCustomerLogout}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-700 flex items-center gap-2.5 font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#4a3b32] hover:text-[#6b3a1f] transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#faf6ef] border-b border-[#ded7c8] px-6 py-6 shadow-xl animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {/* Mobile Brand & Customer Summary Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#ded7c8]/60">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-auto max-w-[140px] flex items-center justify-center shrink-0">
                <img
                  src={logoSrc}
                  alt="VENTY THE COFFEE Official Logo"
                  className="h-full w-auto max-h-9 max-w-[140px] object-contain block"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif italic font-bold text-xl tracking-tight text-[#381c10] leading-none">
                  VENTY
                </span>
                <span className="font-sans uppercase text-[8px] tracking-[0.22em] text-[#8a7b70] font-semibold mt-0.5">
                  The Coffee · Miliana
                </span>
              </div>
            </div>

            {activeCustomer && (
              <span className="text-xs font-mono font-semibold text-[#351016] bg-[#f4ede0] border border-[#ded7c8] px-2.5 py-1 rounded-md">
                {activeCustomer.currentStampCount}/7 Stamps
              </span>
            )}
          </div>

          <nav className="flex flex-col gap-3 text-base font-medium text-[#4a3b32]">
            <button
              type="button"
              onClick={() => scrollTo('top')}
              className="text-left py-2 hover:text-[#6b3a1f] transition-colors border-b border-[#ded7c8]/40 cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollTo('menu')}
              className="text-left py-2 hover:text-[#6b3a1f] transition-colors border-b border-[#ded7c8]/40 cursor-pointer"
            >
              Menu
            </button>
            <button
              type="button"
              onClick={() => scrollTo('about')}
              className="text-left py-2 hover:text-[#6b3a1f] transition-colors border-b border-[#ded7c8]/40 cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLoyalty();
              }}
              className="text-left py-2 hover:text-[#6b3a1f] transition-colors border-b border-[#ded7c8]/40 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#c9833a]" />
                <span>Loyalty</span>
              </span>
              <span className="text-[10px] text-[#6b3a1f] bg-[#c9833a]/20 border border-[#c9833a]/30 px-1.5 py-0.5 font-mono uppercase font-bold">
                {activeCustomer ? `${activeCustomer.currentStampCount}/7 Stamps` : '8th Free'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => scrollTo('find-us')}
              className="text-left py-2 hover:text-[#6b3a1f] transition-colors border-b border-[#ded7c8]/40 cursor-pointer"
            >
              Contact
            </button>

            {/* Mobile Customer Account Section */}
            {activeCustomer ? (
              <div className="py-2 border-b border-[#ded7c8]/40 space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-[#8a7b70]">
                  Customer Account ({activeCustomer.name})
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleOpenCustomerCard}
                    className="px-3 py-2 rounded-lg bg-[#f4ede0] border border-[#ded7c8] text-left font-semibold text-[#351016] flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#c9833a]" />
                    <span>Profile</span>
                  </button>
                  {onOpenHistory && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenHistory();
                      }}
                      className="px-3 py-2 rounded-lg bg-[#f4ede0] border border-[#ded7c8] text-left font-semibold text-[#351016] flex items-center gap-2 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-[#c9833a]" />
                      <span>Orders</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenCustomerCard}
                    className="px-3 py-2 rounded-lg bg-[#f4ede0] border border-[#ded7c8] text-left font-semibold text-[#351016] flex items-center gap-2 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-[#c9833a]" />
                    <span>Loyalty ({activeCustomer.currentStampCount}/7)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCustomerCard}
                    className="px-3 py-2 rounded-lg bg-[#f4ede0] border border-[#ded7c8] text-left font-semibold text-[#351016] flex items-center gap-2 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5 text-[#2e7d32]" />
                    <span>Rewards ({(activeCustomer.availableRewards || []).length})</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCustomerLogout}
                  className="w-full py-2 text-left text-xs font-semibold text-red-700 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Customer Account</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenSignIn}
                className="text-left py-2 hover:text-[#6b3a1f] transition-colors border-b border-[#ded7c8]/40 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#c9833a]" />
                  <span>Sign In / Customer Account</span>
                </span>
                <span className="text-xs text-[#8a7b70]">Sign In →</span>
              </button>
            )}

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOrder();
                }}
                className="w-full text-center bg-[#351016] text-[#faf6ef] py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#c9833a]" />
                <span>Cart ({cartCount}) →</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMenu();
                }}
                className="w-full text-center border border-[#6b3a1f] text-[#6b3a1f] py-3 text-sm font-medium rounded-lg cursor-pointer"
              >
                Explore Full Digital Menu
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
