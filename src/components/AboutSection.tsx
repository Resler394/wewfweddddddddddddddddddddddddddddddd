import React from 'react';
import { motion } from 'motion/react';
import { IMAGES } from '../data/coffeeData';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="w-full bg-[#faf6ef] py-20 md:py-28 px-6 md:px-10 border-t border-[#ded7c8]/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Text Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="font-sans font-medium uppercase text-[10px] tracking-[0.16em] text-[#8a7b70] mb-2">
              The Venty Story
            </p>
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#221a14] tracking-tight leading-[1.12] mb-6">
              A Space Made for{' '}
              <span className="italic text-[#c9833a] font-serif">Good Moments</span>
            </h2>

            {/* Paragraphs */}
            <div className="space-y-4 font-sans font-light text-sm md:text-base text-[#59493f] leading-relaxed mb-8">
              <p>
                Venty was created to bring contemporary specialty coffee culture, fresh artisanal juices, and signature sweets together in Miliana. A welcoming, relaxed destination designed for genuine enjoyment.
              </p>
              <p>
                From late afternoon through the night, our space is open for conversation, celebration, and relaxation. Whether you are ordering a single-origin espresso, a cool citrus refresher, or our signature Oreo cheesecake, every detail is made with passion.
              </p>
            </div>

            {/* Amber Chips */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-sans text-[11px] font-medium tracking-wide text-[#6b3a1f] border border-[#c9833a]/40 bg-[#eee9de]/60 px-3 py-1">
                Specialty Coffee
              </span>
              <span className="font-sans text-[11px] font-medium tracking-wide text-[#6b3a1f] border border-[#c9833a]/40 bg-[#eee9de]/60 px-3 py-1">
                Juice & Sweets
              </span>
              <span className="font-sans text-[11px] font-medium tracking-wide text-[#6b3a1f] border border-[#c9833a]/40 bg-[#eee9de]/60 px-3 py-1">
                Miliana, Algeria
              </span>
            </div>
          </div>

          {/* Right Column: Cafe / Barista Image (5 cols) */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[4/5] w-full overflow-hidden shadow-sm bg-[#eee9de]"
            >
              <img
                src={IMAGES.barista}
                alt="Barista preparing specialty coffee at Venty The Coffee in Miliana"
                className="w-full h-full object-cover filter brightness-[0.98] contrast-[1.02]"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
