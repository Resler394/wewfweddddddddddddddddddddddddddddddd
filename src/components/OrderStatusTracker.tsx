import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Coffee, CheckCircle2, PackageCheck } from 'lucide-react';
import { OrderStatus } from '../types/coffee';

interface OrderStatusTrackerProps {
  status: OrderStatus;
  pickupTime?: string;
  orderId?: string;
  compact?: boolean;
}

const STEPS: { key: OrderStatus; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  {
    key: 'Pending',
    label: 'Order Received',
    desc: 'Ticket Logged',
    icon: Clock,
  },
  {
    key: 'Preparing',
    label: 'Preparing',
    desc: 'Handcrafting',
    icon: Coffee,
  },
  {
    key: 'Ready',
    label: 'Ready',
    desc: 'At Counter',
    icon: CheckCircle2,
  },
  {
    key: 'Completed',
    label: 'Completed',
    desc: 'Served',
    icon: PackageCheck,
  },
];

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  status,
  pickupTime,
  orderId,
  compact = false,
}) => {
  const upperStatus = String(status || 'PENDING').toUpperCase();
  const getStepIndex = (): number => {
    if (upperStatus === 'PENDING') return 0;
    if (upperStatus === 'CONFIRMED' || upperStatus === 'PREPARING') return 1;
    if (upperStatus === 'READY') return 2;
    if (upperStatus === 'COMPLETED') return 3;
    return 0;
  };

  const currentIndex = getStepIndex();
  const isCompleted = upperStatus === 'COMPLETED';
  const isCancelled = upperStatus === 'CANCELLED';

  return (
    <div className={`w-full bg-[#f6f1e6] border border-[#dfd4c5] p-4 sm:p-5 rounded-xl ${compact ? 'text-xs' : ''}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#dfd4c5]/60">
        <div>
          <span className="font-sans uppercase text-[10px] tracking-wider text-[#8a7b70] font-semibold block">
            Live Order Status
          </span>
          {orderId && (
            <span className="font-serif font-bold text-base sm:text-lg text-[#2d1217]">
              #{orderId}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {upperStatus === 'PENDING' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#c9833a]/15 text-[#8a531e] border border-[#c9833a]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9833a] animate-ping" />
              PENDING
            </span>
          )}
          {(upperStatus === 'CONFIRMED' || upperStatus === 'PREPARING') && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#351016]/10 text-[#351016] border border-[#351016]/25">
              <Coffee className="w-3.5 h-3.5 animate-bounce text-[#c9833a]" />
              {upperStatus}
            </span>
          )}
          {upperStatus === 'READY' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2e7d32]/15 text-[#2e7d32] border border-[#2e7d32]/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2e7d32]" />
              READY
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2e7d32]/15 text-[#2e7d32] border border-[#2e7d32]/30">
              <PackageCheck className="w-3.5 h-3.5 text-[#2e7d32]" />
              COMPLETED
            </span>
          )}
          {isCancelled && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
              CANCELLED
            </span>
          )}
        </div>
      </div>

      {/* Progress Timeline Stepper */}
      <div className="relative my-3">
        {/* Background Track */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#ded5c3] -translate-y-1/2 z-0" />
        
        {/* Active Progress Fill */}
        <motion.div
          className="absolute top-4 left-6 h-0.5 bg-[#351016] -translate-y-1/2 z-0"
          initial={{ width: '0%' }}
          animate={{
            width: isCancelled
              ? '0%'
              : currentIndex === 0
              ? '0%'
              : currentIndex === 1
              ? '33%'
              : currentIndex === 2
              ? '66%'
              : '100%',
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        <div className="relative z-10 grid grid-cols-4 gap-1.5 sm:gap-2">
          {STEPS.map((step, idx) => {
            const isDone = !isCancelled && (currentIndex > idx || isCompleted || (idx === 0 && currentIndex >= 0));
            const isCurrent = !isCancelled && currentIndex === idx && !isCompleted;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted || currentIndex > idx
                      ? 'bg-[#351016] text-[#faf6ee] shadow-sm'
                      : isCurrent
                      ? 'bg-[#c9833a] text-white ring-4 ring-[#c9833a]/20 shadow-md scale-105'
                      : 'bg-[#ede4d4] text-[#8a7b70] border border-[#ded5c3]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <span
                  className={`mt-2 font-sans font-semibold text-[10px] sm:text-xs leading-tight ${
                    isCurrent
                      ? 'text-[#351016] font-bold'
                      : isDone
                      ? 'text-[#351016]'
                      : 'text-[#8a7b70]'
                  }`}
                >
                  {step.label} {isDone ? '✓' : ''}
                </span>

                {!compact && (
                  <span className="font-sans text-[10px] text-[#614f44] mt-0.5 hidden sm:block">
                    {step.desc}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pickup Estimator Footer */}
      {pickupTime && (
        <div className="mt-4 pt-3 border-t border-[#dfd4c5]/60 flex items-center justify-between text-xs font-sans text-[#614f44]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>Estimated pickup time:</span>
          </span>
          <span className="font-semibold text-[#351016]">{pickupTime}</span>
        </div>
      )}
    </div>
  );
};
