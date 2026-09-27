import React, { useState } from 'react';
import { X, MapPin, Copy, Check, ExternalLink, Clock, Phone, Navigation, Heart } from 'lucide-react';
import { VentyLogo } from '../VentyLogo';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const address = 'Soufay, RN14, Khemis Miliana 44003, Algeria';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openGoogleMaps = () => {
    window.open('https://maps.app.goo.gl/4Ay4AKyizQ5KKwoV8', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-[#faf6ef] border border-[#ded7c8] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-[#221a14]"
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
                Find Us · Miliana
              </span>
              <h3 className="font-serif font-bold text-2xl text-[#221a14]">
                VENTY THE COFFEE
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7a6b61] hover:text-[#221a14] hover:bg-[#eee9de] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Address Box */}
          <div className="p-4 bg-white border border-[#ded7c8] flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#c9833a] shrink-0 mt-0.5" />
              <div>
                <p className="font-serif font-semibold text-base text-[#221a14]">
                  Soufay, RN14
                </p>
                <p className="font-sans text-xs text-[#59493f]">
                  Khemis Miliana 44003, Ain Defla Province, Algeria
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={copyToClipboard}
                className="p-2 border border-[#ded7c8] text-[#59493f] hover:bg-[#eee9de] text-xs inline-flex items-center gap-1 cursor-pointer"
                title="Copy Address"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={openGoogleMaps}
                className="bg-[#6b3a1f] text-[#faf6ef] p-2 hover:bg-[#532c17] text-xs inline-flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </button>
            </div>
          </div>

          {/* Contact Numbers */}
          <div className="p-4 bg-[#eee9de] border border-[#ded7c8] space-y-2">
            <div className="flex items-center gap-2 text-[#6b3a1f] font-serif font-semibold text-sm">
              <Phone className="w-4 h-4 text-[#c9833a]" />
              <span>Contact & WhatsApp</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <a
                href="tel:0569055916"
                className="p-2 bg-white border border-[#ded7c8] hover:border-[#6b3a1f] flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="text-[10px] text-[#8a7b70] block">WhatsApp / Primary</span>
                  <strong className="text-[#221a14] font-mono">0569055916</strong>
                </div>
                <span className="text-[#c9833a] font-medium">Call →</span>
              </a>

              <a
                href="tel:0563580833"
                className="p-2 bg-white border border-[#ded7c8] hover:border-[#6b3a1f] flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="text-[10px] text-[#8a7b70] block">Business Contact</span>
                  <strong className="text-[#221a14] font-mono">0563 58 08 33</strong>
                </div>
                <span className="text-[#c9833a] font-medium">Call →</span>
              </a>
            </div>
          </div>

          {/* Opening Hours Schedule */}
          <div className="p-4 bg-white border border-[#ded7c8] space-y-2">
            <div className="flex items-center gap-2 text-[#6b3a1f] font-serif font-bold text-sm">
              <Clock className="w-4 h-4 text-[#c9833a]" />
              <span>Opening Hours (Summertime Schedule)</span>
            </div>

            <div className="divide-y divide-[#ded7c8] text-xs font-sans">
              <div className="py-2 flex justify-between">
                <span className="text-[#59493f] font-medium">See You Daily</span>
                <span className="font-semibold text-[#6b3a1f]">17:00 — 1:00 (5:00 PM – 1:00 AM)</span>
              </div>
              <div className="py-1.5 flex justify-between text-[#8a7b70]">
                <span>Service Schedule</span>
                <span>Specialty Coffee, Fresh Juices & Sweets</span>
              </div>
            </div>
          </div>

          {/* Location & Arrival Notes */}
          <div className="p-3 bg-[#eee9de] border border-[#ded7c8] text-xs text-[#59493f] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#6b3a1f]">
              <Navigation className="w-3.5 h-3.5 text-[#c9833a]" />
              <span>Location Details</span>
            </div>
            <p>
              Conveniently located along RN14 in Soufay, Khemis Miliana. Outdoor seating and terrace area with scenic views.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#ded7c8] bg-[#faf6ef] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#6b3a1f] text-[#faf6ef] px-6 py-2.5 text-xs font-medium hover:bg-[#532c17] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
