import React, { useState } from 'react';
import { Instagram, MapPin, Phone, Volume2, VolumeX } from 'lucide-react';
import { cafeAudio } from '../utils/audioAmbience';
import { VentyLogo } from './VentyLogo';

interface FooterProps {
  onOpenDirections: () => void;
  onOpenLoyalty?: () => void;
  onOpenHistory?: () => void;
  onOpenManagement?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDirections,
  onOpenLoyalty,
  onOpenHistory,
  onOpenManagement,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleSound = () => {
    const active = cafeAudio.toggle();
    setIsPlayingAudio(active);
  };

  return (
    <footer className="w-full bg-[#200f07] border-t border-[#3c1d10] py-10 px-6 md:px-10 text-[#faf6ef]">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Wordmark & Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <VentyLogo
                className="h-9 w-auto max-w-[140px]"
                imgClassName="h-full w-auto max-h-9 max-w-[140px] object-contain block"
              />
              <span className="font-serif italic font-bold text-2xl text-[#c9833a] tracking-tight">
                VENTY THE COFFEE
              </span>
            </div>

            {/* Tasteful Ambient Cafe Sound Toggle */}
            <button
              onClick={toggleSound}
              title={isPlayingAudio ? 'Mute café vinyl ambience' : 'Play soft café vinyl ambience'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-sans rounded-none border border-[#482819] bg-[#2a140b] text-[#df9e59] hover:border-[#c9833a] transition-all cursor-pointer"
            >
              {isPlayingAudio ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-pulse text-[#c9833a]" />
                  <span>Ambience On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#8a7b70]" />
                  <span className="text-[#8a7b70]">Café Sound</span>
                </>
              )}
            </button>
          </div>

          {/* Social & Contact Actions */}
          <div className="flex items-center gap-5 text-xs font-sans text-[#df9e59]">
            <a
              href="https://instagram.com/ventythecoffee20"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="VENTY on Instagram @ventythecoffee20"
              className="inline-flex items-center gap-1.5 hover:text-[#faf6ef] transition-colors p-1"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </a>
            <a
              href="https://wa.me/213569055916"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Venty 0569055916"
              className="inline-flex items-center gap-1.5 hover:text-[#faf6ef] transition-colors p-1"
            >
              <Phone className="w-4 h-4" />
              <span>Contact</span>
            </a>
            <button
              onClick={onOpenDirections}
              aria-label="View Map & Directions"
              className="inline-flex items-center gap-1.5 hover:text-[#faf6ef] transition-colors p-1 cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Location</span>
            </button>
          </div>

          {/* Legal & Customer Links */}
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-xs text-[#b8a698] text-center md:text-right">
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="text-[#df9e59] hover:text-[#faf6ef] underline underline-offset-4 decoration-[#c9833a] cursor-pointer"
              >
                Order History & Tracking
              </button>
            )}
            {onOpenLoyalty && (
              <button
                onClick={onOpenLoyalty}
                className="text-[#df9e59] hover:text-[#faf6ef] underline underline-offset-4 decoration-[#c9833a] cursor-pointer"
              >
                Digital Stamp Card (8th On Us)
              </button>
            )}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#faf6ef] transition-colors"
            >
              Google Terms
            </a>
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#faf6ef] transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>

        {/* Bottom Bar: Discreet Management Section & Copyright */}
        <div className="border-t border-[#3c1d10]/70 pt-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#b8a698]">
          <div aria-label="Management" className="flex flex-col items-center md:items-start gap-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8a7b70]">
              Management
            </span>
            <a
              href="/management"
              onClick={(e) => {
                e.preventDefault();
                if (onOpenManagement) {
                  onOpenManagement();
                } else if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/management');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="text-xs font-sans text-[#b8a698] hover:text-[#faf6ef] underline-offset-4 hover:underline transition-colors cursor-pointer"
            >
              Staff / Admin Login
            </a>
          </div>

          <p className="font-sans text-center md:text-right">
            © 2026 VENTY THE COFFEE <span className="text-[#c9833a] mx-1">·</span> Soufay, RN14, Khemis Miliana 44003, Algeria
          </p>
        </div>
      </div>
    </footer>
  );
};
