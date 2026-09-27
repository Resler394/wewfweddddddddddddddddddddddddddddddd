import React from 'react';
import { motion } from 'motion/react';
import { IMAGES } from '../data/coffeeData';

interface HeroProps {
  onOpenMenu: () => void;
  onScrollToFindUs: () => void;
  onOpenLoyalty?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenMenu,
  onScrollToFindUs,
  onOpenLoyalty,
}) => {
  return (
    <section className="relative w-full bg-[#faf6ef] overflow-hidden pt-20">
      {/* Full-bleed cafe photo banner (68% viewport height) */}
      <div className="relative w-full h-[62vh] md:h-[68vh] min-h-[440px] max-h-[720px] overflow-hidden">
        <img
          src={IMAGES.hero}
          alt="Warm artisanal specialty coffee shop interior at Venty The Coffee in Miliana"
          className="w-full h-full object-cover object-center filter brightness-[0.96] contrast-[1.03]"
          loading="eager"
          referrerPolicy="no-referrer"
        />

        {/* Gradient bottom fade into warm cream background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(250,246,239,1) 0%, rgba(250,246,239,0.85) 18%, rgba(250,246,239,0.3) 38%, transparent 60%)',
          }}
        />
      </div>

      {/* Hero Content below image in page flow */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center -mt-20 md:-mt-28 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Subheader / location kicker */}
          <p className="font-sans font-medium uppercase text-[10px] tracking-[0.16em] text-[#7a6b61] mb-4 md:mb-5">
            Specialty Coffee · Juice & Sweets · Miliana, Algeria
          </p>

          {/* Main Headline */}
          <h1
            className="font-serif font-bold text-[#221a14] tracking-tight leading-[1.05] mb-5 md:mb-6 text-center"
            style={{ fontSize: 'clamp(46px, 6.8vw, 102px)' }}
          >
            <span>Specialty Coffee.</span>
            <br />
            <span>Juice & Sweets.</span>
            <br />
            <span className="font-serif italic text-[#c9833a] font-bold">
              Good Moments.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-sans font-light text-base md:text-lg lg:text-xl text-[#59493f] max-w-2xl mx-auto leading-relaxed mb-8 md:mb-10 text-balance">
            Specialty coffee, refreshing juices, and sweet moments made for your day.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10 w-full sm:w-auto">
            <button
              onClick={onOpenMenu}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#6b3a1f] hover:bg-[#532c17] text-[#faf6ef] px-7 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer group"
            >
              <span>Explore what's on</span>
              <span className="text-[#c9833a] group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </button>

            <button
              onClick={onScrollToFindUs}
              className="w-full sm:w-auto inline-flex items-center justify-center border border-[#ded7c8] hover:border-[#6b3a1f] hover:bg-[#eee9de]/60 text-[#221a14] px-7 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              Find us in Miliana
            </button>
          </div>

          {/* Trust Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[10px] md:text-[11px] font-sans font-medium uppercase tracking-[0.14em] text-[#8a7b70]">
            <span>Specialty Coffee</span>
            <span className="text-[#c9833a]" aria-hidden="true">·</span>
            <span>Fresh Juices</span>
            <span className="text-[#c9833a]" aria-hidden="true">·</span>
            <span>Artisanal Sweets</span>
            <span className="text-[#c9833a]" aria-hidden="true">·</span>
            <span>Daily 17:00 – 1:00</span>
            {onOpenLoyalty && (
              <>
                <span className="text-[#c9833a]" aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onOpenLoyalty}
                  className="hover:text-[#6b3a1f] underline decoration-[#c9833a] underline-offset-2 transition-colors cursor-pointer text-[#6b3a1f] font-semibold"
                >
                  Digital Stamp Card (8th Free)
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
