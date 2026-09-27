import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Lock,
  LogOut,
  RefreshCw,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Coffee,
  Award,
  Gift,
  Star,
  BarChart3,
  UserCog,
  Settings as SettingsIcon,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Menu as MenuIcon,
  X,
  ArrowLeft,
  Bell,
  User,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useOfficialLogo } from './VentyLogo';
import {
  getStaffSessionToken,
  getAdminSessionToken,
  clearStaffSessionToken,
  clearAdminSessionToken,
  authenticateAdminSession,
  authenticateStaffPin,
  logoutSessionOnBackend,
  verifyManagementSessionOnBackend,
  fetchManagementOverviewFromBackend,
  fetchOrdersFromBackend,
  updateOrderStatusOnBackend,
  fetchManagementCustomersFromBackend,
  updateManagementCustomerOnBackend,
  updateManagementCustomerStatusOnBackend,
  fetchManagementLoyaltyFromBackend,
  adjustCustomerLoyaltyOnBackend,
  adminAdjustOnBackend,
  orderReversalOnBackend,
  fetchManagementRewardsFromBackend,
  verifyRewardOnBackend,
  verifyRewardCodeOnBackend,
  redeemRewardOnBackend,
  cancelManagementRewardOnBackend,
  fetchManagementMenuFromBackend,
  updateManagementMenuItemOnBackend,
  createManagementMenuItemOnBackend,
  fetchManagementReviewsFromBackend,
  refreshManagementReviewsOnBackend,
  fetchManagementAnalyticsFromBackend,
  fetchManagementStaffFromBackend,
  addManagementStaffOnBackend,
  updateManagementStaffOnBackend,
  revokeStaffSessionsOnBackend,
  fetchManagementSettingsFromBackend,
  updateManagementSettingsOnBackend,
  fetchManagementAuditLogsFromBackend,
} from '../services/loyaltyApi';
import { PastOrder as OrderRecord, OrderStatus } from '../types/coffee';
import {
  formatAlgiersTime,
  formatAlgiersDate,
  formatAlgiersDateTime,
  getAlgiersDateKey,
} from '../utils/algiersTime';
import {
  CustomersManagementView,
  LoyaltyManagementView,
  RewardsManagementView,
} from './management/CustomersLoyaltyRewardsViews';
import {
  MenuManagementView,
  ReviewsManagementView,
  AnalyticsManagementView,
  StaffManagementView,
  SettingsManagementView,
  SecurityAuditView,
} from './management/ManagementSubViews';

export type ManagementSectionId =
  | 'overview'
  | 'orders'
  | 'customers'
  | 'menu'
  | 'loyalty'
  | 'rewards'
  | 'reviews'
  | 'analytics'
  | 'staff'
  | 'settings'
  | 'audit';

interface ManagementPortalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
  onNavigatePath?: (path: string) => void;
}

