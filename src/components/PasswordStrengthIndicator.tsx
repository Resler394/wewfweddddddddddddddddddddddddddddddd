import React from 'react';
import { Check } from 'lucide-react';
import { evaluatePasswordStrength } from '../utils/passwordStrength';

interface PasswordStrengthIndicatorProps {
  password: string;
  compact?: boolean;
  theme?: 'light' | 'dark';
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  compact = false,
  theme = 'light',
}) => {
  const strength = evaluatePasswordStrength(password);
  const isDark = theme === 'dark';

  const getSegmentColor = (segmentIndex: 1 | 2 | 3): string => {
    if (strength.score < segmentIndex) {
      return isDark ? 'bg-[#faf6ef]/15' : 'bg-[#e4ddcf]';
    }
    if (strength.level === 'weak') {
      return isDark ? 'bg-[#ef5350]' : 'bg-[#c62828]';
    }
    if (strength.level === 'fair') {
      return isDark ? 'bg-[#e8b878]' : 'bg-[#c9833a]';
    }
    if (strength.level === 'strong') {
      return isDark ? 'bg-[#4caf50]' : 'bg-[#2e7d32]';
    }
    return isDark ? 'bg-[#faf6ef]/15' : 'bg-[#e4ddcf]';
  };

  const getLabelColor = (): string => {
    if (strength.level === 'weak') return isDark ? 'text-[#ff8a80]' : 'text-[#c62828]';
    if (strength.level === 'fair') return isDark ? 'text-[#e8b878]' : 'text-[#b56c22]';
    if (strength.level === 'strong') return isDark ? 'text-[#81c784]' : 'text-[#2e7d32]';
    return isDark ? 'text-[#d8cfc2]/60' : 'text-[#8a7b70]';
  };

  return (
    <div
      className="mt-2 space-y-1.5"
      role="status"
      aria-live="polite"
      aria-label={`Password strength: ${strength.label}`}
    >
      {/* 3 Color-Coded Segments: Weak (1), Fair (2), Strong (3) */}
      <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
        <div
          className={`h-1.5 rounded-full transition-colors duration-200 ${getSegmentColor(1)}`}
          data-segment="weak"
        />
        <div
          className={`h-1.5 rounded-full transition-colors duration-200 ${getSegmentColor(2)}`}
          data-segment="fair"
        />
        <div
          className={`h-1.5 rounded-full transition-colors duration-200 ${getSegmentColor(3)}`}
          data-segment="strong"
        />
      </div>

      {/* Segment Labels + Real-time Status */}
      <div className="flex items-center justify-between gap-2 text-[11px] font-sans">
        <span className={`truncate ${isDark ? 'text-[#d8cfc2]/80' : 'text-[#59493f]'}`}>
          {strength.guidance}
        </span>
        <span className={`font-bold uppercase tracking-wider shrink-0 ${getLabelColor()}`}>
          {strength.level === 'none' ? 'Weak · Fair · Strong' : strength.label}
        </span>
      </div>

      {/* Real-time Requirement Checklist */}
      {!compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
          {[
            { key: 'minLength', label: '8+ chars', met: strength.checks.minLength },
            { key: 'hasMixedCase', label: 'Upper & lower', met: strength.checks.hasMixedCase },
            { key: 'hasNumber', label: 'Number', met: strength.checks.hasNumber },
            { key: 'hasSymbol', label: 'Symbol', met: strength.checks.hasSymbol },
          ].map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-1 text-[10px] font-sans transition-colors ${
                item.met
                  ? isDark
                    ? 'text-[#81c784] font-semibold'
                    : 'text-[#2e7d32] font-semibold'
                  : isDark
                    ? 'text-[#d8cfc2]/50'
                    : 'text-[#8a7b70]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  item.met
                    ? isDark
                      ? 'bg-[#4caf50]/20 text-[#81c784]'
                      : 'bg-[#2e7d32]/15 text-[#2e7d32]'
                    : isDark
                      ? 'bg-[#faf6ef]/5 text-transparent border border-[#faf6ef]/15'
                      : 'bg-[#eee9de] text-transparent border border-[#ded7c8]'
                }`}
              >
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
