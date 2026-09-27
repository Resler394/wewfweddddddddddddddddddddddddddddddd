import React from 'react';
import { motion } from 'motion/react';
import { MENU_HIGHLIGHTS } from '../data/coffeeData';

interface MenuHighlightsProps {
  onSelectCategory: (category: string) => void;
  onOpenFullMenu: () => void;
}

export const MenuHighlights: React.FC<MenuHighlightsProps> = ({
  onSelectCategory,
  onOpenFullMenu,
}) => {
  return (
    <section id="menu" className="w-full bg-[#faf6ef] py-20 md:py-28 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-12 md:mb-16">
          <p className="font-sans font-medium uppercase text-[10px] tracking-[0.16em] text-[#8a7b70] mb-2">
            The Offerings
          </p>
          <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#221a14] tracking-tight">
            What's On
          </h2>
          {/* Amber Underline Rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-12 h-[2px] bg-[#c9833a] origin-left mt-3"
          />
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {MENU_HIGHLIGHTS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelectCategory(item.categoryKey)}
              className="group cursor-pointer bg-[#eee9de] border border-transparent hover:border-[#6b3a1f] transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Image with 4/3 aspect ratio */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#e2dcd0]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Card Meta & Content */}
              <div className="p-6 md:p-7 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <h3 className="font-serif font-semibold text-2xl text-[#221a14] tracking-tight">
                      {item.title}
                    </h3>
                    <span className="font-sans text-xs font-medium text-[#c9833a] whitespace-nowrap">
                      {item.startingPrice}
                    </span>
                  </div>
                  <p className="font-sans font-light text-sm text-[#5c4c42] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#ded7c8]/60 flex items-center justify-between text-xs font-medium text-[#6b3a1f]">
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    Explore items & order →
                  </span>
                  <span className="text-[#8a7b70] text-[11px] uppercase tracking-wider">
                    Venty Miliana
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View Entire Menu Action */}
        <div className="mt-12 text-center">
          <button
            onClick={onOpenFullMenu}
            className="inline-flex items-center gap-2 border-b border-[#6b3a1f] pb-1 text-sm font-medium text-[#6b3a1f] hover:text-[#c9833a] hover:border-[#c9833a] transition-all cursor-pointer group"
          >
            <span>View complete drinks, juices & sweets menu</span>
            <span className="group-hover:translate-x-0.5 transition-transform duration-200">
              →
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
