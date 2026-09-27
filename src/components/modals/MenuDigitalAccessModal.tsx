import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Copy, Check, Download, Smartphone, Sparkles, Coffee } from 'lucide-react';
import { VentyLogo } from '../VentyLogo';

interface MenuDigitalAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuDigitalAccessModal: React.FC<MenuDigitalAccessModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [menuUrl, setMenuUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}#menu`;
      setMenuUrl(url);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById('venty-menu-qrcode');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#faf6ee';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 500, 500);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'venty-digital-menu-qr.png';
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#faf6ef] border border-[#ded7c8] shadow-2xl overflow-hidden text-[#221a14] rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#ded7c8] flex items-center justify-between bg-[#faf6ef]">
          <div className="flex items-center gap-3">
            <VentyLogo
              className="h-9 w-auto max-w-[130px]"
              imgClassName="h-full w-auto max-h-9 max-w-[130px] object-contain block"
            />
            <div>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8a7b70] font-semibold block">
                In-Shop Digital Access · Miliana
              </span>
              <h3 className="font-serif font-bold text-2xl text-[#2d1217]">
                Scan Digital Menu
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#7a6b61] hover:text-[#221a14] hover:bg-[#eee9de] rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col items-center text-center space-y-5">
          {/* Subtle Tagline */}
          <div className="flex items-center gap-1.5 text-xs text-[#6b3a1f] font-medium bg-[#c9833a]/15 px-3 py-1 rounded-full border border-[#c9833a]/30">
            <Smartphone className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>Instant Mobile Menu & Takeaway Ordering</span>
          </div>

          {/* QR Code Presentation Card */}
          <div className="relative group bg-[#faf6ee] p-6 rounded-2xl border-2 border-[#c9833a]/40 shadow-lg flex flex-col items-center">
            {/* Elegant Corner Accents */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#c9833a]" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#c9833a]" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#c9833a]" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#c9833a]" />

            <div className="bg-white p-4 rounded-xl shadow-inner border border-[#ded5c3]">
              <QRCodeSVG
                id="venty-menu-qrcode"
                value={menuUrl || 'https://venty.dz#menu'}
                size={220}
                bgColor="#ffffff"
                fgColor="#351016"
                level="Q"
                marginSize={1}
              />
            </div>

            <div className="mt-3 text-center">
              <span className="font-serif italic font-bold text-sm text-[#351016]">
                VENTY THE COFFEE
              </span>
              <p className="font-sans text-[10px] uppercase tracking-widest text-[#8a7b70] font-medium">
                Miliana, Algeria
              </p>
            </div>
          </div>

          {/* Instruction Details */}
          <p className="font-sans text-xs sm:text-sm text-[#59493f] max-w-sm leading-relaxed">
            Point your phone's camera at this QR code to view the live digital menu, dietary indicators, seasonal specials, and order takeaway directly from your table.
          </p>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-[#f4ede0] hover:bg-[#ebdcc8] text-[#351016] border border-[#ded5c3] px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#2e7d32]" />
                  <span className="text-[#2e7d32]">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#c9833a]" />
                  <span>Copy Menu Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadQR}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-[#351016] hover:bg-[#c9833a] text-[#faf6ee] px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download QR Card</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#ded7c8] bg-[#f6f1e6] flex items-center justify-between text-xs text-[#736055]">
          <span className="flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>Table Stand / Counter Digital Access</span>
          </span>
          <button
            onClick={onClose}
            className="font-medium text-[#351016] hover:underline cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
