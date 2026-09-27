import React from 'react';
import { motion } from 'motion/react';
import { IMAGES } from '../data/coffeeData';

interface OurCoffeeProps {
  onOpenShopBeans: () => void;
}

export const OurCoffee: React.FC<OurCoffeeProps> = ({ onOpenShopBeans }) => {
  return (
    <section id="our-coffee" className="w-full bg-[#faf6ef] py-20 md:py-28 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Text Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="font-sans font-medium uppercase text-[10px] tracking-[0.16em] text-[#8a7b70] mb-2">
              Our Coffee
            </p>
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#221a14] tracking-tight mb-2">
              From Coffee to Cup
            </h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-12 h-[2px] bg-[#c9833a] origin-left mb-8"
            />

            {/* Featured Quote */}
            <blockquote className="font-serif italic font-normal text-xl md:text-2xl text-[#6b3a1f] leading-snug mb-6">
              "Coffee is at the heart of Venty. A place where every cup becomes part of the moment."
            </blockquote>

            {/* Body Paragraphs */}
            <div className="space-y-4 font-sans font-light text-sm md:text-base text-[#59493f] leading-relaxed mb-8">
              <p>
                Coffee is at the heart of Venty. A place where every cup becomes part of the moment — whether you're stopping by for your daily coffee, meeting someone, or simply taking a break.
              </p>
              <p>
                We carefully prepare single-origin beans, creamy lattes, crisp filter pours, and refreshing cold drinks. Crafted with dedication in Miliana for everyone who appreciates genuine quality.
              </p>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap items-center gap-2.5 mb-8">
              <span className="font-sans text-[11px] font-medium tracking-wide text-[#6b3a1f] border border-[#ded7c8] px-3 py-1 bg-[#eee9de]/50">
                Specialty Coffee
              </span>
              <span className="font-sans text-[11px] font-medium tracking-wide text-[#6b3a1f] border border-[#ded7c8] px-3 py-1 bg-[#eee9de]/50">
                Single Origin
              </span>
              <span className="font-sans text-[11px] font-medium tracking-wide text-[#6b3a1f] border border-[#ded7c8] px-3 py-1 bg-[#eee9de]/50">
                Handcrafted Daily
              </span>
            </div>

            {/* Shop our beans button */}
            <div>
              <button
                onClick={onOpenShopBeans}
                className="group inline-flex items-center gap-2 border border-[#6b3a1f] text-[#6b3a1f] hover:bg-[#6b3a1f] hover:text-[#faf6ef] px-6 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <span>Discover our coffee selection</span>
                <span className="text-[#c9833a] group-hover:translate-x-1 group-hover:text-[#faf6ef] transition-all duration-200">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* Right Stacked Image Pair (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="space-y-4">
              {/* Top Image: Coffee Beans Sack */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="aspect-[4/3] w-full overflow-hidden shadow-sm bg-[#eee9de]"
              >
                <img
                  src={IMAGES.beansSack}
                  alt="Specialty coffee beans selected for Venty The Coffee"
                  className="w-full h-full object-cover filter brightness-[0.97] hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Bottom Image: Pour Over / Dripper */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="aspect-[4/3] w-full overflow-hidden shadow-sm bg-[#eee9de] -ml-0 lg:-ml-6"
              >
                <img
                  src={IMAGES.v60}
                  alt="Single-origin hand pour-over coffee freshly prepared at Venty"
                  className="w-full h-full object-cover filter brightness-[0.98] hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
