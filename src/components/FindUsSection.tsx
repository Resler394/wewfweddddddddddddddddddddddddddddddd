import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Phone, Smartphone, Instagram } from 'lucide-react';

interface FindUsSectionProps {
  onOpenDirections: () => void;
}

export const FindUsSection: React.FC<FindUsSectionProps> = ({ onOpenDirections }) => {
  const [isOpenNow, setIsOpenNow] = useState<boolean>(true);

  useEffect(() => {
    // Check Algeria time: Daily 17:00 to 01:00 (5 PM to 1 AM)
    try {
      const now = new Date();
      const algTimeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Algiers',
        hour12: false,
      });
      const [hourStr] = algTimeStr.split(':');
      const hour = parseInt(hourStr, 10);

      // Open from 17:00 (5pm) until 01:00 (1am)
      const open = hour >= 17 || hour < 1;
      setIsOpenNow(open);
    } catch {
      setIsOpenNow(true);
    }
  }, []);

  return (
    <section id="find-us" className="w-full bg-[#381c10] text-[#faf6ef] py-20 md:py-28 px-6 text-center">
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        {/* Amber Location Icon */}
        <div className="mb-4 text-[#c9833a]">
          <MapPin className="w-7 h-7 mx-auto stroke-[1.75]" />
        </div>

        {/* Live Status indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-6 bg-[#2a140b] border border-[#522917] text-xs font-sans">
          <span
            className={`w-2 h-2 rounded-full ${
              isOpenNow ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-[#df9e59] font-medium tracking-wide">
            {isOpenNow ? 'Open Now in Miliana (17:00 – 1:00)' : 'Opens Today at 17:00 (5:00 PM)'}
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-serif italic font-bold text-4xl sm:text-5xl md:text-6xl text-[#faf6ef] tracking-tight mb-4">
          Come and Say Hello
        </h2>

        {/* Supporting Copy */}
        <p className="font-sans font-light text-base sm:text-lg text-[#eee9de]/90 mb-3 max-w-xl">
          Specialty coffee, fresh juices, sweet moments — see you at Venty.
        </p>

        {/* Hours */}
        <p className="font-sans font-medium text-sm sm:text-base text-[#df9e59] mb-2">
          See you daily: 17:00 — 1:00 <span className="text-[#c9833a] mx-1.5">·</span> (5:00 PM – 1:00 AM)
        </p>

        {/* Address */}
        <p className="font-sans font-light text-sm md:text-base text-[#d1c4b7] mb-8">
          Soufay, RN14, Khemis Miliana 44003, Algeria
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12 w-full sm:w-auto">
          <button
            onClick={onOpenDirections}
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 bg-[#faf6ef] hover:bg-[#eee9de] text-[#381c10] px-7 py-3.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <span>Get directions</span>
            <span className="text-[#c9833a] group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          </button>

          <a
            href="tel:0569055916"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#522917] hover:border-[#df9e59] hover:bg-[#2a140b] text-[#faf6ef] px-7 py-3.5 text-sm font-medium transition-all duration-200"
          >
            <Phone className="w-4 h-4 text-[#c9833a]" />
            <span>Call 0569055916</span>
          </a>
        </div>

        {/* Metadata trust chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-[11px] font-sans font-medium uppercase tracking-[0.14em] text-[#d1c4b7]/70 pt-8 border-t border-[#522917]/70 w-full max-w-lg">
          <a
            href="https://instagram.com/ventythecoffee20"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#df9e59] transition-colors"
          >
            <Instagram className="w-3.5 h-3.5 text-[#c9833a]" />
            @ventythecoffee20
          </a>
          <span className="hidden sm:inline text-[#c9833a]" aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#c9833a]" />
            WhatsApp Orders
          </span>
          <span className="hidden sm:inline text-[#c9833a]" aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#c9833a]" />
            Daily Evening Service
          </span>
        </div>
      </div>
    </section>
  );
};
