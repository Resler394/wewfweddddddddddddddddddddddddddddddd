import React, { useState } from 'react';
import { X, Check, Package, Sparkles } from 'lucide-react';
import { COFFEE_BEANS, IMAGES } from '../../data/coffeeData';
import { CoffeeBean, CartItem } from '../../types/coffee';
import { VentyLogo } from '../VentyLogo';

interface ShopBeansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onOpenOrder: () => void;
}

export const ShopBeansModal: React.FC<ShopBeansModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
  onOpenOrder,
}) => {
  const [selectedGrind, setSelectedGrind] = useState<{ [beanId: string]: string }>({
    'ethiopia-specialty': 'Whole Bean',
    'colombia-specialty': 'Whole Bean',
    'house-blend-venty': 'Whole Bean',
  });
  const [successBean, setSuccessBean] = useState<string | null>(null);

  if (!isOpen) return null;

  const grindOptions = ['Whole Bean', 'V60 / Filter', 'Aeropress', 'Espresso', 'French Press'];

  const handleAddBean = (bean: CoffeeBean) => {
    const grind = selectedGrind[bean.id] || 'Whole Bean';
    onAddToCart({
      id: `${bean.id}-${grind}`,
      name: `${bean.name} (${grind})`,
      price: bean.price250g,
      quantity: 1,
      category: 'beans',
      grind: grind,
    });
    setSuccessBean(bean.name);
    setTimeout(() => setSuccessBean(null), 2400);
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
                Specialty Coffee Beans
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenOrder}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#6b3a1f] text-[#faf6ef] px-4 py-2 text-xs font-medium hover:bg-[#532c17] transition-colors cursor-pointer"
            >
              <span>View Tray</span>
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

        {/* Success Notice */}
        {successBean && (
          <div className="bg-[#6b3a1f] text-[#faf6ef] py-2 px-4 text-xs font-sans flex items-center justify-between animate-in slide-in-from-top-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#c9833a]" />
              Added 250g bag of <strong>{successBean}</strong> to your tray!
            </span>
            <button
              onClick={onOpenOrder}
              className="underline text-[#df9e59] hover:text-white font-medium cursor-pointer"
            >
              Go to checkout
            </button>
          </div>
        )}

        {/* Coffee Bean Lots */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="p-4 bg-[#eee9de] border border-[#ded7c8] flex items-center gap-4 text-xs text-[#59493f]">
            <Package className="w-5 h-5 text-[#c9833a] shrink-0" />
            <div>
              <strong className="text-[#221a14]">Selected for peak aroma and flavor.</strong> All 250g bags are sealed with one-way degassing valves to ensure peak freshness for your home brews.
            </div>
          </div>

          <div className="space-y-6">
            {COFFEE_BEANS.map((bean) => (
              <div
                key={bean.id}
                className="bg-white border border-[#ded7c8] p-6 hover:border-[#6b3a1f] transition-all grid grid-cols-1 md:grid-cols-12 gap-6"
              >
                {/* Visual / Badge */}
                <div className="md:col-span-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-sans font-medium uppercase tracking-[0.14em] text-[#8a7b70] block">
                      {bean.origin} · {bean.region}
                    </span>
                    <h4 className="font-serif font-bold text-2xl text-[#221a14] mt-1">
                      {bean.name}
                    </h4>
                    <span className="inline-block mt-2 font-mono text-xs font-bold text-[#c9833a]">
                      {bean.formattedPrice || `${bean.price250g.toLocaleString()} DZD`}{' '}
                      <span className="text-[#8a7b70] font-normal">/ 250g bag</span>
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#ded7c8] space-y-1 text-xs text-[#59493f]">
                    <div>
                      <span className="font-medium text-[#221a14]">Process:</span> {bean.process}
                    </div>
                    <div>
                      <span className="font-medium text-[#221a14]">Altitude:</span> {bean.altitude}
                    </div>
                    <div>
                      <span className="font-medium text-[#221a14]">Profile:</span> {bean.roastProfile}
                    </div>
                  </div>
                </div>

                {/* Description & Selection */}
                <div className="md:col-span-8 flex flex-col justify-between">
                  <div>
                    <p className="font-sans font-light text-sm text-[#59493f] leading-relaxed mb-4">
                      {bean.description}
                    </p>

                    {/* Tasting notes */}
                    <div className="mb-4">
                      <span className="text-[11px] font-sans uppercase font-medium tracking-wider text-[#8a7b70] block mb-1.5">
                        Tasting Notes:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {bean.notes.map((note, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-[#faf6ef] border border-[#ded7c8] text-[#6b3a1f] px-2.5 py-1"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Grind Selector */}
                    <div>
                      <label className="text-[11px] font-sans uppercase font-medium tracking-wider text-[#8a7b70] block mb-1.5">
                        Select Grind Size:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {grindOptions.map((g) => {
                          const isSelected = (selectedGrind[bean.id] || 'Whole Bean') === g;
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() =>
                                setSelectedGrind((prev) => ({ ...prev, [bean.id]: g }))
                              }
                              className={`py-1.5 px-2 text-xs border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[#6b3a1f] bg-[#6b3a1f] text-[#faf6ef]'
                                  : 'border-[#ded7c8] bg-white text-[#59493f] hover:bg-[#eee9de]'
                              }`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#ded7c8] flex items-center justify-between">
                    <span className="text-xs text-[#8a7b70]">
                      Available for pickup at Venty in Miliana
                    </span>
                    <button
                      onClick={() => handleAddBean(bean)}
                      className="bg-[#6b3a1f] hover:bg-[#532c17] text-[#faf6ef] px-5 py-2.5 text-xs font-medium transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Add 250g to Tray →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
