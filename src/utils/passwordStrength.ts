export type PasswordStrengthLevel = 'none' | 'weak' | 'fair' | 'strong';

export interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  score: 0 | 1 | 2 | 3;
  label: string;
  guidance: string;
  checks: {
    minLength: boolean;
    hasMixedCase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

/**
 * Evaluates password strength in real time across 3 levels:
 * - weak (score 1)
 * - fair (score 2)
 * - strong (score 3)
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasMixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  if (!password || password.length === 0) {
    return {
      level: 'none',
      score: 0,
      label: 'Enter a password',
      guidance: 'Use 8+ characters with letters, numbers, or symbols.',
      checks,
    };
  }

  const hasAnyLetter = /[a-zA-Z]/.test(password);
  const varietyCount = [
    hasAnyLetter,
    checks.hasMixedCase,
    checks.hasNumber,
    checks.hasSymbol,
  ].filter(Boolean).length;

  // Weak: shorter than 8 characters, or lacks character diversity
  if (!checks.minLength || varietyCount <= 1) {
    return {
      level: 'weak',
      score: 1,
      label: 'Weak',
      guidance: !checks.minLength
        ? `Add ${8 - password.length} more character${8 - password.length === 1 ? '' : 's'} (min. 8)`
        : 'Add numbers, uppercase letters, or symbols',
      checks,
    };
  }

  // Strong: at least 8 chars + strong variety (mixed case + number/symbol, or 10+ chars with 3+ traits)
  const isStrong =
    (password.length >= 10 && varietyCount >= 3) ||
    (checks.minLength && checks.hasMixedCase && checks.hasNumber && checks.hasSymbol) ||
    (password.length >= 12 && varietyCount >= 2);

  if (isStrong) {
    return {
      level: 'strong',
      score: 3,
      label: 'Strong',
      guidance: 'Great password security for your VENTY account.',
      checks,
    };
  }

  // Fair: meets minimum length and has at least 2 character traits
  return {
    level: 'fair',
    score: 2,
    label: 'Fair',
    guidance: !checks.hasMixedCase
      ? 'Add uppercase & lowercase letters to make it strong'
      : !checks.hasNumber && !checks.hasSymbol
        ? 'Add a number or symbol to make it strong'
        : 'Add a symbol or a few more characters for strong security',
    checks,
  };
}
