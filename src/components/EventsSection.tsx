import React from 'react';
import { motion } from 'motion/react';

interface EventsSectionProps {
  onOpenEnquiry: () => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({ onOpenEnquiry }) => {
  return (
    <section className="w-full bg-[#faf6ef] py-20 md:py-28 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#eee9de] p-10 sm:p-14 md:p-16 text-center border border-[#ded7c8]/60 shadow-[0_2px_12px_rgba(43,29,22,0.03)]"
        >
          {/* Label */}
          <p className="font-sans font-medium uppercase text-[10px] tracking-[0.16em] text-[#8a7b70] mb-3">
            Atmosphere & Gatherings
          </p>

          {/* Heading */}
          <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-5xl text-[#221a14] tracking-tight mb-2">
            Enjoy the Space
          </h2>

          {/* Amber Underline Rule */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-12 h-[2px] bg-[#c9833a]"
            />
          </div>

          {/* Description */}
          <p className="font-sans font-light text-sm md:text-base text-[#59493f] max-w-xl mx-auto leading-relaxed mb-8">
            Whether you're planning a casual evening gathering, a birthday celebration with friends, or a relaxed get-together, enjoy the warm aesthetic and cozy atmosphere of Venty.
          </p>

          {/* Option Chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <span className="font-sans text-xs font-medium text-[#6b3a1f] border border-[#ded7c8] bg-[#faf6ef] px-4 py-1.5 shadow-2xs">
              Social Gatherings
            </span>
            <span className="font-sans text-xs font-medium text-[#6b3a1f] border border-[#ded7c8] bg-[#faf6ef] px-4 py-1.5 shadow-2xs">
              Evening Meetups
            </span>
            <span className="font-sans text-xs font-medium text-[#6b3a1f] border border-[#ded7c8] bg-[#faf6ef] px-4 py-1.5 shadow-2xs">
              Sweets & Coffee Tables
            </span>
          </div>

          {/* Button */}
          <div>
            <button
              onClick={onOpenEnquiry}
              className="group inline-flex items-center gap-2 bg-[#6b3a1f] hover:bg-[#532c17] text-[#faf6ef] px-7 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
            >
              <span>Enquire for gatherings</span>
              <span className="text-[#c9833a] group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