export const ManagementPortal: React.FC<ManagementPortalProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigatePath,
}) => {
  const { logoSrc: logoUrl } = useOfficialLogo();

  // Active management role & identity verified with server
  const [activeRole, setActiveRole] = useState<'STAFF' | 'ADMIN' | null>(null);
  const [actorIdentity, setActorIdentity] = useState<string>('');
  const [actorName, setActorName] = useState<string>('');
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);

  // Dedicated Management Portal Landing & Auth state
  const [authMode, setAuthMode] = useState<'landing' | 'admin' | 'staff'>('landing');
  const [adminSecret, setAdminSecret] = useState('');
  const [staffPinInput, setStaffPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authShake, setAuthShake] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Navigation state
  const [activeSection, setActiveSection] = useState<ManagementSectionId>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Top bar dropdowns & modals
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Data loading & feedback state
  const [loadingData, setLoadingData] = useState(false);
  const [actionBanner, setActionBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Section datasets
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loyaltyData, setLoyaltyData] = useState<any | null>(null);
  const [rewardsData, setRewardsData] = useState<any | null>(null);
  const [menuData, setMenuData] = useState<any | null>(null);
  const [reviewsData, setReviewsData] = useState<any | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [staffData, setStaffData] = useState<any | null>(null);
  const [settingsData, setSettingsData] = useState<any | null>(null);
  const [auditData, setAuditData] = useState<any | null>(null);

  // Order detail modal state (accessible from Overview pipeline or Orders table)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setActionBanner({ type, message });
    window.setTimeout(() => {
      setActionBanner((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Verify existing server-side session on open
  const checkExistingSession = useCallback(async () => {
    setCheckingSession(true);
    try {
      const res = await verifyManagementSessionOnBackend();
      if (res.authenticated && res.role === 'ADMIN') {
        setActiveRole('ADMIN');
        setActorIdentity(res.adminId || 'ADMIN');
        setActorName('VENTY General Manager');
        setSessionExpiresAt(res.expiresAt);
        setActiveSection('overview');
        if (onNavigatePath) {
          onNavigatePath('/management/admin');
        }
        setCheckingSession(false);
        return;
      }
      if (res.authenticated && res.role === 'STAFF') {
        setActiveRole('STAFF');
        setActorIdentity(res.staffId || 'STAFF');
        setActorName(res.staffName || res.staffId || 'Barista');
        setSessionExpiresAt(res.expiresAt);
        setActiveSection('orders');
        if (onNavigatePath) {
          onNavigatePath('/management/staff');
        }
        setCheckingSession(false);
        return;
      }
      setActiveRole(null);
      setAuthMode('landing');
      setActorIdentity('');
      setActorName('');
      setSessionExpiresAt(null);
      if (onNavigatePath) {
        onNavigatePath('/management');
      }
    } catch {
      setActiveRole(null);
      setAuthMode('landing');
      setActorIdentity('');
      setActorName('');
      setSessionExpiresAt(null);
      if (onNavigatePath) {
        onNavigatePath('/management');
      }
    } finally {
      setCheckingSession(false);
    }
  }, [onNavigatePath]);

  useEffect(() => {
    if (isOpen) {
      checkExistingSession();
    }
  }, [isOpen, checkExistingSession]);

  // Guard against unauthenticated direct navigation to /management/admin or /management/staff
  useEffect(() => {
    if (!checkingSession && !activeRole && currentPath && currentPath !== '/management') {
      if (onNavigatePath) {
        onNavigatePath('/management');
      }
    } else if (!checkingSession && activeRole === 'STAFF' && currentPath === '/management/admin') {
      if (onNavigatePath) {
        onNavigatePath('/management/staff');
      }
    }
  }, [checkingSession, activeRole, currentPath, onNavigatePath]);

  // Load section data from server-side RBAC endpoints
  const loadSectionData = useCallback(
    async (section: ManagementSectionId, roleOverride?: 'STAFF' | 'ADMIN') => {
      const role = roleOverride || activeRole;
      if (!role) return;
      setLoadingData(true);
      try {
        if (section === 'overview') {
          const [ov, ord] = await Promise.all([
            fetchManagementOverviewFromBackend(role),
            fetchOrdersFromBackend({ role }),
          ]);
          setOverviewData(ov);
          setOrders(ord);
        } else if (section === 'orders') {
          const [ord, ov] = await Promise.all([
            fetchOrdersFromBackend({ role }),
            fetchManagementOverviewFromBackend(role),
          ]);
          setOrders(ord);
          setOverviewData(ov);
        } else if (section === 'rewards') {
          const rw = await fetchManagementRewardsFromBackend(role);
          setRewardsData(rw);
        } else if (section === 'customers' && role === 'ADMIN') {
          const res = await fetchManagementCustomersFromBackend();
          setCustomers(res.customers);
        } else if (section === 'loyalty' && role === 'ADMIN') {
          const [ly, cust] = await Promise.all([
            fetchManagementLoyaltyFromBackend(),
            fetchManagementCustomersFromBackend(),
          ]);
          setLoyaltyData(ly);
          setCustomers(cust.customers);
        } else if (section === 'menu' && role === 'ADMIN') {
          const mn = await fetchManagementMenuFromBackend();
          setMenuData(mn);
        } else if (section === 'reviews' && role === 'ADMIN') {
          const rv = await fetchManagementReviewsFromBackend();
          setReviewsData(rv);
        } else if (section === 'analytics' && role === 'ADMIN') {
          const an = await fetchManagementAnalyticsFromBackend({ range: '7d' });
          setAnalyticsData(an);
        } else if (section === 'staff' && role === 'ADMIN') {
          const st = await fetchManagementStaffFromBackend();
          setStaffData(st);
        } else if (section === 'settings' && role === 'ADMIN') {
          const stg = await fetchManagementSettingsFromBackend();
          setSettingsData(stg);
        } else if (section === 'audit' && role === 'ADMIN') {
          const aud = await fetchManagementAuditLogsFromBackend();
          setAuditData(aud);
        }
      } catch (err: any) {
        showFeedback('error', err?.message || 'Failed to load management data.');
      } finally {
        setLoadingData(false);
      }
    },
    [activeRole],
  );

  useEffect(() => {
    if (isOpen && activeRole) {
      loadSectionData(activeSection, activeRole);
    }
  }, [isOpen, activeRole, activeSection, loadSectionData]);

  // Handle Admin Authentication via server-side VENTY_ADMIN_SECRET
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const candidateSecret = adminSecret.trim();
    setAdminSecret('');
    if (!candidateSecret) {
      setAuthError('Invalid admin secret.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await authenticateAdminSession(candidateSecret);
      if (res.role !== 'ADMIN') {
        clearAdminSessionToken();
        clearStaffSessionToken();
        setAuthError('Invalid admin secret.');
        return;
      }
      setActiveRole('ADMIN');
      setActorIdentity(res.adminId || 'ADMIN');
      setActorName('VENTY General Manager');
      setActiveSection('overview');
      if (onNavigatePath) {
        onNavigatePath('/management/admin');
      }
      const sessionCheck = await verifyManagementSessionOnBackend('ADMIN');
      setSessionExpiresAt(sessionCheck.expiresAt);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('VENTY_ADMIN_SECRET is not configured')) {
        setAuthError('VENTY_ADMIN_SECRET is not configured.');
      } else {
        setAuthError('Invalid admin secret.');
      }
      setAuthShake(true);
      window.setTimeout(() => setAuthShake(false), 550);
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Handle Staff Authentication via server-side VENTY_STAFF_PIN
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const candidatePin = staffPinInput.trim();
    setStaffPinInput('');
    if (!candidatePin) {
      setAuthError('Please enter your Staff PIN.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await authenticateStaffPin(candidatePin);
      if (res.role !== 'STAFF') {
        clearStaffSessionToken();
        clearAdminSessionToken();
        setAuthError('Invalid Staff PIN.');
        return;
      }
      setActiveRole('STAFF');
      setActorIdentity(res.staffId || 'STAFF');
      setActorName(res.staffName || res.staffId || 'Barista');
      setActiveSection('orders');
      if (onNavigatePath) {
        onNavigatePath('/management/staff');
      }
      const sessionCheck = await verifyManagementSessionOnBackend('STAFF');
      setSessionExpiresAt(sessionCheck.expiresAt);
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid Staff PIN.');
      setAuthShake(true);
      window.setTimeout(() => setAuthShake(false), 550);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (activeRole) {
      await logoutSessionOnBackend(activeRole);
    } else {
      clearAdminSessionToken();
      clearStaffSessionToken();
    }
    setActiveRole(null);
    setAuthMode('landing');
    setAdminSecret('');
    setStaffPinInput('');
    setAuthError(null);
    setActorIdentity('');
    setActorName('');
    setSessionExpiresAt(null);
    setProfileDropdownOpen(false);
    setProfileModalOpen(false);
    if (onNavigatePath) {
      onNavigatePath('/management');
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, nextStatus: OrderStatus) => {
    if (!activeRole) return;
    try {
      const res = await updateOrderStatusOnBackend(orderId, nextStatus, activeRole);
      showFeedback(
        'success',
        `Order ${orderId} updated to ${nextStatus}${
          res.loyaltyResult?.awardedStamp
            ? ' · ✓ Loyalty stamp issued!'
            : ''
        }`,
      );
      await loadSectionData(activeSection, activeRole);
      if (selectedOrderDetail && selectedOrderDetail.orderId === orderId) {
        const updatedList = await fetchOrdersFromBackend({ role: activeRole });
        const refreshed = updatedList.find((o: any) => o.orderId === orderId);
        if (refreshed) setSelectedOrderDetail(refreshed);
      }
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to update order status.');
    }
  };

  if (!isOpen) return null;

  // Navigation items by Role (Strictly matching Sections 5 & 6)
  const sidebarCategories: {
    category: string;
    items: {
      id: ManagementSectionId;
      label: string;
      icon: React.ReactNode;
      roles: ('STAFF' | 'ADMIN')[];
    }[];
  }[] =
    activeRole === 'STAFF'
      ? [
          {
            category: 'OPERATIONS',
            items: [
              {
                id: 'orders',
                label: 'Orders',
                icon: <ShoppingBag className="w-4 h-4" />,
                roles: ['STAFF', 'ADMIN'],
              },
              {
                id: 'rewards',
                label: 'Rewards',
                icon: <Gift className="w-4 h-4" />,
                roles: ['STAFF', 'ADMIN'],
              },
            ],
          },
        ]
      : [
          {
            category: 'OVERVIEW',
            items: [
              {
                id: 'overview',
                label: 'Dashboard',
                icon: <LayoutDashboard className="w-4 h-4" />,
                roles: ['ADMIN'],
              },
            ],
          },
          {
            category: 'OPERATIONS',
            items: [
              {
                id: 'orders',
                label: 'Orders',
                icon: <ShoppingBag className="w-4 h-4" />,
                roles: ['STAFF', 'ADMIN'],
              },
              {
                id: 'customers',
                label: 'Customers',
                icon: <Users className="w-4 h-4" />,
                roles: ['ADMIN'],
              },
            ],
          },
          {
            category: 'BUSINESS',
            items: [
              {
                id: 'menu',
                label: 'Menu',
                icon: <Coffee className="w-4 h-4" />,
                roles: ['ADMIN'],
              },
              {
                id: 'loyalty',
                label: 'Loyalty',
                icon: <Award className="w-4 h-4" />,
                roles: ['ADMIN'],
              },
              {
                id: 'rewards',
                label: 'Rewards',
                icon: <Gift className="w-4 h-4" />,
                roles: ['STAFF', 'ADMIN'],
              },
              {
                id: 'reviews',
                label: 'Reviews',
                icon: <Star className="w-4 h-4" />,
                roles: ['ADMIN'],
              },
            ],
          },
          {
            category: 'INSIGHTS',
            items: [
              {
                id: 'analytics',
                label: 'Analytics',
                icon: <BarChart3 className="w-4 h-4" />,
                roles: ['ADMIN'],
              },
            ],
          },
          {
            category: 'MANAGEMENT',
            items: [
              {
                id: 'staff',
                label: 'Staff',
                icon: <UserCog className="w-4 h-4" />,
                roles: ['ADMIN'],
              },
              {
                id: 'settings',
                label: 'Settings',
                icon: <SettingsIcon className="w-4 h-4" />,
                roles: ['ADMIN'],
              },
            ],
          },
          {
            category: 'SECURITY',
            items: [
              {
                id: 'audit',
                label: 'Audit Log',
                icon: <ShieldCheck className="w-4 h-4" />,
                roles: ['ADMIN'],
              },
            ],
          },
        ];

  const sectionLabels: Record<ManagementSectionId, { group: string; title: string }> = {
    overview: { group: 'OVERVIEW', title: 'Dashboard' },
    orders: { group: 'OPERATIONS', title: 'Orders' },
    customers: { group: 'OPERATIONS', title: 'Customers' },
    menu: { group: 'BUSINESS', title: 'Menu' },
    loyalty: { group: 'BUSINESS', title: 'Loyalty' },
    rewards: { group: 'BUSINESS', title: 'Rewards' },
    reviews: { group: 'BUSINESS', title: 'Reviews' },
    analytics: { group: 'INSIGHTS', title: 'Analytics' },
    staff: { group: 'MANAGEMENT', title: 'Staff' },
    settings: { group: 'MANAGEMENT', title: 'Settings' },
    audit: { group: 'SECURITY', title: 'Audit Log' },
  };

  // Pending / Ready count for top header notifications
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
  const readyOrdersCount = orders.filter((o) => o.status === 'READY').length;

  return (
    <div className="fixed inset-0 z-[120] bg-[#14090b] text-[#f5efe6] flex flex-col overflow-hidden">
      {/* 1. DEDICATED STAFF / ADMIN AUTHENTICATION SCREEN */}
      {checkingSession ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-7 h-7 text-[#c9833a] animate-spin" />
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#e8dcc8]/70">
              Verifying Management Session...
            </p>
          </div>
        </div>
      ) : !activeRole ? (
        <div className="flex-1 flex flex-col justify-between p-6 md:p-10 overflow-y-auto bg-[radial-gradient(circle_at_top,#2d1216_0%,#12080a_70%)]">
          {/* Top Bar */}
          <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-[#e8dcc8]/75 hover:text-[#f5efe6] transition-colors cursor-pointer py-2 px-3 rounded-lg border border-[#e8dcc8]/15 hover:border-[#e8dcc8]/35"
            >
              <ArrowLeft className="w-4 h-4 text-[#c9833a]" />
              ← Back to VENTY
            </button>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#c9833a]">
              <Shield className="w-3.5 h-3.5" />
              Server-Enforced RBAC Portal
            </div>
          </div>

          {/* Centered Auth Card */}
          <div className="my-auto py-8 flex items-center justify-center">
            <div
              className={`w-full max-w-md bg-[#1d0d10]/95 border border-[#c9833a]/25 rounded-2xl p-7 md:p-9 shadow-[0_24px_80px_rgba(0,0,0,0.75)] ${
                authShake ? 'animate-shake' : ''
              }`}
            >
              <div className="flex flex-col items-center text-center mb-7">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#c9833a]/40 shadow-md mb-3 bg-[#261215] flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt="VENTY THE COFFEE"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="font-serif text-xl font-bold tracking-[0.18em] text-[#f5efe6]">
                  VENTY THE COFFEE
                </div>
                <div className="text-[11px] font-mono uppercase tracking-[0.26em] text-[#c9833a] mt-1 font-semibold">
                  MANAGEMENT PORTAL
                </div>
              </div>

              {authError && (
                <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authMode === 'landing' && (
                <div className="space-y-4">
                  <p className="text-center font-serif text-base text-[#e8dcc8]/90 mb-5">
                    Staff &amp; Administrator Access
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('admin');
                      setAuthError(null);
                      setAdminSecret('');
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#c9833a] hover:bg-[#d89248] text-[#14090b] font-mono text-xs uppercase tracking-[0.2em] font-bold transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    [ ADMIN LOGIN ]
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('staff');
                      setAuthError(null);
                      setStaffPinInput('');
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#2a1317] hover:bg-[#381a1f] border border-[#c9833a]/35 text-[#f5efe6] font-mono text-xs uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-[#c9833a]" />
                    [ STAFF LOGIN ]
                  </button>

                  <div className="mt-6 pt-4 border-t border-[#e8dcc8]/10 text-center">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-xs font-mono text-[#e8dcc8]/70 hover:text-[#c9833a] transition-colors cursor-pointer"
                    >
                      ← Back to VENTY
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'admin' && (
                <div>
                  <div className="mb-5 text-center">
                    <div className="text-xs font-mono uppercase tracking-[0.22em] text-[#c9833a] font-bold">
                      ADMIN AUTHENTICATION
                    </div>
                    <p className="text-xs text-[#e8dcc8]/80 mt-2 leading-relaxed">
                      Enter your administrator secret to access the VENTY Management Console.
                    </p>
                  </div>

                  <form onSubmit={handleAdminLogin} className="space-y-4" autoComplete="off">
                    <div>
                      <label
                        htmlFor="venty-admin-secret-input"
                        className="block text-[11px] font-mono uppercase tracking-[0.14em] text-[#e8dcc8]/75 mb-1.5"
                      >
                        Admin Secret
                      </label>
                      <input
                        id="venty-admin-secret-input"
                        name="adminSecret"
                        type="password"
                        value={adminSecret}
                        onChange={(e) => setAdminSecret(e.target.value)}
                        placeholder="Admin Secret"
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        autoFocus
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080a] border border-[#e8dcc8]/20 text-sm text-[#f5efe6] placeholder-[#e8dcc8]/30 focus:outline-none focus:border-[#c9833a] font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full py-3 rounded-xl bg-[#c9833a] hover:bg-[#b8732c] text-[#150a0c] font-bold text-xs uppercase tracking-[0.18em] transition-all shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {authSubmitting ? 'AUTHENTICATING...' : '[ AUTHENTICATE ]'}
                    </button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-[#e8dcc8]/10 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('landing');
                        setAuthError(null);
                        setAdminSecret('');
                      }}
                      className="text-xs font-mono text-[#e8dcc8]/70 hover:text-[#c9833a] transition-colors cursor-pointer"
                    >
                      ← Back to Management Portal
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'staff' && (
                <div>
                  <div className="mb-5 text-center">
                    <div className="text-xs font-mono uppercase tracking-[0.22em] text-[#c9833a] font-bold">
                      STAFF AUTHENTICATION
                    </div>
                    <p className="text-xs text-[#e8dcc8]/80 mt-2 leading-relaxed">
                      Enter your staff PIN to access VENTY Barista &amp; Counter Operations.
                    </p>
                  </div>

                  <form onSubmit={handleStaffLogin} className="space-y-4" autoComplete="off">
                    <div>
                      <label
                        htmlFor="venty-staff-pin-input"
                        className="block text-[11px] font-mono uppercase tracking-[0.14em] text-[#e8dcc8]/75 mb-1.5"
                      >
                        Staff PIN
                      </label>
                      <input
                        id="venty-staff-pin-input"
                        name="staffPin"
                        type="password"
                        value={staffPinInput}
                        onChange={(e) => setStaffPinInput(e.target.value)}
                        placeholder="Staff PIN"
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        autoFocus
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080a] border border-[#e8dcc8]/20 text-sm text-[#f5efe6] placeholder-[#e8dcc8]/30 focus:outline-none focus:border-[#c9833a] font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full py-3 rounded-xl bg-[#c9833a] hover:bg-[#b8732c] text-[#150a0c] font-bold text-xs uppercase tracking-[0.18em] transition-all shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {authSubmitting ? 'AUTHENTICATING...' : '[ AUTHENTICATE ]'}
                    </button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-[#e8dcc8]/10 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('landing');
                        setAuthError(null);
                        setStaffPinInput('');
                      }}
                      className="text-xs font-mono text-[#e8dcc8]/70 hover:text-[#c9833a] transition-colors cursor-pointer"
                    >
                      ← Back to Management Portal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-[11px] font-mono text-[#e8dcc8]/40">
            VENTY THE COFFEE · Hydra, Algiers · Isolated Staff & Admin Security Context
          </div>
        </div>
      ) : (
        /* 2. AUTHENTICATED MANAGEMENT PORTAL (SIDEBAR + TOP HEADER + MAIN CONTENT AREA) */
        <div className="flex-1 flex overflow-hidden bg-[#f4efe6] text-[#221a14]">
          {/* Fixed Desktop Sidebar */}
          <aside
            className={`hidden lg:flex flex-col bg-[#1b0c0e] text-[#f5efe6] border-r border-[#c9833a]/20 shrink-0 transition-all duration-200 ${
              sidebarCollapsed ? 'w-20' : 'w-64'
            }`}
          >
            {/* Brand Header */}
            <div className="p-4 border-b border-[#e8dcc8]/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={logoUrl}
                  alt="VENTY"
                  className="w-10 h-10 rounded-full object-cover border border-[#c9833a]/40 shrink-0"
                />
                {!sidebarCollapsed && (
                  <div className="truncate">
                    <div className="font-serif font-bold tracking-[0.18em] text-sm text-[#f5efe6]">
                      VENTY
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-[#e8dcc8]/70">
                      THE COFFEE
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-[#c9833a] font-bold mt-0.5">
                      {activeRole === 'ADMIN' ? 'MANAGEMENT' : 'STAFF'}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                className="p-1.5 rounded-lg text-[#e8dcc8]/60 hover:text-[#f5efe6] hover:bg-[#2a1317] cursor-pointer shrink-0"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-4">
              {sidebarCategories.map((group) => (
                <div key={group.category}>
                  {!sidebarCollapsed && (
                    <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-[#c9833a]/80 font-semibold">
                      {group.category}
                    </div>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveSection(item.id)}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={`w-full flex items-center ${
                            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                          } py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#c9833a] text-[#150a0c] font-semibold shadow-sm'
                              : 'text-[#e8dcc8]/75 hover:bg-[#2a1317] hover:text-[#f5efe6]'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            {item.icon}
                            {!sidebarCollapsed && <span>• {item.label}</span>}
                          </span>
                          {!sidebarCollapsed && isActive && <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-[#e8dcc8]/10 space-y-1 bg-[#15090b]">
              {!sidebarCollapsed && activeRole === 'STAFF' && (
                <div className="px-3 mb-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#c9833a]/80 font-semibold">
                  ACCOUNT
                </div>
              )}
              {activeRole === 'ADMIN' && (
                <button
                  type="button"
                  onClick={onClose}
                  title="View Website"
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3.5'
                  } py-2 rounded-lg text-xs text-[#e8dcc8]/75 hover:bg-[#261215] hover:text-[#f5efe6] transition-colors cursor-pointer`}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#c9833a]" />
                  {!sidebarCollapsed && <span>• View Website</span>}
                </button>
              )}
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                title={activeRole === 'ADMIN' ? 'Admin Profile' : 'Profile'}
                className={`w-full flex items-center ${
                  sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3.5'
                } py-2 rounded-lg text-xs text-[#e8dcc8]/75 hover:bg-[#261215] hover:text-[#f5efe6] transition-colors cursor-pointer`}
              >
                <User className="w-3.5 h-3.5 text-[#c9833a]" />
                {!sidebarCollapsed && (
                  <span>• {activeRole === 'ADMIN' ? 'Admin Profile' : 'Profile'}</span>
                )}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className={`w-full flex items-center ${
                  sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3.5'
                } py-2 rounded-lg text-xs text-red-300 hover:bg-red-950/50 transition-colors cursor-pointer`}
              >
                <LogOut className="w-3.5 h-3.5" />
                {!sidebarCollapsed && <span>• Logout</span>}
              </button>
            </div>
          </aside>

          {/* Mobile Sidebar Drawer */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-black/65"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <div className="relative w-72 max-w-[85vw] bg-[#1b0c0e] text-[#f5efe6] h-full flex flex-col z-10 shadow-2xl">
                <div className="p-4 border-b border-[#e8dcc8]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={logoUrl}
                      alt="VENTY"
                      className="w-8 h-8 rounded-full object-cover border border-[#c9833a]/40"
                    />
                    <div>
                      <div className="font-serif font-bold text-sm tracking-widest">
                        VENTY THE COFFEE
                      </div>
                      <div className="text-[10px] font-mono text-[#c9833a] uppercase">
                        {activeRole === 'ADMIN' ? 'MANAGEMENT' : 'STAFF'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1.5 text-[#e8dcc8]/70 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                  {sidebarCategories.map((group) => (
                    <div key={group.category}>
                      <div className="px-3 mb-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#c9833a]/80 font-semibold">
                        {group.category}
                      </div>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const isActive = activeSection === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveSection(item.id);
                                setMobileSidebarOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                                isActive
                                  ? 'bg-[#c9833a] text-[#150a0c] font-semibold'
                                  : 'text-[#e8dcc8]/75 hover:bg-[#2a1317]'
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                {item.icon}
                                <span>• {item.label}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
                <div className="p-3 border-t border-[#e8dcc8]/10 space-y-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs text-[#e8dcc8]/75 hover:bg-[#261215]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#c9833a]" />
                    • View Website
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs text-[#e8dcc8]/75 hover:bg-[#261215]"
                  >
                    <User className="w-3.5 h-3.5 text-[#c9833a]" />
                    • {activeRole === 'ADMIN' ? 'Admin Profile' : 'Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs text-red-300"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    • Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Column */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 7. TOP ADMIN HEADER */}
            <header className="bg-white border-b border-[#ded7c8] px-4 md:px-7 py-3.5 flex items-center justify-between gap-4 shrink-0">
              {/* Left: ☰ + Current Page / Breadcrumb */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setMobileSidebarOpen(true);
                    } else {
                      setSidebarCollapsed((prev) => !prev);
                    }
                  }}
                  aria-label="Toggle navigation"
                  className="p-2 rounded-lg border border-[#ded7c8] text-[#351016] hover:bg-[#faf6ef] cursor-pointer"
                >
                  <MenuIcon className="w-4 h-4" />
                </button>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#8a7b70]">
                    VENTY {activeRole === 'ADMIN' ? 'MANAGEMENT' : 'STAFF'} /{' '}
                    {sectionLabels[activeSection]?.group}
                  </div>
                  <h1 className="font-serif text-lg md:text-xl font-bold text-[#221a14] leading-tight">
                    {sectionLabels[activeSection]?.title}
                  </h1>
                </div>
              </div>

              {/* Right: Refresh + Notifications + Admin Profile / Role Dropdown */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => loadSectionData(activeSection)}
                  disabled={loadingData}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ded7c8] bg-[#faf6ef] hover:bg-[#eee6d8] text-xs font-medium text-[#351016] transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Sync</span>
                </button>

                {/* Notifications Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen((prev) => !prev)}
                    className="relative p-2 rounded-lg border border-[#ded7c8] bg-[#faf6ef] hover:bg-[#eee6d8] text-[#351016] cursor-pointer"
                    aria-label="Operational Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {pendingOrdersCount + readyOrdersCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#c9833a] text-[#150a0c] text-[10px] font-mono font-bold flex items-center justify-center">
                        {pendingOrdersCount + readyOrdersCount}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-[#ded7c8] shadow-xl p-3 z-30 text-xs">
                      <div className="font-serif font-bold text-[#221a14] pb-2 border-b border-[#eee9de] flex items-center justify-between">
                        <span>Live Operational Alerts</span>
                        <button
                          type="button"
                          onClick={() => setNotificationsOpen(false)}
                          className="text-[#8a7b70] hover:text-[#221a14]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="py-2 space-y-2">
                        <div className="flex items-center justify-between p-2 rounded bg-[#faf6ef]">
                          <span className="text-[#59493f]">Pending Orders</span>
                          <span className="font-mono font-bold text-amber-700">
                            {pendingOrdersCount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-[#faf6ef]">
                          <span className="text-[#59493f]">Ready for Pickup</span>
                          <span className="font-mono font-bold text-[#2e7d32]">
                            {readyOrdersCount}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          setActiveSection('orders');
                        }}
                        className="w-full py-1.5 text-center rounded bg-[#351016] text-[#f5efe6] font-semibold cursor-pointer"
                      >
                        Open Orders Queue
                      </button>
                    </div>
                  )}
                </div>

                {/* Admin / Staff Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-xl bg-[#351016] text-[#f5efe6] hover:bg-[#4b1820] transition-colors cursor-pointer"
                  >
                    <div className="text-left">
                      <div className="text-xs font-semibold leading-none">{actorIdentity}</div>
                      <div className="text-[9px] font-mono uppercase tracking-wider text-[#c9833a] mt-0.5">
                        Role: {activeRole}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#c9833a]" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#1b0c0e] text-[#f5efe6] border border-[#c9833a]/30 shadow-2xl py-1.5 z-30 text-xs">
                      <div className="px-3.5 py-2 border-b border-[#e8dcc8]/10">
                        <div className="font-serif font-bold text-sm">{actorName}</div>
                        <div className="text-[10px] font-mono text-[#c9833a]">
                          {actorIdentity} · {activeRole}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setProfileModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#2a1317] text-left cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-[#c9833a]" />
                        <span>Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onClose();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#2a1317] text-left cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#c9833a]" />
                        <span>View Website</span>
                      </button>
                      <div className="my-1 border-t border-[#e8dcc8]/10" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-300 hover:bg-red-950/50 text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Feedback Banner */}
            {actionBanner && (
              <div
                className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
                  actionBanner.type === 'success'
                    ? 'bg-[#1e3a24] text-[#d4f5dc]'
                    : 'bg-red-900 text-red-100'
                }`}
              >
                <span>{actionBanner.message}</span>
                <button
                  type="button"
                  onClick={() => setActionBanner(null)}
                  className="text-xs underline ml-4 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Main View Port */}
            <main className="flex-1 overflow-y-auto p-4 md:p-7 space-y-6">
              {activeSection === 'overview' && activeRole === 'ADMIN' && (
                <OverviewDashboardView
                  overviewData={overviewData}
                  orders={orders}
                  onUpdateStatus={handleOrderStatusUpdate}
                  onOpenOrderDetail={(ord) => setSelectedOrderDetail(ord)}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'orders' && (
                <OrdersManagementView
                  orders={orders}
                  algiersTodayKey={overviewData?.algiersTodayKey || getAlgiersDateKey()}
                  onUpdateStatus={handleOrderStatusUpdate}
                  onOpenOrderDetail={(ord) => setSelectedOrderDetail(ord)}
                />
              )}

              {activeSection === 'customers' && activeRole === 'ADMIN' && (
                <CustomersManagementView
                  customers={customers}
                  onSearch={async (q, statusFilter) => {
                    try {
                      const res = await fetchManagementCustomersFromBackend(q, statusFilter);
                      setCustomers(res.customers);
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to search customers.');
                    }
                  }}
                  onUpdateCustomer={async (customerId, updates) => {
                    try {
                      await updateManagementCustomerOnBackend(customerId, updates);
                      showFeedback('success', `Customer ${customerId} updated.`);
                      loadSectionData('customers');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to update customer.');
                    }
                  }}
                />
              )}

              {activeSection === 'loyalty' && activeRole === 'ADMIN' && (
                <LoyaltyManagementView
                  loyaltyData={loyaltyData}
                  onAdminAdjust={async (customerId, stampsDelta, reason) => {
                    try {
                      await adminAdjustOnBackend({ customerId, stampsDelta, reason });
                      showFeedback(
                        'success',
                        `Loyalty adjustment (${stampsDelta > 0 ? `+${stampsDelta}` : stampsDelta}) recorded and audited.`,
                      );
                      loadSectionData('loyalty');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to adjust loyalty.');
                    }
                  }}
                  onOrderReversal={async (orderId, reason) => {
                    try {
                      await orderReversalOnBackend(orderId, reason);
                      showFeedback('success', `Order #${orderId} stamp reversed and audited.`);
                      loadSectionData('loyalty');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to reverse order stamp.');
                    }
                  }}
                />
              )}

              {activeSection === 'rewards' && (
                <RewardsManagementView
                  rewardsData={rewardsData}
                  isAdmin={activeRole === 'ADMIN'}
                  onVerifyReward={async (query) => {
                    return verifyRewardOnBackend(query);
                  }}
                  onRedeemReward={async (codeOrId) => {
                    try {
                      const isId = codeOrId.toUpperCase().startsWith('RW-');
                      await redeemRewardOnBackend(
                        isId ? { rewardId: codeOrId } : { redemptionCode: codeOrId },
                      );
                      showFeedback('success', `Reward ${codeOrId} verified and redeemed!`);
                      loadSectionData('rewards');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to redeem reward.');
                    }
                  }}
                  onCancelReward={async (rewardId, reason) => {
                    try {
                      await cancelManagementRewardOnBackend(rewardId, reason);
                      showFeedback('success', `Reward ${rewardId} cancelled.`);
                      loadSectionData('rewards');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to cancel reward.');
                    }
                  }}
                />
              )}

              {activeSection === 'menu' && activeRole === 'ADMIN' && (
                <MenuManagementView
                  menuData={menuData}
                  onUpdateItem={async (itemId, patch) => {
                    try {
                      await updateManagementMenuItemOnBackend(itemId, patch);
                      showFeedback('success', `Menu item ${itemId} updated.`);
                      loadSectionData('menu');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to update menu item.');
                    }
                  }}
                  onCreateItem={async (payload) => {
                    try {
                      await createManagementMenuItemOnBackend(payload);
                      showFeedback('success', `Official product "${payload.name}" added to menu.`);
                      loadSectionData('menu');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to create menu item.');
                    }
                  }}
                />
              )}

              {activeSection === 'reviews' && activeRole === 'ADMIN' && (
                <ReviewsManagementView
                  reviewsData={reviewsData}
                  onRefreshReviews={async () => {
                    try {
                      const refreshed = await refreshManagementReviewsOnBackend();
                      setReviewsData(refreshed);
                      showFeedback('success', 'Google Reviews cache refreshed.');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to refresh reviews.');
                    }
                  }}
                />
              )}

              {activeSection === 'analytics' && activeRole === 'ADMIN' && (
                <AnalyticsManagementView
                  analyticsData={analyticsData}
                  onChangeRange={async (rangeParams) => {
                    try {
                      const updated = await fetchManagementAnalyticsFromBackend(rangeParams);
                      setAnalyticsData(updated);
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to load analytics range.');
                    }
                  }}
                />
              )}

              {activeSection === 'staff' && activeRole === 'ADMIN' && (
                <StaffManagementView
                  staffData={staffData}
                  onAddStaff={async (payload) => {
                    try {
                      await addManagementStaffOnBackend(payload);
                      showFeedback('success', `Staff member ${payload.staffId} added.`);
                      loadSectionData('staff');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to add staff member.');
                    }
                  }}
                  onUpdateStaff={async (staffId, patch) => {
                    try {
                      await updateManagementStaffOnBackend(staffId, patch);
                      showFeedback('success', `Staff member ${staffId} updated.`);
                      loadSectionData('staff');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to update staff member.');
                    }
                  }}
                  onRevokeStaffSessions={async () => {
                    try {
                      const res = await revokeStaffSessionsOnBackend();
                      showFeedback(
                        'success',
                        `Revoked ${res.revokedCount} active staff session(s).`,
                      );
                      loadSectionData('staff');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to revoke staff sessions.');
                    }
                  }}
                />
              )}

              {activeSection === 'settings' && activeRole === 'ADMIN' && (
                <SettingsManagementView
                  settingsData={settingsData}
                  onSaveSettings={async (patch) => {
                    try {
                      const res = await updateManagementSettingsOnBackend(patch);
                      setSettingsData((prev: any) => ({ ...prev, store: res.store }));
                      showFeedback('success', 'Store & Ordering settings saved.');
                    } catch (err: any) {
                      showFeedback('error', err?.message || 'Failed to save store settings.');
                    }
                  }}
                />
              )}

              {activeSection === 'audit' && activeRole === 'ADMIN' && (
                <SecurityAuditView auditData={auditData} />
              )}
            </main>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL (Section 9) */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-[130] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-[#221a14] rounded-2xl border border-[#ded7c8] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee9de]">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
                  ORDER DETAIL
                </div>
                <h3 className="font-mono font-bold text-lg text-[#351016] mt-0.5">
                  Order #: #{selectedOrderDetail.orderId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                className="p-1.5 rounded-lg text-[#7a6b61] hover:bg-[#f4efe6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#faf6ef] p-4 rounded-xl border border-[#e6dfd3]">
              <div>
                <span className="text-[#7a6b61] block text-[10px] font-mono uppercase">
                  Customer
                </span>
                <span className="font-serif font-bold text-sm text-[#221a14]">
                  {selectedOrderDetail.customerName}
                </span>
              </div>
              <div>
                <span className="text-[#7a6b61] block text-[10px] font-mono uppercase">Phone</span>
                <span className="font-mono font-semibold text-[#221a14]">
                  {selectedOrderDetail.customerPhone}
                </span>
              </div>
              <div>
                <span className="text-[#7a6b61] block text-[10px] font-mono uppercase">Time</span>
                <span className="font-mono text-[#221a14]">
                  {formatAlgiersTime(selectedOrderDetail.createdAt)} (
                  {formatAlgiersDate(selectedOrderDetail.createdAt)})
                </span>
              </div>
              <div>
                <span className="text-[#7a6b61] block text-[10px] font-mono uppercase">Status</span>
                <OrderStatusBadge status={selectedOrderDetail.status} />
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#7a6b61] mb-2">
                Items:
              </div>
              <div className="divide-y divide-[#eee9de] border border-[#ded7c8] rounded-xl overflow-hidden">
                {(selectedOrderDetail.items || []).map((it: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#351016] mr-1.5">
                        {it.quantity}x
                      </span>
                      <span className="font-medium text-[#221a14]">{it.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-[#351016]">
                      {(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString()} DZD
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#eee9de]">
              <span className="font-serif font-bold text-sm text-[#221a14]">Total:</span>
              <span className="font-mono font-bold text-lg text-[#351016]">
                {Number(selectedOrderDetail.totalDzd || 0).toLocaleString()} DZD
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#faf6ef] border border-[#e6dfd3] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#59493f] font-medium">Qualifies for Loyalty Stamp:</span>
                <span
                  className={`font-mono font-bold ${
                    selectedOrderDetail.qualifiesForStamp ? 'text-[#2e7d32]' : 'text-[#8a7b70]'
                  }`}
                >
                  {selectedOrderDetail.qualifiesForStamp
                    ? 'YES (≥ 300 DZD)'
                    : 'NO (< 300 DZD)'}
                </span>
              </div>

              {selectedOrderDetail.status === 'COMPLETED' &&
                selectedOrderDetail.stampAwarded && (
                  <div className="pt-2 border-t border-[#e6dfd3] text-[#2e7d32] font-mono font-bold space-y-0.5">
                    <div>✓ Loyalty stamp issued</div>
                    <div>
                      Customer loyalty: {selectedOrderDetail.customerStampCount ?? 0} /{' '}
                      {selectedOrderDetail.stampsToReward ?? 7}
                    </div>
                  </div>
                )}
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {selectedOrderDetail.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOrderStatusUpdate(selectedOrderDetail.orderId, 'CONFIRMED')}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    [ CONFIRM ORDER ]
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOrderStatusUpdate(selectedOrderDetail.orderId, 'CANCELLED')}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                  >
                    [ CANCEL ]
                  </button>
                </>
              )}
              {selectedOrderDetail.status === 'CONFIRMED' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOrderStatusUpdate(selectedOrderDetail.orderId, 'READY')}
                    className="px-4 py-2 rounded-lg bg-[#c9833a] hover:bg-[#b5722d] text-[#150a0c] text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    [ MARK READY ]
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOrderStatusUpdate(selectedOrderDetail.orderId, 'CANCELLED')}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                  >
                    [ CANCEL ]
                  </button>
                </>
              )}
              {selectedOrderDetail.status === 'READY' && (
                <button
                  type="button"
                  onClick={() => handleOrderStatusUpdate(selectedOrderDetail.orderId, 'COMPLETED')}
                  className="px-5 py-2.5 rounded-lg bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  [ COMPLETE ORDER ]
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                className="px-4 py-2 rounded-lg border border-[#ded7c8] text-xs font-semibold text-[#59493f] hover:bg-[#faf6ef] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN / STAFF PROFILE MODAL */}
      {profileModalOpen && activeRole && (
        <div className="fixed inset-0 z-[130] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-[#221a14] rounded-2xl border border-[#ded7c8] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee9de]">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
                  AUTHENTICATED MANAGEMENT SESSION
                </div>
                <h3 className="font-serif font-bold text-lg text-[#221a14] mt-0.5">
                  {activeRole === 'ADMIN' ? 'Admin Profile' : 'Staff Profile'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-[#7a6b61] hover:bg-[#f4efe6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs bg-[#faf6ef] p-4 rounded-xl border border-[#e6dfd3]">
              <div className="flex justify-between">
                <span className="text-[#7a6b61]">Authenticated ID:</span>
                <span className="font-mono font-bold text-[#351016]">{actorIdentity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a6b61]">Display Name:</span>
                <span className="font-serif font-bold text-[#221a14]">{actorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a6b61]">Verified Role:</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#c9833a]/20 text-[#6b3a1f]">
                  {activeRole}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a6b61]">Session Expires:</span>
                <span className="font-mono text-[#221a14]">
                  {sessionExpiresAt ? formatAlgiersDateTime(sessionExpiresAt) : 'Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a6b61]">RBAC Enforcement:</span>
                <span className="font-mono font-semibold text-[#2e7d32]">
                  Server-Side Verified
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer"
              >
                Logout Session
              </button>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#ded7c8] text-xs font-semibold text-[#59493f] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 8. OVERVIEW DASHBOARD VIEW
// ============================================================================
const OverviewDashboardView: React.FC<{
  overviewData: any | null;
  orders: any[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onOpenOrderDetail: (order: any) => void;
  onNavigate: (section: ManagementSectionId) => void;
}> = ({ overviewData, orders, onUpdateStatus, onOpenOrderDetail, onNavigate }) => {
  if (!overviewData) {
    return (
      <div className="p-8 text-center text-sm text-[#6b5a4e]">
        Loading real-time Algiers operational overview...
      </div>
    );
  }

  const formatDiff = (diff: number, suffix = '') => {
    if (diff > 0) return `+${diff.toLocaleString()}${suffix} vs yesterday`;
    if (diff < 0) return `${diff.toLocaleString()}${suffix} vs yesterday`;
    return `Same as yesterday`;
  };

  // Group today's / active orders into the 4 pipeline columns
  const pendingCol = orders.filter((o) => o.status === 'PENDING');
  const confirmedCol = orders.filter((o) => o.status === 'CONFIRMED');
  const readyCol = orders.filter((o) => o.status === 'READY');
  const completedCol = orders.filter((o) => o.status === 'COMPLETED').slice(0, 8);

  const pipelineColumns: {
    key: string;
    title: string;
    badgeColor: string;
    items: any[];
  }[] = [
    {
      key: 'PENDING',
      title: 'PENDING',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      items: pendingCol,
    },
    {
      key: 'CONFIRMED',
      title: 'CONFIRMED / PREPARING',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      items: confirmedCol,
    },
    {
      key: 'READY',
      title: 'READY',
      badgeColor: 'bg-[#c9833a]/25 text-[#6b3a1f] border-[#c9833a]/50',
      items: readyCol,
    },
    {
      key: 'COMPLETED',
      title: 'COMPLETED',
      badgeColor: 'bg-[#2e7d32]/15 text-[#2e7d32] border-[#2e7d32]/30',
      items: completedCol,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Header (Section 9) */}
      <div className="bg-[#351016] text-[#f5efe6] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#c9833a]">
            Dashboard · ALGIERS BUSINESS DAY ({overviewData.timezone || 'Africa/Algiers'})
          </div>
          <h2 className="font-serif text-2xl font-bold mt-0.5">Good morning, Admin</h2>
          <p className="text-xs font-mono text-[#e8dcc8]/80 mt-1">
            {overviewData.algiersTodayLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="px-3.5 py-2 rounded-xl bg-[#c9833a] text-[#150a0c] text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Manage Orders ({overviewData.todaysOrdersCount ?? 0})
          </button>
          <button
            type="button"
            onClick={() => onNavigate('rewards')}
            className="px-3.5 py-2 rounded-xl bg-[#261215] border border-[#e8dcc8]/20 text-[#f5efe6] text-xs font-medium cursor-pointer"
          >
            Verify Reward
          </button>
        </div>
      </div>

      {/* 6 Primary KPI Cards (Strictly matching Section 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. ORDERS TODAY */}
        <div className="bg-white rounded-xl p-5 border border-[#ded7c8] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#7a6b61] font-bold">
              1. ORDERS TODAY
            </div>
            <ShoppingBag className="w-4 h-4 text-[#c9833a]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#221a14] mt-2">
            {overviewData.todaysOrdersCount ?? 0}
          </div>
          <div className="text-[11px] font-mono text-[#6b5a4e] mt-1.5">
            {formatDiff(overviewData.ordersComparisonDiff ?? 0)}
          </div>
        </div>

        {/* 2. TODAY'S REVENUE */}
        <div className="bg-white rounded-xl p-5 border border-[#ded7c8] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#7a6b61] font-bold">
              2. TODAY&apos;S REVENUE
            </div>
            <BarChart3 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#351016] mt-2">
            {Number(overviewData.todaysRevenueDzd || 0).toLocaleString()} DA
          </div>
          <div className="text-[11px] font-mono text-[#6b5a4e] mt-1.5">
            {formatDiff(overviewData.revenueComparisonDiffDzd ?? 0, ' DA')}
          </div>
        </div>

        {/* 3. PENDING ORDERS */}
        <div className="bg-white rounded-xl p-5 border border-[#ded7c8] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#7a6b61] font-bold">
              3. PENDING ORDERS
            </div>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-serif font-bold text-amber-700 mt-2">
            {overviewData.pendingOrdersCount ?? 0}
          </div>
          <div className="text-[11px] font-mono text-amber-800 mt-1.5 font-semibold">
            Needs attention
          </div>
        </div>

        {/* 4. COMPLETED ORDERS */}
        <div className="bg-white rounded-xl p-5 border border-[#ded7c8] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#7a6b61] font-bold">
              4. COMPLETED ORDERS
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#2e7d32]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#2e7d32] mt-2">
            {overviewData.completedOrdersCount ?? 0}
          </div>
          <div className="text-[11px] font-mono text-[#6b5a4e] mt-1.5">
            Today&apos;s completed orders
          </div>
        </div>

        {/* 5. LOYALTY STAMPS */}
        <div className="bg-white rounded-xl p-5 border border-[#ded7c8] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#7a6b61] font-bold">
              5. LOYALTY STAMPS
            </div>
            <Award className="w-4 h-4 text-[#c9833a]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#351016] mt-2">
            {overviewData.loyaltyStampsIssuedToday ?? 0}
          </div>
          <div className="text-[11px] font-mono text-[#6b5a4e] mt-1.5">
            Stamps issued today
          </div>
        </div>

        {/* 6. REWARDS REDEEMED */}
        <div className="bg-white rounded-xl p-5 border border-[#ded7c8] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#7a6b61] font-bold">
              6. REWARDS REDEEMED
            </div>
            <Gift className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#c9833a] mt-2">
            {overviewData.rewardsRedeemedToday ?? 0}
          </div>
          <div className="text-[11px] font-mono text-[#6b5a4e] mt-1.5">
            Rewards redeemed today
          </div>
        </div>
      </div>

      {/* LIVE ORDER PIPELINE (4 Status Columns) */}
      <div className="bg-white rounded-xl border border-[#ded7c8] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9833a] font-bold">
              LIVE ORDER PIPELINE
            </div>
            <h3 className="font-serif font-bold text-base text-[#221a14]">
              Real-Time Barista & Counter Workflow
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="text-xs font-mono text-[#351016] hover:underline cursor-pointer"
          >
            Open Full Orders Table →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {pipelineColumns.map((col) => (
            <div
              key={col.key}
              className="bg-[#faf6ef] rounded-xl border border-[#ded7c8] p-3 flex flex-col min-h-[260px]"
            >
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#e6dfd3]">
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded border ${col.badgeColor}`}
                >
                  {col.title}
                </span>
                <span className="font-mono text-xs font-bold text-[#59493f]">
                  {col.items.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-96 pr-0.5">
                {col.items.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#8a7b70]">
                    No orders in {col.title}
                  </div>
                ) : (
                  col.items.map((ord) => {
                    const itemCount = (ord.items || []).reduce(
                      (acc: number, it: any) => acc + (Number(it.quantity) || 1),
                      0,
                    );
                    return (
                      <div
                        key={ord.orderId}
                        className="bg-white rounded-xl p-3 border border-[#ded7c8] shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => onOpenOrderDetail(ord)}
                            className="font-mono font-bold text-xs text-[#351016] hover:underline cursor-pointer"
                          >
                            #{ord.orderId}
                          </button>
                          <span className="font-mono text-[11px] text-[#7a6b61]">
                            {formatAlgiersTime(ord.createdAt)}
                          </span>
                        </div>

                        <div>
                          <div className="font-serif font-bold text-xs text-[#221a14]">
                            {ord.customerName}
                          </div>
                          <div className="font-mono text-[11px] text-[#6b5a4e]">
                            {ord.customerPhone}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#f4efe6]">
                          <span className="text-[#59493f]">{itemCount} item(s)</span>
                          <span className="font-mono font-bold text-[#351016]">
                            {Number(ord.totalDzd || 0).toLocaleString()} DZD
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              ord.qualifiesForStamp
                                ? 'bg-[#2e7d32]/15 text-[#2e7d32] font-semibold'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {ord.qualifiesForStamp ? 'Stamp Eligible' : '< 300 DZD'}
                          </span>

                          <div className="flex items-center gap-1">
                            {ord.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(ord.orderId, 'CONFIRMED')}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Confirm
                              </button>
                            )}
                            {ord.status === 'CONFIRMED' && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(ord.orderId, 'READY')}
                                className="px-2.5 py-1 rounded bg-[#c9833a] hover:bg-[#b5722d] text-[#150a0c] text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Mark Ready
                              </button>
                            )}
                            {ord.status === 'READY' && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(ord.orderId, 'COMPLETED')}
                                className="px-2.5 py-1 rounded bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenOrderDetail(ord)}
                              className="px-2 py-1 rounded border border-[#ded7c8] text-[10px] font-mono text-[#59493f] hover:bg-[#faf6ef] cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 9. ORDERS MANAGEMENT VIEW (ADMIN + STAFF)
// ============================================================================
const OrdersManagementView: React.FC<{
  orders: any[];
  algiersTodayKey: string;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onOpenOrderDetail: (order: any) => void;
}> = ({ orders, algiersTodayKey, onUpdateStatus, onOpenOrderDetail }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | '7D' | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const yesterdayKey = getAlgiersDateKey(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;

    const orderDateKey = o.algiersBusinessDate || getAlgiersDateKey(o.createdAt);
    if (dateFilter === 'TODAY' && orderDateKey !== algiersTodayKey) return false;
    if (dateFilter === 'YESTERDAY' && orderDateKey !== yesterdayKey) return false;
    if (dateFilter === '7D' && o.createdAt < sevenDaysAgoMs) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = o.orderId.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.toLowerCase().includes(q);
      return matchId || matchName || matchPhone;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Controls: Status Filter + Date Filter + Search */}
      <div className="bg-white p-4 rounded-xl border border-[#ded7c8] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter by Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {(['ALL', 'PENDING', 'CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#351016] text-[#f5efe6] font-semibold'
                      : 'bg-[#f4efe6] text-[#59493f] hover:bg-[#e8e0d2]'
                  }`}
                >
                  {st}
                </button>
              ),
            )}
          </div>

          {/* Filter by Date */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'TODAY', label: 'Today' },
                { id: 'YESTERDAY', label: 'Yesterday' },
                { id: '7D', label: 'Last 7 Days' },
                { id: 'ALL', label: 'All Orders' },
              ] as const
            ).map((df) => (
              <button
                key={df.id}
                type="button"
                onClick={() => setDateFilter(df.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  dateFilter === df.id
                    ? 'bg-[#c9833a] text-[#150a0c] font-bold'
                    : 'bg-[#faf6ef] border border-[#ded7c8] text-[#59493f]'
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8a7b70] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order #, Customer Name, or Phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#faf6ef] border border-[#ded7c8] rounded-lg text-[#221a14] focus:outline-none focus:border-[#351016]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#ded7c8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf6ef] border-b border-[#ded7c8] text-[11px] uppercase tracking-wider text-[#7a6b61]">
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total (DZD)</th>
                <th className="py-3.5 px-4">Order Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Loyalty Impact</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9de] text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-xs text-[#8a7b70]">
                    No orders match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-[#faf6ef]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onOpenOrderDetail(order)}
                        className="font-mono font-bold text-xs text-[#351016] hover:underline cursor-pointer"
                      >
                        #{order.orderId}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-[#221a14]">
                        {order.customerName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#6b5a4e]">
                      {order.customerPhone}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-xs text-[#3d312a]">
                        {(order.items || []).map((it: any, idx: number) => (
                          <div key={idx}>
                            <span className="font-mono font-semibold">{it.quantity}x</span>{' '}
                            {it.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#351016]">
                      {Number(order.totalDzd || 0).toLocaleString()} DZD
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-[#6b5a4e]">
                      <div>{formatAlgiersTime(order.createdAt)}</div>
                      <div className="text-[10px] text-[#8a7b70]">
                        {formatAlgiersDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {order.status === 'COMPLETED' && order.stampAwarded ? (
                        <div className="space-y-0.5">
                          <span className="inline-block text-[10px] font-mono font-bold text-[#2e7d32] bg-[#2e7d32]/10 px-2 py-0.5 rounded">
                            ✓ Stamp Issued
                          </span>
                          <div className="text-[10px] font-mono text-[#59493f]">
                            Loyalty: {order.customerStampCount ?? 0} / {order.stampsToReward ?? 7}
                          </div>
                        </div>
                      ) : order.status === 'CANCELLED' ? (
                        <span className="text-[10px] font-mono text-[#8a7b70]">
                          Cancelled (0 stamps)
                        </span>
                      ) : order.qualifiesForStamp ? (
                        <span className="text-[10px] font-mono text-[#c9833a] font-semibold">
                          Eligible on Completion
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#8a7b70]">
                          Below 300 DZD
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(order.orderId, 'CONFIRMED')}
                              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
                            >
                              Confirm Order
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(order.orderId, 'CANCELLED')}
                              className="px-2.5 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(order.orderId, 'READY')}
                              className="px-2.5 py-1 rounded-md bg-[#c9833a] hover:bg-[#b5722d] text-[#150a0c] text-xs font-semibold cursor-pointer"
                            >
                              Mark Ready
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(order.orderId, 'CANCELLED')}
                              className="px-2.5 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'READY' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(order.orderId, 'COMPLETED')}
                            className="px-2.5 py-1 rounded-md bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-semibold cursor-pointer"
                          >
                            Complete Order
                          </button>
                        )}
                        {order.status === 'COMPLETED' && (
                          <span className="text-[11px] font-mono text-[#2e7d32] font-semibold px-2">
                            Completed
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenOrderDetail(order)}
                          className="px-2.5 py-1 rounded-md bg-[#f4efe6] hover:bg-[#e5dec9] text-[#351016] text-xs font-mono cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
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

const OrderStatusBadge: React.FC<{ status: OrderStatus | string }> = ({ status }) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
    PREPARING: 'bg-blue-100 text-blue-800 border-blue-300',
    READY: 'bg-[#c9833a]/20 text-[#6b3a1f] border-[#c9833a]/40',
    COMPLETED: 'bg-[#2e7d32]/15 text-[#2e7d32] border-[#2e7d32]/30',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  };
  const key = String(status || 'PENDING').toUpperCase();
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
        styles[key] || styles.PENDING
      }`}
    >
      {status}
    </span>
  );
};
