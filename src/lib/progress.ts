/**
 * Returns a CSS class name that sets `width: N%` in whole-percent steps.
 * Clamps input to [0, 100] so over-quota values still render at 100% fill.
 * Paired with the .progress-w-N rules in src/app/globals.css so progress
 * bars can be driven without inline style attributes (CSP style-src hardening).
 */
export function progressWidthClass(pct: number): string {
  if (Number.isNaN(pct)) return "progress-w-0";
  const clamped = Math.max(0, Math.min(100, pct));
  return `progress-w-${Math.round(clamped)}`;
}
