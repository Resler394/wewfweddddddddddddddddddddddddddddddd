import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';
import { useOfficialLogo } from './VentyLogo';

interface IntroLogoAnimationProps {
  replayTrigger?: number;
  onFinish?: () => void;
}

export const IntroLogoAnimation: React.FC<IntroLogoAnimationProps> = ({
  replayTrigger = 0,
  onFinish,
}) => {
  const { logoSrc } = useOfficialLogo();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const holdDuration = prefersReducedMotion ? 450 : 2000;
    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, holdDuration);

    return () => window.clearTimeout(timer);
  }, [replayTrigger, cycleKey, prefersReducedMotion]);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  const customEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const backdropVariants: Variants = {
    hidden: {
      opacity: 1,
      backdropFilter: 'blur(24px)',
    },
    visible: {
      opacity: 1,
      backdropFilter: 'blur(24px)',
      transition: {
        when: 'beforeChildren',
        staggerChildren: prefersReducedMotion ? 0 : 0.14,
      },
    },
    exit: prefersReducedMotion
      ? {
          opacity: 0,
          backdropFilter: 'blur(0px)',
          transition: { duration: 0.25 },
        }
      : {
          opacity: 0,
          y: '-2%',
          backdropFilter: 'blur(0px)',
          transition: {
            duration: 0.8,
            delay: 0.1,
            ease: customEase,
          },
        },
  };

  const frameVariants: Variants = {
    hidden: { opacity: 0, scale: 0.97 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.9, ease: customEase },
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      transition: { duration: 0.5, ease: customEase },
    },
  };

  const stageVariants: Variants = {
    hidden: { opacity: 1, scale: 1, y: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
    exit: prefersReducedMotion
      ? { opacity: 0, transition: { duration: 0.2 } }
      : {
          opacity: 0,
          scale: 1.06,
          y: -20,
          transition: {
            duration: 0.55,
            ease: [0.4, 0, 0.2, 1],
          },
        },
  };

  const logoMarkVariants: Variants = {
    hidden: prefersReducedMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.72, y: 18 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0.25 }
        : {
            opacity: { duration: 0.65, ease: customEase },
            y: { type: 'spring', stiffness: 120, damping: 18, mass: 0.85 },
            scale: {
              type: 'spring',
              stiffness: 135,
              damping: 15,
              mass: 0.85,
              restDelta: 0.001,
            },
          },
    },
  };

  const wordmarkVariants: Variants = {
    hidden: prefersReducedMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 14, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: prefersReducedMotion
        ? { duration: 0.25 }
        : {
            opacity: { duration: 0.6, delay: 0.22, ease: customEase },
            y: { duration: 0.7, delay: 0.22, ease: customEase },
            scale: {
              type: 'spring',
              stiffness: 150,
              damping: 17,
              mass: 0.8,
              delay: 0.22,
            },
          },
    },
  };

  const ruleVariants: Variants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.65,
        delay: prefersReducedMotion ? 0 : 0.38,
        ease: customEase,
      },
    },
  };

  const subtitleVariants: Variants = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.6,
        delay: prefersReducedMotion ? 0 : 0.48,
        ease: customEase,
      },
    },
  };

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        if (onFinish) onFinish();
      }}
    >
      {isVisible && (
        <motion.div
          key={`intro-splash-${replayTrigger}-${cycleKey}`}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={() => setIsVisible(false)}
          className="fixed inset-0 z-[100] bg-[#faf6ef]/88 backdrop-blur-xl flex flex-col items-center justify-center px-6 select-none cursor-pointer overflow-hidden"
          aria-label="Opening brand intro"
        >
          {/* Subtle architectural border frame */}
          <motion.div
            variants={frameVariants}
            className="absolute inset-4 sm:inset-7 border border-[#ded7c8]/80 pointer-events-none"
          />

          {/* Main Logo + Wordmark Stage */}
          <motion.div
            variants={stageVariants}
            className="relative flex flex-col items-center text-center max-w-md"
          >
            {/* Official Uploaded Logo Asset Slot — Smooth Fade-In & Scale-Up Entrance */}
            <motion.div
              variants={logoMarkVariants}
              className="h-24 sm:h-28 md:h-32 w-auto max-w-[240px] flex items-center justify-center mb-6"
            >
              <img
                src={logoSrc}
                alt="VENTY THE COFFEE Official Logo"
                className="h-full w-auto max-h-24 sm:max-h-28 md:max-h-32 max-w-[240px] object-contain block"
                draggable={false}
              />
            </motion.div>

            {/* Brand Wordmark & Subtitle */}
            <motion.div
              variants={wordmarkVariants}
              className="flex flex-col items-center"
            >
              <span className="font-serif italic font-bold text-3xl sm:text-4xl tracking-tight text-[#381c10] leading-none">
                VENTY
              </span>

              {/* Expanding Caramel Rule */}
              <motion.div
                variants={ruleVariants}
                className="w-14 h-[1.5px] bg-[#c9833a] my-3.5 origin-center"
              />

              <motion.span
                variants={subtitleVariants}
                className="font-sans uppercase text-[10px] sm:text-[11px] tracking-[0.26em] text-[#8a7b70] font-semibold"
              >
                The Coffee · Miliana
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
