import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Instagram,
  Facebook,
  Phone,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Coffee,
  GlassWater,
  Leaf,
  Cake,
  Cookie,
  SlidersHorizontal,
  X,
  Sparkles,
} from 'lucide-react';
import {
  OFFICIAL_CATEGORIES,
  OFFICIAL_MENU_CONTACT,
  OfficialMenuItem,
  getAllOfficialProducts,
} from '../data/officialMenuData';
import { CartItem } from '../types/coffee';
import { useOfficialLogo } from './VentyLogo';

interface MenuSectionProps {
  cart?: CartItem[];
  onAddToCart?: (item: OfficialMenuItem & { notes?: string; customPrice?: number }) => void;
  onUpdateQuantity?: (id: string, delta: number) => void;
  onOpenOrderModal?: () => void;
  onOpenFullMenuModal?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  seasonal: <Sparkles className="w-3.5 h-3.5 text-[#c9833a]" />,
  coffee: <Coffee className="w-3.5 h-3.5" />,
  drinks: <GlassWater className="w-3.5 h-3.5" />,
  fresh: <Leaf className="w-3.5 h-3.5" />,
  sweets: <Cookie className="w-3.5 h-3.5" />,
  desserts: <Cake className="w-3.5 h-3.5" />,
};

export const MenuSection: React.FC<MenuSectionProps> = ({
  cart = [],
  onAddToCart,
  onUpdateQuantity,
  onOpenOrderModal,
  onOpenFullMenuModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('coffee');
  const [isClickScrolling, setIsClickScrolling] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customizingItem, setCustomizingItem] = useState<OfficialMenuItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<{ label: string; priceDelta: number } | null>(null);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Record<string, boolean>>({});

  const toastTimeoutRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { logoSrc } = useOfficialLogo();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);

  const totalCartItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  const getItemQuantity = (id: string): number => {
    const match = cart.find((i) => i.id === id);
    return match ? match.quantity : 0;
  };

  const triggerAddAnimation = (id: string) => {
    setRecentlyAddedIds((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      setRecentlyAddedIds((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }, 1400);
  };

  const showToast = (name: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(`Added ${name} to your order`);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleAddItem = (item: OfficialMenuItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (item.options && item.options.length > 0) {
      setCustomizingItem(item);
      setSelectedOption(item.options[0].choices[0]);
      return;
    }

    if (onAddToCart) {
      onAddToCart(item);
      triggerAddAnimation(item.id);
      showToast(item.name);
    }
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem || !onAddToCart) return;
    const finalPrice = customizingItem.priceNum + (selectedOption?.priceDelta || 0);
    const notes = selectedOption && selectedOption.priceDelta > 0 ? selectedOption.label : undefined;
    
    onAddToCart({
      ...customizingItem,
      priceNum: finalPrice,
      customPrice: finalPrice,
      notes,
    });
    triggerAddAnimation(customizingItem.id);
    showToast(`${customizingItem.name} ${notes ? `(${notes})` : ''}`);
    setCustomizingItem(null);
    setSelectedOption(null);
  };

  // Setup IntersectionObserver for sticky category navigation
  useEffect(() => {
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      if (isClickScrolling) return;

      const visibleEntries = entries.filter((e) => e.isIntersecting);
      if (visibleEntries.length > 0) {
        visibleEntries.sort(
          (a, b) =>
            Math.abs(a.boundingClientRect.top - 140) -
            Math.abs(b.boundingClientRect.top - 140),
        );
        const targetId = visibleEntries[0].target.id.replace('menu-cat-', '');
        if (targetId) {
          setActiveCategory(targetId);
        }
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '-15% 0px -50% 0px',
      threshold: [0.1, 0.25, 0.5],
    });

    ['seasonal', ...OFFICIAL_CATEGORIES.map((cat) => cat.id)].forEach((catId) => {
      const el = document.getElementById(`menu-cat-${catId}`);
      if (el && observerRef.current) {
        observerRef.current.observe(el);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [isClickScrolling]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    setIsClickScrolling(true);

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }

    const targetEl = document.getElementById(`menu-cat-${categoryId}`);
    if (targetEl) {
      const navbarOffset = 130;
      const elementPosition = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      setIsClickScrolling(false);
    }, 800);
  };

  // Render individual item row with interactive ordering control
  const renderItemRow = (item: OfficialMenuItem, theme: 'burgundy' | 'cream') => {
    const qty = getItemQuantity(item.id);
    const isBurgundy = theme === 'burgundy';
    const isRecentlyAdded = !!recentlyAddedIds[item.id];

    return (
      <li
        key={item.id}
        className={`group flex items-center justify-between gap-3 py-1.5 px-2 -mx-2 rounded-lg transition-all duration-200 ${
          isBurgundy
            ? 'hover:bg-white/5 text-[#f3ede3]'
            : 'hover:bg-[#351016]/5 text-[#381c10]'
        }`}
      >
        <div
          onClick={() => handleAddItem(item)}
          className="flex-1 min-w-0 flex items-baseline gap-1.5 sm:gap-2 cursor-pointer select-none flex-wrap sm:flex-nowrap"
          title={`Click to add ${item.name} to order`}
        >
          <span
            className={`font-normal transition-colors leading-tight ${
              isBurgundy ? 'group-hover:text-white' : 'group-hover:text-[#180a06]'
            }`}
          >
            {item.name}
          </span>

          {/* Small, Elegant Dietary Indicator Badges */}
          {item.dietary && item.dietary.length > 0 && (
            <span className="inline-flex items-center gap-1 shrink-0">
              {item.dietary.map((tag) => (
                <span
                  key={tag}
                  className={`text-[8.5px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-[3px] border ${
                    isBurgundy
                      ? tag === 'Contains Nuts'
                        ? 'bg-[#df9e59]/15 text-[#f4d19b] border-[#df9e59]/30'
                        : 'bg-[#faf6ee]/10 text-[#dfd4c5] border-[#dfd4c5]/25'
                      : tag === 'Contains Nuts'
                      ? 'bg-[#c9833a]/15 text-[#8a531e] border-[#c9833a]/30'
                      : 'bg-[#351016]/5 text-[#614f44] border-[#351016]/15'
                  }`}
                  title={tag === 'GF' ? 'Gluten-Free' : tag}
                >
                  {tag}
                </span>
              ))}
            </span>
          )}

          {/* Seasonal / Limited-Time Badge */}
          {item.isSeasonal && (
            <span
              className={`text-[8.5px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-[3px] border shrink-0 ${
                isBurgundy
                  ? 'bg-[#f4d19b]/20 text-[#f4d19b] border-[#f4d19b]/40'
                  : 'bg-[#c9833a]/15 text-[#8a531e] border-[#c9833a]/30'
              }`}
              title={item.seasonalNote || 'Seasonal Special'}
            >
              ★ Special
            </span>
          )}

          {item.options && (
            <span
              className={`text-[8.5px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-[3px] border shrink-0 ${
                isBurgundy
                  ? 'bg-[#c9833a]/25 text-[#f4d19b] border-[#c9833a]/40'
                  : 'bg-[#351016]/10 text-[#6b3a1f] border-[#351016]/20'
              }`}
            >
              Customizable
            </span>
          )}
          <span
            className={`flex-1 border-b border-dotted mb-1 mx-1.5 opacity-30 hidden sm:block ${
              isBurgundy ? 'border-[#dfd4c5]' : 'border-[#351016]'
            }`}
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={`font-semibold whitespace-nowrap text-sm sm:text-base ${
              isBurgundy ? 'text-[#f4d19b]' : 'text-[#351016]'
            }`}
          >
            {item.price}
          </span>

          {/* Interactive Order Action Controls */}
          {qty > 0 && !isRecentlyAdded ? (
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className={`flex items-center gap-1 rounded-full p-0.5 shadow-sm border ${
                isBurgundy
                  ? 'bg-[#220a0e] border-[#c9833a]/40 text-[#faf6ee]'
                  : 'bg-[#faf6ef] border-[#351016]/30 text-[#2d1217]'
              }`}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onUpdateQuantity) onUpdateQuantity(item.id, -1);
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isBurgundy
                    ? 'hover:bg-white/15 text-[#f4d19b]'
                    : 'hover:bg-[#351016]/10 text-[#351016]'
                }`}
                aria-label={`Decrease quantity of ${item.name}`}
              >
                <Minus className="w-3 h-3" />
              </motion.button>

              <motion.span
                key={qty}
                initial={{ scale: 1.35, color: '#c9833a' }}
                animate={{ scale: 1, color: isBurgundy ? '#faf6ee' : '#2d1217' }}
                transition={{ duration: 0.25 }}
                className="text-xs font-bold w-4 text-center select-none"
              >
                {qty}
              </motion.span>

              <motion.button
                type="button"
                whileTap={{ scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onUpdateQuantity) {
                    onUpdateQuantity(item.id, 1);
                    triggerAddAnimation(item.id);
                  }
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isBurgundy
                    ? 'hover:bg-white/15 text-[#f4d19b]'
                    : 'hover:bg-[#351016]/10 text-[#351016]'
                }`}
                aria-label={`Increase quantity of ${item.name}`}
              >
                <Plus className="w-3 h-3" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              type="button"
              onClick={(e) => handleAddItem(item, e)}
              animate={
                isRecentlyAdded
                  ? { scale: [1, 1.28, 0.94, 1.04, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.45, ease: 'easeOut' }}
              whileTap={{ scale: 0.88 }}
              className={`relative inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer shadow-sm overflow-hidden ${
                isRecentlyAdded
                  ? 'bg-[#276749] text-white shadow-md ring-2 ring-[#48bb78]/50 scale-105'
                  : isBurgundy
                  ? 'bg-[#c9833a] hover:bg-[#df9e59] text-white hover:shadow-md'
                  : 'bg-[#351016] hover:bg-[#c9833a] text-[#faf6ee] hover:shadow-md'
              }`}
              aria-label={`Add ${item.name} to order`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isRecentlyAdded ? (
                  <motion.span
                    key="added"
                    initial={{ scale: 0.5, opacity: 0, y: 2 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0, y: -2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="flex items-center gap-1 font-semibold text-[11px] tracking-wide"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3] text-[#9ae6b4]" />
                    </motion.div>
                    <span>Added</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform duration-200" />
                    <span className="hidden sm:inline text-[11px]">Add</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </li>
    );
  };

  return (
    <section
      id="menu"
      className="relative w-full bg-[#faf6ef] text-[#28160f] py-20 md:py-28 overflow-hidden border-t border-[#ded7c8]/60"
    >
      {/* Background organic flowing decorative shapes */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full bg-[#351016]/4 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-[#c9833a]/6 blur-[130px] pointer-events-none" />

      {/* Floating Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed top-20 right-4 sm:right-8 z-50 bg-[#351016] text-[#faf6ee] px-4 py-2.5 rounded-xl shadow-2xl border border-[#c9833a]/40 flex items-center gap-2.5 text-xs sm:text-sm font-sans"
          >
            <div className="w-5 h-5 rounded-full bg-[#c9833a] text-white flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>{toastMessage}</span>
            {onOpenOrderModal && (
              <button
                type="button"
                onClick={onOpenOrderModal}
                className="underline text-[#f4d19b] hover:text-white ml-2 font-medium cursor-pointer"
              >
                View Cart
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Section Header Intro */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 mb-3"
          >
            <span className="w-8 h-[1px] bg-[#c9833a]" />
            <span className="font-sans uppercase text-[11px] sm:text-[12px] tracking-[0.28em] text-[#8a7a6f] font-semibold">
              VENTY THE COFFEE
            </span>
            <span className="w-8 h-[1px] bg-[#c9833a]" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif italic font-bold text-4xl sm:text-5xl md:text-6xl text-[#2d1217] tracking-tight mb-3"
          >
            Our Menu
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans font-light text-sm sm:text-base md:text-lg text-[#614f44] leading-relaxed mb-6"
          >
            Coffee, refreshing drinks and sweet moments.
          </motion.p>

          {/* Primary Ordering CTA Button */}
          {onOpenOrderModal && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-3"
            >
              <button
                type="button"
                onClick={onOpenOrderModal}
                className="inline-flex items-center gap-2 bg-[#351016] text-[#faf6ee] hover:bg-[#c9833a] hover:text-white px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 shadow-md cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order Now (Pickup Tray)</span>
              </button>
            </motion.div>
          )}
        </div>

        {/* 2. Sticky Category Navigation Bar */}
        <div className="sticky top-14 sm:top-16 md:top-20 z-30 mb-10 sm:mb-14 -mx-4 px-4 sm:mx-0 sm:px-0 py-2">
          <div className="max-w-4xl mx-auto backdrop-blur-md bg-[#f7f2e7]/95 sm:rounded-full border border-[#ded5c3]/90 p-1.5 shadow-[0_8px_24px_-8px_rgba(53,16,22,0.16)]">
            <nav
              className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 scroll-smooth"
              aria-label="Menu categories navigation"
            >
              {/* Seasonal Specials Category Chip */}
              <button
                type="button"
                onClick={() => handleCategoryClick('seasonal')}
                className={`relative shrink-0 flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                  activeCategory === 'seasonal'
                    ? 'text-[#faf6ee]'
                    : 'text-[#8a531e] hover:text-[#351016] bg-[#c9833a]/10 hover:bg-[#c9833a]/20 border border-[#c9833a]/30'
                }`}
              >
                {activeCategory === 'seasonal' && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-[#351016] rounded-full shadow-sm"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c9833a]" />
                  <span>Seasonal Specials</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[#c9833a] text-white">
                    New
                  </span>
                </span>
              </button>

              {OFFICIAL_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`relative shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'text-[#faf6ee]'
                        : 'text-[#614f44] hover:text-[#2d1217] hover:bg-[#ede5d6]/70'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCategoryPill"
                        className="absolute inset-0 bg-[#351016] rounded-full shadow-sm"
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {CATEGORY_ICONS[cat.id]}
                      <span>{cat.label}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 3. SEASONAL SPECIALS SPOTLIGHT SHOWCASE (When filtered or anchored) */}
        <div
          id="menu-cat-seasonal"
          className="scroll-mt-36 mb-12 sm:mb-16 p-6 sm:p-8 md:p-10 rounded-3xl border border-[#c9833a]/40 bg-[#351016] text-[#faf6ee] shadow-[0_20px_50px_-15px_rgba(53,16,22,0.45)] relative overflow-hidden"
        >
          {/* Subtle Ambient Gold Glow in Corner */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#c9833a]/25 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dfd4c5]/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#f4d19b]" />
                  <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
                    Seasonal Specials & Limited-Time Creations
                  </h3>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-[#c9833a]/30 text-[#f4d19b] border border-[#c9833a]/50">
                    Miliana Curations
                  </span>
                </div>
                <p className="font-sans text-xs sm:text-sm text-[#dfd4c5] max-w-2xl leading-relaxed">
                  Small-batch artisan roasts, fresh market fruit infusions, matcha imports, and chef-made patisserie available for a limited time.
                </p>
              </div>

              <span className="self-start sm:self-auto font-sans text-xs text-[#f4d19b] font-medium bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
                {getAllOfficialProducts().filter((i) => i.isSeasonal).length} Limited Items
              </span>
            </div>

            {/* Grid of Seasonal Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 mt-6">
              {getAllOfficialProducts()
                .filter((item) => item.isSeasonal)
                .map((item) => renderItemRow(item, 'burgundy'))}
            </div>
          </div>
        </div>

        {/* 4. TWO-COLUMN EDITORIAL MENU SPREAD WITH DIRECT ORDERING ON EVERY ITEM */}
        <div className="space-y-16 md:space-y-24">
          {/* =========================================================
              SPREAD 1: COFFEE & DRINKS (Coffee, Latte, Mojitos, Milkshakes, Mocktails, Tea)
              ========================================================= */}
          <div className="relative rounded-3xl overflow-hidden border border-[#dfd5c3] shadow-[0_20px_60px_-25px_rgba(53,16,22,0.22)] bg-[#f6f1e6]">
            {/* Organic Flowing S-Curve Background SVG */}
            <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block">
              <svg
                viewBox="0 0 1200 1350"
                fill="none"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <path
                  d="M 0 0 L 590 0 C 640 220 580 460 0 680 Z"
                  fill="#331016"
                />
                <path
                  d="M 1200 1350 L 1200 700 C 980 760 760 960 690 1350 Z"
                  fill="#331016"
                />
              </svg>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
              {/* LEFT COLUMN: COFFEE (Coffee, Coffee / Latte, Flavors) & MOCKTAILS */}
              <div className="flex flex-col justify-between p-6 sm:p-9 md:p-12 space-y-12 bg-[#331016] lg:bg-transparent text-[#faf6ee] lg:text-inherit">
                {/* 1. Category Section: COFFEE */}
                <div id="menu-cat-coffee" className="scroll-mt-36">
                  <div className="flex items-center justify-between pb-2 mb-6 border-b border-[#dfd4c5]/35 lg:border-[#dfd4c5]/40">
                    <div className="flex items-center gap-2.5">
                      <Coffee className="w-5 h-5 text-[#f4d19b]" />
                      <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl sm:text-3xl text-[#faf6ee]">
                        COFFEE
                      </h3>
                    </div>
                    <span className="font-sans text-[10px] tracking-widest uppercase text-[#dfd4c5]">
                      Espresso & Filter
                    </span>
                  </div>

                  <ul className="space-y-1 text-sm sm:text-base font-sans">
                    {OFFICIAL_CATEGORIES[0].subcategories[0].items.map((item) =>
                      renderItemRow(item, 'burgundy'),
                    )}
                  </ul>

                  {/* COFFEE / LATTE */}
                  <div className="mt-8 pt-6 border-t border-[#dfd4c5]/25">
                    <h4 className="font-serif font-bold uppercase tracking-[0.16em] text-xl text-[#faf6ee] pb-1 border-b border-[#dfd4c5]/35 inline-block mb-4">
                      COFFEE / LATTE
                    </h4>
                    <ul className="space-y-1 text-sm sm:text-base font-sans">
                      {OFFICIAL_CATEGORIES[0].subcategories[1].items.map((item) =>
                        renderItemRow(item, 'burgundy'),
                      )}
                    </ul>
                  </div>

                  {/* FLAVORS */}
                  <div className="mt-8 pt-6 border-t border-[#dfd4c5]/25">
                    <div className="flex items-center justify-between pb-1 mb-3 border-b border-[#dfd4c5]/35">
                      <h4 className="font-serif font-bold uppercase tracking-[0.16em] text-lg text-[#faf6ee]">
                        FLAVORS
                      </h4>
                      <span className="text-[10px] uppercase font-sans tracking-wider text-[#dfd4c5]">
                        Syrup Additions
                      </span>
                    </div>
                    <ul className="space-y-1 text-sm font-sans">
                      {OFFICIAL_CATEGORIES[0].subcategories[2].items.map((item) =>
                        renderItemRow(item, 'burgundy'),
                      )}
                    </ul>
                  </div>
                </div>

                {/* 2. Lower Left Section: MOCKTAILS & NATURAL (Cream Canvas on LG) */}
                <div className="text-[#2d1217] pt-8 lg:pt-12 bg-[#f6f1e6] lg:bg-transparent -mx-6 -mb-6 p-6 lg:p-0 lg:m-0 rounded-b-2xl lg:rounded-none">
                  <div className="flex items-center gap-2 pb-1 mb-4 border-b border-[#351016]/30">
                    <GlassWater className="w-5 h-5 text-[#c9833a]" />
                    <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl text-[#2d1217]">
                      MOCKTAILS
                    </h3>
                  </div>
                  <ul className="space-y-1 text-sm sm:text-base font-sans mb-8">
                    {OFFICIAL_CATEGORIES[1].subcategories[2].items.map((item) =>
                      renderItemRow(item, 'cream'),
                    )}
                  </ul>

                  {/* NATURAL JUICES (Mapped to Fresh) */}
                  <div id="menu-cat-fresh" className="scroll-mt-36 pt-6 border-t border-[#351016]/20">
                    <div className="flex items-center gap-2 pb-1 mb-4 border-b border-[#351016]/30">
                      <Leaf className="w-5 h-5 text-[#c9833a]" />
                      <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl text-[#2d1217]">
                        NATURAL
                      </h3>
                    </div>
                    <ul className="space-y-1 text-sm sm:text-base font-sans">
                      {OFFICIAL_CATEGORIES[2].subcategories[0].items.map((item) =>
                        renderItemRow(item, 'cream'),
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: BRAND EMBLEM, MOJITOS, MILKSHAKES & TEA */}
              <div
                id="menu-cat-drinks"
                className="flex flex-col justify-between p-6 sm:p-9 md:p-12 space-y-12 border-t lg:border-t-0 lg:border-l border-[#dfd5c3]/80 scroll-mt-36"
              >
                {/* Brand Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#351016]/20">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={logoSrc}
                      alt="VENTY"
                      className="h-11 w-auto object-contain"
                    />
                    <div>
                      <span className="font-serif italic font-bold tracking-tight text-3xl text-[#2d1217] block leading-none">
                        VENTY
                      </span>
                      <span className="font-sans uppercase text-[10px] tracking-[0.24em] text-[#8a7a6f] font-semibold">
                        Coffee & Refreshment
                      </span>
                    </div>
                  </div>
                  <span className="font-sans text-xs uppercase tracking-widest text-[#736055] font-medium hidden sm:block">
                    Miliana, Algeria
                  </span>
                </div>

                {/* Top Right: MOJITOS & MILKSHAKES */}
                <div className="space-y-10 text-[#2d1217]">
                  {/* MOJITOS */}
                  <div>
                    <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl text-[#2d1217] pb-1 border-b border-[#351016]/30 inline-block mb-4">
                      MOJITOS
                    </h3>
                    <ul className="space-y-1 text-sm sm:text-base font-sans">
                      {OFFICIAL_CATEGORIES[1].subcategories[0].items.map((item) =>
                        renderItemRow(item, 'cream'),
                      )}
                    </ul>
                  </div>

                  {/* MILKSHAKES */}
                  <div>
                    <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl text-[#2d1217] pb-1 border-b border-[#351016]/30 inline-block mb-4">
                      MILKSHAKES
                    </h3>
                    <ul className="space-y-1 text-sm sm:text-base font-sans">
                      {OFFICIAL_CATEGORIES[1].subcategories[1].items.map((item) =>
                        renderItemRow(item, 'cream'),
                      )}
                    </ul>
                  </div>
                </div>

                {/* Bottom Right: TEA (Deep Burgundy Flowing Area) */}
                <div className="pt-8 mt-6">
                  <div className="p-6 sm:p-8 bg-[#331016] rounded-2xl text-[#faf6ee] shadow-[0_12px_36px_-12px_rgba(53,16,22,0.5)]">
                    <div className="flex items-center justify-between pb-1 mb-4 border-b border-[#dfd4c5]/40">
                      <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl text-[#faf6ee]">
                        TEA
                      </h3>
                      <span className="text-[10px] uppercase font-sans tracking-wider text-[#dfd4c5]">
                        Infusions & Hot Brews
                      </span>
                    </div>
                    <ul className="space-y-1 text-sm sm:text-base font-sans">
                      {OFFICIAL_CATEGORIES[2].subcategories[1].items.map((item) =>
                        renderItemRow(item, 'burgundy'),
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              SPREAD 2: SWEETS, DESSERTS & CONTACT (Styles, Crêpes, Waffles, Cheesecake, Contact)
              ========================================================= */}
          <div className="relative rounded-3xl overflow-hidden border border-[#dfd5c3] shadow-[0_20px_60px_-25px_rgba(53,16,22,0.22)] bg-[#f6f1e6]">
            {/* Organic Flowing S-Curve Background SVG */}
            <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block">
              <svg
                viewBox="0 0 1200 1350"
                fill="none"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <path
                  d="M 0 0 L 610 0 C 660 240 600 480 0 710 Z"
                  fill="#331016"
                />
                <path
                  d="M 1200 1350 L 1200 680 C 970 740 750 940 680 1350 Z"
                  fill="#331016"
                />
              </svg>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
              {/* LEFT COLUMN: SWEETS (STYLES), STYLES DESSERT & CHEESECAKE */}
              <div
                id="menu-cat-sweets"
                className="flex flex-col justify-between p-6 sm:p-9 md:p-12 space-y-12 bg-[#331016] lg:bg-transparent text-[#faf6ee] lg:text-inherit scroll-mt-36"
              >
                {/* STYLES (Bakery & Viennoiserie) */}
                <div>
                  <div className="flex items-center justify-between pb-2 mb-6 border-b border-[#dfd4c5]/35 lg:border-[#dfd4c5]/40">
                    <div className="flex items-center gap-2.5">
                      <Cookie className="w-5 h-5 text-[#f4d19b]" />
                      <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl sm:text-3xl text-[#faf6ee]">
                        STYLES
                      </h3>
                    </div>
                    <span className="font-sans text-[10px] tracking-widest uppercase text-[#dfd4c5]">
                      Bakery & Sweets
                    </span>
                  </div>

                  <ul className="space-y-1 text-sm sm:text-base font-sans">
                    {OFFICIAL_CATEGORIES[3].subcategories[0].items.map((item) =>
                      renderItemRow(item, 'burgundy'),
                    )}
                  </ul>

                  {/* STYLES DESSERT (Mapped to Desserts) */}
                  <div id="menu-cat-desserts" className="mt-8 pt-6 border-t border-[#dfd4c5]/25 scroll-mt-36">
                    <div className="flex items-center gap-2 pb-1 mb-4 border-b border-[#dfd4c5]/35">
                      <Cake className="w-5 h-5 text-[#f4d19b]" />
                      <h4 className="font-serif font-bold uppercase tracking-[0.16em] text-xl text-[#faf6ee]">
                        STYLES DESSERT
                      </h4>
                    </div>
                    <ul className="space-y-1 text-sm sm:text-base font-sans">
                      {OFFICIAL_CATEGORIES[4].subcategories[0].items.map((item) =>
                        renderItemRow(item, 'burgundy'),
                      )}
                    </ul>
                  </div>
                </div>

                {/* CHEESECAKE (Cream Canvas on LG) */}
                <div className="text-[#2d1217] pt-8 lg:pt-12 bg-[#f6f1e6] lg:bg-transparent -mx-6 -mb-6 p-6 lg:p-0 lg:m-0 rounded-b-2xl lg:rounded-none">
                  <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl text-[#2d1217] pb-1 border-b border-[#351016]/30 inline-block mb-4">
                    CHEESECAKE
                  </h3>
                  <ul className="space-y-1 text-sm sm:text-base font-sans">
                    {OFFICIAL_CATEGORIES[4].subcategories[1].items.map((item) =>
                      renderItemRow(item, 'cream'),
                    )}
                  </ul>
                </div>
              </div>

              {/* RIGHT COLUMN: CRÊPES, WAFFLES, SUPPLÉMENT & CONTACT US */}
              <div className="flex flex-col justify-between p-6 sm:p-9 md:p-12 space-y-12 border-t lg:border-t-0 lg:border-l border-[#dfd5c3]/80">
                {/* Top Right: CRÊPES & WAFFLES & SUPPLÉMENT */}
                <div className="space-y-10 text-[#2d1217]">
                  {/* CRÊPES */}
                  <div>
                    <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl text-[#2d1217] pb-1 border-b border-[#351016]/30 inline-block mb-4">
                      CRÊPES
                    </h3>
                    <ul className="space-y-1 text-sm sm:text-base font-sans">
                      {OFFICIAL_CATEGORIES[3].subcategories[1].items.map((item) =>
                        renderItemRow(item, 'cream'),
                      )}
                    </ul>
                  </div>

                  {/* WAFFLES */}
                  <div>
                    <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl text-[#2d1217] pb-1 border-b border-[#351016]/30 inline-block mb-4">
                      WAFFLES
                    </h3>
                    <ul className="space-y-1 text-sm sm:text-base font-sans">
                      {OFFICIAL_CATEGORIES[3].subcategories[2].items.map((item) =>
                        renderItemRow(item, 'cream'),
                      )}
                    </ul>
                  </div>

                  {/* SUPPLÉMENT */}
                  <div>
                    <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-xl text-[#2d1217] pb-1 border-b border-[#351016]/30 inline-block mb-4">
                      SUPPLÉMENT
                    </h3>
                    <ul className="space-y-1 text-sm sm:text-base font-sans">
                      {OFFICIAL_CATEGORIES[4].subcategories[2].items.map((item) =>
                        renderItemRow(item, 'cream'),
                      )}
                    </ul>
                  </div>
                </div>

                {/* Bottom Right: CONTACT US (Deep Burgundy Flowing Area) */}
                <div className="pt-8 mt-6">
                  <div className="p-6 sm:p-8 bg-[#331016] rounded-2xl text-[#faf6ee] shadow-[0_12px_36px_-12px_rgba(53,16,22,0.5)]">
                    <h3 className="font-serif font-bold uppercase tracking-[0.16em] text-2xl text-[#faf6ee] pb-1 border-b border-[#dfd4c5]/40 inline-block mb-5">
                      CONTACT US
                    </h3>
                    <ul className="space-y-3.5 text-sm font-sans">
                      <li>
                        <a
                          href={OFFICIAL_MENU_CONTACT.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 text-[#f3ede3] hover:text-[#f4d19b] transition-colors"
                        >
                          <Instagram className="w-4 h-4 text-[#f4d19b] shrink-0" />
                          <span className="font-medium">{OFFICIAL_MENU_CONTACT.instagram}</span>
                        </a>
                      </li>
                      <li>
                        <a
                          href={OFFICIAL_MENU_CONTACT.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 text-[#f3ede3] hover:text-[#f4d19b] transition-colors"
                        >
                          <Facebook className="w-4 h-4 text-[#f4d19b] shrink-0" />
                          <span className="font-medium">{OFFICIAL_MENU_CONTACT.facebook}</span>
                        </a>
                      </li>
                      <li>
                        <a
                          href={OFFICIAL_MENU_CONTACT.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 text-[#f3ede3] hover:text-[#f4d19b] transition-colors"
                        >
                          <svg
                            className="w-4 h-4 fill-current text-[#f4d19b] shrink-0"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                          </svg>
                          <span className="font-medium">{OFFICIAL_MENU_CONTACT.tiktok}</span>
                        </a>
                      </li>
                      <li>
                        <a
                          href={`tel:${OFFICIAL_MENU_CONTACT.phoneClean}`}
                          className="flex items-center gap-3.5 text-[#f3ede3] hover:text-[#f4d19b] transition-colors"
                        >
                          <Phone className="w-4 h-4 text-[#f4d19b] shrink-0" />
                          <span className="font-medium">{OFFICIAL_MENU_CONTACT.phone}</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Ordering & Exploration CTA Banner */}
        <div className="mt-14 sm:mt-18 pt-8 border-t border-[#ded5c3]/80 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#ede4d4]/60 p-6 sm:p-8 rounded-2xl">
          <div className="text-center sm:text-left">
            <span className="font-sans uppercase text-[10px] tracking-[0.22em] text-[#8a7a6f] font-semibold block mb-1">
              Fresh & Handcrafted Daily
            </span>
            <p className="font-serif italic text-xl sm:text-2xl text-[#2d1217]">
              Ready to order your coffee or treat?
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {onOpenOrderModal && (
              <button
                type="button"
                onClick={onOpenOrderModal}
                className="inline-flex items-center gap-2 bg-[#351016] text-[#faf6ee] hover:bg-[#c9833a] hover:text-white px-5 sm:px-6 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 shadow-sm cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>View Order Tray ({totalCartItems})</span>
              </button>
            )}

            {onOpenFullMenuModal && (
              <button
                type="button"
                onClick={onOpenFullMenuModal}
                className="inline-flex items-center gap-1.5 border border-[#351016]/40 hover:border-[#351016] text-[#351016] px-5 py-3 rounded-full text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 cursor-pointer"
              >
                <span>Interactive Order Drawer</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Customization Modal for Options (Syrups / Supplements) */}
      {customizingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setCustomizingItem(null)}
        >
          <div
            className="bg-[#faf6ef] border border-[#ded7c8] shadow-2xl max-w-md w-full p-6 text-[#221a14] rounded-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCustomizingItem(null)}
              className="absolute top-4 right-4 text-[#7a6b61] hover:text-[#221a14] p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] uppercase font-sans tracking-widest text-[#8a7b70] block mb-1">
              Customize Product
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#2d1217] mb-1">
              {customizingItem.name}
            </h3>
            <p className="text-xs text-[#614f44] mb-5">
              Base price: <strong className="text-[#351016]">{customizingItem.price}</strong>
            </p>

            {customizingItem.options?.map((opt) => (
              <div key={opt.name} className="mb-6">
                <label className="block text-xs font-semibold text-[#351016] uppercase tracking-wider mb-2.5">
                  {opt.name}
                </label>
                <div className="space-y-2">
                  {opt.choices.map((choice) => {
                    const isSelected = selectedOption?.label === choice.label;
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        onClick={() => setSelectedOption(choice)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#351016] border-[#351016] text-[#faf6ee]'
                            : 'bg-white border-[#ded7c8] text-[#381c10] hover:bg-[#ede5d6]/40'
                        }`}
                      >
                        <span className="font-medium">{choice.label}</span>
                        {choice.priceDelta > 0 && (
                          <span className={isSelected ? 'text-[#f4d19b]' : 'text-[#8a7b70]'}>
                            +{choice.priceDelta} DA
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-4 border-t border-[#ded5c3]">
              <div>
                <span className="text-[10px] uppercase text-[#8a7a6f] block">Total</span>
                <span className="font-serif font-bold text-xl text-[#351016]">
                  {customizingItem.priceNum + (selectedOption?.priceDelta || 0)} DA
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmCustomization}
                className="bg-[#351016] hover:bg-[#c9833a] text-[#faf6ee] px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Add to Order Tray
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
