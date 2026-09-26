import type { PetState, MascotStateInputs } from '@/types/pet';

export const COPIED_DURATION_MS = 2500;
export const SPEECH_AUTO_DISMISS_MS = 4000;
export const WARNING_THRESHOLD_SECONDS = 5;

/**
 * Pure deterministic state resolver implementing strict precedence:
 * Precedence 1: EMPTY (accountCount <= 0)
 * Precedence 2: COPIED (isCopiedActive === true)
 * Precedence 3: WARNING (isAnyTotpUrgent === true)
 * Precedence 4: IDLE (default)
 */
export function resolveMascotState({
  accountCount,
  isAnyTotpUrgent,
  isCopiedActive,
}: MascotStateInputs): PetState {
  if (accountCount <= 0) {
    return 'EMPTY';
  }
  if (isCopiedActive) {
    return 'COPIED';
  }
  if (isAnyTotpUrgent) {
    return 'WARNING';
  }
  return 'IDLE';
}

/**
 * Checks if a given remaining second count is considered urgent (<= 5s)
 */
export function isUrgentCountdown(remainingSeconds: number): boolean {
  return remainingSeconds >= 0 && remainingSeconds <= WARNING_THRESHOLD_SECONDS;
}

/**
 * Evaluates whether any TOTP account in the list is currently urgent (remaining <= 5s)
 */
export function evaluateTotpUrgency(
  accounts: { type?: string; period?: number }[],
  timestampSeconds?: number
): boolean {
  const now = timestampSeconds ?? Date.now() / 1000;
  for (const acc of accounts) {
    if (acc.type === 'totp' || !acc.type) {
      const period = acc.period && acc.period > 0 ? acc.period : 30;
      const currentSec = Math.floor(now);
      const elapsedSec = ((currentSec % period) + period) % period;
      const remainingSeconds = period - elapsedSec;
      if (remainingSeconds <= WARNING_THRESHOLD_SECONDS) {
        return true;
      }
    }
  }
  return false;
}
