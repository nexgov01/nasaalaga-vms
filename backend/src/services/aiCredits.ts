/**
 * Tracks whether the Anthropic account behind ANTHROPIC_API_KEY has run out of credits.
 *
 * Anthropic exposes no balance endpoint for ordinary API keys, so the app learns about it the only
 * reliable way: when a request fails with "credit balance is too low". The flag is held in memory,
 * cleared automatically by the next successful call, and surfaced to staff through
 * GET /ai/credits-status and the `creditsLow` field on AI responses.
 */
export interface AICreditStatus {
  low: boolean;          // true while the last Claude call was rejected for lack of credits
  since: string | null;  // ISO time the problem was first seen
  message: string | null;
}

export const CREDITS_LOW_MESSAGE =
  'AI credits are low or used up. Claude suggestions are paused and standard templates are shown instead. ' +
  'Please ask the system administrator to top up the Anthropic account (console.anthropic.com → Plans & Billing).';

let state: AICreditStatus = { low: false, since: null, message: null };

/** True when an Anthropic error response means the account is out of credits. */
export function isCreditError(status: number, body: any): boolean {
  const msg = String(body?.error?.message || body?.message || '');
  return /credit balance is too low|insufficient (credit|funds)|purchase credits/i.test(msg) || status === 402;
}

export function markCreditsLow(): void {
  if (!state.low) console.warn('⚠ Anthropic credits exhausted — AI features are using rule-based fallbacks.');
  state = { low: true, since: state.since || new Date().toISOString(), message: CREDITS_LOW_MESSAGE };
}

export function markCreditsOk(): void {
  if (state.low) console.log('✓ Anthropic credits available again.');
  state = { low: false, since: null, message: null };
}

export function getCreditStatus(): AICreditStatus { return { ...state }; }

/** Call after any non-OK Anthropic response; returns true if it was a credit problem. */
export function noteAnthropicFailure(status: number, body: any): boolean {
  if (isCreditError(status, body)) { markCreditsLow(); return true; }
  return false;
}

/** Error thrown by services so callers can tell a credit problem from other failures. */
export class AICreditsError extends Error {
  constructor() { super('Anthropic credits exhausted'); this.name = 'AICreditsError'; }
}
