import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { FULL_MENU_ITEMS } from '../../data/coffeeData';
import { MenuItem } from '../../types/coffee';
import { VentyLogo } from '../VentyLogo';

interface FullMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  onAddToCart: (item: MenuItem) => void;
  onOpenOrder: () => void;
}

export const FullMenuModal: React.FC<FullMenuModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'all',
  onAddToCart,
  onOpenOrder,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>(initialCategory);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { key: 'all', label: 'All Items' },
    { key: 'espresso', label: 'Specialty Coffee' },
    { key: 'cold', label: 'Iced & Cold Brew' },
    { key: 'filter', label: 'V60 Filter' },
    { key: 'juice', label: 'Fresh Juices' },
    { key: 'sweets', label: 'Sweets & Desserts' },
  ];

  const filteredItems =
    selectedCat === 'all'
      ? FULL_MENU_ITEMS
      : FULL_MENU_ITEMS.filter((item) => {
          if (selectedCat === 'espresso') {
            return item.category === 'espresso';
          }
          return item.category === selectedCat;
        });

  const handleAdd = (item: MenuItem) => {
    onAddToCart(item);
    setAddedNotice(item.name);
    setTimeout(() => {
      setAddedNotice(null);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-[#faf6ef] border border-[#ded7c8] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-[#221a14]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#ded7c8] flex items-center justify-between bg-[#faf6ef]">
          <div className="flex items-center gap-3">
            <VentyLogo
              className="h-9 w-auto max-w-[140px]"
              imgClassName="h-full w-auto max-h-9 max-w-[140px] object-contain block"
            />
            <div>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8a7b70] block">
                VENTY THE COFFEE · Miliana
              </span>
              <h3 className="font-serif font-bold text-2xl md:text-3xl text-[#221a14]">
                Drinks, Juices & Sweets
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenOrder}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#6b3a1f] text-[#faf6ef] px-4 py-2 text-xs font-medium hover:bg-[#532c17] transition-colors cursor-pointer"
            >
              <span>View Order Ahead Tray</span>
              <span>→</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#7a6b61] hover:text-[#221a14] hover:bg-[#eee9de] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Added Notification Toast */}
        {addedNotice && (
          <div className="bg-[#6b3a1f] text-[#faf6ef] py-2 px-4 text-xs font-sans flex items-center justify-between animate-in slide-in-from-top-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#c9833a]" />
              Added <strong>{addedNotice}</strong> to your order tray.
            </span>
            <button
              onClick={onOpenOrder}
              className="underline text-[#df9e59] hover:text-white ml-2 font-medium cursor-pointer"
            >
              View tray
            </button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-[#ded7c8] bg-[#eee9de]/60 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCat(cat.key)}
              className={`px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer ${
                selectedCat === cat.key
                  ? 'bg-[#6b3a1f] border-[#6b3a1f] text-[#faf6ef]'
                  : 'bg-white border-[#ded7c8] text-[#59493f] hover:bg-[#faf6ef]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#ded7c8] p-4 flex gap-4 hover:border-[#6b3a1f] transition-all group"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#eee9de] shrink-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-serif font-semibold text-base text-[#221a14] group-hover:text-[#6b3a1f] transition-colors">
                        {item.name}
                      </h4>
                      <span className="font-sans font-medium text-xs text-[#c9833a] tabular-nums whitespace-nowrap">
                        {item.formattedPrice}
                      </span>
                    </div>
                    <p className="font-sans font-light text-xs text-[#59493f] line-clamp-2 mt-1">
                      {item.description}
                    </p>

                    {/* Tasting notes / dietary */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tastingNotes?.map((note, i) => (
                        <span
                          key={i}
                          className="text-[10px] text-[#6b3a1f] bg-[#eee9de]/70 px-1.5 py-0.5"
                        >
                          {note}
                        </span>
                      ))}
                      {item.dietary?.map((diet, i) => (
                        <span
                          key={i}
                          className="text-[10px] text-[#2b7a4b] bg-emerald-50 px-1.5 py-0.5"
                        >
                          {diet}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#ded7c8]/50 flex justify-end">
                    <button
                      onClick={() => handleAdd(item)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#6b3a1f] hover:text-[#c9833a] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to order</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="p-4 border-t border-[#ded7c8] bg-[#faf6ef] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7a6b61] gap-2">
          <span>
            * Specialty single-origin beans, fresh seasonal juices squeezed to order, and artisanal desserts baked daily in Miliana.
          </span>
          <button
            onClick={onOpenOrder}
            className="sm:hidden w-full bg-[#6b3a1f] text-[#faf6ef] py-2.5 font-medium cursor-pointer"
          >
            View Order Tray →
          </button>
        </div>
      </div>
    </div>
  );
};
