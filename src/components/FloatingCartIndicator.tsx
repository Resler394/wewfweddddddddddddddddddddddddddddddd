import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { CartItem } from '../types/coffee';

interface FloatingCartIndicatorProps {
  cart: CartItem[];
  onOpenCheckout: () => void;
}

export const FloatingCartIndicator: React.FC<FloatingCartIndicatorProps> = ({
  cart,
  onOpenCheckout,
}) => {
  const totalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.aside
          aria-label="Floating cart order tray"
          initial={{ opacity: 0, y: 35, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 35, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="fixed bottom-5 right-4 sm:right-7 z-50 max-w-[calc(100vw-2rem)]"
        >
          <div
            onClick={onOpenCheckout}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenCheckout();
              }
            }}
            className="group relative flex items-center gap-3.5 bg-[#351016]/95 hover:bg-[#280a0f] text-[#faf6ee] pl-4 pr-3.5 py-3 rounded-full shadow-[0_16px_45px_-10px_rgba(53,16,22,0.55)] border border-[#c9833a]/55 backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] select-none"
          >
            {/* Ambient Gold Halo */}
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#c9833a]/30 to-[#f4d19b]/20 blur-sm pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

            {/* Shopping Bag Icon with Active Badge */}
            <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#c9833a] text-white shadow-sm">
              <ShoppingBag className="w-4 h-4" />
              <motion.span
                key={totalItems}
                initial={{ scale: 0.6 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.3 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#faf6ee] text-[#351016] text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md border border-[#351016]"
              >
                {totalItems}
              </motion.span>
            </div>

            {/* Cart Info: Items & Subtotal */}
            <div className="flex flex-col text-left pr-1">
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-[10px] uppercase tracking-wider font-semibold text-[#f4d19b]">
                  {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#c9833a]" />
                <span className="font-serif font-bold text-sm tracking-tight text-white">
                  {subtotal} DA
                </span>
              </div>
              <span className="font-sans text-[11px] text-[#dfd4c5] font-light leading-none">
                Miliana Takeaway Tray
              </span>
            </div>

            {/* Checkout Action Button Shortcut */}
            <div className="shrink-0 flex items-center gap-1.5 bg-[#c9833a] hover:bg-[#df9e59] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors shadow-sm ml-1">
              <span>Checkout</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
