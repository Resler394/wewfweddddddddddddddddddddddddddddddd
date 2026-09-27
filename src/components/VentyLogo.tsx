import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { logoImage } from '../data/coffeeData';

const CUSTOM_LOGO_STORAGE_KEY = 'venty_official_logo_asset_v1';

export { logoImage };

export function getOfficialLogoSrc(): string {
  return logoImage;
}

export function useOfficialLogo() {
  useEffect(() => {
    try {
      localStorage.removeItem(CUSTOM_LOGO_STORAGE_KEY);
    } catch {
      // ignore storage access errors
    }
    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = logoImage;
    }
  }, []);

  return {
    logoSrc: logoImage,
  };
}

interface VentyLogoProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
  showWordmark?: boolean;
  wordmarkColor?: string;
}

export const VentyLogo: React.FC<VentyLogoProps> = ({
  className = 'h-9 w-auto',
  imgClassName = 'h-full w-auto object-contain block',
  alt = 'VENTY THE COFFEE Logo',
  showWordmark = false,
  wordmarkColor = '#2c150c',
}) => {
  const { logoSrc } = useOfficialLogo();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={
        prefersReducedMotion
          ? { opacity: 0.9 }
          : { scale: 1.06, opacity: 0.92 }
      }
      whileTap={
        prefersReducedMotion
          ? { opacity: 0.85 }
          : { scale: 0.97 }
      }
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 20,
        mass: 0.6,
      }}
      className={`group relative inline-flex items-center justify-center shrink-0 ${className}`}
    >
      <img
        src={logoSrc}
        alt={alt}
        className={imgClassName}
        draggable={false}
      />

      {showWordmark && (
        <div className="flex flex-col text-left leading-none ml-2.5">
          <span
            className="font-serif italic font-bold tracking-tight text-xl sm:text-2xl"
            style={{ color: wordmarkColor }}
          >
            VENTY
          </span>
          <span className="font-sans uppercase text-[9px] tracking-[0.22em] text-[#8a7b70] font-semibold mt-0.5">
            The Coffee · Miliana
          </span>
        </div>
      )}
    </motion.div>
  );
};
